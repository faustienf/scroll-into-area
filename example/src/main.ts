import "./style.css";

import { Position, scrollIntoArea } from "../../src/scroll-into-area";

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
  <button type="button" data-position="start-start">↖️</button>
  <button type="button" data-position="center-start">⬆️</button>
  <button type="button" data-position="end-start">↗️</button>

  <button type="button" data-position="start-center">⬅️</button>
  <ul class="container">
    ${rows} 
  </ul>
  <button type="button" data-position="end-center">➡️</button>

  <button type="button" data-position="start-end">↙️</button>
  <button type="button" data-position="center-end">⬇️</button>
  <button type="button" data-position="end-end">↘️</button>
`;

const container = document.querySelector("#app > ul")!;
const target = document.querySelector("#app > ul > li:nth-child(13)")!;

document.getElementById("app")!.addEventListener("click", (e) => {
  if (e.target instanceof HTMLButtonElement) {
    const [x, y] = e.target.dataset.position?.split("-") as [
      Position,
      Position
    ];

    scrollIntoArea(target, {
      container,
      x,
      y,
    });
  }
});

scrollIntoArea(target, {
  container,
  x: "center",
  y: "center",
});
