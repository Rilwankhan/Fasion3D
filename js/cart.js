/**
 * cart.js — cart state (LocalStorage), totals, WhatsApp order builder, optional Razorpay.
 * Product data is always re-read from products.js, so prices/names can never go stale.
 */
import { SITE } from './config.js';
import { byId } from './products.js';

const KEY = SITE.storage.cartKey;
const fmt = new Intl.NumberFormat(SITE.currency.locale, { maximumFractionDigits: 0 });
export const money = (n) => `${SITE.currency.symbol}${fmt.format(n)}`;

let items = [];                                   // [{ id, size, colour, qty }]
const MAX_QTY = 10;
const lineKey = (i) => `${i.id}|${i.size}|${i.colour}`;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    items = (Array.isArray(raw) ? raw : []).filter((i) => {
      const p = byId(i && i.id);
      return p && p.sizes.includes(i.size) && p.colours.some((c) => c.name === i.colour) &&
        Number.isInteger(i.qty) && i.qty > 0;
    }).map((i) => ({ ...i, qty: Math.min(i.qty, MAX_QTY) }));
  } catch (e) { items = []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* private mode / quota */ }
  dispatchEvent(new CustomEvent('cart:change', { detail: summary() }));
}

export function summary() {
  const lines = items.map((i) => {
    const p = byId(i.id);
    const colour = p.colours.find((c) => c.name === i.colour);
    return { ...i, key: lineKey(i), product: p, colourObj: colour, unit: p.price, total: p.price * i.qty };
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const shipping = count === 0 ? 0 : (subtotal >= SITE.shipping.freeAbove ? 0 : SITE.shipping.flat);
  return { lines, subtotal, count, shipping, total: subtotal + shipping };
}

export function addItem({ id, size, colour, qty = 1 }) {
  const p = byId(id);
  if (!p || !p.sizes.includes(size) || (p.soldOut || []).includes(size)) return false;
  const existing = items.find((i) => lineKey(i) === `${id}|${size}|${colour}`);
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
  else items.push({ id, size, colour, qty: Math.min(MAX_QTY, Math.max(1, qty)) });
  save();
  return true;
}
export function setQty(key, qty) {
  const it = items.find((i) => lineKey(i) === key);
  if (!it) return;
  if (qty <= 0) return removeItem(key);
  it.qty = Math.min(MAX_QTY, qty);
  save();
}
export function removeItem(key) { items = items.filter((i) => lineKey(i) !== key); save(); }
export function clearCart() { items = []; save(); }

/* ---------------------------------------------------------------- WhatsApp */
export function orderRef() {
  return 'MV-' + Date.now().toString(36).toUpperCase().slice(-6);
}

export function buildWhatsAppMessage(customer, ref = orderRef()) {
  const s = summary();
  const L = [];
  L.push(`*New order — ${SITE.brand.name}*`);
  L.push(`Order ref: ${ref}`);
  L.push('');
  s.lines.forEach((l, n) => {
    L.push(`${n + 1}. ${l.product.name}`);
    L.push(`   Size: ${l.size} | Colour: ${l.colour} | Qty: ${l.qty}`);
    L.push(`   ${money(l.unit)} x ${l.qty} = ${money(l.total)}`);
  });
  L.push('');
  L.push(`Subtotal: ${money(s.subtotal)}`);
  L.push(`Shipping: ${s.shipping === 0 ? 'Free' : money(s.shipping)}`);
  L.push(`*Total: ${money(s.total)}*`);
  L.push('');
  L.push('*Customer details*');
  L.push(`Name: ${customer.name}`);
  L.push(`Phone: ${customer.phone}`);
  if (customer.email) L.push(`Email: ${customer.email}`);
  L.push(`Address: ${customer.address}, ${customer.city} - ${customer.pin}`);
  if (customer.notes) L.push(`Notes: ${customer.notes}`);
  return { text: L.join('\n'), ref };
}

export function whatsappUrl(text) {
  const num = String(SITE.whatsapp.number).replace(/\D/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

/* ---------------------------------------------------------------- Razorpay (optional) */
export const onlinePaymentEnabled = () => !!(SITE.payment && SITE.payment.razorpayKey);

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = res; s.onerror = () => rej(new Error('Could not load Razorpay'));
    document.head.appendChild(s);
  });
}

/** Opens Razorpay Checkout. Resolves with the payment response, rejects if dismissed or failed. */
export async function payOnline(customer, ref) {
  await loadRazorpay();
  const s = summary();
  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: SITE.payment.razorpayKey,
      amount: Math.round(s.total * 100),
      currency: SITE.currency.code,
      name: SITE.brand.name,
      description: `Order ${ref}`,
      prefill: { name: customer.name, email: customer.email || '', contact: customer.phone },
      notes: { order_ref: ref, address: `${customer.address}, ${customer.city} - ${customer.pin}` },
      theme: { color: SITE.payment.themeColor },
      handler: (resp) => resolve(resp),
      modal: { ondismiss: () => reject(new Error('dismissed')) }
    });
    rz.on && rz.on('payment.failed', (r) => reject(new Error((r.error && r.error.description) || 'Payment failed')));
    rz.open();
  });
}

load();
