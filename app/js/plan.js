// Een plan van het situatieschema tekenen: achtergrond, het grondplan (muren, deuren, trappen, vlakken, …),
// teksten en de geplaatste symbolen.
import { symbool, bordSymbool, esc, tekst } from './symbolen.js';
import { alleItems, codes } from './model.js';
import { itemNaam } from './catalogus.js';

const r1 = (n) => Math.round(n * 10) / 10;

/** Alle soorten elementen van het grondplan. rond = heeft een middelpunt, grootte en hoek (in plaats van twee punten). */
export const ELEMENTEN = {
  muur: { naam: 'Muur' },
  boog: { naam: 'Ronde muur' },
  deur: { naam: 'Deur' },
  poort: { naam: 'Garagepoort' },
  raam: { naam: 'Raam' },
  trap: { naam: 'Trap' },
  draaitrap: { naam: 'Draaitrap' },
  rechthoek: { naam: 'Rechthoek', rond: true },
  vlak: { naam: 'Vlak', rond: true },
  lijn: { naam: 'Lijn' },
  maat: { naam: 'Maatlijn' },
  meet: { naam: 'Meetlijn' },
  afbeelding: { naam: 'Afbeelding', rond: true },
};
/** Voor oudere code en tests. */
export const SEGMENTEN = ELEMENTEN;

/** Soorten die als muur tellen voor het kleven van symbolen en het optellen van lengtes. */
const IS_MUUR = (m) => (m.soort || 'muur') === 'muur' || m.soort === 'boog';
const EENHEDEN_PER_MM = 5; // de dikte van een lijn staat in mm; zo veel tekeneenheden is dat op het plan

export const afstand = (m) => Math.hypot(m.x2 - m.x1, m.y2 - m.y1);

/** Een lengte in meter zoals we die schrijven: 2,50 m. Zonder schaal is er niets te tonen. */
export function lengteTekst(px, schaal) {
  if (!schaal || !(px > 0)) return '';
  return `${(px / schaal).toFixed(2).replace('.', ',')} m`;
}

// ---------- Meetkunde van elementen ----------

const rad = (g) => (g * Math.PI) / 180;
/** Punt (x, y) om (cx, cy) gedraaid over hoek graden. */
export function draaiPunt(x, y, cx, cy, hoek) {
  const a = rad(hoek);
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) };
}

/** De cirkel door drie punten (voor een ronde muur). Geeft null als ze op één lijn liggen. */
export function cirkelDoor(m) {
  const { x1: ax, y1: ay, x2: bx, y2: by, bx: cx, by: cy } = m;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-6) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  return { x: ux, y: uy, r: Math.hypot(ax - ux, ay - uy) };
}

/** Het pad van een boog van (x1,y1) via (bx,by) naar (x2,y2). */
function boogPad(m) {
  const c = cirkelDoor(m);
  if (!c) return `M${m.x1} ${m.y1} L${m.x2} ${m.y2}`;
  // De richting waarin het tussenpunt bereikt wordt.
  const hoek = (x, y) => Math.atan2(y - c.y, x - c.x);
  const a1 = hoek(m.x1, m.y1);
  const a2 = hoek(m.x2, m.y2);
  const ab = hoek(m.bx, m.by);
  const norm = (a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const links = norm(ab - a1) < norm(a2 - a1); // het tussenpunt ligt binnen de draai met de klok mee
  const groot = links ? (norm(a2 - a1) > Math.PI ? 1 : 0) : (norm(a1 - a2) > Math.PI ? 1 : 0);
  return `M${r1(m.x1)} ${r1(m.y1)} A${r1(c.r)} ${r1(c.r)} 0 ${groot} ${links ? 1 : 0} ${r1(m.x2)} ${r1(m.y2)}`;
}

/** Het middelpunt en de grootte van een "ronde" element (rechthoek, vlak, afbeelding). */
export const rechthoekVan = (m) => ({ cx: m.cx, cy: m.cy, w: m.w, h: m.h, hoek: m.hoek || 0 });

/** De hoekpunten van een rechthoek-element, gedraaid. */
function hoeken(m) {
  const { cx, cy, w, h, hoek } = rechthoekVan(m);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => draaiPunt(cx + x, cy + y, cx, cy, hoek));
}

const heeftTwee = (m) => !ELEMENTEN[m.soort || 'muur']?.rond;

