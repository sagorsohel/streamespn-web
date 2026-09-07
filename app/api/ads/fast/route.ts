import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const urls = [
      process.env.BACKEND_API_URL,
      process.env.NEXT_PUBLIC_API_URL,
      'https://backendapi.streamespn.org/api',
      'http://localhost:5000/api',
    ].filter(Boolean) as string[];

    for (const rawUrl of urls) {
      try {
        const cleanUrl = rawUrl.replace(/\/$/, '');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${cleanUrl}/ads/fast`, {
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.settings) {
            return NextResponse.json(data, {
              headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
              },
            });
          }
        }
      } catch {
        // Continue to next fallback URL
      }
    }
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}
