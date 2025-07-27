#version 300 es

// Per-vertex attributes for a single quad
layout(location = 0) in vec2 a_quad_vertex; // Corner of the quad (e.g., [0, 1])

// Per-instance attributes (one set for each sprite/tile)
layout(location = 1) in vec2 a_world_position;
layout(location = 2) in vec2 a_size;
layout(location = 3) in vec2 a_tex_coord_origin;
layout(location = 4) in vec2 a_tex_coord_size;
layout(location = 5) in float a_is_flipped;
layout(location = 6) in float a_alpha;
layout(location = 7) in float a_rotation; // New: Rotation attribute

// Uniforms (global for all vertices in a draw call)
uniform mat4 u_projection;
uniform vec2 u_texture_size;

// Outputs to the fragment shader
out vec2 v_texCoord;
out float v_alpha;

void main() {
    // Center the quad vertex around the origin for rotation
    vec2 centered_pos = a_quad_vertex - vec2(0.5);

    // Create a 2D rotation matrix
    float s = sin(a_rotation);
    float c = cos(a_rotation);
    mat2 rot_matrix = mat2(c, -s, s, c);

    // Apply rotation and then shift back
    vec2 rotated_pos = (rot_matrix * centered_pos) + vec2(0.5);

    // Calculate the world position of this specific vertex of the quad
    vec2 pos = a_world_position + (rotated_pos * a_size);

    // Apply the camera's projection matrix to get the final screen position
    gl_Position = u_projection * vec4(pos, 0.0, 1.0);

    // Flip texture coordinates if the sprite is flipped horizontally
    vec2 quad_tex_coord = vec2(
        a_is_flipped > 0.5 ? (1.0 - a_quad_vertex.x) : a_quad_vertex.x,
        a_quad_vertex.y
    );

    // Calculate the final texture coordinate by scaling and offsetting
    v_texCoord = (a_tex_coord_origin + (quad_tex_coord * a_tex_coord_size)) / u_texture_size;
    
    // Pass alpha to the fragment shader
    v_alpha = a_alpha;
}