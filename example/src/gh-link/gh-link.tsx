import { ComponentProps, FC } from "react";
import "./gh-link.css";

type Props = ComponentProps<"a">;

export const GhLink: FC<Props> = (props) => {
  return <a className="gh-link" {...props} />;
};
