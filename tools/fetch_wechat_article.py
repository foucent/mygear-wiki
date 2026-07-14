"""Fetch a public WeChat article into text + image URL list.

Usage (from MyGear Guide repo root):
  ..\\penv\\Scripts\\python.exe tools\\fetch_wechat_article.py URL
"""

from __future__ import annotations

import re
import sys
from html import unescape
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 "
    "MicroMessenger/8.0.28(0x18001c2f) NetType/WIFI Language/zh_CN"
)


def fetch(url: str) -> tuple[str, str, str, list[str]]:
    headers = {"User-Agent": UA, "Referer": "https://mp.weixin.qq.com/"}
    r = httpx.get(url, headers=headers, follow_redirects=True, timeout=60)
    r.raise_for_status()
    html = r.text
    if "环境异常" in html and "去验证" in html and "js_content" not in html:
        raise RuntimeError("captcha_or_blocked")

    og = re.search(r'<meta property="og:title" content="([^"]+)"', html)
    title = unescape(og.group(1)) if og else ""
    nick = re.search(r'id="js_name"[^>]*>([^<]+)<', html)
    author = nick.group(1).strip() if nick else ""

    soup = BeautifulSoup(html, "lxml")
    content = soup.select_one("#js_content")
    if not content:
        raise RuntimeError("no_js_content")

    imgs: list[str] = []
    for img in content.find_all("img"):
        src = img.get("data-src") or img.get("src") or ""
        if src.startswith("//"):
            src = "https:" + src
        if src.startswith("http"):
            imgs.append(src)

    text = content.get_text("\n", strip=True)
    return title, author, text, imgs


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: fetch_wechat_article.py URL", file=sys.stderr)
        return 2
    url = sys.argv[1]
    title, author, text, imgs = fetch(url)
    out = Path(".")
    (out / "_wx_meta.txt").write_text(
        f"TITLE={title}\nAUTHOR={author}\nURL={url}\n", encoding="utf-8"
    )
    (out / "_wx_text.txt").write_text(text, encoding="utf-8")
    (out / "_wx_imgs.txt").write_text("\n".join(imgs), encoding="utf-8")
    print(f"OK title={title!r} chars={len(text)} imgs={len(imgs)}")
    print("Wrote _wx_meta.txt _wx_text.txt _wx_imgs.txt (delete after use)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"ERR {e}", file=sys.stderr)
        raise SystemExit(1)
