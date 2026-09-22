/* Global configuration and Utilities */
const CONFIG = Object.freeze({
  scrollOffset: 80,
  navHideDistance: 240,
  observerThreshold: 0.15,
  observerRootMargin: "0px 0px -100px 0px",
  debugMode: false,
  mapLocation: { lat: 10.940750, lng: -74.791333 },
});

/* Logger */
const logger = {
  log: (msg) => CONFIG.debugMode && console.log(`[LN] ${msg}`),
  warn: (msg) => CONFIG.debugMode && console.warn(`[LN] ${msg}`),
  error: (msg) => CONFIG.debugMode && console.error(`[LN] ${msg}`),
};

/* Throttle */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Navbar
class Navigation {
  constructor() {
    this.navbar = document.querySelector(".navbar");
    this.navLinks = document.querySelectorAll("[data-smooth-scroll]");
    this.mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    this.navMenu = document.querySelector(".nav-menu");
    this.heroSection = document.querySelector(".hero");
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.mobileMediaQuery = window.matchMedia("(max-width: 768px)");
    this.sections = Array.from(document.querySelectorAll("section[id]"));
    this.lastScrollY = window.scrollY;
    this.downAccum = 0;
    this.hasShownNavbar = false;
    this.rafPending = false;
    this.init();
  }

  init() {
    if (!this.navbar) return;
    this.attachEventListeners();
    this.updateHeader();
  }

