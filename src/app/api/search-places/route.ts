import { NextRequest, NextResponse } from 'next/server';

interface PlaceResult {
  name: string;
  address: string;
  fullText: string;
  mapsUrl: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // 1. Primary fast POI search via Photon (Komoot OSM)
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`;
    const res = await fetch(photonUrl, {
      headers: { 'User-Agent': 'TapLink-Search/1.0' },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      const features = data.features || [];

      if (features.length > 0) {
        const results: PlaceResult[] = features.map((f: any) => {
          const p = f.properties || {};
          const name = p.name || p.street || query;
          const addressParts = [
            p.street,
            p.locality || p.district || p.city,
            p.state,
            p.country,
          ].filter(Boolean);
          const address = addressParts.join(', ');

          const fullQuery = [name, addressParts.slice(0, 2).join(', ')]
            .filter(Boolean)
            .join(', ');
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            fullQuery
          )}`;

          return {
            name,
            address: address || 'Lokasi terdaftar',
            fullText: fullQuery,
            mapsUrl,
          };
        });

        return NextResponse.json({ results });
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim if Photon yields no results
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=5`;
    const nomRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'TapLink-Search/1.0' },
    });

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      const results: PlaceResult[] = (nomData || []).map((item: any) => {
        const name = item.name || item.display_name.split(',')[0];
        const address = item.display_name.split(',').slice(1, 4).join(',').trim();
        const fullQuery = `${name}, ${address}`;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          fullQuery
        )}`;

        return {
          name,
          address: address || item.display_name,
          fullText: fullQuery,
          mapsUrl,
        };
      });

      return NextResponse.json({ results });
    }

    return NextResponse.json({ results: [] });
  } catch (err) {
    console.error('Place search error:', err);
    return NextResponse.json({ results: [] });
  }
}
