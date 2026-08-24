# Chiến lược kiểm thử LearnOva

## 1. Mục tiêu và phạm vi

Kiểm thử được tổ chức theo mô hình tháp kiểm thử: ưu tiên unit test cho quy tắc nghiệp vụ, sau đó bổ sung integration/API test và E2E cho các hành trình có rủi ro cao. Không dùng dữ liệu hay khóa thật của PayOS, AWS, Groq hoặc dịch vụ gửi email trong test tự động.

| Tầng kiểm thử | Phạm vi hiện có | Mục tiêu tiếp theo |
| --- | --- | --- |
| Unit | JWT, đăng ký tài khoản; tiện ích tìm kiếm, chuỗi ngày, giỏ hàng guest | Bổ sung payment, enrollment, course và voucher service |
| Integration/API | MVC controller: đăng nhập thành công, cookie trả về, validation đăng ký | Database cô lập/Testcontainers, kiểm tra phân quyền và persistence |
| E2E | Playwright smoke: hiển thị/chuyển form auth, chặn route profile chưa đăng nhập | Đăng ký, đăng nhập, mua khóa học và học bài với dữ liệu seed |
| Manual exploratory | Kiểm tra trên môi trường staging | Xác nhận giao diện, email và callback thanh toán thực tế |

## 2. Cách chạy

Yêu cầu: JDK 25, Node.js 22 và npm. Chạy tại thư mục gốc dự án.

```powershell
cd back_end
.\mvnw.cmd test

cd ..\front_end
npm ci
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm run lint
```

`npm run test:coverage` tạo báo cáo HTML tại `front_end/coverage/index.html`. `npm run test:e2e` tự khởi động Vite tại cổng 4173 và chạy Chromium của Playwright. Không đưa các thư mục `coverage/`, `dist/`, `test-results/` hoặc `playwright-report/` vào Git.

## 3. Quy tắc viết test

- Mỗi bug được sửa phải có test tái hiện lỗi trước hoặc cùng lúc với bản sửa.
- Unit test không truy cập mạng, hệ thống tệp dùng chung, database dùng chung hay khóa bí mật thật.
- Mock ranh giới ngoài hệ thống: repository, HTTP client, PayOS, email, S3/CloudFront và LLM.
- Đặt tên theo hành vi: `method_condition_expectedResult` hoặc mô tả tiếng Anh rõ ràng.
- Dùng Arrange–Act–Assert; mỗi test chỉ kiểm tra một hành vi chính.
- Test dữ liệu nhạy cảm chỉ lấy từ biến môi trường của CI/staging, không ghi vào source hoặc ảnh chụp màn hình.

## 4. Ma trận kiểm thử ưu tiên

| Luồng nghiệp vụ | Unit | Integration/API | E2E | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| Đăng ký, xác minh email, đăng nhập, refresh token | Có một phần | Đăng nhập và validation đăng ký đã có | Điều hướng auth và chặn profile đã có | P0 |
| JWT hết hạn/sai chữ ký | Có | Cần bổ sung | Không cần riêng | P0 |
| Mua khóa học, callback PayOS, ghi danh | Cần bổ sung | Cần bổ sung với sandbox/mock | Cần bổ sung | P0 |
| Quyền học bài, theo dõi tiến độ | Cần bổ sung | Cần bổ sung | Cần bổ sung | P0 |
| Tạo/duyệt khóa học và bài học | Cần bổ sung | Cần bổ sung | Cần bổ sung | P1 |
| Voucher, giỏ hàng, yêu thích | Giỏ guest đã có | Cần bổ sung | Cần bổ sung | P1 |
| Tìm kiếm, biểu đồ, bộ lọc | Có một phần | Không bắt buộc | Khám phá thủ công | P2 |

P0 phải đạt trước khi phát hành; P1 thực hiện trong sprint kế tiếp; P2 thực hiện khi thay đổi liên quan.

## 5. Quy trình CI

