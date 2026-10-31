import { Card } from '@/types/card';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const supabase = useSupabase
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
  : null;

// Local JSON file path (for local dev and testing)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    // Seed initial demo cards
    const initialCards: Card[] = [
      {
        id: 'TAP-001',
        status: 'unassigned',
        target_url: '',
        business_name: '',
        pin: '1234',
        taps: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'TAP-002',
        status: 'unassigned',
        target_url: '',
        business_name: '',
        pin: '5678',
        taps: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'TAP-DEMO',
        status: 'active',
        target_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
        business_name: 'Bancroftt Studio (Contoh)',
        client_phone: '08123456789',
        pin: '0000',
        taps: 12,
        created_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialCards, null, 2), 'utf-8');
  }
}

function readLocalCards(): Card[] {
  ensureDataFile();
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content) as Card[];
  } catch (err) {
    console.error('Error reading local cards.json:', err);
    return [];
  }
}

function writeLocalCards(cards: Card[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf-8');
}

/**
 * Get card by ID (case-insensitive match)
 */
export async function getCard(rawId: string): Promise<Card | null> {
  const id = rawId.trim().toUpperCase();

  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .ilike('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase getCard error:', error);
      return null;
    }
    return data as Card | null;
  }

  // Local JSON fallback
  const cards = readLocalCards();
  const found = cards.find((c) => c.id.toUpperCase() === id);
  return found || null;
}

/**
 * Save or update full card
 */
export async function saveCard(card: Card): Promise<void> {
  const normalizedCard: Card = {
    ...card,
    id: card.id.trim().toUpperCase(),
  };

  if (useSupabase && supabase) {
    const { error } = await supabase
      .from('cards')
      .upsert(normalizedCard, { onConflict: 'id' });

    if (error) {
      console.error('Supabase saveCard error:', error);
      throw error;
    }
    return;
  }

  // Local JSON fallback
  const cards = readLocalCards();
  const index = cards.findIndex((c) => c.id.toUpperCase() === normalizedCard.id);
  if (index >= 0) {
    cards[index] = normalizedCard;
  } else {
    cards.push(normalizedCard);
  }
  writeLocalCards(cards);
}

/**
 * Update partial card fields
 */
export async function updateCard(
  rawId: string,
  updates: Partial<Card>
): Promise<Card | null> {
  const id = rawId.trim().toUpperCase();

  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase updateCard error:', error);
      throw error;
    }
    return data as Card | null;
  }

  // Local JSON fallback
  const cards = readLocalCards();
  const index = cards.findIndex((c) => c.id.toUpperCase() === id);
  if (index === -1) return null;

  cards[index] = { ...cards[index], ...updates };
  writeLocalCards(cards);
  return cards[index];
}

/**
 * Increment tap count for card
 */
export async function incrementTap(rawId: string): Promise<void> {
  const id = rawId.trim().toUpperCase();

  if (useSupabase && supabase) {
    // Call RPC or simple increment
    const { data } = await supabase
      .from('cards')
      .select('taps')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      await supabase
        .from('cards')
        .update({ taps: (data.taps || 0) + 1 })
        .eq('id', id);
    }
    return;
  }

  // Local JSON fallback
  const cards = readLocalCards();
  const card = cards.find((c) => c.id.toUpperCase() === id);
  if (card) {
    card.taps = (card.taps || 0) + 1;
    writeLocalCards(cards);
  }
}

/**
 * List all cards (for admin)
 */
export async function listAllCards(): Promise<Card[]> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase listAllCards error:', error);
      return [];
    }
    return (data as Card[]) || [];
  }

  // Local JSON fallback
  const cards = readLocalCards();
  return cards.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

/**
 * Bulk generate cards
 */
export async function createBatchCards(newCards: Card[]): Promise<number> {
  const normalized = newCards.map((c) => ({
    ...c,
    id: c.id.trim().toUpperCase(),
  }));

  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from('cards')
      .upsert(normalized, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Supabase createBatchCards error:', error);
      throw error;
    }
    return data?.length || 0;
  }

  // Local JSON fallback
  const cards = readLocalCards();
  let addedCount = 0;

  for (const nc of normalized) {
    const existingIdx = cards.findIndex((c) => c.id.toUpperCase() === nc.id);
    if (existingIdx >= 0) {
      cards[existingIdx] = nc;
    } else {
      cards.push(nc);
      addedCount++;
    }
  }
  writeLocalCards(cards);
  return addedCount;
}