/** Het omhullende vak van een element. */
export function omhulsel(m) {
  const soort = m.soort || 'muur';
  let punten;
  if (ELEMENTEN[soort]?.rond) punten = hoeken(m);
  else if (soort === 'draaitrap') {
    const r = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
    punten = [{ x: m.x1 - r, y: m.y1 - r }, { x: m.x1 + r, y: m.y1 + r }];
  } else if (soort === 'trap') {
    const l = afstand(m) || 1;
    const b = (m.breedte || 90) / 2;
    const nx = (-(m.y2 - m.y1) / l) * b;
    const ny = ((m.x2 - m.x1) / l) * b;
    punten = [{ x: m.x1 + nx, y: m.y1 + ny }, { x: m.x1 - nx, y: m.y1 - ny }, { x: m.x2 + nx, y: m.y2 + ny }, { x: m.x2 - nx, y: m.y2 - ny }];
  } else {
    punten = [{ x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 }];
    if (soort === 'boog' && m.bx != null) punten.push({ x: m.bx, y: m.by });
  }
  const xs = punten.map((p) => p.x);
  const ys = punten.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/** Een element verschuiven; wat wel en niet een eindpunt heeft, zit in de soort. */
export function verschuifElement(m, dx, dy, welke = 'alles') {
  if (ELEMENTEN[m.soort]?.rond) {
    if (welke === 'alles') { m.cx += dx; m.cy += dy; }
    return;
  }
  if (welke === 'alles' || welke === 'p1') { m.x1 += dx; m.y1 += dy; }
  if (welke === 'alles' || welke === 'p2') { m.x2 += dx; m.y2 += dy; }
  if (welke === 'alles' && m.bx != null) { m.bx += dx; m.by += dy; }
}

/** De handvatten van een gekozen element: de punten die je apart kan verslepen. */
export function handvatten(m) {
  const soort = m.soort || 'muur';
  if (ELEMENTEN[soort]?.rond) {
    const { cx, cy, w, h, hoek } = rechthoekVan(m);
    return [
      { k: 'grootte', ...draaiPunt(cx + w / 2, cy + h / 2, cx, cy, hoek) },
      { k: 'draai', ...draaiPunt(cx, cy - h / 2 - 22, cx, cy, hoek), rond: true },
    ];
  }
  const lijst = [{ k: 'p1', x: m.x1, y: m.y1 }, { k: 'p2', x: m.x2, y: m.y2 }];
  if (soort === 'boog') lijst.push({ k: 'pb', x: m.bx, y: m.by });
  if (soort === 'maat') {
    const l = afstand(m) || 1;
    const nx = -(m.y2 - m.y1) / l;
    const ny = (m.x2 - m.x1) / l;
    const o = m.afstand ?? 30;
    lijst.push({ k: 'afstand', x: (m.x1 + m.x2) / 2 + nx * o, y: (m.y1 + m.y2) / 2 + ny * o });
  }
  return lijst;
}

// ---------- Maatlabels ----------

/**
 * Het label met de lengte naast een lijnstuk, leesbaar gedraaid. Standaard staat het boven de lijn (bij een lodrechte lijn
 * rechts ervan); met zijde = -1 aan de andere kant, of met een eigen richting (voor een deur: weg van de draaiboog).
 */
export function maatLabel(m, plan, dikte, { zijde = 1, richting = null, tekst: vast = null } = {}) {
  const t = vast || lengteTekst(afstand(m), plan.schaal);
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

// ---------- Elementen tekenen ----------

const kleurStijl = (m, eigenschap = 'stroke') => (m.kleur ? ` style="${eigenschap}:${esc(m.kleur)}"` : '');

/** Een trap: een strook met treden en een pijl omhoog. */
function trapSvg(m, kl, data) {
  const l = afstand(m) || 1;
  const b = (m.breedte || 90) / 2;
  const ux = (m.x2 - m.x1) / l;
  const uy = (m.y2 - m.y1) / l;
  const nx = -uy * b;
  const ny = ux * b;
  const hoek = (px, py) => `${r1(px)} ${r1(py)}`;
  const stap = Math.max(14, l / Math.max(2, Math.round(l / 28)));
  let treden = '';
  for (let d = stap; d < l - 1; d += stap) {
    const cx = m.x1 + ux * d;
    const cy = m.y1 + uy * d;
    treden += `M${hoek(cx + nx, cy + ny)} L${hoek(cx - nx, cy - ny)} `;
  }
  const kop = 8;
  const pijl = `M${hoek(m.x1 + ux * l * 0.15, m.y1 + uy * l * 0.15)} L${hoek(m.x1 + ux * l * 0.85, m.y1 + uy * l * 0.85)} `
    + `M${hoek(m.x1 + ux * l * 0.85 - ux * kop - uy * kop * 0.6, m.y1 + uy * l * 0.85 - uy * kop + ux * kop * 0.6)} L${hoek(m.x1 + ux * l * 0.85, m.y1 + uy * l * 0.85)} `
    + `L${hoek(m.x1 + ux * l * 0.85 - ux * kop + uy * kop * 0.6, m.y1 + uy * l * 0.85 - uy * kop - ux * kop * 0.6)}`;
  const rand = `M${hoek(m.x1 + nx, m.y1 + ny)} L${hoek(m.x2 + nx, m.y2 + ny)} L${hoek(m.x2 - nx, m.y2 - ny)} L${hoek(m.x1 - nx, m.y1 - ny)} Z`;
  return `<g class="trap${kl}"${data}${kleurStijl(m)}><path class="trap-vlak" d="${rand}"/><path class="trap-trede" d="${treden}"/><path class="trap-pijl" d="${pijl}"/></g>`;
}

/** Een draaitrap: een cirkel met treden rondom het middelpunt. */
function draaitrapSvg(m, kl, data) {
  const r = Math.hypot(m.x2 - m.x1, m.y2 - m.y1) || 1;
  let treden = '';
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.atan2(m.y2 - m.y1, m.x2 - m.x1);
    treden += `M${r1(m.x1 + Math.cos(a) * r * 0.2)} ${r1(m.y1 + Math.sin(a) * r * 0.2)} L${r1(m.x1 + Math.cos(a) * r)} ${r1(m.y1 + Math.sin(a) * r)} `;
  }
  return `<g class="trap${kl}"${data}${kleurStijl(m)}><circle class="trap-vlak" cx="${r1(m.x1)}" cy="${r1(m.y1)}" r="${r1(r)}"/>`
    + `<circle class="trap-trede" cx="${r1(m.x1)}" cy="${r1(m.y1)}" r="${r1(r * 0.2)}"/><path class="trap-trede" d="${treden}"/></g>`;
}

/** Een maatlijn: de lijn op een afstand van de twee meetpunten, met hulplijnen en de tekst. */
function maatlijnSvg(m, plan, kl, data) {
  const l = afstand(m) || 1;
  const nx = -(m.y2 - m.y1) / l;
  const ny = (m.x2 - m.x1) / l;
  const o = m.afstand ?? 30;
  const a = { x: m.x1 + nx * o, y: m.y1 + ny * o };
  const b = { x: m.x2 + nx * o, y: m.y2 + ny * o };
  const over = Math.sign(o) * 6;
  const tik = 5;
  const ux = (m.x2 - m.x1) / l;
  const uy = (m.y2 - m.y1) / l;
  const d = [
    `M${r1(m.x1)} ${r1(m.y1)} L${r1(a.x + nx * over)} ${r1(a.y + ny * over)}`,
    `M${r1(m.x2)} ${r1(m.y2)} L${r1(b.x + nx * over)} ${r1(b.y + ny * over)}`,
    `M${r1(a.x)} ${r1(a.y)} L${r1(b.x)} ${r1(b.y)}`,
    `M${r1(a.x - ux * tik - nx * tik)} ${r1(a.y - uy * tik - ny * tik)} L${r1(a.x + ux * tik + nx * tik)} ${r1(a.y + uy * tik + ny * tik)}`,
    `M${r1(b.x - ux * tik - nx * tik)} ${r1(b.y - uy * tik - ny * tik)} L${r1(b.x + ux * tik + nx * tik)} ${r1(b.y + ny * tik + uy * tik)}`,
  ].join(' ');
  const raak = `<path class="raak" ${data.trim()} d="M${r1(a.x)} ${r1(a.y)} L${r1(b.x)} ${r1(b.y)}" stroke-width="${r1(12 * (plan.symbool || 1))}"/>`;
  const label = maatLabel({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }, plan, 0, { tekst: m.tekst || lengteTekst(l, plan.schaal) || '' });
  return { svg: `<g class="maatlijn${kl}"${data}${kleurStijl(m)}><path d="${d}"/></g>${raak}`, label };
}

/** Een deur met zijn blad en draaiboog, of schuifdeur / dubbele deur. */
function deurSvg(m, i, kl, data, dikte) {
  const { x1, y1, x2, y2 } = m;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l = Math.hypot(dx, dy) || 1;
  const sg = m.spiegel ? -1 : 1;
  const type = m.type || 'draai';
  const lijn = `<line class="deurlijn" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const bladDikte = r1(Math.max(2.5, dikte * 0.45));
  if (type === 'schuif') {
    const nx = (-dy / l) * dikte * 0.9 * sg;
    const ny = (dx / l) * dikte * 0.9 * sg;
    return {
      svg: `<g class="deur${kl}"${data}>${lijn}<line class="deurblad" x1="${r1(x1 + nx)}" y1="${r1(y1 + ny)}" x2="${r1(x1 + dx * 0.6 + nx)}" y2="${r1(y1 + dy * 0.6 + ny)}" stroke-width="${bladDikte}"/>`
        + `<line class="deurblad" x1="${r1(x1 + dx * 0.4 - nx)}" y1="${r1(y1 + dy * 0.4 - ny)}" x2="${r1(x2 - nx)}" y2="${r1(y2 - ny)}" stroke-width="${bladDikte}"/></g>`,
      richting: [(dy / l) * sg, (-dx / l) * sg],
    };
  }
  if (type === 'dubbel') {
    const mx = x1 + dx / 2;
    const my = y1 + dy / 2;
    const half = l / 2;
    const blad = (px, py, tx, ty, sweep) => {
      const ox = px - (ty - py) * sg;
      const oy = py + (tx - px) * sg;
      return `<line class="deurblad" x1="${px}" y1="${py}" x2="${r1(ox)}" y2="${r1(oy)}" stroke-width="${bladDikte}"/>`
        + `<path class="deurboog" d="M${r1(ox)} ${r1(oy)} A${r1(half)} ${r1(half)} 0 0 ${sweep} ${tx} ${ty}"/>`;
    };
    return {
      svg: `<g class="deur${kl}"${data}>${lijn}${blad(x1, y1, mx, my, sg === 1 ? 0 : 1)}${blad(x2, y2, mx, my, sg === 1 ? 1 : 0)}</g>`,
      richting: [(dy / l) * sg, (-dx / l) * sg],
    };
  }
  // Een gewone draaideur: het blad staat haaks op de opening, met de draaiboog naar de gesloten stand.
  const ox = x1 - dy * sg;
  const oy = y1 + dx * sg;
  return {
    svg: `<g class="deur${kl}"${data}>${lijn}<line class="deurblad" x1="${x1}" y1="${y1}" x2="${r1(ox)}" y2="${r1(oy)}" stroke-width="${bladDikte}"/>`
      + `<path class="deurboog" d="M${r1(ox)} ${r1(oy)} A${r1(l)} ${r1(l)} 0 0 ${sg === 1 ? 0 : 1} ${x2} ${y2}"/></g>`,
    richting: [(dy / l) * sg, (-dx / l) * sg], // het label komt aan de kant waar de deur niet openslaat
  };
}

/**
 * Eén element tekenen. Geeft de tekening en (voor lijnstukken) het label met de lengte.
 * @param {object} m het element
 * @param {number|null} i de plaats in de lijst (voor oude bestanden zonder id), of null voor een voorbeeld
 */
export function segmentSvg(m, i, plan, { gekozen = false, afbeeldingen = null } = {}) {
  const s = plan.symbool || 1;
  const soort = m.soort || 'muur';
  const dikte = m.dikte || Math.max(4, 6 * s);
  const kl = gekozen ? ' gekozen' : '';
  const { x1, y1, x2, y2 } = m;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l = Math.hypot(dx, dy) || 1;
  const sleutel = m.id ?? i;
  const data = sleutel == null ? '' : ` data-muur="${esc(sleutel)}"`;
  const raakDikte = r1(Math.max(dikte, 12 * s));
  const raak = (d) => (sleutel == null ? '' : `<path class="raak"${data} d="${d}" stroke-width="${raakDikte}"/>`);
  const lijnRaak = raak(`M${x1} ${y1} L${x2} ${y2}`);
  let svg;
  let zijde = { zijde: 1 };
  let maatDikte = dikte;
  switch (soort) {
    case 'raam':
      svg = `<g class="raam${kl}"${data}><line class="raam-buiten" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${r1(dikte)}"/>`
        + `<line class="raam-binnen" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${r1(dikte * 0.42)}"/></g>`;
      zijde = { zijde: -1 }; // aan de andere kant dan het label van de muur
      break;
    case 'deur': {
      const d = deurSvg(m, i, kl, data, dikte);
      svg = d.svg;
      zijde = { richting: d.richting, zijde: 1 };
      break;
    }
    case 'poort': {
      const nx = (-dy / l) * dikte;
      const ny = (dx / l) * dikte;
      svg = `<g class="poort${kl}"${data}><line class="poort-lijn" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${r1(dikte * 0.5)}"/>`
        + `<line class="poort-streep" x1="${r1(x1 + nx)}" y1="${r1(y1 + ny)}" x2="${r1(x2 + nx)}" y2="${r1(y2 + ny)}"/></g>`;
      break;
    }
    case 'meet': {
      const nx = (-dy / l) * 7 * s;
      const ny = (dx / l) * 7 * s;
      svg = `<g class="meet${kl}"${data}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
        + `<line x1="${r1(x1 - nx)}" y1="${r1(y1 - ny)}" x2="${r1(x1 + nx)}" y2="${r1(y1 + ny)}"/>`
        + `<line x1="${r1(x2 - nx)}" y1="${r1(y2 - ny)}" x2="${r1(x2 + nx)}" y2="${r1(y2 + ny)}"/></g>`;
      maatDikte = 0;
      break;
    }
    case 'lijn': {
      const dik = r1((m.dikte || 0.35) * EENHEDEN_PER_MM);
      svg = `<line class="lijn${kl}"${data}${kleurStijl(m)} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${dik}"/>`;
      return { svg: svg + lijnRaak, maat: '' };
    }
    case 'boog': {
      const d = boogPad(m);
      return { svg: `<path class="muur boog${kl}"${data} d="${d}" stroke-width="${r1(dikte)}" fill="none"/>${raak(d)}`, maat: '' };
    }
    case 'trap':
      return { svg: trapSvg(m, kl, data) + lijnRaak, maat: '' };
    case 'draaitrap':
      return { svg: draaitrapSvg(m, kl, data), maat: '' };
    case 'maat': {
      const r = maatlijnSvg(m, plan, kl, data);
      return { svg: r.svg, maat: r.label, altijd: true };
    }
    case 'rechthoek':
    case 'vlak': {
      const { cx, cy, w, h, hoek } = rechthoekVan(m);
      const vul = soort === 'vlak' ? ` fill="${esc(m.kleur || '#93c5fd')}" fill-opacity="${r1(1 - (m.transparantie ?? 0.6))}"` : ' fill="transparent"';
      return {
        svg: `<g class="${soort}${kl}"${data} transform="rotate(${r1(hoek)} ${r1(cx)} ${r1(cy)})"><rect x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${r1(w)}" height="${r1(h)}"${vul}${soort === 'rechthoek' ? kleurStijl(m) : ''}/></g>`,
        maat: '',
      };
    }
    case 'afbeelding': {
      const { cx, cy, w, h, hoek } = rechthoekVan(m);
      const afb = afbeeldingen?.[m.afb];
      const inhoud = afb
        ? `<image href="${esc(afb.src)}" x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${r1(w)}" height="${r1(h)}" opacity="${m.dekking ?? 1}" preserveAspectRatio="none"/>`
        : `<rect x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${r1(w)}" height="${r1(h)}" fill="#eee" stroke="#aaa"/>`;
      const doel = `<rect class="afb-doel" x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${r1(w)}" height="${r1(h)}"/>`;
      return {
        svg: `<g class="afbeelding${kl}${m.slot ? ' vast' : ''}"${data} transform="rotate(${r1(hoek)} ${r1(cx)} ${r1(cy)})">${inhoud}${doel}</g>`,
        maat: '',
      };
    }
    default: {
      const dikWeergave = r1(dikte);
      svg = `<line class="muur${kl}"${data}${kleurStijl(m)} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${dikWeergave}"/>`;
    }
  }
  return { svg: svg + lijnRaak, maat: maatLabel(m, plan, maatDikte, zijde) };
}

