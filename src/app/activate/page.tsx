'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  ArrowRight,
  Share2,
} from 'lucide-react';

function ActivateContent() {
  const searchParams = useSearchParams();
  const initialId = (searchParams.get('id') || '').toUpperCase();

  const [cardId, setCardId] = useState(initialId);
  const [googleUrl, setGoogleUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success state
  const [isActivated, setIsActivated] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [finalCardUrl, setFinalCardUrl] = useState('');

  // If initial ID exists, set it
  useEffect(() => {
    if (initialId) {
      setCardId(initialId);
    }
  }, [initialId]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cardId.trim()) {
      setErrorMessage('ID Kartu wajib diisi.');
      return;
    }

    if (!googleUrl.trim()) {
      setErrorMessage('Silakan tempel link usaha Anda dari Google Maps.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: cardId.trim().toUpperCase(),
          url: googleUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Aktivasi gagal. Periksa kembali link Anda.');
      } else {
        setIsActivated(true);
        setBusinessName(data.card?.business_name || 'Bisnis Anda');
        const origin = window.location.origin;
        setFinalCardUrl(`${origin}/c/${cardId.trim().toUpperCase()}`);
      }
    } catch {
      setErrorMessage('Koneksi terganggu. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full mx-auto my-auto py-8">
        {/* Simple Brand Header */}
        <div className="text-center mb-6 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aktivasi Kartu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hubungkan ke Google Maps
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Tempel link usaha Anda di bawah. Kartu langsung otomatis aktif.
          </p>
        </div>

        {/* Success Screen */}
        {isActivated ? (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">Kartu Berhasil Aktif! 🎉</h2>
              <p className="text-xs text-slate-300">
                Terhubung ke: <span className="font-semibold text-emerald-400">{businessName}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>URL Kartu NFC:</span>
                <span className="font-mono text-blue-400 font-bold">{cardId}</span>
              </div>
              <div className="font-mono text-xs text-blue-300 break-all select-all">
                {finalCardUrl}
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href={finalCardUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition active:scale-[0.98]"
              >
                <span>Uji Coba Tap Sekarang</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(finalCardUrl);
                  alert('Link kartu berhasil disalin!');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Salin Link Kartu</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              Setiap kali kartu ini di-tap, pop-up ulasan bintang 5 Google Anda akan langsung terbuka otomatis.
            </p>
          </div>
        ) : (
          /* Single-Step Activation Form */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
            <form onSubmit={handleActivate} className="space-y-4">
              {/* ID Kartu (Minimal Badge or Input) */}
              {initialId ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-400">ID Kartu:</span>
                  <span className="font-mono font-bold text-blue-400">{cardId}</span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ID Kartu
                  </label>
                  <input
                    type="text"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value.toUpperCase())}
                    placeholder="Contoh: TAP-001"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-mono outline-none transition"
                    required
                  />
                </div>
              )}

              {/* The Only Input Needed: Google Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Link Google Maps Usaha Anda</span>
                </label>
                <input
                  type="url"
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="Tempel link di sini (https://maps.app.goo.gl/...)"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition font-sans"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  💡 <strong>Cara ambil link:</strong> Buka Google Maps di HP ➔ cari nama toko/usaha Anda ➔ klik tombol <strong>&quot;Bagikan&quot;</strong> atau <strong>&quot;Minta Ulasan&quot;</strong> ➔ Salin link lalu tempel di sini.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Big Activation Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menghubungkan ke Google Review...</span>
                  </>
                ) : (
                  <>
                    <span>Aktifkan Kartu Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          TapLink • bancrovtt.web.id
        </div>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">
          Memuat halaman aktivasi...
        </div>
      }
    >
      <ActivateContent />
    </Suspense>
  );
}
