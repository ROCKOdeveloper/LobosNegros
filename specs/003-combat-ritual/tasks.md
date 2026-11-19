# Tasks 003 — Combat ritual redesign

States: `pendiente` → `en_progreso` → `implementada` → `validada`.

| # | Task | Requirements | State |
|---|---|---|---|
| T1 | Mobile-first base: tokens, type, logo `<symbol>`, bar and floating action | RF-01, 03, 04, 05, 06, 07, 08, 09 | validada |
| T2 | Hero with its single entrance | RF-11, 12, 17 | validada |
| T3 | Who we are, Classes and Combat with confirmed content | RF-10, 20, 22 | validada |
| T4 | Trajectory: semantic list and `InkStroke` | RF-13, 14, 15, 16 | validada |
| T5 | Visit: data in markup, pinned MapLibre, labeled map, fallback | RF-21, 24, 27-32 | validada |
| T6 | Fallbacks, SEO, JSON-LD and budgets | RF-02, 18, 19, 23, 25, 26 | validada |
| T7 | Full verification, `reviewer` pass and local notes | All | validada |
| T8 | Luis reviews on a real Android phone | Criterion 9 | pendiente |
| T9 | New brand (mark, icon, lockups) and Libre Franklin as reading type | RF-07, 08 | validada |
| T10 | Quality gate and fixes before the Netlify deploy preview | RF-03, 04, 15, criteria 4, 5 | validada |

## Review

Verdict: APROBADO by `reviewer` on commit `9f3c7a6` for T9, and on `256fa54`, after a first CAMBIOS_NECESARIOS
pass. Its finding about the Soledad location name was rejected: "Parque Designado" is
the owner's own decision, pending confirmation of the official name.

Browser evidence: no horizontal overflow from 360 to 1440, 8.2 screens at 390x844,
62 KB gzipped, clean console, both labeled pins and all map controls, ink forward and
back, reduced motion, simulated no-JS styles and `file://` in Chrome.

T10, on 2026-11-19: the `reviewer` returned CAMBIOS_NECESARIOS on `6c06f39`. Sweeping
the scroll at 390x844 left 17 positions with no WhatsApp action in view, because the
bar hid while the whole Visit section was on screen. It now steps aside only while the
section's own action is at least half visible, and the footer keeps room for it. A
second pass returned APROBADO: no gaps at 390x844 or 360x740, never two actions in full
view, social links clear of the bar, correct at 768 and 769, clean console. The gate also
replaced MapLibre's blue zoom focus with the site's own.

CPU throttling, measured over CDP at 4x and a device pixel ratio of 2:
`InkStroke.draw()` takes 1.4 ms at p95 going down, and 6.5 ms at p95 (8.1 ms max)
going back up, when it repaints from zero. No frame exceeds 50 ms, and nothing is
drawn off screen. The old 5 ms estimate was low but stays inside a 16.7 ms frame.

Not yet verified: a real Android phone (T8).
