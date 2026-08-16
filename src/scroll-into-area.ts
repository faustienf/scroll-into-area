import { easingScroll } from "easing-scroll";

/** Pixel value */
type Px = number;

/** Milliseconds value */
type Ms = number;

/**
 * Progress as a number between 0 and 1.
 *
 * - `0` — animation never started, or was aborted before the first frame
 * - `1` — animation completed
 * - `0 < value < 1` — animation was aborted mid-way
 */
type Pct = number;

/**
 * Scroll alignment within the container.
 *
 * `"start"` and `"end"` are logical, the way they are for `scrollIntoView`:
 * they name the edges content flows from and towards, not the left and right
 * ones. On a right-to-left axis they swap sides.
 */
export type Position = "start" | "end" | "center" | "nearest";

type Options = {
  /** The scrollable container element */
  container: Element;
  /**
   * Horizontal scroll alignment.
   *
   * `"start"` and `"end"` follow the container's `direction`, so in a
   * `direction: rtl` container `"start"` is its right edge.
   */
  x?: Position;
  /**
   * Vertical scroll alignment.
   *
   * Always resolved top-to-bottom: `"start"` is the top edge. Vertical writing
   * modes, where the block axis is the horizontal one, are not resolved.
   */
  y?: Position;
  /**
   * Animation duration in milliseconds.
   * Anything that is not a finite positive number scrolls instantly.
   * @default 0
   */
  duration?: Ms;
  /**
   * Easing function that maps animation progress `t` to an eased value.
   *
   * `t` is always within 0–1. The returned value may leave that range —
   * overshoot curves are clipped by the scrollable range.
   *
   * @default linear
   * @see Easing functions https://easings.net
   */
  easing?: (t: Pct) => number;
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
  /** `scroll-padding` at the physical start edge — top or left */
  padStart: Px;
  /** `scroll-padding` at the physical end edge — bottom or right */
  padEnd: Px;
};

/**
 * Every alignment below is expressed against the container's *optimal viewing
 * region*: the visible area inset by `scroll-padding`, spanning `padStart` to
 * `containerSize - padEnd`. That is the region `scrollIntoView` aligns to, and
 * with no `scroll-padding` set it is simply the whole visible area.
 */

/** Target's physical start edge meets the region's start edge. */
const alignStart = ({
  containerScroll,
  containerOffset,
  targetOffset,
  padStart,
}: Properties): Px =>
  containerScroll - containerOffset + targetOffset - padStart;

/** Target's physical end edge meets the region's end edge. */
const alignEnd = ({
  containerScroll,
  containerOffset,
  containerSize,
  targetOffset,
  targetSize,
  padEnd,
}: Properties): Px =>
  containerScroll +
  (targetOffset - containerOffset - containerSize) +
  targetSize +
  padEnd;

/** Target sits in the middle of the region. */
const alignCenter = ({
  containerScroll,
  containerOffset,
  containerSize,
  targetOffset,
  targetSize,
  padStart,
  padEnd,
}: Properties): Px => {
  // Unequal paddings move this off the container's own centre — a container
  // with only a sticky header centres lower than one with nothing set.
  const regionCentre = (padStart + containerSize - padEnd) / 2;
  return (
    containerScroll +
    (targetOffset - containerOffset - regionCentre) +
    targetSize / 2
  );
};

/** Target is brought just inside the region, whichever edge is closer. */
const alignNearest = (props: Properties, reversed: boolean): Px => {
  const {
    containerScroll,
    containerOffset,
    containerSize,
    targetOffset,
    targetSize,
    padStart,
    padEnd,
  } = props;

  const targetStart = targetOffset - containerOffset;
  const targetEnd = targetStart + targetSize;

  const regionStart = padStart;
  const regionEnd = containerSize - padEnd;

  // Already inside the region — leave the scroll position alone
  if (targetStart >= regionStart && targetEnd <= regionEnd) {
    return containerScroll;
  }

  // A target too large to fit cannot be brought fully into view, so it is
  // aligned to the logical start edge — which `scrollIntoView` does too, and
  // which is the physical end edge on a reversed axis.
  if (targetSize > regionEnd - regionStart) {
    return reversed ? alignEnd(props) : alignStart(props);
  }

  // Otherwise scroll the shorter way. Which edge that is depends on where the
  // target overflows, not on the direction content flows in.
  return targetStart < regionStart ? alignStart(props) : alignEnd(props);
};

const align = {
  start: alignStart,
  center: alignCenter,
  end: alignEnd,
} as const;

/** The same alignment named from the other end of the axis. */
const opposite = {
  start: "end",
  center: "center",
  end: "start",
} as const;

const resolveScroll = (
  position: Position,
  props: Properties,
  reversed: boolean,
): Px =>
  position === "nearest"
    ? alignNearest(props, reversed)
    : // On a reversed axis the logical start edge is the physical end one, so
      // the two swap. `scroll-padding` needs no such treatment: it is a
      // physical property, and each alignment already reads its own edge.
      align[reversed ? opposite[position] : position](props);

/**
 * One computed length, in pixels.
 *
 * `scroll-padding`'s initial value is `auto` and its computed value keeps
 * percentages unresolved, so neither is something `parseFloat` can be trusted
 * with on its own. Anything that is neither a length nor a percentage counts as
 * zero: `auto`, and a `calc()` still mixing units at computed value time such as
 * `calc(10% + 20px)`, which would need the used value to resolve.
 *
 * @param basis - what a percentage is measured against
 */
