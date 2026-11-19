/* Club Lobos Negros
   Una clase por funcionalidad, sin módulos ni dependencias. MapLibre se carga
   solo cuando el mapa se acerca a la pantalla. */

const CONFIG = Object.freeze({
  debugMode: false,
  // La punta de la tinta sigue esta línea imaginaria de la pantalla (0 a 1).
  inkReadingLine: 0.72,
  maplibre: {
    version: "5.24.0",
    scriptIntegrity: "sha384-5+cfbwT0iiub6VsQAdn6yz16nr6sDiQoHx6tm4O8OVYXHYOxcffFmCJBL0dgdvGp",
    styleIntegrity: "sha384-uTttxo/aOKbdE5RlD/SPzSDoDmNvGlUYPjONi2MN/b7c9HPSvW07OIuyP7uL6jxK",
    tiles: "https://tiles.openfreemap.org/styles/fiord",
    // Sin respuesta en este tiempo se avisa, y las direcciones siguen visibles.
    timeoutMs: 15000,
  },
});

const logger = {
  warn: (message) => CONFIG.debugMode && console.warn(`[LN] ${message}`),
};

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

// La tinta de la trayectoria: cada golpe es un haz de cerdas que se abre, se
// carga de tinta y se seca. El trazo se construye desde las posiciones reales
// de los hitos, así que añadir un hito no exige tocar este código.
class InkStroke {
  constructor() {
    this.canvas = document.querySelector("[data-ink]");
    this.list = document.querySelector("[data-ink-list]");
    if (!this.canvas || !this.list) return;

    this.context = this.canvas.getContext("2d");
    this.steps = [];
    this.painted = 0;
    this.width = 0;
    this.height = 0;
    this.seed = 7;
    this.isNear = false;
    this.framePending = false;

    this.bind();
  }

  bind() {
    // ResizeObserver y no `resize`: la barra del navegador móvil cambia el alto
    // de la ventana al hacer scroll, pero no el tamaño de la lista.
    new ResizeObserver(() => this.measure()).observe(this.list);

    // Fuera de pantalla no se hace ningún trabajo de tinta.
    new IntersectionObserver((entries) => {
      this.isNear = entries.at(-1).isIntersecting;
      this.requestDraw();
    }).observe(this.canvas);

    window.addEventListener("scroll", () => this.requestDraw(), { passive: true });
    motionPreference.addEventListener("change", () => this.requestDraw());
  }

  requestDraw() {
    if (!this.isNear || this.framePending) return;
    this.framePending = true;
    requestAnimationFrame(() => {
      this.framePending = false;
      this.draw();
    });
  }

