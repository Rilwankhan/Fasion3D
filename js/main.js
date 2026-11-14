/**
 * main.js — boots the experience and wires the shop UI.
 * Everything here works with or without WebGL; the 3D layer is an enhancement.
 */
import { SITE } from './config.js';
import { PRODUCTS, CATEGORIES, byId } from './products.js';
import { IMAGES, IMAGE_BASE } from './media.js';
import { createScene3D, webglSupported } from './scene3d.js';
import { buildStory, introHero } from './scrollAnimations.js';
import * as Cart from './cart.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const imgUrl = (key) => IMAGE_BASE + IMAGES[key].src;
const money = Cart.money;

let scene3d = null;      // null when WebGL is unavailable
let story = null;
const state = { filter: 'all', category: '', q: '', sort: 'featured' };

/* ===================================================================== static content */
function bindBrand() {
  const get = (path) => {
    if (path === 'hero.line1') return SITE.brand.heroTitle[0];
    if (path === 'hero.line2') return SITE.brand.heroTitle[1];
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), SITE);
  };
  $$('[data-bind]').forEach((el) => { const v = get(el.dataset.bind); if (typeof v === 'string') el.textContent = v; });
  document.title = `${SITE.brand.name} — ${SITE.brand.tagline}`;
  $('#values').innerHTML = SITE.brand.about.values.map((v) => `<li><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join('');
  const wa = String(SITE.whatsapp.number).replace(/\D/g, '');
  $('#f-wa').href = `https://wa.me/${wa}`;
  $('#f-mail').href = `mailto:${SITE.contact.email}`; $('#f-mail').textContent = SITE.contact.email;
  $('#f-ig').href = SITE.contact.instagram; $('#f-ig').textContent = SITE.contact.instagramHandle;
  $('#f-ship').textContent = SITE.shipping.note;
  $('#year').textContent = new Date().getFullYear();
  $('#sel-category').insertAdjacentHTML('beforeend', CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join(''));
}

/* ===================================================================== shop grid */
const matches = (p) => {
  if (state.filter === 'women' || state.filter === 'men') { if (p.collection !== state.filter) return false; }
  else if (state.filter === 'new' || state.filter === 'trending') { if (!p.tags.includes(state.filter)) return false; }
  if (state.category && p.category !== state.category) return false;
  if (state.q) {
    const hay = [p.name, p.category, p.collection, p.description, ...p.colours.map((c) => c.name)].join(' ').toLowerCase();
    if (!state.q.toLowerCase().split(/\s+/).every((t) => hay.includes(t))) return false;
  }
  return true;
};
const visibleProducts = () => {
  const list = PRODUCTS.filter(matches);
  if (state.sort === 'low') list.sort((a, b) => a.price - b.price);
  if (state.sort === 'high') list.sort((a, b) => b.price - a.price);
  return list;
};

