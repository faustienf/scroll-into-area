import { forwardRef } from "react";
import "./target-card.css";

export const TargetCard = forwardRef<HTMLDivElement>((_, ref) => (
  <div className="target-card" ref={ref}>
    <span className="target-icon">◎</span>
    <span className="target-label">Target</span>
  </div>
));

TargetCard.displayName = "TargetCard";
