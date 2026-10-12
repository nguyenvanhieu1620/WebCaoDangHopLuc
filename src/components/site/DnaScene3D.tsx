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
 *     mỗi khung hình.
 *   - Điện thoại/máy tính bảng (cảm ứng hoặc < 1024px) từng bị giật (08/10/2026) → chế độ
 *     tiết kiệm: devicePixelRatio ≤ 1,5 (máy tính ≤ 2), ít cặp xoắn/hạt bụi hơn. Nhịp khung theo
 *     màn hình; chỉ tự hạ xuống 30fps đều khi đo thấy máy không kịp (xem `loop`). Bản đầu ép cứng
 *     30fps → trên iPhone vật xoay trông giật, đã bỏ.
 *   - Mỗi khung KHÔNG cấp phát đối tượng/hàm/chuỗi mới (điểm, mục vẽ dùng lại từ bể có sẵn,
 *     màu rgba tra bảng dựng sẵn) — trước đó ~300 closure + mảng tạm/khung làm GC chạy liên
 *     tục trên điện thoại. Bụi sáng + vòng quỹ đạo gom thành vài nét vẽ (trước: 46 + 64 lượt).
 *     Quầng sáng phía sau là nền CSS tĩnh của canvas, không tô gradient lại mỗi khung.
 */

type RGB = readonly [number, number, number];
type Vec = { x: number; y: number; z: number };
/** Điểm đã quay + chiếu ra màn hình (sx, sy) với hệ số phối cảnh s — dùng lại qua các khung. */
type Pt = Vec & { sx: number; sy: number; s: number };
const pt = (): Pt => ({ x: 0, y: 0, z: 0, sx: 0, sy: 0, s: 1 });

const K = { Sphere: 0, Line: 1, Rung: 2, Ring: 3, Dust: 4 } as const;
type Kind = (typeof K)[keyof typeof K];
/** 1 mục cần vẽ theo thứ tự chiều sâu — đối tượng lấy từ bể, chỉ ghi đè trường mỗi khung. */
type Item = {
  z: number;
  kind: Kind;
  a: Pt;
  b: Pt;
  c: Pt;
  color: RGB;
  alpha: number;
  w: number;
  sprite: HTMLCanvasElement | null;
  /** Ring/Dust: true = nửa phía trước (gần camera). Rung: đảo màu 2 nửa thanh. */
  flag: boolean;
};

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

const PAIRS = 28; // số cặp base của chuỗi xoắn (máy tính)
const PAIRS_LOW = 20; // chế độ tiết kiệm — xoắn mỗi cặp nhiều hơn để giữ nguyên số vòng
const HELIX_LEN = 2.7; // chiều dài trục (đơn vị thế giới)
const HELIX_R = 0.44;
const TWIST = 0.42; // góc xoắn giữa 2 cặp liên tiếp khi có PAIRS cặp (rad)
const CAMERA = 4.2; // khoảng cách camera — càng nhỏ phối cảnh càng mạnh
const PARTICLES = 46;
const PARTICLES_LOW = 24;
const RING_SEGMENTS = 48;
const ALPHA_STEPS = 40; // độ mịn bảng màu rgba dựng sẵn

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

/** Quay điểm (x,y,z) theo yaw → pitch → roll, GHI vào `out` (không cấp phát). */
function rotateInto(x: number, y: number, z: number, yaw: number, pitch: number, roll: number, out: Vec): Vec {
  let c = Math.cos(yaw);
  let s = Math.sin(yaw);
  const x1 = x * c + z * s;
  const z1 = -x * s + z * c;
  c = Math.cos(pitch);
  s = Math.sin(pitch);
  const y2 = y * c - z1 * s;
  out.z = y * s + z1 * c;
  c = Math.cos(roll);
  s = Math.sin(roll);
  out.x = x1 * c - y2 * s;
  out.y = x1 * s + y2 * c;
  return out;
}

/** Hạt bụi sáng — vị trí giả ngẫu nhiên cố định (không dùng Math.random để server/client và mỗi lần mount giống nhau). */
function seededParticles(count: number): Vec[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({ x: rand() * 4 - 2, y: rand() * 3.4 - 1.7, z: rand() * 3 - 1.5 }));
}

