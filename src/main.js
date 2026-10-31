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
  // (the second page has no hero; its heading is split like any other)
  const media = $('[data-intro-media]');
  const title = $('.hero__title');
  if (title) {
    const heroSplit = SplitText.create(title, { type: 'words', mask: 'words', wordsClass: 'sw' });
    gsap.set('[data-intro], [data-intro-media]', { opacity: 1 });
    gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => root.classList.add('intro-done') })
      .from(media, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
      .from(media, { yPercent: 4, duration: 2.2 }, 0)
      .from(heroSplit.words, { yPercent: 115, duration: 1.3, stagger: 0.07 }, 0.35)
      .from('.hero__sub', { y: 18, opacity: 0, duration: 1.1 }, 0.75)
      .from('.hero__ctas', { y: 18, opacity: 0, duration: 1.1 }, 0.9);
  }

  // "What Reiki is": words brighten at reading pace as the paragraph scrolls through.
  const introEl = $('[data-scrub-words]');
  if (introEl) {
    const introSplit = SplitText.create(introEl, { type: 'words' });
    gsap.fromTo(introSplit.words, { opacity: 0.16 }, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: introEl, start: 'top 78%', end: 'bottom 42%', scrub: true },
    });
  }

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

  // "Your 21 days": the rail fills as the reader moves through the days.
  if ($('.journey__track')) {
    gsap.fromTo('.journey__fill', { scaleY: 0 }, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.journey__track', start: 'top 70%', end: 'bottom 70%', scrub: true },
    });
  }

  // "No time to learn?": her real constraints arrive one by one, get struck through, and
  // the answer lands last. The stage is held on screen (CSS sticky) while scroll plays it.
  const noTime = $('[data-notime]');
  if (noTime) {
    noTime.classList.add('is-live');
    const excuses = $$('[data-excuse]', noTime);
    const answers = $$('[data-answer]', noTime);
    const strikes = $$('.strike', noTime);
    gsap.set(excuses, { opacity: 0, y: 24 });
    gsap.set(strikes, { scaleX: 0 });
    gsap.set(answers, { opacity: 0, y: 28 });
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: noTime, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
    })
      .to(excuses, { opacity: 1, y: 0, duration: 1, stagger: 0.9 })
      .to(strikes, { scaleX: 1, duration: 1, stagger: 0.35 }, '+=0.4')
      .to(excuses, { opacity: 0.3, duration: 1, stagger: 0.35 }, '<')
      .to(answers[0], { opacity: 1, y: 0, duration: 1.4 }, '>-0.2')
      .to(answers[1], { opacity: 1, y: 0, duration: 1.2 }, '>-0.7')
      .to(answers[2], { opacity: 1, y: 0, duration: 1 }, '>-0.6');
  }

  // Reiki healing: her hands hover above the chest (never touching) and drift slowly down the body.
  // Everything plays only while the picture is on screen.
  const healFig = $('.healing__media');
  if (healFig && $('.heal-sweep')) {
    const sweep = gsap.timeline({ paused: true, repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } });
    sweep.fromTo('.heal-sweep', { y: -52 }, { y: 22, duration: 5.5 });
    const bob = gsap.timeline({ paused: true, repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } });
    bob.to('.hbob--l', { x: -8, y: -3, duration: 2 })
      .to('.hbob--r', { x: -6, y: 3, duration: 2.2 }, 0)
      .to('.hshadow', { scale: 0.88, opacity: 0.16, svgOrigin: '234 321', duration: 2 }, 0)
      .to('.heal-glow', { opacity: 0.55, duration: 2 }, 0);
    ScrollTrigger.create({
      trigger: healFig,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) { sweep.play(); bob.play(); } else { sweep.pause(); bob.pause(); }
      },
    });
  }

  // The certificate hovers gently, as if just handed over. It only moves while it is on screen.
  const cert = $('.cert-float');
  if (cert) {
    const hover = gsap.to(cert, { y: -7, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
    ScrollTrigger.create({
      trigger: cert,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? hover.play() : hover.pause()),
    });
  }

  // Images drift slightly slower than the page, giving the frames depth.
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -14 }, {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  return () => {
    noTime?.classList.remove('is-live');
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = null;
  };
});

// The five principles: pinned, each line lights in turn, one breath per line. Wide screens only.
mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
  if (!$('[data-principles]')) return;
  const lines = $$('[data-principle]');
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '[data-principles]',
      start: 'top top',
      end: () => `+=${window.innerHeight * 1.6}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      // measure this pin before the triggers below it, so their start points include its extra scroll
      refreshPriority: 1,
    },
  });
  tl.fromTo(lines, { opacity: 0.14 }, { opacity: 1, duration: 1, stagger: 1, ease: 'none' });
});

// "Meet your instructor", larger screens: the stage is held while the heading rises and the card arrives.
mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
  const meet = $('[data-meet]');
  if (!meet) return;
  meet.classList.add('is-live');
  const mt = $('[data-meet-title]', meet);
  const mc = $('[data-meet-card]', meet);
  gsap.set(mt, { opacity: 0, y: 36 });
  gsap.set(mc, { opacity: 0, y: 56 });
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: meet, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
  })
    .to(mt, { opacity: 1, y: 0, duration: 1 })
    .to(mc, { opacity: 1, y: 0, duration: 1.2 }, '>-0.2');
  return () => meet.classList.remove('is-live');
});

// "Meet your instructor", phones: no holding, so no empty scrolling. The heading, then the card, fade up as they arrive.
mm.add('(prefers-reduced-motion: no-preference) and (max-width: 767px)', () => {
  [$('[data-meet-title]'), $('[data-meet-card]')].forEach((el) => {
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 30 }, {
      opacity: 1,
      y: 0,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 62%', scrub: true },
    });
  });
});

// Phones: no pinning (it fights the browser bar). Each principle fades up as it scrolls into view.
mm.add('(prefers-reduced-motion: no-preference) and (max-width: 767px)', () => {
  $$('[data-principle]').forEach((line) => {
    gsap.fromTo(line, { opacity: 0.14, y: 22 }, {
      opacity: 1,
      y: 0,
      ease: 'none',
      scrollTrigger: { trigger: line, start: 'top 88%', end: 'top 58%', scrub: true },
    });
  });
});

/* ---------- Hero healer (all motion preferences; reduced motion swaps states without morphing) ---------- */
const healerEl = $('[data-healer]');
const destroyHealer = healerEl
  ? initHealer(healerEl, { reduced: matchMedia('(prefers-reduced-motion: reduce)').matches })
  : () => {};

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
