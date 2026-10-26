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

// Converte os SVGs da etiqueta em uma imagem PNG (para salvar ou compartilhar)
async function cardToPng(card, title, muscles, logo) {
  const W = 1200, H = 1500, s = 2;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#000000"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#ffffff"; x.font = "700 84px -apple-system, Segoe UI, Roboto, sans-serif";
  const half = (W - 140) / 2 - 20;
  const tl = wrapText(x, title || "Exercício", half);
  tl.forEach((l, i) => x.fillText(l, 70, 150 + i * 92));
  let y = 150 + (tl.length - 1) * 92 + 70;
  x.fillStyle = "#a1a1a6"; x.font = "400 44px -apple-system, Segoe UI, Roboto, sans-serif";
  const ml = wrapText(x, muscles, half);
  ml.forEach((l, i) => x.fillText(l, 70, y + i * 54));
  if (logo) {
    const li = new Image(); await new Promise((ok, no) => { li.onload = ok; li.onerror = no; li.src = logo; });
    const lh = Math.min(170, li.height * (half / li.width)); const lw = li.width * (lh / li.height);
    x.drawImage(li, W - 70 - lw, 80, lw, lh);
  }
  const top = Math.max(290, y + ml.length * 54 + 30);
  const svgs = card.querySelectorAll(".pbodies svg");
  const slotW = (W - 140) / 2;
  for (let i = 0; i < svgs.length; i++) {
    const el = svgs[i].cloneNode(true);
    const r = svgs[i].getBoundingClientRect();
    el.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    el.setAttribute("width", r.width); el.setAttribute("height", r.height);
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(el));
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
    const h = Math.min(1050 - Math.max(0, (typeof top === "number" ? top : 290) - 290), slotW * (r.height / r.width));
    const w = h * (r.width / r.height);
    x.drawImage(img, 70 + i * slotW + (slotW - w) / 2, top, w, Math.min(h, H - top - 110) === h ? h : h);
    x.fillStyle = "#8e8e93"; x.font = "400 40px -apple-system, Segoe UI, Roboto, sans-serif";
    x.textAlign = "center"; x.fillText(i ? "Costas" : "Frente", 70 + i * slotW + slotW / 2, top + h + 70); x.textAlign = "left";
  }
  return c.toDataURL("image/png");
}

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
    if (Date.now() - before < 300) setPrintMsg("Se a janela de impressão não abriu, salve a imagem abaixo (pressione e segure no celular, ou clique com o botão direito) e imprima a partir dela.");
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
            <button className="primary" onClick={doPrint}>Imprimir</button>
          </div>
          {printMsg && <p className="msg">{printMsg}</p>}

          <div className="paper" ref={cardRef}>
            <div className="phead">
              <div className="ptitle">
                <h1>{title || "Exercício"}</h1>
                <p className="psub">{names || "Nenhum músculo marcado"}</p>
              </div>
              {logo && <img className="plogo" src={logo} alt="Logo da academia" />}
            </div>
            <div className="pbodies">
              {["front", "back"].map((side) => (
                <figure key={side}>
                  <Body data={data} side={side} scale={1} border="none" defaultFill="#d4d6d9" />
                  <figcaption>{side === "front" ? "Frente" : "Costas"}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="saveimg">
            <p>Imagem para salvar</p>
            {png ? <img src={png} alt={"Etiqueta " + title} /> : <span className="hint">Gerando imagem…</span>}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
