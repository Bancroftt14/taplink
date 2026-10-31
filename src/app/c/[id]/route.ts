import { NextRequest, NextResponse, after } from 'next/server';
import { getCardForRedirect, incrementTap } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const card = await getCardForRedirect(id);

  // If card not registered in database
  if (!card) {
    const notFoundUrl = new URL(`/card-not-found?id=${encodeURIComponent(id)}`, req.url);
    return NextResponse.redirect(notFoundUrl);
  }

  // If card is suspended
  if (card.status === 'suspended') {
    const suspendedUrl = new URL(`/card-suspended?id=${encodeURIComponent(id)}`, req.url);
    return NextResponse.redirect(suspendedUrl);
  }

  // If card is unassigned / not yet activated
  if (card.status === 'unassigned' || !card.target_url) {
    const activateUrl = new URL(`/activate?id=${encodeURIComponent(card.id)}`, req.url);
    return NextResponse.redirect(activateUrl);
  }

  // Active card: Increment tap count in the background WITHOUT delaying redirect
  after(async () => {
    try {
      await incrementTap(card.id);
    } catch (err) {
      console.error('Failed to increment tap count in background:', err);
    }
  });

  // Instant HTTP 307 Temporary Redirect to target Google Review URL
  return NextResponse.redirect(card.target_url, {
    status: 307,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
