import { NextRequest, NextResponse } from 'next/server';
import { resolveGoogleUrl } from '@/lib/google-url';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL wajib diisi' }, { status: 400 });
    }

    const result = await resolveGoogleUrl(url);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
