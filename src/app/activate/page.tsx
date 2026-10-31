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
  MapPin,
  ClipboardPaste,
  ShieldCheck,
  Star,
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
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (initialId) {
      setCardId(initialId);
    }
  }, [initialId]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setGoogleUrl(text.trim());
      }
    } catch {
      // Browser permissions fallback
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cardId.trim()) {
      setErrorMessage('ID Kartu wajib diisi.');
      return;
    }

    if (!googleUrl.trim()) {
      setErrorMessage('Silakan tempel link Google Maps toko atau usaha Anda.');
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
      setErrorMessage('Koneksi terganggu. Silakan periksa jaringan dan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!finalCardUrl) return;
    navigator.clipboard.writeText(finalCardUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  return (
    <div className="relative min-h-screen bg-[#05070f] text-[#f5f5f7] flex flex-col justify-between overflow-hidden font-apple-display pb-[env(safe-area-inset-bottom,1.5rem)]">
      {/* Subtle Apple Ambient Glow Field */}
      <div className="absolute inset-0 apple-glow-mesh pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[450px] h-[300px] bg-emerald-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header / Brand Nav */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
            TapLink <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Pro</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline font-medium">Aktivasi Aman & Resmi</span>
        </div>
      </header>

      {/* Main Activation Stage */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-4 sm:py-8 my-auto">
        {!isActivated ? (
          <div className="space-y-6">
            {/* Header Text */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full apple-glass text-blue-300 text-[11px] font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span>Kartu Pintar NFC & QR</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                Hubungkan Kartu Anda
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                Tempelkan link Google Maps usaha Anda. Kartu akan langsung aktif dan siap digunakan.
              </p>
            </div>

            {/* Apple Floating Card Miniature Preview */}
            <div className="relative mx-auto w-52 sm:w-56 aspect-square apple-glass rounded-[28px] p-4 flex flex-col justify-between items-center shadow-2xl border border-white/15 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />

              {/* Card Header */}
              <div className="w-full flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono font-bold tracking-wider text-blue-400">
                  {cardId || 'TAP-001'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-semibold text-[9px] flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  Siap Aktif
                </span>
              </div>

              {/* Miniature Center Google Branding */}
              <div className="flex flex-col items-center text-center space-y-1.5 my-auto">
                <div className="w-12 h-12 rounded-full p-1 bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center">
                  <img
                    src="/google-logo-glossy.webp"
                    alt="Google"
                    className="w-10 h-10 object-contain drop-shadow"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-300 font-normal">Bantu Kami Dengan</div>
                  <div className="text-xs font-bold text-white tracking-tight">Google Review</div>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400 pt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Bottom Dock hint */}
              <div className="w-full pt-2 border-t border-white/10 flex items-center justify-around text-[9px] text-slate-400 font-medium">
                <span>NFC Tap</span>
                <span className="text-slate-600">•</span>
                <span>Scan QR</span>
              </div>
            </div>

            {/* Apple Frosted Card Form */}
            <div className="apple-glass-card rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-5">
              <form onSubmit={handleActivate} className="space-y-4">
                {/* ID Kartu Input (If not auto-detected from URL) */}
                {!initialId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>ID Kartu</span>
                      <span className="text-[10px] text-slate-500">Tertera di stiker</span>
                    </label>
                    <input
                      type="text"
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value.toUpperCase())}
                      placeholder="Contoh: TAP-001"
                      className="w-full apple-glass-input rounded-2xl px-4 py-3 text-base sm:text-xs font-mono uppercase text-white outline-none transition"
                      required
                    />
                  </div>
                )}

                {/* Primary Google Maps Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>Link Google Maps Usaha Anda</span>
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-white/5"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      <span>Tempel</span>
                    </button>
                  </label>

                  <div className="relative">
                    <input
                      type="url"
                      value={googleUrl}
                      onChange={(e) => setGoogleUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full apple-glass-input rounded-2xl px-4 py-3.5 pr-10 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition min-h-[48px]"
                      required
                      autoFocus
                    />
                    <LinkIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                    Petunjuk: Buka Google Maps di HP ➔ cari nama usaha Anda ➔ klik <strong>Bagikan</strong> ➔ <strong>Salin Link</strong> ➔ Tempel di formulir ini.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="leading-tight">{errorMessage}</span>
                  </div>
                )}

                {/* Apple Primary CTA Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full relative overflow-hidden py-3.5 px-4 min-h-[48px] rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 border border-white/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 apple-tap-target"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menghubungkan ke Google Maps...</span>
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
          </div>
        ) : (
          /* Apple-Style Success Celebration Screen */
          <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 text-center space-y-6 shadow-2xl border border-emerald-500/30 animate-in fade-in zoom-in-95 duration-300">
            {/* Emerald Glowing Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">
                Berhasil Diaktifkan
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Kartu Siap Digunakan
              </h2>
              <p className="text-xs text-slate-300">
                Terhubung langsung ke:{' '}
                <strong className="text-emerald-400 font-semibold block text-sm mt-0.5">
                  {businessName}
                </strong>
              </p>
            </div>

            {/* TapLink Card Details */}
            <div className="apple-glass rounded-2xl p-4 text-left space-y-1.5 border border-white/10">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>URL Kartu Pintar:</span>
                <span className="font-mono text-blue-400 font-bold">{cardId}</span>
              </div>
              <div className="font-mono text-xs text-slate-200 break-all select-all bg-black/30 p-2.5 rounded-xl border border-white/5">
                {finalCardUrl}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <a
                href={finalCardUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 min-h-[48px] rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 border border-white/20 transition active:scale-[0.98] apple-tap-target"
              >
                <span>Uji Coba Tap Sekarang</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[48px] rounded-2xl apple-glass hover:bg-white/10 text-slate-200 text-xs sm:text-sm font-medium border border-white/10 transition active:scale-[0.98] apple-tap-target"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{copyFeedback ? 'Link Berhasil Disalin' : 'Salin Link Kartu'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Setiap kali kartu ini di-tap atau QR di-scan, pelanggan akan langsung dibawa ke formulir ulasan bintang 5 Google Anda dalam waktu kurang dari 1 detik.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
        TapLink by Bancroftt — Google Review Card System
      </footer>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070f] text-slate-400 flex items-center justify-center text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Memuat halaman aktivasi...</span>
        </div>
      }
    >
      <ActivateContent />
    </Suspense>
  );
}
