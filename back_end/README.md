## Cấu trúc root `back_end`

```text
back_end/
├── src/
│   ├── main/java/com/example/back_end/   # source code
│   ├── main/resources/                   # config, migration, ES mapping
│   └── test/java/                        # test
├── pom.xml                               # dependency và build config
├── mvnw, mvnw.cmd, .mvn/                 # Maven wrapper
├── Dockerfile, .dockerignore             # build image
├── .env, .env-prod, .env.example         # biến môi trường theo môi trường
├── CLAUDE.md                             # convention cho AI agent
└── target/                               # build output, không commit
```

## Cách chia package

Package gốc là `com.example.back_end`. Cấp một là **bounded context** theo nghiệp vụ, không phải theo layer kỹ thuật. Bên trong mỗi context mới chia theo layer kiểu hexagonal:

```text
<context>/
├── adapter/in/web/          # controller — cổng vào HTTP
│   ├── <X>Controller.java
│   └── dto/                 # request/response record của context
├── application/             # service — use case, orchestration, business logic
├── domain/                  # JPA entity, embedded id, value object
│   └── enums/               # enum nghiệp vụ của context
└── infrastructure/          # adapter ra ngoài
    ├── persistence/         # Spring Data repository
    ├── storage/ video/      # S3, MediaConvert (chỉ media)
    ├── payment/             # PayOS, exchange rate (chỉ commerce)
    └── elasticsearch/       # ES document/repository (chỉ search)
```

Không context nào bắt buộc có đủ bốn layer. `ai` không có `domain`/`persistence`; `admin` không có `domain` vì nó đọc entity của context khác; `media` không có `persistence` vì state video nằm trên `Lesson`.

Danh sách context:

```text
com/example/back_end/
├── BackEndApplication.java   # entry point
├── admin/                    # khu vực quản trị
├── ai/                       # chatbot, AI client
├── assessment/               # quiz, review, Q&A, report
├── auth/                     # authentication, user account, role
├── commerce/                 # cart, order, payment, voucher, wishlist
├── course/                   # course, curriculum, category, tag
├── instructor/               # teacher portal, instructor public
├── learning/                 # enrollment, progress, certificate, summary
├── media/                    # upload, S3, HLS
├── notification/             # notification
├── search/                   # Elasticsearch search
├── user/                     # profile, stats, follow
├── security/                 # JWT filter, user details, rate limit
├── scheduler/                # job định kỳ
└── shared/                   # config, exception, util, audit, DTO chung
```

`BackEndApplication.java` bật `@EnableScheduling`, `@EnableAsync` và `@EnableElasticsearchRepositories` giới hạn trong package `search`, nên JPA repository và ES repository không bị scan lẫn nhau.

## Từng context làm gì

### `auth/` — authentication và tài khoản

Sở hữu entity `User` và toàn bộ role, nên mọi context khác đều import `auth.domain.User`.

