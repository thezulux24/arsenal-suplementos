# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) headless storefront, delegated by the user. All content, catalog, imagery, design tokens, payments and domain live in WebProAI / Latinovation CMS Studio (`https://webproai.tech`, project slug `arsenal`), read from the public delivery API `GET /api/v1/delivery/arsenal`. Deployed on the user's Coolify (VPS 179.236.72.201) at `https://shop.bzuluaga.site`.

## Users

Adults in Cali and the Valle del Cauca (roughly 22–50) who train (gym, running, cycling in the Farallones, football) and also care about everyday wellbeing: sleep, recovery, skin, digestion, defences. They buy on their phone, often after training or at night, and compare against pharmacy chains and Mercado Libre. Half the demand is sport (protein, creatine), half is wellness (magnesium, collagen, vitamins, omega).

## Product Purpose

An online supplement shop based in Cali that sells real, INVIMA-registered brands available in Colombia, shipped from Cali to the whole country, with checkout through Wompi and advice by WhatsApp. Success: a visitor finds the right product by goal, trusts the price and registration, and pays in under two minutes.

## Positioning

A curated "arsenal" rather than a pharmacy aisle: a short, chosen set of products organised by what the body needs (train, recover, sleep, defend, digest, skin), shipped from Cali, with human advice on WhatsApp. Not a marketplace with 4,000 SKUs.

## Operating Context

Phone-first purchases; WhatsApp is the default channel for questions in Colombia; prices in COP with dots as thousand separators; Wompi (card, PSE, Nequi) is the expected payment; national carriers (Servientrega, Coordinadora, Interrapidísimo, Envía). Products are dietary supplements: legally they "no son medicamentos y no suplen una alimentación equilibrada".

## Capabilities and Constraints

- Catalog = CMS collection `productos` (category options = filters). Stock, price, featured, images are editable by the client in `/portal`.
- Cart and checkout via CMS e-commerce API (`/api/ecommerce/public/arsenal/checkout`), Wompi sandbox for now; WhatsApp CTA.
- Order tracking via `/api/ecommerce/public/arsenal/track/:code`.
- No health claims beyond what the product registration allows; no invented reviews, ratings, customer counts or testimonials.

## Brand Commitments

- Name: **Arsenal Suplementos** (user wrote "Arsenal Sumplementos"; treated as a typo, flagged to the user).
- Based in Cali, Colombia. Spanish (Colombia) copy.

## Evidence on Hand

- 27+ real products with real COP retail prices, INVIMA registration numbers and packshots, sourced from Locatel Colombia's public catalog (November 2026). Packshots are manufacturer photography on white.
- No owned lifestyle photography, logo, reviews or press. Do not fabricate them.

## Product Principles

1. Goal first, brand second: people shop for sleep or strength, not for SKUs.
2. Price and registration in plain sight; trust is a fact, not an adjective.
3. Everything editable in the CMS: no copy, price or image hardcoded in the storefront.
4. Phone first; the cart is never more than one tap away.

## Accessibility & Inclusion

WCAG 2.2 AA contrast; legible prices and doses at 390px; reduced-motion respected.
