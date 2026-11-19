# Plan 001 — Refinamiento visual e interacción

## Decisiones

- **Sin librerías.** El scroll suave, las entradas, el tilt y la escala del
  marquee se hacen con CSS + `requestAnimationFrame` e `IntersectionObserver`.
  GSAP no entra: el proyecto prohíbe dependencias y el efecto buscado no lo
  necesita.
- **Una sola fuente de movimiento.** Se conserva `[data-aos]` y
  `AnimationObserver`, pero el observer deja de desconectar elementos: al salir
  del viewport retira `.aos-animate` para que la entrada se repita al volver.
  Con movimiento reducido se revela todo de inmediato.
- **Transformaciones compuestas.** Se anima `opacity` y `transform`; se elimina
  el `filter: blur()` de las tarjetas al hover porque obliga a repintar. El
  `will-change` sigue entrando y saliendo con las clases de actividad.
- **Hero con animación de entrada CSS.** Las palabras usan una animación
  `both` con retardos; no se reejecuta al volver a la sección. El logotipo es la
  marca geométrica del favicon actual (dos barras rojas), no una imagen nueva.
- **Partículas con cupo.** La base baja a ~40% de la anterior. Las ráfagas
  llevan `ttl` y, si se supera el cupo, se retiran partículas ambientales.
  `IntersectionObserver` y `visibilitychange` siguen parando el rAF.
- **Bento asimétrico de 6 columnas.** Filas 4+2 y 2+4 en escritorio; dos
  columnas iguales en tablet y una en móvil. Sin bordes: sombra base suave,
  elevación al hover y tilt de ±3°/±4° con puntero fino.
- **Títulos con barra.** La barra es un `::after` con `scaleX` disparado por
  `.aos-animate`; el brillo se intensifica con `:hover`, `:active` y
  `:focus-within`. Un `--title-line-scale` evita duplicar reglas.
- **Testimonios.** Se quita el dimming con blur de los hermanos. El marquee
  calcula la posición de cada slide con métricas cacheadas y aplica una escala
  de 0.95–1; no hay lecturas de layout por frame.
- **Mapa con datos.** `CONFIG.mapLocations` pasa a ser la única fuente de los
  dos puntos. La tarjeta usa botones `aria-pressed`, un `aria-live` discreto y
  un popup compartido. `fitBounds` inicial muestra ambos; al elegir, `flyTo`.
  El fallback estático incluye las dos direcciones.
- **Tipografía.** Se añade `--fs-body` y se alinea todo el cuerpo a 15–16px;
  los títulos de sección usan el mismo `--fs-2xl` fluido. No se añaden fuentes.

## Archivos afectados

- `index.html`: hero, tarjeta de ubicación, fallback, JSON-LD de la segunda sede.
- `style.css`: tokens, títulos, hero, about, bento, beneficios, testimonios,
  mapa, responsive y movimiento reducido.
- `script.js`: navegación, observer con replay, partículas, tilt, marquee,
  mapa multi-sede.
- `specs/001-refinamiento-visual/`: esta planificación.
- `MEMORY.md`: checkpoint local al cerrar (no se publica).

## Riesgos y mitigaciones

- **Replay de entradas y saltos de layout:** sólo se animan opacity/transform;
  el espacio queda reservado. Se prueba subir/bajar y recargar.
- **Tilt contra `[data-aos]`:** el tilt escribe `style.transform` sólo mientras
  hay puntero; al salir se borra y vuelve el estado final del AOS.
- **Marquee y clones:** se miden los clones y se resetea la escala con
  movimiento reducido para no dejar tarjetas encogidas.
- **Mapa sin red:** el fallback debe seguir mostrando ambas direcciones; se
  prueba con red bloqueada y sin JS.
- **Navbar de seis enlaces:** no se toca el ancho ni el corte de 860px; el
  scroll suave respeta el offset de 80px.
