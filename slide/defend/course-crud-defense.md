# Bảo vệ phần CRUD Course — walkthrough theo code thực tế

Tài liệu này mô tả **đúng luồng hiện có trong mã nguồn** của chức năng quản lý khóa học dành cho giảng viên. Phạm vi là Course và curriculum đi kèm (section, lesson, video, tài liệu); không bao gồm phân công thành viên hay nghiệp vụ thanh toán.

## 1. Bức tranh tổng quát

CRUD Course không phải một form gửi một lần. Đây là quy trình nhiều bước: tạo bản nháp trước để lấy `courseId`, sau đó lần lượt lưu cấu trúc nội dung, upload media, rồi gửi duyệt. Vì vậy, `courses` là thực thể gốc; `sections`, `lessons`, `lesson_sources` là các thực thể phụ thuộc.

```text
React UI
  │  (Axios + JWT/session đã đăng nhập)
  ▼
CoursesApi.js
  │  HTTP /api/learnova/teacher/courses/...
  ▼
TeacherCourseController / SectionController / LessonController
  │  @PreAuthorize(TEACHER), @Valid, lấy email từ Authentication
  ▼
TeacherCourseService / SectionService / LessonService / LessonSourceService
  │  kiểm tra người sở hữu course, áp quy tắc nghiệp vụ
  ▼
Repository (JPA) ─────► PostgreSQL
  │                         courses, course_categories, sections,
  │                         lessons, lesson_sources, ...
  ├──► CourseIndexService ─► Elasticsearch (chỉ dữ liệu có thể tìm kiếm)
  ├──► NotificationService ─► thông báo admin/giảng viên
  └──► S3 + MediaConvert + AI queue (khi gắn video)
```

Điểm cần nhấn mạnh khi thuyết trình: **PostgreSQL là nguồn dữ liệu chuẩn (source of truth)**. Elasticsearch chỉ là chỉ mục tìm kiếm được đồng bộ sau thay đổi; hỏng đồng bộ tìm kiếm không được phép làm mất bản ghi khóa học trong database.

## 1A. Trace đầy đủ: từ thao tác tạo đến Course hoàn chỉnh

Phần này là đường đi theo đúng thứ tự runtime. Khi bị hỏi “bấm tạo Course thì đi qua file nào?”, hãy đọc từ trên xuống dưới.

### Chặng A — mở form và lấy dữ liệu người dùng nhập

1. **`front_end/src/features/instructor/presentation/teacher/courses/CoursesPage.jsx`**: thao tác tạo điều hướng tới `/learnova/teacher/courses/create`.
2. **`.../create/CourseCreationPage.jsx`**:
   - dòng 48 khởi tạo `useCourseForm({ editCourseId })` — nơi giữ state `course`, `sections` và logic gọi API;
   - dòng 50 khởi tạo `useCourseUpload`;
   - dòng 109 render `CourseInfoStep`, truyền `onNext={handleCourseInfoNext}` ở dòng 117;
   - sau khi Course có ID, dòng 123 render `SectionsStep` với `courseId={course.id}`.
3. **`.../create/components/course-info/CourseInfoStep.jsx`**: chỉ thu thập input và gọi `onCourseChange`; component này không gọi database.
4. **`.../create/hooks/useCourseUpload.js`, `handleThumbnailSelected`**: nếu chọn thumbnail, gọi `generateUploadUrl({type: "THUMBNAIL", ...})`, nhận `uploadUrl`/`fileKey`, dùng `uploadFileToS3` để gửi bytes ảnh trực tiếp lên S3, rồi chỉ ghi `thumbnailKey=fileKey` vào React state. Ở thời điểm này vẫn chưa có dòng Course trong DB.

### Chặng B — nhấn “Tiếp theo”: tạo Course draft

**Điểm khởi phát chính: `useCourseForm.js`.** Chuỗi hàm thực tế là:

```text
CourseInfoStep.onNext
 → handleCourseInfoNext()                 (~ dòng 453)
   → saveCourseDraft()                     (~ dòng 351)
     → buildCoursePayload()                (~ dòng 339)
       → createDraftCourse(payload)        (dòng 360, khi chưa có course.id)
```

- `buildCoursePayload()` tạo JSON: title, description, language, level, basePrice, thumbnailKey, requirements, whatYouLearn, categoryId. Nó lọc giá trị rỗng và ép giá/category về kiểu số.
- `handleCourseInfoNext()` khóa nút bằng `isSubmitting`, đợi request; thành công mới chuyển wizard sang step 2, lỗi thì hiện toast và ở nguyên step 1.

