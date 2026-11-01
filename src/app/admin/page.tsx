'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Download,
  Copy,
  Search,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  KeyRound,
  Check,
  BarChart3,
  CreditCard,
  CheckCircle,
  Clock,
  Printer,
  Sparkles,
  Layers,
  Edit2,
  Trash2,
  Link as LinkIcon,
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

  const handleResetCard = async (id: string) => {
    if (!confirm(`Yakin ingin me-reset kartu ${id} menjadi belum aktif?`)) return;

    try {
      const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', id }),
      });
      if (res.ok) {
        fetchCards(adminKey);
      } else {
        alert('Gagal me-reset kartu.');
      }
    } catch {
      alert('Gagal me-reset kartu.');
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm(`Hapus permanen kartu ${id}? Tindakan ini tidak dapat dibatalkan.`)) return;

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
      alert('Gagal menghapus kartu.');
    }
  };

  const handleDeleteBatch = async () => {
    if (selectedCardIds.length === 0) return;
    if (
      !confirm(
        `Hapus permanen ${selectedCardIds.length} kartu terpilih? Tindakan ini tidak dapat dibatalkan.`
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
      alert('Gagal menghapus batch kartu.');
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
      if (res.ok) {
        setEditingCard(null);
        fetchCards(adminKey);
      } else {
        alert('Gagal memperbarui data.');
      }
    } catch {
      alert('Gagal memperbarui data.');
    } finally {
      setSavingEdit(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Multi-select toggle
  const toggleSelectCard = (id: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://taplink.bancrovtt.web.id';
    const rows = [
      ['ID Kartu', 'Tap URL (Untuk NFC & QR)', 'Status', 'Nama Bisnis', 'Total Taps', 'Target Review URL', 'PIN'],
      ...cards.map((c) => [
        c.id,
        `${origin}/c/${c.id}`,
        c.status,
        `"${c.business_name || ''}"`,
        c.taps || 0,
        `"${c.target_url || ''}"`,
        c.pin || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taplink_cards_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered cards
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
      <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-blue-600 selection:text-white">
        <div className="max-w-sm w-full bg-[#11131a] rounded-2xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-xl">
          <div className="space-y-1">
            <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">TapLink</p>
            <h1 className="text-lg font-semibold text-white tracking-tight">Admin</h1>
            <p className="text-xs text-slate-400">Masukkan kunci sandi untuk mengakses dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Kunci Admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 transition"
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
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Memeriksa...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans pb-24 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#090a0f]/90 border-b border-white/[0.08] backdrop-blur-xl px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                  TapLink Admin
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                  Dashboard
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchCards(adminKey)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>{showGenerator ? 'Tutup' : 'Tambah Kartu'}</span>
            </button>

            <button
              onClick={() =>
                window.open(
                  `/admin/print-stickers?key=${encodeURIComponent(adminKey)}`,
                  '_blank'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Studio Cetak</span>
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 transition"
              title="Ekspor CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#11131a] rounded-2xl p-4 sm:p-5 border border-white/[0.08] space-y-1">
            <div className="text-[11px] font-medium text-slate-400">Total Kartu</div>
            <div className="text-2xl font-bold text-white tracking-tight">{cards.length}</div>
          </div>

          <div className="bg-[#11131a] rounded-2xl p-4 sm:p-5 border border-white/[0.08] space-y-1">
            <div className="text-[11px] font-medium text-slate-400">Aktif</div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{activeCount}</div>
          </div>

          <div className="bg-[#11131a] rounded-2xl p-4 sm:p-5 border border-white/[0.08] space-y-1">
            <div className="text-[11px] font-medium text-slate-400">Belum Ditautkan</div>
            <div className="text-2xl font-bold text-amber-400 tracking-tight">{unassignedCount}</div>
          </div>

          <div className="bg-[#11131a] rounded-2xl p-4 sm:p-5 border border-white/[0.08] space-y-1">
            <div className="text-[11px] font-medium text-slate-400">Total Kunjungan (Taps)</div>
            <div className="text-2xl font-bold text-white tracking-tight">{totalTaps}</div>
          </div>
        </div>

        {/* Batch Generator Drawer */}
        {showGenerator && (
          <div className="bg-[#11131a] rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-white uppercase font-mono outline-none focus:border-blue-500 transition"
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
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500 transition"
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
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition disabled:opacity-50 active:scale-[0.99]"
                >
                  {generating ? 'Membuat...' : 'Generate Kartu'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cards Table Card */}
        <div className="bg-[#11131a] rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-xl space-y-5">
          {/* Table Header Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, Nama Toko..."
                className="w-full rounded-xl bg-black/40 border border-white/10 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 self-stretch sm:self-auto justify-center">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({cards.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                onClick={() => setFilterStatus('unassigned')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'unassigned'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Belum ({unassignedCount})
              </button>
            </div>
          </div>

          {/* Cards List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">
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
                  <th className="py-3 px-3">ID Kartu</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Nama Usaha / Klien</th>
                  <th className="py-3 px-3 text-center">Taps</th>
                  <th className="py-3 px-3">Target URL Google</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                        className={`hover:bg-white/[0.03] transition ${
                          isSelected ? 'bg-blue-600/10' : ''
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCard(card.id)}
                            className="rounded bg-slate-900 border-slate-700 text-blue-600"
                          />
                        </td>

                        <td className="py-3.5 px-3 font-mono font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{card.id}</span>
                            <button
                              onClick={() => copyToClipboard(tapUrl, card.id)}
                              className="text-slate-500 hover:text-blue-400 transition"
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

                        <td className="py-3.5 px-3">
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

                        <td className="py-3.5 px-3 font-medium text-white max-w-[200px] truncate">
                          {card.business_name || (
                            <span className="text-slate-500 italic">Belum diisi klien</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-slate-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            {card.taps || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 max-w-[240px] truncate text-slate-400">
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

                        <td className="py-3 px-3 text-right">
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#11131a] rounded-xl px-4 py-2.5 border border-white/15 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[95vw] overflow-x-auto">
          <span className="text-xs font-medium text-white whitespace-nowrap">
            <strong className="text-blue-400 font-semibold">{selectedCardIds.length}</strong> dipilih
          </span>

          <div className="h-4 w-px bg-white/10 flex-shrink-0" />

          <button
            onClick={() =>
              window.open(
                `/admin/print-stickers?key=${encodeURIComponent(adminKey)}`,
                '_blank'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition active:scale-[0.99] whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak A3+ ({selectedCardIds.length})</span>
          </button>

          <button
            onClick={() => {
              const links = selectedCardIds
                .map((id) => `${window.location.origin}/c/${id}`)
                .join('\n');
              navigator.clipboard.writeText(links);
              alert(`${selectedCardIds.length} link kartu berhasil disalin.`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Link</span>
          </button>

          <button
            onClick={handleDeleteBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-400 border border-rose-500/20 transition active:scale-[0.99] whitespace-nowrap"
            title="Hapus permanen kartu terpilih"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus ({selectedCardIds.length})</span>
          </button>

          <button
            onClick={() => setSelectedCardIds([])}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 flex-shrink-0"
            title="Batal pilih"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#11131a] rounded-2xl max-w-sm w-full p-6 border border-white/[0.08] shadow-2xl space-y-4">
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
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Target Google Review URL</label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500 transition"
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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white disabled:opacity-50 transition"
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
