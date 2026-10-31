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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6">
      {/* Top Navbar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2 font-bold text-white tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs text-white">
            T
          </div>
          <span>TapLink</span>
        </div>

        <Link
          href="/admin"
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          Admin Portal
        </Link>
      </header>

      {/* Hero Center Content */}
      <main className="max-w-md w-full mx-auto my-auto text-center space-y-6 py-10">
        {/* Rating Stars */}
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span className="text-slate-400 text-[11px] ml-1 font-sans">Google Review Card</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Tingkatkan Review Bintang 5 Lewat 1 Tap
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Pelanggan cukup menempelkan HP ke kartu NFC, dan halaman ulasan Google Maps langsung terbuka otomatis.
          </p>
        </div>

        {/* Instant Activation Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl text-left space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Sudah Memiliki Kartu Fisik?
          </label>
          <form onSubmit={handleStartActivate} className="flex gap-2">
            <input
              type="text"
              value={cardId}
              onChange={(e) => setCardId(e.target.value.toUpperCase())}
              placeholder="ID Kartu (misal: TAP-001)"
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 uppercase font-mono outline-none transition"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-1.5 active:scale-[0.98]"
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
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[11px] text-slate-600">
        © 2026 TapLink • bancrovtt.web.id
      </footer>
    </div>
  );
}