**`front_end/src/features/instructor/infrastructure/api/teacher/CoursesApi.js`, `createDraftCourse` dòng 13** thực hiện:

```text
Axios POST /teacher/courses
      ↓ (AxiosClient thêm tiền tố /api/learnova và thông tin xác thực)
POST /api/learnova/teacher/courses
```

Ví dụ payload có `thumbnailKey`, không có binary file và không có `instructorId`. Owner không do browser quyết định.

### Chặng C — controller: HTTP, role, validation, danh tính đăng nhập

**`back_end/src/main/java/com/example/back_end/instructor/adapter/in/web/TeacherCourseController.java`**, method `createDraftCourse` dòng 32–38:

1. `@PreAuthorize("hasRole('TEACHER')")` ở cấp class (dòng 21) chặn user không phải teacher trước khi method chạy.
2. `@Valid @RequestBody CreateDraftCourseRequest` kiểm tra request theo DTO.
3. `Authentication authentication` lấy email thật bằng `authentication.getName()`.
4. Controller gọi `teacherCourseService.createDraftCourse(request, email)`.
5. Nhận ID rồi trả `CreateDraftCourseResponse(courseId)`.

Controller không tạo entity hoặc SQL; nó chỉ chuyển request hợp lệ và danh tính đã xác thực vào tầng nghiệp vụ.

### Chặng D — service: gán owner, tạo entity, ghi PostgreSQL

**`back_end/src/main/java/com/example/back_end/instructor/application/TeacherCourseService.java`**, method `createDraftCourse` dòng 51–95. Đây là nơi Course được tạo thật:

1. `userRepository.findByEmailAndIsDeletedFalse(email)` đổi email thành entity instructor. Không có user hợp lệ thì ném `ResourceNotFoundException`.
2. `new Course()` và các lệnh `set...` chép field form vào entity.
3. Service tự gán các field không cho client quyết định: `status=DRAFT`, `instructor=instructor`, `isDeleted=false`, `isHidden=false`, `slug=UUID.randomUUID()`, thời gian tạo/cập nhật.
4. `courseRepository.save(course)` gọi JPA ghi INSERT vào bảng `courses`; sau đó `course.getId()` có giá trị thật.
5. `courseIndexService.sync(course)` chạy sau save. Vì Course là `DRAFT`, index service không cho nó nằm trong search công khai.
6. Nếu có `categoryId`: `categoryRepository.findActiveById` kiểm tra category active, tạo `CourseCategoryId(courseId, categoryId)`, rồi `courseCategoryRepository.save(cc)` ghi bảng liên kết `course_categories` với `isPrimary=true`.
7. Service trả `course.getId()`.

**File repository đi kèm:** `back_end/src/main/java/com/example/back_end/course/infrastructure/persistence/CourseRepository.java`. Service gọi `save`; JPA/Hibernate thực thi câu INSERT. **File tìm kiếm:** `.../search/application/CourseIndexService.java`, method `sync` dòng 34; điều kiện index ở 40–42 là PUBLISHED, không deleted, không hidden.

### Chặng E — response trở về UI: mốc “đã tạo Course”

```text
CourseRepository.save(course)
 → TeacherCourseService return courseId
 → TeacherCourseController return { courseId }
 → CoursesApi return response.data
 → useCourseForm dòng 361: setCourse(c => ({ ...c, id: data.courseId }))
 → handleCourseInfoNext: setCurrentStep(2)
 → CourseCreationPage render SectionsStep với courseId thật
```

Đến đây đã có dòng `courses` trạng thái `DRAFT`, có thể có một dòng `course_categories`, và nếu chọn ảnh thì `courses.thumbnail_key` giữ key của ảnh S3. Chưa có section/lesson: đó là chặng kế tiếp, không phải create Course gốc.

### Chặng F — tạo curriculum để Course đầy đủ nội dung

Khi nhấn Tiếp theo ở `SectionsStep`, `CourseCreationPage.jsx` dòng 142 gọi `handleSectionsNext`; trong **`useCourseForm.js`**, method `saveSectionsAndLessons()` đi tuần tự:

1. **Tạo Section:** dòng 373 gọi `createSection(course.id, {title, sectionOrder})`.
   - `CoursesApi.js` dòng 21 → `POST /teacher/courses/{courseId}/sections`.
   - `SectionController.createSection` → `SectionService.createSection(courseId, request, email)`.
   - Service kiểm tra Course thuộc instructor hiện tại, tạo entity Section, `SectionRepository.save`, trả `sectionId`.
