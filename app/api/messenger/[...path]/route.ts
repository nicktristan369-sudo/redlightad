import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://76.13.154.9:3001';

async function proxyRequest(request: NextRequest, method: string) {
  try {
    const url = new URL(request.url);
    const pathMatch = url.pathname.replace('/api/messenger/', '');
    const targetUrl = `${BACKEND_URL}/${pathMatch}${url.search}`;

    const isMedia = pathMatch.startsWith('media/');

    const headers: Record<string, string> = {};
    if (!isMedia) headers['Content-Type'] = 'application/json';
    
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try { body = await request.text(); } catch {}
    }

    const res = await fetch(targetUrl, {
      method,
      headers,
      body: body || undefined,
    });

    // For media files, return binary data with correct content-type
    if (isMedia) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
          'Cache-Control': 'public, max-age=604800',
        },
      });
    }

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch (error) {
    console.error('[Messenger Proxy] Error:', error);
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) { return proxyRequest(request, 'GET'); }
export async function POST(request: NextRequest) { return proxyRequest(request, 'POST'); }
export async function PUT(request: NextRequest) { return proxyRequest(request, 'PUT'); }
export async function PATCH(request: NextRequest) { return proxyRequest(request, 'PATCH'); }
export async function DELETE(request: NextRequest) { return proxyRequest(request, 'DELETE'); }