function renderGrid() {
  const list = visibleProducts();
  $('#grid').innerHTML = list.map((p) => `
    <article class="card" data-id="${p.id}">
      <button class="card__media" data-open="${p.id}" aria-label="View ${esc(p.name)}">
        ${p.tags.includes('new') ? '<span class="card__tag">New</span>' : ''}
        <img src="${imgUrl(p.colours[0].image)}" alt="${esc(IMAGES[p.colours[0].image].alt)}" loading="lazy" decoding="async"
             width="${IMAGES[p.colours[0].image].w}" height="${IMAGES[p.colours[0].image].h}">
        <span class="card__cta">View &amp; add</span>
      </button>
      <div class="card__body">
        <h3 class="card__name">${esc(p.name)}</h3>
        <p class="card__meta">${p.collection === 'women' ? 'Women' : 'Men'} · ${esc(p.category)}</p>
        <div class="card__row">
          <span class="card__price">${money(p.price)}</span>
          <span class="dots" aria-label="${p.colours.length} colour${p.colours.length > 1 ? 's' : ''}">${p.colours.map((c) => `<i style="background:${c.hex}" title="${esc(c.name)}"></i>`).join('')}</span>
        </div>
      </div>
    </article>`).join('');
  $('#grid-empty').hidden = list.length > 0;
  $('#shop-count').textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
  $$('#chips .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.filter === state.filter));
}

function setFilter(name, { scroll = false } = {}) {
  state.filter = name; state.category = ''; $('#sel-category').value = '';
  renderGrid();
  if (scroll) scrollToShop();
}

/* ===================================================================== scrolling helpers */
function smoothScrollTo(y) {
  const { gsap } = window;
  if (!gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) { scrollTo(0, y); return; }
  const proxy = { y: scrollY };
  const t = gsap.to(proxy, { y, duration: Math.min(3, 0.8 + Math.abs(y - scrollY) / 2800), ease: 'power2.inOut', onUpdate: () => scrollTo(0, proxy.y) });
  ['wheel', 'touchstart', 'keydown'].forEach((e) => addEventListener(e, () => t.kill(), { once: true, passive: true }));
}
const topOf = (el) => el.getBoundingClientRect().top + scrollY;
const scrollToShop = () => smoothScrollTo(topOf($('#shop')) - 1);
const scrollToAbout = () => smoothScrollTo(topOf($('#about')) - 1);
function goScene(name) {
  if (story) story.scrollToScene(name);
  else smoothScrollTo(name === 'hero' ? 0 : topOf($('#panel-' + name)) - 20);
}

/* ===================================================================== toast */
let toastTimer;
function toast(msg, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { action.run(); el.classList.remove('is-show'); };
  el.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-show'), 3800);
}

/* ===================================================================== dialog helpers (focus + Esc) */
const dialogs = [];   // stack of { el, close, last }
function trapTab(e, root) {
  if (e.key !== 'Tab') return;
  const f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', root).filter((x) => x.offsetParent !== null || x === document.activeElement);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
addEventListener('keydown', (e) => {
  const top = dialogs[dialogs.length - 1];
  if (e.key === 'Escape') {
    if (top) top.close();
    else if (!$('#searchbar').hidden) closeSearch();
    else if ($('#nav').classList.contains('is-menu-open')) toggleMenu(false);
  } else if (top) trapTab(e, top.el);
});
function pushDialog(el, close, focusEl) {
  dialogs.push({ el, close, last: document.activeElement });
  document.documentElement.classList.add('is-locked');
  setTimeout(() => focusEl && focusEl.focus({ preventScroll: true }), 60);
}
function popDialog(el) {
  const i = dialogs.findIndex((d) => d.el === el);
  if (i < 0) return;
  const [d] = dialogs.splice(i, 1);
  if (!dialogs.length) document.documentElement.classList.remove('is-locked');
  d.last && d.last.focus && d.last.focus({ preventScroll: true });
}

/* ===================================================================== product showcase */
const sc = { id: null, colour: 0, size: null, qty: 1, open: false };
const scEl = $('#showcase');

function colourOf(p) { return p.colours[sc.colour] || p.colours[0]; }

function renderShowcase() {
  const p = byId(sc.id), col = colourOf(p);
  $('#sc-meta').textContent = `${p.collection === 'women' ? 'Women' : 'Men'} · ${p.category}`;
  $('#sc-name').textContent = p.name;
  $('#sc-price').textContent = money(p.price);
  $('#sc-desc').textContent = p.description;
  $('#sc-colour-name').textContent = col.name;
  $('#sc-details').innerHTML = p.details.map((d) => `<li>${esc(d)}</li>`).join('');
  $('#sc-swatches').innerHTML = p.colours.map((c, i) =>
    `<button class="swatch" role="radio" aria-checked="${i === sc.colour}" aria-label="${esc(c.name)}" title="${esc(c.name)}" data-i="${i}" style="background:${c.hex}"></button>`).join('');
  $('#sc-sizes').innerHTML = p.sizes.map((s) => {
    const out = (p.soldOut || []).includes(s);
    return `<button class="size" role="radio" aria-checked="${sc.size === s}" data-size="${s}" ${out ? 'disabled title="Sold out"' : ''}>${s}</button>`;
  }).join('');
  const msg = $('#sc-size-msg'); msg.textContent = sc.size || ''; msg.classList.remove('is-error');
  $('#sc-qty').textContent = sc.qty;
  const img = $('#sc-img'); img.src = imgUrl(col.image); img.alt = IMAGES[col.image].alt;
}

function openShowcase(id, imageKey) {
  const p = byId(id); if (!p) return;
  sc.id = id; sc.size = null; sc.qty = 1;
  sc.colour = Math.max(0, p.colours.findIndex((c) => c.image === imageKey));
  renderShowcase();
  if (!sc.open) {
    sc.open = true;
    document.documentElement.classList.add('is-showcase');
    scEl.hidden = false;
    requestAnimationFrame(() => scEl.classList.add('is-open'));
    pushDialog(scEl, closeShowcase, $('#sc-close'));
    $('#sc-panel').scrollTop = 0;
    if (scene3d) {
      const gl = $('#gl');
      gl.classList.add('is-front');
      scene3d.setMode('showcase'); scene3d.resetShowcase();
      const { gsap } = window;
      gsap.fromTo(gl, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      const s = scene3d.show.pivot.scale; s.set(0.86, 0.86, 0.86);
      gsap.to(s, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'power3.out' });
    }
  }
  if (scene3d) scene3d.showImage(colourOf(p).image, { instant: false });
}

function closeShowcase() {
  if (!sc.open) return;
  sc.open = false;
  scEl.classList.remove('is-open');
  const done = () => {
    scEl.hidden = true;
    document.documentElement.classList.remove('is-showcase');
    if (scene3d) {
      const gl = $('#gl');
      gl.classList.remove('is-front'); gl.style.opacity = '';
      scene3d.setMode('story');
    }
  };
  setTimeout(done, 420);
  popDialog(scEl);
}

function stepProduct(dir) {
  let ids = visibleProducts().map((p) => p.id);
  if (!ids.includes(sc.id)) ids = PRODUCTS.map((p) => p.id);
  const i = ids.indexOf(sc.id);
  openShowcase(ids[(i + dir + ids.length) % ids.length]);
}

function initShowcaseUI() {
  $('#sc-close').onclick = closeShowcase;
  $('#sc-prev').onclick = () => stepProduct(-1);
  $('#sc-next').onclick = () => stepProduct(1);
  $('#sc-swatches').addEventListener('click', (e) => {
    const b = e.target.closest('.swatch'); if (!b) return;
    sc.colour = +b.dataset.i;
    const p = byId(sc.id), col = colourOf(p);
    $$('#sc-swatches .swatch').forEach((s, i) => s.setAttribute('aria-checked', i === sc.colour));
    $('#sc-colour-name').textContent = col.name;
    const img = $('#sc-img'); img.src = imgUrl(col.image); img.alt = IMAGES[col.image].alt;
    scene3d && scene3d.showImage(col.image);
  });
  $('#sc-sizes').addEventListener('click', (e) => {
    const b = e.target.closest('.size'); if (!b || b.disabled) return;
    sc.size = b.dataset.size;
    $$('#sc-sizes .size').forEach((s) => s.setAttribute('aria-checked', s === b));
    const m = $('#sc-size-msg'); m.textContent = sc.size; m.classList.remove('is-error');
  });
  $('#sc-minus').onclick = () => { sc.qty = Math.max(1, sc.qty - 1); $('#sc-qty').textContent = sc.qty; };
  $('#sc-plus').onclick = () => { sc.qty = Math.min(10, sc.qty + 1); $('#sc-qty').textContent = sc.qty; };
  $('#sc-add').onclick = () => {
    if (!sc.size) {
      const m = $('#sc-size-msg'); m.textContent = 'Please select a size'; m.classList.add('is-error');
      $$('#sc-sizes .size').forEach((s) => { s.classList.remove('shake'); void s.offsetWidth; if (!s.disabled) s.classList.add('shake'); });
      return;
    }
    const p = byId(sc.id), col = colourOf(p);
    if (Cart.addItem({ id: sc.id, size: sc.size, colour: col.name, qty: sc.qty })) {
      toast(`${p.name} added to cart`, { label: 'View cart', run: openCart });
    }
  };
  addEventListener('keydown', (e) => {
    if (!sc.open || dialogs[dialogs.length - 1]?.el !== scEl) return;
    if (e.key === 'ArrowLeft') stepProduct(-1);
    if (e.key === 'ArrowRight') stepProduct(1);
  });
}

/* ===================================================================== cart drawer */
const cartEl = $('#cart'), scrim = $('#scrim');
let cartOpen = false;

function renderCart() {
  const s = Cart.summary();
  const count = $('#cart-count');
  const prev = +count.textContent;
  count.textContent = s.count; count.classList.toggle('has-items', s.count > 0);
  if (s.count > prev) { count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump'); }
  $('#btn-cart').setAttribute('aria-label', `Open cart, ${s.count} item${s.count === 1 ? '' : 's'}`);

  const body = $('#cart-body');
  if (!s.lines.length) {
    body.innerHTML = `<div class="cart__empty"><p>Your cart is empty.</p><button class="btn btn--dark" id="cart-continue">Continue shopping</button></div>`;
    $('#cart-foot').hidden = true;
    return;
  }
  $('#cart-foot').hidden = false;
  body.innerHTML = s.lines.map((l) => `
    <div class="line" data-key="${esc(l.key)}">
      <div class="line__img"><img src="${imgUrl(l.colourObj.image)}" alt="${esc(l.product.name)}"></div>
      <div class="line__info">
        <p class="line__name">${esc(l.product.name)}</p>
        <p class="line__meta">${esc(l.colour)} · Size ${esc(l.size)}</p>
        <div class="line__row">
          <div class="qty qty--sm" role="group" aria-label="Quantity">
            <button data-act="dec" aria-label="Decrease quantity">−</button><output>${l.qty}</output><button data-act="inc" aria-label="Increase quantity">+</button>
          </div>
          <span class="line__price">${money(l.total)}</span>
        </div>
        <button class="line__remove" data-act="rm">Remove</button>
      </div>
    </div>`).join('');
  $('#cart-sub').textContent = money(s.subtotal);
  $('#cart-ship').textContent = s.shipping === 0 ? 'Free' : money(s.shipping);
  const left = SITE.shipping.freeAbove - s.subtotal;
  $('#cart-note').textContent = left > 0 ? `Add ${money(left)} more for free shipping.` : 'You’ve unlocked free shipping.';
}

function openCart() {
  if (cartOpen) return;
  cartOpen = true;
  scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('is-open'));
  cartEl.classList.add('is-open'); cartEl.setAttribute('aria-hidden', 'false');
  pushDialog(cartEl, closeCart, $('#cart-close'));
}
function closeCart() {
  if (!cartOpen) return;
  cartOpen = false;
  scrim.classList.remove('is-open'); cartEl.classList.remove('is-open'); cartEl.setAttribute('aria-hidden', 'true');
  setTimeout(() => { if (!cartOpen) scrim.hidden = true; }, 360);
  popDialog(cartEl);
}

function initCartUI() {
  $('#btn-cart').onclick = openCart;
  $('#cart-close').onclick = closeCart;
  scrim.onclick = closeCart;
  $('#cart-body').addEventListener('click', (e) => {
    if (e.target.id === 'cart-continue') { closeCart(); closeShowcase(); scrollToShop(); return; }
    const act = e.target.closest('[data-act]'); if (!act) return;
    const key = act.closest('.line').dataset.key;
    const line = Cart.summary().lines.find((l) => l.key === key); if (!line) return;
    if (act.dataset.act === 'inc') Cart.setQty(key, line.qty + 1);
    if (act.dataset.act === 'dec') Cart.setQty(key, line.qty - 1);
    if (act.dataset.act === 'rm') Cart.removeItem(key);
  });
  $('#cart-checkout').onclick = () => { closeCart(); openCheckout(); };
  addEventListener('cart:change', renderCart);
  addEventListener('storage', (e) => { if (e.key === SITE.storage.cartKey) location.reload(); });
}

/* ===================================================================== checkout + WhatsApp */
const coEl = $('#checkout');
const CUSTOMER_KEY = 'fasion.customer.v1';
let coOpen = false, lastWaUrl = '';

function renderCheckoutSummary() {
  const s = Cart.summary();
  $('#co-lines').innerHTML = s.lines.map((l) => `
    <li class="co-line">
      <div class="co-line__img"><img src="${imgUrl(l.colourObj.image)}" alt=""></div>
      <div>${esc(l.product.name)}<small>${esc(l.colour)} · ${esc(l.size)} · Qty ${l.qty}</small></div>
      <span>${money(l.total)}</span>
    </li>`).join('');
  $('#co-sub').textContent = money(s.subtotal);
  $('#co-ship').textContent = s.shipping === 0 ? 'Free' : money(s.shipping);
  $('#co-total').textContent = money(s.total);
}

function openCheckout() {
  if (!Cart.summary().count) { toast('Your cart is empty'); return; }
  renderCheckoutSummary();
  $('#co-main').hidden = false; $('#co-done').hidden = true; $('#co-error').hidden = true;
  $('#co-pay').hidden = !Cart.onlinePaymentEnabled();
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null');
    if (saved) ['name', 'phone', 'email', 'address', 'city', 'pin'].forEach((k) => { const f = $('#co-' + k); if (f && !f.value) f.value = saved[k] || ''; });
  } catch (e) { /* ignore */ }
  coEl.hidden = false; requestAnimationFrame(() => coEl.classList.add('is-open'));
  coOpen = true;
  pushDialog(coEl, closeCheckout, $('#co-name'));
}
function closeCheckout() {
  if (!coOpen) return;
  coOpen = false;
  coEl.classList.remove('is-open'); setTimeout(() => { if (!coOpen) coEl.hidden = true; }, 360);
  popDialog(coEl);
}

function readCustomer() {
  const f = $('#co-form');
  const c = {};
  ['name', 'phone', 'email', 'address', 'city', 'pin', 'notes'].forEach((k) => { c[k] = f.elements[k].value.trim(); });
  const bad = [];
  if (c.name.length < 2) bad.push('name');
  if (!/^\+?[\d\s\-()]{7,16}$/.test(c.phone) || c.phone.replace(/\D/g, '').length < 7) bad.push('phone');
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) bad.push('email');
  if (c.address.length < 5) bad.push('address');
  if (c.city.length < 2) bad.push('city');
  if (!/^[A-Za-z0-9\s-]{4,10}$/.test(c.pin)) bad.push('pin');
  ['name', 'phone', 'email', 'address', 'city', 'pin'].forEach((k) => f.elements[k].classList.toggle('is-invalid', bad.includes(k)));
  const err = $('#co-error');
  if (bad.length) {
    err.textContent = 'Please check the highlighted fields.'; err.hidden = false;
    f.elements[bad[0]].focus();
    return null;
  }
  err.hidden = true;
  try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: c.name, phone: c.phone, email: c.email, address: c.address, city: c.city, pin: c.pin })); } catch (e) { /* ignore */ }
  return c;
}

