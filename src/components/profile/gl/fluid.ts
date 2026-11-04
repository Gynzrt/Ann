/**
 * Real-time 2D fluid on the GPU, using the classic "stable fluids" method
 * (semi-Lagrangian advection, vorticity confinement, a Jacobi pressure solve
 * and projection). Velocity lives on a coarse grid; coloured dye is carried
 * on a finer one and lit with a soft relief when drawn.
 */
import type { Engine, EffectOptions, Format, GL, Target } from './engine';
import { PingPong, Program, compile, createTarget, deleteTarget, fullscreenTriangle, getGL, loseContext, pickFormat } from './engine';
import { hexToRgb, hsvToRgb, rgbToHsv } from '@/lib/color';

const VERT = `#version 300 es
in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
`;

/** Adds a soft gaussian blob of `uColor` (dye colour, or a velocity impulse) around a point. */
const SPLAT = `${HEAD}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 uColor;
uniform vec2 uPoint;
uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 blob = exp(-dot(p, p) / uRadius) * uColor;
  fragColor = vec4(texture(uTarget, vUv).xyz + blob, 1.0);
}`;

/** Moves a quantity along the velocity field by tracing each cell backwards in time. */
const ADVECT = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 from = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  fragColor = texture(uSource, from) / (1.0 + uDissipation * uDt);
}`;

const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  // Solid walls: reflect the velocity at the edges.
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CURL = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

/** Puts back the small swirls that numerical diffusion smooths away. */
const VORTICITY = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uStrength;
uniform float uDt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 n = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  n /= length(n) + 0.0001;
  vec2 force = uStrength * C * vec2(n.x, -n.y);
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  fragColor = vec4(clamp(v, vec2(-1000.0), vec2(1000.0)), 0.0, 1.0);
}`;

const JACOBI = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + T + B - d) * 0.25, 0.0, 0.0, 1.0);
}`;

/** Subtracting the pressure gradient leaves a divergence-free (incompressible) flow. */
const PROJECT = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - 0.5 * vec2(R - L, T - B);
  fragColor = vec4(v, 0.0, 1.0);
}`;

const SCALE = `${HEAD}
uniform sampler2D uTex;
uniform float uValue;
void main() {
  fragColor = uValue * texture(uTex, vUv);
}`;

/** Draws the dye with a gentle relief light and tone mapping so overlaps never clip. */
const DISPLAY = `${HEAD}
uniform sampler2D uDye;
uniform vec3 uBg;
uniform float uIntensity;
uniform float uOpaque;
void main() {
  vec3 c = texture(uDye, vUv).rgb;
  float l = length(texture(uDye, vL).rgb);
  float r = length(texture(uDye, vR).rgb);
  float t = length(texture(uDye, vT).rgb);
  float b = length(texture(uDye, vB).rgb);
  vec3 n = normalize(vec3(l - r, b - t, 0.55));
  float light = clamp(dot(n, normalize(vec3(-0.35, 0.6, 1.0))), 0.0, 1.0);
  c *= (0.5 + 0.7 * light) * uIntensity;
  c = 1.0 - exp(-c * 1.6);
  float a = clamp(max(c.r, max(c.g, c.b)) * 1.25, 0.0, 1.0);
  fragColor = uOpaque > 0.5 ? vec4(min(uBg + c, vec3(1.0)), 1.0) : vec4(c, a);
}`;

const SIM_BASE = 128;
const PRESSURE_ITERATIONS = 20;
const CURL_STRENGTH = 26;
const VELOCITY_FADE = 0.25;
const DYE_FADE = 0.9;
const PRESSURE_KEEP = 0.8;
const FORCE = 60;

function gridSize(base: number, w: number, h: number): [number, number] {
  const aspect = w / Math.max(h, 1);
  return aspect >= 1 ? [Math.round(base * aspect), base] : [base, Math.round(base / aspect)];
}

export class Fluid implements Engine {
  private gl: GL;
  private vs: WebGLShader;
  private tri: ReturnType<typeof fullscreenTriangle>;
  private p: Record<'splat' | 'advect' | 'divergence' | 'curl' | 'vorticity' | 'jacobi' | 'project' | 'scale' | 'display', Program>;
  private fmt: { r: Format; rg: Format; rgba: Format };
  private velocity?: PingPong;
  private dye?: PingPong;
  private pressure?: PingPong;
  private divergence?: Target;
  private curl?: Target;
  private hue = Math.random();
  private idleSince = performance.now();
  private nextAuto = 0;
  private born = performance.now();
  /** Set when fresh targets need the opening splats (also after an early resize). */
  private intro = false;
  private introduced = false;

