#!/usr/bin/env python3
"""Serve every image on the homepage and blog listing as a real .webp file:

1. Convert every legacy (.jpg/.jpeg/.png) file in public/assets to a .webp
   twin alongside it.
2. Download the Pexels photos/poster used on the homepage and store them as
   local .webp files.
3. Download every published article's featured image (Supabase) and store it
   as public/assets/blog/<slug>-featured.webp, so the blog generator can
   reference local .webp files instead of remote .jpg URLs.
4. Rewrite <img src> and video poster references in public/index.html to the
   .webp files. og:image / twitter:image / JSON-LD references are left alone
   on purpose (social previews must keep the original format).

Idempotent: files that already exist are skipped, so it is safe to run on
every push (new articles get their featured image fetched automatically).
"""
import io
import json
import re
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path('.')
ASSETS = ROOT / 'public' / 'assets'
BLOG_ASSETS = ASSETS / 'blog'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; PeakImageConvert/1.0)'}


def fetch(url):
    request = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read(20_000_000)


def save_webp(raw, dst):
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    if image.mode in ('P', 'LA') or 'transparency' in image.info:
        image = image.convert('RGBA')
    elif image.mode not in ('RGB', 'RGBA'):
        image = image.convert('RGB')
    image.save(dst, 'WEBP', quality=82, method=6)
    print('saved', dst, image.size)


# 1) Local legacy assets -> webp twins
for src in sorted(ASSETS.glob('*')):
    if src.is_file() and src.suffix.lower() in ('.jpg', '.jpeg', '.png'):
        dst = src.with_suffix('.webp')
        if not dst.exists():
            save_webp(src.read_bytes(), dst)
        else:
            print('exists', dst)

# 2) Pexels sources used on the homepage -> local webp
PEXELS = [
    ('https://images.pexels.com/photos/28764621/pexels-photo-28764621.jpeg?auto=compress&cs=tinysrgb&w=900', 'peak-loc-istanbul.webp'),
    ('https://images.pexels.com/photos/18388935/pexels-photo-18388935.jpeg?auto=compress&cs=tinysrgb&w=900', 'peak-loc-nyc.webp'),
    ('https://images.pexels.com/photos/34650327/pexels-photo-34650327.jpeg?auto=compress&cs=tinysrgb&w=900', 'peak-loc-miami.webp'),
    ('https://images.pexels.com/videos/6235749/pexels-photo-6235749.jpeg?auto=compress&w=1400', 'peak-doc-poster.webp'),
]
BLOG_ASSETS.mkdir(parents=True, exist_ok=True)
for source, name in PEXELS:
    dst = ASSETS / name
    if not dst.exists():
        save_webp(fetch(source), dst)
    else:
        print('exists', dst)

# 3) Article featured images -> local webp per slug

def object_url(url):
    url = url.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/')
    return url.split('?')[0]


for jsonfile in sorted((ROOT / 'blog' / 'data').glob('*.json')):
    article = json.loads(jsonfile.read_text(encoding='utf-8'))
    image = article.get('image') or {}
    url = image.get('url') if isinstance(image, dict) else None
    if not url or not isinstance(url, str) or 'supabase' not in url:
        continue
    slug = article.get('slug')
    if not slug:
        continue
    dst = BLOG_ASSETS / f'{slug}-featured.webp'
    if dst.exists():
        print('exists', dst)
        continue
    try:
        save_webp(fetch(object_url(url)), dst)
    except Exception as error:  # one bad image must not fail the run
        print('FAILED', slug, error)

# 4) Rewrite homepage <img src> and video poster references
index_html = ROOT / 'public' / 'index.html'
html = index_html.read_text(encoding='utf-8')

PEXELS_MAP = {
    'photos/28764621': '/assets/peak-loc-istanbul.webp',
    'photos/18388935': '/assets/peak-loc-nyc.webp',
    'photos/34650327': '/assets/peak-loc-miami.webp',
    'videos/6235749': '/assets/peak-doc-poster.webp',
}
LOCAL = re.compile(
    r'^(?:https?://www\.peakhairtransplant\.com)?/?(assets/[^"?]*?)\.(?:jpg|jpeg|png)(\?[^"/]*)?$',
    re.I,
)


def rewrite(match):
    attr, value = match.group(1), match.group(2)
    if 'images.pexels.com' in value or 'videos.pexels.com' in value:
        for key, replacement in PEXELS_MAP.items():
            if key in value:
                return f'{attr}="{replacement}"'
        return match.group(0)
    local = LOCAL.match(value)
    if local:
        return f'{attr}="/{local.group(1)}.webp{local.group(2) or ""}"'
    return match.group(0)


new_html, count = re.subn(r'(src|poster)="([^"]+)"', rewrite, html)
index_html.write_text(new_html, encoding='utf-8')
print('scanned attributes in index.html:', count)
