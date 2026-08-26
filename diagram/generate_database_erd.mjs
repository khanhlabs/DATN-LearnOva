// Generates the printable LearnOva ERD from the authoritative Flyway migrations.
// Uses the drawio-ai-kit layout engine; output remains outside the kit repository.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Diagram } from "../skills/.claude/skills/drawio-ai-kit/src/builder.mjs";
import { box, frame, grid, renderTree } from "../skills/.claude/skills/drawio-ai-kit/src/layout-engine.mjs";

const root = resolve(import.meta.dirname, "..");
const migrations = ["V1__initial_schema.sql", "V3__report_table.sql", "V6__user_vouchouer.sql", "V7__create_support_chat.sql"]
  .map((f) => readFileSync(resolve(root, "back_end/src/main/resources/db/migration", f), "utf8"))
  .join("\n");

const tables = new Map();
for (const match of migrations.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
  const [_, name, body] = match;
  const columns = [...body.matchAll(/^\s*(\w+)\s+(?!PRIMARY\b|CONSTRAINT\b|UNIQUE\b|CHECK\b|FOREIGN\b)(?:\w+)/gmi)].map((m) => m[1]);
  tables.set(name.toLowerCase(), { name: name.toLowerCase(), columns, pk: [], fks: [] });
}
for (const match of migrations.matchAll(/ALTER TABLE ONLY\s+(?:public\.)?(\w+)[\s\S]{0,220}?PRIMARY KEY\s*\(([^)]+)\)/gi)) {
  const t = tables.get(match[1].toLowerCase()); if (t) t.pk = match[2].split(",").map((x) => x.trim());
}
for (const t of tables.values()) {
  const body = migrations.match(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?\\s+(?:public\\.)?${t.name}\\s*\\(([\\s\\S]*?)\\n\\);`, "i"))?.[1] ?? "";
  const inlinePk = body.match(/^\s*(\w+)\s+[^,\n]*?\s+PRIMARY KEY\b/im);
  if (inlinePk && !t.pk.length) t.pk = [inlinePk[1].trim().split(/\s+/)[0]];
}
for (const match of migrations.matchAll(/ALTER TABLE ONLY\s+(?:public\.)?(\w+)[\s\S]{0,300}?FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s+(?:public\.)?(\w+)\s*\((\w+)\)/gi)) {
  const t = tables.get(match[1].toLowerCase()); if (t) t.fks.push({ col: match[2], target: match[3].toLowerCase(), targetCol: match[4] });
}
for (const t of tables.values()) {
  const body = migrations.match(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?\\s+(?:public\\.)?${t.name}\\s*\\(([\\s\\S]*?)\\n\\);`, "i"))?.[1] ?? "";
  for (const m of body.matchAll(/^\s*(\w+)\s+[^,\n]*?REFERENCES\s+(?:public\.)?(\w+)\s*\((\w+)\)/gmi)) t.fks.push({ col: m[1], target: m[2].toLowerCase(), targetCol: m[3] });
}

