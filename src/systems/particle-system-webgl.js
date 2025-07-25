import { eventBus } from '../utils/event-bus.js';
import vertexShaderSource from '../shaders/particle.vert?raw';
import fragmentShaderSource from '../shaders/particle.frag?raw';

export class ParticleSystemWebGL {
    constructor(gl, assets) {
        this.gl = gl;
        this.assets = assets;

        this.activeParticles = [];
        this.inactivePool = [];
        this.poolSize = 500; // Increased pool size for WebGL

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

        // Data for a single quad. This will be drawn for each particle instance.
        const quadVertices = new Float32Array([
            -0.5, -0.5, 0.0, 1.0,
             0.5, -0.5, 1.0, 1.0,
            -0.5,  0.5, 0.0, 0.0,
             0.5,  0.5, 1.0, 0.0,
        ]);

        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

        // Buffer for per-instance particle data (position, size, alpha)
        this.particleBuffer = gl.createBuffer();
        // Pre-allocate buffer on GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.poolSize * 4 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

        // --- Vertex Array Object (VAO) Setup ---
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // 1. Set up the quad vertex attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(0); // a_quad_vertex (location = 0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0); // 2 floats, 16 bytes stride, 0 offset
        gl.enableVertexAttribArray(4); // a_tex_coord (location = 4)
        gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 16, 8); // 2 floats, 16 bytes stride, 8 offset

        // 2. Set up the per-instance attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
        // a_particle_position (location = 1)
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribDivisor(1, 1); // This attribute is per-instance

        // a_particle_size (location = 2)
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 16, 8);
        gl.vertexAttribDivisor(2, 1); // This attribute is per-instance

        // a_particle_alpha (location = 3)
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 16, 12);
        gl.vertexAttribDivisor(3, 1); // This attribute is per-instance

        // Unbind everything
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // --- Texture Loading ---
        this.textures = {};
        const textureKeys = ['dust_particle', 'sand_particle', 'mud_particle', 'ice_particle', 'slime_particles'];
        for (const key of textureKeys) {
            this.textures[key] = this._createTexture(this.assets[key]);
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
            slime_puddle: { count: 1, baseSpeed: 0, spriteKey: 'slime_particles', life: 4.0, gravity: 0 },
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
            } else angle = - (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 4);

            p.x = x; p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = config.life + Math.random() * 0.3;
            p.size = type === 'slime_puddle' ? 16 : 5 + Math.random() * 4;
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
            }
        }
    }

    render(camera) {
        const gl = this.gl;
        if (this.activeParticles.length === 0) return;

        // CRITICAL FIX: Set the viewport every frame.
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        gl.uniformMatrix4fv(this.uniformLocations.projection, false, camera.getProjectionMatrix());

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.uniformLocations.texture, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // OPTIMIZATION: Group particles by texture to minimize texture binding.
        const particlesByTexture = {};
        for (const p of this.activeParticles) {
            if (!particlesByTexture[p.spriteKey]) {
                particlesByTexture[p.spriteKey] = [];
            }
            particlesByTexture[p.spriteKey].push(p);
        }

        const stride = 4; // 4 floats per instance: x, y, size, alpha
        const instanceData = new Float32Array(this.activeParticles.length * stride);
        let offset = 0;
        
        // OPTIMIZATION: Build a single data array for all particles.
        for (const spriteKey in particlesByTexture) {
            const particles = particlesByTexture[spriteKey];
            for (const p of particles) {
                instanceData[offset++] = p.x;
                instanceData[offset++] = p.y;
                instanceData[offset++] = p.size;
                instanceData[offset++] = p.alpha;
            }
        }

        // OPTIMIZATION: Upload all particle data to GPU in one go.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData);

        let drawnCount = 0;
        for (const spriteKey in particlesByTexture) {
            const particles = particlesByTexture[spriteKey];
            const count = particles.length;
            if (count === 0) continue;

            gl.bindTexture(gl.TEXTURE_2D, this.textures[spriteKey]);
            
            // OPTIMIZATION: Issue a draw call for each texture batch using an offset.
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

            drawnCount += count;
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