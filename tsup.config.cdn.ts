import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "usewatch-js": "src/index.ts",
  },
  format: ["iife"],
  globalName: "usewatchJs",
  dts: false,
  clean: false,
  minify: true,
  outDir: "dist",
  outExtension: () => ({
    js: ".min.js",
  }),
  platform: "browser",
  sourcemap: false,
  splitting: false,
  target: "es2018",
  treeshake: true,
});
