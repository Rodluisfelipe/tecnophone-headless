# Propuesta de Activación Comercial — TecnoPhone E-Commerce
### Presentado a: Dirección General
### Fecha: 27 de marzo de 2026
### Sitio: www.tecnophone.co
### Período de ejecución: Abril — Junio 2026

---

## 1. CONTEXTO Y RECONOCIMIENTO

### Lo que se logró (Enero — Marzo 2026):
Se construyó **toda la infraestructura técnica** de la tienda desde cero: vitrina headless ultra-rápida, pasarela de pagos MercadoPago (tarjetas, Nequi, PSE, transferencia), carrito persistente, checkout colombiano, búsqueda inteligente Algolia, asistente AI, rastreo Servientrega, páginas legales DIAN, SEO técnico con 23 páginas indexadas. **La "máquina" está construida.**

### Lo que faltó (y es la razón de esta propuesta):
La máquina está construida pero **no se encendió comercialmente**. No se generaron ventas nuevas desde la web porque:

- ❌ El catálogo tiene muy pocos productos publicados — el cliente entra y ve categorías vacías o con 1 solo producto
- ❌ No se escribieron artículos de blog para atraer tráfico orgánico
- ❌ No se implementaron campañas de marketing ni retargeting
- ❌ No hay reseñas de clientes ni prueba social visible
- ❌ No se activó Google Analytics para medir conversiones
- ❌ No hubo participación en campañas estacionales (Día de la Mujer, San Valentín, etc.)

### Diagnóstico honesto:
> Se invirtieron 3 meses en construir un Ferrari. Ahora hay que ponerle gasolina y sacarlo a la pista. La infraestructura técnica es sólida y superior a la mayoría de tiendas de tecnología en Colombia. Lo que necesita es **activación comercial**: contenido, catálogo, marketing y medición.

---

## 2. ACLARACIÓN IMPORTANTE SOBRE EL ANÁLISIS DE GEMINI

El análisis generado por Gemini contiene **observaciones válidas** pero también **datos incorrectos** porque aparentemente evaluó la web antigua de WordPress (Narotech) y no la tienda headless actual. Aclaraciones:

| Observación de Gemini | Realidad en tecnophone.co (headless) |
|----------------------|--------------------------------------|
| "No tiene pasarela de pagos, necesita PayU/Wompi/Bold" | ✅ **YA TIENE** MercadoPago integrado: tarjetas crédito/débito, Nequi, PSE, transferencia bancaria, cuotas hasta 12 meses |
| "Botones que dicen Comprar en Mercado Libre" | ❌ **NO APLICA** a la web headless — todos los botones dicen "Agregar al carrito" y la compra es 100% dentro de tecnophone.co |
| "No tiene botón de WhatsApp visible" | ✅ **YA TIENE** botón flotante de WhatsApp visible en todas las páginas |
| "No tiene logos de Original/Garantía" | ✅ **YA TIENE** barra de confianza con: Original, Garantía, Envío Gratis, Factura DIAN |
| "Sección de Nosotros muy genérica" | ⚠️ Válido — se puede mejorar con fotos del local y del equipo |

### Observaciones de Gemini que SÍ son válidas y se abordan en esta propuesta:
- ✅ Catálogo con pocos productos → **Plan de poblamiento de catálogo**
- ✅ Sin reseñas de clientes → **Implementación de sistema de reseñas**
- ✅ Blog sin contenido → **Calendario editorial**
- ✅ Sin campañas de retargeting → **Plan de marketing digital**
- ✅ Fichas de producto genéricas → **Mejora de descripciones**

---

## 3. PLAN DE ACCIÓN ABRIL 2026 — CRONOGRAMA SEMANAL

---

### 🔴 SEMANA 1 (1 - 4 de Abril) — "FUNDAMENTOS"
**Objetivo: Tener una tienda creíble con catálogo mínimo viable**

