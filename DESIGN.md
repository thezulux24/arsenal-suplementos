---
name: Arsenal Suplementos
description: A Cali supplement shop built as an azulejo station hall; cobalt on milk white, grout seams, framed tile panels.
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

# Design System: Arsenal Suplementos

## Overview

**Creative North Star: "The Azulejo Station Hall"**

The shop is a tiled station hall. Every surface is a wall of glazed white tiles held in a cobalt-tinted grout grid; every goal is a framed tile panel; every product is painted onto its own tiles, with the seams running straight through it. Cobalt does all the drawing: headings, rules, frames, plaques, the one drenched band. Milk white is the plaster of the hall; pure tile-white is the glaze inside the grid.

Ornament is architectural, not decorative garnish. Double-rule cartouche frames with fleuron corners mark the important panels, thin padrão friezes run above and below the hero wall like a dado band, and the names on the wall are set in roman capitals. Density is that of a catalogue wall: tiles butt against each other with 1px seams and no gaps, so the grid itself is the layout. Motion is the kiln: a cobalt or wash glaze fills a tile from the bottom on hover or selection, 320ms ease-out, and nothing moves because the page scrolled.

The world refuses the pharmacy-chain banner, the icon-category row and the product carousel.

**Key Characteristics:**
- Cobalt line work on milk white and glazed tile-white; one ink family.
- 1px grout seams as the layout system; tiles, never floating cards.
- Mustard appears only as a rule inside a frame or as the frieze's centre dot.
- Roman capitals (Marcellus) for names, captions and plaques; Hanken Grotesk for reading, prices and data.
- Glaze-wash hover (bottom-up background fill), no scroll-linked motion.
- Colour tokens are supplied at runtime by the CMS design system.

## Colors

A single cobalt family on white plaster, with mustard held back as a framing accent.

**Runtime source.** The values below are the defaults declared on `:root`. At render time `themeStyle()` (src/lib/theme.ts) overwrites them from the CMS `globalData` design system of project `arsenal`: primaryColor to cobalt, secondaryColor to cobalt-2, surfaceColor to wash, backgroundColor to milk, accentColor to mustard, textColor to ink, mutedTextColor to muted. Grout and grout-soft are derived with `color-mix(in oklab, cobalt 16% / 9%, milk)`, so they follow the CMS colours automatically. Change the palette in the CMS, not in the stylesheet; tile-white and sale are not CMS-mapped.

### Primary
- **Azulejo Cobalt** (cobalt): all line work and display type: h1-h3, product names, frame rules, fleurons, plaque fills, filter strokes, the announcement bar, the drenched shipping band, selection highlight. Hover deepens it by mixing 18% black.

### Secondary
- **Glaze Blue** (cobalt-2): the lighter cobalt for the scrollbar thumb, CMS edit outlines and the glaze pulse halo. Never used for text.

### Tertiary
- **Kiln Mustard** (mustard): the inner rule of mustard frames, the brand tile, the sale flag and the step-number badges, the fleuron's corner dot, and the centre dot of the padrão frieze. It is a rule colour, never a fill or a text colour.

### Neutral
- **Milk Plaster** (milk): page background, drawer, mobile nav, footer, and the text colour on cobalt.
- **Glazed Tile** (tile-white): the face of every tile inside a grid, the inside of frames, field backgrounds. Packshots sit on it.
- **Cobalt Wash** (wash): the glaze that fills a tile on hover or selection; status and form-message backgrounds; the cart count chip.
- **Deep Ink** (ink): body text, prices, labels.
- **Faded Cobalt** (muted): ledes, meta lines (brand and presentation), agate lines, spec terms.
- **Grout** (grout): the 1px seams between tiles, header and drawer dividers, the hairline under the hero fact.
- **Soft Grout** (grout-soft): the faint tile grid printed on the page ground behind section bands.
- **Sale Oxide** (sale): error and failed-status text and border only; the compare-at price is struck in muted, not sale.

