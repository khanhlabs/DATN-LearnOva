// LearnOva Backend architecture (Spring Boot) — type "pipeline" (layered request flow, LR).
// Source: back_end/src/main/java/com/example/back_end (controller/service/repository/security/config/scheduler).
import { writeFileSync } from "node:fs";
import { Diagram } from "../../../AgentSkill/drawio-ai-kit/src/builder.mjs";
import { stage, band, endpoint, ossBox, icon, phantom, renderTree } from "../../../AgentSkill/drawio-ai-kit/src/layout-engine.mjs";

const d = new Diagram("pipeline");

const security = stage("sec", 0, "Security & Gateway", [
  ossBox("secbox", "SecurityConfig\nJwtAuthenticationFilter\nOAuth2SuccessHandler\nRateLimitInterceptor"),
]);

const adapters = stage("adpt", 1, "Inbound Adapters\n(adapter/in/web)", [
  ossBox("pubctl", "Public API Controllers\nAuth · User · Course\nEnrollment · Payment · Review\nSearch · Notification\nCertificate · Lesson Q&A"),
  ossBox("adminctl", "Admin API Controllers\nCategory · Dashboard\nCourse Approval · Payout\nRevenue · Tag · Reports\nTeacherApplication · Voucher"),
  ossBox("teacherctl", "Teacher API Controllers\nAnnouncement · Course\nLesson · Promotion · Q&A\nRevenue · Analytics\nStudent · Review · Profile"),
]);

const services = stage("svc", 2, "Application Layer\n(application)", [
  ossBox("bizsvc", "Business Services\n(AuthService, PaymentService,\nCourseService, NotificationService,\nReviewService, EnrollmentService...)"),
  ossBox("searchsvc", "SearchService /\nCourseIndexService"),
  ossBox("scheduler", "Scheduler Jobs\nHlsJobStatusScheduler\nCleanupRefreshToken\nNotificationCleanup"),
]);

const domain = stage("domain", 3, "Domain Layer\n(domain)", [
  ossBox("entities", "JPA Domain Entities\nUser · Course · Section · Lesson\nEnrollment · Order · Payment\nVoucher · Review · Notification"),
]);

const infra = stage("infra", 4, "Outbound Infrastructure\n(infrastructure)", [
  ossBox("jpa", "Spring Data JPA repositories\n(UserRepository, CourseRepository,\nOrderRepository, PaymentRepository,\nEnrollmentRepository, VoucherRepository...)"),
  ossBox("essearch", "CourseSearchRepository\n(Elasticsearch)"),
  ossBox("aiclient", "AiServiceClient (FastAPI client)"),
  ossBox("s3service", "S3Service (AWS S3)"),
  ossBox("mcservice", "MediaConvertService"),
  ossBox("payos", "PayOSService (PayOS SDK)"),
]);

const data = stage("data", 5, "Data stores", [
  icon("pg", "postgres", "PostgreSQL\n(Flyway migrations)"),
  icon("es", "elasticsearch", "Elasticsearch\n(CourseDocument)"),
]);

const xcut = band("xcut", "External integrations (cross-cutting)", [
  ossBox("oauthprov", "Google / Facebook\nOAuth2 providers"),
  ossBox("aiservice", "ai-service (FastAPI)\n/summarize · /generate-quiz\n-> Gemini API"),
  icon("s3", "s3", "S3 (storage)"),
  icon("cf", "cloudfront", "CloudFront\n(signed URLs)"),
  icon("mc", "elemental_mediaconvert", "MediaConvert (HLS)"),
  ossBox("payos_ext", "PayOS\n(payment gateway)"),
]);

const tree = phantom("root", "", { dir: "col", gap: 30, header: 0, pad: 10 }, [
  phantom("pipe", "", { dir: "row", gap: 50, align: "top", header: 0 }, [
    endpoint("client", "FRONTEND /\nAPI CLIENTS"),
    security,
    adapters,
    services,
    domain,
    infra,
    data,
  ]),
  xcut,
]);

renderTree(d, tree, [40, 80]);
d.title("LearnOva — Backend architecture (Spring Boot)");

d.link("client", "secbox", "HTTPS + cookie", { flow: true });
d.link("secbox", "pubctl", "", { flow: true });
d.link("secbox", "adminctl", "", { role: "fanout" });
d.link("secbox", "teacherctl", "", { role: "fanout" });
d.link("pubctl", "bizsvc", "", { flow: true });
d.link("adminctl", "bizsvc", "", { role: "fanout" });
d.link("teacherctl", "bizsvc", "", { role: "fanout" });
d.link("bizsvc", "entities", "domain logic", { flow: true });
d.link("searchsvc", "entities", "");
d.link("entities", "jpa", "persist", { flow: true });
d.link("searchsvc", "essearch", "");
d.link("jpa", "pg", "", { flow: true });
d.link("essearch", "es", "");
d.link("bizsvc", "aiclient", "", { role: "fanout" });
d.link("aiclient", "aiservice", "HTTP\nAI_SERVICE_URL", { dash: true });
d.link("bizsvc", "s3service", "", { role: "fanout" });
d.link("s3service", "s3", "direct upload/download", { dash: true });
d.link("bizsvc", "mcservice", "", { role: "fanout" });
d.link("mcservice", "mc", "transcode HLS", { dash: true });
d.link("bizsvc", "payos", "", { role: "fanout" });
d.link("payos", "payos_ext", "checkout / webhook", { dash: true });
d.link("secbox", "oauthprov", "", { dash: true });
d.link("scheduler", "jpa", "", { dash: true });

const res = d.validate();
console.log("VALIDATE:", JSON.stringify({ ok: res.ok, errors: res.errors, warnings: res.warnings, advice: res.audit.advice }));
writeFileSync(new URL("./learnova_backend_architecture.drawio", import.meta.url), d.mxfile("LearnOva — Backend architecture"));