// ---------- Muren aan elkaar ----------

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

// ---------- Symbolen op het plan ----------

/** De breedte van het symbool van een onderdeel (zie symbolen.js). */
export const symboolBreedte = (deel) => (deel.item === 'bord' ? bordSymbool() : symbool(deel.item)).b;

/**
 * Een symbool tegen de dichtstbijzijnde muur zetten. Het symbool staat dan met zijn leiding op de muur en wijst de ruimte in,
 * aan de kant waar het punt ligt. Geeft { x, y, rot, muur } terug, of null als er geen muur dichtbij genoeg is.
 * @param {number} breedte de breedte van het symbool, in symboolruimte (voor de schaal van het plan)
 */
export function kleefAanMuur(plan, punt, breedte) {
  const s = plan.symbool || 1;
  const dikte = Math.max(4, 6 * s);
  const afstandTotMidden = dikte / 2 + (breedte * s) / 2; // van de muurlijn tot het midden van het symbool
  const bereik = afstandTotMidden + 18 * s;
  let beste = null;
  plan.muren.forEach((m, i) => {
    if ((m.soort || 'muur') !== 'muur') return;
    const dx = m.x2 - m.x1;
    const dy = m.y2 - m.y1;
    const l2 = dx * dx + dy * dy;
    if (!l2) return;
    const t = Math.max(0, Math.min(1, ((punt.x - m.x1) * dx + (punt.y - m.y1) * dy) / l2));
    const cx = m.x1 + t * dx;
    const cy = m.y1 + t * dy;
    const d = Math.hypot(punt.x - cx, punt.y - cy);
    if (d > bereik || (beste && d >= beste.d)) return;
    const l = Math.sqrt(l2);
    let nx = -dy / l;
    let ny = dx / l;
    if ((punt.x - cx) * nx + (punt.y - cy) * ny < 0) [nx, ny] = [-nx, -ny];
    beste = { d, x: cx + nx * afstandTotMidden, y: cy + ny * afstandTotMidden, nx, ny, muur: i };
  });
  if (!beste) return null;
  const rot = ((Math.round((Math.atan2(beste.ny, beste.nx) * 180) / Math.PI) % 360) + 360) % 360;
  return { x: Math.round(beste.x * 10) / 10, y: Math.round(beste.y * 10) / 10, rot, muur: beste.muur };
}

