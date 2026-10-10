// Een plan van het situatieschema tekenen: achtergrond, muren, teksten en de geplaatste symbolen.
import { symbool, bordSymbool, esc, tekst } from './symbolen.js';
import { alleItems, codes } from './model.js';
import { itemNaam } from './catalogus.js';

const r1 = (n) => Math.round(n * 10) / 10;

/** Soorten lijnstukken op een plan. */
export const SEGMENTEN = {
  muur: { naam: 'Muur' },
  deur: { naam: 'Deur' },
  raam: { naam: 'Raam' },
  meet: { naam: 'Meetlijn' },
};

export const afstand = (m) => Math.hypot(m.x2 - m.x1, m.y2 - m.y1);

/** Een lengte in meter zoals we die schrijven: 2,50 m. Zonder schaal is er niets te tonen. */
export function lengteTekst(px, schaal) {
  if (!schaal || !(px > 0)) return '';
  return `${(px / schaal).toFixed(2).replace('.', ',')} m`;
}

/**
 * Het label met de lengte naast een lijnstuk, leesbaar gedraaid. Standaard staat het boven de lijn (bij een lodrechte lijn
 * rechts ervan); met zijde = -1 aan de andere kant, of met een eigen richting (voor een deur: weg van de draaiboog).
 */
export function maatLabel(m, plan, dikte, { zijde = 1, richting = null } = {}) {
  const t = lengteTekst(afstand(m), plan.schaal);
  if (!t) return '';
  const s = plan.symbool || 1;
  const dx = m.x2 - m.x1;
  const dy = m.y2 - m.y1;
  const l = Math.hypot(dx, dy) || 1;
  let hoek = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (hoek > 90) hoek -= 180;
  else if (hoek <= -90) hoek += 180;
  let nx = -dy / l;
  let ny = dx / l;
  if (!richting) {
    // De kant "boven": de normaal die omhoog wijst (naar rechts bij een lodrechte lijn).
    if (!(ny < -1e-9 || (Math.abs(ny) < 1e-9 && nx > 0))) [nx, ny] = [-nx, -ny];
  } else {
    [nx, ny] = richting;
  }
  const off = dikte / 2 + 11 * s;
  const px = (m.x1 + m.x2) / 2 + nx * zijde * off;
  const py = (m.y1 + m.y2) / 2 + ny * zijde * off;
  return `<text class="maat" transform="translate(${r1(px)} ${r1(py)}) rotate(${r1(hoek)})" text-anchor="middle" dominant-baseline="central" font-size="${r1(13 * s)}">${esc(t)}</text>`;
}

/** Eén lijnstuk tekenen: muur, deur (met draaiboog), raam of meetlijn. */
export function segmentSvg(m, i, plan, { gekozen = false } = {}) {
  const s = plan.symbool || 1;
  const dikte = Math.max(4, 6 * s);
  const soort = m.soort || 'muur';
  const kl = gekozen ? ' gekozen' : '';
  const { x1, y1, x2, y2 } = m;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l = Math.hypot(dx, dy) || 1;
  const data = i == null ? '' : ` data-muur="${i}"`;
  const raak = i == null ? '' : `<line class="raak" data-muur="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${r1(Math.max(dikte, 12 * s))}"/>`;
  let svg;
  let zijde = { zijde: 1 };
  switch (soort) {
    case 'raam':
      svg = `<g class="raam${kl}"${data}><line class="raam-buiten" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${r1(dikte)}"/>`
        + `<line class="raam-binnen" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${r1(dikte * 0.42)}"/></g>`;
      zijde = { zijde: -1 }; // aan de andere kant dan het label van de muur
      break;
    case 'deur': {
      // De getekende lijn is de opening; het blad staat er haaks op, met de draaiboog naar de gesloten stand.
      const sg = m.spiegel ? -1 : 1;
      const ox = x1 - dy * sg;
      const oy = y1 + dx * sg;
      svg = `<g class="deur${kl}"${data}><line class="deurlijn" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
        + `<line class="deurblad" x1="${x1}" y1="${y1}" x2="${r1(ox)}" y2="${r1(oy)}" stroke-width="${r1(Math.max(2.5, dikte * 0.45))}"/>`
        + `<path class="deurboog" d="M${r1(ox)} ${r1(oy)} A${r1(l)} ${r1(l)} 0 0 ${sg === 1 ? 0 : 1} ${x2} ${y2}"/></g>`;
      // Het label komt aan de kant waar de deur niet openslaat.
      zijde = { richting: [(dy / l) * sg, (-dx / l) * sg], zijde: 1 };
      break;
    }
    case 'meet': {
      const nx = (-dy / l) * 7 * s;
      const ny = (dx / l) * 7 * s;
      svg = `<g class="meet${kl}"${data}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
        + `<line x1="${r1(x1 - nx)}" y1="${r1(y1 - ny)}" x2="${r1(x1 + nx)}" y2="${r1(y1 + ny)}"/>`
        + `<line x1="${r1(x2 - nx)}" y1="${r1(y2 - ny)}" x2="${r1(x2 + nx)}" y2="${r1(y2 + ny)}"/></g>`;
      break;
    }
    default:
      svg = `<line class="muur${kl}"${data} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${r1(dikte)}"/>`;
  }
  return { svg: svg + raak, maat: maatLabel(m, plan, soort === 'meet' ? 0 : dikte, zijde) };
}

