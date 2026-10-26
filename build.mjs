// Build do Mapa Muscular: gera dist/ pronto para o GitHub Pages.
// Uso: node build.mjs        -> build de produção
//      node build.mjs --dev  -> servidor local em http://localhost:5173
import * as esbuild from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const dev = process.argv.includes("--dev");

const options = {
  // v1 em dist/ e v2 em dist/v2/ (a v2 não é linkada nem indexada)
  entryPoints: { "assets/app": "src/main.jsx", "v2/assets/app": "src/v2/main.jsx" },
  bundle: true,
  minify: !dev,
  sourcemap: dev,
  outdir: "dist",
  jsx: "automatic",
  // compatível com navegadores um pouco mais antigos (Safari 14+, Chrome 87+)
  target: ["es2019", "safari14", "chrome87", "firefox78", "edge88"],
  // react-native-body-highlighter é feito para React Native; na web usamos react-native-web
  alias: {
    "react-native": "react-native-web",
    "@react-native/assets-registry/registry": "./src/assets-registry-stub.js",
  },
  resolveExtensions: [".web.tsx", ".web.ts", ".web.js", ".tsx", ".ts", ".jsx", ".js", ".json"],
  loader: { ".js": "jsx" }, // a biblioteca publica JSX dentro de arquivos .js
  define: {
    "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production"),
    __DEV__: String(dev),
    global: "window",
  },
  logLevel: "info",
};

await mkdir("dist", { recursive: true });

// Escreve o index.html apontando para os arquivos gerados, com ?v= para não pegar cache antigo
async function writeHtml() {
  for (const [src, dir, script] of [["index.html", "dist", "/src/main.jsx"], ["v2.html", "dist/v2", "/src/v2/main.jsx"]]) {
    await mkdir(dir, { recursive: true });
    let v = "dev";
    if (!dev) {
      const js = await readFile(`${dir}/assets/app.js`);
      const css = await readFile(`${dir}/assets/app.css`);
      v = createHash("sha1").update(js).update(css).digest("hex").slice(0, 10);
    }
    const html = (await readFile(src, "utf8")).replace(
      `<script type="module" src="${script}"></script>`,
      `<link rel="stylesheet" href="./assets/app.css?v=${v}" />\n    <script defer src="./assets/app.js?v=${v}"></script>`
    );
    await writeFile(`${dir}/index.html`, html);
  }
  await writeFile("dist/.nojekyll", "");
}

if (dev) {
  const ctx = await esbuild.context(options);
  await writeHtml();
  await ctx.watch();
  await ctx.serve({ servedir: "dist", port: 5173 });
  console.log("Rodando em http://localhost:5173");
} else {
  await esbuild.build(options);
  await writeHtml();
}