/** Het stuk van een code zonder cijfers is de letter van de kring; het cijfer erachter is het nummer van het onderdeel. */
export function codeDelen(code) {
  const m = /^(.*?)(\d+)$/.exec(code || '');
  return m ? { letter: m[1], nummer: m[2] } : { letter: code || '', nummer: '' };
}

const POSITIES = ['rechts', 'links', 'boven', 'onder'];

/** De ruimte die een tekstje inneemt (grof geschat), voor het vermijden van muren. */
const tekstBreedte = (t, s) => String(t).length * 6.2 * s;

/**
 * Waar een tekst bij een symbool komt: één van rechts, links, boven of onder. Bij "auto" kiezen we de plaats waar
 * het minst een muur of een ander symbool in de weg staat.
 */
function tekstPlek(pl, deel, s, plan, positie, tekstje, anderen) {
  const { b, boven = -13, onder = 13 } = deel.item === 'bord' ? bordSymbool() : symbool(deel.item);
  const hoek = rad(pl.rot || 0);
  const half = Math.max(-boven, onder);
  const ex = (Math.abs(Math.cos(hoek)) * (b / 2) + Math.abs(Math.sin(hoek)) * half) * s;
  const ey = (Math.abs(Math.sin(hoek)) * (b / 2) + Math.abs(Math.cos(hoek)) * half) * s;
  const br = tekstBreedte(tekstje, s);
  const hg = 10 * s;
  const kandidaten = {
    rechts: { x: pl.x + ex + 3 * s, y: pl.y - 2 * s, anker: 'start' },
    links: { x: pl.x - ex - 3 * s, y: pl.y - 2 * s, anker: 'end' },
    boven: { x: pl.x, y: pl.y - ey - 3 * s, anker: 'middle' },
    onder: { x: pl.x, y: pl.y + ey + 11 * s, anker: 'middle' },
  };
  if (positie && positie !== 'auto' && kandidaten[positie]) return kandidaten[positie];
  const box = (k) => {
    const x0 = k.anker === 'start' ? k.x : k.anker === 'end' ? k.x - br : k.x - br / 2;
    return { x0, x1: x0 + br, y0: k.y - hg, y1: k.y + 2 * s };
  };
  const rakenMuur = (v) => plan.muren.some((m) => {
    if (!['muur', 'boog', 'raam', 'deur', 'poort', undefined].includes(m.soort)) return false;
    if (m.soort === 'boog') return false;
    // Het dichtstbijzijnde punt van het segment bij het midden van het vak, vergeleken met de halve diagonaal.
    const dx = m.x2 - m.x1;
    const dy = m.y2 - m.y1;
    const l2 = dx * dx + dy * dy || 1;
    const cx = (v.x0 + v.x1) / 2;
    const cy = (v.y0 + v.y1) / 2;
    const t = Math.max(0, Math.min(1, ((cx - m.x1) * dx + (cy - m.y1) * dy) / l2));
    const px = m.x1 + t * dx;
    const py = m.y1 + t * dy;
    return px > v.x0 - 3 && px < v.x1 + 3 && py > v.y0 - 3 && py < v.y1 + 3;
  });
  let beste = null;
  for (const naam of POSITIES) {
    const k = kandidaten[naam];
    const v = box(k);
    let straf = POSITIES.indexOf(naam) * 0.1;
    if (rakenMuur(v)) straf += 10;
    for (const o of anderen) {
      if (o.x > v.x0 - 8 * s && o.x < v.x1 + 8 * s && o.y > v.y0 - 8 * s && o.y < v.y1 + 8 * s) straf += 4;
    }
    if (!beste || straf < beste.straf) beste = { straf, ...k };
  }
  return beste;
}

