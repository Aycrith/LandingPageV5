varying float vAlpha;
varying vec3 vColor;
varying float vDistance;

void main() {
  // Soft circular point
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  float alpha = smoothstep(0.5, 0.15, dist) * vAlpha;

  // Subtle glow falloff
  float glow = exp(-dist * 4.0) * 0.3;
  alpha += glow * vAlpha;

  // Depth-based atmospheric tint
  vec3 color = vColor;
  float fogFactor = smoothstep(10.0, 60.0, vDistance);
  color = mix(color, color * 0.3, fogFactor);

  gl_FragColor = vec4(color, alpha);
}
