# Bảo vệ phần Database — LearnOva

Tài liệu này dùng để chuẩn bị cho slide 20: **Thiết kế CSDL PostgreSQL**. Nội dung bám theo migration và entity trong `back_end`.

## 1. Thông điệp cần bảo vệ

> LearnOva dùng PostgreSQL vì bài toán có nhiều quan hệ nghiệp vụ và giao dịch cần tính nhất quán. Thiết kế tách entity theo nghiệp vụ, dùng bảng trung gian cho quan hệ nhiều-nhiều, đặt ràng buộc ở database và chỉ phi chuẩn hóa ở các vị trí có lợi rõ ràng cho đọc dữ liệu, báo cáo hoặc audit.

Không nên nói “database hoàn toàn 3NF”. Cách nói chính xác là:

> Các bảng giao dịch cốt lõi được chuẩn hóa theo nguyên tắc 3NF; hệ thống có một số phi chuẩn hóa có kiểm soát để phục vụ hiệu năng, tổng hợp và audit.

## 2. Các con số phải nắm chắc

- **46 bảng ứng dụng**: đếm theo tên bảng duy nhất được khai báo trong 15 file migration hiện có.
- **60 index statements** trong migration source: gồm index tìm kiếm, index khóa ngoại, partial index và unique index.
- **15 trigger statements** trong migration source: đồng bộ trường dẫn xuất, cập nhật `updated_at` và chặn dữ liệu không hợp lệ.
- **PostgreSQL** là cơ sở dữ liệu giao dịch chính; **Elasticsearch** chỉ phục vụ tìm kiếm khóa học, không thay thế PostgreSQL.

> Lưu ý khi bảo vệ: các migration có một số khai báo idempotent/trùng lặp theo lịch sử phát triển. Vì vậy, trước khi chốt số liệu tuyệt đối trên slide, chạy truy vấn kiểm tra ở đúng database đang demo. Nếu kết quả runtime khác, ưu tiên số runtime và cập nhật slide.

Khi cần kiểm tra trên môi trường thực tế, dùng câu lệnh sau thay vì dựa vào số trong slide:

```sql
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name <> 'flyway_schema_history';
```

## 3. Cách mô tả cấu trúc dữ liệu trong 60 giây

“Schema được chia thành các nhóm dữ liệu: danh tính và phân quyền; catalog khóa học; học tập và đánh giá; thương mại; cùng dữ liệu vận hành như notification, report, support chat, audit và AI jobs.

Các thực thể có vòng đời riêng được tách thành bảng riêng. Ví dụ `Course`, `Section`, `Lesson` mô tả cấu trúc học liệu; `Enrollment` ghi nhận quan hệ người học–khóa học; `Order`, `OrderItem`, `Payment` mô tả giao dịch; `LessonProgress`, `QuizAttempt`, `Certificate` mô tả kết quả học.

Khi một quan hệ có nhiều giá trị ở cả hai phía hoặc cần mang thêm thuộc tính, chúng em dùng bảng trung gian. Ví dụ `Enrollment` vừa nối User với Course, vừa chứa order, ngày đăng ký, phần trăm tiến độ và thời điểm hoàn thành. Đây là lý do không gộp danh sách course vào bảng user hoặc danh sách user vào bảng course.”

## 4. Những lựa chọn thiết kế quan trọng và lý do

### 4.1 Vì sao PostgreSQL, không dùng MongoDB làm database chính?

LearnOva có nhiều giao dịch cần ràng buộc chặt:

- Một user chỉ được enrollment sau khi thanh toán hợp lệ.
- Một review phải thuộc user đã enrollment.
- Một order có nhiều item; mỗi order item không được lặp cùng course trong một order.
- Voucher có giới hạn sử dụng, ngày áp dụng, mức giảm và điều kiện đơn hàng.
- Progress, certificate và payment cần đối chiếu được với user/course/order.

PostgreSQL phù hợp vì có transaction ACID, foreign key, unique/check constraint, enum, trigger và truy vấn join/báo cáo mạnh. Với MongoDB, các quan hệ này thường phải tự kiểm soát trong application hoặc nhúng dữ liệu; điều đó dễ phát sinh dữ liệu lệch khi thanh toán, học tập và báo cáo cùng cập nhật.

