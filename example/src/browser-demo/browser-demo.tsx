import { useRef, useState, useCallback, useEffect } from "react";
import { Position, scrollIntoArea } from "scroll-into-area";
import "./browser-demo.css";

const POSITIONS: Position[] = ["start", "center", "end", "nearest"];

const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

export const BrowserDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [posX, setPosX] = useState<Position>("center");
  const [posY, setPosY] = useState<Position>("center");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const target = targetRef.current;
    const ghost = ghostRef.current;
    const demo = demoRef.current;
    if (!viewport || !target || !ghost || !demo) return;

    const update = () => {
      const vRect = viewport.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const dRect = demo.getBoundingClientRect();

      const isFullyVisible =
        tRect.left >= vRect.left &&
        tRect.right <= vRect.right &&
        tRect.top >= vRect.top &&
        tRect.bottom <= vRect.bottom;

      ghost.style.left = `${tRect.left - dRect.left}px`;
      ghost.style.top = `${tRect.top - dRect.top}px`;
      ghost.style.width = `${tRect.width}px`;
      ghost.style.height = `${tRect.height}px`;
      ghost.style.opacity = isFullyVisible ? "0" : "1";
    };

    viewport.addEventListener("scroll", update);
    update();
    return () => viewport.removeEventListener("scroll", update);
  }, []);

  const scrollToPosition = useCallback(async (x: Position, y: Position) => {
    if (!viewportRef.current || !targetRef.current) return;
    setIsAnimating(true);
    await scrollIntoArea(targetRef.current, {
      container: viewportRef.current,
      x,
      y,
      duration: 600,
      easing: easeOutCubic,
    });
    setIsAnimating(false);
  }, []);

  const handlePosX = useCallback(
    (pos: Position) => {
      setPosX(pos);
      scrollToPosition(pos, posY);
    },
    [posY, scrollToPosition],
  );

  const handlePosY = useCallback(
    (pos: Position) => {
      setPosY(pos);
      scrollToPosition(posX, pos);
    },
    [posX, scrollToPosition],
  );

  const handleReset = useCallback(() => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  const handleScrollTo = useCallback(() => {
    scrollToPosition(posX, posY);
  }, [posX, posY, scrollToPosition]);

  return (
    <div className="browser-demo" ref={demoRef}>
      <div className="target-ghost" ref={ghostRef}>
        <span className="target-icon">◎</span>
        <span className="target-label">Target</span>
      </div>

      <div className="browser-window">
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

        <div className="browser-viewport" ref={viewportRef}>
          <div className="scroll-content">
            <div className="target-card" ref={targetRef}>
              <span className="target-icon">◎</span>
              <span className="target-label">Target</span>
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <span className="control-label">x</span>
          <div className="control-buttons">
            {POSITIONS.map((pos) => (
              <button
                key={`x-${pos}`}
                className={`control-btn ${posX === pos ? "active" : ""}`}
                onClick={() => handlePosX(pos)}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">y</span>
          <div className="control-buttons">
            {POSITIONS.map((pos) => (
              <button
                key={`y-${pos}`}
                className={`control-btn ${posY === pos ? "active" : ""}`}
                onClick={() => handlePosY(pos)}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div className="control-actions">
          <button
            className="action-btn action-scroll"
            onClick={handleScrollTo}
            disabled={isAnimating}
          >
            Scroll to position
          </button>
          <button className="action-btn action-reset" onClick={handleReset}>
            Reset viewport
          </button>
        </div>
      </div>
    </div>
  );
};