const GELIJK = 1; // twee hoekpunten die dichter dan dit bij elkaar liggen horen samen

const zelfdePunt = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) <= GELIJK;

/**
 * De muren die aan de gekozen muur vastzitten, van hoek tot hoek, met de gekozen muur zelf erbij (de indexen in plan.muren).
 * Zo zie je de totale lengte van een kamer of een gevel en niet enkel van het ene stuk.
 */
export function muurKeten(plan, i) {
  const start = plan.muren[i];
  if (!start || (start.soort || 'muur') !== 'muur') return [];
  const gezien = new Set([i]);
  const wachtrij = [i];
  while (wachtrij.length) {
    const m = plan.muren[wachtrij.pop()];
    for (const [j, andere] of plan.muren.entries()) {
      if (gezien.has(j) || (andere.soort || 'muur') !== 'muur') continue;
      const raakt = [{ x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 }]
        .some((a) => [{ x: andere.x1, y: andere.y1 }, { x: andere.x2, y: andere.y2 }].some((b) => zelfdePunt(a, b)));
      if (raakt) {
        gezien.add(j);
        wachtrij.push(j);
      }
    }
  }
  return [...gezien].sort((a, b) => a - b);
}

/** De samengetelde lengte (in tekeneenheden) van de aaneengesloten muren rond muur i. */
export const ketenLengte = (plan, i) => muurKeten(plan, i).reduce((som, j) => som + afstand(plan.muren[j]), 0);

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

  const maten = [];
  // De lengte staat enkel bij het gekozen lijnstuk, tenzij je alle afmetingen wil zien (ook op de afdruk).
  plan.muren.forEach((m, i) => {
    const gekozen = selectie?.soort === 'muur' && selectie.id === i;
    const { svg, maat } = segmentSvg(m, i, plan, { gekozen });
    uit.push(svg);
    if (gekozen || plan.alleMaten === true) maten.push(maat);
  });

  for (const t of plan.teksten) {
    const gekozen = selectie?.soort === 'tekst' && selectie.id === t.id;
    uit.push(`<text class="plantekst${gekozen ? ' gekozen' : ''}" data-tekst="${esc(t.id)}" x="${t.x}" y="${t.y}" font-size="${(t.grootte || 16) * s}" text-anchor="middle">${esc(t.tekst)}</text>`);
  }

  uit.push(...maten);

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
.raak{stroke:transparent;fill:none;cursor:pointer}
.raam{cursor:pointer}
.raam-buiten{stroke:#2b2f36;stroke-linecap:butt}
.raam-binnen{stroke:#fff;stroke-linecap:butt}
.raam.gekozen .raam-buiten{stroke:#2563eb}
.deur{cursor:pointer}
.deurlijn{stroke:#9aa0a8;stroke-width:1;stroke-dasharray:4 3;fill:none}
.deurblad{stroke:#2b2f36;stroke-linecap:round}
.deurboog{fill:none;stroke:#6b7280;stroke-width:1.3}
.deur.gekozen .deurblad{stroke:#2563eb}
.deur.gekozen .deurboog{stroke:#2563eb}
.meet{cursor:pointer;stroke:#c2410c;stroke-width:1.5;fill:none}
.meet.gekozen{stroke:#2563eb}
.maat{font-family:Arial,"Segoe UI",sans-serif;fill:#374151;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round;pointer-events:none}
.plantekst{font-family:"Segoe UI",Arial,sans-serif;fill:#3a3f47;cursor:move}
.plantekst.gekozen{fill:#2563eb}
.geplaatst{color:#c2410c;cursor:move}
.geplaatst .plaats-doel{fill:rgba(255,255,255,.75);stroke:none}
.geplaatst.gekozen .plaats-doel{fill:rgba(37,99,235,.16);stroke:#2563eb;stroke-width:1}
.geplaatst.gekozen{color:#1d4ed8}
.plan-code{paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}
`;
