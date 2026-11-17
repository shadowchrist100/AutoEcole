#!/usr/bin/env python3
"""Extrait les QCM, les corrigés et les illustrations du guide PDF.

Usage:
    python scripts/extract.py "Guide sur le Code de la route .pdf"

Dépendance: pymupdf (voir scripts/requirements.txt)
Sortie:
    src/data/questions.json
    public/questions/*.webp
    scripts/report.json
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PDF_DEFAULT = ROOT / "Guide sur le Code de la route .pdf"
OUT_DATA = ROOT / "src" / "data" / "questions.json"
OUT_IMG = ROOT / "public" / "questions"
OUT_REPORT = ROOT / "scripts" / "report.json"

MODULES = [
    {"chapter": 1, "id": "generalites", "title": "Généralités et définitions", "short": "Généralités",
     "tagline": "Le vocabulaire de la route et les catégories de permis", "icon": "book-open", "accent": "#64748b"},
    {"chapter": 2, "id": "signalisation", "title": "Signalisation", "short": "Signalisation",
     "tagline": "Panneaux, marquages, feux et gestes des agents", "icon": "signpost", "accent": "#dc2626"},
    {"chapter": 3, "id": "priorites", "title": "Priorités, dépassement et croisement", "short": "Priorités",
     "tagline": "Qui passe, quand et comment", "icon": "merge", "accent": "#ea580c"},
    {"chapter": 4, "id": "manoeuvres", "title": "Arrêt, stationnement et manœuvres", "short": "Manœuvres",
     "tagline": "S'arrêter, se garer, changer de direction", "icon": "parking", "accent": "#ca8a04"},
    {"chapter": 5, "id": "autoroute", "title": "Route pour automobile et autoroute", "short": "Autoroute",
     "tagline": "Les règles de la circulation rapide", "icon": "highway", "accent": "#0891b2"},
    {"chapter": 6, "id": "infractions", "title": "Infractions, incivisme et secourisme", "short": "Sécurité",
     "tagline": "Ce qui est puni, ce qui sauve", "icon": "shield-alert", "accent": "#be123c"},
    {"chapter": 7, "id": "permis-a", "title": "Permis de conduire A1, A2, A3", "short": "Permis A",
     "tagline": "Cyclomoteurs et motocyclettes", "icon": "bike", "accent": "#7c3aed"},
    {"chapter": 8, "id": "permis-b", "title": "Permis de conduire B", "short": "Permis B",
     "tagline": "Le véhicule de tourisme", "icon": "car", "accent": "#2563eb"},
    {"chapter": 9, "id": "permis-c", "title": "Permis de conduire C et C1", "short": "Permis C",
     "tagline": "Transport de marchandises", "icon": "truck", "accent": "#0d9488"},
    {"chapter": 10, "id": "permis-d", "title": "Permis de conduire D", "short": "Permis D",
     "tagline": "Transport en commun de personnes", "icon": "bus", "accent": "#4f46e5"},
    {"chapter": 11, "id": "equipement", "title": "Équipement, entretien et documents", "short": "Équipement",
     "tagline": "Le véhicule en état de rouler", "icon": "wrench", "accent": "#475569"},
]

# Corrigés du document comportant une coquille, vérifiés à la main.
ANSWER_OVERRIDES = {
    128: ["d"],  # source: « Réponse .d. »
    141: ["e"],  # source: « Réponse e » (option e valide)
    316: ["e"],
    344: ["e"],
    345: ["e"],
    518: ["c"],  # source: « Réponse e » alors qu'il n'y a que a-c ; c = consulter son médecin
    925: ["c"],  # source: « Répons c »
    259: ["b", "d"],  # source: « Réponses b-d-e » mais l'option e n'existe pas
}

RE_Q = re.compile(r"^\s*Question\s*(?:n\s*°?\s*|n°\s*|num\s*°?\s*)?(\d+)\b\s*(.*)$", re.I)
RE_CHAPTER = re.compile(r"^\s*CHAPITRE\s*[:\-–]?\s*([IVXLC]+|\d+)", re.I)
RE_ANSWER = re.compile(r"^\s*R[ée]pons(?:e|es)?\s*[.:]?\s*(.*)$", re.I)
RE_OPTION = re.compile(r"^\s*([a-e])\s*[\)\-–.:]\s*(.*)$", re.I)
RE_PAGE_NO = re.compile(r"^\s*\d{1,3}\s*$")
RE_IMAGE_LABELS = re.compile(r"^\s*a\s+b(?:\s+c)?(?:\s+d)?(?:\s+e)?\s*$", re.I)
RE_ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XI": 11}


def clean(text: str) -> str:
    text = text.replace("\u00ad", "").replace("\ufb01", "fi").replace("\ufb02", "fl")
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,;:.!?])", r"\1", text)
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)
    return text


def page_lines(page) -> list[dict]:
    lines = []
    data = page.get_text("dict")
    for block in data.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = clean("".join(span.get("text", "") for span in line.get("spans", [])))
            if not text:
                continue
            x0, y0, x1, y1 = line["bbox"]
            lines.append({"text": text, "bbox": (x0, y0, x1, y1)})
    lines.sort(key=lambda l: (round(l["bbox"][1], 1), round(l["bbox"][0], 1)))
    return lines


def is_noise(text: str) -> bool:
    low = text.lower().strip()
    if RE_PAGE_NO.match(text):
        return True
    if low in {"rien", "dassa", "rie"}:
        return True
    return False


def parse_answers(raw: str) -> list[str]:
    raw = raw.strip().lower()
    letters = re.findall(r"\b([a-e])\b", raw)
    if not letters:
        letters = re.findall(r"(?<![a-z])([a-e])(?![a-z])", raw)
    return sorted(set(letters))


def split_inline_options(text: str):
    """Sépare une ligne contenant plusieurs options « a- ... b- ... ».

    Retourne (avant, {lettre: texte}) ou None si le motif est absent.
    """
    pattern = re.compile(r"(?:^|\s)([a-e])\s*[\)\-–\.]\s+")
    matches = list(pattern.finditer(text))
    if len(matches) < 2:
        return None
    letters = [m.group(1).lower() for m in matches]
    if letters != sorted(set(letters)) or letters[0] != "a":
        return None
    before = text[: matches[0].start()].strip()
    options = {}
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        options[m.group(1).lower()] = text[m.end():end].strip()
    return before, options



def parse(pdf_path: Path):
    doc = pymupdf.open(str(pdf_path))
    chapter = 1
    questions: list[dict] = []
    current: dict | None = None

    def finish(q):
        if not q:
            return
        text_lines = [t for t in q["text_lines"] if not re.fullmatch(r"\d{1,4}(?:[.,]\d+)?\s?m", t.strip(), re.I)]
        raw_text = clean(" ".join(text_lines))
        raw_text = re.sub(r"^[:.\-–]\s*", "", raw_text)
        options = []
        for key in q["option_order"]:
            label = clean(" ".join(q["options"][key]))
            if label:
                options.append({"key": key, "text": label})
        letters = ANSWER_OVERRIDES.get(q["number"], q["answers"])
        option_keys = {o["key"] for o in options}
        flags = []
        if not letters:
            flags.append("missing_answer")
        elif not q["image_options"] and not set(letters) <= option_keys:
            flags.append("answer_not_in_options")
        if len(options) < 2 and not q["image_options"]:
            flags.append("missing_options")
        if q["image_options"] and not set(letters) <= set(q["image_options"]):
            flags.append("answer_not_in_image_options")
        if not raw_text:
            flags.append("missing_text")
        questions.append({
            "id": f"q{q['number']}",
            "number": q["number"],
            "moduleId": None,
            "text": raw_text,
            "options": options,
            "answers": letters,
            "imageOptions": sorted(set(q["image_options"])) or None,
            "page": q["start_page"] + 1,
            "flags": flags,
            "_start_page": q["start_page"],
            "_start_y": q["start_y"],
            "_end_page": q["end_page"],
            "_end_y": q["end_y"],
            "_last_text_page": q["last_text_page"],
            "_last_text_y": q["last_text_y"],
        })

    for pno in range(len(doc)):
        for line in page_lines(doc[pno]):
            text = line["text"]
            if is_noise(text):
                continue
            mch = RE_CHAPTER.match(text)
            if mch and not RE_Q.match(text):
                token = mch.group(1).upper()
                num = RE_ROMAN.get(token) or (int(token) if token.isdigit() else None)
                if num:
                    chapter = num
                continue
            mq = RE_Q.match(text)
            if mq:
                finish(current)
                current = {
                    "number": int(mq.group(1)),
                    "start_page": pno,
                    "start_y": line["bbox"][1],
                    "end_page": pno,
                    "end_y": line["bbox"][3],
                    "chapter": chapter,
                    "text_lines": [mq.group(2)] if mq.group(2) else [],
                    "options": {},
                    "option_order": [],
                    "answers": [],
                    "image_options": [],
                    "last_option": None,
                    "last_text_page": pno,
                    "last_text_y": line["bbox"][3],
                    "seen_answer": False,
                }
                continue
            if current is None:
                continue
            ma = RE_ANSWER.match(text)
            if ma and not current["seen_answer"]:
                current["seen_answer"] = True
                current["answers"] = parse_answers(ma.group(1))
                current["end_page"] = pno
                current["end_y"] = line["bbox"][3]
                continue
            if current["seen_answer"]:
                continue
            # Étiquettes d'options dessinées (a b c d e) ou « -a -b -c »
            low = text.strip().lower()
            if re.fullmatch(r"[a-e]", low):
                if not current["options"] and low not in current["image_options"]:
                    current["image_options"].append(low)
                    current["end_page"] = pno
                    current["end_y"] = line["bbox"][3]
                continue
            dl = re.fullmatch(r"(?:\s*-\s*[a-e]\s*)+", low)
            if dl:
                for c in re.findall(r"[a-e]", low):
                    if c not in current["image_options"]:
                        current["image_options"].append(c)
                current["end_page"] = pno
                current["end_y"] = line["bbox"][3]
                current["last_text_page"] = pno
                current["last_text_y"] = line["bbox"][3]
                continue
            if RE_IMAGE_LABELS.match(text):
                for c in re.findall(r"[a-e]", text, re.I):
                    c = c.lower()
                    if c not in current["image_options"]:
                        current["image_options"].append(c)
                current["end_page"] = pno
                current["end_y"] = line["bbox"][3]
                current["last_text_page"] = pno
                current["last_text_y"] = line["bbox"][3]
                continue
            mo = RE_OPTION.match(text)
            if mo and len(mo.group(1)) == 1:
                key = mo.group(1).lower()
                if key not in current["options"]:
                    current["options"][key] = [mo.group(2)]
                    current["option_order"].append(key)
                    current["last_option"] = key
                else:
                    current["options"][key].append(mo.group(2))
                current["end_page"] = pno
                current["end_y"] = line["bbox"][3]
                current["last_text_page"] = pno
                current["last_text_y"] = line["bbox"][3]
                continue
            if current["last_option"]:
                current["options"][current["last_option"]].append(text)
                current["end_page"] = pno
                current["end_y"] = line["bbox"][3]
                current["last_text_page"] = pno
                current["last_text_y"] = line["bbox"][3]
                continue
            inline = split_inline_options(text)
            if inline:
                before, opts = inline
                if before:
                    current["text_lines"].append(before)
                for key in sorted(opts):
                    current["options"][key] = [opts[key]]
                    current["option_order"].append(key)
                    current["last_option"] = key
                current["end_page"] = pno
                current["end_y"] = line["bbox"][3]
                current["last_text_page"] = pno
                current["last_text_y"] = line["bbox"][3]
                continue
            current["text_lines"].append(text)
            current["end_page"] = pno
            current["end_y"] = line["bbox"][3]
            current["last_text_page"] = pno
            current["last_text_y"] = line["bbox"][3]
    finish(current)
    return doc, questions


def assign_modules(questions: list[dict], doc) -> None:
    chapter_pages: list[tuple[int, int]] = []
    for pno in range(len(doc)):
        text = "\n".join(l["text"] for l in page_lines(doc[pno]))
        for m in RE_CHAPTER.finditer(text):
            token = m.group(1).upper()
            num = RE_ROMAN.get(token) or (int(token) if token.isdigit() else None)
            if num:
                chapter_pages.append((pno, num))
                break
    chapter_pages.sort()
    by_id = {m["chapter"]: m["id"] for m in MODULES}
    for q in questions:
        found = None
        for pno, num in chapter_pages:
            if pno <= q["page"] - 1:
                found = num
            else:
                break
        q["moduleId"] = by_id.get(found or 1, "generalites")


def expand_for_labels(page, clip) -> "pymupdf.Rect":
    """Étend le cadre vers le bas pour inclure les étiquettes a-e des illustrations."""
    labels = []
    for line in page_lines(page):
        text = line["text"].strip().lower()
        if not re.fullmatch(r"[a-e]", text):
            continue
        x0, y0, x1, y1 = line["bbox"]
        if y0 < clip.y0 - 2 or y1 > clip.y1 + 34:
            continue
        if x1 < clip.x0 - 4 or x0 > clip.x1 + 4:
            continue
        labels.append(line["bbox"])
    if labels:
        clip.y1 = min(page.rect.height, max(b[3] for b in labels) + 3)
    return clip


def attach_images(doc, questions: list[dict], report: dict) -> None:
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for old in OUT_IMG.glob("*.webp"):
        old.unlink()
    made = 0
    skipped = 0
    for q in questions:
        start_page = q.pop("_start_page")
        start_y = q.pop("_start_y")
        end_page = q.pop("_end_page")
        end_y = q.pop("_end_y")
        last_text_page = q.pop("_last_text_page")
        last_text_y = q.pop("_last_text_y")
        crops = []
        for pno in range(start_page, end_page + 1):
            page = doc[pno]
            selected = []
            for info in page.get_image_info():
                bx0, by0, bx1, by1 = info["bbox"]
                if bx1 - bx0 < 18 or by1 - by0 < 18:
                    continue
                cy = (by0 + by1) / 2
                if pno == start_page and cy < start_y - 3:
                    continue
                if pno == end_page and cy > end_y + 3:
                    continue
                selected.append(info["bbox"])
            if not selected:
                continue
            merged: list[list[float]] = []
            for rect in sorted(selected, key=lambda r: (r[1], r[0])):
                r = list(rect)
                for m in merged:
                    if not (r[0] > m[2] + 2 or r[2] < m[0] - 2 or r[1] > m[3] + 2 or r[3] < m[1] - 0):
                        m[0] = min(m[0], r[0]); m[1] = min(m[1], r[1])
                        m[2] = max(m[2], r[2]); m[3] = max(m[3], r[3])
                        break
                else:
                    merged.append(r)
            clip = pymupdf.Rect(
                max(0, min(m[0] for m in merged) - 3),
                max(0, min(m[1] for m in merged) - 0),
                min(page.rect.width, max(m[2] for m in merged) + 3),
                min(page.rect.height, max(m[3] for m in merged) + 3),
            )
            clip = expand_for_labels(page, clip)
            if clip.width < 25 or clip.height < 25:
                continue
            crops.append(page.get_pixmap(clip=clip, dpi=125, alpha=False))
        if not crops and q["imageOptions"]:
            # Illustrations vectorielles (ex. balises) : on isole les dessins hors texte.
            page = doc[last_text_page]
            text_boxes = [l["bbox"] for l in page_lines(page)]
            boxes = []
            for drawing in page.get_drawings():
                r = drawing["rect"]
                if r.width < 5 or r.height < 5 or r.get_area() < 60:
                    continue
                if any(not (r.x1 < t[0] or r.x0 > t[2] or r.y1 < t[1] or r.y0 > t[3]) for t in text_boxes):
                    continue
                if r.y1 < start_y - 5:
                    continue
                if r.y0 > page.rect.height - 30:
                    continue
                boxes.append(r)
            if boxes:
                clip = pymupdf.Rect(
                    max(20, min(b.x0 for b in boxes) - 6),
                    max(20, min(b.y0 for b in boxes) - 6),
                    min(page.rect.width - 20, max(b.x1 for b in boxes) + 6),
                    min(page.rect.height - 20, max(b.y1 for b in boxes) + 6),
                )
                clip = expand_for_labels(page, clip)
                crops.append(page.get_pixmap(clip=clip, dpi=125, alpha=False))
            else:
                top = min(last_text_y + 3, page.rect.height - 30)
                bottom = min(page.rect.height - 14, top + 170)
                if bottom - top >= 25:
                    clip = pymupdf.Rect(40, top, page.rect.width - 40, bottom)
                    crops.append(page.get_pixmap(clip=clip, dpi=125, alpha=False))
        if not crops:
            skipped += 1
            continue
        if len(crops) == 1:
            pix = crops[0]
        else:
            from PIL import Image

            images = [Image.frombytes("RGB", (c.width, c.height), c.samples) for c in crops]
            width = max(im.width for im in images)
            height = sum(im.height for im in images) + 8 * (len(images) - 1)
            canvas = Image.new("RGB", (width, height), "white")
            y = 0
            for im in images:
                canvas.paste(im, (0, y))
                y += im.height + 8
            import io

            buf = io.BytesIO()
            canvas.save(buf, format="PNG")
            pix = pymupdf.Pixmap(buf.getvalue())
        name = f"q{q['number']:04d}.webp"
        try:
            from PIL import Image

            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            if img.width > 1100:
                ratio = 1100 / img.width
                img = img.resize((1100, max(1, int(img.height * ratio))), Image.LANCZOS)
            img.save(str(OUT_IMG / name), "WEBP", quality=72, method=6)
        except Exception as exc:
            raise SystemExit(f"Échec de l'écriture de l'image Q{q['number']}: {exc}")
        q["image"] = f"/questions/{name}"
        made += 1
    report["images"] = {"generated": made, "without_image": skipped}


def main() -> None:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else PDF_DEFAULT
    if not pdf_path.exists():
        raise SystemExit(f"PDF introuvable: {pdf_path}")
    doc, questions = parse(pdf_path)
    assign_modules(questions, doc)

    report = {
        "source": pdf_path.name,
        "extractedAt": datetime.now(timezone.utc).isoformat(),
        "pages": len(doc),
        "questionCount": len(questions),
        "perModule": {},
        "flags": {},
    }
    for q in questions:
        report["perModule"][q["moduleId"]] = report["perModule"].get(q["moduleId"], 0) + 1
    report["flags"] = dict(Counter(f for q in questions for f in q["flags"]))
    attach_images(doc, questions, report)

    modules_out = []
    for mod in MODULES:
        qs = [q for q in questions if q["moduleId"] == mod["id"]]
        modules_out.append({
            **mod,
            "questionCount": len(qs),
            "singleAnswerCount": sum(1 for q in qs if len(q["answers"]) == 1),
            "imageCount": sum(1 for q in qs if q.get("image")),
        })

    questions.sort(key=lambda q: q["number"])
    payload = {
        "meta": {
            "title": "Manuel du candidat à l'examen du permis de conduire",
            "edition": "Édition 2011 — Direction Générale des Transports Terrestres (Bénin)",
            "extractedAt": report["extractedAt"],
            "questionCount": len(questions),
        },
        "modules": modules_out,
        "questions": questions,
    }
    OUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    OUT_DATA.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({k: report[k] for k in ("questionCount", "perModule", "flags", "images")}, ensure_ascii=False, indent=2))
    print(f"Écrit: {OUT_DATA}")
    for q in questions:
        if q["flags"]:
            print(f"  ! Q{q['number']} p{q['page']} {q['flags']} — {q['text'][:80]}")


if __name__ == "__main__":
    main()