### Named Rules
**The Mustard In The Frame Rule.** Mustard is drawn only as an inset rule inside a cobalt frame (cartouche, brand tile, flags, step badges) or as the frieze and fleuron centre dot. It never fills a surface, never sets text, never stands alone on milk.

**The One Drench Rule.** Each page carries at most one cobalt-filled band (on home, the shipping steps). Everything else is cobalt line on white.

**The CMS Owns The Palette Rule.** Colour tokens come from the CMS design system at runtime; stylesheet values are fallbacks. Derived colours must be expressed as `color-mix` of the tokens so they follow a CMS change.

## Typography

**Display Font:** Marcellus (with Times New Roman, serif), digits overridden by a Hanken Grotesk figures subset
**Body Font:** Hanken Grotesk (with system-ui, sans-serif)

**Character:** Marcellus is the incised roman capital of a station sign; Hanken Grotesk is the timetable beside it, plain and tabular. The display stack loads a Hanken figures file restricted to U+0030-0039 ahead of Marcellus, because Marcellus draws 1 and 0 like I and O.

### Hierarchy
- **Display** (400, clamp(2rem, 1.1rem + 2.9vw, 3.9rem), 1.04, uppercase, 0.035em): the h1 in the hero cartouche; product pages use the same face at clamp(1.9rem, 1.2rem + 2vw, 3rem).
- **Headline** (400, clamp(1.65rem, 1.1rem + 1.8vw, 2.75rem), 1.08, uppercase, 0.05em): section h2s.
- **Title** (400, clamp(1.15rem, 1rem + 0.5vw, 1.45rem), 1.08): h3s, FAQ questions (1.2rem), fieldset titles (1.25rem).
- **Name** (400, 1.02-1.18rem, 1.15-1.22, uppercase, 0.05-0.06em): product and goal names on tiles, in cobalt.
- **Body** (Hanken 400, 16px, 1.55, tabular figures): all reading text. Ledes run clamp(1.02rem, 0.95rem + 0.3vw, 1.2rem) in muted, max 58ch; FAQ answers max 72ch.
- **Price** (Hanken 650, 1.15rem; big clamp(1.5rem, 1.2rem + 1vw, 2rem)): always Hanken, never the display face. Compare-at struck at 0.8em, 400, muted.
- **Label** (Marcellus 400, 13-15px, 0.1-0.14em, uppercase): plaques, flags, floating WhatsApp, toast actions.
- **Agate** (Hanken 400, 12.5px, 1.45, muted): unit price, INVIMA registration, IVA and legal lines at the foot of a tile.

### Named Rules
**The Roman Capital Rule.** Names on the wall (headings, product names, goal names, plaque labels) are Marcellus capitals with open tracking. Reading text, prices and data are Hanken.

**The Hanken Figures Rule.** Any digit set in the display face comes from the Hanken figures subset, never from Marcellus. Do not remove `--font-figures` from the front of `--font-display`.

**The Meta Line Rule.** Brand and presentation live in one muted meta line under the name ("Brand · 300 g"), not as a label above the heading. Nothing sits above a heading.

## Layout

The page is a centred wall: `min(100% - 2 gutter, 1440px - 2 gutter)` with a fluid gutter. The structural unit is the tile grid: a CSS grid with a 1px gap over a grout-coloured background and a 1px grout border, every child a tile-white cell. Seams are the gap; never use margins between tiles.

- **Hero wall:** 12 columns, height clamp(560px, 100svh - 140px, 820px), framed above and below by a thin frieze. Cartouche spans 6 columns by 6 rows, the featured product 4 by 6 (a 3x3-seamed panel), three single products stack in the last 2 columns. At 1100px it becomes 8 columns (cartouche full width, featured 5, side 3); at 680px, 3 columns with side tiles in a row.
- **Section bands:** vertical padding clamp(64px, 9vw, 128px); heading and lede share a two-column head (lede aligned right) that stacks at 820px. Band grounds may print the soft grout grid at the tile module clamp(64px, 7.2vw, 112px).
- **Catalogue:** 4 / 3 / 2 columns at >1100 / 761-1100 / <=760px. Goals: 4 columns with a 2x2 lead panel, 2 columns below 1100px.
- **Product page:** gallery and info at 1.05fr / 1fr, info sticky at 96px; stacks at 900px. Checkout: 1.2fr / 0.8fr, summary sticky, moves above the form at 900px.
- **Sticky header** 68px tall; `scroll-padding-top` 96px keeps anchors clear of it.

