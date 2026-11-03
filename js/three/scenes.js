/* The 3D background scenes. Each one is built by
 *   build(THREE, renderer, cfg, { mobile })
 * and returns { scene, camera, renderScale?, resize(w, h, pixelRatio),
 * setColors(cfg), update(dt, time, input), dispose() }.
 *
 * cfg = { a, b, accent, density } with colours as "#rrggbb".
 * input = { x, y } pointer in -1..1 (smoothed), active, down, clicks[],
 *         bass, beat (0..1, from the music when "react to music" is on).
 *
 * The custom shaders do their maths in sRGB and write the result straight
 * out, so colours look exactly like the ones picked in the editor.
 */
import { hexToRgb } from '../util.js';

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, k) => a + (b - a) * k;

const srgb = hex => hexToRgb(hex).map(c => c / 255);

/** Same hue at full brightness, so dark theme colours still read as light. */
function vivid(hex) {
  const [r, g, b] = hexToRgb(hex);
  const m = Math.max(r, g, b);
  if (m < 10) return [1, 1, 1];
  return [r / m, g / m, b / m];
}

const toHex = ([r, g, b]) =>
  '#' + [r, g, b].map(c => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('');

const vec3 = (THREE, [r, g, b], k = 1) => new THREE.Vector3(r * k, g * k, b * k);

/* ---------- shared GLSL ---------- */

const NOISE3 = /* glsl */ `
  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v / 0.875;
  }
`;

const SOFT_POINT_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = pow(1.0 - d, 1.8) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`;

/** A soft additive radial glow on a camera-facing plane. */
function glow(THREE, color, opacity) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = pow(max(0.0, 1.0 - d), 2.4) * uOpacity;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
}

function disposeAll(root) {
  root.traverse(o => {
    o.geometry?.dispose();
    if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
    else o.material?.dispose();
  });
}

/* ---------- Galaxy: a spiral of tens of thousands of glowing stars ---------- */

function galaxy(THREE, renderer, cfg, { mobile }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  const count = Math.min(120000, Math.round((mobile ? 26000 : 52000) * cfg.density));
  const R = 6;
  const ARMS = 4;
  const pos = new Float32Array(count * 3);
  const info = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const r = R * Math.pow(Math.random(), 1.5) + 0.05;
    const arm = ((i % ARMS) / ARMS) * TAU;
    const twist = r * 1.15;
    const jitter = () => Math.pow(Math.random(), 2.8) * (Math.random() < 0.5 ? -1 : 1) * (0.25 + r * 0.22);
    pos[i * 3] = Math.cos(arm + twist) * r + jitter();
    pos[i * 3 + 1] = jitter() * 0.45;
    pos[i * 3 + 2] = Math.sin(arm + twist) * r + jitter();
    info[i * 2] = Math.min(1, r / R);
    info[i * 2 + 1] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('aInfo', new THREE.BufferAttribute(info, 2));

  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: 30 },
    uBeat: { value: 0 },
    uIn: { value: new THREE.Vector3() },
    uOut: { value: new THREE.Vector3() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec2 aInfo;
      uniform float uTime;
      uniform float uSize;
      uniform float uBeat;
      uniform vec3 uIn;
      uniform vec3 uOut;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float d = length(p.xz);
        // Inner stars orbit faster than outer ones.
        float ang = atan(p.z, p.x) + uTime * (0.32 / (d + 0.7));
        p.xz = vec2(cos(ang), sin(ang)) * d;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float s = mix(0.55, 1.9, aInfo.y) * (1.0 + uBeat * 0.9 * (1.0 - aInfo.x));
        gl_PointSize = uSize * s / -mv.z;
        vColor = mix(uIn, uOut, smoothstep(0.0, 0.7, aInfo.x));
        // The dense centre adds up to white quickly, so its stars are fainter.
        vAlpha = mix(0.4, 0.6, smoothstep(0.0, 0.35, aInfo.x));
      }
    `,
    fragmentShader: SOFT_POINT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(geometry, material);
  const core = glow(THREE, new THREE.Vector3(), 0.3);
  core.scale.setScalar(4.2);
  const haze = glow(THREE, new THREE.Vector3(), 0.14);
  haze.scale.setScalar(15);
  scene.add(haze, stars, core);

  const api = {
    scene,
    camera,
    resize(w, h, pr) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uSize.value = 26 * pr;
    },
    setColors(c) {
      const inner = vivid(c.accent).map(v => lerp(v, 1, 0.25));
      uniforms.uIn.value.set(...inner);
      uniforms.uOut.value.set(...vivid(c.b));
      core.material.uniforms.uColor.value.set(...inner);
      haze.material.uniforms.uColor.value.set(...vivid(c.a));
    },
    update(dt, t, input) {
      uniforms.uTime.value = t;
      uniforms.uBeat.value = input.beat;
      camera.position.set(Math.sin(t * 0.05) * 0.8 + input.x * 1.6, 3.3 - input.y * 1.3, 7.4);
      camera.lookAt(0, -0.5, 0);
      core.quaternion.copy(camera.quaternion);
      haze.quaternion.copy(camera.quaternion);
      core.material.uniforms.uOpacity.value = 0.3 + input.beat * 0.35;
    },
    dispose: () => disposeAll(scene),
  };
  api.setColors(cfg);
  return api;
}

