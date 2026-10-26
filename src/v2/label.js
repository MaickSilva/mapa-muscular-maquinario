// Desenho da etiqueta v2 em canvas.
// Tudo é medido antes de desenhar: o desenho do corpo ocupa o espaço que sobra
// depois do cabeçalho, das instruções e do rodapé.
import qrcode from "qrcode-generator";

export const SIZES = {
  A6: { label: "A6 · 105 × 148 mm", w: 1240, h: 1748, mm: [105, 148] },
  A5: { label: "A5 · 148 × 210 mm", w: 1748, h: 2480, mm: [148, 210] },
};

const SANS = "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
const C = { bg: "#000000", fg: "#ffffff", soft: "#d1d5d3", muted: "#a1a1a6", faint: "#8e8e93", line: "#2a2d2b" };

function loadImage(src) {
  return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
}

export function wrap(x, text, maxW) {
  const out = [];
  for (const para of String(text).split("\n")) {
    const words = para.split(" ").filter(Boolean);
    let line = "";
    for (const wd of words) {
      const next = line ? line + " " + wd : wd;
      if (x.measureText(next).width > maxW && line) { out.push(line); line = wd; } else line = next;
    }
    if (line) out.push(line);
  }
  return out;
}

// Converte os SVGs do corpo (frente e costas) em imagens
export async function svgsToImages(svgs) {
  const out = [];
  for (const svg of svgs) {
    const el = svg.cloneNode(true);
    const r = svg.getBoundingClientRect();
    el.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    el.setAttribute("width", r.width); el.setAttribute("height", r.height);
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(el));
    out.push({ img: await loadImage(url), ratio: r.height / r.width });
  }
  return out;
}

function drawQr(x, text, left, top, size) {
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(), quiet = 2, cell = size / (n + quiet * 2);
  x.fillStyle = "#ffffff"; x.beginPath(); x.roundRect(left, top, size, size, size * 0.06); x.fill();
  x.fillStyle = "#000000";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
    if (q.isDark(r, c)) x.fillRect(left + (c + quiet) * cell, top + (r + quiet) * cell, Math.ceil(cell), Math.ceil(cell));
}