**The Complete Row Rule.** A tile grid never ends in a ragged row. Fill the remainder with blank glazed tiles (`blank-tile`, shown per breakpoint as b4 / b3 / b2; thumbnails pad to a multiple of 4) so the wall reads as finished tiling.

## Elevation & Depth

The hall is flat. Depth is drawn with inset rules, not cast shadows: frames and plaques stack `inset` box-shadows to draw their double rules, and selection is an inset 2px cobalt line. The only cast shadows belong to the two layers that float above the wall.

### Shadow Vocabulary
- **Frame double rule** (`border: 2px cobalt; box-shadow: inset 0 0 0 5px tile-white, inset 0 0 0 6px cobalt`): the cobalt cartouche.
- **Mustard frame** (`inset 0 0 0 5px tile-white, inset 0 0 0 7px mustard, inset 0 0 0 10px tile-white, inset 0 0 0 11px cobalt`): the hero cartouche, goals frame, WhatsApp advice panel, order status tiles.
- **Plaque glaze rule** (`inset 0 0 0 3px fill, inset 0 0 0 4px color-mix(fg 55%, transparent)`): the inner rule on every plaque.
- **Floating** (`0 8px 24px -10px rgba(19, 38, 92, 0.35)` and `0 10px 30px -12px rgba(19, 38, 92, 0.5)`): the floating WhatsApp tile and the toast only.

**The Inset Not Cast Rule.** On the wall, depth is a drawn rule inside the tile. Cast shadows are reserved for elements that physically float above the page.

## Shapes

Square tiles. Frames, tiles, cards, filters, steppers, flags and drawers have 0 radius; plaques and form fields take a barely softened 2px corner, like a glazed edge. Borders are 1px grout between tiles, 1px cobalt on controls, 2px cobalt on frames, the drawer edge and frieze bands. Fleurons (26px, quarter-disc and leaf with a mustard dot) sit mirrored in all four frame corners, 6px in (11px in mustard frames).

The padrão frieze is a 40px (thin: 22px) repeating SVG tile between 2px cobalt rules: quarter-discs at the corners, four leaves, a mustard centre dot, faint cobalt seam lines.

## Components

### Buttons (Plaques)
Glazed plaques: confident, solid, lettered like a sign.
- **Shape:** gently glazed corner (2px), min height 48px, padding 0 22px.
- **Primary:** cobalt fill, milk Marcellus capitals 15px at 0.12em, with an inner milk rule 3px in. Icons 18px.
- **Hover / Active:** fill deepens to cobalt + 18% black over 320ms and lifts 1px; press scales to 0.98. Disabled fill is cobalt 35% into milk.
- **Ghost:** tile-white fill, cobalt letters, cobalt double rule; hover glazes to wash.
- **Small:** 40px, padding 0 14px, 13px. **Icon plaque:** 40px square cobalt, used for add-to-cart on single side tiles.
- **Add pulse:** adding to cart runs a single 700ms glaze over the plaque's inner rule.

### Chips (Filters)
- **Style:** 40px, 1px cobalt stroke, tile-white face, cobalt Hanken 14px, count in 12px at 0.7 opacity.
- **State:** hover glazes a 12% cobalt band up from the bottom; pressed fills fully to cobalt with milk text. On phones the row scrolls horizontally with snap.