| # | Tarea | Responsable | Entregable | Tiempo est. |
|---|-------|-------------|------------|:-----------:|
| 1 | **Poblar catálogo**: Publicar mínimo 20 productos activos (con stock o bajo pedido) distribuidos en todas las categorías | Felipe + Dirección | 20 productos publicados | 8h |
| 2 | **Fichas de producto mejoradas**: Reescribir descripciones con beneficios reales, no copiar del fabricante. Usar lenguaje de venta: "Ideal para estudiantes", "Perfecto para gaming" | Felipe | 20 fichas reescritas | 6h |
| 3 | **Fotos reales**: Subir al menos 3 fotos por producto incluyendo una foto "en mano" o en el local | Dirección + Felipe | 60 fotos mínimo | 4h |
| 4 | **Ocultar categorías vacías**: Si una categoría tiene 0 productos, no debe aparecer en la navegación | Felipe | Categorías limpias | 2h |
| 5 | **Google Analytics 4 + Pixel Meta**: Instalar tracking de conversiones para medir todo desde el día 1 | Felipe | GA4 + Meta Pixel activos | 3h |
| 6 | **Completar pendientes técnicos**: Webhook de sync stock + ajustes seguridad WordPress | Felipe | 100% técnico completado | 4h |

**Meta de Semana 1:** Tienda con mínimo 20 productos, categorías sin huecos, analytics midiendo.

---

### 🟡 SEMANA 2 (7 - 11 de Abril) — "CONFIANZA"
**Objetivo: Generar prueba social y credibilidad**

| # | Tarea | Responsable | Entregable | Tiempo est. |
|---|-------|-------------|------------|:-----------:|
| 7 | **Sistema de reseñas**: Implementar reseñas de productos visibles en cada ficha | Felipe | Sistema funcional | 6h |
| 8 | **Reseñas iniciales**: Solicitar reseñas a los últimos 10-15 clientes que compraron (WhatsApp/email) | Dirección | Mínimo 10 reseñas reales | 2h |
| 9 | **Página "Sobre Nosotros" mejorada**: Fotos del local en Chía, foto del equipo, historia real, NIT visible | Felipe + Dirección | Página publicada | 3h |
| 10 | **Artículos de blog (2)**: Publicar 2 artículos SEO: "Mejores celulares gama media Colombia 2026" + "Cómo elegir un portátil para universidad" | Felipe | 2 artículos publicados | 4h |
| 11 | **Agregar blog al sitemap**: Incluir posts del blog en el sitemap dinámico para indexación en Google | Felipe | Sitemap actualizado | 30min |
| 12 | **Eliminar código legacy MeiliSearch**: Limpiar dependencias del motor de búsqueda anterior | Felipe | Código limpio | 1h |

**Meta de Semana 2:** Tienda con reseñas reales, página de confianza, primeros artículos de blog indexándose.

---

### 🟢 SEMANA 3 (14 - 18 de Abril) — "TRÁFICO"
**Objetivo: Empezar a atraer visitantes cualificados**

| # | Tarea | Responsable | Entregable | Tiempo est. |
|---|-------|-------------|------------|:-----------:|
| 13 | **Campaña Google Ads básica**: Configurar campaña de Shopping + búsqueda para productos estrella (3-5 productos) | Felipe | Campaña activa | 6h |
| 14 | **Primera campaña de Instagram/Facebook**: Artes publicitarios + campaña de tráfico apuntando a tecnophone.co (no a MercadoLibre) | Dirección + Felipe | Campaña activa | 4h |
| 15 | **Artículos de blog (2 más)**: "iPhone 16 vs Samsung S25: ¿cuál comprar?" + "5 accesorios imprescindibles para tu portátil" | Felipe | 2 artículos publicados | 4h |
| 16 | **Poblar catálogo +10 productos**: Seguir ampliando catálogo hasta 30 productos mínimo | Felipe + Dirección | 30 productos totales | 4h |
| 17 | **Cupones de descuento**: Crear sistema de cupones para primera compra (ej: BIENVENIDO10) | Felipe | Sistema de cupones activo | 3h |
| 18 | **Landing Día de la Madre**: Preparar landing especial (mayo) con productos regalo recomendados | Felipe | Landing lista | 3h |

