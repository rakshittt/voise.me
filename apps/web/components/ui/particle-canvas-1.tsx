"use client";

import { useEffect, useRef } from "react";

/* ── WebGL shader source strings ─────────────────────────────────────────── */
const VERTEX_SHADER = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  attribute vec2 a_color;
  varying vec2 v_color;
  void main(){
    gl_Position = vec4( vec2( 1, -1 ) * ( ( a_position / u_resolution ) * 2.0 - 1.0 ), 0, 1 );
    v_color = a_color;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_color;
  uniform float u_tick;
  float frac = 1.0/6.0;
  void main(){
    float hue = v_color.x + u_tick;
    hue = abs(hue - floor(hue));
    vec4 color = vec4( 0, 0, 0, 1 );
    if( hue < frac ){
      color.r = 1.0;
      color.g = hue / frac;
      color.b = 0.0;
    } else if( hue < frac * 2.0 ){
      color.r = 1.0 - ( hue - frac ) / frac;
      color.g = 1.0;
      color.b = 0.0;
    } else if( hue < frac * 3.0 ){
      color.r = 0.0;
      color.g = 1.0;
      color.b = ( hue - frac * 2.0 ) / frac;
    } else if( hue < frac * 4.0 ){
      color.r = 0.0;
      color.g = 1.0 - ( hue - frac * 3.0 ) / frac;
      color.b = 1.0;
    } else if( hue < frac * 5.0 ){
      color.r = ( hue - frac * 4.0 ) / frac;
      color.g = 0.0;
      color.b = 1.0;
    } else {
      color.r = 1.0;
      color.g = 0.0;
      color.b = 1.0 - ( hue - frac * 5.0 ) / frac;
    }
    color = vec4( color.rgb * v_color.y, 1.0 );
    gl_FragColor = color;
  }
`;

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Dims {
  width: number;
  height: number;
  cx: number;
  cy: number;
}

interface DrawData {
  triangles: number[];
  colors: number[];
}

interface WebGLState {
  shaderProgram: WebGLProgram;
  attribLocs: { position: number; color: number };
  buffers: { position: WebGLBuffer; color: WebGLBuffer };
  uniformLocs: {
    resolution: WebGLUniformLocation | null;
    tick: WebGLUniformLocation | null;
  };
  data: DrawData;
  clear(): void;
  draw(): void;
}

interface ParticleObj {
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  time: number;
  reset(): void;
  step(): void;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function linkProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return program;
}

function getCircleTriangles(x: number, y: number, r: number): number[] {
  const out: number[] = [];
  const inc = (Math.PI * 2) / 6;
  let px = x + r;
  let py = y;
  for (let i = 0; i <= Math.PI * 2 + inc; i += inc) {
    const nx = x + r * Math.cos(i);
    const ny = y + r * Math.sin(i);
    out.push(x, y, px, py, nx, ny);
    px = nx;
    py = ny;
  }
  return out;
}

/* Factory produces a particle that closes over live refs (not copies) */
function makeParticle(
  getDims: () => Dims,
  getData: () => DrawData,
  sizeMin: number,
  sizeMax: number,
  speed: number,
): ParticleObj {
  const p: ParticleObj = {
    size: 0, x: 0, y: 0, vx: 0, vy: 0, time: 1,

    reset() {
      const { cx, cy } = getDims();
      p.size = sizeMin + (sizeMax - sizeMin) * Math.random();
      p.x = cx;
      p.y = cy;
      p.vx = (Math.random() - 0.5) * 2 * speed;
      p.vy = -2 - speed * Math.random();
      p.time = 1;
    },

    step() {
      p.x += (p.vx *= 0.995);
      p.y += (p.vy += 0.05);
      p.time *= 0.99;

      const tris = getCircleTriangles(p.x, p.y, p.size * p.time);
      const hue = p.vy / 10;
      const data = getData();
      for (let i = 0; i < tris.length; i += 2) {
        data.triangles.push(tris[i], tris[i + 1]);
        data.colors.push(hue, p.time);
      }

      if (p.y - p.size > getDims().height) p.reset();
    },
  };

  p.reset();
  return p;
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
interface ParticleCanvasProps {
  maxParticles?: number;
  particleSizeMin?: number;
  particleSizeMax?: number;
  speedScale?: number;
}

export function ParticleCanvas({
  maxParticles = 1000,
  particleSizeMin = 2,
  particleSizeMax = 5,
  speedScale = 2,
}: ParticleCanvasProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const glStateRef  = useRef<WebGLState | null>(null);
  const particlesRef = useRef<ParticleObj[]>([]);
  const tickRef     = useRef(0);
  const dimsRef     = useRef<Dims>({ width: 0, height: 0, cx: 0, cy: 0 });
  const rafRef      = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true });
    if (!gl) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    dimsRef.current = { width: w, height: h, cx: w / 2, cy: h / 2 };

    const program = linkProgram(
      gl,
      compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER),
      compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER),
    );

    const posBuf = gl.createBuffer()!;
    const colBuf = gl.createBuffer()!;
    const posLoc = gl.getAttribLocation(program, "a_position");
    const colLoc = gl.getAttribLocation(program, "a_color");

    gl.viewport(0, 0, w, h);
    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.enableVertexAttribArray(colLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.vertexAttribPointer(colLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc  = gl.getUniformLocation(program, "u_resolution");
    const tickLoc = gl.getUniformLocation(program, "u_tick");
    gl.uniform2f(resLoc, w, h);
    gl.clearColor(0, 0, 0, 0);

    const data: DrawData = { triangles: [], colors: [] };

    // Capture non-null gl in a const — closures below close over this, preserving TS narrowing
    const glCtx = gl;

    const state: WebGLState = {
      shaderProgram: program,
      attribLocs: { position: posLoc, color: colLoc },
      buffers: { position: posBuf, color: colBuf },
      uniformLocs: { resolution: resLoc, tick: tickLoc },
      data,
      clear() {
        glCtx.clear(glCtx.COLOR_BUFFER_BIT);
        data.triangles = [];
        data.colors = [];
      },
      draw() {
        glCtx.uniform1f(tickLoc, tickRef.current / 100);
        glCtx.bindBuffer(glCtx.ARRAY_BUFFER, posBuf);
        glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array(data.triangles), glCtx.STATIC_DRAW);
        glCtx.bindBuffer(glCtx.ARRAY_BUFFER, colBuf);
        glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array(data.colors), glCtx.STATIC_DRAW);
        glCtx.drawArrays(glCtx.TRIANGLES, 0, data.triangles.length / 2);
      },
    };
    glStateRef.current = state;

    /* Particle factories close over live refs via getDims / getData */
    const getDims = () => dimsRef.current;
    const getData = () => data;

    function spawnParticle() {
      return makeParticle(getDims, getData, particleSizeMin, particleSizeMax, speedScale);
    }

    function animate() {
      state.clear();
      tickRef.current++;

      if (particlesRef.current.length < maxParticles) {
        particlesRef.current.push(spawnParticle(), spawnParticle());
      }

      particlesRef.current.sort((a, b) => a.time - b.time);
      particlesRef.current.forEach((p) => p.step());

      state.draw();

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    /* Event handlers */
    const onMouseMove = (e: MouseEvent) => {
      dimsRef.current.cx = e.clientX;
      dimsRef.current.cy = e.clientY;
    };

    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      canvas.width = nw;
      canvas.height = nh;
      dimsRef.current.width = nw;
      dimsRef.current.height = nh;
      gl.viewport(0, 0, nw, nh);
      gl.uniform2f(resLoc, nw, nh);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      gl.deleteProgram(program);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(colBuf);
      glStateRef.current = null;
      particlesRef.current = [];
    };
  }, [maxParticles, particleSizeMin, particleSizeMax, speedScale]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
