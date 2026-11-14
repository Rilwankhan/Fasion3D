/**
 * scene3d.js — the Three.js world.
 *
 * One WebGL context drives everything:
 *   • "story" mode   : hero + women + men + ring scenes, camera driven by scroll (see scrollAnimations.js)
 *   • "showcase" mode: a single product floating on its own stage, draggable
 *
 * Real photographs are used as textures on PlaneGeometry meshes (MeshBasicMaterial, so the
 * photo's colours are never lit/tinted). Depth comes from z-layering, fog, perspective,
 * soft floor shadows and parallax.
 */
import * as THREE from 'three';
import { IMAGES, IMAGE_BASE, SCENES, THEME } from './media.js';
import { PRODUCTS, productByImage } from './products.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

export function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

/* ------------------------------------------------------------------ procedural textures */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}

function archTexture([top, bottom]) {
  return canvasTex(512, 768, (g, w, h) => {
    const r = w / 2;
    g.beginPath();
    g.moveTo(0, h); g.lineTo(0, r);
    g.arc(r, r, r, Math.PI, 0);
    g.lineTo(w, h); g.closePath();
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, top); grad.addColorStop(1, bottom);
    g.fillStyle = grad; g.fill();
    // film grain
    g.save(); g.clip();
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(id, 0, 0);
    g.restore();
    // fine inner keyline
    g.strokeStyle = 'rgba(200,169,119,0.35)'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(18, h); g.lineTo(18, r);
    g.arc(r, r, r - 18, Math.PI, 0);
    g.lineTo(w - 18, h); g.stroke();
  });
}

function radialTexture(stops, size = 256) {
  return canvasTex(size, size, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    stops.forEach(([o, c]) => grad.addColorStop(o, c));
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
}

function wordTexture(word) {
  return canvasTex(2048, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = '600 380px Poppins, "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 3; g.strokeStyle = 'rgba(244,239,232,0.30)';
    g.strokeText(word, w / 2, h / 2 + 10);
  });
}

