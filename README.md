# MAISON VELOUR — immersive 3D fashion store

A complete, frontend-only fashion e-commerce site built on **Three.js** (WebGL) and **GSAP ScrollTrigger**.
Real garment photographs are used as textures on 3D image planes; scrolling flies the camera through the
Women's, Men's and New-Arrivals scenes. The shop, cart, checkout and WhatsApp ordering all work with
plain HTML/CSS/JS — no build step, no backend, no database.

## Run it

Browsers block WebGL textures and ES modules on `file://`, so serve the folder over HTTP:

```bash
cd maison-velour
python3 -m http.server 8000        # or: npx serve .
# open http://localhost:8000
```

Deploy by uploading the folder to any static host (Netlify, Vercel, GitHub Pages, S3, Cloudflare Pages…).
Everything (Three.js, GSAP, Poppins) is bundled locally — **no CDN needed at runtime**.

## First things to edit

| What | File |
|---|---|
| **WhatsApp number** (international format, no `+`) | `js/config.js` → `whatsapp.number` |
| Brand name, tagline, hero copy, about text | `js/config.js` → `brand` |
| Currency, shipping fee, free-shipping threshold | `js/config.js` → `currency`, `shipping` |
| Online payment (Razorpay key id) | `js/config.js` → `payment.razorpayKey` |
| Products, prices, sizes, colours, tags | `js/products.js` |
| Image paths + pixel sizes | `js/media.js` → `IMAGES` |
| 3D layout (what floats where, sizes, depth) | `js/media.js` → `SCENES` |
| Scene colours | `js/media.js` → `THEME` |

> The WhatsApp number is currently a **placeholder** (`919999999999`). Orders will go nowhere until you change it.

## Project structure

```
index.html              page structure (story overlay, shop, showcase, cart, checkout)
css/style.css           design system + components
css/responsive.css      breakpoints (1100 / 900 / 560 / short landscape)
js/config.js            brand, currency, shipping, WhatsApp, payment
js/products.js          catalogue (12 sample products)
js/media.js             image paths + 3D scene layouts + theme
js/scene3d.js           Three.js world: renderer, textures, planes, particles, showcase stage, picking
js/scrollAnimations.js  ONE scrubbed GSAP timeline: camera path + plane entrances + text panels
js/cart.js              cart (LocalStorage), totals, WhatsApp message builder, Razorpay
js/main.js              UI: nav, search, filters, grid, showcase, cart drawer, checkout, boot
vendor/                 three.js (tree-shaken, minified), gsap, ScrollTrigger
assets/products/        transparent WebP garment cut-outs
assets/fonts/           Poppins (self-hosted)
```

## How the 3D works

* **One WebGL context** (`#gl`, fixed behind the page). Garments are `PlaneGeometry` meshes with the real
  photo as a `TextureLoader` texture on an unlit `MeshBasicMaterial`, so the photo's colours are never tinted or lit.
  Depth comes from z-layering, fog, perspective, floor shadows and pointer parallax. Aspect ratios come from `media.js`, so photos are never stretched.
* **Scroll → camera.** `#story` is 800vh tall. A single GSAP timeline (scrubbed) drives the camera path
  (fly → orbit → fly → orbit → fly into the ring → 330° turn), the image-plane entrances and the text panels.
  Because it is one timeline with explicit from/to values, scrolling backwards reverses everything exactly (verified by test).
* **Product showcase.** Opening a product switches the same renderer to a stage with the garment on its own plane;
  drag to tilt, swap colours (cross-fade), step through products. Click/tap a garment in the story to open it too.
* **Mobile / performance.** Pixel ratio capped (1.5 on touch devices) and auto-lowered if frames get slow;
  fewer particles; one shared geometry; hero textures load first, the rest stream in idle time; rendering
  pauses when the story is off-screen or the tab is hidden; WebGL context-loss is handled; large-viewport
  (`lvh`) canvas sizing avoids iOS toolbar resize jank.
* **No WebGL?** A calm static editorial layout is shown instead — the whole shop still works.
* `prefers-reduced-motion` is respected.

## Checkout & ordering

* Cart persists in `localStorage` (`maisonvelour.cart.v1`) and is re-validated against `products.js` on load.
* **WhatsApp:** the checkout form builds an itemised message (products, sizes, colours, quantities, totals, customer
  details, order ref) and opens `wa.me/<your number>`. The customer presses *send* to place the order.
* **Pay online (optional):** set `payment.razorpayKey` to a Razorpay *key id* and a "Pay online" button appears.
  This is a frontend-only integration — **there is no server-side order creation or signature verification**.
  For real money, create orders on a server and verify payments before shipping (confirm in your Razorpay dashboard).
  It is hidden when no key is set; no fake "payment success" is ever shown.

## Photography & licensing

All garment images come from the **CC0 / public-domain** [clothing-dataset](https://github.com/alexeygrigorev/clothing-dataset)
by Alexey Grigorev, background-removed and upscaled 2× for this project. They are real, casual product photographs
(not studio campaign shots), at ~300–500 px originals, so they look soft at full-screen scale.
**For a real launch, replace them with your own high-resolution transparent cut-outs** (about 1500 px tall):
drop the files into `assets/products/`, update `IMAGES` in `js/media.js`, and point colours in `js/products.js` at them.
Product names, prices, fabrics and copy are sample content for a fictional brand.

## Tested

Headless Chrome (software WebGL), desktop 1440×900 and iPhone-sized 390×844 with touch: all 31 image planes render;
camera path at all scenes; reverse-scroll exactness; 12 products; every filter, category, sort and search; showcase
(open, colour swap, drag-tilt, prev/next, size validation, sold-out sizes); cart add/qty/remove/clear and
persistence across reloads; checkout validation; WhatsApp URL + message contents; mobile menu; no horizontal overflow;
no-WebGL fallback; zero console errors.
**Not tested:** real iPhone Safari / Android hardware, and live Razorpay or WhatsApp delivery.
