#version 300 es

// Per-vertex attributes
layout(location = 0) in vec2 a_quad_vertex; // The corner of the particle quad (e.g., [-0.5, 0.5])

// Per-instance attributes (one set of values for each particle)
layout(location = 1) in vec2 a_particle_position; // World position of the particle's center
layout(location = 2) in float a_particle_size;
layout(location = 3) in float a_particle_alpha;
layout(location = 4) in vec2 a_tex_coord; // Texture coordinate for this corner

// Uniforms (global for all particles in a draw call)
uniform mat4 u_projection;

// Outputs to the fragment shader
out vec2 v_texCoord;
out float v_alpha;

void main() {
    // Calculate the final vertex position in world space
    vec2 pos = a_quad_vertex * a_particle_size + a_particle_position;

    // Apply the camera's projection matrix
    gl_Position = u_projection * vec4(pos, 0.0, 1.0);

    // Pass varyings to the fragment shader
    v_texCoord = a_tex_coord;
    v_alpha = a_particle_alpha;
}