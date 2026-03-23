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
layout(location = 7) in float a_rotation;
layout(location = 8) in vec4 a_color_tint; // New: Color Tint

// Uniforms (global for all vertices in a draw call)
uniform mat4 u_projection;
uniform vec2 u_texture_size;

// Outputs to the fragment shader
out vec2 v_texCoord;
out float v_alpha;
out vec4 v_color_tint;

void main() {
    // 1. Scale the unit quad vertex to get local-space coordinates relative to the object's origin (0,0)
    vec2 local_pos = a_quad_vertex * a_size;

    // 2. Find the pivot point (center of the object)
    vec2 pivot = a_size * 0.5;

    // 3. Center the local-space coordinates around the pivot
    vec2 centered_pos = local_pos - pivot;

    // 4. Create the rotation matrix and apply rotation to the centered coordinates
    float s = sin(a_rotation);
    float c = cos(a_rotation);
    mat2 rot_matrix = mat2(c, -s, s, c);
    vec2 rotated_pos = rot_matrix * centered_pos;

    // 5. Add the pivot back to the rotated coordinates and then add the object's world position
    vec2 pos = a_world_position + pivot + rotated_pos;
    
    // Apply the camera's projection matrix to get the final screen position
    gl_Position = u_projection * vec4(pos, 0.0, 1.0);

    // Flip texture coordinates if the sprite is flipped horizontally
    vec2 quad_tex_coord = vec2(
        a_is_flipped > 0.5 ? (1.0 - a_quad_vertex.x) : a_quad_vertex.x,
        a_quad_vertex.y
    );

    // Calculate the final texture coordinate by scaling and offsetting
    v_texCoord = (a_tex_coord_origin + (quad_tex_coord * a_tex_coord_size)) / u_texture_size;
    
    // Pass varying properties to the fragment shader
    v_alpha = a_alpha;
    v_color_tint = a_color_tint;
}