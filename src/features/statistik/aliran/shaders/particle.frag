// Transaction particle fragment shader (§5.9).
// Smooth gaussian glow (no hard disc edge) — soft core that falls off
// gradually, so with additive blend + bloom it reads as a smooth luminous orb.

varying vec3 vColor;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float a = exp(-d * d * 9.0);
  gl_FragColor = vec4(vColor, a);
}
