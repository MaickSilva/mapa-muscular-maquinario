// Desenhos do movimento (início e fim) em estilo pictograma, de perfil.
// Tudo é gerado por código: um esqueleto simples com cinemática inversa
// (braços e pernas em dois segmentos) e a máquina em traços.
// Unidades: altura de uma pessoa em pé ≈ 1. Eixo y para cima, figura olhando para a direita.

const L = { torso: 0.30, neck: 0.035, head: 0.062, upper: 0.16, fore: 0.15, thigh: 0.23, shin: 0.23, foot: 0.075 };
const W = { torso: 0.085, limb: 0.052, machine: 0.022, pad: 0.05 };
const rad = (d) => (d * Math.PI) / 180;
const at = (p, len, deg) => [p[0] + len * Math.cos(rad(deg)), p[1] + len * Math.sin(rad(deg))];
const deg = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Dois segmentos (a, b) saindo de root em direção a target; bend = +1 dobra no sentido anti-horário
function ik(root, a, b, target, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  let d = Math.hypot(dx, dy);
  d = Math.min(Math.max(d, Math.abs(a - b) + 1e-4), a + b - 1e-4);
  const base = Math.atan2(dy, dx);
  const off = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const mid = [root[0] + a * Math.cos(base + bend * off), root[1] + a * Math.sin(base + bend * off)];
  const dir = Math.atan2(target[1] - mid[1], target[0] - mid[0]);
  return [mid, [mid[0] + b * Math.cos(dir), mid[1] + b * Math.sin(dir)]];
}

function skeleton(p) {
  const hip = p.hip || [0, 0];
  const shoulder = at(hip, L.torso, p.torso);
  const neck = at(shoulder, L.neck, p.torso);
  const head = at(neck, L.head * 0.9, p.torso + (p.headTilt || 0));
  const [elbow, hand] = ik(shoulder, L.upper, L.fore, p.hand, p.armBend ?? -1);
  const [knee, ankle] = ik(hip, L.thigh, L.shin, p.foot, p.legBend ?? 1);
  const shinDeg = deg(knee, ankle);
  const toe = at(ankle, L.foot, p.toe ?? shinDeg + 90);
  return { hip, shoulder, neck, head, elbow, hand, knee, ankle, toe, shinDeg };
}

const line = (a, b, w = W.machine) => ({ t: "line", a, b, w });
const pad = (a, b) => ({ t: "line", a, b, w: W.pad });
const circle = (c, r) => ({ t: "circle", c, r });

// ---------- máquinas: cada uma recebe o esqueleto da fase e devolve os traços
function seat(x0 = -0.12, x1 = 0.12) {
  return [pad([x0, -0.045], [x1, -0.045]), line([0, -0.045], [0, -0.25]), line([-0.16, -0.25], [0.2, -0.25])];
}
function backrest(top = [-0.11, 0.33], bottom = [-0.075, 0.0]) {
  return [pad(bottom, top)];
}
function handGrip(s, len = 0.05) {
  const a = deg(s.elbow, s.hand) + 90;
  return line(at(s.hand, len / 2, a), at(s.hand, len / 2, a + 180), 0.03);
}
function roller(s, side) {
  // rolo encostado na canela, à frente (side = +1) ou atrás (side = -1)
  const c = at(lerp(s.knee, s.ankle, 0.85), 0.055, s.shinDeg + 90 * side);
  return { c, parts: [line(s.knee, c, 0.028), circle(c, 0.04)] };
}

export const MOVES = {
  puxada: {
    label: "Puxada (pulley / articulada)",
    start: { torso: 100, hand: [0.07, 0.6], armBend: -1, foot: [0.24, -0.22] },
    end: { torso: 106, hand: [0.03, 0.33], armBend: -1, foot: [0.24, -0.22] },
    machine: (s) => [
      ...seat(-0.12, 0.1),
      line([0.33, -0.25], [0.33, 0.78]), line([0.33, 0.78], [-0.02, 0.78]), line([0.2, -0.25], [0.33, -0.25]),
      pad([0.13, 0.068], [0.23, 0.068]), line([0.23, 0.068], [0.33, 0.068]),
      line([0.33, 0.66], s.hand, 0.028), handGrip(s),
    ],
  },
  remada: {
    label: "Remada sentada",
    start: { torso: 90, hand: [0.31, 0.25], armBend: -1, foot: [0.27, -0.2] },
    end: { torso: 92, hand: [0.13, 0.21], armBend: -1, foot: [0.27, -0.2] },
    machine: (s) => [
      ...seat(-0.12, 0.1),
      pad([0.105, 0.1], [0.105, 0.235]), line([0.105, 0.1], [0.44, 0.1]),
      line([0.44, -0.25], [0.44, 0.52]), line([0.2, -0.25], [0.44, -0.25]),
      line([0.44, 0.5], s.hand, 0.028), handGrip(s),
    ],
  },
  supino: {
    label: "Supino sentado (chest press)",
    start: { torso: 95, hand: [0.09, 0.27], armBend: -1, foot: [0.24, -0.22] },
    end: { torso: 95, hand: [0.33, 0.27], armBend: -1, foot: [0.24, -0.22] },
    machine: (s) => [
      ...seat(-0.12, 0.1), ...backrest(),
      line([-0.16, -0.25], [-0.16, 0.66]), line([-0.16, 0.66], [0.02, 0.66]),
      line([0.02, 0.64], s.hand, 0.028), handGrip(s),
    ],
  },
  legpress: {
    label: "Leg press 45°",
    start: { torso: 140, hand: [0.0, 0.0], armBend: 1, foot: [0.19, 0.21], legBend: 1, toe: 135 },
    end: { torso: 140, hand: [0.0, 0.0], armBend: 1, foot: [0.31, 0.33], legBend: 1, toe: 135 },
    machine: (s) => {
      const plateA = at(s.ankle, 0.1, 135), plateB = at(s.ankle, 0.06, -45);
      return [
        pad([0.02, -0.06], [-0.26, 0.15]), pad([0.02, -0.06], [0.12, -0.06]),
        line([-0.2, 0.1], [-0.2, -0.25]), line([0.06, -0.06], [0.06, -0.25]),
        line([-0.3, -0.25], [0.66, -0.25]),
        line([0.2, 0.0], [0.6, 0.4], 0.018), line([0.6, 0.4], [0.6, -0.25]),
        line(at(s.ankle, 0.03, -45), at(s.ankle, 0.1, -45), 0.02),
        { t: "line", a: plateA, b: plateB, w: 0.035 },
      ];
    },
  },
  extensora: {
    label: "Cadeira extensora",
    start: { torso: 100, hand: [0.03, -0.01], armBend: 1, foot: [0.23, -0.21] },
    end: { torso: 100, hand: [0.03, -0.01], armBend: 1, foot: [0.45, -0.04] },
    machine: (s) => {
      const r = roller(s, 1);
      return [...seat(-0.12, 0.2), ...backrest(), ...r.parts];
    },
  },
  flexora: {
    label: "Cadeira flexora sentada",
    start: { torso: 100, hand: [0.03, 0.09], armBend: 1, foot: [0.45, -0.04] },
    end: { torso: 100, hand: [0.03, 0.09], armBend: 1, foot: [0.12, -0.2] },
    machine: (s) => {
      const r = roller(s, -1);
      return [...seat(-0.12, 0.2), ...backrest(), pad([0.1, 0.068], [0.22, 0.068]), line([0.03, 0.068], [0.1, 0.068]), ...r.parts];
    },
  },
};

