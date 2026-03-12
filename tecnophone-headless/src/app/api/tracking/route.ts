import { NextRequest, NextResponse } from 'next/server';

/* ── Vercel serverless config ── */
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * All strategies race in PARALLEL — first successful response wins.
 * Global 8 s deadline so the function never exceeds Vercel's 10 s limit.
 */

export async function GET(req: NextRequest) {
  const guia = req.nextUrl.searchParams.get('guia')?.trim();

  if (!guia || !/^\d{6,30}$/.test(guia)) {
    return NextResponse.json(
      { error: 'Número de guía inválido. Debe contener solo dígitos (6-30).' },
      { status: 400 },
    );
  }

  const ac = new AbortController();
  const globalTimer = setTimeout(() => ac.abort(), 8_000);

  try {
    const result = await Promise.any([
      mobileGet(guia, ac.signal),
      mobilePost(guia, ac.signal),
      asmxPost(guia, ac.signal),
      webPortal(guia, ac.signal),
    ]);
    clearTimeout(globalTimer);
    return NextResponse.json(result);
  } catch {
    clearTimeout(globalTimer);
    return NextResponse.json(
      { error: 'No se pudo consultar la guía en Servientrega. Intenta de nuevo más tarde.' },
      { status: 502 },
    );
  }
}

/* ═══════════════════════════  STRATEGIES  ═══════════════════════════ */

/** Strategy 1 · mobile.servientrega.com GET */
async function mobileGet(guia: string, signal: AbortSignal) {
  const r = await fetch(
    `https://mobile.servientrega.com/Services/ShipmentTracking/api/envio/${guia}/1/es`,
    {
      headers: {
        'User-Agent': UA_MOBILE,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'es-CO,es;q=0.9',
        Referer: 'https://mobile.servientrega.com/WebSitePortal/RastreoEnvioDetalle.html',
        Origin: 'https://mobile.servientrega.com',
      },
      signal,
    },
  );
  if (!r.ok) throw new Error(`mobile-GET ${r.status}`);
  const d = await r.json();
  if (d && (d.movimientos || d.estadoActual || d.numeroGuia)) {
    console.log('[Tracking] ✓ mobile-GET');
    return formatResult(d, guia);
  }
  throw new Error('mobile-GET empty');
}

/** Strategy 2 · mobile.servientrega.com POST */
async function mobilePost(guia: string, signal: AbortSignal) {
  const r = await fetch(
    'https://mobile.servientrega.com/Services/ShipmentTracking/api/ControlRastreovalidaciones',
    {
      method: 'POST',
      headers: {
        'User-Agent': UA_MOBILE,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'es-CO,es;q=0.9',
        Referer: 'https://mobile.servientrega.com/WebSitePortal/RastreoEnvioDetalle.html',
        Origin: 'https://mobile.servientrega.com',
        'Content-Type': 'application/json',
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
    console.log('[Tracking] ✓ mobile-POST');
    return formatResult(d.Results[0], guia);
  }
  if (d && (d.movimientos || d.estadoActual)) {
    console.log('[Tracking] ✓ mobile-POST (direct)');
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
        'User-Agent': UA_DESKTOP,
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
    console.log('[Tracking] ✓ ASMX');
    return formatResult(inner as Record<string, unknown>, guia);
  }
  throw new Error('ASMX empty');
}

/** Strategy 4 · www.servientrega.com portal API (different infra, less likely to geo-block) */
async function webPortal(guia: string, signal: AbortSignal) {
  // The main website uses this endpoint publicly
  const r = await fetch(
    'https://www.servientrega.com/wps/portal/rastreo-envio/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8zi_YO8nQ093Q0N3C3cDAwCPd09g7w9vAwMDEz0wwkpiAJKG-AAjgb6BbmhigBClBEM/p0/IZ7_9DMSG4Q14HN7E0Q5J7QN2C0G95=CZ6_9DMSG4Q14HN7E0Q5J7QN2C0GH4=NJrastrearEnvio=/' ,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA_DESKTOP,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: 'https://www.servientrega.com/wps/portal/rastreo-envio/',
      },
      body: `guia=${guia}`,
      signal,
    },
  );
  if (!r.ok) throw new Error(`portal ${r.status}`);
  const html = await r.text();

  // Parse tracking info from the HTML response
  const estadoMatch = html.match(/estado[^>]*>([^<]+)</i);
  const estado = estadoMatch?.[1]?.trim();
  if (!estado) throw new Error('portal no-data');

  console.log('[Tracking] ✓ web-portal');

  // Extract origin/destination from HTML if available
  const origenMatch = html.match(/origen[^>]*>([^<]+)</i);
  const destinoMatch = html.match(/destino[^>]*>([^<]+)</i);

  return {
    exito: true,
    guia,
    estado,
    origen: origenMatch?.[1]?.trim() || null,
    destino: destinoMatch?.[1]?.trim() || null,
    fechaEnvio: null,
    fechaEntrega: null,
    primerosMovimientos: [],
    totalMovimientos: 0,
  };
}

/* ═══════════════════════════  HELPERS  ═══════════════════════════ */

const UA_MOBILE =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
    primerosMovimientos: movimientos.slice(0, 3).map((mov) => ({
      descripcion: mov.movimiento || mov.estado || '',
      fecha: mov.fecha || '',
      ubicacion: mov.ubicacion || '',
    })),
    totalMovimientos: movimientos.length,
  };
}
