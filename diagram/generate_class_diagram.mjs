// Generates the complete LearnOva domain-model UML class diagram from JPA entities.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const domainRoot = resolve(projectRoot, "back_end/src/main/java/com/example/back_end");
const output = resolve(import.meta.dirname, "class_diagram.drawio");
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const file = join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : entry.name.endsWith(".java") ? [file] : [];
});
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const html = (value) => escape(value).replaceAll(" ", "&nbsp;");

// The class diagram intentionally covers every persisted domain class, while
// omitting DTO/controller/service implementation detail to keep UML readable.
const entities = [];
for (const file of walk(domainRoot)) {
  if (!file.includes(`${join("domain")}${""}`)) continue;
  const source = readFileSync(file, "utf8");
  const className = source.match(/public\s+class\s+(\w+)/)?.[1];
  if (!className || !/@Entity\b/.test(source)) continue;
  const body = source.slice(source.indexOf(`class ${className}`));
  const fields = [...body.matchAll(/private\s+([\w<>?, ]+)\s+(\w+)\s*(?:=[^;]*)?;/g)]
    .map(([, type, name]) => ({ type: type.trim().replace(/\s+/g, " "), name }));
  entities.push({ className, fields });
}
entities.sort((a, b) => a.className.localeCompare(b.className));
const entityNames = new Set(entities.map((entity) => entity.className));
const targetType = (type) => {
  const generic = type.match(/<(\w+)>/)?.[1];
  return entityNames.has(generic) ? generic : entityNames.has(type) ? type : null;
};

const cols = 5, boxWidth = 500, xStart = 100, xStep = 650, yStart = 110, yStep = 650;
const pageWidth = 3300, pageHeight = Math.ceil(entities.length / cols) * yStep + 140;
const cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>'];
const layout = new Map();
for (const [index, entity] of entities.entries()) {
  const scalarFields = entity.fields.filter((field) => !targetType(field.type)).slice(0, 5);
  const relations = entity.fields.filter((field) => targetType(field.type)).slice(0, 2);
  const lines = [
    `<b style="font-size:40px">${html(entity.className)}</b>`,
    "<hr>",
    ...scalarFields.map((field) => `-&nbsp;${html(field.name)}:&nbsp;${html(field.type)}`),
    ...(relations.length ? ["<hr>", ...relations.map((field) => `+&nbsp;${html(field.name)}:&nbsp;${html(field.type)}`)] : []),
  ];
  const height = Math.max(260, 126 + lines.length * 40);
  const x = xStart + (index % cols) * xStep, y = yStart + Math.floor(index / cols) * yStep;
  layout.set(entity.className, { x, y, w: boxWidth, h: height });
  const style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#374151;strokeWidth=1.4;fontColor=#111827;fontSize=28;align=left;verticalAlign=top;spacing=18;";
  cells.push(`<mxCell id="${entity.className}" value="${escape(lines.join("<br>"))}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${boxWidth}" height="${height}" as="geometry"/></mxCell>`);
}

