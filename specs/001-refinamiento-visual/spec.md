# Spec 001 — Refinamiento visual e interacción

## Contexto

Sitio estático de una página (`index.html`, `style.css`, `script.js`) para el Club
Lobos Negros. No hay `package.json`, runner, build ni CI, así que la puerta de
runner da **NO**. El perfil de proceso es `liviano`; esta spec existe porque el
propietario la pidió explícitamente para ordenar una tanda larga de ajustes.

Riesgo: **T3 de diseño** (cambios visuales amplios, sin datos, auth ni
migraciones). Todo cambio es reversible y se verifica en navegador real.

## Objetivo

Elevar la calidad percibida del sitio sin añadir dependencias ni romper la
identidad actual (negro/blanco/rojo, esquinas rectas, tipografía del sistema,
funcionamiento en `file://` y sin JS). La navegación, las secciones y el mapa
deben sentirse intencionados, ligeros y accesibles.

## Requisitos (EARS)

- **RF-01** CUANDO se pulsa un enlace de navegación, EL SISTEMA desplaza la
  página con una curva propia, perceptible pero breve, y cancela el desplazamiento
  si el usuario interviene.
- **RF-02** CUANDO una sección entra en el viewport, EL SISTEMA revela sus
  elementos con una entrada escalonada; al salir y volver a entrar (en cualquier
  dirección), la entrada se repite.
- **RF-03** SI el usuario prefiere movimiento reducido, ENTONCES EL SISTEMA
  muestra todo el contenido sin desplazamientos, escalas ni partículas en
  movimiento.
- **RF-04** EL SISTEMA mantiene una escala tipográfica coherente: un tamaño de
  cuerpo, un tamaño de apoyo y un tamaño de título de sección para todas las
  secciones.
- **RF-05** En escritorio, EL SISTEMA presenta el logotipo y las tres palabras
  del nombre en una sola línea centrada; en móvil, los apila a la izquierda con
  tamaño legible.
- **RF-06** EL SISTEMA anima la entrada del hero una sola vez por carga, sin
  animaciones ligadas al scroll ni al cursor en ese bloque.
- **RF-07** CUANDO se hace clic o se toca el hero, EL SISTEMA emite una ráfaga
  breve de partículas y respeta un cupo máximo; la cantidad base de partículas
  se reduce respecto de la versión anterior.
- **RF-08** EL SISTEMA aplica sombras degradadas en los bordes superior e
  inferior del hero para dar profundidad, sin tapar el contenido.
- **RF-09** CUANDO el título de una sección entra en pantalla, EL SISTEMA dibuja
  su barra inferior; al pasar el cursor o tocar, la barra intensifica su brillo
  rojo.
- **RF-10** En escritorio, EL SISTEMA organiza Servicios en un bento asimétrico
  con sombras suaves y una inclinación 3D sutil siguiendo el cursor; en móvil,
  en una lista vertical.
- **RF-11** EL SISTEMA usa negro absoluto en Beneficios, mantiene el espaciado
  del acordeón y muestra el filo rojo izquierdo sólo en el elemento activo.
- **RF-12** CUANDO una tarjeta de Testimonios recibe hover, EL SISTEMA la eleva
  con una sombra inferior; en el marquee, las tarjetas crecen al acercarse al
  centro y se reducen al salir, de forma sutil.
- **RF-13** EL SISTEMA muestra dos puntos de entrenamiento en el mismo mapa,
  permite seleccionarlos desde marcadores o desde la tarjeta, sincroniza título,
  dirección y enlace de indicaciones, y conserva ambas direcciones en el
  fallback sin JS.
- **RF-14** SI JS falla o no está disponible, ENTONCES EL SISTEMA mantiene el
  contenido visible, las anclas funcionan y el mapa muestra ambas direcciones.
- **RF-15** EL SISTEMA no añade bundler, framework, `package.json`, fuentes web
  ni servicios externos nuevos; MapLibre sigue siendo el único runtime externo.

## Criterios de aceptación

1. Navegación por los seis enlaces + logo con scroll suave, sin saltos ni
   bloqueo del scroll manual; `prefers-reduced-motion` salta instantáneo.
2. Las secciones se revelan al bajar, se ocultan al salir y se revelan al subir
   y al recargar; el hero sólo anima en la carga.
3. Hero en una línea centrada a >768px y apilado a la izquierda en móvil; clic
   y toque generan partículas sin superar el cupo.
4. Títulos con barra animada y brillo al interactuar.
5. Servicios con bento asimétrico, sombra base y tilt sólo con puntero fino;
   móvil en una columna.
6. Beneficios en `#000`, filo rojo sólo en el activo, sin recortes de texto.
7. Testimonios sin contenido cortado, elevación al hover y escala sutil en el
   marquee.
8. Mapa con dos marcadores, selector accesible, `flyTo` al elegir y tarjeta
   sincronizada; fallback con las dos direcciones.
9. Sin overflow horizontal en 1440, 1024, 861, 860, 768, 480 y 390 px; consola
   sin errores; `file://`, sin JS y movimiento reducido comprobados.
10. Sin dependencias nuevas; `git diff` sólo toca los tres archivos del sitio,
    la spec y las notas locales.
