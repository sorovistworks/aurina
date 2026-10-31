import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Calm shapes for each feature. Every path keeps the same commands as its stressed
// version in index.html, so GSAP interpolates the numbers into a true morph.
// [selector, calm path, start, duration] on a 0..1 timeline.
const MORPHS = [
  ['#brow-l', 'M 164 149 Q 175 142 186 147', 0, 0.75],
  ['#brow-r', 'M 236 149 Q 225 142 214 147', 0, 0.75],
  ['#lid-l', 'M 165 171 Q 176 179 187 171', 0.15, 0.85],
  ['#lid-r', 'M 213 171 Q 224 179 235 171', 0.15, 0.85],
  ['#mouth', 'M 184 220 C 190 229 196 231 200 231 C 204 231 210 229 216 220', 0.25, 0.75],
];

/**
 * The hero "healer": a stressed figure that settles into calm while a healing hand rests on her.
 * Works with mouse/pen (hover), touch (tap holds the calm for a moment) and keyboard (focus).
 */
export function initHealer(fig, { reduced = false } = {}) {
  const q = gsap.utils.selector(fig);
  const hand = q('.healer__hand')[0];
  let breathe = null;
  let jitter = null;
  let watch = null;

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'none' },
    onUpdate() {
      const p = tl.progress();
      fig.style.setProperty('--heal', p.toFixed(3));
      breathe?.timeScale(1 - p * 0.62); // quick shallow breaths slow to long ones
    },
  });
  for (const [sel, d, at, dur] of MORPHS) tl.to(q(sel), { attr: { d }, duration: dur }, at);
  tl.to(q('.pupil'), { scaleY: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.3 }, 0.12)
    .to(q('.stress'), { opacity: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.4 }, 0)
    .to(q('.stress-face'), { opacity: 0, duration: 0.5 }, 0)
    .fromTo(q('.halo'), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, svgOrigin: '200 176', duration: 0.7, stagger: 0.12 }, 0.3)
    .fromTo(q('.spark'), { opacity: 0, scale: 0 }, { opacity: 0.9, scale: 1, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.08 }, 0.6)
    .to(q('#head'), { rotation: -3, y: 2, svgOrigin: '200 258', duration: 1 }, 0)
    .to(q('#body'), { y: 4, duration: 1 }, 0);

  if (!reduced) {
    breathe = gsap.to(q('#body'), { scaleY: 1.014, transformOrigin: '50% 100%', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    jitter = gsap.to(q('.stress'), { rotation: 7, transformOrigin: '50% 50%', duration: 0.16, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    // idle loops only run while the hero is on screen
    watch = ScrollTrigger.create({
      trigger: fig,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (s) => { breathe.paused(!s.isActive); jitter.paused(!s.isActive); },
    });
  }

  let pending = null;
  const go = (to) => {
    if (reduced) return void tl.progress(to); // final state at once, no morphing
    const dist = Math.max(Math.abs(to - tl.progress()), 0.2);
    gsap.to(tl, {
      progress: to,
      duration: (to ? 2 : 3) * dist,
      ease: to ? 'sine.out' : 'sine.inOut',
      overwrite: true,
    });
  };
  // Once she has been healed she stays calm until the page is refreshed.
  let healed = false;
  const heal = () => { healed = true; pending?.kill(); go(1); };
  const release = (hold) => { if (healed) return; pending?.kill(); pending = gsap.delayedCall(hold, () => go(0)); };

  // The hand: follows the pointer with a little lag so it feels weighted, not glued.
  // anchored at the wrist: the palm floats just above the pointer, so her face stays visible
  gsap.set(hand, { xPercent: -50, yPercent: -96 });
  const ease = { duration: reduced ? 0 : 0.5, ease: 'power3.out' };
  const xTo = gsap.quickTo(hand, 'x', ease);
  const yTo = gsap.quickTo(hand, 'y', ease);
  const place = (x, y, jump) => (jump ? (xTo(x, x), yTo(y, y)) : (xTo(x), yTo(y)));
  const local = (e) => {
    const r = fig.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  // Healing starts only when the hand comes near her face (see look()), not anywhere on the frame.
  let near = false;
  const onEnter = (e) => {
    place(...local(e), true);
    fig.classList.add('has-hand');
  };
  const onMove = (e) => place(...local(e));
  const onLeave = (e) => {
    fig.classList.remove('has-hand');
    near = false;
    release(e.pointerType === 'touch' ? 2.4 : 0.5); // a tap holds the calm a little longer
  };
  const onFocus = () => {
    const r = fig.getBoundingClientRect();
    place(r.width * 0.5, r.height * 0.26, true); // palm rests above her crown
    fig.classList.add('has-hand');
    heal();
  };
  const onBlur = () => { fig.classList.remove('has-hand'); release(0.4); };

  // Gaze: pupils follow the pointer anywhere on the page. Pointer events only store
  // coordinates; the maths runs at most once per frame on GSAP's ticker.
  const pupils = q('.pupil');
  const gaze = { duration: reduced ? 0 : 0.35, ease: 'power2.out' };
  const gx = gsap.quickTo(pupils, 'x', gaze);
  const gy = gsap.quickTo(pupils, 'y', gaze);
  // upper lids drop a little when she looks down; that is what makes a downward glance read
  const ly = gsap.quickTo(q('#lid-l, #lid-r'), 'y', gaze);
  let px = 0;
  let py = 0;
  let dirty = false;
  const onPointer = (e) => { px = e.clientX; py = e.clientY; dirty = true; };
  const look = () => {
    if (!dirty) return;
    dirty = false;
    const r = fig.getBoundingClientRect();
    const s = r.width / 400; // viewBox units to px
    // she looks at the palm, not the cursor tip (the hand floats above the pointer)
    const ty = fig.classList.contains('has-hand') ? py - hand.offsetHeight * 0.5 : py;
    const dx = px - (r.left + 200 * s); // from the midpoint between her eyes
    const dy = ty - (r.top + 174 * s);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(d / (110 * s), 1); // full glance once the pointer is just past her face
    const uy = dy / d;
    // pupils rest with a small gap under the lid; up travel stops before touching it
    const oy = uy < 0 ? uy * k * 2.4 : uy * k * 2.8;
    gx((dx / d) * k * 3.6);
    gy(oy);
    ly(Math.max(oy, 0) * 0.6 * (1 - tl.progress())); // closed (calm) lids stay put

    // proximity to her face, in viewBox units; the gap between 70 and 90 stops flicker at the edge
    if (!fig.classList.contains('has-hand') || document.activeElement === fig) return;
    const fd = Math.hypot(px - (r.left + 200 * s), py - (r.top + 178 * s)) / s;
    if (!near && fd < 70) { near = true; heal(); }
    else if (near && fd > 90) { near = false; release(0.5); }
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });
  gsap.ticker.add(look);

  fig.addEventListener('pointerenter', onEnter);
  fig.addEventListener('pointermove', onMove, { passive: true });
  fig.addEventListener('pointerleave', onLeave);
  fig.addEventListener('pointercancel', onLeave);
  fig.addEventListener('focus', onFocus);
  fig.addEventListener('blur', onBlur);
  window.addEventListener('blur', onBlur);

  return () => {
    fig.removeEventListener('pointerenter', onEnter);
    fig.removeEventListener('pointermove', onMove);
    fig.removeEventListener('pointerleave', onLeave);
    fig.removeEventListener('pointercancel', onLeave);
    fig.removeEventListener('focus', onFocus);
    fig.removeEventListener('blur', onBlur);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('pointerdown', onPointer);
    gsap.ticker.remove(look);
    gsap.killTweensOf(q(".pupil, #lid-l, #lid-r"));
    pending?.kill();
    watch?.kill();
    breathe?.kill();
    jitter?.kill();
    gsap.killTweensOf([tl, hand]);
    tl.progress(0).kill();
    fig.classList.remove('has-hand');
    fig.style.removeProperty('--heal');
  };
}
