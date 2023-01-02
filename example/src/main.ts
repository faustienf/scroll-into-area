import { Position, scrollIntoArea } from "../../src/scroll-into-area";
import "./style.css";

const rows = Array(5)
  .fill(
    `
  <li></li> 
  <li></li> 
  <li></li>
  <li></li>
  <li></li>
`.trim()
  )
  .join("\n");

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <button type="button" class="position" data-position="start-start"></button>
  <button type="button" class="position" data-position="center-start"></button>
  <button type="button" class="position" data-position="end-start"></button>
  <button type="button" class="position" data-position="start-center"></button>
  <div class="cat">
    <span class="cat-ears"></span>
    <ul class="cat-head">
      ${rows} 
    </ul>
  </div>
  <button type="button" class="position" data-position="end-center"></button>
  <button type="button" class="position" data-position="start-end"></button>
  <button type="button" class="position" data-position="center-end"></button>
  <button type="button" class="position" data-position="end-end"></button>
`;

const container = document.querySelector(".cat-head")!;
const target = document.querySelector(".cat-head > li:nth-child(13)")!;

document.getElementById("app")!.addEventListener("mouseover", (e) => {
  if (e.target instanceof HTMLButtonElement) {
    const [x, y] = e.target.dataset.position?.split("-") as [
      Position,
      Position
    ];

    scrollIntoArea(target, {
      container,
      x,
      y,
      duration: 400, // ms
      // 👀 https://easings.net/#easeOutCubic
      easing: (x: number): number => 1 - Math.pow(1 - x, 3),
    });
  }
});

scrollIntoArea(target, {
  container,
  x: "center",
  y: "center",
});
