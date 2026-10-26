# Mapa Muscular

Gere etiquetas com os grupos musculares trabalhados em cada exercício, para imprimir e colar nas máquinas da academia.

Escolha os músculos tocando no boneco (frente e costas), defina a cor do destaque, coloque o nome do exercício e a logo da academia, e imprima ou salve como imagem.

## Funcionalidades

- Boneco de frente e costas com os grupos musculares clicáveis
- Cor de destaque padrão e cor própria por grupo muscular
- Nome do exercício editável
- Logo da academia com remoção automática do fundo, ajuste de sensibilidade e opção de deixar a logo branca
- Etiqueta com fundo preto em tamanho A6, pronta para imprimir
- Exportação da etiqueta como imagem PNG

## Rodando localmente

Requer Node.js 18 ou mais novo.

```bash
npm install
npm run dev     # abre em http://localhost:5173
npm run build   # gera a pasta dist/
```

Ao imprimir pelo Chrome, marque **Gráficos de plano de fundo** para o fundo preto sair na impressão.

## Publicação

Cada push na branch `main` gera o build e publica no GitHub Pages pelo workflow em `.github/workflows/deploy.yml`. No repositório, deixe **Settings → Pages → Source** como **GitHub Actions**.

## Como funciona

O desenho do corpo vem do [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter), que roda na web através do [react-native-web](https://necolas.github.io/react-native-web/) e do `react-native-svg`. O build usa esbuild (veja `build.mjs`), com alias de `react-native` para `react-native-web`.

Para destacar um músculo, cada item de `data` recebe o `slug` e a cor:

```jsx
<Body side="front" data={[{ slug: "triceps", color: "#34c77b" }]} />
```

## Licença

MIT
