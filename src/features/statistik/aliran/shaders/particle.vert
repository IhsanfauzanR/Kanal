// Transaction particle vertex shader (§5.9).
// gl.POINTS auto-billboard. Per-particle colour and size; size attenuates with
// view depth so near transactions read larger. Lives inside SceneFit, so the
// model-view depth already accounts for the scene scale.

attribute float aSize;
attribute vec3 aColor;

varying vec3 vColor;

void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (200.0 / max(0.001, -mv.z));
  gl_Position = projectionMatrix * mv;
}
