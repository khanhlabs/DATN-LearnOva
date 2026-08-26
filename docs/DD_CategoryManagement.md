# Detailed Design As-Is — Category Management

> Phạm vi: màn hình quản trị **Danh mục** tại `/learnova/admin/categories`, gồm tải danh sách, thống kê, tìm kiếm/lọc/phân trang cục bộ, tạo, sửa, ẩn (soft-delete), khôi phục và side effect thông báo hoạt động cho chính admin.  
> Quy ước: **Đã xác minh từ code** = có bằng chứng trực tiếp; **Suy luận từ ảnh và code** = ảnh khớp nhánh render nhưng chưa chạy lại runtime; **Chưa xác minh** = không có đủ bằng chứng trong hai nguồn được phép.

## 1. Thông tin màn hình

| Thuộc tính | Nội dung |
| --- | --- |
| Tên màn hình | Quản lý danh mục / Category Management |
| Mã màn hình | Không tìm thấy mã chính thức; component `Category` |
| Route/URL | `/learnova/admin/categories` |
| Actor | Quản trị viên có `ROLE_ADMIN` |
| Mục đích | Xem, tìm/lọc và quản trị cây danh mục dùng để phân loại khóa học |
| Nguồn phân tích | Ảnh màn hình + FE + BE |
| Loại tài liệu | Reverse-engineered DD – As-Is |
| Mức độ xác minh | Đã xác minh E2E list/create/update/soft-delete/restore và notification; dữ liệu cụ thể 7 bản ghi trong ảnh chưa đối chiếu runtime DB |
| File DD | `docs/DD_CategoryManagement.md` |

## 2. Tổng quan chức năng

- Route được khai báo dưới `RequireRole role="ROLE_ADMIN"` tại `front_end/src/app/routes/AppRoutes.jsx:73,87`; actor không đăng nhập hoặc sai role bị guard FE điều hướng, còn BE bảo vệ `/api/learnova/admin/**` bằng `ROLE_ADMIN` tại `back_end/src/main/java/com/example/back_end/shared/config/SecurityConfig.java:79`.
- Khi mount, `Category` gọi `getAdminCategoriesApi()` và nhận toàn bộ danh mục, gồm active và hidden. FE chuẩn hóa mã hiển thị `CAT-xxx`, trạng thái, tên cha và ngày rồi tính bốn KPI trên dữ liệu đã tải (`Category.jsx:29-52,80-97`).
- Tìm kiếm, lọc trạng thái và phân trang sáu dòng đều chạy trong bộ nhớ FE; mỗi thay đổi search/status đưa trang về 1 (`Category.jsx:99-123`). Không có API search/filter/page.
- Admin có thể mở modal tạo, nhập tên và cha; create luôn active. Admin có thể sửa tên, cha, trạng thái Active/Hidden; chọn Hidden tạo cùng hiệu ứng dữ liệu với soft-delete. Nút thùng rác mở confirmation rồi gọi DELETE để đặt `is_deleted=true` (`Category.jsx:124-213,330-444`).
- Business logic create/update/delete nằm tại `AdminCategoryService`: resolve cha active, sinh slug duy nhất theo truy vấn hiện tại, đặt timestamp và lưu entity `Category` (`AdminCategoryService.java:54-100,104-145`).
- Create/edit thành công cập nhật state, hiện toast và cố POST `/api/learnova/notifications/self`; lỗi ghi notification bị nuốt nên không đảo ngược mutation danh mục (`NotificationApi.js:25-36`). Delete không tạo success toast hoặc self-notification.
- Database đọc/ghi bảng `categories`; quan hệ với khóa học tồn tại qua `course_categories` nhưng các thao tác của màn hình không trực tiếp sửa bảng nối. DELETE là soft-delete nên không kích hoạt FK `ON DELETE` vật lý.
- Không có export/download, checkbox/radio, redirect sau mutation hay dialog thành công riêng. Điểm kết thúc là bảng/state mới, modal đóng sau create/edit, confirmation đóng sau delete, hoặc thông báo lỗi.

## 3. Đối chiếu ảnh với code

| STT | Thành phần trên ảnh | Loại control | File FE | Component/Method | Event/API | Nguồn dữ liệu | Xác minh |
| --: | --- | --- | --- | --- | --- | --- | --- |
| 1 | URL `/learnova/admin/categories` | Route | `AppRoutes.jsx:73,87` | `<Category/>` | route navigation | router | Đã xác minh từ code |
| 2 | Tiêu đề “Danh mục” | Header title | `Header.jsx` + `vi.json` | pathname/title mapping | route | i18n | Đã xác minh từ code |
| 3 | Sidebar “Danh mục” active | Navigation | `SidebarAdmin.jsx`, `SidebarAdmin.css` | `NavLink` | navigate | static/i18n | Đã xác minh từ code |
| 4 | Tổng số danh mục | KPI card | `Category.jsx:41-52,218-231` | `stats.total` | GET list | `categories.length` | Đã xác minh; số 7 là dữ liệu ảnh |
| 5 | Chủ đề đang hoạt động | KPI card | cùng vùng | `stats.active` | none | `!isDeleted` | Đã xác minh; số 7 là dữ liệu ảnh |
| 6 | Chủ đề đã ẩn | KPI card | cùng vùng | `stats.hidden` | none | `isDeleted` | Đã xác minh; số 0 là dữ liệu ảnh |
| 7 | Danh mục gốc | KPI card | cùng vùng | `stats.roots` | none | `parentId == null` | Đã xác minh; đếm cả hidden |
| 8 | “Tìm tên danh mục hoặc danh mục cha...” | Text input | `Category.jsx:233-241` | `searchQuery/setSearchQuery` | `onChange` | người dùng | Đã xác minh từ code |
| 9 | “Tất cả” | Custom select | `Category.jsx:242-247`; `AdminHoverSelect.jsx:15-85` | `statusFilter` | local filter | All/Active/Hidden | Đã xác minh từ code |
| 10 | “Danh mục mới” | Button | `Category.jsx:248-251` | `openCreateModal` | local | static | Đã xác minh từ code |
| 11 | Mã danh mục | Table column | `Category.jsx:255-298` | `displayId` | none | `category_id` -> `CAT-${padStart(3)}` | Đã xác minh |
| 12 | Tên danh mục | Table column | cùng vùng | `name` | none | `categories.name` | Đã xác minh |
| 13 | Danh mục cha | Table column | cùng vùng | `parentName` | none | self join parent | Đã xác minh |
| 14 | Trạng thái | Badge | cùng vùng | `status` | none | `isDeleted` | Đã xác minh |
| 15 | Cập nhật | Date text | cùng vùng | `updatedAt` | none | `updated_at`, format vi-VN | Đã xác minh |
| 16 | Nút bút chì | Icon button | `Category.jsx:274-281` | `openEditModal` | local | row | Đã xác minh |
| 17 | Nút thùng rác | Icon button | `Category.jsx:282-289` | `setConfirmDeleteCategory` | local | row | Đã xác minh |
| 18 | Phân trang | Buttons | `Category.jsx:300-327` | `setCurrentPage` | local | filtered list/pageSize=6 | Đã xác minh từ code; ngoài vùng ảnh |
| 19 | Modal “Tạo danh mục mới” | Dialog | `Category.jsx:330-407` | create branch | POST create | form state | Đã xác minh; ảnh khớp |
| 20 | Category Name | Text input | `Category.jsx:356-367` | `createForm.name` | `onChange` | người dùng | Đã xác minh |
| 21 | Parent Category | Native select | `Category.jsx:54-66,369-377` | `ParentSelect` | `onChange` | active categories, trừ self | Đã xác minh |
| 22 | Create Category | Submit | `Category.jsx:393-403` | `handleSubmitCategory` | POST create | form | Đã xác minh |
| 23 | Modal “Sửa danh mục” / Editing | Dialog | `Category.jsx:330-407` | edit branch | PUT update | selected row | Đã xác minh; ảnh khớp |
| 24 | Status | Native select | `Category.jsx:379-390` | `createForm.status` | `onChange` | Active/Hidden | Đã xác minh; chỉ khi edit |
| 25 | Save Category | Submit | `Category.jsx:393-403` | `handleSubmitCategory` | PUT update | form | Đã xác minh |
| 26 | X, Cancel, click backdrop | Close controls | `Category.jsx:330-338,390-394` | `closeModal` | local | none | Đã xác minh |
| 27 | Delete confirmation | Dialog | `Category.jsx:408-444` | `handleDelete` | DELETE | selected row | Đã xác minh từ code; ảnh không cung cấp nhánh này |
| 28 | EN, chuông, settings, admin | Admin shell | `Header.jsx`, `NotificationBell.jsx` | shell controls | auth/notification | runtime | Code xác minh; badge 34 chưa xác minh |
| 29 | Toast success/error | Message | `Category.jsx:202-209`; `NotificationApi.js:25-36` | toast | mutation result | API/error | Đã xác minh từ code |

