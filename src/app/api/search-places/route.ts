import { NextRequest, NextResponse } from 'next/server';

interface PlaceResult {
  name: string;
  address: string;
  fullText: string;
  mapsUrl: string;
}

// Bounding box of Republic of Indonesia (Sabang to Merauke, Miangas to Rote)
const INDONESIA_BBOX = '95.0,-11.0,141.0,6.0';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // 1. Primary fast POI search via Photon (Komoot OSM) strictly bounded to Indonesia
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      query
    )}&bbox=${INDONESIA_BBOX}&lat=-6.2088&lon=106.8456&limit=8`;

    const res = await fetch(photonUrl, {
      headers: { 'User-Agent': 'TapLink-Search-ID/1.0' },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      const features = (data.features || []).filter((f: any) => {
        const country = (f.properties?.country || '').toLowerCase();
        const countryCode = (f.properties?.countrycode || '').toLowerCase();
        return (
          country === 'indonesia' ||
          countryCode === 'id' ||
          !country // bounded by Indonesia bbox
        );
      });

      if (features.length > 0) {
        const results: PlaceResult[] = features.map((f: any) => {
          const p = f.properties || {};
          const name = p.name || p.street || query;
          const addressParts = [
            p.street,
            p.locality || p.district || p.city,
            p.state,
            p.country || 'Indonesia',
          ].filter(Boolean);
          const address = addressParts.join(', ');

          const fullQuery = [name, addressParts.slice(0, 2).join(', ')]
            .filter(Boolean)
            .join(', ');
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${name}, ${address}`
          )}`;

          return {
            name,
            address: address || 'Indonesia',
            fullText: fullQuery,
            mapsUrl,
          };
        });

        return NextResponse.json({ results });
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim with strict countrycodes=id
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&countrycodes=id&limit=6`;

    const nomRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'TapLink-Search-ID/1.0' },
    });

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      const results: PlaceResult[] = (nomData || []).map((item: any) => {
        const name = item.name || item.display_name.split(',')[0];
        const addressParts = item.display_name.split(',').slice(1, 4).map((s: string) => s.trim());
        const address = addressParts.join(', ');
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${name}, ${address}`
        )}`;

        return {
          name,
          address: address || item.display_name,
          fullText: `${name}, ${address}`,
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
