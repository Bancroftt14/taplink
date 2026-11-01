import { NextRequest, NextResponse } from 'next/server';

interface PlaceResult {
  name: string;
  address: string;
  fullText: string;
  mapsUrl: string;
  placeId?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // 1. If Google Maps API Key is configured, use official Google Places API
  if (apiKey) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&region=id&language=id&key=${apiKey}`;

      const res = await fetch(googleUrl);
      if (res.ok) {
        const data = await res.json();
        const results: PlaceResult[] = (data.results || []).slice(0, 6).map((item: any) => {
          const placeId = item.place_id;
          const reviewUrl = placeId
            ? `https://search.google.com/local/writereview?placeid=${placeId}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${item.name}, ${item.formatted_address}`
              )}`;

          return {
            name: item.name,
            address: item.formatted_address || 'Indonesia',
            fullText: `${item.name}, ${item.formatted_address}`,
            mapsUrl: reviewUrl,
            placeId,
          };
        });

        return NextResponse.json({ results, provider: 'google_places_official' });
      }
    } catch (err) {
      console.error('Google Places official API error:', err);
    }
  }

  // 2. Fallback: Google Search Suggestions for Indonesia
  try {
    const suggestUrl = `https://suggestqueries.google.com/complete/search?client=chrome&hl=id&gl=id&q=${encodeURIComponent(
      query
    )}`;

    const res = await fetch(suggestUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const suggestions: string[] = (data[1] || []).slice(0, 5);

      const results: PlaceResult[] = suggestions.map((s) => {
        const cleanName = s.replace(/\b\w/g, (l) => l.toUpperCase());
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}`;

        return {
          name: cleanName,
          address: 'Cari langsung di Google Maps Indonesia',
          fullText: s,
          mapsUrl,
        };
      });

      return NextResponse.json({
        results,
        provider: 'google_suggestions',
        hasApiKey: Boolean(apiKey),
      });
    }
  } catch (err) {
    console.error('Suggest fallback error:', err);
  }

  return NextResponse.json({ results: [], hasApiKey: Boolean(apiKey) });
}
