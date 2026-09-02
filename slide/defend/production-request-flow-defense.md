# Defense request flow production — đi qua từng service

## 1. Request API thông thường

Ví dụ learner gọi `GET /api/learnova/courses/...` hoặc teacher gọi API quản lý course.

```text
Browser
 → HTTPS endpoint production
 → EC2 :80
 → frontend Nginx
 → proxy_pass http://backend:8080/api/...
 → Spring Security filter chain
 → Controller
 → Application Service
 → JPA Repository
 → PostgreSQL
 → Service/Controller response JSON
 → Nginx
 → Browser
```

### File xử lý từng điểm

1. **`front_end/src/shared/api-client/AxiosClient.js`**: `baseURL=import.meta.env.VITE_API_URL`, `withCredentials: true`. Production build truyền `VITE_API_URL=/api/learnova` trong `docker-compose.prod.yml`, nên browser gọi same-origin và tự gửi HttpOnly access-token cookie.
2. **`front_end/nginx.conf`**: `location /api/` dùng `proxy_pass http://backend:8080/api/`; đồng thời truyền `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Port`.
3. **`back_end/src/main/resources/application.properties`**: `server.forward-headers-strategy=framework` để Spring hiểu forwarded headers từ proxy/TLS layer.
4. **Spring Boot backend**: Security xác thực cookie/token; route controller nhận request. Ví dụ CRUD Course dùng `TeacherCourseController`, `@PreAuthorize("hasRole('TEACHER')")`, lấy email từ `Authentication`.
5. **Service**: ví dụ `TeacherCourseService` kiểm tra owner, áp quy tắc status/category, rồi gọi repository.
6. **Repository/JPA**: kết nối `jdbc:postgresql://postgres:5432/...` trong private Compose network; PostgreSQL trả dữ liệu, response đi ngược lại frontend.

Nginx không cần CORS cross-domain cho frontend API vì bundle dùng relative URL `/api/learnova`; browser coi đó là cùng origin.

## 2. Request WebSocket và OAuth

- `front_end/nginx.conf`, `location /ws/`: proxy HTTP/1.1 và chuyển headers `Upgrade`, `Connection: upgrade`; kết nối persistent tới Spring Boot.
- `location /oauth2/` và `/login/`: proxy về backend giữ nguyên các auth endpoint. Vì frontend phục vụ cùng origin, callback/login đi qua reverse proxy thay vì frontend tự xử lý OAuth secret.

## 3. Upload file/video

Đây là flow khác request API vì binary không đi qua backend:

```text
Browser → POST /api/learnova/uploads/presigned-url → Backend S3Service
Browser ← { uploadUrl, fileKey }
Browser → PUT binary trực tiếp S3 bằng uploadUrl
Browser → API gắn fileKey vào Course/Lesson
Backend → PostgreSQL lưu fileKey và metadata
```

**File theo chặng:**

- Frontend `UploadService.js` thực hiện PUT object; `VideoUploader.jsx` và `useCourseUpload.js` gọi nó.
- Backend `UploadController.generateUploadUrl` → `S3Service.generateUploadUrl` tạo presigned URL.
- Khi gắn video, `LessonController.updateLessonVideo` → `LessonService.updateLessonVideo` kiểm tra teacher sở hữu lesson rồi lưu metadata. Như vậy upload object và quyền gắn object vào nội dung là hai bước tách biệt.

## 4. Luồng video HLS trên production

```text
Teacher gắn videoKey
 → LessonService: HLS=PENDING
 → MediaConvert job đọc source S3, ghi HLS playlist/segments về S3
 → HlsJobStatusScheduler (mỗi 30 giây) poll job
 → COMPLETE: hlsPlaylistKey được lưu, status=READY
 → Learner xin playlist qua API
 → backend đọc playlist S3, rewrite URL
 → Browser tải HLS segments qua CloudFront signed URL
 → CloudFront (OAC) đọc object private từ S3
```

**Code quan trọng:**

- `LessonService.updateLessonVideo`: tạo MediaConvert job, lưu job ID, đặt `PENDING/PROCESSING/FAILED`, rồi queue AI.
- `HlsJobStatusScheduler.pollPendingJobs`: mỗi 30 giây đọc lesson PENDING/PROCESSING, hỏi MediaConvert; COMPLETE thì tạo `hlsPlaylistKey` và `READY`.
- `HlsPlaylistService.getMasterPlaylist/getVariantPlaylist`: đọc playlist S3; route playlist trong app giữ qua API, còn segments được thay bằng CloudFront signed URL 6 giờ.
- `infra/terraform/cloudfront.tf`: CloudFront chỉ đọc private S3 qua OAC; viewer cần signed key group.

## 5. Luồng tìm kiếm

```text
Course được publish / đổi visibility / xóa
 → TeacherCourseService hoặc AdminCourseService
 → CourseIndexService.sync
 → Elasticsearch (nếu service khả dụng)

Browser search → Nginx → Spring SearchController/Service → Elasticsearch → response
```

`CourseIndexService.sync` chỉ index course `PUBLISHED`, không hidden, không deleted. Nếu Elasticsearch mất kết nối, code log warning và bỏ qua sync; PostgreSQL vẫn là nguồn đúng. Đây là eventual consistency của search, không phải mất Course.

## 6. Luồng AI nội bộ và AI bên ngoài

```text
Lesson video được gắn
 → AiGenerationQueueService tạo job DB
 → worker backend claim job
 → AiServiceClient HTTP tới http://ai-service:8000 trong Compose network
 → ai-service sử dụng GEMINI_API_KEY theo cấu hình
 → summary/quiz trả về backend và được lưu database
```

Ngoài AI service nội bộ, chatbot dùng `GroqChatService` gọi HTTPS tới `https://api.groq.com/...` với `GROQ_API_KEY`. Các outbound call này đi từ backend/ai service ra provider, không đi qua Nginx reverse proxy.

## 7. Nếu một service lỗi thì request bị ảnh hưởng thế nào

| Service lỗi | Ảnh hưởng |
|---|---|
| Nginx/frontend container | Không truy cập SPA/API qua endpoint web, dù backend có thể còn chạy nội bộ. |
| Backend | API/auth/business logic lỗi; static frontend có thể vẫn tải. |
| PostgreSQL | Hầu hết nghiệp vụ không đọc/ghi được; đây là nguồn dữ liệu lõi. |
| Elasticsearch | Search/index có thể thiếu/cũ; Course vẫn tồn tại và luồng database chính vẫn hoạt động. |
| S3/CloudFront | Upload, thumbnail/resource/HLS delivery liên quan bị lỗi; record database không tự mất. |
| MediaConvert | Video mới không thành HLS; Lesson giữ trạng thái FAILED để nhận biết. |
| ai-service/Gemini | Summary/quiz generation retry/fail theo job; CRUD Course không nên mất. |

## 8. Câu trả lời ngắn để trình bày

“Ở production, frontend được Nginx phục vụ trên EC2. Mọi API relative `/api/learnova` được Nginx reverse-proxy vào Spring Boot trong Docker private network. Spring Security và controller/service xử lý nghiệp vụ, JPA đọc ghi PostgreSQL. Search là Elasticsearch dẫn xuất. File/video đi trực tiếp lên S3 bằng presigned URL; khi lesson gắn video, backend kích hoạt MediaConvert tạo HLS, và learner nhận video qua CloudFront signed URL. CI/CD dùng GitHub OIDC và SSM để cập nhật stack Compose trên EC2 mà không cần SSH hay AWS key dài hạn.”
