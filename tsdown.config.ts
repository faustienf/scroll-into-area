import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/scroll-into-area.ts",
  format: ["esm", "cjs"],
  dts: true,
  // Browser library: keep the target independent of engines.node, which tsdown
  // would otherwise use (it would build for Node 18 rather than for browsers).
  target: "es2022",
  minify: true,
  clean: true,
  // Keep the published file names stable: tsdown would default to .mjs/.d.mts
  // for ESM, but package.json "exports" points at .js/.d.ts.
  outExtensions: ({ format }) =>
    format === "cjs"
      ? { js: ".cjs", dts: ".d.cts" }
      : { js: ".js", dts: ".d.ts" },
  // Validate the published package on every build: publint checks the manifest,
  // attw checks that types resolve correctly for both ESM and CJS consumers.
  publint: true,
  attw: true,
});
