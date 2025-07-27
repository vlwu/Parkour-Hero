#version 300 es

// Per-vertex attributes for a single quad
layout(location = 0) in vec2 a_quad_vertex; // Corner of the quad (e.g., [0, 1])

// Per-instance attributes (one set for each sprite/tile)
layout(location = 1) in vec2 a_world_position;
layout(location = 2) in vec2 a_size;
layout(location = 3) in vec2 a_tex_coord_origin;
layout(location = 4) in vec2 a_tex_coord_size;
layout(location = 5) in float a_is_flipped;

// Uniforms (global for all vertices in a draw call)
uniform mat4 u_projection;
uniform vec2 u_texture_size;

// Outputs to the fragment shader
out vec2 v_texCoord;

void main() {
    // Calculate the world position of this specific vertex of the quad
    vec2 pos = a_world_position + (a_quad_vertex * a_size);

    // Apply the camera's projection matrix to get the final screen position
    gl_Position = u_projection * vec4(pos, 0.0, 1.0);

    // Flip texture coordinates if the sprite is flipped horizontally
    vec2 quad_tex_coord = vec2(
        a_is_flipped > 0.5 ? (1.0 - a_quad_vertex.x) : a_quad_vertex.x,
        a_quad_vertex.y
    );

    // Calculate the final texture coordinate by scaling and offsetting
    v_texCoord = (a_tex_coord_origin + (quad_tex_coord * a_tex_coord_size)) / u_texture_size;
}