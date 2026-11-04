/**
 * Full-screen fragment-shader backgrounds. Each one is a pure function of time,
 * the pointer and the profile colours, rendered at reduced resolution and
 * scaled up by the browser, which keeps them cheap even on phones.
 */
import type { Engine, EffectOptions, GL } from './engine';
import { Program, compile, fullscreenTriangle, getGL, loseContext } from './engine';
import { hexToRgb } from '@/lib/color';

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const COMMON = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uAccent;
uniform vec3 uBg;
uniform float uIntensity;
uniform float uOpaque;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}
// Rotates a colour around the grey axis: a cheap hue shift.
vec3 hue(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}
// c is light added on top of the background.
vec4 finish(vec3 c) {
  c = max(c, 0.0) * uIntensity;
  c = 1.0 - exp(-c * 1.4);
  float a = clamp(max(c.r, max(c.g, c.b)) * 1.2, 0.0, 1.0);
  return uOpaque > 0.5 ? vec4(min(uBg + c, vec3(1.0)), 1.0) : vec4(c, a);
}
`;

/** Curtains of light drifting across the top of the page. */
const AURORA = `${COMMON}
void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  float x = uv.x * aspect + (uMouse.x - 0.5) * 0.25;
  float t = uTime * 0.07;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float drift = fbm(vec2(x * 0.9 + fi * 4.7 + t * (1.0 + fi * 0.35), t * 0.6 + fi * 1.3));
    float line = 0.66 - fi * 0.09 + 0.07 * sin(x * 1.7 + t * 3.0 + fi * 2.1) + (drift - 0.5) * 0.32;
    float d = uv.y - line;
    float band = exp(-d * d * 260.0);
    float rise = step(0.0, d) * exp(-d * 5.5) * 0.6;
    float rays = 0.55 + 0.45 * noise(vec2(x * 22.0 + fi * 9.0, t * 9.0));
    vec3 c = hue(uAccent, (fi - 1.0) * 0.6);
    col += c * (band + rise) * rays * (0.75 - fi * 0.15);
  }
  // A few faint stars above the lights.
  vec2 cell = floor(vUv * uRes / 2.5);
  float star = step(0.9965, hash(cell)) * (0.5 + 0.5 * sin(uTime * 1.7 + hash(cell + 3.1) * 6.28));
  col += vec3(star) * smoothstep(0.45, 1.0, uv.y) * 0.6;
  fragColor = finish(col * 0.8);
}`;

/** Slow, domain-warped liquid colour that bends toward the pointer. */
const LIQUID = `${COMMON}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.4;
  float t = uTime * 0.045;
  vec2 m = (uMouse - 0.5) * 0.9;
  vec2 q = vec2(fbm(p + vec2(0.0, t) + m * 0.5), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 1.4 - m * 0.3), fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 1.1));
  float f = fbm(p + 3.0 * r);
  vec3 a = uAccent;
  vec3 b = hue(uAccent, 0.85);
  vec3 c = hue(uAccent, -0.65);
  vec3 col = mix(a * 0.12, a, smoothstep(0.25, 0.95, f));
  col = mix(col, b, clamp(length(q) - 0.35, 0.0, 1.0) * 0.85);
  col = mix(col, c, smoothstep(0.5, 0.95, r.x) * 0.7);
  col *= 0.25 + 1.1 * f * f;
  fragColor = finish(col * 0.75);
}`;

/** Stars streaking outward from the centre, as if jumping to warp speed. */
const WARP = `${COMMON}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  p -= (uMouse - 0.5) * 0.08;
  float r = length(p);
  float ang = atan(p.y, p.x) + 3.14159265;
  vec3 col = uAccent * 0.05 / (r * 4.0 + 0.25);
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float cells = 150.0 + fl * 80.0;
    float ca = ang / 6.2831853 * cells;
    float id = floor(ca);
    float h = hash(vec2(id, fl * 17.3 + 1.0));
    if (h < 0.4) continue;
    float life = fract(h * 13.7 + uTime * (0.07 + 0.03 * fl) * (0.6 + h));
    float pos = life * life * 1.1;
    float tail = 0.015 + life * 0.22;
    float behind = pos - r;
    float along = step(0.0, behind) * (1.0 - smoothstep(0.0, tail, behind));
    float arc = (fract(ca) - 0.5) * (6.2831853 / cells) * r;
    float width = 0.0012 + life * 0.0026;
    float across = 1.0 - smoothstep(0.0, width, abs(arc));
    vec3 tint = mix(vec3(1.0), uAccent, 0.35 + 0.25 * fl);
    col += tint * along * across * (0.35 + life * 1.4);
  }
  fragColor = finish(col);
}`;

export const SHADERS = { aurora: AURORA, liquid: LIQUID, warp: WARP };
export type ShaderName = keyof typeof SHADERS;

/** Renders at this fraction of the canvas size; the browser smooths the upscale. */
const RENDER_SCALE = 0.6;

export class ShaderBg implements Engine {
  private gl: GL;
  private vs: WebGLShader;
  private prog: Program;
  private tri: ReturnType<typeof fullscreenTriangle>;
  private mouse = [0.5, 0.5];
  private target = [0.5, 0.5];

  constructor(private canvas: HTMLCanvasElement, name: ShaderName, private opts: () => EffectOptions) {
    const gl = getGL(canvas);
    this.gl = gl;
    this.vs = compile(gl, gl.VERTEX_SHADER, VERT);
    this.prog = new Program(gl, this.vs, SHADERS[name]);
    this.tri = fullscreenTriangle(gl);
  }

  resize(cssW: number, cssH: number, dpr: number) {
    const w = Math.max(1, Math.round(cssW * dpr * RENDER_SCALE));
    const h = Math.max(1, Math.round(cssH * dpr * RENDER_SCALE));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  pointer(x: number, y: number) {
    this.target = [x, y];
  }

  frame(dt: number, time: number) {
    const gl = this.gl;
    const k = 1 - Math.exp(-dt * 3);
    this.mouse = [this.mouse[0] + (this.target[0] - this.mouse[0]) * k, this.mouse[1] + (this.target[1] - this.mouse[1]) * k];
    const o = this.opts();
    const u = this.prog.use();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniform2f(u.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(u.uTime, time);
    gl.uniform2f(u.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform3f(u.uAccent, ...hexToRgb(o.accent));
    gl.uniform3f(u.uBg, ...hexToRgb(o.bg));
    gl.uniform1f(u.uIntensity, 0.3 + o.intensity * 1.2);
    gl.uniform1f(u.uOpaque, o.transparent ? 0 : 1);
    this.tri.draw();
  }

  destroy() {
    const gl = this.gl;
    gl.deleteProgram(this.prog.id);
    gl.deleteShader(this.vs);
    this.tri.destroy();
    loseContext(gl);
  }
}
