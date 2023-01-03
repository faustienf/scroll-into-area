import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
// @ts-ignore
import { amethyst } from "@codesandbox/sandpack-themes";

import { Cat } from "./cat";
import { GhLink } from "./gh-link";

const code = `
import { scrollIntoArea } from "scroll-into-area";

const controller = new AbortController();
// Abort scrolling
// controller.abort(); ❌

const container = document.querySelector('ul');
const target = container.querySelector('li');

const progress = await scrollIntoArea(target, {
  container,
  x: 'start', // start, center, end
  y: 'end', // start, center, end
  duration: 400, // ms
  signal: controller.signal,
  // 👀 https://easings.net/#easeOutCubic
  easing: (x) => 1 - Math.pow(1 - x, 3),
});

if (progress === 1) {
  console.log("Completed");
} else {
  console.log("Canceled");
}
`.trim();

export const App = () => {
  return (
    <div className="app">
      <GhLink
        href="https://github.com/faustienf/scroll-into-area"
        target="_blank"
      />
      <Cat />
      <div className="code">
        <SandpackProvider
          style={{ height: "100%" }}
          theme={amethyst}
          template="react"
          files={{
            "/App.js": code,
          }}
        >
          <SandpackLayout style={{ height: "100%" }}>
            <SandpackCodeEditor style={{ height: "100%" }} readOnly />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
};
