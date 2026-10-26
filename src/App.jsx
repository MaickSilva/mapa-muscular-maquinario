import React, { useState, useRef, useEffect } from "react";
import BodyModule from "react-native-body-highlighter";

// A biblioteca é CommonJS; dependendo do bundler o componente vem em .default
const Body = BodyModule.default || BodyModule;

const MUSCLES = [
  ["chest", "Peitoral"], ["deltoids", "Ombros"], ["biceps", "Bíceps"], ["triceps", "Tríceps"],
  ["forearm", "Antebraço"], ["abs", "Abdômen"], ["obliques", "Oblíquos"], ["trapezius", "Trapézio"],
  ["upper-back", "Dorsal"], ["lower-back", "Lombar"], ["gluteal", "Glúteos"], ["quadriceps", "Quadríceps"],
  ["hamstring", "Posterior de coxa"], ["adductors", "Adutores"], ["calves", "Panturrilha"],
  ["tibialis", "Tibial"], ["neck", "Pescoço"],
];
const LABEL = Object.fromEntries(MUSCLES);
const PRESETS = ["#34c77b", "#22c55e", "#10b981", "#7bd88f", "#a3e635"];

// Remove o fundo da logo: tira tudo que for parecido com a cor dos cantos
async function processLogo(src, { removeBg, tol, white }) {
  const img = new Image();
  await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = src; });
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
    // remove a cor do fundo na imagem toda (inclusive dentro de letras como O, A, B)
    for (let i = 0; i < w * h; i++) {
      const dd = dist(i);
      if (dd <= t2) p[i*4+3] = 0;
      else if (dd <= t2 * 2.2) p[i*4+3] = Math.min(p[i*4+3], Math.round(255 * (Math.sqrt(dd) - tol) / (tol * 0.48 + 1))); // borda suave
    }
  }
  if (white) for (let i = 0; i < p.length; i += 4) { p[i] = p[i+1] = p[i+2] = 255; }
  x.putImageData(d, 0, 0);
  // recorta o espaço vazio em volta
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (p[(j*w+i)*4+3] > 20) { if (i<x0)x0=i; if (i>x1)x1=i; if (j<y0)y0=j; if (j>y1)y1=j; }
  if (x1 < 0) return c.toDataURL("image/png");
  const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return o.toDataURL("image/png");
}

function wrapText(x, text, maxW) {
  const words = text.split(" "); const lines = []; let line = "";
  for (const wd of words) { const t = line ? line + " " + wd : wd; if (x.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; }
  if (line) lines.push(line); return lines;
}

// Gera a etiqueta como PNG no formato A6 (105 × 148 mm, ~300 dpi).
// A margem de segurança evita que título e logo fiquem colados na borda ao imprimir.
const SANS = "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
async function cardToPng(card, title, muscles, logo) {
  const W = 1240, H = 1748, M = 110;            // M = margem de segurança (~9 mm)
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#000000"; x.fillRect(0, 0, W, H);
  x.textBaseline = "alphabetic";

  const half = (W - 2 * M) / 2 - 20;             // título e logo têm no máximo 50% cada
  x.fillStyle = "#ffffff"; x.font = `700 84px ${SANS}`;
  const tl = wrapText(x, title || "Exercício", half);
  let y = M + 72;
  tl.forEach((l, i) => x.fillText(l, M, y + i * 94));
  y += (tl.length - 1) * 94 + 66;
  x.fillStyle = "#a1a1a6"; x.font = `400 44px ${SANS}`;
  const ml = wrapText(x, muscles, half);
  ml.forEach((l, i) => x.fillText(l, M, y + i * 56));
  let headBottom = y + (ml.length - 1) * 56 + 20;

  if (logo) {
    const li = new Image();
    await new Promise((ok, no) => { li.onload = ok; li.onerror = no; li.src = logo; });
    const k = Math.min(half / li.width, 190 / li.height);
    const lw = li.width * k, lh = li.height * k;
    x.drawImage(li, W - M - lw, M, lw, lh);
    headBottom = Math.max(headBottom, M + lh);
  }

  const top = headBottom + 70;
  const captionH = 90;
  const svgs = card.querySelectorAll(".pbodies svg");
  const slotW = (W - 2 * M) / 2;
  for (let i = 0; i < svgs.length; i++) {
    const el = svgs[i].cloneNode(true);
    const r = svgs[i].getBoundingClientRect();
    el.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    el.setAttribute("width", r.width); el.setAttribute("height", r.height);
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(el));
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
    const ratio = r.height / r.width;
    const h = Math.min(H - M - captionH - top, (slotW - 20) * ratio);
    const w = h / ratio;
    x.drawImage(img, M + i * slotW + (slotW - w) / 2, top, w, h);
    x.fillStyle = "#8e8e93"; x.font = `400 40px ${SANS}`; x.textAlign = "center";
    x.fillText(i ? "Costas" : "Frente", M + i * slotW + slotW / 2, top + h + 64);
    x.textAlign = "left";
  }
  return c.toDataURL("image/png");
}

const slugify = (t) => (t || "etiqueta").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "etiqueta";