/** Bảng chuỗi rgba dựng sẵn theo bậc độ trong suốt — tra thay vì tạo chuỗi mới mỗi lần vẽ. */
function alphaRamp(color: RGB): string[] {
  return Array.from({ length: ALPHA_STEPS + 1 }, (_, q) => rgba(color, q / ALPHA_STEPS));
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
    // Chế độ tiết kiệm cho điện thoại/máy tính bảng: cảm ứng hoặc màn hình hẹp.
    const lowPower = !finePointer || window.innerWidth < 1024;
    const maxDpr = lowPower ? 1.5 : 2;
    // Chạy theo tần số màn hình (không ép 30fps — vật đang xoay ở 30fps trông giật trên iPhone).
    // Chỉ khi đo thấy máy KHÔNG KỊP (>25% khung trễ quá 26ms trong ~1,5s) mới chuyển hẳn sang
    // 30fps đều nhịp — đều 30 vẫn đỡ giật hơn chập chờn 40–50.
    let frameMs = 0;
    let sampled = 0;
    let slow = 0;
    const pairs = lowPower ? PAIRS_LOW : PAIRS;
    const twist = (TWIST * (PAIRS - 1)) / (pairs - 1);

    const sprites = {
      brand: makeSphereSprite(BRAND_200, BRAND_500, BRAND_900),
      accent: makeSphereSprite(ACCENT_200, ACCENT_500, ACCENT_700),
      soft: makeSphereSprite([255, 255, 255], BRAND_200, BRAND_500),
    };
    const ramps = new Map<RGB, string[]>();
    for (const color of [...palette.rungs, ...palette.backbone, palette.ring, palette.bond, palette.dust]) {
      if (!ramps.has(color)) ramps.set(color, alphaRamp(color));
    }
    const tint = (color: RGB, alpha: number) =>
      ramps.get(color)![Math.max(0, Math.min(ALPHA_STEPS, Math.round(alpha * ALPHA_STEPS)))];

    // Toạ độ gốc cố định + bể điểm/mục vẽ dùng lại mọi khung (không cấp phát trong vòng lặp).
    const dustBase = seededParticles(lowPower ? PARTICLES_LOW : PARTICLES);
    const dust = dustBase.map(pt);
    const strandA = Array.from({ length: pairs }, pt);
    const strandB = Array.from({ length: pairs }, pt);
    const mids = Array.from({ length: pairs }, pt);
    const ringBase = Array.from({ length: RING_SEGMENTS + 1 }, (_, k) => {
      const t = (k / RING_SEGMENTS) * Math.PI * 2;
      return rotateInto(Math.cos(t) * 1.15, 0, Math.sin(t) * 1.15, 0, 1.05, 0.5, { x: 0, y: 0, z: 0 });
    });
    const ring = ringBase.map(pt);
    const electron = pt();
    const molCenters = MOLECULES.map(pt);
    const molArms = MOLECULES.map(() => MOLECULE_ARMS.map(pt));
    const scratch: Vec = { x: 0, y: 0, z: 0 };
    const pool: Item[] = [];
    const items: Item[] = [];
    const ringZ = [0, 0];
    const dustZ = [0, 0];

    let width = 0;
    let height = 0;
    let unit = 1;
    let time = 0.8; // khung tĩnh ban đầu đẹp hơn ở góc này thay vì 0
    let last = 0;
    let raf = 0;
    let inView = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const project = (p: Pt) => {
      p.s = CAMERA / (CAMERA + p.z);
      p.sx = width / 2 + p.x * unit * p.s;
      p.sy = height / 2 + p.y * unit * p.s;
    };
    /** Độ "gần" 0 (xa) → 1 (gần) để làm sương mờ theo chiều sâu. */
    const nearness = (z: number) => Math.min(1, Math.max(0, 0.5 - z / 3));

    const add = (z: number, kind: Kind): Item => {
      const it = (pool[items.length] ??= {
        z: 0, kind: K.Sphere, a: electron, b: electron, c: electron, color: BRAND_500, alpha: 1, w: 1, sprite: null, flag: false,
      });
      it.z = z;
      it.kind = kind;
      items.push(it);
      return it;
    };
    const addSphere = (p: Pt, sprite: HTMLCanvasElement, radius: number) => {
      const it = add(p.z, K.Sphere);
      it.a = p;
      it.sprite = sprite;
      it.w = radius;
    };
    const addLine = (a: Pt, b: Pt, color: RGB, alpha: number, w: number, zBias: number) => {
      const it = add((a.z + b.z) / 2 + zBias, K.Line);
      it.a = a;
      it.b = b;
      it.color = color;
      it.alpha = alpha;
      it.w = w;
    };

    const drawLine = (a: Pt, b: Pt, color: RGB, alpha: number, widthPx: number) => {
      ctx.strokeStyle = tint(color, alpha * (0.3 + 0.7 * nearness((a.z + b.z) / 2)));
      ctx.lineWidth = widthPx * ((a.s + b.s) / 2);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    };

    const drawItem = (it: Item) => {
      switch (it.kind) {
        case K.Sphere: {
          const r = it.w * unit * it.a.s;
          ctx.globalAlpha = 0.35 + 0.65 * nearness(it.a.z);
          ctx.drawImage(it.sprite!, it.a.sx - r, it.a.sy - r, r * 2, r * 2);
          ctx.globalAlpha = 1;
          break;
        }
        case K.Line:
          drawLine(it.a, it.b, it.color, it.alpha, it.w);
          break;
        case K.Rung: {
          const toneA = it.flag ? palette.rungs[1] : palette.rungs[0];
          const toneB = it.flag ? palette.rungs[0] : palette.rungs[1];
          drawLine(it.a, it.c, toneA, palette.rungAlpha, unit / 60);
          drawLine(it.c, it.b, toneB, palette.rungAlpha, unit / 60);
          break;
        }
        case K.Ring: {
          // Nửa vòng quỹ đạo (trước hoặc sau chuỗi xoắn) vẽ bằng 1 nét duy nhất.
          ctx.strokeStyle = tint(palette.ring, palette.ringAlpha * (0.3 + 0.7 * nearness(it.z)));
          ctx.lineWidth = (unit / 140) * (CAMERA / (CAMERA + it.z));
          ctx.beginPath();
          let open = false;
          for (let k = 0; k < RING_SEGMENTS; k++) {
            const p = ring[k];
            const q = ring[k + 1];
            if ((p.z + q.z < 0) !== it.flag) {
              open = false;
              continue;
            }
            if (!open) ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(q.sx, q.sy);
            open = true;
          }
          ctx.stroke();
          break;
        }
        case K.Dust: {
          // Bụi phía trước/sau chuỗi xoắn — mỗi nhóm 1 lần tô.
          ctx.fillStyle = tint(palette.dust, palette.dustAlpha[0] + palette.dustAlpha[1] * nearness(it.z));
          ctx.beginPath();
          for (const p of dust) {
            if ((p.z < 0) !== it.flag) continue;
            const r = 1.6 * p.s * (unit / 160);
            ctx.moveTo(p.sx + r, p.sy);
            ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
          }
          ctx.fill();
          break;
        }
      }
    };

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      items.length = 0;
      const scroll = reduceMotion ? 0 : window.scrollY;
      const spin = time * 0.55 + scroll * 0.0028;
      const yaw = pointer.x * 0.45;
      const pitch = 0.1 + pointer.y * 0.28;
      const roll = -0.48 + pointer.x * 0.1;
      const bob = Math.sin(time * 0.8) * 0.05;
      const world = (x: number, y: number, z: number, out: Pt) => {
        rotateInto(x, y + bob, z, yaw, pitch, roll, out);
        project(out);
      };

      // Bụi sáng — trôi chậm lên trên, xoay theo nửa tốc độ để tạo thị sai.
      dustZ[0] = dustZ[1] = 0;
      let front = 0;
      for (let i = 0; i < dust.length; i++) {
        const base = dustBase[i];
        let y = base.y - ((time * 0.06) % 3.4);
        if (y < -1.7) y += 3.4;
        rotateInto(base.x, y, base.z, yaw * 0.5 + time * 0.05, pitch * 0.5, 0, dust[i]);
        project(dust[i]);
        if (dust[i].z < 0) {
          dustZ[1] += dust[i].z;
          front++;
        } else dustZ[0] += dust[i].z;
      }
      const back = dust.length - front;
      if (back) add(dustZ[0] / back + 0.001, K.Dust).flag = false;
      if (front) add(dustZ[1] / front + 0.001, K.Dust).flag = true;

      // Chuỗi xoắn kép.
      for (let i = 0; i < pairs; i++) {
        const y = -HELIX_LEN / 2 + (i / (pairs - 1)) * HELIX_LEN;
        const ang = i * twist + spin;
        world(Math.cos(ang) * HELIX_R, y, Math.sin(ang) * HELIX_R, strandA[i]);
        world(Math.cos(ang + Math.PI) * HELIX_R, y, Math.sin(ang + Math.PI) * HELIX_R, strandB[i]);
      }
      for (let i = 0; i < pairs; i++) {
        const a = strandA[i];
        const b = strandB[i];
        const mid = mids[i];
        mid.x = (a.x + b.x) / 2;
        mid.y = (a.y + b.y) / 2;
        mid.z = (a.z + b.z) / 2;
        project(mid);
        const rung = add(mid.z + 0.05, K.Rung);
        rung.a = a;
        rung.b = b;
        rung.c = mid;
        rung.flag = i % 2 === 1;
        if (i < pairs - 1) {
          addLine(a, strandA[i + 1], palette.backbone[0], 0.55, unit / 75, 0.02);
          addLine(b, strandB[i + 1], palette.backbone[1], 0.5, unit / 75, 0.02);
        }
        addSphere(a, sprites.brand, 0.072);
        addSphere(b, sprites.accent, 0.072);
      }

      // Vòng quỹ đạo nghiêng (2 nửa trước/sau) + 1 "electron" chạy quanh.
      ringZ[0] = ringZ[1] = 0;
      let ringFront = 0;
      for (let k = 0; k <= RING_SEGMENTS; k++) world(ringBase[k].x, ringBase[k].y, ringBase[k].z, ring[k]);
      for (let k = 0; k < RING_SEGMENTS; k++) {
        const z = (ring[k].z + ring[k + 1].z) / 2;
        if (z < 0) {
          ringZ[1] += z;
          ringFront++;
        } else ringZ[0] += z;
      }
      const ringBack = RING_SEGMENTS - ringFront;
      if (ringBack) add(ringZ[0] / ringBack + 0.1, K.Ring).flag = false;
      if (ringFront) add(ringZ[1] / ringFront + 0.1, K.Ring).flag = true;
      const et = time * 1.1;
      rotateInto(Math.cos(et) * 1.15, 0, Math.sin(et) * 1.15, 0, 1.05, 0.5, scratch);
      world(scratch.x, scratch.y, scratch.z, electron);
      addSphere(electron, sprites.soft, 0.05);

      // Phân tử nhỏ lơ lửng quanh chuỗi xoắn.
      MOLECULES.forEach((m, mi) => {
        const local = time * m.spin + m.phase;
        const float = Math.sin(time * 0.9 + m.phase) * 0.06;
        const center = molCenters[mi];
        rotateInto(m.c.x, m.c.y + float, m.c.z, yaw * 0.6, pitch * 0.6, 0, center);
        project(center);
        const sprite = m.core === "accent" ? sprites.accent : sprites.brand;
        MOLECULE_ARMS.forEach((o, ai) => {
          rotateInto(o.x, o.y, o.z, local, local * 0.6, 0, scratch);
          const arm = molArms[mi][ai];
          arm.x = center.x + scratch.x;
          arm.y = center.y + scratch.y;
          arm.z = center.z + scratch.z;
          project(arm);
          addLine(center, arm, palette.bond, 0.45, unit / 90, 0.03);
          addSphere(arm, sprites.soft, m.r * 0.55);
        });
        addSphere(center, sprite, m.r);
      });

      items.sort((p, q) => q.z - p.z);
      for (const it of items) drawItem(it);
    }

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      unit = Math.min(width * 0.3, height * 0.27);
      // Quầng sáng phía sau chuỗi xoắn: nền CSS tĩnh (trước đây tô gradient phủ kín canvas mỗi khung).
      canvas.style.background = `radial-gradient(circle ${Math.round(unit * 1.6)}px at 50% 50%, ${rgba(BRAND_500, palette.glow[0])}, ${rgba(BRAND_500, palette.glow[1])} 55%, ${rgba(BRAND_500, 0)})`;
      render();
    }

    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      // Đã hạ nhịp: bỏ qua khung đến QUÁ SỚM (< ¾ nhịp) để giữ ~30 khung/giây đều — ngưỡng ¾ chứ
      // không sát 33ms, vì máy yếu vốn nhận khung ~30ms một lần, bỏ cả khung đó sẽ tụt còn ~16fps.
      if (frameMs && last && now - last < frameMs * 0.75) return;
      if (!frameMs && last) {
        sampled++;
        if (now - last > 26) slow++;
        if (sampled >= 90) {
          if (slow / sampled > 0.25) frameMs = 1000 / 30;
          sampled = slow = 0;
        }
      }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      time += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      render();
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
