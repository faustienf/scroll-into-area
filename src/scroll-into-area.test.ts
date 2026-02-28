// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scrollIntoArea, type Position } from "./scroll-into-area";

/**
 * Create a mock container element with configurable dimensions and scroll state.
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
}) => {
  const el = document.createElement("div");

  const scrollHeight = opts?.scrollHeight ?? 2000;
  const scrollWidth = opts?.scrollWidth ?? 2000;
  const clientHeight = opts?.clientHeight ?? 500;
  const clientWidth = opts?.clientWidth ?? 500;
  const rectTop = opts?.top ?? 0;
  const rectLeft = opts?.left ?? 0;
  const rectWidth = opts?.width ?? clientWidth;
  const rectHeight = opts?.height ?? clientHeight;

  Object.defineProperties(el, {
    scrollHeight: { get: () => scrollHeight, configurable: true },
    scrollWidth: { get: () => scrollWidth, configurable: true },
    clientHeight: { get: () => clientHeight, configurable: true },
    clientWidth: { get: () => clientWidth, configurable: true },
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

  Object.defineProperty(el, "scrollLeft", {
    get: () => _scrollLeft,
    set: (v: number) => {
      _scrollLeft = Math.max(0, Math.min(v, scrollWidth - clientWidth));
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
 */
const createMockTarget = (opts: {
  top: number;
  left: number;
  width: number;
  height: number;
}) => {
  const el = document.createElement("div");

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

  // ─── Basic functionality ──────────────────────────────────────

  it("scrolls target into view with y='start'", async () => {
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

  it("scrolls target into view with y='end'", async () => {
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

  it("scrolls target into view with y='center'", async () => {
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

  it("scrolls horizontally with x position", async () => {
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

  it("scrolls both x and y simultaneously", async () => {
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

  // ─── Animation ────────────────────────────────────────────────

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

  // ─── Abort ────────────────────────────────────────────────────

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
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  // ─── Edge cases ───────────────────────────────────────────────

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

  it("handles all position values for x with correct scroll positions", async () => {
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

  it("handles all position values for y with correct scroll positions", async () => {
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

  // ─── Nearest position ─────────────────────────────────────────

  it("nearest: does not scroll when target is already visible", async () => {
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

  it("nearest: scrolls to end when target is below visible area", async () => {
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

  it("nearest: scrolls to start when target is above visible area", async () => {
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

  it("nearest: aligns to start when target is larger than container", async () => {
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

  // ─── Offset ───────────────────────────────────────────────────

  it("applies offset with y='start'", async () => {
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
      offset: 60,
    });

    expect(result).toBe(1);
    // startScroll = 300, with offset: 300 - 60 = 240
    expect(container.scrollTop).toBe(240);
  });

  it("applies offset with y='end'", async () => {
    const container = createMockContainer({
      top: 0,
      height: 500,
      scrollHeight: 2000,
      clientHeight: 500,
    });
    const target = createMockTarget({
      top: 800,
      left: 0,
      width: 100,
      height: 50,
    });

    const result = await scrollIntoArea(target, {
      container,
      y: "end",
      offset: 60,
    });

    expect(result).toBe(1);
    // endScroll = 0 + (800 - 0 - 500) + 50 = 350, with offset: 350 + 60 = 410
    expect(container.scrollTop).toBe(410);
  });

  it("applies offset with y='center'", async () => {
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

    const result = await scrollIntoArea(target, {
      container,
      y: "center",
      offset: 30,
    });

    expect(result).toBe(1);
    // centerScroll = 0 + (400 - 0 - 250) + 25 = 175, with offset: 175 - 30 = 145
    expect(container.scrollTop).toBe(145);
  });

  it("applies offset with y='nearest' (target outside visible area)", async () => {
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
      offset: 20,
    });

    expect(result).toBe(1);
    // Target overflows end → endScroll = 150, with offset: 150 + 20 = 170
    expect(container.scrollTop).toBe(170);
  });

  it("applies offset with y='nearest' (target visible but within offset zone)", async () => {
    const container = createMockContainer({
      top: 0,
      height: 500,
      scrollHeight: 2000,
      clientHeight: 500,
    });
    const target = createMockTarget({
      top: 460,
      left: 0,
      width: 100,
      height: 50,
    });

    const result = await scrollIntoArea(target, {
      container,
      y: "nearest",
      offset: 60,
    });

    expect(result).toBe(1);
    // Visible area with offset: [60, 440]. Target: [460, 510].
    // targetRelEnd (510) > visibleEnd (440) → end alignment
    // endScroll = 0 + (460 - 0 - 500) + 50 = 10, + offset 60 = 70
    expect(container.scrollTop).toBe(70);
  });

  // ─── Non-zero initial scroll ──────────────────────────────────

  it("computes correct position with non-zero initial scroll", async () => {
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

  // ─── Non-zero container offset ────────────────────────────────

  it("computes correct position with non-zero container bounding rect", async () => {
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

  // ─── Large target ─────────────────────────────────────────────

  it("handles target larger than container", async () => {
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

  // ─── Explicit duration: 0 ─────────────────────────────────────

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
