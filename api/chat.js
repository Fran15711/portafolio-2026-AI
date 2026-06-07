// ================================================================
// api/chat.js — Vercel Serverless Function
// Asistente del portafolio de Francisco Noriega
// ================================================================
//
// ARQUITECTURA DE CONTEXTO:
//   Los tres archivos .md de la raíz del proyecto se leen UNA VEZ
//   al arrancar el módulo (cold start). No hay I/O por request.
//
//   francisco-profile.md   → datos duros, experiencia, resultados,
//                             herramientas y trayectoria verificable.
//   francisco-narrative.md → motivaciones, evolución profesional,
//                             forma de pensar y tono humano.
//   assistant-rules.md     → tono, límites, formato y veracidad.
//
// Para que Vercel incluya los .md en el bundle serverless, vercel.json
// debe declarar:  "includeFiles": "*.md"  dentro de la función.
//
// VARIABLES DE ENTORNO (Vercel → Settings → Environment Variables):
//   OPENAI_API_KEY  (obligatoria)   Clave secreta. Nunca llega al frontend.
//   OPENAI_MODEL    (opcional)      Default: gpt-4o-mini
//   ALLOWED_ORIGIN  (opcional)      CORS origin. Default: '*'
// ================================================================

import fs   from 'fs';
import path from 'path';

// ── 1. Carga de archivos de contexto ─────────────────────────────
// process.cwd() en Vercel apunta a la raíz del proyecto desplegado.

/**
 * Intenta leer un archivo .md desde la raíz del proyecto.
 * @returns {{ content: string } | { error: string }}
 */
function tryLoad(filename) {
  try {
    const filepath = path.join(process.cwd(), filename);
    const content  = fs.readFileSync(filepath, 'utf-8');
    if (!content.trim()) {
      return { error: `${filename} está vacío` };
    }
    return { content: content.trim() };
  } catch (err) {
    return { error: `No se pudo leer ${filename}: ${err.message}` };
  }
}

// Cargar al inicio del módulo (una vez por cold start)
const CONTEXT = {
  rules:     tryLoad('assistant-rules.md'),
  profile:   tryLoad('francisco-profile.md'),
  narrative: tryLoad('francisco-narrative.md'),
};

// ── 2. Construir el system prompt ─────────────────────────────────
// Si cualquier archivo falla, SYSTEM_PROMPT queda null y el handler
// devuelve 503 con el detalle del error (sin revelar paths internos).

function buildSystemPrompt() {
  const errors = Object.entries(CONTEXT)
    .filter(([, v]) => v.error)
    .map(([k, v]) => v.error);

  if (errors.length > 0) {
    console.error('[chat] Archivos de contexto faltantes:', errors.join(' | '));
    return null;
  }

  return [
    '# INSTRUCCIONES DEL ASISTENTE',
    CONTEXT.rules.content,
    '',
    '# PERFIL PROFESIONAL',
    '<!-- Datos duros, experiencia verificable, resultados y herramientas -->',
    CONTEXT.profile.content,
    '',
    '# CONTEXTO NARRATIVO',
    '<!-- Motivaciones, evolución profesional, forma de pensar, tono humano -->',
    CONTEXT.narrative.content,
  ].join('\n');
}

const SYSTEM_PROMPT = buildSystemPrompt();

// Registrar en logs de Vercel qué archivos cargaron (útil para debug)
console.log('[chat] Estado de archivos de contexto:', {
  rules:     CONTEXT.rules.error     ? `ERROR: ${CONTEXT.rules.error}`     : 'OK',
  profile:   CONTEXT.profile.error   ? `ERROR: ${CONTEXT.profile.error}`   : 'OK',
  narrative: CONTEXT.narrative.error ? `ERROR: ${CONTEXT.narrative.error}` : 'OK',
  promptBuilt: SYSTEM_PROMPT !== null,
});

// ── 3. Límites de entrada ─────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY        = 6;

// ── 4. Handler principal ──────────────────────────────────────────
export default async function handler(req, res) {

  // ── CORS ──
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin',  origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ── Verificar que todos los archivos .md estén disponibles ──
  if (!SYSTEM_PROMPT) {
    // En producción solo decimos que falta configuración.
    // En desarrollo (NODE_ENV=development) exponemos el detalle.
    const detail = Object.entries(CONTEXT)
      .filter(([, v]) => v.error)
      .map(([k, v]) => `${k}: ${v.error}`)
      .join('; ');

    return res.status(503).json({
      error: 'El asistente no está disponible: falta contexto de configuración.',
      ...(process.env.NODE_ENV === 'development' && { detail }),
    });
  }

  // ── Sin API key → 503 (el frontend usa respuestas simuladas) ──
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Asistente no configurado todavía' });
  }

  // ── Parsear body de forma segura ──
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const message = body.message;
  let   history = Array.isArray(body.history) ? body.history : [];

  // ── Validar pregunta ──
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'La pregunta es demasiado larga (máximo 500 caracteres)' });
  }

  // ── Sanitizar historial: roles válidos + recorte + longitud ──
  history = history
    .filter(m =>
      m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string'
    )
    .slice(-MAX_HISTORY)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // ── Llamada a OpenAI (fetch nativo — cero dependencias) ──
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
          { role: 'system',    content: SYSTEM_PROMPT },
          ...history,
          { role: 'user',      content: message.trim() },
        ],
        max_tokens:  400,
        temperature: 0.6,
      }),
    });

    if (!upstream.ok) {
      // No revelar detalles de OpenAI al cliente
      console.error('[chat] OpenAI respondió', upstream.status);
      return res.status(502).json({ error: 'El asistente no está disponible ahora mismo' });
    }

    const data  = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({ error: 'Respuesta vacía del asistente' });
    }

    return res.status(200).json({ reply: reply.trim() });

  } catch (err) {
    // Nunca exponer el stack trace al cliente
    console.error('[chat] error interno:', err?.message);
    return res.status(500).json({ error: 'Error interno del asistente' });
  }
}
