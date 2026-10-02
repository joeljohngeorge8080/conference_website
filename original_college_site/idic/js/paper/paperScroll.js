/*
 * Paper scroll choreography. One fixed canvas, one mesh: the same object the
 * whole way down.
 *
 *   start   flat, tilted, in the empty right margin beside the stat strip
 *           ("2 Host institutions"); it rides up with the page until it
 *           reaches the lane height, then holds there (so it appears to
 *           travel down the page)
 *   crumple scrubbed over the next 0.55 viewport heights, into a ball
 *   descend rolls down the right margin, which never holds text
 *   cross   when the empty band between Institutions and Call for Papers
 *           reaches the lane it rides with that band, moving left across
 *           the page without touching any text
 *   dock    drops into the left margin beside the "Call for Papers" heading,
 *           tilted the other way, still crumpled
 *   unfold  once docked it opens back up into the flat marked sheet,
 *           while pinned (the sheet's original form, original tilt)
 *   pinned  from then on the pose is the live rect of [data-paper-slot],
 *           which sits in the sticky heading column, so the paper stays
 *           pinned while the track list scrolls and releases with the column
 *
 * GSAP ScrollTrigger (scrub) owns the progress value; scroll only marks a
 * dirty flag and a single rAF draws. No per-scroll state or DOM writes.
 *
 * Where the margins are too narrow for the paper (tablet / phone) it falls
 * back to a smaller paper along the right edge, docking in a reserved box below the heading.
 */
import { createPaperScene } from './paperScene.js';
import { wrapAt, tAt, tumbleAt, unfoldAt } from './paperTimeline.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

