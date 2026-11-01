'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

function ActivateContent() {
  const searchParams = useSearchParams();
  const initialId = (searchParams.get('id') || '').toUpperCase();

  const [cardId, setCardId] = useState(initialId);
  const [isEditingId, setIsEditingId] = useState(!initialId);
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
      setIsEditingId(false);
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
      // browser permissions fallback
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetId = (cardId || initialId || '').trim().toUpperCase();
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

  const displayId = (cardId || initialId || '').trim().toUpperCase();

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f4f5f7] flex flex-col justify-center items-center px-4 py-8 selection:bg-white selection:text-slate-900">
      <div className="w-full max-w-[390px] space-y-6">
        {/* Main Card */}
        <div className="bg-[#0f121a] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
          {/* Subtle Top Metadata Header */}
          <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/[0.06]">
            <span className="text-[10px] uppercase font-mono tracking-[0.22em] text-slate-500 font-medium">
              TapLink NFC
            </span>

            {/* Micro ID Badge tucked cleanly in the corner */}
            {initialId && !isEditingId ? (
              <button
                type="button"
                onClick={() => setIsEditingId(true)}
                className="group flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-md border border-white/[0.06] transition"
                title="Klik untuk ubah ID jika perlu"
              >
                <span className="text-slate-500 group-hover:text-slate-400">ID</span>
                <span className="font-semibold text-slate-200">{displayId}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500">ID:</span>
                <input
                  type="text"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value.toUpperCase())}
                  placeholder="TAP-001"
                  className="w-24 px-2 py-0.5 rounded bg-black/50 border border-white/15 text-[11px] font-mono text-white uppercase outline-none focus:border-white/40 transition"
                  required
                />
              </div>
            )}
          </div>

          {!isActivated ? (
            <div className="space-y-6">
              {/* Title & Concise Subtitle */}
              <div className="space-y-1.5">
                <h1 className="text-[21px] sm:text-[23px] font-medium text-white tracking-[-0.03em] leading-snug">
                  Hubungkan Google Maps
                </h1>
                <p className="text-[13px] text-slate-400 font-normal leading-relaxed">
                  Tempelkan link ulasan toko atau bisnis Anda untuk mulai menerima ulasan bintang 5.
                </p>
              </div>

              <form onSubmit={handleActivate} className="space-y-4 pt-1">
                {/* 1. Google Maps Link (First & Primary) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-slate-300 tracking-[-0.01em]">
                      Tautan Google Maps
                    </label>
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="text-[11px] font-medium text-slate-400 hover:text-white transition px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
                    >
                      Tempel
                    </button>
                  </div>
                  <input
                    type="url"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/[0.1] text-[13px] text-white placeholder-slate-600 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Buka Google Maps &gt; Bagikan &gt; Salin tautan ulasan.
                  </p>
                </div>

                {/* 2. PIN Input (Second, only if card requires PIN) */}
                {requiresPin && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-slate-300 tracking-[-0.01em]">
                        PIN Keamanan
                      </label>
                      <span className="text-[10px] font-mono text-amber-400/90 tracking-wide uppercase">
                        Wajib
                      </span>
                    </div>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/[0.1] text-sm text-white placeholder-slate-600 font-mono tracking-[0.25em] outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition"
                      required
                    />
                    <p className="text-[11px] text-slate-500 leading-normal">
                      PIN tertera pada kartu atau diberikan oleh penyedia kartu.
                    </p>
                  </div>
                )}

                {/* Error Notification */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Luxurious High-Contrast Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-[13px] font-semibold transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-700" />
                        <span>Menghubungkan...</span>
                      </>
                    ) : (
                      <span>Aktifkan Kartu Sekarang</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Elegant Success State */
            <div className="space-y-5 text-center py-2">
              <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 text-white flex items-center justify-center mx-auto">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <p className="text-base font-medium text-white tracking-[-0.02em]">{businessName}</p>
                <p className="text-[11px] text-slate-500 font-mono tracking-wider">
                  Kartu {displayId} berhasil dihubungkan
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#090b10] border border-white/[0.06] text-[11px] font-mono text-slate-300 break-all select-all">
                {finalCardUrl}
              </div>

              <div className="pt-1 space-y-2">
                <a
                  href={finalCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-semibold transition flex items-center justify-center gap-1.5 active:scale-[0.99]"
                >
                  <span>Coba Buka Tautan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 border border-white/[0.06] transition"
                >
                  {copied ? 'Tautan Tersalin' : 'Salin Tautan'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Editorial Footer */}
        <p className="text-center text-[11px] text-slate-600 font-mono tracking-wide">
          TapLink by Bancroftt ID
        </p>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090e] text-slate-500 flex items-center justify-center text-xs">
          Memuat...
        </div>
      }
    >
      <ActivateContent />
    </Suspense>
  );
}
