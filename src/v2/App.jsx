import React, { useState, useRef, useEffect, useMemo } from "react";
import BodyModule from "react-native-body-highlighter";
import { SIZES, renderLabel, svgsToImages, processLogo } from "./label.js";

const Body = BodyModule.default || BodyModule;

const MUSCLES = [
  ["chest", "Peitoral"], ["deltoids", "Ombros"], ["biceps", "Bíceps"], ["triceps", "Tríceps"],
  ["forearm", "Antebraço"], ["abs", "Abdômen"], ["obliques", "Oblíquos"], ["trapezius", "Trapézio"],
  ["upper-back", "Dorsal"], ["lower-back", "Lombar"], ["gluteal", "Glúteos"], ["quadriceps", "Quadríceps"],
  ["hamstring", "Posterior de coxa"], ["adductors", "Adutores"], ["calves", "Panturrilha"],
  ["tibialis", "Tibial"], ["neck", "Pescoço"],
];
const LABEL = Object.fromEntries(MUSCLES);
const STORE = "mapa-muscular-v2-rascunho";

const EXAMPLE = {
  code: "12",
  title: "Supino reto",
  roles: { chest: "p", triceps: "s", deltoids: "s" },
  pColor: "#34c77b",
  sColor: "#1d6b45",
  setup: "Deite com os olhos alinhados à barra\nPés firmes no chão, quadril no banco",
  steps: "Segure a barra um pouco além da largura dos ombros\nDesça a barra até a linha do peito\nEmpurre até estender os braços, sem travar os cotovelos",
  mistakes: "Tirar o quadril do banco\nQuicar a barra no peito",
  warning: "Use com orientação de um profissional. Ajuste a máquina e confira as travas antes de colocar carga.",
  maxLoad: "",
  video: "",
  size: "A6",
};

const lines = (t) => t.split("\n").map((s) => s.trim()).filter(Boolean);
const slugify = (t) => (t || "etiqueta").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "etiqueta";

function loadDraft() {
  try { const s = localStorage.getItem(STORE); if (s) return { ...EXAMPLE, ...JSON.parse(s) }; } catch (e) {}
  return EXAMPLE;
}

function Field({ id, label, hint, children }) {
  return (
    <label className="field" htmlFor={id}>
      <span className="flabel">{label}</span>
      {children}
      {hint && <span className="fhint">{hint}</span>}
    </label>
  );
}

