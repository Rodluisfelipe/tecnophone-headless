# Análisis Técnico Profundo — TecnoPhone E-Commerce Headless
### Fecha: 27 de marzo de 2026
### Analizado: Código fuente completo del repositorio `tecnophone-headless`

---

## 1. ARQUITECTURA GENERAL

### Stack Tecnológico
| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | ^14.2 |
| Lenguaje | TypeScript (strict mode) | ^5.4 |
| Estado | Zustand + persist | ^4.5 |
| Estilos | Tailwind CSS | ^3.4 |
| Búsqueda | Algolia (primario) / MeiliSearch (legacy) | ^5.49 / ^0.55 |
| Pagos | MercadoPago SDK | ^2.12 |
| Backend | WooCommerce (WordPress) vía GraphQL + REST API | WC v3 |
| Hosting | Vercel (serverless) | — |
| AI Chat | Groq (Llama 4 Scout) | — |
| Envíos | Servientrega (scraping multi-estrategia) | — |
| Imágenes | Sharp + Next.js Image Optimization | ^0.34 |

### Patrón de Comunicación
```
[Cliente Browser] → [Vercel/Next.js] → [wp.tecnophone.co (WordPress + WooCommerce)]
                                     → [Algolia] (búsqueda)
                                     → [MercadoPago API] (pagos)
                                     → [Servientrega] (rastreo)
                                     → [Groq API] (AI chat)
```

### Evaluación General: **Arquitectura sólida y bien diseñada** ✅
- Separación limpia entre frontend y backend
- GraphQL como canal principal (rápido) con REST API como fallback
- Cache en memoria con TTLs razonables (300s productos, 1800s categorías, 3600s tags)
- Input validation y sanitización en todos los endpoints
- Rate limiting en todos los API routes
- ISR (Incremental Static Regeneration) con revalidación on-demand vía webhooks

---

## 2. DIAGNÓSTICO DE WEBHOOKS — POR QUÉ NO FUNCIONAN

### 2.1 Webhooks que existen
| Webhook | Ruta | Propósito |
|---------|------|-----------|
| Productos WooCommerce | `/api/webhook/products` | Sync Algolia + revalidar páginas cacheadas |
| MercadoPago IPN | `/api/webhook/mercadopago` | Actualizar estado de orden tras pago |

### 2.2 Causas identificadas del fallo (ordenadas por probabilidad)

---

#### 🔴 CAUSA 1 (CRÍTICA): `WC_WEBHOOK_SECRET` no configurado o no coincide

**Archivo:** `src/app/api/webhook/products/route.ts` línea 12

```typescript
const WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || '';
```

Si la variable `WC_WEBHOOK_SECRET` no está configurada en Vercel:
- El handler devuelve **HTTP 500** con `"Webhook secret not configured"`
- WooCommerce recibe el 500 y marca el webhook como **fallido**

Si la variable ESTÁ configurada pero **no coincide** con el secret del webhook en WooCommerce:
- El HMAC mismatch devuelve **HTTP 401** con `"Invalid signature"`
- WooCommerce también lo marca como **fallido**

**Cómo verificar:**
1. En Vercel → Settings → Environment Variables → buscar `WC_WEBHOOK_SECRET`
2. En WordPress → WooCommerce → Settings → Advanced → Webhooks → ver el Secret del webhook
3. **DEBEN SER IDÉNTICOS** (mismo string, sin espacios extra)

---

#### 🔴 CAUSA 2 (CRÍTICA): Redirección de dominio convierte POST → GET

Si hay una redirección DNS/Vercel de:
- `tecnophone.co` → `www.tecnophone.co` (o viceversa)
- `http://` → `https://`

El HTTP client de WordPress (`wp_safe_remote_post`) al seguir un redirect 301/302 **convierte el POST en GET**, perdiendo el body y headers. El handler devuelve **HTTP 405** (Method Not Allowed) porque solo acepta POST.

**Cómo verificar:**
```bash
curl -I -X POST https://tecnophone.co/api/webhook/products
# Si devuelve 301/302 → hay una redirección que rompe el webhook
# Debe devolver 401 o 500 directamente (sin redirect)
```

**La URL del webhook en WooCommerce DEBE apuntar al dominio exact sin redirect:**
- Si el sitio vive en `www.tecnophone.co` → URL del webhook: `https://www.tecnophone.co/api/webhook/products`
- Si el sitio vive en `tecnophone.co` → URL del webhook: `https://tecnophone.co/api/webhook/products`

---

#### 🟡 CAUSA 3: Webhook no creado en WooCommerce

Es posible que el webhook simplemente **no esté configurado** en WooCommerce todavía.