**Meta de Semana 3:** Primeras campañas pagadas activas, 30 productos, cupón de bienvenida, landing estacional preparada.

---

### 🔵 SEMANA 4 (21 - 25 de Abril) — "CONVERSIÓN"
**Objetivo: Optimizar para cerrar ventas**

| # | Tarea | Responsable | Entregable | Tiempo est. |
|---|-------|-------------|------------|:-----------:|
| 19 | **Email de carrito abandonado**: Implementar notificación cuando un cliente deja productos en el carrito sin pagar | Felipe | Sistema automático activo | 6h |
| 20 | **PopUp de primera visita**: Ofrecer descuento o envío gratis a cambio de email (base de datos de clientes) | Felipe | PopUp activo | 3h |
| 21 | **Cross-selling en carrito**: "Clientes que compraron esto también compraron..." | Felipe | Recomendaciones activas | 4h |
| 22 | **Artículos de blog (2 más)**: Contenido estacional pre-Día de la Madre | Felipe | 2 artículos publicados | 4h |
| 23 | **Revisar métricas primera quincena**: Analizar GA4 — qué páginas tienen más visitas, dónde abandonan, qué buscan | Felipe | Informe de métricas | 2h |
| 24 | **Campaña retargeting**: Configurar campaña que muestre anuncios a quienes visitaron la tienda sin comprar | Felipe | Retargeting activo | 3h |

**Meta de Semana 4:** Sistema de recuperación de carritos, retargeting activo, primer informe de métricas real.

---

## 4. METAS MEDIBLES — ABRIL 2026

| Indicador (KPI) | Meta Abril | Cómo se mide |
|------------------|:----------:|--------------|
| Productos publicados en la tienda | ≥ 30 | WooCommerce |
| Artículos de blog publicados | ≥ 6 | WordPress |
| Visitas únicas a tecnophone.co | ≥ 1,000 | Google Analytics 4 |
| Reseñas de clientes publicadas | ≥ 10 | Sección de reseñas |
| Ventas generadas desde la web (no ML) | ≥ 5 | MercadoPago + WooCommerce |
| Carritos creados (intent de compra) | ≥ 30 | Google Analytics 4 |
| Suscriptores de email capturados | ≥ 50 | Base de datos |
| Presupuesto publicitario ejecutado | Por definir | Google Ads + Meta |

---

## 5. PLAN MAYO — JUNIO 2026 (VISTA GENERAL)

### Mayo 2026 — "ESCALAR"
- 🎁 **Campaña Día de la Madre** (segunda semana de mayo) — Landing especial + campaña pagada
- 📦 Catálogo a 50+ productos
- 📝 8 artículos de blog adicionales
- 📊 Segundo informe de métricas con comparativo vs. abril
- 🔄 Optimizar campañas según datos de abril (qué funcionó, qué no)
- 💬 Implementar notificaciones push para ofertas

### Junio 2026 — "CONSOLIDAR"
- 👨‍💼 Programa de fidelidad para clientes recurrentes
- ⭐ Sistema de reviews avanzado con fotos de clientes
- 📧 Newsletter mensual automático con ofertas
- 🎯 Campaña de Día del Padre
- 📊 Tercer informe con análisis de ROI publicitario

---

## 6. ROLES ACTUALES Y VALORACIÓN DE MERCADO

Actualmente, una sola persona está ejecutando funciones que en cualquier empresa de e-commerce son desempeñadas por **un equipo de mínimo 3-4 profesionales**. A continuación se detalla cada rol con su valor de mercado en Colombia (fuentes: ElEmpleo, Computrabajo, LinkedIn Colombia, 2026):

