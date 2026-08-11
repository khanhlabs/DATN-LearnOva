# Role Switching cho user có nhiều role (multi-role)

## 1. Tổng quan

### Vấn đề
Model role trong hệ thống là many-to-many (`users` — `roles` qua bảng `userrole`), nghĩa là một user có thể sở hữu nhiều role cùng lúc (vd vừa `ROLE_TEACHER` vừa `ROLE_USER`). Trước feature này, `CustomUserDetails.getAuthorities()` luôn cấp **toàn bộ** role của user làm quyền cho **mọi** request — không có khái niệm "user đang thao tác với tư cách role nào". Một user 2 role có thể dùng quyền của cả 2 role cùng lúc, không kiểm soát được và không có UI để họ chủ động chọn.

### Giải pháp
Thêm khái niệm **`active_role`** — role mà user đang chọn để hoạt động:
- Lưu ở cột `active_role` trong bảng `users` (không dùng JWT claim, không dùng cookie riêng).
- Khi `active_role` đã được set, backend **chỉ cấp quyền của role đó** (không cấp quyền các role còn lại) — đúng nghĩa "switch" chứ không phải chỉ đổi giao diện.
- Khi `active_role` là `NULL` (user chưa từng switch — thường là user chỉ có 1 role, hoặc user nhiều role mới được cấp role thứ 2), backend fallback về hành vi cũ: cấp tất cả role. Nhờ vậy **không breaking** dữ liệu/user hiện có.
- Vì `JwtAuthenticationFilter` đọc lại `User` từ DB ở **mỗi request** (JWT chỉ mang `subject`/thời hạn, không mang role), việc đổi `active_role` có hiệu lực ngay từ request kế tiếp — không cần cấp lại access token.

### UI
Với user có ≥ 2 role, header hiển thị nút chuyển đổi:
- Đang ở giao diện Học viên (`AvatarDropdown`) → mục **"Chuyển sang Giảng viên"**.
- Đang ở giao diện Giảng viên (`TeacherHeader`) → mục **"Chuyển sang Học viên"**.

Click sẽ gọi API đổi `active_role`, sau đó điều hướng sang layout tương ứng.

---

## 2. Chi tiết Backend

### 2.1. Migration
Đã được gộp vào schema khởi tạo tại [V1__initial_schema.sql](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/resources/db/migration/V1__initial_schema.sql) (dòng 1557):
```sql
active_role character varying(50)
```
Cột nullable, mặc định `NULL` cho toàn bộ user hiện có — không cần backfill.

### 2.2. Entity
[User.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/auth/domain/User.java)
```java
@Enumerated(EnumType.STRING)
@Column(name = "active_role")
private RoleName activeRole;
```

### 2.3. Enforce quyền — `CustomUserDetails.getAuthorities()`
[CustomUserDetails.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/security/CustomUserDetails.java)

Logic: nếu `activeRole` khác `null` **và** vẫn nằm trong tập `roles` hiện tại của user (phòng trường hợp role đã bị thu hồi sau khi set active), chỉ trả về authority của role đó. Ngược lại, trả về tất cả role như hành vi cũ.
```java
RoleName active = user.getActiveRole();
boolean stillValid = active != null && user.getRoles()
        .stream()
        .anyMatch(role -> role.getRoleName() == active);

if (stillValid) {
    return List.of(new SimpleGrantedAuthority(active.name()));
}

return user.getRoles()
        .stream()
        .map(role -> new SimpleGrantedAuthority(role.getRoleName().name()))
        .toList();
```

Vì `CustomUserDetailsService.loadUserByUsername()` được `JwtAuthenticationFilter` gọi lại (đọc DB) ở mỗi request, hàm này chạy lại mỗi lần → active role luôn được áp dụng tức thời.

### 2.4. API đổi active role
- DTO: [SwitchRoleRequest.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/auth/adapter/in/web/dto/SwitchRoleRequest.java)
  ```java
  public record SwitchRoleRequest(@NotNull RoleName role) {}
  ```