Không có download/export, checkbox/radio hoặc table sorting. Từ khóa đã kiểm tra: `export`, `download`, `checkbox`, `radio`, `sort`; thư mục kiểm tra: `front_end/src/features/admin/presentation/category`, `front_end/src/features/admin/infrastructure/api`, `back_end/src/main/java/com/example/back_end/admin`.

## 4. Danh sách source liên quan

### Frontend — thứ tự thực thi

| STT | Layer | Đường dẫn file | Class/Component | Method liên quan | Vai trò |
| --: | --- | --- | --- | --- | --- |
| 1 | Route | `front_end/src/app/routes/AppRoutes.jsx` | AppRoutes | route lines 73,87 | Guard + mount page |
| 2 | Guard | `front_end/src/app/routes/RequireRole.jsx` | RequireRole | component | Kiểm tra auth/role |
| 3 | Layout | `front_end/src/app/layouts/admin/DashboardLayout.jsx` | DashboardLayout | render | Sidebar/Header/Outlet |
| 4 | Navigation | `front_end/src/shared/components/sidebar/sidebar_admin/SidebarAdmin.jsx` | SidebarAdmin | menu render | Link categories |
| 5 | Header | `front_end/src/shared/components/header/admin_header/Header.jsx` | Header | title render | Tiêu đề/shell |
| 6 | HTTP | `front_end/src/shared/api-client/AxiosClient.js` | axiosClient | interceptor/baseURL | HTTP base |
| 7 | HTTP auth | `front_end/src/shared/hooks/useAxiosPrivate.js` | useAxiosPrivate | interceptors | Bearer/refresh |
| 8 | API | `front_end/src/features/admin/infrastructure/api/CategoryApi.js` | API functions | get/create/update/delete | Category endpoints |
| 9 | API | `front_end/src/features/notification/infrastructure/api/NotificationApi.js` | `adminNotifySuccess` | lines 25-36 | Toast + self note |
| 10 | Page | `front_end/src/features/admin/presentation/category/Category.jsx` | Category | lines 18-449 | State/UI/actions |
| 11 | Shared UI | `front_end/src/features/admin/presentation/shared/AdminHoverSelect.jsx` | AdminHoverSelect | lines 15-85 | Status filter |
| 12 | Style | `front_end/src/features/admin/presentation/category/Category.css` | CSS rules | toàn file | Layout/table/modal/responsive |
| 13 | Style | `front_end/src/features/admin/presentation/shared/AdminHoverSelect.css` | CSS rules | lines 1-113 | Filter dropdown |
| 14 | i18n | `front_end/src/app/i18n/locales/vi.json` | categoryAdmin | keys | Vietnamese labels |
| 15 | i18n | `front_end/src/app/i18n/locales/en.json` | categoryAdmin | keys | English labels |

### Backend/Database — thứ tự thực thi

| STT | Layer | Đường dẫn file | Class/Component | Method liên quan | Vai trò |
| --: | --- | --- | --- | --- | --- |
| 1 | Security | `back_end/src/main/java/com/example/back_end/shared/config/SecurityConfig.java` | SecurityConfig | filter chain line 79 | `/admin/**` requires ADMIN |
| 2 | Controller | `back_end/src/main/java/com/example/back_end/admin/adapter/in/web/AdminCategoryController.java` | AdminCategoryController | lines 22-62 | HTTP mapping |
| 3 | Request DTO | `back_end/src/main/java/com/example/back_end/admin/adapter/in/web/dto/AdminCategoryRequest.java` | DTO | fields lines 7-15 | Validate body |
| 4 | Service | `back_end/src/main/java/com/example/back_end/admin/application/AdminCategoryService.java` | AdminCategoryService | lines 27-145 | Rules/transactions/mapping |
| 5 | Repository | `back_end/src/main/java/com/example/back_end/admin/infrastructure/persistence/AdminCategoryRepository.java` | AdminCategoryRepository | lines 12-33 | JPQL/CRUD |
| 6 | Entity | `back_end/src/main/java/com/example/back_end/course/domain/Category.java` | Category | lines 28-67 | ORM `categories` |
| 7 | Response DTO | `back_end/src/main/java/com/example/back_end/admin/adapter/in/web/dto/AdminCategoryResponse.java` | DTO | toàn record/class | JSON response |
| 8 | Exception | `back_end/src/main/java/com/example/back_end/shared/exception/GlobalExceptionHandler.java` | handler | lines 32-117 | 400/403/404/409/500 |
| 9 | Controller side effect | `back_end/src/main/java/com/example/back_end/notification/adapter/in/web/NotificationController.java` | NotificationController | `createSelf`, 45-63 | Self notification |
| 10 | Request side effect | `.../notification/adapter/in/web/dto/SelfNotificationRequest.java` | record | lines 6-10 | Validate note |
| 11 | Service side effect | `.../notification/application/NotificationService.java` | NotificationService | `createForEmail`, 43-61 | Resolve admin/save note |
| 12 | Repository side effect | `.../notification/infrastructure/persistence/NotificationRepository.java` | repository | JpaRepository | Save notification |
| 13 | Entity side effect | `.../notification/domain/Notification.java` | Notification | lines 22-64 | ORM `notifications` |
| 14 | Related entity | `back_end/src/main/java/com/example/back_end/course/domain/CourseCategory.java` | CourseCategory | lines 14-34 | Mapping category-course |
| 15 | Schema | `back_end/src/main/resources/db/migration/V1__initial_schema.sql` | DDL | 654-662,750-754,1706-1726,2652-2704 | Tables/constraints/FK |

## 5. Thiết kế chi tiết UI

