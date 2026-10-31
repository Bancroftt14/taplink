'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

function NotFoundContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || 'UNKNOWN';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Kartu Belum Terdaftar</h1>
          <p className="text-sm text-slate-400">
            Kartu dengan ID <span className="font-mono text-amber-300 font-semibold">{id}</span> belum terdaftar di sistem TapLink.
          </p>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Jika Anda baru saja membeli kartu ini, pastikan ID kartu sudah benar atau hubungi penyedia kartu untuk bantuan aktivasi.
        </p>

        <div className="pt-2 space-y-2.5">
          <a
            href="https://wa.me/6281234567890?text=Halo%20admin%20TapLink,%20kartu%20saya%20belum%20terdaftar"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Hubungi Bantuan WhatsApp</span>
          </a>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CardNotFoundPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Memuat...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
