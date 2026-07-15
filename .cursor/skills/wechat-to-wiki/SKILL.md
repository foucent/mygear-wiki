---
name: wechat-to-guide
description: >-
  Fetches a WeChat public-account article URL (mp.weixin.qq.com), translates and
  restructures it into an English MkDocs Material page for MyGear Guide, downloads
  images, updates mkdocs.yml nav, and previews locally. Use when the user pastes
  a WeChat link, says 处理这篇到 mygear-guide / guide, or asks to publish a 公众号
  article into the guide. Only a URL is required.
---

# WeChat → MyGear Guide

## Trigger

User provides only (or mainly) a WeChat article URL:

```text
https://mp.weixin.qq.com/s/xxxxxxxx
```

Optional overrides (all default to agent choice): section, filename, nav title.

Do **not** ask for column / filename / nav unless fetch fails or content is ambiguous.

## Hard rules (content)

- Publish English MkDocs Markdown under `docs/`.
- **Never show source in the page body**: no `Source:`, WeChat / 公众号 links, author names (e.g. 黑马聊乒乓 / Heimajun), “original review / 原文 / 转载”.
- **Do record the source invisibly** via YAML frontmatter (MkDocs strips it; not rendered):

```markdown
---
source_url: https://mp.weixin.qq.com/s/xxxxxxxx
source_title: "中文原标题（可选）"
imported: YYYY-MM-DD
---
```

- Also append/update the same mapping in repo-root `sources.yaml` (inventory for humans; not part of the site nav).
- Neutral guide voice; product names and facts stay; remove personal blog branding.
- Skip ads / sponsor banners / unrelated promo images (Singapore Smash, 大球娱乐, unrelated rubber teases, etc.).
- Prefer Material admonitions (`!!! tip`, `!!! note`, `!!! warning`) and compact tables.
- Cross-link related existing guide pages when useful.
- Do **not** `git commit` or `git push` unless the user explicitly asks.

## Pipeline

### 1) Fetch

Prefer the helper from repo root:

```bash
..\penv\Scripts\python.exe tools\fetch_wechat_article.py "https://mp.weixin.qq.com/s/xxxx"
```

Or equivalent inline Python: mobile WeChat User-Agent, `Referer: https://mp.weixin.qq.com/`, parse `#js_content`, collect `img[data-src|src]`.

If captcha / empty (`环境异常` / no `#js_content`): ask user to paste full text (optional images). Ignore WebFetch timeout when Python fetch works.

Temp files: `_wx_*` at repo root only; **delete before finishing**. Note: `_wx_meta.txt` is for agent use only — never copy `Source` / author / URL into the published page.

### 2) Place content

Choose the lightest fit:

| Content type | Default location |
| --- | --- |
| Beginner buying checklist / basics / care | `docs/getting-started/` |
| Metrics / feel theory / comparisons | `docs/advanced/` |
| Product review / gear debate | `docs/advanced/<topic>.md` |
| Shop FAQ & Updates / Pricing & Sourcing / Shipping & Delivery | `docs/shop/` |
| Training / improvement | create `docs/technique-growth/` + nav if needed |

- Filename: `kebab-case.md` from product or topic (English).
- Nav title: short English (≤ ~40 chars), product or topic clear.
- Update `mkdocs.yml` `nav:` accordingly.

### 3) Images

- Save under `docs/images/<slug>/` (slug matches page topic).
- Download with same WeChat headers; drop files &lt; ~12KB; drop obvious ads.
- Embed with relative paths: `../images/<slug>/01.jpg` (adjust `../` by depth).
- 2–6 good images usually enough; do not force every asset.

### 4) Writing template

```markdown
---
source_url: https://mp.weixin.qq.com/s/xxxxxxxx
source_title: "中文原标题"
imported: 2026-07-14
---

# <English Title>

Intro 1–3 sentences.

![...](../images/<slug>/01.jpg)

---

## Sections...

!!! tip "..."
    ...
```

Structure by the article’s logic (numbered checklist → numbered H2; review → Specs / Comparisons / Verdict).

Frontmatter must be the **first** lines of the file (`---` on line 1). Do not put `source_url` anywhere in visible Markdown.

After writing the page, upsert `sources.yaml`:

```yaml
docs/getting-started/example.md:
  source_url: https://mp.weixin.qq.com/s/xxxxxxxx
  source_title: "中文原标题"
  imported: 2026-07-14
```

### 5) Local preview

`site_url` is the site root. Tell the user:

`http://127.0.0.1:8000/<section>/<page>/`

If serve looks stale or multiple `mkdocs` processes exist: kill and restart from the project root with `..\penv\Scripts\mkdocs.exe serve`.

### 6) Finish reply

Keep short: nav path, local URL, one-line what the page covers. Mention push only if they ask.

## Defaults when user says 「你看着办」

Decide section / filename / nav title yourself using the table above. Confirm choices only in the finish reply, not with blocking questions.

## Example user message

```text
https://mp.weixin.qq.com/s/79w00ptt3sK3aCcG4ObiQA
```

or:

```text
处理这篇到 MyGear Guide
链接：https://mp.weixin.qq.com/s/xxxxxxxx
```
