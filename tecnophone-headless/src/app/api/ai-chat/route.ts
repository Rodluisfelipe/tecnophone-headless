import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/woocommerce';

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
    const body = await request.json();
    const message: string = body.message?.trim();
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    // Extract keywords from user message for better WooCommerce search
    const keywords = extractKeywords(message);
    const searchQuery = keywords || message;

    // Search products - try with keywords first, fallback to individual words
    let products = await searchProducts(searchQuery, 8);

    // If no results with combined keywords, try individual keywords
    if (products.length === 0 && keywords.includes(' ')) {
      const individualWords = keywords.split(' ');
      for (const word of individualWords) {
        if (word.length >= 3) {
          products = await searchProducts(word, 8);
          if (products.length > 0) break;
        }
      }
    }

    // Build product catalog context
    const catalogContext = products.length > 0
      ? products.map((p) => ({
          name: p.name,
          slug: p.slug,
          price: p.price,
          regular_price: p.regular_price,
          sale_price: p.sale_price,
          on_sale: p.on_sale,
          stock_status: p.stock_status,
          image: p.images?.[0]?.src || '',
          short_description: p.short_description?.replace(/<[^>]*>/g, '').slice(0, 120) || '',
          brand: p.brand?.name || '',
        }))
      : [];

    const systemPrompt = `Eres "Tecno", el asistente virtual de TecnoPhone, tienda de tecnología en Chía, Colombia. Eres amigable y servicial. Respondes SIEMPRE en español.

CATÁLOGO DISPONIBLE (${catalogContext.length} productos encontrados):
${catalogContext.length > 0 ? JSON.stringify(catalogContext, null, 2) : 'No se encontraron productos. Sugiere al usuario buscar con otras palabras como: portátil, monitor, celular, tablet, auriculares, teclado, mouse, impresora, etc.'}

REGLAS:
1. Responde SIEMPRE en español, sé conciso (2-3 oraciones máximo + sugerencias)
2. Usa emojis ocasionalmente para ser amigable
3. Si hay productos en el catálogo, SIEMPRE sugiere los más relevantes usando sus slugs exactos, incluso si no cumplen todos los criterios subjetivos del usuario (como "barato" o "gamer"), pero menciónalo amablemente.
4. Si NO hay productos en absoluto, sugiere al usuario buscar con palabras clave específicas del producto (ej: "portátil", "monitor", "celular")
5. Menciona nombre, precio y si tiene descuento al sugerir
6. NUNCA inventes productos que no estén en el catálogo
7. NUNCA devuelvas slugs duplicados.

FORMATO (JSON estricto, sin markdown):
{"reply": "tu respuesta", "suggestedSlugs": ["slug-1", "slug-2"]}

suggestedSlugs: array con slugs EXACTOS del catálogo (máx 4). Array vacío si no hay productos.`;

    // Build messages array with history (last 6 messages)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
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
          const uniqueFallbackSlugs = [...new Set(fallbackSlugs)];
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