| Rol | Funciones ejecutadas | Salario mercado (mensual) |
|-----|---------------------|:-------------------------:|
| **Desarrollador Full-Stack** (Next.js/React/Node.js) | Construcción completa de tienda headless, APIs, integraciones MercadoPago/Algolia/Servientrega, middleware, seguridad | $4.500.000 — $8.000.000 COP |
| **Administrador Web / Webmaster** | Gestión de WordPress/WooCommerce, publicación de productos, imágenes, categorías, mantenimiento diario | $1.800.000 — $2.500.000 COP |
| **Especialista SEO y Contenidos** | Redacción de artículos blog, metadatos, sitemap, optimización para buscadores e IAs, landing pages | $2.000.000 — $3.500.000 COP |
| **Soporte técnico / Help desk** | Resolución de problemas de hosting, dominios, SSL, debugging producción, atención técnica | $1.500.000 — $2.200.000 COP |
| **Gestor de Marketplace** | Publicación y gestión de productos en MercadoLibre y Falabella, atención de preguntas, gestión de ventas | $1.800.000 — $2.500.000 COP |

### Resumen de valor de mercado:

| Concepto | Valor |
|----------|:-----:|
| Valor mínimo de mercado por los 5 roles combinados | **$11.600.000 COP/mes** |
| Valor promedio de mercado | **$15.000.000 — $18.700.000 COP/mes** |
| Compensación actual recibida | **$1.423.500 COP/mes (SMLV)** |
| Comisiones reconocidas por ventas MercadoLibre/Falabella | **$0** |
| Bono | **Reducido** |

> **Nota:** Estos valores son verificables en cualquier portal de empleo colombiano. No se trata de una queja sino de un dato objetivo de mercado que es importante considerar para la sostenibilidad del departamento de e-commerce.

### Trabajo técnico entregado con valor de proyecto independiente:

Si el desarrollo de la tienda headless se hubiera contratado como **proyecto externo** con una agencia o freelancer:

| Concepto | Valor estimado en el mercado colombiano |
|----------|:---------------------------------------:|
| Desarrollo tienda headless e-commerce (~1,000 horas) | $35.000.000 — $55.000.000 COP |
| Integración MercadoPago completa (tarjetas, Nequi, PSE, cuotas) | $3.000.000 — $5.000.000 COP |
| Integración búsqueda Algolia | $2.000.000 — $3.000.000 COP |
| Asistente AI con conocimiento de inventario | $3.000.000 — $5.000.000 COP |
| Rastreo Servientrega (ingeniería inversa sin documentación) | $2.000.000 — $3.000.000 COP |
| SEO técnico + 5 landing pages + llms.txt | $3.000.000 — $5.000.000 COP |
| Páginas legales (investigación legal colombiana + redacción) | $1.500.000 — $2.500.000 COP |
| Auditoría de seguridad + implementación | $2.000.000 — $4.000.000 COP |
| **TOTAL valor de proyecto** | **$51.500.000 — $82.500.000 COP** |

---

## 7. PROPUESTA DE REESTRUCTURACIÓN DEL CARGO

Para que el plan de activación comercial de abril funcione y sea sostenible, es necesario formalizar la relación laboral de acuerdo a las funciones reales desempeñadas.

### Situación actual insostenible:

| Concepto | Dato |
|----------|:----:|
| Funciones desempeñadas | 5 roles simultáneos (desarrollo, admin web, SEO, soporte, marketplaces) |
| Compensación actual | $1.423.500 COP/mes (SMLV) |
| Valor de mercado por los mismos roles | $11.600.000 — $18.700.000 COP/mes |
| Diferencia | Se está pagando el **8% — 12%** del valor real de mercado |
| Comisiones MercadoLibre/Falabella reconocidas | $0 |
| Bono | Reducido vs. condiciones anteriores |
| Ofertas laborales externas actuales | ~$5.000.000 — $6.000.000 COP/mes (solo desarrollo) |

> **Realidad:** La compensación actual no es competitiva ni sostenible. Existen ofertas laborales concretas en el mercado por 4 veces el salario actual, para ejecutar solo **una** de las cinco funciones que se desempeñan aquí. Continuar bajo las condiciones actuales no es viable.

