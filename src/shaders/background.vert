#version 300 es

// A simple quad that covers the entire screen in clip space coordinates.
// The vertex positions are generated directly in the shader using gl_VertexID.
const vec2 positions[4] = vec2[](
    vec2(-1.0, -1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0,  1.0),
    vec2( 1.0,  1.0)
);

// This varying will pass the clip space position to the fragment shader.
out vec2 v_position;

void main() {
    vec2 pos = positions[gl_VertexID];
    gl_Position = vec4(pos, 0.0, 1.0);
    v_position = pos;
}