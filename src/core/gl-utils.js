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