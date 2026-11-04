/**
 * Minimal WebGL2 plumbing for the profile effects: programs, a full-screen
 * triangle and render targets. Everything is created per canvas and released
 * in `destroy`, so effects can be switched freely in the editor.
 */
export type GL = WebGL2RenderingContext;

/** Every effect implements this; GLBackground drives it. */
export interface Engine {
  resize(cssW: number, cssH: number, dpr: number): void;
  frame(dt: number, time: number): void;
  /** x, y in 0..1 (y up). dx, dy are the movement since the last event. */
  pointer?(x: number, y: number, dx: number, dy: number, burst?: boolean): void;
  destroy(): void;
}

export interface EffectOptions {
  accent: string;
  bg: string;
  intensity: number; // 0..1
  rainbow: boolean;
  /** Draw with transparency so a background image or video shows through. */
  transparent: boolean;
}

export function getGL(canvas: HTMLCanvasElement): GL {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });
  if (!gl) throw new Error('WebGL2 is not available');
  return gl;
}

export function compile(gl: GL, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) throw new Error('Could not create shader');
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader failed to compile: ${log}`);
  }
  return s;
}

export class Program {
  readonly id: WebGLProgram;
  readonly u: Record<string, WebGLUniformLocation | null> = {};
  constructor(private gl: GL, vs: WebGLShader, fsSource: string) {
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSource);
    const p = gl.createProgram();
    if (!p) throw new Error('Could not create program');
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`Program failed to link: ${gl.getProgramInfoLog(p)}`);
    this.id = p;
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      if (info) this.u[info.name] = gl.getUniformLocation(p, info.name);
    }
  }
  use() {
    this.gl.useProgram(this.id);
    return this.u;
  }
}

/** One triangle that covers the whole viewport; cheaper than a quad. */
export function fullscreenTriangle(gl: GL) {
  const vao = gl.createVertexArray();
  const buf = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  return {
    draw: () => {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy: () => {
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
    },
  };
}

export interface Format { internal: number; format: number }

export interface Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w: number;
  h: number;
  texel: [number, number];
}

export function createTarget(gl: GL, w: number, h: number, f: Format, filter: number): Target {
  const tex = gl.createTexture()!;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, f.internal, w, h, 0, f.format, gl.HALF_FLOAT, null);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return { tex, fbo, w, h, texel: [1 / w, 1 / h] };
}

export function deleteTarget(gl: GL, t: Target) {
  gl.deleteTexture(t.tex);
  gl.deleteFramebuffer(t.fbo);
}

/** Two targets that swap roles: read from one while writing the other. */
export class PingPong {
  read: Target;
  write: Target;
  constructor(gl: GL, w: number, h: number, f: Format, filter: number) {
    this.read = createTarget(gl, w, h, f, filter);
    this.write = createTarget(gl, w, h, f, filter);
  }
  swap() {
    [this.read, this.write] = [this.write, this.read];
  }
  destroy(gl: GL) {
    deleteTarget(gl, this.read);
    deleteTarget(gl, this.write);
  }
}

/** Picks the smallest half-float format the GPU can render to, or throws. */
export function pickFormat(gl: GL, wanted: 'r' | 'rg' | 'rgba'): Format {
  const all: Record<string, Format> = {
    r: { internal: gl.R16F, format: gl.RED },
    rg: { internal: gl.RG16F, format: gl.RG },
    rgba: { internal: gl.RGBA16F, format: gl.RGBA },
  };
  const order = wanted === 'r' ? ['r', 'rg', 'rgba'] : wanted === 'rg' ? ['rg', 'rgba'] : ['rgba'];
  for (const k of order) {
    const f = all[k];
    const t = createTarget(gl, 4, 4, f, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    deleteTarget(gl, t);
    if (ok) return f;
  }
  throw new Error('No renderable half-float format');
}

/** Frees the context right away instead of waiting for garbage collection. */
export function loseContext(gl: GL) {
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}
