import { NextRequest, NextResponse } from 'next/server';
import { getCard } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID kartu tidak ditemukan' }, { status: 400 });
  }

  const card = await getCard(id);

  if (!card) {
    return NextResponse.json(
      {
        exists: false,
        message: 'Kartu tidak ditemukan dalam database.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    exists: true,
    id: card.id,
    status: card.status,
    business_name: card.business_name || '',
    requires_pin: Boolean(card.pin && card.pin.trim() !== ''),
    taps: card.taps || 0,
    target_url: card.status === 'active' ? card.target_url : '',
  });
}
