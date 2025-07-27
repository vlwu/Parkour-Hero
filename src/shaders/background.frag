#version 300 es
precision mediump float;

// Uniforms provided by the renderer
uniform sampler2D u_texture;
uniform vec2 u_resolution;      // Viewport resolution (e.g., 1920x1080)
uniform vec2 u_camera_offset;   // Camera's top-left world position
uniform float u_camera_zoom;
uniform vec2 u_texture_size;    // The background image's pixel dimensions

// Interpolated position from the vertex shader (from -1.0 to 1.0)
in vec2 v_position;

// Final pixel color
out vec4 outColor;

void main() {
    // Convert the vertex's clip space position back to screen pixel coordinates
    vec2 screen_coords = (v_position * 0.5 + 0.5) * u_resolution;

    // Calculate the corresponding world coordinates by adding the camera offset and accounting for zoom
    vec2 world_coords = (screen_coords / u_camera_zoom) + u_camera_offset;

    // Use the modulo operator (fract) to make the texture repeat, creating the scrolling effect
    vec2 tex_coords = world_coords / u_texture_size;

    // Sample the texture at the calculated coordinate
    outColor = texture(u_texture, tex_coords);
}