// ================================================================
// api/chat.js — Vercel Serverless Function
// Asistente del portafolio de Francisco Noriega
// ================================================================
//
// QUÉ HACE:
//   Recibe   POST  { message: string, history?: [{role, content}] }
//   Devuelve       { reply: string }
//
// VARIABLES DE ENTORNO (Vercel → Settings → Environment Variables):
//   OPENAI_API_KEY  (obligatoria)  Clave secreta de OpenAI. NUNCA va al frontend.
//   OPENAI_MODEL    (opcional)     Modelo. Default: gpt-4o-mini
//   ALLOWED_ORIGIN  (opcional)     Origen permitido para CORS. Default: '*'
//
// COMPORTAMIENTO SIN API KEY:
//   Si OPENAI_API_KEY no está configurada, responde 503.
//   El frontend (script.js) detecta el fallo y usa sus respuestas
//   simuladas (mock) automáticamente. No se rompe nada.
//
// POR QUÉ EL CONTEXTO ESTÁ EMBEBIDO Y NO SE LEE DE UN .md:
//   El bundler de Vercel (Node File Trace) solo incluye archivos
//   referenciados estáticamente. Un fs.readFileSync dinámico puede
//   dejar el .md fuera del bundle salvo que configures includeFiles.
//   Embeber el contexto como constante es zero-I/O, zero-dependencia
//   y siempre funciona. Para actualizar el perfil, edita las
//   constantes RULES y PROFILE de abajo.
// ================================================================

// ---- REGLAS DEL ASISTENTE ----
const RULES = `
Eres el ASISTENTE del portafolio de Francisco Noriega. No eres Francisco.
Hablas SOBRE Francisco en tercera persona.

TONO:
- Profesional, claro y humano. Directo, sin rodeos.
- Sin signos de exclamación innecesarios. Sin emojis.
- Si la pregunta es corta, responde corto (1 a 3 frases). Máximo unas 5 frases.
- Evita clichés de currículum: nada de "apasionado", "proactivo",
  "orientado a resultados", "sinergia", "soluciones innovadoras".

REGLAS ESTRICTAS:
- NO inventes experiencia, certificaciones, métricas ni datos que no estén abajo.
- NO hables como si fueras Francisco. Nunca digas "yo hice"; di "Francisco...".
- Si no tienes la información, dilo con elegancia y sugiere explorar el
  portafolio o escribirle directamente.
- Prioriza evidencias y links comprobables del portafolio.
- Si preguntan algo ajeno al portafolio o a Francisco, redirige con amabilidad.
- Las cifras de Galga Maquinaria son las únicas métricas de revenue/ROI que
  puedes citar. No generes números nuevos.
`;

// ---- PERFIL (datos reales del portafolio) ----
const PROFILE = `
=== PERFIL DE FRANCISCO NORIEGA ===

RESUMEN:
Profesional de marketing con experiencia en growth, contenido, performance,
branding, SEO, automatización e IA aplicada. Ha trabajado en agencia y del lado
del cliente con 23 marcas en sectores muy distintos. Trabaja con evidencia: tiene
reportes, métricas y links comprobables de la mayoría de sus proyectos.

EXPERIENCIA:
- Galga Maquinaria (2024-2025, ACTUAL) — Marketing Performance / Growth.
  Revenue atribuido a marketing: $26,136,692.93 MXN.
  ROI real: 1,226%.
  ROI de la categoria estrella (Mimaki Impresion): 64.7x.
  Inversion total (ads + estructura): $1,801,203.58 MXN.
  Responsabilidades: SEO, Google Ads, contenido B2B, analitica, reportes ejecutivos.
  Evidencia: reporte anual 2025 y mejora organica en Semrush (en la seccion Experiencia / Galga).
- Evacolors — Estrategia "They Ask, You Answer", HubSpot, blog SEO, videos de
  ventas, presentaciones, redes y activaciones. Tiene carta de recomendacion.
- Mercadoctor (agencia) — Contenido para 15+ marcas, branding, SEO, TikTok, Reels,
  guiones, KPIs, naming. Dio cursos internos de IA y Copywriting. Carta de recomendacion.
- Mex7 Boots — Encargado de Marketing completo: estrategia, branding, redes, SEO,
  diseno web, ads, e-commerce Shopify, ferias de calzado. Carta de recomendacion.

CERTIFICACIONES (verificables, con link en la seccion Certificaciones):
- Google Ads Search Professional (Google Skillshop).
- Email Marketing (HubSpot Academy).
- Marketing de Contenidos (HubSpot Academy).
- Ingles C1 (SmallTalk2Me).

MARCAS TRABAJADAS (23, con evidencias en la seccion Proyectos):
Centinela, Denver Icy, Evacolors, Italian Coffee Leon, Chimirica, Mex7 Boots,
Bikia, Mercadoctor, Ecoparque Providencia, Plaza Norte, Wellness No Brand, Rocarent,
Paseo Morelos, Acabados del Pacifico, Campestre Providencia, 11inks, Suma Lift,
Agro Guanajuato, Tortigama, Vallua, Torre Neen, Slider Desarrollos,
Dra. Karen Kelly Odontopediatra.
Tipos de evidencia disponibles: posts, videos, blogs SEO, sitios web / e-commerce,
presentaciones, mailing, naming, investigacion de mercado, comercial de radio,
campanas con influencers, expos, endomarketing, mistery shopper.

HERRAMIENTAS:
Google Ads, HubSpot, SEMrush, Meta Business, Shopify, WordPress, Google Analytics,
Looker Studio. Construyo este portafolio en HTML, CSS y JavaScript puro.
Usa IA en copywriting, analisis y automatizacion de reportes.

METRICAS DE VIDA LABORAL (aproximadas, tono humano; NO son KPIs de negocio):
~300 blogs escritos, ~1,700 cafes, ~11,900 ideas aplicadas, ~157 proyectos terminados.

IDIOMAS: Espanol nativo, Ingles C1.

CONTACTO: francisconoriegaret15@gmail.com (seccion Contacto del portafolio).
`;

const SYSTEM_PROMPT = RULES + '\n' + PROFILE;

// ---- Límites ----
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 6;

export default async function handler(req, res) {
  // ---- CORS ----
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Sin API key → 503 (el frontend usa el mock)
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Asistente no configurado todavía' });
  }

  // ---- Parsear body de forma segura ----
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const message = body.message;
  let history = Array.isArray(body.history) ? body.history : [];

  // ---- Validar la pregunta ----
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'La pregunta es demasiado larga' });
  }

  // ---- Sanitizar historial: roles válidos + recorte ----
  history = history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // ---- Llamada a OpenAI (fetch nativo, sin dependencias) ----
  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: message.trim() }
        ],
        max_tokens: 400,
        temperature: 0.6
      })
    });

    if (!completion.ok) {
      // No revelar detalles de OpenAI al cliente
      console.error('[chat] OpenAI respondió', completion.status);
      return res.status(502).json({ error: 'El asistente no está disponible ahora mismo' });
    }

    const data = await completion.json();
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    if (!reply) {
      return res.status(502).json({ error: 'Respuesta vacía del asistente' });
    }

    return res.status(200).json({ reply: reply.trim() });

  } catch (err) {
    // Nunca exponer el error crudo (puede contener detalles internos)
    console.error('[chat] error:', err && err.message);
    return res.status(500).json({ error: 'Error interno del asistente' });
  }
}
