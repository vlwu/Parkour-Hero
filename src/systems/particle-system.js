import { eventBus } from '../utils/event-bus.js';

export class ParticleSystem {
    constructor(assets) {
        this.assets = assets;
        this.activeParticles = [];
        this.inactivePool = [];
        this.poolSize = 300; // Pre-allocate 300 particles

        for (let i = 0; i < this.poolSize; i++) {
            this.inactivePool.push({});
        }

        eventBus.subscribe('createParticles', (data) => this.create(data));
    }


    create({ x, y, type, direction = 'right', particleSpeed = null }) {
        const particleConfigs = {
            dash: { count: 10, baseSpeed: 150, spriteKey: 'dust_particle', life: 0.4, gravity: 50 },
            double_jump: { count: 7, baseSpeed: 100, spriteKey: 'dust_particle', life: 0.4, gravity: 50 },
            sand: { count: 2, baseSpeed: 20, spriteKey: 'sand_particle', life: 0.5, gravity: 120 },
            mud: { count: 2, baseSpeed: 15, spriteKey: 'mud_particle', life: 0.6, gravity: 100 },
            ice: { count: 2, baseSpeed: 25, spriteKey: 'ice_particle', life: 0.4, gravity: 20 },
            walk_dust: { count: 1, baseSpeed: 15, spriteKey: 'dust_particle', life: 0.4, gravity: 80 },
            jump_trail: { count: 1, baseSpeed: 10, spriteKey: 'dust_particle', life: 0.3, gravity: 20 },
            fan_push: { count: 2, baseSpeed: 120, spriteKey: 'dust_particle', life: 0.7, gravity: 0 },
        };

        const config = particleConfigs[type];
        if (!config) return;

        for (let i = 0; i < config.count; i++) {
            if (this.inactivePool.length === 0) {
                // Fallback: if the pool is empty, create a new particle.
                // This prevents crashes but indicates the pool might need to be larger.
                this.inactivePool.push({});
            }

            const p = this.inactivePool.pop();

            let angle;
            const currentBaseSpeed = particleSpeed || config.baseSpeed;
            let speed = currentBaseSpeed * (0.8 + Math.random() * 0.4);


            if (type === 'dash') {
                angle = (direction === 'right' ? Math.PI : 0) + (Math.random() - 0.5) * (Math.PI / 2);
            } else if (type === 'double_jump') {
                angle = (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 3);
            } else if (type === 'jump_trail') {
                angle = (Math.random() * Math.PI * 2);
                speed *= (Math.random() * 0.5);
            } else if (type === 'fan_push') {
                let baseAngle = 0;
                switch (direction) {
                    case 'up': baseAngle = -Math.PI / 2; break;
                    case 'left': baseAngle = Math.PI; break;
                    case 'down': baseAngle = Math.PI / 2; break;
                    case 'right': default: baseAngle = 0; break;
                }
                angle = baseAngle + (Math.random() - 0.5) * (Math.PI / 6);
            }
            else {
                angle = - (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 4);
            }

            const life = config.life + Math.random() * 0.3;

            // Reset the particle's properties instead of creating a new object
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = life;
            p.initialLife = life;
            p.size = 5 + Math.random() * 4;
            p.alpha = 1.0;
            p.spriteKey = config.spriteKey;
            p.gravity = config.gravity;

            this.activeParticles.push(p);
        }
    }

    update(dt) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.life -= dt;

            if (p.life <= 0) {
                // Move the dead particle from the active list to the inactive pool
                const recycledParticle = this.activeParticles.splice(i, 1)[0];
                this.inactivePool.push(recycledParticle);
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += (p.gravity || 50) * dt;
                p.alpha = Math.max(0, p.life / p.initialLife);
            }
        }
    }

    render(ctx, camera) {
        if (this.activeParticles.length === 0) return;

        ctx.save();
        camera.apply(ctx);

        for (const p of this.activeParticles) {
            const sprite = this.assets[p.spriteKey] || this.assets.dust_particle;
            if (!sprite || !camera.isVisible(p.x, p.y, p.size, p.size)) continue;
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }

        camera.restore(ctx);
        ctx.restore();
    }
}