MongoDB chỉ hợp hơn nếu dữ liệu chính là document thay đổi rất tự do, ít join và chấp nhận nhất quán lỏng hơn. Đó không phải đặc trưng chính của LearnOva.

### 4.2 Vì sao không dùng một bảng lớn cho User, Course và giao dịch?

Một bảng lớn sẽ lặp lại dữ liệu user/course ở mỗi enrollment, payment hoặc review. Hệ quả là:

- Đổi tên course phải sửa nhiều dòng.
- Có nguy cơ các bản sao không đồng nhất.
- Dữ liệu có rất nhiều cột rỗng vì một bản ghi review không cần cột payment và ngược lại.
- Khó biểu diễn đúng quan hệ một-nhiều và nhiều-nhiều.

Vì vậy, các entity có vòng đời riêng được tách ra: `users`, `courses`, `orders`, `payments`, `reviews`, `notifications`… Đây là cách giảm dư thừa và đưa dữ liệu về các bảng có trách nhiệm rõ ràng.

### 4.3 Vì sao dùng bảng trung gian thay vì lưu mảng ID hoặc chuỗi phân cách?

Các bảng như `user_role`, `course_categories`, `course_tags`, `cart`, `wishlist`, `enrollments`, `promotion_courses` và `user_vouchers` biểu diễn quan hệ nhiều-nhiều.

Không lưu kiểu `course_ids = "1,5,9"` vì:

- Không có foreign key cho từng ID.
- Khó index và truy vấn ngược, ví dụ “ai đã đăng ký course này?”.
- Khó chống trùng lặp và khó thêm thuộc tính cho quan hệ.
- Vi phạm tính nguyên tử của dữ liệu quan hệ.

`Enrollment` là ví dụ quan trọng nhất. Đây không chỉ là bảng nối User–Course, mà còn có `order_id`, `enrolled_at`, `progress_percent`, `completed_at`. Vì quan hệ có dữ liệu riêng nên phải là một entity/bảng riêng.

### 4.4 Vì sao vừa có khóa chính đơn, vừa có khóa ghép?

Các entity có danh tính và vòng đời độc lập dùng khóa chính `BIGINT` sinh tự động, ví dụ User, Course, Order, Payment, Lesson.

Các bảng quan hệ thuần dùng khóa ghép/unique theo cặp, ví dụ User–Role, Course–Tag, User–Voucher. Điều này phản ánh đúng nghiệp vụ: cùng một user không được có cùng một voucher hai lần, và cùng một course không được xuất hiện hai lần trong cùng một order.

Kết hợp hai cách này giúp khóa dễ tham chiếu khi cần, đồng thời chặn bản ghi quan hệ trùng lặp ngay tại database.

### 4.5 Vì sao ràng buộc ở database thay vì chỉ kiểm tra ở backend?

Backend cần validate để trả lỗi thân thiện cho frontend. Nhưng database là điểm cuối cùng bảo vệ dữ liệu vì dữ liệu có thể được ghi từ job, admin tool, migration hoặc một service khác trong tương lai.

Các ví dụ thật trong schema:

- `reviews.rating` chỉ từ 1 đến 5.
- Giá course, payment, order item không âm.
- Voucher không vượt usage limit và thời gian kết thúc phải sau thời gian bắt đầu.
- Một certificate là duy nhất cho một cặp user–course.
- Một lesson có thứ tự duy nhất trong section; một section có thứ tự duy nhất trong course.
- Course chỉ có `published_at` khi trạng thái là `PUBLISHED`.

Nếu chỉ kiểm tra ở API, một đường ghi dữ liệu khác có thể vượt qua rule. Database constraint bảo đảm rule luôn đúng ở mọi đường ghi.

### 4.6 Vì sao dùng trigger?

Trigger được dùng cho các quy tắc cần đúng bất kể dữ liệu được thay đổi từ đâu:

- Chỉ user đã enrollment mới có thể ghi `lesson_progress` hoặc review course.
- `watched_seconds` không được vượt thời lượng lesson.
- Khi lesson được hoàn thành, trigger tính lại `progress_percent` của enrollment.
- Khi order chuyển sang `PAID`, trigger tăng `used_count` của voucher.
- Khi review thay đổi, trigger refresh materialized view tổng hợp rating.
- Các bảng quan trọng tự cập nhật `updated_at`.

