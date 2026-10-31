import { NextRequest, NextResponse } from 'next/server';
import { getCard, incrementTap } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const card = await getCard(id);

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

  // Active card: Increment tap count asynchronously and redirect to Google Review!
  try {
    await incrementTap(card.id);
  } catch (err) {
    console.error('Failed to increment tap count:', err);
  }

  // 302 Temporary Redirect to target Google Review URL
  return NextResponse.redirect(card.target_url, { status: 302 });
}
