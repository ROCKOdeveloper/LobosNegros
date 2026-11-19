# Tareas 002 — Pulido del hero

Estados: `pendiente` → `en_progreso` → `implementada` → `validada`.

| ID | Objetivo | Archivos | Estado |
|---|---|---|---|
| T-01 | Spec y plan del motor | `specs/002-*` | `implementada` |
| T-02 | Ciclo de vida, profundidad y cupo con reciclaje suave | `script.js` | `implementada` |
| T-03 | Estela con puntero fino y ráfaga con sesgo ascendente | `script.js` | `implementada` |
| T-04 | Pausa por visibilidad, pestaña y movimiento reducido | `script.js` | `implementada` |
| T-05 | Entrada escalonada uniforme de la firma | `style.css` | `implementada` |
| T-06 | Pruebas de responsive, fps, cupo, reduced-motion y no-JS | todos | `implementada` |
| T-07 | Revisión cruzada y cierre | `MEMORY.md` | `validada` |
| T-08 | Presencia visual: tamaño, rojo, ráfaga y repulsión | `script.js` | `validada` |

## Evidencia (Chrome headless, servidor local, 2026-10-25)

### Sintaxis y consola

- `node --check script.js` sin errores.
- Sin mensajes de error ni advertencia en consola tras las recargas.

### Entrada de la firma

Medición con `document.getAnimations()` congelado en el tiempo:

| t | marca | Club | Lobos | Negros |
|---|---|---|---|---|
| 0 ms | 0 / +30,9 px | 0 / +30,9 px | 0 / +30,9 px | 0 / +30,9 px |
| 120 ms | 0,65 / +10,9 px | 0,08 / +28,6 px | 0 | 0 |
| 350 ms | 0,95 | 0,88 | 0,68 | 0,15 |
| 900 ms | 1 | ≈1 | ≈1 | 0,91 |

- Retardos 0 / 110 / 220 / 330 ms y duración 800 ms; la marca conserva una
  escala mínima (0,94→1) y ya no rota.

### Partículas

- 1440×900: 56 ambientales, 56 dibujos por frame en reposo.
- 500 pulsaciones seguidas: máximo 197 dibujos en un frame (cupo 200; tres
  ambientales estaban en alpha 0). A los 1,6 s el campo vuelve a ~55.
- 120 `pointermove` síncronos: sólo 1–2 emisiones por el techo de 32 ms.
  40 movimientos reales en 1,6 s: máximo 83 partículas dibujadas.
- 390×844 con DPR 3: canvas 780×1688 (DPR acotado a 2), 24 ambientales.
  `touchmove` no emite (máx. 24); un toque emite 8 (máx. 32); 500 toques
  seguidos se quedan en 90 (cupo móvil).
- Sin overflow horizontal a 390, 768, 1024 y 1440.

### Rendimiento y pausa

- 1440×900 con CPU 4× más lenta durante 3 s de interacción sostenida:
  546 frames / 3,03 s = **179,9 fps**, 142,5 partículas dibujadas por frame
  de media, máximo 167. El refresco del entorno era de 180 Hz.
- Hero fuera del viewport: 0 frames en 800 ms. Al volver: 143 frames en 800 ms.
- Reduced motion: 0 frames de rAF; un `resize` redibuja un fotograma estático
  con 56 partículas; texto con `animation: none` y opacidad 1.

### Capturas

- `hero-390-v2.png`, `hero-768.png`, `hero-1024.png`, `hero-1440-v2.png`.
- Entrada congelada a 120 ms: `hero-time-120.png`.
- Ráfaga congelada a 150 ms: `hero-1440-burst-offset.png`.

Ruta local: `C:\Users\BMO\AppData\Local\Temp\opencode\`.

### Presencia visual (revisión del 2026-10-25)

- 1440×900: 72 ambientales; en reposo ~63 `fillRect` por frame. El campo se
  ve rojo y de tamaños variados, sin quitar protagonismo a la firma.
- 500 clics + 500 `pointermove` sincrónicos: máximo **200** dibujos en un
  frame (cupo 200). Nunca se supera.
- 390×844 con DPR 3 y viewport real emulado: 44 ambientales, tamaño ×1,15.
  500 toques seguidos: máximo **89** dibujos (cupo 90). Un toque deja un
  grupo compacto y brillante que se abre en anillo por la repulsión.
- 768×1024 DPR 2: 52 ambientales, sin overflow horizontal.
- Repulsión: radio 220 px y fuerza 5; el puntero abre un hueco visible en el
  campo y la ráfaga de un clic se lee como un golpe de rojo.
- CPU 4× más lenta a 1440: 75,6 fps de media (p95 21,2 ms) durante 240
  frames; sin throttling el mismo entorno mide 76,9–82,2 fps, así que el
  coste del campo no explica la diferencia.
- Hero fuera del viewport: **0** dibujos en 1,2 s; al volver, 2.922 en 600 ms.
- Reduced motion: 0 dibujos en 1,5 s tras el fotograma estático; el canvas
  conserva 3.388 píxeles pintados y el texto queda visible.
- Consola limpia, `node --check` correcto, sin overflow a 390/768/1440.

### Capturas de la revisión

- `hero-1440-final.png`, `hero-390-v9.png`, `hero-768-v9.png`.
- Repulsión: `hero-1440-hover-v4.png`; ráfaga: `hero-1440-burst-v6.png` y
  `hero-390-tap-v9.png`.

## Revisión cruzada

- Revisor: `opencode/mimo-v2.6-flash-free` (familia MiMo, distinta de la
  implementación DeepSeek).
- Veredicto: **APROBADO**, sin bloqueantes.
- El revisor confirmó el alcance de los hunks, el cupo, el swap-pop, la pausa,
  la estela sin tacto, la ausencia de referencias muertas y la entrada
  escalonada. No pudo ejecutar `node --check` por permisos del entorno; lo
  suplió con lectura estructural y ejecución real en Chrome.
- Riesgos menores atendidos: las bandas del cupo quedan definidas por ancho
  (≥1024 / 600–1023 / <600) en spec y plan; las cifras del plan se alinearon
  con el código; `pointerdown` ya no exime la siguiente estela del techo de
  32 ms. El throttle de resize es preexistente y compartido; no se tocó.

### Revisión del ajuste de presencia (T-08)

- Revisor: `opencode/beam-free#high` (familia Beam, distinta de DeepSeek).
- Veredicto: **APROBADO**, sin bloqueantes.
- Verificado: cupo 200/140/90 (no se supera en `addParticle`, `burst`,
  `emitTrail` ni `resize`); `sizeScale` inicializado antes de `measureLimits`
  y usado en `createAmbient`/`resetAmbient`; suelo de alpha 0,4125; repulsión
  sólo sobre `ox/oy` con equilibrio ~42 px y sin tocar `baseX`; ráfaga
  26/18 y estela 3–4 con el táctil excluido; `applyMotionPreference` sigue
  dibujando el fotograma estático; RF-11/12/13 y la tabla Antes/Después
  coinciden con el código.
- Observación menor: el revisor no pudo ejecutar `node --check` por permisos
  de shell; el worker sí lo ejecutó con resultado correcto.

## Pendiente

- Nada de la sección hero. Los cambios de `index.html` presentes en el árbol
  (nombres de la ubicación) son trabajo del usuario y quedan fuera de este
  commit.