2. **Tạo Lesson:** khi đã có `actualSectionId`, dòng 387 gọi `createLesson(actualSectionId, {title, lessonOrder, isPreview})`.
   - `CoursesApi.js` dòng 37 → `POST /teacher/courses/sections/{sectionId}/lessons`.
   - `LessonController.createLesson` → `LessonService.createLesson`.
   - Service lần theo `section → course → instructor` để kiểm tra owner, sau đó `LessonRepository.save` và trả `lessonId`.
3. UI giữ `sectionIdMap`, `lessonIdMap` để thay các ID tạm `temp_*` bằng ID database; chỉ sau đó đặt `isNew=false`.

Thứ tự Course → Section → Lesson không tùy ý: Lesson cần foreign key `sectionId`, Section cần `courseId`. Đó là lý do wizard lưu theo nhiều request.

### Chặng G — video: upload S3 rồi mới HLS/MediaConvert

1. **`.../components/curriculum/VideoUploader.jsx`**, dòng 55–61: gọi `generateUploadUrl({type:"VIDEO"})`, nhận URL/key, rồi `uploadFileWithProgress(uploadUrl, file, setProgress)` trực tiếp lên S3. Giai đoạn này chỉ có file object và `fileKey` ở frontend.
2. **`useCourseForm.js`**, dòng 400: khi lesson mới hoặc `isVideoChanged`, gọi `updateLessonVideo(actualLessonId, {videoKey, videoOriginalFilename, videoContentType, videoSizeBytes, durationSeconds})`.
3. **`CoursesApi.js`**, dòng 53 → `PUT /teacher/courses/lessons/{lessonId}/video`.
4. **`LessonController.updateLessonVideo`** → **`LessonService.updateLessonVideo`** (dòng 91):
   - tìm User/Lesson, kiểm tra `lesson.section.course.instructor.id`;
   - ghi metadata video vào Lesson;
   - đặt HLS `PENDING`, xóa job ID/playlist cũ;
   - gọi `mediaConvertService.createHlsJob(videoKey, lessonId)`;
   - thành công: lưu job ID, HLS `PROCESSING`; lỗi: HLS `FAILED` nhưng Lesson vẫn được save;
   - `lessonRepository.save(lesson)`;
   - dòng 130 gọi `aiGenerationQueueService.queueForVideo(lessonId, videoKey)` tạo hàng đợi Summary/Quiz.

Kết luận chính xác: upload S3 **không tự chạy HLS**. HLS/MediaConvert và AI chỉ bắt đầu khi backend nhận request gắn `videoKey` vào một Lesson mà teacher sở hữu.

### Chặng H — tài liệu bài học, rồi gửi duyệt

- **Tài liệu:** `useCourseForm.js` dòng 412 gọi `createLessonSource` cho từng resource. Chuỗi là `LessonSourceController` → `LessonSourceService` → `LessonSourceRepository`; database lưu record `lesson_sources` (fileKey, tên, type, size), object thực ở S3.
- **Gửi duyệt:** `useCourseForm.handlePublish` dòng 512 → `CoursesApi.updateCourseStatus` dòng 83 → `PATCH /teacher/courses/{id}/status` → `TeacherCourseController.updateCourseStatus` → `TeacherCourseService.updateCourseStatus` dòng 97. Teacher chỉ đặt DRAFT hoặc PENDING_REVIEW; gửi review sẽ tạo notification cho admin. Admin mới có thể approve để Course thành PUBLISHED và đủ điều kiện được index/search công khai.

### Trace CRUD khi Course đã tồn tại

| Nghiệp vụ | Chuỗi file/method thực thi |
|---|---|
| Sửa Course | `useCourseForm.saveCourseDraft` (đã có `course.id`) → `CoursesApi.updateCourse` dòng 88 → `TeacherCourseController.updateCourse` dòng 40 → `TeacherCourseService.updateCourse` dòng 210 → `CourseRepository.save` + `CourseIndexService.sync`. |
| Sửa Section/Lesson | `saveSectionsAndLessons` → `updateSection` / `updateLesson` trong `CoursesApi.js` → `SectionController`/`LessonController` → service tương ứng kiểm tra owner → repository save. |
| Đổi video | `VideoUploader` → `updateLessonVideo` → `LessonService.updateLessonVideo` → HLS/MediaConvert + AI queue. |
| Ẩn/hiện | `CoursesPage` → `toggleCourseVisibility` dòng 100 API → controller → `TeacherCourseService.toggleCourseVisibility` dòng 272 → save + sync index. |
| Xóa mềm | `CoursesPage` → `softDeleteCourse` dòng 94 API → controller → `TeacherCourseService.softDeleteCourse` dòng 254 → `isDeleted=true`, save + gỡ index. |

