import path from "path";
import typescript from "rollup-plugin-typescript2";
import esbuild from "rollup-plugin-esbuild";

const plugins = ({ target } = {}) => {
  return [
    typescript({
      tsconfigOverride: { declaration: true },
    }),
    esbuild({
      minify: true,
      target,
    }),
  ];
};

const entry = (input) => {
  const { dir, name } = path.parse(input);
  const filename = `${dir}/${name}`;
  console.log(filename);
  return [
    {
      input: `src/${input}`,
      output: {
        file: `dist${filename}.mjs`,
        format: "es",
      },
      plugins: plugins({ target: "esnext" }),
    },
    {
      input: `src/${input}`,
      output: {
        file: `dist${filename}.js`,
        format: "cjs",
      },
      plugins: plugins({ target: "es2015" }),
    },
  ];
};

export default [...entry("index.ts"), ...entry("easing-scroll.ts")];
