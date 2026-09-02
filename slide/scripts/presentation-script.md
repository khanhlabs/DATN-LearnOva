# Kịch bản thuyết trình LearnOva

## Slide 1 — Mở đầu

Kính thưa Hội đồng, chúng em là Nhóm 2 lớp SD20303. Hôm nay, nhóm xin trình bày dự án LearnOva — ứng dụng học trực tuyến hướng đến việc kết nối toàn bộ hành trình học tập trên một nền tảng thống nhất.

Dự án được xây dựng nhằm phục vụ ba nhóm người dùng chính: người học, giảng viên và quản trị viên. Trong phần trình bày, nhóm sẽ lần lượt giới thiệu bài toán, trải nghiệm sản phẩm, các chức năng theo từng vai trò, sau đó là kiến trúc, dữ liệu và hạ tầng triển khai.

## Slide 2 — Bài toán và mục tiêu

Thực tế, việc học trực tuyến thường bị phân tán qua nhiều công cụ: nơi xem video, nơi lưu tài liệu, nơi trao đổi, nơi thanh toán và nơi quản lý lớp học. Điều này làm trải nghiệm của người học bị rời rạc, đồng thời gây khó khăn cho giảng viên và đơn vị vận hành.

LearnOva hướng đến giải quyết vấn đề này bằng một nền tảng tập trung.

Với người học, hệ thống hỗ trợ khám phá khóa học, thanh toán, học bài giảng, làm quiz và theo dõi tiến độ. Với giảng viên, hệ thống hỗ trợ theo dõi học viên, phản hồi đánh giá, Q&A và thông báo. Với tổ chức, hệ thống cung cấp không gian quản trị người dùng, khóa học, đơn hàng và doanh thu.

## Slide 3 — Tổng quan sản phẩm

Đây là tổng quan giao diện LearnOva trên nền tảng web.

Sản phẩm gồm các không gian giao diện theo vai trò. Người học sử dụng trang chủ để khám phá khóa học, tìm kiếm và tiếp cận nội dung. Khi đã đăng ký, người học học trên Learning Player với video HLS, quiz, tiến độ và các nội dung hỗ trợ học tập.

Song song đó, giảng viên có Teacher Portal để quản lý hoạt động giảng dạy; còn quản trị viên có Admin Workspace để vận hành người dùng, kiểm duyệt khóa học và theo dõi giao dịch.

Mục tiêu của giao diện là giữ trải nghiệm nhất quán, nhưng vẫn đặt đúng công cụ vào đúng ngữ cảnh của từng vai trò.

## Slide 4 — Thành viên và phân công

Dự án được chia thành bốn mảng chính.

Bạn Thông phụ trách trải nghiệm người học: tìm kiếm, học tập, AI, quiz, Q&A và hồ sơ người dùng.

Bạn Minh phụ trách Teacher Portal và phần giao diện: dashboard giảng viên, học viên, đánh giá, thông báo và trải nghiệm UI theo vai trò.

Bạn Hiếu phụ trách Admin và thương mại: quản lý người dùng, kiểm duyệt khóa học, voucher, đơn hàng, thanh toán PayOS và báo cáo vận hành.

Em, Khanh, phụ trách phần core kỹ thuật: thiết kế dữ liệu, nghiệp vụ Course, media/search và CI/CD–hạ tầng AWS.

Sau đây, nhóm sẽ đi vào từng phần chức năng.

## Slide 18 — Mở đầu phần Khanh

Tiếp theo, em xin trình bày phần Core Engineering, dữ liệu và hạ tầng triển khai.

Phần này không tập trung vào một màn hình người dùng cụ thể, mà tập trung vào nền tảng kỹ thuật kết nối các nghiệp vụ đã trình bày trước đó: từ khóa học, học liệu, tiến độ học tập, thanh toán đến khả năng triển khai hệ thống.

Em sẽ trình bày lần lượt kiến trúc ứng dụng, thiết kế cơ sở dữ liệu, pipeline course–media–search và quy trình CI/CD trên AWS.

## Slide 19 — Kiến trúc hệ thống qua REST API

LearnOva sử dụng mô hình frontend SPA với React và Vite; frontend tổ chức theo các feature, xử lý routing, gọi API qua Axios và quản lý trạng thái giao diện theo từng luồng chức năng.

Backend được xây dựng bằng Spring Boot và PostgreSQL. Mã nguồn được tổ chức theo các lớp adapter, application, domain và infrastructure — theo hướng Hexagonal/DDD.

Cách tổ chức này giúp tách phần nhận request, xử lý nghiệp vụ và truy cập dữ liệu. Ví dụ, controller nhận yêu cầu từ frontend, application service thực hiện quy tắc nghiệp vụ, còn repository và adapter đảm nhiệm việc làm việc với PostgreSQL, Elasticsearch hoặc các dịch vụ AWS.

