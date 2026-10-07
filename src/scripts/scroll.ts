/**
 * scroll.ts — Abel Teame Portfolio
 * Scroll-driven cinema. Everything here is scrubbed off scroll position:
 * ambient field, layered parallax, the expanding reel, word-by-word
 * highlights, the pinned cycler, wipe headings and the chapter rail.
 *
 * Imported by main.ts — never wired up from a component.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const coarse = () =>
  window.matchMedia('(max-width: 720px)').matches;

/** Page-long scrub trigger — used by the fixed ambient/progress layers. */
const pageScrub = (scrub: number | boolean = true): ScrollTrigger.Vars => ({
  trigger: document.documentElement,
  start: 0,
  end: 'max',
  scrub,
});

// ── SCROLL PROGRESS RAIL ───────────────────────────────────────────
// 2px accent line pinned to the top of the viewport, scaleX = progress.
function initProgress(): void {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  gsap.fromTo(bar,
    { scaleX: 0 },
    { scaleX: 1, ease: 'none', scrollTrigger: pageScrub(0.3) }
  );
}

// ── AMBIENT FIELD ──────────────────────────────────────────────────
// Soft radial glows behind everything. Each blob drifts at its own rate
// on scroll and leans a few pixels toward the pointer — the cheap trick
// that makes a flat background read as depth.
function initAmbient(): void {
  const field = document.getElementById('ambient');
  if (!field) return;

  const blobs = Array.from(field.querySelectorAll<HTMLElement>('.ambient-blob'));
  if (!blobs.length) return;

  if (reduced()) { gsap.set(field, { opacity: 0.6 }); return; }

  // scroll drift — alternating directions, increasing travel per layer
  blobs.forEach((blob, i) => {
    const dir = i % 2 ? 1 : -1;
    gsap.fromTo(blob,
      { yPercent: dir * -14, xPercent: dir * -5 },
      {
        yPercent: dir * 26,
        xPercent: dir * 7,
        rotate: dir * 24,
        ease: 'none',
        scrollTrigger: pageScrub(1.4),
      }
    );
  });

  // pointer lean — skipped on touch, where there is no pointer to follow
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const leans = blobs.map((blob, i) => ({
    x: gsap.quickTo(blob, 'x', { duration: 1.2, ease: 'power3' }),
    y: gsap.quickTo(blob, 'y', { duration: 1.2, ease: 'power3' }),
    depth: (i + 1) * 18,
  }));

  window.addEventListener('mousemove', (e) => {
    const nx = e.clientX / window.innerWidth  - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    leans.forEach(({ x, y, depth }) => { x(nx * depth); y(ny * depth); });
  }, { passive: true });
}