Lưu ý: các request Course/Section/Lesson/upload là nhiều transaction riêng. Nếu tạo Course thành công nhưng tạo một Lesson thất bại, Course Draft vẫn tồn tại để teacher sửa hoặc retry; code không dùng một transaction toàn cục bao cả upload S3.

## 2. Bản đồ file: đọc từ đâu, mỗi file làm gì

| Tầng | File | Vai trò / đoạn nên mở khi trình bày |
|---|---|---|
| Màn danh sách | `front_end/src/features/instructor/presentation/teacher/courses/CoursesPage.jsx` | Nạp danh sách khóa học của giảng viên; điều hướng tạo/sửa; gọi ẩn/hiện/xóa mềm. |
| Màn tạo/sửa | `front_end/src/features/instructor/presentation/teacher/courses/create/CourseCreationPage.jsx` | Điều phối wizard 4 bước: thông tin, curriculum, preview, publish. |
| Logic form | `front_end/src/features/instructor/presentation/teacher/courses/create/hooks/useCourseForm.js` | Phần quan trọng nhất ở các hàm tạo draft (khoảng dòng 360), lưu section (373), lesson (387), video (400), tài liệu (412), và `handlePublish` (512). |
| Upload UI | `front_end/src/features/instructor/presentation/teacher/courses/create/hooks/useCourseUpload.js` | Xin URL upload ảnh thumbnail rồi upload trực tiếp lên S3. |
| Upload video | `front_end/src/features/instructor/presentation/teacher/courses/create/components/curriculum/VideoUploader.jsx` | Lấy thời lượng video ở trình duyệt, xin presigned URL (55–59), upload có progress (61), trả `fileKey` cho form. |
| Frontend API | `front_end/src/features/instructor/infrastructure/api/teacher/CoursesApi.js` | Bản đồ endpoint: create course dòng 13, section 21, lesson 37, video 53, source 61, status 83, update 88, delete 94, visibility 100. |
| Course HTTP | `back_end/src/main/java/com/example/back_end/instructor/adapter/in/web/TeacherCourseController.java` | Route gốc `/api/learnova/teacher/courses`, chặn role TEACHER (dòng 21), CRUD course (32–75). |
| Nghiệp vụ Course | `back_end/src/main/java/com/example/back_end/instructor/application/TeacherCourseService.java` | Tạo draft (51), gửi duyệt (97), danh sách, cập nhật (210), xóa mềm (254), ẩn/hiện (272). Đây là file cần giải thích sâu nhất ở backend. |
| Curriculum HTTP/service | `.../instructor/adapter/in/web/SectionController.java`, `LessonController.java`, `LessonSourceController.java`; `.../instructor/application/SectionService.java`, `LessonService.java`, `LessonSourceService.java` | CRUD phần/chương, bài học và tài liệu; mọi thao tác lần theo quan hệ lesson → section → course để xác minh chủ sở hữu. |
| Dữ liệu | `back_end/src/main/java/com/example/back_end/course/infrastructure/persistence/CourseRepository.java` | Query danh sách course của teacher có fetch section/lesson/category để tính thống kê mà tránh truy vấn lặp. |
| Tìm kiếm | `back_end/src/main/java/com/example/back_end/search/application/CourseIndexService.java` | `sync` (34): chỉ index course `PUBLISHED`, không bị xóa và không bị ẩn (40–42). |
| Duyệt khóa học | `back_end/src/main/java/com/example/back_end/admin/adapter/in/web/AdminCourseController.java`; `.../admin/application/AdminCourseService.java` | Admin approve/reject. `approveCourse` 81 và đặt `PUBLISHED` tại 89; `rejectCourse` 115 và đặt `REJECTED` tại 123. |
| Video & AI | `.../instructor/application/LessonService.java`; `.../ai/application/AiGenerationQueueService.java` | `updateLessonVideo` (91): đổi trạng thái HLS, gọi MediaConvert rồi tạo hàng đợi AI (130). |

## 3. Các bảng/chủ thể chính

```text
users (giảng viên)
   1 └── n courses
                 1 └── n sections
                              1 └── n lessons
                                           1 └── n lesson_sources

courses  n ─── n categories, qua course_categories
courses  1 ─── n enrollments / reviews (dùng tính chỉ số ở danh sách)
lessons  1 ─── n ai_generation_jobs (sau khi gắn video)
```

