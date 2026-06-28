// Water surface vertex shader (§5.8, calm directional river).
// Concept: a calm river flowing left→right (income → expense). Low-amplitude
// swells travel predominantly in +X so the surface reads as directional flow,
// not an omnidirectional sea. Analytic normals so the gentle swell catches the
// key light. Frost palette, contemplative (3A rules 1 & 3).

uniform float uTime;
uniform float uAmp;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vElev;
varying float vViewZ;
varying vec2 vGround;

// One directional wave → (height, dH/dx, dH/dz).
vec3 wave(vec2 p, vec2 dir, float freq, float amp, float speed) {
  float ph = dot(p, dir) * freq + uTime * speed;
  float c = cos(ph) * amp * freq;
  return vec3(sin(ph) * amp, c * dir.x, c * dir.y);
}

void main() {
  vec3 pos = position;
  vec2 g = pos.xy;

  // All waves travel mostly in +X → a clear downstream direction.
  vec3 w = vec3(0.0);
  w += wave(g, normalize(vec2(1.0, 0.12)), 0.28, uAmp * 1.00, 0.30);
  w += wave(g, normalize(vec2(1.0, -0.30)), 0.46, uAmp * 0.55, 0.42);
  w += wave(g, normalize(vec2(0.85, 0.50)), 0.80, uAmp * 0.30, 0.55);

  pos.z += w.x;

  vec3 nLocal = normalize(vec3(-w.y, -w.z, 1.0));
  vNormal = normalize(normalMatrix * nLocal);
  vElev = w.x;
  vGround = g;

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vec4 mv = viewMatrix * world;
  vViewZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}