- Service: [AuthService.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/auth/application/AuthService.java) (`switchActiveRole(String email, RoleName role)`) — load user, kiểm tra user thực sự sở hữu `role` đó (nếu không → ném `BusinessException`), set `activeRole`, save, trả về `CurrentUserResponse` mới. Logic map `User` → `CurrentUserResponse` được tách thành helper `toCurrentUserResponse()` dùng chung với `getCurrentUser()`.
- Controller: [UserController.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/user/adapter/in/web/UserController.java)
  ```java
  @PatchMapping("/user/active-role")
  public ResponseEntity<CurrentUserResponse> switchActiveRole(
          Authentication authentication,
          @Valid @RequestBody SwitchRoleRequest request) {
      return ResponseEntity.ok(authService.switchActiveRole(authentication.getName(), request.role()));
  }
  ```
  Endpoint: `PATCH /api/learnova/user/active-role`, body `{ "role": "ROLE_TEACHER" }`.

### 2.5. Response DTO
[CurrentUserResponse.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/user/adapter/in/web/dto/CurrentUserResponse.java) (dùng chung cho `GET /user/me` và `PATCH /user/active-role`) thêm field:
```java
public record CurrentUserResponse(
        ..., // các field cũ
        Set<RoleName> roles,
        RoleName activeRole
) {}
```

### 2.6. Không đổi
- [RequireRole.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/app/routes/RequireRole.jsx) phía FE là nơi duy nhất phản ánh logic tương ứng; [SecurityConfig.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/shared/config/SecurityConfig.java), JWT ([JwtService.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/security/JwtService.java)), [CustomUserDetailsService.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/security/CustomUserDetailsService.java) giữ nguyên.
- Không cần cấp lại token khi switch role.

---

## 3. Chi tiết Frontend

### 3.1. API
[UserApi.js](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/features/profile/infrastructure/api/UserApi.js)
```js
export const switchActiveRoleApi = async (role) => {
    const response = await axiosClient.patch("/user/active-role", { role });
    return response.data;
};
```

### 3.2. AuthContext
[AuthContext.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/app/providers/AuthContext.jsx) — thêm `switchActiveRole(role)`: gọi API, set `currentUser` trực tiếp từ response (không cần refetch riêng), expose qua context.

### 3.3. UI switcher
- **[AvatarDropdown.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/shared/components/header/user_header/components/dropdown/AvatarDropdown.jsx)** (menu avatar ở header học viên): hiện mục **"Chuyển sang Giảng viên"** nếu `user.roles` chứa `ROLE_TEACHER`. Click → `switchActiveRole("ROLE_TEACHER")` → `navigate("/learnova/teacher")`.
- **[UserData.js](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/shared/components/header/user_header/components/data/UserData.js)** (`useUserData` hook): expose thêm `activeRole` từ `currentUser`.
- **[TeacherHeader.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/shared/components/header/teacher_header/TeacherHeader.jsx)** (header giảng viên): thêm nút **"Chuyển sang Học viên"** nếu user có `ROLE_USER`. Click → `switchActiveRole("ROLE_USER")` → `navigate("/learnova/home")`. Style thêm ở [TeacherHeader.css](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/shared/components/header/teacher_header/TeacherHeader.css) (`.teacher-switch-role-btn`).

### 3.4. Route guard — `RequireRole.jsx`
[RequireRole.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/app/routes/RequireRole.jsx) — khớp logic với backend: nếu `activeRole` đã set thì chỉ role đó được coi là có quyền; nếu chưa set (null) thì fallback kiểm tra theo `roles` (tập tất cả role user có) như hành vi cũ.
```js
const roles = currentUser?.roles ?? [];
const activeRole = currentUser?.activeRole;
const hasAccess = !role || (activeRole ? activeRole === role : roles.includes(role));

if (role && !hasAccess) {
    return <Navigate to="/learnova/home" replace />;
}
```
Nhờ vậy: user chưa từng switch (phổ biến nhất — user 1 role) không bị ảnh hưởng gì; user đã chọn active role sẽ bị FE chặn *trước khi* gọi API nếu cố vào route không thuộc role đang active (khớp với việc BE cũng sẽ trả lỗi quyền nếu họ tự sửa URL).

