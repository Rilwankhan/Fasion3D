/**
 * MEDIA CONFIGURATION — every image path and every 3D layout lives here.
 *
 * To use your own photography:
 *   1. Drop transparent-background PNG/WebP cut-outs into assets/products/
 *   2. Add/replace an entry in IMAGES (key → file + pixel size).
 *   3. Point a colour in js/products.js at that key.
 * Pixel sizes (w,h) are only used for aspect ratio, so the photo is never stretched.
 *
 * Photography: real garment photographs from the CC0 / public-domain
 * "clothing-dataset" by Alexey Grigorev (github.com/alexeygrigorev/clothing-dataset),
 * background-removed for the 3D scenes. Replace with your own campaign images any time.
 */
export const IMAGE_BASE = 'assets/products/';

export const IMAGES = {
  'dress-noir':      { src: 'dress-noir.webp',      w: 580, h: 792, alt: 'Black fit-and-flare dress' },
  'dress-ivory':     { src: 'dress-ivory.webp',     w: 508, h: 926, alt: 'Ivory sleeveless column dress' },
  'dress-saffron':   { src: 'dress-saffron.webp',   w: 632, h: 672, alt: 'Saffron yellow halter dress' },
  'skirt-midnight':  { src: 'skirt-midnight.webp',  w: 708, h: 564, alt: 'Midnight navy pleated skirt' },
  'skirt-ochre':     { src: 'skirt-ochre.webp',     w: 670, h: 516, alt: 'Ochre pleated skirt' },
  'trench-sand':     { src: 'trench-sand.webp',     w: 660, h: 1046, alt: 'Sand belted trench coat' },
  'blazer-cream':    { src: 'blazer-cream.webp',    w: 688, h: 566, alt: 'Cream soft blazer' },
  'blazer-crimson':  { src: 'blazer-crimson.webp',  w: 564, h: 868, alt: 'Crimson soft blazer' },
  'blazer-navy':     { src: 'blazer-navy.webp',     w: 696, h: 980, alt: 'Navy tailored blazer' },
  'blazer-black':    { src: 'blazer-black.webp',    w: 702, h: 950, alt: 'Black tailored blazer' },
  'shirt-ivory':     { src: 'shirt-ivory.webp',     w: 650, h: 518, alt: 'Ivory poplin shirt' },
  'jean-indigo':     { src: 'jean-indigo.webp',     w: 630, h: 882, alt: 'Indigo straight-leg jeans' },
  'jean-washed':     { src: 'jean-washed.webp',     w: 452, h: 914, alt: 'Washed blue straight-leg jeans' },
  'leather-cognac':  { src: 'leather-cognac.webp',  w: 618, h: 852, alt: 'Cognac leather biker jacket' },
  'hoodie-charcoal': { src: 'hoodie-charcoal.webp', w: 656, h: 992, alt: 'Charcoal heavyweight hoodie' },
  'hoodie-sky':      { src: 'hoodie-sky.webp',      w: 638, h: 846, alt: 'Sky blue heavyweight hoodie' },
  'tee-stone':       { src: 'tee-stone.webp',       w: 746, h: 834, alt: 'Stone essential t-shirt' },
  'tee-moss':        { src: 'tee-moss.webp',        w: 708, h: 636, alt: 'Moss green essential t-shirt' }
};

/** Colours and tones used by the WebGL scenes. */
export const THEME = {
  background: '#100f0e',     // story scene background + fog
  showcaseBackground: '#171513',
  glow: '#c8a977',
  arches: {
    hero:  ['#3a322a', '#1a1613'],
    women: ['#a88d82', '#4a3833'],
    men:   ['#53626f', '#1d252d'],
    ring:  ['#80404d', '#2b1118'],
    showcase: ['#3b332c', '#1a1613']
  }
};

/**
 * 3D LAYOUT of each cinematic scene.
 *  center : world position of the scene
 *  items  : image key, height in world units, pos [x,y,z] relative to center, rot [x,y,z] radians
 *  The "ring" scene shows every product (primary colour) around the camera.
 */
export const SCENES = {
  hero: {
    center: [0, 0, 0],
    items: [
      { image: 'leather-cognac',  h: 7.6, pos: [ 4.6, -0.4,  1.6], rot: [0, -0.16, 0.02] },
      { image: 'dress-ivory',     h: 8.4, pos: [-0.2,  0.4, -1.8], rot: [0,  0.14, -0.02] },
      { image: 'blazer-navy',     h: 6.6, pos: [ 9.4,  0.9, -3.6], rot: [0, -0.32, 0.03] },
      { image: 'dress-saffron',   h: 4.4, pos: [-8.4,  3.5, -6.5], rot: [0,  0.30, -0.04] },
      { image: 'trench-sand',     h: 7.2, pos: [14.2, -0.6, -8.0], rot: [0, -0.42, 0.02] },
      { image: 'hoodie-charcoal', h: 6.4, pos: [ 19.0, -1.2, -12.0], rot: [0, -0.45, 0.02] },
      { image: 'skirt-midnight',  h: 2.7, pos: [ 1.8, -3.9,  4.4], rot: [0, -0.12, 0.05] }
    ]
  },
  women: {
    center: [-22, 0, -34],
    arch: 'women',
    items: [
      { image: 'dress-ivory',    h: 8.6, pos: [  0.0,  0.0,  0.0], rot: [0, 0.00, 0.00], from: [ 0, 2, 7] },
      { image: 'dress-noir',     h: 7.0, pos: [ -5.8,  0.2, -1.6], rot: [0, 0.20, -0.02], from: [-9, 0, 5] },
      { image: 'dress-saffron',  h: 6.0, pos: [  5.8, -0.1, -1.0], rot: [0, -0.20, 0.02], from: [ 9, 0, 5] },
      { image: 'trench-sand',    h: 7.4, pos: [-10.6,  0.5, -4.2], rot: [0, 0.38, -0.02], from: [-12, 1, 3] },
      { image: 'blazer-cream',   h: 5.2, pos: [ 10.6,  0.6, -3.6], rot: [0, -0.38, 0.02], from: [12, 1, 3] },
      { image: 'skirt-midnight', h: 3.0, pos: [  3.4, -4.1,  3.2], rot: [0, -0.10, 0.04], from: [ 4, -3, 6] }
    ]
  },
  men: {
    center: [22, 0, -68],
    arch: 'men',
    items: [
      { image: 'blazer-navy',     h: 8.6, pos: [  0.0,  0.0,  0.0], rot: [0, 0.00, 0.00], from: [ 0, 2, 7] },
      { image: 'hoodie-charcoal', h: 7.2, pos: [ -6.0,  0.0, -1.6], rot: [0, 0.20, -0.02], from: [-9, 0, 5] },
      { image: 'jean-indigo',     h: 8.0, pos: [  6.2, -0.2, -1.0], rot: [0, -0.20, 0.02], from: [ 9, 0, 5] },
      { image: 'shirt-ivory',     h: 4.2, pos: [-11.2,  0.8, -4.4], rot: [0, 0.38, -0.02], from: [-12, 1, 3] },
      { image: 'tee-stone',       h: 5.2, pos: [ 11.2,  0.3, -3.6], rot: [0, -0.38, 0.02], from: [12, 1, 3] },
      { image: 'leather-cognac',  h: 3.4, pos: [ -3.0, -4.3,  3.2], rot: [0, 0.10, 0.04], from: [-4, -3, 6] }
    ]
  },
  ring: {
    center: [0, 0, -112],
    radius: 11,
    height: 6.0
  }
};
