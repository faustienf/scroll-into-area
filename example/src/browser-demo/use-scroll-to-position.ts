import { useRef, useState, useCallback } from "react";
import { Position, scrollIntoArea } from "scroll-into-area";
import { easeOutCubic } from "./constants";

export const useScrollToPosition = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [posX, setPosX] = useState<Position>("center");
  const [posY, setPosY] = useState<Position>("center");
  const [isAnimating, setIsAnimating] = useState(false);

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

  return {
    viewportRef,
    targetRef,
    posX,
    posY,
    isAnimating,
    handlePosX,
    handlePosY,
    handleReset,
    handleScrollTo,
  };
};
