# Spec 003 — Combat ritual redesign

## Context

The site works well technically but reads as a template: generic sections,
copy that fits any business, and motion everywhere. The owner reviewed a
throwaway prototype (`Desktop/LobosNegros-logo/prototipo.html`) and approved its
direction with three changes:

1. The phone is the primary experience: about 90% of visitors arrive on mobile.
2. The story belongs to the group and its trajectory, not to one person. The
   teacher is part of that history.
3. The site remains three monoliths: `index.html`, `style.css`, `script.js`.

`main` keeps the current site. This work lives on `feat/combat-ritual`.

Runner gate: **NO** (no test runner, build or CI). Risk: T3 design. Everything is
reversible and verified in a real browser.

## Goal

A curious parent on a phone should feel the page is spectacular and understand
what the club is, why it is trustworthy and how to start. A developer who opens
the source should respect that it is three hand-written files.

## Page structure

The page follows the ritual of a combat. Korean voices are small supporting
labels; the Spanish text always carries the meaning.

| # | Voice | Section | Job |
|---|---|---|---|
| 1 | Charyeot (attention) | Hero | The wolf and the club name |
| 2 | Kyeongrye (bow) | Who we are | The group and its five tenets |
| 3 | — | Trajectory | The group's history, drawn in ink |
| 4 | Joonbi (ready) | Classes | Where each person starts, by age |
| 5 | Shijak (begin) | Combat | What the club is known for |
| 6 | Keuman (stop) | Visit | Schedule, locations, map and WhatsApp |

## Requirements (EARS)

### Mobile first

- **RF-01** — EL SISTEMA is designed and built for a 390 x 844 viewport first;
  wider layouts extend it through `min-width` media queries.
- **RF-02** — EL SISTEMA keeps its total height at 10 phone screens or fewer at
  390 x 844 with real content and the map included.
- **RF-03** — MIENTRAS the visitor is on a viewport of 768px or less, EL SISTEMA
  keeps a WhatsApp action reachable by thumb at the bottom of the screen,
  respecting the safe area, and moves it aside only while the Visit section's own
  WhatsApp action is visible.
- **RF-04** — EL SISTEMA gives every interactive target at least 44 x 44 CSS px.
- **RF-05** — EL SISTEMA stays legible and keeps its hierarchy with the font
  stacks of Android and iOS, not only those of Windows.
- **RF-06** — EL SISTEMA uses `svh` with a `vh` fallback, so mobile browser bars
  do not cut the hero.

### Identity

- **RF-07** — EL SISTEMA defines the wolf once as an inline `<symbol>` in
  `index.html`, and every use references it, so a rebranded logo replaces one
  block. Colors come from CSS through `currentColor`.
- **RF-08** — EL SISTEMA does not depend on logo details for layout: if the logo
  changes composition, only documented `viewBox` values may need adjusting.
- **RF-09** — EL SISTEMA uses its chosen open-license fonts, subset and embedded
  in `style.css`, so it makes no font requests to third parties and renders the
  same on Android, iOS and desktop. If a font fails, it falls back to system
  fonts without hiding text. It adds no new hues beyond the black, white and red
  palette and its existing red shades.
- **RF-10** — EL SISTEMA replaces the empty photo box and the empty member
  squares; it never shows "Próximamente" or blank placeholders.

### Hero

- **RF-11** — AL CARGAR the page, EL SISTEMA plays one entrance, once: the moon
  opens with a single cut and the name appears.
- **RF-12** — EL SISTEMA shows the words "taekwondo" and "Lobos Negros" in the
  first screen, with contrast of at least 4.5:1 over every background they cross.

### Trajectory

- **RF-13** — EL SISTEMA presents the group's history as a semantic ordered list
  of milestones in `index.html`, readable without JS.
- **RF-14** — MIENTRAS the visitor scrolls through Trajectory, EL SISTEMA draws an
  ink stroke along the list, tied to scroll progress in both directions. On
  phones the stroke runs vertically beside the text.
- **RF-15** — EL SISTEMA paints only the missing ink when scrolling down and does
  no ink work while Trajectory is off screen.
