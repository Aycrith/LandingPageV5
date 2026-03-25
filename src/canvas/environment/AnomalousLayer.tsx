"use client";

import { useRef, useMemo } from "react";
import { useFrame, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useCursorStore } from "@/stores/cursorStore";

// Anomalous Matter background — large icosahedron with Perlin noise vertex displacement
const AnomalousShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uOpacity: 0.0,
  },
  // Vertex — Simplex 3D noise displacement
  `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec3 vNormal;

  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x,289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159-0.85373472095314*r; }

  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod(i,289.0);
    vec4 p=permute(permute(permute(
        i.z+vec4(0.0,i1.z,i2.z,1.0))
      +i.y+vec4(0.0,i1.y,i2.y,1.0))
      +i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 xs=x_*ns.x+ns.yyyy; vec4 ys=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(xs)-abs(ys);
    vec4 b0=vec4(xs.xy,ys.xy); vec4 b1=vec4(xs.zw,ys.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vec3 pos = position;
    float t = uTime * 0.3;
    // Mouse adds gentle distortion direction
    vec3 mouseInfluence = vec3(uMouse.x - 0.5, uMouse.y - 0.5, 0.0) * 0.8;
    float n1 = snoise(pos * 0.4 + vec3(t) + mouseInfluence);
    float n2 = snoise(pos * 0.8 + vec3(t * 1.5, 0.0, 0.0));
    pos += normal * (n1 * 0.9 + n2 * 0.4);
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  `
  uniform float uOpacity;
  varying vec3 vNormal;
  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    vec3 col = mix(vec3(0.1, 0.05, 0.25), vec3(0.5, 0.2, 1.0), fresnel);
    gl_FragColor = vec4(col, uOpacity * (0.04 + fresnel * 0.06));
  }
  `
);

extend({ AnomalousShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    anomalousShaderMaterial: ThreeElement<typeof AnomalousShaderMaterial>;
  }
}

interface AnomalousLayerProps {
  progress: number;
}

export function AnomalousLayer({ progress }: AnomalousLayerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);
  const mouseVec = useMemo(() => new THREE.Vector2(0.5, 0.5), []);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;
    const { x, y } = useCursorStore.getState();
    mouseVec.set(x, y);
    matRef.current.uMouse = mouseVec;
    matRef.current.uOpacity = Math.min(progress / 0.5, 1);
  });

  return (
    <mesh position={[0, 0, -15]}>
      <icosahedronGeometry args={[7, 2]} />
      <anomalousShaderMaterial
        ref={matRef}
        uTime={0}
        uMouse={mouseVec}
        uOpacity={0}
        transparent
        depthWrite={false}
        wireframe
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
