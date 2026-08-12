// LearnOva Frontend architecture (React + Vite) — type "pipeline" (layered request flow, LR).
// Source: front_end/src (route/AppRoutes.jsx, layout/, page/, context/, hook/, api/, services/).
import { writeFileSync } from "node:fs";
import { Diagram } from "../../../AgentSkill/drawio-ai-kit/src/builder.mjs";
import { stage, band, endpoint, ossBox, box, icon, phantom, renderTree } from "../../../AgentSkill/drawio-ai-kit/src/layout-engine.mjs";

const d = new Diagram("pipeline");

const routing = stage("rt", 0, "Routing", [
  ossBox("router", "AppRoutes.jsx\n(react-router-dom v7,\nBrowserRouter)"),
  ossBox("guard", "RequireRole\n(role-based route guard)"),
]);

const layouts = stage("lay", 1, "Layouts", [
  ossBox("layouts", "HomeLayout · UserLayout\nTeacherLayout · DashboardLayout\n(admin)\n(<Outlet/> wrapper)"),
]);

const pages = stage("pg", 2, "Pages", [
  ossBox("pubpg", "Public / User pages\nhome · courses · course detail\ncart · instructors · profile\nauth · certificate verify"),
  ossBox("teacherpg", "Teacher pages\noverview · courses · promotions\nannouncements · students\nreviews · qna · revenue · analytics"),
  ossBox("adminpg", "Admin pages\ndashboard · users · teachers\ncourses · revenue · reports\nvouchers · categories · tags"),
]);

const state = stage("st", 3, "State & hooks", [
  ossBox("authctx", "AuthContext (React Context)"),
  ossBox("hooks", "UseAuth · UseAxiosPrivate\n(401 -> silent refresh -> retry)"),
]);

const api = stage("api", 4, "API layer", [
  ossBox("axios", "AxiosClient\n(withCredentials, VITE_API_URL)"),
  ossBox("apimods", "Domain API modules\nAuth/Course/Enrollment/Payment/\nQuiz/Review/Search/Notification/\nCertificate + admin/teacher"),
  ossBox("upload", "UploadService"),
]);

const xcut = band("xcut", "Direct-to-external (bypasses backend API)", [
  icon("cf", "cloudfront", "CloudFront\n(HLS video player,\nsigned URL from backend)"),
  ossBox("payos", "PayOS hosted checkout\n(redirect -> /payment/success|cancel)"),
]);

const tree = phantom("root", "", { dir: "col", gap: 30, header: 0, pad: 10 }, [
  phantom("pipe", "", { dir: "row", gap: 50, align: "top", header: 0 }, [
    endpoint("user", "USER\n(Browser)"),
    routing,
    layouts,
    pages,
    state,
    api,
    endpoint("backend", "BACKEND\nAPI (Spring Boot)"),
  ]),
  xcut,
]);

renderTree(d, tree, [40, 80]);
d.title("LearnOva — Frontend architecture (React)");

d.link("user", "router", "navigate", { flow: true });
d.link("router", "guard", "", { role: "fanout" });
d.link("guard", "layouts", "", { flow: true });
d.link("layouts", "pubpg", "", { flow: true });
d.link("layouts", "teacherpg", "", { role: "fanout" });
d.link("layouts", "adminpg", "", { role: "fanout" });
d.link("pubpg", "authctx", "", { flow: true });
d.link("teacherpg", "authctx", "", { role: "fanout" });
d.link("adminpg", "authctx", "", { role: "fanout" });
d.link("authctx", "hooks", "");
d.link("hooks", "axios", "", { flow: true });
d.link("axios", "apimods", "");
d.link("axios", "upload", "", { role: "fanout" });
d.link("apimods", "backend", "REST + cookie", { flow: true });
d.link("upload", "backend", "", { role: "fanout" });
d.link("pubpg", "cf", "video src", { dash: true });
d.link("pubpg", "payos", "checkout redirect", { dash: true });

const res = d.validate();
console.log("VALIDATE:", JSON.stringify({ ok: res.ok, errors: res.errors, warnings: res.warnings, advice: res.audit.advice }));
writeFileSync(new URL("./learnova_frontend_architecture.drawio", import.meta.url), d.mxfile("LearnOva — Frontend architecture"));
