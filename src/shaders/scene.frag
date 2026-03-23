#version 300 es
precision mediump float;

// The main texture atlas
uniform sampler2D u_texture;

// Input from the vertex shader
in vec2 v_texCoord;
in float v_alpha;
in vec4 v_color_tint;

// Output color for the current pixel
out vec4 outColor;

void main() {
  vec4 texColor = texture(u_texture, v_texCoord);

  // Discard fully transparent pixels to render non-rectangular sprites
  if (texColor.a < 0.1) {
    discard;
  }

  // Apply the incoming alpha and tint
  outColor = vec4(texColor.rgb * v_color_tint.rgb, texColor.a * v_alpha * v_color_tint.a);
}