export async function renderLabel(d, bodies) {
  const S = SIZES[d.size] || SIZES.A6;
  const W = S.w, H = S.h, u = W / 1240, M = 100 * u, inner = W - 2 * M;
  // o texto cresce menos que a folha: no A5 sobra mais espaço para o desenho do corpo
  const t = 1 + (u - 1) * 0.7;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
  x.textBaseline = "alphabetic";
  const font = (w, px) => { x.font = `${w} ${Math.round(px)}px ${SANS}`; };
  const half = inner / 2 - 20 * u;

  // ---------- cabeçalho (lado esquerdo: nº, nome, músculos; lado direito: logo)
  const head = [];
  let hy = M;
  if (d.code) {
    font(700, 30 * t);
    const txt = "Nº " + d.code, tw = x.measureText(txt).width;
    head.push({ type: "pill", txt, y: hy, w: tw + 36 * t, h: 52 * t });
    hy += 52 * t + 24 * u;
  }
  const title = d.title || "Exercício";
  let tsize = 80 * t, tl;
  for (; tsize >= 44 * t; tsize -= 4 * u) {
    font(700, tsize); tl = wrap(x, title, half);
    if (Math.max(...tl.map((l) => x.measureText(l).width)) <= half && tl.length <= 3) break;
  }
  const tlh = tsize * 1.1;
  head.push({ type: "title", lines: tl, size: tsize, y: hy + tsize * 0.86, lh: tlh });
  hy += tl.length * tlh + 10 * u;
  font(500, 32 * t);
  const groups = [];
  if (d.primary.length) groups.push({ label: "Principal", text: d.primary.join(", "), color: d.pColor });
  if (d.secondary.length) groups.push({ label: "Secundário", text: d.secondary.join(", "), color: d.sColor });
  for (const g of groups) {
    const lines = wrap(x, g.label + ": " + g.text, half - 34 * t);
    head.push({ type: "group", g, lines, y: hy + 32 * t, lh: 42 * t });
    hy += lines.length * 42 * t + 6 * u;
  }
  let logo = null, headBottom = hy;
  if (d.logo) {
    const li = await loadImage(d.logo);
    const k = Math.min(half / li.width, 200 * u / li.height);
    logo = { img: li, w: li.width * k, h: li.height * k };
    headBottom = Math.max(headBottom, M + logo.h);
  }

  // ---------- instruções (medidas com uma escala que pode diminuir)
  const sections = [
    { title: "Ajuste", items: d.setup, mark: "•" },
    { title: "Execução", items: d.steps, mark: "n" },
    { title: "Evite", items: d.mistakes, mark: "×" },
  ].filter((s) => s.items.length);

  // Com instruções, o corpo fica à esquerda e o texto à direita;
  // sem instruções, o corpo ocupa a largura toda.
  const side = sections.length > 0;
  const gapC = 48 * u;
  const leftW = side ? inner * 0.44 : inner;
  const textW = side ? inner - leftW - gapC : inner;

  function measureSections(k) {
    let h = 0; const plan = [];
    for (const s of sections) {
      const item = 30 * t * k, lh = item * 1.3, ind = 40 * t * k;
      font(400, item);
      const items = s.items.map((it) => wrap(x, it, textW - ind));
      const sh = 30 * t * k + 14 * u + items.reduce((a, l) => a + l.length * lh, 0) + (items.length - 1) * 8 * u;
      plan.push({ s, items, item, lh, ind, k, h: sh }); h += sh + 34 * u;
    }
    return { h: Math.max(0, h - 34 * u), plan };
  }

  // ---------- rodapé (aviso + carga máxima à esquerda, QR à direita)
  const qr = d.video ? 210 * u : 0;
  function measureFooter(k) {
    const fw = inner - (qr ? qr + 36 * t : 0);
    font(400, 26 * t * k);
    const warn = d.warning ? wrap(x, d.warning, fw) : [];
    const wl = 26 * t * k * 1.35;
    const loadH = d.maxLoad ? 54 * t + 18 * u : 0;
    const textH = loadH + warn.length * wl;
    return { warn, wl, fw, loadH, h: Math.max(textH, qr ? qr + 40 * u : 0) };
  }

  const captionH = 64 * t;
  const areaTop = headBottom + 56 * u;
  let k = 1, sec, foot, areaH;
  for (; k >= 0.75; k -= 0.05) {
    sec = measureSections(k); foot = measureFooter(k);
    areaH = H - M - foot.h - 48 * u - areaTop;
    if (sec.h <= areaH) break;
  }

  // ---------- desenha o cabeçalho
  for (const it of head) {
    if (it.type === "pill") {
      x.fillStyle = d.pColor; x.beginPath(); x.roundRect(M, it.y, it.w, it.h, it.h / 2); x.fill();
      font(700, 30 * t); x.fillStyle = "#06210f"; x.fillText(it.txt, M + 18 * u, it.y + it.h * 0.68);
    } else if (it.type === "title") {
      font(700, it.size); x.fillStyle = C.fg;
      it.lines.forEach((l, i) => x.fillText(l, M, it.y + i * it.lh));
    } else {
      font(500, 32 * t);
      x.fillStyle = it.g.color; x.beginPath(); x.arc(M + 11 * t, it.y - 11 * t, 11 * t, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#ffffff33"; x.lineWidth = 2 * u; x.stroke();
      it.lines.forEach((l, i) => {
        let lx = M + 34 * t;
        if (i === 0) {
          const lab = it.g.label + ": ";
          x.fillStyle = C.muted; x.fillText(lab, lx, it.y); lx += x.measureText(lab).width;
          x.fillStyle = C.fg; x.fillText(l.slice(lab.length), lx, it.y);
        } else { x.fillStyle = C.fg; x.fillText(l, lx, it.y + i * it.lh); }
      });
    }
  }
  if (logo) x.drawImage(logo.img, W - M - logo.w, M, logo.w, logo.h);

  // ---------- desenha o corpo
  const slotW = leftW / 2;
  bodies.forEach((b, i) => {
    const h = Math.max(120 * u, Math.min(areaH - captionH, (slotW - (side ? 12 : 30) * u) * b.ratio));
    const w = h / b.ratio;
    x.drawImage(b.img, M + i * slotW + (slotW - w) / 2, areaTop, w, h);
    font(400, 28 * t); x.fillStyle = C.faint; x.textAlign = "center";
    x.fillText(i ? "Costas" : "Frente", M + i * slotW + slotW / 2, areaTop + h + 44 * t);
    x.textAlign = "left";
  });

  // ---------- desenha as instruções
  const tx = side ? M + leftW + gapC : M;
  let y = areaTop;
  for (const p of sec.plan) {
    font(700, 26 * t * p.k); x.fillStyle = d.pColor;
    x.letterSpacing = `${3 * u}px`;
    x.fillText(p.s.title.toUpperCase(), tx, y + 26 * t * p.k);
    x.letterSpacing = "0px";
    y += 30 * t * p.k + 14 * u;
    p.items.forEach((lines, n) => {
      font(700, p.item); x.fillStyle = p.s.mark === "×" ? C.muted : d.pColor;
      const mk = p.s.mark === "n" ? `${n + 1}.` : p.s.mark;
      x.fillText(mk, tx, y + p.item);
      font(400, p.item); x.fillStyle = C.soft;
      lines.forEach((l, i) => x.fillText(l, tx + p.ind, y + p.item + i * p.lh));
      y += lines.length * p.lh + 8 * u;
    });
    y += 34 * u - 8 * u;
  }

  // ---------- desenha o rodapé, preso à margem de baixo
  const fy = H - M - foot.h;
  x.fillStyle = C.line; x.fillRect(M, fy - 24 * u, inner, 2 * u);
  let ty = fy;
  if (d.maxLoad) {
    font(700, 28 * t);
    const txt = "Carga máxima: " + d.maxLoad, tw = x.measureText(txt).width;
    x.strokeStyle = C.muted; x.lineWidth = 2 * u; x.beginPath(); x.roundRect(M, ty, tw + 32 * t, 54 * t, 10 * u); x.stroke();
    x.fillStyle = C.fg; x.fillText(txt, M + 16 * u, ty + 37 * t);
    ty += foot.loadH;
  }
  font(400, 26 * t * k); x.fillStyle = C.muted;
  foot.warn.forEach((l, i) => x.fillText(l, M, ty + 26 * t * k + i * foot.wl));
  if (qr) {
    drawQr(x, d.video, W - M - qr, fy, qr);
    font(400, 22 * t); x.fillStyle = C.faint; x.textAlign = "center";
    x.fillText("Vídeo do exercício", W - M - qr / 2, fy + qr + 32 * t); x.textAlign = "left";
  }
  return c.toDataURL("image/png");
}

// Remove o fundo da logo: tira tudo que for parecido com a cor dos cantos
export async function processLogo(src, { removeBg, tol, white }) {
  const img = await loadImage(src);
  const k = Math.min(1, 800 / Math.max(img.width, img.height));
  const w = Math.round(img.width * k), h = Math.round(img.height * k);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h); const p = d.data;
  if (removeBg) {
    const corners = [0, w - 1, (h - 1) * w, h * w - 1];
    const bg = [0, 1, 2].map((ch) => corners.reduce((a, i) => a + p[i * 4 + ch], 0) / 4);
    const t2 = tol * tol;
    const dist = (i) => { const r = p[i*4]-bg[0], g = p[i*4+1]-bg[1], b = p[i*4+2]-bg[2]; return r*r + g*g + b*b; };
    for (let i = 0; i < w * h; i++) {
      const dd = dist(i);
      if (dd <= t2) p[i*4+3] = 0;
      else if (dd <= t2 * 2.2) p[i*4+3] = Math.min(p[i*4+3], Math.round(255 * (Math.sqrt(dd) - tol) / (tol * 0.48 + 1)));
    }
  }
  if (white) for (let i = 0; i < p.length; i += 4) { p[i] = p[i+1] = p[i+2] = 255; }
  x.putImageData(d, 0, 0);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (p[(j*w+i)*4+3] > 20) { if (i<x0)x0=i; if (i>x1)x1=i; if (j<y0)y0=j; if (j>y1)y1=j; }
  if (x1 < 0) return c.toDataURL("image/png");
  const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return o.toDataURL("image/png");
}
