// High-level use-case diagram derived from LearnOva's implemented web modules.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const output = resolve(import.meta.dirname, "usecase_overview.drawio");
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const actors = {
  guest: ["Khách vãng lai", 60, 255],
  student: ["Học viên", 60, 1050],
  instructor: ["Giảng viên", 60, 1980],
  admin: ["Quản trị viên", 2070, 1250],
};
const usecases = [
  // Khách vãng lai
  ["uc_register", "Đăng ký tài khoản", 360, 130, ["guest"]],
  ["uc_login", "Đăng nhập / Đăng xuất", 360, 250, ["guest"]],
  ["uc_reset", "Khôi phục mật khẩu", 360, 370, ["guest"]],
  ["uc_discover", "Tìm kiếm & xem khóa học", 360, 490, ["guest", "student"]],
  ["uc_teacher_public", "Xem giảng viên", 360, 610, ["guest", "student"]],
  // Học viên
  ["uc_profile", "Quản lý hồ sơ cá nhân", 360, 900, ["student"]],
  ["uc_follow", "Theo dõi giảng viên", 360, 1020, ["student"]],
  ["uc_cart", "Quản lý giỏ hàng & yêu thích", 360, 1140, ["student"]],
  ["uc_voucher", "Áp dụng / nhận voucher", 360, 1260, ["student"]],
  ["uc_payment", "Thanh toán & xem đơn hàng", 360, 1380, ["student"]],
  ["uc_enroll", "Đăng ký khóa học", 360, 1500, ["student"]],
  ["uc_learn", "Học bài & theo dõi tiến độ", 360, 1620, ["student"]],
  ["uc_quiz", "Làm bài quiz", 360, 1740, ["student"]],
  ["uc_review", "Đánh giá khóa học", 360, 1860, ["student"]],
  ["uc_qa", "Hỏi đáp bài học", 360, 1980, ["student"]],
  ["uc_certificate", "Nhận chứng chỉ", 360, 2100, ["student"]],
  ["uc_notify", "Xem thông báo", 360, 2220, ["student", "instructor"]],
  ["uc_support", "Trò chuyện hỗ trợ", 360, 2340, ["student", "instructor"]],
  // Giảng viên
  ["uc_apply_teacher", "Đăng ký trở thành giảng viên", 950, 130, ["student"]],
  ["uc_teacher_profile", "Quản lý hồ sơ giảng viên", 950, 300, ["instructor"]],
  ["uc_course_manage", "Tạo & quản lý khóa học", 950, 470, ["instructor"]],
  ["uc_curriculum", "Quản lý section, bài học & tài liệu", 950, 640, ["instructor"]],
  ["uc_quiz_manage", "Quản lý quiz", 950, 810, ["instructor"]],
  ["uc_announcement", "Gửi thông báo khóa học", 950, 980, ["instructor"]],
  ["uc_promotion", "Quản lý khuyến mãi & tag", 950, 1150, ["instructor"]],
  ["uc_student_manage", "Theo dõi học viên", 950, 1320, ["instructor"]],
  ["uc_teacher_reviews", "Phản hồi đánh giá", 950, 1490, ["instructor"]],
  ["uc_teacher_analytics", "Xem doanh thu & phân tích", 950, 1660, ["instructor"]],
  // Quản trị viên
  ["uc_admin_users", "Quản lý người dùng", 1510, 180, ["admin"]],
  ["uc_admin_courses", "Duyệt & quản lý khóa học", 1510, 390, ["admin"]],
  ["uc_admin_categories", "Quản lý danh mục", 1510, 600, ["admin"]],
  ["uc_admin_instructors", "Quản lý giảng viên & hồ sơ", 1510, 810, ["admin"]],
  ["uc_admin_applications", "Duyệt đơn giảng viên", 1510, 1020, ["admin"]],
  ["uc_admin_vouchers", "Quản lý voucher", 1510, 1230, ["admin"]],
  ["uc_admin_reports", "Xử lý báo cáo vi phạm", 1510, 1440, ["admin"]],
  ["uc_admin_support", "Quản lý hội thoại hỗ trợ", 1510, 1650, ["admin"]],
  ["uc_admin_dashboard", "Xem dashboard & doanh thu", 1510, 1860, ["admin"]],
  ["uc_admin_system", "Quản lý tìm kiếm & HLS", 1510, 2070, ["admin"]],
];

const cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>'];
// System boundary, with all use cases enclosed like the supplied UML example.
cells.push('<mxCell id="system" value="&lt;b&gt;HỆ THỐNG HỌC TRỰC TUYẾN LEARNOVA&lt;/b&gt;" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#111827;strokeWidth=2;fontSize=22;verticalAlign=top;align=center;spacingTop=12;" vertex="1" parent="1"><mxGeometry x="250" y="45" width="1750" height="2540" as="geometry"/></mxCell>');

// Associations are emitted before nodes so ovals and actors remain crisp above lines.
let edgeId = 0;
for (const [id, , , , owners] of usecases) for (const owner of owners) {
  cells.push(`<mxCell id="a${++edgeId}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=auto;orthogonalLoop=1;strokeColor=#374151;strokeWidth=1.25;endArrow=none;startArrow=none;" edge="1" parent="1" source="actor_${owner}" target="${id}"><mxGeometry relative="1" as="geometry"/></mxCell>`);
}
for (const [key, [name, x, y]] of Object.entries(actors)) {
  cells.push(`<mxCell id="actor_${key}" value="${esc(name)}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fontSize=19;fontColor=#111827;strokeColor=#111827;fillColor=none;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="120" height="150" as="geometry"/></mxCell>`);
}
for (const [id, name, x, y] of usecases) {
  cells.push(`<mxCell id="${id}" value="${esc(name)}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#111827;strokeWidth=1.6;fontColor=#111827;fontSize=19;align=center;verticalAlign=middle;spacing=8;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="390" height="105" as="geometry"/></mxCell>`);
}
const xml = `<mxfile host="app.diagrams.net" modified="2026-08-19T00:00:00.000Z" agent="Codex" version="26.0.14"><diagram id="learnova_usecase_overview" name="LEARNOVA · USE CASE TỔNG QUÁT"><mxGraphModel dx="1600" dy="1200" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2220" pageHeight="2670" math="0" shadow="0"><root>${cells.join("")}</root></mxGraphModel></diagram></mxfile>`;
writeFileSync(output, xml);
console.log(`Generated ${usecases.length} use cases and ${edgeId} actor associations.`);
