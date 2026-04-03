#!/usr/bin/env python3
"""
Phone number scraper — crawls a website up to max_depth levels and extracts phone numbers.
Tries Scrapling (AsyncPlaywright) first, falls back to requests+regex.

Usage: python3 scraper.py <start_url> <max_depth>
Output: JSON lines for progress, final line has {"done": true, "phones": [...], "total": N}
"""

import sys
import json
import re
from urllib.parse import urljoin, urlparse

# ── Config ───────────────────────────────────────────────────────────────────

PHONE_RE = re.compile(r'(\+?[\d\s\-\(\)]{8,15})')
SKIP_EXT = re.compile(
    r'\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|json|xml|pdf|zip|mp4|mp3|woff2?|ttf|eot)(\?|$)',
    re.IGNORECASE,
)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "da,en;q=0.9",
}

MAX_PAGES = 200


def emit(obj):
    """Print a JSON line to stdout and flush."""
    print(json.dumps(obj, ensure_ascii=False), flush=True)


def clean_phone(raw):
    """Remove whitespace/hyphens/parens, return digits-only if 8-15 digits."""
    digits = re.sub(r'[\s\-\(\)]', '', raw)
    # Keep leading + if present
    if raw.strip().startswith('+'):
        digits = '+' + digits.lstrip('+')
    pure_digits = digits.lstrip('+')
    if not pure_digits.isdigit():
        return None
    if len(pure_digits) < 8 or len(pure_digits) > 15:
        return None
    # Filter out years, repeated digits, etc.
    if re.match(r'^(19|20)\d{2}$', pure_digits):
        return None
    if re.match(r'^(\d)\1{7,}$', pure_digits):
        return None
    return digits


def extract_phones(html):
    """Extract and clean phone numbers from HTML text."""
    # Strip scripts/styles
    text = re.sub(r'<script[\s\S]*?</script>', ' ', html, flags=re.IGNORECASE)
    text = re.sub(r'<style[\s\S]*?</style>', ' ', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'\s+', ' ', text)

    found = set()
    for m in PHONE_RE.finditer(text):
        cleaned = clean_phone(m.group(1))
        if cleaned:
            found.add(cleaned)
    return list(found)


def extract_links(html, base_url):
    """Extract same-domain links from HTML."""
    base_host = urlparse(base_url).hostname
    links = set()
    for m in re.finditer(r'<a[^>]+href=["\']([^"\']+)["\']', html, re.IGNORECASE):
        href = m.group(1).strip()
        if not href or href.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
            continue
        try:
            full = urljoin(base_url, href)
            parsed = urlparse(full)
            if parsed.hostname != base_host:
                continue
            if SKIP_EXT.search(parsed.path):
                continue
            # Normalize: remove fragment and query
            normalized = parsed._replace(fragment='', query='').geturl()
            links.add(normalized)
        except Exception:
            continue
    return list(links)


# ── Fetchers ─────────────────────────────────────────────────────────────────

use_scrapling = False

try:
    from scrapling import AsyncPlaywright
    use_scrapling = True
except ImportError:
    pass

if not use_scrapling:
    import requests as _requests


def fetch_page(url):
    """Fetch a page, return HTML string or None."""
    try:
        if use_scrapling:
            # Scrapling async fetch
            pw = AsyncPlaywright()
            page = pw.fetch(url, headless=True, timeout=10000)
            return page.html if page else None
        else:
            resp = _requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
            if resp.status_code != 200:
                return None
            ct = resp.headers.get('content-type', '')
            if 'text/html' not in ct and 'text/plain' not in ct:
                return None
            return resp.text
    except Exception:
        return None


# ── Main crawler ─────────────────────────────────────────────────────────────

def crawl(start_url, max_depth):
    visited = set()
    all_phones = set()
    queue = [(start_url, 0)]
    in_queue = {start_url}

    while queue and len(visited) < MAX_PAGES:
        url, depth = queue.pop(0)
        in_queue.discard(url)

        if url in visited:
            continue
        visited.add(url)

        emit({"progress": len(visited), "phones": len(all_phones), "url": url})

        html = fetch_page(url)
        if not html:
            continue

        phones = extract_phones(html)
        for p in phones:
            all_phones.add(p)

        # Queue deeper links
        if max_depth == 0 or depth < max_depth:
            links = extract_links(html, url)
            for link in links:
                if link not in visited and link not in in_queue and len(visited) + len(queue) < MAX_PAGES:
                    queue.append((link, depth + 1))
                    in_queue.add(link)

    phones_list = sorted(all_phones)
    emit({"done": True, "phones": phones_list, "total": len(phones_list)})


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: scraper.py <url> <max_depth>"}), flush=True)
        sys.exit(1)

    start_url = sys.argv[1]
    try:
        max_depth = int(sys.argv[2])
    except ValueError:
        max_depth = 2

    # max_depth=0 means unlimited
    crawl(start_url, max_depth)