| STT | Label hiển thị | Tên trong code | Control | Kiểu dữ liệu | Bắt buộc | Mặc định | Nguồn dữ liệu | Điều kiện hiển thị | Event |
| --: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | KPI tổng/active/hidden/root | `stats.*` | Read-only cards | number | N/A | 0 | normalized list | luôn | none |
| 2 | Search placeholder | `searchQuery` | text input | string | Không | `""` | user | luôn | onChange, page=1 |
| 3 | Tất cả/Active/Hidden | `statusFilter` | custom select | enum string | Không | `All` | static | luôn | onChange, page=1 |
| 4 | Danh mục mới | `openCreateModal` | button | N/A | N/A | enabled | static | luôn | open modal |
| 5 | Bảng 6 cột | `pageItems` | table | array | N/A | empty | GET + local filters | luôn | edit/delete |
| 6 | Phân trang | `currentPage` | button group | integer | N/A | 1 | total filtered/pageSize 6 | khi nhiều trang | set page |
| 7 | Category Name | `createForm.name` | text input | string | Có | empty/create; row name/edit | user/row | modal | onChange |
| 8 | Parent Category | `createForm.parentId` | native select | nullable long-as-string | Không | `null` | active list excluding self, alpha sort | modal | onChange |
| 9 | Status | `createForm.status` | native select | `Active|Hidden` | Có khi edit | row status | static | edit only | onChange |
| 10 | Create/Save | `handleSubmitCategory` | submit button | N/A | N/A | enabled | form | modal | POST/PUT |
| 11 | Cancel/X/backdrop | `closeModal` | buttons/backdrop | N/A | N/A | enabled | static | modal | close/reset |
| 12 | Hide Category | `handleDelete` | destructive button | N/A | N/A | enabled unless deleting | selected row | confirm modal | DELETE |

Chi tiết control:

- Tất cả dữ liệu bảng là read-only. Edit thông qua modal; không có inline edit.
- Name không có `maxLength`, pattern hoặc debounce ở FE. Submit chỉ kiểm tra `trim()` khác rỗng (`Category.jsx:175-178`); BE giới hạn 1..255 và `@NotBlank` (`AdminCategoryRequest.java:7-15`).
- Parent dùng `<select>` native, option root có value rỗng; chỉ danh mục active và khác chính record, sắp xếp `localeCompare`. Không thể hiện cấp sâu và không chặn descendant (`Category.jsx:54-66`).
- Create không có Status; service luôn đặt `isDeleted=false` (`AdminCategoryService.java:60-64`). Edit gửi `isDeleted: status === "Hidden"`.
- Ngày render `toLocaleDateString("vi-VN", {day:"2-digit",month:"2-digit",year:"numeric"})`; null/invalid là `N/A` (`Category.jsx:18-27`).
- Loading hiển thị một row; empty hiển thị message một row. Lỗi load/mutation delete hiển thị paragraph toàn trang; lỗi create/edit hiển thị trong modal và toast.
- Submit disabled khi `isCreating`; delete confirm disabled khi `isDeleting`. Không có giới hạn chiều dài hiển thị được chứng minh trong JSX.

## 6. Điểm bắt đầu và điểm kết thúc

| Luồng | File/Method bắt đầu | Điều kiện bắt đầu | Các layer đi qua | File/Method kết thúc | Kết quả |
| --- | --- | --- | --- | --- | --- |
| Mở màn hình | `AppRoutes.jsx:73,87` | URL + ROLE_ADMIN | guard → layout → Category | `Category.jsx:216-447` | Shell và trạng thái loading |
| Tải dữ liệu | `Category.jsx:80-97` effect | mount | API → controller → service → repository → categories | `setCategories` | KPI/bảng render |
| Search/filter/page | `Category.jsx:99-123` | input/select/page click | FE memo only | `pageItems` | Bảng cục bộ |
| Tạo | `openCreateModal`, `handleSubmitCategory` | name nonblank | FE → POST → service → DB → notification | `closeModal` | row append/toast/note |
| Sửa/khôi phục/ẩn | `openEditModal`, submit | selected row/name valid | FE → PUT → service → DB → notification | replace row/close | row mới/toast/note |
| Ẩn bằng delete | trash → `handleDelete` | confirmation | FE → DELETE → service → DB | local row patch | status Hidden, dialog đóng |
| Đóng modal | X/Cancel/backdrop | modal mở | FE local | reset form | không gọi API |

Không tồn tại luồng thêm/sửa/xóa vật lý, export/download hoặc sort server-side trên màn hình.

## 7. Luồng khởi tạo màn hình

1. Router match `/learnova/admin/categories` và `RequireRole` kiểm tra `ROLE_ADMIN` (`AppRoutes.jsx:73,87`; `RequireRole.jsx`).
2. `DashboardLayout` render shell và `<Outlet/>`; `Category` được khởi tạo.
3. State được tạo: list/loading/error, search/status/page, modal/edit/form, confirmation và processing flags (`Category.jsx:68-78,124-130`).
4. `useEffect` chạy một lần theo `axiosPrivate` (`80-97`).
5. FE gọi `getAdminCategoriesApi(axiosPrivate)` → GET `/admin/categories-management` (`CategoryApi.js:3-6`). Axios base ghép thành `/api/learnova/admin/categories-management`.
6. Security yêu cầu authenticated admin; `AdminCategoryController.getAllCategories()` nhận GET (`AdminCategoryController.java:26-30`).
7. GET không có request DTO/field validation; permission nằm trong SecurityConfig.
8. Controller gọi `AdminCategoryService.getAllCategories()` trong transaction read-only (`AdminCategoryService.java:34-39`).
9. Service gọi `AdminCategoryRepository.findAllForAdmin()`.
10. JPQL `SELECT c FROM Category c LEFT JOIN FETCH c.parent ORDER BY c.id ASC` đọc `categories` và self join parent (`AdminCategoryRepository.java:17-18`). Không lọc `isDeleted`.
11. Service map từng entity sang `AdminCategoryResponse` gồm id/name/slug/parent/isDeleted/timestamps (`AdminCategoryService.java:111-118`).
12. Controller trả HTTP 200 JSON array.
13. FE kiểm tra `Array.isArray`; map `normalizeCategory`, nếu không phải array thì dùng `[]` (`Category.jsx:86-88`).
14. Memo tính KPI/filter/page; UI render cards/table/empty/pagination.
15. Nếu lỗi, effect đặt `error` từ `response.data.message` hoặc “Failed to load categories.” và kết thúc loading (`89-94`). Không retry tự động.

## 8. Luồng từng thao tác

### 8.1 Tìm kiếm, lọc trạng thái và phân trang

| Bước | Layer | File | Method | Input | Xử lý | Output/Chuyển tiếp |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | UI | `Category.jsx:233-247` | setters | query/status | lưu state, reset page 1 | rerender |
| 2 | FE logic | `Category.jsx:99-114` | `filteredCategories` | list + filters | lowercase contains trên displayId/name/parentName; status equality | filtered array |
| 3 | FE logic | `Category.jsx:116-123` | page memo | currentPage | slice pageSize=6 | table rows |

Không có FE validation, API, BE, DB, popup hoặc message riêng. Empty result hiển thị empty-row branch của table.

### 8.2 Tạo danh mục

| Bước | Layer | File | Method | Input | Xử lý | Output/Chuyển tiếp |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | UI | `Category.jsx:150-155` | `openCreateModal` | click | reset `{name:"",parentId:null,status:"Active"}` | modal create |
| 2 | FE validate | `Category.jsx:175-178` | submit | form | trim; blank → “Category name is required” | dừng hoặc API |
| 3 | FE API | `CategoryApi.js:13-16` | `createAdminCategoryApi` | `{name,parentId}` | POST `/admin/categories-management/create` | controller |
| 4 | Controller | `AdminCategoryController.java:42-47` | create | `@Valid AdminCategoryRequest` | validation then service | 201 response |
| 5 | Service | `AdminCategoryService.java:54-67` | create | request | resolve active parent, slug, active/timestamps | repository.save |
| 6 | Repository/DB | `AdminCategoryRepository`; `Category` | save | entity | INSERT `categories` | saved entity |
| 7 | FE | `Category.jsx:195-203` | state update | response | append normalized row; call notify helper | toast/note |
| 8 | Side effect | `NotificationApi.js:25-36` | `adminNotifySuccess` | title/content/path | toast; POST `/notifications/self`; failure swallowed | close modal |

