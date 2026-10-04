import { mkdir, writeFile } from "node:fs/promises";
const mushrooms = [
  ["belyy-grib", "#a56e44", "bolete"],
  ["lisichka", "#efa62a", "chanterelle"],
  ["podberezovik", "#786058", "bolete"],
  ["podosinovik", "#df7135", "bolete"],
  ["shampinion", "#ded4bc", "agaric"],
  ["muhomor", "#ed4938", "amanita"],
  ["blednaya-poganka", "#b4bd72", "amanita"],
  ["zhelchnyy-grib", "#bc9165", "bolete"],
  ["openok", "#cfac69", "agaric"],
  ["lozhnyy-openok", "#d6c952", "agaric"],
  ["lozhnaya-lisichka", "#ed8534", "chanterelle"],
];
await mkdir("public/images", { recursive: true });
for (const [slug, color, shape] of mushrooms) {
  const spots =
    shape === "amanita"
      ? Array.from(
          { length: 25 },
          (_, i) =>
            `<ellipse cx="${190 + ((i * 61) % 255)}" cy="${110 + ((i * 31) % 70)}" rx="${4 + (i % 4)}" ry="3" fill="#efead5" transform="rotate(-12)"/>`,
        ).join("")
      : "";
  const cap =
    shape === "chanterelle"
      ? "M140 160 Q155 125 180 142 Q220 168 290 195 Q370 163 425 135 Q457 126 469 152 Q438 234 299 242 Q184 229 140 160Z"
      : "M129 226 C141 126 207 82 306 87 C396 89 458 146 478 229 C396 256 216 259 129 226Z";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 440"><defs><radialGradient id="bg"><stop stop-color="${color}" stop-opacity=".14"/><stop offset="1" stop-color="#131313"/></radialGradient><linearGradient id="cap" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color}"/><stop offset=".4" stop-color="${color}"/><stop offset="1" stop-color="#392820"/></linearGradient><linearGradient id="stem"><stop stop-color="#f0dfbd"/><stop offset=".5" stop-color="#e1d1b4"/><stop offset="1" stop-color="#74624e"/></linearGradient><filter id="shadow"><feGaussianBlur stdDeviation="11"/></filter></defs><rect width="600" height="440" fill="#131313"/><rect width="600" height="440" fill="url(#bg)"/><circle cx="300" cy="216" r="175" fill="none" stroke="#ffffff" stroke-opacity=".04"/><ellipse cx="309" cy="369" rx="141" ry="13" fill="#000" opacity=".65" filter="url(#shadow)"/><g transform="rotate(-7 300 240)"><path d="M279 217 Q290 273 263 354 Q252 378 290 382 Q337 384 337 359 Q315 285 329 216Z" fill="url(#stem)"/><ellipse cx="305" cy="230" rx="169" ry="30" fill="#bbaa8e"/><path d="${cap}" fill="url(#cap)"/>${spots}${shape === "amanita" ? '<path d="M275 277 Q296 290 333 273 L346 288 Q305 308 266 287Z" fill="#eee2c7"/>' : ""}<path d="M177 166 Q208 109 272 109" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="8" stroke-linecap="round"/></g><text x="25" y="414" fill="#6f6f65" font-size="8" font-family="monospace" letter-spacing="2">MYCELIUM / EDUCATIONAL ILLUSTRATION</text></svg>`;
  await writeFile(`public/images/${slug}.svg`, svg);
}
