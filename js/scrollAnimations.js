/**
 * scrollAnimations.js — scroll → camera + image planes + text.
 *
 * ONE scrubbed GSAP timeline (duration = TOTAL units) is bound to the tall #story section.
 * Because everything lives in a single timeline with explicit from/to values, scrolling
 * backwards plays everything in reverse with no jumps or resets.
 *
 *   0 ─ 10   hero (slow push-in)
 *   10 ─ 30  fly to Women's collection        30 ─ 46  orbit around the Women's scene
 *   46 ─ 64  fly to Men's collection          64 ─ 80  orbit around the Men's scene
 *   80 ─ 96  fly into the New-Arrivals ring   96 ─ 116 camera turns 330° inside the ring
 *   116 ─ 120 hand-off to the shop
 */
const TOTAL = 120;

export const SCENE_TIMES = { hero: 0, women: 36, men: 72, new: 104 };

export function buildStory({ scene3d, story, panels, dots, onSceneChange }) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const { cam, clusters } = scene3d;
  const C = (n) => clusters[n].center;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* camera poses -------------------------------------------------- */
  const orbit = (c, a, r = 14.5, y = 0.3) => ({
    x: c[0] + Math.sin(a) * r, y, z: c[2] + Math.cos(a) * r, lx: c[0], ly: 0.2, lz: c[2], roll: 0
  });
  const ringC = C('ring');
  const ringLook = (th, r = 12) => ({
    lx: ringC[0] + Math.sin(th) * r, ly: 0.1, lz: ringC[2] - Math.cos(th) * r
  });

  const P = {
    hero0: { x: 0, y: 0.3, z: 15.5, lx: 1, ly: 0, lz: 0, roll: 0 },
    hero1: { x: 0.6, y: 0.4, z: 13.6, lx: 1.2, ly: 0, lz: 0, roll: 0 },
    w0: orbit(C('women'), -0.30), w1: orbit(C('women'), 0.30),
    m0: orbit(C('men'), 0.30), m1: orbit(C('men'), -0.30),
    r0: { x: ringC[0], y: 0.2, z: ringC[2] + 0.5, ...ringLook(0), roll: 0 }
  };

  Object.assign(cam, P.hero0);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: story, start: 'top top', end: 'bottom bottom',
      scrub: reduce ? true : 1.1, invalidateOnRefresh: false,
      onUpdate: (self) => {
        const t = self.progress * TOTAL;
        const idx = t < 22 ? 0 : t < 58 ? 1 : t < 90 ? 2 : 3;
        onSceneChange && onSceneChange(idx, self.progress);
      }
    }
  });

  /** fly = move camera between poses with a banked, curved path. */
  // NOTE: every camera tween uses immediateRender:false — otherwise the *last* tween built would
  // overwrite the initial camera pose before the timeline has rendered its first frame.
  const NR = { immediateRender: false };
  function fly(from, to, at, dur, { bank = 0.035, xEase = 'power2.inOut', zEase = 'power2.inOut' } = {}) {
    tl.fromTo(cam, { x: from.x }, { x: to.x, duration: dur, ease: xEase, ...NR }, at);
    tl.fromTo(cam, { z: from.z }, { z: to.z, duration: dur, ease: zEase, ...NR }, at);
    tl.fromTo(cam, { y: from.y }, { y: to.y, duration: dur, ease: 'power2.inOut', ...NR }, at);
    tl.fromTo(cam, { lx: from.lx, ly: from.ly, lz: from.lz }, { lx: to.lx, ly: to.ly, lz: to.lz, duration: dur, ease: 'power2.inOut', ...NR }, at);
    if (bank) {
      tl.fromTo(cam, { roll: 0 }, { roll: bank, duration: dur / 2, ease: 'sine.out', ...NR }, at);
      tl.fromTo(cam, { roll: bank }, { roll: 0, duration: dur / 2, ease: 'sine.in', ...NR }, at + dur / 2);
    }
  }
  function glide(from, to, at, dur) {
    tl.fromTo(cam, { x: from.x, y: from.y, z: from.z, lx: from.lx, ly: from.ly, lz: from.lz },
      { x: to.x, y: to.y, z: to.z, lx: to.lx, ly: to.ly, lz: to.lz, duration: dur, ease: 'none', ...NR }, at);
  }

  /* ---------- camera path ---------- */
  glide(P.hero0, P.hero1, 0, 10);                                   // hero push-in
  fly(P.hero1, P.w0, 10, 20, { bank: 0.04 });                       // → women
  glide(P.w0, P.w1, 30, 16);                                        // orbit women
  fly(P.w1, P.m0, 46, 18, { bank: -0.04 });                         // → men
  glide(P.m0, P.m1, 64, 16);                                        // orbit men
  // → ring: x settles early so the camera slips through the gap in the ring
  fly(P.m1, P.r0, 80, 16, { bank: 0.03, xEase: 'power3.out', zEase: 'power1.inOut' });
  // camera turns inside the ring (look target sweeps a 330° arc)
  const sweep = { th: 0 };
  tl.fromTo(sweep, { th: 0 }, {
    th: Math.PI * 2 * (11 / 12), duration: 20, ease: 'power1.inOut', immediateRender: false,
    onUpdate: () => { Object.assign(cam, ringLook(sweep.th)); }
  }, 96);

  /* ---------- image planes ---------- */
  const entryProps = (it, i) => {
    const f = it.spec.from || [0, 0, 4];
    return { x: f[0], y: f[1], z: f[2], ry: (i % 2 ? -1 : 1) * 0.9 };
  };

  ['women', 'men'].forEach((name, k) => {
    const arrive = k === 0 ? 30 : 64;
    const cl = clusters[name];
    cl.items.forEach((it, i) => {
      it.managed = true;
      const f = entryProps(it, i);
      const at = arrive - 15 + i * 0.9;
      const dur = 10;
      tl.fromTo(it.entry.position, { x: f.x, y: f.y, z: f.z }, { x: 0, y: 0, z: 0, duration: dur, ease: 'power3.out' }, at);
      tl.fromTo(it.entry.rotation, { y: f.ry }, { y: 0, duration: dur, ease: 'power3.out' }, at);
      tl.fromTo(it.entry.scale, { x: 0.82, y: 0.82, z: 0.82 }, { x: 1, y: 1, z: 1, duration: dur, ease: 'power3.out' }, at);
      tl.fromTo([it.mat, it.shadow.material], { opacity: 0 }, { opacity: 1, duration: dur * 0.6, ease: 'power1.out' }, at);
    });
    if (cl.arch) {
      tl.fromTo(cl.arch.position, { y: -6 }, { y: 1.6, duration: 12, ease: 'power3.out' }, arrive - 16);
      tl.fromTo(cl.arch.material, { opacity: 0 }, { opacity: 1, duration: 8, ease: 'power1.out' }, arrive - 16);
    }
    // gentle outward drift as the camera leaves
    cl.items.forEach((it, i) => {
      const leave = k === 0 ? 46 : 80;
      tl.fromTo(it.entry.position, { z: 0 }, { z: -3 - (i % 3), duration: 14, ease: 'power1.in', immediateRender: false }, leave);
      tl.fromTo(it.entry.rotation, { y: 0 }, { y: (i % 2 ? 1 : -1) * 0.35, duration: 14, ease: 'power1.in', immediateRender: false }, leave);
    });
  });

  // hero planes: slow cinematic turn while the camera pushes in
  clusters.hero.items.forEach((it, i) => {
    it.managed = true;
    tl.fromTo(it.entry.rotation, { y: 0 }, { y: (i % 2 ? -1 : 1) * 0.28, duration: 12, ease: 'power1.inOut', immediateRender: false }, 2);
  });

  // ring planes scale/fade in as the camera approaches
  clusters.ring.items.forEach((it, i) => {
    it.managed = true;
    const at = 84 + i * 0.6;
    tl.fromTo(it.entry.scale, { x: 0.55, y: 0.55, z: 0.55 }, { x: 1, y: 1, z: 1, duration: 9, ease: 'power3.out' }, at);
    tl.fromTo([it.mat, it.shadow.material, it.arch.material], { opacity: 0 }, { opacity: 1, duration: 6, ease: 'power1.out' }, at);
  });

  /* ---------- text panels ---------- */
  const rv = (el) => el.querySelectorAll('.rv');
  function panelIn(el, at) {
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, at);
    tl.fromTo(rv(el), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 3, stagger: 0.35, ease: 'power3.out' }, at);
  }
  function panelOut(el, at) {
    tl.to(rv(el), { autoAlpha: 0, y: -26, duration: 2.4, stagger: 0.12, ease: 'power2.in' }, at);
    tl.to(el, { autoAlpha: 0, duration: 0.2 }, at + 2.6);
  }

  // hero panel is visible from the start; fades as the camera leaves
  gsap.set(panels.hero, { autoAlpha: 1 });
  panelOut(panels.hero, 6);
  panelIn(panels.women, 27); panelOut(panels.women, 43);
  panelIn(panels.men, 61); panelOut(panels.men, 77);
  panelIn(panels.new, 92); panelOut(panels.new, 114);

  tl.to({}, { duration: 0.001 }, TOTAL);   // pad timeline to exactly TOTAL

  /* ---------- fly-to-scene navigation ---------- */
  const st = tl.scrollTrigger;
  let flyTween = null;
  function scrollToScene(name, { instant = false } = {}) {
    const t = SCENE_TIMES[name] ?? 0;
    const y = st.start + (t / TOTAL) * (st.end - st.start);
    flyTween && flyTween.kill();
    if (instant || reduce) { window.scrollTo(0, y); return; }
    const proxy = { y: window.scrollY };
    const dist = Math.abs(y - proxy.y);
    flyTween = gsap.to(proxy, {
      y, duration: Math.min(3.2, 0.9 + dist / 2600), ease: 'power2.inOut',
      onUpdate: () => window.scrollTo(0, proxy.y)
    });
    const cancel = () => { flyTween && flyTween.kill(); };
    ['wheel', 'touchstart', 'keydown'].forEach((e) => addEventListener(e, cancel, { once: true, passive: true }));
  }

  return { timeline: tl, scrollTrigger: st, scrollToScene, TOTAL, SCENE_TIMES };
}

/** Elegant entrance for the hero planes + text once the first textures are ready. */
export function introHero(scene3d, heroPanel) {
  const { gsap } = window;
  const items = scene3d.clusters.hero.items;
  items.forEach((it, i) => {
    gsap.fromTo([it.mat, it.shadow.material], { opacity: 0 }, { opacity: 1, duration: 1.4, delay: 0.15 + i * 0.12, ease: 'power2.out' });
    gsap.fromTo(it.entry.position, { y: -2.4, z: -3 }, { y: 0, z: 0, duration: 1.9, delay: 0.1 + i * 0.12, ease: 'power3.out' });
  });
  gsap.fromTo(heroPanel.querySelectorAll('.rv'), { autoAlpha: 0, y: 40 },
    { autoAlpha: 1, y: 0, duration: 1.4, stagger: 0.18, delay: 0.25, ease: 'power3.out' });
}
