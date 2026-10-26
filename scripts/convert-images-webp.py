import io
import json
import re
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path('.')

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; PeakSiteImageConverter/1.0)'})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read(15000000)

def save_webp(raw, dest):
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    if image.mode in ('P', 'LA') or 'transparency' in image.info:
        image = image.convert('RGBA')
    elif image.mode not in ('RGB', 'RGBA'):
        image = image.convert('RGB')
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, 'WEBP', quality=82, method=6)
    print('saved', dest.as_posix())

# 1. Homepage: every legacy-format image reference on the page (img src, video
#    poster, og/twitter preview tags, JSON-LD image URLs) gets a local WebP
#    twin and the reference is rewritten to it. Nothing stays in JPEG/PNG.
html = (ROOT / 'public' / 'index.html').read_text(encoding='utf-8')
legacy = re.compile(r'(?:https?://[^"\s<>]+|/?assets/[^"\s<>]+)\.(?:jpe?g|png)(?:\?[^"\s<>]*)?', re.I)
mapping = {}
for raw_ref in sorted(set(legacy.findall(html))):
    path_part = raw_ref.split('?')[0].replace('&amp;', '&')
    if path_part.startswith(('http://', 'https://')):
        if 'peakhairtransplant.com' in path_part:
            rel = path_part.split('/', 3)[-1]
            source = ROOT / 'public' / rel
            if not source.exists():
                print('missing local file, skipped:', path_part)
                continue
            dest = source.with_suffix('.webp')
            if not dest.exists():
                save_webp(source.read_bytes(), dest)
            mapping[raw_ref] = path_part[:path_part.rfind('.')] + '.webp'
        else:
            name = re.sub(r'[^a-z0-9]+', '-', Path(path_part).stem.lower()).strip('-')[-60:]
            dest = ROOT / 'public' / 'assets' / 'webp' / (name + '.webp')
            try:
                if not dest.exists():
                    save_webp(fetch(path_part), dest)
            except Exception as error:
                print('FAILED', path_part, '->', error)
                continue
            mapping[raw_ref] = '/assets/webp/' + name + '.webp'
    else:
        path_part = path_part.lstrip('/')
        source = ROOT / 'public' / path_part
        if not source.exists():
            print('missing local file, skipped:', path_part)
            continue
        dest = source.with_suffix('.webp')
        if not dest.exists():
            save_webp(source.read_bytes(), dest)
        new_ref = path_part[:path_part.rfind('.')] + '.webp'
        mapping[raw_ref] = new_ref
        if raw_ref != path_part:
            mapping[path_part] = new_ref

for old_ref in sorted(mapping, key=len, reverse=True):
    html = html.replace(old_ref, mapping[old_ref])
(ROOT / 'public' / 'index.html').write_text(html, encoding='utf-8')
leftover = [ref for ref in re.findall(r'(?:src|poster)="([^"]+)"', html) if re.search(r'\.(jpe?g|png)(?:\?|$)', ref, re.I) and 'peak-og-1200x630.jpg' not in ref]
print('legacy refs left on the homepage:', leftover)

# 2. Blog: download every published article's featured image and store it as
#    public/assets/blog/<slug>-featured.webp. The page generator already
#    prefers these files for article cards and heroes when they exist.
for file in sorted((ROOT / 'blog' / 'data').glob('*.json')):
    article = json.loads(file.read_text(encoding='utf-8'))
    if article.get('status') != 'published':
        continue
    source = (article.get('image') or {}).get('url') or ''
    if not source.startswith('http') or not re.search(r'\.(jpe?g|png)(\?|$)', source, re.I):
        continue
    dest = ROOT / 'public' / 'assets' / 'blog' / (file.stem + '-featured.webp')
    if dest.exists():
        print('already converted:', dest.name)
        continue
    save_webp(fetch(source), dest)
print('done')
