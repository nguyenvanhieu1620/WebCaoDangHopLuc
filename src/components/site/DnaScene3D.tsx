"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Cảnh 3D tương tác (khối "Vì sao chọn Hợp Lực" ở Trang chủ): chuỗi xoắn kép DNA + vài phân tử
 * nhỏ + vòng quỹ đạo và bụi sáng, vẽ bằng Canvas 2D với phép chiếu phối
 * cảnh tự viết (KHÔNG dùng three.js/WebGL — giữ dự án ít phụ thuộc, nhẹ trên
 * điện thoại). Màu lấy đúng token thương hiệu (brand/accent).
 *
 * Tương tác: xoay liên tục, nghiêng theo con trỏ chuột (chỉ thiết bị có
 * chuột), xoắn thêm theo vị trí cuộn trang.
 *
 * Hiệu năng & an toàn hiển thị (theo bài học ở CLAUDE.md mục 5 "Đợt hiệu ứng"):
 *   - Vẽ ngay 1 khung hình tĩnh lúc mount — kể cả khi requestAnimationFrame
 *     không bao giờ chạy (tab nền, sandbox), cảnh vẫn hiện đầy đủ, không trống.
 *   - Chỉ chạy vòng lặp khi canvas đang trong khung nhìn VÀ tab đang hiện.
 *   - `prefers-reduced-motion: reduce` → chỉ vẽ 1 khung tĩnh, không chuyển động.
 *   - Quả cầu vẽ từ sprite dựng sẵn (offscreen canvas) thay vì tạo gradient
 *     mỗi khung hình; giới hạn devicePixelRatio ≤ 2.
 */

type RGB = readonly [number, number, number];
type Vec = { x: number; y: number; z: number };
type Drawable = { z: number; draw: () => void };

// Token màu (tailwind.config.ts) dạng RGB để tô canvas.
const BRAND_900: RGB = [6, 50, 90];
const BRAND_700: RGB = [11, 108, 176];
const BRAND_500: RGB = [30, 154, 214];
const BRAND_200: RGB = [191, 225, 244];
const ACCENT_700: RGB = [156, 22, 27];
const ACCENT_600: RGB = [196, 30, 36];
const ACCENT_500: RGB = [232, 86, 47];
const ACCENT_200: RGB = [247, 196, 186];

const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;

const PAIRS = 28; // số cặp base của chuỗi xoắn
const HELIX_LEN = 2.7; // chiều dài trục (đơn vị thế giới)
const HELIX_R = 0.44;
const TWIST = 0.42; // góc xoắn giữa 2 cặp liên tiếp (rad)
const CAMERA = 4.2; // khoảng cách camera — càng nhỏ phối cảnh càng mạnh
const PARTICLES = 46;

/** Sprite quả cầu bóng (highlight trắng → màu → viền đậm) dựng 1 lần, vẽ lại bằng drawImage. */
function makeSphereSprite(light: RGB, base: RGB, deep: RGB): HTMLCanvasElement {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(size * 0.36, size * 0.32, size * 0.04, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,0.98)");
  grad.addColorStop(0.16, rgba(light, 1));
  grad.addColorStop(0.55, rgba(base, 1));
  grad.addColorStop(1, rgba(deep, 1));
  g.fillStyle = grad;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  g.fill();
  return c;
}

function rotate(p: Vec, yaw: number, pitch: number, roll: number): Vec {
  let { x, y, z } = p;
  let c = Math.cos(yaw);
  let s = Math.sin(yaw);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(pitch);
  s = Math.sin(pitch);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(roll);
  s = Math.sin(roll);
  [x, y] = [x * c - y * s, x * s + y * c];
  return { x, y, z };
}

/** Hạt bụi sáng — vị trí giả ngẫu nhiên cố định (không dùng Math.random để server/client và mỗi lần mount giống nhau). */
function seededParticles(): Vec[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: PARTICLES }, () => ({ x: rand() * 4 - 2, y: rand() * 3.4 - 1.7, z: rand() * 3 - 1.5 }));
}

const MOLECULES = [
  { c: { x: 1.25, y: -0.95, z: 0.35 }, core: "accent", r: 0.11, spin: 0.7, phase: 0 },
  { c: { x: -1.3, y: 0.85, z: -0.4 }, core: "brand", r: 0.09, spin: -0.55, phase: 2 },
  { c: { x: -1.05, y: -1.05, z: 0.7 }, core: "brand", r: 0.07, spin: 0.9, phase: 4 },
] as const;
const MOLECULE_ARMS: Vec[] = [
  { x: 0.24, y: 0, z: 0 },
  { x: -0.12, y: 0.2, z: 0.05 },
  { x: -0.12, y: -0.2, z: -0.05 },
  { x: 0, y: 0.02, z: 0.24 },
];

