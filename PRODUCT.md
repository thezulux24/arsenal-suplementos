# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) headless storefront on `@latinovation/cms-client` 4.1. All content, catalog, imagery, design tokens, payments and domain live in WebProAI / Latinovation CMS (`https://webproai.tech`, project slug `tusplatos`), read from `GET /api/v1/delivery/tusplatos` and editable in `/portal`. Deployed on the user's Coolify.

## Users

Households in Cali and the rest of Colombia setting or renewing their table: couples moving in, people buying a gift, people replacing broken pieces. They browse on the phone, compare by look (colour, pattern, hand-painted or plain), by how many places they need, and by price against department stores and marketplaces.

## Product Purpose

An online shop based in Cali that sells ceramic, porcelain and tempered-glass tableware (dinner sets, plates, mugs, tea and coffee pieces, bowls, a few vases) from brands available in Colombia (Corona, Corelle, Expressions, Espiral, Siaki, Qualitier), shipped nationwide. Success: a visitor finds a set that suits their table, understands what is included and what it costs, and pays without friction.

## Positioning

A chosen catalogue for everyday tables, presented as a tiled hall: cobalt on white like the products themselves. Not a department-store aisle.

## Operating Context

Phone-first; WhatsApp is the default channel for questions; prices in COP with dots; payment by card, PSE, Nequi or Bancolombia through a payment gateway (never named on the site), or bank transfer / assisted payment; national carriers.

## Capabilities and Constraints

- Catalogue = CMS collection `productos` (category, style, colour, material, brand, pieces, places, size, microwave/dishwasher safe, made in Colombia, hand painted, price, compare-at price, stock, gallery, description, care, variants).
- Checkout via CMS e-commerce API; server recalculates prices; online payment only when the gateway public key is configured.
- No invented reviews, ratings, customer counts or claims. "Hecho en Colombia" and "Pintado a mano" appear only on products flagged in the data.

## Brand Commitments

- Name: **TusPlatos**. Based in Cali, Colombia. Spanish (Colombia) copy.

## Evidence on Hand

- 47 real products with prices, packshots on white and lifestyle photography from the brands.
- No owned logo, reviews or press. Do not fabricate them.

## Product Principles

1. Look first: colour, pattern and finish decide; filters and swatches follow that.
2. Say what is in the box: pieces, places, size, material, care.
3. Everything editable in the CMS: no copy, price or image hardcoded in the storefront.
4. Phone first; the cart is one tap away.

## Accessibility & Inclusion

WCAG 2.2 AA contrast; keyboard and focus on every control; legible prices at 390px; reduced motion respected.
