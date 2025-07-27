#version 300 es
precision mediump float;

// Uniforms (global for all fragments in a draw call)
uniform sampler2D u_texture;

// Inputs from the vertex shader
in vec2 v_texCoord;

// Output color for the fragment
out vec4 outColor;

void main() {
  // Sample the color from the texture at the given coordinate
  outColor = texture(u_texture, v_texCoord);
  
  // Discard fully transparent pixels to support non-rectangular sprites
  if (outColor.a < 0.1) {
    discard;
  }
}