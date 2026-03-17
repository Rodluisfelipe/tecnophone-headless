import { NextRequest, NextResponse } from 'next/server';
import { searchProductsDetailed } from '@/lib/woocommerce';
import { rateLimit } from '@/lib/rate-limit';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ProductSuggestion {
  name: string;
  slug: string;
  image: string;
  price: string;
  salePrice: string;
  onSale: boolean;
  externalUrl?: string;
}

// Extract search keywords from natural language Spanish
function extractKeywords(text: string): string {
  const stopWords = new Set([
    'busco', 'quiero', 'necesito', 'dame', 'muestrame', 'muéstrame', 'tengo', 'tienes',
    'tienen', 'hay', 'ver', 'enseñame', 'enséñame', 'recomienda', 'recomendame',
    'recomiéndame', 'algo', 'algún', 'algun', 'alguna', 'algunos',
    'un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las', 'lo', 'le', 'les',
    'de', 'del', 'para', 'por', 'con', 'sin', 'en', 'que', 'qué', 'cual', 'cuál',
    'me', 'mi', 'mis', 'te', 'tu', 'tus', 'se', 'su', 'sus', 'nos',
    'más', 'mas', 'muy', 'poco', 'mucho', 'bastante',
    'buen', 'bueno', 'buena', 'buenos', 'buenas', 'mejor', 'mejores',
    'precio', 'costo', 'económico', 'economico', 'económica', 'economica',
    'barato', 'barata', 'baratos', 'baratas', 'caro', 'cara',
    'hola', 'gracias', 'porfa', 'favor', 'por', 'quisiera', 'podría', 'podria',
    'puedes', 'puede', 'podrías', 'podrias',
    'estoy', 'buscando', 'interesa', 'interesado', 'interesada',
    'como', 'cómo', 'donde', 'dónde', 'cuando', 'cuándo',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
    'ser', 'estar', 'tener', 'hacer',
    'y', 'o', 'e', 'u', 'ni', 'no', 'si', 'sí', 'ya',
    'bien', 'mal', 'aquí', 'aqui', 'ahí', 'ahi', 'allí', 'alli',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[¿?¡!.,;:()"']/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  return words.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 messages per minute per IP (Groq costs money)
    const limited = rateLimit(request, { name: 'ai-chat', max: 10, windowMs: 60_000 });
    if (limited) return limited;

    const body = await request.json();
    const message: string = body.message?.trim();
    const rawHistory: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    // Input size limits
    if (message.length > 1000) {
      return NextResponse.json({ error: 'Mensaje demasiado largo (máx 1000 caracteres)' }, { status: 400 });
    }

    // Validate and sanitize history roles — only allow 'user' and 'assistant'
    const history: ChatMessage[] = rawHistory
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m) => ({ role: m.role, content: String(m.content || '').slice(0, 2000) }));

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    // Extract keywords from user message for better WooCommerce search
    const keywords = extractKeywords(message);
    const searchQuery = keywords || message;

    // Search products - try with keywords first, fallback to individual words
    let products = await searchProductsDetailed(searchQuery, 8);

    // If no results with combined keywords, try individual keywords
    if (products.length === 0 && keywords.includes(' ')) {
      const individualWords = keywords.split(' ');
      for (const word of individualWords) {
        if (word.length >= 3) {
          products = await searchProductsDetailed(word, 8);
          if (products.length > 0) break;
        }
      }
    }

    // Build product catalog context — include full description for specs questions
    const stripHtml = (html: string) => html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() || '';

    const catalogContext = products.length > 0
      ? products.map((p) => {
          const shortDesc = stripHtml(p.short_description).slice(0, 500);
          const longDesc = stripHtml(p.description).slice(0, 1500);
          // Merge: use longDesc if it has substantially more info
          const fullSpecs = longDesc.length > shortDesc.length + 50 ? longDesc : shortDesc;

          return {
            name: p.name,
            slug: p.slug,
            price: p.price,
            regular_price: p.regular_price,
            sale_price: p.sale_price,
            on_sale: p.on_sale,
            stock_status: p.stock_status,
            image: p.images?.[0]?.src || '',
            brand: p.brand?.name || '',
            categories: (p.categories || []).map((c) => c.name).filter(Boolean).join(', '),
            specs: fullSpecs,
          };
        })
      : [];

    const systemPrompt = `Eres "Tecno", el asistente virtual de TecnoPhone, tienda de tecnología en Chía, Colombia. Eres amigable, experto en tecnología y servicial. Respondes SIEMPRE en español.

INFORMACIÓN DE LA TIENDA:
- Ubicación: Chía, Cundinamarca, Colombia
- WhatsApp: +57 313 229 4533
- Envío gratis en compras desde $500.000
- Envío a todo Colombia (1-3 días hábiles, Bogotá puede ser mismo día)
- Métodos de pago: Transferencia bancaria, MercadoPago
- Garantía oficial en todos los productos

CATÁLOGO DISPONIBLE (${catalogContext.length} productos encontrados):
${catalogContext.length > 0 ? JSON.stringify(catalogContext, null, 2) : 'No se encontraron productos. Sugiere al usuario buscar con otras palabras como: portátil, monitor, celular, tablet, auriculares, teclado, mouse, impresora, etc.'}

REGLAS:
1. Responde SIEMPRE en español. Sé conciso pero informativo.
2. Usa emojis ocasionalmente para ser amigable 😊
3. Si el usuario pregunta por ESPECIFICACIONES, CARACTERÍSTICAS, DETALLES TÉCNICOS o FICHA TÉCNICA de un producto: usa el campo "specs" del catálogo para dar información detallada (procesador, RAM, almacenamiento, pantalla, batería, etc.). Sé específico con los datos técnicos.
4. Si el usuario pregunta de forma general ("busco un portátil", "muéstrame celulares"): menciona nombre, precio, y si tiene descuento. Sé breve (2-3 oraciones + sugerencias).
5. Si hay productos en el catálogo, SIEMPRE sugiere los más relevantes usando sus slugs exactos.
6. Si NO hay productos, sugiere al usuario buscar con palabras clave específicas.
7. NUNCA inventes productos, precios ni especificaciones que no estén en el catálogo.
8. NUNCA devuelvas slugs duplicados.
9. Si el usuario pregunta por envío, pagos, garantía o información de la tienda, responde con la información de arriba.
10. Si el usuario compara productos, usa los specs para hacer una comparación útil.

FORMATO (JSON estricto, sin markdown):
{"reply": "tu respuesta", "suggestedSlugs": ["slug-1", "slug-2"]}

suggestedSlugs: array con slugs EXACTOS del catálogo (máx 4). Array vacío si no hay productos relevantes.`;

    // Build messages array with history (last 6 messages)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    // Call Groq API
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);

      // If model not found, retry with fallback model
      if (groqResponse.status === 404 || errorText.includes('model')) {
        const fallbackResponse = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 1024,
            response_format: { type: 'json_object' },
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackContent = fallbackData.choices?.[0]?.message?.content || '{}';
          let fallbackParsed: { reply?: string; suggestedSlugs?: string[] };
          try {
            fallbackParsed = JSON.parse(fallbackContent);
          } catch {
            fallbackParsed = { reply: fallbackContent, suggestedSlugs: [] };
          }

          const fallbackReply = fallbackParsed.reply || 'No entendí tu pregunta, ¿podrías reformularla? 🤔';
          const fallbackSlugs = Array.isArray(fallbackParsed.suggestedSlugs) ? fallbackParsed.suggestedSlugs : [];
          const uniqueFallbackSlugs = Array.from(new Set(fallbackSlugs));
          const fallbackProducts: ProductSuggestion[] = products
            .filter((p) => uniqueFallbackSlugs.includes(p.slug))
            .map((p) => ({
              name: p.name,
              slug: p.slug,
              image: p.images?.[0]?.src || '',
              price: p.price,
              salePrice: p.sale_price || '',
              onSale: p.on_sale,
              externalUrl: p.type === 'external' ? p.external_url : undefined,
            }));

          return NextResponse.json({ reply: fallbackReply, products: fallbackProducts });
        }
      }

      return NextResponse.json(
        { reply: 'Lo siento, tengo un problema técnico. Intenta de nuevo en unos momentos. 🙏', products: [] },
        { status: 200 }
      );
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content || '{}';

    let parsed: { reply?: string; suggestedSlugs?: string[] };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { reply: rawContent, suggestedSlugs: [] };
    }

    const reply = parsed.reply || 'No entendí tu pregunta, ¿podrías reformularla? 🤔';
    const suggestedSlugsRaw = Array.isArray(parsed.suggestedSlugs) ? parsed.suggestedSlugs : [];
    const suggestedSlugs = Array.from(new Set(suggestedSlugsRaw));

    // Match suggested slugs against fetched products
    const suggestedProducts: ProductSuggestion[] = suggestedSlugs
      .map((slug) => products.find((p) => p.slug === slug))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, 4)
      .map((p) => ({
        name: p.name,
        slug: p.slug,
        image: p.images?.[0]?.src || '',
        price: p.price,
        salePrice: p.sale_price,
        onSale: p.on_sale,
        externalUrl: p.external_url || undefined,
      }));

    return NextResponse.json({ reply, products: suggestedProducts });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { reply: 'Ocurrió un error inesperado. Intenta de nuevo. 🙏', products: [] },
      { status: 200 }
    );
  }
}
