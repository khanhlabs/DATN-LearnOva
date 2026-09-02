# Defense Auto Deploy — GitHub Actions đến EC2 qua OIDC và SSM

**File nguồn chính:** `.github/workflows/deploy.yml`. Auto deploy chạy khi có `push` vào `main`.

## 1. Sơ đồ luồng deploy

```text
push main
  → GitHub-hosted runner
  → OIDC nhận AWS temporary credential
  → kiểm tra/start EC2 nếu đang dừng
  → AWS Systems Manager Run Command
  → EC2: fetch origin/main + lấy secrets Parameter Store
  → docker compose up --build -d
  → frontend / backend / postgres / elasticsearch / ai-service chạy lại
```

## 2. Trigger và quyền GitHub

Trong `deploy.yml`:

```yaml
on:
  push:
    branches: [main]
permissions:
  id-token: write
  contents: read
```

- Không dùng `workflow_dispatch` ở trạng thái hiện tại vì dòng đó bị comment.
- `id-token: write` cho phép GitHub phát hành OIDC token, không phải quyền ghi repository.
- `contents: read` đủ cho metadata/checkout nếu cần.

## 3. Chặng 1 — lấy AWS credential không lưu access key dài hạn

Step `Configure AWS credentials via OIDC` dùng `aws-actions/configure-aws-credentials@v4` với:

- `role-to-assume: vars.AWS_ROLE_ARN`
- region `ap-southeast-1`

GitHub gửi OIDC token cho AWS STS; AWS chỉ cấp credential tạm thời nếu trust policy của IAM Role chấp nhận repository/branch phù hợp. Repository không chứa AWS access key/secret key tĩnh.

## 4. Chặng 2 — bảo đảm EC2 sẵn sàng

Step `Start EC2 instance if stopped`:

1. `aws ec2 describe-instances` lấy state của `vars.EC2_INSTANCE_ID`.
2. Nếu không `running`, gọi `aws ec2 start-instances`.
3. `aws ec2 wait instance-running` và `wait instance-status-ok`.

Điều này hỗ trợ EC2 bị stop để tiết kiệm chi phí. Biến instance ID và role ARN là GitHub Variables, không hard-code vào source.

## 5. Chặng 3 — chạy lệnh trên EC2 không cần SSH

Step `Deploy via SSM Run Command` gọi `aws ssm send-command` với document AWS chuẩn `AWS-RunShellScript`. Runner không mở SSH vào server và không giữ private key SSH.

Các lệnh trên EC2 đi theo thứ tự:

```text
1. Bảo đảm /app là Git working tree
2. Clone repository lần đầu (nếu chưa có)
3. cd /app; git fetch origin; git reset --hard origin/main
4. Lấy /learnova/prod/env từ SSM Parameter Store → back_end/.env-prod
5. Lấy CloudFront private key từ Parameter Store → file local readonly mode 400
6. docker compose --env-file back_end/.env-prod -f docker-compose.prod.yml up --build -d
```

GitHub Actions poll `aws ssm get-command-invocation` tối đa 30 lần, mỗi 10 giây. `Success` kết thúc 0; `Failed`, `Cancelled`, `TimedOut` in chi tiết command rồi fail workflow.

## 6. Secrets và lý do thiết kế

- Các secret ứng dụng (DB/JWT/AWS/PayOS/Gemini...) ở SSM Parameter Store SecureString `/learnova/prod/env`, chỉ được tải lúc deploy vào `back_end/.env-prod` trên EC2.
- CloudFront signing private key dùng parameter riêng và mount read-only cho backend qua Compose, không build vào image hay commit Git.
- OIDC: credential của GitHub là temporary, giảm rủi ro lộ access key dài hạn.
- SSM: quản trị EC2 không cần public SSH/port 22 cho pipeline.

## 7. Container được cập nhật như thế nào

`docker compose ... up --build -d` đọc `docker-compose.prod.yml`:

- build image frontend từ `front_end/Dockerfile`;
- build backend từ `back_end/Dockerfile`;
- build `ai-service` từ `ai_services`;
- giữ volume named `prod_pg_data`, `prod_es_data` cho PostgreSQL/Elasticsearch;
- `restart: unless-stopped` cho các service.

Do dùng `--build`, phiên bản source mới được build ngay trên EC2. Đây là deploy bằng source + Docker Compose, **không phải** workflow build image ở CI rồi push/pull từ ECR.

## 8. Điểm cần nói chính xác khi bảo vệ

- Workflow dùng `git reset --hard origin/main` trên thư mục clone ở EC2. Đây là hành động triển khai có chủ ý để host phản chiếu chính xác main; không áp dụng nó ở máy phát triển.
- Deploy workflow hiện không có health-check HTTP sau `docker compose up`; thành công SSM xác nhận command hoàn tất, không tự chứng minh toàn bộ app endpoint healthy.
- `docker compose up --build -d` là recreate theo Compose, không phải blue-green/canary và không bảo đảm zero downtime.
- Như nêu ở tài liệu CI, deploy hiện không `needs` quality workflow. Cải tiến tiếp theo là để deploy chỉ chạy sau test/build/E2E thành công.