/** Bảng màu theo nền: "light" cho nền sáng (paper), "dark" cho khối nền xanh đậm (brand-900). */
const THEMES = {
  light: {
    glow: [0.2, 0.06] as const,
    dust: BRAND_500,
    dustAlpha: [0.12, 0.35] as const,
    rungs: [BRAND_500, ACCENT_500] as const,
    rungAlpha: 0.42,
    backbone: [BRAND_700, ACCENT_600] as const,
    ring: BRAND_500,
    ringAlpha: 0.28,
    bond: BRAND_700,
  },
  dark: {
    glow: [0.38, 0.12] as const,
    dust: BRAND_200,
    dustAlpha: [0.1, 0.55] as const,
    rungs: [BRAND_200, ACCENT_200] as const,
    rungAlpha: 0.5,
    backbone: [BRAND_500, ACCENT_500] as const,
    ring: BRAND_200,
    ringAlpha: 0.3,
    bond: BRAND_200,
  },
};

export function DnaScene3D({ className, theme = "light" }: { className?: string; theme?: keyof typeof THEMES }) {
  const palette = THEMES[theme];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const sprites = {
      brand: makeSphereSprite(BRAND_200, BRAND_500, BRAND_900),
      accent: makeSphereSprite(ACCENT_200, ACCENT_500, ACCENT_700),
      soft: makeSphereSprite([255, 255, 255], BRAND_200, BRAND_500),
    };
    const particles = seededParticles();

    let width = 0;
    let height = 0;
    let unit = 1;
    let time = 0.8; // khung tĩnh ban đầu đẹp hơn ở góc này thay vì 0
    let last = 0;
    let raf = 0;
    let inView = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const project = (p: Vec) => {
      const s = CAMERA / (CAMERA + p.z);
      return { sx: width / 2 + p.x * unit * s, sy: height / 2 + p.y * unit * s, s };
    };
    /** Độ "gần" 0 (xa) → 1 (gần) để làm sương mờ theo chiều sâu. */
    const nearness = (z: number) => Math.min(1, Math.max(0, 0.5 - z / 3));

    const drawSphere = (sprite: HTMLCanvasElement, p: Vec, radius: number) => {
      const { sx, sy, s } = project(p);
      const r = radius * unit * s;
      ctx.globalAlpha = 0.35 + 0.65 * nearness(p.z);
      ctx.drawImage(sprite, sx - r, sy - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    };

    const drawLine = (a: Vec, b: Vec, color: RGB, alpha: number, widthPx: number) => {
      const pa = project(a);
      const pb = project(b);
      ctx.strokeStyle = rgba(color, alpha * (0.3 + 0.7 * nearness((a.z + b.z) / 2)));
      ctx.lineWidth = widthPx * ((pa.s + pb.s) / 2);
      ctx.beginPath();
      ctx.moveTo(pa.sx, pa.sy);
      ctx.lineTo(pb.sx, pb.sy);
      ctx.stroke();
    };

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const scroll = reduceMotion ? 0 : window.scrollY;
      const spin = time * 0.55 + scroll * 0.0028;
      const yaw = pointer.x * 0.45;
      const pitch = 0.1 + pointer.y * 0.28;
      const roll = -0.48 + pointer.x * 0.1;
      const bob = Math.sin(time * 0.8) * 0.05;
      const world = (p: Vec) => rotate({ x: p.x, y: p.y + bob, z: p.z }, yaw, pitch, roll);

      // Quầng sáng phía sau chuỗi xoắn.
      const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, unit * 1.6);
      glow.addColorStop(0, rgba(BRAND_500, palette.glow[0]));
      glow.addColorStop(0.55, rgba(BRAND_500, palette.glow[1]));
      glow.addColorStop(1, rgba(BRAND_500, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const items: Drawable[] = [];

      // Bụi sáng — trôi chậm lên trên, xoay theo nửa tốc độ để tạo thị sai.
      for (const p of particles) {
        let y = p.y - ((time * 0.06) % 3.4);
        if (y < -1.7) y += 3.4;
        const q = rotate({ x: p.x, y, z: p.z }, yaw * 0.5 + time * 0.05, pitch * 0.5, 0);
        items.push({
          z: q.z + 0.001,
          draw: () => {
            const { sx, sy, s } = project(q);
            ctx.fillStyle = rgba(palette.dust, palette.dustAlpha[0] + palette.dustAlpha[1] * nearness(q.z));
            ctx.beginPath();
            ctx.arc(sx, sy, 1.6 * s * (unit / 160), 0, Math.PI * 2);
            ctx.fill();
          },
        });
      }

      // Chuỗi xoắn kép.
      const strandA: Vec[] = [];
      const strandB: Vec[] = [];
      for (let i = 0; i < PAIRS; i++) {
        const y = -HELIX_LEN / 2 + (i / (PAIRS - 1)) * HELIX_LEN;
        const a = i * TWIST + spin;
        strandA.push(world({ x: Math.cos(a) * HELIX_R, y, z: Math.sin(a) * HELIX_R }));
        strandB.push(world({ x: Math.cos(a + Math.PI) * HELIX_R, y, z: Math.sin(a + Math.PI) * HELIX_R }));
      }
      for (let i = 0; i < PAIRS; i++) {
        const a = strandA[i];
        const b = strandB[i];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
        const pairTone = i % 2 === 0;
        items.push({
          z: (a.z + b.z) / 2 + 0.05,
          draw: () => {
            const [toneA, toneB] = pairTone ? palette.rungs : [palette.rungs[1], palette.rungs[0]];
            drawLine(a, mid, toneA, palette.rungAlpha, unit / 60);
            drawLine(mid, b, toneB, palette.rungAlpha, unit / 60);
          },
        });
        if (i < PAIRS - 1) {
          const a2 = strandA[i + 1];
          const b2 = strandB[i + 1];
          items.push({ z: (a.z + a2.z) / 2 + 0.02, draw: () => drawLine(a, a2, palette.backbone[0], 0.55, unit / 75) });
          items.push({ z: (b.z + b2.z) / 2 + 0.02, draw: () => drawLine(b, b2, palette.backbone[1], 0.5, unit / 75) });
        }
        items.push({ z: a.z, draw: () => drawSphere(sprites.brand, a, 0.072) });
        items.push({ z: b.z, draw: () => drawSphere(sprites.accent, b, 0.072) });
      }

      // Vòng quỹ đạo nghiêng + 1 "electron" chạy quanh.
      const ringPts: Vec[] = [];
      for (let k = 0; k <= 64; k++) {
        const t = (k / 64) * Math.PI * 2;
        ringPts.push(world(rotate({ x: Math.cos(t) * 1.15, y: 0, z: Math.sin(t) * 1.15 }, 0, 1.05, 0.5)));
      }
      for (let k = 0; k < 64; k++) {
        const p = ringPts[k];
        const q = ringPts[k + 1];
        items.push({ z: (p.z + q.z) / 2 + 0.1, draw: () => drawLine(p, q, palette.ring, palette.ringAlpha, unit / 140) });
      }
      const et = time * 1.1;
      const electron = world(rotate({ x: Math.cos(et) * 1.15, y: 0, z: Math.sin(et) * 1.15 }, 0, 1.05, 0.5));
      items.push({ z: electron.z, draw: () => drawSphere(sprites.soft, electron, 0.05) });

      // Phân tử nhỏ lơ lửng quanh chuỗi xoắn.
      for (const m of MOLECULES) {
        const local = time * m.spin + m.phase;
        const float = Math.sin(time * 0.9 + m.phase) * 0.06;
        const center = rotate({ x: m.c.x, y: m.c.y + float, z: m.c.z }, yaw * 0.6, pitch * 0.6, 0);
        const sprite = m.core === "accent" ? sprites.accent : sprites.brand;
        const arms = MOLECULE_ARMS.map((o) => {
          const r = rotate(o, local, local * 0.6, 0);
          return { x: center.x + r.x, y: center.y + r.y, z: center.z + r.z };
        });
        for (const arm of arms) {
          items.push({ z: (arm.z + center.z) / 2 + 0.03, draw: () => drawLine(center, arm, palette.bond, 0.45, unit / 90) });
          items.push({ z: arm.z, draw: () => drawSphere(sprites.soft, arm, m.r * 0.55) });
        }
        items.push({ z: center.z, draw: () => drawSphere(sprite, center, m.r) });
      }

      items.sort((p, q) => q.z - p.z);
      for (const it of items) it.draw();
    }

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      unit = Math.min(width * 0.3, height * 0.27);
      render();
    }

    function loop(now: number) {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      time += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      render();
      raf = requestAnimationFrame(loop);
    }
    const start = () => {
      if (reduceMotion || raf || !inView || document.visibilityState !== "visible") return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize(); // khung tĩnh đầu tiên — luôn có hình kể cả khi rAF không chạy
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (reduceMotion) {
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    const onPointer = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (finePointer) window.addEventListener("pointermove", onPointer, { passive: true });
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [palette]);

  // Bọc trong div: <canvas> là phần tử "replaced", đặt absolute + inset không tự giãn
  // kích thước như div — nên vị trí/kích thước đặt ở div bọc, canvas luôn lấp đầy 100%.
  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