- `adapter/in/web/AuthController.java` (`/api/learnova/auth`): register, login, refresh token, logout, verify email, forgot/reset password, resend verification, switch role.
- `adapter/in/web/dto/`: `LoginRequest`, `RegisterRequest`, `RefreshTokenRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `ChangePasswordRequest`, `ResendVerificationRequest`, `SwitchRoleRequest` và các response tương ứng (`AuthResponse`, `AuthTokenResponse`, `LoginResponse`, `RegisterResponse`).
- `application/AuthService.java`: use case đăng ký/đăng nhập, phát hành token, đổi active role.
- `application/CookieService.java`: đóng gói refresh token vào HttpOnly cookie, đọc/xóa cookie.
- `application/VerificationTokenService.java`: sinh và kiểm tra token verify/reset, dọn token hết hạn (scheduler gọi vào đây).
- `domain/`: `User`, `Role`, `UserRole` + `UserRoleId` (bảng nối many-to-many), `UserAuthProvider` (liên kết tài khoản Google/Facebook), `VerificationToken`.
- `domain/enums/`: `RoleName` (USER/TEACHER/ADMIN), `AccountType`, `VerificationType`.
- `infrastructure/EmailService.java`: gửi mail verify/reset qua Spring Mail.
- `infrastructure/persistence/`: `UserRepository`, `RoleRepository`, `VerificationTokenRepository`.

### `user/` — profile, thống kê, follow

Phần "người dùng đã đăng nhập tự thao tác với chính mình", tách khỏi `auth` (vốn lo credential/token).

- `adapter/in/web/UserController.java` (`/api/learnova`): `GET /user/me`, đổi active role, xem/cập nhật profile, đổi avatar, đổi password.
- `adapter/in/web/UserStatsController.java` (`/api/learnova/user`): số liệu học tập của user.
- `adapter/in/web/FollowController.java` (`/api/learnova/instructors/{instructorId}/follow`): follow/unfollow và trạng thái follow.
- `adapter/in/web/dto/`: `CurrentUserResponse`, `UserResponse`, `UserStatsResponse`, `FollowStatusResponse`, `UpdateProfileRequest`, `UpdateAvatarRequest`.
- `application/UserStatsService.java`: tổng hợp số liệu học tập.
- `application/InstructorFollowService.java`: logic follow instructor.
- `domain/`: `InstructorFollow` + `InstructorFollowId`, `enums/GenderType`.
- `infrastructure/persistence/InstructorFollowRepository.java`.

### `course/` — course và curriculum public

Sở hữu entity course và cây nội dung. Việc *tạo/sửa* course thuộc `instructor`, còn *đọc* public nằm ở đây.

- `adapter/in/web/CourseController.java` (`/api/learnova/courses`): danh sách public, course detail, featured, stats nền tảng, top category, danh sách category, video URL.
- `adapter/in/web/CurriculumController.java` (`/api/learnova/student/courses`): curriculum cho học viên đã enroll.
- `adapter/in/web/dto/`: `PublicCourseResponse`, `CourseDetailResponse`, `CourseSearchResponse`, `FeaturedCourseResponse`, `CourseCurriculumResponse`, `SectionResponse`, `LessonResponse`, `CategoryOptionResponse`, `TopCategoryResponse`, `PlatformStatsResponse`.
- `application/CourseService.java`, `application/CourseCurriculumService.java`.
- `domain/`: `Course`, `Section`, `Lesson`, `LessonSource`, `Category`, `Tag`, `CourseAnnouncement`, các bảng nối `CourseCategory`/`CourseTag` cùng embedded id.
- `domain/enums/`: `CourseStatus` (draft/pending/published/rejected…), `CourseLevel`, `LessonSourceType`.
- `infrastructure/persistence/`: `CourseRepository`, `SectionRepository`, `LessonRepository`, `CourseCategoryRepository`, `CourseTagRepository`.

`Lesson` giữ luôn trạng thái HLS (`hlsStatus`, `mediaConvertJobId`) nên scheduler và `media` đều đọc `LessonRepository`.

### `instructor/` — teacher portal và instructor public

Context lớn nhất, gồm ba nhóm: hồ sơ đăng ký làm giảng viên, công cụ soạn khóa học, và dashboard/analytics.

Controller (`adapter/in/web/`):

- `TeacherApplicationController` (`/teacher/applications`): user nộp hồ sơ xin làm teacher.
- `TeacherCourseController` (`/teacher/courses`): CRUD course của chính teacher, đổi status để gửi duyệt.
- `SectionController`, `LessonController`, `LessonSourceController` (cùng base `/teacher/courses`): quản lý section, lesson và tài liệu đính kèm.
- `AnnouncementController` (`/teacher/announcements`): thông báo tới học viên.
- `PromotionController` (`/teacher/promotions`): khuyến mãi theo course.
- `TeacherReviewController` (`/teacher/reviews`): xem và trả lời review.
- `TeacherStudentController` (`/teacher/students`): danh sách học viên.
- `TeacherRevenueController` (`/teacher/revenue`), `TeacherDashboardController` (`/teacher/dashboard`), `TeacherAnalyticsController` (`/teacher/analytics`).
- `InstructorProfileController` (`/teacher/profile`): hồ sơ giảng viên do chính teacher sửa.
- `TeacherController` (`/api/learnova/instructors`): instructor public cho khách xem.

`adapter/in/web/dto/` chứa request/response cho từng nhóm trên: `CreateDraftCourseRequest`/`Response`, `UpdateCourseRequest`, `UpdateCourseStatusRequest`, `CreateSectionRequest`/`Response`, `UpdateSectionRequest`, `CreateLessonRequest`/`Response`, `UpdateLessonRequest`, `UpdateLessonVideoRequest`, `CreateLessonSourceRequest`, `LessonSourceResponse`, `CreateAnnouncementRequest`, `AnnouncementResponse`, `CreatePromotionRequest`, `UpdatePromotionRequest`, `PromotionCourseResponse`, `ReplyReviewRequest`, `TeacherReviewResponse`, `TeacherQuestionResponse`, `TeacherStudentResponse`, `TeacherStudentCourseResponse`, `TeacherCoursesResponse`, `TeacherDashboardResponse`, `TeacherAnalyticsResponse`, `TeacherRevenueResponse`, `CreateTeacherApplicationRequest`, `TeacherApplicationResponse`, `InstructorProfileResponse`, `UpdateInstructorProfileRequest`, và nhóm `PublicInstructor*Response` cho trang public.

`application/` có một service cho mỗi nhóm nghiệp vụ: `TeacherCourseService`, `SectionService`, `LessonService`, `LessonSourceService`, `AnnouncementService`, `PromotionService`, `TeacherReviewService`, `TeacherStudentService`, `TeacherRevenueService`, `TeacherDashboardService`, `TeacherAnalyticsService`, `TeacherApplicationService`, `InstructorProfileService`, `PublicInstructorService`.

`domain/`: `InstructorProfile`, `TeacherApplication`, `enums/TeacherApplicationStatus`.
`infrastructure/persistence/`: `InstructorProfileRepository`, `TeacherApplicationRepository`, `CourseAnnouncementRepository`, `PromotionRepository`, `LessonSourceRepository`.

Repository của `CourseAnnouncement`, `Promotion`, `LessonSource` nằm ở `instructor` dù entity thuộc `course`/`commerce`, vì chỉ teacher ghi vào chúng.

### `learning/` — học tập của học viên

- `EnrollmentController` (`/api/learnova/enrollments`): kiểm tra đã enroll chưa (public, trả `false` cho khách), danh sách course đã mua, và course gợi ý học tiếp. Việc *tạo* enrollment do `commerce` thực hiện sau khi thanh toán thành công, không có endpoint enroll thủ công.
- `ProgressController` (`/api/learnova/progress`): `POST /update` ghi nhận tiến độ một lesson và trả về tiến độ course sau cập nhật, `GET /course/{courseId}` đọc tiến độ hiện tại.
- `CertificateController` (`/api/learnova/certificates`): lấy certificate của một course, tải file, và verify bằng code (`/verify/{code}` là public).
- `SummaryController` (`/api/learnova/lessons`): tóm tắt lesson do AI sinh.
- `dto/`: `MyEnrolledCourseResponse`, `CourseProgressResponse`, `LessonProgressRequest`/`Response`, `ContinueLearningResponse`, `CertificateResponse`, `CertificateDownloadResponse`, `CertificateVerifyResponse`, `LessonSummaryResponse`.
- `application/`: `EnrollmentService`, `LessonProgressService`, `CertificateService` (sinh PDF bằng OpenPDF), `LessonSummaryService` (gọi `ai`).
- `domain/`: `Enrollment` + `EnrollmentId`, `LessonProgress` + `LessonProgressId`, `Certificate`, `LessonSummary`.
- `infrastructure/persistence/`: repository tương ứng của bốn entity trên.

### `commerce/` — giỏ hàng, thanh toán, khuyến mãi

- `CartController` (`/api/learnova/cart`): thêm/xóa item, merge cart từ localStorage khi login.
- `PaymentController` (`/api/learnova/payments`): tạo payment, tra trạng thái, webhook PayOS (public), tỷ giá USD-VND (public).
- `VoucherController` (`/api/learnova/vouchers`): áp voucher và trả về giá sau giảm.
- `WishlistController` (`/api/learnova/wishlist`): wishlist và sync từ client.
- `dto/`: `AddCartItemRequest`, `MergeCartRequest`, `CartItemResponse`, `CreatePaymentRequest`/`Response`, `PaymentStatusResponse`, `ApplyVoucherRequest`/`Response`, `WishlistRequest`, `WishlistSyncRequest`, `WishlistResponse`.
- `application/`: `CartService`, `PaymentService`, `VoucherService`, `WishlistService`.
- `domain/`: `Cart` + `CartId`, `Order`, `OrderItem`, `Payment`, `Voucher`, `Promotion`, `PromotionCourse` + `PromotionCourseId`, `Wishlist` + `WishlistId`.
- `domain/enums/`: `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `DiscountType`.
- `infrastructure/payment/PayOSService.java`: ký request, gọi PayOS, verify checksum webhook.
- `infrastructure/payment/ExchangeRateService.java`: lấy tỷ giá USD-VND, có cache TTL và giá trị fallback.
- `infrastructure/persistence/`: `CartRepository`, `OrderRepository`, `OrderItemRepository`, `PaymentRepository`, `VoucherRepository`, `PromotionCourseRepository`, `WishlistRepository`.

