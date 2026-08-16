// @vitest-environment jsdom
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  onTestFinished,
} from "vitest";
import { scrollIntoArea, type Position } from "./scroll-into-area";

/**
 * Create a mock container element with configurable dimensions and scroll state.
 *
 * `top`/`left`/`width`/`height` describe the border box, the one
 * `getBoundingClientRect` reports. `clientHeight`/`clientWidth` and
 * `borderTop`/`borderLeft` describe the scrollport inside it, which is what
 * alignment is actually measured against. Keeping them separate is the point:
 * a container with a border or a scrollbar has a border box larger than its
 * scrollport, and code that confuses the two only misbehaves there.
 */
const createMockContainer = (opts?: {
  scrollHeight?: number;
  scrollWidth?: number;
  clientHeight?: number;
  clientWidth?: number;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  /**
   * Border widths, reported by `clientTop`/`clientLeft`. On a right-to-left
   * container the browser may put the scrollbar on the left, in which case its
   * width is part of `clientLeft` too.
   */
  borderTop?: number;
  borderLeft?: number;
  /**
   * `rtl` sets the container's `direction`, which is what the alignment is
   * resolved against, and flips the horizontal scroll range to `[-max, 0]` the
   * way current browsers report it.
   *
   * The element has to be in the document for jsdom to resolve `direction` at
   * all — on a detached node `getComputedStyle` reports the initial value
   * whatever the inline style says.
   */
  direction?: "ltr" | "rtl";
  /**
   * `scroll-padding-*` on the container, as a CSS value — `"80px"`, `"10%"`,
   * `"auto"`. Set as longhands: jsdom does not expand the `scroll-padding`
   * shorthand into them.
   */
  scrollPadding?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}) => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  onTestFinished(() => el.remove());

  const rtl = opts?.direction === "rtl";
  if (rtl) el.style.direction = "rtl";

  for (const [edge, value] of Object.entries(opts?.scrollPadding ?? {})) {
    el.style.setProperty(`scroll-padding-${edge}`, value);
  }

  const scrollHeight = opts?.scrollHeight ?? 2000;
  const scrollWidth = opts?.scrollWidth ?? 2000;
  const clientHeight = opts?.clientHeight ?? 500;
  const clientWidth = opts?.clientWidth ?? 500;
  const borderTop = opts?.borderTop ?? 0;
  const borderLeft = opts?.borderLeft ?? 0;
  const rectTop = opts?.top ?? 0;
  const rectLeft = opts?.left ?? 0;
  const rectWidth = opts?.width ?? clientWidth;
  const rectHeight = opts?.height ?? clientHeight;

  Object.defineProperties(el, {
    scrollHeight: { get: () => scrollHeight, configurable: true },
    scrollWidth: { get: () => scrollWidth, configurable: true },
    clientHeight: { get: () => clientHeight, configurable: true },
    clientWidth: { get: () => clientWidth, configurable: true },
    clientTop: { get: () => borderTop, configurable: true },
    clientLeft: { get: () => borderLeft, configurable: true },
  });

  // Clamp scrollTop/scrollLeft to valid range
  let _scrollTop = 0;
  let _scrollLeft = 0;

  Object.defineProperty(el, "scrollTop", {
    get: () => _scrollTop,
    set: (v: number) => {
      _scrollTop = Math.max(0, Math.min(v, scrollHeight - clientHeight));
    },
    configurable: true,
  });

  const maxLeft = scrollWidth - clientWidth;
  const [minScrollLeft, maxScrollLeft] = rtl ? [-maxLeft, 0] : [0, maxLeft];

  Object.defineProperty(el, "scrollLeft", {
    get: () => _scrollLeft,
    set: (v: number) => {
      _scrollLeft = Math.max(minScrollLeft, Math.min(v, maxScrollLeft));
    },
    configurable: true,
  });

  el.getBoundingClientRect = () => ({
    top: rectTop,
    left: rectLeft,
    right: rectLeft + rectWidth,
    bottom: rectTop + rectHeight,
    width: rectWidth,
    height: rectHeight,
    x: rectLeft,
    y: rectTop,
    toJSON() {},
  });

  return el;
};

