import { FC } from "react";
import { Position } from "scroll-into-area";
import { PositionGroup } from "../position-group";
import "./scroll-controls.css";

type Props = {
  posX: Position;
  posY: Position;
  isAnimating: boolean;
  onPosXChange: (pos: Position) => void;
  onPosYChange: (pos: Position) => void;
  onScrollTo: () => void;
  onReset: () => void;
};

export const ScrollControls: FC<Props> = ({
  posX,
  posY,
  isAnimating,
  onPosXChange,
  onPosYChange,
  onScrollTo,
  onReset,
}) => (
  <div className="controls">
    <PositionGroup axis="x" value={posX} onChange={onPosXChange} />
    <PositionGroup axis="y" value={posY} onChange={onPosYChange} />

    <div className="control-actions">
      <button
        className="action-btn action-scroll"
        onClick={onScrollTo}
        disabled={isAnimating}
      >
        Scroll to position
      </button>
      <button className="action-btn action-reset" onClick={onReset}>
        Reset viewport
      </button>
    </div>
  </div>
);
