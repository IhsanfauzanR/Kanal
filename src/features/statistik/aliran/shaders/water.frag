// Water surface fragment shader (§5.8, calm directional river).
// Calm dark frost surface: low-contrast deep→crest colour, soft broad sheen
// (still-water reflection, not sharp glints), a downstream highlight band that
// drifts in +X to reinforce flow direction, a radial vignette that grounds the
// plane, distance fog + soft edge so the bounded floor never shows a border.

uniform float uTime;
uniform vec3 uColorDeep;
uniform vec3 uColorCrest;
uniform vec3 uSpec;
uniform vec3 uLightDir;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uAmp;
uniform float uHalfSize;
uniform float uEdgeStart;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vElev;
varying float vViewZ;
varying vec2 vGround;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  float diff = max(dot(N, L), 0.0);

  float elevK = clamp(vElev / (uAmp * 1.8) * 0.5 + 0.5, 0.0, 1.0);
  vec3 base = mix(uColorDeep, uColorCrest, elevK);
  vec3 col = base * (0.55 + 0.45 * diff);

  // Soft broad sheen — still water catching the cold key light.
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 H = normalize(L + V);
  float sheen = pow(max(dot(N, H), 0.0), 18.0);
  col += uSpec * sheen * 0.32;

  // Faint downstream highlight band drifting in +X (reinforces flow).
  float flow = sin(vGround.x * 0.5 - uTime * 0.6) * 0.5 + 0.5;
  flow = pow(flow, 6.0) * 0.05;
  col += uSpec * flow;

  // Radial vignette — gently darken toward the rim so the floor feels grounded.
  float r = length(vGround) / uHalfSize;
  col *= 1.0 - smoothstep(0.25, 1.0, r) * 0.55;

  // Distance fog (world view space — matches the scene Fog).
  float fog = smoothstep(uFogNear, uFogFar, vViewZ);
  col = mix(col, uFogColor, fog);

  // Soft radial edge so the bounded plane never shows a hard border.
  float edge = 1.0 - smoothstep(uEdgeStart, 1.0, r);

  gl_FragColor = vec4(col, edge);
}
