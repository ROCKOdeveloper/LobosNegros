# Club Lobos Negros

**La web de un club de taekwondo de Barranquilla y Soledad, contada como el ritual
de un combate.** Tres archivos escritos a mano (`index.html`, `style.css` y
`script.js`), sin compilación, sin framework y sin dependencias que instalar.

Está pensada para el teléfono, porque casi todas las visitas llegan desde uno. Este
README describe el rediseño de `specs/003-combat-ritual/`, que aún espera su prueba
en un Android real.

<!-- TODO: captura del hero a 390 px y a 1440 px. Los únicos archivos extra del sitio son las fotos de img/: decidir dónde va antes de añadirla. -->

## El recorrido

Cada sección es un momento del combate. Las voces coreanas son etiquetas pequeñas;
el sentido siempre lo lleva el español. La columna Sección usa el `id` de cada una.

| Voz en el sitio | Sección | Qué cuenta |
|---|---|---|
| Charyeot, atención | `hero` | El lobo y el nombre del club |
| Kyeongrye, saludo | `who` | El grupo y sus cinco principios |
| — | `trajectory` | La historia del grupo, dibujada con tinta al hacer scroll |
| Joonbi, prepárate | `classes` | Por dónde empieza cada persona, según su edad |
| Shijak, ¡comiencen! | `combat` | Por qué se conoce al club |
| Keuman, alto | `visit` | Horario, sedes, mapa y WhatsApp |

## Verla en local

No hay nada que instalar: abre `index.html` en el navegador. Para probar como en un
servidor:

| Comando | Qué hace |
|---|---|
| `py -m http.server 8000` | Sirve la carpeta en `http://localhost:8000` |

Se revisa en un navegador real a 360, 390, 430, 768, 769, 1024 y 1440 px, con
movimiento reducido y sin JavaScript.

## Cómo está hecho

- **Marca:** el lobo vive en dos `<symbol>` de `index.html`, uno completo y otro
  reducido que se lee a 16 px. Sólo cortes rectos: las cinco cuchillas de la melena
  son los cinco principios.
- **Color:** noche `#0A0A0C`, sangre `#DB1A1A` y blanco de dobok `#FFFFFF`.
- **Fuentes**, incrustadas en `style.css` y sin peticiones a terceros: League Gothic
  para los títulos, Libre Franklin para leer y Black Han Sans para el coreano.
- **Movimiento:** sólo la entrada del inicio y el trazo de tinta de la trayectoria.
  Nada de apariciones al hacer scroll ni bucles decorativos.
- **Mapa:** MapLibre es la única dependencia externa, con su versión y hashes SRI en
  `CONFIG.maplibre`.
- **Peso:** los tres archivos suman 45 KB comprimidos; el límite es 90 KB.

<details>
<summary>Especificaciones</summary>

Cada etapa del diseño tiene su spec, plan y tareas en `specs/`:

| Carpeta | Etapa |
|---|---|
| `specs/001-refinamiento-visual/` | Primer refinamiento visual |
| `specs/002-pulido-hero/` | Pulido del inicio |
| `specs/003-combat-ritual/` | Rediseño como ritual de combate |

</details>

---

Hecho por Luis Rodríguez · [neobmo.github.io](https://neobmo.github.io)
