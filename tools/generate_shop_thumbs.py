"""Generate card/list thumbnails next to originals as *.thumb.webp.

Usage (from mygear-wiki root):
  ..\\penv\\Scripts\\python.exe tools\\generate_shop_thumbs.py
  ..\\penv\\Scripts\\python.exe tools\\generate_shop_thumbs.py --force
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
IMAGES = DOCS / "images"

MAX_EDGE = 720
WEBP_QUALITY = 78
SRC_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

SHOP_DIRS = [
    IMAGES / "stock-rubbers",
    IMAGES / "featured-rubbers",
    IMAGES / "stock-blades",
    IMAGES / "price-list" / "rubbers",
    IMAGES / "price-list" / "blades",
    IMAGES / "price-list" / "add-ons",
    IMAGES / "add-ons",
]

MD_FILES = [
    DOCS / "pre-owned.md",
    DOCS / "rubbers.md",
    DOCS / "blades.md",
    DOCS / "add-ons.md",
]


def thumb_path(src: Path) -> Path:
    return src.with_name(src.stem + ".thumb.webp")


def is_thumb(path: Path) -> bool:
    return path.name.endswith(".thumb.webp") or ".thumb." in path.name


def collect_from_md() -> set[Path]:
    found: set[Path] = set()
    pat = re.compile(
        r"""(?:src|href|data-gallery)=["']([^"']+\.(?:jpe?g|png|webp))["']""",
        re.I,
    )
    # also markdown images and bare /images/ paths in data-gallery lists
    pat2 = re.compile(r"""(/images/[\w./\-]+\.(?:jpe?g|png|webp))""", re.I)
    pat3 = re.compile(r"""\((?:\.\./)*images/([\w./\-]+\.(?:jpe?g|png|webp))\)""", re.I)

    for md in MD_FILES:
        if not md.exists():
            continue
        text = md.read_text(encoding="utf-8")
        for m in pat.finditer(text):
            raw = m.group(1).split(",")[0].strip()
            found |= paths_from_ref(raw)
        for m in pat2.finditer(text):
            found |= paths_from_ref(m.group(1))
        for m in pat3.finditer(text):
            found.add(IMAGES / m.group(1).replace("/", "\\"))
        # data-gallery comma lists
        for m in re.finditer(r'data-gallery="([^"]+)"', text):
            for part in m.group(1).split(","):
                found |= paths_from_ref(part.strip())
    return {p for p in found if p.exists() and not is_thumb(p)}


def paths_from_ref(ref: str) -> set[Path]:
    ref = ref.strip()
    if not ref:
        return set()
    ref = ref.split("?")[0]
    if ref.startswith("/images/"):
        return {IMAGES / ref[len("/images/") :].replace("/", "\\")}
    if "images/" in ref.replace("\\", "/"):
        rel = ref.replace("\\", "/").split("images/", 1)[1]
        return {IMAGES / rel.replace("/", "\\")}
    return set()


def collect_from_dirs() -> set[Path]:
    found: set[Path] = set()
    for d in SHOP_DIRS:
        if not d.is_dir():
            continue
        for p in d.rglob("*"):
            if (
                p.is_file()
                and p.suffix.lower() in SRC_EXTS
                and not is_thumb(p)
            ):
                found.add(p)
    return found


def make_thumb(src: Path, force: bool = False) -> str:
    dest = thumb_path(src)
    if (
        dest.exists()
        and not force
        and dest.stat().st_mtime >= src.stat().st_mtime
    ):
        return "skip"

    im = Image.open(src)
    if im.mode in ("RGBA", "P"):
        im = im.convert("RGB")
    elif im.mode != "RGB":
        im = im.convert("RGB")

    w, h = im.size
    if max(w, h) > MAX_EDGE:
        im.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)

    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=WEBP_QUALITY, method=4)
    return "ok"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    targets = collect_from_dirs() | collect_from_md()
    ok = skip = err = 0
    before = after = 0

    for src in sorted(targets):
        try:
            before += src.stat().st_size
            status = make_thumb(src, force=args.force)
            dest = thumb_path(src)
            after += dest.stat().st_size if dest.exists() else 0
            if status == "ok":
                ok += 1
            else:
                skip += 1
        except Exception as e:
            err += 1
            print(f"ERR {src.relative_to(ROOT)}: {e}")

    print(
        f"done targets={len(targets)} wrote={ok} skipped={skip} errors={err}"
    )
    if before:
        print(
            f"source_bytes={before/1e6:.1f}MB thumb_bytes={after/1e6:.1f}MB "
            f"ratio={after/before:.2%}"
        )
    return 1 if err else 0


if __name__ == "__main__":
    raise SystemExit(main())
