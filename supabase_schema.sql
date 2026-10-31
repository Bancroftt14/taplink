-- ========================================================
-- TAPLINK GOOGLE REVIEW CARD DATABASE SCHEMA (SUPABASE)
-- Jalankan query ini di SQL Editor Supabase Anda
-- ========================================================

CREATE TABLE IF NOT EXISTS public.cards (
    id TEXT PRIMARY KEY,                       -- Contoh: 'TAP-001'
    status TEXT NOT NULL DEFAULT 'unassigned', -- 'unassigned' | 'active' | 'suspended'
    target_url TEXT DEFAULT '',                -- URL Google Review langsung
    raw_input_url TEXT DEFAULT '',             -- Link mentah yang ditempel klien
    business_name TEXT DEFAULT '',             -- Nama Toko / Usaha
    client_phone TEXT DEFAULT '',              -- No. WhatsApp klien
    client_email TEXT DEFAULT '',              -- Email klien
    pin TEXT DEFAULT '',                       -- PIN aktivasi pengaman kartu
    taps INTEGER NOT NULL DEFAULT 0,           -- Hitungan jumlah tap pengunjung
    notes TEXT DEFAULT '',                     -- Catatan internal admin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ
);

-- Index untuk pencarian cepat saat kartu di-tap
CREATE INDEX IF NOT EXISTS idx_cards_status ON public.cards(status);

-- Masukkan 3 kartu awal sebagai contoh
INSERT INTO public.cards (id, status, target_url, business_name, pin, taps, created_at)
VALUES 
('TAP-001', 'unassigned', '', '', '1234', 0, NOW()),
('TAP-002', 'unassigned', '', '', '5678', 0, NOW()),
('TAP-DEMO', 'active', 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4', 'Bancroftt Studio (Contoh)', '0000', 10, NOW())
ON CONFLICT (id) DO NOTHING;
