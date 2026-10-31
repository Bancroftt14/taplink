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
  const [prefix, setPrefix] = useState('TAP');
  const [batchCount, setBatchCount] = useState(20);
  const [defaultPin, setDefaultPin] = useState('');
  const [generating, setGenerating] = useState(false);

  // Edit card modal state
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCards = async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Autentikasi gagal. Masukkan kunci yang benar.');
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white">TapLink Admin Portal</h1>
            <p className="text-xs text-slate-400">Masukkan kunci admin untuk mengelola kartu NFC</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Masukkan Admin Secret"
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: bancroftt2026 (dapat diubah via .env)</p>
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? 'Memeriksa Kunci...' : 'Masuk ke Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        {/* Top Navbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-white">TapLink Manager</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Kelola kartu Google Tap Review bancrovtt.web.id</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCards(adminKey)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>

            <button
              onClick={() => window.open(`/admin/print-stickers?key=${encodeURIComponent(adminKey)}`, '_blank')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-lg shadow-blue-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh Stiker QR</span>
            </button>

            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV (NFC/QR)</span>
            </button>
          </div>
        </div>

        {/* Analytics Counter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Kartu Dicetak</span>
              <CreditCard className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">{cards.length}</div>
            <p className="text-[11px] text-slate-500">Total persediaan kartu sistem</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Kartu Aktif (Klien)</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">{activeCount}</div>
            <p className="text-[11px] text-slate-500">{unassignedCount} kartu belum diaktifkan pembeli</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Tap Pelanggan</span>
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400">{totalTaps}</div>
            <p className="text-[11px] text-slate-500">Akumulasi kunjungan review semua klien</p>
          </div>
        </div>

        {/* Batch Generator Section */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white text-base">Cetak Batch Kartu Baru</h2>
          </div>
          <p className="text-xs text-slate-400">
            Generate seri ID kartu sekaligus untuk di-write ke chip NFC atau dicetak ke stiker QR code kartu.
          </p>

          <form onSubmit={handleBatchGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Prefix ID</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="TAP"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Jumlah Kartu</label>
              <input
                type="number"
                min={1}
                max={500}
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">PIN Default (Opsional)</label>
              <input
                type="text"
                value={defaultPin}
                onChange={(e) => setDefaultPin(e.target.value)}
                placeholder="Kosongkan jika tanpa PIN"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={generating}
                className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {generating ? 'Membuat...' : '⚡ Generate Kartu'}
              </button>
            </div>
          </form>
        </div>

        {/* Cards Table Section */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-5">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, Toko, No HP..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Semua ({cards.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                onClick={() => setFilterStatus('unassigned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'unassigned' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Belum Aktif ({unassignedCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">ID Kartu</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Nama Usaha Klien</th>
                  <th className="py-3 px-3">Tap URL</th>
                  <th className="py-3 px-3 text-center">Taps</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Tidak ada kartu yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((c) => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const tapUrl = `${origin}/c/${c.id}`;

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                          {c.id}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {c.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                              <CheckCircle className="w-3 h-3" />
                              <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                              <Clock className="w-3 h-3" />
                              <span>Belum Aktif</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-[180px] truncate">
                          {c.business_name ? (
                            <div>
                              <div className="font-medium text-white truncate">{c.business_name}</div>
                              {c.client_phone && (
                                <div className="text-[10px] text-slate-400">{c.client_phone}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Belum diklaim</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => copyToClipboard(tapUrl, c.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800"
                            title="Klik untuk salin URL NFC"
                          >
                            <span>/c/{c.id}</span>
                            {copiedId === c.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-white">
                          {c.taps || 0}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => {
                              setEditingCard(c);
                              setEditName(c.business_name || '');
                              setEditUrl(c.target_url || '');
                            }}
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                          >
                            Edit
                          </button>
                          {c.status === 'active' && (
                            <button
                              onClick={() => handleResetCard(c.id)}
                              className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition"
                              title="Reset kartu kembali ke status belum aktif"
                            >
                              Reset
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">
              Edit Data Kartu: <span className="font-mono text-blue-400">{editingCard.id}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Usaha</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Link Google Review</label>
                <textarea
                  rows={2}
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500 resize-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50"
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