Thất bại: validation BE 400, duplicate DB 409 hoặc generic 500; FE lấy `data.message` nếu có, hiển thị modal error và toast, giữ modal mở. `isCreating` được reset trong `finally`.

### 8.3 Sửa tên/cha và ẩn/khôi phục bằng Status

| Bước | Layer | File | Method | Input | Xử lý | Output/Chuyển tiếp |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | UI | `Category.jsx:157-166` | `openEditModal` | row | copy name/parent/status | edit modal |
| 2 | FE validate/API | `Category.jsx:175-193` | submit | name,parentId,status | blank check; PUT payload có `isDeleted` | controller |
| 3 | Controller | `AdminCategoryController.java:49-54` | update | id + `@Valid` body | call service | HTTP 200 |
| 4 | Service | `AdminCategoryService.java:69-91` | update | id/request | find any; reject self-parent; resolve active parent; optionally regenerate slug/status; updatedAt | save |
| 5 | DB | repository/entity | save | category | UPDATE `categories` | response DTO |
| 6 | FE | `Category.jsx:191-203` | replace + notify | response | replace same id; toast/self-note | modal closes |

Nếu id không tồn tại hoặc parent hidden/not found: `ResourceNotFoundException` → 404. Self-parent: business error → 400. Duplicate name/slug constraint: 409. FE hiển thị message/toast và giữ modal.

### 8.4 Ẩn bằng nút thùng rác

| Bước | Layer | File | Method | Input | Xử lý | Output/Chuyển tiếp |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | UI | `Category.jsx:282-289,408-444` | confirm state | row | mở dialog | confirmation |
| 2 | FE API | `Category.jsx:131-148`; `CategoryApi.js:23-26` | `handleDelete` | category id | DELETE `/delete/{id}` | controller |
| 3 | Controller | `AdminCategoryController.java:56-61` | delete | path id | service; return 204 | service |
| 4 | Service | `AdminCategoryService.java:93-100` | delete | id | find any, set deleted true, updated now | save |
| 5 | DB | repository | save | entity | UPDATE `is_deleted`, `updated_at` | 204 |
| 6 | FE | `Category.jsx:135-141` | local patch | no body | set `isDeleted=true,status=Hidden`; close | table/KPI rerender |

FE không cập nhật local `updatedAt` từ server vì DELETE không trả body, không reload list, không success toast và không self-notification. Lỗi đóng confirmation và đặt global error.

### 8.5 Đóng modal/dialog

X, Cancel hoặc click backdrop gọi `closeModal`/setter; reset error, editing record và form. Không gọi API, không thay DB. Trong lúc submit, nút submit bị disabled; code không chặn rõ click backdrop/X/Cancel nên modal có thể đóng trong khi request vẫn chạy.

## 9. API specification

