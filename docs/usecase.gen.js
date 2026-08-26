// Sinh lại docs/usecase.drawio (chạy 1 lần rồi xoá file này).
const fs = require('fs');
const path = require('path');

const SUB_W = 300, SUB_H = 60, SUB_PITCH = 75;
const MAIN_W = 260, MAIN_H = 90;
const ACTOR_W = 100, ACTOR_H = 130;
const GROUP_GAP = 45;
const CONTENT_TOP = 110;
const BAND_PITCH = 1250;
const OFF_ACTOR = 40, OFF_MAIN = 320, OFF_SUB = 760;

const S_ACTOR = 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;fontSize=18;strokeWidth=1;';
const S_MAIN = 'ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;fontSize=15;strokeWidth=1;align=center;verticalAlign=middle;';
const S_SUB = 'ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;fontSize=12;strokeWidth=1;align=center;verticalAlign=middle;';
const S_FRAME = 'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#999999;dashed=1;dashPattern=8 8;verticalAlign=top;align=center;fontSize=20;fontStyle=1;fontColor=#000000;spacingTop=10;';
const S_ASSOC = 'edgeStyle=none;html=1;rounded=0;endArrow=none;startArrow=none;strokeColor=#000000;strokeWidth=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;';
const S_INCLUDE = 'edgeStyle=none;html=1;rounded=0;dashed=1;dashPattern=8 8;endArrow=open;endFill=0;endSize=10;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontSize=11;labelBackgroundColor=#FFFFFF;';
const INCLUDE_LABEL = '&amp;lt;&amp;lt;include&amp;gt;&amp;gt;';

