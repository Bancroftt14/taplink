'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

function ActivateContent() {
  const searchParams = useSearchParams();
  const initialId = (searchParams.get('id') || '').toUpperCase();

  const [cardId, setCardId] = useState(initialId);
  const [googleUrl, setGoogleUrl] = useState('');
  const [pin, setPin] = useState('');
  const [requiresPin, setRequiresPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success state
  const [isActivated, setIsActivated] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [finalCardUrl, setFinalCardUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialId) {
      setCardId(initialId);
    }
  }, [initialId]);

  // Check if card requires PIN
  useEffect(() => {
    const currentId = (cardId || initialId || '').trim().toUpperCase();
    if (!currentId) return;

    let isMounted = true;
    async function checkCard() {
      try {
        const res = await fetch(`/api/card-info?id=${encodeURIComponent(currentId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setRequiresPin(Boolean(data.requires_pin));
          }
        }
      } catch {
        // silent fallback
      }
    }
    checkCard();

    return () => {
      isMounted = false;
    };
  }, [cardId, initialId]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setGoogleUrl(text.trim());
    } catch {
      // browser permissions
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetId = cardId.trim().toUpperCase();
    if (!targetId) {
      setErrorMessage('ID Kartu tidak boleh kosong.');
      return;
    }

    if (!googleUrl.trim()) {
      setErrorMessage('Masukkan tautan Google Maps bisnis Anda.');
      return;
    }

    if (requiresPin && !pin.trim()) {
      setErrorMessage('PIN aktivasi wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: targetId,
          url: googleUrl.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal mengaktifkan kartu.');
      } else {
        setIsActivated(true);
        setBusinessName(data.card?.business_name || 'Bisnis Anda');
        const origin = window.location.origin;
        setFinalCardUrl(`${origin}/c/${targetId}`);
      }
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!finalCardUrl) return;
    navigator.clipboard.writeText(finalCardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col justify-center items-center px-4 py-8 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-sm space-y-6">
        {/* Simple Brand Header */}
        <div className="text-center space-y-1">
          <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">TapLink</p>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {isActivated ? 'Kartu Aktif' : 'Aktivasi Kartu'}
          </h1>
          <p className="text-xs text-slate-400">
            {isActivated
              ? 'Kartu telah berhasil dihubungkan ke Google Review.'
              : 'Tautkan kartu pintar ini ke profil Google Bisnis Anda.'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
          {!isActivated ? (
            <form onSubmit={handleActivate} className="space-y-4">
              {/* Card ID */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  ID Kartu
                </label>
                {initialId ? (
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] font-mono text-xs text-slate-300 flex items-center justify-between">
                    <span>{initialId}</span>
                    <span className="text-[10px] text-slate-500">Terdeteksi</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value.toUpperCase())}
                    placeholder="Contoh: TAP-001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 font-mono outline-none focus:border-blue-500 transition"
                    required
                  />
                )}
              </div>

              {/* PIN Input (Only if card requires PIN) */}
              {requiresPin && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-400">
                      PIN Keamanan
                    </label>
                    <span className="text-[10px] text-amber-400/80">Wajib</span>
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Masukkan PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 font-mono outline-none focus:border-blue-500 transition tracking-widest"
                    required
                  />
                </div>
              )}

              {/* Google Maps Link */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-slate-400">
                    Tautan Google Maps
                  </label>
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition"
                  >
                    Tempel
                  </button>
                </div>
                <input
                  type="url"
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 transition"
                  required
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <span>Hubungkan Kartu</span>
                )}
              </button>
            </form>
          ) : (
            /* Success Screen */
            <div className="space-y-4 text-center py-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">{businessName}</p>
                <p className="text-[11px] text-slate-400 font-mono">{cardId}</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-300 break-all select-all">
                {finalCardUrl}
              </div>

              <div className="pt-2 space-y-2">
                <a
                  href={finalCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <span>Coba Buka Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 border border-white/10 transition"
                >
                  {copied ? 'Tersalin' : 'Salin Tautan'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-[11px] text-slate-600">
          Kartu siap digunakan untuk tap NFC dan scan QR code.
        </p>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] text-slate-500 flex items-center justify-center text-xs">
          Memuat...
        </div>
      }
    >
      <ActivateContent />
    </Suspense>
  );
}
