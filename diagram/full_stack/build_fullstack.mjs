// LearnOva Backend+Frontend combined architecture — type "pipeline" (system-level request flow, LR).
// One box per system layer (detail lives in learnova_backend_architecture.drawio / learnova_frontend_architecture.drawio).
import { writeFileSync } from "node:fs";
import { Diagram } from "../../../../AgentSkill/drawio-ai-kit/src/builder.mjs";
import { frame, band, endpoint, ossBox, icon, phantom, renderTree } from "../../../../AgentSkill/drawio-ai-kit/src/layout-engine.mjs";

const d = new Diagram("pipeline");

const frontend = frame("fe", "Frontend — React SPA (Vite)", { dir: "col", gap: 12 }, [
  ossBox("router", "Router · Layouts · Pages\n(role-gated: Public/User/Teacher/Admin)"),
  ossBox("state", "AuthContext + hooks\n(UseAuth, UseAxiosPrivate)"),
  ossBox("axios", "AxiosClient + domain API modules\n(withCredentials, VITE_API_URL)"),
]);

const backend = frame("be", "Backend — Spring Boot", { dir: "col", gap: 12 }, [
  ossBox("security", "CorsConfig · JwtAuthenticationFilter\nOAuth2SuccessHandler · RateLimitInterceptor"),
  ossBox("controllers", "Controllers (Public/Admin/Teacher API)"),
  ossBox("services", "Services\n(business logic · SearchService · AiServiceClient · Scheduler)"),
  ossBox("repos", "Repositories\n(Spring Data JPA · CourseSearchRepository)"),
]);

const dataStores = frame("data", "Data stores", { dir: "col", gap: 12 }, [
  icon("pg", "postgres", "PostgreSQL"),
  icon("es", "elasticsearch", "Elasticsearch"),
]);

const xcut = band("xcut", "External services", [
  icon("cf", "cloudfront", "CloudFront\n(signed URL HLS)"),
  ossBox("payos", "PayOS\n(payment gateway)"),
  ossBox("aiservice", "ai-service (FastAPI)\n-> Gemini API"),
  icon("s3", "s3", "S3 (video storage)"),
  icon("mc", "elemental_mediaconvert", "MediaConvert (HLS)"),
  ossBox("oauthprov", "Google / Facebook\nOAuth2 providers"),
]);

const tree = phantom("root", "", { dir: "col", gap: 30, header: 0, pad: 10 }, [
  phantom("pipe", "", { dir: "row", gap: 60, align: "top", header: 0 }, [
    endpoint("user", "USER\n(Browser)"),
    frontend,
    backend,
    dataStores,
  ]),
  xcut,
]);

renderTree(d, tree, [40, 80]);
d.title("LearnOva — Backend + Frontend architecture");

d.link("user", "router", "renders SPA", { flow: true });
d.link("router", "state", "");
d.link("state", "axios", "");
d.link("axios", "security", "REST API + HttpOnly cookie\n(CORS, credentials)", { flow: true });
d.link("security", "controllers", "", { flow: true });
d.link("controllers", "services", "", { flow: true });
d.link("services", "repos", "", { flow: true });
d.link("repos", "pg", "", { flow: true });
d.link("repos", "es", "", { role: "fanout" });
d.link("services", "aiservice", "", { dash: true });
d.link("services", "s3", "", { role: "fanout" });
d.link("services", "payos", "checkout / webhook", { dash: true });
d.link("security", "oauthprov", "OAuth2 redirect\n-> /oauth2-success (FE)", { dash: true });
d.link("cf", "mc", "", { dash: true });
d.link("router", "cf", "direct video playback\n(bypasses backend)", { dash: true });
d.link("router", "payos", "hosted checkout redirect\n-> /payment/success|cancel", { dash: true });

const res = d.validate();
console.log("VALIDATE:", JSON.stringify({ ok: res.ok, errors: res.errors, warnings: res.warnings, advice: res.audit.advice }));
writeFileSync(new URL("./learnova_fullstack_architecture.drawio", import.meta.url), d.mxfile("LearnOva — Backend + Frontend architecture"));