  constructor(private canvas: HTMLCanvasElement, private opts: () => EffectOptions) {
    const gl = getGL(canvas);
    if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) {
      loseContext(gl);
      throw new Error('Float render targets are not supported');
    }
    this.gl = gl;
    this.fmt = { r: pickFormat(gl, 'r'), rg: pickFormat(gl, 'rg'), rgba: pickFormat(gl, 'rgba') };
    this.vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const mk = (src: string) => new Program(gl, this.vs, src);
    this.p = {
      splat: mk(SPLAT),
      advect: mk(ADVECT),
      divergence: mk(DIVERGENCE),
      curl: mk(CURL),
      vorticity: mk(VORTICITY),
      jacobi: mk(JACOBI),
      project: mk(PROJECT),
      scale: mk(SCALE),
      display: mk(DISPLAY),
    };
    this.tri = fullscreenTriangle(gl);
  }

  resize(cssW: number, cssH: number, dpr: number) {
    const gl = this.gl;
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    // The editor preview measures as 0×0 for a moment while it lays out; wait for a real size.
    if (cssW < 8 || cssH < 8) return;
    const [sw, sh] = gridSize(SIM_BASE, w, h);
    const dyeBase = Math.min(900, Math.max(256, Math.round(Math.min(w, h) * 0.8)));
    const [dw, dh] = gridSize(dyeBase, w, h);
    if (this.velocity && this.velocity.read.w === sw && this.velocity.read.h === sh && this.dye && this.dye.read.w === dw && this.dye.read.h === dh) return;
    this.freeTargets();
    const lin = gl.LINEAR;
    this.velocity = new PingPong(gl, sw, sh, this.fmt.rg, lin);
    this.pressure = new PingPong(gl, sw, sh, this.fmt.r, gl.NEAREST);
    this.divergence = createTarget(gl, sw, sh, this.fmt.r, gl.NEAREST);
    this.curl = createTarget(gl, sw, sh, this.fmt.r, gl.NEAREST);
    this.dye = new PingPong(gl, dw, dh, this.fmt.rgba, lin);
    if (!this.introduced || performance.now() - this.born < 3000) this.intro = true;
  }

  private bind(unit: number, tex: WebGLTexture) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    return unit;
  }

  private draw(target: Target | null) {
    const gl = this.gl;
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    this.tri.draw();
  }

  /** A dye colour near the accent hue, or anywhere on the wheel in rainbow mode. */
  private color(strength = 1): [number, number, number] {
    const o = this.opts();
    let h: number, s: number;
    if (o.rainbow) {
      this.hue = (this.hue + 0.025 + Math.random() * 0.02) % 1;
      h = this.hue;
      s = 0.85;
    } else {
      const [ah, as] = rgbToHsv(hexToRgb(o.accent));
      h = (ah + (Math.random() - 0.5) * 0.14 + 1) % 1;
      s = as < 0.15 ? as : Math.min(1, Math.max(0.55, as));
    }
    const [r, g, b] = hsvToRgb(h, s, 1);
    const k = 0.16 * strength;
    return [r * k, g * k, b * k];
  }

  private splat(x: number, y: number, vx: number, vy: number, color: [number, number, number], radius = 0.0026) {
    const gl = this.gl;
    if (!this.velocity || !this.dye) return;
    const aspect = this.canvas.width / this.canvas.height;
    const r = radius * (aspect > 1 ? aspect : 1);
    const u = this.p.splat.use();
    gl.uniform2f(u.uTexel, ...this.velocity.read.texel);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform2f(u.uPoint, x, y);
    gl.uniform1f(u.uRadius, r);

    gl.uniform1i(u.uTarget, this.bind(0, this.velocity.read.tex));
    gl.uniform3f(u.uColor, vx, vy, 0);
    this.draw(this.velocity.write);
    this.velocity.swap();

    gl.uniform1i(u.uTarget, this.bind(0, this.dye.read.tex));
    gl.uniform3f(u.uColor, ...color);
    this.draw(this.dye.write);
    this.dye.swap();
  }

  private randomSplat(strength = 1) {
    if (!this.velocity) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = (350 + Math.random() * 650) * strength;
    this.splat(0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7, Math.cos(angle) * speed, Math.sin(angle) * speed, this.color(strength), 0.004);
  }

  pointer(x: number, y: number, dx: number, dy: number, burst?: boolean) {
    if (!this.velocity) return;
    this.idleSince = performance.now();
    if (burst) {
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        this.splat(x, y, Math.cos(a) * 600, Math.sin(a) * 600, this.color(1.3), 0.004);
      }
      return;
    }
    const vx = dx * this.velocity.read.w * FORCE;
    const vy = dy * this.velocity.read.h * FORCE;
    const speed = Math.min(1, Math.hypot(dx, dy) * 40);
    if (speed < 0.02) return;
    this.splat(x, y, vx, vy, this.color(0.4 + speed));
  }

  frame(dt: number) {
    const gl = this.gl;
    const { velocity, dye, pressure, divergence, curl } = this;
    if (!velocity || !dye || !pressure || !divergence || !curl) return;
    const now = performance.now();
    if (this.intro) {
      this.intro = false;
      this.introduced = true;
      for (let i = 0; i < 6; i++) this.randomSplat(1.6);
    }
    // Keep it moving on its own when nobody is touching it.
    if (now - this.idleSince > 2200 && now > this.nextAuto) {
      this.randomSplat(1);
      this.nextAuto = now + 700 + Math.random() * 1000;
    }

    gl.disable(gl.BLEND);
    const texel = velocity.read.texel;

    let u = this.p.curl.use();
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1i(u.uVelocity, this.bind(0, velocity.read.tex));
    this.draw(curl);

    u = this.p.vorticity.use();
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1i(u.uVelocity, this.bind(0, velocity.read.tex));
    gl.uniform1i(u.uCurl, this.bind(1, curl.tex));
    gl.uniform1f(u.uStrength, CURL_STRENGTH);
    gl.uniform1f(u.uDt, dt);
    this.draw(velocity.write);
    velocity.swap();

    u = this.p.divergence.use();
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1i(u.uVelocity, this.bind(0, velocity.read.tex));
    this.draw(divergence);

    u = this.p.scale.use();
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1i(u.uTex, this.bind(0, pressure.read.tex));
    gl.uniform1f(u.uValue, PRESSURE_KEEP);
    this.draw(pressure.write);
    pressure.swap();

    u = this.p.jacobi.use();
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1i(u.uDivergence, this.bind(1, divergence.tex));
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(u.uPressure, this.bind(0, pressure.read.tex));
      this.draw(pressure.write);
      pressure.swap();
    }

    u = this.p.project.use();
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1i(u.uPressure, this.bind(0, pressure.read.tex));
    gl.uniform1i(u.uVelocity, this.bind(1, velocity.read.tex));
    this.draw(velocity.write);
    velocity.swap();

    u = this.p.advect.use();
    gl.uniform2f(u.uTexel, ...texel);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1i(u.uVelocity, this.bind(0, velocity.read.tex));
    gl.uniform1i(u.uSource, this.bind(0, velocity.read.tex));
    gl.uniform1f(u.uDissipation, VELOCITY_FADE);
    this.draw(velocity.write);
    velocity.swap();

    gl.uniform1i(u.uVelocity, this.bind(0, velocity.read.tex));
    gl.uniform1i(u.uSource, this.bind(1, dye.read.tex));
    gl.uniform1f(u.uDissipation, DYE_FADE);
    this.draw(dye.write);
    dye.swap();

    const o = this.opts();
    u = this.p.display.use();
    gl.uniform2f(u.uTexel, ...dye.read.texel);
    gl.uniform1i(u.uDye, this.bind(0, dye.read.tex));
    gl.uniform3f(u.uBg, ...hexToRgb(o.bg));
    gl.uniform1f(u.uIntensity, 0.35 + o.intensity * 1.1);
    gl.uniform1f(u.uOpaque, o.transparent ? 0 : 1);
    this.draw(null);
  }

  private freeTargets() {
    const gl = this.gl;
    this.velocity?.destroy(gl);
    this.dye?.destroy(gl);
    this.pressure?.destroy(gl);
    if (this.divergence) deleteTarget(gl, this.divergence);
    if (this.curl) deleteTarget(gl, this.curl);
    this.velocity = this.dye = this.pressure = undefined;
    this.divergence = this.curl = undefined;
  }

  destroy() {
    const gl = this.gl;
    this.freeTargets();
    Object.values(this.p).forEach((pr) => gl.deleteProgram(pr.id));
    gl.deleteShader(this.vs);
    this.tri.destroy();
    loseContext(gl);
  }
}