| API | HTTP method | Nơi gọi | Controller | Request | Response | Mục đích |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/learnova/admin/categories-management` | GET | `CategoryApi.js:3-6` | `getAllCategories` | none | `List<AdminCategoryResponse>` 200 | tải all |
| `/api/learnova/admin/categories-management/create` | POST | `CategoryApi.js:13-16` | `createCategory` | `AdminCategoryRequest` | response 201 | tạo active |
| `/api/learnova/admin/categories-management/update/{id}` | PUT | `CategoryApi.js:18-21` | `updateCategory` | path id + DTO | response 200 | sửa/ẩn/restore |
| `/api/learnova/admin/categories-management/delete/{id}` | DELETE | `CategoryApi.js:23-26` | `deleteCategory` | path id | 204 no body | soft-delete |
| `/api/learnova/notifications/self` | POST | `NotificationApi.js:25-36` | `NotificationController.createSelf` | title/content/link | `NotificationResponse` 200 | admin activity note sau create/edit |

Chi tiết chung:

- Header: request qua `axiosPrivate`, Bearer token được interceptor gắn; JSON body cho POST/PUT. Không có query parameter.
- GET list không có paging/filter. Response fields: `id`, `name`, `slug`, `parentId`, `parentName`, `isDeleted`, `createdAt`, `updatedAt` (`AdminCategoryResponse`).
- Create body thực tế FE: `{name: string đã trim, parentId: number|null}`. `isDeleted` vắng; service buộc false.
- Update body: `{name, parentId, isDeleted}`; id là path param. DTO: name `@NotBlank @Size(min=1,max=255)`, parent/status nullable.
- Permission: category APIs match `ROLE_ADMIN`; notification self còn có `@PreAuthorize("hasRole('ADMIN')")` (`NotificationController.java:46-49`).
- Success: 200 list/update/note; 201 create; 204 delete. FE dùng body list/create/update, bỏ body note, DELETE không cần body.
- Failure: 401 unauthenticated, 403 forbidden; 400 validation/business; 404 category/parent/user; 409 integrity; 500 generic. Mapping ở `GlobalExceptionHandler.java:32-117`.
- `GET /{id}` và `GET /{id}/children` có trong controller/API nhưng `Category.jsx` không gọi; được ghi là code liên quan gián tiếp, không thuộc runtime hiện tại.

## 10. Backend processing

| Layer | File | Class | Method | Input | Xử lý | Gọi tiếp | Output |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Security | `shared/config/SecurityConfig.java` | SecurityConfig | filterChain | JWT/request | require ADMIN | controller | allow/401/403 |
| Controller | `AdminCategoryController.java:26-61` | controller | GET/POST/PUT/DELETE | HTTP/DTO/id | status mapping | service | ResponseEntity |
| Validation | `AdminCategoryRequest.java:7-15` | DTO | Bean Validation | JSON | name not blank, <=255 | handler/service | 400 or DTO |
| Business | `AdminCategoryService.java:34-100` | service | list/create/update/delete | DTO/id | rules/map/timestamps | repository | DTO/list/void |
| Parent validation | same `104-109` | service | `resolveParent` | parentId/selfId | root/null; reject self; parent must active | repository | Category/null |
| Slug | same `120-145` | service | normalize/unique | name/id | normalize + numeric suffix | count queries | string |
| Persistence | `AdminCategoryRepository.java:12-33` | repository | custom JPQL/save | entity/criteria | SELECT/INSERT/UPDATE | DB | entity/list/count |
| Response mapper | `AdminCategoryService.java:111-118` | service | `toResponse` | entity | flatten parent | controller | DTO |
| Exception | `GlobalExceptionHandler.java:32-117` | advice | handlers | exception | map status/body | HTTP | ErrorResponse |
| Note controller | `NotificationController.java:45-63` | controller | `createSelf` | auth + DTO | type GENERIC/source metadata | service | 200 |
| Note service | `NotificationService.java:43-61` | service | `createForEmail` | email/note | find active user; build/saveAndFlush | repositories | response |

Transactions: service class/category mutation methods dùng Spring `@Transactional`; list là read-only. NotificationService có class-level transaction. Mỗi HTTP category request và request self-note là hai transaction tách biệt; lỗi self-note không rollback category vì FE đã nhận success và catch lỗi note.

## 11. Database và query

| Bảng | Cột sử dụng | Mục đích | Thao tác | File/Method truy cập |
| --- | --- | --- | --- | --- |
| `categories` | `category_id,name,slug,parent_id,created_at,updated_at,is_deleted` | dữ liệu màn hình | SELECT/INSERT/UPDATE | repository/service/entity |
| `categories` self relation | `parent_id -> category_id` | tên/quan hệ cha | LEFT JOIN/lookup active | `findAllForAdmin`, `resolveParent` |
| `course_categories` | `course_id,category_id,is_primary` | quan hệ hiện hữu | Không thao tác bởi màn hình | `CourseCategory`/DDL |
| `notifications` | id,user,title,content,type,link,metadata,is_read,created_at | self-note create/edit | INSERT | `NotificationService.createForEmail` |
| `users` | email/id/deleted | resolve current admin cho note | SELECT | `UserRepository.findByEmailAndIsDeletedFalse` |

Query/constraint cụ thể:

- List: `SELECT c FROM Category c LEFT JOIN FETCH c.parent ORDER BY c.id ASC`; không WHERE, GROUP BY hoặc paging (`AdminCategoryRepository.java:17-18`).
- Parent: `WHERE c.id=:id AND c.isDeleted=false`; hidden parent bị coi như không tồn tại cho create/update (`20-21`).
- Slug count: `WHERE c.slug=:slug AND c.isDeleted=false`, update thêm `c.id != :id` (`29-33`).
- Save do JPA sinh INSERT/UPDATE. Delete không phát SQL DELETE; service set flag rồi save.
- DDL `categories`: name/slug NOT NULL, timestamps NOT NULL/default, `is_deleted` NOT NULL/default false, identity PK (`V1__initial_schema.sql:654-674`).
- DB đặt UNIQUE toàn bảng cho cả `name` và `slug` (`1706-1726`), không loại hidden.
- Self FK parent dùng `ON DELETE SET NULL` (`2652-2656`); không kích hoạt khi soft-delete.
- `course_categories` có PK `(course_id,category_id)`, FK category `ON DELETE CASCADE` (`750-754,1762-1766,2692-2704`); cũng không kích hoạt bởi soft-delete.
- Null: `parent_id` nullable đại diện root. UI dùng `—`; DTO parentName nullable. Empty list trả `[]`; FE KPI 0 và empty row.
- Duplicate: DB quyết định cuối cùng bằng unique name/slug; handler trả 409 generic. Service chỉ chủ động suffix slug, không chủ động check unique name.

## 12. Mapping dữ liệu FE–BE–DB

| Dữ liệu | UI field | FE variable | Request field | Backend DTO | Service/Repository | Table.Column | Response field | UI hiển thị |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ID | Mã danh mục | `id/displayId` | path id update/delete | path Long | find by id | `categories.category_id` | `id` | `CAT-001` |
| Tên | Tên/Category Name | `name/createForm.name` | `name` | request.name | setName | `categories.name` | `name` | text |
| Slug | không có input | `slug` | none | none | normalize/unique | `categories.slug` | `slug` | không render table |
| Cha | Danh mục cha | `parentId,parentName` | `parentId` | request.parentId | resolve active parent | `categories.parent_id` | parentId/name | tên hoặc `—` |
| Trạng thái | badge/Status | `isDeleted/status` | `isDeleted` update | request.isDeleted | set flag | `categories.is_deleted` | `isDeleted` | Active/Hidden |
| Ngày tạo | không ở table | `createdAt` | none | none | now/create | `created_at` | `createdAt` | không render |
| Ngày cập nhật | Cập nhật | `updatedAt` | none | none | now/create/update/delete | `updated_at` | `updatedAt` | dd/mm/yyyy |
| Note title | toast/bell | literal | `title` | SelfNotificationRequest.title | createForEmail | `notifications.title` | title | bell sau refresh/event |
| Note link | current page | pathname | `link` | request.link | save | `notifications.link` | link | notification navigation |

## 13. Business rule rút ra từ code

| ID | Business rule hiện tại | Điều kiện | File/Method | Khi đúng | Khi sai | Mức xác minh |
| --- | --- | --- | --- | --- | --- | --- |
| BR-01 | Chỉ admin truy cập API | ROLE_ADMIN | SecurityConfig:79 | xử lý | 401/403 | Đã xác minh |
| BR-02 | List admin gồm active và hidden, theo id tăng | GET | repository:17-18 | trả all | `[]` | Đã xác minh |
| BR-03 | Create luôn active | create | service:60-64 | `isDeleted=false` | N/A | Đã xác minh |
| BR-04 | Parent phải active | parentId != null | service:104-109 | gán parent | 404 | Đã xác minh |
| BR-05 | Không được chọn chính mình làm cha | parentId==selfId | service:104-107 | 400 | tiếp tục | Đã xác minh |
| BR-06 | Slug sinh từ tên, suffix nếu query thấy active trùng | create/name change | service:120-145 | unique candidate | increment | Đã xác minh |
| BR-07 | Update chỉ đổi slug khi `name.equals` thay đổi | name khác case-sensitive | service:77-81 | sinh lại | giữ slug | Đã xác minh |
| BR-08 | `isDeleted` update chỉ áp dụng nếu field không null | request nonnull | service:83-85 | set | giữ cũ | Đã xác minh |
| BR-09 | DELETE là soft-delete và cập nhật thời gian | valid id | service:93-100 | flag true/save | 404 | Đã xác minh |
| BR-10 | KPI root đếm mọi record có parentId null, kể cả hidden | list | Category.jsx:41-52 | count | N/A | Đã xác minh |
| BR-11 | Search match mã/tên/tên cha, không phân biệt hoa thường | query | Category.jsx:99-114 | giữ row | loại row | Đã xác minh |
| BR-12 | Parent dropdown chỉ active, trừ self, sắp xếp alphabet | modal | Category.jsx:54-66 | option | không option | Đã xác minh |
| BR-13 | Create/edit success tạo toast trước, note best-effort sau | success | NotificationApi.js:25-36 | note có thể lưu | lỗi note bị nuốt | Đã xác minh |

## 14. Validation, permission và message

| Loại | Điều kiện | FE/BE | File/Method | Mã/Nội dung message | Hành vi |
| --- | --- | --- | --- | --- | --- |
| Route permission | auth/role | FE | `RequireRole.jsx` | redirect theo code guard | không mount page |
| API permission | không ADMIN | BE | `SecurityConfig.java:79` | 401/403 | chặn controller |
| Name blank | `!name.trim()` | FE | `Category.jsx:175-178` | `Category name is required` | giữ modal |
| Name constraint | blank hoặc >255 | BE | `AdminCategoryRequest` | Bean Validation | 400 field errors |
| Self parent | parent=self | BE | service:104-107 | business exception | 400 |
| Parent invalid/hidden | không find active | BE | service:108-109 | Category not found | 404 |
| Category invalid | id không tồn tại | BE | update/delete | Category not found | 404 |
| Duplicate | unique name/slug | DB/BE | DDL + handler | `Duplicate value violates a unique constraint` | 409 |
| Load error | GET fail | FE | effect catch | API message/`Failed to load categories.` | global error |
| Create/update error | mutation fail | FE | submit catch | API message/`Failed to ... category.` | inline + toast |
| Create/update success | mutation OK | FE | notify helper | `Category ... successfully!` | toast + best-effort note |
| Delete confirmation | trash click | FE | modal | “Hide category?” / explanatory text | cancel or DELETE |
| Delete error | DELETE fail | FE | handleDelete catch | API message/`Failed to hide category.` | dialog closes/global error |
| Notification DTO | blank/too long | BE | SelfNotificationRequest | title<=200, content<=2000, link<=500 | 400; FE swallows |
| Unexpected | uncaught | BE | GlobalExceptionHandler | generic internal error | 500 |

DB validation bổ sung: name/slug/timestamps/is_deleted NOT NULL; name và slug UNIQUE; parent FK. Không tìm thấy FE validation max 255, descendant-cycle validation, duplicate-name precheck hoặc confirmation cho edit/restore.

## 15. Mermaid sequence toàn bộ màn hình

```mermaid
sequenceDiagram
    actor Admin
    participant UI as "Category.jsx"
    participant CatAPI as "CategoryApi.js"
    participant Ctrl as "AdminCategoryController"
    participant Svc as "AdminCategoryService"
    participant Repo as "AdminCategoryRepository"
    participant DB as "categories"
    participant NoteAPI as "NotificationApi.adminNotifySuccess"
    participant NoteCtrl as "NotificationController.createSelf"
    participant NoteSvc as "NotificationService.createForEmail"
    participant NoteDB as "users + notifications"

    Admin->>UI: Mở /learnova/admin/categories
    UI->>CatAPI: getAdminCategoriesApi(axiosPrivate)
    CatAPI->>Ctrl: GET /api/learnova/admin/categories-management
    Ctrl->>Svc: getAllCategories()
    Svc->>Repo: findAllForAdmin()
    Repo->>DB: SELECT + LEFT JOIN parent ORDER BY id
    DB-->>Repo: Category[]
    Repo-->>Svc: entities
    Svc-->>Ctrl: List<AdminCategoryResponse>
    Ctrl-->>CatAPI: 200 JSON
    CatAPI-->>UI: normalize + setCategories
    UI-->>Admin: KPI/filter/table/page

    alt Tạo danh mục
        Admin->>UI: Submit name,parentId
        UI->>CatAPI: createAdminCategoryApi(payload)
        CatAPI->>Ctrl: POST /create
        Ctrl->>Svc: createCategory(request)
        Svc->>Repo: findActiveById/countBySlug/save
        Repo->>DB: SELECT/INSERT
        DB-->>Ctrl: saved response
        Ctrl-->>UI: 201 AdminCategoryResponse
    else Sửa/ẩn/khôi phục
        Admin->>UI: Submit id,name,parentId,isDeleted
        UI->>CatAPI: updateAdminCategoryApi(id,payload)
        CatAPI->>Ctrl: PUT /update/{id}
        Ctrl->>Svc: updateCategory(id,request)
        Svc->>Repo: findByIdForAdmin/resolve/count/save
        Repo->>DB: SELECT/UPDATE
        DB-->>UI: 200 AdminCategoryResponse
    else Nút thùng rác
        Admin->>UI: Confirm Hide Category
        UI->>CatAPI: deleteAdminCategoryApi(id)
        CatAPI->>Ctrl: DELETE /delete/{id}
        Ctrl->>Svc: deleteCategory(id)
        Svc->>Repo: findByIdForAdmin + save
        Repo->>DB: UPDATE is_deleted=true
        DB-->>UI: 204 No Content
    end

    opt Create/Edit thành công
        UI->>NoteAPI: adminNotifySuccess(title,content)
        NoteAPI-->>Admin: toast.success
        NoteAPI->>NoteCtrl: POST /api/learnova/notifications/self
        NoteCtrl->>NoteSvc: createForEmail(authentication.name,...)
        NoteSvc->>NoteDB: SELECT users; INSERT notifications
        NoteDB-->>NoteAPI: 200 NotificationResponse
        NoteAPI-->>UI: dispatch notification change
    end
    UI-->>Admin: Bảng/KPI mới hoặc error message
