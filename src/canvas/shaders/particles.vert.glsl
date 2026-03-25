uniform float uTime;
uniform float uScrollVelocity;
uniform vec2 uMouse;
uniform float uActProgress;
uniform vec3 uAccentColor;
uniform sampler2D uNoiseTexture;
uniform float uOpacityScale;
uniform float uSizeScale;

attribute vec3 aRandom;
attribute float aSize;

varying float vAlpha;
varying vec3 vColor;
varying float vDistance;

//
// Simplex 3D noise
//
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// FBM (Fractal Brownian Motion)
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

void main() {
  vec3 pos = position;
  float t = uTime * 0.15;

  // FBM displacement — organic flow
  float noiseScale = 0.02;
  vec3 noisePos = pos * noiseScale + vec3(t, t * 0.7, t * 0.3);
  float nx = fbm(noisePos);
  float ny = fbm(noisePos + vec3(31.416, 0.0, 0.0));
  float nz = fbm(noisePos + vec3(0.0, 17.331, 0.0));

  pos += vec3(nx, ny, nz) * 2.0;

  // Scroll-velocity wind displacement
  float windStrength = uScrollVelocity * 3.0;
  pos.y -= windStrength * (0.5 + aRandom.x * 0.5);
  pos.x += windStrength * aRandom.y * 0.3;

  // Cursor attraction well
  vec3 toMouse = vec3(uMouse.x * 5.0, uMouse.y * 5.0, 0.0) - pos;
  float mouseDist = length(toMouse);
  float mouseInfluence = smoothstep(8.0, 0.5, mouseDist) * 0.5;
  pos += normalize(toMouse + vec3(0.001)) * mouseInfluence;

  // Project
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation
  float sizeFactor = aSize * (200.0 / -mvPosition.z);
  gl_PointSize = max(sizeFactor * uSizeScale, 0.5);

  // Distance-based alpha
  float dist = -mvPosition.z;
  vDistance = dist;

  // Volumetric density — sample the seamless noise texture in world XZ to
  // create nebula-like clusters where particles appear denser.
  vec2 densityUV = fract(pos.xz * 0.018 + 0.5);
  float density  = texture2D(uNoiseTexture, densityUV).r;
  float nebulaMask = smoothstep(0.22, 0.65, density);

  vAlpha =
    smoothstep(80.0, 5.0, dist) *
    (0.3 + aRandom.z * 0.7) *
    nebulaMask *
    uOpacityScale;

  // Velocity-based color shift
  float velFactor = abs(uScrollVelocity) * 2.0;
  vColor = mix(uAccentColor, vec3(1.0), velFactor * 0.3);
}
