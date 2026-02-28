import { RefObject, useEffect } from "react";

export const useGhostTracking = (
  viewportRef: RefObject<HTMLDivElement | null>,
  targetRef: RefObject<HTMLDivElement | null>,
  ghostRef: RefObject<HTMLDivElement | null>,
  demoRef: RefObject<HTMLDivElement | null>,
) => {
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
  }, [viewportRef, targetRef, ghostRef, demoRef]);
};