Payout Request đã bị bỏ khỏi backend; chỉ còn dấu vết trong `V1__initial_schema.sql`. Không xây tính năng mới dựa trên nó.

### `assessment/` — quiz, review, Q&A, report

- `QuizController` (`/api/learnova/lessons`): lấy quiz của lesson, nộp bài, xem kết quả.
- `ReviewController` (`/api/learnova`): đánh giá course, rating summary, testimonial cho trang chủ.
- `LessonQAController` (`/api/learnova/qna`): hỏi đáp theo lesson/course, đọc là public.
- `ReportController` (`/api/learnova/reports`): học viên báo cáo vi phạm course.
- `dto/`: `QuizResponse`, `QuizQuestionResponse`, `QuizOptionResponse`, `SubmitQuizRequest`, `QuizResultResponse`, `CreateReviewRequest`, `UpdateReviewRequest`, `ReviewResponse`, `CourseReviewResponse`, `RatingSummaryResponse`, `TestimonialResponse`, `CreateQuestionRequest`, `CreateAnswerRequest`, `QuestionResponse`, `AnswerResponse`, `LessonQAResponse`, `CourseReportRequest`, `CourseReportResponse`, `CourseReportStatsResponse`.
- `application/`: `QuizService`, `ReviewService`, `LessonQAService`, `CourseReportService`.
- `domain/`: `Quiz`, `QuizQuestion`, `QuizOption`, `QuizAttempt`, `QuizAnswer`, `Review`, `LessonQA`, `Report`, `ReportCategory`.
- `infrastructure/persistence/`: `QuizRepository`, `QuizAttemptRepository`, `ReviewRepository`, `LessonQARepository`, `ReportRepository`, `ReportCategoryRepository`.

