#version 300 es

// Per-vertex attributes
layout(location = 0) in vec2 a_quad_vertex; // The corner of the particle quad (e.g., [-0.5, 0.5])
layout(location = 1) in vec2 a_tex_coord;     // Texture coordinate for this vertex

// Per-instance attributes (one set of values for each particle)
layout(location = 2) in vec2 a_particle_position; // World position of the particle's center
layout(location = 3) in float a_particle_size;
layout(location = 4) in float a_particle_alpha;
layout(location = 5) in vec4 a_tex_info; // x_off, y_off, x_scale, y_scale
layout(location = 6) in vec4 a_color_tint; // color tint
layout(location = 7) in float a_shape; // 0.0 = Texture, 1.0 = Solid Square

// Uniforms (global for all particles in a draw call)
uniform mat4 u_projection;

// Outputs to the fragment shader
out vec2 v_texCoord;
out float v_alpha;
out vec4 v_color_tint;
out float v_shape;

void main() {
    // Calculate the final vertex position in world space
    vec2 pos = a_quad_vertex * a_particle_size + a_particle_position;

    // Apply the camera's projection matrix
    gl_Position = u_projection * vec4(pos, 0.0, 1.0);

    // Calculate the texture coordinate for the specific animation frame
    v_texCoord = a_tex_coord * a_tex_info.zw + a_tex_info.xy;

    // Pass varying attributes to the fragment shader
    v_alpha = a_particle_alpha;
    v_color_tint = a_color_tint;
    v_shape = a_shape;
}