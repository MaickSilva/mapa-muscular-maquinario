// Ilustrações de exercícios do projeto Everkinetic (https://github.com/everkinetic/data),
// licença CC BY-SA 4.0. Os arquivos ficam em public/v2/ilustracoes/<id>-relaxation.svg (início)
// e <id>-tension.svg (fim). p = músculos principais, s = secundários (slugs do mapa muscular).

export const CREDIT = "Ilustrações: Everkinetic (github.com/everkinetic/data), CC BY-SA 4.0, adaptadas";

export const CATALOG = [
  // Costas
  { id: "0096", nome: "Puxada frontal", grupo: "Costas", p: ["upper-back"], s: ["biceps", "forearm"] },
  { id: "0093", nome: "Puxada supinada", grupo: "Costas", p: ["upper-back"], s: ["biceps"] },
  { id: "0025", nome: "Remada sentada no cabo", grupo: "Costas", p: ["upper-back"], s: ["biceps", "lower-back"] },
  { id: "0029", nome: "Remada cavalinho (T)", grupo: "Costas", p: ["upper-back"], s: ["biceps", "lower-back"] },
  { id: "0092", nome: "Pulldown com braços estendidos", grupo: "Costas", p: ["upper-back"], s: ["triceps"] },
  { id: "0103", nome: "Hiperextensão lombar", grupo: "Costas", p: ["lower-back"], s: ["gluteal", "hamstring"] },
  // Peito
  { id: "0066", nome: "Supino máquina", grupo: "Peito", p: ["chest"], s: ["triceps", "deltoids"] },
  { id: "0085", nome: "Supino declinado máquina", grupo: "Peito", p: ["chest"], s: ["triceps"] },
  { id: "0048", nome: "Crossover", grupo: "Peito", p: ["chest"], s: ["deltoids"] },
  { id: "0078", nome: "Supino reto no Smith", grupo: "Peito", p: ["chest"], s: ["triceps", "deltoids"] },
  { id: "0081", nome: "Supino inclinado no Smith", grupo: "Peito", p: ["chest"], s: ["deltoids", "triceps"] },
  // Ombros
  { id: "0015", nome: "Remada alta no cabo", grupo: "Ombros", p: ["deltoids"], s: ["trapezius"] },
  { id: "0013", nome: "Remada alta no Smith", grupo: "Ombros", p: ["deltoids"], s: ["trapezius"] },
  { id: "0008", nome: "Elevação frontal no cabo", grupo: "Ombros", p: ["deltoids"], s: [] },
  { id: "0017", nome: "Crucifixo inverso no cabo", grupo: "Ombros", p: ["deltoids"], s: ["trapezius", "upper-back"] },
  { id: "0009", nome: "Encolhimento no cabo", grupo: "Ombros", p: ["trapezius"], s: [] },
  // Pernas
  { id: "0127", nome: "Leg press 45°", grupo: "Pernas", p: ["quadriceps"], s: ["gluteal", "hamstring"] },
  { id: "0143", nome: "Leg press pés juntos", grupo: "Pernas", p: ["quadriceps"], s: ["gluteal"] },
  { id: "0123", nome: "Hack machine", grupo: "Pernas", p: ["quadriceps"], s: ["gluteal"] },
  { id: "0124", nome: "Agachamento no Smith", grupo: "Pernas", p: ["quadriceps"], s: ["gluteal", "hamstring"] },
  { id: "0142", nome: "Cadeira extensora", grupo: "Pernas", p: ["quadriceps"], s: [] },
  { id: "0119", nome: "Cadeira flexora", grupo: "Pernas", p: ["hamstring"], s: ["calves"] },
  { id: "0117", nome: "Mesa flexora", grupo: "Pernas", p: ["hamstring"], s: ["calves"] },
  { id: "0120", nome: "Flexora em pé", grupo: "Pernas", p: ["hamstring"], s: [] },
  { id: "0156", nome: "Cadeira abdutora", grupo: "Pernas", p: ["gluteal"], s: [] },
  { id: "0157", nome: "Cadeira adutora", grupo: "Pernas", p: ["adductors"], s: [] },
  { id: "0112", nome: "Glúteo no cabo (coice)", grupo: "Pernas", p: ["gluteal"], s: ["hamstring"] },
  // Panturrilha
  { id: "0279", nome: "Panturrilha sentado", grupo: "Panturrilha", p: ["calves"], s: [] },
  { id: "0282", nome: "Panturrilha em pé (máquina)", grupo: "Panturrilha", p: ["calves"], s: [] },
  { id: "0273", nome: "Panturrilha no leg press", grupo: "Panturrilha", p: ["calves"], s: [] },
  // Braços
  { id: "0205", nome: "Tríceps na polia (barra)", grupo: "Braços", p: ["triceps"], s: [] },
  { id: "0206", nome: "Tríceps na polia (corda)", grupo: "Braços", p: ["triceps"], s: [] },
  { id: "0210", nome: "Tríceps máquina", grupo: "Braços", p: ["triceps"], s: [] },
  { id: "0212", nome: "Rosca no cabo", grupo: "Braços", p: ["biceps"], s: ["forearm"] },
  { id: "0216", nome: "Rosca martelo na corda", grupo: "Braços", p: ["biceps"], s: ["forearm"] },
  { id: "0217", nome: "Rosca Scott no cabo", grupo: "Braços", p: ["biceps"], s: [] },
  { id: "0236", nome: "Rosca Scott máquina", grupo: "Braços", p: ["biceps"], s: [] },
  { id: "0253", nome: "Rosca máquina", grupo: "Braços", p: ["biceps"], s: [] },
  // Abdômen
  { id: "0288", nome: "Abdominal no cabo", grupo: "Abdômen", p: ["abs"], s: ["obliques"] },
];