Lý do không đặt toàn bộ logic vào trigger: trigger khó quan sát, khó debug và có thể làm write chậm. Vì vậy, trigger chỉ nên giữ invariant ngắn, rõ và mang tính toàn cục; business flow lớn vẫn nằm ở application service.

### 4.7 Vì sao cần nhiều index?

Index không được tạo “cho mọi cột”. Mỗi index đều đổi hiệu năng đọc lấy chi phí ghi và dung lượng.

Các nhóm index hiện có phục vụ truy vấn thật:

- Khóa ngoại thường join: `enrollments.user_id`, `enrollments.course_id`, `payments.order_id`, `order_items.order_id`.
- Màn hình lọc/trạng thái: order status, payout status, course instructor, course level/price.
- Danh sách notification: `(user_id, created_at DESC)` và partial index cho notification chưa đọc.
- Tài khoản active và voucher active: partial index, chỉ index tập dữ liệu hay truy vấn.
- Unique index: email, slug, mã certificate, transaction ID, cặp user–course hoặc order–course.

Không index tất cả cột text hoặc cột ít được dùng để lọc, vì sẽ làm insert/update/delete tốn thêm chi phí.

### 4.8 Vì sao có phi chuẩn hóa nếu nói về 3NF?

3NF giúp giảm dư thừa; nhưng không có nghĩa mọi giá trị dẫn xuất đều phải tính lại từ đầu ở mỗi lần đọc.

Các phi chuẩn hóa có chủ đích:

| Thành phần | Lý do giữ lại |
|---|---|
| `enrollments.progress_percent` | Đọc dashboard/tiến độ nhanh, thay vì đếm lesson hoàn thành mọi lần. Trigger duy trì đồng bộ. |
| `vouchers.used_count` | Kiểm tra quota nhanh khi áp dụng voucher. Chỉ tăng khi order đã `PAID`. |
| `CourseRatingSummary` materialized view | Đọc rating/course nhanh cho catalog. Có trigger refresh khi review đổi. |
| `auditlogs.old_data`, `auditlogs.new_data` dạng JSONB | Audit cần lưu snapshot linh hoạt của nhiều loại entity, không phải dữ liệu giao dịch chính. |
| `courses.requirements`, `courses.what_you_learn` dạng `text[]` | Danh sách hiển thị trên course detail; không cần join/filter từng item ở phiên bản hiện tại. |

Điểm cần nói rõ: đây là trade-off có kiểm soát. Nếu sau này cần filter/analytics sâu trên `requirements` hoặc `what_you_learn`, nên tách chúng thành bảng con.

### 4.9 Vì sao dùng materialized view cho rating?

Catalog thường cần hiển thị average rating và số lượt review của nhiều course cùng lúc. Nếu mỗi lần tải catalog đều `JOIN + GROUP BY reviews`, chi phí tăng theo số review.

Materialized view lưu sẵn kết quả tổng hợp nên đọc nhanh hơn. Đổi lại, dữ liệu cần được refresh sau thay đổi review. Hiện schema dùng trigger refresh. Đây phù hợp với quy mô đồ án; ở quy mô lớn hơn, nên cân nhắc refresh bất đồng bộ hoặc bảng summary được cập nhật incremental để tránh chi phí refresh toàn bộ view trên mỗi thay đổi.

## 5. Các câu hỏi có thể bị hỏi và cách trả lời

## 5A. Những phần chưa thuần chuẩn hóa và lý do giữ lại

Về mặt lý thuyết, chuẩn 3NF xét **functional dependency** trong từng relation. Vì vậy không nên kết luận mọi trường “lặp” đều vi phạm 3NF. Trong LearnOva có hai nhóm cần phân biệt:

1. **Không thuần 1NF**: một cột chứa tập giá trị, ví dụ mảng `text[]`.
2. **Phi chuẩn hóa có kiểm soát**: lưu giá trị dẫn xuất/snapshot để đọc nhanh, audit hoặc giữ lịch sử giao dịch. Các trường này có thể không vi phạm 3NF theo định nghĩa khóa, nhưng tạo dư thừa có chủ đích và cần cơ chế đồng bộ.

### A. `courses.requirements` và `courses.what_you_learn` — không thuần 1NF

Schema hiện tại giữ hai danh sách này trong cột `text[]` của `courses`.

```text
courses(course_id, title, ..., requirements TEXT[], what_you_learn TEXT[])
```

