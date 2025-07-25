#version 300 es
precision mediump float;

uniform sampler2D u_texture;

in vec2 v_texCoord;
in float v_alpha;

out vec4 outColor;

void main() {
  vec4 texColor = texture(u_texture, v_texCoord);
  
  // Discard fully transparent pixels from the texture to create non-rectangular shapes
  if (texColor.a < 0.1) {
    discard;
  }
  
  outColor = vec4(texColor.rgb, texColor.a * v_alpha);
}