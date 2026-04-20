'use client';

import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Download,
  MessageCircle,
  Link2,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  productPrice: string;          // formatted, e.g. "$2.499.000"
  productImage: string;
  productUrl: string;            // absolute URL
  discount: number;              // 0 if none
  category: string;
}

export default function ShareModal({
  open,
  onClose,
  productName,
  productPrice,
  productImage,
  productUrl,
  discount,
  category,
}: ShareModalProps) {
  const [copied, setCopied] = useState<'link' | 'text' | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Build OG image URL (relative — same origin)
  const ogParams = new URLSearchParams({
    name:     productName,
    price:    productPrice,
    image:    productImage,
    discount: String(discount),
    category,
  });
  const ogUrl = `/api/og?${ogParams.toString()}`;

  // Generate QR locally with qrcode library (no external API needed)
  useEffect(() => {
    if (!open || !productUrl) return;
    QRCode.toDataURL(productUrl, {
      width: 128,
      margin: 1,
      color: { dark: '#1d4ed8', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [open, productUrl]);

  const copyText = `🛍️ *${productName}*\n💰 Precio: ${productPrice}${discount > 0 ? ` (-${discount}%)` : ''}\n🚚 Envío gratis a todo Colombia\n\n🔗 ${productUrl}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(productUrl);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopied('text');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tecnophone-${productName.slice(0, 40).replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // silently ignore
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(copyText);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-extrabold text-gray-900">Compartir producto</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-100 transition-colors text-surface-500"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* ===== SHARE CARD PREVIEW ===== */}
          <div ref={cardRef} className="rounded-2xl overflow-hidden border border-surface-200 shadow-sm">
            <div className="bg-gradient-to-br from-[#172554] to-[#2563eb] p-4 flex items-center gap-4">
              {/* Product image */}
              <div className="relative w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                {productImage ? (
                  <Image src={productImage} alt={productName} fill className="object-contain p-1" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📱</div>
                )}
                {discount > 0 && (
                  <div className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
                    -{discount}%
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">TecnoPhone{category ? ` · ${category}` : ''}</div>
                <p className="text-sm font-extrabold leading-tight line-clamp-2 mb-2">{productName}</p>
                <p className="text-xl font-black tracking-tight">{productPrice}</p>
              </div>

              {/* QR */}
                <div className="flex-shrink-0 bg-white rounded-xl p-1.5 shadow-lg w-[68px] h-[68px] flex items-center justify-center">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="QR" width={56} height={56} className="block" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-surface-100 animate-pulse" />
                  )}
              </div>
            </div>

            {/* Footer strip */}
            <div className="bg-[#1e3a8a] px-4 py-2 flex items-center gap-4 text-[11px] text-white/70">
              <span>🚚 Envío gratis</span>
              <span>🔒 Pago seguro</span>
              <span>✅ Garantía 1 año</span>
              <span className="ml-auto font-semibold text-white/50">tecnophone.co</span>
            </div>
          </div>

          {/* ===== COPY TEXT PREVIEW ===== */}
          <div className="bg-surface-50 border border-surface-200 rounded-xl p-3">
            <p className="text-xs text-surface-500 font-semibold mb-1.5 uppercase tracking-wide">Texto para compartir</p>
            <p className="text-xs text-surface-700 leading-relaxed whitespace-pre-line">{copyText}</p>
          </div>

          {/* ===== ACTION BUTTONS ===== */}
          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"
            >
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              WhatsApp
            </button>

            {/* Copy text */}
            <button
              onClick={handleCopyText}
              className={cn(
                'flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.98]',
                copied === 'text'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-surface-300 bg-white text-surface-800 hover:border-primary-400 hover:text-primary-600'
              )}
            >
              {copied === 'text' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'text' ? 'Copiado' : 'Copiar texto'}
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className={cn(
                'flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.98]',
                copied === 'link'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-surface-300 bg-white text-surface-800 hover:border-primary-400 hover:text-primary-600'
              )}
            >
              {copied === 'link' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {copied === 'link' ? 'Copiado' : 'Copiar link'}
            </button>

            {/* Download image */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-2 bg-primary-600 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 transition-all duration-150"
            >
              {downloading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? 'Generando…' : 'Descargar imagen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
