import { eventBus } from '../utils/event-bus.js';
import vertexShaderSource from '../shaders/particle.vert?raw';
import fragmentShaderSource from '../shaders/particle.frag?raw';

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r, g, b, 1.0];
}

export class ParticleSystemWebGL {
    constructor(gl, assets) {
        this.gl = gl;
        this.assets = assets;

        this.activeParticles = [];
        this.inactivePool = [];
        this.poolSize = 1000;

        for (let i = 0; i < this.poolSize; i++) {
            this.inactivePool.push({});
        }

        this.program = null;
        this.uniformLocations = {};
        this.quadBuffer = null;
        this.texCoordBuffer = null;
        this.particleBuffer = null;
        this.vao = null;
        this.textures = {};

        this._setupWebGLResources();
        this.syncTextures();

        eventBus.subscribe('createParticles', (data) => this.create(data));
        eventBus.subscribe('resetEffects', () => this.reset());
    }

    _compileShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    _createProgram(vsSource, fsSource) {
        const gl = this.gl;
        const vertexShader = this._compileShader(vsSource, gl.VERTEX_SHADER);
        const fragmentShader = this._compileShader(fsSource, gl.FRAGMENT_SHADER);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    _setupWebGLResources() {
        const gl = this.gl;
        this.program = this._createProgram(vertexShaderSource, fragmentShaderSource);

        this.uniformLocations = {
            projection: gl.getUniformLocation(this.program, 'u_projection'),
            texture: gl.getUniformLocation(this.program, 'u_texture'),
        };

        const quadVertices = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]);
        const texCoords = new Float32Array([0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0]);

        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

        this.particleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
        
