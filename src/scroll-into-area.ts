import { easingScroll } from "easing-scroll";

export type Position = "start" | "end" | "center";

type Options = {
  container: Element;
  x?: Position;
  y?: Position;
};

const getStartScroll = (
  containerScroll: number,
  containerOffset: number,
  targetOffset: number
): number => containerScroll - containerOffset + targetOffset;

const getEndScroll = (
  containerScroll: number,
  containerOffset: number,
  containerSize: number,
  targetOffset: number,
  targetSize: number
) => {
  const offset = targetOffset - containerOffset - containerSize;
  return containerScroll + offset + targetSize;
};

const getCenterScroll = (
  containerScroll: number,
  containerOffset: number,
  containerSize: number,
  targetOffset: number,
  targetSize: number
) => {
  const offset = targetOffset - containerOffset - containerSize / 2;
  return containerScroll + offset + targetSize / 2;
};

export const scrollIntoArea = <E extends Element>(
  target: E,
  { container, x, y }: Options
) => {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  let top: number | undefined;
  let left: number | undefined;

  switch (x) {
    case "start": {
      left = getStartScroll(
        container.scrollLeft,
        containerRect.left,
        targetRect.left
      );
      break;
    }
    case "end": {
      left = getEndScroll(
        container.scrollLeft,
        containerRect.left,
        containerRect.width,
        targetRect.left,
        targetRect.width
      );
      break;
    }
    case "center": {
      left = getCenterScroll(
        container.scrollLeft,
        containerRect.left,
        containerRect.width,
        targetRect.left,
        targetRect.width
      );
      break;
    }
  }

  switch (y) {
    case "start": {
      top = getStartScroll(
        container.scrollTop,
        containerRect.top,
        targetRect.top
      );
      break;
    }
    case "end": {
      top = getEndScroll(
        container.scrollTop,
        containerRect.top,
        containerRect.height,
        targetRect.top,
        targetRect.height
      );
      break;
    }
    case "center": {
      top = getCenterScroll(
        container.scrollTop,
        containerRect.top,
        containerRect.height,
        targetRect.top,
        targetRect.height
      );
      break;
    }
  }

  return easingScroll(container, { top, left, duration: 400 });
};
