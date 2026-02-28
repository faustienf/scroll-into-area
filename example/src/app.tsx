import { useState, useEffect, useCallback } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackLayout,
} from "@codesandbox/sandpack-react";

import { Cat } from "./cat";
import { GhLink } from "./gh-link";
import { BrowserDemo } from "./browser-demo";

const code = `
import { scrollIntoArea } from "scroll-into-area";

const controller = new AbortController();
// Abort scrolling
// controller.abort(); ❌

const container = document.querySelector("ul");
const target = container.querySelector("li");

const progress = await scrollIntoArea(target, {
  container,
  x: "center",
  y: "end",
  signal: controller.signal,
  duration: 600,
  // 👀 https://easings.net/#easeOutCubic
  easing: (x) => 1 - Math.pow(1 - x, 3),
});

if (progress === 1) {
  console.log("Completed");
} else {
  console.log("Canceled");
}
`.trim();

const sandpackTheme = {
  colors: {
    surface1: "rgba(255,255,255,0.45)",
    surface2: "rgba(255,255,255,0.3)",
    surface3: "rgba(240,240,255,0.4)",
    clickable: "#6b7280",
    base: "#374151",
    disabled: "#9ca3af",
    hover: "#4b5563",
    accent: "#7c3aed",
    error: "#ef4444",
    errorSurface: "#fef2f2",
  },
  syntax: {
    plain: "#374151",
    comment: { color: "#9ca3af", fontStyle: "italic" as const },
    keyword: "#7c3aed",
    tag: "#059669",
    punctuation: "#6b7280",
    definition: "#2563eb",
    property: "#d97706",
    static: "#dc2626",
    string: "#059669",
  },
  font: {
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
    size: "13px",
    lineHeight: "1.6",
  },
};

export const App = () => {
  const [showCat, setShowCat] = useState(false);

  const toggleCat = useCallback(() => {
    setShowCat((prev) => !prev);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        toggleCat();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCat]);

  return (
    <div className="app">
      <GhLink
        href="https://github.com/faustienf/scroll-into-area"
        target="_blank"
      />

      <header className="app-header">
        <h1 className="app-title" onDoubleClick={toggleCat}>
          <code>scroll-into-area</code>
        </h1>
        <p className="app-subtitle">
          Smooth scroll a target element into any position within a container
        </p>
      </header>

      <section className={`cat-section ${showCat ? "visible" : ""}`}>
        <div className="cat-card">
          <span className="cat-card-label">Easter egg 🐱</span>
          <Cat />
        </div>
      </section>

      <main>
        <BrowserDemo />
      </main>

      <section className="code-section">
        <div className="code-card">
          <div className="code-card-header">Code example</div>
          <div className="code">
            <SandpackProvider
              style={{ height: "100%" }}
              theme={sandpackTheme}
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
      </section>
    </div>
  );
};
