## Cấu trúc `src`

```text
src/
├── app/
├── assets/
├── features/
├── shared/
├── index.css
└── main.jsx
```
## `src/app` — application shell

`app` là lớp điều phối toàn ứng dụng, không thuộc riêng một domain nghiệp vụ.

```text
app/
├── i18n/
├── interceptors/
├── layouts/
├── providers/
└── routes/
```

### `app/routes/`

- `AppRoutes.jsx`: khai báo toàn bộ route, nested route, layout route và page component.
- `RequireRole.jsx`: kiểm tra authentication/role trước khi cho phép truy cập route.

Các nhóm route hiện có:

- Auth: login, forgot/reset password, OAuth2 callback.
- Public: home, courses, instructors, about, certificate verification.
- User: cart, course detail, profile, apply teacher.
- Admin: dashboard, users, teachers, courses, approval, revenue, reports, vouchers, categories, tags, settings.
- Teacher: overview, courses, promotions, announcements, students, reviews, Q&A, revenue, analytics, profile.
- Payment: success/cancel callback.

Khi move page, phải cập nhật import tại `AppRoutes.jsx`. Không đổi URL route nếu task không yêu cầu đổi behavior.

### `app/providers/`

- `AuthContext.jsx`: lưu và cung cấp authentication state, current user, access token, refresh/logout/login và active role.

Auth UI thuộc `features/auth`, còn auth state cấp ứng dụng thuộc `app/providers`.

### `app/interceptors/`

- `AxiosInterceptor.jsx`: kết nối Axios interceptor với vòng đời React và giữ authentication behavior hiện tại.

Endpoint cụ thể không nên đặt tại đây; endpoint thuộc API module của feature.

### `app/layouts/`

- `layouts/home/HomeLayout.jsx`: layout cho trang public/home.
- `layouts/user/UserLayout.jsx`: layout cho khu vực người dùng.
- `layouts/admin/DashboardLayout.jsx`, `.css`: layout dashboard admin.
- `layouts/teacher/TeacherLayout.jsx`, `.css`: layout portal teacher/instructor.

Layout chịu trách nhiệm về khung trang, sidebar, header và outlet. API call của từng page không nên đặt trong layout.

### `app/i18n/`

- `i18n.js`: khởi tạo i18next/react-i18next.
- `locales/en.json`: bản dịch tiếng Anh.
- `locales/vi.json`: bản dịch tiếng Việt.

Text dùng trong UI nên thêm vào locale thay vì hard-code nếu có khả năng cần dịch.

## `src/features` — nghiệp vụ theo feature

Mỗi feature có thể có một hoặc nhiều lớp sau:

```text
<feature>/
├── infrastructure/       # API client, adapter bên ngoài
├── application/          # hook/use-case điều phối nếu cần
├── domain/               # model/rule thuần nghiệp vụ nếu cần
└── presentation/         # page, component, CSS, UI hook
```

Không bắt buộc mọi feature phải có đủ bốn lớp. Feature nhỏ có thể chỉ có `presentation` hoặc `infrastructure/api`.

### `features/admin/`

Khu vực dành cho admin.

```text
admin/
├── infrastructure/api/
└── presentation/
```

`infrastructure/api/` chứa API cho:

- Admin profile/user.
- Dashboard.
- Category, tag, course.
- Course approval/report.
- Instructor và teacher application.
- Voucher.
- Revenue và transaction.
- Payout API legacy hiện vẫn còn trong frontend nhưng backend đã xóa logic Payout Request; không dùng API này cho code mới.

`presentation/` chứa các màn hình và component admin:

- `dashboard/`: dashboard, statistics, charts, activity/user/teacher rows.
- `course/`: quản lý course, table, filter, statistics cards.
- `courses_approval/`: xem curriculum và duyệt/từ chối course.
- `user_management/`: quản lý user.
- `teacher_management/`: quản lý teacher/instructor.
- `revenue/`: revenue cards, chart, records, transactions, rankings.
- `reports/`: bộ lọc, cards và charts cho report.
- `vouchers/`: voucher campaign, create, history, table và charts.
- `category/`, `tag/`: quản lý category/tag.
- `profile/`, `settings/`: cấu hình tài khoản admin.
- `teacher_application/`: duyệt hồ sơ đăng ký teacher.
- `violation_reports/`: xử lý report/violation.
- `shared/`: component chỉ dùng chung trong admin UI.

Tên file thường là page/component và file `.css` đi kèm chịu trách nhiệm style của component đó.

### `features/auth/`

Authentication và account verification UI/API.