const bands = [
  {
    title: 'GUEST',
    actor: { id: 'actor-guest', label: 'Guest' },
    mains: [
      { id: 'uc-guest-browse', label: 'Khám phá khóa học', subs: [
        ['uc-guest-view-courses', 'Xem danh sách khóa học'],
        ['uc-guest-course-detail', 'Xem chi tiết khóa học'],
        ['uc-guest-search', 'Tìm kiếm khóa học'],
        ['uc-guest-filter', 'Lọc khóa học theo danh mục / trình độ'],
        ['uc-guest-view-reviews', 'Xem đánh giá khóa học'],
        ['uc-guest-view-qna', 'Xem hỏi đáp khóa học'],
      ]},
      { id: 'uc-guest-auth', label: 'Xác thực tài khoản', subs: [
        ['uc-guest-register', 'Đăng ký tài khoản'],
        ['uc-guest-verify-email', 'Xác minh email'],
        ['uc-guest-login', 'Đăng nhập'],
        ['uc-guest-oauth', 'Đăng nhập bằng Google OAuth2'],
        ['uc-guest-forgot-password', 'Quên mật khẩu'],
        ['uc-guest-reset-password', 'Đặt lại mật khẩu'],
      ]},
      { id: 'uc-guest-instructor', label: 'Xem thông tin giảng viên', subs: [
        ['uc-guest-instructor-list', 'Xem danh sách giảng viên'],
        ['uc-guest-instructor-detail', 'Xem hồ sơ giảng viên'],
        ['uc-guest-instructor-courses', 'Xem khóa học của giảng viên'],
      ]},
      { id: 'uc-guest-chatbot', label: 'Tương tác Chatbot', subs: [
        ['uc-guest-chatbot-ask', 'Đặt câu hỏi cho trợ lý AI'],
        ['uc-guest-chatbot-suggest', 'Nhận gợi ý khóa học'],
      ]},
      { id: 'uc-guest-cert-verify', label: 'Xác minh chứng chỉ', subs: [] },
    ],
  },
  {
    title: 'USER (Học viên)',
    actor: { id: 'actor-user', label: 'User' },
    mains: [
      { id: 'uc-user-learning', label: 'Học tập', subs: [
        ['uc-user-enrolled-courses', 'Xem khóa học đã mua'],
        ['uc-user-study-lesson', 'Học bài (xem video)'],
        ['uc-user-continue-learning', 'Học tiếp bài đang học'],
        ['uc-user-track-progress', 'Theo dõi tiến độ học tập'],
        ['uc-user-lesson-summary', 'Xem tóm tắt bài học bằng AI'],
        ['uc-user-certificate', 'Nhận chứng chỉ hoàn thành'],
      ]},
      { id: 'uc-user-purchase', label: 'Mua khóa học', subs: [
        ['uc-user-cart', 'Quản lý giỏ hàng'],
        ['uc-user-voucher-apply', 'Áp dụng voucher giảm giá'],
        ['uc-user-checkout', 'Thanh toán khóa học'],
        ['uc-user-payment-history', 'Xem lịch sử thanh toán'],
        ['uc-user-wishlist', 'Quản lý danh sách yêu thích'],
      ]},
      { id: 'uc-user-profile', label: 'Quản lý hồ sơ', subs: [
        ['uc-user-view-profile', 'Xem / cập nhật thông tin cá nhân'],
        ['uc-user-avatar', 'Đổi ảnh đại diện'],
        ['uc-user-change-password', 'Đổi mật khẩu'],
        ['uc-user-notifications', 'Xem thông báo'],
      ]},
      { id: 'uc-user-interact', label: 'Tương tác học tập', subs: [
        ['uc-user-review', 'Đánh giá khóa học'],
        ['uc-user-qna-ask', 'Đặt câu hỏi trong bài học'],
        ['uc-user-qna-answer', 'Trả lời câu hỏi của học viên khác'],
        ['uc-user-quiz', 'Làm bài quiz'],
        ['uc-user-report-course', 'Báo cáo khóa học vi phạm'],
        ['uc-user-follow-instructor', 'Theo dõi giảng viên'],
      ]},
      { id: 'uc-user-support', label: 'Hỗ trợ', subs: [
        ['uc-user-chatbot', 'Trò chuyện với trợ lý AI'],
        ['uc-user-support-chat', 'Trò chuyện với bộ phận hỗ trợ'],
      ]},
      { id: 'uc-user-teacher-apply', label: 'Đăng ký làm giảng viên', subs: [
        ['uc-user-apply-submit', 'Gửi đơn đăng ký kèm CV'],
        ['uc-user-apply-status', 'Theo dõi trạng thái đơn'],
      ]},
    ],
  },
  {
    title: 'TEACHER (Giảng viên)',
    actor: { id: 'actor-teacher', label: 'Teacher' },
    mains: [
      { id: 'uc-teacher-courses', label: 'Quản lý khóa học', subs: [
        ['uc-teacher-course-create', 'Tạo khóa học mới'],
        ['uc-teacher-course-update', 'Cập nhật thông tin khóa học'],
        ['uc-teacher-course-submit', 'Gửi khóa học chờ duyệt'],
        ['uc-teacher-course-visibility', 'Ẩn / hiện khóa học'],
        ['uc-teacher-course-delete', 'Xóa khóa học'],
      ]},
      { id: 'uc-teacher-content', label: 'Quản lý nội dung', subs: [
        ['uc-teacher-section', 'Quản lý chương học'],
        ['uc-teacher-lesson', 'Quản lý bài học'],
        ['uc-teacher-video', 'Tải lên video bài học'],
        ['uc-teacher-material', 'Quản lý tài liệu bài học'],
        ['uc-teacher-quiz', 'Quản lý bài quiz'],
      ]},
      { id: 'uc-teacher-students', label: 'Quản lý học viên', subs: [
        ['uc-teacher-student-list', 'Xem danh sách học viên'],
        ['uc-teacher-announcement', 'Gửi thông báo cho học viên'],
        ['uc-teacher-qna-reply', 'Trả lời hỏi đáp của học viên'],
      ]},
      { id: 'uc-teacher-analytics', label: 'Xem thống kê', subs: [
        ['uc-teacher-dashboard', 'Xem tổng quan giảng dạy'],
        ['uc-teacher-course-stats', 'Xem thống kê theo khóa học'],
        ['uc-teacher-review-reply', 'Xem và phản hồi đánh giá'],
      ]},
      { id: 'uc-teacher-revenue', label: 'Quản lý doanh thu', subs: [
        ['uc-teacher-revenue-report', 'Xem báo cáo doanh thu'],
        ['uc-teacher-promotion', 'Quản lý chương trình khuyến mãi'],
      ]},
      { id: 'uc-teacher-profile', label: 'Quản lý hồ sơ giảng viên', subs: [
        ['uc-teacher-profile-update', 'Cập nhật hồ sơ chuyên môn'],
        ['uc-teacher-profile-social', 'Cập nhật liên kết mạng xã hội'],
      ]},
    ],
  },
  {
    title: 'ADMIN (Quản trị viên)',
    actor: { id: 'actor-admin', label: 'Admin' },
    mains: [
      { id: 'uc-admin-users', label: 'Quản lý người dùng', subs: [
        ['uc-admin-user-list', 'Xem danh sách người dùng'],
        ['uc-admin-user-create', 'Tạo tài khoản người dùng'],
        ['uc-admin-user-update', 'Cập nhật người dùng & phân quyền'],
        ['uc-admin-user-delete', 'Xóa người dùng'],
      ]},
      { id: 'uc-admin-courses', label: 'Kiểm duyệt khóa học', subs: [
        ['uc-admin-course-list', 'Xem danh sách khóa học'],
        ['uc-admin-course-detail', 'Xem chi tiết khóa học'],
        ['uc-admin-course-approve', 'Phê duyệt khóa học'],
        ['uc-admin-course-reject', 'Từ chối khóa học'],
      ]},
      { id: 'uc-admin-applications', label: 'Xử lý đơn giảng viên', subs: [
        ['uc-admin-app-list', 'Xem danh sách đơn đăng ký'],
        ['uc-admin-app-cv', 'Xem CV ứng viên'],
        ['uc-admin-app-approve', 'Phê duyệt đơn'],
        ['uc-admin-app-reject', 'Từ chối đơn'],
      ]},
      { id: 'uc-admin-reports', label: 'Xử lý báo cáo vi phạm', subs: [
        ['uc-admin-report-list', 'Xem danh sách báo cáo'],
        ['uc-admin-report-hide', 'Ẩn khóa học vi phạm'],
        ['uc-admin-report-warn', 'Cảnh báo giảng viên'],
        ['uc-admin-report-delete-lesson', 'Xóa bài học vi phạm'],
        ['uc-admin-report-resolve', 'Giải quyết / bỏ qua báo cáo'],
      ]},
      { id: 'uc-admin-catalog', label: 'Quản lý danh mục & voucher', subs: [
        ['uc-admin-category', 'Quản lý danh mục'],
        ['uc-admin-tag', 'Quản lý thẻ (tag)'],
        ['uc-admin-voucher', 'Quản lý voucher'],
        ['uc-admin-voucher-stats', 'Xem thống kê sử dụng voucher'],
      ]},
      { id: 'uc-admin-analytics', label: 'Xem thống kê hệ thống', subs: [
        ['uc-admin-dashboard', 'Xem dashboard tổng quan'],
        ['uc-admin-revenue', 'Xem doanh thu toàn hệ thống'],
        ['uc-admin-ranking', 'Xem xếp hạng khóa học & giảng viên'],
        ['uc-admin-transactions', 'Xem danh sách giao dịch'],
      ]},
    ],
  },
];

