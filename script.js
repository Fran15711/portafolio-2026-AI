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
    splashDuration:     3200,   // ms — duración normal del splash
    splashReducedMotion: 400,   // ms — con prefers-reduced-motion
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
  };

  /* ============================================================
   * 1. DETECCIÓN DE ENTORNO
   * ============================================================ */
  const reducedMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  /* ============================================================
   * 2. SESIÓN + UTM PARAMS
   * ============================================================ */
  const SESSION = {
    id:        _sid(),
    startTime: Date.now(),
    utm: {},
    ctx: {},
  };

  function _sid() {
    return 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function captureUrlParams() {
    const p = new URLSearchParams(window.location.search);
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']
      .forEach(k => { if (p.has(k)) SESSION.utm[k] = p.get(k); });
    ['company','role','source']
      .forEach(k => { if (p.has(k)) SESSION.ctx[k] = p.get(k); });
  }

  /* ============================================================
   * 3. TRACKING CENTRALIZADO
   * ============================================================ */
  function trackEvent(name, data = {}) {
    const payload = {
      event:     name,
      ts:        new Date().toISOString(),
      sessionId: SESSION.id,
      path:      window.location.pathname,
      url:       window.location.href,
      referrer:  document.referrer || null,
      vp:        { w: window.innerWidth, h: window.innerHeight },
      ...SESSION.utm,
      ...SESSION.ctx,
      ...data,
    };

    /* ─── DEV output ─── */
    console.log('[FN:track]', name, data);

    /* ─── Analytics hooks (activar cuando esté listo) ───
    if (window.gtag)       window.gtag('event', name, payload);
    if (window.posthog)    window.posthog.capture(name, payload);
    if (window.analytics)  window.analytics.track(name, payload);
    ─────────────────────────────────────────────────── */
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

  const TYPEWRITER_PHRASES = [
    'Pregúntame qué proyectos puede comprobar Francisco\u2026',
    'Pregúntame cómo aplica IA en marketing real\u2026',
    'Pregúntame qué haría por tu equipo de growth\u2026',
    'Pregúntame por los números de GalgaX\u2026',
    'Pregúntame por sus certificaciones\u2026',
  ];

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
  function initTypewriter() {
    const container = qs('#chat-typewriter');
    const textEl    = qs('#typewriter-text');
    if (!container || !textEl) return;

    /* Con reduced-motion: mostrar frase fija sin animación */
    if (reducedMotion) {
      textEl.textContent = TYPEWRITER_PHRASES[0];
      return;
    }

    let phraseIndex = 0;
    let charIndex   = 0;
    let isDeleting  = false;

    function tick() {
      const phrase = TYPEWRITER_PHRASES[phraseIndex];

      if (!isDeleting) {
        textEl.textContent = phrase.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === phrase.length) {
          /* Frase completa → trackear y pausar antes de borrar */
          trackEvent('suggested_prompt_seen', { phrase });
          isDeleting = true;
          twTimer = setTimeout(tick, CFG.pauseAfterType);
          return;
        }
        twTimer = setTimeout(tick, CFG.typingSpeed);
      } else {
        textEl.textContent = phrase.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          isDeleting  = false;
          phraseIndex = (phraseIndex + 1) % TYPEWRITER_PHRASES.length;
          twTimer = setTimeout(tick, CFG.pauseBeforeType);
          return;
        }
        twTimer = setTimeout(tick, CFG.deletingSpeed);
      }
    }

    twTimer = setTimeout(tick, CFG.pauseBeforeType);
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

      trackEvent('chat_question_submitted', { question_length: text.length });

      /* Llamada a la API */
      fetchReply(text)
        .then(reply => {
          appendMessage(reply, 'bot');
          trackEvent('chat_response_rendered', { source: 'api' });
        })
        .catch(err => {
          const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
          appendMessage(fallback, 'bot');
          trackEvent('chat_error', { error: err.message || 'unknown' });
        })
        .finally(() => {
          if (loading) { loading.setAttribute('hidden', ''); loading.setAttribute('aria-hidden', 'true'); }
          isSending = false;
          updateSendBtn();
          scrollConvToBottom();
        });
    }
  }

  /* Añadir mensaje a la conversación */
  function appendMessage(text, role) {
    const conv = qs('#chat-conversation');
    if (!conv) return;

    const div = document.createElement('div');
    div.className = `chat__message chat__message--${role}`;
    const p = document.createElement('p');
    p.textContent = text;  /* textContent: seguro, sin XSS */
    div.appendChild(p);
    conv.appendChild(div);
    scrollConvToBottom();
  }

  function scrollConvToBottom() {
    /* Con chat de scroll natural (min-height, sin overflow interno),
       usamos scrollIntoView en el último mensaje */
    const conv = qs('#chat-conversation');
    if (!conv) return;
    const last = conv.lastElementChild;
    if (last) last.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function hideChatCenter() {
    const center = qs('#chat-center');
    if (center && !center.classList.contains('is-hidden')) {
      center.classList.add('is-hidden');
      if (twTimer) { clearTimeout(twTimer); twTimer = null; }
    }
  }

  /* Fetch a /api/chat con timeout de 12s */
  async function fetchReply(question) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(CFG.api, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: question }),
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
    /* 1. Secciones principales */
    const sectionObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        const sid = entry.target.dataset.trackSection;
        if (sid && !viewedSections.has(sid)) {
          viewedSections.add(sid);
          trackEvent('section_viewed', { section: sid });
        }
        sectionObs.unobserve(entry.target);
      });
    }, { rootMargin: '-8% 0px', threshold: 0.04 });

    qsa('.s-metricas,.s-proyectos,.s-galga,.s-experiencia,.s-certificaciones,.s-sobre-mi,.s-contacto')
      .forEach(s => sectionObs.observe(s));

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

    trackEvent('project_selected', {
      brand: brand.name,
      sector: brand.sector,
      index,
    });
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
        trackEvent('project_evidence_clicked', {
          brand: brand.name, tipo: ev.tipo, label: ev.label,
        });

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

        trackEvent('external_link_clicked', { url: ev.url, label: ev.label });

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

        trackEvent('certification_clicked', { label, url });

        if (!url || url.startsWith('[PLACEHOLDER')) {
          console.warn('[FN] Cert URL pendiente:', label);
          return; /* sin URL no hay acción, pero no navega a href roto */
        }

        trackEvent('external_link_clicked', { url, label });

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
  function initModelViewer() { /* lógica movida a initModelViewerProgress */ }

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
        const evt   = item.dataset.track || 'contact_clicked';
        trackEvent(evt, { label, url });
        if (url && !url.startsWith('mailto:') && !url.startsWith('#')) {
          trackEvent('external_link_clicked', { url, label });
        }
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

      /* Los handlers específicos (certs, contacto, etc.) ya trackean.
         Este solo cubre elementos sin handler dedicado.              */
      const evt   = el.dataset.track;
      const label = el.dataset.trackLabel || '';
      const url   = el.href || '';

      if (['certification_clicked', 'contact_clicked', 'cv_downloaded',
           'suggested_prompt_clicked', 'project_evidence_clicked'].includes(evt)) return;

      trackEvent(evt, { label, url });

      /* Link externo */
      if (url && !url.startsWith(window.location.origin) &&
          !url.startsWith('mailto:') && !url.startsWith('#') &&
          !url.startsWith('[PLACEHOLDER')) {
        trackEvent('external_link_clicked', { url, label });
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
    const btnEs = qs('#lang-btn-es');
    const btnEn = qs('#lang-btn-en');
    if (!btnEs || !btnEn) return;

    const translations = {
      es: {
        'chat__title':    'Hola, soy el asistente de Francisco.',
        'chat__sub':      'Simplifica el portafolio con IA. No soy Francisco,<br>pero sé todo sobre sus proyectos y resultados.',
        '#chat-chips .chat__chip:nth-child(1)': '¿Qué puede comprobar?',
        '#chat-chips .chat__chip:nth-child(2)': '¿Cómo usa IA?',
        '#chat-chips .chat__chip:nth-child(3)': 'ROI en Galga →',
      },
      en: {
        'chat__title':    "Hi, I'm Francisco's portfolio assistant.",
        'chat__sub':      "Ask me anything about his projects and results.<br>I'm not Francisco, but I know his work.",
        '#chat-chips .chat__chip:nth-child(1)': 'What can he prove?',
        '#chat-chips .chat__chip:nth-child(2)': 'How does he use AI?',
        '#chat-chips .chat__chip:nth-child(3)': 'Galga ROI →',
      }
    };

    function applyLang(lang) {
      const t = translations[lang] || translations.es;
      const title = qs('.chat__title');
      const sub   = qs('.chat__sub');
      if (title) title.textContent = t['chat__title'];
      if (sub)   sub.innerHTML     = t['chat__sub'];
      document.documentElement.lang = lang;
      btnEs.classList.toggle('is-active', lang === 'es');
      btnEn.classList.toggle('is-active', lang === 'en');
      btnEs.setAttribute('aria-pressed', String(lang === 'es'));
      btnEn.setAttribute('aria-pressed', String(lang === 'en'));
    }

    btnEs.addEventListener('click', () => applyLang('es'));
    btnEn.addEventListener('click', () => applyLang('en'));
  }

  function init() {
    captureUrlParams();
    trackEvent('page_view');

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

    /* Cursor trail: solo desktop y sin reduced-motion */
    if (!isTouchDevice && !reducedMotion) initCursorTrail();

    /* Duración de sesión al salir */
    window.addEventListener('beforeunload', () => {
      trackEvent('session_duration', {
        ms: Date.now() - SESSION.startTime,
        s:  Math.floor((Date.now() - SESSION.startTime) / 1000),
      });
    });
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
