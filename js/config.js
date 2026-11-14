/**
 * SITE CONFIGURATION — edit this file to rebrand the store.
 * Nothing in here is secret: this is a frontend-only site, so never put
 * private API keys in this file.
 */
export const SITE = {
  brand: {
    name: ' FASION',
    short: 'Fasion',
    wordmark: 'FASION',                       // large word rendered in the 3D hero
    season: 'Autumn / Winter 26',
    tagline: 'Quiet luxury, cut for movement.',
    heroTitle: ['Quiet luxury,', 'cut for movement.'],
    heroText: 'Twelve considered pieces for the season ahead. Real fabric, real silhouettes, made to be worn on repeat.',
    about: {
      title: 'Made slowly. Worn for years.',
      text: 'Fasion Velour is a small fashion house built on a simple idea: fewer, better garments. Every piece in the collection is cut for movement, finished by hand and designed to sit comfortably in a wardrobe season after season.',
      values: [
        { title: 'Considered cuts', text: 'Clean lines and honest proportions that flatter without trying too hard.' },
        { title: 'Honest materials', text: 'Natural and responsibly sourced fabrics chosen for how they age, not just how they look.' },
        { title: 'Made to last', text: 'Reinforced seams and quality finishing so a piece earns its place for years.' }
      ]
    }
  },

  contact: {
    email: 'hello@maisonvelour.example',
    instagram: 'https://instagram.com/maisonvelour',
    instagramHandle: '@maisonvelour',
    city: 'Mumbai, India'
  },

  currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },

  shipping: {
    freeAbove: 5000,      // order subtotal at/above which shipping is free
    flat: 199,            // otherwise this flat fee applies
    note: 'Free shipping on orders above ₹5,000. Dispatch in 2–3 working days.'
  },

  /**
   * WhatsApp ordering. `number` must be in international format with the
   * country code and NO "+", spaces or dashes. e.g. India: 919876543210
   * >>> REPLACE THIS WITH YOUR REAL NUMBER <<<
   */
  whatsapp: {
    number: '918608865811'
  },

  /**
   * Optional online payment (Razorpay Checkout). Leave `razorpayKey` empty to
   * hide the "Pay online" button. Use a *key id* only (rzp_test_… / rzp_live_…).
   * Because there is no backend, payments are not verified server-side — see README.
   */
  payment: {
    provider: 'razorpay',
    razorpayKey: '',
    themeColor: '#c8a977'
  },

  storage: { cartKey: 'fasion.cart.v1' }
};