### Cards / Containers (Product tiles)
- **Corner Style:** square (0).
- **Background:** tile-white, a cell of the catalogue grid; hover fills with wash from the bottom (320ms).
- **Shadow Strategy:** none; see Elevation.
- **Border:** the grid seams; an agate foot separated by a 1px grout rule.
- **Internal Padding:** 4px 18px 16px (2px 12px 12px under 520px).
- **Anatomy:** 1:1 packshot tile, cobalt roman-capital name, muted meta line (brand and presentation), price and small plaque, agate foot with unit price and INVIMA number. Sale flag: tile-white tag with cobalt rule and mustard inner rule, 11.5px capitals.

### Inputs / Fields
- **Style:** 48px, 1px stroke of cobalt 45% into milk, tile-white, 2px corner, 16px text, cobalt caret.
- **Focus:** stroke turns cobalt with an inset 1px cobalt line and a soft outer ring.
- **Error:** sale border and text on sale 8% tint; success and info messages on wash with a cobalt rule.

### Navigation
- **Header:** sticky milk at 94% with blur, 1px grout bottom rule; brand tile (42px, cobalt rule, mustard inner rule, display monogram) plus spaced capitals name. Links are 14.5px Hanken ink; hover draws a 1px cobalt underline left to right. Below 900px the links collapse to a full-screen milk menu with 28px Marcellus links on grout rules.
- **Announcement bar:** cobalt strip, milk 13.5px text.

### Cartouche Frame (signature)
The `Frame` component: tile-white panel, cobalt double rule, four fleurons, optional mustard inner rule. Used for the hero name cartouche, the goals wall, the WhatsApp advice panel, and order status tiles. One mustard frame per view region.

### Goal Panels (signature)
Framed tile wall of goals; the first panel spans 2x2. Selecting a goal draws an inset 2px cobalt line, glazes it with wash and fades the neighbours to 0.55. The last panel is a cobalt WhatsApp tile.

### Packshot Tiles (signature)
Manufacturer packshots keep their own colour. They sit `object-fit: contain` with generous padding on a tile-white cell printed with a 3x3 cobalt seam grid (11-13% cobalt), multiplied onto it so the white of the photo takes the grout lines.

### Drawer and Floating Layers
Cart drawer slides 300ms from the right, milk, 2px cobalt left edge, lines on grout rules with a cobalt stepper. The floating WhatsApp tile appears after 80% of a viewport of scroll (a visibility toggle, not a reveal animation). The toast is a cobalt strip with a mustard inner rule.

## Do's and Don'ts

### Do:
- **Do** build every collection of things as a tile grid: 1px gap over grout, tile-white cells, 1px grout border.
- **Do** complete every grid row with blank glazed tiles at each breakpoint.
- **Do** keep packshots in full colour, contained and padded on seam-gridded tile-white, with `mix-blend-mode: multiply`.
- **Do** set names, headings and plaque labels in Marcellus capitals, and prices, body and data in Hanken Grotesk.
- **Do** keep `--font-figures` first in the display stack so every display digit comes from Hanken.
- **Do** put brand and presentation in the muted meta line under the product name.
- **Do** use the glaze wash (bottom-up background fill, 320ms ease-out) for hover and selection.
- **Do** change colours in the CMS design system; express derived colours as `color-mix` of the tokens.

### Don't:
- **Don't** place eyebrows, kickers or category labels above headings.
- **Don't** use mustard as a fill, a text colour, or anywhere outside a frame rule, flag/badge rule, fleuron dot or frieze.
- **Don't** desaturate, duotone or tint packshots cobalt.
- **Don't** leave a ragged last row in any tile grid.
- **Don't** add scroll-linked reveals, parallax or scroll-triggered entrance animation.
- **Don't** cast drop shadows on tiles, cards or frames; only the floating WhatsApp tile and toast cast shadows.
- **Don't** round tiles or frames; the 2px corner belongs to plaques and fields only.
- **Don't** use a pharmacy-chain hero banner, an icon-category row or a product carousel.
- **Don't** hardcode palette values in components; read the CSS tokens.
