# -*- coding: utf-8 -*-
"""Map each body-level paragraph index to the media files it embeds."""
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"


def load_rels(z):
    rels = {}
    root = ET.fromstring(z.read("word/_rels/document.xml.rels"))
    for rel in root:
        rels[rel.get("Id")] = rel.get("Target")
    return rels


def main(path):
    with zipfile.ZipFile(path) as z:
        rels = load_rels(z)
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")
    for i, el in enumerate(list(body)):
        embeds = []
        for blip in el.iter(A + "blip"):
            rid = blip.get(R + "embed")
            if rid:
                embeds.append(rels.get(rid, rid))
        # VML fallback (w:pict)
        for imgdata in el.iter("{urn:schemas-microsoft-com:office:word}imagedata"):
            rid = imgdata.get(R + "id")
            if rid:
                embeds.append(rels.get(rid, rid))
        for imgdata in el.iter("{urn:schemas-microsoft-com:vml}imagedata"):
            rid = imgdata.get(R + "id")
            if rid:
                embeds.append(rels.get(rid, rid))
        if embeds:
            print("%d\t%s" % (i, ", ".join(embeds)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "CapstoneReport_Group2.docx"))
