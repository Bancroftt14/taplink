'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Search,
  MapPin,
  CheckCircle2,
  X,
} from 'lucide-react';

interface PlaceResult {
  name: string;
  address: string;
  fullText: string;
  mapsUrl: string;
}

function ActivateContent() {
  const searchParams = useSearchParams();
  const initialId = (searchParams.get('id') || '').toUpperCase();

  const [cardId, setCardId] = useState(initialId);
  const [isEditingId, setIsEditingId] = useState(!initialId);

  // Google Maps / Search state
  const [googleUrl, setGoogleUrl] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Validation state (hijau jika valid)
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [validating, setValidating] = useState(false);

  // PIN security
  const [pin, setPin] = useState('');
  const [requiresPin, setRequiresPin] = useState(false);

  // Form submit state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success state
  const [isActivated, setIsActivated] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [finalCardUrl, setFinalCardUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Typography switch: 'editorial' (Playfair Serif) vs 'modern' (Plus Jakarta Sans)
  const [fontMode, setFontMode] = useState<'editorial' | 'modern'>('editorial');

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle URL change with auto-search or link validation
  const handleUrlInputChange = (value: string) => {
    setGoogleUrl(value);
    setErrorMessage('');

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = value.trim();

    // Check if input is a URL
    const isUrl =
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('maps.app.goo.gl') ||
      trimmed.includes('goo.gl/maps') ||
      trimmed.includes('google.com/maps') ||
      trimmed.includes('search.google.com') ||
      trimmed.includes('g.page');

    if (isUrl) {
      setShowDropdown(false);
      setSearching(false);

      // Fast URL validation
      const looksValid =
        trimmed.includes('goo.gl') ||
        trimmed.includes('google.com') ||
        trimmed.includes('g.page');

      if (looksValid) {
        setIsValidUrl(true);
        // Resolve business name in background
        setValidating(true);
        searchDebounceRef.current = setTimeout(async () => {
          try {
            const res = await fetch('/api/resolve-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: trimmed }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.extractedName && data.extractedName !== 'Google Review') {
                setVerifiedName(data.extractedName);
              }
            }
          } catch {
            // silent
          } finally {
            setValidating(false);
          }
        }, 300);
      } else {
        setIsValidUrl(false);
        setVerifiedName('');
      }
    } else if (trimmed.length >= 2) {
      // User is typing a business name -> Auto search!
      setIsValidUrl(false);
      setVerifiedName('');
      setSearching(true);
      setShowDropdown(true);

      searchDebounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search-places?q=${encodeURIComponent(trimmed)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.results || []);
          }
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 350);
    } else {
      setShowDropdown(false);
      setSearching(false);
      setIsValidUrl(false);
      setVerifiedName('');
    }
  };

  // Select place from auto-search results
  const handleSelectPlace = (place: PlaceResult) => {
    setGoogleUrl(place.mapsUrl);
    setVerifiedName(place.name);
    setIsValidUrl(true);
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Direct Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlInputChange(text.trim());
      }
    } catch {
      // browser permissions fallback
    }
  };

  const handleClearInput = () => {
    setGoogleUrl('');
    setIsValidUrl(false);
    setVerifiedName('');
    setShowDropdown(false);
    setSearchResults([]);
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
      setErrorMessage('Masukkan tautan atau cari tempat Google Maps bisnis Anda.');
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
          businessName: verifiedName,
          pin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal mengaktifkan kartu.');
      } else {
        setIsActivated(true);
        setBusinessName(data.card?.business_name || verifiedName || 'Bisnis Anda');
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

  const rawId = (cardId || initialId || '').trim().toUpperCase();
  const serialOnly = rawId.replace(/^TAP-/i, '');
  const displayBadge = serialOnly ? `BANCROFTT • ${serialOnly}` : 'BANCROFTT';

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f4f5f7] flex flex-col justify-center items-center px-4 py-8 selection:bg-white selection:text-slate-900">
      <div className="w-full max-w-[400px] space-y-5">
        {/* Main Card */}
        <div className="bg-[#0f121a] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] relative">
          {/* Subtle Top Metadata Header */}
          <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-slate-400 font-medium">
                Smart Plaque
              </span>
            </div>

            {/* Micro ID Badge matching the physical card */}
            {initialId && !isEditingId ? (
              <button
                type="button"
                onClick={() => setIsEditingId(true)}
                className="group flex items-center gap-1.5 text-[11px] font-mono text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-md border border-white/[0.06] transition"
                title="Klik untuk ubah ID jika perlu"
              >
                <span className="font-semibold text-slate-200">{displayBadge}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500">No:</span>
                <input
                  type="text"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value.toUpperCase())}
                  placeholder="001"
                  className="w-20 px-2 py-0.5 rounded bg-black/50 border border-white/15 text-[11px] font-mono text-white uppercase outline-none focus:border-white/40 transition"
                  required
                />
              </div>
            )}
          </div>

          {!isActivated ? (
            <div className="space-y-6">
              {/* Title & Subtitle */}
              <div className="space-y-1">
                <h1 className="text-[22px] sm:text-[23px] font-semibold text-white tracking-[-0.03em] leading-snug">
                  Activate Google Review
                </h1>
                <p className="text-[13px] text-slate-400 font-normal leading-relaxed">
                  Hubungkan kartu ini ke Google Maps Anda.
                </p>
              </div>

              <form onSubmit={handleActivate} className="space-y-4 pt-1">
                {/* 1. Google Maps Search & Link Input */}
                <div className="space-y-1.5 relative" ref={dropdownRef}>
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-slate-300 tracking-[-0.01em] flex items-center gap-1.5">
                      <span>Cari Tempat / Tautan</span>
                      {validating && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
                    </label>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={
                          googleUrl.trim()
                            ? `https://www.google.com/maps/search/${encodeURIComponent(googleUrl.trim())}`
                            : 'https://maps.google.com'
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium text-slate-400 hover:text-white transition px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center gap-1"
                        title="Buka Google Maps langsung di browser/aplikasi"
                      >
                        <span>Buka Maps</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                      </a>
                      {googleUrl && (
                        <button
                          type="button"
                          onClick={handleClearInput}
                          className="text-[11px] text-slate-500 hover:text-slate-300 px-1.5 py-0.5 transition"
                        >
                          Hapus
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="text-[11px] font-medium text-slate-200 hover:text-white transition px-2 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1]"
                      >
                        Tempel
                      </button>
                    </div>
                  </div>

                  {/* Input with green indicator when valid */}
                  <div className="relative">
                    <Search className={`w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 transition ${
                      isValidUrl ? 'text-emerald-400' : 'text-slate-500'
                    }`} />

                    <input
                      type="text"
                      value={googleUrl}
                      onChange={(e) => handleUrlInputChange(e.target.value)}
                      onFocus={() => {
                        if (searchResults.length > 0 && !isValidUrl) {
                          setShowDropdown(true);
                        }
                      }}
                      placeholder="Cari nama bisnis atau tempel link..."
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-[13px] text-white placeholder-slate-600 outline-none transition ${
                        isValidUrl
                          ? 'bg-emerald-950/20 border border-emerald-500/70 focus:border-emerald-400 ring-1 ring-emerald-500/30'
                          : 'bg-[#090b10] border border-white/[0.1] focus:border-white/30 focus:ring-1 focus:ring-white/20'
                      }`}
                      required
                      autoFocus
                    />

                    {isValidUrl && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-in zoom-in-75 duration-150">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Valid Green Confirmation Pill */}
                  {isValidUrl && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium animate-in fade-in duration-150">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <div className="flex-1 truncate">
                        <span className="font-semibold text-emerald-300">
                          {verifiedName || 'Tautan Terverifikasi'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Auto-Search Dropdown Results */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-[#121520] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      {searching ? (
                        <div className="p-3.5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Mencari lokasi di Indonesia...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="divide-y divide-white/[0.05]">
                          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-black/30 flex items-center justify-between">
                            <span>Pilih Tempat Usaha</span>
                            <span className="text-[9px] text-emerald-400/80 font-sans">Indonesia</span>
                          </div>
                          {searchResults.map((place, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectPlace(place)}
                              className="w-full text-left p-3 hover:bg-white/[0.06] transition flex items-start gap-2.5 group"
                            >
                              <MapPin className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0 mt-0.5 transition" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition truncate">
                                  {place.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {place.address}
                                </p>
                              </div>
                            </button>
                          ))}

                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(googleUrl.trim())}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full p-2.5 text-center text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 flex items-center justify-center gap-1.5 transition"
                          >
                            <span>Buka pencarian lengkap di Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="p-3.5 text-center space-y-2">
                          <p className="text-xs text-slate-400">
                            Ingin mencari langsung di Google Maps?
                          </p>
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(googleUrl.trim())}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition"
                          >
                            <span>Buka &quot;{googleUrl}&quot; di Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. PIN Input */}
                {requiresPin && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[12px] font-medium text-slate-300 tracking-[-0.01em]">
                      PIN
                    </label>
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
                  </div>
                )}

                {/* Error Notification */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-700" />
                        <span>Menghubungkan...</span>
                      </>
                    ) : (
                      <span>Aktifkan Kartu</span>
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
                <p className="text-base font-semibold text-white tracking-[-0.02em]">{businessName}</p>
                <p className="text-xs text-slate-400">
                  {displayBadge} • Terhubung ke Google Review
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
        <p className="text-center text-[10px] text-slate-600 font-mono tracking-wider uppercase">
          Bancroftt
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
