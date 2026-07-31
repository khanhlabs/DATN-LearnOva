# Tách môi trường local và production

Project có hai compose project độc lập:

- `docker-compose.yml` (`learnova-local`): chỉ chạy PostgreSQL, Elasticsearch và AI; backend/frontend chạy trên host.
- `docker-compose.prod.yml` (`learnova-prod`): production trên EC2, chỉ publish Nginx port 80; các service còn lại chỉ dùng network nội bộ.

Hai project dùng volume riêng (`local_*` và `prod_*`) nên dữ liệu local không thể vô tình gắn vào production. Backend cũng chạy profile Spring riêng (`local`/`prod`); `local` là profile mặc định khi chạy trực tiếp bằng Maven.

## Local

```powershell
Copy-Item .env.example .env
Copy-Item back_end/.env.example back_end/.env
Copy-Item ai_services/.env.example ai_services/.env
# Điền API key cần thiết vào ai_services/.env
docker compose -f docker-compose.yml config
docker compose -f docker-compose.yml up --build
```

Sau đó chạy backend/frontend ngoài Docker:

```powershell
cd back_end
./mvnw.cmd spring-boot:run

cd ../front_end
npm run dev
```

`back_end/.env` dùng `DB_URL=jdbc:postgresql://localhost:5433/DATN`, `ES_URIS=http://localhost:9200`, `AI_SERVICE_URL=http://localhost:8000`. Mở `http://localhost:5173`.

## Production

Trên EC2, giữ `.env` ở `/app/.env` và `back_end/.env` ở `/app/back_end/.env`; cả hai không commit vào Git. `back_end/.env` chứa secrets, còn `.env` chứa biến Compose như DB credentials và có thể đặt:

```dotenv
FRONTEND_BASE_URL=https://datn.khanh.engineer
CORS_ALLOWED_ORIGINS=https://datn.khanh.engineer
```

Private key CloudFront phải tồn tại tại `/home/ec2-user/secrets/cloudfront-private-key.pem`. Deploy bằng:

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml up --build -d
```

GitHub Actions đã được trỏ explicit sang `docker-compose.prod.yml`, vì vậy deploy không phụ thuộc vào compose mặc định. Không chạy `docker compose down -v` trên production vì lệnh đó xóa volume database/search.

## Quy ước cấu hình

- `application.properties`: cấu hình chung, không chứa URL môi trường.
- `application-local.properties`: localhost và cookie không secure.
- `application-prod.properties`: URL nội bộ Docker và giá trị production lấy từ environment.
- `.env.example`: template có thể commit; `.env` thật và mọi file secrets không commit.
- Frontend dùng `/api/learnova` khi build Docker, nên local/prod đều gọi API qua Nginx cùng origin. Các luồng OAuth/verify cũng lấy origin từ `VITE_API_URL`, không còn hardcode localhost.
