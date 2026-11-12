import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource-variable/hanken-grotesk/wght-italic.css';
import './garbh.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Shared by the ebook page (garbh-reiki.html) and the personal page (garbh-reiki-personal.html):
// every block below runs only if its elements exist on the current page.
const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Nav gains a backdrop once the page moves. */
const nav = $('[data-nav]');
if (nav) ScrollTrigger.create({ start: 40, end: 'max', onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive) });

/* ---------- Try one minute: she feels it before she pays ---------- */
const tryEl = $('[data-try]');
if (tryEl) {
  const steps = $$('[data-step]', tryEl);
  const show = (n) => steps.forEach((s) => { s.hidden = s.dataset.step !== String(n); });
  const before = $('[data-before]', tryEl), beforeOut = $('[data-before-out]', tryEl);
  const after = $('[data-after]', tryEl), afterOut = $('[data-after-out]', tryEl);
  const cue = $('[data-cue]', tryEl), left = $('[data-left]', tryEl);
  let timer = 0;

  before.addEventListener('input', () => { beforeOut.value = before.value; });
  after.addEventListener('input', () => { afterOut.value = after.value; });

  const finish = () => {
    clearInterval(timer);
    tryEl.classList.remove('is-breathing');
    after.value = before.value; afterOut.value = before.value;
    show(3);
    after.focus();
  };

  $('[data-start]', tryEl).addEventListener('click', () => {
    show(2);
    tryEl.classList.add('is-breathing');
    const start = Date.now();
    const tick = () => {
      const t = (Date.now() - start) / 1000;
      const phase = t % 10; // 4 seconds in, 6 seconds out
      cue.textContent = phase < 4 ? 'breathe in' : 'breathe out';
      const remaining = Math.max(0, Math.ceil(60 - t));
      left.textContent = remaining === 1 ? '1 second' : `${remaining} seconds`;
      if (t >= 60) finish();
    };
    tick();
    timer = setInterval(tick, 250);
    $('[data-skip]', tryEl).focus();
  });
  $('[data-skip]', tryEl).addEventListener('click', finish);

  $('[data-show]', tryEl).addEventListener('click', () => {
    const a = Number(before.value), b = Number(after.value);
    $('[data-from]', tryEl).textContent = a;
    $('[data-to]', tryEl).textContent = b;
    $('[data-msg]', tryEl).textContent =
      b > a ? 'That was one minute. The ebook gives you fifteen, every night.'
      : b === a ? 'Some nights take longer. The ebook gives you fifteen minutes.'
      : "That's okay. Anxious nights are what the full fifteen minutes are for.";
    show(4);
    if (!reduceMotion) gsap.from($('.gtry__score', tryEl), { scale: 0.9, opacity: 0, duration: 0.9, ease: 'expo.out' });
  });
}