### `admin/` — khu vực quản trị

Toàn bộ `/api/learnova/admin/**` bị chặn bằng `hasRole("ADMIN")` ngay trong `SecurityConfig`. Context này không có `domain/` riêng: nó đọc/ghi entity của context khác thông qua repository chuyên cho query quản trị.

- `AdminDashboardController` (`/admin/dashboard`): số liệu tổng quan.
- `AdminUserController` (`/admin/users`), `AdminInstructorController` (`/admin/instructors-management`).
- `AdminCourseController` (`/admin/courses-management`): quản lý và duyệt/từ chối course.
- `AdminCourseReportController` (`/admin/reports`): danh sách và thống kê report, xem chi tiết, dismiss/resolve, ẩn course, cảnh cáo giảng viên, xóa lesson vi phạm.
- `AdminTeacherApplicationController` (`/admin/teacher-applications`): duyệt hồ sơ giảng viên.
- `AdminCategoryController` (`/admin/categories-management`), `AdminTagController` (`/admin/tags-management`).
- `AdminVoucherController` (`/admin/vouchers`): voucher và thống kê sử dụng.
- `AdminRevenueController` (`/admin/revenue`): doanh thu, giao dịch, xếp hạng course/instructor.
- `AdminSearchController` (`/admin/search`): thao tác reindex/search nội bộ.
- `AdminHlsController` (`/admin/hls-migration`): chạy migration video sang HLS.
- `dto/`: `AdminDashboardResponse`, `AdminUserRequest`/`Response`, `AdminInstructorResponse`, `AdminCourseResponse`, `AdminCourseDetailResponse`, `AdminCourseDropdownResponse`, `RejectCourseRequest`, `RejectTeacherApplicationRequest`, `AdminCategoryRequest`/`Response`, `AdminTagRequest`/`Response`, `AdminVoucherRequest`/`Response`, `AdminVoucherCampaignStatsResponse`, `AdminVoucherUsageHistoryResponse`, `AdminVoucherUsageFrequencyResponse`, và nhóm `AdminRevenue*Response` (overview, comparison, transaction, transaction insights, course ranking, instructor ranking).
- `application/`: `AdminDashboardService`, `AdminUserService`, `AdminInstructorService`, `AdminCourseService`, `AdminTeacherApplicationService`, `AdminCategoryService`, `AdminTagService`, `AdminVoucherService`, `AdminRevenueService`, `AdminHlsMigrationService`.
- `infrastructure/persistence/`: `AdminUserRepository`, `AdminCourseRepository`, `AdminCategoryRepository`, `AdminTagRepository`, `AdminVoucherRepository`, `AdminRevenueRepository` — chứa query aggregate/phân trang riêng cho màn hình admin, không dùng chung với repository của context gốc.

