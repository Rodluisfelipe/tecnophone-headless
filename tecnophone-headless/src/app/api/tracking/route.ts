import { NextRequest, NextResponse } from 'next/server';

/* ── Edge Runtime — se ejecuta en Bogotá (bog1), IP colombiana ── */
export const runtime = 'edge';
export const preferredRegion = ['gru1'];
export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(req: NextRequest) {
  const guia = req.nextUrl.searchParams.get('guia')?.trim();

  if (!guia || !/^\d{6,30}$/.test(guia)) {
    return NextResponse.json(
      { error: 'Número de guía inválido. Debe contener solo dígitos (6-30).' },
      { status: 400 },
    );
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 14_000); // Edge allows 25s+

  try {
    // Race all strategies — first success wins
    const result = await Promise.any([
      mobileGet(guia, ac.signal),
      mobilePost(guia, ac.signal),
      asmxPost(guia, ac.signal),
    ]);
    clearTimeout(timer);
    return NextResponse.json(result);
  } catch {
    clearTimeout(timer);
    return NextResponse.json(
      { error: 'No se pudo consultar la guía en Servientrega. Intenta de nuevo más tarde.' },
      { status: 502 },
    );
  }
}

/* ═══════════════════════════  STRATEGIES  ═══════════════════════════ */

/** Strategy 1 · mobile GET — same as Oklahoma backend httpsGetJSON */
async function mobileGet(guia: string, signal: AbortSignal) {
  const r = await fetch(
    `https://mobile.servientrega.com/Services/ShipmentTracking/api/envio/${guia}/1/es`,
    {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'es-CO,es;q=0.9',
        Referer: 'https://mobile.servientrega.com/WebSitePortal/RastreoEnvioDetalle.html',
      },
      signal,
    },
  );
  if (!r.ok) throw new Error(`mobile-GET ${r.status}`);
  const d = await r.json();
  if (d && (d.movimientos || d.estadoActual || d.numeroGuia)) {
    console.log('[Tracking] ✓ mobile-GET (edge)');
    return formatResult(d, guia);
  }
  throw new Error('mobile-GET empty');
}

/** Strategy 2 · mobile POST ControlRastreovalidaciones — same as Oklahoma */
async function mobilePost(guia: string, signal: AbortSignal) {
  const r = await fetch(
    'https://mobile.servientrega.com/Services/ShipmentTracking/api/ControlRastreovalidaciones',
    {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'es-CO,es;q=0.9',
        'Content-Type': 'application/json',
        Origin: 'https://mobile.servientrega.com',
        Referer: 'https://mobile.servientrega.com/WebSitePortal/RastreoEnvioDetalle.html',
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
    },
  );
  if (!r.ok) throw new Error(`mobile-POST ${r.status}`);
  const d = await r.json();
  if (d.Code === 1 && d.ValidationNumber === 4 && d.Results?.[0]) {
    console.log('[Tracking] ✓ mobile-POST (edge)');
    return formatResult(d.Results[0], guia);
  }
  if (d && (d.movimientos || d.estadoActual)) {
    return formatResult(d, guia);
  }
  throw new Error('mobile-POST empty');
}

/** Strategy 3 · web.servientrega.com ASMX */
async function asmxPost(guia: string, signal: AbortSignal) {
  const body = new URLSearchParams({
    guia,
    idValidacionUsuario: '0',
    tipoDatoValidar: '0',
    datoRespuestaUsuario: '0',
    idpais: '1',
    lenguaje: 'es',
  });
  const r = await fetch(
    'https://web.servientrega.com/RastreoEnvios/RastreoEnviosAjax.asmx/RastreoEnvio',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'User-Agent': UA,
        Referer: 'https://web.servientrega.com/RastreoEnvios/RastreoEnvioDetalle.html',
        Origin: 'https://web.servientrega.com',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: body.toString(),
      signal,
    },
  );
  if (!r.ok) throw new Error(`ASMX ${r.status}`);
  const text = await r.text();
  const json = JSON.parse(text);
  const parsed = typeof json.d === 'string' ? JSON.parse(json.d) : json.d ?? json;
  if (parsed && (parsed.movimientos || parsed.estadoActual || parsed.Results)) {
    const inner = (parsed.Results as Array<Record<string, unknown>>)?.[0] ?? parsed;
    console.log('[Tracking] ✓ ASMX (edge)');
    return formatResult(inner as Record<string, unknown>, guia);
  }
  throw new Error('ASMX empty');
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
