import { forwardRef } from "react";
import "./target-ghost.css";

export const TargetGhost = forwardRef<HTMLDivElement>((_, ref) => (
  <div className="target-ghost" ref={ref}>
    <span className="target-icon">◎</span>
    <span className="target-label">Target</span>
  </div>
));

TargetGhost.displayName = "TargetGhost";
