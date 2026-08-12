from html import escape
from math import cos, pi, sin
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent
W = H = 3600
CX = CY = W // 2
PRIMARY_W, PRIMARY_H = 440, 112
CHILD_W, CHILD_H = 270, 86
PRIMARY_R, CHILD_R = 600, 1230
groups = [
    ("Dashboard quản trị", ["Xem thống kê tổng quan", "Theo dõi tăng trưởng người dùng", "Xem phân bố vai trò", "Xem hoạt động gần đây"]),
    ("Quản lý người dùng", ["Xem danh sách người dùng", "Tạo người dùng", "Cập nhật người dùng / vai trò", "Xóa người dùng"]),
    ("Quản lý giảng viên", ["Xem danh sách giảng viên", "Xem chi tiết giảng viên"]),
    ("Quản lý khóa học", ["Xem danh sách khóa học", "Xem chi tiết khóa học", "Duyệt khóa học", "Từ chối khóa học"]),
    ("Kiểm duyệt báo cáo khóa học", ["Xem danh sách báo cáo", "Xem thống kê báo cáo", "Xem chi tiết báo cáo", "Bỏ qua báo cáo", "Đánh dấu đã xử lý", "Ẩn khóa học vi phạm", "Cảnh cáo giảng viên / xóa lesson"]),
    ("Duyệt hồ sơ giảng viên", ["Xem đơn chờ duyệt", "Xem chi tiết hồ sơ", "Xem CV ứng viên", "Duyệt hồ sơ", "Từ chối hồ sơ"]),
    ("Quản lý danh mục", ["Xem danh sách / danh mục con", "Tạo danh mục", "Cập nhật danh mục", "Ẩn / xóa danh mục"]),
    ("Quản lý thẻ", ["Xem danh sách thẻ", "Xem khóa học để gắn thẻ", "Tạo thẻ", "Cập nhật thẻ", "Ẩn / xóa thẻ"]),
    ("Quản lý voucher", ["Xem danh sách voucher", "Tạo voucher", "Cập nhật voucher", "Xóa voucher", "Xem lịch sử và tần suất sử dụng"]),
    ("Xem và phân tích doanh thu", ["Xem tổng quan doanh thu", "So sánh doanh thu theo kỳ", "Xem khóa học / giảng viên top doanh thu", "Xem danh sách giao dịch", "Xem insight giao dịch"]),
    ("Quản trị tìm kiếm và video", ["Reindex dữ liệu tìm kiếm", "Migration video legacy sang HLS"]),
    ("Quản lý tài khoản quản trị", ["Xem / cập nhật hồ sơ admin", "Cấu hình thiết lập admin"]),
]

def font(size, bold=False):
    p = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
    return ImageFont.truetype(p, size) if Path(p).exists() else ImageFont.load_default()

F_TITLE, F_PRIMARY, F_CHILD, F_ACTOR = font(38, True), font(23, True), font(13, True), font(25, True)

def wrap(draw, text, f, max_w):
    lines, cur = [], ""
    for word in text.split():
        test = f"{cur} {word}".strip()
        if draw.textbbox((0, 0), test, font=f)[2] <= max_w: cur = test
        else:
            if cur: lines.append(cur)
            cur = word
    if cur: lines.append(cur)
    return lines

def point(radius, angle, tangent=0):
    ux, uy = cos(angle), sin(angle)
    tx, ty = -uy, ux
    return CX + radius * ux + tangent * tx, CY + radius * uy + tangent * ty

positions = []
for i, (title, children) in enumerate(groups):
    angle = -pi / 2 + i * 2 * pi / len(groups)
    px, py = point(PRIMARY_R, angle)
    child_points = []
    for j, child in enumerate(children):
        # Spread included functions along the tangent of each radial sector.
        tangent = (j - (len(children) - 1) / 2) * 210
        child_points.append(point(CHILD_R, angle, tangent))
    positions.append((title, children, angle, (px, py), child_points))

def arrow(draw, x1, y1, x2, y2, dashed=True):
    if dashed:
        length = max(1, ((x2-x1)**2 + (y2-y1)**2) ** .5)
        for s in range(0, int(length), 28):
            t1, t2 = s / length, min(1, (s + 14) / length)
            draw.line((x1+(x2-x1)*t1, y1+(y2-y1)*t1, x1+(x2-x1)*t2, y1+(y2-y1)*t2), fill="black", width=3)
    else:
        draw.line((x1, y1, x2, y2), fill="black", width=3)
    ux, uy = (x2-x1), (y2-y1)
    length = max(1, (ux*ux + uy*uy) ** .5)
    ux, uy = ux/length, uy/length
    px, py = -uy, ux
    draw.line((x2, y2, x2-26*ux+12*px, y2-26*uy+12*py), fill="black", width=3)
    draw.line((x2, y2, x2-26*ux-12*px, y2-26*uy-12*py), fill="black", width=3)

img = Image.new("RGB", (W, H), "white")
draw = ImageDraw.Draw(img)
draw.text((CX, 42), "HÌNH – USECASE VAI TRÒ ADMIN", anchor="ma", font=F_TITLE, fill="black")

