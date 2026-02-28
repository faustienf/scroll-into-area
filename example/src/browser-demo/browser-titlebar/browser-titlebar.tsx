import "./browser-titlebar.css";

export const BrowserTitlebar = () => (
  <div className="browser-titlebar">
    <div className="browser-dots">
      <span className="dot dot-close" />
      <span className="dot dot-minimize" />
      <span className="dot dot-maximize" />
    </div>
    <div className="browser-address">
      <span className="browser-url">scroll-into-area</span>
    </div>
    <div className="browser-dots-spacer" />
  </div>
);
