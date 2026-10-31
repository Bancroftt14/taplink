'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

function SuspendedContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Kartu Ditangguhkan</h1>
          <p className="text-sm text-slate-400">
            Kartu <span className="font-mono text-rose-300 font-semibold">{id}</span> sedang dinonaktifkan sementara oleh sistem atau pemilik.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <a
            href="https://wa.me/6281234567890?text=Halo%20admin%20TapLink,%20kartu%20saya%20tertulis%20ditangguhkan"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Hubungi Customer Service</span>
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

export default function CardSuspendedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Memuat...</div>}>
      <SuspendedContent />
    </Suspense>
  );
}