/**
 * Eén geplaatst onderdeel: het symbool met zijn letter/nummer of adres, op de plaats en onder de hoek die bij pl hoort.
 * @param {object} opties plan: het plan (voor beletteren/nummeren en het ontwijken van muren), anderen: de punten van andere symbolen
 */
export function plaatsingSvg(deel, pl, s, gekozen = false, id = '', { plan = null, anderen = [] } = {}) {
  const { svg, b, boven = -13, onder = 13 } = deel.item === 'bord' ? bordSymbool() : symbool(deel.item);
  const titel = deel.item === 'bord' ? 'Verdeelbord' : `${deel.code} ${itemNaam(deel.item)}`.trim();
  const kleur = pl.kleur ? ` style="--kleur:${esc(pl.kleur)}"` : '';
  const labels = [];
  if (plan && deel.item !== 'bord') {
    const adres = deel.item.adres?.trim();
    const toonAdres = adres && pl.adresPlaats !== 'verbergen';
    const { letter, nummer } = codeDelen(deel.code);
    const kringTekst = `${plan.beletteren === false ? '' : letter}${plan.nummeren === false ? '' : nummer}`;
    // Zoals in Trikker: de kring staat er bij "automatisch" enkel als er geen adres is.
    const toonKring = kringTekst && (pl.tekstPlaats === 'verbergen' ? false : pl.tekstPlaats && pl.tekstPlaats !== 'auto' ? true : !toonAdres);
    if (toonKring) labels.push({ t: kringTekst, klasse: 'b plan-code', positie: pl.tekstPlaats });
    if (toonAdres) labels.push({ t: adres, klasse: 'b plan-code adres', positie: pl.adresPlaats });
  } else if (deel.item === 'bord') {
    labels.push({ t: 'Bord', klasse: 'b plan-code', positie: pl.tekstPlaats });
  } else if (deel.code) {
    labels.push({ t: deel.code, klasse: 'b plan-code', positie: pl.tekstPlaats });
  }
  const eigen = plan ? [] : [];
  let uit = '';
  for (const lb of labels) {
    const k = plan ? tekstPlek(pl, deel, s, plan, lb.positie, lb.t, anderen) : { x: pl.x + (b / 2 + 4) * s, y: pl.y - 10 * s, anker: 'start' };
    // De tekst staat los van de draaiing van het symbool, in de tekening zelf.
    uit += `<text class="${lb.klasse}" x="${r1(k.x - pl.x)}" y="${r1(k.y - pl.y)}" text-anchor="${k.anker}" style="font-size:${r1(8.6 * s)}px">${esc(lb.t)}</text>`;
    eigen.push(k);
  }
  return `<g class="geplaatst${gekozen ? ' gekozen' : ''}" data-plaats="${esc(id)}" transform="translate(${pl.x} ${pl.y})"${kleur}>`
    + `<title>${esc(titel)}</title>`
    + `<g transform="rotate(${pl.rot || 0}) scale(${s})">`
    + `<rect class="plaats-doel" x="${-b / 2 - 5}" y="${boven - 4}" width="${b + 10}" height="${onder - boven + 8}" rx="4"/>`
    + `<g transform="translate(${-b / 2} 0)">${svg}</g></g>`
    + uit
    + '</g>';
}

