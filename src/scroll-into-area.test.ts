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

  it("handles all position values for x", async () => {
    const positions: Position[] = ["start", "center", "end"];

    for (const pos of positions) {
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
        x: pos,
      });

      expect(result).toBe(1);
    }
  });

  it("handles all position values for y", async () => {
    const positions: Position[] = ["start", "center", "end"];

    for (const pos of positions) {
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
        y: pos,
      });

      expect(result).toBe(1);
    }
  });
});
