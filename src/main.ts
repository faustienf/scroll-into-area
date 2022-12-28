import "./style.css";

import { scrollIntoArea } from "./scroll-into-area";

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
  <button>↖️</button>
  <button>⬆️</button>
  <button>↗️</button>

  <button>⬅️</button>
  <ul class="container">
    ${rows} 
  </ul>
  <button>➡️</button>

  <button>↙️</button>
  <button>⬇️</button>
  <button>↘️</button>
`;

const container = document.querySelector("#app > ul")!;
const target = document.querySelector("#app > ul > li:nth-child(13)")!;

scrollIntoArea({
  container,
  target,
  y: "center",
  x: "center",
});