### `media/` — upload và video

- `UploadController` (`/api/learnova/uploads`): `POST /presigned-url` để client upload thẳng lên S3 thay vì đẩy file qua backend.
- `HlsController` (`/api/learnova/courses/hls`): trả master/variant playlist, public để player đọc được.
- `dto/`: `GenerateUploadUrlRequest`, `UploadUrlResponse`; `GetFileUrlResponse` và `CvUrlResponse` tuy đặt ở đây nhưng được `course`, `instructor` và `admin` dùng khi cần trả link file đã ký.
- `application/HlsPlaylistService.java`: đọc playlist từ S3 và viết lại URL segment thành link đã ký.
- `domain/enums/`: `UploadType` (avatar, cv, thumbnail, video…), `HlsStatus` (PENDING/PROCESSING/…).
- `infrastructure/storage/S3Service.java`: presigned upload URL, public URL, CloudFront signed URL, đọc/ghi object, resolve avatar.
- `infrastructure/video/MediaConvertService.java`: tạo job MediaConvert chuyển video sang HLS, tra job status, suy ra video UUID từ S3 key.

Không có `persistence/` vì trạng thái transcode được lưu trên `Lesson` của context `course`.

### `search/` — tìm kiếm

- `SearchController` (`/api/learnova/search`): search course, endpoint public.
- `application/SearchService.java`: dựng query và map kết quả.
- `application/CourseIndexService.java`: đẩy course lên index. Repository ES được inject qua `ObjectProvider` nên khi Elasticsearch không sẵn sàng, việc index bị bỏ qua và app vẫn khởi động bình thường.
- `infrastructure/elasticsearch/CourseDocument.java`: document mapping.
- `infrastructure/elasticsearch/CourseSearchRepository.java`: Spring Data Elasticsearch repository. `@EnableElasticsearchRepositories` trong `BackEndApplication` trỏ đúng vào class này.

### `notification/` — thông báo

- `NotificationController` (`/api/learnova/notifications`): danh sách phân trang của chính mình, unread count, đánh dấu đã đọc một hoặc tất cả, và `POST /self` cho admin tự ghi một ghi chú hoạt động vào chuông thông báo.
- `dto/`: `NotificationResponse`, `SelfNotificationRequest`, `WarnInstructorRequest` (dùng bởi `AdminCourseReportController` khi admin cảnh cáo giảng viên).
- `application/NotificationService.java`: tạo notification cho các sự kiện (enroll, duyệt course, review mới…), đếm unread, đánh dấu đã đọc và xóa notification đã đọc quá hạn.
- `domain/Notification.java`, `domain/enums/NotificationType.java`.
- `infrastructure/persistence/NotificationRepository.java`.

### `ai/` — chatbot và AI

- `ChatBotController` (`/api/learnova/chatbot`): `POST /message` và `POST /message/stream`, cả hai đều public.
- `dto/`: `ChatRequest`, `ChatResponse`, `ChatMessageDto`.
- `application/AiServiceClient.java`: `RestClient` gọi AI service ngoài (`ai.service.base-url`), ví dụ `POST /summarize` để tóm tắt video.
- `infrastructure/GroqChatService.java`: gọi Groq API cho chat, cấu hình qua `groq.api-key` và `groq.model`.