Một thiết kế chuẩn hóa hơn là:

```text
course_requirements(requirement_id, course_id FK, content, display_order)
course_learning_outcomes(outcome_id, course_id FK, content, display_order)
```

**Vì sao chưa tách?** Đây là các bullet hiển thị ở course detail, hiện không cần join, lọc, thống kê hoặc gán lại từng item. `text[]` giúp đọc/ghi form course đơn giản hơn.

**Trade-off:** Cách hiện tại không thuần 1NF vì một cột chứa nhiều giá trị. Nếu tương lai cần tìm “mọi course yêu cầu Java”, phân tích từng outcome hoặc quản lý từng item độc lập, phải tách thành bảng con.

**Cách trả lời ngắn:** “Đây là phi chuẩn hóa ở dữ liệu trình bày, không phải dữ liệu giao dịch. Khi requirement/outcome cần được query như entity độc lập, chúng em sẽ tách bảng.”

### B. `enrollments.progress_percent` — giá trị dẫn xuất được cache

`progress_percent` được lưu trong `enrollments`, trong khi dữ liệu gốc có thể suy ra từ `lesson_progress` và cấu trúc Lesson của Course.

```text
enrollments(user_id, course_id, progress_percent, completed_at, ...)
lesson_progress(user_id, lesson_id, is_completed, watched_seconds, ...)
```

Thiết kế thuần chuẩn hóa hơn có thể bỏ `progress_percent` và tính mỗi lần đọc:

```sql
completed_lessons / total_lessons * 100
```

**Vì sao vẫn lưu?** Dashboard, danh sách “My Courses” và màn hình giảng viên cần đọc tiến độ của nhiều enrollment. Aggregate lại lesson progress ở mỗi request sẽ tốn join và count lặp lại.

**Cơ chế giữ nhất quán:** Trigger `sync_enrollment_progress` chạy khi `lesson_progress.is_completed` thay đổi; trigger tính lại phần trăm và cập nhật `completed_at` khi đạt 100%.

**Trade-off:** Đọc nhanh hơn, nhưng write phức tạp hơn và cần kiểm soát trigger. Đây là cache dữ liệu dẫn xuất; `lesson_progress` vẫn là nguồn dữ liệu chi tiết.

### C. `vouchers.used_count` — counter dẫn xuất

`used_count` nằm trong bảng `vouchers`, trong khi số lượt đã dùng có thể được đếm từ các order đã `PAID` dùng voucher đó.

```text
vouchers(voucher_id, usage_limit, used_count, ...)
orders(order_id, voucher_id, status, ...)
```

Thiết kế thuần hơn:

```sql
SELECT COUNT(*)
FROM orders
WHERE voucher_id = ? AND status = 'PAID';
```

**Vì sao vẫn lưu?** Kiểm tra quota voucher nằm trên đường thanh toán; counter giúp kiểm tra nhanh thay vì count toàn bộ lịch sử order khi nhiều user cùng áp dụng voucher.

**Cơ chế giữ nhất quán:** Trigger `sync_voucher_used_count` chỉ tăng khi order chuyển từ trạng thái khác sang `PAID`, đồng thời check constraint bảo đảm `used_count <= usage_limit`.

**Trade-off:** Có dư thừa giữa Order và Voucher, đổi lại kiểm tra quota nhanh. Nếu về sau có refund làm voucher được hoàn lại quota, cần quy tắc nghiệp vụ và trigger/service xử lý chiều ngược lại rõ ràng.

### D. `CourseRatingSummary` — dữ liệu tổng hợp, không phải source of truth

`CourseRatingSummary` là materialized view tổng hợp từ `reviews`.

```text
reviews(course_id, user_id, rating, comment, ...)
CourseRatingSummary(course_id, avg_rating, review_count, star_1 ... star_5)
```

Thiết kế thuần chuẩn hóa chỉ cần bảng `reviews`, sau đó `GROUP BY` mỗi khi tải catalog.

**Vì sao dùng materialized view?** Catalog hiển thị nhiều course cùng lúc; tính average, count và phân bố sao từ bảng review mỗi lần đọc sẽ tăng chi phí. View là read model được dựng từ source of truth là `reviews`.