const readLength = (
  style: CSSStyleDeclaration,
  property: string,
  basis: Px,
): Px => {
  const raw = style.getPropertyValue(property);
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  return raw.endsWith("%") ? (basis * value) / 100 : value;
};

/**
 * Both `scroll-padding` values for one axis, as percentages of the scrollport.
 *
 * Nothing stops the two from adding up to more than the scrollport, which would
 * leave the alignments working against an inverted region — and make every
 * target look larger than it, so `"nearest"` would move even a plainly visible
 * one. They are reduced proportionally in that case, collapsing the region to a
 * point rather than turning it inside out.
 */
const readPaddings = (
  style: CSSStyleDeclaration,
  startEdge: "top" | "left",
  endEdge: "bottom" | "right",
  size: Px,
): { padStart: Px; padEnd: Px } => {
  const padStart = readLength(style, `scroll-padding-${startEdge}`, size);
  const padEnd = readLength(style, `scroll-padding-${endEdge}`, size);
  const total = padStart + padEnd;

  // `total > size` with a non-negative size implies `total > 0`, so this cannot
  // divide by zero.
  return total > size
    ? { padStart: (padStart * size) / total, padEnd: (padEnd * size) / total }
    : { padStart, padEnd };
};

/**
 * The target's box for one axis, grown by its `scroll-margin`.
 *
 * `scrollIntoView` aligns this expanded box rather than the border box, which is
 * what lets `scroll-margin-top` on a heading keep it clear of a sticky header.
 * It counts for `"nearest"` too: a target whose margin is still covered has not
 * been brought properly into view.
 *
 * The property takes lengths only — percentages are not valid for it — so there
 * is no meaningful basis to resolve against, and `0` disposes of any that reach
 * here regardless.
 */
const readTargetBox = (
  style: CSSStyleDeclaration,
  offset: Px,
  size: Px,
  startEdge: "top" | "left",
  endEdge: "bottom" | "right",
): { targetOffset: Px; targetSize: Px } => {
  const marginStart = readLength(style, `scroll-margin-${startEdge}`, 0);
  const marginEnd = readLength(style, `scroll-margin-${endEdge}`, 0);

  return {
    targetOffset: offset - marginStart,
    targetSize: size + marginStart + marginEnd,
  };
};

/**
 * Smoothly scroll a target element into a specific position within a scrollable
 * container.
 *
 * Alignment follows `Element.scrollIntoView`: `"start"` and `"end"` name the
 * logical edges, so on the horizontal axis they swap sides when the container's
 * `direction` is `rtl`. The container's `scroll-padding` and the target's
 * `scroll-margin` are honoured as well, which is how room is left for a sticky
 * header or footer.
 *
 * Geometry is read once, up front, from `getBoundingClientRect`. The resulting
 * scroll position is then handed to `easingScroll`, which clamps it to the
 * container's scrollable range and animates towards it.
 *
 * @param target - The element to scroll into view
 * @param options - Scroll options (container, position, duration, easing, signal)
 * @returns A promise that resolves with the animation progress:
 *   - `1` if the animation completed fully
 *   - `0` if the signal was already aborted before starting
 *   - `0 < value < 1` if the animation was aborted mid-way
 *
 *   Rejects only when the `easing` function throws.
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
 *
 * @example Leave room for a sticky header, in CSS rather than in the call
 * ```css
 * .container { scroll-padding-top: 80px; }
 * ```
 */
export const scrollIntoArea = (
  target: Element,
  { container, x, y, ...rest }: Options,
): Promise<Pct> => {
  // No alignment asked for, so there is nothing to measure. Skipping the reads
  // below keeps this from forcing layout for a call that cannot scroll.
  if (!x && !y) return easingScroll(container, rest);

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  // One lookup each: the container's carries `scroll-padding` and `direction`,
  // the target's carries `scroll-margin`
  const containerStyle = getComputedStyle(container);
  const targetStyle = getComputedStyle(target);

  // Alignment happens against the scrollport, which is the padding box minus
  // any scrollbar — not the border box that `getBoundingClientRect` measures.
  // `clientTop`/`clientLeft` give the distance between the two, and on a
  // right-to-left container `clientLeft` covers a scrollbar sitting on the left
  // as well. Using the border box instead would push the target under the
  // border, and leave `"nearest"` calling a target hidden by it visible.
  const scrollportTop = containerRect.top + container.clientTop;
  const scrollportLeft = containerRect.left + container.clientLeft;
  const scrollportHeight = container.clientHeight;
  const scrollportWidth = container.clientWidth;

  const top = y
    ? resolveScroll(
        y,
        {
          containerOffset: scrollportTop,
          containerScroll: container.scrollTop,
          containerSize: scrollportHeight,
          ...readTargetBox(
            targetStyle,
            targetRect.top,
            targetRect.height,
            "top",
            "bottom",
          ),
          ...readPaddings(containerStyle, "top", "bottom", scrollportHeight),
        },
        false,
      )
    : undefined;

  const left = x
    ? resolveScroll(
        x,
        {
          containerOffset: scrollportLeft,
          containerScroll: container.scrollLeft,
          containerSize: scrollportWidth,
          ...readTargetBox(
            targetStyle,
            targetRect.left,
            targetRect.width,
            "left",
            "right",
          ),
          ...readPaddings(containerStyle, "left", "right", scrollportWidth),
        },
        containerStyle.direction === "rtl",
      )
    : undefined;

  return easingScroll(container, { top, left, ...rest });
};