```

## 16. Mermaid flowchart

```mermaid
flowchart TD
    A([Mở /learnova/admin/categories]) --> B{RequireRole ROLE_ADMIN}
    B -- Không --> X[Redirect / 401-403] --> Z([Kết thúc thất bại])
    B -- Có --> C[Category useEffect]
    C --> D[GET /api/learnova/admin/categories-management]
    D --> E[AdminCategoryService.getAllCategories]
    E --> F[findAllForAdmin: categories LEFT JOIN parent]
    F --> G{Có dữ liệu?}
    G -- Không --> H[Empty row, KPI 0]
    G -- Có --> I[normalize, KPI, filter, page]
    H --> J{Thao tác}
    I --> J
    J -- Search/filter/page --> K[filteredCategories/pageItems]
    K --> J
    J -- Create/Edit --> L{name.trim không rỗng?}
    L -- Không --> M[Inline error: Category name is required] --> J
    L -- Có --> N[POST create hoặc PUT update]
    N --> O[Bean Validation + ROLE_ADMIN]
    O --> P[resolveParent + generateUniqueSlug]
    P --> Q[(INSERT/UPDATE categories)]
    Q --> R{DB/API thành công?}
    R -- Không --> S[400/404/409/500 + toast/error] --> J
    R -- Có --> T[Update FE state + toast]
    T --> U[POST /notifications/self]
    U --> V{Note thành công?}
    V -- Có --> W[(INSERT notifications)]
    V -- Không --> Y[Catch im lặng]
    W --> AA[Đóng modal]
    Y --> AA
    J -- Delete --> AB[Confirmation]
    AB -- Cancel --> J
    AB -- Confirm --> AC[DELETE /delete/{id}]
    AC --> AD[set is_deleted=true, updated_at=now]
    AD --> AE[(UPDATE categories)]
    AE --> AF{204?}
    AF -- Có --> AG[Patch local status Hidden; đóng dialog]
    AF -- Không --> AH[Global error; đóng dialog]
    AA --> END([Kết thúc thành công])
    AG --> END
    AH --> Z