- `presentation/AuthPage.jsx`: page auth chính.
- `presentation/components/login_form/`: login.
- `register_form/`: register.
- `forgot_password/`, `reset_password/`: quên/đặt lại password.
- `verify/`, `modal/verify/`: xác minh tài khoản.
- `oauth2/`, `social_login/`: OAuth2/social login.
- `password_strength/`: password strength UI.
- `infrastructure/api/AuthApi.js`: login, register, logout, refresh, verify, forgot/reset password.

### `features/cart/`

- `infrastructure/api/CartApi.js`: thêm/xóa/sửa/merge cart.
- UI cart hiện được sử dụng trong các page/component thuộc home/user/shared tùy flow hiện tại.

Logic lưu cart phía client nằm trong `shared/utils/cartStorage.js`.

### `features/certificate/`

- `presentation/VerifyCertificatePage.jsx`: page xác minh certificate bằng code.

API certificate được gọi từ module API của course hoặc feature liên quan hiện tại.

### `features/chatbot/` và `features/ai/`

- `chatbot/infrastructure/api/ChatApi.js`: API chatbot/message và stream response.
- `ai/`: feature AI nhỏ dùng cho API/chat integration hiện tại.

UI chatbot được đặt trong các component presentation của home/shared tùy nơi hiển thị.

### `features/course/`

Feature course, catalog và course detail.

- `infrastructure/api/`: API course, curriculum, lesson, enrollment/progress, quiz, review, summary, Q&A, report, voucher, wishlist và certificate theo các endpoint course hiện tại.
- `presentation/user/`: course listing và user-facing course UI.
- `presentation/user/CoursesPage.jsx`: danh sách course.
- `presentation/user/CourseNew.jsx`: course browsing/search UI.
- `presentation/user/courses_detail/`: course detail, video, overview, quiz, review, Q&A, summary.
- `presentation/user/components/`: course card/filter/component dùng trong course page.
- `presentation/user/css/`: CSS riêng của course UI.

Admin course approval và teacher course management nằm ở feature `admin`/`instructor` vì đó là UI theo role, dù chúng thao tác trên domain course.

### `features/home/`

Trang public và các section marketing:

- `Home.jsx`, `Home.css`: page home.
- `hero/`: hero, mockup, trust bar.
- `courses/`: course sections/public course blocks.
- `instructors/`: instructor sections/cards.
- `categories/`: category section.
- `paths/`: learning path section.
- `how_it_work/`: mô tả cách hoạt động.
- `faq/`: FAQ.
- `testimonials/`, `success-stories/`: social proof.
- `final-cta/`: call-to-action cuối trang.
- `cart/`, `payment/`: UI flow cart/payment được render từ public routes.
- `chat_bot/`: chatbot UI trên public page.

### `features/instructor/`

Gồm instructor public và teacher portal.

`infrastructure/api/` chứa:

- Public instructor/profile.
- Follow.
- Teacher dashboard/analytics.
- Teacher course, lesson, section, lesson source.
- Announcement, promotion, review, Q&A, student, revenue.
- Upload và các API teacher liên quan.

`presentation/user/` chứa public instructor list/detail.

`presentation/teacher/` chứa:

- Overview/dashboard.
- Course list/create/edit.
- Promotions.
- Announcements.
- Students.
- Reviews.
- Q&A.
- Revenue.
- Analytics.
- Profile.

Một số tên route cũ có spelling `intructor`; không tự đổi nếu chưa kiểm tra toàn bộ route/link/reference.

### `features/notification/`

- `infrastructure/api/NotificationApi.js`: lấy notification, unread count và thao tác notification.
- UI notification thường nằm trong header/shared component.

### `features/payment/`

- `infrastructure/api/PaymentApi.js`: create payment, lấy payment status, cancel payment và xử lý callback flow.
- `Payment` là payment feature, không được nhầm với Payout Request đã bị xóa ở backend.

### `features/profile/`

- `infrastructure/api/`: profile, user stats, follow và teacher application API.
- `presentation/ProfilePage.jsx`: profile page chính.
- `presentation/components/`: form/sidebar/section dùng cho profile.
- `presentation/profileView/`: profile theo tab.
- `profileView/sections/`: courses, favorites, security và course detail trong profile.
- `profileView/data/`: cấu hình tab và data mapping của profile UI.

### `features/search/`

- `infrastructure/api/SearchApi.js`: tìm kiếm course/public content.

UI search có thể được gọi từ home/header/course feature nhưng API ownership thuộc search.

### `features/teacher-application/`

- `presentation/ApplyTeacherPage.jsx`: user gửi hồ sơ đăng ký teacher.
- API teacher application nằm trong module API liên quan profile/instructor hiện tại.

### `features/user/`

