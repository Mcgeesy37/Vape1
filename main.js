/* ================================================
   VOLUTE — MAIN.JS
   Organic Smoke Engine + All Interactions
   ================================================ */

// =============================================
// 1. SMOKE CANVAS ENGINE
// =============================================
const canvas = document.getElementById('smokeCanvas');
const ctx    = canvas.getContext('2d');
let W = canvas.width  = window.innerWidth;
let H = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
});

// Smoke particle class — organic, warm, volumetric
class Puff {
  constructor(options = {}) {
    const o = options;
    this.x       = o.x ?? Math.random() * W;
    this.y       = o.y ?? H + 30;
    this.vx      = o.vx ?? (Math.random() - 0.5) * 0.5;
    this.vy      = o.vy ?? -(Math.random() * 0.8 + 0.2);
    this.r       = o.r ?? Math.random() * 60 + 30;
    this.maxR    = o.maxR ?? this.r * (Math.random() * 2 + 2.5);
    this.life    = 0;
    this.maxLife = o.maxLife ?? Math.random() * 300 + 200;
    this.rot     = Math.random() * Math.PI * 2;
    this.rotV    = (Math.random() - 0.5) * 0.007;
    // Warm color palette: gold, cream, amber, dark brown
    const palettes = [
      [200, 169, 110],  // gold
      [220, 200, 160],  // cream
      [180, 140,  80],  // amber
      [160, 120,  70],  // deep amber
      [240, 220, 180],  // light cream
    ];
    const weights = o.isHero
      ? [0.45, 0.25, 0.15, 0.08, 0.07]
      : [0.30, 0.30, 0.20, 0.10, 0.10];
    let rnd = Math.random(), cum = 0;
    this.col = palettes[0];
    for (let i = 0; i < palettes.length; i++) {
      cum += weights[i];
      if (rnd < cum) { this.col = palettes[i]; break; }
    }
    this.isHero = o.isHero || false;
  }

  update() {
    this.life++;
    this.x  += this.vx;
    this.y  += this.vy;
    this.vx += (Math.random() - 0.5) * 0.05;
    this.vy *= 0.998;
    this.r   = Math.min(this.r * 1.008, this.maxR);
    this.rot += this.rotV;
    const p = this.life / this.maxLife;
    this.opacity = p < 0.15
      ? (p / 0.15) * 0.13
      : (1 - (p - 0.15) / 0.85) * 0.13;
    if (this.isHero) this.opacity *= 1.8;
  }

  draw() {
    if (this.opacity <= 0.002) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    const [r, g, b] = this.col;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r);
    grad.addColorStop(0,   `rgba(${r},${g},${b},${this.opacity})`);
    grad.addColorStop(0.45,`rgba(${r},${g},${b},${this.opacity * 0.55})`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    // Slightly elliptical for organic feel
    ctx.scale(1, 0.7 + Math.sin(this.life * 0.03) * 0.15);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  dead() { return this.life >= this.maxLife; }
}

const puffs = [];
let frame = 0;

// Bottle position for hero smoke
function getBottlePos() {
  const el = document.getElementById('bottleMist');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + 20 };
}

function spawnSmoke() {
  frame++;

  // Ambient background smoke — slow, large, atmospheric
  if (frame % 8 === 0) {
    for (let i = 0; i < 2; i++) {
      puffs.push(new Puff({
        x: Math.random() * W,
        y: H + 40,
        r: Math.random() * 80 + 40,
        vy: -(Math.random() * 0.4 + 0.1),
        vx: (Math.random() - 0.5) * 0.3,
        maxLife: Math.random() * 400 + 300,
      }));
    }
  }

  // Hero bottle smoke — denser, rises from bottle
  const bp = getBottlePos();
  if (bp && frame % 3 === 0) {
    for (let i = 0; i < 2; i++) {
      puffs.push(new Puff({
        x: bp.x + (Math.random() - 0.5) * 16,
        y: bp.y,
        r: Math.random() * 20 + 8,
        maxR: Math.random() * 90 + 50,
        vy: -(Math.random() * 1.6 + 0.8),
        vx: (Math.random() - 0.5) * 0.8,
        maxLife: Math.random() * 180 + 120,
        isHero: true,
      }));
    }
  }

  if (puffs.length > 800) puffs.splice(0, 60);
}