export default function App() {
  const [f, setF] = useState(loadDraft);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));

  const [logoSrc, setLogoSrc] = useState("");
  const [logo, setLogo] = useState("");
  const [removeBg, setRemoveBg] = useState(true);
  const [tol, setTol] = useState(60);
  const [white, setWhite] = useState(false);

  const [preview, setPreview] = useState(false);
  const [png, setPng] = useState("");
  const [printMsg, setPrintMsg] = useState("");
  const hiddenRef = useRef(null);

  // guarda o rascunho neste navegador (sem a logo)
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(f)); } catch (e) {} }, [f]);

  useEffect(() => {
    if (!logoSrc) { setLogo(""); return; }
    let alive = true;
    processLogo(logoSrc, { removeBg, tol, white }).then((u) => alive && setLogo(u)).catch(() => alive && setLogo(logoSrc));
    return () => { alive = false; };
  }, [logoSrc, removeBg, tol, white]);

  const primary = MUSCLES.filter(([m]) => f.roles[m] === "p").map(([, l]) => l);
  const secondary = MUSCLES.filter(([m]) => f.roles[m] === "s").map(([, l]) => l);
  const data = useMemo(() => Object.entries(f.roles).map(([slug, r]) => ({ slug, color: r === "p" ? f.pColor : f.sColor })), [f.roles, f.pColor, f.sColor]);

  // toque: principal → secundário → remove
  const cycle = (slug) => setF((s) => {
    const roles = { ...s.roles };
    if (!roles[slug]) roles[slug] = "p"; else if (roles[slug] === "p") roles[slug] = "s"; else delete roles[slug];
    return { ...s, roles };
  });
  const press = (part) => part?.slug && LABEL[part.slug] && cycle(part.slug);

  const labelData = {
    code: f.code.trim(), title: f.title.trim(), primary, secondary, pColor: f.pColor, sColor: f.sColor,
    setup: lines(f.setup), steps: lines(f.steps), mistakes: lines(f.mistakes),
    warning: f.warning.trim(), maxLoad: f.maxLoad.trim(), video: f.video.trim(), logo, size: f.size,
  };
  const key = JSON.stringify(labelData);

  useEffect(() => {
    if (!preview) { setPng(""); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const bodies = await svgsToImages(hiddenRef.current.querySelectorAll("svg"));
        const url = await renderLabel(labelData, bodies);
        if (alive) setPng(url);
      } catch (e) { if (alive) setPng(""); }
    }, 150);
    return () => { alive = false; clearTimeout(t); };
  }, [preview, key]);

  // tamanho da folha na impressão acompanha o tamanho escolhido
  useEffect(() => {
    const [w, h] = SIZES[f.size].mm;
    let el = document.getElementById("page-size");
    if (!el) { el = document.createElement("style"); el.id = "page-size"; document.head.appendChild(el); }
    el.textContent = `@media print { @page { size: ${w}mm ${h}mm; margin: 0; } .sheet, .sheet img { width: ${w}mm !important; height: ${h}mm !important; } }`;
  }, [f.size]);

  const onFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader(); r.onload = () => setLogoSrc(r.result); r.readAsDataURL(file);
    e.target.value = "";
  };
  const doPrint = () => {
    const before = Date.now();
    try { window.print(); } catch (e) {}
    if (Date.now() - before < 300) setPrintMsg("A janela de impressão não abriu neste navegador. Use Baixar imagem e imprima o arquivo.");
  };
  const reset = () => setF({ ...EXAMPLE, roles: {}, code: "", title: "", setup: "", steps: "", mistakes: "", maxLoad: "", video: "" });

  const sizeStyle = { aspectRatio: `${SIZES[f.size].w} / ${SIZES[f.size].h}` };

  return (
    <>
      <main className="app">
        <div className="top">
          <span className="badge">v2 · em testes</span>
          <button className="link" onClick={reset}>Nova etiqueta em branco</button>
        </div>

        <div className="row2">
          <Field id="code" label="Nº"><input id="code" className="input code" value={f.code} onChange={set("code")} placeholder="12" /></Field>
          <Field id="titulo" label="Máquina ou exercício"><input id="titulo" className="input" value={f.title} onChange={set("title")} placeholder="Supino reto" /></Field>
        </div>

        <h2>Músculos trabalhados</h2>
        <p className="hint">Toque uma vez para principal, duas para secundário e três para tirar.</p>
        <div className="bodies">
          {["front", "back"].map((side) => (
            <figure key={side}>
              <div className="svg"><Body data={data} side={side} scale={1.1} border="none" onBodyPartPress={press} /></div>
              <figcaption>{side === "front" ? "Frente" : "Costas"}</figcaption>
            </figure>
          ))}
        </div>

        <div className="legend">
          <label className="lg"><input id="pcolor" type="color" value={f.pColor} onChange={set("pColor")} /> Principal{primary.length ? ": " + primary.join(", ") : ""}</label>
          <label className="lg"><input id="scolor" type="color" value={f.sColor} onChange={set("sColor")} /> Secundário{secondary.length ? ": " + secondary.join(", ") : ""}</label>
        </div>

        <div className="chips">
          {MUSCLES.map(([slug, label]) => {
            const r = f.roles[slug];
            return (
              <button key={slug} className={"chip" + (r ? " " + r : "")} onClick={() => cycle(slug)}
                style={r ? { borderColor: r === "p" ? f.pColor : f.sColor } : undefined}>
                {r && <span className="dot" style={{ background: r === "p" ? f.pColor : f.sColor }} />}
                {label}{r === "p" ? " · principal" : r === "s" ? " · secundário" : ""}
              </button>
            );
          })}
        </div>

        <h2>Instruções</h2>
        <div className="grid">
          <Field id="setup" label="Ajuste da máquina" hint="Um item por linha">
            <textarea id="setup" rows="3" value={f.setup} onChange={set("setup")} placeholder="Banco na altura do peito" />
          </Field>
          <Field id="steps" label="Execução" hint="Um passo por linha, até 4 cabem bem">
            <textarea id="steps" rows="5" value={f.steps} onChange={set("steps")} placeholder="Empurre até estender os braços" />
          </Field>
          <Field id="mistakes" label="Erros comuns" hint="Um por linha">
            <textarea id="mistakes" rows="2" value={f.mistakes} onChange={set("mistakes")} placeholder="Travar os cotovelos" />
          </Field>
        </div>

        <h2>Segurança</h2>
        <div className="grid">
          <Field id="warning" label="Aviso">
            <textarea id="warning" rows="3" value={f.warning} onChange={set("warning")} />
          </Field>
          <Field id="maxload" label="Carga máxima (opcional)" hint="Veja o valor na plaqueta do fabricante">
            <input id="maxload" className="input" value={f.maxLoad} onChange={set("maxLoad")} placeholder="150 kg" />
          </Field>
        </div>

        <h2>Vídeo</h2>
        <Field id="video" label="Link do vídeo (opcional)" hint="Vira um QR code na etiqueta">
          <input id="video" className="input" type="url" value={f.video} onChange={set("video")} placeholder="https://youtube.com/..." />
        </Field>

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

        <h2>Tamanho</h2>
        <div className="seg" role="radiogroup" aria-label="Tamanho da etiqueta">
          {Object.entries(SIZES).map(([k, s]) => (
            <button key={k} role="radio" aria-checked={f.size === k} className={f.size === k ? "on" : ""} onClick={() => set("size")(k)}>{s.label}</button>
          ))}
        </div>

        <button className="primary wide" onClick={() => { setPrintMsg(""); setPreview(true); }}>Visualizar etiqueta</button>
      </main>

      {/* desenho do corpo usado na imagem (fora da tela) */}
      <div className="offscreen" ref={hiddenRef} aria-hidden="true">
        {["front", "back"].map((side) => <Body key={side} data={data} side={side} scale={1} border="none" />)}
      </div>

      {preview && (
        <div className="overlay" role="dialog" aria-label="Visualizar etiqueta">
          <div className="bar">
            <button className="ghost" onClick={() => setPreview(false)}>Voltar</button>
            <div className="actions">
              {png ? <a className="ghost" href={png} download={`${slugify((f.code ? f.code + " " : "") + f.title)}.png`}>Baixar imagem</a>
                : <span className="ghost disabled">Baixar imagem</span>}
              <button className="primary" onClick={doPrint} disabled={!png}>Imprimir</button>
            </div>
          </div>
          {printMsg && <p className="msg">{printMsg}</p>}
          <div className="sheet" style={sizeStyle}>
            {png ? <img src={png} alt={"Etiqueta " + (f.title || "Exercício")} /> : <span className="hint">Gerando etiqueta…</span>}
          </div>
          <p className="size">{SIZES[f.size].label}</p>
        </div>
      )}
    </>
  );
}