REST API là cầu nối giữa frontend và backend, giúp các phần người học, giảng viên và admin dùng chung một nền tảng nghiệp vụ nhưng vẫn có endpoint và quyền truy cập phù hợp theo vai trò.

## Slide 20 — Thiết kế cơ sở dữ liệu PostgreSQL

Về cơ sở dữ liệu, schema hiện tại gồm 46 bảng, 60 index và 15 trigger.

Thiết kế bắt đầu từ các entity nghiệp vụ cốt lõi: người dùng, khóa học, bài học, đăng ký học, đơn hàng, thanh toán, voucher, quiz và tương tác.

Các quan hệ nhiều-nhiều được tách thành bảng trung gian thay vì lưu danh sách trong một cột. Ví dụ có UserRole, CourseCategory, CourseTag, Cart, Wishlist và Enrollment. Cách này giúp hạn chế lặp dữ liệu và thuận lợi khi mở rộng nghiệp vụ.

Một quan hệ tiêu biểu là: User đăng ký Course thông qua Enrollment; Course gồm nhiều Section, mỗi Section gồm nhiều Lesson. Từ đó, hệ thống liên kết được quá trình học, tiến độ lesson, quiz, chứng chỉ và đơn hàng tương ứng.

Với các bảng giao dịch cốt lõi, thiết kế tuân theo nguyên tắc chuẩn hóa 3NF. Tuy nhiên, một số dữ liệu được phi chuẩn hóa có kiểm soát để phục vụ hiệu năng và báo cáo, như progress percent, lượt dùng voucher, materialized view tổng hợp rating và audit log dạng JSONB.

Database cũng đảm nhận một phần toàn vẹn nghiệp vụ qua primary key, foreign key, unique/check constraint, enum và trigger. Ví dụ, chỉ người đã đăng ký mới có thể học hoặc đánh giá khóa học; tiến độ course được đồng bộ từ lesson; và voucher chỉ tăng lượt sử dụng khi đơn hàng đã thanh toán thành công.

## Slide 21 — Course, media và search platform

Slide này mô tả pipeline xử lý một khóa học từ khi được tạo đến khi người học có thể tìm kiếm và xem nội dung.

Khóa học được tổ chức theo Course, Section và Lesson, đi kèm thông tin giá, nội dung và cấu trúc học liệu.

Khi giảng viên tải video, hệ thống cung cấp S3 Presigned URL để client tải trực tiếp lên S3 thay vì đi qua backend. Cách này giảm tải cho server ứng dụng và phù hợp với file video có dung lượng lớn.

Sau đó, MediaConvert xử lý video thành HLS để người học có thể phát nội dung theo chất lượng thích ứng. Nội dung video được phân phối qua CloudFront để tăng tốc truy cập.

Ở phần khám phá khóa học, Elasticsearch hỗ trợ tìm kiếm full-text và các tiêu chí lọc. Nhờ đó, người học có thể tìm khóa học phù hợp nhanh hơn, còn hệ thống vẫn duy trì được hiệu năng khi dữ liệu tăng lên.

## Slide 22 — CI/CD và hạ tầng AWS

Về triển khai, dự án sử dụng GitHub Actions cho các bước test, build và kiểm tra chất lượng mã nguồn.

Khi triển khai, GitHub Actions xác thực với AWS qua OIDC, không cần lưu access key tĩnh trong repository. Workflow sử dụng AWS Systems Manager để điều phối lệnh triển khai trên EC2; các cấu hình production được lấy từ Parameter Store.

Trên EC2, Docker Compose khởi chạy frontend, backend, PostgreSQL, Elasticsearch và AI service dưới dạng các container. Nginx phục vụ frontend và reverse proxy các API về backend.

Ở tầng ngoài, ALB đảm nhiệm HTTPS/SSL và phân phối request đến máy chủ ứng dụng. Terraform được dùng để quản lý hạ tầng dưới dạng code, gồm EC2, ALB, Route 53, ACM, IAM Role và các thành phần AWS liên quan.

Cách triển khai này giúp nhóm tái lập môi trường, giảm thao tác thủ công và quản lý cấu hình production an toàn hơn.

## Slide 23 — Kết thúc

Qua dự án LearnOva, nhóm đã xây dựng một nền tảng học trực tuyến kết nối hành trình từ khám phá khóa học, thanh toán, học video, kiểm tra kiến thức, hỗ trợ giảng viên đến quản trị và vận hành hệ thống.

Dự án hiện có nền tảng để tiếp tục phát triển các hướng như AI theo ngữ cảnh, recommendation và mở rộng hạ tầng khi nhu cầu sử dụng tăng lên.

Nhóm chúng em xin chân thành cảm ơn Hội đồng đã lắng nghe. Chúng em sẵn sàng tiếp nhận câu hỏi và phản hồi từ Hội đồng.
