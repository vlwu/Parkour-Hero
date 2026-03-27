/**
 * Compiles a shader from its source code.
 * @param {WebGL2RenderingContext} gl The WebGL context.
 * @param {string} source The shader source code.
 * @param {number} type The shader type (VERTEX_SHADER or FRAGMENT_SHADER).
 * @returns {WebGLShader | null} The compiled shader, or null on failure.
 */
function compileShader(gl, source, type) {
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
 * Creates a WebGL program by linking vertex and fragment shaders.
 * @param {WebGL2RenderingContext} gl The WebGL context.
 * @param {string} vsSource The vertex shader source code.
 * @param {string} fsSource The fragment shader source code.
 * @returns {WebGLProgram | null} The linked WebGL program, or null on failure.
 */
export function createShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }
    return shaderProgram;
}

/**
 * Packs multiple images into a single WebGL Texture Atlas at runtime.
 * Significantly reduces GPU draw calls by combining rendering batches.
 */
export class TextureAtlas {
    constructor(gl, size = 2048) {
        this.gl = gl;
        this.size = size;
        this.canvas = document.createElement('canvas');
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.clearRect(0, 0, size, size);
        
        this.regions = {};
        this.currentX = 0;
        this.currentY = 0;
        this.rowHeight = 0;
        this.glTexture = null;
    }

    pack(key, image) {
        if (this.currentX + image.width > this.size) {
            this.currentX = 0;
            this.currentY += this.rowHeight;
            this.rowHeight = 0;
        }
        if (this.currentY + image.height > this.size) {
            console.error(`Texture atlas is full! Cannot pack ${key}`);
            return false;
        }
        
        this.ctx.drawImage(image, this.currentX, this.currentY);
        this.regions[key] = {
            x: this.currentX,
            y: this.currentY,
            width: image.width,
            height: image.height
        };
        
        this.currentX += image.width;
        this.rowHeight = Math.max(this.rowHeight, image.height);
        return true;
    }

    finalize() {
        if (this.glTexture) this.gl.deleteTexture(this.glTexture);
        this.glTexture = this.gl.createTexture();
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.canvas);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        
        // Free canvas memory to keep overhead low
        this.canvas.width = 0;
        this.canvas.height = 0;
        this.canvas = null;
        this.ctx = null;
    }
}