**Trade-off:** Đọc nhanh, nhưng phải refresh sau khi review đổi. Hiện schema refresh bằng trigger; ở quy mô cao hơn cần chuyển sang cập nhật incremental hoặc refresh bất đồng bộ.

### E. `auditlogs.old_data` và `auditlogs.new_data` dạng JSONB — audit linh hoạt

```text
auditlogs(audit_log_id, entity_name, entity_id, old_data JSONB, new_data JSONB, ...)
```

Nếu chuẩn hóa tuyệt đối, mỗi loại entity cần bảng audit riêng hoặc mỗi field thay đổi thành một dòng audit. Cách đó tạo rất nhiều bảng/record và khó mở rộng khi thêm entity mới.

**Vì sao dùng JSONB?** Audit log không phải source of truth của nghiệp vụ; mục tiêu là lưu snapshot before/after linh hoạt và truy vết được thay đổi của nhiều entity.

**Trade-off:** JSONB khó enforce schema và join/analytics hơn bảng quan hệ. Vì vậy không dùng JSONB thay cho User, Course, Order hay Payment; chỉ dùng ở lớp audit.

### F. Snapshot giá trong `order_items` — cố ý giữ lịch sử, không nên “chuẩn hóa bỏ đi”

`order_items.original_price` và `order_items.price` trông giống dữ liệu lặp với giá course, nhưng không phải lỗi cần loại bỏ.

```text
courses(course_id, base_price, ...)
order_items(order_id, course_id, original_price, price, ...)
```

Nếu chỉ join sang `courses.base_price`, lịch sử hóa đơn sẽ đổi theo giá course hiện tại. Snapshot tại thời điểm đặt hàng là dữ liệu giao dịch độc lập: nó cho biết người dùng thực sự đã thanh toán bao nhiêu sau khuyến mãi.

**Cách trả lời:** “Đây là temporal data, không phải dữ liệu dư thừa vô ích. Giá hiện tại của course và giá tại thời điểm mua là hai fact khác nhau.”

### G. `payments.amount` — giá trị của giao dịch thanh toán, không tự động là dư thừa

Payment có amount/status/transaction ID riêng vì payment gateway xử lý một giao dịch cụ thể. Không nên coi nó chỉ là bản sao `orders.total_amount`; cần giữ để đối soát callback, thất bại, hoàn tiền hoặc lần thanh toán khác.

## 5B. Bảng nào thực sự chuẩn hóa tốt để lấy làm ví dụ

| Nhóm | Ví dụ | Dẫn chứng chuẩn hóa |
|---|---|---|
| Phân quyền | `users` → `user_role` ← `roles` | Một user có nhiều role và một role thuộc nhiều user; không lặp tên role trong bảng user. |
| Catalog | `courses` → `course_categories` ← `categories`; `courses` → `course_tags` ← `tags` | Category/tag được tái sử dụng giữa nhiều course; bảng trung gian giữ quan hệ. |
| Học tập | `users` → `enrollments` ← `courses` | Enrollment là associative entity, chứa thuộc tính của chính quan hệ như thời điểm đăng ký và order. |
| Nội dung | `courses` → `sections` → `lessons` → `lesson_sources` | Mỗi tầng có khóa và vòng đời riêng; không lặp section/lesson thành các cột trong Course. |
| Quiz | `quizzes` → `quiz_questions` → `quiz_options`; `quiz_attempts` → `quiz_answers` | Tách đề, câu hỏi, lựa chọn và lần làm bài; tránh số cột cố định như question_1, question_2. |
| Thương mại | `orders` → `order_items`; `orders` → `payments` | Order, line item và payment có lifecycle khác nhau; snapshot giá được giữ có chủ đích. |

## 5C. Câu trả lời mẫu khi bị hỏi “Bảng nào không 3NF?”

“Nếu nói chính xác theo lý thuyết, `courses.requirements` và `courses.what_you_learn` là phần không thuần 1NF vì dùng mảng. Còn `progress_percent`, `used_count` và `CourseRatingSummary` là phi chuẩn hóa có kiểm soát: chúng lặp dữ liệu dẫn xuất để tối ưu đọc, nhưng có trigger hoặc view để duy trì đồng bộ. `auditlogs` dùng JSONB vì đây là audit linh hoạt, không phải dữ liệu nghiệp vụ gốc. Ngược lại, giá snapshot trong `order_items` không nên xóa để ‘chuẩn hóa’, vì giá tại lúc mua là dữ liệu lịch sử khác với giá course hiện tại.”

