import { NextRequest, NextResponse } from 'next/server';
import { getCard, updateCard } from '@/lib/db';
import { resolveGoogleUrl } from '@/lib/google-url';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardId, url, businessName, pin } = body;

    if (!cardId || !url) {
      return NextResponse.json(
        { error: 'ID Kartu dan Link Google Maps wajib diisi.' },
        { status: 400 }
      );
    }

    const card = await getCard(cardId);
    if (!card) {
      return NextResponse.json(
        { error: 'Kartu tidak terdaftar dalam sistem.' },
        { status: 404 }
      );
    }

    // Verify PIN only if the card has a non-empty PIN assigned and client submitted pin
    if (card.pin && card.pin.trim() !== '') {
      if (pin && pin.trim() !== card.pin.trim()) {
        return NextResponse.json(
          { error: 'Kode PIN aktivasi salah.' },
          { status: 403 }
        );
      }
    }

    // Resolve and format Google URL
    const resolution = await resolveGoogleUrl(url);
    const finalTargetUrl = resolution.resolvedUrl;
    const finalBusinessName =
      (businessName && businessName.trim()) ||
      resolution.extractedName ||
      'Google Review Bisnis';

    // Update card in database
    const updated = await updateCard(card.id, {
      status: 'active',
      target_url: finalTargetUrl,
      raw_input_url: url,
      business_name: finalBusinessName,
      activated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      card: updated,
      resolution,
      message: 'Kartu berhasil aktif!',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