function showDone(title, text, waUrl) {
  $('#co-main').hidden = true; $('#co-done').hidden = false;
  $('#co-done-title').textContent = title; $('#co-done-text').textContent = text;
  const a = $('#co-done-link'); a.href = waUrl; lastWaUrl = waUrl;
  coEl.querySelector('.modal__card').scrollTop = 0;
}

function openExternal(url) {
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}

function initCheckoutUI() {
  $('#co-close').onclick = closeCheckout;
  coEl.addEventListener('click', (e) => { if (e.target === coEl) closeCheckout(); });
  $('#co-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = readCustomer(); if (!c) return;
    const { text, ref } = Cart.buildWhatsAppMessage(c);
    const url = Cart.whatsappUrl(text);
    openExternal(url);
    showDone('Your order is ready to send', `Your order ${ref} is waiting in WhatsApp. Press send there to confirm it with us. If WhatsApp didn’t open, use the button below.`, url);
  });
  $('#co-pay').onclick = async () => {
    const c = readCustomer(); if (!c) return;
    const ref = Cart.orderRef();
    try {
      const resp = await Cart.payOnline(c, ref);
      const { text } = Cart.buildWhatsAppMessage(c, ref);
      const url = Cart.whatsappUrl(`${text}\n\n*Paid online* — Payment ID: ${resp.razorpay_payment_id}`);
      showDone('Payment received', `Thank you! Payment ID ${resp.razorpay_payment_id}. Please send us your order details on WhatsApp so we can ship it.`, url);
    } catch (err) {
      if (err.message !== 'dismissed') { const e = $('#co-error'); e.textContent = err.message || 'Payment failed. Please try again.'; e.hidden = false; }
    }
  };
  $('#co-done-clear').onclick = () => { Cart.clearCart(); closeCheckout(); toast('Cart cleared. Thank you!'); };
}