// One integrated ERD page. It is intentionally a large canvas: print with
// “fit to page” when needed, or use draw.io zoom for the readable type size.
const sheets = [["LEARNOVA DATABASE ERD · ALL TABLES", [...tables.keys()].sort()]];
const xmlEscape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function buildSheet(title, owned) {
  const order = [
    "users", "roles", "user_role", "user_auth_providers", "verification_tokens",
    "instructor_profile", "instructor_follows", "teacher_applications", "auditlogs", "notifications",
    "courses", "categories", "course_categories", "tags", "course_tags",
    "sections", "lessons", "lesson_sources", "course_announcements", "lesson_summaries",
    "quizzes", "quiz_questions", "quiz_options", "quiz_attempts", "quiz_answers",
    "lesson_qa", "lesson_progress", "enrollments", "certificates", "reviews",
    "cart", "wishlist", "orders", "order_items", "payments",
    "vouchers", "user_vouchers", "promotions", "promotion_courses", "payout_requests",
    "report_categories", "reports", "support_conversations", "support_messages",
  ];
  const d = new Diagram("network");
  const style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#374151;strokeWidth=1.4;fontColor=#111827;align=center;verticalAlign=middle;spacing=8;";
  for (const [i, name] of order.entries()) {
    const t = tables.get(name); if (!t) continue;
    const fields = [...new Set([...t.pk, ...t.fks.map((f) => f.col)])].map((c) => {
      const pk = t.pk.includes(c), fk = t.fks.some((f) => f.col === c);
      return `${pk && fk ? "PK/FK" : pk ? "PK" : "FK"}&nbsp;&nbsp;${c}`;
    }).join("<br>");
    const h = Math.max(132, 82 + Math.max(1, fields.split("<br>").length) * 29);
    // Wide horizontal gutters provide dedicated, readable routing lanes.
    const x = 80 + (i % 5) * 460, y = 105 + Math.floor(i / 5) * 270;
    const label = `<div style="font-size:20px;line-height:1.3"><b style="font-size:26px">${t.name}</b><hr>${fields}</div>`;
    const r = d._put(name, "1", x, y, 330, h, style, label); r.ob = true;
  }
  d.page = [2380, 2600];
  // Route every relationship on a 10px orthogonal grid.  A generous safety
  // margin turns each table into an obstacle, leaving a clear visual gutter
  // between relation lines and table borders/content.
  // Include an off-canvas gutter in the routing grid. Tables touching a page
  // edge can therefore still connect by travelling around their outside edge.
  const step = 10, gutter = 80, minX = -gutter, minY = -gutter;
  const cols = Math.ceil((d.page[0] + gutter * 2) / step), rows = Math.ceil((d.page[1] + gutter * 2) / step);
  // Keep relations well away from table borders and content. The 130px
  // horizontal gutters still retain a generous routing channel after this.
  const clearance = 30, portOffset = 42;
  const blocked = new Uint8Array(cols * rows);
  const gridX = (x) => Math.max(0, Math.min(cols - 1, Math.round((x - minX) / step)));
  const gridY = (y) => Math.max(0, Math.min(rows - 1, Math.round((y - minY) / step)));
  const cell = (x, y) => gridY(y) * cols + gridX(x);
  const mark = (r) => {
    // Block only grid points whose centres fall inside the buffer. This keeps
    // the intentionally narrow inter-table routing channels traversable.
    const x0 = Math.max(0, Math.ceil((r.x - clearance - minX) / step)), x1 = Math.min(cols - 1, Math.floor((r.x + r.w + clearance - minX) / step));
    const y0 = Math.max(0, Math.ceil((r.y - clearance - minY) / step)), y1 = Math.min(rows - 1, Math.floor((r.y + r.h + clearance - minY) / step));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) blocked[y * cols + x] = 1;
  };
  Object.values(d.R).forEach(mark);
  const sideVector = { L: [-1, 0], R: [1, 0], T: [0, -1], B: [0, 1] };
  const opposite = { L: "R", R: "L", T: "B", B: "T" }, sides = ["L", "T", "R", "B"];
  const port = (r, side, f) => side === "L" ? [r.x, r.y + r.h * f] : side === "R" ? [r.x + r.w, r.y + r.h * f] : side === "T" ? [r.x + r.w * f, r.y] : [r.x + r.w * f, r.y + r.h];
  const findPath = (start, end, variant) => {
    const sx = gridX(start[0]), sy = gridY(start[1]);
    const ex = gridX(end[0]), ey = gridY(end[1]);
    const total = cols * rows, prev = new Int32Array(total); prev.fill(-2);
    const queue = new Int32Array(total), startId = sy * cols + sx, endId = ey * cols + ex; let head = 0, tail = 0;
    prev[startId] = -1; queue[tail++] = startId;
    while (head < tail && prev[endId] === -2) {
      const id = queue[head++], x = id % cols, y = Math.floor(id / cols);
      // Rotate the equally-short directions per relation. This avoids every
      // connector choosing the same first available gutter.
      const directions = [[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]];
      for (let d = 0; d < directions.length; d++) {
        const [nx, ny] = directions[(d + variant) % directions.length];
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const ni = ny * cols + nx; if (prev[ni] !== -2 || (blocked[ni] && ni !== endId)) continue;
        prev[ni] = id; queue[tail++] = ni;
      }
    }
    if (prev[endId] === -2) return [start, end];
    const out = []; for (let id = endId; id !== -1; id = prev[id]) out.push([minX + (id % cols) * step, minY + Math.floor(id / cols) * step]);
    out.reverse(); out[0] = start; out[out.length - 1] = end;
    for (let i = 1; i < out.length - 1;) {
      const a = out[i - 1], b = out[i], c = out[i + 1];
      if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) out.splice(i, 1); else i++;
    }
    return out;
  };
  const inbound = new Map();
  let edgeId = 0;
  const relationCells = [];
  for (const n of owned) for (const f of tables.get(n)?.fks ?? []) {
    const entry = sides[(inbound.get(f.target) ?? 0) % sides.length];
    const index = inbound.get(f.target) ?? 0; inbound.set(f.target, index + 1);
    // The fifth relationship returns to the same side, but at a different
    // port position; arrowheads therefore never stack on the same spot.
    const exit = opposite[entry], fraction = 0.16 + (Math.floor(index / 4) % 4) * 0.22;
    const a = port(d.R[n], exit, fraction), b = port(d.R[f.target], entry, fraction);
    const va = sideVector[exit], vb = sideVector[entry];
    const start = [a[0] + va[0] * portOffset, a[1] + va[1] * portOffset], end = [b[0] + vb[0] * portOffset, b[1] + vb[1] * portOffset];
    blocked[cell(start[0], start[1])] = 0; blocked[cell(end[0], end[1])] = 0;
    const path = findPath(start, end, edgeId % 4);
    const pts = path.map(([x, y]) => `<mxPoint x="${Math.round(x)}" y="${Math.round(y)}"/>`).join("");
    const style = `edgeStyle=orthogonalEdgeStyle;html=1;rounded=0;jettySize=auto;orthogonalLoop=1;strokeColor=#374151;strokeWidth=1.4;endArrow=blockThin;endFill=1;exitX=${exit === "L" ? 0 : exit === "R" ? 1 : fraction};exitY=${exit === "T" ? 0 : exit === "B" ? 1 : fraction};entryX=${entry === "L" ? 0 : entry === "R" ? 1 : fraction};entryY=${entry === "T" ? 0 : entry === "B" ? 1 : fraction};`;
    relationCells.push(`<mxCell id="rel${++edgeId}" value="" style="${style}" edge="1" parent="1" source="${n}" target="${f.target}"><mxGeometry relative="1" as="geometry"><Array as="points">${pts}</Array></mxGeometry></mxCell>`);
  }
  // Render relations above the cards so their arrowheads are visible. The
  // obstacle grid guarantees each routed segment remains outside table bodies.
  d.cells.push(...relationCells);
  const result = d.validate({ strict: false });
  if (result.errors.length) console.warn(title, result.errors);
  return d.mxfile(title).match(/<diagram[^>]*>([\s\S]*)<\/diagram>/)[1];
}
const pages = sheets.map(([title, owned], i) => `<diagram id="learnova_erd_${i + 1}" name="${xmlEscape(title)}">${buildSheet(title, owned)}</diagram>`).join("");
writeFileSync(resolve(root, "diagram/database_erd_a4.drawio"), `<mxfile host="app.diagrams.net" modified="2026-08-18T00:00:00.000Z" agent="drawio-ai-kit" version="26.0.14">${pages}</mxfile>`);
console.log(`Generated ${sheets.length} printable A4 ERD pages for ${tables.size} tables.`);
