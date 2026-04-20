import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name     = searchParams.get('name')     || 'Producto TecnoPhone';
  const price    = searchParams.get('price')    || '';
  const imageUrl = searchParams.get('image')    || '';
  const discount = parseInt(searchParams.get('discount') || '0', 10);
  const category = searchParams.get('category') || '';
  const truncName = name.length > 90 ? name.slice(0, 88) + '…' : name;
  const fontSize = name.length > 65 ? '26px' : name.length > 45 ? '30px' : '34px';
  const badges = ['🚚 Envío gratis', '🔒 Pago seguro', '✅ Garantía 1 año'];

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #172554 0%, #1e40af 45%, #2563eb 100%)',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Radial overlay — single child, no display needed */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '0',
            right: '0',
            bottom: '0',
            left: '0',
            background:
              'radial-gradient(circle at 20% 80%, rgba(59,130,246,0.25) 0%, transparent 50%)',
          }}
        />

        {/* Left: product image card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '480px',
            height: '534px',
            background: 'white',
            borderRadius: '28px',
            marginRight: '52px',
            flexShrink: 0,
            boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {discount > 0 ? (
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '22px',
                fontWeight: '900',
              }}
            >
              -{discount}%
            </div>
          ) : null}
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              style={{
                maxWidth: '400px',
                maxHeight: '460px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{ display: 'flex', fontSize: '80px' }}>📱</div>
          )}
        </div>

        {/* Right: info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            color: 'white',
            position: 'relative',
          }}
        >
          {/* Logo + category row */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div
              style={{
                display: 'flex',
                background: 'white',
                borderRadius: '12px',
                padding: '8px 18px',
                fontSize: '22px',
                fontWeight: '900',
                color: '#1d4ed8',
              }}
            >
              TecnoPhone
            </div>
            {category ? (
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {category}
              </div>
            ) : null}
          </div>

          {/* Product name */}
          <div
            style={{
              display: 'flex',
              fontSize,
              fontWeight: '800',
              lineHeight: 1.25,
              marginBottom: '28px',
              flex: 1,
              alignItems: 'flex-start',
              color: 'white',
            }}
          >
            {truncName}
          </div>

          {/* Price */}
          {price ? (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', fontSize: '52px', fontWeight: '900', color: 'white' }}>
                {price}
              </div>
            </div>
          ) : null}

          {/* Footer badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
              {badges.map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '14px',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', fontSize: '14px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
              www.tecnophone.co
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