/* ---------- Orb: a glossy sphere that morphs with 3D noise ---------- */

function orb(THREE, renderer, cfg, { mobile }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.32 },
    uFreq: { value: 1.35 },
    uBeat: { value: 0 },
    uA: { value: new THREE.Vector3() },
    uB: { value: new THREE.Vector3() },
    uC: { value: new THREE.Vector3() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      uniform float uFreq;
      varying vec3 vN;
      varying vec3 vV;
      varying float vF;
      ${NOISE3}
      float field(vec3 d) {
        return fbm3(d * uFreq + vec3(0.0, uTime * 0.18, uTime * 0.07)) - 0.5;
      }
      vec3 shape(vec3 d) { return d * (1.0 + field(d) * uAmp); }
      void main() {
        vec3 d = normalize(position);
        vec3 t = normalize(cross(d, abs(d.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 b = cross(d, t);
        // Normal of the displaced surface from two nearby samples.
        float e = 0.015;
        vec3 p0 = shape(d);
        vec3 p1 = shape(normalize(d + t * e));
        vec3 p2 = shape(normalize(d + b * e));
        vec3 n = normalize(cross(p1 - p0, p2 - p0));
        vF = field(d);
        vec4 mv = modelViewMatrix * vec4(p0, 1.0);
        vN = normalize(normalMatrix * n);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uBeat;
      uniform vec3 uA;
      uniform vec3 uB;
      uniform vec3 uC;
      varying vec3 vN;
      varying vec3 vV;
      varying float vF;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(vV);
        float ndv = max(dot(n, v), 0.0);
        float fres = pow(1.0 - ndv, 3.0);
        float band = 0.5 + 0.5 * sin(vF * 11.0 + ndv * 3.0 - uTime * 0.8);
        vec3 base = mix(uA, uB, band);
        vec3 L = normalize(vec3(-0.5, 0.8, 0.6));
        vec3 col = base * (0.3 + 0.7 * max(dot(n, L), 0.0));
        float spec = pow(max(dot(reflect(-L, n), v), 0.0), 36.0);
        col += vec3(spec * 0.6);
        col += uC * fres * (1.5 + uBeat * 1.2);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, mobile ? 22 : 40), material);
  mesh.scale.setScalar(2.6);

  const halo = glow(THREE, new THREE.Vector3(), 0.32);
  halo.scale.setScalar(11);
  halo.position.z = -2;

  // A thin ring of dust orbiting the orb.
  const ringCount = mobile ? 900 : 1800;
  const ringPos = new Float32Array(ringCount * 3);
  for (let i = 0; i < ringCount; i++) {
    const a = Math.random() * TAU;
    const r = rand(3.3, 4.6);
    ringPos.set([Math.cos(a) * r, rand(-0.06, 0.06), Math.sin(a) * r], i * 3);
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
  const ringUniforms = { uSize: { value: 20 }, uColor: { value: new THREE.Vector3() } };
  const ring = new THREE.Points(
    ringGeo,
    new THREE.ShaderMaterial({
      uniforms: ringUniforms,
      vertexShader: /* glsl */ `
        uniform float uSize;
        uniform vec3 uColor;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize / -mv.z;
          vColor = uColor;
          vAlpha = 0.7;
        }
      `,
      fragmentShader: SOFT_POINT_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  ring.rotation.set(1.2, 0, 0.35);
  scene.add(halo, mesh, ring);

  const api = {
    scene,
    camera,
    resize(w, h, pr) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      ringUniforms.uSize.value = 22 * pr;
    },
    setColors(c) {
      uniforms.uA.value.set(...vivid(c.a).map(v => v * 0.8));
      uniforms.uB.value.set(...vivid(c.b).map(v => v * 0.9));
      uniforms.uC.value.set(...vivid(c.accent));
      halo.material.uniforms.uColor.value.set(...vivid(c.accent));
      ringUniforms.uColor.value.set(...vivid(c.accent).map(v => lerp(v, 1, 0.4)));
    },
    update(dt, t, input) {
      uniforms.uTime.value = t;
      uniforms.uBeat.value = input.beat;
      uniforms.uAmp.value = 0.3 + input.bass * 0.18 + input.beat * 0.35;
      mesh.rotation.y += dt * 0.12;
      mesh.rotation.x = lerp(mesh.rotation.x, -input.y * 0.4, Math.min(1, dt * 2));
      ring.rotation.y += dt * 0.05;
      camera.position.set(input.x * 0.7, input.y * 0.5, 9);
      camera.lookAt(0, 0, 0);
      halo.quaternion.copy(camera.quaternion);
      halo.material.uniforms.uOpacity.value = 0.3 + input.beat * 0.35;
    },
    dispose: () => disposeAll(scene),
  };
  api.setColors(cfg);
  return api;
}

/* ---------- Liquid: a flowing, domain-warped gradient ---------- */

function liquid(THREE, renderer, cfg) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2() },
    uBeat: { value: 0 },
    uA: { value: new THREE.Vector3() },
    uB: { value: new THREE.Vector3() },
    uC: { value: new THREE.Vector3() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec2 uRes;
      uniform vec2 uMouse;
      uniform float uBeat;
      uniform vec3 uA;
      uniform vec3 uB;
      uniform vec3 uC;
      varying vec2 vUv;
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = r * p * 2.0 + 0.17;
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.4;
        p += uMouse * 0.25;
        float t = uTime * 0.07;
        vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
        vec2 r = vec2(fbm(p + 3.6 * q + vec2(1.7, 9.2) + t * 1.4),
                      fbm(p + 3.6 * q + vec2(8.3, 2.8) - t * 1.2));
        float f = fbm(p + 3.2 * r);
        vec3 col = mix(uA, uB, smoothstep(0.15, 0.85, f));
        col = mix(col, uC, smoothstep(0.28, 0.9, length(r) * f) * (0.75 + uBeat * 0.5));
        col += 0.12 * smoothstep(0.6, 0.95, f);
        col *= 0.85 + 0.4 * f;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const api = {
    scene,
    camera,
    renderScale: 0.5, // smooth noise: rendering at half resolution is invisible and much cheaper
    resize(w, h) {
      uniforms.uRes.value.set(w, h);
    },
    setColors(c) {
      uniforms.uA.value.set(...srgb(c.a).map(v => Math.max(v, 0.03)));
      uniforms.uB.value.set(...srgb(c.b).map(v => Math.max(v, 0.03)));
      uniforms.uC.value.set(...srgb(c.accent));
    },
    update(dt, t, input) {
      uniforms.uTime.value = t;
      uniforms.uBeat.value = input.beat;
      uniforms.uMouse.value.set(input.x, input.y);
    },
    dispose: () => disposeAll(scene),
  };
  api.setColors(cfg);
  return api;
}

/* ---------- Waves: an ocean of glowing points; the pointer makes ripples ---------- */

function waves(THREE, renderer, cfg, { mobile }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
  const seg = Math.round((mobile ? 110 : 170) * Math.sqrt(cfg.density));
  const geometry = new THREE.PlaneGeometry(44, 44, seg, seg);
  geometry.rotateX(-Math.PI / 2);
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 1 },
    uSize: { value: 40 },
    uPtr: { value: new THREE.Vector3(0, 0, -1000) },
    uPtrOn: { value: 0 },
    uA: { value: new THREE.Vector3() },
    uC: { value: new THREE.Vector3() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      uniform float uSize;
      uniform vec3 uPtr;
      uniform float uPtrOn;
      uniform vec3 uA;
      uniform vec3 uC;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime;
        float h = sin(p.x * 0.32 + t * 0.9) * 0.45
                + sin(p.z * 0.27 - t * 0.7) * 0.55
                + sin((p.x * 0.6 + p.z) * 0.16 + t * 0.5) * 0.6;
        float d = distance(p.xz, uPtr.xz);
        h += uPtrOn * 0.9 * exp(-d * d * 0.05) * sin(d * 1.4 - t * 4.0);
        h *= uAmp;
        p.y += h;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize / -mv.z;
        vColor = mix(uA, uC, smoothstep(-0.7, 1.2, h));
        vAlpha = smoothstep(36.0, 9.0, -mv.z) * smoothstep(0.5, 3.0, -mv.z) * 0.95;
      }
    `,
    fragmentShader: SOFT_POINT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();

  const api = {
    scene,
    camera,
    resize(w, h, pr) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uSize.value = 46 * pr;
    },
    setColors(c) {
      uniforms.uA.value.set(...vivid(c.b).map(v => v * 0.55));
      uniforms.uC.value.set(...vivid(c.accent).map(v => lerp(v, 1, 0.15)));
    },
    update(dt, t, input) {
      uniforms.uTime.value = t;
      uniforms.uAmp.value = 1 + input.bass * 0.6 + input.beat * 1.2;
      camera.position.set(input.x * 1.5, 3.3 + input.y * 0.8, 12);
      camera.lookAt(0, 0, -6);
      uniforms.uPtrOn.value = lerp(uniforms.uPtrOn.value, input.active ? 1 : 0, Math.min(1, dt * 3));
      if (input.active) {
        ndc.set(input.rawX, input.rawY);
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(plane, hit)) uniforms.uPtr.value.lerp(hit, Math.min(1, dt * 8));
      }
    },
    dispose: () => disposeAll(scene),
  };
  api.setColors(cfg);
  return api;
}

/* ---------- Warp: stars streaking past; hold the pointer down to speed up ---------- */

function warp(THREE, renderer, cfg, { mobile }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);
  const N = Math.round((mobile ? 1400 : 2600) * cfg.density);
  const DEPTH = 120;
  const stars = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * TAU;
    const r = 1.5 + Math.pow(Math.random(), 0.7) * 40;
    stars.set([Math.cos(a) * r, Math.sin(a) * r, Math.random() * DEPTH], i * 3);
  }
  const uniforms = {
    uTravel: { value: 0 },
    uSpeed: { value: 1 },
    uDepth: { value: DEPTH },
    uSize: { value: 30 },
    uHead: { value: new THREE.Vector3() },
    uTail: { value: new THREE.Vector3() },
  };
  const HEAD = /* glsl */ `
    attribute vec3 aStar;
    uniform float uTravel;
    uniform float uSpeed;
    uniform float uDepth;
    float starZ() { return mod(aStar.z + uTravel, uDepth) - uDepth; }
  `;

  // Streaks: two vertices per star, the tail stretches with speed.
  const lineStar = new Float32Array(N * 6);
  const lineEnd = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    lineStar.set(stars.subarray(i * 3, i * 3 + 3), i * 6);
    lineStar.set(stars.subarray(i * 3, i * 3 + 3), i * 6 + 3);
    lineEnd[i * 2 + 1] = 1;
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  lineGeo.setAttribute('aStar', new THREE.BufferAttribute(lineStar, 3));
  lineGeo.setAttribute('aEnd', new THREE.BufferAttribute(lineEnd, 1));
  const lines = new THREE.LineSegments(
    lineGeo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        ${HEAD}
        attribute float aEnd;
        uniform vec3 uTail;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float z = starZ() - aEnd * (0.3 + uSpeed * uSpeed * 0.9);
          vec4 mv = modelViewMatrix * vec4(aStar.xy, z, 1.0);
          gl_Position = projectionMatrix * mv;
          vColor = uTail;
          vAlpha = smoothstep(-uDepth, -uDepth * 0.55, z) * (1.0 - aEnd) * clamp(uSpeed * 0.35, 0.15, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() { gl_FragColor = vec4(vColor, vAlpha); }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  const headGeo = new THREE.BufferGeometry();
  headGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  headGeo.setAttribute('aStar', new THREE.BufferAttribute(stars, 3));
  const heads = new THREE.Points(
    headGeo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        ${HEAD}
        uniform float uSize;
        uniform vec3 uHead;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float z = starZ();
          vec4 mv = modelViewMatrix * vec4(aStar.xy, z, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = min(uSize / -mv.z, 18.0);
          vColor = uHead;
          vAlpha = smoothstep(-uDepth, -uDepth * 0.6, z);
        }
      `,
      fragmentShader: SOFT_POINT_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  // The geometry has no real positions, so bounds-based culling would hide it.
  lines.frustumCulled = false;
  heads.frustumCulled = false;

  const tunnel = glow(THREE, new THREE.Vector3(), 0.35);
  tunnel.scale.setScalar(70);
  tunnel.position.z = -110;
  scene.add(tunnel, lines, heads);

  let speed = 1;
  let travel = 0;
  const api = {
    scene,
    camera,
    resize(w, h, pr) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uSize.value = 70 * pr;
    },
    setColors(c) {
      uniforms.uHead.value.set(...vivid(c.accent).map(v => lerp(v, 1, 0.6)));
      uniforms.uTail.value.set(...vivid(c.accent));
      tunnel.material.uniforms.uColor.value.set(...vivid(c.b));
    },
    update(dt, t, input) {
      const target = 1 + (input.down ? 7 : 0) + input.beat * 3;
      speed = lerp(speed, target, Math.min(1, dt * (input.down ? 1.6 : 2.4)));
      travel = (travel + speed * dt * 14) % DEPTH;
      uniforms.uTravel.value = travel;
      uniforms.uSpeed.value = speed;
      camera.position.set(input.x * 1.2, input.y * 0.8, 0);
      camera.lookAt(input.x * 4, input.y * 3, -50);
      camera.rotateZ(t * 0.03);
    },
    dispose: () => disposeAll(scene),
  };
  api.setColors(cfg);
  return api;
}

/* ---------- Shapes: glossy iridescent shapes floating around the card ---------- */

function shapes(THREE, renderer, cfg, { mobile }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  camera.position.set(0, 0, 14);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Reflections come from a tiny "studio" of coloured light panels.
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTarget = null;
  const buildEnv = c => {
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x0b0b10);
    const panel = (hex, boost, x, y, z, w, h) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(boost), side: THREE.DoubleSide }),
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      studio.add(m);
    };
    panel(c.accent, 3, -6, 4, 4, 6, 4);
    panel(toHex(vivid(c.b)), 2.5, 6, -2, 5, 6, 6);
    panel('#ffffff', 2.2, 0, 8, 0, 8, 3);
    panel(toHex(vivid(c.a)), 2, 0, -6, -6, 10, 4);
    envTarget?.dispose();
    envTarget = pmrem.fromScene(studio, 0.035);
    disposeAll(studio);
    scene.environment = envTarget.texture;
  };

  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(5, 8, 6);
  const light1 = new THREE.PointLight(0xffffff, 40, 0, 2);
  light1.position.set(-6, 3, 5);
  const light2 = new THREE.PointLight(0xffffff, 40, 0, 2);
  light2.position.set(6, -4, 4);
  scene.add(ambient, key, light1, light2);

  const geos = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.75, 0.3, 32, 96),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TorusKnotGeometry(0.6, 0.22, 160, 24),
    new THREE.DodecahedronGeometry(0.9, 0),
    new THREE.SphereGeometry(0.75, 48, 32),
    new THREE.CapsuleGeometry(0.42, 0.9, 8, 24),
  ];
  const faceted = new Set([0, 2, 4]);
  const group = new THREE.Group();
  const count = Math.round((mobile ? 10 : 16) * Math.min(1.5, cfg.density));
  for (let i = 0; i < count; i++) {
    const material = new THREE.MeshPhysicalMaterial({
      metalness: 0.25,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 0.7,
      iridescenceIOR: 1.35,
      envMapIntensity: 1.3,
      flatShading: faceted.has(i % geos.length),
    });
    const mesh = new THREE.Mesh(geos[i % geos.length], material);
    // On a ring around the middle, so the card doesn't hide them.
    const a = (i / count) * TAU + rand(-0.2, 0.2);
    const r = rand(4.4, 7.6);
    mesh.position.set(Math.cos(a) * r * 1.35, Math.sin(a) * r * 0.8, rand(-6, 1.5));
    mesh.rotation.set(rand(0, TAU), rand(0, TAU), 0);
    mesh.userData = {
      baseY: mesh.position.y,
      spin: new THREE.Vector3(rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.2, 0.2)),
      phase: rand(0, TAU),
      size: rand(0.7, 1.25),
      boost: 0,
    };
    group.add(mesh);
  }
  scene.add(group);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const api = {
    scene,
    camera,
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    setColors(c) {
      const palette = [c.accent, toHex(vivid(c.b)), toHex(vivid(c.a)), '#f4f4f8'];
      group.children.forEach((m, i) => m.material.color.set(palette[i % palette.length]));
      light1.color.set(c.accent);
      light2.color.set(toHex(vivid(c.b)));
      buildEnv(c);
    },
    update(dt, t, input) {
      for (const click of input.clicks) {
        ndc.set(click.x, click.y);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(group.children, false)[0];
        if (hit) hit.object.userData.boost = 1.6;
      }
      for (const m of group.children) {
        const u = m.userData;
        const k = 1 + u.boost * 9;
        m.rotation.x += u.spin.x * k * dt;
        m.rotation.y += u.spin.y * k * dt;
        m.rotation.z += u.spin.z * k * dt;
        u.boost = Math.max(0, u.boost - dt * 0.9);
        m.position.y = u.baseY + Math.sin(t * 0.6 + u.phase) * 0.35;
        m.scale.setScalar(u.size * (1 + input.beat * 0.18 + u.boost * 0.12));
      }
      group.rotation.y = lerp(group.rotation.y, input.x * 0.25, Math.min(1, dt * 2));
      group.rotation.x = lerp(group.rotation.x, -input.y * 0.15, Math.min(1, dt * 2));
      camera.position.set(input.x * 0.8, input.y * 0.5, 14);
      camera.lookAt(0, 0, 0);
    },
    dispose() {
      geos.forEach(g => g.dispose());
      group.children.forEach(m => m.material.dispose());
      envTarget?.dispose();
      pmrem.dispose();
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
    },
  };
  api.setColors(cfg);
  return api;
}

export const SCENES = { galaxy, orb, liquid, waves, warp, shapes };
