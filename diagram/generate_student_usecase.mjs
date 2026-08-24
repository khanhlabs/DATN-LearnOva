// Detailed Student use-case map based on the implemented LearnOva controllers.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const output = resolve(import.meta.dirname, "usecase_student.drawio");
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
// Primary student capabilities form the ring around the actor.
const main = [
  ["discover", "Khám phá khóa học", 770, 510],
  ["account", "Quản lý tài khoản", 1190, 430],
  ["learning", "Học khóa học", 1600, 600],
  ["commerce", "Quản lý mua khóa học", 620, 1010],
  ["interaction", "Tương tác học tập", 1720, 1030],
  ["support", "Nhận hỗ trợ", 800, 1510],
  ["notification", "Quản lý thông báo", 1260, 1600],
];
// Detailed operations come directly from Auth/User/Search/Course/Learning/
// Assessment/Commerce/Notification/SupportChat/ChatBot endpoints.
const detail = [
  ["search", "Tìm kiếm khóa học\ntheo từ khóa", 90, 100, "discover"],
  ["category", "Xem danh mục\nkhóa học", 390, 100, "discover"],
  ["featured", "Xem khóa học\nnổi bật", 690, 90, "discover"],
  ["filter", "Lọc khóa học theo\ndanh mục", 80, 300, "discover"],
  ["course_detail", "Xem thông tin\nchi tiết khóa học", 360, 300, "discover"],
  ["curriculum", "Xem giáo trình\nvà đánh giá", 660, 290, "discover"],
  ["teacher", "Xem & theo dõi\ngiảng viên", 110, 510, "discover"],
  ["register", "Đăng ký tài khoản", 1040, 80, "account"],
  ["login", "Đăng nhập / đăng xuất", 1340, 80, "account"],
  ["verify", "Xác thực email", 1640, 80, "account"],
  ["password", "Đổi / khôi phục\nmật khẩu", 1940, 80, "account"],
  ["profile", "Cập nhật hồ sơ\nvà ảnh đại diện", 2050, 300, "account"],
  ["role", "Chuyển đổi vai trò", 2000, 510, "account"],
  ["enroll", "Đăng ký khóa học", 2140, 690, "learning"],
  ["lesson", "Xem video &\nnội dung bài học", 2150, 900, "learning"],
  ["progress", "Theo dõi tiến độ\nhọc tập", 2170, 1110, "learning"],
  ["quiz", "Làm & nộp\nbài quiz", 2130, 1320, "learning"],
  ["certificate", "Nhận chứng chỉ", 2020, 1520, "learning"],
  ["wishlist", "Xem danh sách\nyêu thích", 80, 810, "commerce"],
  ["wishlist_edit", "Thêm / xóa khóa học\nyêu thích", 320, 1000, "commerce"],
  ["cart", "Xem & đồng bộ\ngiỏ hàng", 80, 1210, "commerce"],
  ["cart_edit", "Thêm / xóa khóa học\nkhỏi giỏ hàng", 330, 1400, "commerce"],
  ["voucher", "Nhận & áp dụng\nvoucher", 110, 1610, "commerce"],
  ["payment", "Tạo / hủy\nthanh toán", 390, 1770, "commerce"],
  ["payment_history", "Xem lịch sử &\nhóa đơn", 700, 1880, "commerce"],
  ["review", "Viết / sửa / xóa\nđánh giá khóa học", 1700, 1790, "interaction"],
  ["question", "Đặt câu hỏi\nbài học", 2010, 1730, "interaction"],
  ["answer", "Trả lời & cập nhật\nhỏi đáp", 2020, 1930, "interaction"],
  ["support_chat", "Tạo hội thoại\nhỗ trợ", 630, 2050, "support"],
  ["support_message", "Gửi & xem\ntin nhắn hỗ trợ", 950, 2120, "support"],
  ["ai", "Sử dụng trợ lý AI", 1270, 2110, "support"],
  ["notify_view", "Xem danh sách\nthông báo", 1560, 2090, "notification"],
  ["notify_read", "Đánh dấu thông báo\nđã đọc", 1850, 2100, "notification"],
];
const cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>'];
// Secondary relations: dashed «include» lines in the outer ring.
for (const [id, , , , parent] of detail) cells.push(`<mxCell id="i_${id}" value="«include»" style="edgeStyle=none;html=1;dashed=1;dashPattern=8 8;strokeColor=#111827;strokeWidth=1.3;endArrow=open;endFill=0;fontSize=14;labelBackgroundColor=#FFFFFF;" edge="1" parent="1" source="${parent}" target="${id}"><mxGeometry relative="1" as="geometry"/></mxCell>`);
// Primary relations are direct straight lines radiating from the central actor.
for (const [id] of main) cells.push(`<mxCell id="a_${id}" value="" style="edgeStyle=none;html=1;strokeColor=#111827;strokeWidth=1.6;endArrow=none;startArrow=none;" edge="1" parent="1" source="student" target="${id}"><mxGeometry relative="1" as="geometry"/></mxCell>`);
cells.push('<mxCell id="student" value="Học viên" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fontSize=22;fontColor=#111827;strokeColor=#111827;fillColor=none;" vertex="1" parent="1"><mxGeometry x="1240" y="970" width="140" height="175" as="geometry"/></mxCell>');
for (const [id, label, x, y] of main) cells.push(`<mxCell id="${id}" value="${esc(label)}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#111827;strokeWidth=2;fontColor=#111827;fontSize=21;align=center;verticalAlign=middle;spacing=10;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="360" height="115" as="geometry"/></mxCell>`);
for (const [id, label, x, y] of detail) cells.push(`<mxCell id="${id}" value="${esc(label).replaceAll("\n", "&lt;br&gt;")}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#111827;strokeWidth=1.6;fontColor=#111827;fontSize=18;align=center;verticalAlign=middle;spacing=8;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="270" height="88" as="geometry"/></mxCell>`);
const xml = `<mxfile host="app.diagrams.net" modified="2026-08-19T00:00:00.000Z" agent="Codex" version="26.0.14"><diagram id="learnova_student_usecase" name="LEARNOVA · USE CASE HỌC VIÊN"><mxGraphModel dx="1600" dy="1200" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2460" pageHeight="2300" math="0" shadow="0"><root>${cells.join("")}</root></mxGraphModel></diagram></mxfile>`;
writeFileSync(output, xml);
console.log(`Generated ${main.length} primary and ${detail.length} detailed student use cases.`);
