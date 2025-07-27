#version 300 es

// Per-vertex attributes (from VBO)
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

// Uniforms (global for all vertices in a draw call)
uniform mat4 u_projection;

// Outputs to the fragment shader
out vec2 v_texCoord;

void main() {
    // Transform the vertex position by the projection matrix
    gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
    
    // Pass the texture coordinate to the fragment shader
    v_texCoord = a_texCoord;
}