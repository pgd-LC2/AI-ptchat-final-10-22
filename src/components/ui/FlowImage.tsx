import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type FlowImageProps = {
  src: string;
  speed?: number;
  intensity?: number;
  scale?: number;
  hueShift?: number;
  play?: boolean;
  className?: string;
};

/**
 * FlowImage – React WebGL flow-field displacer for still images.
 *
 * Props:
 *  - src: string – image URL
 *  - speed?: number – flow evolution speed (default 0.25)
 *  - intensity?: number – UV displacement strength in normalized UV units (default 0.008)
 *  - scale?: number – noise scale (default 1.6)
 *  - hueShift?: number – subtle hue rotation strength (0 ~ 0.1, default 0.02)
 *  - play?: boolean – start/stop animation (default true)
 *  - className?: string – container styling
 *
 * The effect is GPU-based: a curl-like velocity field (from FBM noise) advects
 * the sampling coordinates of the original image, so visuals feel fluid
 * without tearing. No external libs required; works on WebGL1.
 */
const FlowImage: React.FC<FlowImageProps> = ({
  src,
  speed = 0.25,
  intensity = 0.008,
  scale = 1.6,
  hueShift = 0,
  play = true,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const texRef = useRef<WebGLTexture | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(0);
  const uLocsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext('webgl', { antialias: true, alpha: true }) ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    const vertSrc = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

      const fragSrc = `
      precision mediump float;
      varying vec2 v_uv;

      uniform sampler2D u_tex;
      uniform vec2 u_resolution;
      uniform vec2 u_imgResolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_scale;
      uniform float u_hueShift;

      float hash(vec2 p){
        p = fract(p*vec2(123.34, 345.45));
        p += dot(p, p+34.345);
        return fract(p.x*p.y);
      }
      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i+vec2(1.0,0.0));
        float c = hash(i+vec2(0.0,1.0));
        float d = hash(i+vec2(1.0,1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a, b, u.x) + (c - a)*u.y*(1.0-u.x) + (d - b)*u.x*u.y;
      }
      float fbm(vec2 p){
        float v = 0.0;
        float a = 0.5;
        mat2 m = mat2(1.6,1.2,-1.2,1.6);
        for(int i=0;i<5;i++){
          v += a*noise(p);
          p = m*p;
          a *= 0.5;
        }
        return v;
      }

      vec2 curl(vec2 p){
        float e = 0.0025;
        float n = fbm(p);
        float nx = fbm(p + vec2(e,0.0));
        float ny = fbm(p + vec2(0.0,e));
        vec2 g = vec2(nx - n, ny - n)/e;
        return vec2(-g.y, g.x);
      }

      vec2 coverUv(vec2 uv, vec2 canvasRes, vec2 imgRes){
        float cr = canvasRes.x / canvasRes.y;
        float ir = imgRes.x / imgRes.y;
        vec2 scale = vec2(1.0);
        vec2 offset = vec2(0.0);
        if (cr > ir) {
          scale.y = ir / cr;
          offset.y = (1.0 - scale.y) * 0.5;
        } else {
          scale.x = cr / ir;
          offset.x = (1.0 - scale.x) * 0.5;
        }
        return (uv * scale + offset);
      }

      vec3 hueRotate(vec3 col, float a){
        const mat3 toYIQ = mat3(
          0.299, 0.587, 0.114,
          0.596, -0.274, -0.322,
          0.211, -0.523, 0.312
        );
        const mat3 toRGB = mat3(
          1.0, 0.956, 0.621,
          1.0, -0.272, -0.647,
          1.0, -1.106, 1.703
        );
        vec3 yiq = toYIQ * col;
        float h = atan(yiq.z, yiq.y) + a;
        float r = length(yiq.yz);
        yiq.y = r * cos(h);
        yiq.z = r * sin(h);
        return clamp(toRGB * yiq, 0.0, 1.0);
      }

      void main(){
        vec2 uv = coverUv(v_uv, u_resolution, u_imgResolution);
        float t = u_time * u_speed;
        vec2 p = uv * u_scale * 2.0 + vec2(0.0, t);
        vec2 v1 = curl(p);
        vec2 v2 = curl(p*1.7 + 13.7);
        vec2 vel = normalize(v1 + 0.5*v2 + 1e-5);
        float amp = u_intensity;
        vec2 uv1 = uv + vel * amp * 0.5;
        vec2 uv2 = uv1 + vel * amp * 0.5;
        vec4 col = texture2D(u_tex, uv2);
        col.rgb = hueRotate(col.rgb, u_hueShift * sin(t*0.7));
        gl_FragColor = col;
      }
    `;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Failed to create shader');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) ?? 'Unknown shader error';
        gl.deleteShader(shader);
        throw new Error(log);
      }
      return shader;
    };

    const link = (vs: WebGLShader, fs: WebGLShader) => {
      const program = gl.createProgram();
      if (!program) throw new Error('Failed to create program');
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, 'a_position');
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program) ?? 'Unknown link error';
        gl.deleteProgram(program);
        throw new Error(log);
      }
      return program;
    };

    let resizeObserver: ResizeObserver | null = null;
    let resizeListener: (() => void) | null = null;
    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;

    try {
      vertexShader = compile(gl.VERTEX_SHADER, vertSrc);
      fragmentShader = compile(gl.FRAGMENT_SHADER, fragSrc);
      const program = link(vertexShader, fragmentShader);
      progRef.current = program;
      gl.useProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      vertexShader = null;
      fragmentShader = null;

      const buffer = gl.createBuffer();
      if (!buffer) throw new Error('Failed to create buffer');
      bufferRef.current = buffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const quad = new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      uLocsRef.current = {
        u_tex: gl.getUniformLocation(program, 'u_tex'),
        u_resolution: gl.getUniformLocation(program, 'u_resolution'),
        u_imgResolution: gl.getUniformLocation(program, 'u_imgResolution'),
        u_time: gl.getUniformLocation(program, 'u_time'),
        u_speed: gl.getUniformLocation(program, 'u_speed'),
        u_intensity: gl.getUniformLocation(program, 'u_intensity'),
        u_scale: gl.getUniformLocation(program, 'u_scale'),
        u_hueShift: gl.getUniformLocation(program, 'u_hueShift'),
      };

      const texture = gl.createTexture();
      if (!texture) throw new Error('Failed to create texture');
      texRef.current = texture;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const placeholder = new Uint8Array([128, 128, 128, 255]);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        placeholder,
      );

      const img = new Image();
      img.crossOrigin = 'anonymous';
      imgRef.current = img;
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.useProgram(program);
        gl.uniform1i(uLocsRef.current.u_tex, 0);
        gl.uniform2f(uLocsRef.current.u_imgResolution, img.width, img.height);
      };
      img.src = src;

      startTimeRef.current = performance.now();

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width * dpr));
        const height = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        gl.uniform2f(uLocsRef.current.u_resolution, canvas.width, canvas.height);
      };

      resize();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
      } else {
        resizeListener = resize;
        window.addEventListener('resize', resizeListener);
      }

      const render = (now: number) => {
        if (!gl) return;
        if (!play) {
          rafRef.current = requestAnimationFrame(render);
          return;
        }

        const elapsed = (now - startTimeRef.current) * 0.001;
        gl.useProgram(program);
        gl.uniform1f(uLocsRef.current.u_time, elapsed);
        gl.uniform1f(uLocsRef.current.u_speed, speed);
        gl.uniform1f(uLocsRef.current.u_intensity, intensity);
        gl.uniform1f(uLocsRef.current.u_scale, scale);
        gl.uniform1f(uLocsRef.current.u_hueShift, hueShift);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        rafRef.current = requestAnimationFrame(render);
      };

      rafRef.current = requestAnimationFrame(render);
    } catch (error) {
      console.error(error);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
        resizeListener = null;
      }
      if (bufferRef.current && gl) {
        gl.deleteBuffer(bufferRef.current);
        bufferRef.current = null;
      }
      if (texRef.current && gl) {
        gl.deleteTexture(texRef.current);
        texRef.current = null;
      }
      if (progRef.current && gl) {
        gl.deleteProgram(progRef.current);
        progRef.current = null;
      }
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
    };
  }, [src, speed, intensity, scale, hueShift, play]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

export default FlowImage;
