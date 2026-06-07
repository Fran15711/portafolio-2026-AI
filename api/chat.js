// ================================================================
// api/chat.js — Vercel Serverless Function
// Asistente editorial del portafolio de Francisco Noriega
// ================================================================
//
// ARQUITECTURA DE CONTEXTO:
//   Los tres archivos .md de la raíz se leen UNA VEZ al cold start.
//   No hay I/O por request.
//
//   francisco-profile.md   → datos duros, experiencia, resultados,
//                             herramientas y trayectoria verificable.
//   francisco-narrative.md → motivaciones, evolución profesional,
//                             forma de pensar, tono humano.
//   assistant-rules.md     → tono, límites, formato y veracidad.
//
//   vercel.json debe declarar "includeFiles": "*.md" en la función
//   para que los .md entren al bundle serverless.
//
// VARIABLES DE ENTORNO:
//   OPENAI_API_KEY  (obligatoria)
//   OPENAI_MODEL    (opcional, default: gpt-4o-mini)
//   ALLOWED_ORIGIN  (opcional, default: '*')
// ================================================================

import fs   from 'fs';
import path from 'path';

// ── 1. Carga de archivos de contexto ─────────────────────────────

function tryLoad(filename) {
  try {
    const filepath = path.join(process.cwd(), filename);
    const content  = fs.readFileSync(filepath, 'utf-8');
    if (!content.trim()) return { error: `${filename} está vacío` };
    return { content: content.trim() };
  } catch (err) {
    return { error: `No se pudo leer ${filename}: ${err.message}` };
  }
}

const CONTEXT = {
  rules:     tryLoad('assistant-rules.md'),
  profile:   tryLoad('francisco-profile.md'),
  narrative: tryLoad('francisco-narrative.md'),
};

// ── 2. Instrucciones base de tono y formato ───────────────────────
// Este bloque va ANTES que los archivos .md. Es la capa de control
// que no puede ser sobreescrita por el contenido del portafolio.

const FORMAT_INSTRUCTIONS = `
Eres un asistente editorial del portafolio profesional de Francisco Noriega.
Tu función es ayudar a quien visita el portafolio a entender quién es Francisco,
qué ha hecho, qué puede comprobar y si encaja con lo que buscan.

IDENTIDAD:
No eres Francisco. Hablas sobre Francisco, no como Francisco.
No eres un bot de soporte. Eres un presentador inteligente y honesto.
Tienes criterio editorial: sabes distinguir entre dato, lectura estratégica y anécdota.

FORMATO — REGLAS ABSOLUTAS:
- Texto limpio, sin Markdown. Cero ###, cero **, cero tablas, cero listas largas.
- Párrafos cortos. Dos o tres oraciones por párrafo como máximo.
- Máximo 120 a 180 palabras en una respuesta normal.
- Si el usuario pide "dame detalle", "profundiza" o "explícalo completo", puedes
  extenderte. En ese caso, máximo 300 palabras y sigue sin Markdown.
- Nunca empieces con "Claro que sí", "Por supuesto", "Aquí te detallo",
  "Entendido", "¡Hola!" ni ninguna frase de apertura genérica.
- Termina cuando hayas dicho lo que hay que decir. Sin remates tipo
  "Si tienes más preguntas, estoy aquí" o "Espero haberte ayudado".

TONO:
- Directo, inteligente, humano. Con algo de filo pero sin arrogancia.
- Profesional sin sonar corporativo. Franco sin sonar grosero.
- Cero frases de currículum inflado: "apasionado", "proactivo", "orientado
  a resultados", "sinergia", "soluciones innovadoras", "líder visionario".
- No suenes como vendedor desesperado. No infles ni exageres.
- No digas que Francisco hizo todo solo. Los resultados de Galga son atribuidos
  a un sistema de marketing-ventas, no a una sola persona.

VERACIDAD:
- No inventes experiencias, métricas, herramientas ni fechas.
- Si algo no está en el perfil o la narrativa, dilo claramente: no lo tienes.
- Distingue cuando das un dato comprobado vs. una lectura estratégica.
- Si el usuario pregunta algo fuera del portafolio, redirige con amabilidad pero
  sin disculparte en exceso.
- Las métricas de Galga son las únicas cifras de revenue/ROI que puedes citar.
  No generes números nuevos.

EVIDENCIA:
- Cuando sea relevante, menciona que hay evidencias reales en el portafolio:
  reportes, capturas, cartas de recomendación, links a proyectos.
- No inventes links. Los links están en el portafolio, no en este chat.

EJEMPLO DE RESPUESTA MALA:
"Francisco es un profesional apasionado y orientado a resultados con amplia
experiencia en marketing digital. Su trayectoria demuestra liderazgo y compromiso..."

EJEMPLO DE RESPUESTA BUENA:
"Lo más comprobable de Francisco está en Galga. Ahí no solo hay piezas bonitas:
hay reportes de ventas atribuidas a marketing, ROI medido, SEO, campañas y mejoras
reales al sitio. El portafolio está diseñado para que no tengas que creerle por
currículum, sino ver la evidencia directamente."
`;