- `courses`: thông tin chung, giá gốc, `thumbnailKey`, `status`, `isHidden`, `isDeleted`, `rejectionReason`, mảng yêu cầu/kết quả học.
- `course_categories`: bảng liên kết course–category; service hiện lưu một category chính cho thao tác tạo/cập nhật của teacher.
- `sections`, `lessons`: cấu trúc curriculum có thứ tự (`sectionOrder`, `lessonOrder`).
- `lesson_sources`: metadata tài liệu đính kèm; tệp thực nằm ở object storage, DB giữ `fileKey` và tên hiển thị.
- `enrollments`, `reviews`: không bị sửa trong CRUD Course, nhưng được đọc để tạo chỉ số học viên và rating ở danh sách giảng viên.

## 4. Luồng 0 — mở trang “Khóa học của tôi” (Read)

1. `CoursesPage.jsx` gọi `getMyCourses()` trong `CoursesApi.js`.
2. API gọi `GET /teacher/courses`.
3. `TeacherCourseController.getMyCourses(...)` lấy email từ `Authentication` và gọi `TeacherCourseService.getMyCourses(email)`.
4. Service tìm đúng user bằng email, gọi query trong `CourseRepository` theo `instructorId` và `isDeleted = false`.
5. Query fetch sẵn sections, lessons, category; service batch-load enrollments và lấy projection rating từ `ReviewRepository`.
6. Service map thành `TeacherCoursesResponse`: số lesson active, tổng thời lượng, số học viên, rating, trạng thái, cờ ẩn/xóa và lý do từ chối.
7. Frontend đổi `thumbnailKey` thành URL để hiển thị, sau đó lọc/tìm kiếm ở UI.

Ý nghĩa thiết kế: danh sách không tính từng course bằng nhiều request riêng lẻ. Service gom dữ liệu theo lô để hạn chế vấn đề N+1 query.

## 5. Luồng 1 — tạo Course draft (Create phần gốc)

### 5.1 Từ giao diện đến API

1. Tại bước “Thông tin khóa học”, `useCourseForm.js` gom title, description, language, level, basePrice, thumbnailKey, requirements, whatYouLearn, categoryId.
2. `useCourseUpload.js` chỉ làm upload thumbnail trước. UI gọi `UploadApi.generateUploadUrl`, nhận `uploadUrl` + `fileKey`, upload binary trực tiếp lên S3, rồi form giữ **fileKey**, không nhét file vào request Course.
3. Khi lưu bước đầu, `createDraftCourse(payload)` trong `CoursesApi.js` gửi `POST /teacher/courses`.

### 5.2 Controller và validate

`TeacherCourseController.createDraftCourse`:

- `@PreAuthorize("hasRole('TEACHER')")`: chỉ account mang role TEACHER qua được route.
- `@Valid @RequestBody CreateDraftCourseRequest`: kiểm tra các trường bắt buộc. DTO yêu cầu title, description, language, level; các trường khác được truyền theo payload.
- Không nhận `instructorId` từ frontend. Email lấy từ token/session (`authentication.getName()`), nên client không thể chọn giảng viên khác chỉ bằng cách sửa JSON.

### 5.3 Service và database

Trong `TeacherCourseService.createDraftCourse` (dòng 51):

1. Tìm instructor từ email, đồng thời loại account đã bị xóa.
2. Tạo entity `Course`, gán status mặc định `DRAFT`, `isHidden=false`, `isDeleted=false`, thời gian tạo/cập nhật và slug UUID.
3. `courseRepository.save(course)` để database sinh `courseId`.
4. Nếu có `categoryId`, service tìm category active và tạo `CourseCategory` với khóa ghép `(courseId, categoryId)`, đánh dấu category chính.
5. Gọi `courseIndexService.sync(course)`. Course đang là `DRAFT`, nên index service **xóa/không giữ document tìm kiếm** — nháp không xuất hiện ở search công khai.
6. Trả `CreateDraftCourseResponse(courseId)`; frontend cập nhật `course.id` (dòng 360–361).

Sau khi có ID thật, wizard mới có thể lưu sections và lessons. Đây là lý do không nên đợi đến nút Publish mới tạo toàn bộ: các record con cần khóa ngoại `courseId` trước.

## 6. Luồng 2 — tạo/sửa curriculum (Create/Update các thực thể con)

`useCourseForm.handleSectionsNext` là orchestration ở client. Nó đi theo thứ tự sau:

```text
Course đã có id
  → mỗi Section mới: POST /{courseId}/sections
      → mỗi Lesson mới: POST /sections/{sectionId}/lessons
          → update metadata lesson (nếu cần)
          → PUT /lessons/{lessonId}/video (nếu có video mới)
          → POST /lessons/{lessonId}/sources (mỗi tài liệu)
```

Chi tiết trong `useCourseForm.js`:

- Dòng 373: Section mới được lưu trước và ID tạm trên UI được thay bằng ID database.
- Dòng 387: Lesson chỉ được tạo khi đã có `sectionId` thật.
- Dòng 400: video chỉ được gắn khi lesson mới hoặc `isVideoChanged=true`; tránh xử lý lại video cũ không đổi.
- Dòng 412: duyệt từng resource để tạo `lesson_source`.
- ID `temp_*` chỉ tồn tại lúc người dùng đang dựng cây trên browser; database không nhận ID tạm này.

### Kiểm soát quyền ở curriculum

Role TEACHER ở controller chỉ chứng minh “người gọi là giảng viên”. Service còn kiểm tra quyền trên **tài nguyên cụ thể**:

```text
email hiện tại → User → Course.instructor.id
lesson → section → course → instructor.id
source → lesson → section → course → instructor.id
```

Vì vậy một giảng viên không thể đổi `courseId`, `sectionId`, `lessonId` trên URL để sửa nội dung của người khác; service sẽ từ chối nếu owner không khớp.

### Tính nhất quán cần hiểu đúng

Các request trên là nhiều transaction độc lập: tạo draft thành công nhưng một lesson hoặc file nguồn sau đó lỗi thì draft vẫn tồn tại. Đây không phải lỗi transaction; đó là hệ quả có chủ ý của wizard nhiều bước và upload file ngoài database. UI có lưu draft cục bộ/cho phép thao tác tiếp, nhưng về mặt kỹ thuật cần retry phần lỗi thay vì kỳ vọng rollback toàn bộ Course.

## 7. Luồng 3 — upload video, chuyển mã và hàng đợi AI

1. `VideoUploader.jsx` kiểm tra file và đọc duration tại browser.
2. Nó gọi `generateUploadUrl({ type: "VIDEO", fileName, contentType })`, sau đó `uploadFileWithProgress(uploadUrl, file, setProgress)` — bytes đi thẳng browser → S3, giảm tải cho backend.
3. Kết quả là `fileKey`, tên gốc, duration; form giữ metadata này.
4. Khi lưu curriculum, `CoursesApi.updateLessonVideo` gọi `PUT /teacher/courses/lessons/{lessonId}/video`.
5. `LessonService.updateLessonVideo` (dòng 91) kiểm tra lesson thuộc course của instructor, lưu video metadata vào lesson.
6. Nếu có `videoKey`, service đặt HLS `PENDING`, xóa job/playlist cũ, thử `MediaConvertService.createHlsJob(...)`:
   - thành công: lưu job ID và chuyển `PROCESSING`;
   - lỗi: đặt `FAILED`, log warning; không làm mất lesson.
7. Sau khi lưu lesson, dòng 130 gọi `AiGenerationQueueService.queueForVideo(lessonId, videoKey)` để tạo job Summary và Quiz nếu chưa có cho video đó.

Điểm dễ bị hỏi: **AI không chạy ngay lúc upload S3**. AI được xếp hàng sau request backend gắn `videoKey` vào lesson; như vậy có ownership check và lesson ID làm ngữ cảnh nghiệp vụ. `AiGenerationQueueService` có các trạng thái `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED` và cơ chế phục hồi job bị treo.

## 8. Luồng 4 — chỉnh sửa thông tin Course (Update)

1. Khi vào edit, frontend gọi `getCourseForEdit(courseId)` trong `CoursesApi.js`; route hiện dùng `GET /courses/{courseId}` để lấy dữ liệu dựng form.
2. Người dùng đổi thông tin/thumbnail/level/price/yêu cầu/kết quả/category rồi gọi `updateCourse(courseId, payload)`.
3. `PUT /teacher/courses/{courseId}` vào `TeacherCourseController.updateCourse` (dòng 40).
4. `TeacherCourseService.updateCourse` (dòng 210) tìm user + course, xác minh `course.instructor.id` trùng instructor hiện tại, cập nhật các trường gốc và `updatedAt`, rồi save.
5. Nếu payload có `categoryId`, service xóa liên kết category cũ của course rồi ghi liên kết category chính mới.
6. `CourseIndexService.sync` được gọi; nếu Course đã published và không hidden/deleted thì document search được cập nhật, còn lại bị gỡ khỏi index.