function bodyParts(s) {
  return [
    { t: "body", a: s.hip, b: s.shoulder, w: W.torso },
    { t: "body", a: s.shoulder, b: s.neck, w: W.limb },
    { t: "head", c: s.head, r: L.head },
    { t: "body", a: s.hip, b: s.knee, w: W.limb * 1.15 },
    { t: "body", a: s.knee, b: s.ankle, w: W.limb },
    { t: "body", a: s.ankle, b: s.toe, w: W.limb * 0.8 },
    { t: "body", a: s.shoulder, b: s.elbow, w: W.limb },
    { t: "body", a: s.elbow, b: s.hand, w: W.limb * 0.9 },
  ];
}

function frame(id) {
  const m = MOVES[id];
  return ["start", "end"].map((ph) => {
    const s = skeleton(m[ph]);
    return [...m.machine(s), ...bodyParts(s)];
  });
}

function bounds(frames) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (p, r) => { x0 = Math.min(x0, p[0] - r); x1 = Math.max(x1, p[0] + r); y0 = Math.min(y0, p[1] - r); y1 = Math.max(y1, p[1] + r); };
  for (const f of frames) for (const it of f) {
    if (it.a) { add(it.a, it.w / 2); add(it.b, it.w / 2); } else add(it.c, it.r);
  }
  return { x0, y0, x1, y1 };
}

// Desenha início e fim lado a lado dentro de (x, y, w, h) — h inclui a legenda
export function drawMovement(ctx, id, x, y, w, h, colors, opts = {}) {
  if (!MOVES[id]) return;
  const frames = frame(id);
  const b = bounds(frames);
  const cap = opts.caption ?? Math.max(16, h * 0.11);
  const gap = w * 0.06;
  const pw = (w - gap) / 2, ph = h - cap * 1.6;
  const k = Math.min(pw / (b.x1 - b.x0), ph / (b.y1 - b.y0)) * 0.92;
  frames.forEach((f, i) => {
    const ox = x + i * (pw + gap) + (pw - (b.x1 - b.x0) * k) / 2;
    const oy = y + ph - (ph - (b.y1 - b.y0) * k) / 2; // base alinhada
    const T = (p) => [ox + (p[0] - b.x0) * k, oy - (p[1] - b.y0) * k];
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const it of f) {
      const body = it.t === "body" || it.t === "head";
      ctx.strokeStyle = ctx.fillStyle = body ? colors.body : colors.machine;
      if (it.t === "line" || it.t === "body") {
        const a = T(it.a), c = T(it.b);
        ctx.lineWidth = it.w * k; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
      } else {
        const c = T(it.c);
        ctx.beginPath(); ctx.arc(c[0], c[1], it.r * k, 0, Math.PI * 2);
        if (it.t === "head") ctx.fill(); else { ctx.lineWidth = W.machine * k * 1.2; ctx.stroke(); }
      }
    }
    ctx.fillStyle = colors.caption; ctx.textAlign = "center";
    ctx.font = `${opts.weight || 400} ${Math.round(cap)}px ${opts.font || "sans-serif"}`;
    ctx.fillText(i ? "Fim" : "Início", x + i * (pw + gap) + pw / 2, y + h - cap * 0.25);
    ctx.textAlign = "left";
  });
  // seta entre os dois quadros
  const ay = y + ph * 0.5, ax = x + pw + gap * 0.15, aw = gap * 0.7;
  ctx.strokeStyle = ctx.fillStyle = colors.caption; ctx.lineWidth = Math.max(2, cap * 0.12);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + aw, ay); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax + aw + cap * 0.1, ay); ctx.lineTo(ax + aw - cap * 0.35, ay - cap * 0.3); ctx.lineTo(ax + aw - cap * 0.35, ay + cap * 0.3); ctx.closePath(); ctx.fill();
}