### `security/` — hạ tầng bảo mật

- `JwtService.java`: tạo/parse/validate access token và refresh token.
- `JwtAuthenticationFilter.java`: filter đọc Bearer token và set `SecurityContext`, được đăng ký trước `UsernamePasswordAuthenticationFilter`.
- `CustomUserDetails.java`, `CustomUserDetailsService.java`: nạp user và authority từ DB.
- `OAuth2AuthenticationSuccessHandler.java`: xử lý sau khi login Google/Facebook thành công, phát token và redirect về frontend.
- `RateLimitInterceptor.java`: giới hạn số request, `WebConfig` chỉ gắn nó cho `/api/learnova/auth/**`.

### `scheduler/` — job định kỳ

- `HlsJobStatusScheduler.java`: mỗi 30 giây poll các lesson đang `PENDING`/`PROCESSING`, hỏi MediaConvert và cập nhật `hlsStatus`.
- `CleanupRefreshTokenByScheduler.java`: 03:00 giờ Việt Nam, xóa refresh token hết hạn.
- `NotificationCleanupScheduler.java`: 03:00 giờ Việt Nam, xóa notification đã đọc cũ hơn 30 ngày.

Scheduler chỉ điều phối thời điểm; logic thật nằm trong service của context tương ứng.

### `shared/` — dùng chung

- `adapter/in/web/dto/ApiResponse.java`, `ErrorResponse.java`: response bao chung cho message và lỗi.
- `config/SecurityConfig.java`: filter chain, danh sách endpoint public, chặn `/admin/**` theo role, stateless session, OAuth2 login, `BCryptPasswordEncoder`, `@EnableMethodSecurity` để `@PreAuthorize` hoạt động.
- `config/CorsConfig.java`: origin cho phép, đọc từ `app.cors.allowed-origins`.
- `config/WebConfig.java`: đăng ký `RateLimitInterceptor`.
- `config/AwsConfig.java`, `CloudFrontConfig.java`, `MediaConvertConfig.java`: khai báo bean AWS SDK client.
- `exception/BusinessException.java`, `ResourceNotFoundException.java`: exception nghiệp vụ.
- `exception/GlobalExceptionHandler.java`: `@RestControllerAdvice` map exception sang HTTP status và `ErrorResponse`.
- `audit/Auditlog.java`: entity ghi log thay đổi dữ liệu (`old_data`/`new_data` dạng JSON).
- `util/PercentDeltaCalculator.java`: tính % thay đổi giữa hai kỳ, trả `null` khi không có baseline thay vì `0%` gây hiểu nhầm. Dùng chung cho card trend của dashboard/revenue.

## `src/main/resources`

```text
resources/
├── application.properties          # config chung mọi profile
├── application-local.properties    # profile local (mặc định)
├── application-prod.properties     # profile prod
├── db/migration/                   # Flyway
└── elasticsearch/course-settings.json
```

- `application.properties`: datasource, JPA (`ddl-auto=none`), Flyway, JWT expiration, AWS/CloudFront/MediaConvert, OAuth2 Google + Facebook, PayOS, tỷ giá, giới hạn multipart 10MB, Groq. Mọi giá trị nhạy cảm đều đọc từ biến môi trường.
- `application-local.properties`: DB `localhost:5433/DATN`, ES `localhost:9200`, frontend `localhost:5173`, AI service `localhost:8000`, cookie không secure.
- `application-prod.properties`: cùng bộ key nhưng lấy giá trị production.
- `db/migration/`: `V1__initial_schema.sql` (schema gốc), `V2__seed_roles.sql` (seed role), `V3__report_table.sql`, `V4__add_lessonprogress_updated_at.sql`, `V5__fix_sync_enrollment_progress_function.sql`. `validate-on-migrate=true` và `clean-disabled=true`, nên **không sửa migration đã chạy** — luôn thêm file `V<n+1>__` mới.
- `elasticsearch/course-settings.json`: analyzer/setting cho index course.

## `src/test`

- `BackEndApplicationTests.java`: smoke test context Spring load được. Test suite hiện chỉ có vậy.

## Luồng một request