Các page user nhỏ chưa thuộc feature lớn hơn. Khi một nghiệp vụ phát triển đủ lớn, nên chuyển nó sang feature riêng thay vì tiếp tục làm phình `user`.

## `src/shared` — dùng chung

```text
shared/
├── api/
├── api-client/
├── components/
├── hooks/
├── services/
└── utils/
```

### `shared/api-client/`

- `AxiosClient.js`: Axios instance/config dùng chung.

Không đặt endpoint của một domain cụ thể ở đây.

### `shared/api/`

API dùng chung cho nhiều feature, ví dụ:

- Public API được home/course/instructor cùng sử dụng.
- Upload API dùng cho nhiều màn hình.

Nếu API chỉ phục vụ một domain, đặt tại `features/<domain>/infrastructure/api/`.

### `shared/components/`

- `header/`: header user/admin/teacher, navigation, search, language switcher, notification.
- `sidebar/`: sidebar admin và teacher.
- `footer/`: footer public.
- `courses/`: course component dùng ở nhiều feature.
- `payment/PaymentModal.jsx`: modal payment dùng chung.

Chỉ đưa component vào `shared` khi nó thực sự được nhiều feature dùng và không phụ thuộc sâu vào một domain.

### `shared/hooks/`

- `useAuth.jsx`: truy cập `AuthContext`.
- `useAxiosPrivate.js`: Axios request cần authentication.
- `useNotifications.js`: notification hook.
- `useWishlist.js`: wishlist state/API hook.

### `shared/services/`

- `UploadService.js`: upload file, presigned URL và theo dõi progress.

### `shared/utils/`

- `cartStorage.js`: lưu cart local và phát cart update event.
- `dateSeries.js`: tạo chuỗi ngày/dữ liệu chart.
- `textSearch.js`: chuẩn hóa text và hỗ trợ filter/search.

## `src/assets` — tài nguyên tĩnh

```text
assets/
├── image/
├── logo/
└── svg_icon/
```

- `image/`: avatar mặc định, cover, chatbot và ảnh UI.
- `logo/`: logo LearnOva.
- `svg_icon/`: social icon và SVG tĩnh.

Asset không chứa business logic, API hoặc state.

## Luồng hoạt động tổng quát

```text
main.jsx
  ↓
AuthProvider + AxiosInterceptor
  ↓
AppRoutes
  ↓
RequireRole + Layout
  ↓
Feature presentation/page
  ↓
Feature API hoặc shared API
  ↓
AxiosClient
  ↓
Spring Backend
```

Dependency direction nên ưu tiên:

```text
app → features → shared
presentation → application/domain → infrastructure/API
```

Frontend hiện vẫn còn một số import trực tiếp giữa feature do codebase đang trong quá trình tái cấu trúc. Không nên rewrite business logic chỉ để đạt một mô hình textbook-perfect.

## Quy tắc thêm code mới

### Thêm page

1. Xác định feature sở hữu nghiệp vụ.
2. Tạo page trong `features/<feature>/presentation/`.
3. Nếu là route protected, dùng layout và `RequireRole` phù hợp.
4. Cập nhật `app/routes/AppRoutes.jsx`.
5. Giữ nguyên URL nếu không có yêu cầu đổi API/route.

### Thêm API

1. Đặt API module trong `features/<feature>/infrastructure/api/`.
2. Dùng `AxiosClient` hoặc private Axios hook hiện có.
3. Không đặt API feature-specific vào `shared/api-client`.
4. Không đổi request/response contract nếu task chỉ là restructure.

### Thêm component

- Chỉ dùng trong một feature: đặt gần feature đó.
- Dùng ở nhiều feature và không có domain dependency: `shared/components`.
- Header/sidebar/layout: `shared/components` hoặc `app/layouts` theo phạm vi sử dụng.

### Thêm hook/util

- Có logic nghiệp vụ: đặt trong feature sở hữu nó.
- Generic và được nhiều feature dùng: `shared/hooks` hoặc `shared/utils`.
- Tránh tên chung chung như `Helper`, `Manager`, `Data`, `Service` nếu có thể mô tả rõ responsibility.

## Quy ước đặt tên

- React component/page: `PascalCase.jsx`.
- Hook: `useSomething.js` hoặc `useSomething.jsx`.
- API module: `<Domain>Api.js`.
- Utility: tên mô tả responsibility, ví dụ `cartStorage.js`, `dateSeries.js`.
- CSS: đặt gần component/page tương ứng.
- Folder nhiều từ: lowercase kebab-case, ví dụ `teacher-application`.

Một số tên legacy như `intructor`, `summay` hoặc tên folder cũ chỉ nên đổi trong task rename riêng sau khi kiểm tra toàn bộ reference.