/* ---------- Mobile buy bar: visible except over the hero and the buy box ---------- */
const bar = $('[data-bar]');
if (bar) {
  const hidden = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? hidden.add(e.target) : hidden.delete(e.target)));
    const on = hidden.size === 0;
    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', String(!on));
    $('a', bar).tabIndex = on ? 0 : -1;
  });
  ['.ghero', '[data-buy]', '.gmore', '.gfoot'].forEach((s) => { const el = $(s); if (el) io.observe(el); });
}

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Lenis is the only smooth-scroll engine, driven by GSAP's ticker so ScrollTrigger stays in sync.
  const lenis = new Lenis({ anchors: { offset: -80 } });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  const reverts = [];

  /* Hero intro: the lamp warms up, she rises into it, then the words. */
  const title = $('.ghero__title');
  if (title) {
    const heroSplit = SplitText.create(title, { type: 'words', mask: 'words', wordsClass: 'sw' });
    reverts.push(() => heroSplit.revert());
    gsap.set('[data-intro], [data-intro-media]', { opacity: 1 });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => root.classList.add('intro-done') });
    if ($('.breath')) tl.from('.breath', { opacity: 0, scale: 0.85, duration: 2.2 }, 0);
    tl.from($('[data-intro-media] .gbook') || $('[data-intro-media] img'), { y: 40, opacity: 0, duration: 1.8 }, 0.2)
      .from(heroSplit.words, { yPercent: 115, duration: 1.3, stagger: 0.07 }, 0.4)
      .from('.ghero__sub', { y: 18, opacity: 0, duration: 1.1 }, 0.85)
      .from('.ghero .ghero__ctas', { y: 18, opacity: 0, duration: 1.1 }, 1);
    if ($('.breath__count')) tl.from('.breath__count', { opacity: 0, duration: 1.2 }, 1.2);
  } else {
    root.classList.add('intro-done');
  }

  /* The ebook rests facing you and turns towards the cursor, left or right. The pull is full over the book
     and fades out smoothly with distance, so far from the book it simply rests. */
  const book = $('[data-book]');
  if (book && matchMedia('(hover: hover)').matches) {
    const body = $('.gbook__body', book);
    const ry = gsap.quickTo(body, '--ry', { duration: 0.9, ease: 'power3.out' });
    const rx = gsap.quickTo(body, '--rx', { duration: 0.9, ease: 'power3.out' });
    const sx = gsap.quickTo(body, '--sx', { duration: 0.9, ease: 'power3.out' });
    gsap.set(body, { '--ry': 0, '--rx': 0, '--sx': 40 });
    const REACH = 560; // px beyond the book's edge where the pull reaches zero
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const move = (e) => {
      const r = book.getBoundingClientRect(), hw = r.width / 2, hh = r.height / 2;
      const dx = e.clientX - (r.left + hw), dy = e.clientY - (r.top + hh);
      const t = Math.min(1, Math.hypot(Math.max(0, Math.abs(dx) - hw), Math.max(0, Math.abs(dy) - hh)) / REACH);
      const f = 1 - t * t * (3 - 2 * t); // smoothstep falloff
      const px = clamp(dx / hw) * f, py = clamp(dy / hh) * f;
      ry(px * 20); rx(-py * 6); sx(40 + px * 25);
    };
    const rest = () => { ry(0); rx(0); sx(40); };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', rest);
    window.addEventListener('blur', rest);
    reverts.push(() => { window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', rest); window.removeEventListener('blur', rest); gsap.set(body, { clearProps: '--ry,--rx,--sx' }); });
  }

  /* The fear: words brighten at reading pace as the sentence scrolls through. */
  const fear = $('[data-scrub-words]');
  if (fear) {
    const fearSplit = SplitText.create(fear, { type: 'words' });
    reverts.push(() => fearSplit.revert());
    gsap.fromTo(fearSplit.words, { opacity: 0.16 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: fear, start: 'top 78%', end: 'bottom 45%', scrub: true },
    });
  }

  /* Worries: each question is struck through in turn, then the answer arrives. */
  const worries = $$('[data-worries] li');
  if (worries.length) {
    gsap.set(worries, { '--strike': 0 });
    const wtl = gsap.timeline({ scrollTrigger: { trigger: '[data-worries]', start: 'top 70%', end: 'bottom 35%', scrub: 0.6 } });
    worries.forEach((li, i) => wtl.to(li, { '--strike': 1, color: '#7d7090', ease: 'none', duration: 1 }, i));
    wtl.from('[data-worries-answer]', { opacity: 0, y: 24, ease: 'power2.out', duration: 1.2 }, worries.length - 0.2);
  }

  /* Timelines draw themselves as you read down them. */
  const night = $('[data-night]');
  if (night) {
    gsap.fromTo(night, { '--draw': 0 }, { '--draw': 1, ease: 'none', scrollTrigger: { trigger: night, start: 'top 75%', end: 'bottom 60%', scrub: true } });
    gsap.from($$('li', night), { opacity: 0, y: 22, stagger: 0.15, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: night, start: 'top 75%' } });
  }
  const journey = $('[data-journey]');
  if (journey) {
    gsap.fromTo(journey, { '--draw': 0 }, { '--draw': 1, ease: 'none', scrollTrigger: { trigger: journey, start: 'top 85%', end: 'bottom 55%', scrub: true } });
    gsap.from($$('li', journey), { opacity: 0, y: 16, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: journey, start: 'top 80%' } });
  }

  /* Credentials: the joining line draws, then the four tiles rise in turn. */
  $$('[data-creds]').forEach((list) => {
    gsap.fromTo(list, { '--draw': 0 }, { '--draw': 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: list, start: 'top 82%' } });
    gsap.from($$('li', list), { y: 24, opacity: 0, stagger: 0.12, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: list, start: 'top 82%' } });
  });
  if ($('[data-facts]')) gsap.from('[data-facts] li', { y: 16, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '[data-facts]', start: 'top 85%' } });
  if ($('[data-tracker]')) gsap.from('[data-tracker] i', { scale: 0, opacity: 0, stagger: 0.025, duration: 0.6, ease: 'back.out(2)', scrollTrigger: { trigger: '[data-tracker]', start: 'top 88%' } });

  /* The price reveal: ₹1,296 is struck through, then counts down to ₹499.
     Without motion (or JS) the page simply shows ₹499. */
  const price = $('[data-price]');
  if (price) {
    const num = $('[data-count]', price), strike = $('.gbuy__strike', price), was = $('.gbuy__was');
    const FROM = 1296, TO = 499, fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
    const count = { v: FROM };
    num.textContent = fmt(FROM);
    if (was) gsap.set(was, { opacity: 0, y: 10 });
    const ptl = gsap.timeline({ scrollTrigger: { trigger: price, start: 'top 92%', once: true } });
    ptl.fromTo(strike, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.75, ease: 'power2.inOut' }, 0.3)
      .to(strike, { opacity: 0, duration: 0.35 }, '+=0.25')
      .to(count, { v: TO, duration: 1.6, ease: 'power3.out', onUpdate: () => { num.textContent = fmt(count.v); } }, '<')
      .to(was || {}, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, '<0.3')
      .fromTo(price, { scale: 1 }, { scale: 1.08, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: 'left center' }, '-=0.3');
    reverts.push(() => { ptl.kill(); num.textContent = fmt(TO); gsap.set([strike, was, price].filter(Boolean), { clearProps: 'all' }); });
  }

  /* Section headings rise word by word as they arrive. */
  $$('[data-split]').forEach((el) => {
    const s = SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'sw' });
    reverts.push(() => s.revert());
    gsap.from(s.words, { yPercent: 115, duration: 1.2, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* Panels settle in softly. */
  if ($('.gprices__grid')) gsap.from('.gplan', { y: 30, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.gprices__grid', start: 'top 80%' } });
  if ($('[data-chaps]')) gsap.from('[data-chaps] > li', { y: 30, opacity: 0, stagger: 0.12, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '[data-chaps]', start: 'top 82%' } });
  if ($('.gbuy__card')) gsap.from('.gbuy__card', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.gbuy__card', start: 'top 85%' } });
  if ($('.gteacher__media')) gsap.from('.gteacher__media', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.gteacher', start: 'top 75%' } });

  // Measurements change once fonts and images land.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    reverts.forEach((r) => r());
  };
});

// Reduced motion: everything is already in its final state via CSS defaults.
mm.add('(prefers-reduced-motion: reduce)', () => {
  root.classList.add('intro-done');
});
