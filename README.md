<p align="center">
  <img src="https://raw.githubusercontent.com/faustienf/scroll-into-area/main/assets/cat.png" width="200">
</p>

# scroll-into-area

[![npm-version](https://img.shields.io/npm/v/scroll-into-area.svg)](https://npmjs.org/package/scroll-into-area)

♿️ Smooth scrolling an element into view. [Demo](https://scroll-into-area.vercel.app).

## Install

```sh
npm install scroll-into-area
```

## Features

- 📈 Customize [easing function](https://easings.net)
- 🚫 Abort scrolling ([AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal))
- 🔄 Waiting for animation to end

## Usage

```ts
import { scrollIntoArea } from "scroll-into-area";

const controller = new AbortController();
// Abort scrolling
// controller.abort(); ❌

const container = document.querySelector("ul");
const target = container.querySelector("li");

const progress = await scrollIntoArea(target, {
  container,
  x: "end", // start, center, end
  y: "start", // start, center, end
  duration: 400, // ms
  signal: controller.signal,
  // 👀 https://easings.net/#easeOutCubic
  easing: (x) => 1 - Math.pow(1 - x, 3),
});

if (progress === 1) {
  console.log("Completed");
} else {
  console.log("Aborted");
}
```

### Animation

Linear function `(t) => t` is used by default. Pass [easing](https://easings.net), if you want to change easing function.
`duration` is animation duration in milliseconds.

```ts
scrollIntoArea(target, {
  duration: 400, // ms
  // 👀 https://easings.net/#easeOutCubic
  easing: (x) => 1 - Math.pow(1 - x, 3),
});
```

### Abort scrolling

Pass `signal` ([AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)),
if you want to abort scrolling.

```ts
const controller = new AbortController();
setTimeout(() => {
  controller.abort();
}, 100);

const progress = await scrollIntoArea(target, {
  ...,
  signal: controller.signal,
});

if (progress !== 1) {
  console.log('Scrolling has been aborted.');
}
```

`progress` is a number from _0_ to _1_.

`1` - Scrolling is completed _100%_.

`<1` - Scrolling has been aborted and completed _x%_.

```ts
const progress = await scrollIntoArea(target, {
  ...,
});

if (progress !== 1) {
  console.log('Scrolling has been aborted.');
} else {
  console.log('Completed.');
}
```