// ── GENERIC PARALLAX ───────────────────────────────────────────────
// [data-parallax] with optional data-parallax-speed (default .18).
// Travel is symmetric around the element's natural position, so it sits
// exactly where the CSS put it when centred in the viewport.
function initParallax(root: Document | Element = document): void {
  if (reduced()) return;

  root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallaxSpeed ?? '0.18');
    const travel = () => window.innerHeight * speed * 0.5;

    gsap.fromTo(el,
      { y: () => travel() },
      {
        y: () => -travel(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}

// ── MEDIA PARALLAX ─────────────────────────────────────────────────
// Media inside a clipped frame travels slower than the frame itself.
// The media is over-scaled in CSS so the edges never pull into view.
function initMediaParallax(root: Document | Element = document): void {
  if (reduced()) return;

  root.querySelectorAll<HTMLElement>('[data-parallax-media]').forEach((frame) => {
    const media = frame.querySelector<HTMLElement>('img, video');
    if (!media) return;

    gsap.fromTo(media,
      { yPercent: -9 },
      {
        yPercent: 9,
        ease: 'none',
        scrollTrigger: {
          trigger: frame,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

// ── HERO DEPARTURE ─────────────────────────────────────────────────
// The hero doesn't scroll away as one plane — each row leaves at its own
// speed and the name blurs out, so the page feels like it has air in it.
function initHeroScroll(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero || reduced()) return;

  const rows    = hero.querySelectorAll('.hero-name .row');
  const cols    = hero.querySelectorAll('.hero-status .col');
  const tagline = hero.querySelector('.hero-tagline');
  const cue     = hero.querySelector('.hero-bottom .right');

  // children — never the .hero-load elements themselves, whose opacity
  // and y belong to animateHeroIn()
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
    },
  });

  if (cols.length)    tl.to(cols,    { yPercent: -180, opacity: 0, ease: 'none', stagger: 0.04 }, 0);
  if (rows.length)    tl.to(rows[0], { yPercent: -34,  ease: 'none' }, 0);
  if (rows.length > 1) tl.to(rows[1], { yPercent: -62, ease: 'none' }, 0);
  if (tagline)        tl.to(tagline, { yPercent: -90,  opacity: 0.15, ease: 'none' }, 0);
  if (cue)            tl.to(cue,     { yPercent: -140, opacity: 0,    ease: 'none' }, 0);

  // blur the whole name block — one filtered element, not six
  const name = hero.querySelector('.hero-name');
  if (name) tl.to(name, { filter: 'blur(9px)', opacity: 0.3, ease: 'none' }, 0.1);
}

// ── EXPANDING REEL ─────────────────────────────────────────────────
// The signature move: a small inset panel that opens into a full-bleed
// frame as you scroll past it. The media is always full-bleed — only the
// window onto it grows, so nothing stretches.
function initReel(root: Document | Element = document): void {
  const reel = root.querySelector<HTMLElement>('[data-reel]');
  if (!reel) return;

  const frame    = reel.querySelector<HTMLElement>('.reel-frame');
  const slidesEl = reel.querySelector<HTMLElement>('.reel-slides');
  const slides   = Array.from(reel.querySelectorAll<HTMLElement>('.reel-slide'));
  const captions = Array.from(reel.querySelectorAll<HTMLElement>('.reel-caption'));
  const dots     = Array.from(reel.querySelectorAll<HTMLElement>('.reel-dot'));
  const hud      = reel.querySelectorAll('.reel-hud > *');
  if (!frame || !slides.length) return;

  // Fraction of the section spent opening the panel; the rest cycles slides.
  const OPEN = 0.3;

  if (reduced()) {
    gsap.set(frame, { clipPath: 'inset(0px 0px round 0px)' });
    gsap.set(slides[0], { opacity: 1 });
    gsap.set(captions[0], { opacity: 1, y: 0 });
    dots[0]?.classList.add('is-on');
    return;
  }

  // ── phase 1: the panel opens ─────────────────────────────────────
  const insetY = () => (coarse() ? 0.10 : 0.17) * window.innerHeight;
  const insetX = () => (coarse() ? 0.06 : 0.16) * window.innerWidth;

  const open = gsap.timeline({
    scrollTrigger: {
      trigger: reel,
      start: 'top top',
      end: () => `+=${window.innerHeight * 1.3}`,
      scrub: 0.5,
      invalidateOnRefresh: true,
    },
  });

  open.fromTo(frame,
    { clipPath: () => `inset(${insetY()}px ${insetX()}px round 26px)` },
    { clipPath: 'inset(0px 0px round 0px)', ease: 'power2.inOut', duration: 1 }, 0);

  if (slidesEl) open.fromTo(slidesEl, { scale: 1.22 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0);

  // the corner HUD belongs to the small panel — it goes once we're full bleed
  if (hud.length) open.to(hud, { opacity: 0, y: -10, duration: 0.3, stagger: 0.04 }, 0.15);

  // ── phase 2: cycle the slides ────────────────────────────────────
  let current = -1;

  const show = (next: number) => {
    if (next === current || !slides[next]) return;

    slides.forEach((sl, i) => {
      if (i === next) return;
      gsap.killTweensOf(sl);
      if (gsap.getProperty(sl, 'opacity') === 0) return;
      gsap.to(sl, { opacity: 0, duration: 0.45, ease: 'power2.inOut' });
    });
    gsap.killTweensOf(slides[next]);
    gsap.to(slides[next], { opacity: 1, duration: 0.55, ease: 'power2.inOut' });

    captions.forEach((cap, i) => {
      if (i === next) return;
      gsap.killTweensOf(cap);
      if (gsap.getProperty(cap, 'opacity') === 0) return;
      gsap.to(cap, { opacity: 0, y: -18, duration: 0.3, ease: 'power2.in' });
    });
    if (captions[next]) {
      gsap.killTweensOf(captions[next]);
      gsap.fromTo(captions[next],
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    }

    dots.forEach((d, i) => d.classList.toggle('is-on', i === next));
    current = next;
  };

  gsap.set(slides, { opacity: 0 });
  gsap.set(captions, { opacity: 0 });

  ScrollTrigger.create({
    trigger: reel,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: ({ progress }) => {
      // hold slide 0 (uncaptioned) while the panel is still opening
      if (progress < OPEN) { show(0); return; }
      const p = (progress - OPEN) / (1 - OPEN);
      show(Math.min(slides.length - 1, Math.floor(p * slides.length)));
    },
  });

  // No separate visibility trigger for captions: they ride with their slide,
  // and during the opening phase the frame's clip-path already hides them
  // (the caption sits below the inset panel's bottom edge).
}

// ── WORD-BY-WORD HIGHLIGHT ─────────────────────────────────────────
// [data-highlight] — words lift from dim to full as the block crosses
// the viewport. Reads as the sentence being spoken rather than displayed.
function initHighlight(root: Document | Element = document): void {
  const targets = root.querySelectorAll<HTMLElement>('[data-highlight]');
  if (!targets.length) return;

  targets.forEach((el) => {
    if (reduced()) { el.classList.add('hl-ready'); return; }

    const split = new SplitText(el, { type: 'words', wordsClass: 'hl-word' });
    el.classList.add('hl-ready');

    gsap.fromTo(split.words,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.6,
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          end: 'bottom 55%',
          scrub: true,
        },
      }
    );
  });
}

// ── WIPE HEADINGS ──────────────────────────────────────────────────
// Two stacked copies of the same words; the accent copy is revealed by a
// clip that opens left-to-right on scroll.
function initWipe(root: Document | Element = document): void {
  root.querySelectorAll<HTMLElement>('[data-wipe]').forEach((el) => {
    const fill = el.querySelector<HTMLElement>('.wipe-fill');
    if (!fill) return;

    if (reduced()) { gsap.set(fill, { clipPath: 'inset(0 0% 0 0)' }); return; }

    gsap.fromTo(fill,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'bottom 58%',
          scrub: 0.4,
        },
      }
    );
  });
}

// ── PINNED CYCLER ──────────────────────────────────────────────────
// A tall section whose sticky child swaps one word for the next as you
// pass through it. Blur on the swap sells the focus pull.
function initCycler(root: Document | Element = document): void {
  const cycler = root.querySelector<HTMLElement>('[data-cycler]');
  if (!cycler) return;

  const words = Array.from(cycler.querySelectorAll<HTMLElement>('.cycler-word'));
  const dots  = Array.from(cycler.querySelectorAll<HTMLElement>('.cycler-dot'));
  if (!words.length) return;

  let current = -1;

  const show = (next: number) => {
    if (next === current || !words[next]) return;

    const back = next < current;

    // Clear every other word, not just the previous one. A fast flick can
    // skip indices, and without this the skipped words stay stacked on top
    // of each other at full opacity.
    words.forEach((word, i) => {
      if (i === next) return;
      gsap.killTweensOf(word);
      if (gsap.getProperty(word, 'opacity') === 0) return;
      gsap.to(word, {
        opacity: 0,
        filter: 'blur(14px)',
        yPercent: back ? 18 : -18,
        duration: 0.28,
        ease: 'power2.in',
      });
    });

    gsap.killTweensOf(words[next]);
    gsap.fromTo(words[next],
      { opacity: 0, filter: 'blur(14px)', yPercent: back ? -18 : 18 },
      { opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: 0.45, ease: 'power3.out' }
    );

    dots.forEach((d, i) => d.classList.toggle('is-on', i === next));
    current = next;
  };

  gsap.set(words, { opacity: 0, filter: 'blur(14px)' });

  if (reduced()) { show(0); return; }

  ScrollTrigger.create({
    trigger: cycler,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: ({ progress }) => {
      // clamp so the last word still gets its full slice
      const i = Math.min(words.length - 1, Math.floor(progress * words.length));
      show(i);
    },
    onLeaveBack: () => show(0),
  });
}

// ── STATEMENT COLOUR FIELD ─────────────────────────────────────────
// Full-bleed accent panel. The dark blob inside drifts against the scroll
// so the flat colour never sits still.
function initStatement(root: Document | Element = document): void {
  const panel = root.querySelector<HTMLElement>('[data-statement]');
  if (!panel || reduced()) return;

  const blob    = panel.querySelector<HTMLElement>('.statement-blob');
  const credits = panel.querySelectorAll<HTMLElement>('.statement-credits');

  if (blob) {
    gsap.fromTo(blob,
      { yPercent: -18, scale: 0.85 },
      {
        yPercent: 18, scale: 1.1, ease: 'none',
        scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 1 },
      }
    );
  }

  credits.forEach((col, i) => {
    gsap.fromTo(col,
      { y: 60 * (i ? -1 : 1) },
      {
        y: -60 * (i ? -1 : 1), ease: 'none',
        scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

// ── CHAPTER RAIL ───────────────────────────────────────────────────
// Bottom-centre pill. Hidden over the hero, then tracks whichever
// [data-chapter] section owns the middle of the viewport.
function initChapters(root: Document | Element = document): void {
  const rail = document.getElementById('chapters');
  if (!rail) return;

  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-chapter]'));
  const links    = Array.from(rail.querySelectorAll<HTMLAnchorElement>('.chapter-link'));

  if (!sections.length) { rail.remove(); return; }

  // reveal once the hero is behind us
  const hero = root.querySelector<HTMLElement>('.hero');
  if (hero) {
    ScrollTrigger.create({
      trigger: hero,
      start: 'bottom 70%',
      onEnter:     () => rail.classList.add('is-on'),
      onLeaveBack: () => rail.classList.remove('is-on'),
    });
  } else {
    rail.classList.add('is-on');
  }

  const setActive = (id: string) => {
    links.forEach((l) => l.classList.toggle('is-on', l.dataset.chapterLink === id));
  };

  sections.forEach((section) => {
    const id = section.dataset.chapter!;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: ({ isActive }) => { if (isActive) setActive(id); },
    });
  });

  // anchor clicks — main.ts's link interception skips hash hrefs, so this
  // is the only handler in play
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.chapterLink!);
      if (!target) return;
      const lenis = (window as any).__lenis;
      if (lenis) lenis.scrollTo(target, { offset: -40, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ── WORK ROW DEPTH ─────────────────────────────────────────────────
// The index numbers drift against the list as it passes — small, but it
// stops a flat row of links from reading as a table.
function initWorkDepth(root: Document | Element = document): void {
  const list = root.querySelector<HTMLElement>('.work-list');
  if (!list || reduced()) return;

  const nums = list.querySelectorAll('.work-row .num');
  if (!nums.length) return;

  gsap.fromTo(nums,
    { y: 26 },
    {
      y: -26,
      ease: 'none',
      stagger: 0.04,
      scrollTrigger: { trigger: list, start: 'top bottom', end: 'bottom top', scrub: true },
    }
  );
}

// ── ENTRY POINT ────────────────────────────────────────────────────
export function initScrollFX(container: Document | Element = document): void {
  initProgress();
  initAmbient();
  initHeroScroll();
  initReel(container);
  initCycler(container);
  initStatement(container);
  initHighlight(container);
  initWipe(container);
  initParallax(container);
  initMediaParallax(container);
  initWorkDepth(container);
  initChapters(container);

  // web fonts land after first paint and change every measurement
  if ('fonts' in document) {
    (document as any).fonts.ready.then(() => ScrollTrigger.refresh());
  }
}
