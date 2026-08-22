# -*- coding: utf-8 -*-
"""Dump the outline of a .docx using only the Python standard library.

Prints one line per block-level element of word/document.xml:
    <index>\t<style>\t<flags>\t<text>

flags:  IMG=n  -> paragraph contains n drawing/pict elements
        TBL    -> element is a table (text = flattened first cells)
        NUMPR  -> paragraph carries numbering properties
"""
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
DRAW = "{http://schemas.openxmlformats.org/drawingml/2006/main}"


def para_text(el):
    parts = []
    for t in el.iter(W + "t"):
        parts.append(t.text or "")
    return "".join(parts)


def para_style(el):
    ppr = el.find(W + "pPr")
    if ppr is None:
        return ""
    st = ppr.find(W + "pStyle")
    if st is None:
        return ""
    return st.get(W + "val") or ""


def outline_level(el):
    """Heading level from style name or explicit outlineLvl."""
    st = para_style(el)
    low = st.lower()
    for n in range(1, 10):
        if low in ("heading%d" % n, "heading %d" % n, "h%d" % n):
            return n
    ppr = el.find(W + "pPr")
    if ppr is not None:
        ol = ppr.find(W + "outlineLvl")
        if ol is not None:
            try:
                return int(ol.get(W + "val")) + 1
            except (TypeError, ValueError):
                pass
    return 0


def count_images(el):
    n = 0
    for _ in el.iter(W + "drawing"):
        n += 1
    for _ in el.iter(W + "pict"):
        n += 1
    return n


def table_preview(el, limit=6):
    cells = []
    for tc in el.iter(W + "tc"):
        txt = " ".join(para_text(p).strip() for p in tc.findall(W + "p"))
        txt = txt.strip()
        if txt:
            cells.append(txt)
        if len(cells) >= limit:
            break
    return " | ".join(cells)


def main(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    body = root.find(W + "body")
    if body is None:
        print("no body found", file=sys.stderr)
        return 1

    for i, el in enumerate(list(body)):
        tag = el.tag
        if tag == W + "p":
            style = para_style(el) or "-"
            lvl = outline_level(el)
            flags = []
            if lvl:
                flags.append("HEAD%d" % lvl)
            nimg = count_images(el)
            if nimg:
                flags.append("IMG=%d" % nimg)
            ppr = el.find(W + "pPr")
            if ppr is not None and ppr.find(W + "numPr") is not None:
                flags.append("NUMPR")
            txt = para_text(el).strip()
            print("%d\t%s\t%s\t%s" % (i, style, ",".join(flags) or "-", txt))
        elif tag == W + "tbl":
            print("%d\t%s\t%s\t%s" % (i, "TABLE", "TBL", table_preview(el)))
        elif tag == W + "sectPr":
            print("%d\t%s\t%s\t%s" % (i, "SECTPR", "-", ""))
        else:
            short = tag.split("}")[-1]
            print("%d\t%s\t%s\t%s" % (i, short, "-", ""))
    return 0


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "CapstoneReport_Group2.docx"
    sys.exit(main(target))