const slot = document.querySelector('[data-paper-slot]');
const tracks = document.getElementById('tracks');
const institutions = document.getElementById('institutions');
const facts = document.querySelector('.sj-facts');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CM = 96 / 2.54;                 // CSS pixels per cm
const PAPER_W_MAX = 4 * CM;           // 4 cm wide, 6 cm tall at full size
const TILT_START = -0.13;             // rad, flat sheet beside the stat strip
const TILT_END = 0.16;                // rad, crumpled ball as it docks beside the heading
const sm = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Layout position independent of the current scroll (ScrollTrigger scrolls the
// page around while it refreshes, so rect.top + scrollY can be momentarily stale).
function docTop(el) {
  let y = 0;
  for (let e = el; e; e = e.offsetParent) y += e.offsetTop;
  return y;
}

function start() {
  if (!gsap || !ScrollTrigger || !slot || !tracks || !institutions || !facts) return;
  gsap.registerPlugin(ScrollTrigger);

  const canvas = document.createElement('canvas');
  canvas.className = 'sj-paper-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const small = window.innerWidth < 768;
  const tablet = window.innerWidth < 1100;
  let scene;
  try {
    document.body.appendChild(canvas);
    scene = createPaperScene(canvas, {
      segX: small ? 48 : tablet ? 70 : 96,
      segY: small ? 72 : tablet ? 104 : 144,
      maxDpr: small ? 2 : 2.5,
    });
  } catch (err) {
    canvas.remove();
    document.documentElement.classList.add('no-paper');
    return;
  }

  const head = slot.parentElement;
  let vw = 0, vh = 0;
  let L = null;                         // measured layout, see layout()
  const state = { p: 0 };               // scrubbed 0..1 across [0, L.sUnfold]
  let dirty = true;
  let lost = false;
  let raf = 0;

  function layout() {
    vw = document.documentElement.clientWidth;
    vh = window.innerHeight;
    scene.setSize(vw, vh);

    // measure with the sticky column unstuck, in document space
    const prev = head.style.position, prevTop = head.style.top;
    head.style.position = 'relative';
    head.style.top = 'auto';   // sticky's offset would otherwise shift a relative box
    slot.style.cssText = '';

    const dl = facts.querySelector('dl') || facts;
    const rightMargin = vw - dl.getBoundingClientRect().right;
    const leftMargin = head.getBoundingClientRect().left;
    const margin = Math.min(rightMargin, leftMargin);
    const gutter = margin >= 76;       // room for the paper beside the content

    const w = gutter ? Math.min(PAPER_W_MAX, margin - 28) : 64;
    const h = w * 1.5;
    const startX = gutter ? vw - rightMargin / 2 : vw - w / 2 - 6;

    // slot: left margin beside the heading (desktop) or right of it (narrow)
    const heading = head.querySelector('.section-header');
    const headingMid = heading.offsetTop + heading.offsetHeight / 2;
    slot.style.width = w + 'px';
    slot.style.height = h + 'px';
    if (gutter) {
      slot.style.top = (headingMid - h / 2) + 'px';
      slot.style.left = -(leftMargin + w) / 2 + 'px';
    } else {
      // no margin to use: sit in the flow just below the heading
      slot.style.position = 'relative';
      slot.style.margin = '0 0 24px';
    }

    const slotCenterDoc = docTop(slot) + h / 2;
    const headDocTop = docTop(head);
    const instBottom = docTop(institutions) + institutions.offsetHeight
      - parseFloat(getComputedStyle(institutions).paddingBottom || '0');
    head.style.position = prev;
    head.style.top = prevTop;

    const laneY = vh * 0.6;
    const startDocY = docTop(facts) + facts.offsetHeight / 2;
    const bandDoc = (instBottom + headDocTop) / 2;       // empty band centre

    const s0 = Math.max(0, startDocY - laneY);           // crumple starts
    const s1 = s0 + vh * 0.55;                           // fully a ball
    const stickY = 76 + 24;                              // header + sticky offset
    let sx, dur, sEnd;
    if (gutter) {
      sx = Math.max(s1, bandDoc - laneY);                // band reaches the lane
      dur = vh * 0.4;                                    // crossing length
      sEnd = Math.max(headDocTop - stickY, sx + dur + vh * 0.2);
    } else {
      sx = dur = 0;
      sEnd = Math.max(slotCenterDoc - laneY, s1 + vh * 0.8);
    }

    const sUnfold = sEnd + vh * 0.5;                     // flat again

    L = { gutter, w, h, startX, startDocY, laneY, bandDoc, s0, s1, sx, dur, sEnd, sUnfold };
    dirty = true;
  }

  function pose() {
    const r = slot.getBoundingClientRect();
    const slotX = r.left + r.width / 2;
    const slotY = r.top + r.height / 2;
    const inView = (y, s) => y > -s && y < vh + s;

    if (reduced) {
      // stable state: flat marked sheet beside the heading, no animation
      return { x: slotX, y: slotY, size: r.height, wrap: 0, rx: 0, ry: 0, rz: TILT_END, shadow: 1, visible: inView(slotY, r.height) };
    }

    const scroll = state.p * L.sUnfold;
    const t = tAt(scroll, L.s0, L.s1);
    const tumble = tumbleAt(scroll, L.s1, L.sEnd, TILT_START, TILT_END);
    const unf = unfoldAt(scroll, L.sEnd, L.sUnfold);
    tumble.rz += (TILT_START - TILT_END) * unf;   // back to the sheet's first tilt

    // ride with the page until the lane, then hold; once the empty band
    // arrives at the lane, ride with the band
    let y = Math.max(L.startDocY - scroll, L.laneY);
    if (L.gutter) y = Math.min(y, L.bandDoc - scroll);

    const k = L.gutter ? sm(clamp01((scroll - L.sx) / L.dur)) : 0;   // crossing
    let x = L.startX + (slotX - L.startX) * k;

    // dock: drop from the band into the slot
    const e = L.gutter
      ? sm(clamp01((scroll - (L.sx + L.dur)) / (L.sEnd - (L.sx + L.dur))))
      : sm(clamp01((scroll - (L.sEnd - vh * 0.5)) / (vh * 0.5)));
    if (!L.gutter) x = L.startX + (slotX - L.startX) * e;
    y = y + (slotY - y) * e;

    if (scroll >= L.sEnd) { x = slotX; y = slotY; }   // pinned: exactly the slot
    return {
      x, y, size: r.height,
      wrap: wrapAt(t) * (1 - unf),
      rx: tumble.rx, ry: tumble.ry, rz: tumble.rz,
      shadow: 1,
      visible: inView(y, r.height),
    };
  }

  function draw() {
    raf = 0;
    if (lost || !dirty) return;
    dirty = false;
    const p = pose();
    canvas.style.visibility = p.visible ? 'visible' : 'hidden';
    if (p.visible) scene.render(p);
    canvas.classList.add('is-ready');
  }
  function request() {
    dirty = true;
    if (!raf) raf = requestAnimationFrame(draw);
  }

  layout();

  if (!reduced) {
    gsap.to(state, {
      p: 1,
      ease: 'none',
      onUpdate: request,
      scrollTrigger: {
        trigger: document.documentElement,
        start: 0,
        end: () => L.sUnfold,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  }
  window.addEventListener('scroll', request, { passive: true });
  ScrollTrigger.addEventListener('refreshInit', layout);
  ScrollTrigger.addEventListener('refresh', request);
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { layout(); request(); }, 120);
  });
  // (web fonts and images change section heights after first paint)
  let refreshTimer = 0;
  const refreshSoon = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  };
  if ('ResizeObserver' in window) new ResizeObserver(refreshSoon).observe(document.body);
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('800 100px "Big Shoulders Display"')
      .then(() => document.fonts.load('600 20px "Instrument Sans"'))
      .then(() => { scene.refreshMark(); request(); refreshSoon(); })
      .catch(() => {});
  }
  window.addEventListener('load', refreshSoon);

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; request(); });
  window.addEventListener('pagehide', () => { scene.dispose(); });

  request();
  window.__paper = { state, get breaks() { return L; }, request };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
