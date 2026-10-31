import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource-variable/hanken-grotesk/wght-italic.css';
import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { initHealer } from './healer.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
let lenis = null;

/* ---------- Navigation ---------- */
const nav = $('[data-nav]');
const menuBtn = $('[data-menu-btn]');
const menuLabel = $('[data-menu-label]');

function setMenu(open) {
  nav.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuLabel.textContent = open ? 'Close menu' : 'Open menu';
  open ? lenis?.stop() : lenis?.start();
}
const onMenuClick = () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
const onKey = (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenu(false);
    menuBtn.focus();
  }
};
const closeMenu = () => setMenu(false);
menuBtn.addEventListener('click', onMenuClick);
document.addEventListener('keydown', onKey);
$$('#site-menu a').forEach((a) => a.addEventListener('click', closeMenu));

const navState = ScrollTrigger.create({
  start: 40,
  end: 'max',
  onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
});

/* ---------- Motion (only when the visitor allows it) ---------- */
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Lenis is the single smooth-scroll engine, driven by GSAP's ticker so ScrollTrigger stays in sync.
  lenis = new Lenis({ anchors: { offset: -72 } });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // Hero intro: the arch opens like a window, then the words rise, then the invitation.
  const media = $('[data-intro-media]');
  const title = $('.hero__title');
  const heroSplit = SplitText.create(title, { type: 'words', mask: 'words', wordsClass: 'sw' });
  gsap.set('[data-intro], [data-intro-media]', { opacity: 1 });
  gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => root.classList.add('intro-done') })
    .from(media, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
    .from(media, { yPercent: 4, duration: 2.2 }, 0)
    .from(heroSplit.words, { yPercent: 115, duration: 1.3, stagger: 0.07 }, 0.35)
    .from('.hero__sub', { y: 18, opacity: 0, duration: 1.1 }, 0.75)
    .from('.hero__ctas', { y: 18, opacity: 0, duration: 1.1 }, 0.9);

  // "What Reiki is": words brighten at reading pace as the paragraph scrolls through.
  const introEl = $('[data-scrub-words]');
  const introSplit = SplitText.create(introEl, { type: 'words' });
  gsap.fromTo(introSplit.words, { opacity: 0.16 }, {
    opacity: 1,
    stagger: 0.1,
    ease: 'none',
    scrollTrigger: { trigger: introEl, start: 'top 78%', end: 'bottom 42%', scrub: true },
  });

  // Section headings rise word by word as they arrive.
  $$('[data-split]').filter((el) => el !== title).forEach((el) => {
    const s = SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'sw' });
    gsap.from(s.words, {
      yPercent: 115,
      duration: 1.2,
      stagger: 0.06,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });

  // Supporting copy follows its heading.
  gsap.set('[data-fade]', { opacity: 0, y: 24 });
  ScrollTrigger.batch('[data-fade]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.09, ease: 'expo.out', delay: 0.15 }),
  });

  // Images drift slightly slower than the page, giving the frames depth.
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -14 }, {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = null;
  };
});

// The five principles: pinned, each line lights in turn, one breath per line. Wide screens only.
mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
  const lines = $$('[data-principle]');
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '[data-principles]',
      start: 'top top',
      end: () => `+=${window.innerHeight * 1.6}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
  tl.fromTo(lines, { opacity: 0.14 }, { opacity: 1, duration: 1, stagger: 1, ease: 'none' });
});

/* ---------- Hero healer (all motion preferences; reduced motion swaps states without morphing) ---------- */
const destroyHealer = initHealer($('[data-healer]'), {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
});

/* ---------- Measurements ---------- */
const refresh = () => ScrollTrigger.refresh();
document.fonts?.ready.then(refresh);
window.addEventListener('load', refresh, { once: true });

/* ---------- Cleanup (dev hot reload) ---------- */
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    mm.revert();
    destroyHealer();
    navState.kill();
    menuBtn.removeEventListener('click', onMenuClick);
    document.removeEventListener('keydown', onKey);
    $$('#site-menu a').forEach((a) => a.removeEventListener('click', closeMenu));
    window.removeEventListener('load', refresh);
  });
}