### “46 bảng có quá nhiều cho một ứng dụng học trực tuyến không?”

Không, vì con số này bao gồm cả bảng quan hệ và bảng vận hành. Các bảng chính như User, Course, Lesson, Order là cần thiết; phần còn lại tách các concern có vòng đời riêng như quiz, payment, notification, support chat, audit, AI jobs và các bảng many-to-many. Tách bảng giúp tránh nhồi quá nhiều trách nhiệm vào một bảng.

### “Các bảng này có đạt 3NF không?”

Core transaction tables được thiết kế theo nguyên tắc 3NF: mỗi bảng có khóa, thuộc tính phụ thuộc vào khóa và quan hệ nhiều-nhiều được tách. Tuy nhiên không nói toàn bộ schema thuần 3NF vì có progress percent, used count, materialized view, JSONB và text array. Đây là phi chuẩn hóa có chủ đích cho hiệu năng/audit.

### “Tại sao không tính progress mỗi lần từ LessonProgress?”

Vẫn có thể tính bằng `COUNT` số lesson đã hoàn thành, nhưng dashboard và danh sách course sẽ phải aggregate lặp lại. `progress_percent` là cache dữ liệu dẫn xuất; trigger đồng bộ khi trạng thái hoàn thành lesson thay đổi, nên trade-off là đọc nhanh hơn và vẫn giữ nhất quán.

### “Trigger có làm hệ thống chậm không?”

Có chi phí, đặc biệt trigger aggregate hoặc refresh view. Vì thế trigger chỉ dùng cho invariant cần bảo vệ ở mọi đường ghi. Các trigger hiện tại xử lý các kiểm tra/cập nhật nhỏ; với lưu lượng lớn, materialized view rating là phần cần đánh giá đầu tiên để chuyển sang cập nhật bất đồng bộ hoặc incremental.

### “Tại sao vẫn phải validate ở backend nếu database đã có constraint?”

Hai lớp có vai trò khác nhau. Backend validate request để phản hồi rõ ràng cho UI và kiểm soát flow nghiệp vụ; database constraint bảo vệ dữ liệu cuối cùng khỏi mọi nguồn ghi. Chúng bổ sung cho nhau, không thay thế nhau.

### “Vì sao Enrollment cần order_id?”

Enrollment là quyền học đã được cấp. `order_id` tạo traceability: biết quyền học này đến từ giao dịch nào; hỗ trợ đối soát thanh toán, hoàn tiền hoặc kiểm tra lịch sử. Không nên chỉ lưu User–Course vì sẽ mất ngữ cảnh thương mại.

### “Vì sao Order và Payment tách hai bảng?”

Order là ý định mua và danh sách course; Payment là kết quả/lần xử lý thanh toán từ cổng PayOS. Tách ra để trạng thái thương mại và trạng thái thanh toán không bị trộn. Một order có thể cần theo dõi payment information, transaction ID, amount và status riêng.

### “Làm thế nào để ngăn một user review course chưa mua?”

Trigger `check_review_enrollment` kiểm tra cặp user–course trong `Enrollments` trước khi insert review. Vì check nằm ở database, rule vẫn đúng nếu dữ liệu được ghi từ API, job hoặc công cụ quản trị.

### “Làm thế nào để ngăn progress cho lesson không thuộc khóa user đã mua?”

Trigger `check_lesson_progress_enrollment` tìm course của lesson qua Section, rồi kiểm tra user có Enrollment ở course đó hay không trước khi insert progress.

### “Tại sao dùng enum cho status?”

Enum giới hạn giá trị status ở cấp database, tránh typo hoặc status không hợp lệ. Ví dụ order chỉ nhận `PENDING`, `PAID`, `FAILED`, `CANCELLED`; payment có lifecycle riêng. Khi cần thêm status mới thì migration enum phải được quản lý cẩn thận.

### “Tại sao không dùng status dạng text để linh hoạt hơn?”

Text linh hoạt hơn nhưng dễ có dữ liệu không đồng nhất như `paid`, `PAID`, `success`. Với state machine ít thay đổi và ảnh hưởng giao dịch như order/payment/course, enum an toàn hơn. Nếu trạng thái thay đổi thường xuyên do người dùng tự cấu hình thì lookup table sẽ phù hợp hơn.

