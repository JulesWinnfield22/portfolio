/**
 * main.ts — Abel Teame Portfolio
 * Initializes: Lenis · GSAP ScrollTrigger · Custom Cursor · Page transitions
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

// ── OVERLAY MAPS ───────────────────────────────────────────────────
const OVERLAY_TITLES: Record<string, string> = {
  home:    'Home',
  work:    'Selected <span class="italic">work.</span>',
  about:   'About.',
  words:   'Words.',
  contact: '<span class="italic">Hi.</span>',
};
const OVERLAY_ROUTES: Record<string, string> = {
  home:    '/ home',
  work:    '/ work',
  about:   '/ about',
  words:   '/ words',
  contact: '/ contact',
};

// ── TRANSITION CONSTANTS ───────────────────────────────────────────
const EASE    = 'expo.inOut';
const DUR     = 0.72;
const STAGGER = 0.08;

// ── LENIS ──────────────────────────────────────────────────────────
let lenis: Lenis | null = null;

function initLenis(): void {
  lenis?.destroy();
  lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });
  lenis.on('scroll', () => ScrollTrigger.update());
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ── NAV ────────────────────────────────────────────────────────────
function initNav(): void {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // derive active route from current URL path
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const ns   = path === '/' ? 'home' : path.slice(1);
  document.querySelectorAll<HTMLElement>('[data-route]').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.route === ns);
  });
}

// ── MOBILE DRAWER ──────────────────────────────────────────────────
function initDrawer(): void {
  const burger  = document.getElementById('nav-burger')  as HTMLButtonElement | null;
  const drawer  = document.getElementById('navDrawer')   as HTMLElement | null;
  const closeBtn = drawer?.querySelector<HTMLButtonElement>('.drawer-close');
  if (!burger || !drawer) return;

  function open(): void {
    document.body.classList.add('menu-open');
    burger!.setAttribute('aria-expanded', 'true');
    burger!.setAttribute('aria-label', 'Close menu');
    drawer!.setAttribute('aria-hidden', 'false');
  }
  function close(): void {
    document.body.classList.remove('menu-open');
    burger!.setAttribute('aria-expanded', 'false');
    burger!.setAttribute('aria-label', 'Open menu');
    drawer!.setAttribute('aria-hidden', 'true');
  }

  burger.addEventListener('click', () =>
    document.body.classList.contains('menu-open') ? close() : open()
  );
  closeBtn?.addEventListener('click', close);

  // Drawer link clicks — close drawer; Barba transition handles navigation
  drawer.querySelectorAll<HTMLElement>('.drawer-link').forEach(link => {
    link.addEventListener('click', close);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) close();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 720 && document.body.classList.contains('menu-open')) close();
  }, { passive: true });
}

// ── CLOCK ─────────────────────────────────────────────────────────
function initClock(): void {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    const local = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 10800000); // UTC+3 Addis
    el.textContent = `${String(local.getHours()).padStart(2,'0')}:${String(local.getMinutes()).padStart(2,'0')}`;
  };
  tick();
  setInterval(tick, 30000);
}

// ── CURSOR ─────────────────────────────────────────────────────────
function initCursor(): void {
  const cursor = document.getElementById('cursor');
  if (!cursor || window.matchMedia('(hover: none)').matches) return;

  // start hidden — prevents the cursor sliding from (0,0) to the mouse
  // position on every page load/navigation
  gsap.set(cursor, { opacity: 0 });

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.2, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.2, ease: 'power3' });

  let placed = false;
  window.addEventListener('mousemove', (e) => {
    if (!placed) {
      // teleport to actual mouse position before revealing
      gsap.set(cursor, { x: e.clientX, y: e.clientY, opacity: 1 });
      placed = true;
    }
    xTo(e.clientX);
    yTo(e.clientY);
  });

  // click pulse — ring expands from exact click point and fades out
  const ring = document.getElementById('cursor-ring');
  if (ring) {
    window.addEventListener('mousedown', (e) => {
      gsap.killTweensOf(ring);
      gsap.timeline()
        .set(ring,  { x: e.clientX, y: e.clientY, scale: 0.2, opacity: 1 })
        .to(ring,   { scale: 2.4, opacity: 0, duration: 0.5, ease: 'power2.out' });
    });
  }

  const attachCursorGrow = (root: Document | Element = document) => {
    root.querySelectorAll('a, button, .tappable, [role="button"]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('lg');
        gsap.killTweensOf(cursor, 'scale');
        gsap.to(cursor, { scale: 1.18, duration: 0.45, ease: 'sine.inOut', repeat: -1, yoyo: true });
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('lg');
        gsap.killTweensOf(cursor, 'scale');
        gsap.to(cursor, { scale: 1, duration: 0.2, ease: 'power2.out' });
      });
    });
  };
  attachCursorGrow();
  (window as any).__attachCursorGrow = attachCursorGrow;
}

// ── HOVER THUMB (PREVIEW CARD) ────────────────────────────────────
function initHoverThumb(root: Document | Element = document): void {
  const card = document.getElementById('thumb');
  if (!card || window.matchMedia('(hover: none)').matches) return;

  const rows = Array.from(root.querySelectorAll<HTMLElement>('.work-row'));
  if (!rows.length) return;

  const CARD_W     = 480;
  const CARD_H     = 480;
  const SLIDE_DUR  = 0.55;
  const SLIDE_EASE = 'expo.inOut';

  // card center follows cursor with ~0.5s lag
  const xTo = gsap.quickTo(card, 'x', { duration: 0.5, ease: 'power3' });
  const yTo = gsap.quickTo(card, 'y', { duration: 0.5, ease: 'power3' });
  let cursorX = 0, cursorY = 0;
  window.addEventListener('mousemove', (e) => {
    cursorX = e.clientX; cursorY = e.clientY;
    xTo(e.clientX - CARD_W / 2);
    yTo(e.clientY - CARD_H / 2);
  });

  // build one cover per row from its data-* attributes
  card.innerHTML = '';
  gsap.set(card, { scale: 0.94 });

  const covers = rows.map((row, i) => {
    const cover = document.createElement('div');
    cover.className   = 'preview-cover';
    cover.dataset.coverIndex = String(i);

    // media — video takes priority over image
    const videoSrc = row.dataset.video;
    const imageSrc = row.dataset.image;
    if (videoSrc) {
      const v = document.createElement('video');
      v.src = videoSrc; v.muted = true; v.loop = true;
      v.setAttribute('playsinline', ''); v.preload = 'none';
      cover.appendChild(v);
    } else if (imageSrc) {
      const img = document.createElement('img');
      img.src = imageSrc; img.alt = row.dataset.thumb ?? ''; img.loading = 'lazy';
      cover.appendChild(img);
    }

    // gradient vignette
    const grad = document.createElement('div');
    grad.className = 'cover-gradient';
    cover.appendChild(grad);

    // top bar: label + AT logo
    const numEl   = row.querySelector('.num')?.textContent?.trim() ?? String(i + 1).padStart(2, '0');
    const projName = (row.dataset.thumb ?? '').split(' — ')[0];
    const top = document.createElement('div');
    top.className = 'cover-top';
    top.innerHTML = `
      <span class="cover-label">→ ${numEl} · ${projName}</span>
      <svg class="cover-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3.5 21 L12 3 L20.5 21"/>
        <path d="M3.5 13 L20.5 13"/>
        <path d="M12 13 L12 17"/>
      </svg>`;
    cover.appendChild(top);

    // bottom bar: name + meta
    const bottom = document.createElement('div');
    bottom.className = 'cover-bottom';
    bottom.innerHTML = `
      <span class="cover-name">${projName}</span>
      <span class="cover-meta">${row.dataset.thumbMeta ?? ''} · view →</span>`;
    cover.appendChild(bottom);

    // park below the card; GSAP owns visibility from here
    gsap.set(cover, { yPercent: 100, opacity: 0 });
    card.appendChild(cover);
    return cover;
  });

  let currentIndex = -1;
  let cardShown    = false;

  function showCard() {
    if (cardShown) return;
    gsap.to(card, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
    cardShown = true;
  }

  function hideCard() {
    if (!cardShown) return;
    gsap.to(card, { opacity: 0, scale: 0.94, duration: 0.3, ease: 'power3.in' });
    cardShown    = false;
    currentIndex = -1;
  }

  function swapTo(nextIndex: number) {
    if (nextIndex === currentIndex) return;

    // direction mirrors the user's travel through the list
    const dir    = (currentIndex === -1 || nextIndex > currentIndex) ? 'down' : 'up';
    const enterY = dir === 'down' ? 100  : -100;
    const leaveY = dir === 'down' ? -100 :  100;

    const next = covers[nextIndex];
    const prev = currentIndex >= 0 ? covers[currentIndex] : null;

    // outgoing: slide out + delayed fade so it doesn't vanish before it moves
    if (prev) {
      gsap.killTweensOf(prev);
      gsap.to(prev, { yPercent: leaveY, duration: SLIDE_DUR, ease: SLIDE_EASE });
      gsap.to(prev, { opacity: 0, duration: 0.25, delay: 0.15 });
    }

    // incoming: set start position then slide in
    gsap.killTweensOf(next);
    gsap.set(next, { yPercent: enterY, opacity: 0 });
    gsap.to(next, { yPercent: 0, duration: SLIDE_DUR, ease: SLIDE_EASE });
    gsap.to(next, { opacity: 1, duration: 0.35 });

    // start playing video on the incoming cover
    const video = next.querySelector<HTMLVideoElement>('video');
    video?.play().catch(() => {});

    // pause outgoing video
    if (prev) prev.querySelector<HTMLVideoElement>('video')?.pause();

    currentIndex = nextIndex;
  }

  // ── mouse events ─────────────────────────────────────────────────
  rows.forEach((row, i) => {
    row.addEventListener('mouseenter', () => { showCard(); swapTo(i); });

    row.addEventListener('mouseleave', (e) => {
      // don't hide if moving straight to another work-row (prevents flicker)
      const rel = (e as MouseEvent).relatedTarget as Element | null;
      if (rel?.closest('.work-row')) return;
      hideCard();
    });
  });

  // ── scroll tracking ───────────────────────────────────────────────
  // fires when user scrolls WITHOUT moving the mouse
  let scrollRaf: number | null = null;

  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      const el  = document.elementFromPoint(cursorX, cursorY);
      const row = el?.closest<HTMLElement>('.work-row');
      if (row) {
        const idx = rows.indexOf(row);
        if (idx !== -1) { showCard(); swapTo(idx); return; }
      }
      if (cardShown) hideCard();
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  lenis?.on('scroll', onScroll);
}

// ── MARQUEE ───────────────────────────────────────────────────────
let marqueeTween: gsap.core.Tween | null = null;

function initMarquee(root: Document | Element = document): void {
  marqueeTween?.kill();
  const track = root.querySelector<HTMLElement>('.marquee-track');
  if (!track) return;

  marqueeTween = gsap.to(track, {
    xPercent: -50,
    duration: 34,
    repeat: -1,
    ease: 'none',
  });

  const marquee = track.closest('.marquee');
  if (marquee) {
    marquee.addEventListener('mouseenter', () => gsap.to(marqueeTween!, { timeScale: 0, duration: 0.5 }));
    marquee.addEventListener('mouseleave', () => gsap.to(marqueeTween!, { timeScale: 1, duration: 0.5 }));
  }
}

// ── SCROLL REVEALS ────────────────────────────────────────────────
function initReveals(root: Document | Element = document): void {
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          once: true,
        },
      }
    );
  });

  root.querySelectorAll('[data-reveal-stagger]').forEach((parent) => {
    gsap.fromTo(Array.from(parent.children),
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: parent,
          start: 'top 92%',
          once: true,
        },
      }
    );
  });
}

// ── HERO LOAD ANIMATION ───────────────────────────────────────────
function animateHeroIn(root: Document | Element = document): void {
  const els = [
    root.querySelector('.hero-load.d1'),
    root.querySelector('.hero-load.d2'),
    root.querySelector('.hero-load.d3'),
  ].filter(Boolean) as Element[];
  if (!els.length) return;

  gsap.fromTo(els,
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 1, ease: 'power4.out', stagger: 0.16 }
  );
}

// ── PER-PAGE INTERACTIONS ─────────────────────────────────────────
function initPageInteractions(container: Document | Element = document): void {
  initNav();
  initClock();
  initHoverThumb(container);
  initMarquee(container);
  initReveals(container);

  const attachCursorGrow = (window as any).__attachCursorGrow;
  if (typeof attachCursorGrow === 'function') attachCursorGrow(container);
}

// ── THEME TOGGLE ──────────────────────────────────────────────────
function initTheme(): void {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    localStorage.setItem('ot-theme', next);
  });
}

// ── PAGE TRANSITION — COVER ───────────────────────────────────────
// Plays on the DEPARTING page. Covers screen, then calls onComplete
// which triggers the hard navigation.
function playCover(ns: string, onComplete: () => void): void {
  const back    = document.querySelector<HTMLElement>('.overlay-panel.back');
  const front   = document.querySelector<HTMLElement>('.overlay-panel.front');
  const content = document.getElementById('overlay-content');
  const routeEl = document.getElementById('overlay-route');
  const titleEl = document.getElementById('overlay-title');
  const overlay = document.getElementById('overlay');

  if (!back || !front || !content) { onComplete(); return; }

  lenis?.stop();

  if (routeEl) routeEl.textContent = OVERLAY_ROUTES[ns] ?? `/ ${ns}`;
  if (titleEl) titleEl.innerHTML   = OVERLAY_TITLES[ns] ?? ns;
  overlay?.classList.add('active');

  // Phase 1+2: back (orange) rises, front (black) follows 80ms later.
  // Phase 2: content fades in mid-cover at 0.32s.
  // Phase 3: hold 300ms so user can read the title before navigation fires.
  gsap.timeline({ onComplete })
    .set([back, front], { yPercent: 100 })
    .set(content, { opacity: 0, y: 20 })
    .to(back,    { yPercent: 0, duration: DUR, ease: EASE })
    .to(front,   { yPercent: 0, duration: DUR, ease: EASE }, STAGGER)
    .to(content, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.32)
    .to({}, { duration: 0.3 });
}

// ── PAGE TRANSITION — REVEAL ──────────────────────────────────────
// Plays on the ARRIVING page. CSS already set panels to yPercent:0
// via html.is-transitioning before JS ran, so there's no flash.
function playReveal(): void {
  const back    = document.querySelector<HTMLElement>('.overlay-panel.back');
  const front   = document.querySelector<HTMLElement>('.overlay-panel.front');
  const content = document.getElementById('overlay-content');
  const overlay = document.getElementById('overlay');

  if (!back || !front || !content) { lenis?.start(); return; }

  lenis?.stop();
  overlay?.classList.add('active');

  // reinforce covered state in GSAP's model (CSS set it visually before JS ran)
  gsap.set([back, front], { yPercent: 0 });
  gsap.set(content, { opacity: 1, y: 0 });

  // CSS class no longer needed — GSAP owns the transforms from here
  document.documentElement.classList.remove('is-transitioning');

  // derive namespace from current URL to decide whether to fire hero anim
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const ns   = path === '/' ? 'home' : path.slice(1);

  // Phase 4: content fades out FIRST so text doesn't slide with panels.
  // Then front exits top, back follows 80ms later.
  // Phase 5: snap panels back below viewport — essential for repeat clicks.
  gsap.timeline({
    onComplete: () => {
      overlay?.classList.remove('active');
      lenis?.start();
      if (ns === 'home') animateHeroIn();
    },
  })
    .to(content, { opacity: 0, duration: 0.2, ease: 'power2.in' })
    .to(front,   { yPercent: -100, duration: DUR, ease: EASE })
    .to(back,    { yPercent: -100, duration: DUR, ease: EASE }, '<' + STAGGER)
    .set([back, front], { yPercent: 100 })
    .set(content, { opacity: 0, y: 20 });
}

// ── LINK INTERCEPTION ─────────────────────────────────────────────
// Catches every internal link click, plays the cover transition,
// then hard-navigates after the animation completes.
function initTransitionLinks(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link) return;

    const url  = link.href;
    const href = link.getAttribute('href') ?? '';

    // skip: modifier keys, new-tab, external, hash-only, mailto/tel, same page
    if (
      e.defaultPrevented               ||
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
      link.target === '_blank'         ||
      href.startsWith('#')             ||
      href.startsWith('mailto:')       ||
      href.startsWith('tel:')          ||
      !url.startsWith(window.location.origin) ||
      url.split('#')[0] === window.location.href.split('#')[0]
    ) return;

    e.preventDefault();

    const path = new URL(url).pathname.replace(/\/$/, '') || '/';
    const ns   = path === '/' ? 'home' : path.slice(1);

    // store ns so the arriving page knows to play the reveal
    sessionStorage.setItem('ot-ns', ns);

    playCover(ns, () => { window.location.href = url; });
  });
}

// ── BOOT ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initCursor();
  initTheme();
  initDrawer();
  initTransitionLinks();
  initPageInteractions();

  if (sessionStorage.getItem('ot-ns')) {
    // arriving via a transition — panels are already covering (CSS)
    sessionStorage.removeItem('ot-ns');
    playReveal();
  } else {
    // first/direct load — no overlay, just animate hero
    animateHeroIn();
  }
});