// Draw one association per pair; entity fields on both sides describe the same
// UML association and should not produce duplicate lines.
const associations = new Map();
for (const entity of entities) for (const field of entity.fields) {
  const target = targetType(field.type); if (!target) continue;
  const key = [entity.className, target].sort().join("::");
  const isMany = /<(\w+)>/.test(field.type);
  const current = associations.get(key);
  if (!current || (!isMany && current.isMany)) associations.set(key, { from: entity.className, to: target, label: field.name, isMany });
}
// Orthogonal obstacle routing keeps each association in the generous gutters
// between class boxes, instead of crossing a class body or hiding behind it.
const step = 10, gutter = 90, minX = -gutter, minY = -gutter;
const gridCols = Math.ceil((pageWidth + gutter * 2) / step), gridRows = Math.ceil((pageHeight + gutter * 2) / step);
const blocked = new Uint8Array(gridCols * gridRows), clearance = 22, portOffset = 34;
const gx = (x) => Math.max(0, Math.min(gridCols - 1, Math.round((x - minX) / step)));
const gy = (y) => Math.max(0, Math.min(gridRows - 1, Math.round((y - minY) / step)));
const gridCell = (x, y) => gy(y) * gridCols + gx(x);
for (const box of layout.values()) {
  const x0 = Math.max(0, Math.ceil((box.x - clearance - minX) / step)), x1 = Math.min(gridCols - 1, Math.floor((box.x + box.w + clearance - minX) / step));
  const y0 = Math.max(0, Math.ceil((box.y - clearance - minY) / step)), y1 = Math.min(gridRows - 1, Math.floor((box.y + box.h + clearance - minY) / step));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) blocked[y * gridCols + x] = 1;
}
const vectors = { L: [-1, 0], R: [1, 0], T: [0, -1], B: [0, 1] };
const opposite = { L: "R", R: "L", T: "B", B: "T" };
const port = (box, side, fraction) => side === "L" ? [box.x, box.y + box.h * fraction] : side === "R" ? [box.x + box.w, box.y + box.h * fraction] : side === "T" ? [box.x + box.w * fraction, box.y] : [box.x + box.w * fraction, box.y + box.h];
const findPath = (start, end, variant) => {
  const sx = gx(start[0]), sy = gy(start[1]), ex = gx(end[0]), ey = gy(end[1]);
  const total = gridCols * gridRows, prev = new Int32Array(total); prev.fill(-2);
  const queue = new Int32Array(total), startId = sy * gridCols + sx, endId = ey * gridCols + ex;
  let head = 0, tail = 0; prev[startId] = -1; queue[tail++] = startId;
  while (head < tail && prev[endId] === -2) {
    const id = queue[head++], x = id % gridCols, y = Math.floor(id / gridCols);
    const directions = [[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]];
    for (let d = 0; d < directions.length; d++) {
      const [nx, ny] = directions[(d + variant) % directions.length];
      if (nx < 0 || ny < 0 || nx >= gridCols || ny >= gridRows) continue;
      const next = ny * gridCols + nx;
      if (prev[next] !== -2 || (blocked[next] && next !== endId)) continue;
      prev[next] = id; queue[tail++] = next;
    }
  }
  if (prev[endId] === -2) return [start, end];
  const points = [];
  for (let id = endId; id !== -1; id = prev[id]) points.push([minX + (id % gridCols) * step, minY + Math.floor(id / gridCols) * step]);
  points.reverse(); points[0] = start; points[points.length - 1] = end;
  for (let i = 1; i < points.length - 1;) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) points.splice(i, 1); else i++;
  }
  return points;
};
let relationId = 0;
const inbound = new Map();
for (const relation of associations.values()) {
  const sourceBox = layout.get(relation.from), targetBox = layout.get(relation.to);
  const index = inbound.get(relation.to) ?? 0; inbound.set(relation.to, index + 1);
  const entry = ["L", "T", "R", "B"][index % 4];
  const exit = opposite[entry], fraction = 0.16 + (Math.floor(index / 4) % 4) * 0.22;
  const a = port(sourceBox, exit, fraction), b = port(targetBox, entry, fraction);
  const va = vectors[exit], vb = vectors[entry];
  const start = [a[0] + va[0] * portOffset, a[1] + va[1] * portOffset];
  const end = [b[0] + vb[0] * portOffset, b[1] + vb[1] * portOffset];
  blocked[gridCell(start[0], start[1])] = 0; blocked[gridCell(end[0], end[1])] = 0;
  const points = findPath(start, end, relationId % 4).map(([x, y]) => `<mxPoint x="${Math.round(x)}" y="${Math.round(y)}"/>`).join("");
  const style = `edgeStyle=orthogonalEdgeStyle;html=1;rounded=0;jettySize=auto;orthogonalLoop=1;strokeColor=#334155;strokeWidth=1.6;endArrow=blockThin;endFill=1;exitX=${exit === "L" ? 0 : exit === "R" ? 1 : fraction};exitY=${exit === "T" ? 0 : exit === "B" ? 1 : fraction};entryX=${entry === "L" ? 0 : entry === "R" ? 1 : fraction};entryY=${entry === "T" ? 0 : entry === "B" ? 1 : fraction};`;
  cells.push(`<mxCell id="rel${++relationId}" value="" style="${style}" edge="1" parent="1" source="${relation.from}" target="${relation.to}"><mxGeometry relative="1" as="geometry"><Array as="points">${points}</Array></mxGeometry></mxCell>`);
}

const xml = `<mxfile host="app.diagrams.net" modified="2026-08-19T00:00:00.000Z" agent="Codex" version="26.0.14"><diagram id="learnova_full_class_diagram" name="LEARNOVA CLASS DIAGRAM · ALL DOMAIN ENTITIES"><mxGraphModel dx="1600" dy="1200" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" math="0" shadow="0"><root>${cells.join("")}</root></mxGraphModel></diagram></mxfile>`;
writeFileSync(output, xml);
console.log(`Generated ${entities.length} domain classes and ${associations.size} associations.`);
