import { NextRequest, NextResponse } from 'next/server';

const SERVI_BASE = 'https://mobile.servientrega.com/Services/ShipmentTracking';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-CO,es;q=0.9',
  'Referer': 'https://mobile.servientrega.com/WebSitePortal/RastreoEnvioDetalle.html',
};

export async function GET(req: NextRequest) {
  const guia = req.nextUrl.searchParams.get('guia')?.trim();

  if (!guia || !/^\d{6,30}$/.test(guia)) {
    return NextResponse.json(
      { error: 'Número de guía inválido. Debe contener solo dígitos (6-30).' },
      { status: 400 }
    );
  }

  try {
    // Paso 1: GET directo
    const res = await fetch(`${SERVI_BASE}/api/envio/${guia}/1/es`, { headers: HEADERS, signal: AbortSignal.timeout(12000) });

    if (!res.ok) {
      // Fallback: POST ControlRastreovalidaciones
      const postRes = await fetch(`${SERVI_BASE}/api/ControlRastreovalidaciones`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroGuia: guia,
          idValidacionUsuario: '0',
          tipoDatoValidar: '0',
          datoRespuestaUsuario: '0',
          idpais: 1,
          lenguaje: 'es',
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!postRes.ok) {
        return NextResponse.json({ error: 'No se pudo consultar la guía. Intenta de nuevo.' }, { status: 502 });
      }

      const postData = await postRes.json();

      if (postData.Code === 1 && postData.ValidationNumber === 4 && postData.Results?.[0]) {
        return NextResponse.json(formatBasicResult(postData.Results[0], guia));
      }

      return NextResponse.json({
        exito: false,
        guia,
        error: 'No se encontró información para esta guía.',
      });
    }

    const data = await res.json();
    return NextResponse.json(formatBasicResult(data, guia));
  } catch {
    return NextResponse.json({ error: 'Error de conexión con Servientrega. Intenta de nuevo.' }, { status: 502 });
  }
}

function formatBasicResult(data: Record<string, unknown>, guia: string) {
  const movimientos = (data.movimientos as Array<Record<string, string>>) || [];
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
    primerosMovimientos: movimientos.slice(0, 3).map(mov => ({
      descripcion: mov.movimiento || mov.estado || '',
      fecha: mov.fecha || '',
      ubicacion: mov.ubicacion || '',
    })),
    totalMovimientos: movimientos.length,
  };
}
