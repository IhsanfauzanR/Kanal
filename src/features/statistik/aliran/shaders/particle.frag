// Transaction particle fragment shader (§5.9).
// Solid luminous core + a tight halo (not a wide gaussian smear), so each
// particle reads as a crisp glowing orb rather than a blurry blob.

varying vec3 vColor;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  // Filled core with a crisp (anti-aliased) edge…
  float core = smoothstep(0.5, 0.28, d);
  // …plus a tight halo only just outside the core.
  float halo = exp(-d * d * 12.0) * 0.55;
  float a = max(core, halo);
  gl_FragColor = vec4(vColor, a);
}