        // Stride: pos(2) + size(1) + alpha(1) + tex(4) + color(4) + shape(1) = 13 floats
        const strideBytes = 13 * Float32Array.BYTES_PER_ELEMENT;
        gl.bufferData(gl.ARRAY_BUFFER, this.poolSize * strideBytes, gl.DYNAMIC_DRAW);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
        const instanceStride = 13 * 4;

        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, instanceStride, 0);
        gl.vertexAttribDivisor(2, 1);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, instanceStride, 8);
        gl.vertexAttribDivisor(3, 1);

        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 1, gl.FLOAT, false, instanceStride, 12);
        gl.vertexAttribDivisor(4, 1);

        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, instanceStride, 16);
        gl.vertexAttribDivisor(5, 1);
        
        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, instanceStride, 32);
        gl.vertexAttribDivisor(6, 1);

        gl.enableVertexAttribArray(7);
        gl.vertexAttribPointer(7, 1, gl.FLOAT, false, instanceStride, 48);
        gl.vertexAttribDivisor(7, 1);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _createTexture(image) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return {
            glTexture: texture,
            width: image.width,
            height: image.height
        };
    }

    syncTextures() {
        const textureKeys = ['dust_particle', 'sand_particle', 'mud_particle', 'ice_particle', 'slime_particles', 'snail_die', 'radish_leaves', 'bee_bullet_pieces', 'plant_bullet_pieces', 'ghost_particles'];
        for (const key of textureKeys) {
            if (this.assets[key] && !this.textures[key]) {
                this.textures[key] = this._createTexture(this.assets[key]);
            }
        }
    }

    create({ x, y, type, direction = 'right', particleSpeed = null, leafIndex = 0, z = 0 }) {
        const particleConfigs = {
            // Gameplay default effects
            dash: { count: 15, baseSpeed: 180, spriteKey: 'dust_particle', life: 0.5, gravity: 50, size: 12 },
            double_jump: { count: 12, baseSpeed: 120, spriteKey: 'dust_particle', life: 0.5, gravity: 50, size: 12 },
            sand: { count: 4, baseSpeed: 30, spriteKey: 'sand_particle', life: 0.6, gravity: 120, size: 8 },
            mud: { count: 4, baseSpeed: 25, spriteKey: 'mud_particle', life: 0.7, gravity: 100, size: 8 },
            mud_splash: { count: 15, baseSpeed: 220, spriteKey: 'mud_particle', life: 0.9, gravity: 400, size: 10 },
            ice: { count: 5, baseSpeed: 100, spriteKey: 'ice_particle', life: 0.7, gravity: 250, size: 8 },
            walk_dust: { count: 2, baseSpeed: 20, spriteKey: 'dust_particle', life: 0.5, gravity: 80, size: 10 },
            enemy_walk_dust: { count: 3, baseSpeed: 25, spriteKey: 'dust_particle', life: 0.6, gravity: 40, size: 10 },
            jump_trail: { count: 2, baseSpeed: 15, spriteKey: 'dust_particle', life: 0.4, gravity: 20, size: 8 },
            fan_push: { count: 4, baseSpeed: 150, spriteKey: 'dust_particle', life: 0.8, gravity: 0, size: 10 },
            enemy_death: { count: 20, baseSpeed: 150, spriteKey: 'dust_particle', life: 0.7, gravity: 150, size: 14 },
            
            slime_puddle: { count: 1, baseSpeed: 0, spriteKey: 'slime_particles', life: 3.0, gravity: 0, animation: { frameCount: 4, frameSpeed: 0.2 } },
            ghost_particles: { count: 1, baseSpeed: 20, spriteKey: 'ghost_particles', life: 2.0, gravity: 0, animation: { frameCount: 4, frameSpeed: 0.1 }, size: 24 },
            snail_flee: { count: 1, baseSpeed: 250, spriteKey: 'snail_die', life: 1.5, gravity: 800, size: 38 },
            wing_flap: { count: 1, baseSpeed: 40, spriteKey: 'dust_particle', life: 0.3, gravity: 30, size: 10 },
            radish_leaf: { count: 1, baseSpeed: 120, spriteKey: 'radish_leaves', life: 0.8, gravity: 200, size: 16 },
            bee_bullet_pieces: { count: 1, baseSpeed: 120, spriteKey: 'bee_bullet_pieces', life: 0.8, gravity: 200, size: 16 },
            plant_bullet_pieces: { count: 1, baseSpeed: 120, spriteKey: 'plant_bullet_pieces', life: 0.8, gravity: 200, size: 16 },
            
            // Cosmetics - Dash Trails
            default_dash: { count: 15, baseSpeed: 180, spriteKey: 'dust_particle', life: 0.5, gravity: 50, size: 12 },
            phantom_dash: { count: 1, baseSpeed: 0, spriteKey: 'dust_particle', life: 0.5, gravity: -10, color: [0.6, 0.2, 1.0, 0.8], size: 24 },
            rainbow_dash: { count: 3, baseSpeed: 50, spriteKey: 'dust_particle', life: 0.5, gravity: 20, behavior: 'rainbow' },
            pixel_dash: { count: 6, baseSpeed: 0, spriteKey: 'dust_particle', life: 0.35, gravity: 0, size: 10, behavior: 'glitch', shape: 1.0 },
            
            // Cosmetics - Death Effects
            default_death: { count: 25, baseSpeed: 150, spriteKey: 'dust_particle', life: 0.8, gravity: 150, size: 14 },
            shatter_death: { count: 40, baseSpeed: 250, spriteKey: 'dust_particle', life: 1.0, gravity: 300, size: 12, behavior: 'random_color' },
            glitch_death: { count: 25, baseSpeed: 100, spriteKey: 'dust_particle', life: 0.6, gravity: 0, size: 16, behavior: 'glitch', shape: 1.0 },
            implosion_death: { count: 50, baseSpeed: -200, spriteKey: 'dust_particle', life: 0.8, gravity: 0, color: [0.2, 0.0, 0.3, 1.0], behavior: 'implosion', size: 16 },

            // Cosmetics - Auras
            supercharge_aura: { count: 1, baseSpeed: 100, spriteKey: 'dust_particle', life: 0.5, gravity: -150, color: [1.0, 0.8, 0.1, 0.8], size: 16 },
            shadow_aura: { count: 1, baseSpeed: 10, spriteKey: 'dust_particle', life: 0.8, gravity: -5, color: [0.05, 0.0, 0.1, 0.6], size: 24 },
            orbit_node: { count: 1, baseSpeed: 0, spriteKey: 'dust_particle', life: 0.15, gravity: 0, color: [0.0, 1.0, 1.0, 1.0], size: 12 }
        };

        const config = particleConfigs[type];
        if (!config) return;

        for (let i = 0; i < config.count; i++) {
            if (this.inactivePool.length === 0) break;

            const p = this.inactivePool.pop();

            let angle;
            const currentBaseSpeed = particleSpeed || config.baseSpeed;
            let speed = currentBaseSpeed * (0.8 + Math.random() * 0.4);

            if (type === 'ice') {
                const baseAngle = direction === 'right' ? -(3 * Math.PI / 4) : -(Math.PI / 4);
                angle = baseAngle + (Math.random() - 0.5) * (Math.PI / 5);
            }
            else if (type === 'ghost_particles') {
                angle = (direction === 'right' ? Math.PI : 0) + (Math.random() - 0.5) * (Math.PI / 4);
                speed *= 0.5;
            }
            else if (type === 'wing_flap') {
                angle = (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 3);
            }
            else if (type.includes('death') || type === 'radish_leaf' || type === 'bee_bullet_pieces' || type === 'plant_bullet_pieces') angle = Math.random() * Math.PI * 2;
            else if (type.includes('dash')) angle = (direction === 'right' ? Math.PI : 0) + (Math.random() - 0.5) * (Math.PI / 2);
            else if (type === 'double_jump') angle = (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI * 0.8);
            else if (type === 'mud_splash') angle = -(Math.PI / 2) + (Math.random() - 0.5) * (Math.PI * 0.8);
            else if (type === 'jump_trail') { angle = (Math.random() * Math.PI * 2); speed *= (Math.random() * 0.5); }
            else if (type === 'fan_push') {
                let baseAngle = 0;
                switch (direction) {
                    case 'up': baseAngle = -Math.PI / 2; break;
                    case 'left': baseAngle = Math.PI; break;
                    case 'down': baseAngle = Math.PI / 2; break;
                    case 'right': default: baseAngle = 0; break;
                }
                angle = baseAngle + (Math.random() - 0.5) * (Math.PI / 6);
            } else if (type === 'snail_flee') {
                angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 4);
            } else angle = - (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 4);

            p.x = x; 
            p.y = y;
            
            if (config.behavior === 'implosion') {
                const r = 50; 
                p.x = x + Math.cos(angle) * r;
                p.y = y + Math.sin(angle) * r;
            } else if (config.behavior === 'glitch') {
                p.x += (Math.random() - 0.5) * 40;
                p.y += (Math.random() - 0.5) * 40;
            } else if (type === 'shadow_aura') {
                p.x += (Math.random() - 0.5) * 15;
                angle = Math.PI; // Just to face it
                speed = Math.random() * 10;
            }

            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = config.life + Math.random() * 0.3;
            
            p.size = config.size || (type === 'slime_puddle' ? 16 : 10 + Math.random() * 6);
            
            if (type === 'orbit_node') {
                p.size = config.size * (1 + z * 0.5);
                p.baseAlpha = 0.5 + z * 0.5;
            } else {
                p.baseAlpha = 1.0;
            }
            
            p.alpha = 1.0;
            p.spriteKey = config.spriteKey;
            p.gravity = config.gravity;
            p.shape = config.shape || 0.0;
            p.behavior = config.behavior || 'normal';
            p.animation = config.animation ? { ...config.animation, frameTimer: 0, currentFrame: 0 } : null;

            if (type === 'radish_leaf' || type === 'bee_bullet_pieces' || type === 'plant_bullet_pieces') {
                p.leafIndex = leafIndex;
            }

            if (p.behavior === 'random_color') {
                const r = Math.random();
                if (r < 0.33) p.color = [1, 0.2, 0.2, 1];
                else if (r < 0.66) p.color = [0.2, 1, 0.2, 1];
                else p.color = [0.2, 0.2, 1, 1];
            } else if (p.behavior === 'glitch') {
                const saturatedColors = [
                    [1.0, 0.0, 0.0, 1.0], // Red
                    [0.0, 1.0, 0.0, 1.0], // Green
                    [0.0, 0.0, 1.0, 1.0], // Blue
                    [1.0, 1.0, 0.0, 1.0], // Yellow
                    [0.0, 1.0, 1.0, 1.0], // Cyan
                    [1.0, 0.0, 1.0, 1.0]  // Magenta
                ];
                p.color = saturatedColors[Math.floor(Math.random() * saturatedColors.length)];
            } else {
                p.color = config.color ? [...config.color] : [1.0, 1.0, 1.0, 1.0];
            }

            this.activeParticles.push(p);
        }
    }

    update(dt) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.life -= dt;

            if (p.life <= 0) {
                const last = this.activeParticles.pop();
                if (i < this.activeParticles.length) {
                    this.activeParticles[i] = last;
                }
                this.inactivePool.push(p);
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += p.gravity * dt;
                p.alpha = Math.min(1.0, p.life / 1.5) * (p.baseAlpha !== undefined ? p.baseAlpha : 1.0);

                if (p.behavior === 'rainbow') {
                    const hue = (p.life * 2) % 1;
                    p.color = hslToRgb(hue, 1, 0.6);
                } else if (p.behavior === 'glitch') {
                    if (Math.random() > 0.5) {
                        p.x += (Math.random() - 0.5) * 12;
                        p.y += (Math.random() - 0.5) * 12;
                    }
                    if (Math.random() > 0.8) {
                        p.size = (Math.random() * 8) + 8;
                    }
                }

                if (p.animation) {
                    p.animation.frameTimer += dt;
                    if (p.animation.frameTimer >= p.animation.frameSpeed) {
                        p.animation.frameTimer = 0;
                        p.animation.currentFrame = (p.animation.currentFrame + 1) % p.animation.frameCount;
                    }
                }
            }
        }
    }

    render(camera, alpha = 1.0) {
        const gl = this.gl;
        if (this.activeParticles.length === 0) return;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        gl.uniformMatrix4fv(this.uniformLocations.projection, false, camera.getProjectionMatrix(alpha));

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.uniformLocations.texture, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const particlesByTexture = {};
        for (const p of this.activeParticles) {
            if (!particlesByTexture[p.spriteKey]) {
                particlesByTexture[p.spriteKey] = [];
            }
            particlesByTexture[p.spriteKey].push(p);
        }

        const stride = 13;

        for (const spriteKey in particlesByTexture) {
            const particles = particlesByTexture[spriteKey];
            const count = particles.length;
            if (count === 0) continue;

            const instanceData = new Float32Array(count * stride);
            for (let i = 0; i < count; i++) {
                const p = particles[i];
                const offset = i * stride;
                instanceData[offset] = p.x;
                instanceData[offset + 1] = p.y;
                instanceData[offset + 2] = p.size;
                instanceData[offset + 3] = p.alpha;

                if (p.animation) {
                    instanceData[offset + 4] = p.animation.currentFrame / p.animation.frameCount;
                    instanceData[offset + 5] = 0;
                    instanceData[offset + 6] = 1 / p.animation.frameCount;
                    instanceData[offset + 7] = 1;
                } else if (p.spriteKey === 'radish_leaves' || p.spriteKey === 'bee_bullet_pieces' || p.spriteKey === 'plant_bullet_pieces') {
                    instanceData[offset + 4] = p.leafIndex === 0 ? 0.0 : 0.5;
                    instanceData[offset + 5] = 0;
                    instanceData[offset + 6] = 0.5;
                    instanceData[offset + 7] = 1.0;
                } else {
                    instanceData[offset + 4] = 0;
                    instanceData[offset + 5] = 0;
                    instanceData[offset + 6] = 1;
                    instanceData[offset + 7] = 1;
                }
                
                // Color Tint
                instanceData[offset + 8] = p.color[0];
                instanceData[offset + 9] = p.color[1];
                instanceData[offset + 10] = p.color[2];
                instanceData[offset + 11] = p.color[3];
                
                // Shape Toggle
                instanceData[offset + 12] = p.shape;
            }

            const textureInfo = this.textures[spriteKey];
            if (textureInfo) {
                gl.bindTexture(gl.TEXTURE_2D, textureInfo.glTexture);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData);

                gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
            }
        }

        gl.bindVertexArray(null);
        gl.disable(gl.BLEND);
    }

    reset() {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const recycledParticle = this.activeParticles.pop();
            this.inactivePool.push(recycledParticle);
        }
    }
}