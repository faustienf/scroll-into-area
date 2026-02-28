import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import { sandpackTheme } from "./sandpack-theme";
import { codeExample } from "./code-example";
import "./code-section.css";

export const CodeSection = () => (
  <section className="code-section">
    <div className="code-card">
      <div className="code-card-header">Code example</div>
      <div className="code">
        <SandpackProvider
          style={{ height: "100%" }}
          theme={sandpackTheme}
          template="react"
          files={{
            "/App.js": codeExample,
          }}
        >
          <SandpackLayout style={{ height: "100%" }}>
            <SandpackCodeEditor style={{ height: "100%" }} readOnly />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  </section>
);