```text
HTTP request
  ↓
CorsConfig → RateLimitInterceptor (chỉ /auth/**)
  ↓
JwtAuthenticationFilter → SecurityContext
  ↓
SecurityConfig authorizeHttpRequests + @PreAuthorize
  ↓
<context>/adapter/in/web/<X>Controller     ← @Valid, map ResponseEntity
  ↓
<context>/application/<X>Service           ← business logic, ownership check
  ↓
<context>/infrastructure/persistence/…Repository   → PostgreSQL
        hoặc infrastructure/{storage,video,payment,elasticsearch} → AWS / PayOS / ES
  ↓
DTO record → JSON
```

Lỗi ném ra từ service được `GlobalExceptionHandler` bắt và chuyển thành `ErrorResponse`.

Hướng phụ thuộc mong muốn:

```text
adapter → application → domain
application → infrastructure (qua repository/service interface)
mọi context → shared, auth.domain.User
```

Context này có thể gọi service của context khác (ví dụ `learning` gọi `ai`, `admin` gọi repository của `course`), nhưng không nên gọi ngược từ `domain` lên `adapter`.

## Quy tắc thêm code mới

### Thêm endpoint

1. Xác định context sở hữu nghiệp vụ; nếu là màn hình dành riêng cho một role, ưu tiên context của role đó (`admin`, `instructor`).
2. Thêm method vào controller có sẵn của resource đó, hoặc tạo controller mới trong `<context>/adapter/in/web/`.
3. Base path phải theo đúng role segment:
   - Teacher: `/api/learnova/teacher/{resource}`
   - Admin: `/api/learnova/admin/{resource}`
   - Public/shared: `/api/learnova/{resource}`
4. `@RequestMapping` ở class phải nêu tên resource; từng mapping method chỉ thêm sub-path, không lặp lại base.
5. Nếu endpoint là public, thêm matcher vào `SecurityConfig`; nếu theo role, dùng `@PreAuthorize` ở class khi cả controller cùng role.
6. Controller chỉ validate + delegate + map response. Không đặt business logic ở đây.

### Thêm service

- Một service ứng với một actor nhìn vào một resource (`TeacherCourseService` khác `CourseService` khác `AdminCourseService`).
- Cần dữ liệu service khác đã tính thì inject service đó, đừng chép lại query.
- Method ghép hơn 3-4 mảnh dữ liệu không liên quan thì tách thành các private `buildX(...)`, dùng private `record` để trả nhiều giá trị.
- Helper số học dùng chung đặt trong `shared/util/`.

### Thêm DTO

- DTO là Java `record`, đặt trong `<context>/adapter/in/web/dto/`.
- Vài DTO cũ dùng Lombok `@Data`/`@Builder` là di sản, không phải mẫu để làm theo.
- Tên theo mục đích: `<Verb><Noun>Request` / `<Noun>Response`.

### Thêm entity hoặc đổi schema

1. Viết file Flyway mới `V<n+1>__<mo_ta>.sql`, không sửa file cũ.
2. Thêm entity vào `<context>/domain/`, enum vào `<context>/domain/enums/`.
3. Thêm repository vào `<context>/infrastructure/persistence/`.
4. Nếu course bị ảnh hưởng, cân nhắc cập nhật `CourseIndexService` để ES không lệch dữ liệu.

### Thêm tích hợp ngoài

- Client HTTP/SDK đặt trong `<context>/infrastructure/<nhóm>/`, không đặt trong `application/`.
- Endpoint, key, timeout đọc từ `application.properties` qua biến môi trường; thêm key mới vào `.env.example`.

## Quy ước đặt tên

- Controller: `<Resource>Controller.java`, có tiền tố role khi thuộc `admin`/`instructor` (`AdminCourseController`, `TeacherCourseController`).
- Service: `<Resource>Service.java`, cùng quy tắc tiền tố.
- Repository: `<Entity>Repository.java`; repository riêng cho admin đặt tiền tố `Admin`.
- Entity: danh từ số ít (`Course`, `Enrollment`); composite key là `<Entity>Id`.
- Enum: đặt trong `domain/enums/`, tên số ít (`CourseStatus`, `PaymentMethod`).
- DTO: `<Verb><Noun>Request` / `<Noun>Response`.
- Package request là `dto` chung cho cả request và response trong `adapter/in/web/dto/`.
