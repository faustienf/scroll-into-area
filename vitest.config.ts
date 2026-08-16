import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      // Only the published source counts. `all` keeps files that no test ever
      // imports in the report, so a new module cannot arrive at 0% unnoticed.
      all: true,
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      // The default `text` reporter prints an empty file table here (vitest
      // 4.1.10) even though the data behind it is right — coverage-final.json
      // and the HTML report both list the file. `text-summary` shows the
      // numbers without the misleading blank table; `html` is where the
      // per-line detail is, in coverage/index.html.
      reporter: ["text-summary", "html"],
      // The suite covers every line and branch today, so the threshold is the
      // current state rather than an aspiration: new code arrives with tests,
      // or CI goes red. Lower it deliberately if that ever stops being worth it.
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
