# scroll-into-area

[![npm version](https://img.shields.io/npm/v/scroll-into-area.svg)](https://npmjs.org/package/scroll-into-area)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/scroll-into-area)](https://bundlephobia.com/package/scroll-into-area)
[![license](https://img.shields.io/npm/l/scroll-into-area.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org)

Smooth scrolling an element into a specific position within a scrollable container, with custom easing, abort support, and promise-based completion tracking.

[Demo](https://scroll-into-area.vercel.app)

## Highlights

- **Lightweight** — built on top of [easing-scroll](https://github.com/faustienf/easing-scroll)
- **TypeScript-first** — written in TypeScript, ships type declarations
- **Dual package** — ESM and CJS builds
- **Positioning** — align to `start`, `center`, `end`, or `nearest` on both axes
- **Offset** — compensate for sticky headers/footers with the `offset` option
- **Customizable** — bring your own [easing function](https://easings.net)
- **Cancellable** — abort with [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- **Promise-based** — `await` completion or track partial progress

## Install

```sh
npm install scroll-into-area
```

```sh
pnpm add scroll-into-area
```

## Quick Start

```ts
import { scrollIntoArea } from "scroll-into-area";

const container = document.querySelector("ul");
const target = container.querySelector("li");

await scrollIntoArea(target, {
  container,
  y: "center",
  duration: 400,
  easing: (x) => 1 - Math.pow(1 - x, 3), // easeOutCubic
});
```

## API

### `scrollIntoArea(target, options): Promise<number>`

Smoothly scrolls `target` into a specific position within the scrollable `container`.

#### `target`

Type: `Element`

The DOM element to scroll into view.

#### `options`

| Option      | Type                    | Default    | Description                                                                  |
| ----------- | ----------------------- | ---------- | ---------------------------------------------------------------------------- |
| `container` | `HTMLElement`           | —          | The scrollable container element (**required**)                              |
| `x`         | `Position`              | —          | Horizontal alignment: `"start"`, `"center"`, `"end"`, or `"nearest"`         |
| `y`         | `Position`              | —          | Vertical alignment: `"start"`, `"center"`, `"end"`, or `"nearest"`           |
| `duration`  | `number`                | `0`        | Animation duration in milliseconds                                           |
| `easing`    | `(t: number) => number` | `(t) => t` | [Easing function](https://easings.net) mapping progress (0–1) to eased value |
| `signal`    | `AbortSignal`           | —          | Signal to cancel the animation                                               |
| `offset`    | `number`                | `0`        | Offset in pixels from the alignment edge (useful for sticky headers/footers) |

#### Return value

Resolves with a `number` between `0` and `1` representing animation progress:

| Value       | Meaning                                              |
| ----------- | ---------------------------------------------------- |
| `1`         | Animation completed fully                            |
| `0 < x < 1` | Animation was aborted at _x_ progress                |
| `0`         | Animation never started (signal was already aborted) |

### Behavior

- **Instant scroll** — when `duration` is `0` or omitted, the element scrolls instantly and resolves `1`.
- **No-op** — when both `x` and `y` are omitted, resolves `1` immediately.
- **Already-aborted signal** — resolves `0` without scrolling.
- **Nearest** — `"nearest"` only scrolls when the target is outside the visible area. If the target is larger than the container, it aligns to `start`.
- **Offset** — creates inward space from the alignment edge. For `"start"` and `"center"`, the target is pushed away from the start edge. For `"end"`, the target is pushed away from the end edge. For `"nearest"`, narrows the visible area used for detection.

## Examples

### Custom Easing

The default easing is linear `(t) => t`. Pass any function from [easings.net](https://easings.net):

```ts
await scrollIntoArea(target, {
  container,
  y: "start",
  duration: 600,
  // https://easings.net/#easeOutCubic
  easing: (x) => 1 - Math.pow(1 - x, 3),
});
```

### Abort Scrolling

Use an `AbortController` to cancel an in-flight animation:

```ts
const controller = new AbortController();

setTimeout(() => controller.abort(), 100);

const progress = await scrollIntoArea(target, {
  container,
  y: "center",
  duration: 400,
  signal: controller.signal,
});

if (progress < 1) {
  console.log(`Aborted at ${Math.round(progress * 100)}%`);
}
```

### React Usage

A reusable hook that scrolls an element into view and cancels on unmount:

```tsx
import { useEffect, useRef } from "react";
import { scrollIntoArea, type Position } from "scroll-into-area";

function useScrollIntoArea(
  containerRef: React.RefObject<HTMLElement | null>,
  targetRef: React.RefObject<Element | null>,
  y: Position,
) {
  useEffect(() => {
    const container = containerRef.current;
    const target = targetRef.current;
    if (!container || !target) return;

    const controller = new AbortController();

    scrollIntoArea(target, {
      container,
      y,
      duration: 400,
      signal: controller.signal,
      easing: (x) => 1 - Math.pow(1 - x, 3),
    });

    return () => controller.abort();
  }, [y]);
}
```

### Types

The library exports the `Position` type for use in your own abstractions:

```ts
import { type Position } from "scroll-into-area";
// Position = "start" | "end" | "center" | "nearest"
```

## License

[MIT](LICENSE)
