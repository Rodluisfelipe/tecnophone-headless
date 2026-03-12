import { NextRequest, NextResponse } from 'next/server';

/* ── Vercel serverless config ── */
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

const TIMEOUT = 8_000; // 8 s — leaves 2 s buffer for Vercel Hobby (10 s limit)

/* ── Shared mobile-API headers ── */
const MOBILE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
  Referer:
    'https://mobile.servientrega.com/WebSitePortal/RastreoEnvioDetalle.html',
  Origin: 'https://mobile.servientrega.com',
};

export async function GET(req: NextRequest) {
  const guia = req.nextUrl.searchParams.get('guia')?.trim();

  if (!guia || !/^\d{6,30}$/.test(guia)) {
    return NextResponse.json(
      { error: 'Número de guía inválido. Debe contener solo dígitos (6-30).' },
      { status: 400 },
    );
  }

  /* ── Strategy 1 · Mobile API GET ── */
  try {
    const r1 = await fetch(
      `https://mobile.servientrega.com/Services/ShipmentTracking/api/envio/${guia}/1/es`,
      { headers: MOBILE_HEADERS, signal: AbortSignal.timeout(TIMEOUT) },
    );
    if (r1.ok) {
      const d = await r1.json();
      if (d && (d.movimientos || d.estadoActual || d.numeroGuia)) {
        console.log('[Tracking] ✓ mobile-GET');
        return NextResponse.json(formatResult(d, guia));
      }
    }
    console.log('[Tracking] mobile-GET status', r1.status);
  } catch (e: unknown) {
    console.log('[Tracking] mobile-GET error:', errMsg(e));
  }

  /* ── Strategy 2 · Mobile API POST ── */
  try {
    const r2 = await fetch(
      'https://mobile.servientrega.com/Services/ShipmentTracking/api/ControlRastreovalidaciones',
      {
        method: 'POST',
        headers: { ...MOBILE_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroGuia: guia,
          idValidacionUsuario: '0',
          tipoDatoValidar: '0',
          datoRespuestaUsuario: '0',
          idpais: 1,
          lenguaje: 'es',
        }),
        signal: AbortSignal.timeout(TIMEOUT),
      },
    );
    if (r2.ok) {
      const d = await r2.json();
      if (d.Code === 1 && d.ValidationNumber === 4 && d.Results?.[0]) {
        console.log('[Tracking] ✓ mobile-POST');
        return NextResponse.json(formatResult(d.Results[0], guia));
      }
      // Some responses include direct data
      if (d && (d.movimientos || d.estadoActual)) {
        console.log('[Tracking] ✓ mobile-POST (direct)');
        return NextResponse.json(formatResult(d, guia));
      }
    }
    console.log('[Tracking] mobile-POST status', r2.status);
  } catch (e: unknown) {
    console.log('[Tracking] mobile-POST error:', errMsg(e));
  }

  /* ── Strategy 3 · ASMX web-service (different origin, less likely to geo-block) ── */
  try {
    const params = new URLSearchParams({
      guia,
      idValidacionUsuario: '0',
      tipoDatoValidar: '0',
      datoRespuestaUsuario: '0',
      idpais: '1',
      lenguaje: 'es',
    });
    const r3 = await fetch(
      'https://web.servientrega.com/RastreoEnvios/RastreoEnviosAjax.asmx/RastreoEnvio',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://web.servientrega.com/RastreoEnvios/RastreoEnvioDetalle.html',
          Origin: 'https://web.servientrega.com',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(TIMEOUT),
      },
    );
    if (r3.ok) {
      const text = await r3.text();
      let parsed: Record<string, unknown>;
      try {
        const json = JSON.parse(text);
        // ASP.NET ASMX wraps response in { d: "..." }
        parsed = typeof json.d === 'string' ? JSON.parse(json.d) : json.d ?? json;
      } catch {
        parsed = {};
      }
      if (parsed && (parsed.movimientos || parsed.estadoActual || parsed.Results)) {
        const inner =
          (parsed.Results as Array<Record<string, unknown>>)?.[0] ?? parsed;
        console.log('[Tracking] ✓ ASMX');
        return NextResponse.json(formatResult(inner as Record<string, unknown>, guia));
      }
    }
    console.log('[Tracking] ASMX status', r3.status);
  } catch (e: unknown) {
    console.log('[Tracking] ASMX error:', errMsg(e));
  }

  /* ── All strategies failed ── */
  return NextResponse.json(
    {
      error:
        'No se pudo consultar la guía en Servientrega. Intenta de nuevo más tarde.',
    },
    { status: 502 },
  );
}

/* ── Helpers ── */

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

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