export const BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
export const GROUPS = [...new Set(CATALOG.map((c) => c.grupo))];

// Carrega o SVG, desenha no tamanho pedido e troca a cor: só o traço fica, na cor escolhida.
const cache = new Map();
async function svgText(url) {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error("Ilustração não encontrada: " + url); return r.text(); }));
  return cache.get(url);
}

export async function loadIllustration(id, phase, targetH, color) {
  const url = `./ilustracoes/${id}-${phase === "start" ? "relaxation" : "tension"}.svg`;
  let txt = await svgText(url);
  const vb = (txt.match(/viewBox="([^"]+)"/) || [])[1];
  const [, , vw, vh] = vb ? vb.split(/[\s,]+/).map(Number) : [0, 0, 100, 100];
  const h = Math.max(50, Math.round(targetH)), w = Math.round(h * (vw / vh));
  txt = txt.replace(/<svg([^>]*?)\swidth="[^"]*"/, `<svg$1 width="${w}"`).replace(/<svg([^>]*?)\sheight="[^"]*"/, `<svg$1 height="${h}"`);
  const blobUrl = URL.createObjectURL(new Blob([txt], { type: "image/svg+xml" }));
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = blobUrl; });
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    const [cr, cg, cb] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    for (let i = 0; i < p.length; i += 4) {
      const ink = (1 - (p[i] + p[i + 1] + p[i + 2]) / 765) * (p[i + 3] / 255);
      p[i] = cr; p[i + 1] = cg; p[i + 2] = cb; p[i + 3] = Math.round(ink * 255);
    }
    x.putImageData(d, 0, 0);
    return c;
  } finally { URL.revokeObjectURL(blobUrl); }
}

// Proporção (altura / largura) do maior dos dois quadros da ilustração
export async function illusRatio(id) {
  const probe = await Promise.all(["start", "end"].map((ph) => loadIllustration(id, ph, 400, "#ffffff")));
  return Math.max(...probe.map((c) => c.height / c.width));
}

// Calcula o encaixe de início e fim em (w, h): lado a lado ou empilhados, o que der maior
export function fitIllus(ratio, w, h, cap, gap) {
  const capH = cap * 1.6;
  const sideW = (w - gap) / 2, sideH = h - capH;
  const sSide = Math.max(0, Math.min(sideW, sideH / ratio));
  const sStack = Math.max(0, Math.min(w, (h - 2 * capH - gap) / 2 / ratio));
  const stacked = sStack > sSide * 1.15;
  const iw = stacked ? sStack : sSide, ih = iw * ratio;
  return { stacked, iw, ih, sideW, capH, gap, cap, total: stacked ? 2 * (ih + capH) + gap : ih + capH };
}

// Desenha início e fim dentro de (x, y, w, h), centralizados
export async function drawIllustrations(ctx, id, x, y, w, h, colors, opts = {}) {
  const cap = opts.caption ?? 24, gap = opts.gap ?? cap;
  const f = fitIllus(opts.ratio ?? (await illusRatio(id)), w, h, cap, gap);
  if (f.ih < 20) return 0;
  const imgs = await Promise.all(["start", "end"].map((ph) => loadIllustration(id, ph, f.ih * 2, colors.ink)));
  const y0 = y + Math.max(0, (h - f.total) / 2);
  ctx.fillStyle = colors.caption; ctx.textAlign = "center";
  ctx.font = `400 ${Math.round(cap)}px ${opts.font || "sans-serif"}`;
  imgs.forEach((im, i) => {
    const dw = f.ih * (im.width / im.height);
    const cx = f.stacked ? x + w / 2 : x + i * (f.sideW + gap) + f.sideW / 2;
    const top = f.stacked ? y0 + i * (f.ih + f.capH + gap) : y0;
    ctx.drawImage(im, cx - dw / 2, top, dw, f.ih);
    ctx.fillText(i ? "Fim" : "Início", cx, top + f.ih + cap * 1.25);
  });
  ctx.textAlign = "left";
  return f.total;
}