/** Alle onderdelen per id, met hun code. */
export function onderdelen(project) {
  const code = codes(project);
  const map = new Map(alleItems(project).map(({ item, kring }) => [item.id, { item, kring, code: code.get(item.id) }]));
  map.set('bord', { item: 'bord', kring: null, code: 'Bord' });
  return map;
}

/** Het onderdeel bij een plaatsing: een gewoon onderdeel uit het ééndraadschema, of een los symbool dat erbij zit. */
export const deelVan = (delen, id, pl) => (pl.los ? { item: pl.item, kring: null, code: '' } : delen.get(id));

/**
 * @param {object} opties selectie: lijst van { soort: 'el' | 'item' | 'tekst', id }, raster: rasterlijnen tonen (enkel op het scherm)
 * @returns {string} SVG zonder het <svg>-element
 */
export function tekenPlan(project, plan, { selectie = [], raster = false, delen = onderdelen(project) } = {}) {
  const s = plan.symbool || 1;
  const gekozen = (soort, id) => (Array.isArray(selectie) ? selectie : selectie ? [selectie] : []).some((k) => k.soort === soort && k.id === id);
  const uit = [];
  const achtergrond = plan.achtergrond && project.afbeeldingen[plan.achtergrond];
  uit.push(`<rect class="plan-vlak" x="0" y="0" width="${plan.breedte}" height="${plan.hoogte}"/>`);
  if (achtergrond) {
    uit.push(`<image href="${esc(achtergrond.src)}" x="0" y="0" width="${plan.breedte}" height="${plan.hoogte}" opacity="${plan.zichtbaarheid ?? 0.6}" preserveAspectRatio="none"/>`);
  } else if (raster && plan.toonGrid !== false) {
    uit.push(`<rect x="0" y="0" width="${plan.breedte}" height="${plan.hoogte}" fill="url(#raster)"/>`);
  }
  if (raster) {
    // Afdrukhulplijnen: wat binnen deze vakken blijft, wordt op een redelijke grootte afgedrukt (A4 en A3 liggend).
    for (const [naam, b, h] of [['A4', 1115, 780], ['A3', 1730, 1215]]) {
      uit.push(`<rect class="hulplijn" x="0" y="0" width="${b}" height="${h}"/><text class="hulplijn-tekst" x="${b - 6}" y="${h - 6}" text-anchor="end">${naam}</text>`);
    }
  }

  // Afbeeldingen en vlakken liggen onder de muren.
  const volgorde = { afbeelding: 0, vlak: 1, rechthoek: 2, trap: 3, draaitrap: 3, lijn: 4 };
  const onder = plan.muren.map((m, i) => [m, i]).sort((a, b) => (volgorde[a[0].soort] ?? 5) - (volgorde[b[0].soort] ?? 5));
  const maten = [];
  onder.forEach(([m, i]) => {
    const g = gekozen('el', m.id ?? i);
    const { svg, maat, altijd } = segmentSvg(m, i, plan, { gekozen: g, afbeeldingen: project.afbeeldingen });
    uit.push(svg);
    if (maat && (g || plan.alleMaten === true || altijd)) maten.push(maat);
  });

  for (const t of plan.teksten) {
    const g = gekozen('tekst', t.id);
    uit.push(`<text class="plantekst${g ? ' gekozen' : ''}" data-tekst="${esc(t.id)}" x="${t.x}" y="${t.y}" font-size="${(t.grootte || 16) * s}" text-anchor="middle"${t.kleur ? ` style="fill:${esc(t.kleur)}"` : ''}>${esc(t.tekst)}</text>`);
  }

  uit.push(...maten);

  const geplaatst = Object.entries(plan.plaatsingen).map(([id, pl]) => [id, pl, deelVan(delen, id, pl)]).filter(([, , d]) => d);
  for (const [id, pl, deel] of geplaatst) {
    const anderen = geplaatst.filter(([x]) => x !== id).map(([, p]) => p);
    uit.push(plaatsingSvg(deel, pl, s, gekozen('item', id), id, { plan, anderen }));
  }
  return uit.join('');
}

