---
name: TusPlatos
description: A Cali tableware shop built as an azulejo station hall; cobalt on milk white, grout seams, framed tile panels, the plates painted onto the wall.
colors:
  cobalt: "#1b3a8f"
  cobalt-2: "#3b63c4"
  wash: "#dce5f6"
  milk: "#f7f6f1"
  tile-white: "#ffffff"
  mustard: "#d9a21b"
  ink: "#13265c"
  muted: "#4a5b8a"
  grout: "#d4d8e1"
  grout-soft: "#e3e5e8"
  sale: "#a3261b"
typography:
  display:
    fontFamily: "Hanken figures (digits only), Marcellus, Times New Roman, serif"
    fontSize: "clamp(2rem, 1.1rem + 2.9vw, 3.9rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "0.035em"
  headline:
    fontFamily: "Hanken figures (digits only), Marcellus, Times New Roman, serif"
    fontSize: "clamp(1.65rem, 1.1rem + 1.8vw, 2.75rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "0.05em"
  title:
    fontFamily: "Hanken figures (digits only), Marcellus, Times New Roman, serif"
    fontSize: "clamp(1.15rem, 1rem + 0.5vw, 1.45rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "0.01em"
  name:
    fontFamily: "Hanken figures (digits only), Marcellus, Times New Roman, serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: "0.05em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "tnum"
  lede:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.02rem, 0.95rem + 0.3vw, 1.2rem)"
    fontWeight: 400
    lineHeight: 1.55
  price:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 650
    letterSpacing: "-0.005em"
    fontFeature: "tnum"
  label:
    fontFamily: "Hanken figures (digits only), Marcellus, Times New Roman, serif"
    fontSize: "15px"
    fontWeight: 400
    letterSpacing: "0.12em"
  agate:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.01em"
rounded:
  none: "0px"
  plaque: "2px"
spacing:
  seam: "1px"
  gutter: "clamp(16px, 2.4vw, 32px)"
  tile: "clamp(64px, 7.2vw, 112px)"
  band: "clamp(64px, 9vw, 128px)"
  max: "1440px"
components:
  plaque:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.milk}"
    typography: "{typography.label}"
    rounded: "{rounded.plaque}"
    padding: "0 22px"
    height: "48px"
  plaque-small:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.milk}"
    rounded: "{rounded.plaque}"
    padding: "0 14px"
    height: "40px"
  plaque-ghost:
    backgroundColor: "{colors.tile-white}"
    textColor: "{colors.cobalt}"
    typography: "{typography.label}"
    rounded: "{rounded.plaque}"
    padding: "0 22px"
    height: "48px"
  plaque-ghost-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.cobalt}"
  icon-plaque:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.milk}"
    rounded: "{rounded.none}"
    size: "40px"
  filter:
    backgroundColor: "{colors.tile-white}"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "40px"
  filter-pressed:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.milk}"
  field:
    backgroundColor: "{colors.tile-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.plaque}"
    padding: "12px 14px"
    height: "48px"
  card:
    backgroundColor: "{colors.tile-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 18px 16px"
  card-hover:
    backgroundColor: "{colors.wash}"
  frame:
    backgroundColor: "{colors.tile-white}"
    rounded: "{rounded.none}"
  drench:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.milk}"
  announce:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.milk}"
    padding: "7px 16px"
---

# Design System: TusPlatos

## Overview

**Creative North Star: "The Azulejo Station Hall"**

The shop is a tiled station hall, and the merchandise is the same material: cobalt-on-white glazed ceramics. Every surface is a wall of glazed white tiles held in a cobalt-tinted grout grid; every important panel is a framed tile cartouche; every plate, mug and bowl is painted onto its own tile, with the seams running straight through it. Cobalt does all the drawing: headings, rules, frames, plaques, the one drenched band. Milk white is the plaster of the hall; tile-white is the glaze inside the grid.

Ornament is architectural, not garnish. Double-rule cartouche frames with fleuron corners mark the important panels, thin padrão friezes run above and below the hero wall like a dado band, and names on the wall are roman capitals. Density is that of a catalogue wall: tiles butt against each other with 1px seams and no gaps. Motion is the kiln: a wash glaze fills a tile from the bottom on hover or selection (about 320ms ease-out), presses scale to 0.97, and nothing moves because the page scrolled.

The world refuses the department-store banner, the icon-category row and the product carousel.

**Key Characteristics:**
- Cobalt line work on milk white and glazed tile-white; one ink family.
- 1px grout seams as the layout system; tiles, never floating cards.
- Mustard only as a rule inside a frame, the brand tile, flags and badges, the fleuron dot and the frieze centre.
- Roman capitals (Marcellus) for names, captions and plaques; Hanken Grotesk for reading, prices and data.
- Glaze-wash hover (bottom-up fill), no scroll-linked motion.
- Every token comes from the CMS design system at runtime (`--cms-*`).

