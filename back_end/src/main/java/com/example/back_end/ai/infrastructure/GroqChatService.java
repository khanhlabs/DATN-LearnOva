package com.example.back_end.ai.infrastructure;
import com.example.back_end.commerce.domain.Cart;
import com.example.back_end.course.application.CourseService;
import com.example.back_end.instructor.application.PublicInstructorService;

import com.example.back_end.ai.adapter.in.web.dto.ChatMessageDto;
import com.example.back_end.course.adapter.in.web.dto.CategoryOptionResponse;
import com.example.back_end.course.adapter.in.web.dto.PublicCourseResponse;
import com.example.back_end.instructor.adapter.in.web.dto.PublicInstructorResponse;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.admin.application.AdminCategoryService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class GroqChatService {

    private static final Logger log = LoggerFactory.getLogger(GroqChatService.class);

    private static final int RATE_LIMIT_MAX_MESSAGES = 30;
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(5);
    private static final int MAX_COURSES_IN_CONTEXT = 30;
    private static final int MAX_INSTRUCTORS_IN_CONTEXT = 20;
    private static final int REPEAT_HISTORY_SIZE = 5;
    private static final int REPEAT_THRESHOLD = 3;

    private final CourseService courseService;
    private final PublicInstructorService publicInstructorService;
    private final AdminCategoryService adminCategoryService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Map<String, Deque<Instant>> requestHistoryByIp = new ConcurrentHashMap<>();
    private final Map<String, Deque<String>> recentMessagesByIp = new ConcurrentHashMap<>();

    @Value("${groq.api-key}")
    private String apiKey;

    @Value("${groq.model}")
    private String model;

    public String chat(List<ChatMessageDto> messages, String clientIp) {
        if (messages == null || messages.isEmpty()) {
            throw new BusinessException("Tin nhắn không được để trống");
        }

        enforceRateLimit(clientIp);
        enforceRepeatGuard(clientIp, messages.get(messages.size() - 1).text());

        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("Chatbot AI chưa được cấu hình. Vui lòng thử lại sau.");
        }

        String systemInstruction = buildSystemInstruction();

        try {
            String requestBody = buildRequestBody(systemInstruction, messages, false);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Groq chat request failed: status={}, model={}", response.statusCode(), model);
                throw new BusinessException(
                        "Không thể kết nối tới trợ lý AI lúc này. Vui lòng thử lại sau.");
            }

            return extractReply(response.body());

        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new BusinessException(
                    "Không thể kết nối tới trợ lý AI lúc này. Vui lòng thử lại sau.");
        }
    }

    // Streaming variant: validates/rate-limits synchronously (so those errors still
    // surface as a normal JSON error response via GlobalExceptionHandler), then hands
    // off the actual Groq call to a virtual thread that pushes each token to the
    // client as it arrives instead of waiting for the full reply.
    public SseEmitter streamChat(List<ChatMessageDto> messages, String clientIp) {
        if (messages == null || messages.isEmpty()) {
            throw new BusinessException("Tin nhắn không được để trống");
        }

        enforceRateLimit(clientIp);
        enforceRepeatGuard(clientIp, messages.get(messages.size() - 1).text());

        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("Chatbot AI chưa được cấu hình. Vui lòng thử lại sau.");
        }

        String systemInstruction = buildSystemInstruction();
        SseEmitter emitter = new SseEmitter(60_000L);

        Thread.ofVirtual().start(() -> runGroqStream(emitter, systemInstruction, messages));

        return emitter;
    }

    private void runGroqStream(SseEmitter emitter, String systemInstruction, List<ChatMessageDto> messages) {
        try {
            String requestBody = buildRequestBody(systemInstruction, messages, true);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<Stream<String>> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofLines());

            if (response.statusCode() != 200) {
                log.error("Groq streaming request failed: status={}, model={}", response.statusCode(), model);
                emitter.send(SseEmitter.event().name("error")
                        .data("Không thể kết nối tới trợ lý AI lúc này. Vui lòng thử lại sau."));
                emitter.complete();
                return;
            }

            boolean gotAnyContent = false;

            try (Stream<String> lines = response.body()) {
                for (String line : (Iterable<String>) lines::iterator) {
                    if (!line.startsWith("data:")) {
                        continue;
                    }

                    String data = line.substring(5).trim();

                    if (data.equals("[DONE]")) {
                        break;
                    }
                    if (data.isEmpty()) {
                        continue;
                    }

                    JsonNode root = objectMapper.readTree(data);
                    JsonNode contentNode = root.path("choices").path(0).path("delta").path("content");

                    if (!contentNode.isMissingNode() && !contentNode.isNull() && !contentNode.asText().isEmpty()) {
                        gotAnyContent = true;
                        emitter.send(SseEmitter.event().name("chunk").data(contentNode.asText()));
                    }
                }
            }

            if (!gotAnyContent) {
                emitter.send(SseEmitter.event().name("error")
                        .data("Trợ lý AI hiện không thể trả lời câu hỏi này. Vui lòng thử lại."));
            }

            emitter.send(SseEmitter.event().name("done").data(""));
            emitter.complete();

        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            try {
                emitter.send(SseEmitter.event().name("error")
                        .data("Không thể kết nối tới trợ lý AI lúc này. Vui lòng thử lại sau."));
            } catch (IOException ignored) {
                // client đã ngắt kết nối, không gửi được nữa — bỏ qua
            }
            emitter.completeWithError(e);
        }
    }

    private void enforceRateLimit(String clientIp) {
        String key = clientIp == null ? "unknown" : clientIp;
        Deque<Instant> history = requestHistoryByIp.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (history) {
            Instant cutoff = Instant.now().minus(RATE_LIMIT_WINDOW);
            while (!history.isEmpty() && history.peekFirst().isBefore(cutoff)) {
                history.pollFirst();
            }

            if (history.size() >= RATE_LIMIT_MAX_MESSAGES) {
                throw new BusinessException(
                        "Bạn gửi tin nhắn hơi nhanh, vui lòng thử lại sau ít phút nhé.");
            }

            history.addLast(Instant.now());
        }
    }

    private void enforceRepeatGuard(String clientIp, String latestMessage) {
        String key = clientIp == null ? "unknown" : clientIp;
        String normalized = latestMessage == null ? "" : latestMessage.trim().toLowerCase();

        if (normalized.isBlank()) {
            return;
        }

        Deque<String> recent = recentMessagesByIp.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (recent) {
            long repeatCount = recent.stream().filter(normalized::equals).count();

            if (repeatCount >= REPEAT_THRESHOLD - 1) {
                throw new BusinessException(
                        "Bạn đang gửi lặp lại cùng một câu hỏi, hãy thử hỏi câu khác bạn nhé.");
            }

            recent.addLast(normalized);
            while (recent.size() > REPEAT_HISTORY_SIZE) {
                recent.pollFirst();
            }
        }
    }

    private String buildSystemInstruction() {
        List<PublicCourseResponse> courses = courseService.getPublishedCourses();
        List<PublicInstructorResponse> instructors = publicInstructorService.getPublicInstructors();
        List<CategoryOptionResponse> categories = adminCategoryService.getActiveCategories();

        StringBuilder courseCatalog = new StringBuilder();
        courses.stream()
                .limit(MAX_COURSES_IN_CONTEXT)
                .forEach(course -> courseCatalog
                        .append("- ")
                        .append(course.title())
                        .append(" (giảng viên: ")
                        .append(course.instructorName())
                        .append(", danh mục: ")
                        .append(course.categoryName() != null ? course.categoryName() : "Khác")
                        .append(", giá: ")
                        .append(course.basePrice())
                        .append("đ, đánh giá: ")
                        .append(course.avgRating())
                        .append("/5 - ")
                        .append(course.ratingCount())
                        .append(" lượt)\n"));

        StringBuilder instructorCatalog = new StringBuilder();
        instructors.stream()
                .limit(MAX_INSTRUCTORS_IN_CONTEXT)
                .forEach(instructor -> instructorCatalog
                        .append("- ")
                        .append(instructor.fullName())
                        .append(instructor.headline() != null ? " (" + instructor.headline() + ")" : "")
                        .append(": ")
                        .append(instructor.courseCount())
                        .append(" khóa học, ")
                        .append(instructor.studentCount())
                        .append(" học viên, đánh giá ")
                        .append(instructor.rating())
                        .append("/5\n"));

        StringBuilder categoryList = new StringBuilder();
        categories.forEach(category -> categoryList.append("- ").append(category.name()).append("\n"));

        return "Bạn là trợ lý AI của nền tảng học trực tuyến LearnOva (giống Udemy), "
                + "hỗ trợ người dùng về mọi mặt của nền tảng: tư vấn khóa học/lộ trình học, giới thiệu giảng viên, "
                + "hướng dẫn cách sử dụng các tính năng của web. "
                + "Chỉ được nhắc tới khóa học/giảng viên/danh mục có trong danh sách dưới đây, không bịa ra thứ không tồn tại. "
                + "Nếu không chắc hoặc không có thông tin để trả lời chính xác, hãy nói thẳng là chưa có thông tin và đề nghị người dùng liên hệ bộ phận hỗ trợ, "
                + "có thể liên hệ số 0867884965 hoặc email nguyenphithong167@gmail.com. "
                + "tuyệt đối không tự bịa ra chính sách/quy trình không có thật. "
                + "Trả lời bằng tiếng Việt trừ khi người dùng hỏi bằng ngôn ngữ khác. Trả lời ngắn gọn, dễ hiểu.\n\n"

                + "=== CÁC TÍNH NĂNG THẬT SỰ CÓ TRÊN LEARNOVA ===\n"
                + "- Đăng ký tài khoản: bằng email/mật khẩu (cần xác minh email), hoặc đăng nhập nhanh bằng Google/Facebook.\n"
                + "- Tìm khóa học: theo danh mục, tìm kiếm, xem trang chi tiết khóa học (mô tả, nội dung bài học, giảng viên, đánh giá).\n"
                + "- Yêu thích khóa học (wishlist): bấm biểu tượng trái tim trên khóa học để lưu vào mục \"Favorite Courses\" trong trang cá nhân, xem lại sau.\n"
                + "- Theo dõi giảng viên (follow): vào trang chi tiết giảng viên, bấm nút Follow để theo dõi, nhận thông báo khi có cập nhật.\n"
                + "- Đánh giá (review): học viên đã học có thể đánh giá sao và viết nhận xét cho khóa học.\n"
                + "- Trang \"My Learning\": nơi xem các khóa học đã sở hữu, theo dõi tiến độ học.\n"
                + "- Thông báo: có chuông thông báo trên header, báo khi có người theo dõi giảng viên, khóa học được duyệt, v.v.\n\n"

                + "=== CÁCH MUA KHÓA HỌC & THANH TOÁN ===\n"
                + "- Vào trang chi tiết khóa học, bấm \"Buy Now\" (mua ngay) hoặc \"Add to Cart\" (thêm vào giỏ) rồi vào giỏ hàng để thanh toán nhiều khóa cùng lúc.\n"
                + "- Có thể nhập mã voucher giảm giá trước khi thanh toán nếu có.\n"
                + "- Hệ thống sẽ hiện mã QR (VietQR qua PayOS) kèm đúng số tiền cần chuyển (đã quy đổi ra VNĐ).\n"
                + "- Dùng app ngân hàng quét mã QR và chuyển khoản đúng số tiền hiển thị, trong vòng 15 phút (mã QR sẽ hết hạn sau đó).\n"
                + "- Sau khi chuyển khoản thành công, hệ thống tự động nhận diện và mở khóa khóa học trong vài giây — không cần làm gì thêm, không cần bấm xác nhận thủ công.\n"
                + "- Khóa học sẽ xuất hiện ngay trong mục \"My Learning\" / \"My Courses\" sau khi thanh toán xong.\n"
                + "- Nếu đóng cửa sổ QR mà chưa thanh toán, khóa học vẫn còn nguyên trong giỏ hàng, có thể quay lại thanh toán sau.\n"
                + "- Nếu khóa học miễn phí hoặc được giảm giá còn 0đ (nhờ voucher), hệ thống mở khóa ngay lập tức, không cần thanh toán.\n"
                + "- Nếu chuyển khoản sai số tiền hoặc gặp lỗi trong quá trình thanh toán, khuyên người dùng KHÔNG chuyển khoản lại lần nữa mà liên hệ bộ phận hỗ trợ của LearnOva để được kiểm tra.\n"
                + "- Hiện tại nền tảng chỉ hỗ trợ thanh toán qua PayOS (QR chuyển khoản ngân hàng nội địa Việt Nam), chưa hỗ trợ thẻ tín dụng quốc tế hay ví điện tử khác.\n\n"

                + "=== DANH MỤC KHÓA HỌC ===\n" + categoryList + "\n"
                + "=== DANH SÁCH KHÓA HỌC ===\n" + courseCatalog + "\n"
                + "=== DANH SÁCH GIẢNG VIÊN ===\n" + instructorCatalog;
    }

    private String buildRequestBody(String systemInstruction, List<ChatMessageDto> messages, boolean stream)
            throws IOException {
        List<Map<String, Object>> chatMessages = new ArrayList<>();

        Map<String, Object> systemMessage = new LinkedHashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemInstruction);
        chatMessages.add(systemMessage);

        for (ChatMessageDto message : messages) {
            String role = "model".equalsIgnoreCase(message.role()) ? "assistant" : "user";

            Map<String, Object> chatMessage = new LinkedHashMap<>();
            chatMessage.put("role", role);
            chatMessage.put("content", message.text());

            chatMessages.add(chatMessage);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", chatMessages);
        body.put("stream", stream);

        return objectMapper.writeValueAsString(body);
    }

    private String extractReply(String responseBody) throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode textNode = root
                .path("choices").path(0)
                .path("message").path("content");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new BusinessException(
                    "Trợ lý AI hiện không thể trả lời câu hỏi này. Vui lòng thử lại.");
        }

        return textNode.asText();
    }
}