// ── 3. Construir el system prompt completo ────────────────────────

function buildSystemPrompt() {
  const errors = Object.entries(CONTEXT)
    .filter(([, v]) => v.error)
    .map(([, v]) => v.error);

  if (errors.length > 0) {
    console.error('[chat] Archivos de contexto faltantes:', errors.join(' | '));
    return null;
  }

  return [
    FORMAT_INSTRUCTIONS.trim(),
    '',
    '---',
    '## PERFIL PROFESIONAL (datos duros, experiencia verificable, resultados)',
    CONTEXT.profile.content,
    '',
    '---',
    '## CONTEXTO NARRATIVO (motivaciones, evolución, forma de pensar, tono)',
    CONTEXT.narrative.content,
    '',
    '---',
    '## REGLAS ADICIONALES DEL ASISTENTE',
    CONTEXT.rules.content,
  ].join('\n');
}

const SYSTEM_PROMPT = buildSystemPrompt();

console.log('[chat] Estado de contexto:', {
  rules:       CONTEXT.rules.error     ? `ERROR: ${CONTEXT.rules.error}`     : 'OK',
  profile:     CONTEXT.profile.error   ? `ERROR: ${CONTEXT.profile.error}`   : 'OK',
  narrative:   CONTEXT.narrative.error ? `ERROR: ${CONTEXT.narrative.error}` : 'OK',
  promptBuilt: SYSTEM_PROMPT !== null,
});

// ── 4. Limpieza de Markdown residual ─────────────────────────────
// Si el modelo devuelve Markdown a pesar de las instrucciones,
// lo limpiamos aquí antes de enviarlo al frontend.

function stripMarkdown(text) {
  return text
    // Encabezados: ### Título → Título
    .replace(/^#{1,6}\s+/gm, '')
    // Negrita/cursiva: **texto** o __texto__ → texto
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g,     '$1')
    .replace(/\*(.+?)\*/g,     '$1')
    .replace(/_(.+?)_/g,       '$1')
    // Código inline: `texto` → texto
    .replace(/`(.+?)`/g, '$1')
    // Bloques de código: ```...``` → contenido sin marcadores
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```\w*\n?/g, '').trim()
    )
    // Líneas que son solo --- o === (separadores horizontales)
    .replace(/^[-=*]{3,}\s*$/gm, '')
    // Bullets al inicio de línea: "- item" o "* item" → "item"
    // Solo limpia bullets sueltos; no destruye oraciones con guiones
    .replace(/^[\s]*[-*•]\s+/gm, '')
    // Listas numeradas: "1. texto" → "texto"
    .replace(/^\d+\.\s+/gm, '')
    // Links Markdown: [texto](url) → texto
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Múltiples saltos de línea → máximo dos
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── 5. Límites de entrada ─────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY        = 6;

// ── 6. Detectar si el usuario pide una respuesta extendida ────────
const EXPAND_PATTERNS = [
  /dame (más )?detalle/i,
  /profundiza/i,
  /explícalo (completo|más|a fondo)/i,
  /cuéntame más/i,
  /amplia/i,
  /desarrolla/i,
  /más información/i,
];

function userWantsExpanded(message) {
  return EXPAND_PATTERNS.some(p => p.test(message));
}

// ── 7. Handler principal ──────────────────────────────────────────
export default async function handler(req, res) {

  // CORS
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin',  origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar que el system prompt se construyó correctamente
  if (!SYSTEM_PROMPT) {
    const detail = Object.entries(CONTEXT)
      .filter(([, v]) => v.error)
      .map(([k, v]) => `${k}: ${v.error}`)
      .join('; ');

    return res.status(503).json({
      error: 'El asistente no está disponible: falta contexto de configuración.',
      ...(process.env.NODE_ENV === 'development' && { detail }),
    });
  }

  // Sin API key
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Asistente no configurado todavía' });
  }

  // Parsear body
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const message = body.message;
  let   history = Array.isArray(body.history) ? body.history : [];

  // Validar pregunta
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'La pregunta es demasiado larga (máximo 500 caracteres)' });
  }

  // Sanitizar historial
  history = history
    .filter(m =>
      m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string'
    )
    .slice(-MAX_HISTORY)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  // Ajustar tokens según si pide respuesta extendida
  const expanded  = userWantsExpanded(message.trim());
  const maxTokens = expanded ? 600 : 280;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // Llamada a OpenAI
  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user',   content: message.trim() },
        ],
        max_tokens:  maxTokens,
        temperature: 0.65,
      }),
    });

    if (!upstream.ok) {
      console.error('[chat] OpenAI respondió', upstream.status);
      return res.status(502).json({ error: 'El asistente no está disponible ahora mismo' });
    }

    const data  = await upstream.json();
    const raw   = data?.choices?.[0]?.message?.content;

    if (!raw) {
      return res.status(502).json({ error: 'Respuesta vacía del asistente' });
    }

    // Limpiar Markdown residual antes de devolver
    const reply = stripMarkdown(raw);

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('[chat] error interno:', err?.message);
    return res.status(500).json({ error: 'Error interno del asistente' });
  }
}
