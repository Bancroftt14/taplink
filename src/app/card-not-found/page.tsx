'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function NotFoundContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || 'UNKNOWN';

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-[#11131a] border border-white/[0.08] rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-base font-semibold text-white">Kartu Tidak Ditemukan</h1>
          <p className="text-xs text-slate-400">
            ID <span className="font-mono text-amber-300 font-semibold">{id}</span> belum terdaftar di sistem.
          </p>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Pastikan ID kartu yang Anda masukkan sesuai dengan kode seri yang tertera pada kartu atau stiker fisik.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs transition"
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
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-slate-500 flex items-center justify-center text-xs">Memuat...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
