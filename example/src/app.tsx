import { Cat } from "./cat";
import { GhLink } from "./gh-link";
import { BrowserDemo } from "./browser-demo";
import { CodeSection } from "./code-section";
import "./app.css";

export const App = () => {
  return (
    <div className="app">
      <GhLink
        href="https://github.com/faustienf/scroll-into-area"
        target="_blank"
      />

      <header className="app-header">
        <h1 className="app-title">
          <code>scroll-into-area</code>
        </h1>
        <p className="app-subtitle">
          Smooth scroll a target element into any position within a container
        </p>
      </header>

      <main>
        <BrowserDemo />
      </main>

      <CodeSection />

      <section className="cat-section visible">
        <div className="cat-card">
          <span className="cat-card-label">Easter egg 🐱</span>
          <Cat />
        </div>
      </section>
    </div>
  );
};