- **RF-16** — SI there are no confirmed milestones for an item, ENTONCES EL
  SISTEMA omits it; invented dates, titles or results are never published.

### Motion

- **RF-17** — EL SISTEMA limits decorative motion to the hero entrance and the
  ink stroke. Titles, text, cards and photos do not animate on scroll. Motion
  that answers a person's action is allowed.
- **RF-18** — SI the user prefers reduced motion, ENTONCES EL SISTEMA shows the
  hero and the complete ink stroke without animation.
- **RF-19** — SI JS is unavailable, ENTONCES EL SISTEMA shows all content, the
  addresses and the contact links; the map falls back to text.

### Content and data

- **RF-20** — EL SISTEMA shows only confirmed content. Unconfirmed testimonials
  and member names leave the page until the club confirms them.
- **RF-21** — EL SISTEMA keeps location data in one place in the markup; the map
  script reads it from there instead of duplicating it.
- **RF-22** — EL SISTEMA uses one voice: Colombian Spanish with "tú".

### Technical limits

- **RF-23** — EL SISTEMA consists of `index.html`, `style.css` and `script.js`,
  with no build step, framework or dependency, and works over `file://`. Real
  photographs are the only exception: they live in a separate `img/` folder.
- **RF-24** — EL SISTEMA keeps MapLibre as the only external runtime, lazy-loaded,
  at a pinned version.
- **RF-25** — EL SISTEMA keeps the three files at 90 KB or less gzipped combined,
  fonts and logo included, excluding the map and photographs.
- **RF-26** — EL SISTEMA keeps valid SEO data: title, description, canonical URL
  and JSON-LD consistent with the visible content.

### Interactive map

- **RF-27** — EL SISTEMA closes the page with an interactive flat top-down map,
  with no pitch, rotation or 3D layers, branded in the club's palette, showing both
  locations at once when it first appears.
- **RF-28** — EL SISTEMA labels each pin with its location name, visible without
  tapping it.
- **RF-29** — CUANDO the visitor picks a location from its button or its pin, EL
  SISTEMA moves the map to it and highlights its always-visible name, address and
  directions link.
- **RF-30** — CUANDO the visitor asks to see both locations, EL SISTEMA returns to
  the framing that shows Barranquilla and Soledad together.
- **RF-31** — MIENTRAS the visitor scrolls past the map on a phone, EL SISTEMA does
  not capture the one-finger scroll.
- **RF-32** — SI the map cannot load, ENTONCES EL SISTEMA says so and keeps both
  addresses visible with their directions links.

## Acceptance criteria

1. At 390 x 844 the page is 10 screens or fewer, with no horizontal overflow.
2. No horizontal overflow at 360, 390, 430, 768, 1024 and 1440.
3. The first screen names the sport and the club at every width listed above.
4. WhatsApp is reachable from any scroll position on a phone.
5. Ink advances and retreats with scroll; off screen it does no work.
6. Reduced motion shows everything static; there are no running animations.
7. With JS disabled all content and contact links remain usable.
8. The console stays clean in every scenario.
9. Luis reviews the site on a real Android phone and approves the type, the first
   screen and the scroll feel.
10. Replacing the `<symbol>` content updates every use of the logo.
11. Nothing unconfirmed is published; open items below are resolved or omitted.
12. At 390 x 844 the map shows both labeled pins on arrival, and a visitor can go
    to either location and back to both.
13. The embedded fonts render with no third-party font requests.

## Open items owned by the club

- Approval of the proposed logo. The previous SVG came from a low-resolution image.
- History of the group: origin, founders, years and milestones.
- Combat results and what distinguishes the club's fighting.
- Real photographs, with guardian consent for minors.
- Official name of the second location.
- Whether both locations share the schedule.
- Validation of the Korean voices by the teacher.

## Out of scope

- The distinct wide-screen experience. It starts after the owner approves the
  phone experience; until then wide screens get a working provisional layout.
- Publishing, merging into `main` or changing the Netlify deployment.
- Writing the club's history; the club provides the facts.