function tick() {
  ctx.clearRect(0, 0, W, H);
  spawnSmoke();
  for (let i = puffs.length - 1; i >= 0; i--) {
    puffs[i].update();
    puffs[i].draw();
    if (puffs[i].dead()) puffs.splice(i, 1);
  }
  requestAnimationFrame(tick);
}
tick();

// Burst smoke on click anywhere
document.addEventListener('click', (e) => {
  for (let i = 0; i < 16; i++) {
    puffs.push(new Puff({
      x: e.clientX + (Math.random() - 0.5) * 24,
      y: e.clientY + (Math.random() - 0.5) * 24,
      r: Math.random() * 16 + 6,
      maxR: Math.random() * 70 + 40,
      vy: -(Math.random() * 2.5 + 1),
      vx: (Math.random() - 0.5) * 2,
      maxLife: Math.random() * 140 + 80,
      isHero: true,
    }));
  }
}, { passive: true });

// Hover smoke on product cards
document.querySelectorAll('.prod-card').forEach(card => {
  card.addEventListener('mouseenter', (e) => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.3;
    for (let i = 0; i < 10; i++) {
      puffs.push(new Puff({
        x: cx + (Math.random() - 0.5) * rect.width * 0.6,
        y: cy + (Math.random() - 0.5) * 30,
        r: Math.random() * 20 + 8,
        maxR: Math.random() * 60 + 30,
        vy: -(Math.random() * 1.2 + 0.4),
        vx: (Math.random() - 0.5) * 1,
        maxLife: Math.random() * 120 + 80,
        isHero: false,
      }));
    }
  });
});

// Hover smoke on flavor items
document.querySelectorAll('.flavor-item').forEach(item => {
  item.addEventListener('mouseenter', (e) => {
    const rect = item.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      puffs.push(new Puff({
        x: rect.right - 100 + (Math.random() - 0.5) * 80,
        y: rect.top + rect.height / 2 + (Math.random() - 0.5) * 20,
        r: Math.random() * 14 + 6,
        maxR: Math.random() * 50 + 25,
        vy: -(Math.random() * 1 + 0.3),
        vx: (Math.random() - 0.5) * 0.8,
        maxLife: Math.random() * 100 + 60,
        isHero: false,
      }));
    }
  });
});

// =============================================
// 2. NAVBAR SCROLL
// =============================================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// =============================================
// 3. SCROLL REVEAL
// =============================================
const revealEls = document.querySelectorAll(
  '.about-card, .prod-card, .flavor-item, .hn, .visit-text, .visit-form-wrap, .section-heading, .flavors-header, .products-header'
);

revealEls.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = ((i % 6) * 0.08) + 's';
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

// =============================================
// 4. COUNTER ANIMATION (hero numbers)
// =============================================
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(ease * target).toLocaleString('de-DE');
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('de-DE');
  };
  requestAnimationFrame(update);
}

const counterEls = document.querySelectorAll('.hn-val');
let countersStarted = false;
const counterObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !countersStarted) {
    countersStarted = true;
    counterEls.forEach(el => {
      animateCounter(el, parseInt(el.dataset.target), 2000);
    });
  }
}, { threshold: 0.4 });

const heroAside = document.querySelector('.hero-aside');
if (heroAside) counterObserver.observe(heroAside);

// =============================================
// 5. CART TOAST
// =============================================
const cartToast = document.getElementById('cartToast');
const toastText = cartToast.querySelector('.toast-text');
let toastTimeout;

document.querySelectorAll('.prod-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const name = btn.dataset.name || 'Produkt';
    toastText.textContent = `„${name}" wurde hinzugefügt`;

    // Big smoke burst from button
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top;
    for (let i = 0; i < 24; i++) {
      puffs.push(new Puff({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy,
        r: Math.random() * 20 + 6,
        maxR: Math.random() * 90 + 50,
        vy: -(Math.random() * 3 + 1.5),
        vx: (Math.random() - 0.5) * 3,
        maxLife: Math.random() * 150 + 100,
        isHero: true,
      }));
    }

    cartToast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => cartToast.classList.remove('show'), 3000);
  });
});

// =============================================
// 6. NEWSLETTER FORM
// =============================================
const formBtn     = document.getElementById('formBtn');
const emailInput  = document.getElementById('emailInput');
const formSuccess = document.getElementById('formSuccess');

