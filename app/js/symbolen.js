// De symbolen (naar de gangbare Belgische/IEC-tekens), als SVG-tekst.
// Elk onderdeelsymbool begint op x = 0 (waar de leiding aankomt) en staat verticaal gecentreerd op y = 0.
import { TOESTELLEN } from './catalogus.js';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;

export const lijn = (x1, y1, x2, y2, klasse = 'l') => `<line class="${klasse}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
export const tekst = (x, y, t, klasse = 'k', anker = 'start') =>
  `<text class="${klasse}" x="${r1(x)}" y="${r1(y)}"${anker !== 'start' ? ` text-anchor="${anker}"` : ''}>${esc(t)}</text>`;
const rechthoek = (x, y, b, h, klasse = 'l') => `<rect class="${klasse}" x="${r1(x)}" y="${r1(y)}" width="${r1(b)}" height="${r1(h)}"/>`;
const cirkel = (x, y, r, klasse = 'l') => `<circle class="${klasse}" cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"/>`;
const pad = (d, klasse = 'l') => `<path class="${klasse}" d="${d}"/>`;

/** Een stopcontact: halve cirkel, open naar rechts; de aarding is de streep voor de opening. */
function kom(x, y, aarding) {
  let s = pad(`M${x + 10} ${y - 6} A6 6 0 0 0 ${x + 10} ${y + 6}`);
  if (aarding) s += lijn(x + 13, y - 7, x + 13, y + 7);
  return s;
}

function stopcontact(item) {
  const n = Math.max(1, Math.min(4, item.aantal || 1));
  const tussen = 14;
  let s = '';
  const ys = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * tussen);
  if (n > 1) s += lijn(2, ys[0], 2, ys[n - 1]);
  s += lijn(0, 0, 2, 0);
  for (const y of ys) s += lijn(2, y, 4, y) + kom(0, y, item.aarding);
  if (item.waterdicht) s += tekst(8, ys[n - 1] + 15, 'IP44', 'm', 'middle');
  return { svg: s, b: 16 };
}

function lichtpunt(item) {
  let s = lijn(0, 0, 4, 0);
  let b = 20;
  const kruis = (cx, r) => cirkel(cx, 0, r) + lijn(cx - r * 0.7, -r * 0.7, cx + r * 0.7, r * 0.7) + lijn(cx - r * 0.7, r * 0.7, cx + r * 0.7, -r * 0.7);
  switch (item.variant) {
    case 'wand': s += lijn(4, -8, 4, 8) + kruis(12, 7); break;
    case 'spot': s += kruis(11, 7) + cirkel(11, 0, 2, 'v'); break;
    case 'ledstrip': s += rechthoek(4, -4, 26, 8) + lijn(8, -4, 12, 4) + lijn(14, -4, 18, 4) + lijn(20, -4, 24, 4); b = 30; break;
    case 'tl': s += lijn(4, -6, 4, 6) + lijn(4, 0, 30, 0, 'l dik') + lijn(30, -6, 30, 6); b = 30; break;
    case 'buiten': s += kruis(12, 8) + tekst(12, 19, 'IP', 'm', 'middle'); break;
    default: s += kruis(12, 8);
  }
  if (item.aantal > 1) s += tekst(b - 2, -9, `×${item.aantal}`, 'm', 'middle');
  return { svg: s, b };
}