**Cómo configurar:**
1. WordPress Admin → WooCommerce → Settings → Advanced → Webhooks
2. "Add webhook":
   - Nombre: `Sync Products to Headless`
   - Status: **Active**
   - Topic: **Product updated** (cubre crear, editar, eliminar)
   - Delivery URL: `https://www.tecnophone.co/api/webhook/products`
   - Secret: (copiar el mismo valor que `WC_WEBHOOK_SECRET` en Vercel)
   - API Version: `WP REST API Integration v3`
3. Guardar
4. Repetir para cada topic si se quieren webhooks separados:
   - `Product created`
   - `Product updated`  
   - `Product deleted`

---

#### 🟡 CAUSA 4: Encoding del body causa HMAC mismatch

El handler usa `request.text()` que decodifica el body como UTF-8 y luego re-encoda a UTF-8 para el HMAC:

```typescript
const rawBody = await request.text();
const expectedSig = createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');
```

Si WooCommerce envía caracteres especiales (tildes en nombres de productos, ñ, etc.), la decodificación/re-encodificación UTF-8 puede producir bytes diferentes. Es más seguro usar `arrayBuffer()` para preservar los bytes exactos.

---

#### 🟢 CAUSA 5 (menor): Timeout en Vercel

Las funciones serverless de Vercel Free tier tienen **10 segundos** de timeout. Si el webhook de productos necesita:
1. Verificar HMAC
2. Indexar en Algolia (llamada HTTP externa)
3. Revalidar múltiples paths

…y todo tarda >10s, Vercel mata la función y WooCommerce recibe timeout.

---

### 2.3 Webhook MercadoPago — Mismo tipo de problemas

El webhook de MercadoPago (`/api/webhook/mercadopago`) tiene la misma dependencia de:
- `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` en variables de entorno
- URL correcta configurada en el Dashboard de MercadoPago

---

## 3. CORRECCIONES RECOMENDADAS AL CÓDIGO

### 3.1 Webhook de productos — Mejorar robustez del HMAC

**Cambiar `request.text()` por `request.arrayBuffer()`** para preservar los bytes exactos del body y evitar problemas de encoding.

### 3.2 Agregar endpoint GET de health-check

Actualmente el GET devuelve 405. Es mejor devolver un health-check que permita:
- Verificar que el endpoint está vivo desde WordPress
- Verificar que las variables de entorno están configuradas
- Diagnosticar problemas remotamente

### 3.3 Agregar logging detallado para debugging

El handler actual loguea poco en casos de error. Se necesitan más detalles para diagnosticar fallos en Vercel Logs.

---

## 4. ANÁLISIS DE SEGURIDAD

### ✅ Lo que está bien hecho
| Control | Implementación |
|---------|---------------|
| HMAC-SHA256 con timing-safe comparison | ✅ `timingSafeEqual()` en ambos webhooks |
| Rate limiting en TODOS los API routes | ✅ 5-30 req/min según endpoint |
| Input validation y sanitización | ✅ `stripHtml()`, `truncate()`, `isPositiveInt()`, `isValidEmail()` |
| CSP (Content Security Policy) completa | ✅ Headers en `next.config.js` |
| HSTS con preload | ✅ 2 años, includeSubDomains |
| X-Frame-Options: DENY | ✅ Protección clickjacking |
| No expone powered-by header | ✅ `poweredByHeader: false` |
| Verificación de monto contra WC | ✅ `payments/route.ts` verifica total del pedido |
| Protección path traversal | ✅ `isPositiveInt()` en todos los IDs |
| Bloqueo de rutas WordPress legacy | ✅ Middleware + redirects |
| Body size limits | ✅ Limita strings, arrays, y cart items |

### ⚠️ Áreas de mejora
| Tema | Detalle |
|------|---------|
| Credenciales WC en auth header | Se usan `Consumer Key/Secret` en Basic Auth — es el estándar de WC REST API, pero considerar OAuth si hay MITM concerns |
| In-memory rate limiter | En Vercel serverless se resetea con cada cold start. Para producción real considerar Vercel KV o Upstash Redis |
| Rate limit en webhook | Los webhooks no tienen rate limit — un actor malicioso con el secret podría hacer flood de requests. Bajo riesgo pero conviene agregar |
| Endpoints de tracking obfuscan URLs | Las URLs de Servientrega están en base64 — seguridad por oscuridad, no real protección. Aceptable dado que es scraping legítimo |

---

## 5. ANÁLISIS DE RENDIMIENTO

### ✅ Optimizaciones bien implementadas
- **Image optimization**: AVIF + WebP, cache 1 año, device sizes optimizados
- **Code splitting**: Dynamic imports con `next/dynamic` para componentes pesados
- **GraphQL como canal primario**: Reduce payload vs REST API (solo pide campos necesarios)
- **In-memory cache con TTLs**: Evita re-fetches innecesarios (300s-3600s)
- **Algolia para búsqueda**: Sub-millisecond search vs WooCommerce search
- **ISR**: Páginas se regeneran incrementalmente sin rebuild completo
- **Cart partializado**: Solo guarda datos mínimos en localStorage
- **Static assets**: Cache-Control immutable para JS/CSS/fonts

