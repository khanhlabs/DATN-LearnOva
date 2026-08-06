package com.example.back_end.service;

import com.example.back_end.dto.request.VoiceCourseSearchRequest;
import com.example.back_end.dto.response.CategoryOptionResponse;
import com.example.back_end.dto.response.PublicCourseResponse;
import com.example.back_end.dto.response.VoiceCourseSearchResponse;
import com.example.back_end.service.admin.AdminCategoryService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.time.Duration;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VoiceCourseSearchService {

    private final CourseService courseService;
    private final AdminCategoryService categoryService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    @Value("${groq.api-key:}")
    private String apiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String model;

    public VoiceCourseSearchResponse search(VoiceCourseSearchRequest request) {
        String query = request.query().trim();
        List<PublicCourseResponse> allCourses = courseService.getPublishedCourses();
        List<CategoryOptionResponse> categories = categoryService.getActiveCategories();
        List<String> instructorNames = allCourses.stream()
                .map(PublicCourseResponse::instructorName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .toList();

        SearchFilters filters = parseFilters(query, categories, instructorNames);
        List<PublicCourseResponse> results = allCourses.stream()
                .filter(course -> matches(course, filters))
                .sorted(comparator(filters.sort()))
                .toList();

        Map<String, Object> responseFilters = new LinkedHashMap<>();
        responseFilters.put("keyword", filters.keyword());
        responseFilters.put("instructor", filters.instructor());
        responseFilters.put("category", filters.category());
        responseFilters.put("courseType", filters.courseType());
        responseFilters.put("level", filters.level());
        responseFilters.put("minPrice", filters.minPrice());
        responseFilters.put("maxPrice", filters.maxPrice());
        responseFilters.put("minRating", filters.minRating());
        responseFilters.put("minDurationMinutes", filters.minDurationMinutes());
        responseFilters.put("maxDurationMinutes", filters.maxDurationMinutes());
        responseFilters.put("minStudents", filters.minStudents());
        responseFilters.put("sort", filters.sort());

        return new VoiceCourseSearchResponse(query, responseFilters, results);
    }

    private SearchFilters parseFilters(String query, List<CategoryOptionResponse> categories, List<String> instructors) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallbackFilters(query, categories, instructors);
        }

        List<String> categoryNames = categories == null
                ? List.of()
                : categories.stream().map(CategoryOptionResponse::name).toList();

        String prompt = """
                Analyze this course-search request and return ONLY valid JSON.
                Do not add markdown or explanations.
                JSON keys must be exactly: keyword, instructor, category, courseType, level, minPrice, maxPrice, minRating, minDurationMinutes, maxDurationMinutes, minStudents, sort.
                keyword is a short course/topic keyword, or null.
                instructor must be one of the allowed instructors or null: %s
                category must be one of the allowed categories or null: %s
                courseType must be exactly free, paid, or null.
                level must be exactly Beginner, Intermediate, Advanced, or null.
                minPrice, maxPrice and minRating must be numbers or null.
                minDurationMinutes, maxDurationMinutes and minStudents must be non-negative integers or null.
                sort must be one of popular, rating, price_asc, price_desc, newest.
                Use price_asc for "cheapest", "rẻ nhất", "giá thấp nhất".
                Use price_desc for "most expensive", "đắt nhất", "giá cao nhất".
                Use rating for "highest rated", "đánh giá cao nhất".
                Use newest for "newest", "mới nhất".
                Use courseType free for miễn phí/free and paid for có phí/paid.
                Interpret "dưới X", "less than X", "tối đa X" as maxPrice X.
                Interpret "từ X đến Y", "between X and Y" as minPrice X and maxPrice Y.
                Interpret "khóa học ngắn", "under N minutes" as maxDurationMinutes N.
                Interpret "ít nhất N học viên" as minStudents N.
                Understand Vietnamese and English naturally. Infer only what the user actually asks.
                User request: %s
                """.formatted(objectMapper.valueToTree(instructors), objectMapper.valueToTree(categoryNames), query);

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("temperature", 0);
            body.put("response_format", Map.of("type", "json_object"));
            body.put("messages", List.of(
                    Map.of("role", "system", "content", "You are a strict course search filter parser."),
                    Map.of("role", "user", "content", prompt)
            ));

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return fallbackFilters(query, categories, instructors);
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asText();
            JsonNode parsed = objectMapper.readTree(content);
            return sanitize(parsed, query, categoryNames, instructors);
        } catch (IOException | InterruptedException | RuntimeException ex) {
            if (ex instanceof InterruptedException) Thread.currentThread().interrupt();
            return fallbackFilters(query, categories, instructors);
        }
    }

    private SearchFilters sanitize(JsonNode node, String fallbackKeyword, List<String> categories, List<String> instructors) {
        String keyword = textOrNull(node, "keyword");
        String instructor = matchKnownName(textOrNull(node, "instructor"), instructors);
        if (instructor == null) instructor = findMentionedName(fallbackKeyword, instructors);
        String category = matchKnownName(textOrNull(node, "category"), categories);
        if (category == null) category = findMentionedName(fallbackKeyword, categories);
        String courseType = matchIgnoreCase(textOrNull(node, "courseType"), List.of("free", "paid"));
        String level = matchIgnoreCase(textOrNull(node, "level"), List.of("Beginner", "Intermediate", "Advanced"));
        BigDecimal minPrice = decimalOrNull(node, "minPrice");
        BigDecimal maxPrice = decimalOrNull(node, "maxPrice");
        Double minRating = node.path("minRating").isNumber() ? node.path("minRating").asDouble() : null;
        Integer minDurationMinutes = integerOrNull(node, "minDurationMinutes");
        Integer maxDurationMinutes = integerOrNull(node, "maxDurationMinutes");
        Long minStudents = longOrNull(node, "minStudents");
        String sort = textOrNull(node, "sort");
        if (!List.of("popular", "rating", "price_asc", "price_desc", "newest").contains(sort)) sort = "popular";
        if (keyword != null && isSortPhrase(keyword)) keyword = null;
        return new SearchFilters(keyword, instructor, category, courseType, level, minPrice, maxPrice, minRating,
                minDurationMinutes, maxDurationMinutes, minStudents, sort);
    }

    private boolean matches(PublicCourseResponse course, SearchFilters filters) {
        String keyword = filters.keyword() == null ? "" : filters.keyword().toLowerCase(Locale.ROOT);
        String instructor = filters.instructor() == null ? "" : filters.instructor().toLowerCase(Locale.ROOT);
        boolean keywordMatch = keyword.isBlank()
                || contains(course.title(), keyword)
                || contains(course.description(), keyword)
                || contains(course.instructorName(), keyword)
                || contains(course.categoryName(), keyword);
        boolean instructorMatch = instructor.isBlank() || contains(course.instructorName(), instructor);
        boolean categoryMatch = filters.category() == null || equalsIgnoreCase(course.categoryName(), filters.category());
        boolean typeMatch = filters.courseType() == null
                || (filters.courseType().equals("free") && course.basePrice().signum() == 0)
                || (filters.courseType().equals("paid") && course.basePrice().signum() > 0);
        boolean levelMatch = filters.level() == null || course.level().name().equalsIgnoreCase(filters.level());
        boolean minPriceMatch = filters.minPrice() == null || course.basePrice().compareTo(filters.minPrice()) >= 0;
        boolean maxPriceMatch = filters.maxPrice() == null || course.basePrice().compareTo(filters.maxPrice()) <= 0;
        boolean ratingMatch = filters.minRating() == null || course.avgRating() >= filters.minRating();
        long durationMinutes = Math.round(course.totalDurationSeconds() / 60.0);
        boolean minDurationMatch = filters.minDurationMinutes() == null || durationMinutes >= filters.minDurationMinutes();
        boolean maxDurationMatch = filters.maxDurationMinutes() == null || durationMinutes <= filters.maxDurationMinutes();
        boolean studentsMatch = filters.minStudents() == null || course.studentCount() >= filters.minStudents();
        return keywordMatch && instructorMatch && categoryMatch && typeMatch && levelMatch
                && minPriceMatch && maxPriceMatch && ratingMatch && minDurationMatch && maxDurationMatch && studentsMatch;
    }

    private Comparator<PublicCourseResponse> comparator(String sort) {
        return switch (sort) {
            case "rating" -> Comparator.comparingDouble(PublicCourseResponse::avgRating).reversed();
            case "price_asc" -> Comparator.comparing(PublicCourseResponse::basePrice);
            case "price_desc" -> Comparator.comparing(PublicCourseResponse::basePrice).reversed();
            case "newest" -> Comparator.comparing(PublicCourseResponse::courseId).reversed();
            default -> Comparator.comparingLong(PublicCourseResponse::studentCount).reversed();
        };
    }

    private static boolean contains(String value, String keyword) {
        if (value == null || keyword == null) return false;
        String normalizedValue = normalize(value);
        String normalizedKeyword = normalize(keyword);
        if (normalizedValue.contains(normalizedKeyword)) return true;

        String[] tokens = normalizedKeyword.split("\\s+");
        return java.util.Arrays.stream(tokens)
                .filter(token -> token.length() > 1 && !SEARCH_STOP_WORDS.contains(token))
                .allMatch(normalizedValue::contains);
    }

    private static boolean equalsIgnoreCase(String left, String right) {
        return left != null && left.equalsIgnoreCase(right);
    }

    private static String textOrNull(JsonNode node, String name) {
        JsonNode value = node.get(name);
        return value != null && !value.isNull() && value.isTextual() && !value.asText().isBlank()
                ? value.asText().trim() : null;
    }

    private static BigDecimal decimalOrNull(JsonNode node, String name) {
        JsonNode value = node.get(name);
        return value != null && value.isNumber() && value.asDouble() >= 0
                ? BigDecimal.valueOf(value.asDouble()) : null;
    }

    private static Integer integerOrNull(JsonNode node, String name) {
        JsonNode value = node.get(name);
        return value != null && value.canConvertToInt() && value.asInt() >= 0 ? value.asInt() : null;
    }

    private static Long longOrNull(JsonNode node, String name) {
        JsonNode value = node.get(name);
        return value != null && value.canConvertToLong() && value.asLong() >= 0 ? value.asLong() : null;
    }

    private static String matchIgnoreCase(String value, List<String> allowed) {
        if (value == null) return null;
        return allowed.stream().filter(item -> item.equalsIgnoreCase(value)).findFirst().orElse(null);
    }

    private static String matchKnownName(String value, List<String> allowed) {
        if (value == null) return null;
        String normalizedValue = normalize(value);
        return allowed.stream()
                .filter(item -> normalize(item).equals(normalizedValue))
                .findFirst()
                .orElse(null);
    }

    private static String findMentionedName(String query, List<String> allowed) {
        if (query == null) return null;
        String normalizedQuery = normalize(query);
        return allowed.stream()
                .filter(item -> normalizedQuery.contains(normalize(item)))
                .sorted(Comparator.comparingInt((String item) -> normalize(item).length()).reversed())
                .findFirst()
                .orElse(null);
    }

    private static String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static final java.util.Set<String> SEARCH_STOP_WORDS = java.util.Set.of(
            "tim", "khoa", "hoc", "cua", "cho", "nguoi", "voi", "nhat", "co", "phi",
            "course", "courses", "the", "for", "by", "with", "and", "of", "find", "show"
    );

    private static boolean isSortPhrase(String value) {
        String normalized = value.toLowerCase(Locale.ROOT);
        return normalized.contains("rẻ nhất")
                || normalized.contains("giá thấp")
                || normalized.contains("cheapest")
                || normalized.contains("lowest price")
                || normalized.contains("đắt nhất")
                || normalized.contains("giá cao")
                || normalized.contains("most expensive")
                || normalized.contains("highest price")
                || normalized.contains("mới nhất")
                || normalized.contains("newest")
                || normalized.contains("đánh giá cao")
                || normalized.contains("highest rated")
                || normalized.contains("best rated");
    }

    private record SearchFilters(
            String keyword,
            String instructor,
            String category,
            String courseType,
            String level,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating,
            Integer minDurationMinutes,
            Integer maxDurationMinutes,
            Long minStudents,
            String sort
    ) {
    }

    private SearchFilters fallbackFilters(String query, List<CategoryOptionResponse> categories, List<String> instructors) {
        String normalized = query.toLowerCase(Locale.ROOT);
        String sort = "popular";
        if (normalized.contains("rẻ nhất") || normalized.contains("giá thấp") || normalized.contains("cheapest") || normalized.contains("lowest price")) {
            sort = "price_asc";
        } else if (normalized.contains("đắt nhất") || normalized.contains("giá cao") || normalized.contains("most expensive") || normalized.contains("highest price")) {
            sort = "price_desc";
        } else if (normalized.contains("đánh giá cao") || normalized.contains("highest rated") || normalized.contains("best rated")) {
            sort = "rating";
        } else if (normalized.contains("mới nhất") || normalized.contains("newest")) {
            sort = "newest";
        }
        String courseType = normalized.contains("miễn phí") || normalized.contains("mien phi") || normalized.contains("free") ? "free"
                : normalized.contains("có phí") || normalized.contains("co phi") || normalized.contains("paid") ? "paid" : null;
        String category = findMentionedName(query, categories.stream().map(CategoryOptionResponse::name).toList());
        String instructor = findMentionedName(query, instructors);
        return new SearchFilters(sort.equals("popular") ? query : null, instructor, category, courseType,
                null, null, null, null, null, null, null, sort);
    }
}
