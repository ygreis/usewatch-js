import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: false,
  minify: false,
  outDir: "dist",
  outExtension: () => ({
    js: ".js",
  }),
  platform: "browser",
  sourcemap: true,
  splitting: false,
  target: "es2018",
  treeshake: true,
});