  // Azar con semilla: el trazo es idéntico en cada visita y al redibujar.
  random() {
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let value = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  // Una sola línea recorre toda la lista, como la historia del grupo. El pincel
  // se recarga en cada hito y se va secando hasta el siguiente; ahí, además,
  // cae un golpe corto hacia el texto.
  buildGestures() {
    const marks = Array.from(this.list.children).map((item) => item.offsetTop + 15);
    const stem = this.buildStem(marks);
    const strikes = marks.map((top) => ({
      points: this.buildStrike(top),
      bristles: this.buildBristles(),
      from: top,
    }));
    return { stem, strikes };
  }

  buildStem(marks) {
    const center = this.width * 0.34;
    const first = marks[0] - 4;
    const last = this.height - 4;
    const count = Math.ceil((last - first) / 2.4);
    const points = [];

    for (let index = 0; index <= count; index += 1) {
      const y = first + ((last - first) * index) / count;
      const x = center + Math.sin(y / 118) * 5 + Math.sin(y / 47) * 1.6;
      const slope = (Math.cos(y / 118) * 5) / 118 + (Math.cos(y / 47) * 1.6) / 47;
      const norm = Math.hypot(1, slope);

      // `load` va de 0, recién cargado, a 1, casi seco, entre un hito y otro.
      const previous = marks.filter((mark) => mark <= y + 4).pop() ?? first;
      const next = marks.find((mark) => mark > y + 4) ?? last;
      const load = (y - previous) / (next - previous);
      const t = index / count;
      const entry = Math.min(1, t / 0.02) ** 0.6;
      const exit = Math.min(1, (1 - t) / 0.12) ** 0.8;

      points.push({
        x,
        y,
        nx: -1 / norm,
        ny: slope / norm,
        t: load,
        width: (11 - load * 5) * entry * exit,
      });
    }

    return { points, bristles: this.buildBristles() };
  }

  buildStrike(top) {
    const start = [this.width * 0.34, top - 3];
    const curve = [this.width * 0.62, top + 1];
    const end = [this.width * 0.98, top + 7];
    const count = Math.ceil((end[0] - start[0]) / 2.4);
    const points = [];

    for (let index = 0; index <= count; index += 1) {
      const t = index / count;
      const u = 1 - t;
      const dx = 2 * u * (curve[0] - start[0]) + 2 * t * (end[0] - curve[0]);
      const dy = 2 * u * (curve[1] - start[1]) + 2 * t * (end[1] - curve[1]);
      const norm = Math.hypot(dx, dy);

      points.push({
        x: u * u * start[0] + 2 * u * t * curve[0] + t * t * end[0],
        y: u * u * start[1] + 2 * u * t * curve[1] + t * t * end[1],
        nx: -dy / norm,
        ny: dx / norm,
        t,
        // Golpe seco: arranca lleno y sale afilado.
        width: 5.5 * Math.min(1, (1 - t) / 0.55) ** 0.8,
      });
    }

    return points;
  }

  buildBristles() {
    return Array.from({ length: 16 }, (_, index) => ({
      place: (index / 15) * 2 - 1 + (this.random() - 0.5) * 0.05,
      phase: this.random() * 6.28,
      phaseSlow: this.random() * 6.28,
      rhythm: 0.05 + this.random() * 0.09,
      wobble: this.random() * 0.08,
    }));
  }

  measure() {
    const width = this.canvas.clientWidth;
    const height = this.list.offsetHeight;
    if (width === this.width && height === this.height) return;

    this.width = width;
    this.height = height;
    this.seed = 7;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.ratio = ratio;

    // Cada tramo guarda la altura a la que la punta lo alcanza. Los golpes se
    // intercalan en la línea, y el orden permite buscar sin recorrer todo.
    const { stem, strikes } = this.buildGestures();
    this.steps = [];
    stem.points.slice(0, -1).forEach((point, index) => {
      const reach = stem.points[index + 1].y;
      while (strikes.length && strikes[0].from <= reach) {
        const strike = strikes.shift();
        const stroke = { points: strike.points, bristles: strike.bristles };
        strike.points.slice(0, -1).forEach((_, strikeIndex) => {
          this.steps.push({ stroke, index: strikeIndex, reach });
        });
      }
      this.steps.push({ stroke: stem, index, reach });
    });

    this.clear();
    if (this.isNear) this.draw();
  }

  clear() {
    const { context, canvas, ratio } = this;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.strokeStyle = getComputedStyle(canvas).color;
    context.lineCap = "round";
    this.painted = 0;
  }

  isDry(bristle, index, t) {
    const edge = Math.abs(bristle.place);
    // La cerda exterior se seca antes, y todas se abren hacia el final.
    const threshold = 2.9 - t * t * 3.1 - edge * edge * (0.5 + t);
    const flow =
      Math.sin(index * bristle.rhythm + bristle.phase) +
      Math.sin(index * 0.021 + bristle.phaseSlow) * 0.8;
    return flow > threshold;
  }

  paintStep({ stroke, index }) {
    const { context } = this;
    const from = stroke.points[index];
    const to = stroke.points[index + 1];

    context.beginPath();
    stroke.bristles.forEach((bristle) => {
      if (this.isDry(bristle, index, from.t)) return;
      const offsetFrom = bristle.place + Math.sin(index * 0.2 + bristle.phase) * bristle.wobble;
      const offsetTo = bristle.place + Math.sin((index + 1) * 0.2 + bristle.phase) * bristle.wobble;
      context.moveTo(from.x + from.nx * from.width * offsetFrom, from.y + from.ny * from.width * offsetFrom);
      context.lineTo(to.x + to.nx * to.width * offsetTo, to.y + to.ny * to.width * offsetTo);
    });
    context.lineWidth = Math.max(1, from.width * 0.2);
    context.stroke();
  }

  // Primer tramo que la punta todavía no alcanza. `reach` está ordenado, así
  // que basta una búsqueda binaria.
  stepsUpTo(tip) {
    let low = 0;
    let high = this.steps.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (this.steps[middle].reach <= tip) low = middle + 1;
      else high = middle;
    }
    return low;
  }

