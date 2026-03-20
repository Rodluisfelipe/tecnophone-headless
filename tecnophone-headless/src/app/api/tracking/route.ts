import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';
export const preferredRegion = ['gru1'];
export const dynamic = 'force-dynamic';

/* Upstream endpoints are private — never expose in client bundles, error
   messages, or response headers. Comments here use codenames only. */
const EP_A = 'aHR0cHM6Ly9tb2JpbGUuc2VydmllbnRyZWdhLmNvbS9TZXJ2aWNlcy9TaGlwbWVudFRyYWNraW5nL2FwaS9lbnZpbw==';
const EP_B = 'aHR0cHM6Ly9tb2JpbGUuc2VydmllbnRyZWdhLmNvbS9TZXJ2aWNlcy9TaGlwbWVudFRyYWNraW5nL2FwaS9Db250cm9sUmFzdHJlb3ZhbGlkYWNpb25lcw==';
const EP_C = 'aHR0cHM6Ly93ZWIuc2VydmllbnRyZWdhLmNvbS9SYXN0cmVvRW52aW9zL1Jhc3RyZW9FbnZpb3NBamF4LmFzbXgvUmFzdHJlb0Vudmlv';
const REF_M = 'aHR0cHM6Ly9tb2JpbGUuc2VydmllbnRyZWdhLmNvbS9XZWJTaXRlUG9ydGFsL1Jhc3RyZW9FbnZpb0RldGFsbGUuaHRtbA==';
const ORIG_M = 'aHR0cHM6Ly9tb2JpbGUuc2VydmllbnRyZWdhLmNvbQ==';
const REF_W = 'aHR0cHM6Ly93ZWIuc2VydmllbnRyZWdhLmNvbS9SYXN0cmVvRW52aW9zL1Jhc3RyZW9FbnZpb0RldGFsbGUuaHRtbA==';
const ORIG_W = 'aHR0cHM6Ly93ZWIuc2VydmllbnRyZWdhLmNvbQ==';

const d = (b64: string) => atob(b64);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(req: NextRequest) {
  // Rate limit: 5 lookups per minute per IP
  const limited = rateLimit(req, { name: 'tracking', max: 5, windowMs: 60_000 });
  if (limited) return limited;

  const guia = req.nextUrl.searchParams.get('guia')?.trim();

  if (!guia || !/^\d{6,30}$/.test(guia)) {
    return NextResponse.json(
      { error: 'Número de guía inválido. Debe contener solo dígitos (6-30).' },
      { status: 400 },
    );
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 14_000);

  try {
    const result = await Promise.any([
      strategyA(guia, ac.signal),
      strategyB(guia, ac.signal),
      strategyC(guia, ac.signal),
    ]);
    clearTimeout(timer);
    return NextResponse.json(result);
  } catch {
    clearTimeout(timer);
    return NextResponse.json(
      { error: 'No se pudo consultar la guía. Intenta de nuevo más tarde.' },
      { status: 502 },
    );
  }
}

/* ═══════════════════════════  STRATEGIES  ═══════════════════════════ */

async function strategyA(guia: string, signal: AbortSignal) {
  const r = await fetch(
    `${d(EP_A)}/${guia}/1/es`,
    {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'es-CO,es;q=0.9',
        Referer: d(REF_M),
      },
      signal,
    },
  );
  if (!r.ok) throw new Error('A');
  const data = await r.json();
  if (data && (data.movimientos || data.estadoActual || data.numeroGuia)) {
    return formatResult(data, guia);
  }
  throw new Error('A empty');
}

async function strategyB(guia: string, signal: AbortSignal) {
  const r = await fetch(d(EP_B), {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'es-CO,es;q=0.9',
      'Content-Type': 'application/json',
      Origin: d(ORIG_M),
      Referer: d(REF_M),
    },
    body: JSON.stringify({
      numeroGuia: guia,
      idValidacionUsuario: '0',
      tipoDatoValidar: '0',
      datoRespuestaUsuario: '0',
      idpais: 1,
      lenguaje: 'es',
    }),
    signal,
  });
  if (!r.ok) throw new Error('B');
  const data = await r.json();
  if (data.Code === 1 && data.ValidationNumber === 4 && data.Results?.[0]) {
    return formatResult(data.Results[0], guia);
  }
  if (data && (data.movimientos || data.estadoActual)) {
    return formatResult(data, guia);
  }
  throw new Error('B empty');
}

async function strategyC(guia: string, signal: AbortSignal) {
  const body = new URLSearchParams({
    guia,
    idValidacionUsuario: '0',
    tipoDatoValidar: '0',
    datoRespuestaUsuario: '0',
    idpais: '1',
    lenguaje: 'es',
  });
  const r = await fetch(d(EP_C), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'User-Agent': UA,
      Referer: d(REF_W),
      Origin: d(ORIG_W),
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body.toString(),
    signal,
  });
  if (!r.ok) throw new Error('C');
  const text = await r.text();
  const json = JSON.parse(text);
  const parsed = typeof json.d === 'string' ? JSON.parse(json.d) : json.d ?? json;
  if (parsed && (parsed.movimientos || parsed.estadoActual || parsed.Results)) {
    const inner = (parsed.Results as Array<Record<string, unknown>>)?.[0] ?? parsed;
    return formatResult(inner as Record<string, unknown>, guia);
  }
  throw new Error('C empty');
}

/* ═══════════════════════════  HELPERS  ═══════════════════════════ */

function formatResult(data: Record<string, unknown>, guia: string) {
  const movimientos =
    (data.movimientos as Array<Record<string, string>>) || [];
  const remitente = data.remitente as Record<string, string> | undefined;
  const destinatario = data.destinatario as Record<string, string> | undefined;

  return {
    exito: true,
    guia: (data.numeroGuia as string) || guia,
    estado: (data.estadoActual as string) || 'Sin información',
    origen: remitente?.ciudad || null,
    destino: destinatario?.ciudad || null,
    fechaEnvio: ((data.fechaEnvio as string) || '').trim() || null,
    fechaEntrega: ((data.fechaRealEntrega as string) || '').trim() || null,
    primerosMovimientos: movimientos.slice(-5).reverse().map((mov) => ({
      descripcion: mov.movimiento || mov.estado || '',
      fecha: mov.fecha || '',
      ubicacion: mov.ubicacion || '',
    })),
    totalMovimientos: movimientos.length,
  };
}