Workflow `.github/workflows/quality.yml` chạy trên pull request, nhánh `main` và khi kích hoạt thủ công:

1. Backend: chạy Maven unit/MVC controller test.
2. Frontend: cài dependency khóa phiên bản bằng `npm ci`, chạy unit test kèm coverage, build production và Playwright smoke E2E.
3. ESLint được chạy ở chế độ **baseline không chặn**. Tại thời điểm thiết lập, mã hiện hữu có 134 lỗi và 19 cảnh báo ở nhiều màn hình; cần tạo ticket chia nhỏ theo feature rồi bỏ `continue-on-error` khi số lỗi về 0.

Không merge thay đổi làm hỏng backend test, frontend test hoặc frontend build. Khi lint được làm sạch, đổi lint thành bước chặn để áp dụng cho mọi pull request.

## 6. Phạm vi còn lại của E2E và integration test

1. Tạo profile `test` cho backend, dùng PostgreSQL cô lập qua Testcontainers hoặc Docker Compose CI; migration chạy tự động trước test.
2. Bổ sung test controller/context cho endpoint P0: status HTTP, validation, quyền `USER`/`TEACHER`/`ADMIN`, và body lỗi chuẩn. MVC test hiện tại được cô lập bằng mock để không phụ thuộc Elasticsearch hoặc database.
3. Mở rộng Playwright từ smoke test hiện có: đăng ký–đăng nhập; khóa học miễn phí; thanh toán mock thành công/thất bại; tiếp tục học và lưu tiến độ. Các test này cần backend test, dữ liệu seed và mock callback PayOS.
4. Ghi nhận mỗi lần chạy: commit, môi trường, test case, kết quả, defect và ảnh/video nếu E2E thất bại.

## 7. Checklist phát hành

- [x] Backend test đạt.
- [x] Frontend unit test, smoke E2E và build đạt.
- [ ] Kiểm tra thủ công đăng nhập, phân quyền và đường dẫn thanh toán trên staging.
- [ ] Callback thanh toán dùng sandbox/mock, không dùng tiền thật.
- [ ] Kiểm tra log không chứa token, mật khẩu, access key hoặc thông tin thẻ.
- [ ] Kiểm tra rollback/khôi phục database theo hướng dẫn vận hành.

## 8. Kết quả chạy thực tế

Thời điểm chạy: 19/08/2026, môi trường Windows 11, JDK 25.0.3, Node.js/npm trong workspace và Chromium do Playwright quản lý. Không gọi database, PayOS, email, AWS hay Groq thật.

| Nhóm | Lệnh | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Backend unit + MVC controller | `back_end\\mvnw.cmd test` | Đạt: 18/18 test | JWT; AuthService; AuthController đăng nhập/cookie và validation đăng ký |
| Frontend unit | `front_end\\npm run test:coverage` | Đạt: 27/27 test | Coverage utility: 67,94% statements, 50% branches, 86,36% functions, 67,10% lines |
| Frontend build | `front_end\\npm run build` | Đạt | Có cảnh báo bundle JavaScript gzip khoảng 585 kB, cần code splitting trong tối ưu hiệu năng |
| Frontend smoke E2E | `front_end\\npm run test:e2e` | Đạt: 2/2 test | Kiểm tra form đăng nhập/đăng ký và redirect route profile khi chưa xác thực |
| ESLint | `front_end\\npm run lint` | Chưa đạt: 134 lỗi, 19 cảnh báo | Lỗi có sẵn trải nhiều feature; đang theo baseline không chặn CI |

Tổng cộng đã chạy 47 test case tự động và tất cả đều đạt. Các test E2E hiện chỉ xác nhận luồng giao diện và điều hướng, không khẳng định đăng nhập hoặc thanh toán end-to-end với backend thật. Điều kiện phát hành P0 là triển khai các mục còn lại ở Mục 6 và chạy trên môi trường staging cô lập.