### ⚠️ Oportunidades de mejora
| Tema | Impacto |
|------|---------|
| Cache en memoria no compartido entre instancias serverless | Cada función fría recalcula todo. Considerar Vercel Edge Config o KV |
| `enrichProductsWithBrands()` hace REST API call por cada render | Paginea TODOS los productos para obtener brands. Huele a N+1 |
| Checkout Store API → REST API fallback | Dos flujos completos de checkout = complejidad y posibles bugs edge-case |

---

## 6. EVALUACIÓN DE CÓDIGO

### Calidad general: **8.5/10**

| Criterio | Nota | Comentario |
|----------|:----:|-----------|
| Estructura de archivos | 9/10 | Organización clara por dominio (api/, lib/, store/, types/) |
| TypeScript strict | 9/10 | Types bien definidos, interfaces para todo |
| Error handling | 8/10 | Bueno en general, algunos catch silenciosos |
| Seguridad | 9/10 | OWASP top 10 bien cubierto |
| Rendimiento | 8/10 | Buenas optimizaciones, algunos puntos ciegos en cache |
| Mantenibilidad | 8/10 | Código legible, nombres descriptivos |
| Testing | 3/10 | No hay tests unitarios ni e2e |
| Observabilidad | 6/10 | Console.log básico, no hay APM ni error tracking |

### Deuda técnica identificada
1. **MeiliSearch legacy**: Existe `sync-meilisearch.ts`, `lib/meilisearch.ts`, `docker-compose.yml` con MeiliSearch — ya se migró a Algolia, estos archivos son dead code
2. **No hay tests**: Ningún test unitario, de integración, o e2e
3. **Console.log como logging**: No hay structured logging ni error tracking (Sentry, LogRocket, etc.)
4. **Checkout dual path**: Dos flujos completos de checkout (Store API + REST API) aumentan la superficie de bugs

---

## 7. CHECKLIST DE VARIABLES DE ENTORNO REQUERIDAS

Todas estas variables deben estar configuradas en **Vercel → Settings → Environment Variables**:

| Variable | Propósito | ¿Crítica? |
|----------|-----------|:---------:|
| `NEXT_PUBLIC_WORDPRESS_URL` | URL de WordPress (ej: `https://wp.tecnophone.co`) | 🔴 Sí |
| `NEXT_PUBLIC_GRAPHQL_URL` | URL de WPGraphQL (ej: `https://wp.tecnophone.co/graphql`) | 🔴 Sí |
| `WC_CONSUMER_KEY` | WooCommerce REST API key | 🔴 Sí |
| `WC_CONSUMER_SECRET` | WooCommerce REST API secret | 🔴 Sí |
| `WC_WEBHOOK_SECRET` | Secret del webhook de productos | 🔴 **CAUSA DEL FALLO** |
| `MP_ACCESS_TOKEN` | MercadoPago access token | 🔴 Sí |
| `MP_WEBHOOK_SECRET` | MercadoPago webhook secret | 🔴 Sí |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Algolia Application ID | 🟡 Para búsqueda |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` | Algolia Search-only API Key | 🟡 Para búsqueda |
| `ALGOLIA_ADMIN_KEY` | Algolia Admin API Key (write access) | 🟡 Para indexar |
| `GROQ_API_KEY` | API key de Groq para AI chat | 🟢 Opcional |

---

## 8. PASOS INMEDIATOS PARA ACTIVAR WEBHOOKS

### Paso 1: Verificar variables de entorno en Vercel
Ir a Vercel → proyecto → Settings → Environment Variables y confirmar que `WC_WEBHOOK_SECRET` tiene un valor.

### Paso 2: Verificar dominio sin redirect
```bash
curl -v -X POST https://www.tecnophone.co/api/webhook/products
# Debe responder directamente (401 o 500), NO 301/302
```

### Paso 3: Crear webhook en WooCommerce
WordPress Admin → WooCommerce → Settings → Advanced → Webhooks → Add Webhook:
- Name: `Headless Product Sync`
- Status: `Active`
- Topic: `Product updated`
- Delivery URL: `https://www.tecnophone.co/api/webhook/products`
- Secret: (el mismo valor de `WC_WEBHOOK_SECRET`)
- API Version: `WP REST API Integration v3`

### Paso 4: Test ping
Al guardar el webhook, WooCommerce envía un ping. Verificar en Vercel Logs la respuesta.

### Paso 5: Verificar con producto real
Editar cualquier producto en WooCommerce → Guardar. Verificar:
1. Vercel Logs muestra `[Webhook] Indexed product X`
2. Algolia Dashboard muestra el producto actualizado
3. La página del producto en tecnophone.co refleja el cambio

---
