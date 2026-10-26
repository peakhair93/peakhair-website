#!/usr/bin/env python3
"""Store every published article's featured image as a local WebP file in
public/assets/blog, so generated blog pages reference .webp URLs instead of
remote .jpg ones. Skips files that already exist."""
import io
import json
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

DATA = Path('blog/data')
OUT = Path('public/assets/blog')
ORIGIN = 'https://www.peakhairtransplant.com'


def convert(raw, dst):
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    if image.mode in ('P', 'LA') or 'transparency' in image.info:
        image = image.convert('RGBA')
    elif image.mode not in ('RGB', 'RGBA'):
        image = image.convert('RGB')
    image.save(dst, 'WEBP', quality=82, method=6)
    print('saved', dst, image.size)


def fetch(url):
    request = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (compatible; PeakImageConvert/1.0)'},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read(15000000)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for jsonfile in sorted(DATA.glob('*.json')):
        article = json.loads(jsonfile.read_text(encoding='utf-8'))
        if article.get('status') != 'published':
            continue
        slug = article.get('slug')
        image = article.get('image') or {}
        url = image.get('url') if isinstance(image, dict) else None
        if not slug or not isinstance(url, str) or not url:
            continue
        # Local site assets are mapped by the generator to existing WebP files.
        if url.startswith(ORIGIN + '/assets/'):
            print('local asset, generator handles:', slug)
            continue
        dst = OUT / (slug + '-featured.webp')
        if dst.exists():
            print('exists', dst)
            continue
        try:
            convert(fetch(url), dst)
        except Exception as error:  # one bad image must not fail the run
            print('FAILED', slug, error)


if __name__ == '__main__':
    main()
