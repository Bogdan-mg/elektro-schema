// Een plan van het situatieschema tekenen: achtergrond, muren, teksten en de geplaatste symbolen.
import { symbool, bordSymbool, esc, tekst } from './symbolen.js';
import { alleItems, codes } from './model.js';
import { itemNaam } from './catalogus.js';

/** Alle onderdelen per id, met hun code. */
export function onderdelen(project) {
  const code = codes(project);
  const map = new Map(alleItems(project).map(({ item, kring }) => [item.id, { item, kring, code: code.get(item.id) }]));
  map.set('bord', { item: 'bord', kring: null, code: 'Bord' });
  return map;
}

/**
 * @param {object} opties selectie: { soort, id }, raster: rasterlijnen tonen (enkel op het scherm)
 * @returns {string} SVG zonder het <svg>-element
 */
export function tekenPlan(project, plan, { selectie = null, raster = false, delen = onderdelen(project) } = {}) {
  const s = plan.symbool || 1;
  const uit = [];
  const achtergrond = plan.achtergrond && project.afbeeldingen[plan.achtergrond];
  uit.push(`<rect class="plan-vlak" x="0" y="0" width="${plan.breedte}" height="${plan.hoogte}"/>`);
  if (achtergrond) {
    uit.push(`<image href="${esc(achtergrond.src)}" x="0" y="0" width="${plan.breedte}" height="${plan.hoogte}" opacity="${plan.zichtbaarheid ?? 0.6}" preserveAspectRatio="none"/>`);
  } else if (raster) {
    uit.push(`<rect x="0" y="0" width="${plan.breedte}" height="${plan.hoogte}" fill="url(#raster)"/>`);
  }

  const dikte = Math.max(4, 6 * s);
  plan.muren.forEach((m, i) => {
    const gekozen = selectie?.soort === 'muur' && selectie.id === i;
    uit.push(`<line class="muur${gekozen ? ' gekozen' : ''}" data-muur="${i}" x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}" stroke-width="${dikte}"/>`);
  });

  for (const t of plan.teksten) {
    const gekozen = selectie?.soort === 'tekst' && selectie.id === t.id;
    uit.push(`<text class="plantekst${gekozen ? ' gekozen' : ''}" data-tekst="${esc(t.id)}" x="${t.x}" y="${t.y}" font-size="${(t.grootte || 16) * s}" text-anchor="middle">${esc(t.tekst)}</text>`);
  }

  for (const [id, pl] of Object.entries(plan.plaatsingen)) {
    const deel = delen.get(id);
    if (!deel) continue;
    const { svg, b, boven = -13, onder = 13 } = deel.item === 'bord' ? bordSymbool() : symbool(deel.item);
    const gekozen = selectie?.soort === 'item' && selectie.id === id;
    const titel = deel.item === 'bord' ? 'Verdeelbord' : `${deel.code} ${itemNaam(deel.item)}`;
    uit.push(
      `<g class="geplaatst${gekozen ? ' gekozen' : ''}" data-plaats="${esc(id)}" transform="translate(${pl.x} ${pl.y})">`
      + `<title>${esc(titel)}</title>`
      + `<g transform="rotate(${pl.rot || 0}) scale(${s})">`
      + `<rect class="plaats-doel" x="${-b / 2 - 5}" y="${boven - 4}" width="${b + 10}" height="${onder - boven + 8}" rx="4"/>`
      + `<g transform="translate(${-b / 2} 0)">${svg}</g></g>`
      + `<g transform="scale(${s})">${tekst(b / 2 + 4, -10, deel.code, 'b plan-code')}</g>`
      + '</g>',
    );
  }
  return uit.join('');
}

/** Legende met de symbolen die op dit plan staan. */
export function legende(project, plan, delen = onderdelen(project)) {
  const gezien = new Map();
  for (const id of Object.keys(plan.plaatsingen)) {
    const deel = delen.get(id);
    if (!deel) continue;
    const naam = deel.item === 'bord' ? 'Verdeelbord' : itemNaam({ ...deel.item, aantal: deel.item.soort === 'stopcontact' ? deel.item.aantal : 1 });
    if (!gezien.has(naam)) gezien.set(naam, deel.item === 'bord' ? 'bord' : { ...deel.item, aantal: deel.item.soort === 'stopcontact' ? deel.item.aantal : 1 });
  }
  return [...gezien.entries()].map(([naam, item]) => ({ naam, item }));
}

export const PLAN_STIJL = `
.plan-vlak{fill:#fff;stroke:#c9ced6;stroke-width:1}
.muur{stroke:#2b2f36;stroke-linecap:square;cursor:pointer}
.muur.gekozen{stroke:#2563eb}
.plantekst{font-family:"Segoe UI",Arial,sans-serif;fill:#3a3f47;cursor:move}
.plantekst.gekozen{fill:#2563eb}
.geplaatst{color:#c2410c;cursor:move}
.geplaatst .plaats-doel{fill:rgba(255,255,255,.75);stroke:none}
.geplaatst.gekozen .plaats-doel{fill:rgba(37,99,235,.16);stroke:#2563eb;stroke-width:1}
.geplaatst.gekozen{color:#1d4ed8}
.plan-code{paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}
`;