## Colors

A single cobalt family on white plaster, with mustard held back as a framing accent. The products themselves (Antonella, Azura, Congo, Cobalt Circles) carry the palette into the photography.

**Runtime source.** `<CmsProvider>` emits the CMS design system v2 (`globalData.designSystem`) as `--cms-*` variables; `src/app/globals.css` maps them onto the world's tokens. Change the palette in `/portal`, not in the stylesheet.

| Token | CMS variable | Default |
|---|---|---|
| cobalt | `--cms-primary` | #1B3A8F |
| on-cobalt | `--cms-primary-text` | #F7F6F1 |
| cobalt-2 | `--cms-secondary` | #3B63C4 |
| wash | `--cms-surface-alt` | #DCE5F6 |
| milk | `--cms-bg` | #F7F6F1 |
| tile-white | `--cms-surface` | #FFFFFF |
| mustard | `--cms-accent` | #D9A21B |
| ink | `--cms-text` | #13265C |
| muted | `--cms-muted` | #4A5B8A |
| grout | `--cms-border` | #D4D8E1 (grout-soft is a `color-mix` of grout into milk) |
| sale | `--cms-danger` | #A3261B |
| ok | `--cms-success` | #1E7A4C |

### Named Rules
**The Mustard In The Frame Rule.** Mustard is drawn only as an inset rule inside a cobalt frame (cartouche, brand tile, flags, step and feature badges, the hero plate), the fleuron dot, the slider thumb rule and the frieze centre. It never fills a surface and never sets text.

**The One Drench Rule.** Each page carries at most one cobalt-filled band. On home it is `beneficios` (`features.grid` with `tone: primary`), framed by two friezes.

**The CMS Owns The Palette Rule.** Stylesheet values are fallbacks; derived colours are `color-mix` of tokens so they follow a CMS change.

## Typography

**Display:** Marcellus, self-hosted (`/fonts/marcellus.woff2`, declared in the design system as a custom font). Digits come from a Hanken Grotesk figures subset (`--font-figures`, U+0030–0039) because Marcellus draws 1 and 0 like I and O.
**Body:** Hanken Grotesk variable (`/fonts/hanken-grotesk.woff2`).

The stacks read `--cms-font-heading` and `--cms-font-body`, so choosing another font in the portal swaps them (the SDK links Google fonts). Heading case and tracking come from `--cms-heading-case` and `--cms-heading-tracking` (default uppercase, 0.035em; h2 tracks ×1.4).

### Hierarchy
- **Display** h1 clamp(2rem, 1.1rem + 2.9vw, 3.9rem), line-height 1.04. Product page h1 clamp(1.9rem, 1.2rem + 2vw, 3rem).
- **Headline** h2 clamp(1.65rem, 1.1rem + 1.8vw, 2.75rem).
- **Title** h3 clamp(1.15rem, 1rem + 0.5vw, 1.45rem); FAQ questions 1.15rem.
- **Name** product and category names on tiles: Marcellus capitals about 1rem, 0.05em, cobalt.
- **Body** Hanken 16px/1.55, tabular figures. Ledes clamp(1.02rem, 0.95rem + 0.3vw, 1.2rem) in muted, 58ch.
- **Price** Hanken 650, 1.12rem (big clamp(1.5rem, 1.2rem + 1vw, 2rem)); compare-at struck at 0.8em, muted.
- **Label** Marcellus 11–15px, 0.1–0.14em capitals: plaques, flags, filter group titles.
- **Agate** Hanken 12.5px, muted: the data foot of a tile (colour swatch · style · material · size; pieces · places).

### Named Rules
**The Roman Capital Rule.** Names on the wall are Marcellus capitals; reading text, prices and data are Hanken.
**The Hanken Figures Rule.** Keep `--font-figures` first in the display stack.
**The Meta Line Rule.** Brand and category live in one muted line under the name ("Corona · Vajillas"). Nothing sits above a heading.

## Layout

A centred wall: `min(100% - 2 gutter, --cms-max-width)`, gutter clamp(16px, 2.4vw, `--cms-gutter`). Bands pad 0.62 × clamp(`--cms-section-y-mobile`, 9vw, `--cms-section-y`).