/** Legende met de symbolen die op dit plan staan. */
export function legende(project, plan, delen = onderdelen(project)) {
  const gezien = new Map();
  for (const [id, pl] of Object.entries(plan.plaatsingen)) {
    const deel = deelVan(delen, id, pl);
    if (!deel) continue;
    const naam = deel.item === 'bord' ? 'Verdeelbord' : itemNaam({ ...deel.item, aantal: deel.item.soort === 'stopcontact' ? deel.item.aantal : 1 });
    if (!gezien.has(naam)) gezien.set(naam, deel.item === 'bord' ? 'bord' : { ...deel.item, aantal: deel.item.soort === 'stopcontact' ? deel.item.aantal : 1 });
  }
  return [...gezien.entries()].map(([naam, item]) => ({ naam, item }));
}

export const PLAN_STIJL = `
.plan-vlak{fill:#fff;stroke:#c9ced6;stroke-width:1}
.hulplijn{fill:none;stroke:#93c5fd;stroke-width:1.2;stroke-dasharray:10 6;pointer-events:none}
.hulplijn-tekst{fill:#93c5fd;font:12px Arial,sans-serif;pointer-events:none}
.muur{stroke:#2b2f36;stroke-linecap:square;cursor:pointer;fill:none}
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
.poort{cursor:pointer}
.poort-lijn{stroke:#2b2f36;stroke-linecap:butt}
.poort-streep{stroke:#6b7280;stroke-width:1.3;stroke-dasharray:8 5}
.poort.gekozen .poort-lijn,.poort.gekozen .poort-streep{stroke:#2563eb}
.meet{cursor:pointer;stroke:#c2410c;stroke-width:1.5;fill:none}
.meet.gekozen{stroke:#2563eb}
.maatlijn{cursor:pointer;stroke:#374151;stroke-width:1;fill:none}
.maatlijn.gekozen{stroke:#2563eb}
.lijn{stroke:#2b2f36;stroke-linecap:round;cursor:pointer}
.lijn.gekozen{stroke:#2563eb}
.trap{cursor:pointer;stroke:#2b2f36}
.trap-vlak{fill:#fff;fill-opacity:.5;stroke:#2b2f36;stroke-width:1.4}
.trap-trede{fill:none;stroke:#2b2f36;stroke-width:1}
.trap-pijl{fill:none;stroke:#2b2f36;stroke-width:1.2}
.trap.gekozen *{stroke:#2563eb}
.rechthoek rect{stroke:#2b2f36;stroke-width:1.5;cursor:pointer}
.vlak rect{stroke:none;cursor:pointer}
.rechthoek.gekozen rect{stroke:#2563eb}
.vlak.gekozen rect{stroke:#2563eb;stroke-width:1.5}
.afbeelding{cursor:move}
.afbeelding.vast{cursor:default}
.afb-doel{fill:transparent;stroke:none}
.afbeelding.gekozen .afb-doel{stroke:#2563eb;stroke-width:1.5;stroke-dasharray:6 4}
.maat{font-family:Arial,"Segoe UI",sans-serif;fill:#374151;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round;pointer-events:none}
.plantekst{font-family:"Segoe UI",Arial,sans-serif;fill:#3a3f47;cursor:move}
.plantekst.gekozen{fill:#2563eb}
.geplaatst{color:var(--kleur,#c2410c);cursor:move}
.geplaatst .plaats-doel{fill:rgba(255,255,255,.75);stroke:none}
.geplaatst.gekozen .plaats-doel{fill:rgba(37,99,235,.16);stroke:#2563eb;stroke-width:1}
.geplaatst.gekozen{color:#1d4ed8}
.plan-code{paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}
.plan-code.adres{font-style:italic}
`;
