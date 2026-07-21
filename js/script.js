const typed = new Typed(".multiple-text", {
    strings: [
        "Eu sou uma Dev em formação...",
        "Eu sou Musicista...",
        "Eu sou Estudante..."
    ],
    typeSpeed: 100,
    backSpeed: 100,
    backDelay: 1000,
    loop: true,
});

const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const themeIcon = document.querySelector('.theme-icon');

function toggleTheme() {
    body.classList.toggle('light-mode');
    const isLightMode = body.classList.contains('light-mode');

    if (isLightMode) {
        themeIcon.className = 'bx bx-moon theme-icon';
        localStorage.setItem('theme', 'light');
    } else {
        themeIcon.className = 'bx bx-sun theme-icon';
        localStorage.setItem('theme', 'dark');
    }
}

themeToggle.addEventListener('click', toggleTheme);

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        themeIcon.className = 'bx bx-moon theme-icon';
    } else {
        body.classList.remove('light-mode');
        themeIcon.className = 'bx bx-sun theme-icon'
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSavedTheme);
} else {
    loadSavedTheme();
}

/* Simple particle background for the header */
(function() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w = 0, h = 0;
    let DPR = window.devicePixelRatio || 1;
    // Use 'fluid' effect: grid-based fluid simulation
    const EFFECT = 'fluid';
    const LIQUID_CONFIG = {
        count: 9,
        sizeMin: 20,
        sizeMax: 56,
        spring: 0.12,
        friction: 0.82,
        blur: 4
    };
    let pointer = { x: w/2, y: h/2, last: 0 };
    const INACTIVITY_MS = 900; // time after last move to hide effect

    function getAccent() {
        // Prefer variable set on body (theme overrides), fallback to :root
        const bodyAccent = getComputedStyle(document.body).getPropertyValue('--accent').trim();
        if (bodyAccent) return bodyAccent;
        const rootAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        return rootAccent || '#7c3aed';
    }

    function isLight() {
        return document.body.classList.contains('light-mode');
    }

    function resize() {
        // Ensure canvas covers the full viewport
        const pw = window.innerWidth;
        const ph = window.innerHeight;
        canvas.style.width = pw + 'px';
        canvas.style.height = ph + 'px';
        w = Math.max(1, pw);
        h = Math.max(1, ph);
        canvas.width = Math.max(1, Math.floor(w * DPR));
        canvas.height = Math.max(1, Math.floor(h * DPR));
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        if (EFFECT === 'fluid') setupSim();
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    // --- Fluid simulation (simple grid-based advection) ---
    let sim = {
        scale: 8, // pixels per cell (adjust performance/quality)
        width: 0,
        height: 0,
        size: 0,
        density: null,
        densityPrev: null,
        velX: null,
        velY: null,
        velXPrev: null,
        velYPrev: null
    };

    function IX(x,y) { return x + y * sim.width; }

    function setupSim() {
        sim.scale = Math.max(5, Math.floor(Math.min(10, Math.max(1, Math.floor(Math.max(1, w) / 150)))));
        sim.width = Math.max(16, Math.floor(w / sim.scale));
        sim.height = Math.max(12, Math.floor(h / sim.scale));
        sim.size = sim.width * sim.height;
        sim.density = new Float32Array(sim.size);
        sim.densityPrev = new Float32Array(sim.size);
        sim.velX = new Float32Array(sim.size);
        sim.velY = new Float32Array(sim.size);
        sim.velXPrev = new Float32Array(sim.size);
        sim.velYPrev = new Float32Array(sim.size);
    }

    function splat(x, y, dx, dy, amount) {
        if (!sim.density) return;
        const gx = Math.floor((x / w) * sim.width);
        const gy = Math.floor((y / h) * sim.height);
        const radiusFactor = 0.015;
        const radius = Math.max(1, Math.floor(sim.width * radiusFactor));
        for (let j = -radius; j <= radius; j++) {
            for (let i = -radius; i <= radius; i++) {
                const sx = gx + i;
                const sy = gy + j;
                if (sx < 0 || sx >= sim.width || sy < 0 || sy >= sim.height) continue;
                const idx = IX(sx, sy);
                const dist = Math.sqrt(i*i + j*j);
                const fall = Math.max(0, 1 - dist / (radius+0.1));
                sim.density[idx] += amount * fall * 0.9;
                const velMul = 0.38;
                sim.velX[idx] += dx * velMul * fall;
                sim.velY[idx] += dy * velMul * fall;
            }
        }
    }

    function advect(src, dst, velX, velY, dt) {
        const w0 = sim.width, h0 = sim.height;
        for (let y = 0; y < h0; y++) {
            for (let x = 0; x < w0; x++) {
                const i = IX(x,y);
                let tx = x - velX[i] * dt * 0.5;
                let ty = y - velY[i] * dt * 0.5;
                if (tx < 0.5) tx = 0.5; if (tx > w0 - 1.5) tx = w0 - 1.5;
                if (ty < 0.5) ty = 0.5; if (ty > h0 - 1.5) ty = h0 - 1.5;
                const x0 = Math.floor(tx), y0 = Math.floor(ty);
                const x1 = x0 + 1, y1 = y0 + 1;
                const sx = tx - x0, sy = ty - y0;
                const i00 = IX(x0,y0), i10 = IX(x1,y0), i01 = IX(x0,y1), i11 = IX(x1,y1);
                dst[i] = src[i00] * (1 - sx) * (1 - sy) + src[i10] * sx * (1 - sy) + src[i01] * (1 - sx) * sy + src[i11] * sx * sy;
            }
        }
    }

    function stepSim(dt) {
        if (!sim.density) return;
        // advect velocities
        advect(sim.velX, sim.velXPrev, sim.velX, sim.velY, dt);
        advect(sim.velY, sim.velYPrev, sim.velX, sim.velY, dt);
        // swap
        [sim.velX, sim.velXPrev] = [sim.velXPrev, sim.velX];
        [sim.velY, sim.velYPrev] = [sim.velYPrev, sim.velY];
        // advect density
        advect(sim.density, sim.densityPrev, sim.velX, sim.velY, dt);
        [sim.density, sim.densityPrev] = [sim.densityPrev, sim.density];
        // decay density
        const decay = isLight() ? 0.95 : 0.94;
        for (let i = 0; i < sim.size; i++) sim.density[i] *= decay;
    }

    function renderSim() {
        if (!sim.density) return;
        const scale = sim.scale;
        const accent = particleColor || getAccent() || '#7c3aed';
        const lightMode = isLight();
        const fluidTint = lightMode ? '#a855f7' : accent;
        const shadowTint = lightMode ? '#7c3aed' : accent;
        const highlight = lightMode ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.45)';
        const baseFill = lightMode ? 'rgba(255,255,255,0.02)' : 'rgba(23,23,26,0.08)';
        const dropletRadius = Math.max(2, Math.floor(scale * 0.62));

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = baseFill;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.filter = lightMode ? 'blur(0.3px) saturate(1.08)' : 'blur(0.85px) saturate(1.1)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let j = 0; j < sim.height; j++) {
            for (let i = 0; i < sim.width; i++) {
                const idx = IX(i, j);
                const val = Math.min(1, sim.density[idx]);
                if (val > 0.002) {
                    const px = i * scale + scale * 0.5;
                    const py = j * scale + scale * 0.5;
                    const vx = sim.velX ? sim.velX[idx] : 0;
                    const vy = sim.velY ? sim.velY[idx] : 0;
                    const alpha = lightMode ? Math.min(0.78, val * 1.05) : Math.min(0.28, val * 0.58);
                    const gradient = ctx.createRadialGradient(px, py, 0, px, py, dropletRadius);
                    gradient.addColorStop(0, hexToRgba(fluidTint, alpha));
                    gradient.addColorStop(0.65, hexToRgba(fluidTint, alpha * 0.55));
                    gradient.addColorStop(1, hexToRgba(lightMode ? shadowTint : accent, 0));
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(px, py, dropletRadius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = hexToRgba(fluidTint, lightMode ? alpha * 0.28 : alpha * 0.22);
                    ctx.lineWidth = Math.max(1, dropletRadius * 0.62);
                    ctx.beginPath();
                    ctx.moveTo(px - vx * scale * 0.45, py - vy * scale * 0.45);
                    ctx.lineTo(px + vx * scale * 0.45, py + vy * scale * 0.45);
                    ctx.stroke();
                }
            }
        }

        ctx.globalCompositeOperation = lightMode ? 'lighter' : 'screen';
        ctx.filter = lightMode ? 'blur(0.16px)' : 'blur(0.28px)';
        for (let j = 0; j < sim.height; j++) {
            for (let i = 0; i < sim.width; i++) {
                const idx = IX(i, j);
                const val = Math.min(1, sim.density[idx]);
                if (val > 0.03) {
                    const px = i * scale + scale * 0.5;
                    const py = j * scale + scale * 0.5;
                    const glowAlpha = lightMode ? Math.min(0.22, val * 0.28) : Math.min(0.1, val * 0.14);
                    const glow = ctx.createRadialGradient(px, py, 0, px, py, Math.max(2, dropletRadius * 0.85));
                    glow.addColorStop(0, hexToRgba(highlight, glowAlpha));
                    glow.addColorStop(1, hexToRgba(highlight, 0));
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(2, dropletRadius * 0.85), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    }

    // seed the simulation with a few gentle splats so effect is visible on load
    function seedSim() {
        if (!sim.density) return;
        const cx = w / 2, cy = h / 2;
        // central gentle splat
        splat(cx, cy, 0, 0, isLight() ? 0.8 : 0.5);
        // a few random side splats
        for (let i = 0; i < 4; i++) {
            const rx = Math.random() * w;
            const ry = Math.random() * h * 0.6 + h * 0.2;
            const dx = (Math.random() - 0.5) * 40;
            const dy = (Math.random() - 0.5) * 40;
            splat(rx, ry, dx, dy, isLight() ? 0.4 + Math.random()*0.6 : 0.2 + Math.random()*0.4);
        }
    }
    // helper: convert hex or rgb to rgba string with alpha
    function hexToRgba(hex, a) {
        hex = hex.replace('#','');
        if (hex.length === 3) hex = hex.split('').map(h=>h+h).join('');
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r},${g},${b},${a})`;
    }

    let particleColor = getAccent();

    function initParticles() {
        particles = [];
        if (EFFECT === 'liquid') {
            for (let i = 0; i < LIQUID_CONFIG.count; i++) particles.push(new Particle(i));
        } else if (EFFECT === 'fluid') {
            setupSim();
        } else {
            const area = Math.max(1, w * h);
            const count = isLight() ? Math.max(14, Math.round(area / 90000)) : Math.max(18, Math.round(area / 25000));
            for (let i = 0; i < count; i++) particles.push(new Particle());
        }
    }

    let lastTime = performance.now();
    function animate() {
        const now = performance.now();
        const dt = Math.min(32, now - lastTime) / 1000;
        lastTime = now;
        if (EFFECT === 'liquid') {
            ctx.fillStyle = isLight() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
            ctx.fillRect(0, 0, w, h);
            for (let p of particles) { p.update(); p.draw(particleColor); }
        } else if (EFFECT === 'fluid') {
            // step and render simulation
            stepSim(dt);
            renderSim();
        } else {
            ctx.clearRect(0, 0, w, h);
            for (let p of particles) { p.update(); p.draw(particleColor); }
        }
        requestAnimationFrame(animate);
    }

    function updateColor() {
        particleColor = getAccent();
        // recreate particles with new settings when theme changes
        initParticles();
    }

    // Observe theme changes (body class toggle) to update particle color
    const mo = new MutationObserver(() => updateColor());
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Pointer tracking (listen on window because canvas has pointer-events:none)
    function onPointerMove(e) {
        const nx = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || pointer.x;
        const ny = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || pointer.y;
        const now = Date.now();
        // compute movement delta in pixels
        const dx = nx - (pointer.prevX || nx);
        const dy = ny - (pointer.prevY || ny);
        pointer.x = nx; pointer.y = ny;
        pointer.prevX = nx; pointer.prevY = ny;
        pointer.last = now;
        if (EFFECT === 'fluid') {
            // amount scaled by movement speed, clamp for subtlety
            const speed = Math.hypot(dx, dy);
            const amount = Math.min(1.0, Math.max(0.06, speed / 48));
            splat(pointer.x, pointer.y, dx * 0.42, dy * 0.42, amount);
            if (speed > 8) {
                splat(pointer.x - dx * 0.12, pointer.y - dy * 0.12, dx * 0.22, dy * 0.22, amount * 0.52);
            }
        }
    }
    function onPointerLeave() { /* do nothing, inactivity handled by timestamp */ }
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseout', onPointerLeave);
    window.addEventListener('touchend', onPointerLeave);

    function start() {
        resize();
        initParticles();
        // initialize effect color from current theme variables
        updateColor();
        if (EFFECT === 'fluid') seedSim();
        animate();
    }

    window.addEventListener('resize', () => { resize(); initParticles(); });

    // start when DOM ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') start();
    else document.addEventListener('DOMContentLoaded', start);

})();