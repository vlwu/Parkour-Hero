import vertexShaderSource from '../shaders/sprite.vert?raw';
import fragmentShaderSource from '../shaders/sprite.frag?raw';

/**
 * A WebGL-based sprite batch renderer.
 * This class is designed to collect multiple sprite draw calls into a single batch
 * and render them all in one go, significantly improving performance by reducing
 * the number of draw calls to the GPU.
 */
export class WebGLSpriteBatcher {
    constructor(gl, maxSprites = 2000) {
        this.gl = gl;
        this.maxSprites = maxSprites;
        this.vertexCount = maxSprites * 6; // 6 vertices per sprite (2 triangles)
        this.attributesPerVertex = 4; // x, y, u, v
        this.vertexData = new Float32Array(this.vertexCount * this.attributesPerVertex);
        this.spriteCount = 0;
        this.currentTexture = null;

        if (!this._initProgram()) {
            throw new Error("Failed to initialize WebGLSpriteBatcher program.");
        }
        this._initBuffers();
    }

    /**
     * Compiles a shader from source code.
     * @private
     */
    _compileShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const shaderType = type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT";
            console.error(`An error occurred compiling the ${shaderType} shader: ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    /**
     * Initializes the WebGL shader program.
     * @private
     */
    _initProgram() {
        const gl = this.gl;
        const vertexShader = this._compileShader(vertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = this._compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            return false;
        }

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(this.program)}`);
            return false;
        }

        this.uniformLocations = {
            projection: gl.getUniformLocation(this.program, 'u_projection'),
            texture: gl.getUniformLocation(this.program, 'u_texture'),
        };

        this.attributeLocations = {
            position: 0, // layout(location = 0)
            texCoord: 1, // layout(location = 1)
        };
        return true;
    }

    /**
     * Initializes the vertex buffers and VAO.
     * @private
     */
    _initBuffers() {
        const gl = this.gl;
        this.vbo = gl.createBuffer();
        this.vao = gl.createVertexArray();

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.byteLength, gl.DYNAMIC_DRAW);

        const stride = this.attributesPerVertex * Float32Array.BYTES_PER_ELEMENT;

        // Position attribute
        gl.enableVertexAttribArray(this.attributeLocations.position);
        gl.vertexAttribPointer(this.attributeLocations.position, 2, gl.FLOAT, false, stride, 0);

        // Texture Coordinate attribute
        gl.enableVertexAttribArray(this.attributeLocations.texCoord);
        gl.vertexAttribPointer(this.attributeLocations.texCoord, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

        gl.bindVertexArray(null);
    }

    /**
     * Begins a new batch rendering process.
     * @param {Camera} camera - The game camera for the projection matrix.
     */
    begin(camera) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.uniformLocations.projection, false, camera.getProjectionMatrix());
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.spriteCount = 0;
        this.currentTexture = null;
    }

    /**
     * Adds a sprite to the current batch. If the texture changes,
     * this will trigger a flush of the existing batch.
     */
    // FIX: Updated method signature to accept texture dimensions explicitly.
    draw(texture, texWidth, texHeight, x, y, width, height, srcX, srcY, srcWidth, srcHeight, flipX = false) {
        if (this.spriteCount >= this.maxSprites) {
            this.flush();
        }

        if (this.currentTexture !== texture) {
            this.flush();
            this.currentTexture = texture;
            const gl = this.gl;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(this.uniformLocations.texture, 0);
        }

        // FIX: Use passed-in texWidth and texHeight instead of texture.width/height.
        const u0 = srcX / texWidth;
        const v0 = srcY / texHeight;
        const u1 = (srcX + srcWidth) / texWidth;
        const v1 = (srcY + srcHeight) / texHeight;

        const u_start = flipX ? u1 : u0;
        const u_end = flipX ? u0 : u1;

        const x1 = x;
        const y1 = y;
        const x2 = x + width;
        const y2 = y + height;

        const offset = this.spriteCount * 6 * this.attributesPerVertex;

        this.vertexData[offset + 0]  = x1; this.vertexData[offset + 1]  = y1; this.vertexData[offset + 2]  = u_start; this.vertexData[offset + 3]  = v0;
        this.vertexData[offset + 4]  = x2; this.vertexData[offset + 5]  = y1; this.vertexData[offset + 6]  = u_end;   this.vertexData[offset + 7]  = v0;
        this.vertexData[offset + 8]  = x1; this.vertexData[offset + 9]  = y2; this.vertexData[offset + 10] = u_start; this.vertexData[offset + 11] = v1;
        this.vertexData[offset + 12] = x2; this.vertexData[offset + 13] = y1; this.vertexData[offset + 14] = u_end;   this.vertexData[offset + 15] = v0;
        this.vertexData[offset + 16] = x2; this.vertexData[offset + 17] = y2; this.vertexData[offset + 18] = u_end;   this.vertexData[offset + 19] = v1;
        this.vertexData[offset + 20] = x1; this.vertexData[offset + 21] = y2; this.vertexData[offset + 22] = u_start; this.vertexData[offset + 23] = v1;

        this.spriteCount++;
    }

    /**
     * Renders all sprites currently in the batch to the screen.
     */
    flush() {
        if (this.spriteCount === 0) return;

        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexData.subarray(0, this.spriteCount * 6 * this.attributesPerVertex));

        gl.drawArrays(gl.TRIANGLES, 0, this.spriteCount * 6);

        this.spriteCount = 0;
    }

    /**
     * Ends the batch rendering process, ensuring any remaining sprites are flushed.
     */
    end() {
        this.flush();
        
        this.gl.disable(this.gl.BLEND);
        this.gl.bindVertexArray(null);
    }
}