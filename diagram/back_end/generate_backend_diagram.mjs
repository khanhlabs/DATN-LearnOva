import { writeFileSync } from "node:fs";
import { Diagram } from "../../skills/.claude/skills/drawio-ai-kit/src/builder.mjs";
import { group, frame, icon, box, phantom, renderTree } from "../../skills/.claude/skills/drawio-ai-kit/src/layout-engine.mjs";

const d = new Diagram("network");

// 1. Frontend
const frontend = box("frontend", "FRONTEND (ReactJS + Vite)\nWeb Browser / Mobile Web", { w: 350, h: 60, fill: "#F2F9FF", stroke: "#0066CC", bold: true });

// 2. Left Column: Integrations
const emailService = box("email", "EMAIL SERVICE (SMTP)\nGửi email xác thực\nGmail SMTP", { w: 200, h: 80, fill: "#FFFFFF", stroke: "#333333" });
const aiServiceLeft = box("ai_left", "AI SERVICE (FASTAPI)\nXử lý AI: Whisper, Summary, Quiz", { w: 200, h: 80, fill: "#F1F8E9", stroke: "#689F38" });
const notifService = box("notif", "NOTIFICATION SERVICE\nThông báo trong hệ thống", { w: 200, h: 80, fill: "#F3E5F5", stroke: "#8E24AA" });
const leftCol = phantom("left_col", "", { dir: "col", gap: 40 }, [emailService, aiServiceLeft, notifService]);

// 3. Center Column: Spring Boot Backend
const secLayer = group("sec", "group_subnet", "SECURITY LAYER", { dir: "row", gap: 15 }, [
    box("sec1", "Spring Security", { w: 130 }),
    box("sec2", "JWT Authentication", { w: 130 }),
    box("sec3", "CORS", { w: 130 }),
    box("sec4", "Rate Limiting", { w: 130 })
]);

const ctrlRow1 = group("ctrlR1", "", "", { dir: "row", gap: 10, pad: 0 }, [
    box("c1", "Auth Controller", { w: 135 }), box("c2", "User Controller", { w: 135 }),
    box("c3", "Course Controller", { w: 135 }), box("c4", "Category Controller", { w: 135 })
]);
const ctrlRow2 = group("ctrlR2", "", "", { dir: "row", gap: 10, pad: 0 }, [
    box("c5", "Enrollment Controller", { w: 135 }), box("c6", "Payment Controller", { w: 135 }),
    box("c7", "Order Controller", { w: 135 }), box("c8", "Review Controller", { w: 135 })
]);
const ctrlLayer = group("ctrl", "group_subnet", "CONTROLLERS (API ENDPOINTS)", { dir: "col", gap: 10 }, [
    ctrlRow1, ctrlRow2
]);

const srvRow1 = group("srvR1", "", "", { dir: "row", gap: 10, pad: 0 }, [
    box("s1", "AuthService", { w: 135 }), box("s2", "UsersService", { w: 135 }),
    box("s3_srv", "CourseService", { w: 135 }), box("s4", "CategoryService", { w: 135 })
]);
const srvLayer = group("srv", "group_subnet", "SERVICES (BUSINESS LOGIC)", { dir: "col", gap: 10 }, [
    srvRow1,
    box("s_more", "Other Services...", { w: 570, h: 30 })
]);

const repoRow1 = group("repoR1", "", "", { dir: "row", gap: 10, pad: 0 }, [
    box("r1", "UserRepository", { w: 135 }), box("r2", "CourseRepository", { w: 135 }),
    box("r3", "CategoryRepository", { w: 135 }), box("r4", "OrderRepository", { w: 135 })
]);
const repoLayer = group("repo", "group_subnet", "SPRING DATA JPA (REPOSITORIES)", { dir: "col", gap: 10 }, [
    repoRow1
]);

const entityRow = group("entR1", "", "", { dir: "row", gap: 10, pad: 0 }, [
    box("e1", "User", { w: 80 }), box("e2", "Role", { w: 80 }), box("e3", "Course", { w: 80 }), 
    box("e4", "Category", { w: 80 }), box("e5", "Lesson", { w: 80 }), box("e6", "Order", { w: 80 })
]);
const entityLayer = group("entity", "group_subnet", "ENTITIES (DOMAIN MODELS)", { dir: "col", gap: 10 }, [
    entityRow
]);

const springBoot = group("springboot", "group_vpc", "SPRING BOOT BACKEND (REST API)", { dir: "col", gap: 20 }, [
    secLayer, ctrlLayer, srvLayer, repoLayer, entityLayer
]);

// 4. Right Column: AWS Services & AI Service Details
const awsCloud = group("aws", "group_region", "AWS CLOUD SERVICES", { dir: "col", gap: 20 }, [
    icon("s3", "s3", "AMAZON S3\nUpload/Download"),
    icon("cf", "cloudfront", "AMAZON CLOUDFRONT\nCDN Signed URL"),
    box("mc", "AWS MEDIACONVERT\nHLS Streaming", { w: 140, h: 60 })
]);

const aiServiceRight = box("ai_right", "AI SERVICE (FASTAPI)\nWhisper / Summary / Quiz\nAPI độc lập qua HTTP", { w: 160, h: 80, dash: true });
const rightCol = phantom("right_col", "", { dir: "col", gap: 40 }, [awsCloud, aiServiceRight]);

// 5. Database
const db = box("db", "POSTGRESQL DATABASE\nPrimary / Replication / Backup", { w: 300, h: 60, fill: "#FFEBEE", stroke: "#D32F2F", bold: true });

// Assemble Main Topology
const mainBody = phantom("main", "", { dir: "row", gap: 50, align: "top" }, [leftCol, springBoot, rightCol]);
const topLevel = phantom("top", "", { dir: "col", gap: 40, align: "center", pad: 20 }, [frontend, mainBody, db]);

renderTree(d, topLevel);

// Connections
d.link("frontend", "springboot", "HTTP/HTTPS\nRESTful API / JSON");
d.link("springboot", "db");

d.link("springboot", "email", "", { dash: true });
d.link("springboot", "ai_left", "", { dash: true });
d.link("springboot", "notif", "", { dash: true });

d.link("springboot", "s3", "", { dash: true });
d.link("springboot", "cf", "", { dash: true });
d.link("springboot", "mc", "", { dash: true });

const res = d.validate();
console.log("VALIDATE:", res.ok ? "OK" : "ERRORS", res.errors);

writeFileSync("d:/CODING/DATN/DATN-LearnOva/diagram/back_end_diagram.drawio", d.mxfile("SƠ ĐỒ KIẾN TRÚC BACKEND - LEARNOVA"));
console.log("Generated back_end_diagram.drawio successfully.");
