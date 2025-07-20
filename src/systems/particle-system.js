import { eventBus } from '../utils/event-bus.js';

export class ParticleSystem {
    constructor(assets) {
        this.assets = assets;
        this.particles = [];
        eventBus.subscribe('createParticles', (data) => this.create(data));
    }

    create({ x, y, type, direction = 'right' }) {
        const particleConfigs = {
            dash: { count: 10, baseSpeed: 150, spriteKey: 'dust_particle', life: 0.4, gravity: 50 },
            double_jump: { count: 7, baseSpeed: 100, spriteKey: 'dust_particle', life: 0.4, gravity: 50 },
            sand: { count: 2, baseSpeed: 20, spriteKey: 'sand_particle', life: 0.5, gravity: 120 },
            mud: { count: 2, baseSpeed: 15, spriteKey: 'mud_particle', life: 0.6, gravity: 100 },
            ice: { count: 2, baseSpeed: 25, spriteKey: 'ice_particle', life: 0.4, gravity: 20 },
            walk_dust: { count: 1, baseSpeed: 15, spriteKey: 'dust_particle', life: 0.4, gravity: 80 },
            jump_trail: { count: 1, baseSpeed: 10, spriteKey: 'dust_particle', life: 0.3, gravity: 20 }
        };
        
        const config = particleConfigs[type];
        if (!config) return;

        for (let i = 0; i < config.count; i++) {
            let angle;
            let speed = config.baseSpeed + Math.random() * (config.baseSpeed * 0.5);
            
            if (type === 'dash') {
                angle = (direction === 'right' ? Math.PI : 0) + (Math.random() - 0.5) * (Math.PI / 2);
            } else if (type === 'double_jump') {
                angle = (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 3);
            } else if (type === 'jump_trail') {
                // Emit a particle with low velocity to create a "left behind" trail effect.
                angle = (Math.random() * Math.PI * 2);
                speed *= (Math.random() * 0.5);
            } else {
                // Default "kick up" effect for walking on sand, mud, and dust.
                angle = - (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 4);
            }
            
            const life = config.life + Math.random() * 0.3;
            
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life, initialLife: life,
                size: 5 + Math.random() * 4,
                alpha: 1.0,
                spriteKey: config.spriteKey,
                gravity: config.gravity
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += (p.gravity || 50) * dt; 
                p.alpha = Math.max(0, p.life / p.initialLife); 
            }
        }
    }

    render(ctx, camera) {
        if (this.particles.length === 0) return;
        
        // The particle system is rendered after the main scene,
        // so it needs to apply the camera transform itself.
        ctx.save();
        camera.apply(ctx);

        for (const p of this.particles) {
            const sprite = this.assets[p.spriteKey] || this.assets.dust_particle;
            if (!sprite || !camera.isVisible(p.x, p.y, p.size, p.size)) continue;
            ctx.globalAlpha = p.alpha;
            ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        
        camera.restore(ctx);
        ctx.restore(); // Restore to the state before camera transform
    }
}