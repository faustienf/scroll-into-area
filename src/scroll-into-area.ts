import { easingScroll } from "easing-scroll";

/** Pixel value */
type Px = number;

/**
 * Progress percentage as a number between 0 and 1.
 *
 * - `0` — 0% (animation not started or aborted immediately)
 * - `1` — 100% (animation completed)
 * - `0 < value < 1` — partial progress (animation was aborted mid-way)
 */
type Pct = number;

/** Milliseconds value */
type Ms = number;

/** Scroll alignment position within the container */
export type Position = "start" | "end" | "center";

type Options = {
  /** The scrollable container element */
  container: HTMLElement;
  /** Horizontal scroll alignment */
  x?: Position;
  /** Vertical scroll alignment */
  y?: Position;
  /**
   * Animation duration in milliseconds.
   * If `0` or omitted, scrolls instantly without animation.
   */
  duration?: Ms;
  /**
   * Easing function that maps animation progress `t` (0–1) to eased value.
   * @default linear
   * @see Easing functions https://easings.net
   */
  easing?: (progress: Pct) => Pct;
  /**
   * An `AbortSignal` to cancel the scroll animation.
   * When aborted, the promise resolves with the current progress (0–1).
   */
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

/**
 * Smoothly scroll a target element into a specific position within a scrollable container.
 *
 * @param target - The element to scroll into view
 * @param options - Scroll options (container, position, duration, easing, signal)
 * @returns A promise that resolves with the animation progress:
 *   - `1` if the animation completed fully
 *   - `0` if the signal was already aborted before starting
 *   - `0 < value < 1` if the animation was aborted mid-way
 *
 * @example
 * ```ts
 * const container = document.querySelector("ul");
 * const target = container.querySelector("li");
 *
 * const progress = await scrollIntoArea(target, {
 *   container,
 *   y: "center",
 *   duration: 400,
 *   easing: (x) => 1 - Math.pow(1 - x, 3), // easeOutCubic
 * });
 * ```
 */
export const scrollIntoArea = <E extends Element>(
  target: E,
  { container, x, y, ...rest }: Options,
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
