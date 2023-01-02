import { easingScroll } from "easing-scroll";

type Px = number;
/**
 * Percent is number 0 - 1
 *
 * 0 = 0%, 1 = 100%
 */
type Pct = number;
type Ms = number;
export type Position = "start" | "end" | "center";

type Options = {
  container: Element;
  x?: Position;
  y?: Position;
  duration?: Ms;
  /**
   * @see https://easings.net
   */
  easing?: (progess: Pct) => Pct;
  signal?: AbortSignal;
};

type Properties = {
  containerScroll: Px;
  containerOffset: Px;
  containerSize: Px;
  targetOffset: Px;
  targetSize: Px;
};

const getStartScroll = ({
  containerScroll,
  containerOffset,
  targetOffset,
}: Omit<Properties, "targetSize" | "containerSize">): Px =>
  containerScroll - containerOffset + targetOffset;

const getEndScroll = ({
  containerScroll,
  containerOffset,
  containerSize,
  targetOffset,
  targetSize,
}: Properties): Px => {
  const offset = targetOffset - containerOffset - containerSize;
  return containerScroll + offset + targetSize;
};

const getCenterScroll = ({
  containerScroll,
  containerOffset,
  containerSize,
  targetOffset,
  targetSize,
}: Properties): Px => {
  const offset = targetOffset - containerOffset - containerSize / 2;
  return containerScroll + offset + targetSize / 2;
};

const positionScroll = {
  start: getStartScroll,
  center: getCenterScroll,
  end: getEndScroll,
} as const;

export const scrollIntoArea = <E extends Element>(
  target: E,
  { container, x, y, ...rest }: Options
): Promise<Pct> => {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const top =
    y &&
    positionScroll[y]({
      containerOffset: containerRect.top,
      containerScroll: container.scrollTop,
      containerSize: containerRect.height,
      targetOffset: targetRect.top,
      targetSize: targetRect.height,
    });

  const left =
    x &&
    positionScroll[x]({
      containerOffset: containerRect.left,
      containerScroll: container.scrollLeft,
      containerSize: containerRect.width,
      targetOffset: targetRect.left,
      targetSize: targetRect.width,
    });

  return easingScroll(container, { top, left, ...rest });
};