Lưu ý chính xác theo code: `categoryId == null` nghĩa là service **không chạy nhánh thay category**, vì vậy không dùng payload null để hiểu là “xóa category cũ”. Khi bảo vệ, nên nói đây là một giới hạn/điểm cần làm rõ API nếu muốn hỗ trợ bỏ category.

## 9. Luồng 5 — gửi duyệt và vòng đời Course

```text
DRAFT ── teacher PATCH status=PENDING_REVIEW ──► PENDING_REVIEW
                                                │
                           admin approve ───────┼──► PUBLISHED
                           admin reject ────────└──► REJECTED
                                                        │
                                            teacher sửa và gửi lại
                                                        ▼
                                                 PENDING_REVIEW
```

### Teacher gửi duyệt

- Frontend `handlePublish` trong `useCourseForm.js` (dòng 512) lưu các thay đổi còn lại rồi gọi `updateCourseStatus(courseId, "PENDING_REVIEW")`.
- `TeacherCourseService.updateCourseStatus` (dòng 97) chỉ cho teacher đặt `DRAFT` hoặc `PENDING_REVIEW`, theo hằng `TEACHER_SETTABLE_STATUSES` ở dòng 49.
- Khi gửi duyệt, service xóa `rejectionReason`, tạo notification cho các admin, kèm link tới màn approval.
- Teacher **không thể tự gọi status=PUBLISHED**; service trả lỗi nghiệp vụ trước khi save.

### Admin quyết định

- `AdminCourseController` nhận `PATCH /admin/courses-management/{id}/approve` hoặc `/reject`.
- `AdminCourseService.approveCourse` chỉ nhận Course đang `PENDING_REVIEW`, chuyển sang `PUBLISHED`, xóa rejection reason, gửi notification/email cho instructor và đồng bộ index.
- `rejectCourse` cũng chỉ nhận `PENDING_REVIEW`, đặt `REJECTED`, lưu lý do từ request, gửi notification/email để teacher biết cần sửa gì.

Điều này tách bạch quyền tạo nội dung và quyền công bố: teacher sở hữu nội dung, admin sở hữu quyết định public.

## 10. Luồng 6 — ẩn/hiện và xóa (Update/Delete)

### Ẩn/hiện

1. `CoursesPage.jsx` gọi `toggleCourseVisibility(courseId)`.
2. `PATCH /teacher/courses/{courseId}/visibility` vào controller dòng 60.
3. `TeacherCourseService.toggleCourseVisibility` (272) xác minh owner, đảo `isHidden`, save, rồi sync search index.
4. Course published nhưng hidden sẽ bị gỡ khỏi search/public queries; dữ liệu, curriculum và enrollment không bị xóa.

Đây là **soft hide** để tạm ngưng hiển thị nhưng vẫn có thể bật lại.

### Xóa

1. UI gọi `softDeleteCourse(courseId)`; endpoint là `DELETE /teacher/courses/{courseId}`.
2. `TeacherCourseService.softDeleteCourse` (254) xác minh owner, đặt `isDeleted=true`, save, sync index.
3. Course biến mất khỏi danh sách teacher vì repository lọc `isDeleted=false`; document Elasticsearch cũng bị gỡ.

Đây là **xóa mềm**, không phải `DELETE FROM courses`. Các section, lesson, lịch sử enrollment/review không bị xóa vật lý; cách này bảo toàn khả năng audit/khôi phục và tránh vỡ tham chiếu dữ liệu lịch sử.

## 11. Ma trận API ngắn gọn

| Mục đích | Method / endpoint | Controller → service |
|---|---|---|
| Danh sách của tôi | `GET /teacher/courses` | `TeacherCourseController.getMyCourses` → `TeacherCourseService.getMyCourses` |
| Tạo nháp | `POST /teacher/courses` | `createDraftCourse` → `createDraftCourse` |
| Sửa thông tin gốc | `PUT /teacher/courses/{id}` | `updateCourse` → `updateCourse` |
| Gửi duyệt | `PATCH /teacher/courses/{id}/status` | `updateCourseStatus` → `updateCourseStatus` |
| Ẩn/hiện | `PATCH /teacher/courses/{id}/visibility` | `toggleCourseVisibility` → `toggleCourseVisibility` |
| Xóa mềm | `DELETE /teacher/courses/{id}` | `softDeleteCourse` → `softDeleteCourse` |
| Tạo section | `POST /teacher/courses/{courseId}/sections` | `SectionController` → `SectionService` |
| Tạo lesson | `POST /teacher/courses/sections/{sectionId}/lessons` | `LessonController` → `LessonService` |
| Gắn video | `PUT /teacher/courses/lessons/{lessonId}/video` | `LessonController` → `LessonService.updateLessonVideo` |
| Gắn tài liệu | `POST /teacher/courses/lessons/{lessonId}/sources` | `LessonSourceController` → `LessonSourceService` |