  draw() {
    if (!this.steps.length) return;

    const top = this.list.getBoundingClientRect().top;
    const tip = motionPreference.matches
      ? Infinity
      : window.innerHeight * CONFIG.inkReadingLine - top;
    const target = this.stepsUpTo(tip);

    // Al bajar se pinta solo lo que falta; al subir no se puede despintar y
    // se vuelve a empezar, porque el azar con semilla da el mismo trazo.
    if (target < this.painted) this.clear();
    for (let index = this.painted; index < target; index += 1) {
      this.paintStep(this.steps[index]);
    }
    this.painted = target;
  }
}

// La acción del pulgar se aparta cuando Visita ya ofrece su propio botón.
class ThumbAction {
  constructor() {
    const action = document.querySelector("[data-thumb-action]");
    // Se observa el botón de WhatsApp de Visita y no la sección entera: así la
    // barra sólo se aparta mientras el otro botón está a la vista, y vuelve en
    // el mapa y las sedes, donde ya no hay otro WhatsApp en pantalla.
    const visitAction = document.querySelector("#visit .cta");
    if (!action || !visitAction) return;

    // Con medio botón a la vista: si no, la barra se apartaría cuando el otro
    // apenas asoma un píxel. `isIntersecting` no sirve aquí, porque es cierto
    // desde el primer píxel aunque haya umbral.
    new IntersectionObserver(
      (entries) => action.classList.toggle("is-hidden", entries.at(-1).intersectionRatio >= 0.5),
      { threshold: 0.5 }
    ).observe(visitAction);
  }
}

// Decisión del dueño: `replaceState` y no `pushState`, para que Atrás salga
// del sitio de un toque. En `file://` lanza un error y se ignora a propósito.
class ScrollTop {
  constructor() {
    const link = document.querySelector("[data-scroll-top]");
    if (!link) return;

    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: motionPreference.matches ? "auto" : "smooth" });
      try {
        history.replaceState(null, "", link.getAttribute("href"));
      } catch (error) {
        logger.warn(error.message);
      }
    });
  }
}

// El mapa: oscuro, plano y visto desde arriba. Las sedes se leen del marcado.
class MapLibreIntegration {
  constructor() {
    this.panel = document.querySelector("[data-map-panel]");
    this.container = document.getElementById("map-container");
    this.element = document.getElementById("map");
    this.status = document.querySelector("[data-map-status]");
    this.announcer = document.querySelector("[data-map-announcer]");
    if (!this.panel || !this.container || !this.element) return;

    this.map = null;
    this.isReady = false;
    this.hasFailed = false;
    this.view = "both";
    this.markers = new Map();
    this.buttons = Array.from(this.panel.querySelectorAll("[data-map-view]"));
    this.locations = Array.from(document.querySelectorAll("[data-location]")).map((element) => ({
      id: element.dataset.location,
      label: element.dataset.label,
      name: element.querySelector("h4").textContent,
      coordinates: [Number(element.dataset.lng), Number(element.dataset.lat)],
      element,
    }));

    this.buttons.forEach((button) => {
      button.addEventListener("click", () => this.select(button.dataset.mapView, true));
    });
    this.loadWhenNear();
  }