if (formBtn) {
  formBtn.addEventListener('click', () => {
    const val = emailInput.value.trim();
    if (!val || !val.includes('@')) {
      emailInput.style.borderColor = 'rgba(200,100,100,0.5)';
      emailInput.focus();
      setTimeout(() => emailInput.style.borderColor = '', 1500);
      return;
    }
    // Success
    formBtn.textContent = '✓ Gesendet';
    formBtn.style.background = '#8a7050';
    formBtn.disabled = true;
    formSuccess.classList.add('show');

    // Big smoke celebration
    const rect = formBtn.getBoundingClientRect();
    for (let i = 0; i < 30; i++) {
      puffs.push(new Puff({
        x: rect.left + Math.random() * rect.width,
        y: rect.top,
        r: Math.random() * 18 + 6,
        maxR: Math.random() * 100 + 60,
        vy: -(Math.random() * 3 + 1),
        vx: (Math.random() - 0.5) * 4,
        maxLife: Math.random() * 180 + 120,
        isHero: true,
      }));
    }
  });
}

// =============================================
// 7. BOTTLE CLICK — SMOKE BURST
// =============================================
const bottle = document.getElementById('smokeBottle');
if (bottle) {
  bottle.addEventListener('click', () => {
    const rect = bottle.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top;
    for (let i = 0; i < 28; i++) {
      puffs.push(new Puff({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 10,
        r: Math.random() * 24 + 10,
        maxR: Math.random() * 120 + 70,
        vy: -(Math.random() * 2.5 + 1),
        vx: (Math.random() - 0.5) * 2,
        maxLife: Math.random() * 200 + 150,
        isHero: true,
      }));
    }
  });
}

// =============================================
// 8. HERO BUTTON — SMOKE ON HOVER
// =============================================
const heroBtn = document.getElementById('heroBtn');
if (heroBtn) {
  heroBtn.addEventListener('mouseenter', () => {
    const rect = heroBtn.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      puffs.push(new Puff({
        x: rect.left + Math.random() * rect.width,
        y: rect.top + rect.height / 2,
        r: Math.random() * 10 + 4,
        maxR: Math.random() * 50 + 25,
        vy: -(Math.random() * 1.5 + 0.5),
        vx: (Math.random() - 0.5) * 1.5,
        maxLife: Math.random() * 100 + 60,
        isHero: false,
      }));
    }
  });
}

// =============================================
// 9. PARALLAX HERO BG TEXT
// =============================================
const bgText = document.querySelector('.hero-bg-text');
window.addEventListener('scroll', () => {
  if (bgText) {
    const y = window.scrollY;
    bgText.style.transform = `translate(-50%, calc(-50% + ${y * 0.25}px))`;
    bgText.style.opacity = Math.max(0, 1 - y / 500);
  }
}, { passive: true });

// =============================================
// 10. LOUNGE FEATURE ITEMS SMOKE
// =============================================
document.querySelectorAll('.af-item').forEach(item => {
  item.addEventListener('mouseenter', (e) => {
    const rect = item.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      puffs.push(new Puff({
        x: rect.left + 20 + Math.random() * 20,
        y: rect.top + rect.height / 2,
        r: Math.random() * 10 + 4,
        maxR: Math.random() * 40 + 20,
        vy: -(Math.random() * 1 + 0.3),
        vx: (Math.random() - 0.5) * 0.8,
        maxLife: Math.random() * 80 + 50,
        isHero: false,
      }));
    }
  });
});

// =============================================
// 11. PAGE LOAD SEQUENCE
// =============================================
window.addEventListener('load', () => {
  // Initial smoke burst from center-bottom
  setTimeout(() => {
    for (let i = 0; i < 20; i++) {
      puffs.push(new Puff({
        x: W * 0.4 + Math.random() * W * 0.2,
        y: H,
        r: Math.random() * 40 + 20,
        maxR: Math.random() * 140 + 80,
        vy: -(Math.random() * 1.2 + 0.4),
        vx: (Math.random() - 0.5) * 0.6,
        maxLife: Math.random() * 350 + 250,
        isHero: true,
      }));
    }
  }, 400);
});

console.log('%cVOLUTE\n%cPremium Vapor Lounge · Berlin', 
  'color:#c8a96e;font-size:32px;font-family:serif;font-style:italic;',
  'color:#7a6f62;font-size:12px;font-family:monospace;letter-spacing:2px;'
);