  attachEventListeners() {
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
        if (isModified) return;

        const targetId = link.getAttribute("href");
        const targetSection = document.querySelector(targetId);
        if (!targetSection) return;

        e.preventDefault();
        this.smoothScroll(targetSection);
        this.closeMenu();
        history.replaceState(null, "", targetId);
      });
    });

    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener("click", () => this.toggleMenu());
    }

    document.addEventListener("click", (e) => {
      if (this.navMenu?.classList.contains("active") && !e.target.closest(".navbar")) {
        this.closeMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.navMenu?.classList.contains("active")) {
        this.closeMenu();
        this.mobileMenuBtn?.focus();
      }
    });

    window.addEventListener("resize", throttle(() => {
      if (!this.mobileMediaQuery.matches) this.closeMenu();
      this.updateHeader();
    }, 150));

    window.addEventListener("scroll", () => this.onScroll(), { passive: true });
  }

  onScroll() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.updateHeader();
    });
  }

  updateHeader() {
    const scrollY = window.scrollY;
    const delta = scrollY - this.lastScrollY;
    this.lastScrollY = scrollY;

    const heroHeight = this.heroSection ? this.heroSection.offsetHeight : 400;
    const isPastHero = scrollY >= heroHeight * 0.5;

    this.navbar.classList.toggle("scrolled", isPastHero);

    if (this.navMenu?.classList.contains("active")) {
      this.navbar.classList.add("nav-visible");
      return this.updateActiveLink();
    }

    if (!isPastHero) {
      this.downAccum = 0;
      this.hasShownNavbar = false;
      this.navbar.classList.remove("nav-visible");
      return this.updateActiveLink();
    }

    if (delta < -3) {
      this.downAccum = 0;
      this.navbar.classList.add("nav-visible");
    } else if (delta > 3) {
      if (!this.hasShownNavbar) {
        this.hasShownNavbar = true;
        this.navbar.classList.add("nav-visible");
      } else {
        this.downAccum += delta;
        if (this.downAccum >= CONFIG.navHideDistance) {
          this.navbar.classList.remove("nav-visible");
        }
      }
    } else if (!this.hasShownNavbar) {
      this.hasShownNavbar = true;
      this.navbar.classList.add("nav-visible");
    }

    this.updateActiveLink();
  }

  updateActiveLink() {
    let currentSectionId = "";
    const scrollPosition = window.scrollY + CONFIG.scrollOffset + 10;

    this.sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute("id");
      }
    });

    this.navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${currentSectionId}`;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  smoothScroll(element) {
    const offsetTop = element.offsetTop - CONFIG.scrollOffset;
    const behavior = this.reducedMotionQuery.matches ? "auto" : "smooth";
    window.scrollTo({
      top: offsetTop,
      behavior
    });
  }

  toggleMenu() {
    if (!this.navMenu || !this.mobileMenuBtn) return;
    const isActive = this.navMenu.classList.toggle("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", isActive);
    document.body.classList.toggle("menu-open", isActive);
    if (isActive) this.navbar?.classList.add("nav-visible");
  }

  closeMenu() {
    if (!this.navMenu || !this.mobileMenuBtn) return;
    this.navMenu.classList.remove("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }
}

// Hero & Particles
class HeroParticles {
  constructor() {
    this.canvas = document.getElementById("hero-particles");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.hero = document.querySelector(".hero");
    this.particles = [];
    this.animationFrameId = null;
    this.isRunning = false;
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.mouse = { x: null, y: null, radius: 130, isHovering: false };
    this.init();
  }

  init() {
    this.setupCanvas();
    this.createParticles();
    this.attachEventListeners();
    this.setupVisibilityObserver();
  }

  setupCanvas() {
    const rect = this.hero ? this.hero.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  createParticles() {
    this.particles = [];
    const count = this.width < 600 ? Math.floor(Math.max(this.width / 20, 22)) : (this.width < 1024 ? 45 : Math.floor(Math.min(this.width / 16, 90)));
    const minSize = 1.5;
    const maxSize = 5.0;

    for (let i = 0; i < count; i++) {
      const size = Math.random() * (maxSize - minSize) + minSize;
      const depth = (size - minSize) / (maxSize - minSize);
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size,
        depth,
        baseVy: -(0.25 + depth * 0.7),
        vx: 0,
        vy: 0,
        alpha: 0.35 + depth * 0.85,
        sinOffset: Math.random() * Math.PI * 2,
        sinSpeed: 0.01 + (1 - depth) * 0.015,
        sinAmp: 0.2 + depth * 0.35,
      });
    }
  }

  attachEventListeners() {
    window.addEventListener("resize", throttle(() => { this.setupCanvas(); this.createParticles(); }, 200), { passive: true });
    if (!this.hero) return;
    this.hero.addEventListener("mousemove", (e) => {
      const rect = this.hero.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.isHovering = true;
    }, { passive: true });
    this.hero.addEventListener("mouseleave", () => { this.mouse.isHovering = false; this.mouse.x = null; this.mouse.y = null; }, { passive: true });
    this.hero.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        const rect = this.hero.getBoundingClientRect();
        this.mouse.x = e.touches[0].clientX - rect.left;
        this.mouse.y = e.touches[0].clientY - rect.top;
        this.mouse.isHovering = true;
      }
    }, { passive: true });
    this.hero.addEventListener("touchend", () => { this.mouse.isHovering = false; this.mouse.x = null; this.mouse.y = null; }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stop();
      } else if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const rect = this.hero ? this.hero.getBoundingClientRect() : null;
        const isOnScreen = rect && rect.top < window.innerHeight && rect.bottom > 0;
        if (isOnScreen && !this.isRunning) this.start();
      }
    });
  }

  setupVisibilityObserver() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.renderStaticFrame();
      return;
    }
    if (!("IntersectionObserver" in window) || !this.hero) {
      this.start();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { entry.isIntersecting ? this.start() : this.stop(); });
    }, { threshold: 0.05 });
    observer.observe(this.hero);
  }

  renderStaticFrame() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.fillStyle = `rgba(219, 26, 26, ${p.alpha * 0.7})`;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.render();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  render() {
    if (!this.isRunning) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.sinOffset += p.sinSpeed;
      p.x += p.vx + Math.sin(p.sinOffset) * p.sinAmp;
      p.y += p.baseVy + p.vy;

      if (this.mouse.isHovering && this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < this.mouse.radius && dist > 0) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.7;
          p.vy += Math.sin(angle) * force * 0.7;
        }
      }

      p.vx *= 0.94;
      p.vy *= 0.94;

      if (p.y < -15) {
        p.y = this.height + 15;
        p.x = Math.random() * this.width;
        p.vx = 0;
        p.vy = 0;
      }
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;

      this.ctx.fillStyle = `rgba(219, 26, 26, ${p.alpha})`;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    this.animationFrameId = requestAnimationFrame(() => this.render());
  }
}

// Scroll animations
class AnimationObserver {
  constructor() {
    this.isSupported = "IntersectionObserver" in window;
    this.init();
  }

  init() {
    if (!this.isSupported) {
      this.initFallback();
      return;
    }

    const elementsToAnimate = document.querySelectorAll("[data-aos]");
    if (elementsToAnimate.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateElement(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: CONFIG.observerThreshold,
        rootMargin: CONFIG.observerRootMargin,
      }
    );

    elementsToAnimate.forEach((el) => observer.observe(el));
  }

  animateElement(element) {
    const delay = parseInt(element.getAttribute("data-aos-delay")) || 0;
    if (delay > 0) {
      element.style.transitionDelay = `${delay}ms`;
    }

    const clearWillChange = () => {
      element.style.willChange = "";
      element.style.transitionDelay = "";
    };

    element.style.willChange = "opacity, transform";
    requestAnimationFrame(() => {
      element.classList.add("aos-animate");
      element.addEventListener("transitionend", clearWillChange, { once: true });
      setTimeout(clearWillChange, delay + 600);
    });
  }

  initFallback() {
    document.querySelectorAll("[data-aos]").forEach((el) => {
      el.classList.add("aos-animate");
    });
  }
}

// About Team Dock (macOS-style magnification)
class TeamDock {
  constructor() {
    this.group = document.querySelector(".team-group");
    this.items = this.group ? Array.from(this.group.querySelectorAll(".team-item")) : [];
    this.mainImage = document.querySelector("#about-main");
    this.groupPhoto = this.mainImage ? this.mainImage.getAttribute("src") : "";

    if (!this.group || this.items.length === 0) return;

    this.maxScale = 1.75;
    this.minScale = 0.8;
    this.decay = 110;
    this.baseWidth = 0;
    this.baseCenters = [];
    this.baseSpan = 0;

    this.easeRate = 11;
    this.liftY = -8;

    this.activeItem = null;
    this.touchItem = null;
    this.overGroup = false;
    this.running = false;
    this.rafId = 0;
    this.lastTimestamp = 0;

    this.currentScales = [];
    this.targetScales = [];
    this.currentXs = [];
    this.targetXs = [];
    this.yPos = [];
    this.yVel = [];

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = prefersReducedMotion.matches;
    prefersReducedMotion.addEventListener?.("change", (e) => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion) this.reset();
    });

    this.setupImages();
    this.measure();
    this.initState();
    this.writeTargets();
    this.bindEvents();
  }

  setupImages() {
    this.items.forEach((item) => {
      const avatarImg = item.querySelector(".member-avatar-photo");
      if (avatarImg) {
        avatarImg.addEventListener("load", () => avatarImg.classList.add("is-loaded"));
      }
    });

    if (this.mainImage) {
      this.mainImage.addEventListener("load", () => this.mainImage.classList.add("loaded"));
    }
  }

  initState() {
    const count = this.items.length;
    this.currentScales = new Array(count).fill(1);
    this.targetScales = new Array(count).fill(1);
    this.currentXs = new Array(count).fill(0);
    this.targetXs = new Array(count).fill(0);
    this.yPos = new Array(count).fill(0);
    this.yVel = new Array(count).fill(0);
  }

  measure() {
    this.baseWidth = this.items[0].offsetWidth;
    this.baseCenters = this.items.map((item) => item.offsetLeft + item.offsetWidth / 2);
    const first = this.items[0].offsetLeft;
    const last = this.items[this.items.length - 1].offsetLeft + this.items[this.items.length - 1].offsetWidth;
    this.baseSpan = last - first;
  }

  bindEvents() {
    this.items.forEach((item) => {
      const avatar = item.querySelector(".team-avatar");

      if (!this.reducedMotion && window.matchMedia("(hover: hover)").matches) {
        avatar.addEventListener("mouseenter", () => this.preview(item));
        avatar.addEventListener("mouseleave", () => this.restore());
      }

      avatar.addEventListener("focusin", () => {
        const index = this.items.indexOf(item);
        this.applyDock(this.baseCenters[index]);
        this.preview(item);
      });
      avatar.addEventListener("focusout", (event) => {
        if (event.relatedTarget?.closest?.(".team-group")) return;
        if (!this.overGroup) this.reset();
        else this.restore();
      });

      // Touch devices: tap selects an avatar and shows its preview
      item.addEventListener("pointerdown", (event) => {
        if (window.matchMedia("(hover: hover)").matches) return;
        event.preventDefault();
        if (this.touchItem === item) {
          this.clearTouch();
        } else {
          this.clearTouch();
          this.touchItem = item;
          item.classList.add("dock-active");
          this.preview(item);
          this.applyDock(this.baseCenters[this.items.indexOf(item)]);
        }
      });
    });

    if (!this.reducedMotion && window.matchMedia("(hover: hover)").matches) {
      this.group.addEventListener("pointerenter", () => {
        this.overGroup = true;
      });
      this.group.addEventListener("pointerleave", () => {
        this.overGroup = false;
        this.reset();
      });
      this.group.addEventListener("pointermove", (event) => {
        const rect = this.group.getBoundingClientRect();
        this.applyDock(event.clientX - rect.left);
      });
    }

    document.addEventListener("pointerdown", (event) => {
      if (this.touchItem && !event.target.closest(".team-group")) {
        this.clearTouch();
      }
    });

    window.addEventListener("resize", () => {
      this.measure();
      this.initState();
      this.writeTargets();
    });
  }

  applyDock(pointerX) {
    const count = this.items.length;

    const distances = this.items.map((item, index) =>
      Math.abs(this.baseCenters[index] - pointerX)
    );

    let hoverIndex = 0;
    let minDistance = Infinity;
    distances.forEach((distance, index) => {
      if (distance < minDistance) {
        minDistance = distance;
        hoverIndex = index;
      }
    });

    // The hovered item receives the full magnification; every other item
    // shares the leftover width budget (each keeps its reserved slot, so the
    // dock never outgrows its track), shrinking in proportion to its distance.
    const others = [];
    const weights = [];
    distances.forEach((distance, index) => {
      if (index === hoverIndex) return;
      others.push(index);
      weights.push(Math.exp(distance / this.decay));
    });
    const weightSum = weights.reduce((a, b) => a + b, 0);

    let scales = this.items.map((item, index) => {
      if (index === hoverIndex) return this.maxScale;
      const share = weights[others.indexOf(index)] / weightSum;
      return 1 - (this.maxScale - 1) * share;
    });

    // Enforce the minimum size and rebalance so the total stays untouched.
    for (let pass = 0; pass < 12; pass += 1) {
      const floorExcess = scales
        .map((scale, i) => (i === hoverIndex ? 0 : Math.max(0, this.minScale - scale)))
        .reduce((a, b) => a + b, 0);
      if (floorExcess < 0.0001) break;
      const floorWeights = scales.map((scale, i) =>
        i === hoverIndex || scale <= this.minScale ? 0 : weights[others.indexOf(i)]
      );
      const floorWeightSum = floorWeights.reduce((a, b) => a + b, 0);
      if (floorWeightSum === 0) break;
      scales = scales.map((scale, i) => {
        if (i === hoverIndex) return scale;
        if (scale <= this.minScale) return this.minScale;
        return scale - floorExcess * (floorWeights[i] / floorWeightSum);
      });
    }

    const widths = scales.map((scale) => this.baseWidth * scale);
    let gapSpace = this.baseSpan - widths.reduce((a, b) => a + b, 0);
    if (gapSpace < 0) gapSpace = 0;

    const adjSums = [];
    for (let i = 0; i < count - 1; i += 1) {
      adjSums.push(widths[i] + widths[i + 1]);
    }
    const adjTotal = adjSums.reduce((a, b) => a + b, 0);

    const finalCenters = [widths[0] / 2];
    for (let i = 0; i < count - 1; i += 1) {
      const gap = adjTotal > 0 ? gapSpace * (adjSums[i] / adjTotal) : 0;
      finalCenters.push(finalCenters[i] + widths[i] / 2 + gap + widths[i + 1] / 2);
    }

    const desiredCenter = this.baseSpan / 2;
    const actualCenter = (finalCenters[0] + finalCenters[count - 1]) / 2;
    const shift = desiredCenter - actualCenter;

    this.targetScales = scales;
    this.targetXs = finalCenters.map(
      (center, index) => center + shift - this.baseCenters[index]
    );

    this.setActive(this.items[hoverIndex]);

    if (this.reducedMotion) {
      this.writeTargets();
    } else {
      this.animate();
    }
  }

  animate() {
    if (this.reducedMotion || this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();

    const tick = (timestamp) => {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
      this.lastTimestamp = timestamp;
      const factor = 1 - Math.exp(-dt * this.easeRate);

      let maxDelta = 0;
      this.items.forEach((item, index) => {
        this.currentScales[index] += (this.targetScales[index] - this.currentScales[index]) * factor;
        this.currentXs[index] += (this.targetXs[index] - this.currentXs[index]) * factor;

        const targetY = this.activeItem === item ? this.liftY : 0;
        this.yVel[index] += (targetY - this.yPos[index]) * 140 * dt;
        this.yVel[index] *= Math.exp(-10 * dt);
        this.yPos[index] += this.yVel[index] * dt;

        maxDelta = Math.max(
          maxDelta,
          Math.abs(this.targetScales[index] - this.currentScales[index]),
          Math.abs(this.targetXs[index] - this.currentXs[index]),
          Math.abs(targetY - this.yPos[index]) / 24
        );

        item.style.setProperty("--dock-s", this.currentScales[index].toFixed(4));
        item.style.setProperty("--dock-x", `${this.currentXs[index].toFixed(2)}px`);
        item.style.setProperty("--dock-y", `${this.yPos[index].toFixed(2)}px`);
      });

      if (maxDelta < 0.002) {
        this.writeTargets();
        this.running = false;
        return;
      }
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  writeTargets() {
    this.items.forEach((item, index) => {
      this.currentScales[index] = this.targetScales[index];
      this.currentXs[index] = this.targetXs[index];
      const targetY = this.activeItem === item ? this.liftY : 0;
      this.yPos[index] = targetY;
      this.yVel[index] = 0;
      item.style.setProperty("--dock-s", String(this.targetScales[index]));
      item.style.setProperty("--dock-x", `${this.targetXs[index].toFixed(2)}px`);
      item.style.setProperty("--dock-y", `${targetY.toFixed(2)}px`);
    });
  }

  setActive(item) {
    if (this.activeItem === item) return;
    this.items.forEach((other) => other.classList.remove("dock-active"));
    if (item) item.classList.add("dock-active");
    this.activeItem = item;
  }

  reset() {
    this.items.forEach((item) => item.classList.remove("dock-active"));
    this.activeItem = null;
    this.touchItem = null;
    this.overGroup = false;
    this.targetScales = new Array(this.items.length).fill(1);
    this.targetXs = new Array(this.items.length).fill(0);
    if (this.reducedMotion) {
      cancelAnimationFrame(this.rafId);
      this.running = false;
      this.writeTargets();
    } else {
      this.animate();
    }
    this.restore();
  }

  clearTouch() {
    if (this.touchItem) {
      this.touchItem = null;
      this.reset();
    }
  }

  preview(item) {
    if (!this.mainImage) return;
    const photo = item.getAttribute("data-photo");
    if (!photo || photo === this.mainImage.getAttribute("src")) return;
    this.mainImage.classList.remove("loaded");
    this.mainImage.src = photo;
  }

  restore() {
    if (!this.mainImage || this.mainImage.getAttribute("src") === this.groupPhoto) return;
    this.mainImage.classList.remove("loaded");
    this.mainImage.src = this.groupPhoto;
  }
}

// Benefits
class Accordion {
  constructor() {
    this.items = document.querySelectorAll(".accordion-item");
    this.init();
  }

  init() {
    if (!this.items.length) return;

    this.items.forEach((item) => {
      const header = item.querySelector(".accordion-header");
      if (!header) return;
      header.addEventListener("click", () => this.toggle(item));
    });
  }

  toggle(item) {
    const isActive = item.classList.contains("active");

    this.items.forEach((el) => {
      el.classList.remove("active");
      const body = el.querySelector(".accordion-body");
      if (body) body.style.maxHeight = "0px";
      const btn = el.querySelector(".accordion-header");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });

    if (!isActive) {
      item.classList.add("active");
      const header = item.querySelector(".accordion-header");
      if (header) header.setAttribute("aria-expanded", "true");
      const body = item.querySelector(".accordion-body");
      if (body) {
        requestAnimationFrame(() => {
          body.style.maxHeight = body.scrollHeight + "px";
        });
      }
    }
  }
}

// Testimonials: infinite marquee (auto-scroll + drag, wraps in both directions)
class TestimonialsMarquee {
  constructor() {
    this.section = document.querySelector(".testimonials");
    this.track = document.querySelector("[data-carousel]");
    this.speed = 0.5;
    this.offset = 0;
    this.period = 0;
    this.rafId = null;
    this.visible = false;
    this.hovered = false;
    this.dragging = false;
    this.dragStartX = 0;
    this.dragStartOffset = 0;
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.init();
  }

  init() {
    if (!this.track || !this.track.children.length) return;

    const clones = Array.from(this.track.children).map((node) => node.cloneNode(true));
    clones.forEach((node) => {
      node.setAttribute("aria-hidden", "true");
      node.removeAttribute("data-aos");
      this.track.appendChild(node);
    });

    this.measure();

    this.track.addEventListener("pointerenter", () => { this.hovered = true; this.run(); });
    this.track.addEventListener("pointerleave", () => { this.hovered = false; this.run(); });
    this.track.addEventListener("pointerdown", (e) => this.onDragStart(e));
    this.track.addEventListener("pointercancel", () => this.onDragEnd());
    window.addEventListener("pointerup", () => this.onDragEnd());
    this.track.addEventListener("pointermove", (e) => this.onDragMove(e));

    this.reducedMotionQuery.addEventListener("change", () => this.render());
    window.addEventListener("resize", throttle(() => { this.measure(); this.render(); }, 200), { passive: true });

    this.setupVisibilityObserver();
    this.render();
  }

  measure() {
    if (!this.track || !this.track.children.length) return;
    const half = this.track.children.length / 2;
    if (half < 1) return;
    this.period = this.track.children[half].offsetLeft;
  }

  setupVisibilityObserver() {
    if (!("IntersectionObserver" in window) || !this.section) {
      this.visible = true;
      this.run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.visible = entry.isIntersecting;
          this.run();
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(this.section);
  }

  onDragStart(e) {
    if (this.reducedMotionQuery.matches || this.dragging) return;
    this.dragging = true;
    this.dragStartX = e.clientX;
    this.dragStartOffset = this.offset;
    this.track.setPointerCapture(e.pointerId);
    this.stop();
  }

  onDragMove(e) {
    if (!this.dragging) return;
    const dx = this.dragStartOffset - (e.clientX - this.dragStartX);
    this.offset = Math.max(0, Math.min(this.period, dx));
    this.render();
  }

  onDragEnd() {
    this.dragging = false;
    this.run();
  }

  wrap(value) {
    if (!this.period) return 0;
    return ((value % this.period) + this.period) % this.period;
  }

  render() {
    if (!this.track) return;
    this.track.style.transform = `translateX(${-this.offset}px)`;
  }

  run() {
    this.stop();
    if (this.reducedMotionQuery.matches || !this.visible || this.hovered || this.dragging) return;
    const step = () => {
      this.offset = this.wrap(this.offset + this.speed);
      this.render();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Contact & Social
class VisualEffects {
  constructor() {
    this.init();
  }

  init() {
    this.addMouseFollowEffect();
  }

  addMouseFollowEffect() {
    // El tilt 3D es decorativo: se omite si el usuario pide menos movimiento.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const socialLinks = document.querySelectorAll(".contact-social .social-link");
    socialLinks.forEach((link) => {
      link.addEventListener("mousemove", (e) => {
        const rect = link.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        const angleX = -mouseY * 0.15;
        const angleY = mouseX * 0.15;
        link.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.1)`;
      });
      link.addEventListener("mouseleave", () => { link.style.transform = ""; });
    });
  }
}