### Opción A — Cargo integral (recomendada):
| Concepto | Propuesta |
|----------|:---------:|
| Cargo | Líder de E-Commerce y Desarrollo Web |
| Salario base | $4.000.000 — $5.000.000 COP/mes |
| Comisión por ventas web | 3% — 5% sobre ventas generadas en tecnophone.co |
| Comisión por ventas marketplace | 2% — 3% sobre ventas en MercadoLibre y Falabella |
| Bono trimestral por cumplimiento de KPIs | $500.000 COP si se cumplen las metas del trimestre |
| Incluye | Todos los roles actuales + plan de activación comercial completo |

### Opción B — Solo desarrollo web (funciones reducidas):
| Concepto | Propuesta |
|----------|:---------:|
| Cargo | Desarrollador Web / Webmaster |
| Salario base | $3.500.000 — $4.000.000 COP/mes |
| Funciones | Desarrollo, mantenimiento web, SEO técnico y blog |
| Se retira de | Gestión de MercadoLibre, Falabella, soporte técnico general, atención al cliente |

### Si no se llega a un acuerdo — Riesgo de continuidad:

Es importante que la Dirección considere el costo real de una transición si no se logra un acuerdo:

| Concepto | Costo / Impacto |
|----------|:---------------:|
| Contratar un reemplazo con las mismas capacidades | $4.500.000 — $8.000.000 COP/mes (solo desarrollo) |
| Contratar agencia para mantener la tienda headless | $3.000.000 — $6.000.000 COP/mes |
| Tiempo de onboarding de un reemplazo | 2 — 4 meses antes de ser productivo |
| Riesgo de caída de la tienda durante transición | Alto — el codebase es custom, sin documentación de traspaso |
| Costo de reconstruir con agencia externa | $51.500.000 — $82.500.000 COP (valor proyecto documentado arriba) |
| Ventas perdidas durante transición | Incalculable — tienda offline = $0 en ventas web |
| Gestión de MercadoLibre y Falabella sin gestor | Se necesitaría contratar a alguien adicional |

> **En resumen:** Reemplazar a una persona que ya conoce el sistema completo es significativamente más costoso que ajustar la compensación a un nivel justo de mercado.

### Fecha límite para definición:

Se solicita respetuosamente una definición sobre la reestructuración del cargo **antes del 4 de abril de 2026**, para poder planificar adecuadamente — tanto la ejecución del plan de activación comercial como las decisiones personales y profesionales correspondientes.

> **Nota:** La opción que se elija definirá el alcance real del plan de abril. Las tareas de desarrollo, campañas y estrategia digital que se detallan en las secciones anteriores requieren un perfil y compensación acorde a la Opción A o B.

---

## 8. RESPONSABILIDADES CLARAS

| Área | Responsable | Detalle |
|------|-------------|---------|
| **Desarrollo web y técnico** | Felipe | Implementar funcionalidades, SEO técnico, integraciones, mantenimiento |
| **Contenido de producto** | Felipe + Dirección | Fichas, fotos, precios, stock — requiere info de Dirección sobre qué productos publicar |
| **Contenido editorial (blog)** | Felipe | Redacción de artículos SEO |
| **Campañas publicitarias** | Felipe (ejecución) + Dirección (presupuesto y aprobación) | Google Ads, Meta Ads, retargeting |
| **Decisiones de catálogo** | Dirección | Qué productos publicar, precios, modelo (stock vs. bajo pedido) |
| **Reseñas y contenido social** | Dirección | Contactar clientes para reseñas, fotos del local, contenido para redes |
| **Presupuesto publicitario** | Dirección | Definir inversión mensual en ads |

---

## 9. RECURSOS NECESARIOS (DECISIONES DE DIRECCIÓN)

Para ejecutar este plan, se requieren las siguientes decisiones de la Dirección:

| Decisión | Por qué es necesaria | Fecha límite |
|----------|---------------------|:------------:|
| **Lista de productos a publicar** (mín. 30) | No se puede poblar catálogo sin saber qué productos ofrecer y a qué precio | 31 marzo |
| **Modelo de venta web**: ¿Solo productos en stock o también "bajo pedido"? | Define cómo se publica el catálogo | 31 marzo |
| **Presupuesto mensual para publicidad** (recomendado: $300.000 - $500.000 COP para empezar) | Sin inversión en ads, el tráfico depende 100% del SEO orgánico que toma meses | 1 abril |
| **Fotos del local físico y del equipo** | Necesarias para la página "Sobre Nosotros" y generar confianza | 4 abril |
| **Contactos de últimos clientes** para solicitar reseñas | No tengo acceso a la base de clientes | 7 abril |
| **Aprobación de cupón de bienvenida** (ej: 10% primera compra) | Impacta margen, requiere aprobación de Dirección | 14 abril |

---

## 10. PRESUPUESTO ESTIMADO DE OPERACIÓN

| Concepto | Costo Mensual | Nota |
|----------|:-------------:|------|
| Vercel (hosting tienda) | $0 — $80.000 COP | Plan gratuito puede funcionar inicialmente |
| Algolia (búsqueda) | $0 | 10K búsquedas/mes gratis |
| Groq (asistente AI) | $0 | Plan gratuito |
| Google Ads | $300.000 — $500.000 COP | Recomendado para arrancar |
| Meta Ads (Instagram/Facebook) | $200.000 — $400.000 COP | Recomendado para arrancar |
| MercadoPago | Comisión ~3.5% por venta | Sin costo fijo |
| **Total estimado inversión publicitaria** | **$500.000 — $900.000 COP/mes** | Ajustable según resultados |

---

## 11. FORMATO DE SEGUIMIENTO SEMANAL

A partir de abril, se enviará un informe semanal de avance con este formato:

```
📊 INFORME SEMANAL — TecnoPhone E-Commerce
Semana: [fecha]
───────────────────────────────
✅ Completado esta semana:
- [tarea 1]
- [tarea 2]

📈 Métricas:
- Visitas: [número]
- Carritos creados: [número]
- Ventas web: [número]
- Artículos publicados: [número]

🎯 Plan próxima semana:
- [tarea 1]
- [tarea 2]

⚠️ Bloqueantes (requieren decisión de Dirección):
- [si aplica]
```

---

## 12. CONCLUSIÓN

La infraestructura técnica de la tienda está **lista y funcionando en producción** — velocidad superior al 95% de tiendas de tecnología en Colombia, SEO técnico, pagos integrados, seguridad auditada. Es un activo tecnológico real con un valor de proyecto de **$51 — $82 millones COP**.

El plan de activación comercial de abril está diseñado para convertir esa infraestructura en un **canal de venta activo** en 4 semanas, con metas medibles y seguimiento semanal.

Sin embargo, hay dos realidades que deben abordarse con transparencia:

1. **La activación comercial requiere un profesional comprometido y con las capacidades adecuadas.** Ese profesional ya está aquí, ya conoce el sistema, y ya demostró capacidad de ejecución durante 3 meses de desarrollo intensivo.

2. **La compensación actual ($1.423.500/mes por 5 roles) no es competitiva con el mercado.** Existen ofertas concretas por 4 veces ese valor para ejecutar solo una fracción de las funciones actuales. No es una amenaza — es un dato de mercado que hace insostenible la situación actual.

Llegar a un acuerdo justo beneficia a ambas partes: la empresa retiene a quien construyó y conoce todo el sistema (evitando costos y riesgos de transición), y el profesional recibe una compensación acorde a su aporte real.

**Se solicita una definición sobre la reestructuración del cargo antes del 4 de abril de 2026.**

El compromiso sigue siendo el mismo: resultados visibles, métricas reales, transparencia total — dentro de un marco laboral justo.

---

*Propuesta preparada el 27 de marzo de 2026.*
*Disponible para reunión de aclaración cuando la Dirección lo considere necesario.*
*Plan sujeto a las decisiones de Dirección indicadas en la sección 7.*