### “Tại sao Course dùng text array cho requirements và what-you-learn? Có vi phạm 1NF không?”

Theo định nghĩa nghiêm ngặt, array không thuần 1NF. Chúng em dùng array vì đây là danh sách nội dung hiển thị đơn giản, hiện không có yêu cầu join hay phân tích theo từng item. Đây là một trade-off có chủ đích. Nếu sau này cần tìm kiếm hoặc analytics từng requirement/outcome, sẽ tách thành bảng con có thứ tự.

### “Làm sao tránh trùng course trong giỏ hàng, wishlist hoặc order?”

Các bảng quan hệ có khóa ghép/unique constraint theo cặp user–course hoặc order–course. Constraint này là lớp chặn cuối cùng, kể cả khi request trùng được gửi đồng thời.

### “Tại sao không lưu rating trung bình trực tiếp trong bảng Course?”

Có thể làm vậy, nhưng sẽ tạo một trường dẫn xuất cần đồng bộ thủ công. Materialized view `CourseRatingSummary` tách dữ liệu review gốc khỏi dữ liệu tổng hợp; nhờ đó có thể rebuild summary từ reviews khi cần và đọc catalog nhanh.

### “Nếu trigger lỗi giữa quá trình thanh toán thì sao?”

PostgreSQL thực hiện trigger trong cùng transaction. Nếu trigger fail, transaction bị rollback, tránh trạng thái nửa vời. Ở application layer vẫn cần xử lý retry/idempotency cho webhook và thông báo lỗi phù hợp.

### “Database có hỗ trợ soft delete không?”

Có ở một số entity quan trọng như User, Course, Category, Lesson/Section. Soft delete giúp giữ lịch sử/audit và tránh mất dữ liệu liên quan. Đổi lại, truy vấn phải luôn lọc `is_deleted`; các partial index như user active/course active giúp giảm chi phí cho tập dữ liệu còn hiệu lực.

### “Vì sao không dùng Elasticsearch thay PostgreSQL cho tất cả?”

Elasticsearch tối ưu full-text search, không phải hệ thống transaction có foreign key và ACID như PostgreSQL. PostgreSQL là source of truth; Elasticsearch là search index có thể reindex lại từ dữ liệu course.

### “Nếu số lượng user/course tăng mạnh thì database sẽ mở rộng thế nào?”

Trước tiên đo slow query và kiểm tra index theo query thật; tách read workload cho reporting/search; dùng cache cho dữ liệu đọc nhiều; tối ưu materialized view và pagination. Chỉ khi cần mới cân nhắc read replica, partition bảng lịch sử lớn như audit/notification, hoặc tách service. Không nên nhảy ngay sang sharding khi chưa có số liệu tải.

## 6. Những điểm không nên nói quá

- Không nói database “100% chuẩn 3NF”.
- Không nói trigger là giải pháp cho mọi business logic.
- Không nói 60 index luôn tốt; index có chi phí write và storage.
- Không nói hiện tại đã scale ngang hoặc có high availability database; hạ tầng hiện tại là một PostgreSQL container trên EC2.
- Không nói `watched_seconds` là vị trí phát chính xác; đây là thời lượng đã xem được ghi nhận.
- Không nói chatbot AI có context theo `lessonId`; chatbot hiện có context catalog/course/category/instructor, còn AI summary/quiz được tạo từ video qua job riêng.

## 7. Checklist trước khi bảo vệ

- Xác minh trước buổi bảo vệ: số bảng/index/trigger runtime; slide hiện dùng mốc **46 bảng ứng dụng · 60 index statements · 15 trigger statements** từ migration source.
- Phân biệt **Order status**: `PENDING`, `PAID`, `FAILED`, `CANCELLED`; và **Payment status**: `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`.
- Thuộc hai ví dụ trigger: enrollment trước progress/review; đồng bộ progress sau khi lesson hoàn thành.
- Thuộc hai ví dụ bảng trung gian: `Enrollment` và `CourseCategory`.
- Thuộc một ví dụ phi chuẩn hóa có kiểm soát: `progress_percent` hoặc `CourseRatingSummary`.
- Nếu không chắc một chi tiết, quay về nguyên tắc: source of truth là PostgreSQL; database giữ integrity, backend điều phối business flow, Elasticsearch phục vụ search.
