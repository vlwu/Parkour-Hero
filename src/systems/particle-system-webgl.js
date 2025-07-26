import { eventBus } from '../utils/event-bus.js';
import vertexShaderSource from '../shaders/particle.vert?raw';
import fragmentShaderSource from '../shaders/particle.frag?raw';

export class ParticleSystemWebGL {
    constructor(gl, assets) {
        this.gl = gl;
        this.assets = assets;

        this.activeParticles = [];
        this.inactivePool = [];
        this.poolSize = 500;

        for (let i = 0; i < this.poolSize; i++) {
            this.inactivePool.push({});
        }

        this._setupWebGLResources();

        eventBus.subscribe('createParticles', (data) => this.create(data));
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
        const strideBytes = 8 * Float32Array.BYTES_PER_ELEMENT;
        gl.bufferData(gl.ARRAY_BUFFER, this.poolSize * strideBytes, gl.DYNAMIC_DRAW);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(0); // a_quad_vertex
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(1); // a_tex_coord
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
        const instanceStride = 8 * 4;

        gl.enableVertexAttribArray(2); // a_particle_position
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, instanceStride, 0);
        gl.vertexAttribDivisor(2, 1);

        gl.enableVertexAttribArray(3); // a_particle_size
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, instanceStride, 8);
        gl.vertexAttribDivisor(3, 1);

        gl.enableVertexAttribArray(4); // a_particle_alpha
        gl.vertexAttribPointer(4, 1, gl.FLOAT, false, instanceStride, 12);
        gl.vertexAttribDivisor(4, 1);

        gl.enableVertexAttribArray(5); // a_tex_info
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, instanceStride, 16);
        gl.vertexAttribDivisor(5, 1);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.textures = {};
        const textureKeys = ['dust_particle', 'sand_particle', 'mud_particle', 'ice_particle', 'slime_particles', 'snail_die'];
        for (const key of textureKeys) {
            if (this.assets[key]) {
                this.textures[key] = this._createTexture(this.assets[key]);
            }
        }
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
        return texture;
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
            enemy_death: { count: 15, baseSpeed: 100, spriteKey: 'dust_particle', life: 0.6, gravity: 150 },
            slime_puddle: { count: 1, baseSpeed: 0, spriteKey: 'slime_particles', life: 4.0, gravity: 0, animation: { frameCount: 4, frameSpeed: 0.2 } },
            snail_flee: { count: 1, baseSpeed: 250, spriteKey: 'snail_die', life: 1.5, gravity: 800, size: 38 },
        };

        const config = particleConfigs[type];
        if (!config) return;

        for (let i = 0; i < config.count; i++) {
            if (this.inactivePool.length === 0) break;

            const p = this.inactivePool.pop();

            let angle;
            const currentBaseSpeed = particleSpeed || config.baseSpeed;
            let speed = currentBaseSpeed * (0.8 + Math.random() * 0.4);

            if (type === 'enemy_death') angle = Math.random() * Math.PI * 2;
            else if (type === 'dash') angle = (direction === 'right' ? Math.PI : 0) + (Math.random() - 0.5) * (Math.PI / 2);
            else if (type === 'double_jump') angle = (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 3);
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

            p.x = x; p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = config.life + Math.random() * 0.3;
            p.size = config.size || (type === 'slime_puddle' ? 16 : 5 + Math.random() * 4);
            p.alpha = 1.0;
            p.spriteKey = config.spriteKey;
            p.gravity = config.gravity;
            p.animation = config.animation ? { ...config.animation, frameTimer: 0, currentFrame: 0 } : null;

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
                p.alpha = Math.min(1.0, p.life / 1.5);

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

    render(camera) {
        const gl = this.gl;
        if (this.activeParticles.length === 0) return;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        gl.uniformMatrix4fv(this.uniformLocations.projection, false, camera.getProjectionMatrix());

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

        const stride = 8; // 8 floats per instance

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
                    instanceData[offset + 4] = p.animation.currentFrame / p.animation.frameCount; // texOffX
                    instanceData[offset + 5] = 0; // texOffY
                    instanceData[offset + 6] = 1 / p.animation.frameCount; // texScaleX
                    instanceData[offset + 7] = 1; // texScaleY
                } else {
                    instanceData[offset + 4] = 0;
                    instanceData[offset + 5] = 0;
                    instanceData[offset + 6] = 1;
                    instanceData[offset + 7] = 1;
                }
            }

            gl.bindTexture(gl.TEXTURE_2D, this.textures[spriteKey]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData);
            
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
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