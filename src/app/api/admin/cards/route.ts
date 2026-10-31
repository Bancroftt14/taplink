import { NextRequest, NextResponse } from 'next/server';
import { listAllCards, createBatchCards, updateCard, getCard, saveCard } from '@/lib/db';
import { Card } from '@/types/card';
import { resolveGoogleUrl } from '@/lib/google-url';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'bancroftt2026';

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const secretQuery = req.nextUrl.searchParams.get('key');
  if (secretQuery === ADMIN_SECRET) return true;
  if (authHeader && authHeader.replace(/^Bearer\s+/i, '') === ADMIN_SECRET) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Masukkan Admin Key yang benar' }, { status: 401 });
  }

  const cards = await listAllCards();
  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // Action 1: Batch generate blank cards
    if (action === 'batch_generate') {
      const { prefix = 'TAP', count = 10, defaultPin = '' } = body;
      const numCount = Math.min(Math.max(Number(count) || 1, 1), 500); // 1 to 500 max

      const existingCards = await listAllCards();
      const existingIds = new Set(existingCards.map((c) => c.id.toUpperCase()));

      const newCards: Card[] = [];
      let counter = 1;

      while (newCards.length < numCount) {
        // e.g. TAP-001, TAP-002, or if exists, keep incrementing
        const paddedNum = String(counter).padStart(3, '0');
        const candidateId = `${prefix}-${paddedNum}`.toUpperCase();

        if (!existingIds.has(candidateId)) {
          newCards.push({
            id: candidateId,
            status: 'unassigned',
            target_url: '',
            business_name: '',
            pin: defaultPin || '',
            taps: 0,
            created_at: new Date().toISOString(),
          });
          existingIds.add(candidateId);
        }
        counter++;
      }

      const inserted = await createBatchCards(newCards);
      return NextResponse.json({
        success: true,
        insertedCount: inserted,
        cards: newCards,
      });
    }

    // Action 2: Create single custom card
    if (action === 'create_single') {
      const { id, targetUrl = '', businessName = '', pin = '' } = body;
      if (!id) {
        return NextResponse.json({ error: 'ID kartu wajib diisi' }, { status: 400 });
      }

      const cardId = id.trim().toUpperCase();
      const existing = await getCard(cardId);
      if (existing) {
        return NextResponse.json({ error: `Kartu ${cardId} sudah terdaftar!` }, { status: 409 });
      }

      let finalTarget = targetUrl;
      if (targetUrl) {
        const res = await resolveGoogleUrl(targetUrl);
        finalTarget = res.resolvedUrl;
      }

      const newCard: Card = {
        id: cardId,
        status: finalTarget ? 'active' : 'unassigned',
        target_url: finalTarget,
        business_name: businessName.trim(),
        pin: pin.trim(),
        taps: 0,
        created_at: new Date().toISOString(),
        activated_at: finalTarget ? new Date().toISOString() : undefined,
      };

      await saveCard(newCard);
      return NextResponse.json({ success: true, card: newCard });
    }

    // Action 3: Edit existing card
    if (action === 'update') {
      const { id, updates } = body;
      if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

      if (updates.target_url) {
        const res = await resolveGoogleUrl(updates.target_url);
        updates.target_url = res.resolvedUrl;
      }

      const updated = await updateCard(id, updates);
      return NextResponse.json({ success: true, card: updated });
    }

    // Action 4: Reset card to unassigned
    if (action === 'reset') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

      const updated = await updateCard(id, {
        status: 'unassigned',
        target_url: '',
        business_name: '',
        client_phone: '',
        client_email: '',
        raw_input_url: '',
        activated_at: undefined,
      });

      return NextResponse.json({ success: true, card: updated });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