/**
 * Create a mock target element with specified bounding rect.
 *
 * Like the container, it goes into the document: jsdom resolves computed styles
 * only for attached elements, and `scroll-margin` is read off this one.
 */
const createMockTarget = (opts: {
  top: number;
  left: number;
  width: number;
  height: number;
  /**
   * `scroll-margin-*` on the target, as a CSS value. Set as longhands, the way
   * the container's `scroll-padding` is — jsdom expands neither shorthand.
   */
  scrollMargin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}) => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  onTestFinished(() => el.remove());

  for (const [edge, value] of Object.entries(opts.scrollMargin ?? {})) {
    el.style.setProperty(`scroll-margin-${edge}`, value);
  }

  el.getBoundingClientRect = () => ({
    top: opts.top,
    left: opts.left,
    right: opts.left + opts.width,
    bottom: opts.top + opts.height,
    width: opts.width,
    height: opts.height,
    x: opts.left,
    y: opts.top,
    toJSON() {},
  });

  return el;
};

describe("scrollIntoArea", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("alignment", () => {
    it("y='start' aligns the top edges", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const promise = scrollIntoArea(target, {
        container,
        y: "start",
      });

      const result = await promise;
      expect(result).toBe(1);
      // With y='start', scroll position should be set to target's top offset
      expect(container.scrollTop).toBe(300);
    });

    it("y='end' aligns the bottom edges", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const promise = scrollIntoArea(target, {
        container,
        y: "end",
      });

      const result = await promise;
      expect(result).toBe(1);
      // With y='end', target bottom aligns with container bottom
      // scroll = containerScroll + (targetOffset - containerOffset - containerSize) + targetSize
      // = 0 + (300 - 0 - 500) + 50 = -150 → clamped to 0
      expect(container.scrollTop).toBe(0);
    });

    it("y='center' centres the target", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 400,
        left: 0,
        width: 100,
        height: 50,
      });

      const promise = scrollIntoArea(target, {
        container,
        y: "center",
      });

      const result = await promise;
      expect(result).toBe(1);
      // scroll = containerScroll + (targetOffset - containerOffset - containerSize/2) + targetSize/2
      // = 0 + (400 - 0 - 250) + 25 = 175
      expect(container.scrollTop).toBe(175);
    });

    it("x aligns on the horizontal axis", async () => {
      const container = createMockContainer({
        left: 0,
        width: 500,
        scrollWidth: 2000,
        clientWidth: 500,
      });
      const target = createMockTarget({
        top: 0,
        left: 300,
        width: 100,
        height: 50,
      });

      const promise = scrollIntoArea(target, {
        container,
        x: "start",
      });

      const result = await promise;
      expect(result).toBe(1);
      expect(container.scrollLeft).toBe(300);
    });

    it("x and y are resolved in one call", async () => {
      const container = createMockContainer({
        top: 0,
        left: 0,
        width: 500,
        height: 500,
        scrollHeight: 2000,
        scrollWidth: 2000,
        clientHeight: 500,
        clientWidth: 500,
      });
      const target = createMockTarget({
        top: 400,
        left: 300,
        width: 100,
        height: 50,
      });

      const promise = scrollIntoArea(target, {
        container,
        x: "start",
        y: "start",
      });

      const result = await promise;
      expect(result).toBe(1);
      expect(container.scrollTop).toBe(400);
      expect(container.scrollLeft).toBe(300);
    });

    it("every position resolves on x", async () => {
      // Container: left=0, width=500. Target: left=500, width=100.
      // start: 0 - 0 + 500 = 500
      // center: 0 + (500 - 0 - 250) + 50 = 300
      // end: 0 + (500 - 0 - 500) + 100 = 100
      // nearest: target at 500 is outside [0, 500), overflows end → end = 100
      const cases: [Position, number][] = [
        ["start", 500],
        ["center", 300],
        ["end", 100],
        ["nearest", 100],
      ];

      for (const [position, expectedScrollLeft] of cases) {
        const container = createMockContainer({
          left: 0,
          width: 500,
          scrollWidth: 2000,
          clientWidth: 500,
        });
        const target = createMockTarget({
          top: 0,
          left: 500,
          width: 100,
          height: 50,
        });

        const result = await scrollIntoArea(target, {
          container,
          x: position,
        });

        expect(result).toBe(1);
        expect(container.scrollLeft).toBe(expectedScrollLeft);
      }
    });

    it("every position resolves on y", async () => {
      // Container: top=0, height=500. Target: top=500, height=50.
      // start: 0 - 0 + 500 = 500
      // center: 0 + (500 - 0 - 250) + 25 = 275
      // end: 0 + (500 - 0 - 500) + 50 = 50
      // nearest: target at 500 is outside [0, 500), overflows end → end = 50
      const cases: [Position, number][] = [
        ["start", 500],
        ["center", 275],
        ["end", 50],
        ["nearest", 50],
      ];

      for (const [position, expectedScrollTop] of cases) {
        const container = createMockContainer({
          top: 0,
          height: 500,
          scrollHeight: 2000,
          clientHeight: 500,
        });
        const target = createMockTarget({
          top: 500,
          left: 0,
          width: 100,
          height: 50,
        });

        const result = await scrollIntoArea(target, {
          container,
          y: position,
        });

        expect(result).toBe(1);
        expect(container.scrollTop).toBe(expectedScrollTop);
      }
    });
  });

  describe("nearest", () => {
    it("does not scroll when the target is already visible", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 200,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        y: "nearest",
      });

      expect(result).toBe(1);
      expect(container.scrollTop).toBe(0);
    });

    it("aligns to the end edge when the target is below", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 600,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        y: "nearest",
      });

      expect(result).toBe(1);
      // endScroll = 0 + (600 - 0 - 500) + 50 = 150
      expect(container.scrollTop).toBe(150);
    });

    it("aligns to the start edge when the target is above", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: -100,
        left: 0,
        width: 100,
        height: 50,
      });
      container.scrollTop = 200;

      const result = await scrollIntoArea(target, {
        container,
        y: "nearest",
      });

      expect(result).toBe(1);
      // startScroll = 200 - 0 + (-100) = 100
      expect(container.scrollTop).toBe(100);
    });

    it("aligns to start when the target does not fit", async () => {
      const container = createMockContainer({
        top: 0,
        height: 200,
        scrollHeight: 2000,
        clientHeight: 200,
      });
      const target = createMockTarget({
        top: 50,
        left: 0,
        width: 100,
        height: 400,
      });

      const result = await scrollIntoArea(target, {
        container,
        y: "nearest",
      });

      expect(result).toBe(1);
      // Target (400px) > container (200px), align to start
      // startScroll = 0 - 0 + 50 = 50
      expect(container.scrollTop).toBe(50);
    });
  });

  describe("scroll-padding", () => {
    it("aligns 'start' to the scroll-padding-top edge", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
        scrollPadding: { top: "60px" },
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // Without padding the target's top edge would meet the container's, at 300
      expect(container.scrollTop).toBe(240);
    });

    it("aligns 'end' to the scroll-padding-bottom edge", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
        scrollPadding: { bottom: "60px" },
      });
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "end" });

      expect(result).toBe(1);
      // Unpadded end alignment is 350; the padding pushes it 60 further
      expect(container.scrollTop).toBe(410);
    });

    it("centres within the padded region, not the container", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
        scrollPadding: { top: "80px" },
      });
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "center" });

      expect(result).toBe(1);
      // Region [80, 500], centre 290 — not the container's own centre of 250,
      // and not 250 shifted by the whole 80 either.
      expect(800 - container.scrollTop + 25).toBe(290);
    });

    it("leaves 'center' alone when the padding is symmetric", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
        scrollPadding: { top: "40px", bottom: "40px" },
      });
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "center" });

      expect(result).toBe(1);
      // Region [40, 460] has the same centre as the container itself
      expect(800 - container.scrollTop + 25).toBe(250);
    });

    it("treats the padded region as the visible one for 'nearest'", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
        scrollPadding: { bottom: "60px" },
      });
      // Fully on screen at [460, 510]... except the bottom 60px is spoken for
      const target = createMockTarget({
        top: 460,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        y: "nearest",
      });

      expect(result).toBe(1);
      // Region is [0, 440], so the target overflows its end and is pulled inside
      expect(container.scrollTop).toBe(70);
    });

    it("keeps the two edges independent, so a header and a footer can differ", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
        scrollPadding: { top: "80px", bottom: "40px" },
      });
      const target = createMockTarget({
        top: 600,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        y: "nearest",
      });

      expect(result).toBe(1);
      // Overflows the region's end at 460, so only the footer's 40 applies
      expect(600 - container.scrollTop + 50).toBe(460);
    });

    it("resolves percentage padding against the container", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
        scrollPadding: { top: "10%" },
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // 10% of the container's 500px height
      expect(container.scrollTop).toBe(250);
    });

    it("treats the initial 'auto' padding as none", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
        scrollPadding: { top: "auto" },
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      expect(container.scrollTop).toBe(300);
    });

    it("reads the horizontal padding for the horizontal axis only", async () => {
      const container = createMockContainer({
        top: 0,
        left: 0,
        width: 500,
        height: 500,
        scrollWidth: 2000,
        scrollHeight: 2000,
        clientWidth: 500,
        clientHeight: 500,
        scrollPadding: { left: "60px", top: "25px" },
      });
      const target = createMockTarget({
        top: 300,
        left: 300,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        x: "start",
        y: "start",
      });

      expect(result).toBe(1);
      // Each axis takes its own edge, rather than one value reaching both
      expect(container.scrollLeft).toBe(240);
      expect(container.scrollTop).toBe(275);
    });
  });

  describe("animation", () => {
    it("animates scroll with duration", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const promise = scrollIntoArea(target, {
        container,
        y: "start",
        duration: 200,
      });

      vi.advanceTimersByTime(250);
      await vi.advanceTimersByTimeAsync(0);

      const result = await promise;
      expect(result).toBe(1);
      expect(container.scrollTop).toBe(300);
    });

    it("uses custom easing function", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });
      const easingFn = vi.fn((t: number) => t * t);

      const promise = scrollIntoArea(target, {
        container,
        y: "start",
        duration: 200,
        easing: easingFn,
      });

      vi.advanceTimersByTime(250);
      await vi.advanceTimersByTimeAsync(0);

      const result = await promise;
      expect(result).toBe(1);
      expect(easingFn).toHaveBeenCalled();
    });
  });

  describe("abort", () => {
    it("resolves 0 if signal is already aborted", async () => {
      const container = createMockContainer();
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });
      const controller = new AbortController();
      controller.abort();

      const result = await scrollIntoArea(target, {
        container,
        y: "start",
        duration: 200,
        signal: controller.signal,
      });

      expect(result).toBe(0);
    });

    it("resolves with partial progress on abort during animation", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 400,
        left: 0,
        width: 100,
        height: 50,
      });
      const controller = new AbortController();

      const promise = scrollIntoArea(target, {
        container,
        y: "start",
        duration: 200,
        signal: controller.signal,
      });

      vi.advanceTimersByTime(50);
      await vi.advanceTimersByTimeAsync(0);

      controller.abort();
      await vi.advanceTimersByTimeAsync(0);

      const result = await promise;
      // 50ms into a 200ms animation. Bounds either side of that, rather than
      // `0 <= result <= 1`, which the contract guarantees and so cannot fail.
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(0.5);
    });
  });

  describe("no-op", () => {
    it("resolves 1 when neither x nor y is specified", async () => {
      const container = createMockContainer();
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
      });

      // No x or y → easingScroll receives top=undefined, left=undefined → resolves 1
      expect(result).toBe(1);
    });

    it("scrolls instantly with explicit duration: 0", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        y: "start",
        duration: 0,
      });

      expect(result).toBe(1);
      expect(container.scrollTop).toBe(300);
    });
  });

  describe("container geometry", () => {
    it("accounts for a non-zero initial scroll", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      container.scrollTop = 300;

      const target = createMockTarget({
        top: 200,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        y: "start",
      });

      expect(result).toBe(1);
      // startScroll = 300 - 0 + 200 = 500
      expect(container.scrollTop).toBe(500);
    });

    it("accounts for a container away from the viewport origin", async () => {
      const container = createMockContainer({
        top: 100,
        left: 50,
        height: 500,
        width: 500,
        scrollHeight: 2000,
        scrollWidth: 2000,
        clientHeight: 500,
        clientWidth: 500,
      });
      const target = createMockTarget({
        top: 400,
        left: 250,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        x: "start",
        y: "start",
      });

      expect(result).toBe(1);
      // y: startScroll = 0 - 100 + 400 = 300
      // x: startScroll = 0 - 50 + 250 = 200
      expect(container.scrollTop).toBe(300);
      expect(container.scrollLeft).toBe(200);
    });

    it("handles a target larger than the container", async () => {
      const container = createMockContainer({
        top: 0,
        height: 200,
        scrollHeight: 2000,
        clientHeight: 200,
      });
      const target = createMockTarget({
        top: 100,
        left: 0,
        width: 100,
        height: 600,
      });

      const result = await scrollIntoArea(target, {
        container,
        y: "start",
      });

      expect(result).toBe(1);
      // startScroll = 0 - 0 + 100 = 100
      expect(container.scrollTop).toBe(100);
    });
  });

  describe("scrollport", () => {
    /**
     * Border box [0, 520] with a 10px border, so the scrollport is [10, 510] —
     * the area the browser scrolls, and the one alignment must land in.
     */
    const borderedContainer = (
      extra?: Parameters<typeof createMockContainer>[0],
    ) =>
      createMockContainer({
        top: 0,
        height: 520,
        borderTop: 10,
        clientHeight: 500,
        scrollHeight: 2000,
        ...extra,
      });

    it("aligns 'start' to the padding box, not the border box", async () => {
      const container = borderedContainer();
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // Landing the target at the border box's edge would put it under the
      // border: 790 leaves its top at 10, where the scrollport begins.
      expect(container.scrollTop).toBe(790);
      expect(800 - container.scrollTop).toBe(10);
    });

    it("aligns 'end' to the scrollport's end, not the border box's", async () => {
      const container = borderedContainer();
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "end" });

      expect(result).toBe(1);
      // Target bottom meets 510, the scrollport's end, not the border box's 520
      expect(800 - container.scrollTop + 50).toBe(510);
    });

    it("takes a vertical scrollbar out of the horizontal axis", async () => {
      // Border box 520 wide: 10px border each side, a 15px scrollbar, and a
      // 485px scrollport spanning [10, 495].
      const container = createMockContainer({
        left: 0,
        width: 520,
        borderLeft: 10,
        clientWidth: 485,
        scrollWidth: 2000,
      });
      const target = createMockTarget({
        top: 0,
        left: 800,
        width: 50,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, x: "end" });

      expect(result).toBe(1);
      // Measuring against the border box would hide the target behind the
      // scrollbar, 25px past the edge it can actually reach
      expect(800 - container.scrollLeft + 50).toBe(495);
    });

    it("counts a target hidden by the border as not visible", async () => {
      const container = borderedContainer();
      // Inside the border box, but in the band the bottom border covers
      const target = createMockTarget({
        top: 512,
        left: 0,
        width: 100,
        height: 6,
      });

      const result = await scrollIntoArea(target, { container, y: "nearest" });

      expect(result).toBe(1);
      expect(container.scrollTop).not.toBe(0);
      // Pulled out from under the border, its bottom against the scrollport's
      expect(512 - container.scrollTop + 6).toBe(510);
    });

    it("resolves percentage padding against the scrollport", async () => {
      const container = borderedContainer({
        scrollPadding: { top: "10%" },
      });
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // 10% of the 500px scrollport, not of the 520px border box
      expect(800 - container.scrollTop).toBe(10 + 50);
    });

    it("reduces paddings that together exceed the scrollport", async () => {
      const container = borderedContainer({
        scrollPadding: { top: "600px", bottom: "400px" },
      });
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // 600 + 400 overflows the 500px scrollport, so both are scaled by 500/1000
      // and land at 300 and 200 — the ratio kept, the region collapsed to a
      // point at 300 instead of inverting.
      expect(800 - container.scrollTop).toBe(10 + 300);
    });
  });

  describe("scroll-margin", () => {
    const plainContainer = () =>
      createMockContainer({
        top: 0,
        height: 500,
        clientHeight: 500,
        scrollHeight: 2000,
      });

    it("keeps 'start' clear of the edge by the target's margin", async () => {
      const container = plainContainer();
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
        scrollMargin: { top: "20px" },
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // Without the margin the target's top would meet the edge, at 0
      expect(800 - container.scrollTop).toBe(20);
    });

    it("adds up with the container's scroll-padding", async () => {
      const container = createMockContainer({
        top: 0,
        height: 500,
        clientHeight: 500,
        scrollHeight: 2000,
        scrollPadding: { top: "80px" },
      });
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
        scrollMargin: { top: "20px" },
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // The container reserves 80, the target asks for 20 more
      expect(800 - container.scrollTop).toBe(100);
    });

    it("uses the end-edge margin for 'end'", async () => {
      const container = plainContainer();
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
        scrollMargin: { bottom: "30px" },
      });

      const result = await scrollIntoArea(target, { container, y: "end" });

      expect(result).toBe(1);
      // Target bottom stops 30 short of the scrollport's end
      expect(800 - container.scrollTop + 50).toBe(500 - 30);
    });

    it("counts a target whose margin is covered as not visible", async () => {
      const container = plainContainer();
      // The border box [460, 490] is inside the scrollport on its own; only the
      // 30px margin below it overflows.
      const target = createMockTarget({
        top: 460,
        left: 0,
        width: 100,
        height: 30,
        scrollMargin: { bottom: "30px" },
      });

      const result = await scrollIntoArea(target, { container, y: "nearest" });

      expect(result).toBe(1);
      expect(container.scrollTop).not.toBe(0);
      // Pulled up until the margin, not the border box, meets the end
      expect(460 - container.scrollTop + 30 + 30).toBe(500);
    });

    it("ignores percentages, which the property does not accept", async () => {
      const container = plainContainer();
      const target = createMockTarget({
        top: 800,
        left: 0,
        width: 100,
        height: 50,
        scrollMargin: { top: "10%" },
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // `scroll-margin` takes lengths only, so this is not a 50px inset
      expect(800 - container.scrollTop).toBe(0);
    });

    it("takes the margin from the edge the alignment lands on in rtl", async () => {
      const container = createMockContainer({
        direction: "rtl",
        left: 0,
        width: 500,
        clientWidth: 500,
        scrollWidth: 2000,
      });
      const target = createMockTarget({
        top: 0,
        left: -300,
        width: 100,
        height: 50,
        scrollMargin: { right: "40px" },
      });

      const result = await scrollIntoArea(target, { container, x: "start" });

      expect(result).toBe(1);
      // 'start' is the right edge here, so the right margin is the one that
      // applies: the target lands at [360, 460], its margin reaching 500.
      expect(-300 - container.scrollLeft).toBe(360);
    });
  });

  describe("direction: rtl", () => {
    /**
     * Container on screen at [0, 500], scrolled to its resting position at the
     * right edge (`scrollLeft` 0, range [-1500, 0]). The target sits 300px past
     * the container's left edge, so it is off-screen in the direction content
     * flows towards.
     */
    const createRtlPair = (scrollPadding?: {
      left?: string;
      right?: string;
    }) => {
      const container = createMockContainer({
        direction: "rtl",
        left: 0,
        width: 500,
        scrollWidth: 2000,
        clientWidth: 500,
        scrollPadding,
      });
      const target = createMockTarget({
        top: 0,
        left: -300,
        width: 100,
        height: 50,
      });
      return { container, target };
    };

    /** Where the target lands on screen, given a container that started at 0. */
    const targetLeftAfter = (container: HTMLElement, startedAt = -300) =>
      startedAt - container.scrollLeft;

    it("aligns 'start' to the right edge", async () => {
      const { container, target } = createRtlPair();

      const result = await scrollIntoArea(target, {
        container,
        x: "start",
      });

      expect(result).toBe(1);
      // The logical start edge is the physical right one, so the target's right
      // edge meets the container's: it spans [400, 500].
      expect(targetLeftAfter(container)).toBe(400);
    });

    it("aligns 'end' to the left edge", async () => {
      const { container, target } = createRtlPair();

      const result = await scrollIntoArea(target, {
        container,
        x: "end",
      });

      expect(result).toBe(1);
      expect(targetLeftAfter(container)).toBe(0);
    });

    it("centres 'center' regardless of direction", async () => {
      const { container, target } = createRtlPair();

      const result = await scrollIntoArea(target, {
        container,
        x: "center",
      });

      expect(result).toBe(1);
      expect(targetLeftAfter(container)).toBe(200);
    });

    it("scrolls 'nearest' the shorter way, which direction does not change", async () => {
      const { container, target } = createRtlPair();

      const result = await scrollIntoArea(target, {
        container,
        x: "nearest",
      });

      expect(result).toBe(1);
      // The target overflows the left edge, so that is the edge to align to —
      // the same answer an ltr container would give.
      expect(targetLeftAfter(container)).toBe(0);
    });

    it("produces a negative scrollLeft, within the browser's rtl range", async () => {
      const { container, target } = createRtlPair();

      await scrollIntoArea(target, { container, x: "end" });

      expect(container.scrollLeft).toBe(-300);
    });

    it("insets 'start' with scroll-padding-right, the edge it aligns to", async () => {
      const { container, target } = createRtlPair({ right: "50px" });

      const result = await scrollIntoArea(target, {
        container,
        x: "start",
      });

      expect(result).toBe(1);
      // Unpadded, rtl 'start' lands the target at [400, 500]
      expect(targetLeftAfter(container)).toBe(350);
    });

    it("insets 'end' with scroll-padding-left", async () => {
      const { container, target } = createRtlPair({ left: "50px" });

      const result = await scrollIntoArea(target, {
        container,
        x: "end",
      });

      expect(result).toBe(1);
      expect(targetLeftAfter(container)).toBe(50);
    });

    it("ignores the padding on the edge it is not aligning to", async () => {
      const { container, target } = createRtlPair({ left: "50px" });

      const result = await scrollIntoArea(target, {
        container,
        x: "start",
      });

      expect(result).toBe(1);
      // 'start' is the right edge here, so the left padding must not reach it
      expect(targetLeftAfter(container)).toBe(400);
    });

    it("centres in the padded region, which direction does not mirror", async () => {
      const { container, target } = createRtlPair({ right: "50px" });

      const result = await scrollIntoArea(target, {
        container,
        x: "center",
      });

      expect(result).toBe(1);
      // `scroll-padding` is physical, so the region is [0, 450] whichever way
      // content flows, and its centre is 225
      expect(targetLeftAfter(container) + 50).toBe(225);
    });

    it("aligns a target too wide to fit to the right edge", async () => {
      const container = createMockContainer({
        direction: "rtl",
        left: 0,
        width: 500,
        scrollWidth: 2000,
        clientWidth: 500,
      });
      const target = createMockTarget({
        top: 0,
        left: -900,
        width: 700,
        height: 50,
      });

      const result = await scrollIntoArea(target, {
        container,
        x: "nearest",
      });

      expect(result).toBe(1);
      // Too wide to bring fully into view, so it aligns to the logical start —
      // the right edge here, where an ltr container would use the left one.
      expect(targetLeftAfter(container, -900)).toBe(-200);
    });

    it("leaves the vertical axis top-to-bottom", async () => {
      const container = createMockContainer({
        direction: "rtl",
        top: 0,
        height: 500,
        scrollHeight: 2000,
        clientHeight: 500,
      });
      const target = createMockTarget({
        top: 300,
        left: 0,
        width: 100,
        height: 50,
      });

      const result = await scrollIntoArea(target, { container, y: "start" });

      expect(result).toBe(1);
      // `direction` is an inline-axis property; it must not reach `y`.
      expect(container.scrollTop).toBe(300);
    });
  });
});