# Actor at the center, with spoke associations to the primary use cases.
for _, _, angle, (px, py), _ in positions:
    ux, uy = cos(angle), sin(angle)
    arrow(draw, CX + ux*105, CY + uy*105, px - ux*PRIMARY_W/2, py - uy*PRIMARY_H/2, dashed=False)

actor_top = CY - 82
draw.ellipse((CX-25, actor_top-45, CX+25, actor_top+5), outline="black", width=4)
draw.line((CX, actor_top+5, CX, actor_top+80), fill="black", width=4)
draw.line((CX-42, actor_top+28, CX+42, actor_top+28), fill="black", width=4)
draw.line((CX, actor_top+80, CX-38, actor_top+132), fill="black", width=4)
draw.line((CX, actor_top+80, CX+38, actor_top+132), fill="black", width=4)
draw.text((CX, actor_top+166), "Admin", anchor="ma", font=F_ACTOR, fill="black")
draw.text((CX, actor_top+198), "(Quản trị viên)", anchor="ma", font=font(20), fill="black")

for title, children, angle, (px, py), child_points in positions:
    # primary ellipse
    draw.ellipse((px-PRIMARY_W/2, py-PRIMARY_H/2, px+PRIMARY_W/2, py+PRIMARY_H/2), outline="black", width=4)
    lines = wrap(draw, title, F_PRIMARY, PRIMARY_W-35)
    for k, line in enumerate(lines):
        draw.text((px, py + (k-(len(lines)-1)/2)*28), line, anchor="mm", font=F_PRIMARY, fill="black")
    ux, uy = cos(angle), sin(angle)
    for child, (qx, qy) in zip(children, child_points):
        # «include» arrow points toward the included function.
        start = (px + ux*PRIMARY_W/2, py + uy*PRIMARY_H/2)
        end = (qx - ux*CHILD_W/2, qy - uy*CHILD_H/2)
        arrow(draw, *start, *end, dashed=True)
        mx, my = point((PRIMARY_R + CHILD_R) / 2, angle, tangent=0)
        draw.text((mx, my-13), "«include»", anchor="mm", font=font(14), fill="black")
        draw.ellipse((qx-CHILD_W/2, qy-CHILD_H/2, qx+CHILD_W/2, qy+CHILD_H/2), outline="black", width=3)
        lines = wrap(draw, child, F_CHILD, CHILD_W-30)
        for k, line in enumerate(lines):
            draw.text((qx, qy + (k-(len(lines)-1)/2)*21), line, anchor="mm", font=F_CHILD, fill="black")

img.save(OUT / "admin.png")

# Uncompressed draw.io XML with the same radial coordinates.
def esc(s): return escape(s, quote=True)
cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
cells.append(f'<mxCell id="title" value="HÌNH – USECASE VAI TRÒ ADMIN" style="text;html=1;align=center;verticalAlign=middle;fontSize=24;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="{CX-450}" y="25" width="900" height="55" as="geometry"/></mxCell>')
cells.append(f'<mxCell id="actor" value="Admin&lt;br&gt;(Quản trị viên)" style="shape=umlActor;html=1;verticalLabelPosition=bottom;verticalAlign=top;fontSize=20;" vertex="1" parent="1"><mxGeometry x="{CX-45}" y="{actor_top-45}" width="90" height="190" as="geometry"/></mxCell>')
for i, (title, children, angle, (px, py), child_points) in enumerate(positions):
    pid = f"p{i}"
    cells.append(f'<mxCell id="{pid}" value="{esc(title)}" style="ellipse;html=1;whiteSpace=wrap;fontSize=17;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="{px-PRIMARY_W/2:.0f}" y="{py-PRIMARY_H/2:.0f}" width="{PRIMARY_W}" height="{PRIMARY_H}" as="geometry"/></mxCell>')
    cells.append(f'<mxCell id="a{i}" style="edgeStyle=none;rounded=0;html=1;endArrow=none;" edge="1" parent="1" source="actor" target="{pid}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    for j, (child, (qx, qy)) in enumerate(zip(children, child_points)):
        cid = f"c{i}_{j}"
        cells.append(f'<mxCell id="{cid}" value="{esc(child)}" style="ellipse;html=1;whiteSpace=wrap;fontSize=14;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="{qx-CHILD_W/2:.0f}" y="{qy-CHILD_H/2:.0f}" width="{CHILD_W}" height="{CHILD_H}" as="geometry"/></mxCell>')
        cells.append(f'<mxCell id="i{i}_{j}" value="«include»" style="edgeStyle=none;rounded=0;html=1;dashed=1;dashPattern=8 8;endArrow=open;endFill=0;fontSize=13;" edge="1" parent="1" source="{pid}" target="{cid}"><mxGeometry relative="1" as="geometry"/></mxCell>')
xml = '<mxfile host="app.diagrams.net" modified="2026-08-12T00:00:00.000Z" agent="drawio-ai-kit" version="24.7.17"><diagram id="admin-usecase" name="Admin Use Cases"><mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" page="1" pageScale="1" pageWidth="3600" pageHeight="3600"><root>' + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>'
(OUT / "admin.drawio").write_text(xml, encoding="utf-8")
