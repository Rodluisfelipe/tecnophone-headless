# TecnoPhone - Frontend Headless

Frontend headless para [tecnophone.co](https://tecnophone.co) construido con **Next.js 14**, **Tailwind CSS** y la **API REST de WooCommerce**.

## Stack Tecnológico

- **Next.js 14** (App Router) — SSR, SSG, ISR para SEO superior
- **TypeScript** — Tipado estricto
- **Tailwind CSS** — Diseño moderno y responsivo
- **Zustand** — Estado del carrito persistente
- **Lucide React** — Iconografía
- **WooCommerce REST API v3** — Backend de productos

## Configuración

### 1. Crear claves API de WooCommerce

En WordPress Admin → WooCommerce → Ajustes → Avanzado → REST API:
- Crear nueva clave con permisos de **Lectura**
- Copiar Consumer Key y Consumer Secret

### 2. Configurar variables de entorno

Editar `.env.local`:

```env
NEXT_PUBLIC_WORDPRESS_URL=https://www.tecnophone.co
WC_CONSUMER_KEY=ck_tu_consumer_key
WC_CONSUMER_SECRET=cs_tu_consumer_secret
```

### 3. Instalar y ejecutar

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx          # Layout global (navbar + footer + cart)
│   ├── page.tsx            # Homepage (hero + productos + ofertas)
│   ├── productos/          # Catálogo con filtros y ordenamiento
│   ├── producto/[slug]/    # Detalle de producto con galería
│   ├── categoria/[slug]/   # Productos por categoría
│   ├── buscar/             # Búsqueda de productos
│   ├── blog/               # Blog (consumiendo wp/v2/posts)
│   ├── contacto/           # Página de contacto
│   └── api/                # API routes (proxy a WooCommerce)
├── components/
│   ├── layout/             # Navbar, Footer, CartDrawer, WhatsApp
│   └── products/           # ProductCard
├── lib/
│   ├── woocommerce.ts      # Cliente API de WooCommerce
│   └── utils.ts            # Utilidades (cn)
├── store/
│   └── cart.ts             # Estado del carrito (Zustand)
└── types/
    └── woocommerce.ts      # Tipos TypeScript
```

## Ventajas vs Oklahoma Computadores

| Característica | Oklahoma (Vue SPA) | TecnoPhone (Next.js SSR) |
|---|---|---|
| SEO | ❌ SPA sin SSR | ✅ SSR/SSG/ISR completo |
| Velocidad inicial | ❌ JS pesado | ✅ HTML pre-renderizado |
| Meta tags dinámicos | ❌ No | ✅ Sí, por producto |
| Open Graph | ❌ Básico | ✅ Completo por página |
| Errores JS | ❌ windowWidth bug | ✅ Sin errores |
| Optimización imágenes | ❌ Manual | ✅ next/image automático |
| Caché inteligente | ❌ No | ✅ ISR cada 5 min |

## Producción

```bash
npm run build
npm start
```

Recomendado desplegar en **Vercel** para aprovechamiento óptimo de ISR y Edge Functions.
