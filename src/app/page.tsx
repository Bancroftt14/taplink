'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageCircle, Star } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [cardId, setCardId] = useState('');

  const handleStartActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId.trim()) {
      router.push('/activate');
    } else {
      router.push(`/activate?id=${encodeURIComponent(cardId.trim().toUpperCase())}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070f] text-[#f5f5f7] font-apple-display flex flex-col justify-between p-4 sm:p-6 overflow-hidden pb-[env(safe-area-inset-bottom,1.5rem)]">
      <div className="absolute inset-0 apple-glow-mesh pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2 font-semibold text-white tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/20 border border-white/20">
            T
          </div>
          <span>TapLink</span>
        </div>

        <Link
          href="/admin"
          className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl apple-glass border border-white/10"
        >
          Admin Portal
        </Link>
      </header>

      {/* Hero Center Content */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto text-center space-y-6 py-8">
        {/* Rating Stars Pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full apple-glass border border-white/10 text-amber-400 text-xs shadow-lg">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-slate-300 text-[11px] ml-1 font-medium">Google Review Card</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Tingkatkan Review Bintang 5 Lewat 1 Tap
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Pelanggan cukup menempelkan HP ke kartu NFC, dan halaman ulasan Google Maps langsung terbuka otomatis.
          </p>
        </div>

        {/* Instant Activation Box */}
        <div className="apple-glass-card rounded-[28px] p-5 sm:p-6 shadow-2xl text-left space-y-3.5 border border-white/10">
          <label className="block text-xs font-semibold text-slate-300">
            Sudah Memiliki Kartu Fisik?
          </label>
          <form onSubmit={handleStartActivate} className="flex gap-2">
            <input
              type="text"
              value={cardId}
              onChange={(e) => setCardId(e.target.value.toUpperCase())}
              placeholder="ID Kartu (misal: TAP-001)"
              className="flex-1 apple-glass-input rounded-2xl px-4 py-3 text-base sm:text-xs text-white placeholder-slate-500 uppercase font-mono outline-none transition min-h-[44px]"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 text-white font-semibold text-xs transition flex items-center gap-1.5 active:scale-95 shadow-lg shadow-blue-500/25 border border-white/20 apple-tap-target min-h-[44px]"
            >
              <span>Aktivasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Order Card CTA */}
        <div className="pt-2">
          <a
            href="https://wa.me/6281234567890?text=Halo%20saya%20tertarik%20pesan%20Google%20Tap%20Review%20Card"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Belum punya kartu? Pesan via WhatsApp</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl w-full mx-auto text-center py-4 text-[11px] text-slate-600">
        TapLink by Bancroftt — Google Review Card System
      </footer>
    </div>
  );
}