---

## 4. Danh sách file đã thay đổi

**Backend**
- [V1__initial_schema.sql](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/resources/db/migration/V1__initial_schema.sql) *(active_role nằm trong table users)*
- [User.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/auth/domain/User.java)
- [CustomUserDetails.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/security/CustomUserDetails.java)
- [SwitchRoleRequest.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/auth/adapter/in/web/dto/SwitchRoleRequest.java)
- [CurrentUserResponse.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/user/adapter/in/web/dto/CurrentUserResponse.java)
- [AuthService.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/auth/application/AuthService.java)
- [UserController.java](file:///d:/CODING/DATN/DATN-LearnOva/back_end/src/main/java/com/example/back_end/user/adapter/in/web/UserController.java)

**Frontend**
- [UserApi.js](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/features/profile/infrastructure/api/UserApi.js)
- [AuthContext.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/app/providers/AuthContext.jsx)
- [AvatarDropdown.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/shared/components/header/user_header/components/dropdown/AvatarDropdown.jsx)
- [UserData.js](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/shared/components/header/user_header/components/data/UserData.js)
- [TeacherHeader.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/shared/components/header/teacher_header/TeacherHeader.jsx)
- [TeacherHeader.css](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/shared/components/header/teacher_header/TeacherHeader.css)
- [RequireRole.jsx](file:///d:/CODING/DATN/DATN-LearnOva/front_end/src/app/routes/RequireRole.jsx)

---

## 5. Kết quả kiểm thử (đã thực hiện thủ công qua API)

Test bằng tài khoản có cả `ROLE_USER` + `ROLE_TEACHER`:

| Bước | Kết quả |
|---|---|
| Login lần đầu | `activeRole: null`, `roles: [ROLE_USER, ROLE_TEACHER]` — vào được cả 2 khu vực như hành vi cũ |
| `PATCH /user/active-role {ROLE_TEACHER}` | `activeRole` cập nhật thành `ROLE_TEACHER`, persist ngay ở request sau |
| Đang active `ROLE_TEACHER` → `GET /teacher/dashboard` | `200 OK` |
| Switch về `ROLE_USER` → `GET /teacher/dashboard` | Bị chặn (`AuthorizationDeniedException: Access Denied` trong log) — quyền TEACHER đã bị thu hồi đúng như thiết kế |

## 6. Vấn đề tồn đọng phát hiện được (ngoài phạm vi feature này)

Khi bị chặn quyền (`@PreAuthorize` denied), API trả về **HTTP 500** thay vì **403**, vì `GlobalExceptionHandler` (`back_end/src/main/java/com/example/back_end/exception/GlobalExceptionHandler.java`) chưa có `@ExceptionHandler` riêng cho `AuthorizationDeniedException`/`AccessDeniedException`, nên rơi vào handler `Exception` chung. Đây là bug có sẵn của toàn hệ thống (áp dụng cho *mọi* `@PreAuthorize` denial, không riêng gì role-switching) — nên cân nhắc sửa riêng.

## 7. Hướng mở rộng (chưa làm)

- Chưa có UI/API cho admin gán thêm role cho user (hiện phải thao tác trực tiếp DB).
- Chưa có cơ chế nào tự động set `active_role` mặc định khi user vừa được cấp role thứ 2 — họ sẽ ở trạng thái "chưa switch" (`NULL`, cấp mọi quyền) cho đến khi tự bấm chuyển.
- Nếu cần chặt hơn nữa (vd bắt buộc user 2 role luôn phải chọn 1 active role, không cho ở trạng thái "cấp tất cả"), sẽ cần thêm logic ép chọn active role ngay sau khi được cấp role thứ 2.