```

## 17. Phân tích từng source trong cùng file DD

### File: `front_end/src/app/routes/AppRoutes.jsx`

- Layer: Router. Component: `AppRoutes`. Route admin được bọc `RequireRole`, child `categories` mount `Category` (`73,87`). Input là URL; output là page trong admin layout. Không gọi API trực tiếp.

### File: `front_end/src/app/routes/RequireRole.jsx`

- Layer: FE permission. Nhận role yêu cầu, đọc auth context và quyết định render/redirect. Ảnh hưởng: user không phải admin không vào được màn hình; BE vẫn là quyền quyết định cuối cùng.

### File: `front_end/src/app/layouts/admin/DashboardLayout.jsx`

- Layer: Layout. Render sidebar/header/outlet; là nguồn bố cục shell trong ảnh. Không tham gia business/data category.

### File: `front_end/src/shared/components/sidebar/sidebar_admin/SidebarAdmin.jsx`

- Layer: Navigation. Menu link tới categories và active style theo pathname; không có API/validation/exception.

### File: `front_end/src/shared/components/header/admin_header/Header.jsx`

- Layer: Header. Map pathname sang title “Danh mục”, render language/notification/settings/account. Không gọi category API.

### File: `front_end/src/shared/api-client/AxiosClient.js`

- Layer: HTTP base. Tạo axios client với base API/config dùng bởi category và notification adapters. Output là Promise response/error.

### File: `front_end/src/shared/hooks/useAxiosPrivate.js`

- Layer: Auth HTTP. Cấp client private/interceptor cho `Category`; gắn access token và xử lý refresh theo code hook. Lỗi HTTP truyền về handler trang.

### File: `front_end/src/features/admin/infrastructure/api/CategoryApi.js`

- Layer: FE API adapter. `getAdminCategoriesApi`, `createAdminCategoryApi`, `updateAdminCategoryApi`, `deleteAdminCategoryApi` lần lượt gọi GET/POST/PUT/DELETE và trả `response.data` (`3-26`). `getAdminCategoryApi(id)` tồn tại nhưng trang không gọi.

### File: `front_end/src/features/notification/infrastructure/api/NotificationApi.js`

- Layer: FE side effect. `adminNotifySuccess` toast ngay, POST `/notifications/self` với current pathname, dispatch event; catch trống (`25-36`). Do trang `await`, modal create/edit đóng sau khi helper resolve/catch.

### File: `front_end/src/features/admin/presentation/category/Category.jsx`

- Layer: Page/component. Điểm gọi từ router. Input: API results và thao tác admin; output: KPI/filter/table/modals/toast/error.
- Methods quan trọng: `formatDate` (18-27), `normalizeCategory` (29-39), `stats` (41-52), `ParentSelect` (54-66), load effect (80-97), filter/page (99-123), `handleDelete` (131-148), modal open/close (150-173), `handleSubmitCategory` (175-213).
- Validation: name trim only. Exception: catch API message/fallback. Ảnh hưởng DB qua API; không có direct DB.

### File: `front_end/src/features/admin/presentation/shared/AdminHoverSelect.jsx`

- Layer: shared UI. Chuẩn hóa options, controlled/uncontrolled value, mở bằng hover/click, đóng khi mouseleave/click ngoài, gọi `onChange` (`4-85`). Dùng cho status filter, không gọi API.

### File: `front_end/src/features/admin/presentation/category/Category.css`

- Layer: presentation style. Định nghĩa cards, toolbar, table, pagination, modal/backdrop, status/action states và responsive. Không có logic dữ liệu.

### File: `front_end/src/features/admin/presentation/shared/AdminHoverSelect.css`

- Layer: presentation style của custom filter; không có business logic.

### File: `front_end/src/app/i18n/locales/vi.json`

- Layer: localization. Cung cấp phần label category/admin shell. Một số nội dung modal vẫn hardcode English trong JSX, vì vậy UI ảnh là song ngữ.

### File: `front_end/src/app/i18n/locales/en.json`

- Layer: localization English tương ứng; được dùng khi đổi EN. Nội dung hardcode không đổi theo locale.

### File: `back_end/src/main/java/com/example/back_end/shared/config/SecurityConfig.java`

- Layer: Security. Quy tắc `/api/learnova/admin/**` yêu cầu `ROLE_ADMIN` (`79`); authentication stateless/JWT. Output allow/401/403 trước controller.

### File: `back_end/src/main/java/com/example/back_end/admin/adapter/in/web/AdminCategoryController.java`

- Layer: Controller; base `/api/learnova/admin/categories-management` (`22`). GET list/detail/children; POST create 201; PUT update 200; DELETE 204 (`26-61`). Trang chỉ dùng list/create/update/delete.

### File: `back_end/src/main/java/com/example/back_end/admin/adapter/in/web/dto/AdminCategoryRequest.java`

- Layer: request DTO. Input JSON `name,parentId,isDeleted`; name có `@NotBlank` và `@Size(1..255)` (`7-15`). `parentId`/`isDeleted` nullable.

### File: `back_end/src/main/java/com/example/back_end/admin/adapter/in/web/dto/AdminCategoryResponse.java`

- Layer: response DTO. Output flattened category và parent name/id cho FE. Không có mapper riêng; service tạo trực tiếp.

### File: `back_end/src/main/java/com/example/back_end/admin/application/AdminCategoryService.java`

- Layer: Business/application. Được controller gọi; gọi repository. Create/update/delete transactional; list read-only. Chứa parent validation, slug generation, timestamp, soft-delete, response mapping (`27-145`). Exceptions ResourceNotFound/Business được global handler map.

### File: `back_end/src/main/java/com/example/back_end/admin/infrastructure/persistence/AdminCategoryRepository.java`

- Layer: Repository. JPQL list all với parent, active lookup/children, count slug active và JpaRepository save (`12-33`). Không có native SQL/paging cho màn hình.

### File: `back_end/src/main/java/com/example/back_end/course/domain/Category.java`

- Layer: ORM entity. Map `categories`, self parent/children, courseCategories, timestamps và soft-delete (`28-67`). Parent FK có `OnDelete SET_NULL`; thao tác hiện tại không hard-delete.

### File: `back_end/src/main/java/com/example/back_end/course/domain/CourseCategory.java`

- Layer: related ORM. Map bảng nối `course_categories` với composite id; không được category service truy cập trong các luồng màn hình (`14-34`). Bằng chứng rằng category có thể đang được khóa học tham chiếu.

### File: `back_end/src/main/java/com/example/back_end/shared/exception/GlobalExceptionHandler.java`

- Layer: exception advice. Map not-found 404, business/validation 400, access 403, integrity 409, generic 500 (`32-117`). FE ưu tiên `response.data.message`.

### File: `back_end/src/main/java/com/example/back_end/notification/adapter/in/web/NotificationController.java`

- Layer: side-effect controller. `createSelf` yêu cầu ADMIN và authentication, gọi `createForEmail` với type GENERIC và metadata source admin-ui (`45-63`).

### File: `back_end/src/main/java/com/example/back_end/notification/adapter/in/web/dto/SelfNotificationRequest.java`

- Layer: request validation. `title`/`content` not blank, max 200/2000; link max 500 (`6-10`).

### File: `back_end/src/main/java/com/example/back_end/notification/application/NotificationService.java`

- Layer: notification business. `createForEmail` tìm user active theo email auth, tạo unread notification với timestamp rồi `saveAndFlush` (`43-61`). Transaction độc lập với request category.

### File: `back_end/src/main/java/com/example/back_end/notification/infrastructure/persistence/NotificationRepository.java`

- Layer: repository. Kế thừa JpaRepository; self-note dùng `saveAndFlush` qua service. Các query list/count không thuộc mutation category.

### File: `back_end/src/main/java/com/example/back_end/notification/domain/Notification.java`

- Layer: ORM entity map `notifications`: user, title/content/type/link/metadata/isRead/createdAt (`22-64`).

### File: `back_end/src/main/resources/db/migration/V1__initial_schema.sql`

- Layer: Database DDL. Định nghĩa `categories`, `course_categories`, PK/unique/FK (`654-674,750-754,1706-1726,1762-1766,2652-2704`). Đây là bằng chứng trực tiếp về uniqueness toàn bảng và quan hệ delete vật lý.

## 18. Rủi ro kỹ thuật

| Mức độ | File/Method | Vấn đề | Bằng chứng | Ảnh hưởng | Cách kiểm tra |
| --- | --- | --- | --- | --- | --- |
| Cao | service `generateUniqueSlug` + DDL | Service chỉ đếm slug active, DB unique slug toàn bảng | repo:29-33 vs DDL:1722-1726 | tên trùng slug với hidden có thể 409 thay vì suffix | Ẩn A rồi tạo tên sinh cùng slug |
| Cao | service create/update + DDL | Không precheck name, DB unique name toàn bảng | service 54-91; DDL:1706-1710 | duplicate kể cả hidden trả 409 generic | tạo/sửa trùng exact name |
| Cao | `ParentSelect` + `resolveParent` | Chỉ chặn self, không chặn chọn descendant | JSX:54-66; service:104-109 | tạo cycle A→B→A; consumer đệ quy có nguy cơ lỗi | dựng 2 cấp, đổi cha root thành con |
| Trung bình | parent active rule | Child của parent hidden vẫn list parentName; dropdown không chứa hidden parent; submit payload có thể bị BE 404 | list all + `findActiveById` | edit child hiện hữu có thể thất bại/UX không rõ | ẩn cha rồi edit con |
| Trung bình | `handleDelete` | Local patch không cập nhật `updatedAt`, DELETE không trả body/reload | JSX:135-140 | ngày “Cập nhật” cũ đến lần reload | quan sát row sau hide |
| Trung bình | page memo | `currentPage` không clamp sau delete/filter data mutation | JSX:116-123 | có thể đứng trang rỗng dù trang trước có data | ở trang cuối rồi ẩn đủ rows |
| Trung bình | slug transaction | count-then-save không khóa/atomic | service:129-145 | concurrent same names có thể collision/409 | gửi POST đồng thời |
| Trung bình | modal handlers | X/Cancel/backdrop không disabled khi request đang chạy | JSX:330-407 | đóng modal nhưng request vẫn hoàn thành/update state | submit rồi đóng nhanh |
| Thấp | delete UX | Delete hidden row vẫn enabled; service ghi lại hidden và updatedAt | table actions + service:93-100 | thao tác lặp không thay status nhưng đổi timestamp DB | hide row đã hidden |
| Thấp | root KPI | roots đếm hidden | JSX:41-52 | KPI root không đồng nghĩa root visible | ẩn root và so KPI |
| Thấp | i18n | Modal/table có hardcode English xen tiếng Việt | JSX:343-401 | đổi locale không dịch toàn bộ | toggle EN/VI |
| Thấp | notification | create/edit await note; lỗi note bị nuốt, phản hồi note chậm trì hoãn đóng modal | NotificationApi:25-36 | UI chậm nhưng mutation đã xong | throttle `/notifications/self` |
| Thấp | delete messaging | Không success toast/self-note, lỗi đóng confirmation | JSX:131-148 | feedback không nhất quán | test success/error DELETE |
| Thấp | name input | FE không maxLength 255 | JSX:356-367 vs DTO | user chỉ biết lỗi sau request | nhập 256 ký tự |
| Thấp | slug normalization | tên chỉ ký tự bị loại có thể sinh slug rỗng | service:120-127; DB slug chỉ NOT NULL | slug `""` hoặc suffix khó dùng | tạo tên chỉ ký hiệu hợp lệ validation |

## 19. Test case rút ra từ code

| ID | Chức năng | Tiền điều kiện | Thao tác | Input | Kết quả mong đợi theo code | File/Method |
| --- | --- | --- | --- | --- | --- | --- |
| TC-01 | Permission FE | chưa login | mở route | URL | guard redirect, page không mount | AppRoutes/RequireRole |
| TC-02 | Permission BE | token không ADMIN | GET API | token | 403 | SecurityConfig |
| TC-03 | Load happy | admin, có data | mở page | none | GET 200, KPI/table theo all records | effect/getAll |
| TC-04 | Empty | categories rỗng | mở page | none | KPI 0, empty table | normalize/render |
| TC-05 | Load exception | BE 500/network | mở page | none | fallback/API error, loading false | effect catch |
| TC-06 | Search ID | có CAT-001 | nhập | `cat-001` | chỉ row match, page 1 | filteredCategories |
| TC-07 | Search parent | có parent Design | nhập | `design` | match child parentName | filteredCategories |
| TC-08 | Filter hidden | có hidden | chọn Hidden | Hidden | chỉ `status===Hidden` | filter memo |
| TC-09 | Pagination boundary | >6 rows | next/prev | page | slice 6, buttons boundary disabled | lines116-123,300-327 |
| TC-10 | Open/create cancel | admin | New rồi Cancel/X/backdrop | none | modal reset/đóng, no API | open/close |
| TC-11 | Create root | unique valid name | submit | name,parent null | 201; active root append; toast/note; close | create flow |
| TC-12 | Create child | active parent | submit | valid parent id | parent set/name shown | resolveParent |
| TC-13 | Create blank | modal | submit spaces | `"   "` | inline required, no API | FE validation |
| TC-14 | Create >255 | modal | submit | 256 chars | 400, inline/toast, modal open | DTO/handler |
| TC-15 | Duplicate name | existing active/hidden | create same exact | name | DB 409 generic duplicate | DDL/handler |
| TC-16 | Slug hidden collision | hidden slug exists, different name same slug | create | normalized collision | nguy cơ DB 409 | repo count/DDL |
| TC-17 | Edit name | existing | save | new unique name | slug regenerated, row replace | update service |
| TC-18 | Edit parent self | bypass/construct request | PUT | parentId=id | 400 business | resolveParent |
| TC-19 | Edit parent hidden | hidden parent | PUT | parentId hidden | 404 | findActiveById |
| TC-20 | Hide via status | active row | edit Status Hidden/save | isDeleted true | update 200, badge Hidden, toast/note | update flow |
| TC-21 | Restore | hidden row | edit Status Active/save | isDeleted false | update 200, Active | update flow |
| TC-22 | Delete cancel | row | trash→Cancel | none | no API/DB change | confirm modal |
| TC-23 | Delete happy | existing | trash→Hide | id | DB soft-delete/204; local Hidden | delete flow |
| TC-24 | Delete not found | stale id | confirm | invalid id | 404, dialog closes/global error | delete/handler |
| TC-25 | DB failure | mutation | submit | valid | 409/500; error shown; create/edit modal stays | handlers |
| TC-26 | Note failure | category mutation succeeds, note fails | create/edit | valid | toast still shown; category kept; modal closes after catch | adminNotifySuccess |
| TC-27 | Descendant cycle | A parent of B | set A parent=B | ids | code hiện tại chấp nhận nếu cả active | ParentSelect/resolveParent |
| TC-28 | Page stale | page cuối | hide last row(s) | ids | có thể render empty current page | page memo/delete patch |
| TC-29 | Null timestamps | API returns null/invalid | load | null | UI `N/A` | formatDate |
| TC-30 | Export/download | page loaded | tìm control | none | không có control/luồng | source search |

## 20. Kết luận End-to-End

- Chức năng bắt đầu tại route `front_end/src/app/routes/AppRoutes.jsx:73,87`, đi qua `RequireRole`, `DashboardLayout`, rồi mount `Category.jsx`.
- Load chạy theo thứ tự `Category.useEffect` → `CategoryApi.getAdminCategoriesApi` → `AdminCategoryController.getAllCategories` → `AdminCategoryService.getAllCategories` → `AdminCategoryRepository.findAllForAdmin` → bảng `categories`; response được map thành `AdminCategoryResponse`, FE normalize rồi render KPI/table.
- Tìm kiếm, status filter và paging kết thúc hoàn toàn tại FE, không đọc lại DB.
- Create/update/delete lần lượt gọi POST `/create`, PUT `/update/{id}`, DELETE `/delete/{id}`. Business logic parent/slug/status/timestamp/soft-delete nằm tại `AdminCategoryService`; JPA save INSERT/UPDATE `categories`.
- Create/edit thành công tiếp tục `NotificationApi.adminNotifySuccess` → POST `/notifications/self` → `NotificationController.createSelf` → `NotificationService.createForEmail` → đọc `users` và insert `notifications`. Đây là side effect best-effort, tách transaction với category.
- Delete kết thúc ở HTTP 204 và FE patch row thành Hidden; không reload, toast hoặc note. Create/edit kết thúc khi state cập nhật, toast/note helper hoàn tất/catch và modal đóng.
- Đã xác minh từ code: route/permission, UI/state, toàn bộ API category, controller/service/repository/entity/DDL, response quay lại FE, notification side effect, validation và exception mapping.
- Suy luận từ ảnh và code: các số KPI/row cụ thể, modal create/edit và bố cục đúng nhánh render tương ứng.
- Chưa xác minh: dữ liệu DB runtime tạo ra đúng các giá trị 7/7/0/4; badge chuông 34; hành vi trình duyệt native select khi value là hidden parent không còn trong options. Không có runtime/network log trong nguồn cung cấp để kết luận ba điểm này.
- Từ khóa đã tìm khi truy vết thiếu: `categories-management`, `Category`, `categoryAdmin`, `create category`, `update category`, `delete category`, `parentId`, `isDeleted`, `slug`, `course_categories`, `notifications/self`. Thư mục đã kiểm tra: `front_end/src`, `back_end/src/main/java`, `back_end/src/main/resources/db/migration`. Điểm cuối truy vết được là state/render FE sau response và hai bảng `categories`/`notifications` ở DB.