// Map
class MapLibreIntegration {
  constructor() {
    this.map = null;
    this.mapContainer = document.getElementById("map-container");
    this.mapElement = document.getElementById("map");
    this.isLoaded = false;

    this.init();
  }

  init() {
    if (!this.mapContainer || !this.mapElement) return;
    this.setupLazyLoad();
  }

  setupLazyLoad() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isLoaded) {
            this.loadMapLibre();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "150px",
      }
    );

    observer.observe(this.mapContainer);
  }

  loadMapLibre() {
    if (window.maplibregl) {
      this.initializeMap();
      return;
    }

    this.loadMapStylesheet();

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@^5/dist/maplibre-gl.js";
    script.async = true;

    script.onload = () => this.initializeMap();
    script.onerror = () => this.showFallback();

    document.head.appendChild(script);
  }

  loadMapStylesheet() {
    const cssHref = "https://unpkg.com/maplibre-gl@^5/dist/maplibre-gl.css";
    if (document.querySelector(`link[href="${cssHref}"]`)) return;

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = cssHref;
    document.head.appendChild(stylesheet);
  }

  initializeMap() {
    try {
      const { lat, lng } = CONFIG.mapLocation;

      this.map = new maplibregl.Map({
        container: this.mapElement,
        style: "https://tiles.openfreemap.org/styles/fiord",
        center: [lng, lat],
        zoom: 16,
        attributionControl: true,
        pitchWithRotate: false,
        dragRotate: false,
        scrollZoom: { smooth: true },
        doubleClickZoom: true,
        touchZoomRotate: true,
        keyboard: true,
        maxZoom: 19,
        minZoom: 12,
      });

      this.map.on("load", () => {
        this.map.addSource("club-zone", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
          },
        });

        this.map.addLayer({
          id: "club-zone-fill",
          type: "circle",
          source: "club-zone",
          paint: {
            "circle-radius": 45,
            "circle-color": "#DB1A1A",
            "circle-opacity": 0.25,
            "circle-stroke-color": "#DB1A1A",
            "circle-stroke-width": 2,
            "circle-stroke-opacity": 0.8,
          },
        });

        const markerElement = document.createElement("div");
        markerElement.className = "map-club-marker";
        markerElement.innerHTML = `
          <svg viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 30L8.5 43.5L25.5 43.5L17 30Z" fill="#DB1A1A"/>
            <rect x="2" y="2" width="30" height="30" fill="#DB1A1A" stroke="#FFFFFF" stroke-width="2"/>
            <rect x="11" y="11" width="12" height="12" fill="#FFFFFF"/>
          </svg>
        `;

        const popupHtml = `
          <div class="map-popup-content">
            <span class="map-popup-icon" aria-hidden="true"></span>
            <div>
              <h4 class="map-popup-title">Club Lobos Negros</h4>
              <p class="map-popup-address">Parque La Inmaculada<br>Calle 37c #5a-58, Barranquilla</p>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({
          offset: [0, -35],
          className: "map-club-popup",
          closeButton: false,
        }).setHTML(popupHtml);

        new maplibregl.Marker({ element: markerElement, anchor: "bottom" })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(this.map);

        this.hideMapLoading();
      });

      this.isLoaded = true;
    } catch (error) {
      logger.error(`Failed to build MapLibre map: ${error.message}`);
      this.showFallback();
    }
  }

  hideMapLoading() {
    const loading = this.mapContainer.querySelector(".map-loading");
    if (loading) loading.style.display = "none";
  }

  showFallback() {
    const loading = this.mapContainer.querySelector(".map-loading");
    if (loading) {
      loading.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <p style="color: #DB1A1A; font-weight: bold; margin-bottom: 8px;">Ubicación no disponible de forma interactiva.</p>
          <p style="font-size: 12px; color: #666;">Dirección: Parque La Inmaculada, Las Palmas, Barranquilla</p>
        </div>
      `;
    }
  }
}

// Footer & Utils
class SiteUtilities {
  constructor() {
    this.init();
  }

  init() {
    this.setCurrentYear();
    this.handleReducedMotion();
  }

  setCurrentYear() {
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  handleReducedMotion() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreferences = () => {
      const reduced = prefersReducedMotion.matches;
      document.documentElement.style.setProperty("--t-base", reduced ? "0ms" : "");
      document.documentElement.style.setProperty("--t-slow", reduced ? "0ms" : "");
    };
    applyMotionPreferences();
    prefersReducedMotion.addEventListener("change", applyMotionPreferences);
  }
}

// App
class App {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bootstrap());
    } else {
      this.bootstrap();
    }
  }

  bootstrap() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      new Navigation();
      new HeroParticles();
      new AnimationObserver();
      new TeamDock();
      new Accordion();
      new TestimonialsMarquee();
      new VisualEffects();
      new MapLibreIntegration();
      new SiteUtilities();

      logger.log("Application initialized successfully.");
    } catch (error) {
      logger.error(`Critical initialization failure: ${error.message}`);
    }
  }
}
new App();