/* ===================================================================== nav / search / menu */
function toggleMenu(force) {
  const nav = $('#nav');
  const open = force ?? !nav.classList.contains('is-menu-open');
  nav.classList.toggle('is-menu-open', open);
  $('#btn-menu').setAttribute('aria-expanded', open);
  $('#btn-menu').setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.documentElement.classList.toggle('is-locked', open || dialogs.length > 0);
}
function openSearch() {
  const bar = $('#searchbar'); bar.hidden = false;
  $('#btn-search').setAttribute('aria-expanded', 'true');
  $('#search-input').focus();
}
function closeSearch() {
  $('#searchbar').hidden = true; $('#btn-search').setAttribute('aria-expanded', 'false');
  if (state.q) { state.q = ''; $('#search-input').value = ''; renderGrid(); }
}

function initNav() {
  $('#btn-menu').onclick = () => toggleMenu();
  $('#btn-search').onclick = () => ($('#searchbar').hidden ? openSearch() : closeSearch());
  $('#search-close').onclick = closeSearch;
  let t, scrolled = false;
  $('#search-input').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = e.target.value.trim(); renderGrid();
      if (state.q && !scrolled && topOf($('#shop')) - scrollY > 160) { scrolled = true; scrollToShop(); }
      if (!state.q) scrolled = false;
    }, 200);
  });
  $('#search-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); scrollToShop(); $('#search-input').blur(); } });

  // delegated navigation: data-scene / data-go / data-filter / data-open
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-scene],[data-go],[data-filter],[data-open]'); if (!t) return;
    if (t.dataset.open) { openShowcase(t.dataset.open); return; }
    if (t.dataset.filter && !t.closest('#chips')) { e.preventDefault(); setFilter(t.dataset.filter, { scroll: true }); return; }
    if (t.closest('#chips')) { setFilter(t.dataset.filter); return; }
    e.preventDefault();
    toggleMenu(false);
    if (t.dataset.scene) goScene(t.dataset.scene);
    else if (t.dataset.go === 'shop') scrollToShop();
    else if (t.dataset.go === 'about') scrollToAbout();
  });

  $('#sel-category').onchange = (e) => { state.category = e.target.value; renderGrid(); };
  $('#sel-sort').onchange = (e) => { state.sort = e.target.value; renderGrid(); };
  $('#clear-filters').onclick = () => { state.q = ''; state.category = ''; state.filter = 'all'; $('#search-input').value = ''; $('#sel-category').value = ''; renderGrid(); };

  // 3D tilt on product cards (mouse only)
  const grid = $('#grid');
  grid.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const m = e.target.closest('.card__media'); if (!m) return;
    const r = m.getBoundingClientRect();
    m.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
    m.querySelector('img').style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 10}deg`);
    m.querySelector('img').style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
  });
  grid.addEventListener('pointerout', (e) => {
    const m = e.target.closest('.card__media'); if (!m) return;
    const img = m.querySelector('img'); img.style.removeProperty('--rx'); img.style.removeProperty('--ry');
  });

  // nav colour follows the section underneath
  const nav = $('#nav'), shop = $('#shop');
  let ticking = false;
  const upd = () => {
    ticking = false;
    const r = shop.getBoundingClientRect();
    nav.classList.toggle('nav--light', r.top < 40 && r.bottom > 40 && !nav.classList.contains('is-menu-open'));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
}

/* ===================================================================== 3D boot */
function fallbackMode(reason) {
  console.info('[velour] 3D disabled:', reason);
  document.documentElement.classList.add('no-webgl');
  $('#sc-hint').hidden = true;
  $('.fallback-strip').innerHTML = PRODUCTS.slice(0, 8).map((p) => `<li><img src="${imgUrl(p.colours[0].image)}" alt="${esc(p.name)}" height="300"></li>`).join('');
  hidePreloader();
}

function hidePreloader() {
  const p = $('#preloader');
  p.classList.add('is-done');
  setTimeout(() => p.remove(), 1000);
}

async function boot3D() {
  if (!webglSupported() || !window.gsap || !window.ScrollTrigger) return fallbackMode('WebGL or GSAP unavailable');
  try {
    scene3d = createScene3D({
      canvas: $('#gl'),
      onProgress: (v) => { $('#preloader-bar').style.width = `${Math.round(v * 100)}%`; }
    });
  } catch (err) { scene3d = null; return fallbackMode(err.message); }

  try { await document.fonts.load('600 200px Poppins'); } catch (e) { /* font optional */ }
  scene3d.buildWord(SITE.brand.wordmark);

  const dots = $$('#story-dots button');
  story = buildStory({
    scene3d,
    story: $('#story'),
    panels: { hero: $('#panel-hero'), women: $('#panel-women'), men: $('#panel-men'), new: $('#panel-new') },
    dots,
    onSceneChange: (idx) => dots.forEach((d, i) => d.classList.toggle('is-active', i === idx))
  });
  dots[0].classList.add('is-active');

  scene3d.setPick((id, key) => openShowcase(id, key));
  scene3d.bindShowcaseDrag($('#sc-stage'));

  // render only while the story is on screen (saves battery); the shop sits on top of the canvas
  new IntersectionObserver((entries) => {
    const on = entries[0].isIntersecting;
    scene3d.setActive(on);
    $('#story-overlay').classList.toggle('is-off', !on);
  }, { threshold: 0 }).observe($('#story'));

  const ready = scene3d.loadAll();
  await Promise.race([ready, new Promise((r) => setTimeout(r, 7000))]);
  hidePreloader();
  introHero(scene3d, $('#panel-hero'));
  window.ScrollTrigger.refresh();
}

/* ===================================================================== init */
bindBrand();
renderGrid();
renderCart();
initNav();
initShowcaseUI();
initCartUI();
initCheckoutUI();

(async () => {
  await boot3D();
  if (location.hash === '#shop') setTimeout(scrollToShop, 300);
  window.__velour = { scene3d, story, Cart, state };   // handy for debugging / tests
})();
