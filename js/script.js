const multipleText = document.querySelector(".multiple-text");

if (multipleText && window.Typed) {
    new Typed(".multiple-text", {
        strings: [
            "Desenvolvedora em formação.",
            "Estudante de ADS.",
            "Criativa e orientada a soluções."
        ],
        typeSpeed: 70,
        backSpeed: 50,
        backDelay: 1200,
        loop: true
    });
}

const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.querySelector(".theme-icon");

function setThemeIcon(isLightMode) {
    if (!themeIcon) return;
    themeIcon.className = isLightMode ? "bx bx-moon theme-icon" : "bx bx-sun theme-icon";
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme");
    const isLightMode = savedTheme === "light";
    body.classList.toggle("light-mode", isLightMode);
    setThemeIcon(isLightMode);
}

function toggleTheme() {
    body.classList.toggle("light-mode");
    const isLightMode = body.classList.contains("light-mode");
    setThemeIcon(isLightMode);
    localStorage.setItem("theme", isLightMode ? "light" : "dark");
}

if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
}

applySavedTheme();

const navbarCollapse = document.getElementById("navbarNav");
const navLinks = document.querySelectorAll("#navbarNav .nav-link");

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        if (!navbarCollapse || !navbarCollapse.classList.contains("show")) return;
        const collapseInstance = bootstrap.Collapse.getOrCreateInstance(navbarCollapse);
        collapseInstance.hide();
    });
});

const sections = document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const id = entry.target.getAttribute("id");
                const link = document.querySelector(`#navbarNav .nav-link[href="#${id}"]`);
                if (!link) return;

                if (entry.isIntersecting) {
                    navLinks.forEach((item) => item.classList.remove("is-active"));
                    link.classList.add("is-active");
                }
            });
        },
        {
            rootMargin: "-45% 0px -45% 0px",
            threshold: 0.01
        }
    );

    sections.forEach((section) => observer.observe(section));
}

(function setupCanvasBackground() {
    const canvas = document.getElementById("particles");
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = [];
    const pointCount = 34;
    let width = 0;
    let height = 0;

    function getAccentColor() {
        return getComputedStyle(document.body).getPropertyValue("--color-accent").trim() || "#d97732";
    }

    function hexToRgba(hex, alpha) {
        const value = hex.replace("#", "");
        const normalized = value.length === 3 ? value.split("").map((n) => n + n).join("") : value;
        const num = parseInt(normalized, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function createPoints() {
        points.length = 0;
        for (let i = 0; i < pointCount; i += 1) {
            points.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22
            });
        }
    }

    function update() {
        const accent = getAccentColor();
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < points.length; i += 1) {
            const p = points[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.fillStyle = hexToRgba(accent, 0.38);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < points.length; i += 1) {
            for (let j = i + 1; j < points.length; j += 1) {
                const a = points[i];
                const b = points[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 130) {
                    const alpha = (1 - dist / 130) * 0.12;
                    ctx.strokeStyle = hexToRgba(accent, alpha);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(update);
    }

    resize();
    createPoints();
    update();

    window.addEventListener("resize", () => {
        resize();
        createPoints();
    });
})();