function schakelaar(item) {
  let s = lijn(0, 0, 6, 0);
  const cx = 9;
  const arm = (hoek, lengte, streepjes) => {
    const a = (hoek * Math.PI) / 180;
    const x1 = cx + Math.cos(a) * 3;
    const y1 = -Math.sin(a) * 3;
    const x2 = cx + Math.cos(a) * lengte;
    const y2 = -Math.sin(a) * lengte;
    let t = lijn(x1, y1, x2, y2);
    for (let i = 0; i < streepjes; i++) {
      const px = cx + Math.cos(a) * (lengte - i * 4);
      const py = -Math.sin(a) * (lengte - i * 4);
      t += lijn(px, py, px + Math.cos(a - Math.PI / 2) * 4, py - Math.sin(a - Math.PI / 2) * 4);
    }
    return t;
  };
  switch (item.variant) {
    case 'tweepolig': s += cirkel(cx, 0, 3) + arm(55, 15, 2); break;
    case 'wissel': s += cirkel(cx, 0, 3) + arm(55, 15, 1) + arm(235, 13, 1); break;
    case 'kruis': s += cirkel(cx, 0, 3) + arm(55, 15, 1) + arm(235, 13, 1) + arm(125, 13, 1) + arm(305, 13, 1); break;
    case 'serie': s += cirkel(cx, 0, 3) + arm(40, 15, 1) + arm(80, 15, 1); break;
    case 'dimmer': s += cirkel(cx, 0, 3) + arm(55, 15, 1) + lijn(3, 8, 17, -6) + pad('M17 -6 L12 -5 L16 -1 Z', 'v'); break;
    case 'drukknop': s += cirkel(cx + 3, 0, 6) + cirkel(cx + 3, 0, 2.2, 'v'); break;
    case 'bewegingsmelder': s += rechthoek(6, -8, 22, 16) + tekst(17, 3, 'BM', 'm', 'middle'); break;
    case 'rolluik': s += rechthoek(6, -9, 16, 18) + pad('M14 -7 L10 -2 L18 -2 Z M14 7 L10 2 L18 2 Z', 'v'); break;
    default: s += cirkel(cx, 0, 3) + arm(55, 15, 1);
  }
  const b = ['bewegingsmelder'].includes(item.variant) ? 28 : 22;
  if (item.aantal > 1) s += tekst(b, 10, `×${item.aantal}`, 'm', 'middle');
  if (item.waterdicht) s += tekst(10, 17, 'IP44', 'm', 'middle');
  return { svg: s, b };
}

function toestel(item) {
  const t = TOESTELLEN[item.variant] || TOESTELLEN.ander;
  let s = '';
  let x = 0;
  if (item.aansluiting === 'stopcontact') {
    s += lijn(0, 0, 4, 0) + kom(0, 0, true) + lijn(13, 0, 18, 0);
    x = 18;
  } else {
    s += lijn(0, 0, 4, 0);
    x = 4;
  }
  s += rechthoek(x, -9, 26, 18) + tekst(x + 13, 3.5, t.kort, 'b', 'middle');
  return { svg: s, b: x + 26 };
}

function aftakdoos() {
  return { svg: lijn(0, 0, 4, 0) + rechthoek(4, -5, 10, 10) + cirkel(9, 0, 2, 'v'), b: 14 };
}

export function symbool(item) {
  switch (item.soort) {
    case 'stopcontact': return stopcontact(item);
    case 'lichtpunt': return lichtpunt(item);
    case 'schakelaar': return schakelaar(item);
    case 'toestel': return toestel(item);
    case 'aftakdoos': return aftakdoos();
    default: return { svg: rechthoek(0, -8, 16, 16), b: 16 };
  }
}

/** Het verdeelbord, voor op het situatieschema. */
export function bordSymbool() {
  return { svg: rechthoek(0, -10, 32, 20) + pad('M0 10 L32 -10 L32 10 Z', 'v'), b: 32 };
}

/** Automaat op een verticale lijn, van y tot y + 32. */
export function automaatSymbool(x, y) {
  return lijn(x, y, x, y + 8) + lijn(x - 3.5, y + 4.5, x + 3.5, y + 11.5) + lijn(x - 3.5, y + 11.5, x + 3.5, y + 4.5)
    + lijn(x, y + 26, x - 9, y + 10) + lijn(x, y + 26, x, y + 32);
}

/** Differentieel op een verticale lijn, van y tot y + 44. */
export function diffSymbool(x, y) {
  return rechthoek(x - 13, y, 26, 44) + lijn(x, y + 6, x, y + 13) + lijn(x, y + 31, x - 7, y + 17) + lijn(x, y + 31, x, y + 38)
    + tekst(x + 7, y + 40, 'ΔI', 'm', 'middle');
}

/** Differentieel liggend, gecentreerd op (x, y). */
export function diffLiggend(x, y) {
  return rechthoek(x - 22, y - 13, 44, 26) + tekst(x, y + 4, 'ΔI', 'b', 'middle');
}

export function aardeSymbool(x, y) {
  return lijn(x, y, x, y + 12) + lijn(x - 10, y + 12, x + 10, y + 12) + lijn(x - 6.5, y + 16, x + 6.5, y + 16) + lijn(x - 3, y + 20, x + 3, y + 20);
}

/** Een klein voorbeeld van een symbool, voor knoppen en lijsten. */
export function icoon(item, grootte = 28) {
  const { svg, b } = item === 'bord' ? bordSymbool() : symbool(item);
  const breedte = Math.max(b + 4, 24);
  const schaal = grootte / 26;
  return `<svg class="icoon" viewBox="-2 -13 ${breedte} 26" width="${Math.round(breedte * schaal)}" height="${grootte}" aria-hidden="true">${svg}</svg>`;
}
