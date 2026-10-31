'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  RefreshCw,
  FileArchive,
  Star,
  Info,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Card } from '@/types/card';

// 1:1 Authentic Tap to Review SVG Icon matching physical plaque (NFC Oval, Radiating Wave Arcs, Hand Holding Phone)
const LUXURY_TAP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 85" fill="none"><rect x="3" y="30" width="35" height="25" rx="12.5" stroke="%231e293b" stroke-width="2.6" fill="%23ffffff"/><text x="20.5" y="46.5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="8.8" font-weight="900" fill="%231e293b" text-anchor="middle" letter-spacing="0.5">NFC</text><path d="M43 38 a9 9 0 0 1 0 10" stroke="%231e293b" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M48 33 a16 16 0 0 1 0 19" stroke="%231e293b" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M53 28 a23 23 0 0 1 0 28" stroke="%231e293b" stroke-width="2.6" stroke-linecap="round" fill="none"/><rect x="59" y="10" width="28" height="52" rx="4.5" stroke="%231e293b" stroke-width="2.6" fill="%23ffffff"/><line x1="69" y1="14" x2="77" y2="14" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/><path d="M55 38 c-3 0 -5 2 -5 5 v6 c0 3 2 5 5 5 h4 v-16 h-4 z" fill="%23ffffff" stroke="%231e293b" stroke-width="2.6" stroke-linejoin="round"/><path d="M87 27 c3.5 0 5.5 1.5 5.5 3.5 s-2 3.5-5.5 3.5" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round" fill="%23ffffff"/><path d="M87 34 c3.5 0 5.5 1.5 5.5 3.5 s-2 3.5-5.5 3.5" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round" fill="%23ffffff"/><path d="M87 41 c3.5 0 5.5 1.5 5.5 3.5 s-2 3.5-5.5 3.5" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round" fill="%23ffffff"/><path d="M87 48 c3.5 0 5.5 1.5 5.5 3.5 s-2 3.5-5.5 3.5" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round" fill="%23ffffff"/><path d="M92.5 50 c1 4 4 10 9 15" stroke="%231e293b" stroke-width="2.6" stroke-linecap="round"/><path d="M78 62 c3 6 8 13 13 18" stroke="%231e293b" stroke-width="2.6" stroke-linecap="round"/><path d="M90 80 l12 -8" stroke="%231e293b" stroke-width="2.6" stroke-linecap="round"/></svg>`;

const LUXURY_TAP_SVG_DARK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 85" fill="none"><rect x="3" y="30" width="35" height="25" rx="12.5" stroke="%23f8fafc" stroke-width="2.6" fill="%230f172a"/><text x="20.5" y="46.5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="8.8" font-weight="900" fill="%2360a5fa" text-anchor="middle" letter-spacing="0.5">NFC</text><path d="M43 38 a9 9 0 0 1 0 10" stroke="%2360a5fa" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M48 33 a16 16 0 0 1 0 19" stroke="%2360a5fa" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M53 28 a23 23 0 0 1 0 28" stroke="%2360a5fa" stroke-width="2.6" stroke-linecap="round" fill="none"/><rect x="59" y="10" width="28" height="52" rx="4.5" stroke="%23f8fafc" stroke-width="2.6" fill="%230f172a"/><line x1="69" y1="14" x2="77" y2="14" stroke="%23f8fafc" stroke-width="2" stroke-linecap="round"/><path d="M55 38 c-3 0 -5 2 -5 5 v6 c0 3 2 5 5 5 h4 v-16 h-4 z" fill="%230f172a" stroke="%23f8fafc" stroke-width="2.6" stroke-linejoin="round"/><path d="M87 27 c3.5 0 5.5 1.5 5.5 3.5 s-2 3.5-5.5 3.5" stroke="%23f8fafc" stroke-width="2.5" stroke-linecap="round" fill="%230f172a"/><path d="M87 34 c3.5 0 5.5 1.5 5.5 3.5 s-2 3.5-5.5 3.5" stroke="%23f8fafc" stroke-width="2.5" stroke-linecap="round" fill="%230f172a"/><path d="M87 41 c3.5 0 5.5 1.5 5.5 3.5 s-2 3.5-5.5 3.5" stroke="%23f8fafc" stroke-width="2.5" stroke-linecap="round" fill="%230f172a"/><path d="M87 48 c3.5 0 5.5 1.5 5.5 3.5 s-2 3.5-5.5 3.5" stroke="%23f8fafc" stroke-width="2.5" stroke-linecap="round" fill="%230f172a"/><path d="M92.5 50 c1 4 4 10 9 15" stroke="%23f8fafc" stroke-width="2.6" stroke-linecap="round"/><path d="M78 62 c3 6 8 13 13 18" stroke="%23f8fafc" stroke-width="2.6" stroke-linecap="round"/><path d="M90 80 l12 -8" stroke="%23f8fafc" stroke-width="2.6" stroke-linecap="round"/></svg>`;

// Top Contactless / WiFi Signal Icon for Organic Curves Template
const TOP_WIFI_SIGNAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" fill="none" stroke="%23111827" stroke-width="3.8" stroke-linecap="round"><path d="M12 14a26 26 0 0 1 36 0"/><path d="M19 21a16 16 0 0 1 22 0"/><path d="M26 28a6 6 0 0 1 8 0"/></svg>`;

type TemplateType = 'aura_blend' | 'quadrant' | 'curves' | 'dark_glass';

function PrintStickersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get('key') || 'bancroftt2026';
  const urlTemplate = searchParams.get('template') as TemplateType;

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [progress, setProgress] = useState(0);

  // Template Choices (Default to 'aura_blend' which has the smooth, premium blended background)
  const [template, setTemplate] = useState<TemplateType>(
    urlTemplate === 'quadrant' || urlTemplate === 'curves' || urlTemplate === 'dark_glass'
      ? urlTemplate
      : 'aura_blend'
  );
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'active'>('all');
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function loadCards() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/cards?key=${encodeURIComponent(key)}`);
        const data = await res.json();
        if (data.cards) {
          setCards(data.cards);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, [key]);

  const activeCards = cards.filter((c) => {
    if (filterType === 'unassigned') return c.status === 'unassigned';
    if (filterType === 'active') return c.status === 'active';
    return true;
  });

  // Generate QR Code data URLs (Clean, no margin, tight pixels)
  useEffect(() => {
    if (activeCards.length === 0) return;

    let isMounted = true;
    async function generateQRs() {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://taplink.bancrovtt.web.id';

      const map: Record<string, string> = {};
      for (const card of activeCards) {
        const tapUrl = `${origin}/c/${card.id}`;
        try {
          const url = await QRCode.toDataURL(tapUrl, {
            width: 700,
            margin: 0,
            color: {
              dark: '#111827',
              light: '#ffffff',
            },
          });
          map[card.id] = url;
        } catch (e) {
          console.error(e);
        }
      }
      if (isMounted) {
        setQrImages(map);
      }
    }
    generateQRs();

    return () => {
      isMounted = false;
    };
  }, [activeCards.length, filterType]);

  // High-Resolution 300 DPI Canvas Drawer for 12x12 cm (1417 x 1417 px)
  // Perfectly blended background, luxury tap icon, rounded brackets, identical tile dimensions
  const drawPvcToCanvas = (
    canvas: HTMLCanvasElement,
    card: Card,
    qrDataUrl: string
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      const size = 1417; // 120 mm at 300 DPI
      canvas.width = size;
      canvas.height = size;

      const gGlossy = new Image();
      gGlossy.src = '/google-logo-glossy.webp';

      const tapIcon = new Image();
      tapIcon.src = (template === 'aura_blend' || template === 'quadrant')
        ? '/new-nfc-tap.png'
        : (template === 'dark_glass' ? LUXURY_TAP_SVG_DARK : LUXURY_TAP_SVG);

      const topWifi = new Image();
      topWifi.src = TOP_WIFI_SIGNAL_SVG;

      const qrImg = new Image();
      qrImg.src = qrDataUrl;

      let loaded = 0;
      const onAllLoaded = async () => {
        loaded++;
        if (loaded < 4) return;

        if (typeof document !== 'undefined' && document.fonts) {
          try {
            await document.fonts.ready;
          } catch {
            // fallback gracefully
          }
        }

        ctx.clearRect(0, 0, size, size);

        // Clip Outer Acrylic Plaque with exact physical laser-cut corner radius (82px = R7mm at 300 DPI, chosen variant)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, 82);
        ctx.clip();

        const half = size / 2; // 708.5 px

        if (template === 'aura_blend' || template === 'quadrant') {
          // ========================================================
          // TEMPLATE: GOOGLE AURA BLEND / ACRYLIC PLAQUE
          // Smooth fluid chromatic blend + 5 Stars + Equal Tile Sizes
          // ========================================================

          if (template === 'aura_blend') {
            // 1. Deeply Saturated Liquid Aura Mesh (100% Pekat, Zero White Fade)
            ctx.save();
            ctx.filter = 'blur(100px)';

            const pad = 100;
            // Top-Left: Deep Vibrant Cobalt Blue
            ctx.fillStyle = '#0d62d9';
            ctx.fillRect(-pad, -pad, half + pad, half + pad);

            // Top-Right: Deep Vivid Crimson Red
            ctx.fillStyle = '#e11d11';
            ctx.fillRect(half, -pad, half + pad, half + pad);

            // Bottom-Left: Deep Emerald Green
            ctx.fillStyle = '#13963e';
            ctx.fillRect(-pad, half, half + pad, half + pad);

            // Bottom-Right: Deep Warm Golden Amber
            ctx.fillStyle = '#f29900';
            ctx.fillRect(half, half, half + pad, half + pad);

            ctx.restore();
          } else {
            // Classic 4 Vibrant Quadrants (Sharp, bright, radiant)
            ctx.fillStyle = '#1a73e8';
            ctx.fillRect(0, 0, half, half);
            ctx.fillStyle = '#ea4335';
            ctx.fillRect(half, 0, half, half);
            ctx.fillStyle = '#22c55e'; // Bright lime-emerald green!
            ctx.fillRect(0, half, half, half);
            ctx.fillStyle = '#fbbc04'; // Bright golden yellow!
            ctx.fillRect(half, half, half, half);
          }

          // 2. White Center Plaque (Expanded Geometry V2: 1130x992 px)
          // Mathematical Rule: Top Background (Above Logo) == Bottom Background (Below Card) = 135px
          // Side margins: (1417 - 1130) / 2 = 143.5px (clean, uniform frame all around!)
          const plaqueW = 1130;
          const marginTb = 135;
          const logoSize = 310;
          const logoTop = marginTb; // 135 px
          const plaqueY = logoTop + logoSize / 2; // 290 px (aligned with logo center)
          const cardBottom = size - marginTb; // 1282 px (exactly 135px bottom margin!)
          const plaqueH = cardBottom - plaqueY; // 992 px
          const plaqueX = (size - plaqueW) / 2; // 143.5 px
          const plaqueRadius = 50; // Exact matching R4.2mm radius (proportional to R7mm outer acrylic)

          const circleCenterX = half;
          const circleCenterY = plaqueY;

          // Soft realistic acrylic specular shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 12;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, plaqueRadius);
          ctx.fill();
          ctx.restore();

          // 3. User's 3D Glossy Google Logo (Exact 1:1 scale: 310px, 21.9% of plaque)
          // Anchored with top at exactly Y = 135px
          ctx.drawImage(
            gGlossy,
            circleCenterX - logoSize / 2,
            logoTop,
            logoSize,
            logoSize
          );

          // 4. Header: Indonesian Text 1:1 with Physical Plaque (Zero Overlap with Logo)
          ctx.textAlign = 'center';

          // Line 1: 'Bantu Kami Dengan' (Y = 485, clean 40px gap below logo bottom 445)
          ctx.fillStyle = '#475569';
          ctx.font = '400 48px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('Bantu Kami Dengan', half, 485);

          // Line 2: 'Google Review' (Bold 700, authentic Google Product Sans, wide & proportional)
          ctx.fillStyle = '#0f172a';
          ctx.font = '700 104px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('Google Review', half, 560);

          // 5 Golden Stars (Enlarged proportionally: starOuterR = 33, solid Google Gold #FFB800 + outline #E5A100, span = 418px)
          const starCount = 5;
          const starOuterR = 33;
          const starInnerR = 15;
          const starSpacing = 88;
          const startStarX = half - 2 * starSpacing;
          const starY = 656; // Calibrated: shifted down 14px for perfect vertical rhythm (38px above, 36.5px below)

          ctx.fillStyle = '#FFB800';
          ctx.strokeStyle = '#E5A100';
          ctx.lineWidth = 2.5;

          for (let s = 0; s < starCount; s++) {
            const sx = startStarX + s * starSpacing;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? starOuterR : starInnerR;
              const angle = -Math.PI / 2 + i * (Math.PI / 5);
              const px = sx + r * Math.cos(angle);
              const py = starY + r * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          // 5. Dual Action Section (Extra Large & Dominant: QR 425x425, Tap 435x313)
          const colOffset = 276;
          const leftCenter = half - colOffset; // 432.5 px
          const rightCenter = half + colOffset; // 984.5 px
          const actionCenterY = 938;

          // --- Symmetrical Vertical Center Divider with "ATAU" ---
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(half, actionCenterY - 85);
          ctx.lineTo(half, actionCenterY - 24);
          ctx.stroke();

          ctx.fillStyle = '#94a3b8';
          ctx.font = '700 26px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ATAU', half, actionCenterY);

          ctx.beginPath();
          ctx.moveTo(half, actionCenterY + 24);
          ctx.lineTo(half, actionCenterY + 85);
          ctx.stroke();

          // Reset textBaseline for labels
          ctx.textBaseline = 'alphabetic';

          // --- LEFT: NEW USER-CHOSEN NFC TAP ICON (460x250 px, pure solid black, balanced with QR 425 px) ---
          const tapWidth = 460;
          const tapHeight = 250;
          ctx.drawImage(
            tapIcon,
            leftCenter - tapWidth / 2,
            actionCenterY - tapHeight / 2,
            tapWidth,
            tapHeight
          );

          // --- RIGHT: EXTRA LARGE CLEAN QR CODE (425x425 px, ~30.0% of plaque) ---
          const qrSize = 425;
          const qrX = rightCenter - qrSize / 2;
          const qrY = actionCenterY - qrSize / 2;
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // --- Bottom Indonesian Labels (1:1 with Physical Plaque, balanced padding) ---
          ctx.fillStyle = '#334155';
          ctx.font = '700 32px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('TEMPELKAN HP KAMU', leftCenter, 1214);
          ctx.fillText('SCAN QR', rightCenter, 1214);

        } else if (template === 'curves') {
          // ==========================================
          // TEMPLATE 2: ORGANIC 4-CORNER CURVES
          // (Restrained 18% corner accents)
          // ==========================================
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);

          const cornerBound = 0.18;
          ctx.fillStyle = '#34a853';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(size * cornerBound, 0);
          ctx.bezierCurveTo(size * (cornerBound * 0.72), size * (cornerBound * 0.22), size * (cornerBound * 0.22), size * (cornerBound * 0.72), 0, size * cornerBound);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fbbc04';
          ctx.beginPath();
          ctx.moveTo(size, 0);
          ctx.lineTo(size * (1 - cornerBound), 0);
          ctx.bezierCurveTo(size * (1 - cornerBound * 0.72), size * (cornerBound * 0.22), size * (1 - cornerBound * 0.22), size * (cornerBound * 0.72), size, size * cornerBound);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#1a73e8';
          ctx.beginPath();
          ctx.moveTo(0, size);
          ctx.lineTo(0, size * (1 - cornerBound));
          ctx.bezierCurveTo(size * (cornerBound * 0.22), size * (1 - cornerBound * 0.72), size * (cornerBound * 0.72), size * (1 - cornerBound * 0.22), size * cornerBound, size);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ea4335';
          ctx.beginPath();
          ctx.moveTo(size, size);
          ctx.lineTo(size, size * (1 - cornerBound));
          ctx.bezierCurveTo(size * (1 - cornerBound * 0.22), size * (1 - cornerBound * 0.72), size * (1 - cornerBound * 0.72), size * (1 - cornerBound * 0.22), size * (1 - cornerBound), size);
          ctx.closePath();
          ctx.fill();

          const wifiW = 80;
          const wifiH = 50;
          ctx.drawImage(topWifi, half - wifiW / 2, 120, wifiW, wifiH);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#111827';
          ctx.font = '800 48px -apple-system, BlinkMacSystemFont, "Google Sans", sans-serif';
          ctx.fillText('TAP OR SCAN', half, 220);

          const prefix = 'review us on ';
          ctx.font = '500 38px -apple-system, BlinkMacSystemFont, "Google Sans", sans-serif';
          const prefixW = ctx.measureText(prefix).width;

          const gLetters = [
            { c: 'G', color: '#4285f4' },
            { c: 'o', color: '#ea4335' },
            { c: 'o', color: '#fbbc05' },
            { c: 'g', color: '#4285f4' },
            { c: 'l', color: '#34a853' },
            { c: 'e', color: '#ea4335' },
          ];

          ctx.font = '700 38px -apple-system, BlinkMacSystemFont, "Google Sans", sans-serif';
          let gLettersW = 0;
          for (const l of gLetters) {
            gLettersW += ctx.measureText(l.c).width;
          }

          const totalHeaderW = prefixW + gLettersW;
          let startX = half - totalHeaderW / 2;

          ctx.textAlign = 'left';
          ctx.fillStyle = '#5f6368';
          ctx.font = '500 38px -apple-system, BlinkMacSystemFont, "Google Sans", sans-serif';
          ctx.fillText(prefix, startX, 275);
          startX += prefixW;

          ctx.font = '700 38px -apple-system, BlinkMacSystemFont, "Google Sans", sans-serif';
          for (const l of gLetters) {
            ctx.fillStyle = l.color;
            ctx.fillText(l.c, startX, 275);
            startX += ctx.measureText(l.c).width;
          }

          const logoSize = 240;
          ctx.drawImage(
            gGlossy,
            half - logoSize / 2,
            320,
            logoSize,
            logoSize
          );

          // Dual Action Tiles
          const colOffset = 240;
          const leftCenter = half - colOffset;
          const rightCenter = half + colOffset;
          const tileW = 230;
          const tileH = 230;
          const tileY = 610;
          const tileRadius = 26;
          const tileCenterY = tileY + tileH / 2;

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(half, 620);
          ctx.lineTo(half, tileCenterY - 30);
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#64748b';
          ctx.font = '700 28px sans-serif';
          ctx.fillText('or', half, tileCenterY + 10);

          ctx.beginPath();
          ctx.moveTo(half, tileCenterY + 30);
          ctx.lineTo(half, tileY + tileH - 10);
          ctx.stroke();

          // Left Tile
          const leftTileX = leftCenter - tileW / 2;
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(leftTileX, tileY, tileW, tileH, tileRadius);
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.stroke();

          const tapImgSize = 185;
          ctx.drawImage(
            tapIcon,
            leftCenter - tapImgSize / 2,
            tileCenterY - tapImgSize / 2,
            tapImgSize,
            tapImgSize
          );

          // Right Tile
          const rightTileX = rightCenter - tileW / 2;
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(rightTileX, tileY, tileW, tileH, tileRadius);
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.stroke();

          const qrSize = 155;
          const qrX = rightCenter - qrSize / 2;
          const qrY = tileCenterY - qrSize / 2;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 6);
          ctx.fill();
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          const bLen = 20;
          const bOff = 12;
          const bRad = 5;
          ctx.strokeStyle = '#111827';
          ctx.lineWidth = 2.6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(qrX - bOff, qrY - bOff + bLen);
          ctx.arcTo(qrX - bOff, qrY - bOff, qrX - bOff + bLen, qrY - bOff, bRad);
          ctx.lineTo(qrX - bOff + bLen, qrY - bOff);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(qrX + qrSize + bOff - bLen, qrY - bOff);
          ctx.arcTo(qrX + qrSize + bOff, qrY - bOff, qrX + qrSize + bOff, qrY - bOff + bLen, bRad);
          ctx.lineTo(qrX + qrSize + bOff, qrY - bOff + bLen);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(qrX - bOff, qrY + qrSize + bOff - bLen);
          ctx.arcTo(qrX - bOff, qrY + qrSize + bOff, qrX - bOff + bLen, qrY + qrSize + bOff, bRad);
          ctx.lineTo(qrX - bOff + bLen, qrY + qrSize + bOff);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(qrX + qrSize + bOff - bLen, qrY + qrSize + bOff);
          ctx.arcTo(qrX + qrSize + bOff, qrY + qrSize + bOff, qrX + qrSize + bOff, qrY + qrSize + bOff - bLen, bRad);
          ctx.lineTo(qrX + qrSize + bOff, qrY + qrSize + bOff - bLen);
          ctx.stroke();

          ctx.fillStyle = '#1a73e8';
          ctx.font = '800 42px -apple-system, BlinkMacSystemFont, "Google Sans", sans-serif';
          ctx.fillText('Tap to Review', leftCenter, 895);
          ctx.fillText('Scan to Review', rightCenter, 895);

          // 5 Golden Stars at Bottom (Google Gold #FBBC04)
          ctx.fillStyle = '#FBBC04';
          ctx.font = '50px sans-serif';
          ctx.fillText('★ ★ ★ ★ ★', half, 990);

        } else if (template === 'dark_glass') {
          // ==========================================
          // TEMPLATE 3: LUXURY DARK GLASSMORPHISM
          // ==========================================
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, size, size);

          const radBlue = ctx.createRadialGradient(260, 260, 40, 260, 260, 680);
          radBlue.addColorStop(0, 'rgba(66, 133, 244, 0.45)');
          radBlue.addColorStop(1, 'rgba(66, 133, 244, 0)');
          ctx.fillStyle = radBlue;
          ctx.fillRect(0, 0, size, size);

          const radRed = ctx.createRadialGradient(size - 260, 260, 40, size - 260, 260, 680);
          radRed.addColorStop(0, 'rgba(234, 67, 53, 0.45)');
          radRed.addColorStop(1, 'rgba(234, 67, 53, 0)');
          ctx.fillStyle = radRed;
          ctx.fillRect(0, 0, size, size);

          const radGreen = ctx.createRadialGradient(260, size - 260, 40, 260, size - 260, 680);
          radGreen.addColorStop(0, 'rgba(52, 168, 83, 0.45)');
          radGreen.addColorStop(1, 'rgba(52, 168, 83, 0)');
          ctx.fillStyle = radGreen;
          ctx.fillRect(0, 0, size, size);

          const radYellow = ctx.createRadialGradient(size - 260, size - 260, 40, size - 260, size - 260, 680);
          radYellow.addColorStop(0, 'rgba(251, 188, 5, 0.45)');
          radYellow.addColorStop(1, 'rgba(251, 188, 5, 0)');
          ctx.fillStyle = radYellow;
          ctx.fillRect(0, 0, size, size);

          const margin = 95;
          const plaqueSize = size - margin * 2;
          const radius = 95;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(margin, margin, plaqueSize, plaqueSize, radius);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          const emblemSize = 270;
          ctx.drawImage(gGlossy, half - emblemSize / 2, margin + 40, emblemSize, emblemSize);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#f8fafc';
          ctx.font = '800 78px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
          ctx.fillText('Review on Google', half, margin + emblemSize + 85);

          ctx.fillStyle = '#f59e0b';
          ctx.font = '48px sans-serif';
          ctx.fillText('★ ★ ★ ★ ★', half, margin + emblemSize + 150);

          const dockY = 745;
          const dockW = 1040;
          const dockH = 490;
          const dockX = (size - dockW) / 2;

          ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
          ctx.beginPath();
          ctx.roundRect(dockX, dockY, dockW, dockH, 45);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(half, dockY + 70);
          ctx.lineTo(half, dockY + dockH / 2 - 35);
          ctx.stroke();

          ctx.fillStyle = '#94a3b8';
          ctx.font = '700 32px sans-serif';
          ctx.fillText('OR', half, dockY + dockH / 2 + 10);

          ctx.beginPath();
          ctx.moveTo(half, dockY + dockH / 2 + 45);
          ctx.lineTo(half, dockY + dockH - 70);
          ctx.stroke();

          const leftCenter = dockX + dockW / 4;
          const tapImgSize = 220;
          ctx.drawImage(tapIcon, leftCenter - tapImgSize / 2, dockY + 65, tapImgSize, tapImgSize);

          ctx.fillStyle = '#60a5fa';
          ctx.font = '800 44px sans-serif';
          ctx.fillText('Tap to Review', leftCenter, dockY + 395);

          const rightCenter = dockX + (dockW * 3) / 4;
          const qrSize = 210;
          const qrX = rightCenter - qrSize / 2;
          const qrY = dockY + 70;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
          ctx.fill();
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          const bLen = 22;
          const bOff = 16;
          const bRad = 6;
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 2.8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(qrX - bOff, qrY - bOff + bLen);
          ctx.arcTo(qrX - bOff, qrY - bOff, qrX - bOff + bLen, qrY - bOff, bRad);
          ctx.lineTo(qrX - bOff + bLen, qrY - bOff);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(qrX + qrSize + bOff - bLen, qrY - bOff);
          ctx.arcTo(qrX + qrSize + bOff, qrY - bOff, qrX + qrSize + bOff, qrY - bOff + bLen, bRad);
          ctx.lineTo(qrX + qrSize + bOff, qrY - bOff + bLen);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(qrX - bOff, qrY + qrSize + bOff - bLen);
          ctx.arcTo(qrX - bOff, qrY + qrSize + bOff, qrX - bOff + bLen, qrY + qrSize + bOff, bRad);
          ctx.lineTo(qrX - bOff + bLen, qrY + qrSize + bOff);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(qrX + qrSize + bOff - bLen, qrY + qrSize + bOff);
          ctx.arcTo(qrX + qrSize + bOff, qrY + qrSize + bOff, qrX + qrSize + bOff, qrY + qrSize + bOff - bLen, bRad);
          ctx.lineTo(qrX + qrSize + bOff, qrY + qrSize + bOff - bLen);
          ctx.stroke();

          ctx.fillStyle = '#60a5fa';
          ctx.font = '800 44px sans-serif';
          ctx.fillText('Scan to Review', rightCenter, dockY + 395);
        }

        ctx.restore();

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject('Canvas toBlob failed');
        }, 'image/png');
      };

      gGlossy.onload = onAllLoaded;
      tapIcon.onload = onAllLoaded;
      topWifi.onload = onAllLoaded;
      qrImg.onload = onAllLoaded;

      gGlossy.onerror = reject;
      tapIcon.onerror = reject;
      topWifi.onerror = reject;
      qrImg.onerror = reject;
    });
  };

  // Download all cards as fully designed 12x12 cm ZIP (300 DPI)
  const handleDownloadZip = async () => {
    if (activeCards.length === 0 || !hiddenCanvasRef.current) return;
    setDownloadingZip(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const folderName = `plakat_pvc_12x12cm_${template}`;
      const folder = zip.folder(folderName);
      const canvas = hiddenCanvasRef.current;

      let done = 0;
      for (const card of activeCards) {
        const qrUrl = qrImages[card.id];
        if (qrUrl) {
          const blob = await drawPvcToCanvas(canvas, card, qrUrl);
          folder?.file(`${card.id}_pvc_12x12cm_300dpi.png`, blob);
        }
        done++;
        setProgress(Math.round((done / activeCards.length) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${folderName}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Terjadi kesalahan saat membuat file ZIP.');
      console.error(err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black">
      {/* Offscreen high-res canvas (1417 x 1417 px) */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Control Bar (Hidden on Print) */}
      <div className="print:hidden border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 p-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/admin?key=${encodeURIComponent(key)}`)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Kembali ke Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Desain Plakat PVC 12 x 12 cm</span>
              </h1>
              <p className="text-xs text-slate-400">
                120x120 mm • Sudut Radius 12 mm • Presisi, Bintang 5 & Aura Blend
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="all">Semua Kartu ({cards.length})</option>
              <option value="unassigned">Belum Aktif</option>
              <option value="active">Sudah Aktif</option>
            </select>

            {/* Template Selector */}
            <div className="relative">
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as TemplateType)}
                className="bg-slate-950 border border-blue-500 text-xs text-blue-300 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="aura_blend">
                  ✨ Google Aura Blend (Halus, Ngblend & Elegan) ⭐ REKOMENDASI
                </option>
                <option value="quadrant">
                  ⭐ Plakat Akrilik 4-Warna Klasik (Solid Kuadran)
                </option>
                <option value="curves">
                  🎨 Plakat Minimalis 4-Sudut Lengkung (Desain Putih Bersih)
                </option>
                <option value="dark_glass">
                  🌙 Luxury Dark Glassmorphism (Hitam Akrilik Neon)
                </option>
              </select>
            </div>

            {/* Download ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip || activeCards.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition disabled:opacity-50"
              title="Download file gambar PNG resolusi 1417x1417 px untuk percetakan"
            >
              <FileArchive className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {downloadingZip
                  ? `Rendering (${progress}%)...`
                  : 'Unduh ZIP (1417x1417 px HD)'}
              </span>
            </button>

            {/* Print Sheet A4 */}
            <button
              onClick={handlePrint}
              disabled={activeCards.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-lg shadow-blue-600/25 active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Lembar A4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Print Preview Area */}
      <div className="max-w-5xl mx-auto p-4 sm:p-8 print:p-0 print:m-0 print:w-full print:max-w-none">
        {loading ? (
          <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            <span>Memuat data kartu...</span>
          </div>
        ) : activeCards.length === 0 ? (
          <div className="py-24 text-center text-slate-500">
            Tidak ada kartu yang dipilih.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Indicator */}
            <div className="print:hidden p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>
                  {template === 'aura_blend' && (
                    <>
                      <strong>Model Google Aura Blend:</strong> Gradasi warna Google yang menyatu lembut (ngblend), 5 bintang emas, ikon Tap modern berkelas, tile sama persis ukurannya, dan sudut radius kamera scanner.
                    </>
                  )}
                  {template === 'quadrant' && (
                    <>
                      <strong>Model Akrilik 4-Warna Klasik:</strong> 4 bidang kuadran warna solid dengan kartu putih timbul, 5 bintang emas, dan dual CTA sejajar.
                    </>
                  )}
                  {template === 'curves' && (
                    <>
                      <strong>Model Minimalis 4-Sudut Lengkung:</strong> Desain putih bersih dengan 4 aksen sudut Google tipis, logo 3D besar di tengah, dan 5 bintang emas di bawah.
                    </>
                  )}
                  {template === 'dark_glass' && (
                    <>
                      <strong>Model Luxury Dark Glassmorphism:</strong> Varian hitam akrilik elegan dengan aura neon Google.
                    </>
                  )}
                </span>
              </div>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-400 flex-shrink-0">
                120 x 120 mm • 300 DPI
              </span>
            </div>

            {/* Cards Grid Sheet (Optimized for 12x12 cm visual preview & print) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6 justify-center">
              {activeCards.map((card) => {
                const qrUrl = qrImages[card.id];

                // -------------------------------------------------------------
                // RENDER TEMPLATE 1 & 2: AURA BLEND / ACRYLIC PLAQUE
                // -------------------------------------------------------------
                if (template === 'aura_blend' || template === 'quadrant') {
                  const isBlend = template === 'aura_blend';
                  return (
                    <div
                      key={card.id}
                      className="relative w-full max-w-[400px] mx-auto aspect-square rounded-[24px] sm:rounded-[26px] overflow-hidden shadow-2xl transition print:shadow-none print:border-gray-300 print:break-inside-avoid select-none bg-white border border-slate-800/10 flex items-center justify-center"
                    >
                      {/* Background: Either Smooth Deep Liquid Aura Blend or Classic Solid Quadrants */}
                      {isBlend ? (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute -inset-4 grid grid-cols-2 grid-rows-2 filter blur-2xl scale-125">
                            <div className="bg-[#0d62d9]"></div>
                            <div className="bg-[#e11d11]"></div>
                            <div className="bg-[#13963e]"></div>
                            <div className="bg-[#f29900]"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                          <div className="bg-[#1a73e8]"></div>
                          <div className="bg-[#ea4335]"></div>
                          <div className="bg-[#22c55e]"></div>
                          <div className="bg-[#fbbc04]"></div>
                        </div>
                      )}

                      {/* White Center Plaque (Expanded Geometry V2: 80% width, 70% height, balanced 135px uniform margin) */}
                      <div className="relative w-[80%] h-[70%] bg-white rounded-[16px] sm:rounded-[18px] shadow-2xl flex flex-col justify-between items-center px-3 sm:px-4 pt-0 pb-2 text-slate-900 border border-black/5 translate-y-5 sm:translate-y-6">
                        {/* 3D Glossy Google Logo directly floating on top (Anchored so top acrylic margin == bottom acrylic margin) */}
                        <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center pointer-events-none drop-shadow-md">
                          <img
                            src="/google-logo-glossy.webp"
                            alt="Google"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Title: 1:1 Indonesian Physical Plaque Typography */}
                        <div className="text-center mt-10 sm:mt-11 space-y-0.5">
                          <div
                            className="text-[12px] sm:text-[13px] font-normal text-slate-600 tracking-normal"
                            style={{ fontFamily: '"Product Sans", "Google Sans", sans-serif' }}
                          >
                            Bantu Kami Dengan
                          </div>
                          <div
                            className="text-[24px] sm:text-[27px] font-bold text-slate-900 tracking-[-0.01em] leading-tight"
                            style={{ fontFamily: '"Product Sans", "Google Sans", sans-serif' }}
                          >
                            Google Review
                          </div>
                          {/* 5 Golden Stars: BOLD, BESAR & PROPORSIONAL (Calibrated down to match starY = 656) */}
                          <div className="flex items-center justify-center gap-1.5 pt-2 sm:pt-2.5">
                            <Star className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-[#FFB800] text-[#E5A100]" />
                            <Star className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-[#FFB800] text-[#E5A100]" />
                            <Star className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-[#FFB800] text-[#E5A100]" />
                            <Star className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-[#FFB800] text-[#E5A100]" />
                            <Star className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-[#FFB800] text-[#E5A100]" />
                          </div>
                        </div>

                        {/* Dual Action Dock (Symmetric, 1:1 Matching Physical Product, Balanced Spacing) */}
                        <div className="w-full grid grid-cols-2 items-center relative my-auto py-0.5">
                          {/* Vertical Center Divider with short ticks and 'ATAU' */}
                          <div className="absolute left-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center -translate-x-1/2 pointer-events-none">
                            <div className="w-px h-4 sm:h-5 bg-slate-200"></div>
                            <span className="py-0.5 text-[8px] sm:text-[9px] font-bold tracking-wider text-slate-400 select-none">
                              ATAU
                            </span>
                            <div className="w-px h-4 sm:h-5 bg-slate-200"></div>
                          </div>

                          {/* Left Column: Tap (Extra Large Authentic NFC Tap Icon + Indonesian Label) */}
                          <div className="flex flex-col items-center text-center">
                            <div className="w-30 h-18 sm:w-34 sm:h-20 flex items-center justify-center p-0.5">
                              <img
                                src="/new-nfc-tap.png"
                                alt="Tempelkan HP Kamu"
                                className="w-full h-full object-contain drop-shadow-xs"
                              />
                            </div>

                            <div className="h-4 flex items-center justify-center mt-0.5">
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-700 tracking-wide uppercase">
                                TEMPELKAN HP KAMU
                              </span>
                            </div>
                          </div>

                          {/* Right Column: Scan (Extra Large Clean QR Code + Indonesian Label) */}
                          <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative p-0.5">
                              {qrUrl ? (
                                <img
                                  src={qrUrl}
                                  alt="QR Code"
                                  className="w-full h-full rounded-xs object-contain"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 rounded-xs animate-pulse" />
                              )}
                            </div>

                            <div className="h-4 flex items-center justify-center mt-0.5">
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-700 tracking-wide uppercase">
                                SCAN QR
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="h-0.5"></div>
                      </div>
                    </div>
                  );
                }

                // -------------------------------------------------------------
                // RENDER TEMPLATE 2: ORGANIC 4-CORNER CURVES
                // -------------------------------------------------------------
                if (template === 'curves') {
                  return (
                    <div
                      key={card.id}
                      className="relative w-full max-w-[400px] mx-auto aspect-square rounded-[38px] overflow-hidden shadow-2xl transition print:shadow-none print:border-gray-300 print:break-inside-avoid select-none bg-white p-6 flex flex-col justify-between items-center text-slate-900 border border-slate-200"
                    >
                      {/* 4 Organic Fluid Corner Petals (Subtle 18% boundary) */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 0 L18 0 C13 4 4 13 0 18 Z" fill="#34a853" />
                        <path d="M100 0 L82 0 C87 4 96 13 100 18 Z" fill="#fbbc04" />
                        <path d="M0 100 L0 82 C4 87 13 96 18 100 Z" fill="#1a73e8" />
                        <path d="M100 100 L100 82 C96 87 87 96 82 100 Z" fill="#ea4335" />
                      </svg>

                      {/* 1. Top Section */}
                      <div className="relative text-center pt-1 space-y-0.5">
                        <img
                          src={TOP_WIFI_SIGNAL_SVG}
                          alt="NFC"
                          className="w-7 h-4 mx-auto object-contain"
                        />
                        <div className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                          TAP OR SCAN
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-600">
                          review us on{' '}
                          <span className="font-bold text-[#4285f4]">G</span>
                          <span className="font-bold text-[#ea4335]">o</span>
                          <span className="font-bold text-[#fbbc05]">o</span>
                          <span className="font-bold text-[#4285f4]">g</span>
                          <span className="font-bold text-[#34a853]">l</span>
                          <span className="font-bold text-[#ea4335]">e</span>
                        </div>
                      </div>

                      {/* 2. Middle Section: Big 3D Glossy Google G */}
                      <div className="relative my-auto flex justify-center py-0.5">
                        <img
                          src="/google-logo-glossy.webp"
                          alt="Google"
                          className="w-18 h-18 sm:w-22 sm:h-22 object-contain drop-shadow-md"
                        />
                      </div>

                      {/* 3. Bottom Dual Action (Equal Dimensions & Rounded Brackets) */}
                      <div className="relative w-[88%] mx-auto grid grid-cols-2 items-center px-1 py-1">
                        <div className="absolute left-1/2 top-1 bottom-1 flex flex-col items-center justify-between -translate-x-1/2 pointer-events-none">
                          <div className="w-px h-full bg-slate-200"></div>
                          <span className="px-1 text-[9px] font-bold text-slate-400 bg-white">
                            or
                          </span>
                          <div className="w-px h-full bg-slate-200"></div>
                        </div>

                        {/* Left Column: Tap */}
                        <div className="flex flex-col items-center text-center pr-2">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-[16px] bg-slate-50 border border-slate-200/80 shadow-sm flex items-center justify-center p-1.5 my-0.5">
                            <img
                              src={LUXURY_TAP_SVG}
                              alt="Tap Icon"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="h-5 flex items-center justify-center mt-0.5">
                            <span className="text-xs sm:text-sm font-black text-[#1a73e8]">
                              Tap to Review
                            </span>
                          </div>
                        </div>

                        {/* Right Column: Scan */}
                        <div className="flex flex-col items-center text-center pl-2">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-[16px] bg-slate-50 border border-slate-200/80 shadow-sm flex items-center justify-center relative p-1.5 my-0.5">
                            {/* Rounded brackets (Sleek hairline framing) */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none p-1"
                              viewBox="0 0 100 100"
                              fill="none"
                            >
                              <path
                                d="M14 26 V18 A5 5 0 0 1 19 13 H27"
                                stroke="#111827"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M86 26 V18 A5 5 0 0 0 81 13 H73"
                                stroke="#111827"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M14 74 V82 A5 5 0 0 0 19 87 H27"
                                stroke="#111827"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M86 74 V82 A5 5 0 0 1 81 87 H73"
                                stroke="#111827"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>

                            <div className="bg-white p-0.5 rounded-sm">
                              {qrUrl ? (
                                <img
                                  src={qrUrl}
                                  alt="QR"
                                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-slate-100 animate-pulse"></div>
                              )}
                            </div>
                          </div>
                          <div className="h-5 flex items-center justify-center mt-0.5">
                            <span className="text-xs sm:text-sm font-black text-[#1a73e8]">
                              Scan to Review
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Bottom Stars (Google Gold #FBBC04) */}
                      <div className="relative flex items-center justify-center gap-1.5 text-sm pb-1">
                        <Star className="w-4 h-4 fill-[#FBBC04] text-[#FBBC04]" />
                        <Star className="w-4 h-4 fill-[#FBBC04] text-[#FBBC04]" />
                        <Star className="w-4 h-4 fill-[#FBBC04] text-[#FBBC04]" />
                        <Star className="w-4 h-4 fill-[#FBBC04] text-[#FBBC04]" />
                        <Star className="w-4 h-4 fill-[#FBBC04] text-[#FBBC04]" />
                      </div>
                    </div>
                  );
                }

                // -------------------------------------------------------------
                // RENDER TEMPLATE 3: LUXURY DARK GLASSMORPHISM
                // -------------------------------------------------------------
                return (
                  <div
                    key={card.id}
                    className="relative w-full max-w-[400px] mx-auto aspect-square rounded-[38px] p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition print:shadow-none print:border-gray-300 print:break-inside-avoid select-none bg-[#090d16] text-white"
                  >
                    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
                      <div className="absolute -top-12 -left-12 w-52 h-52 rounded-full blur-3xl bg-[#4285F4]/40"></div>
                      <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full blur-3xl bg-[#EA4335]/40"></div>
                      <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full blur-3xl bg-[#34A853]/40"></div>
                      <div className="absolute -bottom-12 -right-12 w-52 h-52 rounded-full blur-3xl bg-[#FBBC05]/40"></div>
                    </div>

                    <div className="w-full h-full rounded-[28px] p-5 flex flex-col justify-between backdrop-blur-xl border border-white/15 bg-slate-900/80 shadow-2xl relative">
                      <div className="text-center pt-1 space-y-1">
                        <img
                          src="/google-logo-glossy.webp"
                          alt="Google"
                          className="w-18 h-18 sm:w-20 sm:h-20 mx-auto object-contain drop-shadow-lg"
                        />
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          Review on Google
                        </div>
                        <div className="flex items-center justify-center gap-1 text-amber-400 text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </div>
                      </div>

                      {/* Dock */}
                      <div className="rounded-[22px] p-3.5 grid grid-cols-2 items-center relative my-auto border border-white/10 bg-slate-950/45">
                        <div className="absolute left-1/2 top-3 bottom-3 flex flex-col items-center justify-between -translate-x-1/2 pointer-events-none">
                          <div className="w-px h-full bg-white/15"></div>
                          <span className="px-1 text-[9px] font-bold tracking-wider rounded bg-slate-900 text-slate-400">
                            OR
                          </span>
                          <div className="w-px h-full bg-white/15"></div>
                        </div>

                        {/* Left */}
                        <div className="flex flex-col items-center text-center pr-2 space-y-1">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-[16px] bg-slate-800 border border-white/10 flex items-center justify-center p-1.5">
                            <img
                              src={LUXURY_TAP_SVG_DARK}
                              alt="Tap Icon"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="text-xs sm:text-sm font-black text-blue-400">
                            Tap to Review
                          </div>
                        </div>

                        {/* Right */}
                        <div className="flex flex-col items-center text-center pl-2 space-y-1">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-[16px] bg-slate-800 border border-white/10 flex items-center justify-center relative p-1.5">
                            <div className="bg-white p-0.5 rounded-sm">
                              {qrUrl ? (
                                <img
                                  src={qrUrl}
                                  alt="QR"
                                  className="w-11 h-11 sm:w-12 sm:h-12 object-contain"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-800 animate-pulse"></div>
                              )}
                            </div>
                          </div>

                          <div className="text-xs sm:text-sm font-black text-blue-400">
                            Scan to Review
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Print CSS optimization for 12x12 cm sheets */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintStickersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">
          Memuat halaman cetak...
        </div>
      }
    >
      <PrintStickersContent />
    </Suspense>
  );
}
