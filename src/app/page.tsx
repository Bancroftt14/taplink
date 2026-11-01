'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [cardId, setCardId] = useState('');

  const handleStartActivate = (e: React.FormEvent) => {
    e.preventDefault();
    const id = cardId.trim().toUpperCase();
    if (!id) {
      router.push('/activate');
    } else {
      router.push(`/activate?id=${encodeURIComponent(id)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-tight text-sm">TapLink</span>
          <span className="text-[10px] text-slate-500 font-mono">by Bancroftt</span>
        </div>

        <Link
          href="/admin"
          className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"
        >
          Admin
        </Link>
      </header>

      {/* Hero Center Content */}
      <main className="max-w-md w-full mx-auto my-auto text-center space-y-6 py-12">
        <div className="space-y-2">
          <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
            NFC & QR Review System
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Hubungkan Pelanggan ke Google Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Arahkan pelanggan langsung ke formulir ulasan Google Maps bisnis Anda hanya dengan sekali tap kartu NFC atau scan QR code.
          </p>
        </div>

        {/* Activation Box */}
        <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl p-5 text-left space-y-3 shadow-xl">
          <label className="block text-xs font-medium text-slate-300">
            Aktivasi Kartu Fisik
          </label>
          <form onSubmit={handleStartActivate} className="flex gap-2">
            <input
              type="text"
              value={cardId}
              onChange={(e) => setCardId(e.target.value.toUpperCase())}
              placeholder="Masukkan ID Kartu (contoh: TAP-001)"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 font-mono outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center gap-1.5 active:scale-[0.99] shrink-0"
            >
              <span>Aktivasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="text-[11px] text-slate-500">
            Scan QR di belakang kartu untuk langsung mendeteksi ID secara otomatis.
          </p>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[11px] text-slate-600 border-t border-white/[0.06]">
        TapLink by Bancroftt ID
      </footer>
    </div>
  );
}