Tiền tố `/api/learnova` được khai báo ở backend; frontend Axios dùng phần path sau tiền tố này.

## 12. Câu hỏi phản biện có thể gặp

### “Vì sao không gửi cả course, section, lesson trong một request?”

Vì course, section, lesson có ID thật và quan hệ khóa ngoại. Wizard cần tạo Course để lấy `courseId`, rồi section để lấy `sectionId`, rồi mới gắn lesson/media. Upload video còn là tiến trình dài, nên tách request làm UI có progress và retry tốt hơn. Đổi lại hệ thống chấp nhận tính nhất quán theo từng bước, không phải một transaction toàn cục.

### “Vì sao teacher không tự publish?”

Code giới hạn `TEACHER_SETTABLE_STATUSES` chỉ gồm `DRAFT` và `PENDING_REVIEW`. Chỉ `AdminCourseService.approveCourse` đổi sang `PUBLISHED`. Đây là enforcement tại service, không chỉ là ẩn nút ở UI.

### “Đã có @PreAuthorize rồi, sao còn kiểm tra owner trong service?”

`@PreAuthorize` kiểm tra vai trò; owner check kiểm tra tài nguyên. Hai teacher cùng role, nhưng chỉ teacher tạo Course mới được sửa/xóa Course đó. Thiếu lớp thứ hai sẽ có lỗ hổng IDOR khi đổi ID trên URL.

### “Tại sao draft không lên Elasticsearch?”

`CourseIndexService.sync` chỉ index course published, không hidden và không deleted. Như vậy nháp/chờ duyệt/từ chối không lộ ra tìm kiếm công khai; database vẫn giữ để teacher và admin xử lý.

### “Xóa mềm có lợi gì, có nhược điểm gì?”

Lợi ích: giữ lịch sử, không phá khóa ngoại, có thể khôi phục. Đánh đổi: mọi query phải luôn lọc `isDeleted=false`, và cần cơ chế quản trị/audit nếu muốn dọn dữ liệu lâu dài. Code hiện đã lọc cờ này ở danh sách teacher/public và sync index.

### “Upload trực tiếp S3 có rủi ro gì?”

Lợi ích là backend không phải truyền file lớn. Cần quản trị kỹ presigned URL, content type/size, thời hạn URL và object mồ côi khi người dùng upload rồi bỏ form. Trong code, quyền sở hữu được kiểm tra khi `fileKey` được gắn vào Course/Lesson; endpoint xin upload URL nên được tiếp tục audit/tăng cường authorization/validation ở tầng upload.

### “Nếu Elasticsearch hoặc MediaConvert lỗi thì Course có mất không?”

Không. Course/lesson được lưu ở PostgreSQL trước; `CourseIndexService` coi index là dữ liệu dẫn xuất. Khi tạo HLS thất bại, `LessonService` đặt trạng thái `FAILED` và log lỗi thay vì rollback lesson. Đây là cách tách phần nghiệp vụ lõi khỏi hạ tầng phụ trợ.

## 13. Cách demo an toàn trong buổi bảo vệ

1. Tạo một Course nhỏ, chứng minh nhận `courseId` và trạng thái `DRAFT`.
2. Thêm 1 section, 1 lesson, upload một video/tài liệu nhỏ; chỉ rõ thứ tự ID Course → Section → Lesson.
3. Chỉnh sửa title hoặc category, reload trang để chứng minh dữ liệu đọc lại từ backend.
4. Gửi duyệt: trạng thái thành `PENDING_REVIEW`, teacher không thể tự gửi `PUBLISHED`.
5. Đăng nhập admin để approve: course thành `PUBLISHED`; chỉ lúc này mới đủ điều kiện vào search index/public listing.
6. Thử ẩn rồi bật lại; sau đó xóa mềm để giải thích khác biệt “ẩn” với “xóa”.

Khi trình bày, không nên khẳng định mọi file upload đều được backend quét virus, hay toàn bộ wizard là một transaction atomic — hai điều đó không thể hiện trong flow code hiện tại.