- **Hero wall:** 12 columns between two thin friezes: a mustard cartouche (5 columns) and a lifestyle photo (7 columns) with tile seams drawn over it and the "En la foto" product plate. `imageSide` flips it; `hero.centered` and `hero.fullImage` stack or overlay. One column below 1100px.
- **Category panel:** a mustard cartouche holding a 3 × 3 tile panel; the first category spans 2 × 2 with a lifestyle photo, five singles carry packshots. Two columns at 760px and below; blank tiles complete the rows.
- **Catalogue:** 4 / 3 / 2 columns at >1100 / 761–1100 / ≤760px. The shop is a 264px sticky filter rail plus a 3-column wall; below 1100px the rail becomes a left drawer.
- **Story:** photo tile and cartouche at 1.15fr / 1fr, sides alternate; stacks at 900px.
- **Product page:** sticky gallery and info at 1.05fr / 1fr; stacks at 900px with a sticky buy bar. Checkout 1.2fr / 0.8fr, summary sticky, moves above the form at 900px.
- Sticky header 68px; `scroll-padding-top` 96px.

**The Complete Row Rule.** A tile grid never ends ragged: `BlankTiles` adds glazed blanks per breakpoint (`b-l`, `b-m`, `b-s`).

## Elevation & Depth

The hall is flat. Depth is drawn with inset rules: frames and plaques stack inset box-shadows to draw double rules; selection is an inset 2px cobalt line. Cast shadows belong only to layers that float above the wall: the floating WhatsApp tile, the toast, search suggestions and the quick view.

- **Frame double rule:** `border 2px cobalt; inset 0 0 0 5px tile-white, inset 0 0 0 6px cobalt`.
- **Mustard frame:** `inset 5px tile-white, 7px mustard, 10px tile-white, 11px cobalt`.
- **Plaque glaze rule:** `inset 3px fill, inset 4px on-colour at 55%`.

## Shapes

Square tiles, frames, cards, drawers, filters and chips (0 radius). Plaques use `--cms-btn-radius` (default 2px from the design-system button shape), fields `--cms-radius-sm`. Colour swatches are the only circles. Fleurons sit mirrored in all four frame corners. The padrão frieze is a 40px (thin: 22px) SVG tile between 2px cobalt rules.

## Components

- **Plaques (buttons):** cobalt fill, milk Marcellus capitals, inner rule; hover deepens with 18% black; press scales to 0.97; disabled is 35% cobalt into milk. Ghost: tile-white with a cobalt double rule, hover glazes to wash. Small 40px; icon plaque 40px square.
- **Product tile:** 1:1 packshot (contained and multiplied onto a 3 × 3 seam grid) or lifestyle photo; flags top-left (Oferta, Pintado a mano, Hecho en Colombia, Agotado, only from data); heart top-right; "Vista rápida" bar on hover; name, meta line, price and Agregar plaque; agate foot. Hover glazes the tile with wash from the bottom. List view: photo | body with summary | facts.
- **Filters:** a rail of `details` groups with capital titles; square checkboxes, round colour swatches, toggles for booleans (the knob slides, the box fills cobalt), a dual-thumb price range with mustard-ruled square thumbs, counts in agate. Active filters as wash chips with ×; "Limpiar todo".
- **Toolbar:** search field, results count, sort select, grid/list segmented control, Filtros plaque on mobile.
- **Category panel, story, drench features, steps** (roman numerals only where order matters), **FAQ tiles, newsletter and CTA cartouches.**
- **Cart drawer:** from the right, milk, 2px cobalt edge, free-shipping meter (cobalt fill in a ruled track), lines on grout rules with a cobalt stepper, order note, Ir a pagar. The filters drawer comes from the left.
- **Quick view:** framed modal (bottom sheet on phones) with the packshot and the essentials.
- **Checkout:** two cartouches; payment methods as a tile list of radio rows (selected: wash plus inset cobalt).
- **Status tile:** mustard cartouche for order confirmation, tracking and the 404.
- **Header:** sticky milk at 94% with blur; brand tile and spaced capitals; nav links with a left-to-right cobalt underline; search with instant suggestions; WhatsApp ghost plaque; favourites; cart plaque with count. Below 1100px the links collapse into a full-screen menu.

### Editor (portal) affordances
In builder mode the SDK adds toolbars and outlines; the world adds `text-transform: none` on editable nodes so the runtime (which reads `innerText`) saves the real case, and hides the quick-view bar.

## Do's and Don'ts

### Do:
- Build every collection as a tile grid: 1px gap over grout, tile-white cells.
- Complete every row with blank glazed tiles.
- Keep packshots in full colour, contained and multiplied onto seam-gridded tile-white; let lifestyle photos fill their tile with seams drawn over them.
- Show "Hecho en Colombia" and "Pintado a mano" only from the product flags.
- Read every colour, font, radius and duration from the CMS tokens.

### Don't:
- Don't place eyebrows or kickers above headings.
- Don't use mustard as a fill or a text colour.
- Don't round tiles or frames.
- Don't add scroll-linked reveals, parallax or entrance animations.
- Don't cast shadows on tiles; only floating layers cast.
- Don't name the payment gateway on the site; say "tarjeta débito o crédito, PSE, Nequi o Bancolombia".
- Don't invent reviews, ratings or customer counts.
