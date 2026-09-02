# Defense kiến trúc AWS sau deploy

Tài liệu này chỉ khẳng định thành phần thể hiện trong Compose, GitHub workflow, cấu hình AWS và Terraform hiện có. Những thành phần không có IaC/cấu hình trong repository (ví dụ DNS hoặc ALB thực tế) được ghi là suy luận, không coi là bằng chứng triển khai.

## 1. Sơ đồ kiến trúc đã triển khai

```text
Người dùng
   │ HTTPS (lớp TLS ngoài container; nginx có forward-header support)
   ▼
EC2
 └─ Docker Compose production
    ├─ frontend: Nginx :80
    │     ├─ React/Vite static files
    │     └─ reverse proxy /api, /oauth2, /login, /ws → backend:8080
    ├─ backend: Spring Boot :8080 (không expose host port)
    │     ├─ PostgreSQL container :5432 + volume prod_pg_data
    │     ├─ Elasticsearch container :9200 + volume prod_es_data
    │     └─ ai-service container :8000
    │
    └─ secrets: SSM Parameter Store → env file / private key mount read-only

AWS managed services gọi từ backend/browser
    ├─ S3: source video, thumbnail, resource, HLS output
    ├─ MediaConvert: source video → HLS
    ├─ CloudFront + OAC + signed URL: phân phối HLS/media private từ S3
    ├─ IAM / STS OIDC / SSM: deploy và secrets
    └─ Groq/Gemini: dịch vụ AI bên ngoài/tích hợp AI
```

## 2. Bằng chứng theo file cấu hình

| Thành phần | Bằng chứng | Vai trò |
|---|---|---|
| EC2 + SSM | `.github/workflows/deploy.yml` | Host container, nhận deploy bằng SSM Run Command. |
| Frontend Nginx | `front_end/Dockerfile`, `front_end/nginx.conf` | Serve static SPA port 80, reverse proxy backend. |
| Backend Spring Boot | `back_end/Dockerfile`, `docker-compose.prod.yml` | API, nghiệp vụ, scheduler, kết nối dịch vụ phụ. |
| PostgreSQL | `docker-compose.prod.yml` service `postgres` | Database persistent, health check trước backend. |
| Elasticsearch | Compose service `elasticsearch` | Chỉ mục search; backend dùng `ES_URIS`. |
| AI service | Compose service `ai-service`, `AI_SERVICE_URL=http://ai-service:8000` | Service nội bộ sinh summary/quiz. |
| S3/CloudFront/WAF | `infra/terraform/cloudfront.tf` | S3 private origin, OAC, signed key group, WAF CloudFront. |
| MediaConvert | `MediaConvertConfig`, `MediaConvertService`, env properties | Chuyển source video sang HLS. |

## 3. Network trong Docker Compose

Compose cung cấp private network nội bộ và DNS service name. Backend kết nối:

```text
DB_URL = jdbc:postgresql://postgres:5432/${DB_NAME}
ES_URIS = http://elasticsearch:9200
AI_SERVICE_URL = http://ai-service:8000
```

Chỉ `frontend` publish `80:80` ra host. `backend`, PostgreSQL, Elasticsearch, ai-service không khai báo `ports` production, do đó không trực tiếp nhận Internet request qua host port. Nginx là điểm vào web/API của stack.

## 4. Container image và persistence

- Frontend Dockerfile: Node 22 build Vite, sau đó copy `dist` vào Nginx 1.27 Alpine; image chạy runtime chỉ chứa static bundle + Nginx.
- Backend Dockerfile: Temurin JDK 25 build JAR Maven, final image Temurin JRE 25 chạy `java -jar app.jar` port 8080.
- PostgreSQL dùng named volume `prod_pg_data`; Elasticsearch dùng `prod_es_data`. Rebuild/recreate app containers không chủ động xóa hai volume này.
- `depends_on` chờ Postgres/Elasticsearch healthy, ai-service started; backend mới khởi động.

## 5. Storage và media private

Terraform `infra/terraform/cloudfront.tf` mô tả CloudFront distribution cho bucket video:

- S3 là origin, CloudFront truy cập qua Origin Access Control (OAC) SigV4.
- Bucket policy chỉ cho CloudFront service principal đọc object khi SourceArn khớp distribution.
- CloudFront chỉ GET/HEAD, redirect HTTPS, cache optimized, yêu cầu trusted key group.
- WAF có managed IP reputation, common rule set và known bad inputs rule set.
- `prevent_destroy = true` giảm rủi ro Terraform destroy nhầm distribution live.

Backend dùng `S3Service` tạo presigned upload URL và tạo CloudFront signed URL khi phân phối media. Private key được mount vào `/app/secrets/cloudfront-private-key.pem` read-only, không nằm trong image.

## 6. Những giới hạn phải nói đúng

- Repository thể hiện EC2, Compose, S3, CloudFront, MediaConvert, SSM; không có Terraform/CloudFormation cho ALB, Route 53, VPC hoặc certificate. Comment Nginx nhắc “TLS ends at ALB”, nhưng đây chỉ là dấu hiệu có thể có lớp TLS/ALB ngoài Compose, không đủ để khẳng định cấu hình chi tiết.
- PostgreSQL và Elasticsearch đang chạy container trên một EC2, không phải RDS/OpenSearch managed service. Đây là kiến trúc phù hợp demo/quy mô nhỏ; khả năng HA/scale ngang bị giới hạn bởi single host.
- Elasticsearch security trong Compose đặt `xpack.security.enabled=false`; nó chỉ nên ở private network và không expose ra Internet.
