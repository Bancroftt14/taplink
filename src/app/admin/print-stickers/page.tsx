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
  Download,
  Layers,
  Sliders,
  CheckCircle2,
  Copy,
  ExternalLink,
  Scissors,
  Palette,
  Eye,
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Card } from '@/types/card';

type TemplateType = 'aura_blend' | 'quadrant' | 'curves' | 'dark_glass';

// Authentic NFC & WiFi SVGs
const TOP_WIFI_SIGNAL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" fill="none" stroke="%23111827" stroke-width="3.8" stroke-linecap="round"><path d="M12 14a26 26 0 0 1 36 0"/><path d="M19 21a16 16 0 0 1 22 0"/><path d="M26 28a6 6 0 0 1 8 0"/></svg>`;

function PrintStickersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get('key') || 'bancroftt2026';
  const urlTemplate = searchParams.get('template') as TemplateType;

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingA3, setDownloadingA3] = useState(false);
  const [downloadingAllA3Zip, setDownloadingAllA3Zip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [a3Progress, setA3Progress] = useState(0);

  // Template Choices
  const [template, setTemplate] = useState<TemplateType>(
    urlTemplate === 'quadrant' || urlTemplate === 'curves' || urlTemplate === 'dark_glass'
      ? urlTemplate
      : 'quadrant'
  );

  // Print Production Controls
  const [showCropMarks, setShowCropMarks] = useState(true);
  const [highSaturationPrint, setHighSaturationPrint] = useState(true);
  const [fillEmptySlots, setFillEmptySlots] = useState(true);
  const [sheetMultiplier, setSheetMultiplier] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'active'>('all');
  const [activeTab, setActiveTab] = useState<'a3_sheet' | 'single_cards'>('a3_sheet');
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);

  // Pre-rendered 1:1 Canvas Data URLs for 100% WYSIWYG
  const [cardRenderUrls, setCardRenderUrls] = useState<Record<string, string>>({});
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [renderingPreviews, setRenderingPreviews] = useState(false);

  const hiddenSingleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenA3CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load cards from API
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

  // Generate QR Code data URLs (Tight pixels, ultra-clean)
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

  // Master Canvas Drawer for Single Card (1417 x 1417 px = 12x12 cm @ 300 DPI)
  const drawCardToCanvas = (
    canvas: HTMLCanvasElement,
    card: Card,
    qrDataUrl: string,
    withCropGuides: boolean = false
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
      tapIcon.src = '/new-nfc-tap.png';

      const qrImg = new Image();
      qrImg.src = qrDataUrl;

      let loaded = 0;
      const onAllLoaded = async () => {
        loaded++;
        if (loaded < 3) return;

        if (typeof document !== 'undefined' && document.fonts) {
          try {
            await document.fonts.ready;
          } catch {
            // fallback gracefully
          }
        }

        ctx.clearRect(0, 0, size, size);

        // Optional Color Calibration for Print
        if (highSaturationPrint) {
          // Boost vibrancy slightly so RGB -> CMYK conversion by digital printer stays radiant
          ctx.filter = 'contrast(102%) saturate(106%)';
        } else {
          ctx.filter = 'none';
        }

        // Clip Outer Acrylic Plaque with exact physical laser-cut corner radius (82px = R7mm at 300 DPI)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, 82);
        ctx.clip();

        const half = size / 2; // 708.5 px

        if (template === 'aura_blend' || template === 'quadrant') {
          if (template === 'aura_blend') {
            // Deeply Saturated Liquid Aura Mesh
            ctx.save();
            ctx.filter = 'blur(100px)';
            const pad = 100;
            ctx.fillStyle = '#0d62d9';
            ctx.fillRect(-pad, -pad, half + pad, half + pad);
            ctx.fillStyle = '#e11d11';
            ctx.fillRect(half, -pad, half + pad, half + pad);
            ctx.fillStyle = '#13963e';
            ctx.fillRect(-pad, half, half + pad, half + pad);
            ctx.fillStyle = '#f29900';
            ctx.fillRect(half, half, half + pad, half + pad);
            ctx.restore();
          } else {
            // Classic 4 Vibrant Quadrants (Google Authentic Colors)
            ctx.fillStyle = '#1a73e8';
            ctx.fillRect(0, 0, half, half);
            ctx.fillStyle = '#ea4335';
            ctx.fillRect(half, 0, half, half);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(0, half, half, half);
            ctx.fillStyle = '#fbbc04';
            ctx.fillRect(half, half, half, half);
          }

          // White Center Plaque (Expanded Geometry V2: 1130x992 px)
          const plaqueW = 1130;
          const marginTb = 135;
          const logoSize = 310;
          const logoTop = marginTb;
          const plaqueY = logoTop + logoSize / 2; // 290 px
          const cardBottom = size - marginTb; // 1282 px
          const plaqueH = cardBottom - plaqueY; // 992 px
          const plaqueX = (size - plaqueW) / 2;
          const plaqueRadius = 50;

          // Soft realistic specular shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 12;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, plaqueRadius);
          ctx.fill();
          ctx.restore();

          // 3D Glossy Google Logo
          ctx.drawImage(
            gGlossy,
            half - logoSize / 2,
            logoTop,
            logoSize,
            logoSize
          );

          // Header Text (Calibrated EQUAL GAPS: 20px Uniform Spacing)
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Line 1: 'Bantu Kami Dengan' (Center Y = 481, exact 20px gap below logo bottom 445)
          ctx.fillStyle = '#475569';
          ctx.font = '400 44px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('Bantu Kami Dengan', half, 481);

          // Line 2: 'Google Review' (Center Y = 565, exact 20px gap below line 1)
          ctx.fillStyle = '#0f172a';
          ctx.font = '700 96px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('Google Review', half, 565);

          // 5 Golden Stars (Center Y = 662, exact 20px gap below line 2)
          const starCount = 5;
          const starOuterR = 29;
          const starInnerR = 13.5;
          const starSpacing = 84;
          const startStarX = half - 2 * starSpacing;
          const starY = 662;

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

          // Dual Action Section
          const colOffset = 276;
          const leftCenter = half - colOffset;
          const rightCenter = half + colOffset;
          const actionCenterY = 938;

          // Vertical Center Divider with "ATAU"
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

          ctx.textBaseline = 'alphabetic';

          // NFC Tap Icon (460x250 px)
          const tapWidth = 460;
          const tapHeight = 250;
          ctx.drawImage(
            tapIcon,
            leftCenter - tapWidth / 2,
            actionCenterY - tapHeight / 2,
            tapWidth,
            tapHeight
          );

          // QR Code (425x425 px)
          const qrSize = 425;
          const qrX = rightCenter - qrSize / 2;
          const qrY = actionCenterY - qrSize / 2;
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // Bottom Indonesian Labels
          ctx.fillStyle = '#334155';
          ctx.font = '700 32px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('TEMPELKAN HP KAMU', leftCenter, 1214);
          ctx.fillText('SCAN QR', rightCenter, 1214);

          // Discreet Elegant Card ID Serial Code (Option 2: Bancroftt • 001)
          const serialDisplay = card.id.startsWith('TAP-')
            ? card.id.replace(/^TAP-/i, '')
            : card.id;
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 24px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Bancroftt • ${serialDisplay}`, half, 1250);
        }

        ctx.restore(); // Restore outer clip

        // Draw Cutting Guides / Crop Marks if requested
        if (withCropGuides) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.roundRect(1, 1, size - 2, size - 2, 82);
          ctx.stroke();
          ctx.restore();
        }

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject('Canvas blob failed');
        }, 'image/png');
      };

      gGlossy.onload = onAllLoaded;
      gGlossy.onerror = onAllLoaded;
      tapIcon.onload = onAllLoaded;
      tapIcon.onerror = onAllLoaded;
      qrImg.onload = onAllLoaded;
      qrImg.onerror = onAllLoaded;
    });
  };

  // Re-render WYSIWYG previews whenever cards, QR or template changes
  useEffect(() => {
    if (activeCards.length === 0 || Object.keys(qrImages).length === 0) return;

    let isMounted = true;
    async function renderAllPreviews() {
      setRenderingPreviews(true);
      const canvas = hiddenSingleCanvasRef.current;
      if (!canvas) return;

      const newUrls: Record<string, string> = {};
      for (const card of activeCards) {
        const qrUrl = qrImages[card.id];
        if (qrUrl) {
          try {
            const blob = await drawCardToCanvas(canvas, card, qrUrl, showCropMarks);
            newUrls[card.id] = URL.createObjectURL(blob);
          } catch (e) {
            console.error('Error rendering preview for', card.id, e);
          }
        }
      }

      if (isMounted) {
        setCardRenderUrls(newUrls);
        setRenderingPreviews(false);
      }
    }

    renderAllPreviews();

    return () => {
      isMounted = false;
    };
  }, [activeCards.length, Object.keys(qrImages).length, template, showCropMarks, highSaturationPrint]);

  // Master Drawer for Full A3+ Sheet (329 x 486 mm @ 300 DPI = 3886 x 5740 px, 8 Cards Grid)
  const drawA3Sheet = async (sheetCards: Card[]): Promise<Blob> => {
    const canvas = hiddenA3CanvasRef.current;
    if (!canvas) throw new Error('A3 Canvas unavailable');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No context');

    // Official Super A3 / A3+ dimensions at 300 DPI (329 x 486 mm)
    const sheetW = 3886; // 329 mm
    const sheetH = 5740; // 486 mm (calibrated to fit 4 full 120mm rows + equal top/bottom breathing margin)
    canvas.width = sheetW;
    canvas.height = sheetH;

    // Clean white printable background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetW, sheetH);

    // Sticker Dimensions (120 mm at 300 DPI = 1417 px)
    const stickerPx = 1417;
    const colGap = 80; // 6.8 mm gap between left & right columns
    const rowGap = 0;  // 0 px seamless single-cut between rows (industry standard for A3+ gang sheets)

    const totalGridW = stickerPx * 2 + colGap; // 2914 px
    const totalGridH = stickerPx * 4;          // 5668 px

    // Perfectly Center Grid Horizontally and Vertically
    const startX = Math.round((sheetW - totalGridW) / 2); // 486 px (ample margin on sides)
    const startY = Math.round((sheetH - totalGridH) / 2); // 36 px (balanced top & bottom, zero cutoff!)

    // Left Margin Technical Metadata (Rotated 90° so top space is not wasted!)
    ctx.save();
    ctx.translate(70, sheetH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#64748b';
    ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'TAPLINK PRODUCTION PRINT SHEET • FORMAT A3+ (329 x 486 mm) • 300 DPI • 8 STIKER (12 x 12 cm R7mm)',
      0,
      0
    );
    ctx.restore();

    // Color Calibration Swatches in the Left Margin (CMYK + RGB)
    const swatchColors = ['#00ffff', '#ff00ff', '#ffff00', '#000000', '#1a73e8', '#ea4335', '#22c55e', '#fbbc04'];
    let swatchY = startY + 60;
    for (const c of swatchColors) {
      ctx.fillStyle = c;
      ctx.fillRect(110, swatchY, 28, 28);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(110, swatchY, 28, 28);
      swatchY += 36;
    }

    const singleCanvas = hiddenSingleCanvasRef.current || document.createElement('canvas');

    for (let i = 0; i < Math.min(sheetCards.length, 8); i++) {
      const card = sheetCards[i];
      const qrUrl = qrImages[card.id];
      if (!qrUrl) continue;

      const col = i % 2;
      const row = Math.floor(i / 2);

      const x = startX + col * (stickerPx + colGap);
      const y = startY + row * stickerPx;

      // Render individual sticker
      const cardBlob = await drawCardToCanvas(singleCanvas, card, qrUrl, false);
      const cardBitmap = await createImageBitmap(cardBlob);

      // Draw sticker to A3+ sheet
      ctx.drawImage(cardBitmap, x, y, stickerPx, stickerPx);

      // Draw Crop Marks (Corner L-marks for print cutter)
      const markLen = 35;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;

      // Outer Corner Crop Marks for outer edges
      const edgeMarkLen = 22;
      if (row === 0) {
        // Top edge marks (8px padding from sheet top)
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x, y - 6 - edgeMarkLen);
        ctx.moveTo(x + stickerPx, y - 6);
        ctx.lineTo(x + stickerPx, y - 6 - edgeMarkLen);
        ctx.stroke();
      }

      if (row === 3) {
        // Bottom edge marks (8px padding from sheet bottom)
        ctx.beginPath();
        ctx.moveTo(x, y + stickerPx + 6);
        ctx.lineTo(x, y + stickerPx + 6 + edgeMarkLen);
        ctx.moveTo(x + stickerPx, y + stickerPx + 6);
        ctx.lineTo(x + stickerPx, y + stickerPx + 6 + edgeMarkLen);
        ctx.stroke();
      }

      if (col === 0) {
        // Left side marks
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x - 10 - markLen, y);
        ctx.moveTo(x - 10, y + stickerPx);
        ctx.lineTo(x - 10 - markLen, y + stickerPx);
        ctx.stroke();
      }

      if (col === 1) {
        // Right side marks
        ctx.beginPath();
        ctx.moveTo(x + stickerPx + 10, y);
        ctx.lineTo(x + stickerPx + 10 + markLen, y);
        ctx.moveTo(x + stickerPx + 10, y + stickerPx);
        ctx.lineTo(x + stickerPx + 10 + markLen, y + stickerPx);
        ctx.stroke();
      }

      // Center Column Gap Cut Guideline (between col 0 and col 1)
      if (col === 0) {
        ctx.beginPath();
        ctx.moveTo(x + stickerPx + colGap / 2, y);
        ctx.lineTo(x + stickerPx + colGap / 2, y + markLen);
        ctx.stroke();
      }

      // Subtle Outer Radius Trim Guideline (R7mm = 82px)
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.roundRect(x, y, stickerPx, stickerPx, 82);
      ctx.stroke();
      ctx.restore();

      // Card Metadata Label in Margin (Never collides with sticker!)
      ctx.fillStyle = '#64748b';
      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

      if (col === 0) {
        // Draw in left margin (right aligned)
        ctx.textAlign = 'right';
        ctx.fillText(
          `${card.id} • ${card.business_name || 'Belum Ditautkan'}`,
          startX - 25,
          y + stickerPx / 2 + 8
        );
      } else {
        // Draw in right margin (left aligned)
        ctx.textAlign = 'left';
        ctx.fillText(
          `${card.id} • ${card.business_name || 'Belum Ditautkan'}`,
          startX + totalGridW + 25,
          y + stickerPx / 2 + 8
        );
      }
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject('A3 blob failed');
      }, 'image/png');
    });
  };

  // Intelligent A3+ Sheet Grouping (Auto-fill 8 slots & multi-sheet scaling)
  const a3Sheets: Card[][] = React.useMemo(() => {
    if (activeCards.length === 0) return [];

    const baseSheets: Card[][] = [];

    if (activeCards.length >= 8) {
      for (let i = 0; i < activeCards.length; i += 8) {
        const chunk = activeCards.slice(i, i + 8);
        if (fillEmptySlots && chunk.length < 8) {
          const filled = [...chunk];
          let fillIdx = 0;
          while (filled.length < 8) {
            filled.push(chunk[fillIdx % chunk.length]);
            fillIdx++;
          }
          baseSheets.push(filled);
        } else {
          baseSheets.push(chunk);
        }
      }
    } else {
      // Fewer than 8 cards in database
      if (fillEmptySlots) {
        // Fill all 8 slots by cycling through active cards so paper is not wasted
        const sheet: Card[] = [];
        let idx = 0;
        while (sheet.length < 8) {
          sheet.push(activeCards[idx % activeCards.length]);
          idx++;
        }
        baseSheets.push(sheet);
      } else {
        // Do NOT duplicate: only include actual cards
        baseSheets.push([...activeCards]);
      }
    }

    const count = Math.max(1, sheetMultiplier);
    if (count === 1) return baseSheets;

    const result: Card[][] = [];
    for (let s = 0; s < count; s++) {
      for (const sheet of baseSheets) {
        result.push([...sheet]);
      }
    }
    return result;
  }, [activeCards, sheetMultiplier, fillEmptySlots]);

  // Handle Download ALL A3+ Sheets into a single ZIP file!
  const handleDownloadAllA3Zip = async () => {
    if (a3Sheets.length === 0) return;
    setDownloadingAllA3Zip(true);
    setA3Progress(0);

    try {
      const zip = new JSZip();
      const folderName = `TAPLINK_A3PLUS_PRINT_BATCH_${new Date().toISOString().slice(0, 10)}`;
      const folder = zip.folder(folderName);

      for (let idx = 0; idx < a3Sheets.length; idx++) {
        const sheetCards = a3Sheets[idx];
        const blob = await drawA3Sheet(sheetCards);

        const fileName = `TAPLINK_A3Plus_Lembar_${idx + 1}_dari_${a3Sheets.length}_(${sheetCards.length}_stiker).png`;
        folder?.file(fileName, blob);

        setA3Progress(Math.round(((idx + 1) / a3Sheets.length) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${folderName}_TOTAL_${a3Sheets.length * 8}_STIKER.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Terjadi kesalahan saat mengekspor ZIP Lembar A3+');
      console.error(err);
    } finally {
      setDownloadingAllA3Zip(false);
    }
  };

  // Handle Download Single A3+ Sheet
  const handleDownloadA3Sheet = async (sheetIdx: number) => {
    const sheetCards = a3Sheets[sheetIdx];
    if (!sheetCards || sheetCards.length === 0) return;

    setDownloadingA3(true);
    try {
      const blob = await drawA3Sheet(sheetCards);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TAPLINK_LEMBAR_A3PLUS_SHEET_${sheetIdx + 1}_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal membuat lembar A3+. Pastikan browser mendukung kanvas resolusi tinggi.');
      console.error(err);
    } finally {
      setDownloadingA3(false);
    }
  };

  // Download all single cards in ZIP (1417 x 1417 px)
  const handleDownloadZip = async () => {
    if (activeCards.length === 0 || !hiddenSingleCanvasRef.current) return;
    setDownloadingZip(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const folderName = `plakat_12x12cm_${template}`;
      const folder = zip.folder(folderName);
      const canvas = hiddenSingleCanvasRef.current;

      let done = 0;
      for (const card of activeCards) {
        const qrUrl = qrImages[card.id];
        if (qrUrl) {
          const blob = await drawCardToCanvas(canvas, card, qrUrl, showCropMarks);
          folder?.file(`${card.id}_plakat_12x12cm_300dpi.png`, blob);
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

  return (
    <div className="relative min-h-screen bg-[#05070f] text-slate-100 font-sans pb-16 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 apple-glow-mesh pointer-events-none" />

      {/* Offscreen Canvas Handlers */}
      <canvas ref={hiddenSingleCanvasRef} className="hidden" />
      <canvas ref={hiddenA3CanvasRef} className="hidden" />

      {/* Apple-Style Glass Top Bar */}
      <header className="sticky top-0 z-50 apple-glass-card border-b border-white/10 backdrop-blur-2xl px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Back Button */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => router.push(`/admin?key=${encodeURIComponent(key)}`)}
              className="p-2.5 rounded-2xl apple-glass hover:bg-white/10 text-slate-300 transition active:scale-95"
              title="Kembali ke Dashboard Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Studio Cetak Plakat & Stiker</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] font-bold">
                  A3+ 300 DPI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Ukuran 120 x 120 mm (R7mm) • 1 Lembar A3+ Isi 8 Stiker Pas Presisi
              </p>
            </div>
          </div>

          {/* Quick Tabs: A3+ Sheet vs Satuan */}
          <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('a3_sheet')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition apple-tap-target ${
                activeTab === 'a3_sheet'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lembar A3+ ({a3Sheets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('single_cards')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition apple-tap-target ${
                activeTab === 'single_cards'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Cetak Satuan ({activeCards.length})</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Template Selector */}
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as TemplateType)}
              className="apple-glass-input rounded-xl px-3 py-2 text-xs text-white font-medium outline-none cursor-pointer border border-white/15 apple-tap-target w-full sm:w-auto"
            >
              <option value="quadrant">Solid Kuadran (1:1 Plakat)</option>
              <option value="aura_blend">Google Aura Wave (Gradasi)</option>
            </select>

            {/* Quick ZIP / A3 Download */}
            {activeTab === 'a3_sheet' ? (
              <div className="flex items-center gap-2">
                {a3Sheets.length > 1 && (
                  <button
                    onClick={handleDownloadAllA3Zip}
                    disabled={downloadingAllA3Zip || a3Sheets.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 border border-white/20 transition active:scale-95 disabled:opacity-50"
                    title={`Download ${a3Sheets.length} lembar A3+ sekaligus dalam 1 file ZIP`}
                  >
                    {downloadingAllA3Zip ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>ZIP ({a3Progress}%)...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-3.5 h-3.5" />
                        <span>Unduh Semua ({a3Sheets.length} Lembar .ZIP)</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => handleDownloadA3Sheet(selectedSheetIndex)}
                  disabled={downloadingA3 || activeCards.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl apple-glass hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition active:scale-95 disabled:opacity-50"
                  title="Unduh lembar A3+ yang sedang ditampilkan"
                >
                  {downloadingA3 ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Rendering...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Lembar {selectedSheetIndex + 1} (PNG)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleDownloadZip}
                disabled={downloadingZip || activeCards.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-white/10 transition active:scale-95 disabled:opacity-50"
              >
                {downloadingZip ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <FileArchive className="w-3.5 h-3.5 text-blue-400" />
                    <span>Unduh ZIP Semua (1417px)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Apple Control Bar / Options Pill */}
        <div className="apple-glass rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 shadow-lg">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Filter */}
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-500">Filter:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="apple-glass-input rounded-xl px-2.5 py-1 text-xs text-white outline-none"
              >
                <option value="all">Semua ({cards.length})</option>
                <option value="unassigned">Belum Aktif</option>
                <option value="active">Sudah Aktif</option>
              </select>
            </div>

            {/* Toggle Garis Potong */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition">
              <input
                type="checkbox"
                checked={showCropMarks}
                onChange={(e) => setShowCropMarks(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Scissors className="w-3 h-3 text-amber-400" />
                <span>Garis Potong Percetakan (R7mm)</span>
              </span>
            </label>

            {/* Toggle Saturasi Warna Tajam */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition">
              <input
                type="checkbox"
                checked={highSaturationPrint}
                onChange={(e) => setHighSaturationPrint(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3 text-emerald-400" />
                <span>Warna Cetak Tajam (CMYK Richness)</span>
              </span>
            </label>

            {/* Toggle Isi Penuh 8 Slot */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition">
              <input
                type="checkbox"
                checked={fillEmptySlots}
                onChange={(e) => setFillEmptySlots(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-400" />
                <span>Penuhi 8 Slot per Lembar</span>
              </span>
            </label>

            {/* Atur Jumlah Lembar Cetak (Repeat Multiplier) */}
            <div className="flex items-center gap-2 text-slate-300 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
              <span className="text-slate-400 text-[11px]">Jumlah Lembar:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={sheetMultiplier}
                onChange={(e) => setSheetMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 apple-glass-input text-center rounded-lg py-0.5 text-xs text-white font-bold outline-none"
              />
              <span className="text-[11px] text-blue-400 font-semibold font-mono">
                = {a3Sheets.length * 8} Stiker
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% WYSIWYG • Pixel-Perfect Canvas</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: LEMBAR A3+ (8 STIKER / LEMBAR)                                    */}
        {/* ========================================================================= */}
        {activeTab === 'a3_sheet' && (
          <div className="space-y-6">
            {/* Sheet Selector Pagination */}
            {a3Sheets.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400">Pilih Lembar:</span>
                {a3Sheets.map((sheet, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSheetIndex(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      selectedSheetIndex === idx
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'apple-glass text-slate-400 hover:text-white'
                    }`}
                  >
                    Lembar {idx + 1} ({sheet.length} kartu)
                  </button>
                ))}
              </div>
            )}

            {/* A3+ Sheet Presentation Stage */}
            <div className="apple-glass-card rounded-[32px] p-6 sm:p-10 border border-white/10 shadow-2xl space-y-6">
              {/* Sheet Header Info Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[11px] font-bold">
                      A3+ KERTAS (329 × 483 mm)
                    </span>
                    <span className="text-xs text-slate-400">
                      Lembar {selectedSheetIndex + 1} dari {a3Sheets.length}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    Preview Susunan Cetak (8 Stiker @ 12 × 12 cm)
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleDownloadAllA3Zip}
                    disabled={downloadingAllA3Zip || a3Sheets.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-xl shadow-blue-600/30 border border-white/20 transition active:scale-95 disabled:opacity-50"
                  >
                    {downloadingAllA3Zip ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengemas ZIP ({a3Progress}%)...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-4 h-4" />
                        <span>Unduh Semua ({a3Sheets.length} Lembar = {a3Sheets.length * 8} Stiker .ZIP)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadA3Sheet(selectedSheetIndex)}
                    disabled={downloadingA3 || !a3Sheets[selectedSheetIndex]?.length}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl apple-glass hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition active:scale-95 disabled:opacity-50"
                  >
                    {downloadingA3 ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Merender...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4 text-blue-400" />
                        <span>Unduh Lembar {selectedSheetIndex + 1} Saja (PNG)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 8-Card Grid in A3+ Aspect Ratio */}
              {loading || renderingPreviews ? (
                <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Merender kanvas resolusi tinggi...</span>
                </div>
              ) : !a3Sheets[selectedSheetIndex] || a3Sheets[selectedSheetIndex].length === 0 ? (
                <div className="py-24 text-center text-slate-500">
                  Tidak ada kartu dalam lembar ini.
                </div>
              ) : (
                <div className="max-w-4xl mx-auto bg-slate-900/90 rounded-[28px] p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
                  {/* Auto-Fill Notice if cards are fewer than 8 */}
                  {fillEmptySlots && activeCards.length < 8 && (
                    <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>
                          Database memiliki <strong>{activeCards.length} kartu</strong>. Slot sisanya diisi salinan otomatis agar 1 lembar A3+ (8 stiker) terisi penuh tanpa membuang kertas.
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        (Uncheck &apos;Penuhi 8 Slot&apos; jika ingin kartu asli saja)
                      </span>
                    </div>
                  )}

                  {/* Grid 2 Columns x 4 Rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 justify-center">
                    {a3Sheets[selectedSheetIndex].map((card, cardIdx) => {
                      const isAutoFillCopy = cardIdx >= activeCards.length;
                      const previewUrl = cardRenderUrls[card.id];
                      return (
                        <div
                          key={`${card.id}_slot_${cardIdx}`}
                          className="apple-glass rounded-[24px] p-3.5 border border-white/10 shadow-lg space-y-3 group hover:border-blue-500/40 transition relative"
                        >
                          {/* Slot Badge */}
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                            <span className="font-semibold text-slate-300">Slot {cardIdx + 1} dari 8</span>
                            {isAutoFillCopy && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                                Salinan Slot {(cardIdx % activeCards.length) + 1}
                              </span>
                            )}
                          </div>

                          {/* 1:1 Actual Canvas Output Image */}
                          <div className="relative aspect-square w-full rounded-[18px] overflow-hidden bg-black/40 shadow-inner flex items-center justify-center">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={card.id}
                                className="w-full h-full object-contain drop-shadow-md group-hover:scale-[1.01] transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                                <RefreshCw className="w-4 h-4 animate-spin text-blue-400 mr-2" />
                                Memuat visual...
                              </div>
                            )}
                          </div>

                          {/* Card Meta Tag */}
                          <div className="flex items-center justify-between text-xs px-1">
                            <div>
                              <span className="font-mono font-bold text-blue-400">{card.id}</span>
                              <span className="text-slate-400 block text-[11px] truncate max-w-[150px]">
                                {card.business_name || 'Belum Ditautkan'}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                card.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {card.status === 'active' ? 'Aktif' : 'Belum'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CETAK SATUAN (12 x 12 CM)                                         */}
        {/* ========================================================================= */}
        {activeTab === 'single_cards' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {activeCards.map((card) => {
                const previewUrl = cardRenderUrls[card.id];
                return (
                  <div
                    key={card.id}
                    className="apple-glass-card rounded-[28px] p-4 sm:p-5 border border-white/10 shadow-xl space-y-4 hover:border-white/25 transition group"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-400 text-sm">
                        {card.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          card.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {card.status === 'active' ? 'Aktif' : 'Belum Ditautkan'}
                      </span>
                    </div>

                    {/* Exact 1:1 Canvas Projection */}
                    <div className="relative aspect-square w-full rounded-[20px] overflow-hidden bg-black/40 shadow-inner flex items-center justify-center p-1">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={card.id}
                          className="w-full h-full object-contain rounded-[18px] drop-shadow-md group-hover:scale-[1.01] transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-slate-500 text-xs flex items-center">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-400 mr-2" />
                          Membuat kanvas...
                        </div>
                      )}
                    </div>

                    {/* Meta info & direct download button */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] text-slate-400 truncate">
                        Bisnis: <strong className="text-white">{card.business_name || 'Belum diaktivasi'}</strong>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={previewUrl}
                          download={`${card.id}_plakat_12x12cm.png`}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl apple-glass hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>Unduh PNG</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            const origin = window.location.origin;
                            navigator.clipboard.writeText(`${origin}/c/${card.id}`);
                            alert(`Link ${card.id} disalin!`);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl apple-glass hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Sticky Bar for Instant Download */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-[#05070f]/95 backdrop-blur-2xl border-t border-white/10 sm:hidden pb-[env(safe-area-inset-bottom,0.75rem)] shadow-2xl">
        <div className="flex items-center gap-2">
          {activeTab === 'a3_sheet' ? (
            <>
              {a3Sheets.length > 1 ? (
                <button
                  onClick={handleDownloadAllA3Zip}
                  disabled={downloadingAllA3Zip}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 min-h-[48px]"
                >
                  <FileArchive className="w-4 h-4" />
                  <span>{downloadingAllA3Zip ? `ZIP (${a3Progress}%)...` : `Unduh Semua ZIP (${a3Sheets.length} Lembar)`}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleDownloadA3Sheet(selectedSheetIndex)}
                  disabled={downloadingA3}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 min-h-[48px]"
                >
                  <Printer className="w-4 h-4" />
                  <span>{downloadingA3 ? 'Merender...' : 'Unduh Lembar A3+ (300 DPI)'}</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 min-h-[48px]"
            >
              <FileArchive className="w-4 h-4" />
              <span>{downloadingZip ? `ZIP (${progress}%)...` : 'Unduh ZIP Semua Kartu'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrintStickersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070f] text-slate-400 flex items-center justify-center text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Memuat studio cetak...</span>
        </div>
      }
    >
      <PrintStickersContent />
    </Suspense>
  );
}