/* ------------------------------------------------------------------ factory */
export function createScene3D({ canvas, onProgress }) {
  const isCoarse = matchMedia('(pointer:coarse)').matches;
  const isSmall = Math.min(innerWidth, innerHeight) < 600;
  const mobile = isCoarse || isSmall;
  const lowCores = (navigator.hardwareConcurrency || 8) <= 4;
  const profile = {
    maxDpr: mobile ? 1.5 : 2,
    particles: mobile || lowCores ? 70 : 220,
    aniso: mobile ? 2 : 4,
    antialias: !(mobile && (devicePixelRatio || 1) >= 2.5)
  };

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: profile.antialias, alpha: false, powerPreference: 'high-performance'
  });
  let dpr = Math.min(devicePixelRatio || 1, profile.maxDpr);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(THEME.background, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(THEME.background);
  scene.fog = new THREE.Fog(THEME.background, 28, 95);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);

  /* shared camera state — tweened by GSAP in scrollAnimations.js */
  const cam = { x: 0, y: 0.3, z: 15.5, lx: 1, ly: 0, lz: 0, roll: 0 };
  const layout = { distScale: 1, xScale: 1, aspect: 1 };

  const unitPlane = new THREE.PlaneGeometry(1, 1);
  const disposables = [unitPlane];
  const textures = new Map();          // key -> Promise<Texture|null>
  const loaded = new Map();            // key -> Texture
  const loader = new THREE.TextureLoader();

  const storyGroup = new THREE.Group();
  const showGroup = new THREE.Group();
  showGroup.visible = false;
  scene.add(storyGroup, showGroup);

  /* ---------------------------------------------------------- textures */
  function loadTexture(key) {
    if (textures.has(key)) return textures.get(key);
    const info = IMAGES[key];
    const p = new Promise((resolve) => {
      if (!info) return resolve(null);
      loader.load(
        IMAGE_BASE + info.src,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = Math.min(profile.aniso, renderer.capabilities.getMaxAnisotropy());
          t.minFilter = THREE.LinearMipmapLinearFilter;
          t.magFilter = THREE.LinearFilter;
          loaded.set(key, t);
          resolve(t);
        },
        undefined,
        () => { console.warn('[scene3d] failed to load image', key); resolve(null); }
      );
    });
    textures.set(key, p);
    return p;
  }

  function planeMaterial(opacity = 0) {
    return new THREE.MeshBasicMaterial({
      transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: true
    });
  }

  const shadowTex = radialTexture([[0, 'rgba(0,0,0,0.65)'], [0.55, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0)']]);
  const glowTex = radialTexture([[0, 'rgba(255,255,255,0.55)'], [0.5, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]);
  disposables.push(shadowTex, glowTex);

  /* ---------------------------------------------------------- items */
  const clusters = {};   // name -> { group, items[], center }
  const pickables = [];  // meshes that can be clicked

  function makeItem(spec, parent, floorY) {
    const info = IMAGES[spec.image];
    const aspect = info.w / info.h;
    const H = spec.h, W = H * aspect;

    const holder = new THREE.Group();                 // idle float + layout (x scaled for portrait)
    const entry = new THREE.Group();                  // scroll-driven entrance transforms
    holder.add(entry);
    const baseRot = spec.rot || [0, 0, 0];
    entry.rotation.set(0, 0, 0);

    const mat = planeMaterial(0);
    const mesh = new THREE.Mesh(unitPlane, mat);
    mesh.scale.set(W, H, 1);
    mesh.rotation.set(baseRot[0], baseRot[1], baseRot[2]);
    mesh.visible = false;
    const product = productByImage(spec.image);
    mesh.userData = { productId: product ? product.id : null, imageKey: spec.image };
    entry.add(mesh);
    if (product) pickables.push(mesh);

    // soft floor shadow
    const sh = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: shadowTex, transparent: true, depthWrite: false, opacity: 0, fog: true
    }));
    sh.rotation.x = -Math.PI / 2;
    sh.scale.set(W * 1.15, W * 0.42, 1);
    parent.add(holder);
    parent.add(sh);

    const item = {
      spec, holder, entry, mesh, mat, shadow: sh, W, H,
      baseX: spec.pos[0], baseY: spec.pos[1], baseZ: spec.pos[2],
      floorY, phase: Math.random() * Math.PI * 2, amp: 0.10 + Math.random() * 0.12, speed: 0.5 + Math.random() * 0.4,
      ready: false
    };
    holder.position.set(item.baseX, item.baseY, item.baseZ);
    sh.position.set(item.baseX, floorY, item.baseZ);

    item.show = (tex) => {
      if (!tex || item.ready) return;
      mat.map = tex; mat.needsUpdate = true;
      mesh.visible = true; item.ready = true;
      // scroll/intro timelines own the opacity of "managed" items; otherwise just show it
      if (!item.managed) { mat.opacity = 1; sh.material.opacity = 1; }
    };
    return item;
  }

  function buildCluster(name, def) {
    const group = new THREE.Group();
    group.position.set(...def.center);
    storyGroup.add(group);
    const floorY = -5.0;
    const cl = { name, group, items: [], center: def.center };

    if (def.arch) {
      const arch = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
        map: archTexture(THEME.arches[def.arch]), transparent: true, depthWrite: false, fog: true
      }));
      arch.scale.set(17, 25.5, 1);
      arch.position.set(0, 1.6, -7);
      group.add(arch);
      cl.arch = arch;
    }
    const pool = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: glowTex, color: THEME.glow, transparent: true, opacity: 0.38, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: true
    }));
    pool.rotation.x = -Math.PI / 2;
    pool.scale.set(30, 16, 1);
    pool.position.set(0, floorY + 0.01, -1);
    group.add(pool);

    def.items.forEach((spec) => cl.items.push(makeItem(spec, group, floorY)));
    clusters[name] = cl;
    return cl;
  }

  /* hero ----------------------------------------------------------- */
  const hero = buildCluster('hero', SCENES.hero);
  {
    const glow = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: glowTex, color: THEME.glow, transparent: true, opacity: 0.30, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false
    }));
    glow.scale.set(30, 24, 1); glow.position.set(2, 0.5, -12);
    hero.group.add(glow);
  }
  let wordMesh = null;
  function buildWord(word) {
    if (wordMesh) { hero.group.remove(wordMesh); wordMesh.material.map.dispose(); wordMesh.material.dispose(); }
    wordMesh = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: wordTexture(word), transparent: true, depthWrite: false, fog: false
    }));
    wordMesh.scale.set(46, 11.5, 1);
    wordMesh.position.set(1, 1.6, -15);
    hero.group.add(wordMesh);
  }

  /* collections ------------------------------------------------------ */
  buildCluster('women', SCENES.women);
  buildCluster('men', SCENES.men);

  /* ring (all primary colourways around the camera) ----------------- */
  {
    const def = SCENES.ring;
    const group = new THREE.Group();
    group.position.set(...def.center);
    storyGroup.add(group);
    const cl = { name: 'ring', group, items: [], center: def.center };
    const n = PRODUCTS.length;

    const disc = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: glowTex, color: '#8a3646', transparent: true, opacity: 0.55, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: true
    }));
    disc.rotation.x = -Math.PI / 2; disc.scale.set(def.radius * 3.2, def.radius * 3.2, 1);
    disc.position.y = -4.6; group.add(disc);

    const ringArchTex = archTexture(THEME.arches.ring);
    disposables.push(ringArchTex);
    PRODUCTS.forEach((p, i) => {
      const key = p.colours[0].image;
      const phi = ((i + 0.5) / n) * Math.PI * 2;         // gap (no plane) sits at +z (phi = π) for flythrough
      const x = Math.sin(phi) * def.radius, z = -Math.cos(phi) * def.radius;
      const item = makeItem({ image: key, h: def.height, pos: [x, 0, z], rot: [0, 0, 0] }, group, -4.4);
      item.entry.rotation.set(0, 0, 0);
      item.mesh.rotation.y = -phi;                        // plane normal (+z) points at the ring centre
      item.phi = phi;
      // tonal arch behind each plane (contrast for dark garments + editorial feel)
      const arch = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
        map: ringArchTex, transparent: true, depthWrite: false, fog: true, opacity: 0
      }));
      arch.scale.set(def.height * 0.98, def.height * 1.46, 1);
      arch.position.set(Math.sin(phi) * (def.radius + 1.3), 0.7, -Math.cos(phi) * (def.radius + 1.3));
      arch.rotation.y = -phi;
      group.add(arch);
      item.arch = arch;
      cl.items.push(item);
    });
    clusters.ring = cl;
  }

  /* dust particles -------------------------------------------------- */
  let particles = null;
  {
    const N = profile.particles;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = 25 - Math.random() * 160;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dot = radialTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']], 64);
    const mat = new THREE.PointsMaterial({
      map: dot, color: '#e8d6b5', size: 0.22, transparent: true, opacity: 0.55, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    particles = new THREE.Points(geo, mat);
    storyGroup.add(particles);
    disposables.push(geo, mat, dot);
  }

  /* ---------------------------------------------------------- showcase stage */
  const show = {
    arch: new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: archTexture(THEME.arches.showcase), transparent: true, depthWrite: false
    })),
    glow: new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({
      map: glowTex, color: THEME.glow, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending
    })),
    shadow: new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.9 })),
    pivot: new THREE.Group(),
    planes: [0, 1].map(() => new THREE.Mesh(unitPlane, planeMaterial(0))),
    active: 0, key: null, rotY: 0, rotX: 0, targetY: 0, targetX: 0, dragging: false,
    baseH: 8, token: 0
  };
  show.shadow.rotation.x = -Math.PI / 2;
  show.pivot.add(...show.planes);
  show.planes.forEach((m) => { m.visible = false; });
  showGroup.add(show.arch, show.glow, show.shadow, show.pivot);
  show.glow.position.z = -3; show.arch.position.z = -4;

  function fitShowcase() {
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dist = 14;
    const visH = 2 * dist * Math.tan(fov / 2);
    const visW = visH * camera.aspect;
    const desktop = camera.aspect > 1.1;
    show.baseH = desktop ? visH * 0.66 : visH * 0.33;
    const cx = desktop ? -visW * 0.21 : 0;
    const cy = desktop ? 0 : visH * 0.23;
    showGroup.position.set(cx, cy, 0);
    show.arch.scale.set(show.baseH * 0.95, show.baseH * 1.5, 1);
    show.arch.position.set(0, show.baseH * 0.08, -4);
    show.glow.scale.set(show.baseH * 1.8, show.baseH * 1.5, 1);
    show.shadow.position.set(0, -show.baseH * 0.54, 0);
    show.shadow.scale.set(show.baseH * 0.8, show.baseH * 0.26, 1);
    sizeShowPlane(show.planes[0]); sizeShowPlane(show.planes[1]);
  }
  function sizeShowPlane(mesh) {
    const info = IMAGES[mesh.userData.key];
    if (!info) return;
    const H = show.baseH, W = H * (info.w / info.h);
    mesh.scale.set(W, H, 1);
  }

  /** Display a product colourway in the showcase stage (cross-fades if already showing). */
  async function showImage(key, { instant = false } = {}) {
    const token = ++show.token;
    const tex = await loadTexture(key);
    if (token !== show.token || !tex) return;
    const next = show.planes[1 - show.active], prev = show.planes[show.active];
    next.userData.key = key;
    next.material.map = tex; next.material.needsUpdate = true;
    sizeShowPlane(next);
    next.visible = true;
    const gs = window.gsap;
    if (instant || !gs || !prev.visible) {
      next.material.opacity = 1; prev.material.opacity = 0; prev.visible = false;
    } else {
      gs.killTweensOf([next.material, prev.material]);
      next.material.opacity = 0;
      gs.to(next.material, { opacity: 1, duration: 0.45, ease: 'power2.out' });
      gs.to(prev.material, { opacity: 0, duration: 0.45, ease: 'power2.out', onComplete: () => { prev.visible = false; } });
    }
    show.active = 1 - show.active;
    show.key = key;
  }

  /* ---------------------------------------------------------- state / modes */
  let mode = 'story';
  let active = true;
  let raf = 0;
  let last = performance.now();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let frameTimes = [];
  let lastDprChange = 0;
  const clock = { t: 0 };

  function setMode(m) {
    mode = m;
    const showcase = m === 'showcase';
    storyGroup.visible = !showcase;
    showGroup.visible = showcase;
    const bg = showcase ? THEME.showcaseBackground : THEME.background;
    scene.background.set(bg); scene.fog.color.set(bg); renderer.setClearColor(bg, 1);
    if (showcase) { camera.fov = 35; fitShowcase(); } else { applyLayout(); }
    camera.updateProjectionMatrix();
    start();
  }

  function setActive(v) {
    active = v;
    if (v) start();
  }

  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------- layout */
  function applyLayout() {
    const a = camera.aspect;
    const t = clamp((1.5 - a) / 1.0, 0, 1);
    layout.aspect = a;
    layout.distScale = 1 + 0.78 * t;
    layout.xScale = 1 - 0.6 * t;
    camera.fov = lerp(40, 46, t);
    camera.updateProjectionMatrix();
    Object.values(clusters).forEach((cl) => {
      if (cl.name === 'ring') return;
      cl.items.forEach((it) => {
        it.holder.position.x = it.baseX * layout.xScale;
        it.shadow.position.x = it.baseX * layout.xScale;
      });
    });
  }

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (mode === 'showcase') { camera.fov = 35; fitShowcase(); camera.updateProjectionMatrix(); }
    else applyLayout();
    // resizing clears the drawing buffer: redraw straight away so the canvas never flashes blank
    renderer.render(scene, camera);
    start();
  }

  /* ---------------------------------------------------------- render loop */
  const tmpLook = new THREE.Vector3();

  function frame(now) {
    raf = 0;
    if (document.hidden) return;                  // resumes via visibilitychange
    if (mode === 'story' && !active) return;      // resumes via setActive
    raf = requestAnimationFrame(frame);

    const dt = Math.min(0.05, (now - last) / 1000);
    const rawDt = now - last;
    last = now;
    clock.t += dt;
    const t = clock.t;

    // adaptive resolution (protects mobile GPUs)
    frameTimes.push(rawDt);
    if (frameTimes.length >= 60) {
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      frameTimes = [];
      if (avg > 26 && dpr > 1 && now - lastDprChange > 1500) {
        dpr = Math.max(1, dpr - 0.25); lastDprChange = now;
        renderer.setPixelRatio(dpr); renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        renderer.render(scene, camera);
      }
    }

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);

    if (mode === 'story') {
      // idle float
      for (const name in clusters) {
        const cl = clusters[name];
        for (const it of cl.items) {
          if (!it.ready) continue;
          const bob = Math.sin(t * it.speed + it.phase);
          it.holder.position.y = it.baseY + bob * it.amp;
          it.holder.rotation.z = Math.sin(t * it.speed * 0.6 + it.phase) * 0.012;
        }
      }
      if (particles) { particles.rotation.y = Math.sin(t * 0.03) * 0.05; particles.position.y = Math.sin(t * 0.2) * 0.4; }

      // camera from scroll-driven state + pointer parallax + distance scale for portrait screens
      const d = layout.distScale;
      const lx = cam.lx, ly = cam.ly, lz = cam.lz;
      camera.position.set(
        lx + (cam.x - lx) * d + pointer.x * 0.9,
        ly + (cam.y - ly) * d + pointer.y * 0.5,
        lz + (cam.z - lz) * d
      );
      tmpLook.set(lx, ly, lz);
      camera.lookAt(tmpLook);
      if (cam.roll) camera.rotateZ(cam.roll);
    } else {
      // showcase: spring back + gentle idle
      if (!show.dragging) { show.targetY *= 0.92; show.targetX *= 0.92; }
      show.rotY += (show.targetY + Math.sin(t * 0.6) * 0.04 + pointer.x * 0.06 - show.rotY) * Math.min(1, dt * 7);
      show.rotX += (show.targetX - pointer.y * 0.04 - show.rotX) * Math.min(1, dt * 7);
      show.pivot.rotation.set(show.rotX, show.rotY, 0);
      show.pivot.position.y = Math.sin(t * 0.9) * 0.12;
      show.arch.position.x = -show.rotY * 1.2;           // parallax layers behind the garment
      show.glow.position.x = -show.rotY * 2.2;
      const s = 1 - Math.abs(show.pivot.position.y) * 0.02;
      show.shadow.scale.x = show.baseH * 0.8 * s;
      camera.position.set(0, 0, 14);
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
  }

  /* ---------------------------------------------------------- events */
  const onPointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
    pointer.ty = -(e.clientY / innerHeight - 0.5) * 2;
  };
  addEventListener('pointermove', onPointerMove, { passive: true });

  const onVis = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVis);

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);

  // WebGL context loss / restore
  let lost = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0; });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    loaded.forEach((t) => { t.needsUpdate = true; });
    [shadowTex, glowTex].forEach((t) => { t.needsUpdate = true; });
    resize(); start();
  });

  /* click / tap picking on story planes (only when pointer didn't drag) */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt = null;
  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const visible = pickables.filter((m) => m.visible && m.material.opacity > 0.5);
    const hit = raycaster.intersectObjects(visible, false)[0];
    return hit ? hit.object.userData : null;
  }
  function hoverCursor(e) {
    if (mode !== 'story' || !active || e.pointerType === 'touch') return;
    if (!e.target.closest || !e.target.closest('#story')) { document.documentElement.classList.remove('is-hover-product'); return; }
    document.documentElement.classList.toggle('is-hover-product', !!pick(e.clientX, e.clientY));
  }
  const api = {
    cam, clusters, layout, renderer, scene, camera, profile,
    get mode() { return mode; },
    show, loadTexture, buildWord, setMode, setActive, resize, start, showImage,
    setPick(handler) {
      // pointer events are on window because the canvas sits behind the DOM overlay
      addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target }; }, { passive: true });
      addEventListener('pointerup', (e) => {
        if (!downAt || mode !== 'story' || !active) { downAt = null; return; }
        const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
        const target = downAt.target; downAt = null;
        if (moved > 8) return;
        // only when the click landed on the empty overlay / canvas (not on a button, link, etc.)
        if (!target.closest || !target.closest('#story') || target.closest('a,button,input,select,textarea,.panel__inner')) return;
        const hit = pick(e.clientX, e.clientY);
        if (hit && hit.productId) handler(hit.productId, hit.imageKey);
      }, { passive: true });
      addEventListener('pointermove', hoverCursor, { passive: true });
    },
    /** Pointer-drag rotation for the showcase stage element. */
    bindShowcaseDrag(el) {
      let sx = 0, sy = 0, down = false;
      el.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; down = true; show.dragging = true; sx = e.clientX; sy = e.clientY; el.setPointerCapture?.(e.pointerId); });
      el.addEventListener('pointermove', (e) => {
        if (!down) return;
        show.targetY = clamp(show.targetY + (e.clientX - sx) * 0.006, -0.6, 0.6);
        show.targetX = clamp(show.targetX + (e.clientY - sy) * 0.003, -0.25, 0.25);
        sx = e.clientX; sy = e.clientY;
      });
      const up = () => { down = false; show.dragging = false; };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    },
    resetShowcase() { show.rotY = show.targetY = show.rotX = show.targetX = 0; },
    pointerRef: pointer,
    /** Texture loading with progress. `hero` first, rest lazily so the page is usable immediately. */
    async loadAll() {
      const heroKeys = [...new Set(hero.items.map((i) => i.spec.image))];
      const restKeys = [...new Set(
        ['women', 'men', 'ring'].flatMap((n) => clusters[n].items.map((i) => i.spec.image))
      )].filter((k) => !heroKeys.includes(k));
      const total = heroKeys.length;
      let done = 0;
      const attach = (key, tex) => {
        Object.values(clusters).forEach((cl) => cl.items.forEach((it) => { if (it.spec.image === key) it.show(tex); }));
      };
      await Promise.all(heroKeys.map(async (k) => {
        const t = await loadTexture(k); attach(k, t); done++; onProgress && onProgress(done / total);
      }));
      // remaining scenes in the background, one at a time to avoid jank
      (async () => {
        for (const k of restKeys) {
          const t = await loadTexture(k); attach(k, t);
          await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 300 }) : setTimeout(r, 30)));
        }
        start();
      })();
    },
    dispose() {
      cancelAnimationFrame(raf); raf = 0;
      removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      loaded.forEach((t) => t.dispose());
      disposables.forEach((d) => d.dispose && d.dispose());
      scene.traverse((o) => { if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); } });
      renderer.dispose();
    }
  };

  resize();
  start();
  return api;
}