function App() {
  const [title, setTitle] = useState("Tríceps testa");
  const [color, setColor] = useState("#34c77b");
  const [own, setOwn] = useState({});
  const [sel, setSel] = useState(["triceps"]);
  const [preview, setPreview] = useState(false);
  const [png, setPng] = useState("");
  const [printMsg, setPrintMsg] = useState("");
  const cardRef = useRef(null);
  const [logoSrc, setLogoSrc] = useState("");
  const [logo, setLogo] = useState("");
  const [removeBg, setRemoveBg] = useState(true);
  const [tol, setTol] = useState(60);
  const [white, setWhite] = useState(false);

  useEffect(() => {
    if (!logoSrc) { setLogo(""); return; }
    let alive = true;
    processLogo(logoSrc, { removeBg, tol, white }).then((u) => alive && setLogo(u)).catch(() => alive && setLogo(logoSrc));
    return () => { alive = false; };
  }, [logoSrc, removeBg, tol, white]);

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setLogoSrc(r.result); r.readAsDataURL(f);
    e.target.value = "";
  };

  const toggle = (slug) => setSel((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  const data = sel.map((slug) => ({ slug, color: own[slug] || color }));
  const press = (part) => part?.slug && LABEL[part.slug] && toggle(part.slug);
  const names = sel.map((m) => LABEL[m]).join(" · ");

  useEffect(() => {
    if (!preview) { setPng(""); return; }
    const t = setTimeout(() => {
      cardToPng(cardRef.current, title, names || "Nenhum músculo marcado", logo).then(setPng).catch(() => setPng(""));
    }, 150);
    return () => clearTimeout(t);
  }, [preview, title, names, color, own, logo]);

  const doPrint = () => {
    const before = Date.now();
    try { window.print(); } catch (e) {}
    // Dentro do Claude o diálogo de impressão é bloqueado e print() volta na hora
    if (Date.now() - before < 300) setPrintMsg("A janela de impressão não abriu neste navegador. Use Baixar imagem e imprima o arquivo.");
  };

  return (
    <>
      <main className="app">
        <input id="titulo" className="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do exercício" aria-label="Nome do exercício" />
        <p className="sub">{names || "Nenhum músculo marcado"}</p>

        <h2>Músculos trabalhados</h2>
        <div className="bodies">
          {["front", "back"].map((side) => (
            <figure key={side}>
              <div className="svg"><Body data={data} side={side} scale={1.1} border="none" onBodyPartPress={press} /></div>
              <figcaption>{side === "front" ? "Frente" : "Costas"}</figcaption>
            </figure>
          ))}
        </div>

        <button className="primary" onClick={() => { setPrintMsg(""); setPreview(true); }}>Visualizar impressão</button>

        <h2>Logo da academia</h2>
        <div className="logobox">
          <div className="logoprev">{logo ? <img src={logo} alt="Logo da academia" /> : <span className="hint">Nenhuma logo</span>}</div>
          <div className="logoctl">
            <label className="upload"><input id="logo" type="file" accept="image/*" onChange={onFile} />{logoSrc ? "Trocar imagem" : "Enviar imagem"}</label>
            {logoSrc && (<>
              <label className="opt"><input id="rmbg" type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} /> Remover fundo</label>
              {removeBg && <label className="opt range">Sensibilidade<input id="tol" type="range" min="10" max="160" value={tol} onChange={(e) => setTol(+e.target.value)} /></label>}
              <label className="opt"><input id="white" type="checkbox" checked={white} onChange={(e) => setWhite(e.target.checked)} /> Deixar logo branca</label>
              <button className="link" onClick={() => setLogoSrc("")}>Remover logo</button>
            </>)}
          </div>
        </div>

        <h2>Cor do destaque</h2>
        <div className="colors">
          {PRESETS.map((c) => (
            <button key={c} className={"dot" + (c === color ? " active" : "")} style={{ background: c }}
              onClick={() => setColor(c)} aria-label={"Usar " + c} />
          ))}
          <label className="custom"><input id="cor" type="color" value={color} onChange={(e) => setColor(e.target.value)} /><span>{color}</span></label>
        </div>

        <h2>Grupos marcados</h2>
        <p className="hint">Toque no boneco ou aqui. A bolinha ao lado de um grupo marcado dá uma cor só para ele.</p>
        <div className="chips">
          {MUSCLES.map(([slug, label]) => {
            const on = sel.includes(slug);
            return (
              <span key={slug} className={"chip" + (on ? " on" : "")}>
                <button onClick={() => toggle(slug)}>{label}</button>
                {on && (
                  <input id={"c-" + slug} type="color" value={own[slug] || color}
                    onChange={(e) => setOwn((o) => ({ ...o, [slug]: e.target.value }))} title="Cor deste grupo" />
                )}
              </span>
            );
          })}
        </div>
      </main>

      {preview && (
        <div className="overlay" role="dialog" aria-label="Visualizar impressão">
          <div className="bar">
            <button className="ghost" onClick={() => setPreview(false)}>Voltar</button>
            <div className="actions">
              {png
                ? <a className="ghost" href={png} download={slugify(title) + ".png"}>Baixar imagem</a>
                : <span className="ghost disabled">Baixar imagem</span>}
              <button className="primary" onClick={doPrint} disabled={!png}>Imprimir</button>
            </div>
          </div>
          {printMsg && <p className="msg">{printMsg}</p>}

          {/* Etiqueta em HTML: fica fora da tela e serve só de fonte dos desenhos para a imagem */}
          <div className="paper" ref={cardRef} aria-hidden="true">
            <div className="pbodies">
              {["front", "back"].map((side) => (
                <figure key={side}><Body data={data} side={side} scale={1} border="none" /></figure>
              ))}
            </div>
          </div>

          <div className="sheet">
            {png ? <img src={png} alt={"Etiqueta " + (title || "Exercício")} /> : <span className="hint">Gerando etiqueta…</span>}
          </div>
          <p className="size">Tamanho A6 · 105 × 148 mm</p>
        </div>
      )}
    </>
  );
}

export default App;
