'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Download,
  Copy,
  Search,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Check,
  Printer,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { Card } from '@/types/card';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'unassigned'>('all');

  // Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [prefix, setPrefix] = useState('TAP');
  const [batchCount, setBatchCount] = useState(8);
  const [defaultPin, setDefaultPin] = useState('');
  const [generating, setGenerating] = useState(false);

  // Edit card modal state
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Multi-select for A3+ print
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check URL query param for key on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('key');
      if (urlKey) {
        setAdminKey(urlKey);
        fetchCards(urlKey);
      }
    }
  }, []);

  const fetchCards = async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Autentikasi gagal. Periksa kembali kunci admin Anda.');
        setIsAuthenticated(false);
      } else {
        setCards(data.cards || []);
        setIsAuthenticated(true);
      }
    } catch {
      setError('Gagal menghubungkan ke server.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    fetchCards(adminKey.trim());
  };

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_generate',
          prefix: prefix.trim().toUpperCase(),
          count: Number(batchCount),
          defaultPin: defaultPin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal generate kartu.');
      } else {
        alert(`Berhasil generate ${data.insertedCount} kartu baru!`);
        setShowGenerator(false);
        fetchCards(adminKey);
      }
    } catch {
      alert('Terjadi kesalahan saat generate kartu.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingCard.id,
          updates: {
            business_name: editName.trim(),
            target_url: editUrl.trim(),
            status: editUrl.trim() ? 'active' : 'unassigned',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan perubahan.');
      } else {
        setEditingCard(null);
        fetchCards(adminKey);
      }
    } catch {
      alert('Gagal menghubungi server.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetCard = async (id: string) => {
    if (!confirm(`Reset kartu ${id} menjadi 'Belum Ditautkan' dan kosongkan linknya?`)) return;

    try {
      const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', id }),
      });
      if (res.ok) {
        fetchCards(adminKey);
      } else {
        alert('Gagal mereset kartu.');
      }
    } catch {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm(`Yakin ingin MENGHAPUS PERMANEN kartu ${id}? Data tidak bisa dikembalikan.`)) return;

    try {
      const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (res.ok) {
        setSelectedCardIds((prev) => prev.filter((item) => item !== id));
        fetchCards(adminKey);
      } else {
        alert('Gagal menghapus kartu.');
      }
    } catch {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const handleDeleteBatch = async () => {
    if (selectedCardIds.length === 0) return;
    if (
      !confirm(
        `PERINGATAN: Anda akan MENGHAPUS PERMANEN ${selectedCardIds.length} kartu terpilih. Lanjutkan?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_batch', ids: selectedCardIds }),
      });
      if (res.ok) {
        setSelectedCardIds([]);
        fetchCards(adminKey);
      } else {
        alert('Gagal menghapus batch kartu.');
      }
    } catch {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelectCard = (id: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedCardIds.length === filteredCards.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(filteredCards.map((c) => c.id));
    }
  };

  const exportCSV = () => {
    if (cards.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const headers = ['ID', 'Status', 'Nama Usaha', 'PIN', 'Taps', 'Tap URL', 'Target URL'];
    const rows = cards.map((c) => [
      c.id,
      c.status,
      `"${(c.business_name || '').replace(/"/g, '""')}"`,
      c.pin || '',
      c.taps || 0,
      `${origin}/c/${c.id}`,
      `"${(c.target_url || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taplink_cards_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.client_phone || '').includes(searchQuery);

    if (filterStatus === 'active') return matchesSearch && c.status === 'active';
    if (filterStatus === 'unassigned') return matchesSearch && c.status === 'unassigned';
    return matchesSearch;
  });

  const totalTaps = cards.reduce((acc, c) => acc + (c.taps || 0), 0);
  const activeCount = cards.filter((c) => c.status === 'active').length;
  const unassignedCount = cards.filter((c) => c.status === 'unassigned').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07090e] text-[#f4f5f7] flex items-center justify-center p-4 selection:bg-white selection:text-slate-900">
        <div className="max-w-sm w-full bg-[#0f121a] rounded-2xl p-6 sm:p-8 space-y-5 border border-white/[0.08] shadow-2xl">
          <div className="space-y-1">
            <p className="text-[10px] font-mono tracking-[0.24em] text-slate-500 uppercase">Bancroftt</p>
            <h1 className="text-xl font-medium text-white tracking-tight">Admin TapLink</h1>
            <p className="text-xs text-slate-400">Masukkan kunci sandi untuk mengakses dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Kunci Admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/[0.1] text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 transition"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs transition active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Memeriksa...' : 'Masuk ke Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f4f5f7] pb-28 selection:bg-white selection:text-slate-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#07090e]/95 border-b border-white/[0.08] backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-tight">TapLink Admin</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              {cards.length} Kartu
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchCards(adminKey)}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{showGenerator ? 'Tutup' : 'Tambah Kartu'}</span>
              <span className="sm:hidden">Tambah</span>
            </button>

            <button
              onClick={() =>
                window.open(
                  `/admin/print-stickers?key=${encodeURIComponent(adminKey)}`,
                  '_blank'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-100 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Studio Cetak</span>
              <span className="sm:hidden">Cetak</span>
            </button>

            <button
              onClick={exportCSV}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition hidden sm:flex items-center gap-1"
              title="Ekspor CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-xs">CSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-5 space-y-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-[#0f121a] rounded-xl p-3.5 sm:p-5 border border-white/[0.08] space-y-0.5">
            <div className="text-[11px] font-medium text-slate-400">Total Kartu</div>
            <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{cards.length}</div>
          </div>

          <div className="bg-[#0f121a] rounded-xl p-3.5 sm:p-5 border border-white/[0.08] space-y-0.5">
            <div className="text-[11px] font-medium text-slate-400">Aktif</div>
            <div className="text-xl sm:text-2xl font-semibold text-emerald-400 tracking-tight">{activeCount}</div>
          </div>

          <div className="bg-[#0f121a] rounded-xl p-3.5 sm:p-5 border border-white/[0.08] space-y-0.5">
            <div className="text-[11px] font-medium text-slate-400">Belum Ditautkan</div>
            <div className="text-xl sm:text-2xl font-semibold text-amber-400 tracking-tight">{unassignedCount}</div>
          </div>

          <div className="bg-[#0f121a] rounded-xl p-3.5 sm:p-5 border border-white/[0.08] space-y-0.5">
            <div className="text-[11px] font-medium text-slate-400">Total Taps</div>
            <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{totalTaps}</div>
          </div>
        </div>

        {/* Batch Generator Drawer */}
        {showGenerator && (
          <div className="bg-[#0f121a] rounded-2xl p-5 border border-white/[0.08] shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-400" />
                <h2 className="font-semibold text-white text-sm">Generate Seri Kartu</h2>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Buat sejumlah kartu baru secara batch dengan penomoran berurutan.
            </p>

            <form onSubmit={handleBatchGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Prefix ID</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="TAP"
                  className="w-full rounded-xl bg-[#090b10] border border-white/10 px-3.5 py-2 text-xs text-white uppercase font-mono outline-none focus:border-white/30 transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Jumlah Kartu</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full rounded-xl bg-[#090b10] border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-white/30 transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">PIN (Opsional)</label>
                <input
                  type="text"
                  value={defaultPin}
                  onChange={(e) => setDefaultPin(e.target.value)}
                  placeholder="Kosongkan jika tanpa PIN"
                  className="w-full rounded-xl bg-[#090b10] border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold transition disabled:opacity-50 active:scale-[0.99]"
                >
                  {generating ? 'Membuat...' : 'Generate Kartu'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cards Container */}
        <div className="bg-[#0f121a] rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden">
          {/* Filter & Search Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, Nama Toko..."
                className="w-full rounded-xl bg-[#090b10] border border-white/10 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-white/30 transition"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 self-stretch sm:self-auto justify-center">
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({cards.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'active'
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                onClick={() => setFilterStatus('unassigned')}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'unassigned'
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Belum ({unassignedCount})
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW A: MOBILE CARD LIST (Screen < 768px) - 100% Touch-Friendly & Clean   */}
          {/* ========================================================================= */}
          <div className="block md:hidden divide-y divide-white/[0.06]">
            {filteredCards.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Tidak ada kartu yang cocok dengan pencarian.
              </div>
            ) : (
              filteredCards.map((card) => {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const tapUrl = `${origin}/c/${card.id}`;
                const isSelected = selectedCardIds.includes(card.id);

                return (
                  <div
                    key={card.id}
                    className={`p-4 space-y-2.5 transition ${
                      isSelected ? 'bg-blue-600/10' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Top Row: Checkbox, ID, Status, Taps */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCard(card.id)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                        />
                        <span className="font-mono font-bold text-sm text-white">
                          {card.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            card.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          }`}
                        >
                          {card.status === 'active' ? 'Aktif' : 'Belum Ditautkan'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          {card.taps || 0} taps
                        </span>
                      </div>
                    </div>

                    {/* Business Name & Target Link */}
                    <div className="space-y-0.5 text-xs">
                      <p className="font-medium text-white truncate">
                        {card.business_name || (
                          <span className="text-slate-500 italic">Belum diisi klien</span>
                        )}
                      </p>
                      {card.target_url ? (
                        <a
                          href={card.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{card.target_url}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ) : (
                        <p className="text-[11px] text-slate-600">Belum ada tautan review</p>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                      <button
                        onClick={() => copyToClipboard(tapUrl, card.id)}
                        className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]"
                      >
                        {copiedId === card.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Link</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCard(card);
                            setEditName(card.business_name || '');
                            setEditUrl(card.target_url || '');
                          }}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition"
                          title="Edit Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {card.status === 'active' && (
                          <button
                            onClick={() => handleResetCard(card.id)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-500/20 text-amber-400 transition"
                            title="Reset Kartu ke Belum Aktif"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-rose-400 transition"
                          title="Hapus Kartu Permanen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ========================================================================= */}
          {/* VIEW B: DESKTOP TABLE (Screen >= 768px)                                   */}
          {/* ========================================================================= */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-black/20">
                  <th className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={
                        filteredCards.length > 0 &&
                        selectedCardIds.length === filteredCards.length
                      }
                      onChange={selectAllFiltered}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600"
                    />
                  </th>
                  <th className="py-3 px-4">ID Kartu</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Nama Usaha / Klien</th>
                  <th className="py-3 px-4 text-center">Taps</th>
                  <th className="py-3 px-4">Target URL Google</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Tidak ada kartu yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => {
                    const origin =
                      typeof window !== 'undefined' ? window.location.origin : '';
                    const tapUrl = `${origin}/c/${card.id}`;
                    const isSelected = selectedCardIds.includes(card.id);

                    return (
                      <tr
                        key={card.id}
                        className={`hover:bg-white/[0.02] transition ${
                          isSelected ? 'bg-blue-600/10' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCard(card.id)}
                            className="rounded bg-slate-900 border-slate-700 text-blue-600"
                          />
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{card.id}</span>
                            <button
                              onClick={() => copyToClipboard(tapUrl, card.id)}
                              className="text-slate-500 hover:text-white transition"
                              title="Salin Tap Link NFC"
                            >
                              {copiedId === card.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              card.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                            }`}
                          >
                            {card.status === 'active' ? 'Aktif' : 'Belum Ditautkan'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-white max-w-[200px] truncate">
                          {card.business_name || (
                            <span className="text-slate-500 italic">Belum diisi klien</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-slate-300 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06]">
                            {card.taps || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-[240px] truncate text-slate-400">
                          {card.target_url ? (
                            <a
                              href={card.target_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <span className="truncate">{card.target_url}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingCard(card);
                                setEditName(card.business_name || '');
                                setEditUrl(card.target_url || '');
                              }}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition"
                              title="Edit Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {card.status === 'active' && (
                              <button
                                onClick={() => handleResetCard(card.id)}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-500/20 text-amber-400 transition"
                                title="Reset Kartu ke Belum Aktif"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-rose-400 transition"
                              title="Hapus Kartu Permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Floating Action Dock when Cards Selected */}
      {selectedCardIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-50 bg-[#0f121a] border border-white/15 rounded-xl px-4 py-2.5 shadow-2xl flex items-center justify-between sm:justify-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="text-xs font-medium text-white whitespace-nowrap">
            <strong className="text-blue-400 font-semibold">{selectedCardIds.length}</strong> dipilih
          </span>

          <div className="h-4 w-px bg-white/10 hidden sm:block flex-shrink-0" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                window.open(
                  `/admin/print-stickers?key=${encodeURIComponent(adminKey)}`,
                  '_blank'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-950 font-semibold text-xs transition active:scale-[0.99] whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak A3+</span>
            </button>

            <button
              onClick={() => {
                const links = selectedCardIds
                  .map((id) => `${window.location.origin}/c/${id}`)
                  .join('\n');
                navigator.clipboard.writeText(links);
                alert(`${selectedCardIds.length} link kartu berhasil disalin.`);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition whitespace-nowrap"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin</span>
            </button>

            <button
              onClick={handleDeleteBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-400 border border-rose-500/20 transition active:scale-[0.99] whitespace-nowrap"
              title="Hapus permanen kartu terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>

            <button
              onClick={() => setSelectedCardIds([])}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 flex-shrink-0"
              title="Batal pilih"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f121a] rounded-2xl max-w-sm w-full p-6 border border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Edit Kartu:</span>
                  <span className="font-mono text-blue-400">{editingCard.id}</span>
                </h3>
                <p className="text-[11px] text-slate-400">Atur link Google Maps atau nama usaha</p>
              </div>
              <button
                onClick={() => setEditingCard(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Nama Usaha / Toko</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Toko Kopi Nusantara"
                  className="w-full rounded-xl bg-[#090b10] border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Target Google Review URL</label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full rounded-xl bg-[#090b10] border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-white/30 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 transition"
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
