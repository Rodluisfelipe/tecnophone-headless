'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useChatStore } from '@/store/chat';

interface ProductSuggestion {
  name: string;
  slug: string;
  image: string;
  price: string;
  salePrice: string;
  onSale: boolean;
  externalUrl?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ProductSuggestion[];
}

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content: '¡Hola! 👋 Soy Tecno, el asistente de TecnoPhone. ¿En qué te puedo ayudar hoy?',
};

/* ─── Mascot Face (reusable) ─── */
function MascotFace({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const isLg = size === 'lg';
  return (
    <div className={`relative ${isLg ? 'w-14 h-14' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105`}>
      <svg
        width={isLg ? "32" : "18"}
        height={isLg ? "38" : "22"}
        viewBox="0 0 32 38"
        fill="none"
      >
        <path d="M16 2C8.268 2 2 8.268 2 16C2 22.5 7.5 28.5 13.5 33.5C14.8 34.6 15.3 35.8 16 36.5C16.7 35.8 17.2 34.6 18.5 33.5C24.5 28.5 30 22.5 30 16C30 8.268 23.732 2 16 2Z" fill="white"/>
            
            {/* Sonrojo (Blush tierno) */}
            <ellipse cx="8.5" cy="18" rx="2.5" ry="1.2" fill="#FF8DA1" opacity="0.6"/>
            <ellipse cx="23.5" cy="18" rx="2.5" ry="1.2" fill="#FF8DA1" opacity="0.6"/>

            {/* Ojo Izquierdo con brillo */}
            <g className="mascot-eye">
              <ellipse cx="11.5" cy="15" rx="2.6" ry="3" fill="#1a73e8"/>
              <circle cx="10.5" cy="13.8" r="0.9" fill="white"/>
              <circle cx="12.5" cy="16.2" r="0.4" fill="white"/>
            </g>

            {/* Ojo Derecho con brillo (pequeño retraso para un parpadeo más orgánico) */}
            <g className="mascot-eye" style={{ animationDelay: '0.09s' }}>
              <ellipse cx="20.5" cy="15" rx="2.6" ry="3" fill="#1a73e8"/>
              <circle cx="19.5" cy="13.8" r="0.9" fill="white"/>
              <circle cx="21.5" cy="16.2" r="0.4" fill="white"/>
            </g>
          </svg>
        </div>
  );
}

/* ─── Typing Indicator ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
      <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot animation-delay-200" />
      <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot animation-delay-400" />
    </div>
  );
}

/* ─── Product Card ─── */
function ProductCard({ product }: { product: ProductSuggestion }) {
  const formatPrice = (price: string) => {
    const num = parseInt(price, 10);
    if (isNaN(num)) return price;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
  };

  const isMercadoLibre = product.externalUrl?.toLowerCase().includes('mercadolibre');
  const isFalabella = product.externalUrl?.toLowerCase().includes('falabella');
  const hasExternalUrl = !!product.externalUrl;

  const Wrapper = hasExternalUrl ? 'a' : Link;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapperProps: any = hasExternalUrl 
    ? { href: product.externalUrl, target: "_blank", rel: "noopener noreferrer" } 
    : { href: `/producto/${product.slug}` };

  return (
    <Wrapper
      {...wrapperProps}
      className="flex gap-3 p-2 rounded-xl bg-white border border-surface-200 hover:border-blue-300 hover:shadow-md transition-all min-h-0 group cursor-pointer"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-400 text-xs">
            Sin foto
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-xs font-semibold text-surface-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1 mb-1">
          {product.onSale && product.salePrice && product.salePrice !== product.price ? (
            <>
              <span className="text-xs font-bold text-red-600">{formatPrice(product.salePrice)}</span>
              <span className="text-[10px] text-surface-400 line-through">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="text-xs font-bold text-surface-700">{formatPrice(product.salePrice || product.price)}</span>
          )}
        </div>
        
        {isMercadoLibre ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mercadolibre-logo.png" alt="MercadoLibre" className="w-4 h-4 flex-shrink-0 rounded-sm" />
            <span className="text-[10px] text-[#2D3277] font-bold min-h-0">Comprar en MercadoLibre →</span>
          </div>
        ) : isFalabella ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg viewBox="0 0 400 400" className="w-4 h-4 flex-shrink-0">
              <circle cx="200" cy="200" r="190" fill="#B2D235" />
              <path fill="#1a1a1a" d="M185.3 320V197.6h-34.5v-37.9h34.5v-27.8c0-11 2.3-19.6 6.9-25.7 6.1-8.2 15.8-12.3 29.1-12.3 10.1 0 20.3 1.7 30.5 5.1v38.8c-6.8-2.6-12.8-3.9-18-3.9-9.5 0-14.2 4.9-14.2 14.7v11.1h32.1v37.9h-32.1V320h-34.3z" />
            </svg>
            <span className="text-[10px] text-[#B2D235] font-bold min-h-0">Comprar en Falabella →</span>
          </div>
        ) : hasExternalUrl ? (
           <div className="flex items-center gap-1 mt-0.5">
             <span className="text-[10px] text-surface-600 font-medium min-h-0">Comprar en tienda externa →</span>
           </div>
        ) : (
          <span className="text-[10px] text-blue-500 font-medium mt-0.5 min-h-0">Ver producto →</span>
        )}
      </div>
    </Wrapper>
  );
}

/* ─── Main Component ─── */
export default function AiChatBubble() {
  const { isOpen, openChat, closeChat } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history from existing messages (exclude greeting, last 6)
      const history = messages
        .filter((m) => m.id !== 'greeting')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'No pude procesar tu solicitud. 🙏',
        products: data.products,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Ups, ocurrió un error de conexión. Intenta de nuevo. 🔄',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ─── Chat Panel ─── */}
      {isOpen && (
        <div className="fixed z-50 top-0 left-0 right-0 bottom-[calc(4rem_+_env(safe-area-inset-bottom,0px))] lg:inset-auto lg:bottom-24 lg:right-6 lg:w-[380px] lg:h-[520px] flex flex-col bg-white lg:rounded-2xl shadow-2xl lg:border lg:border-surface-200 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
            <MascotFace size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">Asistente TecnoPhone</p>
              <p className="text-[10px] text-blue-100">Siempre listo para ayudarte</p>
            </div>
            <button
              onClick={closeChat}
              className="w-8 h-8 min-h-0 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Cerrar chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                        : 'bg-white border border-surface-200 text-surface-800 rounded-2xl rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Product cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.products.map((p) => (
                        <ProductCard key={p.slug} product={p} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-surface-200 rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-surface-200 bg-white flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-3.5 py-2.5 text-base bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 min-h-0"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 min-h-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-surface-300 text-white rounded-xl transition-colors flex-shrink-0"
              aria-label="Enviar mensaje"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ─── Floating Mascot Bubble (desktop only) ─── */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed hidden lg:block bottom-6 right-6 z-50 min-h-0 mascot-bounce group"
          aria-label="Abrir asistente de TecnoPhone"
        >
          <div className="relative">
            <MascotFace size="lg" />
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white rounded-lg shadow-lg border border-surface-200 text-xs font-medium text-surface-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            ¿Necesitas ayuda? 💬
          </div>
        </button>
      )}
    </>
  );
}
