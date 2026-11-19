# Plan 002 — Motor de partículas y entrada del hero

## Estado actual

- `HeroParticles` crea 18/28/42 partículas ambientales en posiciones
  aleatorias y las envuelve al salir por arriba; no nacen del borde inferior.
- El clic emite una ráfaga que aparece a opacidad plena y sólo se desvanece al
  final. El ratón únicamente repele.
- El cupo (36/48/64) elimina la primera ambiental del array, que puede estar
  visible: se ve un corte.
- El texto ya tiene escalonado CSS, pero la marca entra con giro y las palabras
  con 80 ms de diferencia: la secuencia se lee casi como un bloque.

## Diseño

### Modelo de partícula

Un solo array con tres tipos: `ambient`, `trail`, `burst`. Cada partícula
guarda posición, velocidad, tamaño, profundidad (0 lejos–1 cerca), opacidad
base, edad, vida y tiempos de fundido. La opacidad efectiva se calcula como
`base × fundidoEntrada × fundidoSalida × profundidad`, de modo que toda
partícula nace y muere en alpha 0.

- **Ambiental**: nace en `y = alto + margen`, sube 0,22–0,72 px/frame con
  vaivén lateral; vida 12–22 s; fundido de entrada 10 % y de salida 24 %. Al
  agotarse se recicla en el borde inferior, sin salir del array. El campo
  inicial se siembra a lo largo de la trayectoria de cada partícula (no en una
  altura arbitraria), para que ya esté poblado y conserve sus fundidos.
  Objetivo: 44 en móvil (con tamaño ×1,15), 52 en tablet y 72 en escritorio.
  Tamaño 3–8,5 px CSS y opacidad base 0,55–1; el factor de profundidad
  (0,75–1) deja un suelo efectivo de 0,41.
- **Estela**: 1–2 por emisión, 3,2–6,2 px, opacidad 0,7–1, vida 0,9–1,5 s;
  nace en el puntero con la inercia del movimiento y sube lentamente.
- **Ráfaga**: radial, sesgo ascendente, vida 0,8–1,6 s, fricción 0,94.
  26 partículas con ratón y 18 con tacto, 5–12 px y opacidad 0,9–1; la
  velocidad baja (0,5–2,3 px/frame) mantiene el grupo compacto para que el
  clic se lea como un golpe de rojo.

### Cupo y reciclaje

`maxParticles` = 200 con ancho ≥ 1024, 140 entre 600 y 1023, 90 por debajo de
600. Al emitir:

1. Si hay hueco, se añade.
2. Si no, se busca la partícula con menor alpha efectivo.
3. Sólo se reutiliza si ese alpha es < 0,22; si no, se omite la emisión.

Las partículas de estela/ráfaga se retiran con intercambio con la última
(`O(1)`); las ambientales se reinician en su sitio para no generar basura.

### Interacción

- `pointermove` con `pointerType !== "touch"`, `(hover: hover) and
  (pointer: fine)` y sin movimiento reducido: techo duro de una emisión cada
  32 ms; dentro de él, emite si el puntero avanzó ≥ 16 px o pasaron ≥ 70 ms;
  máximo 2 por evento.
- `pointerdown` (botón principal): ráfaga de 26 (ratón/lápiz) u 18 (tacto).
  En táctil no hay estela durante el scroll.
- Repulsión radial de radio 220 px y fuerza 5, con decaimiento 0,88: el
  desplazamiento máximo ronda los 40 px y la partícula vuelve a su trayectoria
  sin tocar `baseX`. Es lo que abre el hueco visible y convierte la ráfaga en
  un anillo.
- Todos los listeners son pasivos y se retiran del juego cuando el hero no
  está visible.

### Pausa

`IntersectionObserver` con `threshold: 0` sobre `.hero` arranca/detiene el
rAF. `visibilitychange` detiene al ocultar la pestaña. `resize` (con throttle)
redimensiona el buffer y redistribuye el campo. Con movimiento reducido se
dibuja un fotograma estático y no se instala el bucle; un `change` del
`matchMedia` alterna entre ambos modos.

### Rendimiento

- `ctx.fillStyle` se fija una vez (`#DB1A1A`); la variación va por
  `globalAlpha`. Cero plantillas de color por frame.
- Canvas con `desynchronized: true`, DPR acotado a 2.
- Sin `filter`, sin sombras por partícula y sin `will-change` permanente.
- El cupo y el recorte de `delta` a 50 ms limitan el coste tras un tirón.

### Entrada del texto

- Marca y palabras comparten dirección (desde abajo) y opacidad 0→1.
- Retardos 0 / 110 / 220 / 330 ms, duración 800 ms, `both`.
- La marca conserva una escala mínima (0,94→1) sin rotación para no romper la
  lectura de una sola línea.
- `prefers-reduced-motion` ya fuerza duración 0,01 ms; se mantiene.

## Revisión de presencia visual (2026-10-25)

El primer cierre era correcto en mecánica pero demasiado tímido a la vista: en
móvil las partículas se leían como puntos casi invisibles y el rojo no
dominaba la escena. Se subió la presencia sin añadir mecanismos nuevos:

| Parámetro | Antes | Después |
|---|---|---|
| Ambientales (móvil/tablet/escritorio) | 24/38/56 | 44/52/72 |
| Tamaño ambiental | 1,2–4,6 px | 3–8,5 px (×1,15 en móvil) |
| Opacidad efectiva ambiental | 0,13–0,60 | 0,41–1,00 |
| Estela | 2–3 × 1–2,6 px | 1–2 × 3,2–6,2 px |
| Ráfaga | 12/8 × 1,2–4,2 px | 26/18 × 5–12 px |
| Repulsión | radio 104, fuerza 0,45 | radio 220, fuerza 5,0 |

El cupo no cambia: 200/140/90. El campo móvil gana tamaño y número, pero el
techo de 90 sigue dejando sitio a la ráfaga. La ráfaga baja su velocidad para
que el grupo no se deshaga antes de que el ojo lo registre; la repulsión es la
que lo abre en anillo. El coste extra son más `fillRect` por frame, no más
estado ni allocaciones.

## Riesgos

- Más partículas = más `fillRect`; el cupo por viewport y la medición de fps
  deciden si hay que bajar el objetivo ambiental.
- El reciclaje por menor alpha puede omitir clics en ráfagas muy densas; es
  preferible a un salto visible.
- En iOS, `pointermove` táctil puede dispararse durante el scroll; se filtra
  por `pointerType`.