// ---- Bố cục: tính toạ độ, đảm bảo không có phần tử nào chồng lên nhau ----
for (const band of bands) {
  let cursor = CONTENT_TOP;
  for (const main of band.mains) {
    const top = cursor;
    main.subs.forEach((s, i) => { s[2] = top + i * SUB_PITCH; });
    const groupH = main.subs.length ? (main.subs.length - 1) * SUB_PITCH + SUB_H : MAIN_H;
    main.y = Math.round(top + (groupH - MAIN_H) / 2);
    cursor = top + groupH + GROUP_GAP;
  }
  band.bottom = cursor - GROUP_GAP;
}
// Khung của 4 băng cao bằng nhau cho đều, nhưng actor canh giữa theo cụm use case của chính nó.
const frameH = Math.max(...bands.map((b) => b.bottom)) + 20;
for (const band of bands) {
  band.actorY = Math.round(CONTENT_TOP + (band.bottom - CONTENT_TOP - ACTOR_H) / 2);
}

// ---- Sinh XML ----
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const out = [];
const vertex = (id, label, style, x, y, w, h) => {
  out.push(`        <mxCell id="${id}" value="${esc(label)}" style="${style}" vertex="1" parent="1">`);
  out.push(`          <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" />`);
  out.push('        </mxCell>');
};
const edge = (id, label, style, source, target) => {
  out.push(`        <mxCell id="${id}" value="${label}" style="${style}" edge="1" parent="1" source="${source}" target="${target}">`);
  out.push('          <mxGeometry relative="1" as="geometry" />');
  out.push('        </mxCell>');
};

bands.forEach((band, bi) => {
  const off = bi * BAND_PITCH;
  out.push(`        <!-- ===== ${band.title} ===== -->`);
  vertex(`frame-${bi}`, band.title, S_FRAME, off + 20, 20, 1060, frameH);
  vertex(band.actor.id, band.actor.label, S_ACTOR, off + OFF_ACTOR, band.actorY, ACTOR_W, ACTOR_H);
  out.push('');
  band.mains.forEach((main) => {
    vertex(main.id, main.label, S_MAIN, off + OFF_MAIN, main.y, MAIN_W, MAIN_H);
    main.subs.forEach((s) => vertex(s[0], s[1], S_SUB, off + OFF_SUB, s[2], SUB_W, SUB_H));
    out.push('');
  });
  band.mains.forEach((main, mi) => {
    edge(`as-${bi}-${mi}`, '', S_ASSOC, band.actor.id, main.id);
  });
  out.push('');
  band.mains.forEach((main, mi) => {
    main.subs.forEach((s, si) => {
      edge(`in-${bi}-${mi}-${si}`, INCLUDE_LABEL, S_INCLUDE, main.id, s[0]);
    });
  });
  out.push('');
});

const pageW = bands.length * BAND_PITCH - (BAND_PITCH - 1100);
const pageH = frameH + 60;
const xml = `<mxfile host="app.diagrams.net" type="device" version="24.7.17">
  <diagram id="usecase" name="Use Case Diagram">
    <mxGraphModel dx="1400" dy="800" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageW}" pageHeight="${pageH}" math="0" shadow="0" background="#FFFFFF">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

${out.join('\n')}      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

const target = path.join(__dirname, 'usecase.drawio');
fs.writeFileSync(target, xml, 'utf8');

const nMain = bands.reduce((a, b) => a + b.mains.length, 0);
const nSub = bands.reduce((a, b) => a + b.mains.reduce((x, m) => x + m.subs.length, 0), 0);
console.log(`OK -> ${target}`);
console.log(`actor=${bands.length} main=${nMain} sub=${nSub} assoc=${nMain} include=${nSub}`);
console.log(`canvas=${pageW}x${pageH}`);
