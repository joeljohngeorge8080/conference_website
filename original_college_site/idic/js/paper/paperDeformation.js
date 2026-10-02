/*
 * Paper deformation: GLSL for the subdivided sheet.
 *
 * The sheet is a plane in "paper units" (height = 1). Everything happens in
 * the vertex shader, driven by one uniform, uWrap (0 = flat, 1 = ball):
 *
 *   - wrinkles: ridged noise lifts the flat sheet and pulls it inward
 *   - wrap:     each vertex blends toward a point on a noisy sphere
 *               (centre of the sheet -> front pole, edges/corners -> back pole)
 *   - lag:      the blend is delayed by distance from the centre, so the
 *               middle crumples first and, on the way back, flattens first
 *               while the edges and corners still hang up (the star/bowl
 *               shape in the reference video)
 *
 * Normals come from screen-space derivatives in the fragment shader, which
 * gives the crisp faceted creases of real paper for free.
 */

const NOISE = /* glsl */ `
  float h31(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  // ridged fbm: bright lines where the noise crosses 0.5 (crease lines)
  float ridged(vec3 p) {
    float a = 0.0, amp = 0.5;
    for (int i = 0; i < 3; i++) {
      a += amp * (1.0 - abs(2.0 * vnoise(p) - 1.0));
      p = p * 2.03 + 11.7;
      amp *= 0.5;
    }
    return a; // 0 .. 0.875
  }
`;

export const paperVertex = /* glsl */ `
  uniform float uWrap;
  uniform float uSeed;
  uniform vec2 uHalf;
  uniform float uRadius;
  varying vec3 vPos;
  varying float vCrease;
  varying vec2 vUv;
  ${NOISE}

  void main() {
    vec2 P = position.xy;
    vec2 q = abs(P) / uHalf;
    float rho = max(q.x, q.y);            // 0 centre .. 1 edge/corner
    float lag = rho + 0.35 * q.x * q.y;   // corners lag the edges
    const float L = 0.7;
    float wv = clamp(uWrap * (1.0 + L * 1.35) - L * lag, 0.0, 1.0);
    float ws = wv * wv * (3.0 - 2.0 * wv);

    // --- crumpled flat sheet -------------------------------------------
    float aw = clamp(uWrap * 1.6 - 0.45 * rho, 0.0, 1.0) * (1.0 - 0.55 * ws);
    vec3 F = vec3(P * (1.0 - 0.10 * aw), 0.0);
    float n1 = vnoise(vec3(P * 5.5, uSeed)) - 0.5;
    float r1 = ridged(vec3(P * 8.0, uSeed + 3.0));
    F.z += aw * (0.11 * n1 + 0.075 * (r1 - 0.45));
    F.xy += aw * 0.03 * vec2(vnoise(vec3(P * 4.0, uSeed + 7.0)) - 0.5,
                              vnoise(vec3(P * 4.0, uSeed + 9.0)) - 0.5);

    // --- ball ------------------------------------------------------------
    float len = max(length(P), 1e-4);
    vec2 dir = P / len;
    float tw = 1.4 * ws * (1.0 - rho);                // twist the wrap
    dir = mat2(cos(tw), sin(tw), -sin(tw), cos(tw)) * dir;
    float th = rho * 3.14159265;
    vec3 u = vec3(dir * sin(th), cos(th));
    float r2 = ridged(u * 2.1 + uSeed);
    vec3 B = u * uRadius * (1.0 + 0.75 * (r2 - 0.45));

    vec3 pos = mix(F, B, ws);
    vCrease = clamp(mix(r1, r2, ws) * 1.25 - 0.35, 0.0, 1.0) * max(aw, ws);
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const paperFragment = /* glsl */ `
  uniform vec3 uLight;
  uniform sampler2D uMap;
  varying vec3 vPos;
  varying float vCrease;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    vec3 v = normalize(-vPos);
    if (dot(n, v) < 0.0) n = -n;

    float diff = max(dot(n, uLight), 0.0);
    float spec = pow(max(dot(n, normalize(uLight + v)), 0.0), 40.0) * 0.04;

    // front: warm off-white. back: faint blue, as in the reference
    vec3 base = gl_FrontFacing ? texture2D(uMap, vUv).rgb : vec3(0.80, 0.84, 0.93);
    float grain = 0.97 + 0.03 * hash(floor(vUv * vec2(640.0, 830.0)));

    vec3 col = base * (0.60 + 0.50 * diff) * grain + spec;
    col = mix(col, col * vec3(0.70, 0.77, 0.95), vCrease * 0.65);
    col *= 1.0 - 0.22 * vCrease;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const shadowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Soft contact shadow: rounded rectangle when flat, ellipse when balled up.
export const shadowFragment = /* glsl */ `
  uniform float uBall;
  uniform float uOpacity;
  uniform float uBlur;
  uniform vec2 uHalf;
  uniform float uRadius;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.4;
    vec2 d = abs(p) - uHalf + 0.04;
    float box = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.04;
    float ball = length(p * vec2(1.0, 1.3)) - uRadius * 1.15;
    float sd = mix(box, ball, uBall);
    float a = 1.0 - smoothstep(-uBlur, uBlur, sd);
    gl_FragColor = vec4(0.03, 0.05, 0.09, a * uOpacity);
  }
`;
