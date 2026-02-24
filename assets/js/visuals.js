/**
 * SOVEREIGN SYSTEMS // VISUAL CORE v2.0
 * AUTHOR: Sovereign Architect
 */

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initEncryption();
    initGlitchLoop();
});

/* --- 1. BREATHING ABYSS (CANVAS PARTICLES) --- */
function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'abyss-canvas';
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '-1',
        pointerEvents: 'none',
        opacity: '0.4' // Subtle
    });
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = (Math.random() - 0.5) * 0.2;
            this.size = Math.random() * 2;
            this.alpha = Math.random() * 0.5;
            this.flashSpeed = 0.01 + Math.random() * 0.02;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha += Math.sin(Date.now() * this.flashSpeed) * 0.002;

            if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                this.reset();
            }
        }

        draw() {
            ctx.fillStyle = `rgba(16, 185, 129, ${Math.abs(this.alpha)})`; // Emerald
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        resize();
        for (let i = 0; i < 60; i++) particles.push(new Particle()); // Low count for subtlety
        animate();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
}

/* --- 2. TEXT ENCRYPTION EFFECT --- */
function initEncryption() {
    const targets = document.querySelectorAll('[data-encrypt]');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%&';

    targets.forEach(el => {
        const originalText = el.innerText;
        let iterations = 0;

        const interval = setInterval(() => {
            el.innerText = originalText
                .split('')
                .map((letter, index) => {
                    if (index < iterations) return originalText[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');

            if (iterations >= originalText.length) clearInterval(interval);
            iterations += 1 / 3; // Speed control
        }, 30);
    });
}

/* --- 3. NARRATIVE GLITCH LOOP --- */
function initGlitchLoop() {
    const glitchTarget = document.getElementById('glitch-text');
    if (!glitchTarget) return;

    setInterval(() => {
        triggerGlitch(glitchTarget);
    }, 45000); // Every 45s
}

function triggerGlitch(el) {
    const original = el.innerHTML;
    const glitchWord = "VERTICAL WAR";

    // Phase 1: Glitch On
    document.body.classList.add('glitch-active');
    el.innerText = glitchWord;
    el.style.color = '#ef4444'; // Red-500
    el.style.textShadow = '2px 0 #fff, -2px 0 #000';

    // Phase 2: Glitch Off (Quick)
    setTimeout(() => {
        document.body.classList.remove('glitch-active');
        el.innerHTML = original;
        el.style.color = '';
        el.style.textShadow = '';

        // Re-run encryption to "stabilize"
        initEncryption();
    }, 200);
}
