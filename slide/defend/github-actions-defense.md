# Defense GitHub Actions — CI thực tế của LearnOva

Tài liệu này mô tả workflow có trong repository, chủ yếu là `.github/workflows/quality.yml`. CI được dùng để kiểm tra mã nguồn tự động khi tạo Pull Request, khi push vào `main`, hoặc chạy tay.

## 1. File và trigger

**File:** `.github/workflows/quality.yml`

```yaml
on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:
```

- `pull_request`: kiểm tra trước khi merge.
- `push main`: kiểm tra lại commit đã vào nhánh production.
- `workflow_dispatch`: cho phép chạy thủ công trên giao diện GitHub Actions.

Workflow cấp quyền tối thiểu `contents: read`; không cần AWS credential và không deploy.

## 2. Job Backend — `backend-tests`

Chuỗi trong `.github/workflows/quality.yml`:

```text
GitHub runner Ubuntu
 → actions/checkout@v4
 → actions/setup-java@v4 (Temurin Java 25, Maven cache)
 → working-directory: back_end
 → ./mvnw -B test
```

- `checkout` lấy đúng commit đang được kiểm tra.
- `setup-java` cài JDK 25, đồng thời cache Maven để tránh tải lại dependency không cần thiết.
- Maven Wrapper (`./mvnw`) giúp CI dùng Maven version do project kiểm soát, không phụ thuộc Maven cài sẵn trên runner.
- `-B` là batch mode: log phù hợp môi trường không tương tác.
- `test` chạy unit test backend. Nếu test fail, job fail và PR hiển thị trạng thái đỏ.

## 3. Job Frontend — `frontend-checks`

Chuỗi thực tế:

```text
checkout
 → setup-node@v4 (Node 22, npm cache theo front_end/package-lock.json)
 → npm ci
 → npm run test:coverage
 → npm run build
 → npx playwright install --with-deps chromium
 → npm run test:e2e
 → npm run lint (continue-on-error: true)
```

- `npm ci` dùng đúng lockfile, tái lập dependency ổn định hơn `npm install`.
- `test:coverage` chạy unit test và xuất coverage theo cấu hình frontend.
- `build` xác nhận Vite/React có thể tạo production bundle; lỗi import, syntax hoặc build-time env sẽ lộ tại đây.
- Playwright cài Chromium và chạy smoke E2E để kiểm tra các hành trình giao diện quan trọng.
- Lint hiện **không blocking** vì step có `continue-on-error: true`; nghĩa là lint đỏ vẫn không làm toàn job fail. Đây là chủ đích “baseline”, không nên nói rằng lint đang là quality gate bắt buộc.

## 4. Ý nghĩa kiến trúc CI

Hai job backend/frontend độc lập và có thể chạy song song. Điều này rút ngắn feedback: lỗi React không cần chờ Maven test, và ngược lại.

CI kiểm tra 4 lớp:

| Lớp | Bằng chứng trong workflow | Rủi ro được bắt |
|---|---|---|
| Backend correctness | `./mvnw -B test` | Regression ở service/controller/domain. |
| Frontend correctness | `npm run test:coverage` | Logic component/hook. |
| Buildability | `npm run build` | Không thể build bundle production. |
| UI smoke | `npm run test:e2e` | Luồng UI cơ bản lỗi ở runtime. |

## 5. Câu hỏi phản biện

### “CI có deploy không?”

Không. `quality.yml` chỉ kiểm tra chất lượng. Deploy nằm ở file khác là `deploy.yml`.

### “Push vào main có chắc chắn chỉ deploy sau khi test pass không?”

Theo YAML hiện tại: **chưa có dependency kỹ thuật giữa hai workflow**. `quality.yml` và `deploy.yml` cùng được trigger bởi push `main`, vì vậy deploy không `needs` job test. Quy trình review/branch protection có thể ngăn merge PR chưa pass, nhưng workflow deploy tự nó không chờ CI. Đây là điểm cải tiến hợp lý: gộp hoặc trigger deploy sau quality workflow thành công.

### “Vì sao dùng cache?”

Cache Maven và npm không thay đổi code đang kiểm tra; nó chỉ tái sử dụng dependency theo key, giảm thời gian và chi phí runner.

### “Vì sao lint chưa blocking?”

Do codebase còn vi phạm lint cũ; bật blocking ngay làm CI fail hàng loạt không liên quan thay đổi mới. Đích đến nên là xử lý baseline rồi bỏ `continue-on-error`.
