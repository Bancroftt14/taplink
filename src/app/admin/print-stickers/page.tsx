'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  FileArchive,
  Download,
  Layers,
  Scissors,
  Palette,
  Eye,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Card } from '@/types/card';

type TemplateType = 'aura_blend' | 'quadrant';

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
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [a3Progress, setA3Progress] = useState(0);

  // Template Choices
  const [template, setTemplate] = useState<TemplateType>(
    urlTemplate === 'aura_blend' ? 'aura_blend' : 'quadrant'
  );

  // Print Production Controls
  const [showCropMarks, setShowCropMarks] = useState(true);
  const [highSaturationPrint, setHighSaturationPrint] = useState(true);
  const [fillEmptySlots, setFillEmptySlots] = useState(true);
  const [sheetMultiplier, setSheetMultiplier] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'active'>('all');
  const [activeTab, setActiveTab] = useState<'a3_sheet' | 'single_cards'>('a3_sheet');
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);

  // Pre-rendered Canvas Data URLs (Optimized 380px for butter-smooth mobile 60fps)
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
        console.error('Failed to load cards:', err);
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

  // Generate QR Code data URLs
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

  // Master Canvas Drawer for Single Card
  // targetSize = 1417 for 300 DPI master print; targetSize = 380 for fast 60fps mobile preview
  const drawCardToCanvas = (
    canvas: HTMLCanvasElement,
    card: Card,
    qrDataUrl: string,
    withCropGuides: boolean = false,
    targetSize: number = 1417
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      const size = 1417; // Base master size: 120 mm at 300 DPI
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

        if (template === 'aura_blend') {
          // Liquid Aura Mesh
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

        // Soft specular shadow
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

        // Header Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Line 1: 'Bantu Kami Dengan'
        ctx.fillStyle = '#475569';
        ctx.font = '400 44px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Bantu Kami Dengan', half, 481);

        // Line 2: 'Google Review'
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 96px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Google Review', half, 565);

        // 5 Golden Stars
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

        // Discreet Micro Luxury Watermark
        const serialDisplay = card.id.startsWith('TAP-')
          ? card.id.replace(/^TAP-/i, '')
          : card.id;
        const spacedSerial = serialDisplay.split('').join(' ');
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 15px "Product Sans", "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`B A N C R O F T T  •  ${spacedSerial}`, half, 1252);

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

        // Downscale for preview if targetSize < 1417 (94% GPU memory reduction on mobile)
        if (targetSize && targetSize < size) {
          const previewCanvas = document.createElement('canvas');
          previewCanvas.width = targetSize;
          previewCanvas.height = targetSize;
          const pCtx = previewCanvas.getContext('2d');
          if (pCtx) {
            pCtx.imageSmoothingEnabled = true;
            pCtx.imageSmoothingQuality = 'high';
            pCtx.drawImage(canvas, 0, 0, targetSize, targetSize);
            previewCanvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject('Canvas preview blob failed');
            }, 'image/png');
            return;
          }
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

  // Render on-screen previews at 380px for butter-smooth mobile performance
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
            const blob = await drawCardToCanvas(canvas, card, qrUrl, showCropMarks, 380);
            newUrls[card.id] = URL.createObjectURL(blob);
          } catch (e) {
            console.error('Error rendering preview for', card.id, e);
          }
        }
      }

      if (isMounted) {
        setCardRenderUrls((prev) => {
          // Clean up old object URLs to prevent mobile memory leaks
          Object.values(prev).forEach((url) => {
            try {
              URL.revokeObjectURL(url);
            } catch {}
          });
          return newUrls;
        });
        setRenderingPreviews(false);
      }
    }

    renderAllPreviews();

    return () => {
      isMounted = false;
    };
  }, [
    activeCards.length,
    Object.keys(qrImages).length,
    template,
    showCropMarks,
    highSaturationPrint,
  ]);

  // Master Drawer for Full A3+ Sheet (329 x 486 mm @ 300 DPI = 3886 x 5740 px, 8 Cards Grid)
  const drawA3Sheet = async (sheetCards: Card[]): Promise<Blob> => {
    const canvas = hiddenA3CanvasRef.current;
    if (!canvas) throw new Error('A3 Canvas unavailable');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No context');

    const sheetW = 3886; // 329 mm @ 300 DPI
    const sheetH = 5740; // 486 mm @ 300 DPI
    canvas.width = sheetW;
    canvas.height = sheetH;

    // Clean white printable background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetW, sheetH);

    // Sticker Dimensions (120 mm at 300 DPI = 1417 px)
    const stickerPx = 1417;
    const colGap = 80;
    const totalGridW = stickerPx * 2 + colGap; // 2914 px
    const totalGridH = stickerPx * 4; // 5668 px

    const startX = Math.round((sheetW - totalGridW) / 2);
    const startY = Math.round((sheetH - totalGridH) / 2);

    // Left Margin Technical Metadata
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

    // Color Calibration Swatches
    const swatchColors = [
      '#00ffff',
      '#ff00ff',
      '#ffff00',
      '#000000',
      '#1a73e8',
      '#ea4335',
      '#22c55e',
      '#fbbc04',
    ];
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

      // Render individual sticker at full 1417px 300 DPI master quality
      const cardBlob = await drawCardToCanvas(singleCanvas, card, qrUrl, false, 1417);
      const cardBitmap = await createImageBitmap(cardBlob);

      ctx.drawImage(cardBitmap, x, y, stickerPx, stickerPx);

      // Draw Crop Marks
      const markLen = 35;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;

      const edgeMarkLen = 22;
      if (row === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x, y - 6 - edgeMarkLen);
        ctx.moveTo(x + stickerPx, y - 6);
        ctx.lineTo(x + stickerPx, y - 6 - edgeMarkLen);
        ctx.stroke();
      }

      if (row === 3) {
        ctx.beginPath();
        ctx.moveTo(x, y + stickerPx + 6);
        ctx.lineTo(x, y + stickerPx + 6 + edgeMarkLen);
        ctx.moveTo(x + stickerPx, y + stickerPx + 6);
        ctx.lineTo(x + stickerPx, y + stickerPx + 6 + edgeMarkLen);
        ctx.stroke();
      }

      if (col === 0) {
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x - 10 - markLen, y);
        ctx.moveTo(x - 10, y + stickerPx);
        ctx.lineTo(x - 10 - markLen, y + stickerPx);
        ctx.stroke();
      }

      if (col === 1) {
        ctx.beginPath();
        ctx.moveTo(x + stickerPx + 10, y);
        ctx.lineTo(x + stickerPx + 10 + markLen, y);
        ctx.moveTo(x + stickerPx + 10, y + stickerPx);
        ctx.lineTo(x + stickerPx + 10 + markLen, y + stickerPx);
        ctx.stroke();
      }

      if (col === 0) {
        ctx.beginPath();
        ctx.moveTo(x + stickerPx + colGap / 2, y);
        ctx.lineTo(x + stickerPx + colGap / 2, y + markLen);
        ctx.stroke();
      }

      // Subtle Outer Radius Trim Guideline
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.roundRect(x, y, stickerPx, stickerPx, 82);
      ctx.stroke();
      ctx.restore();

      // Card Metadata Label in Margin
      ctx.fillStyle = '#64748b';
      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

      if (col === 0) {
        ctx.textAlign = 'right';
        ctx.fillText(
          `${card.id} • ${card.business_name || 'Belum Ditautkan'}`,
          startX - 25,
          y + stickerPx / 2 + 8
        );
      } else {
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

  // Intelligent A3+ Sheet Grouping
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
      if (fillEmptySlots) {
        const sheet: Card[] = [];
        let idx = 0;
        while (sheet.length < 8) {
          sheet.push(activeCards[idx % activeCards.length]);
          idx++;
        }
        baseSheets.push(sheet);
      } else {
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

  // Handle Download ALL A3+ Sheets into a single ZIP file
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
      alert('Gagal membuat lembar A3+. Pastikan memori browser mencukupi.');
      console.error(err);
    } finally {
      setDownloadingA3(false);
    }
  };

  // Download all single cards in ZIP (1417 x 1417 px = 300 DPI)
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
          const blob = await drawCardToCanvas(canvas, card, qrUrl, showCropMarks, 1417);
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

  // Download single card at full 300 DPI (1417 x 1417 px)
  const handleDownloadSingleCard = async (card: Card) => {
    const qrUrl = qrImages[card.id];
    if (!qrUrl || !hiddenSingleCanvasRef.current) return;

    setDownloadingCardId(card.id);
    try {
      const blob = await drawCardToCanvas(
        hiddenSingleCanvasRef.current,
        card,
        qrUrl,
        showCropMarks,
        1417
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card.id}_plakat_12x12cm_300dpi.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengunduh kartu.');
      console.error(err);
    } finally {
      setDownloadingCardId(null);
    }
  };

  const copyCardLink = (id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/c/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f4f5f7] pb-24 selection:bg-white selection:text-slate-900">
      {/* Offscreen Canvas Handlers */}
      <canvas ref={hiddenSingleCanvasRef} className="hidden" />
      <canvas ref={hiddenA3CanvasRef} className="hidden" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#07090e]/95 border-b border-white/[0.08] backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Back Button & Title */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push(`/admin?key=${encodeURIComponent(key)}`)}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition"
                title="Kembali ke Dashboard Admin"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-white tracking-tight">
                    Studio Cetak A3+
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                    300 DPI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  120 × 120 mm (R7mm) • 8 stiker per lembar A3+ (3886 × 5740 px)
                </p>
              </div>
            </div>

            {/* Mobile View Tab Toggle */}
            <div className="flex sm:hidden p-0.5 rounded-lg bg-[#090b10] border border-white/[0.08]">
              <button
                onClick={() => setActiveTab('a3_sheet')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  activeTab === 'a3_sheet'
                    ? 'bg-white text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A3+ ({a3Sheets.length})
              </button>
              <button
                onClick={() => setActiveTab('single_cards')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  activeTab === 'single_cards'
                    ? 'bg-white text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Satuan ({activeCards.length})
              </button>
            </div>
          </div>

          {/* Desktop Tab Switcher */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-[#090b10] border border-white/[0.08]">
            <button
              onClick={() => setActiveTab('a3_sheet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'a3_sheet'
                  ? 'bg-white text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lembar A3+ ({a3Sheets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('single_cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'single_cards'
                  ? 'bg-white text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Cetak Satuan ({activeCards.length})</span>
            </button>
          </div>

          {/* Desktop Download Actions */}
          <div className="hidden sm:flex items-center gap-2">
            {activeTab === 'a3_sheet' ? (
              <>
                {a3Sheets.length > 1 && (
                  <button
                    onClick={handleDownloadAllA3Zip}
                    disabled={downloadingAllA3Zip || a3Sheets.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition disabled:opacity-50"
                    title={`Download ${a3Sheets.length} lembar A3+ sekaligus dalam 1 file ZIP`}
                  >
                    {downloadingAllA3Zip ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengemas ZIP ({a3Progress}%)...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-3.5 h-3.5 text-blue-400" />
                        <span>Unduh Semua ZIP ({a3Sheets.length} Lembar)</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => handleDownloadA3Sheet(selectedSheetIndex)}
                  disabled={downloadingA3 || activeCards.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-950 text-xs font-semibold hover:bg-slate-100 transition disabled:opacity-50 shadow-sm"
                  title="Unduh lembar A3+ yang sedang ditampilkan (300 DPI)"
                >
                  {downloadingA3 ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-900" />
                      <span>Merender PNG...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>Unduh Lembar {selectedSheetIndex + 1} (PNG)</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleDownloadZip}
                disabled={downloadingZip || activeCards.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-950 text-xs font-semibold hover:bg-slate-100 transition disabled:opacity-50 shadow-sm"
              >
                {downloadingZip ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-900" />
                    <span>Rendering ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <FileArchive className="w-3.5 h-3.5" />
                    <span>Unduh ZIP Semua (1417px)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-5 space-y-5">
        {/* Production Controls Card */}
        <div className="bg-[#0f121a] rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-3 text-xs">
            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px] whitespace-nowrap">Status:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full sm:w-auto bg-[#090b10] border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30 transition cursor-pointer"
              >
                <option value="all">Semua ({cards.length})</option>
                <option value="unassigned">Belum Aktif</option>
                <option value="active">Sudah Aktif</option>
              </select>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px] whitespace-nowrap">Desain:</span>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as TemplateType)}
                className="w-full sm:w-auto bg-[#090b10] border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30 transition cursor-pointer"
              >
                <option value="quadrant">Solid Kuadran (1:1 Plakat)</option>
                <option value="aura_blend">Google Aura Wave (Gradasi)</option>
              </select>
            </div>

            <div className="h-4 w-px bg-white/[0.08] hidden md:block" />

            {/* Checkbox: Garis Potong */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition py-1">
              <input
                type="checkbox"
                checked={showCropMarks}
                onChange={(e) => setShowCropMarks(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#090b10] border-white/20 text-white focus:ring-0 cursor-pointer accent-white"
              />
              <span className="flex items-center gap-1.5 text-xs">
                <Scissors className="w-3 h-3 text-amber-400" />
                <span>Garis Potong (R7mm)</span>
              </span>
            </label>

            {/* Checkbox: Warna Cetak Tajam */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition py-1">
              <input
                type="checkbox"
                checked={highSaturationPrint}
                onChange={(e) => setHighSaturationPrint(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#090b10] border-white/20 text-white focus:ring-0 cursor-pointer accent-white"
              />
              <span className="flex items-center gap-1.5 text-xs">
                <Palette className="w-3 h-3 text-emerald-400" />
                <span>Warna Cetak Tajam</span>
              </span>
            </label>

            {/* Checkbox: Penuhi 8 Slot */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition py-1">
              <input
                type="checkbox"
                checked={fillEmptySlots}
                onChange={(e) => setFillEmptySlots(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#090b10] border-white/20 text-white focus:ring-0 cursor-pointer accent-white"
              />
              <span className="flex items-center gap-1.5 text-xs">
                <Layers className="w-3 h-3 text-blue-400" />
                <span>Penuhi 8 Slot Lembar</span>
              </span>
            </label>

            {/* Multiplier Lembar */}
            <div className="flex items-center gap-2 bg-[#090b10] px-2.5 py-1 rounded-xl border border-white/[0.08] col-span-full sm:col-auto">
              <span className="text-slate-400 text-[11px] whitespace-nowrap">Jumlah Lembar:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={sheetMultiplier}
                onChange={(e) => setSheetMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 bg-transparent text-center text-xs text-white font-mono font-bold outline-none"
              />
              <span className="text-[11px] text-slate-400 font-mono">
                = {a3Sheets.length * 8} Stiker
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: LEMBAR A3+ (8 STIKER / LEMBAR)                                    */}
        {/* ========================================================================= */}
        {activeTab === 'a3_sheet' && (
          <div className="space-y-4">
            {/* Sheet Selector Pagination */}
            {a3Sheets.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono mr-1 flex-shrink-0">
                  Lembar:
                </span>
                {a3Sheets.map((sheet, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSheetIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${
                      selectedSheetIndex === idx
                        ? 'bg-white text-slate-950 font-semibold shadow-sm'
                        : 'bg-[#0f121a] text-slate-400 hover:text-white border border-white/[0.08]'
                    }`}
                  >
                    Lembar {idx + 1} ({sheet.length})
                  </button>
                ))}
              </div>
            )}

            {/* A3+ Sheet Presentation Stage */}
            <div className="bg-[#0f121a] rounded-2xl p-4 sm:p-6 border border-white/[0.08] shadow-sm space-y-5">
              {/* Sheet Header Info Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Lembar {selectedSheetIndex + 1} dari {a3Sheets.length}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      A3+ (329 × 483 mm)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Susunan cetak 8 stiker (120 × 120 mm) • R7mm
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadA3Sheet(selectedSheetIndex)}
                    disabled={downloadingA3 || !a3Sheets[selectedSheetIndex]?.length}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-950 text-xs font-semibold hover:bg-slate-100 transition disabled:opacity-50 shadow-sm"
                  >
                    {downloadingA3 ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-900" />
                        <span>Merender...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-3.5 h-3.5" />
                        <span>Unduh Lembar Ini (PNG 300 DPI)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Notice if auto-filling empty slots */}
              {fillEmptySlots && activeCards.length < 8 && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                  <span>
                    Database memiliki {activeCards.length} kartu. Slot sisanya diisi salinan otomatis agar 1 lembar A3+ (8 stiker) terisi penuh tanpa membuang kertas.
                  </span>
                </div>
              )}

              {/* 8-Card Grid in A3+ Aspect Ratio */}
              {loading || renderingPreviews ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span className="text-xs">Merender visual stiker...</span>
                </div>
              ) : !a3Sheets[selectedSheetIndex] || a3Sheets[selectedSheetIndex].length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  Tidak ada kartu dalam lembar ini.
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {a3Sheets[selectedSheetIndex].map((card, cardIdx) => {
                      const isAutoFillCopy = cardIdx >= activeCards.length;
                      const previewUrl = cardRenderUrls[card.id];
                      return (
                        <div
                          key={`${card.id}_slot_${cardIdx}`}
                          className="bg-[#090b10] rounded-xl p-2.5 sm:p-3 border border-white/[0.08] space-y-2 hover:border-white/20 transition group"
                        >
                          {/* Slot Badge */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>Slot {cardIdx + 1} / 8</span>
                            {isAutoFillCopy && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 text-[9px] border border-blue-500/25">
                                Salinan Slot {(cardIdx % activeCards.length) + 1}
                              </span>
                            )}
                          </div>

                          {/* Canvas Output Preview */}
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={card.id}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Memuat...
                              </div>
                            )}
                          </div>

                          {/* Card Meta Tag */}
                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <span className="font-mono font-semibold text-white text-[11px]">
                              {card.id}
                            </span>
                            <span className="text-slate-400 text-[10px] truncate max-w-[110px] sm:max-w-[140px]">
                              {card.business_name || 'Belum Ditautkan'}
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {activeCards.map((card) => {
                const previewUrl = cardRenderUrls[card.id];
                const isDownloadingThis = downloadingCardId === card.id;
                const isCopied = copiedId === card.id;

                return (
                  <div
                    key={card.id}
                    className="bg-[#0f121a] rounded-2xl p-4 border border-white/[0.08] space-y-3 hover:border-white/20 transition group"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-white text-sm">
                        {card.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          card.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {card.status === 'active' ? 'Aktif' : 'Belum Ditautkan'}
                      </span>
                    </div>

                    {/* Canvas Output Preview */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-1">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={card.id}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-500 text-xs flex items-center">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Membuat preview...
                        </div>
                      )}
                    </div>

                    {/* Meta info & Action Buttons */}
                    <div className="space-y-2 pt-0.5">
                      <div className="text-[11px] text-slate-400 truncate">
                        Bisnis: <strong className="text-white">{card.business_name || 'Belum diaktivasi'}</strong>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleCard(card)}
                          disabled={isDownloadingThis}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-semibold transition active:scale-[0.99] disabled:opacity-50 shadow-sm"
                        >
                          {isDownloadingThis ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-slate-900" />
                              <span>Proses...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              <span>Unduh 300 DPI</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => copyCardLink(card.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 border border-white/[0.08] transition active:scale-[0.99]"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Link</span>
                            </>
                          )}
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

      {/* Mobile Floating Action Dock */}
      <div className="fixed bottom-4 left-4 right-4 z-40 bg-[#0f121a]/95 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2 sm:hidden pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        <div className="pl-1">
          <span className="text-[10px] font-mono text-slate-400 block">
            {activeTab === 'a3_sheet'
              ? `Lembar ${selectedSheetIndex + 1} / ${a3Sheets.length}`
              : `${activeCards.length} Kartu`}
          </span>
          <span className="text-xs font-semibold text-white">
            {activeTab === 'a3_sheet' ? 'Format A3+ 300 DPI' : 'Stiker Satuan'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === 'a3_sheet' ? (
            <button
              onClick={() => handleDownloadA3Sheet(selectedSheetIndex)}
              disabled={downloadingA3 || !a3Sheets[selectedSheetIndex]?.length}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-950 font-semibold text-xs transition active:scale-[0.99] disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              {downloadingA3 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-900" />
                  <span>Merender...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Unduh PNG</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip || activeCards.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-950 font-semibold text-xs transition active:scale-[0.99] disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              {downloadingZip ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-900" />
                  <span>ZIP ({progress}%)...</span>
                </>
              ) : (
                <>
                  <FileArchive className="w-3.5 h-3.5" />
                  <span>Unduh ZIP</span>
                </>
              )}
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
        <div className="min-h-screen bg-[#07090e] text-slate-400 flex items-center justify-center text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-white" />
          <span>Memuat studio cetak...</span>
        </div>
      }
    >
      <PrintStickersContent />
    </Suspense>
  );
}
