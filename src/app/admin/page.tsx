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
      <div className="relative min-h-screen bg-[#05070f] text-slate-100 flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="absolute inset-0 apple-glow-mesh pointer-events-none" />
        <div className="max-w-sm w-full apple-glass-card rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl border border-white/10 relative z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 border border-white/20 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl shadow-blue-500/20">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white">TapLink Admin Hub</h1>
            <p className="text-xs text-slate-400">Masukkan kunci pengaman admin untuk mengelola kartu NFC</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin Secret Key"
                className="w-full apple-glass-input rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Kunci Default: bancroftt2026</p>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-blue-500/25 border border-white/20 disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Memeriksa Kunci...' : 'Masuk ke Control Center'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05070f] text-slate-100 font-sans pb-24 overflow-x-hidden">
      <div className="absolute inset-0 apple-glow-mesh pointer-events-none" />

      {/* Apple-Style Glass Top Navigation */}
      <header className="sticky top-0 z-40 apple-glass-card border-b border-white/10 backdrop-blur-2xl px-4 sm:px-8 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  TapLink Control Center
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">
                Sistem Manajemen Kartu NFC & Ulasan Google Bintang 5
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchCards(adminKey)}
              className="p-2.5 rounded-xl apple-glass hover:bg-white/10 text-slate-300 transition active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl apple-glass hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>{showGenerator ? 'Tutup Generator' : '+ Kartu Baru'}</span>
            </button>

            <button
              onClick={() =>
                window.open(
                  `/admin/print-stickers?key=${encodeURIComponent(adminKey)}`,
                  '_blank'
                )
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-xl shadow-blue-600/30 border border-white/20 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Studio Cetak A3+ & Stiker</span>
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl apple-glass hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition active:scale-95"
              title="Ekspor CSV untuk NFC writer tools"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8 relative z-10">
        {/* Apple 4-Metric Glass Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Kartu */}
          <div className="apple-glass-card rounded-[28px] p-5 sm:p-6 space-y-2 border border-white/10 hover:border-blue-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Total Kartu</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {cards.length}
            </div>
            <p className="text-[11px] text-slate-500">Persediaan terdaftar di sistem</p>
          </div>

          {/* Kartu Aktif */}
          <div className="apple-glass-card rounded-[28px] p-5 sm:p-6 space-y-2 border border-white/10 hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Kartu Aktif (Klien)</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {activeCount}
            </div>
            <p className="text-[11px] text-slate-500">Sudah ditautkan ke Google Review</p>
          </div>

          {/* Belum Aktif */}
          <div className="apple-glass-card rounded-[28px] p-5 sm:p-6 space-y-2 border border-white/10 hover:border-amber-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Belum Diaktivasi</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
              {unassignedCount}
            </div>
            <p className="text-[11px] text-slate-500">Siap dikirim atau diprogram</p>
          </div>

          {/* Total Taps */}
          <div className="apple-glass-card rounded-[28px] p-5 sm:p-6 space-y-2 border border-white/10 hover:border-indigo-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Total Tap Pengunjung</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {totalTaps}
            </div>
            <p className="text-[11px] text-slate-500">Akumulasi kunjungan review semua toko</p>
          </div>
        </div>

        {/* Batch Generator Drawer */}
        {showGenerator && (
          <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 border border-blue-500/30 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-white text-base">Generate Seri Kartu Baru</h2>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Buat seri kartu sekaligus. Format 8 kartu sangat pas untuk 1 lembar cetak A3+!
            </p>

            <form onSubmit={handleBatchGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Prefix ID</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="TAP"
                  className="w-full apple-glass-input rounded-2xl px-4 py-2.5 text-xs text-white uppercase font-mono outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Jumlah Kartu</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full apple-glass-input rounded-2xl px-4 py-2.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">PIN (Opsional)</label>
                <input
                  type="text"
                  value={defaultPin}
                  onChange={(e) => setDefaultPin(e.target.value)}
                  placeholder="Kosongkan jika tanpa PIN"
                  className="w-full apple-glass-input rounded-2xl px-4 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 disabled:opacity-50 active:scale-95 apple-tap-target"
                >
                  {generating ? 'Membuat...' : 'Generate Kartu'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cards Table Card */}
        <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
          {/* Table Header Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, Nama Toko, WhatsApp..."
                className="w-full apple-glass-input rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 self-stretch sm:self-auto justify-center">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({cards.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === 'active'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                onClick={() => setFilterStatus('unassigned')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === 'unassigned'
                    ? 'bg-blue-600 text-white shadow-md'
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

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCard(card);
                                setEditName(card.business_name || '');
                                setEditUrl(card.target_url || '');
                              }}
                              className="p-1.5 rounded-lg apple-glass hover:bg-white/10 text-slate-300 transition"
                              title="Edit Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {card.status === 'active' && (
                              <button
                                onClick={() => handleResetCard(card.id)}
                                className="p-1.5 rounded-lg apple-glass hover:bg-amber-500/20 text-amber-400 transition"
                                title="Reset Kartu ke Belum Aktif"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-1.5 rounded-lg apple-glass hover:bg-rose-500/20 text-rose-400 transition"
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
        <div className="fixed bottom-[env(safe-area-inset-bottom,1.5rem)] left-1/2 -translate-x-1/2 z-50 apple-glass-card rounded-2xl px-4 sm:px-6 py-3 border border-blue-500/40 shadow-2xl flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[95vw] overflow-x-auto">
          <span className="text-xs font-semibold text-white whitespace-nowrap">
            <strong className="text-blue-400">{selectedCardIds.length}</strong> dipilih
          </span>

          <div className="h-4 w-px bg-white/20 flex-shrink-0" />

          <button
            onClick={() =>
              window.open(
                `/admin/print-stickers?key=${encodeURIComponent(adminKey)}`,
                '_blank'
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-blue-600/30 whitespace-nowrap apple-tap-target"
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
              alert(`${selectedCardIds.length} Tap Link berhasil disalin!`);
            }}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl apple-glass hover:bg-white/10 text-xs font-medium text-slate-300 transition whitespace-nowrap apple-tap-target"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Link</span>
          </button>

          <button
            onClick={handleDeleteBatch}
            className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl apple-glass hover:bg-rose-500/20 text-xs font-bold text-rose-400 border border-rose-500/25 transition active:scale-95 whitespace-nowrap apple-tap-target"
            title="Hapus permanen kartu terpilih"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus ({selectedCardIds.length})</span>
          </button>

          <button
            onClick={() => setSelectedCardIds([])}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 flex-shrink-0"
            title="Batal pilih"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="apple-glass-card rounded-[32px] max-w-md w-full p-6 sm:p-8 border border-white/20 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Edit Kartu:</span>
                  <span className="font-mono text-blue-400">{editingCard.id}</span>
                </h3>
                <p className="text-xs text-slate-400">Atur link Google Maps atau nama usaha secara manual</p>
              </div>
              <button
                onClick={() => setEditingCard(null)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nama Usaha / Toko</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Toko Kopi Nusantara"
                  className="w-full apple-glass-input rounded-2xl px-4 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Target Google Review URL</label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full apple-glass-input rounded-2xl px-4 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2.5 rounded-2xl apple-glass hover:bg-white/10 text-xs font-medium text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 border border-white/20 disabled:opacity-50"
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
