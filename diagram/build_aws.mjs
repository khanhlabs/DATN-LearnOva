// LearnOva AWS deployment architecture — type "network". Layout engine only, no hardcoded coords.
// Source of truth: docs/aws-deployment-architecture.md
import { writeFileSync } from "node:fs";
import { Diagram } from "../../../AgentSkill/drawio-ai-kit/src/builder.mjs";
import { group, frame, icon, box, ossBox, phantom, band, renderTree } from "../../../AgentSkill/drawio-ai-kit/src/layout-engine.mjs";

const d = new Diagram("network");

const edge = phantom("edgec", "", { dir: "col", gap: 26, header: 0 }, [
  box("user", "Trình duyệt\n(React SPA)", { w: 140, h: 50, fill: "#DAE8FC", stroke: "#6C8EBF", bold: true }),
  box("gemini", "Google Gemini API", { w: 140, h: 50 }),
]);

const ec2box = frame("ec2f", "EC2 t3.medium — learnova-app (Docker Compose)", { dir: "col", gap: 10 }, [
  icon("ec2", "ec2", "EC2 instance"),
  ossBox("nginx", "nginx :80\n(serve build + reverse proxy)"),
  ossBox("backend", "backend\nSpring Boot :8080"),
  ossBox("aiservice", "ai-service\nFastAPI :8000"),
  icon("pg", "postgres", "postgres:17-alpine :5432"),
  icon("es", "elasticsearch", "elasticsearch :9200"),
]);

const publicSubnet = group("pubsubnet", "group_subnet", "Public Subnet (default VPC, 3 AZ)", { dir: "col", gap: 12 }, [
  icon("alb", "application_load_balancer", "ALB learnova-alb\n80->443, ACM TLS"),
  ec2box,
]);

const vpc = group("vpc", "group_vpc", "Default VPC", { dir: "col", gap: 16 }, [publicSubnet]);

const region = group("region", "group_region", "ap-southeast-1", { dir: "row", gap: 40, align: "top" }, [
  frame("managed", "Managed / global services", { dir: "col", gap: 14 }, [
    icon("r53", "route_53", "Route53\nkhanh.engineer"),
    icon("cf", "cloudfront", "CloudFront"),
    icon("s3", "s3", "S3 bucket\n(video)"),
    icon("mc", "elemental_mediaconvert", "MediaConvert\nHLS"),
  ]),
  vpc,
]);

const cloud = group("cloud", "group_aws_cloud_alt", "AWS Cloud", { dir: "col", gap: 22 }, [region]);

const cicd = band("cicd", "CI/CD (GitHub Actions, OIDC — no static keys)", [
  icon("gh", "github", "GitHub\npush -> main"),
  icon("ghactions", "githubactions", "deploy.yml"),
  icon("iam", "identity_and_access_management", "OIDC assume role\nlearnova-github-actions-deploy"),
  icon("ssm", "systems_manager", "SSM RunCommand\nstart EC2 + git pull + compose up"),
], { dir: "row", gap: 20 });

const tree = phantom("root", "", { dir: "col", gap: 30, header: 0, pad: 10 }, [
  phantom("top", "", { dir: "row", gap: 70, align: "center", header: 0 }, [edge, cloud]),
  cicd,
]);

renderTree(d, tree, [40, 80]);
d.title("LearnOva — AWS deployment architecture");

d.link("user", "r53", "HTTPS\ndatn.khanh.engineer");
d.link("r53", "alb", "alias record");
d.link("alb", "ec2f");
d.link("user", "cf", "video playback\n(signed URL)");
d.link("cf", "s3");
d.link("backend", "pg", "", { role: "fanout" });
d.link("backend", "es", "", { role: "fanout" });
d.link("backend", "aiservice", "AI_SERVICE_URL", { role: "fanout" });
d.link("aiservice", "gemini", "Gemini API");
d.link("backend", "s3", "presigned upload / trigger", { dash: true });
d.link("s3", "mc", "", { dash: true });
d.link("mc", "s3");
d.link("gh", "ghactions");
d.link("ghactions", "iam", "", { dash: true });
d.link("ghactions", "ssm");
d.link("ssm", "ec2f");

const res = d.validate();
console.log("VALIDATE:", JSON.stringify({ ok: res.ok, errors: res.errors, warnings: res.warnings, advice: res.audit.advice }));
writeFileSync(new URL("./learnova_aws_architecture.drawio", import.meta.url), d.mxfile("LearnOva — AWS deployment architecture"));
