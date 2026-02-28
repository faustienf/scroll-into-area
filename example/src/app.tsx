import { Cat } from "./cat";
import { GhLink } from "./gh-link";
import { BrowserDemo } from "./browser-demo";
import { CodeSection } from "./code-section";
import { useEasterEgg } from "./hooks/use-easter-egg";
import "./app.css";

export const App = () => {
  const { showCat, toggleCat } = useEasterEgg();

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

      <CodeSection />
    </div>
  );
};
