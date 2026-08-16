# scroll-into-area

[![npm version](https://img.shields.io/npm/v/scroll-into-area.svg)](https://npmjs.org/package/scroll-into-area)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/scroll-into-area)](https://bundlephobia.com/package/scroll-into-area)
[![license](https://img.shields.io/npm/l/scroll-into-area.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org)

Smooth scrolling an element into a specific position within a scrollable container, with custom easing, abort support, and promise-based completion tracking.

[Demo](https://scroll-into-area.vercel.app)

## Highlights

- **Lightweight** — the animation comes from
  [easing-scroll](https://github.com/faustienf/easing-scroll), which you can
  also [use on its own](#built-on-easing-scroll) when you already know the
  scroll position
- **TypeScript-first** — written in TypeScript, ships type declarations
- **Dual package** — ESM and CJS builds
- **Positioning** — align to `start`, `center`, `end`, or `nearest` on both axes
- **Faithful to the platform** — logical `start`/`end`, `scroll-padding` and
  `scroll-margin` are resolved the way `scrollIntoView` resolves them, RTL
  containers included
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

const container = document.querySelector("ul")!;
const target = container.querySelector("li")!;

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
| `container` | `Element`               | —          | The scrollable container element (**required**)                              |
| `x`         | `Position`              | —          | Horizontal alignment: `"start"`, `"center"`, `"end"`, or `"nearest"`         |
| `y`         | `Position`              | —          | Vertical alignment: `"start"`, `"center"`, `"end"`, or `"nearest"`           |
| `duration`  | `number`                | `0`        | Animation duration in milliseconds                                           |
| `easing`    | `(t: number) => number` | `(t) => t` | [Easing function](https://easings.net) mapping progress (0–1) to eased value |
| `signal`    | `AbortSignal`           | —          | Signal to cancel the animation                                               |

There is no offset option — room for sticky headers comes from the container's
[`scroll-padding`](#sticky-headers-via-scroll-padding).

#### `Position`

Type: `"start" | "end" | "center" | "nearest"`

| Value       | Alignment                                                              |
| ----------- | ---------------------------------------------------------------------- |
| `"start"`   | Target's start edge meets the container's start edge                   |
| `"end"`     | Target's end edge meets the container's end edge                       |
| `"center"`  | Target is centred within the container                                 |
| `"nearest"` | Scrolls the shortest distance, and not at all if the target is visible |

`"start"` and `"end"` are logical, exactly as they are for `scrollIntoView`'s
`inline` option — see [RTL containers](#rtl-containers) below.

Computed positions are clamped to the container's scrollable range, so asking to
centre an element near the top of the content simply scrolls as far as it can.

#### Return value

Resolves with a `number` between `0` and `1` representing animation progress:

| Value       | Meaning                                              |
| ----------- | ---------------------------------------------------- |
| `1`         | Animation completed fully                            |
| `0 < x < 1` | Animation was aborted at _x_ progress                |
| `0`         | Animation never started (signal was already aborted) |

### Behavior

- **Instant scroll** — when `duration` is not a finite positive number (`0`, negative, `NaN`, `Infinity`), the element scrolls instantly and resolves `1`.
- **No-op** — when both `x` and `y` are omitted, resolves `1` immediately without measuring anything.
- **Already-aborted signal** — resolves `0` without scrolling.
- **Nearest** — `"nearest"` only scrolls when the target is outside the visible area. If the target is larger than the container, it aligns to `start`.
- **Descendants** — `target` does not have to be a direct child of `container`; positions are computed from bounding rectangles, so any descendant works.
- **Scrollport** — alignment targets the area the container actually scrolls: its padding box, minus any scrollbar. A border or a scrollbar therefore never pushes the target underneath itself.
- **SSR** — importing the package touches no browser API. Calling `scrollIntoArea` needs a DOM, so keep the call inside an effect or event handler.

#### Sticky headers, via `scroll-padding`

Room for a sticky header or footer is reserved with the container's
[`scroll-padding`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding),
which is the property the platform already defines for it — and which
`scrollIntoView` and scroll snapping honour too, so one declaration covers every
way the container gets scrolled:

```css
.container {
  scroll-padding-top: 80px; /* clears an 80px sticky header */
}
```

```ts
await scrollIntoArea(target, { container, y: "start" });
```

Alignment is then computed against the _optimal viewing region_ — the visible
area inset by that padding — exactly as `scrollIntoView` does:

- `"start"` and `"end"` meet the region's edges rather than the container's.
- `"center"` centres within the region. With padding on one side only, that is
  half the padding off the container's own centre; with equal padding on both
  sides it is unchanged.
- `"nearest"` treats the region as the visible area, so an element hiding under
  the header counts as off-screen and gets pulled out from under it.

The four edges are independent, so a container with an 80px header and a 40px
footer is expressed directly:

```css
.container {
  scroll-padding-top: 80px;
  scroll-padding-bottom: 40px;
}
```

Percentages resolve against the scrollport, and the initial value `auto` is
treated as no padding. Should the two edges of an axis add up to more than the
scrollport, both are reduced proportionally so the region collapses to a point
rather than turning inside out. Note that the browser applies `scroll-padding`
only to its own scrolling — it has no effect on assignments to
`scrollTop`/`scrollLeft` — so it is read here explicitly, with
`getComputedStyle`.

#### Per-element spacing, via `scroll-margin`

Where `scroll-padding` reserves room in the container for everything scrolled
into it, [`scroll-margin`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin)
does it for one element, on the element itself. It is honoured here as it is by
`scrollIntoView`, so a heading already styled for anchor navigation behaves the
same way when scrolled programmatically:

```css
h2 {
  scroll-margin-top: 20px;
}
```

The margin grows the box that alignment works with, which means it counts for
`"nearest"` too: a target whose margin is still covered has not been brought
properly into view, and gets scrolled the rest of the way.

The two compose — a container reserving 80px and a target asking for 20 more
lands the target 100px from the scrollport's edge:

```css
.container {
  scroll-padding-top: 80px;
}
h2 {
  scroll-margin-top: 20px;
}
```

`scroll-margin` is physical, so in an RTL container it is `scroll-margin-right`
that applies to `x: "start"` — the edge that alignment actually lands on. Unlike
`scroll-padding`, the property accepts lengths only; a percentage is invalid CSS
and has no effect.

#### RTL containers

Alignment on the `x` axis is resolved against the container's `direction`, the
way `scrollIntoView({ inline })` is. In a `direction: rtl` container content
flows from the right, so `"start"` is the **right** edge and `"end"` the left
one:

```ts
const container = document.querySelector<HTMLElement>(".rtl-list")!;

// Brings the target's right edge to the container's right edge
await scrollIntoArea(target, { container, x: "start" });
```

`scroll-padding` stays physical, because that is what the CSS property is: in
the example above the inset comes from `scroll-padding-right`, the edge the
alignment actually lands on. `"center"` and `"nearest"` are symmetric and mean
the same thing in either direction, except that a target too wide to fit falls
back to `"start"`, and so lands against the right edge.

The direction is read from the container with `getComputedStyle`, so it also
picks up a direction inherited from an ancestor or set by `dir="rtl"`. Reading
it happens only when `x` is given, after `getBoundingClientRect` has already
forced layout.

Two limits worth knowing:

- The `y` axis is always top-to-bottom. Vertical writing modes, where the block
  axis is the horizontal one, are not resolved.
- Detection relies on the modern RTL scroll convention, where `scrollLeft` runs
  from `0` down to `-(scrollWidth - clientWidth)`. Older WebKit reports those
  offsets as positive and reversed, and is not accounted for.

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
import { useEffect, type RefObject } from "react";
import { scrollIntoArea, type Position } from "scroll-into-area";

function useScrollIntoArea(
  containerRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<Element | null>,
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

## Built on easing-scroll

The animation itself is not implemented here. The frame loop, the easing, the
`AbortSignal` handling and the progress a call resolves with all come from
[easing-scroll](https://github.com/faustienf/easing-scroll); this package adds
the geometry on top — working out which scroll position puts a given element
where you asked for it. `duration`, `easing` and `signal` are handed over
untouched, so what its documentation says about them holds here word for word.

The two split along a clean line: **if you know the element, use this package;
if you already know the position, use `easing-scroll` directly** and skip the
measuring entirely.

```ts
import { easingScroll } from "easing-scroll";

// Back to the top of the page — `window` is a valid target
await easingScroll(window, { top: 0, duration: 400 });

// A known offset inside a container, horizontal only: passing just `left`
// leaves the vertical position alone for the whole animation
await easingScroll(container, { left: 1200, duration: 600 });
```

It has no dependencies of its own, weighs under 600 bytes min+gzip, and works
with any scrollable `Element` as well as with `window`.

Install it as a direct dependency rather than reaching for the copy that comes
along with this package — strict layouts such as pnpm's will not resolve a
package you have not asked for yourself:

```sh
npm install easing-scroll
```

## Caveats

- **`scroll-behavior: smooth`** — this is the one that bites silently. The
  scroll position is clamped by writing it and reading it back, and a container
  with `scroll-behavior: smooth` reports the old value while its own animation
  runs. The scroll then looks like a no-op and the promise resolves `1` without
  moving. Set `scroll-behavior: auto` on the container (or unset the property)
  before scrolling it programmatically.
- **One container** — unlike `scrollIntoView`, this scrolls the container you
  pass and nothing else. If the target sits inside a nested scroller, or the
  container itself is clipped by an ancestor that scrolls, those are left where
  they are and the target can stay out of sight. Call it once per scroller,
  innermost first.
- **`calc()` padding** — a `scroll-padding` value that still mixes units at
  computed-value time, such as `calc(10% + 20px)`, counts as no padding. Plain
  lengths and plain percentages both work.
- **Concurrent calls** — two animations on the same container fight over its
  scroll position every frame. Cancel the previous one via its `signal` before
  starting the next.
- **`prefers-reduced-motion`** — not handled. Check it yourself and pass
  `duration: 0` for an instant scroll:
  ```ts
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  await scrollIntoArea(target, {
    container,
    y: "center",
    duration: reduce ? 0 : 400,
  });
  ```
- **One extra `scroll` event** — clamping writes the target position and
  restores it within the same task. The final position is unchanged, but the
  container still emits a single `scroll` event. Worth knowing if you have
  infinite-scroll, sticky-header or scroll-depth listeners attached.
- **Overshoot easings** — curves that leave the `0`–`1` range (`easeOutBack`,
  elastic) are clipped by the scrollable range, so the overshoot is invisible at
  the very edges of the content.
- **Geometry is read once** — positions are measured up front, before the first
  frame. If the content reflows mid-animation, the target it is heading for does
  not follow.

## License

[MIT](LICENSE)