  // Fuente única del estado: botones, sedes, marcadores y encuadre.
  select(view, announce = false) {
    this.view = view;

    this.buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.mapView === view));
    });
    this.locations.forEach(({ id, element }) => {
      element.classList.toggle("is-active", id === view);
    });
    this.markers.forEach((marker, id) => {
      marker.getElement().classList.toggle("is-active", id === view);
      marker.getElement().setAttribute("aria-pressed", String(id === view));
    });

    if (announce && this.announcer) {
      const place = this.locations.find(({ id }) => id === view);
      this.announcer.textContent = place
        ? `Mapa en ${place.name}`
        : "El mapa muestra las dos sedes";
    }

    this.frame(motionPreference.matches ? 0 : 1100);
  }

  frame(duration) {
    if (!this.isReady) return;

    const place = this.locations.find(({ id }) => id === this.view);
    if (place) {
      this.map.flyTo({ center: place.coordinates, zoom: 15.6, duration, essential: true });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    this.locations.forEach(({ coordinates }) => bounds.extend(coordinates));
    // Margen superior mayor: el marcador se ancla abajo y su nombre va encima.
    this.map.fitBounds(bounds, {
      padding: { top: 104, bottom: 64, left: 72, right: 72 },
      maxZoom: 15,
      duration,
    });
  }

  loadWhenNear() {
    new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        this.load();
      },
      { rootMargin: "400px" }
    ).observe(this.container);
  }

  load() {
    const { version, scriptIntegrity, styleIntegrity } = CONFIG.maplibre;
    const base = `https://unpkg.com/maplibre-gl@${version}/dist/maplibre-gl`;

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = `${base}.css`;
    stylesheet.integrity = styleIntegrity;
    stylesheet.crossOrigin = "anonymous";
    document.head.appendChild(stylesheet);

    const script = document.createElement("script");
    script.src = `${base}.js`;
    script.integrity = scriptIntegrity;
    script.crossOrigin = "anonymous";
    script.onload = () => this.build();
    script.onerror = () => this.fail();
    document.head.appendChild(script);

    this.timeout = window.setTimeout(() => this.fail(), CONFIG.maplibre.timeoutMs);
  }

  build() {
    // Si el aviso ya salió, un script que llega tarde no debe construir nada.
    if (this.hasFailed) return;

    try {
      this.map = new maplibregl.Map({
        container: this.element,
        style: CONFIG.maplibre.tiles,
        center: this.locations[0].coordinates,
        zoom: 13,
        minZoom: 11,
        maxZoom: 19,
        // Siempre plano y desde arriba: sin inclinación ni giro. Es más liviano
        // y mantiene el norte arriba para quien se está ubicando.
        maxPitch: 0,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        // Un dedo sigue moviendo la página; dos dedos mueven el mapa.
        cooperativeGestures: true,
        attributionControl: { compact: false },
        locale: {
          "Map.Title": "Mapa de las sedes del club",
          "NavigationControl.ZoomIn": "Acercar el mapa",
          "NavigationControl.ZoomOut": "Alejar el mapa",
          "AttributionControl.ToggleAttribution": "Mostrar u ocultar atribución",
          "CooperativeGesturesHandler.WindowsHelpText": "Usa Ctrl + rueda para hacer zoom",
          "CooperativeGesturesHandler.MacHelpText": "Usa ⌘ + rueda para hacer zoom",
          "CooperativeGesturesHandler.MobileHelpText": "Usa dos dedos para mover el mapa",
        },
      });

      this.map.touchZoomRotate.disableRotation();
      this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      this.map.on("error", (event) => logger.warn(event.error?.message || "error de mapa"));

      // En `style.load` y no en `load`: así nunca se ve un frame azul de `fiord`.
      this.map.on("style.load", () => this.applyBrandPalette());

      this.map.on("load", () => {
        window.clearTimeout(this.timeout);
        this.isReady = true;
        this.locations.forEach((location) => this.addMarker(location));
        this.frame(0);
        this.status.hidden = true;
      });
    } catch (error) {
      logger.warn(error.message);
      this.fail();
    }
  }

  addMarker({ id, label, name, coordinates }) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "map-pin";
    element.setAttribute("aria-label", `Ver ${name} en el mapa`);
    element.classList.toggle("is-active", id === this.view);
    element.setAttribute("aria-pressed", String(id === this.view));
    element.innerHTML = `
      <span class="map-pin-label"></span>
      <svg viewBox="0 0 34 44" aria-hidden="true">
        <path d="M17 30 8.5 43.5h17Z" fill="#DB1A1A" />
        <rect x="2" y="2" width="30" height="30" fill="#DB1A1A" stroke="#FFFFFF" stroke-width="2" />
        <rect x="11" y="11" width="12" height="12" fill="#FFFFFF" />
      </svg>
    `;
    element.querySelector(".map-pin-label").textContent = label;
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      this.select(id, true);
    });

    this.markers.set(
      id,
      new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(coordinates).addTo(this.map)
    );
  }

  fail() {
    window.clearTimeout(this.timeout);
    if (this.isReady) return;
    this.hasFailed = true;
    this.map?.remove();
    this.panel.classList.add("is-failed");
    this.status.hidden = false;
    this.status.textContent = "El mapa no cargó. Aquí tienes las dos direcciones.";
  }

  // El estilo `fiord` es azul grisáceo y compite con la paleta del club.
  // Se repinta por capas para dejar el mapa en negro/grises, con el rojo
  // reservado al marcador. Las capas se comprueban antes de tocarlas para
  // que un cambio futuro del estilo no rompa la integración.
  applyBrandPalette() {
    const palette = {
      background: { "background-color": "#0A0A0C" },
      water: { "fill-color": "#121216" },
      landuse_residential: { "fill-color": "#0E0E12", "fill-opacity": 1 },
      landcover_wood: { "fill-color": "#0C0C10" },
      park: { "fill-color": "#101014", "fill-opacity": 0.85 },
      park_outline: { "line-color": "#2A2A31" },
      waterway: { "line-color": "#1C1C22" },
      building: { "fill-color": "#1A1A1F", "fill-opacity": 0.8 },
      "highway_path": { "line-color": "#2A2A31" },
      "highway_minor": { "line-color": "#2C2C33" },
      "highway_major_casing": { "line-color": "#3A3A42" },
      "highway_major_inner": { "line-color": "#2E2E35" },
      "highway_major_subtle": { "line-color": "#26262C" },
      "highway_motorway_casing": { "line-color": "#44444C" },
      "highway_motorway_inner": { "line-color": "#3A3A42" },
      "highway_motorway_subtle": { "line-color": "#26262C" },
      "railway_transit": { "line-color": "#2A2A31" },
      "railway_transit_dashline": { "line-color": "#3A3A42" },
      "railway_service": { "line-color": "#2A2A31" },
      "railway_service_dashline": { "line-color": "#3A3A42" },
      railway: { "line-color": "#2A2A31" },
      railway_dashline: { "line-color": "#3A3A42" },
      boundary_state: { "line-color": "#34343B" },
      "boundary_country_z0-4": { "line-color": "#34343B" },
      "boundary_country_z5-": { "line-color": "#34343B" },
      water_name: { "text-color": "#8A8A92", "text-halo-color": "#0A0A0C" },
      highway_name_other: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      highway_ref: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      place_other: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      place_suburb: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      place_village: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      place_town: { "text-color": "#A5A5AD", "text-halo-color": "#0A0A0C" },
      place_city: { "text-color": "#A5A5AD", "text-halo-color": "#0A0A0C" },
      place_city_large: { "text-color": "#B8B8BE", "text-halo-color": "#0A0A0C" },
      place_state: { "text-color": "#A0A0A8", "text-halo-color": "#0A0A0C" },
      place_country_other: { "text-color": "#B8B8BE", "text-halo-color": "#0A0A0C" },
      place_country_minor: { "text-color": "#B8B8BE", "text-halo-color": "#0A0A0C" },
      place_country_major: { "text-color": "#C8C8CE", "text-halo-color": "#0A0A0C" },
      place_continent: { "text-color": "#E6E6EA", "text-halo-color": "#0A0A0C" },
      "aeroway-area": { "fill-color": "#1A1A1F" },
      "aeroway-runway": { "line-color": "#2A2A31" },
      "aeroway-runway-casing": { "line-color": "#3A3A42" },
      "aeroway-taxiway": { "line-color": "#2A2A31" },
      road_area_pier: { "fill-color": "#121216" },
      road_pier: { "line-color": "#2A2A31" },
      tunnel_motorway_casing: { "line-color": "#2A2A31" },
      tunnel_motorway_inner: { "line-color": "#26262C" },
    };

    Object.entries(palette).forEach(([layerId, properties]) => {
      if (!this.map.getLayer(layerId)) return;
      Object.entries(properties).forEach(([property, value]) => {
        this.map.setPaintProperty(layerId, property, value);
      });
    });
  }
}

class App {
  static bootstrap() {
    new InkStroke();
    new ThumbAction();
    new ScrollTop();
    new MapLibreIntegration();
  }
}

App.bootstrap();
