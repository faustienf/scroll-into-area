import { useRef } from "react";
import { useScrollToPosition } from "./use-scroll-to-position";
import { useGhostTracking } from "./use-ghost-tracking";
import { BrowserTitlebar } from "./browser-titlebar";
import { TargetCard } from "./target-card";
import { TargetGhost } from "./target-ghost";
import { ScrollControls } from "./scroll-controls";
import "./browser-demo.css";

export const BrowserDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  const {
    viewportRef,
    targetRef,
    posX,
    posY,
    isAnimating,
    handlePosX,
    handlePosY,
    handleReset,
    handleScrollTo,
  } = useScrollToPosition();

  useGhostTracking(viewportRef, targetRef, ghostRef, demoRef);

  return (
    <div className="browser-demo" ref={demoRef}>
      <TargetGhost ref={ghostRef} />

      <div className="browser-window">
        <BrowserTitlebar />
        <div className="browser-viewport" ref={viewportRef}>
          <div className="scroll-content">
            <TargetCard ref={targetRef} />
          </div>
        </div>
      </div>

      <ScrollControls
        posX={posX}
        posY={posY}
        isAnimating={isAnimating}
        onPosXChange={handlePosX}
        onPosYChange={handlePosY}
        onScrollTo={handleScrollTo}
        onReset={handleReset}
      />
    </div>
  );
};
