/**
 * PRODUCT CATALOGUE — edit freely. IDs must be unique.
 *
 * collection : 'women' | 'men'
 * category   : free text used for the category filter
 * tags       : 'new' → appears under "New Arrivals", 'trending' → "Trending"
 * colours    : each colour points at an image key from js/media.js.
 *              The FIRST colour is the default and is also used in the 3D scenes.
 * sizes      : sizes offered. Put a size in `soldOut` to show it struck through.
 *
 * NOTE: names, prices and copy below are sample content for the demo brand.
 */
export const SIZE_SETS = {
  clothing: ['XS', 'S', 'M', 'L', 'XL'],
  denim: ['28', '30', '32', '34', '36']
};

export const PRODUCTS = [
  {
    id: 'mv-w-001', name: 'Noir Fit & Flare Dress', collection: 'women', category: 'Dresses',
    price: 6490, tags: ['new', 'trending'],
    description: 'A sleeveless dress in deep black with a fitted bodice and a fluid, full skirt that moves with you from desk to dinner.',
    details: ['Fitted bodice, flared skirt', 'Concealed back zip', 'Knee-length', 'Dry clean recommended'],
    sizes: SIZE_SETS.clothing, soldOut: ['XS'],
    colours: [{ name: 'Noir', hex: '#16191a', image: 'dress-noir' }]
  },
  {
    id: 'mv-w-002', name: 'Ivory Column Dress', collection: 'women', category: 'Dresses',
    price: 7290, tags: ['new'],
    description: 'A clean, sculpted column dress in warm ivory. Structured seams give it shape; the tulip hem keeps it easy to walk in.',
    details: ['Structured, tailored seams', 'Boat neckline', 'Pockets in side seams', 'Dry clean only'],
    sizes: SIZE_SETS.clothing, soldOut: [],
    colours: [{ name: 'Ivory', hex: '#ece4d4', image: 'dress-ivory' }]
  },
  {
    id: 'mv-w-003', name: 'Saffron Halter Dress', collection: 'women', category: 'Dresses',
    price: 5490, tags: ['trending'],
    description: 'Sun-warmed saffron with a crossed halter back and a swinging skirt. Made for long evenings and open windows.',
    details: ['Cross-back straps', 'Full circle skirt', 'Lined bodice', 'Gentle machine wash'],
    sizes: SIZE_SETS.clothing, soldOut: ['XL'],
    colours: [{ name: 'Saffron', hex: '#e2b31a', image: 'dress-saffron' }]
  },
  {
    id: 'mv-w-004', name: 'Pleated Flare Skirt', collection: 'women', category: 'Skirts',
    price: 3990, tags: [],
    description: 'A high-waisted skirt with deep sculpted pleats that hold their shape. Available in midnight navy and ochre.',
    details: ['High waist', 'Concealed side zip', 'Midi-mini length', 'Dry clean recommended'],
    sizes: SIZE_SETS.clothing, soldOut: [],
    colours: [
      { name: 'Midnight', hex: '#262b45', image: 'skirt-midnight' },
      { name: 'Ochre', hex: '#c79a1f', image: 'skirt-ochre' }
    ]
  },
  {
    id: 'mv-w-005', name: 'Sand Belted Trench', collection: 'women', category: 'Outerwear',
    price: 9990, tags: ['new', 'trending'],
    description: 'A lightweight trench in soft sand with a tie waist and roll-up sleeves. The kind of coat you reach for every transitional morning.',
    details: ['Double-breasted front', 'Self-tie belt', 'Roll-up sleeves', 'Hip length'],
    sizes: SIZE_SETS.clothing, soldOut: [],
    colours: [{ name: 'Sand', hex: '#b2a79b', image: 'trench-sand' }]
  },
  {
    id: 'mv-w-006', name: 'Soft Tailored Blazer', collection: 'women', category: 'Tailoring',
    price: 8490, tags: ['new'],
    description: 'An unstructured blazer with a relaxed shoulder and a three-quarter sleeve. Dress it up, or wear it over a tee.',
    details: ['Relaxed fit', 'Three-quarter sleeves', 'Two front pockets', 'Dry clean recommended'],
    sizes: SIZE_SETS.clothing, soldOut: ['XL'],
    colours: [
      { name: 'Cream', hex: '#efe6cf', image: 'blazer-cream' },
      { name: 'Crimson', hex: '#c4163c', image: 'blazer-crimson' }
    ]
  },
  {
    id: 'mv-m-001', name: 'Tailored Wool Blazer', collection: 'men', category: 'Tailoring',
    price: 11990, tags: ['trending'],
    description: 'A sharply cut single-breasted blazer in a fine wool blend. Natural shoulder, clean lapel, and a fit that lets you move.',
    details: ['Two-button single-breasted', 'Half-canvassed construction', 'Interior pockets', 'Dry clean only'],
    sizes: SIZE_SETS.clothing, soldOut: [],
    colours: [
      { name: 'Navy', hex: '#222c3d', image: 'blazer-navy' },
      { name: 'Black', hex: '#1c1d1f', image: 'blazer-black' }
    ]
  },
  {
    id: 'mv-m-002', name: 'Classic Poplin Shirt', collection: 'men', category: 'Tops',
    price: 3490, tags: [],
    description: 'A crisp poplin shirt in soft ivory with a clean collar and mother-of-pearl style buttons. The one that goes with everything.',
    details: ['Regular fit', 'Cotton poplin', 'Button cuffs', 'Machine wash cold'],
    sizes: SIZE_SETS.clothing, soldOut: ['XS'],
    colours: [{ name: 'Ivory', hex: '#e9e7ee', image: 'shirt-ivory' }]
  },
  {
    id: 'mv-m-003', name: 'Straight-Leg Jean', collection: 'men', category: 'Denim',
    price: 4990, tags: ['trending'],
    description: 'A straight-leg jean in rinsed indigo denim with a hint of stretch. Sits at the waist, falls clean to the ankle.',
    details: ['Mid-rise, straight leg', 'Five-pocket styling', '98% cotton, 2% elastane', 'Machine wash cold'],
    sizes: SIZE_SETS.denim, soldOut: ['36'],
    colours: [
      { name: 'Indigo', hex: '#1d2840', image: 'jean-indigo' },
      { name: 'Washed Blue', hex: '#3f7fb7', image: 'jean-washed' }
    ]
  },
  {
    id: 'mv-m-004', name: 'Cognac Leather Biker', collection: 'men', category: 'Outerwear',
    price: 16990, tags: ['new'],
    description: 'A cropped biker jacket in rich cognac leather with an asymmetric zip and zipped pockets. Gets better with every wear.',
    details: ['Asymmetric front zip', 'Zip pockets', 'Fully lined', 'Specialist leather clean'],
    sizes: SIZE_SETS.clothing, soldOut: ['XS', 'XL'],
    colours: [{ name: 'Cognac', hex: '#9a5a1e', image: 'leather-cognac' }]
  },
  {
    id: 'mv-m-005', name: 'Heavyweight Hoodie', collection: 'men', category: 'Sweats',
    price: 4490, tags: ['new', 'trending'],
    description: 'A dense, brushed-back fleece hoodie with ribbed trims and a deep kangaroo pocket. Built for cold mornings.',
    details: ['Brushed-back fleece', 'Contrast drawcord', 'Ribbed hem and cuffs', 'Machine wash cold'],
    sizes: SIZE_SETS.clothing, soldOut: [],
    colours: [
      { name: 'Charcoal', hex: '#4b4f53', image: 'hoodie-charcoal' },
      { name: 'Sky', hex: '#97b5d4', image: 'hoodie-sky' }
    ]
  },
  {
    id: 'mv-m-006', name: 'Essential Crew Tee', collection: 'men', category: 'Tops',
    price: 1790, tags: [],
    description: 'A soft, mid-weight crew tee in stone. Clean neckline, easy fit, and just the right drape. Also in moss.',
    details: ['Relaxed fit', 'Combed cotton jersey', 'Ribbed crew neck', 'Machine wash cold'],
    sizes: SIZE_SETS.clothing, soldOut: [],
    colours: [
      { name: 'Stone', hex: '#c9c5b8', image: 'tee-stone' },
      { name: 'Moss', hex: '#5c9a6e', image: 'tee-moss' }
    ]
  }
];

export const byId = (id) => PRODUCTS.find((p) => p.id === id) || null;

/** Find the product whose colourway uses a given image key. */
export const productByImage = (key) =>
  PRODUCTS.find((p) => p.colours.some((c) => c.image === key)) || null;

export const CATEGORIES = [...new Set(PRODUCTS.map((p) => p.category))];

/** Dev-time sanity check: duplicate ids would silently break the cart. */
(() => {
  const seen = new Set();
  PRODUCTS.forEach((p) => {
    if (seen.has(p.id)) console.warn('[products] duplicate product id:', p.id);
    seen.add(p.id);
  });
})();
