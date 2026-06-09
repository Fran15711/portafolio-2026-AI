/* ================================================================
   FRANCISCO NORIEGA · PORTAFOLIO
   script.js — Interactividad completa
   Modular · Defensivo · Preparado para Vercel + OpenAI
   ================================================================ */

(function () {
  'use strict';

  /* Clase .js síncrona: antes de DOMContentLoaded */
  document.documentElement.classList.add('js');

  /* ============================================================
   * 0. CONFIGURACIÓN
   * ============================================================ */
  const CFG = {
    splashDuration:     5300,   // ms — duración normal del splash
    splashReducedMotion: 600,   // ms — con prefers-reduced-motion
    typingSpeed:          42,   // ms / caracter al escribir
    deletingSpeed:        26,   // ms / caracter al borrar
    pauseAfterType:     1900,   // ms — pausa tras completar frase
    pauseBeforeType:     420,   // ms — pausa antes de empezar a escribir
    chatMaxLength:       500,   // chars máximos en textarea
    chatCooldown:       1500,   // ms — anti-spam
    counterDuration:    1800,   // ms — animación de contadores
    scrollThreshold:      60,   // px — scroll para activar navbar
    maxParticles:         55,   // cursor trail
    api:          '/api/chat',
    trackUrl:     'https://script.google.com/macros/s/AKfycbx0k6TAsmluVViDj2hxQp2GaucT88WtSvpckj7uPcLtCd68omY6W6fmZx-a7x2aZtdr/exec',
  };

  /* ============================================================
   * 1. DETECCIÓN DE ENTORNO
   * ============================================================ */
  const reducedMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  /* ============================================================
   * 1b. i18n — diccionario ES / EN
   * ============================================================ */
  let LANG = 'es';
  function getLang() { return LANG; }

  const I18N = {
    es: {
      'splash.greeting': 'Hola.',
      'splash.l1': 'Si estás viendo esto, quiero trabajar contigo.',
      'splash.l2': 'Gracias por tu tiempo, tu interés y tu buena intuición.',
      'splash.l3': 'Este portafolio reúne evidencias y resultados de estrategias y proyectos de los que he sido responsable.',
      'splash.loading': 'Cargando portafolio',
      'splash.note': 'Versión en construcción — todavía estoy puliendo detalles.',
      'splash.skip': 'Saltar',
      'chat.title': 'Pregúntame antes de la entrevista.',
      'chat.sub': 'Es una pre-entrevista: pregúntame por mi experiencia, mis proyectos o qué hago fuera del trabajo.<br>Te responde una versión mía entrenada con todo lo que he hecho.',
      'chat.placeholder': 'Escríbeme una pregunta…',
      'chat.send': 'Enviar pregunta',
      'chat.disclaimer_pre': 'El asistente puede cometer errores. Para información exacta, revisa las evidencias o ',
      'chat.disclaimer_link': 'escríbeme directamente',
      'chat.scrollInvite': 'O explora el portafolio directamente ↓',
      'chat.error': 'Algo falló de mi lado. Puedes intentar de nuevo o escribirme directo por correo.',
      'mv.hint': 'Arrastra para rotar',
      'chips': [
        { q: '¿Cómo piensas?',                   t: 'como_piensas' },
        { q: '¿Qué tan medible es tu trabajo?',  t: 'trabajo_medible' },
        { q: '¿Qué harías en mi equipo?',        t: 'que_harias_equipo' },
      ],
      'typewriter': [
        'Pregúntame qué hay detrás del CV…',
        'Pregúntame cómo pienso cuando entro a un problema…',
        'Pregúntame qué resultados puedo comprobar sin adornos…',
        'Pregúntame cómo convertí Galga en un sistema medible…',
        'Pregúntame por qué mi perfil mezcla creatividad, datos y ventas…',
        'Pregúntame cómo uso IA sin vender humo…',
        'Pregúntame qué aprendí empezando desde cero…',
        'Pregúntame cómo trabajo con ventas cuando los leads no sirven…',
      ],
    },
    en: {
      'splash.greeting': 'Hello.',
      'splash.l1': "If you're seeing this, I want to work with you.",
      'splash.l2': 'Thank you for your time, your interest and your good instinct.',
      'splash.l3': "This portfolio brings together evidence and results from strategies and projects I've been responsible for.",
      'splash.loading': 'Loading portfolio',
      'splash.note': "Work in progress — I'm still polishing details.",
      'splash.skip': 'Skip',
      'chat.title': 'Interview me before the interview.',
      'chat.sub': "It's a pre-interview: ask me about my experience, my projects, or what I do outside of work.<br>You're talking to a version of me trained on everything I've done.",
      'chat.placeholder': 'Ask me a question…',
      'chat.send': 'Send question',
      'chat.disclaimer_pre': 'The assistant can make mistakes. For exact details, check the evidence or ',
      'chat.disclaimer_link': 'reach out directly',
      'chat.scrollInvite': 'Or explore the portfolio directly ↓',
      'chat.error': 'Something broke on my end. Try again, or email me directly.',
      'mv.hint': 'Drag to rotate',
      'chips': [
        { q: 'How do you think?',                 t: 'how_you_think' },
        { q: 'How measurable is your work?',      t: 'work_measurable' },
        { q: 'What would you do on my team?',     t: 'on_my_team' },
      ],
      'typewriter': [
        'Ask me what sits behind the résumé…',
        'Ask me how I think when I enter a messy problem…',
        'Ask me what results I can prove without dressing them up…',
        'Ask me how I turned Galga into a more measurable system…',
        'Ask me why my profile mixes creativity, data and sales…',
        'Ask me how I use AI without the hype…',
        'Ask me what I learned by starting from zero…',
        'Ask me how I work with sales when the leads are not good enough…',
      ],
    },
  };

  function t(key) {
    const d = I18N[LANG] || I18N.es;
    return d[key] != null ? d[key] : (I18N.es[key] != null ? I18N.es[key] : key);
  }

  /* Detecta idioma: ?lang= > localStorage > navegador > 'es' */
  function detectAndApplyLang() {
    let lang = 'es';
    try {
      const q = new URLSearchParams(window.location.search).get('lang');
      const saved = localStorage.getItem('fn-lang');
      if (q === 'en' || q === 'es') lang = q;
      else if (saved === 'en' || saved === 'es') lang = saved;
      else if ((navigator.language || '').toLowerCase().startsWith('en')) lang = 'en';
    } catch (_) {}
    applyLanguage(lang, { silent: true });
  }

  /* Aplica idioma a TODA la interfaz */
  function applyLanguage(lang, opts = {}) {
    LANG = (lang === 'en') ? 'en' : 'es';
    try { localStorage.setItem('fn-lang', LANG); } catch (_) {}
    document.documentElement.lang = LANG;

    const d = I18N[LANG];

    /* Texto, HTML, placeholders y aria-labels marcados con data-i18n* */
    qsa('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n; if (d[k] != null) el.textContent = d[k];
    });
    qsa('[data-i18n-html]').forEach(el => {
      const k = el.dataset.i18nHtml; if (d[k] != null) el.innerHTML = d[k];
    });
    qsa('[data-i18n-ph]').forEach(el => {
      const k = el.dataset.i18nPh; if (d[k] != null) el.setAttribute('placeholder', d[k]);
    });
    qsa('[data-i18n-aria]').forEach(el => {
      const k = el.dataset.i18nAria; if (d[k] != null) el.setAttribute('aria-label', d[k]);
    });

    /* Chips sugeridos */
    updateChips();

    /* Botones de idioma (navbar + splash) */
    qsa('#lang-btn-es, #splash-lang-es').forEach(b => {
      b.classList.toggle('is-active', LANG === 'es');
      b.setAttribute('aria-pressed', String(LANG === 'es'));
    });
    qsa('#lang-btn-en, #splash-lang-en').forEach(b => {
      b.classList.toggle('is-active', LANG === 'en');
      b.setAttribute('aria-pressed', String(LANG === 'en'));
    });

    /* Reiniciar typewriter para que tome las frases del nuevo idioma */
    if (!opts.silent) {
      restartTypewriter();
      replaySplash();   // replay del splash con el texto del nuevo idioma
    }
  }

  function updateChips() {
    const chipsEl = qs('#chat-chips');
    if (!chipsEl) return;
    const chips = qsa('.chat__chip', chipsEl);
    const defs  = I18N[LANG].chips || [];
    chips.forEach((chip, i) => {
      if (defs[i]) {
        chip.textContent = defs[i].q;
        chip.dataset.question   = defs[i].q;
        chip.dataset.trackLabel = defs[i].t;
      }
    });
  }


  /* ============================================================
   * 2. SESIÓN + TRACKING (modelo de sesión)
   * ============================================================ */
  const TRACK_DEBUG = true;   // false en producción para silenciar consola

  const SESSION = {
    id:        _sid(),
    visitorId: _getVisitorId(),   // persiste entre sesiones (misma pestaña/device)
    startTime: Date.now(),
    utm:       {},
    ctx:       {},
    /* acumuladores para el resumen de sesión */
    sectionsSeen:          new Set(),
    sectionDurations:      {},     // { sectionId: ms acumulados }
    currentSection:        null,
    sectionEnterTime:      null,
    projectsClicked:       [],
    evidenceClicked:       [],
    certificationsClicked: [],
    chatQuestions:         [],
    externalLinksClicked:  [],
    contactClicked:        false,
    cvClicked:             false,
    modelViewerInteracted: false,
    started:               false,
    ended:                 false,
  };

  function _sid() {
    return 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  /* visitor_id persiste en localStorage — permite identificar visitas repetidas
     del mismo navegador sin IP ni cookies de terceros                           */
  function _getVisitorId() {
    try {
      let vid = localStorage.getItem('fn-vid');
      if (!vid) {
        vid = 'vid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem('fn-vid', vid);
      }
      return vid;
    } catch { return 'vid_unknown'; }
  }

  function captureUrlParams() {
    const p = new URLSearchParams(window.location.search);
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']
      .forEach(k => { if (p.has(k)) SESSION.utm[k] = p.get(k); });
    ['company','role','source']
      .forEach(k => { if (p.has(k)) SESSION.ctx[k] = p.get(k); });
  }

  function deviceInfo() {
    const ua = navigator.userAgent || '';
    let device = 'desktop';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) device = 'tablet';
    else if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) device = 'mobile';
    let browser = 'otro';
    if (/Edg\//.test(ua))            browser = 'Edge';
    else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
    else if (/Chrome\//.test(ua))    browser = 'Chrome';
    else if (/Firefox\//.test(ua))   browser = 'Firefox';
    else if (/Safari\//.test(ua))    browser = 'Safari';
    return { device, browser };
  }

  /* ============================================================
   * 3. TRACKING — envío a Google Sheets (Apps Script)
   * ============================================================ */
  function trackEvent(name, data = {}) {
    const payload = {
      event_name: name,
      timestamp:  new Date().toISOString(),
      session_id: SESSION.id,
      language:   getLang(),
      page_url:   window.location.href,
      ...data,
    };

    if (TRACK_DEBUG) console.log('[track \u2192]', name, payload);

    sendTracking(payload, name === 'session_end');
  }

  function sendTracking(payload, preferBeacon) {
    const url = CFG.trackUrl;
    if (!url) { if (TRACK_DEBUG) console.warn('[track] TRACKING_ENDPOINT vacío — no se envía'); return; }
    const body = JSON.stringify(payload);
    try {
      if (preferBeacon && navigator.sendBeacon) {
        const ok = navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
        if (TRACK_DEBUG) console.log('[track] sendBeacon:', ok ? 'enviado' : 'FALLÓ');
        return;
      }
      fetch(url, {
        method:    'POST',
        mode:      'no-cors',
        keepalive: true,
        headers:   { 'Content-Type': 'text/plain;charset=UTF-8' },
        body,
      }).then(() => { if (TRACK_DEBUG) console.log('[track] fetch enviado (no-cors)'); })
        .catch(err => { if (TRACK_DEBUG) console.warn('[track] fetch error:', err); });
    } catch (e) {
      if (TRACK_DEBUG) console.warn('[track] excepción:', e);
    }
  }

  /* ── Inicio de sesión ── */
  function startSession() {
    if (SESSION.started) return;   // nunca disparar session_start dos veces
    SESSION.started = true;
    captureUrlParams();
    const { device, browser } = deviceInfo();
    trackEvent('session_start', {
      visitor_id:   SESSION.visitorId,
      referrer:     document.referrer || '',
      utm_source:   SESSION.utm.utm_source   || '',
      utm_medium:   SESSION.utm.utm_medium   || '',
      utm_campaign: SESSION.utm.utm_campaign || '',
      company:      SESSION.ctx.company || '',
      role:         SESSION.ctx.role   || '',
      source:       SESSION.ctx.source || '',
      device, browser,
      viewport:     window.innerWidth + 'x' + window.innerHeight,
    });
  }

  /* ── Tiempo por sección ── */
  function flushSectionTime() {
    if (SESSION.currentSection && SESSION.sectionEnterTime) {
      const dt = Date.now() - SESSION.sectionEnterTime;
      SESSION.sectionDurations[SESSION.currentSection] =
        (SESSION.sectionDurations[SESSION.currentSection] || 0) + dt;
    }
    SESSION.sectionEnterTime = Date.now();
  }
  function setCurrentSection(id) {
    if (SESSION.currentSection === id) return;
    flushSectionTime();
    SESSION.currentSection = id;
    SESSION.sectionEnterTime = Date.now();
  }

  /* ── Fin de sesión con resumen ── */
  function endSession() {
    if (SESSION.ended) return;
    SESSION.ended = true;
    flushSectionTime();

    const durations = {};
    let topSection = '', topSecs = 0;
    Object.keys(SESSION.sectionDurations).forEach(k => {
      const s = Math.round(SESSION.sectionDurations[k] / 1000);
      durations[k] = s;
      if (s > topSecs) { topSecs = s; topSection = k; }
    });

    trackEvent('session_end', {
      duration_seconds:       Math.round((Date.now() - SESSION.startTime) / 1000),
      sections_seen:          Array.from(SESSION.sectionsSeen),
      section_durations:      durations,
      top_section:            topSection,
      top_section_seconds:    topSecs,
      projects_clicked:       SESSION.projectsClicked,
      evidence_clicked:       SESSION.evidenceClicked,
      certifications_clicked: SESSION.certificationsClicked,
      chat_questions:         SESSION.chatQuestions,
      external_links_clicked: SESSION.externalLinksClicked,
      contact_clicked:        SESSION.contactClicked,
      cv_clicked:             SESSION.cvClicked,
      model_viewer_interacted:SESSION.modelViewerInteracted,
    });
  }

  /* ── Helpers que trackean Y acumulan para el resumen ── */
  function trackProjectClick(id, name, category) {
    if (name && SESSION.projectsClicked.indexOf(name) === -1) SESSION.projectsClicked.push(name);
    trackEvent('project_click', { project_id: id, project_name: name, category: category || '' });
  }
  function trackEvidenceClick(projectName, label, url) {
    if (label) SESSION.evidenceClicked.push(label);
    trackEvent('evidence_click', { project_name: projectName, evidence_label: label, evidence_url: url });
  }
  function trackCertClick(name, url) {
    if (name) SESSION.certificationsClicked.push(name);
    trackEvent('certification_click', { certification_name: name, certification_url: url });
  }
  function trackChatQuestion(q) {
    if (q) SESSION.chatQuestions.push(q.slice(0, 160));
    trackEvent('chat_question', { question: (q || '').slice(0, 300) });
  }
  function trackExternalLink(label, url) {
    SESSION.externalLinksClicked.push(label || url);
    trackEvent('external_link_click', { link_label: label || '', link_url: url || '' });
  }
  function trackContactClick(label) {
    SESSION.contactClicked = true;
    trackEvent('contact_click', { element_label: label || '' });
  }
  function trackCvClick(label) {
    SESSION.cvClicked = true;
    trackEvent('cv_click', { element_label: label || '' });
  }
  function trackModelViewer() {
    if (SESSION.modelViewerInteracted) return;
    SESSION.modelViewerInteracted = true;
    trackEvent('model_viewer_interaction', {});
  }

  /* ============================================================
   * 4. UTILIDADES
   * ============================================================ */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* Escape de texto para prevenir XSS cuando se usa innerHTML */
  function sanitize(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  /* Limpieza básica de Markdown durante streaming (sin regex pesadas) */
  function stripMarkdownBasic(text) {
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g,     '$1')
      .replace(/\*(.+?)\*/g,     '$1')
      .replace(/`(.+?)`/g,       '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1');
  }

  /* Limpieza completa de Markdown para post-procesado final */
  function stripMarkdown(text) {
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g,     '$1')
      .replace(/\*(.+?)\*/g,     '$1')
      .replace(/_(.+?)_/g,       '$1')
      .replace(/`(.+?)`/g,       '$1')
      .replace(/```[\s\S]*?```/g, m => m.replace(/```\w*\n?/g, '').trim())
      .replace(/^[-=*]{3,}\s*$/gm, '')
      .replace(/^[\s]*[-*•·]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function throttle(fn, ms) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, args); }
    };
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  /* Formatea un número según data-* del elemento */
  function fmtCounter(value, format, suffix, compact) {
    if (format === 'currency') {
      const v = Math.round(value);
      if (compact && value >= 1_000_000)
        return '$' + (value / 1_000_000).toFixed(1) + 'M';
      if (compact && value >= 1_000)
        return '$' + (value / 1_000).toFixed(0) + 'K';
      return '$' + v.toLocaleString('es-MX');
    }
    if (suffix === '%') return Math.round(value).toLocaleString('es-MX') + '%';
    if (suffix === 'x') return value.toFixed(1) + 'x';
    return Math.round(value).toLocaleString('es-MX');
  }

  /* ¿La URL puede cargarse en un iframe? */
  function isFramable(url) {
    try {
      const host = new URL(url, window.location.href).hostname;
      return host === 'fran15711.github.io';
    } catch { return false; }
  }

  /* ============================================================
   * 5. HEX DATA — 23 marcas
   * Las URLs con [PLACEHOLDER] deben completarse antes de publicar.
   * ============================================================ */
  const BASE_IMG = 'https://raw.githubusercontent.com/Fran15711/backgroundsseccion3/refs/heads/main/';

  const hexData = [
    /* 0 – Centinela */
    { name:'Centinela', sector:'seguridad', sectorLabel:'Seguridad',
      img: BASE_IMG+'centi.jpg',
      desc:'Estrategia de redes sociales, posicionamiento de marca y fotografía corporativa para empresa de seguridad privada.',
      evidencias:[
        {tipo:'Comercial de radio',         label:'Comercial de Radio',                       url:'https://fran15711.github.io/radio/'},
        {tipo:'Posts',                       label:'Diseño y copy de posts',                   url:'https://fran15711.github.io/postscentinela1/'},
        {tipo:'Estrategia de Comunicación',  label:'Campaña de comunicación',                  url:'https://fran15711.github.io/estrategia-de-comunicacion-centinela/'},
        {tipo:'Investigación de mercado',    label:'Investigación de mercado y segmentación',  url:'https://fran15711.github.io/investigacioncentinela/'},
      ]},
    /* 1 – Denver Icy */
    { name:'Denver Icy', sector:'ropa', sectorLabel:'Ropa y calzado',
      img: BASE_IMG+'dvr1.jpg',
      desc:'Producción de contenido visual, video y redes para marca de ropa y calzado vaquero.',
      evidencias:[
        {tipo:'Campañas con Influencers',    label:'Campañas con Influencers',                 url:'https://fran15711.github.io/influencersdenver/'},
        {tipo:'Fotografía',                  label:'Shootings de producto y modelos',           url:'https://fran15711.github.io/shootingproductosdenver/'},
        {tipo:'Página web - E-commerce',     label:'Ecommerce Shopify, Mercado Libre y Amazon',url:'https://fran15711.github.io/ecommercedenver/'},
        {tipo:'Posts',                       label:'Campaña Bota Vaquera',                     url:'https://fran15711.github.io/botavaqueradenver/'},
      ]},
    /* 2 – Evacolors */
    { name:'Evacolors', sector:'manufactura', sectorLabel:'Manufactura',
      img: BASE_IMG+'eva.jpg',
      desc:'They Ask You Answer, HubSpot, blog SEO, videos de ventas y redes para fabricante de foam/foamy.',
      evidencias:[
        {tipo:'Expo',                        label:'Stand Expo Empaque Norte',                 url:'https://fran15711.github.io/standevacolors/'},
        {tipo:'Video',                       label:'Videos recursos para labor de ventas',     url:'https://www.youtube.com/@evacolors'},
        {tipo:'Presentación de Ventas',      label:'Presentación de ventas',                   url:'https://fran15711.github.io/presentacoinevacolors/'},
        {tipo:'Blog',                        label:'Blogs SEO',                                url:'https://blog.evacolors.com/'},
      ]},
    /* 3 – Italian Coffee */
    { name:'Italian Coffee', sector:'alimentos', sectorLabel:'Alimentos y bebidas',
      img: BASE_IMG+'ita.jpg',
      desc:'Contenido de marketing, endomarketing y mistery shopper para franquicia de cafeterías.',
      evidencias:[
        {tipo:'Posts',                       label:'Campañas de Marketing',                    url:'https://fran15711.github.io/postsitaliancoffee/'},
        {tipo:'Endomarketing',               label:'Endomarketing',                            url:'https://fran15711.github.io/endomarketing/'},
        {tipo:'Estrategia de Comunicación',  label:'Estrategia de Comunicación',               url:'https://fran15711.github.io/italianestrategiadecomunicacion/'},
        {tipo:'Mistery Shopper',             label:'Mistery Shopper',                          url:'https://fran15711.github.io/misteryshopper/'},
      ]},
    /* 4 – Chimirica */
    { name:'Chimirica', sector:'alimentos', sectorLabel:'Alimentos y bebidas',
      img: BASE_IMG+'chi.jpg',
      desc:'Naming, investigación de mercado, estrategia y redes para marca de chimichurri.',
      evidencias:[
        {tipo:'Investigación de mercado',    label:'Investigación de mercado',                 url:'https://fran15711.github.io/investigaciondemercadochimirica/'},
        {tipo:'Posts',                       label:'Posts Redes Sociales',                     url:'https://fran15711.github.io/postschimirica/'},
        {tipo:'Estrategia de Comunicación',  label:'Estrategia de Comunicación',               url:'https://fran15711.github.io/estrategiadecomunicacionchimirica/'},
        {tipo:'Investigación de mercado',    label:'Análisis de Empaques',                     url:'https://fran15711.github.io/morfologiadeempaques/'},
      ]},
    /* 5 – Mex7 Boots */
    { name:'Mex7 Boots', sector:'ropa', sectorLabel:'Ropa y calzado',
      img: BASE_IMG+'mex7.jpg',
      desc:'Marketing completo: redes, catálogo, prospección y giveaway para fabricante de botas vaqueras.',
      evidencias:[
        {tipo:'Posts',                       label:'Posts Redes Sociales',                     url:'https://fran15711.github.io/postsmex7boots/'},
        {tipo:'Investigación de mercado',    label:'Prospección de clientes',                  url:'https://fran15711.github.io/postsmex7boots/'},
        {tipo:'Presentación de Ventas',      label:'Catálogo',                                 url:'https://fran15711.github.io/catalogomex7boots/'},
        {tipo:'Posts',                       label:'Giveaway Instagram',                       url:'https://www.instagram.com/p/CYWrMtgrqSt/?img_index=1'},
      ]},
    /* 6 – Bikia */
    { name:'Bikia', sector:'inmobiliario', sectorLabel:'Inmobiliario',
      img: BASE_IMG+'bikia.jpg',
      desc:'Memorias de la Andrade, cuadríptico, redes y web para desarrollo vertical en Colonia Andrade.',
      evidencias:[
        {tipo:'Investigación de mercado',    label:'Memorias de la Andrade',                   url:'https://fran15711.github.io/memoriasdelandrade/'},
        {tipo:'Presentación de Ventas',      label:'Cuadríptico',                              url:'https://fran15711.github.io/cuadripticobka/'},
        {tipo:'Posts',                       label:'Posts redes sociales',                     url:'https://fran15711.github.io/postsbikia/'},
        {tipo:'Página web - E-commerce',     label:'Página web',                               url:'https://bikia.mx/'},
      ]},
    /* 7 – Mercadoctor */
    { name:'Mercadoctor', sector:'agencia', sectorLabel:'Agencia de marketing',
      img: BASE_IMG+'mdr.jpg',
      desc:'Mailing, videos, estrategia y blog SEO para agencia de innovación y marketing.',
      evidencias:[
        {tipo:'Mailing',                     label:'Mailing',                                  url:'https://fran15711.github.io/mdrmailing/'},
        {tipo:'Video',                       label:'Videos',                                   url:'https://www.youtube.com/watch?v=2Hd1Rdo8umw'},
        {tipo:'Estrategia de Comunicación',  label:'Estrategia de Comunicación',               url:'https://fran15711.github.io/estrategiamdr/'},
        {tipo:'Blog',                        label:'Blog SEO',                                 url:'https://mercadr.com/blog/'},
      ]},
    /* 8 – Ecoparque Providencia */
    { name:'Ecoparque Prov.', sector:'turismo', sectorLabel:'Turismo y hospedaje',
      img: BASE_IMG+'prveco.jpg',
      desc:'Estrategia, redes, web y video para ecoparque de aventura en la Sierra de Durango.',
      evidencias:[
        {tipo:'Estrategia de Comunicación',  label:'Estrategia de Comunicación',               url:'https://fran15711.github.io/estrategiadecomunicacionprveco/'},
        {tipo:'Posts',                       label:'Posts Providencia',                        url:'https://fran15711.github.io/postsprveco/'},
        {tipo:'Página web - E-commerce',     label:'Sitio Web Ecoparque Providencia',          url:'https://ecoparqueprovidencia.com/'},
        {tipo:'Video',                       label:'Video Ecoparque',                          url:'https://fran15711.github.io/videoprv/'},
      ]},
    /* 9 – Plaza Norte */
    { name:'Plaza Norte', sector:'retail', sectorLabel:'Plaza comercial',
      img: BASE_IMG+'plazanorte.jpg',
      desc:'Videos de activaciones, video marca Camila y presentación de ventas para plaza comercial.',
      evidencias:[
        {tipo:'Video',                       label:'Videos de Activaciones',                   url:'https://fran15711.github.io/activacionesplazanorte/'},
        {tipo:'Video',                       label:'Videos Camila',                            url:'https://fran15711.github.io/videocamila/'},
        {tipo:'Presentación de Ventas',      label:'Presentación de Ventas',                   url:'https://fran15711.github.io/presentacionplazanorte/'},
      ]},
    /* 10 – Wellness NB */
    { name:'Wellness NB', sector:'salud', sectorLabel:'Salud y bienestar',
      img: BASE_IMG+'wnb.jpg',
      desc:'Posts, blog, video y sitio web para marca de aceites esenciales para mujeres.',
      evidencias:[
        {tipo:'Posts',                       label:'Posts Facebook/Instagram',                 url:'https://fran15711.github.io/postsWNB/'},
        {tipo:'Blog',                        label:'Blog',                                     url:'https://wellnessnobrand.com/blog-2/'},
        {tipo:'Video',                       label:'Video',                                    url:'https://www.youtube.com/watch?v=lNGgUKzngfs&t=6s'},
        {tipo:'Página web - E-commerce',     label:'Sitio web',                                url:'https://wellnessnobrand.com/'},
      ]},
    /* 11 – Rocarent */
    { name:'Rocarent', sector:'arrendamiento', sectorLabel:'Arrendamiento',
      img: BASE_IMG+'roc.jpg',
      desc:'Analytics e investigación de mercado + recorrido UX para empresa de arrendamiento puro.',
      evidencias:[
        {tipo:'Investigación de mercado',    label:'Investigación de mercado',                 url:'https://fran15711.github.io/analyticsrocarent/'},
        {tipo:'Página web - E-commerce',     label:'Recorrido UX',                             url:'https://fran15711.github.io/UXrocarent/'},
      ]},
    /* 12 – Paseo Morelos */
    { name:'Paseo Morelos', sector:'retail', sectorLabel:'Plaza comercial',
      img: BASE_IMG+'paseomorelos.jpg',
      desc:'Posts de redes sociales para plaza comercial en zona noreste de León.',
      evidencias:[
        {tipo:'Posts',                       label:'Posts Facebook/Instagram',                 url:'https://fran15711.github.io/postspaseomorelos/'},
      ]},
    /* 13 – Acabados del Pacífico */
    { name:'Acabados Pac.', sector:'construccion', sectorLabel:'Materiales y construcción',
      img: BASE_IMG+'aco.jpg',
      desc:'Mailing, posts, sitio web y presentación de ventas para empresa de materiales de barro en Sinaloa.',
      evidencias:[
        {tipo:'Mailing',                     label:'Mailing',                                  url:'https://fran15711.github.io/mailingaco/'},
        {tipo:'Posts',                       label:'Posts Facebook/Instagram',                 url:'https://fran15711.github.io/postsaco/'},
        {tipo:'Página web - E-commerce',     label:'Sitio Web',                                url:'https://acabadosdelpacifico.com/'},
        {tipo:'Presentación de Ventas',      label:'Presentación de ventas',                   url:'https://fran15711.github.io/presentacionaco/'},
      ]},
    /* 14 – Campestre Providencia */
    { name:'Campestre Prov.', sector:'turismo', sectorLabel:'Turismo y hospedaje',
      img: BASE_IMG+'prvcam.jpg',
      desc:'Posts y web para empresa de venta y renta de cabañas en la Sierra de Durango.',
      evidencias:[
        {tipo:'Posts',                       label:'Posts Facebook',                           url:'https://fran15711.github.io/postprocamp/'},
        {tipo:'Página web - E-commerce',     label:'Página web',                               url:'https://campestreprovidencia.com/'},
      ]},
    /* 15 – 11inks */
    { name:'11inks', sector:'arte', sectorLabel:'Arte y decoración',
      img: BASE_IMG+'11INKS.jpg',
      desc:'Página web para empresa fabricante y vendedora de arte decorativo.',
      evidencias:[
        {tipo:'Página web - E-commerce',     label:'Página web',                               url:'https://11inks.com/'},
      ]},
    /* 16 – Suma Lift */
    { name:'Suma Lift', sector:'maquinaria', sectorLabel:'Maquinaria',
      img: BASE_IMG+'sum.jpg',
      desc:'Posts de redes para empresa de renta y venta de montacargas.',
      evidencias:[
        {tipo:'Posts',                       label:'Posts Facebook',                           url:'https://fran15711.github.io/sumposts/'},
      ]},
    /* 17 – Agro Guanajuato */
    { name:'Agro Guanajuato', sector:'agroalimentario', sectorLabel:'Agroalimentario',
      img: BASE_IMG+'agro.jpg',
      desc:'Página web para empresa de venta y distribución de plántula en Guanajuato.',
      evidencias:[
        {tipo:'Página web - E-commerce',     label:'Página web',                               url:'https://agrogto.com/'},
      ]},
    /* 18 – Tortigama */
    { name:'Tortigama', sector:'maquinaria', sectorLabel:'Maquinaria',
      img: BASE_IMG+'tortiga.jpg',
      desc:'Página web para empresa de venta de maquinaria e insumos para hacer tortillas.',
      evidencias:[
        {tipo:'Página web - E-commerce',     label:'Página web',                               url:'https://tortigama.com/'},
      ]},
    /* 19 – Vallua */
    { name:'Vallua', sector:'inmobiliario', sectorLabel:'Inmobiliario',
      img: BASE_IMG+'val.jpg',
      desc:'Naming de la marca y página web para empresa de avalúos.',
      evidencias:[
        {tipo:'Naming',                      label:'Naming de la marca',                       url:'https://vallua.mx/somos-vallua/'},
        {tipo:'Página web - E-commerce',     label:'Página web',                               url:'https://vallua.mx/'},
      ]},
    /* 20 – Torre Neen */
    { name:'Torre Neen', sector:'inmobiliario', sectorLabel:'Inmobiliario',
      img: BASE_IMG+'neen.jpg',
      desc:'Naming y página web para desarrollo vertical en zona norte de León.',
      evidencias:[
        {tipo:'Naming',                      label:'Naming de la marca',                       url:'https://torreneen.com/'},
        {tipo:'Página web - E-commerce',     label:'Página web',                               url:'https://torreneen.com/'},
      ]},
    /* 21 – Slider Desarrollos */
    { name:'Slider Desarro.', sector:'inmobiliario', sectorLabel:'Inmobiliario',
      img: BASE_IMG+'slider.jpg',
      desc:'Naming y web para desarrolladora de proyectos arquitectónicos en Durango.',
      evidencias:[
        {tipo:'Naming',                      label:'Naming de la marca',                       url:'https://sliderdesarrollos.com/acerca-de-nosotros/'},
        {tipo:'Página web - E-commerce',     label:'Página web',                               url:'https://sliderdesarrollos.com/'},
      ]},
    /* 22 – Dra. Karen Kelly */
    { name:'Dra. K. Kelly', sector:'salud', sectorLabel:'Salud',
      img: BASE_IMG+'kk.jpg',
      desc:'Posts y videos para odontopediatra en Mazatlán.',
      evidencias:[
        {tipo:'Posts',                       label:'Posts Facebook/Instagram',                 url:'https://fran15711.github.io/kkposts/'},
        {tipo:'Video',                       label:'Videos',                                   url:'https://fran15711.github.io/videokk/'},
      ]},
  ]; // END hexData

  /* ============================================================
   * 6. ESTADO GLOBAL
   * ============================================================ */
  let activeHexIndex  = -1;
  let isSending       = false;
  let chatFocused     = false;
  let drawerOpen      = false;
  let lastFocusEl     = null;
  let twTimer         = null;
  let currentFilters  = { sector: '', type: '' };
  const viewedSections = new Set();

  /* Historial de conversación para la API (máx. 6 turnos = 12 mensajes) */
  const chatHistory = [];
  const CHAT_HISTORY_LIMIT = 6; /* pares usuario/asistente */

  
  const FALLBACK_RESPONSES = [
    'Hola. Soy el asistente de Francisco. Por ahora no estoy conectado a la API, pero el portafolio tiene todo: 23 marcas con evidencias reales, cartas de recomendación verificables y un case study de $26.1M MXN en revenue atribuido. Selecciona cualquier hexágono para explorar.',
    'En este momento no tengo conexión al modelo de lenguaje. Lo que sí existe: reportes reales, evidencias de proyectos y tres cartas de recomendación firmadas. Revisa la sección de Galga o los hexágonos para ir directo a lo que importa.',
    'No puedo procesar esa pregunta ahora mismo, pero los datos están todos en el portafolio: hexágonos con evidencia por marca, case study con $26.1M en revenue, certificaciones con link directo. ¿Qué te gustaría explorar?',
  ];

  /* ============================================================
   * 7. SPLASH
   * ============================================================ */
  function initSplash() {
    const splash  = qs('#splash');
    const skipBtn = qs('#splash-skip');
    if (!splash) return;

    trackEvent('welcome_seen');

    const duration = reducedMotion ? CFG.splashReducedMotion : CFG.splashDuration;

    /* Contador de carga 0 → 100% sincronizado con la duración */
    const counterEl = qs('#splash-counter');
    if (counterEl) {
      const counterStart = performance.now();
      const counterDur   = Math.max(duration - 300, 400);
      function tickCounter(now) {
        const pct = Math.min(100, Math.round(((now - counterStart) / counterDur) * 100));
        counterEl.textContent = pct + '%';
        if (pct < 100 && !exited) requestAnimationFrame(tickCounter);
      }
      requestAnimationFrame(tickCounter);
    }

    let exited = false;
    function exitSplash(skipped) {
      if (exited) return;
      exited = true;
      splash.classList.add('is-leaving');
      trackEvent(skipped ? 'welcome_skipped' : 'welcome_completed');
      setTimeout(() => {
        splash.setAttribute('aria-hidden', 'true');
        const site = qs('#site');
        if (site) site.classList.add('is-visible');
      }, 420);
    }

    /* Timer automático */
    const timer = setTimeout(() => exitSplash(false), duration);

    /* Botón saltar */
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        clearTimeout(timer);
        exitSplash(true);
      });
    }

    /* Click en cualquier parte del splash también lo cierra */
    splash.addEventListener('click', (e) => {
      if (e.target === skipBtn) return;
      clearTimeout(timer);
      exitSplash(true);
    });
  }

  /* ============================================================
   * 8b. REPLAY DEL SPLASH al cambiar idioma
   * El texto ya fue actualizado por applyLanguage (data-i18n).
   * Solo reinicia la visibilidad, la barra y el contador.
   * ============================================================ */
  const REPLAY_MS = 2800;   // duración del replay (más corto que el splash original)
  let splashReplaying = false;

  function replaySplash() {
    const splash = qs('#splash');
    if (!splash || splashReplaying) return;
    splashReplaying = true;

    /* Re-mostrar splash (es fixed z-index:1000, cubre el sitio) */
    splash.classList.remove('is-leaving');
    splash.removeAttribute('aria-hidden');

    /* Reiniciar animación de la barra forzando reflow */
    const bar = qs('#splash-progress-bar');
    if (bar) {
      bar.style.animation = 'none';
      bar.offsetHeight;  // force reflow
      bar.style.animation = `s-progress ${REPLAY_MS / 1000}s linear 150ms forwards`;
    }

    /* Reiniciar contador */
    const counterEl = qs('#splash-counter');
    if (counterEl) {
      counterEl.textContent = '0%';
      const start = performance.now();
      const dur   = REPLAY_MS - 200;
      function tick(now) {
        const pct = Math.min(100, Math.round(((now - start) / dur) * 100));
        counterEl.textContent = pct + '%';
        if (pct < 100 && splashReplaying) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    /* Cerrar automáticamente al terminar */
    setTimeout(() => {
      splash.classList.add('is-leaving');
      setTimeout(() => {
        splash.setAttribute('aria-hidden', 'true');
        splashReplaying = false;
        /* Restaurar barra para el próximo replay */
        if (bar) bar.style.animation = '';
      }, 420);
    }, REPLAY_MS);
  }

  /* ============================================================
   * 8. NAVBAR
   * ============================================================ */
  function initNavbar() {
    const navbar   = qs('#navbar');
    const trigger  = qs('#navbar-trigger');
    const links    = qs('#navbar-links');
    if (!navbar) return;

    /* Scroll: añadir clase .navbar--scrolled */
    const onScroll = throttle(() => {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > CFG.scrollThreshold);
    }, 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // estado inicial

    /* Hamburger mobile */
    if (trigger && links) {
      trigger.addEventListener('click', () => {
        const isOpen = links.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      /* Cerrar al hacer click en un link del menú */
      qsa('a', links).forEach(a => {
        a.addEventListener('click', () => closeNavMenu(trigger, links));
      });
    }

    /* Tracking de links del navbar */
    qsa('.navbar__link', navbar).forEach(a => {
      a.addEventListener('click', () => {
        trackEvent('nav_clicked', { label: a.dataset.trackLabel || a.textContent.trim() });
      });
    });
  }

  function closeNavMenu(trigger, links) {
    if (!links) return;
    links.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /* ============================================================
   * 9. TYPEWRITER
   * ============================================================ */
  function currentTypewriter() {
    return (I18N[LANG] && I18N[LANG].typewriter) || I18N.es.typewriter;
  }

  let twState = null;

  function initTypewriter() {
    const container = qs('#chat-typewriter');
    const textEl    = qs('#typewriter-text');
    if (!container || !textEl) return;

    if (reducedMotion) {
      textEl.textContent = currentTypewriter()[0];
      return;
    }

    twState = { phraseIndex: 0, charIndex: 0, isDeleting: false, textEl };
    runTypewriter();
  }

  function runTypewriter() {
    if (!twState) return;
    const phrases = currentTypewriter();
    const phrase  = phrases[twState.phraseIndex % phrases.length];

    if (!twState.isDeleting) {
      twState.textEl.textContent = phrase.slice(0, twState.charIndex + 1);
      twState.charIndex++;
      if (twState.charIndex === phrase.length) {
        twState.isDeleting = true;
        twTimer = setTimeout(runTypewriter, CFG.pauseAfterType);
        return;
      }
      twTimer = setTimeout(runTypewriter, CFG.typingSpeed);
    } else {
      twState.textEl.textContent = phrase.slice(0, twState.charIndex - 1);
      twState.charIndex--;
      if (twState.charIndex === 0) {
        twState.isDeleting  = false;
        twState.phraseIndex = (twState.phraseIndex + 1) % phrases.length;
        twTimer = setTimeout(runTypewriter, CFG.pauseBeforeType);
        return;
      }
      twTimer = setTimeout(runTypewriter, CFG.deletingSpeed);
    }
  }

  /* Reinicia el typewriter al cambiar idioma */
  function restartTypewriter() {
    if (twTimer) { clearTimeout(twTimer); twTimer = null; }
    const textEl = qs('#typewriter-text');
    if (!textEl) return;
    if (reducedMotion) { textEl.textContent = currentTypewriter()[0]; return; }
    twState = { phraseIndex: 0, charIndex: 0, isDeleting: false, textEl };
    textEl.textContent = '';
    runTypewriter();
  }

  /* ============================================================
   * 10. CHAT
   * ============================================================ */
  function initChat() {
    const textarea = qs('#chat-input');
    const sendBtn  = qs('#chat-send');
    const chipsEl  = qs('#chat-chips');
    if (!textarea) return;

    /* Auto-resize del textarea */
    function resize() {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    }
    textarea.addEventListener('input', () => { resize(); updateSendBtn(); });
    resize();

    /* Habilitar/deshabilitar botón enviar */
    function updateSendBtn() {
      if (!sendBtn) return;
      sendBtn.disabled = !textarea.value.trim() || isSending;
    }
    updateSendBtn();

    /* Limite de caracteres (sin bloquear el input, solo avisar en la UI) */
    textarea.addEventListener('input', () => {
      if (textarea.value.length > CFG.chatMaxLength) {
        textarea.value = textarea.value.slice(0, CFG.chatMaxLength);
        resize();
      }
    });

    /* Focus tracking */
    textarea.addEventListener('focus', () => {
      if (!chatFocused) {
        chatFocused = true;
        trackEvent('chat_focus');
      }
    });

    /* Enter = enviar / Shift+Enter = nueva línea */
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });

    /* Botón enviar */
    if (sendBtn) sendBtn.addEventListener('click', doSend);

    /* Chips de sugerencias */
    if (chipsEl) {
      qsa('.chat__chip', chipsEl).forEach(chip => {
        chip.addEventListener('click', () => {
          const q = chip.dataset.question || chip.textContent.trim();
          trackEvent('suggested_prompt_clicked', { question: q, label: chip.dataset.trackLabel || '' });
          textarea.value = q;
          resize();
          updateSendBtn();
          textarea.focus();
          /* Enviar directamente tras un tick para que el UI se actualice */
          requestAnimationFrame(doSend);
        });
      });
    }

    /* Función principal de envío */
    function doSend() {
      if (isSending) return;
      const text = textarea.value.trim();
      if (!text) return;

      isSending = true;

      /* Mensaje del usuario */
      appendMessage(text, 'user');

      /* Limpiar textarea */
      textarea.value = '';
      textarea.style.height = 'auto';
      updateSendBtn();

      /* Ocultar centro/typewriter */
      hideChatCenter();

      /* Loading dots */
      const loading = qs('#chat-loading');
      if (loading) { loading.removeAttribute('hidden'); loading.removeAttribute('aria-hidden'); }

      trackChatQuestion(text);

      /* Guardar mensaje del usuario en historial */
      chatHistory.push({ role: 'user', content: text });
      if (chatHistory.length > CHAT_HISTORY_LIMIT * 2) chatHistory.splice(0, 2);

      /* Historial sin el último mensaje (va en "message") */
      const histForApi = chatHistory.length > 1 ? chatHistory.slice(0, -1) : [];

      /* ── Crear burbuja de respuesta vacía para streaming ── */
      const conv = qs('#chat-conversation');
      const streamWrapper = document.createElement('div');
      streamWrapper.className = 'chat__message chat__message--bot chat__message--streaming';
      const streamP = document.createElement('p');
      streamWrapper.appendChild(streamP);
      conv.appendChild(streamWrapper);
      scrollConvToBottom(true);

      let accumulated = '';
      let streamStarted = false;

      fetchReplyStream(
        text,
        histForApi,

        /* onChunk — token por token */
        (chunk) => {
          if (!streamStarted) {
            streamStarted = true;
            if (loading) { loading.setAttribute('hidden', ''); loading.setAttribute('aria-hidden', 'true'); }
          }
          accumulated += chunk;
          streamP.textContent = stripMarkdownBasic(accumulated);
          scrollConvToBottom();
        },

        /* onDone — reemplazar con párrafos correctos */
        () => {
          streamWrapper.classList.remove('chat__message--streaming');
          while (streamWrapper.firstChild) streamWrapper.removeChild(streamWrapper.firstChild);

          const finalText = stripMarkdown(accumulated);
          if (finalText) {
            renderBotMessage(finalText, streamWrapper);
            chatHistory.push({ role: 'assistant', content: finalText });
            if (chatHistory.length > CHAT_HISTORY_LIMIT * 2) chatHistory.splice(0, 2);
          } else {
            /* Sin texto: mostrar fallback */
            const fb = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
            renderBotMessage(fb, streamWrapper);
          }

          if (loading) { loading.setAttribute('hidden', ''); loading.setAttribute('aria-hidden', 'true'); }
          isSending = false;
          updateSendBtn();
          scrollConvToBottom();
          trackEvent('chat_response_rendered', { source: 'api_stream' });
        },

        /* onError */
        (err) => {
          streamWrapper.remove();
          appendMessage(t('chat.error'), 'bot');
          if (loading) { loading.setAttribute('hidden', ''); loading.setAttribute('aria-hidden', 'true'); }
          isSending = false;
          updateSendBtn();
          scrollConvToBottom();
          trackEvent('chat_error', { error: err.message || 'unknown' });
        }
      );
    }
  }

  /* ──────────────────────────────────────────────────────────────
   * renderBotMessage — convierte texto plano en párrafos DOM
   * ──────────────────────────────────────────────────────────────
   * 1. Partir en bloques por doble salto de línea.
   * 2. Si un bloque tiene líneas bullet, crear <p class="chat__line--bullet">
   *    por cada ítem limpio.
   * 3. Si no, crear un <p> normal.
   * 4. Nunca usar innerHTML con texto externo — solo textContent.
   * ────────────────────────────────────────────────────────────── */
  function renderBotMessage(text, container) {
    const BULLET_RE = /^[\s]*[-*•·]\s+/;

    const blocks = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g,   '\n')
      .trim()
      .split(/\n{2,}/);

    blocks.forEach(block => {
      const trimmed = block.trim();
      if (!trimmed) return;

      const lines = trimmed.split('\n');

      /* Bloque de bullets puros */
      if (lines.length > 1 && lines.every(l => BULLET_RE.test(l.trim()))) {
        lines.forEach(line => {
          const clean = line.trim().replace(BULLET_RE, '').trim();
          if (!clean) return;
          const p = document.createElement('p');
          p.className = 'chat__line chat__line--bullet';
          p.textContent = clean;
          container.appendChild(p);
        });
        return;
      }

      /* Párrafo normal: juntar líneas del mismo bloque en una sola */
      const singleLine = lines
        .map(l => l.trim().replace(BULLET_RE, '').trim())
        .filter(Boolean)
        .join(' ');

      const p = document.createElement('p');
      p.textContent = singleLine;
      container.appendChild(p);
    });
  }

  /* Añadir mensaje a la conversación */
  function appendMessage(text, role) {
    const conv = qs('#chat-conversation');
    if (!conv) return;

    const wrapper = document.createElement('div');
    wrapper.className = `chat__message chat__message--${role}`;

    if (role === 'user') {
      const p = document.createElement('p');
      p.textContent = text;
      wrapper.appendChild(p);
    } else {
      renderBotMessage(text, wrapper);
      /* Fallback si renderBotMessage no produjo nada */
      if (!wrapper.hasChildNodes()) {
        const p = document.createElement('p');
        p.textContent = text;
        wrapper.appendChild(p);
      }
    }

    conv.appendChild(wrapper);
    scrollConvToBottom(true);
  }

  function scrollConvToBottom(force) {
    const conv = qs('#chat-conversation');
    if (!conv) return;
    const last = conv.lastElementChild;
    if (!last) return;

    /* Solo auto-desplazar si el usuario ya está cerca del fondo,
       salvo que se fuerce (al enviar pregunta o crear la burbuja).
       Si el usuario subió a leer algo, NO lo arrastramos. */
    const scrollPos  = window.scrollY + window.innerHeight;
    const docHeight  = document.documentElement.scrollHeight;
    const nearBottom = (docHeight - scrollPos) < 220;

    if (force || nearBottom) {
      last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function hideChatCenter() {
    const center = qs('#chat-center');
    if (center && !center.classList.contains('is-hidden')) {
      center.classList.add('is-hidden');
      if (twTimer) { clearTimeout(twTimer); twTimer = null; }
    }
  }

  /* Fetch a /api/chat con timeout de 12s
     history: array [{role, content}] — últimos turnos del chat */
  async function fetchReply(question, history = []) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 12000);
    try {
      /* Enviar historial SIN el último mensaje del usuario (ya va en "message") */
      const historyWithoutLast = history.length > 0
        ? history.slice(0, -1)
        : [];
      const res = await fetch(CFG.api, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          language: getLang(),
          message: question,
          history: historyWithoutLast,
        }),
        signal:  ctrl.signal,
      });
      clearTimeout(tid);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.reply || data.response || data.message || data.content;
      if (!reply) throw new Error('empty_response');
      return reply;
    } catch (err) {
      clearTimeout(tid);
      if (err.name === 'AbortError') throw new Error('timeout');
      throw err;
    }
  }

  /* Recibe tokens via SSE y los pasa a callbacks:
     onChunk(str), onDone(), onError(err) */
  async function fetchReplyStream(question, history, onChunk, onDone, onError) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => { ctrl.abort(); onError(new Error('timeout')); }, 25000);

    try {
      const res = await fetch(CFG.api, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: question, history, stream: true, language: getLang() }),
        signal:  ctrl.signal,
      });
      clearTimeout(tid);

      if (!res.ok) { onError(new Error('HTTP ' + res.status)); return; }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) { onDone(); break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';   // guardar línea incompleta

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') { onDone(); return; }
          try {
            const parsed  = JSON.parse(data);
            const content = parsed.content ?? parsed.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch { /* ignorar JSON incompleto */ }
        }
      }
    } catch (err) {
      clearTimeout(tid);
      if (err.name !== 'AbortError') onError(err);
    }
  }

  /* ============================================================
   * 11. CONTADORES / KPIs ANIMADOS
   * ============================================================ */
  function animateCounter(el) {
    if (!el || el._animated) return;
    el._animated = true;

    const target  = parseFloat(el.dataset.to);
    if (isNaN(target)) return;

    const format  = el.dataset.format  || '';
    const suffix  = el.dataset.suffix  || '';
    const compact = el.dataset.compact === '1';
    const dur     = parseInt(el.dataset.speed) || CFG.counterDuration;

    /* Sin animación si reduced-motion */
    if (reducedMotion) {
      el.textContent = fmtCounter(target, format, suffix, compact);
      return;
    }

    const start = performance.now();
    function tick(now) {
      const t       = Math.min((now - start) / dur, 1);
      const eased   = easeOutCubic(t);
      el.textContent = fmtCounter(target * eased, format, suffix, compact);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
   * 12. SCROLL REVEAL + SECTION TRACKING
   * ============================================================ */
  function initScrollReveal() {
    /* 1. Secciones principales: reveal + section_view + tiempo */
    const sectionObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        const sid   = entry.target.id;
        const label = entry.target.dataset.sectionLabel || entry.target.dataset.trackSection || sid;
        if (sid && !viewedSections.has(sid)) {
          viewedSections.add(sid);
          SESSION.sectionsSeen.add(sid);
          trackEvent('section_view', { section_id: sid, section_label: label });
        }
      });
    }, { rootMargin: '-8% 0px', threshold: 0.04 });

    qsa('section[id]').forEach(s => sectionObs.observe(s));

    /* 1b. Sección "actual" para medir tiempo (la más visible) */
    const timeObs = new IntersectionObserver(entries => {
      let best = null, bestRatio = 0;
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > bestRatio) {
          bestRatio = e.intersectionRatio; best = e.target;
        }
      });
      if (best && bestRatio >= 0.35) setCurrentSection(best.id);
    }, { threshold: [0.35, 0.6, 0.9] });
    qsa('section[id]').forEach(s => timeObs.observe(s));

    /* 2. Hex wraps — stagger por index */
    const hexObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx   = parseInt(entry.target.dataset.index || 0);
        const delay = idx * 28; /* 28 ms entre hexes */
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        hexObs.unobserve(entry.target);
      });
    }, { rootMargin: '0px', threshold: 0.08 });
    qsa('.hex-wrap').forEach(w => hexObs.observe(w));

    /* 3. Galga KPIs — con animación de contador */
    const kpiObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        qsa('[data-to]', entry.target).forEach(animateCounter);
        kpiObs.unobserve(entry.target);
      });
    }, { rootMargin: '-4% 0px', threshold: 0.2 });
    qsa('.galga__kpi').forEach(k => kpiObs.observe(k));

    /* 4. Cert cards */
    const certObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        certObs.unobserve(entry.target);
      });
    }, { rootMargin: '-4% 0px', threshold: 0.15 });
    qsa('.cert-card').forEach(c => certObs.observe(c));

    /* 5. Contadores fuera de KPIs (métricas bar + life-stats) */
    const cntObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        cntObs.unobserve(entry.target);
      });
    }, { rootMargin: '-4% 0px', threshold: 0.3 });
    qsa('.metrica__value[data-to], .life-stat__value[data-to]').forEach(el => cntObs.observe(el));
  }

  /* ============================================================
   * 13. HEXÁGONOS
   * ============================================================ */
  function initHexagons() {
    const hexWraps = qsa('.hex-wrap');
    if (!hexWraps.length) return;

    hexWraps.forEach(wrap => {
      const hexEl = qs('.hex', wrap);
      if (!hexEl) return;
      const index = parseInt(wrap.dataset.index);

      /* Click */
      hexEl.addEventListener('click', () => activateHex(index));

      /* Teclado: Enter y Espacio */
      hexEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateHex(index);
        }
      });
    });
  }

  function activateHex(index) {
    const brand = hexData[index];
    if (!brand) return;

    /* Si ya está activo → toggle off */
    if (activeHexIndex === index) {
      deactivateAllHexes();
      updateAmbient(null);
      closeDrawer();
      return;
    }

    deactivateAllHexes();
    activeHexIndex = index;

    /* Marcar hex activo */
    const wrap = qs(`.hex-wrap[data-index="${index}"]`);
    if (wrap) qs('.hex', wrap)?.classList.add('is-active');

    /* Cambiar fondo ambiental */
    updateAmbient(brand.img);

    /* Abrir/actualizar drawer */
    openDrawer(brand);

    trackProjectClick(index, brand.name, brand.sectorLabel || brand.sector);
  }

  function deactivateAllHexes() {
    activeHexIndex = -1;
    qsa('.hex.is-active').forEach(h => h.classList.remove('is-active'));
  }

  function updateAmbient(imgUrl) {
    const section = qs('.s-proyectos');
    const ambient = qs('#proyectos-ambient');
    if (!section || !ambient) return;

    if (imgUrl) {
      ambient.style.setProperty('--ambient-img', `url("${imgUrl}")`);
      section.classList.add('has-ambient');
    } else {
      ambient.style.removeProperty('--ambient-img');
      section.classList.remove('has-ambient');
    }
  }

  /* ============================================================
   * 14. EVIDENCE DRAWER
   * ============================================================ */
  function openDrawer(brand) {
    const drawer = qs('#evidence-drawer');
    if (!drawer) return;

    lastFocusEl = document.activeElement;
    populateDrawer(brand);

    drawer.setAttribute('aria-hidden', 'false');
    drawerOpen = true;
    document.body.style.overflow = 'hidden';

    /* Foco en el panel para accesibilidad */
    const panel = qs('.evidence-drawer__panel', drawer);
    if (panel) setTimeout(() => panel.focus(), 80);
  }

  function closeDrawer() {
    const drawer = qs('#evidence-drawer');
    if (!drawer || !drawerOpen) return;

    drawer.setAttribute('aria-hidden', 'true');
    drawerOpen = false;
    document.body.style.overflow = '';

    /* Devolver foco al hex o al último elemento */
    if (lastFocusEl) { lastFocusEl.focus(); lastFocusEl = null; }
  }

  function populateDrawer(brand) {
    const nameEl   = qs('#evidence-brand-name');
    const sectorEl = qs('#evidence-brand-sector');
    const descEl   = qs('#evidence-brand-desc');
    const itemsEl  = qs('#evidence-items');
    if (!nameEl || !itemsEl) return;

    if (nameEl)   nameEl.textContent   = brand.name;
    if (sectorEl) sectorEl.textContent = brand.sectorLabel || brand.sector;
    if (descEl)   descEl.textContent   = brand.desc || '';

    /* Limpiar items anteriores */
    itemsEl.innerHTML = '';

    (brand.evidencias || []).forEach((ev, i) => {
      const btn = document.createElement('a');
      btn.className = 'evidence-btn';
      btn.href      = ev.url;
      btn.rel       = 'noopener noreferrer';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', `${ev.tipo}: ${ev.label}`);

      /* Thumb de la marca */
      const img = document.createElement('img');
      img.src       = brand.img;
      img.alt       = '';
      img.className = 'evidence-btn__thumb';
      img.setAttribute('aria-hidden', 'true');

      /* Contenido: TIPO en pill + label */
      const lbl = document.createElement('span');
      lbl.className = 'evidence-btn__label';

      /* Badge del tipo de trabajo (Posts, Blog, Video, etc.) */
      const tipo = document.createElement('span');
      tipo.style.cssText = [
        'display:block',
        'font-size:9px',
        'font-weight:600',
        'letter-spacing:.09em',
        'text-transform:uppercase',
        'color:var(--text-muted)',
        'margin-bottom:2px',
      ].join(';');
      tipo.textContent = ev.tipo;

      const labelText = document.createElement('span');
      labelText.style.cssText = 'display:block;font-size:12px;color:var(--text-secondary);';
      labelText.textContent = ev.label;

      lbl.appendChild(tipo);
      lbl.appendChild(labelText);
      btn.appendChild(img);
      btn.appendChild(lbl);

      /* Click: abrir evidencia */
      btn.addEventListener('click', e => {
        e.preventDefault();

        /* URL pendiente: feedback visual claro */
        if (ev.url.startsWith('[PLACEHOLDER')) {
          btn.style.opacity = '0.4';
          const t = document.createElement('span');
          t.textContent = ' ← URL pendiente';
          t.style.cssText = 'font-size:10px;color:var(--text-muted);';
          if (!btn.querySelector('.pending-note')) {
            t.className = 'pending-note';
            btn.appendChild(t);
          }
          setTimeout(() => { btn.style.opacity = ''; }, 800);
          console.warn('[FN] URL pendiente para agregar en hexData[]:', ev.label, ev.url);
          return;
        }

        trackEvidenceClick(activeHexIndex >= 0 && hexData[activeHexIndex] ? hexData[activeHexIndex].name : '', ev.label, ev.url);

        if (isFramable(ev.url)) {
          openPopup(ev.url);
        } else {
          window.open(ev.url, '_blank', 'noopener,noreferrer');
        }
      });

      itemsEl.appendChild(btn);
    });

  }

  function initDrawerClose() {
    const closeBtn  = qs('#evidence-close');
    const backdrop  = qs('#evidence-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
  }

  /* ============================================================
   * 15. FILTROS DE PROYECTOS
   * ============================================================ */
  function initFilters() {
    const sectorSel = qs('#filter-sector');
    const typeSel   = qs('#filter-type');
    const resetBtn  = qs('#filter-reset');

    function applyFilters() {
      currentFilters.sector = sectorSel ? sectorSel.value : '';
      currentFilters.type   = typeSel   ? typeSel.value   : '';

      qsa('.hex-wrap').forEach(wrap => {
        const hexEl = qs('.hex', wrap);
        if (!hexEl) return;

        const idx    = parseInt(wrap.dataset.index);
        const brand  = hexData[idx];
        if (!brand) return;

        const sMatch = !currentFilters.sector ||
                       brand.sector === currentFilters.sector;

        const tMatch = !currentFilters.type ||
                       (brand.evidencias || []).some(ev =>
                         ev.tipo.toLowerCase() === currentFilters.type.toLowerCase()
                       );

        wrap.classList.toggle('is-filtered', !(sMatch && tMatch));
      });
    }

    if (sectorSel) sectorSel.addEventListener('change', applyFilters);
    if (typeSel)   typeSel.addEventListener('change', applyFilters);

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (sectorSel) sectorSel.value = '';
        if (typeSel)   typeSel.value   = '';
        qsa('.hex-wrap.is-filtered').forEach(w => w.classList.remove('is-filtered'));
        currentFilters = { sector: '', type: '' };
      });
    }
  }

  /* ============================================================
   * 16. POPUP / IFRAME
   * ============================================================ */
  function openPopup(url) {
    const overlay = qs('#popup-overlay');
    const iframe  = qs('#popup-iframe');
    if (!overlay || !iframe) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (isFramable(url)) {
      iframe.src = url;
      overlay.removeAttribute('hidden');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const closeBtn = qs('#popup-close');
      if (closeBtn) setTimeout(() => closeBtn.focus(), 100);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function closePopup() {
    const overlay = qs('#popup-overlay');
    const iframe  = qs('#popup-iframe');
    if (!overlay) return;

    overlay.setAttribute('hidden', '');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (iframe) setTimeout(() => { iframe.src = 'about:blank'; }, 300);
  }

  function initPopup() {
    const closeBtn  = qs('#popup-close');
    const backdrop  = qs('#popup-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (backdrop) backdrop.addEventListener('click', closePopup);
  }

  /* ============================================================
   * 17. CERTIFICACIONES — spotlight
   * ============================================================ */

  /* ============================================================
   * initShinyButtons — Efecto "placa plateada" con canvas
   * Recuperado del portafolio original de Francisco.
   * ============================================================ */
  function initShinyButtons() {
    const buttons = [...document.querySelectorAll('[data-shiny-button]')];
    if (!buttons.length) return;

    const colorStops = [
      [0,   'rgb(84,94,109)'],
      [0.2, 'rgb(111,122,137)'],
      [0.4, 'rgb(153,156,168)'],
      [0.6, 'rgb(195,200,219)'],
      [0.9, 'rgb(74,73,83)'],
      [1,   'rgb(93,93,93)'],
    ];

    const drawFns = buttons.map((button) => {
      const canvas = button.querySelector('canvas');
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');

      const draw = (x, y, i = 0) => {
        const rect = button.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width  = rect.width  * ratio;
        canvas.height = rect.height * ratio;
        canvas.style.width  = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        const gradient = ctx.createLinearGradient(
          x / 10 - i * 40, y / 10, rect.width, rect.height
        );
        colorStops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, rect.width, rect.height);
      };

      draw(window.innerWidth / 2, window.innerHeight / 2, 0);
      return draw;
    }).filter(Boolean);

    document.addEventListener('mousemove', (event) => {
      drawFns.forEach((draw, i) =>
        requestAnimationFrame(() => draw(event.clientX, event.clientY, i))
      );
    });
    window.addEventListener('resize', () =>
      drawFns.forEach((draw, i) => draw(window.innerWidth / 2, window.innerHeight / 2, i))
    );
  }

  function initCertSpotlight() {
    const cards = qsa('.cert-card');
    if (!cards.length) return;

    cards.forEach(card => {
      /* Mouse-tracking para el radial-gradient */
      if (!reducedMotion && !isTouchDevice) {
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width)  * 100;
          const y = ((e.clientY - rect.top)  / rect.height) * 100;
          card.style.setProperty('--mouse-x', `${x}%`);
          card.style.setProperty('--mouse-y', `${y}%`);
        });
        card.addEventListener('mouseleave', () => {
          card.style.setProperty('--mouse-x', '50%');
          card.style.setProperty('--mouse-y', '50%');
        });
      }

      /* Click: siempre hace algo */
      card.addEventListener('click', e => {
        e.preventDefault();
        const url   = card.href || card.getAttribute('href') || '';
        const label = card.dataset.trackLabel || '';

        trackCertClick(label, url);

        if (!url || url.startsWith('[PLACEHOLDER')) {
          console.warn('[FN] Cert URL pendiente:', label);
          return; /* sin URL no hay acción, pero no navega a href roto */
        }

        trackExternalLink(label, url);

        /* Los certificados externos (Skillshop, HubSpot) abren en nueva pestaña.
           Si en algún momento apuntan a GitHub Pages propias, usarán iframe. */
        if (isFramable(url)) {
          openPopup(url);
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
    });
  }

  /* ============================================================
   * 18. MODEL-VIEWER
   * ============================================================ */
  function initModelViewer() {
    const mv = qs('#mimaki-viewer');
    if (!mv) return;
    const hint = qs('#mv-hint');

    /* Primera interacción real: trackear y ocultar hint */
    const onInteract = () => {
      trackModelViewer();
      if (hint) hint.classList.add('is-hidden');
    };
    mv.addEventListener('pointerdown', onInteract, { passive: true });
    mv.addEventListener('touchstart',  onInteract, { passive: true });

    /* En mobile, mientras el dedo está sobre el modelo, evitar que la
       página haga scroll (touch-action:none en CSS ya lo maneja, pero
       reforzamos por si el navegador inicia un scroll-chain). */
    mv.addEventListener('touchmove', (e) => {
      /* el componente ya consume el gesto; solo cortamos el bubbling */
      e.stopPropagation();
    }, { passive: true });
  }

  /* ============================================================
   * 19. CONTACTO
   * ============================================================ */
  function initContact() {
    /* Los elementos de contacto ya tienen data-track en el HTML.
       Este handler complementario garantiza tracking correcto    */
    qsa('#contacto .contacto__item').forEach(item => {
      item.addEventListener('click', () => {
        const label = item.dataset.trackLabel || item.querySelector('.contacto__item-label')?.textContent || '';
        const url   = item.href || '';
        const evt = item.dataset.track || 'contact_clicked';
        if (evt === 'cv_clicked' || evt === 'cv_click') trackCvClick(label);
        else trackContactClick(label);
      });
    });
  }

  /* ============================================================
   * 20. CURSOR TRAIL
   * ============================================================ */
  function initCursorTrail() {
    const canvas = qs('#cursor-trail');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor(x, y) {
        this.x      = x;
        this.y      = y;
        this.vx     = (Math.random() - 0.5) * 0.45;
        this.vy     = (Math.random() - 0.5) * 0.45;
        this.alpha  = 0.40 + Math.random() * 0.22;
        this.radius = 0.7 + Math.random() * 1.5;
        this.decay  = 0.024 + Math.random() * 0.016;
        /* 82% blanco · 18% acento azul */
        this.color  = Math.random() < 0.82 ? '255,255,255' : '79,142,247';
      }
      update() {
        this.x      += this.vx;
        this.y      += this.vy;
        this.alpha  -= this.decay;
        this.radius *= 0.984;
      }
      draw() {
        if (this.alpha <= 0.01 || this.radius <= 0.1) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${Math.max(0, this.alpha)})`;
        ctx.fill();
      }
    }

    const spawnParticle = throttle(e => {
      if (particles.length >= CFG.maxParticles) return;
      particles.push(new Particle(e.clientX, e.clientY));
      if (Math.random() < 0.5) {
        particles.push(new Particle(e.clientX, e.clientY));
      }
    }, 14);

    document.addEventListener('mousemove', spawnParticle);
    window.addEventListener('resize', throttle(resize, 200));
    resize();

    (function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.alpha > 0.01 && p.radius > 0.1);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    })();
  }

  /* ============================================================
   * 21. AÑO ACTUAL
   * ============================================================ */
  function initCurrentYear() {
    const el = qs('#current-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ============================================================
   * 22. TECLADO GLOBAL (Escape)
   * ============================================================ */
  function initGlobalKeys() {
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;

      /* Prioridad: popup > drawer > menú mobile */
      const popup = qs('#popup-overlay');
      if (popup && !popup.hasAttribute('hidden')) { closePopup(); return; }

      const drawer = qs('#evidence-drawer');
      if (drawer && drawer.getAttribute('aria-hidden') === 'false') { closeDrawer(); return; }

      const navLinks = qs('#navbar-links');
      const trigger  = qs('#navbar-trigger');
      if (navLinks && navLinks.classList.contains('is-open')) {
        closeNavMenu(trigger, navLinks);
      }
    });
  }

  /* ============================================================
   * 23. TRACKING GENÉRICO DATA-TRACK
   * (complementa los handlers específicos)
   * ============================================================ */
  function initGlobalTracking() {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-track]');
      if (!el) return;

      const evt   = el.dataset.track;
      const label = el.dataset.trackLabel || el.textContent.trim().slice(0, 60) || '';
      const url   = el.href || '';

      /* Handlers dedicados ya trackean estos */
      if (['certification_click','certification_clicked','evidence_click',
           'project_click','chat_focus','chat_question_submitted',
           'suggested_prompt_clicked'].includes(evt)) return;

      /* Contacto / CV / links externos */
      if (evt === 'contact_clicked' || evt === 'contact_click') {
        trackContactClick(label);
      } else if (evt === 'cv_clicked' || evt === 'cv_click' || evt === 'cv_downloaded') {
        trackCvClick(label);
      } else if (evt === 'external_link_clicked' || evt === 'external_link_click') {
        trackExternalLink(label, url);
      } else {
        /* cualquier otro data-track no crítico */
        if (url && !url.startsWith(window.location.origin) &&
            !url.startsWith('mailto:') && !url.startsWith('#') &&
            !url.startsWith('[PLACEHOLDER')) {
          trackExternalLink(label, url);
        }
      }
    });
  }

  /* ============================================================
   * INIT — punto de entrada
   * ============================================================ */

  /* ============================================================
   * initLanguageSwitcher — Banderitas ES/EN
   * ============================================================ */


  /* ============================================================
   * initThemeToggle — Switch sol/luna (oscuro por defecto)
   * data-theme="light" activa modo claro en <html>
   * Persiste en localStorage("fn-theme")
   * ============================================================ */
  function initThemeToggle() {
    const sw = qs('#theme-toggle');
    if (!sw) return;

    // Default: oscuro. Si guardó "light", aplicar claro.
    let isLight = localStorage.getItem('fn-theme') === 'light';

    function apply() {
      if (isLight) {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      sw.setAttribute('aria-checked', String(isLight));
      sw.setAttribute('aria-label', isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    }

    // Click o teclado (Space/Enter)
    function toggle() {
      isLight = !isLight;
      localStorage.setItem('fn-theme', isLight ? 'light' : 'dark');
      apply();
    }

    sw.addEventListener('click', toggle);
    sw.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    });

    apply(); // aplicar estado inicial (antes del primer render)
  }

  /* ============================================================
   * initSobreMiTheme — Toggle claro/oscuro para "Cómo trabajo"
   * ============================================================ */

  /* ============================================================
   * initModelViewerProgress — Barra de carga con % del modelo AR
   * ============================================================ */
  function initModelViewerProgress() {
    const viewer = qs('#mimaki-viewer');
    const fill   = qs('#mv-progress-fill');
    const label  = qs('#mv-progress-label');
    if (!viewer) return;

    viewer.addEventListener('progress', (e) => {
      const pct = Math.round((e.detail?.totalProgress || 0) * 100);
      if (fill)  fill.style.width = `${pct}%`;
      if (label) label.textContent = `Cargando modelo AR… ${pct}%`;
    });
    viewer.addEventListener('load', () => {
      const bar = qs('#mv-progress-bar');
      if (bar) bar.style.opacity = '0';
      trackEvent('model_viewer_interaction', {action:'loaded', model:'mimaki_UJ330H'});
    });
    viewer.addEventListener('error', () => {
      if (label) label.textContent = 'Error al cargar el modelo 3D';
      trackEvent('model_viewer_interaction', {action:'error', model:'mimaki_UJ330H'});
    });
    viewer.addEventListener('camera-change', () => {
      trackEvent('model_viewer_interaction', {action:'camera_moved', model:'mimaki_UJ330H'});
    });
  }

  function initSobreMiTheme() {
    const btn     = qs('#sobre-mi-theme-btn');
    const section = qs('.s-sobre-mi');
    if (!btn || !section) return;

    // Arranca en modo CLARO (is-light ya está en el HTML)
    let isLight = true;

    function applyTheme() {
      section.classList.toggle('is-light', isLight);
      const icon  = btn.querySelector('.sobre-mi__theme-icon');
      const label = btn.querySelector('.sobre-mi__theme-label');
      if (icon)  icon.textContent  = isLight ? '🌙' : '☀️';
      if (label) label.textContent = isLight ? 'Vista oscura' : 'Vista clara';
      btn.setAttribute('aria-label', isLight ? 'Cambiar a vista oscura' : 'Cambiar a vista clara');
    }

    btn.addEventListener('click', () => {
      isLight = !isLight;
      applyTheme();
    });

    applyTheme(); // garantiza consistencia si JS carga después del HTML
  }

  function initLanguageSwitcher() {
    /* Navbar + splash comparten la misma lógica */
    const bind = (id, lang) => {
      const btn = qs(id);
      if (btn) btn.addEventListener('click', () => applyLanguage(lang));
    };
    bind('#lang-btn-es', 'es');
    bind('#lang-btn-en', 'en');
    bind('#splash-lang-es', 'es');
    bind('#splash-lang-en', 'en');
  }

  let _inited = false;
  function init() {
    if (_inited) return;   // evitar doble init si el evento se dispara dos veces
    _inited = true;
    detectAndApplyLang();   // idioma antes de cualquier render de texto
    startSession();         // session_start (reemplaza page_view)

    initSplash();
    initNavbar();
    initTypewriter();
    initChat();
    initScrollReveal();
    initHexagons();
    initDrawerClose();
    initFilters();
    initPopup();
    initShinyButtons();
    initCertSpotlight();
    initThemeToggle();
    initLanguageSwitcher();
    initSobreMiTheme();
    initModelViewerProgress();
    initModelViewer();
    initContact();
    initCurrentYear();
    initGlobalKeys();
    initGlobalTracking();
    initSessionEnd();

    /* Cursor trail: solo desktop y sin reduced-motion */
    if (!isTouchDevice && !reducedMotion) initCursorTrail();
  }

  /* Fin de sesión: lo más confiable en mobile es pagehide + visibilitychange */
  function initSessionEnd() {
    const fire = () => endSession();
    window.addEventListener('pagehide', fire);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') fire();
    });
    /* beforeunload como último respaldo en desktop */
    window.addEventListener('beforeunload', fire);
  }

  document.addEventListener('DOMContentLoaded', init);

  /* ============================================================
   * API PÚBLICA MÍNIMA
   * ============================================================ */
  window.PortfolioTracker = { trackEvent };
  window.openPopup        = openPopup;
  window.closePopup       = closePopup;

})();
/* ── FIN script.js ── Francisco Noriega Portfolio ────────────── */
