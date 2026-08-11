"""
Fetch full photo galleries for pre-owned products — fast parallel mode.
Resumable via tools/_preowned_gallery_state.json
"""
from __future__ import annotations

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "tools" / "_preowned_catalog.json"
STATE = ROOT / "tools" / "_preowned_gallery_state.json"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
WORKERS = 12
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def fetch(url: str, binary: bool = False, retries: int = 3):
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with opener.open(req, timeout=45) as resp:
                data = resp.read()
            return data if binary else data.decode("utf-8", "replace")
        except Exception as e:
            last_err = e
            time.sleep(0.6 * (attempt + 1))
    raise last_err  # type: ignore[misc]


def fix_url(url: str) -> str:
    url = unescape(url).replace("&amp;", "&")
    url = re.sub(r"-\d+x\d+(?=\.(?:jpg|jpeg|png|webp))", "", url, flags=re.I)
    parts = urlsplit(url)
    path = quote(parts.path, safe="/%._-~")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def gallery_urls(html: str) -> list[str]:
    imgs = re.findall(r'data-large_image="([^"]+)"', html)
    if not imgs:
        imgs = re.findall(
            r'data-src="(https://mygear\.top/wp-content/uploads/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            html,
            re.I,
        )
    if not imgs:
        imgs = re.findall(
            r'src="(https://mygear\.top/wp-content/uploads/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            html,
            re.I,
        )
    seen = set()
    out = []
    for u in imgs:
        u = fix_url(u)
        if "/uploads/" not in u or u in seen:
            continue
        seen.add(u)
        out.append(u)
    return out


def load_state() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"done": []}


def save_state(st: dict) -> None:
    STATE.write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")


def save_catalog(items: list) -> None:
    CATALOG.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def download_one(args: tuple[str, Path, str]) -> tuple[Path, bool, str]:
    url, dest, label = args
    if dest.exists() and dest.stat().st_size > 3000:
        return dest, True, "skip"
    try:
        data = fetch(url, binary=True)
        if len(data) < 1500:
            raise RuntimeError(f"small {len(data)}")
        dest.write_bytes(data)
        return dest, True, str(len(data))
    except Exception as e:
        return dest, False, str(e)


def process_item(it: dict) -> dict:
    slug = it["slug"]
    d = ROOT / "docs" / "images" / slug
    d.mkdir(parents=True, exist_ok=True)

    # If album already has 2+ files, reuse
    existing = sorted(d.glob("0*.jpg")) + sorted(d.glob("0*.png"))
    if len(existing) > 1:
        local = [f"/images/{slug}/{p.name}" for p in existing]
        it["local_img"] = local[0]
        it["gallery"] = local
        return {"slug": slug, "ok": True, "n": len(local), "msg": "existing"}

    try:
        html = fetch(it["url"])
    except Exception as e:
        return {"slug": slug, "ok": False, "n": 0, "msg": f"page:{e}"}

    urls = gallery_urls(html)
    if not urls and it.get("img_url"):
        urls = [fix_url(it["img_url"])]
    if not urls:
        return {"slug": slug, "ok": False, "n": 0, "msg": "no-images"}

    jobs = [(url, d / f"{i:02d}.jpg", f"{slug}/{i:02d}") for i, url in enumerate(urls, 1)]
    local_paths: list[str] = []
    with ThreadPoolExecutor(max_workers=min(8, len(jobs))) as pool:
        futs = [pool.submit(download_one, j) for j in jobs]
        results = []
        for fut in as_completed(futs):
            results.append(fut.result())
    # keep order by filename
    ok_files = sorted(
        [p for p, ok, _ in results if ok],
        key=lambda p: p.name,
    )
    local_paths = [f"/images/{slug}/{p.name}" for p in ok_files]
    if local_paths:
        it["local_img"] = local_paths[0]
        it["gallery"] = local_paths
        return {"slug": slug, "ok": True, "n": len(local_paths), "msg": "ok"}
    return {"slug": slug, "ok": False, "n": 0, "msg": "dl-fail"}


def main() -> None:
    items = json.loads(CATALOG.read_text(encoding="utf-8"))
    st = load_state()
    done = set(st.get("done", []))

    for it in items:
        gal = it.get("gallery") or []
        if len(gal) > 1:
            done.add(it["slug"])

    todo = [it for it in items if it["slug"] not in done]
    print(f"need galleries: {len(todo)} / {len(items)} workers={WORKERS}", flush=True)

    # Process items with a pool of page workers
    by_slug = {it["slug"]: it for it in items}
    completed = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futs = {pool.submit(process_item, it): it["slug"] for it in todo}
        for fut in as_completed(futs):
            slug = futs[fut]
            try:
                res = fut.result()
            except Exception as e:
                res = {"slug": slug, "ok": False, "n": 0, "msg": str(e)}
            completed += 1
            print(
                f"[{completed}/{len(todo)}] {res['slug']} ok={res['ok']} n={res['n']} {res['msg']}",
                flush=True,
            )
            if res["ok"]:
                done.add(slug)
                # copy updated fields back
                src = next((x for x in todo if x["slug"] == slug), None)
                if src:
                    by_slug[slug]["local_img"] = src.get("local_img")
                    by_slug[slug]["gallery"] = src.get("gallery")
            # persist periodically
            if completed % 5 == 0 or completed == len(todo):
                st["done"] = sorted(done)
                save_state(st)
                # rebuild items list order
                save_catalog([by_slug[it["slug"]] for it in items])
                try:
                    from build_preowned_md import main as build_md

                    build_md()
                except Exception as e:
                    print(f"  build warn: {e}", flush=True)

    # final merge: process_item mutates todo dicts which are same refs as items
    save_catalog(items)
    st["done"] = sorted(done)
    save_state(st)
    try:
        from build_preowned_md import main as build_md

        build_md()
    except Exception:
        pass
    print(
        f"DONE multi={sum(1 for i in items if len(i.get('gallery') or []) > 1)} / {len(items)}",
        flush=True,
    )


if __name__ == "__main__":
    main()
