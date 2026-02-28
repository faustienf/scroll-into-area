import { FC } from "react";
import { Position } from "scroll-into-area";
import { POSITIONS } from "../constants";
import "./position-group.css";

type Props = {
  axis: string;
  value: Position;
  onChange: (pos: Position) => void;
};

export const PositionGroup: FC<Props> = ({ axis, value, onChange }) => (
  <div className="control-group">
    <span className="control-label">{axis}</span>
    <div className="control-buttons">
      {POSITIONS.map((pos) => (
        <button
          key={`${axis}-${pos}`}
          className={`control-btn ${value === pos ? "active" : ""}`}
          onClick={() => onChange(pos)}
        >
          {pos}
        </button>
      ))}
    </div>
  </div>
);
