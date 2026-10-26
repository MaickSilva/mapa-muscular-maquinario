// Build do Mapa Muscular: gera dist/ pronto para o GitHub Pages.
// Uso: node build.mjs        -> build de produção
//      node build.mjs --dev  -> servidor local em http://localhost:5173
import * as esbuild from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const dev = process.argv.includes("--dev");

const options = {
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: !dev,
  sourcemap: dev,
  outdir: "dist/assets",
  entryNames: "app",
  jsx: "automatic",
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
const html = (await readFile("index.html", "utf8"))
  .replace('<script type="module" src="/src/main.jsx"></script>', '<link rel="stylesheet" href="./assets/app.css" />\n    <script defer src="./assets/app.js"></script>');
await writeFile("dist/index.html", html);
await writeFile("dist/.nojekyll", "");

if (dev) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  await ctx.serve({ servedir: "dist", port: 5173 });
  console.log("Rodando em http://localhost:5173");
} else {
  await esbuild.build(options);
}
