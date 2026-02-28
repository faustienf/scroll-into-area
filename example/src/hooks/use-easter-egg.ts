import { useState, useCallback, useEffect } from "react";

export const useEasterEgg = () => {
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

  return { showCat, toggleCat };
};
