export const codeExample = `
import { scrollIntoArea } from "scroll-into-area";

const controller = new AbortController();
// Abort scrolling
// controller.abort(); ❌

const container = document.querySelector("ul");
const target = container.querySelector("li");

const progress = await scrollIntoArea(target, {
  container,
  x: "center",
  y: "end",
  signal: controller.signal,
  duration: 600,
  // 👀 https://easings.net/#easeOutCubic
  easing: (x) => 1 - Math.pow(1 - x, 3),
});

if (progress === 1) {
  console.log("Completed");
} else {
  console.log("Canceled");
}
`.trim();
