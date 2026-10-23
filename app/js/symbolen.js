// De symbolen, getekend zoals in Trikker en volgens het AREI (Boek 1, tabel 2.23), als SVG-tekst.
// Elk onderdeel begint op x = 0, waar de leiding van de kring aankomt, op hoogte y = 0.
// Een symbool geeft terug: svg, b (breedte), boven/onder (hoe ver het boven en onder de leiding komt)
// en midden (het midden van het eigenlijke teken, voor "x3", het adres en dergelijke).
import { trikkerSymbool, trikkerEendraadSymbool, trikkerBordSymbool } from './trikker/kaart.js';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;

export const lijn = (x1, y1, x2, y2, klasse = 'l') => `<line class="${klasse}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
export const tekst = (x, y, t, klasse = 'k', anker = 'start') =>
  `<text class="${klasse}" x="${r1(x)}" y="${r1(y)}"${anker !== 'start' ? ` text-anchor="${anker}"` : ''}>${esc(t)}</text>`;
const rechthoek = (x, y, b, h, klasse = 'l') => `<rect class="${klasse}" x="${r1(x)}" y="${r1(y)}" width="${r1(b)}" height="${r1(h)}"/>`;
const cirkel = (x, y, r, klasse = 'l') => `<circle class="${klasse}" cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"/>`;
const pad = (d, klasse = 'l') => `<path class="${klasse}" d="${d}"/>`;
const stip = (x, y, r = 1.7) => cirkel(x, y, r, 'v');
const kruis = (cx, cy, h, klasse = 'l') => lijn(cx - h, cy - h, cx + h, cy + h, klasse) + lijn(cx - h, cy + h, cx + h, cy - h, klasse);
const klok = (cx, cy, r) => cirkel(cx, cy, r) + lijn(cx, cy, cx, cy - r * 0.7) + lijn(cx, cy, cx - r * 0.6, cy);

/** Punt op een hoek (in graden, tegen de klok in, 0 = rechts) en afstand van een middelpunt. */
function punt(cx, cy, hoek, afstand) {
  const a = (hoek * Math.PI) / 180;
  return [cx + Math.cos(a) * afstand, cy - Math.sin(a) * afstand];
}

/** Klein pijltje van (x1,y1) naar (x2,y2). */
function pijl(x1, y1, x2, y2, kop = 2.2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p = (h) => [x2 - Math.cos(a + h) * kop, y2 - Math.sin(a + h) * kop];
  const [ax, ay] = p(0.5);
  const [bx, by] = p(-0.5);
  return lijn(x1, y1, x2, y2) + pad(`M${r1(x2)} ${r1(y2)} L${r1(ax)} ${r1(ay)} L${r1(bx)} ${r1(by)} Z`, 'v');
}

/** Een open of gevuld pijlpuntje dat naar (x, y) wijst, vanuit de richting hoek. */
function puntje(x, y, hoek, grootte = 2.6) {
  const [ax, ay] = punt(x, y, hoek + 25, grootte);
  const [bx, by] = punt(x, y, hoek - 25, grootte);
  return pad(`M${r1(x)} ${r1(y)} L${r1(ax)} ${r1(ay)} L${r1(bx)} ${r1(by)} Z`, 'v');
}

const res = (svg, b, midden, boven = -10, onder = 10, door = b) => ({ svg, b, midden, boven, onder, door });

// ---------- Contactdozen ----------

/**
 * Contactdoos zoals in Trikker: de leiding komt van links bij het uiteinde van een halve cirkel die naar rechts open is.
 * Aarding: een rechte streep op de leiding (de "rug" van de boog). Kinderbescherming: de uiteinden van de boog
 * lopen als verticale streepjes door. Meervoudig: de bogen op een rij, elk een halve boog verder.
 * Fasen, nul en beschermingsgeleider kunnen als streepjes op de leiding staan.
 */
function contactdoos(it) {
  const n = Math.max(1, Math.min(6, Number(it.aantal) || 1));
  const r = 7;
  const tik = r * 0.5; // lengte van de streepjes aan de uiteinden
  let s = '';
  let x = 6;
  const fasen = Number(it.fasen) || 0;
  if (fasen) {
    const totaal = fasen + (it.nul ? 1 : 0) + (it.pe ? 1 : 0);
    let sx = 7;
    for (let i = 0; i < totaal; i++) {
      s += lijn(sx - 2.6, 4.6, sx + 2.6, -4.6);
      if (it.nul && i === fasen) s += stip(sx - 2.6, 4.6, 1.3);
      if (it.pe && i === totaal - 1) s += lijn(sx - 2.6, 4.6, sx + 1.8, 4.6);
      sx += 3.8;
    }
    x = sx + 3;
  }
  if (it.transformator) {
    s += cirkel(x + 6, 0, 5.5);
    x += 8;
  }
  const L = x + 6;
  const tussen = r + tik; // de volgende boog begint waar de streepjes van de vorige eindigen
  s = lijn(0, 0, L + (n - 1) * tussen, 0) + s;
  for (let i = 0; i < n; i++) {
    const ax = L + i * tussen;
    s += pad(`M${r1(ax + r)} ${-r} A${r} ${r} 0 0 0 ${r1(ax + r)} ${r}`);
    if (it.aarding) s += lijn(ax, -r * 0.62, ax, r * 0.62);
    if (it.kinderveilig) s += lijn(ax + r, -r, ax + r, -r - tik) + lijn(ax + r, r, ax + r, r + tik);
  }
  if (it.schakelaar && it.schakelaar !== 'geen') {
    const [ex, ey] = punt(L, 0, 130, r * 1.9);
    s += lijn(L, 0, ex, ey);
    const streepjes = it.schakelaar === 'dubbel' ? 2 : 1;
    for (let i = 0; i < streepjes; i++) {
      const [px, py] = punt(L, 0, 130, r * 1.9 - i * 2.8);
      s += lijn(px, py, px - 4.4, py - 1.4);
    }
  }
  const midden = L + r / 2 + ((n - 1) * tussen) / 2;
  const boven = [it.waterdicht ? 'h' : '', it.opschrift || ''].filter(Boolean).join(', ');
  const hoog = it.kinderveilig ? r + tik : r;
  if (boven) s += tekst(L + r / 2, -hoog - 2.5, boven, 'k', 'middle');
  const laag = boven ? -hoog - 12 : it.schakelaar && it.schakelaar !== 'geen' ? -r * 1.9 - 3 : -hoog - 1;
  return res(s, L + (n - 1) * tussen + r + 3, midden, laag, hoog + 1);
}

function communicatie(it) {
  let s = lijn(0, 0, 14, 0) + lijn(14, -8, 14, 8) + lijn(14, -8, 18, -8) + lijn(14, 8, 18, 8);
  if (it.opschrift) s += tekst(14, 19, it.opschrift, 'k', 'middle');
  return res(s, 19, 15, -10, it.opschrift ? 20 : 10);
}

// ---------- Verlichting ----------

function lichtpunt(it) {
  let s = '';
  let b;
  let m;
  const nood = it.nood && it.nood !== 'geen' ? it.nood : '';
  if (it.variant === 'tl' || it.variant === 'ledstrip') {
    const x0 = 6;
    const x1 = 34;
    const n = Number(it.buizen) || 1;
    const ys = n === 1 ? [0] : n === 2 ? [-2, 2] : [-3.6, 0, 3.6];
    const t = n === 1 ? 4 : 5.6;
    s += lijn(0, 0, x0, 0);
    for (const y of ys) s += lijn(x0, y, x1, y);
    s += lijn(x0, -t, x0, t, 'l half') + lijn(x1, -t, x1, t, 'l half');
    m = (x0 + x1) / 2;
    if (it.variant === 'ledstrip') s += tekst(m, -t - 2.5, 'LED', 'm', 'middle');
    if (it.wand) s += lijn(m - 6, t + 4, m + 6, t + 4, 'l half');
    if (nood === 'centraal') s += kruis(m, -t - 5, 2.6) + stip(m, -t - 5, 1.3);
    if (nood === 'decentraal') s += rechthoek(m - 4, -t - 9, 8, 8) + kruis(m, -t - 5, 2.4) + stip(m, -t - 5, 1.3);
    b = x1 + 2;
  } else {
    const c = 15;
    m = c;
    switch (it.variant) {
      case 'spot':
        s += lijn(0, 0, c - 6.5, 0) + cirkel(c, 0, 3.6) + kruis(c, 0, 2.5) + pad(`M${c} -6.5 A6.5 6.5 0 0 0 ${c} 6.5`);
        break;
      case 'led':
        s += lijn(0, 0, c - 4.5, 0) + pad(`M${c - 4.5} -4.5 L${c - 4.5} 4.5 L${c + 3} 0 Z`) + lijn(c + 3, -4.5, c + 3, 4.5) + lijn(c + 3, 0, c + 6, 0)
          + pijl(c - 2, -6, c + 0.5, -10, 1.6) + pijl(c + 1.5, -6, c + 4, -10, 1.6);
        break;
      case 'signalisatie':
        s += lijn(0, 0, c - 4.6, 0) + cirkel(c, 0, 4.6) + kruis(c, 0, 3.2);
        break;
      default:
        s += lijn(0, 0, c, 0) + kruis(c, 0, 4.4);
        if (it.schakelaar) s += lijn(c + 4.4, -4.4, c + 7.2, -2.4);
    }
    if (it.wand) s += lijn(c - 4.6, 7.4, c + 4.6, 7.4, 'l half');
    if (nood === 'centraal') s += stip(c, 0, 2.1);
    if (nood === 'decentraal') s += rechthoek(c - 6.8, -6.8, 13.6, 13.6, 'l half') + stip(c, 0, 2.1);
    b = c + (nood === 'decentraal' ? 9 : it.variant === 'led' ? 7.5 : 7);
  }
  if (it.waterdicht) s += tekst(m, -9, 'h', 'k', 'middle');
  const door = it.variant === 'plafond' && !nood ? m : b;
  return res(s, b, m, it.waterdicht || nood ? -15 : -8, it.wand ? 10 : 7, door);
}

function voorschakelapparaat() {
  return res(lijn(0, 0, 8, 0) + rechthoek(8, -10, 13, 20, 'l half') + rechthoek(11.5, -6.5, 6, 13), 22, 14.5, -11, 11);
}

// ---------- Schakelaars ----------

function schakelaar(it) {
  const cx = { wissel: 15, dubbelewissel: 20, kruis: 15, serie: 12 }[it.variant] || 9;
  const rx = it.verklikker ? 3.2 : 2.4; // een klein rond lichaam
  const ry = rx;
  const lang = 11;
  let s = '';
  // Een hendel met zijn streepjes (polen) aan het uiteinde; kant = +1 wijst het streepje naar rechts, -1 naar links.
  const hendel = (hoek, streepjes, kant, dx = 0, dy = 0, begin = rx + 0.4) => {
    const [x1, y1] = punt(cx + dx, dy, hoek, begin);
    const [x2, y2] = punt(cx + dx, dy, hoek, lang);
    let t = lijn(x1, y1, x2, y2);
    const boven = Math.sin((hoek * Math.PI) / 180) > 0;
    for (let i = 0; i < streepjes; i++) {
      const [px, py] = punt(cx + dx, dy, hoek, lang - i * 2.2);
      t += lijn(px, py, px + kant * 3.2, py + (boven ? 1.8 : -1.8));
    }
    return t;
  };
  let lead = cx - rx;
  if (it.signalisatie) {
    const lx = cx - rx - 2.8;
    s += cirkel(lx, 0, 2.8) + kruis(lx, 0, 2);
    lead = lx - 2.8;
  }
  if (it.variant === 'dubbelewissel') {
    // Twee wisselschakelaars in één: een afgerond lichaam met twee evenwijdige hendels naar beide kanten.
    s += lijn(0, 0, cx - 7, 0) + `<rect class="l" x="${cx - 7}" y="-2.4" width="14" height="4.8" rx="2.4"/>`;
    for (const dx of [-3, 3]) s += hendel(64, 1, 1, dx, -2.2, 0) + hendel(244, 1, -1, dx, 2.2, 0);
  } else {
    s += lijn(0, 0, lead, 0) + `<ellipse class="l" cx="${cx}" cy="0" rx="${rx}" ry="${ry}"/>`;
    if (it.signalisatie) s += lijn(lead, 0, cx - rx, 0);
    if (it.verklikker) s += kruis(cx, 0, 2.2);
  }
  let b = cx + 10;
  switch (it.variant) {
    case 'onbepaald': s += hendel(64, 0, 1); break;
    case 'tweepolig': s += hendel(64, 2, 1); break;
    case 'vierpolig': s += hendel(64, 4, 1); break;
    case 'wissel': s += hendel(64, 1, 1) + hendel(244, 1, -1); break;
    case 'dubbelewissel': b = cx + 12; break;
    case 'kruis': s += hendel(64, 1, 1) + hendel(116, 1, -1) + hendel(244, 1, -1) + hendel(296, 1, 1); break;
    case 'serie': s += hendel(70, 1, 1) + hendel(110, 1, -1); break;
    default: s += hendel(64, 1, 1);
  }
  const [tx, ty] = punt(cx, 0, 64, lang);
  if (it.dimmer) {
    const [mx, my] = punt(cx, 0, 64, 2.8 + 4.8);
    s += pad(`M${r1(mx - 3.4)} ${r1(my + 0.2)} L${r1(mx + 4.6)} ${r1(my - 2.2)} L${r1(mx + 4.6)} ${r1(my + 2.2)} Z`);
    b = Math.max(b, cx + 13);
  }
  if (it.rolluik) {
    s += pad(`M${r1(tx + 4.4)} ${r1(ty + 0.4)} l1.8 2.6 h-3.6 Z M${r1(tx + 4.4)} ${r1(ty + 6.6)} l1.8 -2.6 h-3.6 Z`, 'v');
    b = Math.max(b, tx + 8);
  }
  if (it.trek) s += pijl(tx + 2.4, ty + 1, tx + 2.4, ty + 7, 1.6);
  const links = [it.waterdicht ? 'h' : '', it.vertraagd ? 't' : ''].filter(Boolean).join(' ');
  if (links) s += tekst(tx - 2, ty + 1.5, links, 'k', 'end');
  const ruim = ['wissel', 'kruis', 'dubbelewissel'].includes(it.variant);
  return res(s, b, cx, -13, ruim ? 13 : 5, cx + rx);
}

function drukknop(it) {
  const c = 12;
  const r = 6.6;
  let s = lijn(0, 0, c - r, 0) + cirkel(c, 0, r);
  s += it.verklikker ? cirkel(c, 0, 3) + kruis(c, 0, 2) : cirkel(c, 0, 2.3);
  if (it.afgeschermd) s += pad(`M${c - r} -${r + 1.5} V-${r + 4} H${c + r} V-${r + 1.5}`);
  if (it.rolluik) s += pad(`M${c - 9} -9.5 l1.8 2.6 h-3.6 Z M${c - 9} -3 l1.8 -2.6 h-3.6 Z`, 'v');
  if (it.dimmer) s += pad(`M${c - 9.5} -7 H${c - 3.5} L${c - 9.5} -9.6 Z`);
  if (it.knoppen > 1) s += lijn(c + 4, -4, c + 7.5, -7.5) + tekst(c + 8, -6.5, String(it.knoppen), 'k');
  if (it.waterdicht) s += tekst(c, it.afgeschermd ? -12 : -9, 'h', 'k', 'middle');
  return res(s, c + (it.knoppen > 1 ? 13 : 8), c, it.waterdicht || it.afgeschermd ? -17 : -10, 8, c + r);
}

// ---------- Alarm en detectie ----------

function bewegingsdetector(it) {
  let s = '';
  let m = 17;
  if (it.variant === 'rondom') {
    s += lijn(0, 0, 13, 0) + cirkel(17, 0, 4);
    for (const h of [0, 60, 120, 180, 240, 300]) {
      const [x, y] = punt(17, 0, h, 6.5);
      s += puntje(x, y, h, 2.6);
    }
  } else {
    s += lijn(0, 0, 12, 0) + pad('M12 0 L22 -6 Q25.5 0 22 6 Z', it.radar ? 'l vol' : 'l');
    if (it.radar || it.ultrasoon) {
      for (const r of it.radar ? [6, 8.5, 11] : [7, 10]) s += pad(`M${r1(19 + r * 0.7)} ${r1(-r * 0.7)} A${r} ${r} 0 0 1 ${r1(19 + r * 0.7)} ${r1(r * 0.7)}`);
    }
    if (it.variant === 'gericht') s += puntje(25.5, 0, 0, 3);
    if (it.variant === 'gespreid' || it.infrarood) s += puntje(25, -5.5, 35, 2.6) + puntje(26.5, 0, 0, 2.6) + puntje(25, 5.5, -35, 2.6);
  }
  return res(s, it.radar || it.ultrasoon ? 32 : 29, m, -11, 11);
}

function bewegingsdetectorActief() {
  return res(lijn(0, 0, 6, 0) + pad('M6 0 L14 -4.5 V4.5 Z') + lijn(14, 0, 26, 0) + pad('M34 0 L26 -4.5 V4.5 Z'), 35, 20, -7, 7);
}

function beveiligingscontact(it) {
  let s = '';
  let b = 22;
  switch (it.variant) {
    case 'mechanisch': s += lijn(0, 0, 8, 0) + stip(15.5, 0, 7.5); b = 23; break;
    case 'schoot': s += lijn(0, 0, 10, 0) + stip(14, -4, 3.8) + pad('M12 -2 L16 -2 L18 7 L10 7 Z', 'v'); b = 20; break;
    case 'tril': s += lijn(0, 0, 10.5, 0) + lijn(8, -9, 20, -9) + pad('M14 -8.5 L20 4 L8 4 Z', 'v'); break;
    case 'drukmat': s += lijn(0, 0, 9, 0) + pad('M6 -7 L22 -7 L18 5 L10 5 Z', 'v') + lijn(5, 8, 23, 8); b = 24; break;
    case 'afneem': s += lijn(0, 0, 13.5, 0) + cirkel(16.5, 0, 3) + lijn(16.5, -3, 16.5, -11); b = 20; break;
    default: s += lijn(0, 0, 8, 0) + rechthoek(8, -5.5, 11, 11, 'v'); b = 20;
  }
  return res(s, b, 15, -12, 9);
}

function beveiliging(it) {
  if (it.variant === 'thermisch') return res(pad('M0 0 H9 V-9 H17 V0'), 18, 13, -11, 3);
  return res(lijn(0, 0, 9, 0) + pad('M9 0 C9 -14 19 -14 19 0'), 20, 14, -12, 3);
}

function branddetector(it) {
  let s = lijn(0, 0, 8, 0) + rechthoek(8, -9, 18, 18);
  switch (it.variant) {
    case 'rook': s += pad('M15 -6 C21 -3.5 11 3.5 18 6'); break;
    case 'vlam': s += pad('M15 -6.5 C20 -4.5 12 -1.5 17 0.5 C21 2.5 13 4.5 18 6.5'); break;
    case 'warmte': s += lijn(12, -6, 12, 6) + pad('M22 -6 L13 0 L22 6'); break;
    case 'gas': s += pad('M11 5.5 H23 L17 -5.5 Z'); break;
    case 'manueel': s += rechthoek(14, -6, 6, 5) + lijn(17, -6, 17, 6); break;
    case 'straal': s += lijn(17, -9, 17, 9) + pad('M15.5 -12.5 H18.5 L17 -9.5 Z') + pad('M15.5 12.5 H18.5 L17 9.5 Z'); break;
  }
  return res(s, 27, 17, it.variant === 'straal' ? -14 : -10, it.variant === 'straal' ? 14 : 10);
}

function camera(it) {
  let s = '';
  let b = 30;
  const lichaam = (x, y, schaal = 1) => {
    const p = (dx, dy) => `${r1(x + dx * schaal)} ${r1(y + dy * schaal)}`;
    let t = pad(`M${p(0, -4.5)} L${p(15, -4.5)} L${p(18, -6.5)} L${p(16.5, 4.5)} L${p(0, 4.5)} Z`)
      + rechthoek(x + 17.3 * schaal, y - 1.6 * schaal, 2.6 * schaal, 3.2 * schaal);
    if (it.discreet) t += lijn(x, y - 4.5 * schaal, x + 16.5 * schaal, y + 4.5 * schaal) + lijn(x, y + 4.5 * schaal, x + 16 * schaal, y - 4.5 * schaal);
    if (it.beweegdetectie) t += pijl(x + 12 * schaal, y, x + 4 * schaal, y, 2);
    return t;
  };
  if (it.variant === 'dome') {
    s += lijn(0, 0, 6, 0) + pad('M6 -8 H34 A14 13 0 0 1 6 -8 Z') + `<g transform="rotate(12 20 -2)">${lichaam(10, -2, 0.8)}</g>`;
    b = 35;
  } else if (it.variant === 'behuizing') {
    s += lijn(0, 0, 6, 0) + pad('M6 -8 H32 L28 8 H6 Z') + lichaam(9, 0, 0.9);
    b = 33;
  } else {
    s += lijn(0, 0, 8, 0) + lichaam(8, 0);
  }
  if (it.beweegbaar) {
    s += pad(`M${b + 1} -4 Q${b + 4} 0 ${b + 1} 4`) + puntje(b + 1, -4, 120, 2.2) + puntje(b + 1, 4, 240, 2.2);
    b += 6;
  }
  return res(s, b, 18, it.variant === 'dome' ? -10 : -9, it.variant === 'dome' ? 14 : 9);
}

function trillingsdetector(it) {
  let s = lijn(0, 0, 22, 0, 'l half') + lijn(8, -3.5, 8, 3.5, 'l half') + lijn(22, -3.5, 22, 3.5, 'l half');
  if (it.variant === 'mechanisch') s += pad('M10 -6 V2 H20 V-6');
  if (it.actief) s += cirkel(15, -3, 3) + kruis(15, -3, 2);
  else s += cirkel(15, -3, 3);
  s += lijn(15, -6, 15, -11);
  return res(s, 23, 15, -13, 5);
}

// ---------- Toegang ----------

function slot(it) {
  let s = lijn(0, 0, 8, 0) + rechthoek(8, -8, 16, 16, 'l half');
  if (it.variant === 'inschakel') s += stip(16, -2.5, 2.4) + pad('M14.6 -1 H17.4 L18.6 5 H13.4 Z', 'v');
  else if (it.variant === 'tijd') s += klok(16, 0, 5);
  else for (let i = 1; i < 4; i++) s += lijn(8 + i * 4, -8, 8 + i * 4, 8) + lijn(8, -8 + i * 4, 24, -8 + i * 4);
  return res(s, 25, 16, -10, 10);
}

function deurslot() {
  return res(lijn(0, 0, 8, 0) + pad('M8 -6 H20 L27 6 H8 Z') + pad('M10 2 a2.6 2.6 0 0 1 5.2 0 a2.6 2.6 0 0 1 5.2 0'), 28, 16, -8, 8);
}

// ---------- Communicatie ----------

function geluidsbron(it) {
  let s = '';
  let b = 18;
  switch (it.variant) {
    case 'zoemer': s += lijn(0, 0, 11, 0) + pad('M18 -7 A7 7 0 0 0 18 7') + lijn(18, -7, 18, 7); b = 19; break;
    case 'hoorn': s += lijn(0, 0, 6, 0) + rechthoek(6, -6, 12, 12) + pad('M18 -2 L27 -6 L27 6 L18 2'); b = 28; break;
    case 'sirene': s += lijn(0, 0, 11, 0) + pad('M11 -7 L11 7 L21 0 Z'); b = 22; break;
    default: s += lijn(0, 0, 11, 0) + lijn(11, -7, 11, 7) + pad('M11 -7 A7 7 0 0 1 11 7');
  }
  if (it.autonoom) s += lijn(4, -11, 8, -11) + lijn(8, -14, 8, -8) + lijn(10, -12.5, 10, -9.5) + lijn(10, -11, 14, -11);
  return res(s, b, 12, it.autonoom ? -16 : -9, 9);
}

function intercom() {
  return res(lijn(0, 0, 8, 0) + rechthoek(8, -7.5, 17, 15) + rechthoek(11.5, -2.4, 3, 4.8) + pad('M14.5 -2.4 L18.5 -5.4 V5.4 L14.5 2.4')
    + lijn(20, 0, 30, 0) + puntje(20, 0, 0, 2.4) + puntje(30, 0, 180, 2.4), 31, 16, -9, 9);
}

function kiezer() {
  return res(lijn(0, 0, 8, 0) + rechthoek(8, -5.5, 18, 11, 'l half') + cirkel(13, 1, 2) + cirkel(21, 1, 2) + lijn(12, -2, 22, -2), 27, 17, -7, 7);
}

function luidspreker() {
  return res(lijn(0, 0, 8, 0) + rechthoek(8, -5, 5, 10) + pad('M13 -5 L20 -11 V11 L13 5'), 21, 14, -12, 12);
}

function microfoon(it) {
  let s = lijn(0, 0, 7, 0) + cirkel(14, 0, 7) + lijn(21, -8, 21, 8, 'l half');
  if (it.selectief) for (const dx of [0, 2.6, 5.2]) s += lijn(15 + dx, 9, 19 + dx, 3);
  return res(s, 25, 14, -9, 10);
}

function monitor() {
  let s = lijn(0, 0, 8, 0) + rechthoek(8, -9, 22, 18, 'l half') + rechthoek(10.5, -6.5, 17, 9.5);
  for (const x of [14, 19, 24]) s += cirkel(x, 5.8, 1);
  return res(s, 31, 19, -10, 10);
}

// ---------- Toestellen ----------

function sneeuwvlok(cx, cy, r) {
  let s = '';
  for (const h of [90, 30, 150, 270, 210, 330]) {
    const [x2, y2] = punt(cx, cy, h, r);
    const [vx, vy] = punt(cx, cy, h, r * 0.62);
    const [ax, ay] = punt(vx, vy, h + 40, r * 0.42);
    const [bx, by] = punt(vx, vy, h - 40, r * 0.42);
    s += lijn(cx, cy, x2, y2, 'l half') + lijn(vx, vy, ax, ay) + lijn(vx, vy, bx, by);
  }
  return s;
}

/** Huishoudtoestel: vierkant met het teken van het toestel. */
function toestelSymbool(variant, x0, metLeiding) {
  const x = x0 + (metLeiding ? 7 : 0);
  let s = metLeiding ? lijn(x0, 0, x, 0) : '';
  let b = x + 19;
  const doos = () => rechthoek(x, -9.5, 19, 19, 'l half');
  switch (variant) {
    case 'kookplaat': s += doos() + stip(x + 5, -4.6, 2.4) + stip(x + 14, -4.6, 2.4) + stip(x + 14, 4.6, 2.4); break;
    case 'microgolf': s += doos() + [-5, 0, 5].map((dy) => pad(`M${x + 5.5} ${dy + 1} q2 -3 4 0 t4 0`)).join(''); break;
    case 'oven': s += doos() + lijn(x, -6, x + 19, -6) + stip(x + 9.5, 3, 2.4); break;
    case 'stoomoven': s += doos() + [3, 6, 9].map((r) => pad(`M${x + 9.5 - r} 5 A${r} ${r} 0 0 1 ${x + 9.5 + r} 5`)).join(''); break;
    case 'wasmachine': s += doos() + cirkel(x + 9.5, 0, 6.5) + stip(x + 9.5, 0, 2.6); break;
    case 'droogkast': s += doos() + cirkel(x + 7.2, -4, 2.4) + cirkel(x + 11.8, -4, 2.4) + stip(x + 9.5, 4, 2.4); break;
    case 'vaatwasser': s += doos() + lijn(x, -9.5, x + 19, 9.5) + lijn(x, 9.5, x + 19, -9.5) + cirkel(x + 9.5, 0, 4.5, 'l w'); break;
    case 'koelkast': s += doos() + sneeuwvlok(x + 9.5, 0, 4.2); break;
    case 'diepvries': s += rechthoek(x, -9.5, 31, 19, 'l half') + sneeuwvlok(x + 6, 0, 3.6) + sneeuwvlok(x + 15.5, 0, 3.6) + sneeuwvlok(x + 25, 0, 3.6); b = x + 31; break;
    case 'dampkap':
    case 'ventilatie': s += doos() + cirkel(x + 6.5, 0, 3.4) + cirkel(x + 12.5, 0, 3.4); break;
    case 'boiler': return boiler({}, x0, metLeiding);
    case 'verwarming': return verwarmingstoestel({}, x0, metLeiding);
    case 'laadpaal':
      s += rechthoek(x, -11, 13, 21) + rechthoek(x + 2, -9, 9, 5) + tekst(x + 6.5, 6, 'VE', 'm', 'middle')
        + lijn(x - 1, 10, x + 14, 10) + lijn(x + 13, -3, x + 16, -3) + lijn(x + 16, -3, x + 16, 6) + rechthoek(x + 15, -11, 2, 5, 'v');
      b = x + 17;
      break;
    case 'omvormer': return omvormer(x0, metLeiding);
    case 'rolluikmotor':
    case 'poort': return motor({ opschrift: 'M' }, x0, metLeiding);
    case 'bel': return geluidsbron({ variant: 'bel' });
    case 'beltransfo': return transformator({}, x0, metLeiding);
    case 'warmtepomp': s += doos() + tekst(x + 9.5, 3.5, 'WP', 'm', 'middle'); break;
    case 'airco': s += doos() + tekst(x + 9.5, 3.5, 'AC', 'm', 'middle'); break;
    default: s += doos();
  }
  return res(s, b + 1, (x + b) / 2 - 0.5, -11, 11);
}

function toestel(item) {
  if (item.aansluiting === 'stopcontact') {
    // Toestel op een stopcontact: de contactdoos, met het toestel ernaast.
    const c = contactdoos({ aantal: 1, aarding: true, kinderveilig: true });
    const t = toestelSymbool(item.variant, c.b + 3, false);
    return { svg: c.svg + t.svg, b: t.b, midden: t.midden, boven: -11, onder: 11 };
  }
  return toestelSymbool(item.variant, 0, true);
}

function boiler(it, x0 = 0, metLeiding = true) {
  const c = x0 + (metLeiding ? 7 : 0) + 9;
  let s = metLeiding ? lijn(x0, 0, c - 9, 0) : '';
  const r = it.accumulatie ? 6.5 : 9;
  if (it.accumulatie) s += cirkel(c, 0, 9);
  s += cirkel(c, 0, r);
  const stap = r / 3.6;
  for (let dx = -r + stap; dx < r - 0.1; dx += stap) {
    const h = Math.sqrt(Math.max(0, r * r - dx * dx));
    s += lijn(c + dx, -h, c + dx, h);
  }
  return res(s, c + 10, c, -10, 10);
}

function verwarmingstoestel(it, x0 = 0, metLeiding = true) {
  const x = x0 + (metLeiding ? 7 : 0);
  let s = metLeiding ? lijn(x0, 0, x, 0) : '';
  const raster = (bx, by, b, h) => {
    let t = rechthoek(bx, by, b, h);
    for (let i = 2.4; i < b - 0.5; i += 2.4) t += lijn(bx + i, by, bx + i, by + h);
    return t;
  };
  if (it.ventilator) {
    s += rechthoek(x, -10, 34, 20, 'l half') + raster(x + 3, -5, 13, 10) + cirkel(x + 22, 0, 3.4) + cirkel(x + 29, 0, 3.4);
    return res(s, x + 35, x + 17, -11, 11);
  }
  if (it.accumulatie) return res(s + rechthoek(x, -10, 32, 20, 'l half') + raster(x + 3, -7, 26, 14), x + 33, x + 16, -11, 11);
  return res(s + raster(x, -10, 32, 20), x + 33, x + 16, -11, 11);
}

function ketel(it) {
  let s = lijn(0, 0, 8, 0) + rechthoek(8, -11, 22, 22, 'l half');
  const cx = 19;
  switch (it.energie) {
    case 'elektriciteit': s += pad(`M${cx + 1} 1.5 L${cx - 2} 5.5 H${cx + 2} L${cx - 1} 9.5`) + puntje(cx - 1, 9.5, 120, 1.8); break;
    case 'gasVentilator': s += pad(`M${cx - 4} 9 H${cx + 4} L${cx} 2 Z`, 'v'); break;
    case 'gasAtmosferisch': s += pad(`M${cx - 4} 9 H${cx + 4} L${cx} 2 Z`); break;
    case 'vloeibaar': s += stip(cx, 5.5, 3.6); break;
    case 'vast': s += rechthoek(cx - 3.5, 2, 7, 7, 'v'); break;
  }
  switch (it.variant) {
    case 'boiler': s += rechthoek(cx - 5, -8.5, 10, 4); break;
    case 'tapspiraal': s += pad('M30 -11 L8 -6 L30 -1'); break;
    case 'warmtewisselaar': s += pad(`M${cx - 7} -15 V-11 L${cx - 4} -2 L${cx} -8 L${cx + 4} -2 L${cx + 7} -11 V-15`); break;
    case 'wkk': s += cirkel(cx, -6, 3.6) + tekst(cx, -4, 'G', 'm', 'middle'); break;
  }
  const functie = { verwarmend: '+', koelend: '-', beide: '+/-' }[it.functie];
  if (functie) s += tekst(it.energie && it.energie !== 'onbepaald' ? cx + 7 : cx, 8, functie, 'm', 'middle');
  return res(s, 31, cx, it.variant === 'warmtewisselaar' ? -16 : -12, 12);
}

function motor(it, x0 = 0, metLeiding = true) {
  const c = x0 + (metLeiding ? 8 : 0) + 8;
  return res((metLeiding ? lijn(x0, 0, c - 8, 0) : '') + cirkel(c, 0, 8) + tekst(c, 3.5, it.opschrift || 'M', 'b', 'middle'), c + 9, c, -9, 9);
}

function pomp() {
  return res(lijn(0, 0, 8, 0) + cirkel(15.5, 0, 7.5) + pad('M12.5 -5.5 L12.5 5.5 L21.5 0 Z', 'v'), 24, 15.5, -9, 9);
}

function ventiel(it) {
  let s = lijn(0, 0, 11, 0) + cirkel(16, 0, 5);
  if (it.motor) s += tekst(16, 3, 'M', 'm', 'middle');
  s += lijn(16, 5, 16, 10) + pad('M8 5 L24 15 V5 L8 15 Z');
  return res(s, 25, 16, -7, 16);
}

function omvormer(x0 = 0, metLeiding = true) {
  const x = x0 + (metLeiding ? 8 : 0);
  return res((metLeiding ? lijn(x0, 0, x, 0) : '') + rechthoek(x, -8, 26, 16) + lijn(x + 9, 6, x + 17, -6)
    + tekst(x + 2, -2.5, 'AC', 'm') + tekst(x + 24, 6, 'DC', 'm', 'end'), x + 27, x + 13, -10, 10);
}

function transformator(it, x0 = 0, metLeiding = true) {
  const x = x0 + (metLeiding ? 8 : 0);
  let s = metLeiding ? lijn(x0, 0, x, 0) : '';
  const a = x + 7;
  const c = x + 14;
  s += cirkel(a, 0, 6) + cirkel(c, 0, 6);
  if (it.bescherming) s += lijn((a + c) / 2, -9, (a + c) / 2, 9);
  let b = c + 7;
  if (it.kortsluitvast) {
    s += rechthoek(c + 6, -2.5, 2.6, 5);
    b = c + 9;
  }
  if (it.veiligheid === 'open' || it.veiligheid === 'gesloten') {
    s += pad(`M${x} -8.5 H${c + 3} Q${c + 10} -8.5 ${c + 13} 0 Q${c + 10} 8.5 ${c + 3} 8.5 H${x}${it.veiligheid === 'gesloten' ? ' Z' : ''}`);
    b = c + 14;
  }
  if (it.opschrift) s += tekst((a + c) / 2, -11, it.opschrift, 'k', 'middle');
  return res(s, b, (a + c) / 2, it.opschrift ? -20 : -10, 10);
}

function zonnepaneel(it) {
  if (it.gestandaardiseerd) return res(lijn(0, 0, 6, 0) + rechthoek(6, -7, 26, 14) + pad('M9 -5 L17 0 L9 5'), 33, 19, -9, 9);
  let s = lijn(0, 0, 10, 0) + pad('M8 6 L15 -4 H38 L31 6 Z');
  for (const x of [17, 23, 29]) s += lijn(x - 3, 3, x + 3, -1.5);
  s += lijn(14, 1, 33, 1, 'l dun');
  s += cirkel(23, -13, 3.2);
  for (const h of [0, 45, 90, 135, 180, 225, 270, 315]) {
    const [ax, ay] = punt(23, -13, h, 4.6);
    const [bx, by] = punt(23, -13, h, 6.6);
    s += lijn(ax, ay, bx, by);
  }
  return res(s, 39, 23, -21, 8);
}

function teller(it) {
  return res(lijn(0, 0, 8, 0) + rechthoek(8, -10, 22, 20) + lijn(8, -4, 30, -4) + tekst(19, 6, it.opschrift || 'kWh', 'k', 'middle'), 31, 19, -11, 11);
}

function toestelKlein(it) {
  return res(lijn(0, 0, 8, 0) + rechthoek(8, -5.5, 22, 11) + (it.opschrift ? tekst(19, 3.5, it.opschrift, 'k', 'middle') : ''), 31, 19, -7, 7);
}

// ---------- Sturing ----------

function relais(it) {
  let s = lijn(0, 0, 8, 0) + rechthoek(8, -6, 26, 12);
  let onder = 8;
  switch (it.variant) {
    case 'relais': s += lijn(13, -6, 29, 6); break;
    case 'dimmer': s += pad('M15 3 H27 L15 -2.5 Z') + tekst(21, 15, 'Dimmer', 'm', 'middle'); onder = 17; break;
    case 'thermostaat': s += cirkel(21, 0, 4) + lijn(17, 0, 25, 0); break;
    case 'impuls': s += pad('M12 3 H17 V-3 M25 -3 V3 H30') + tekst(21, 15, 'Impuls', 'm', 'middle'); onder = 17; break;
    case 'tijd': s += klok(14, 0, 3.6) + lijn(18, 0, 20, 0) + lijn(20.5, 0, 27, -3.5) + lijn(28, 0, 31, 0); break;
    case 'minuterie': s += tekst(21, 3.5, 't', 'k', 'middle'); break;
  }
  return res(s, 35, 21, -8, onder);
}

function domotica(it) {
  const uit = String(it.uitgangen || '').split(',').map((u) => u.trim()).filter(Boolean);
  const naamLengte = String(it.module || '').length * 4.2 + 8; // gedraaide tekst in het kader
  const h = Math.max(28, uit.length * 13 + 6, naamLengte);
  let s = lijn(0, 0, 8, 0) + rechthoek(8, -h / 2, 14, h, 'l dik');
  if (it.module) s += `<text class="m" transform="translate(16.5 0) rotate(90)" text-anchor="middle" dominant-baseline="central">${esc(it.module)}</text>`;
  uit.forEach((u, i) => {
    const y = -h / 2 + 9 + i * 13;
    s += lijn(22, y, 38, y) + tekst(23, y - 2, u, 'm');
  });
  return res(s, uit.length ? 39 : 23, 15, -h / 2 - 2, h / 2 + 2);
}

// ---------- Beveiliging ----------

/** Automatische schakelaar als onderdeel: liggend schakelmes met blokje, opschriften eronder. */
function automaatItem(it) {
  let s = lijn(0, 0, 12, 0);
  const regels = [];
  const polen = Number(it.polen) || 0;
  const stroom = Number(it.stroom) || 0;
  switch (it.variant) {
    case 'contact': s += lijn(12, 0, 24, -6); break;
    case 'schemer': s += lijn(12, 0, 24, -6) + pijl(13, -15, 10, -10, 1.8) + pijl(17, -15, 14, -10, 1.8); break;
    case 'draai': s += lijn(12, 0, 24, -6) + cirkel(27, 0, 2.4); break;
    case 'zekeringscheider': s += `<g transform="rotate(-27 12 0)">${rechthoek(13, -2.2, 12, 4.4)}${lijn(12, 0, 26, 0)}</g>`; break;
    default:
      if (it.gesloten) s += lijn(12, 0, 24, 6) + lijn(24, 6, 24, 0);
      else s += lijn(12, 0, 24, -6) + lijn(22.5, -5.2, 26, -7, 'l blok');
  }
  if (it.variant !== 'draai') s += lijn(it.gesloten ? 24 : 26, 0, 36, 0);
  else s += lijn(29.4, 0, 36, 0);
  if (it.selectief) s += rechthoek(27, -12, 6, 6) + tekst(30, -7.4, 'S', 'm', 'middle');
  const gev = Number(it.gevoeligheid) || 0;
  if (gev) regels.push(`Δ${gev}mA`);
  const delen = [];
  if (polen) delen.push(`${polen}P`);
  if (stroom) delen.push(`${it.maxstroom ? 'M' : ''}${it.curve ? `${it.curve} ` : ''}${stroom}${it.eenheid || 'A'}`);
  if (delen.length) regels.push(delen.join(' - '));
  if (Number(it.kortsluit)) regels.push(`${it.kortsluit}kA`);
  regels.forEach((r, i) => { s += tekst(19, 11 + i * 10, r, 'k', 'middle'); });
  if (it.fase) s += tekst(2, -3, it.fase, 'm');
  return res(s, 37, 19, it.selectief || it.variant === 'schemer' ? -16 : -9, 4 + regels.length * 10);
}

function smeltveiligheid(it) {
  let s = lijn(0, 0, 36, 0) + rechthoek(9, -4.5, 19, 9);
  const delen = [];
  if (Number(it.polen)) delen.push(`${it.polen}P`);
  if (Number(it.stroom)) delen.push(`${it.stroom}${it.eenheid || 'A'}`);
  const regels = [it.opschrift, delen.join(' - ')].filter(Boolean);
  regels.forEach((r, i) => { s += tekst(18.5, 15 + i * 10, r, 'k', 'middle'); });
  if (it.fase) s += tekst(2, -3, it.fase, 'm');
  return res(s, 37, 18.5, -6, 6 + regels.length * 10);
}

function overspanning(it) {
  let s = lijn(0, 0, 32, 0) + rechthoek(12.5, -9, 7, 18) + pijl(16, -7.5, 16, -1.8, 1.7) + pijl(16, 7.5, 16, 1.8, 1.7);
  if (it.opschrift) s += tekst(16, -12, it.opschrift, 'k', 'middle');
  return res(s, 33, 16, it.opschrift ? -22 : -11, 11);
}

// ---------- Algemeen ----------

function aansluitpunt(it) {
  let s = lijn(0, 0, 13, 0) + cirkel(16, 0, 3);
  if (it.opschrift) s += tekst(16, 13, it.opschrift, 'k', 'middle');
  return res(s, 20, 16, -5, it.opschrift ? 15 : 5);
}

function aarding(it) {
  let s = lijn(0, 0, 14, 0) + lijn(14, 0, 14, 8) + lijn(7, 8, 21, 8) + lijn(9.5, 11, 18.5, 11) + lijn(12, 14, 16, 14);
  if (it.opschrift) s += tekst(23, 12, it.opschrift, 'k');
  return res(s, it.opschrift ? 24 + it.opschrift.length * 5 : 22, 14, -3, 16);
}

function aardingsstrip() {
  return res(lijn(0, 0, 9, 0) + lijn(9, -6, 9, 6) + lijn(12, -6, 12, 6) + lijn(12, 0, 20, 0), 21, 10.5, -8, 8);
}

function aftakdoos() {
  return res(lijn(0, 0, 6, 0) + cirkel(14, 0, 8) + stip(14, 0, 3.6), 23, 14, -9, 9);
}

function nota(it) {
  const grootte = { 1: 'k', 2: 'b', 3: 'groot' }[it.grootte] || 'b';
  const t = it.opschrift || 'Nota';
  return res(lijn(0, 0, 4, 0) + tekst(6, 4, t, grootte), 8 + t.length * (it.grootte === 3 ? 8 : 5.6), 10, -10, 6);
}

// ---------- Overzicht ----------

/** Een eigen (geïmporteerd) symbool: een afbeelding, op de gevraagde breedte (1 mm op papier is ongeveer 3,6 eenheden). */
function eigen(it) {
  const b = Math.max(8, (Number(it.breedteMm) || 10) * 3.6);
  const h = b * (Number(it.verhouding) || 1);
  const s = lijn(0, 0, 5, 0) + (it.afb ? `<image href="${esc(it.afb)}" x="5" y="${r1(-h / 2)}" width="${r1(b)}" height="${r1(h)}" preserveAspectRatio="xMidYMid meet"/>` : rechthoek(5, -h / 2, b, h));
  return res(s, b + 7, 5 + b / 2, -h / 2 - 2, h / 2 + 2);
}

const TEKENAARS = {
  eigen,
  stopcontact: contactdoos, communicatie, lichtpunt, voorschakelapparaat, schakelaar, drukknop,
  bewegingsdetector, bewegingsdetectorActief, beveiligingscontact, beveiliging, branddetector, camera, trillingsdetector,
  slot, deurslot, geluidsbron, intercom, kiezer, luidspreker, microfoon, monitor,
  toestel, boiler: (it) => boiler(it), verwarmingstoestel: (it) => verwarmingstoestel(it), ketel, motor: (it) => motor(it), pomp, ventiel,
  omvormer: () => omvormer(), transformator: (it) => transformator(it), zonnepaneel, teller, toestelKlein,
  relais, domotica, automaat: automaatItem, smeltveiligheid, overspanning,
  aansluitpunt, aarding, aardingsstrip, aftakdoos, nota,
  batterij: (it) => trikkerEendraadSymbool(it), touchscreen: (it) => trikkerEendraadSymbool(it),
};

export function symbool(item) {
  const teken = TEKENAARS[item.soort];
  return teken ? teken(item) : res(rechthoek(6, -8, 16, 16) + lijn(0, 0, 6, 0), 23, 14);
}

/** Het verdeelbord op het situatieschema, zoals Trikker het tekent (VerdeelbordGrondplan). */
export function bordSymbool() {
  return trikkerBordSymbool();
}

// ---------- Bord ----------

/**
 * Automatische schakelaar (en differentieel) op een verticale lijn, van y tot y + 32:
 * het schakelmes vertrekt aan het onderste contact, schuin naar links boven, met het blokje aan het uiteinde.
 */
export function automaatSymbool(x, y) {
  const ex = x - 7;
  const ey = y + 12;
  const lengte = Math.hypot(7, 12);
  const ux = -7 / lengte;
  const uy = -12 / lengte;
  return lijn(x, y, x, y + 9)
    + lijn(x, y + 32, x, y + 24) + lijn(x, y + 24, ex, ey)
    + lijn(ex, ey, ex + ux * 3.8, ey + uy * 3.8, 'l blok');
}

/** Differentieelstroombeschermingsinrichting: zelfde teken, met de opschriften ernaast. */
export const diffSymbool = automaatSymbool;

/** Hetzelfde teken liggend, van x tot x + 32, met het mes naar boven. */
export function diffLiggend(x, y) {
  return `<g transform="matrix(0 1 1 0 ${x} ${y})">${automaatSymbool(0, 0)}</g>`;
}

/** Aardelektrode, aarding. */
export function aardeSymbool(x, y) {
  return lijn(x, y, x, y + 12) + lijn(x - 10, y + 12, x + 10, y + 12) + lijn(x - 6.5, y + 16, x + 6.5, y + 16) + lijn(x - 3, y + 20, x + 3, y + 20);
}

/** Aardingsonderbreker (meetklem) op een verticale lijn, rond (x, y). */
export function aardingsonderbreker(x, y) {
  return lijn(x - 7, y - 1.6, x + 7, y - 1.6) + lijn(x - 7, y + 1.6, x + 7, y + 1.6);
}

/** Ondergrondse leiding (aansluiting van het net). */
export function ondergronds(x, y) {
  return lijn(x, y, x + 12, y) + lijn(x + 1.5, y - 4, x + 10.5, y - 4) + lijn(x + 3, y - 8, x + 9, y - 8);
}

/** kWh-teller: rechthoek met een band bovenaan en "kWh". */
export function tellerSymbool(x, y) {
  return rechthoek(x, y - 13, 32, 26) + lijn(x, y - 6, x + 32, y - 6) + tekst(x + 16, y + 6, 'kWh', 'k', 'middle');
}

/**
 * Het symbool zonder zijn aanvoerleiding, om het op de kringlijn zelf te zetten ("evenwijdig op de leiding").
 * Geeft ook terug waar het eigenlijke teken begint.
 */
export function zonderLeiding(s) {
  const m = s.svg.match(/^<line class="l" x1="0" y1="0" x2="([\d.]+)" y2="0"\/>/);
  return m ? { ...s, svg: s.svg.slice(m[0].length), begin: Number(m[1]) } : { ...s, begin: 0 };
}

/** Soorten die op het plan hun korte steeltje houden (de contactdoos, zoals in Trikker). */
const MET_STEEL = new Set(['stopcontact', 'communicatie']);

/**
 * Het symbool zoals Trikker het op het situatieschema tekent: zonder de aanvoerleiding van het ééndraadschema.
 * Een lamp is enkel het kruisje, een schakelaar het rondje met de hefboom; een contactdoos houdt een kort steeltje.
 */
export function planSymbool(item) {
  const trikker = trikkerSymbool(item);
  if (trikker) return trikker;
  const s = symbool(item);
  const z = zonderLeiding(s);
  if (!z.begin) return s;
  const steel = MET_STEEL.has(item.soort) ? Math.min(3.5, z.begin) : 0;
  const verschil = z.begin - steel;
  const svg = `${steel ? `<line class="l" x1="0" y1="0" x2="${steel}" y2="0"/>` : ''}<g transform="translate(${-verschil} 0)">${z.svg}</g>`;
  return { ...s, svg, b: s.b - verschil, midden: (s.midden ?? 0) - verschil, door: (s.door ?? s.b) - verschil };
}

/**
 * Plaatsing van een leiding (AREI C), zoals Trikker het tekent. De leiding loopt liggend langs y, de tekens staan erboven:
 * op een wand een "Ш" (de balk tegen de leiding), in een wand een "m" (de balk aan de buitenkant), een luchtleiding een cirkel
 * op de leiding, ondergronds drie streepjes en in een buis een cirkel boven de leiding.
 */
export function plaatsingTeken(x, y, plaatsing) {
  const dicht = y - 2.2; // de kant van het teken die het dichtst bij de leiding staat
  const ver = y - 7.8;
  const kam = (balk, poten) => pad(`M${r1(x - 4.5)} ${r1(poten)} V${r1(balk)} H${r1(x + 4.5)} V${r1(poten)} M${r1(x)} ${r1(balk)} V${r1(poten)}`);
  switch (plaatsing) {
    case 'opWand': return kam(dicht, ver);
    case 'inWand': return kam(ver, dicht);
    case 'lucht': return cirkel(x, y, 2.8);
    case 'buis': return cirkel(x, y - 4.8, 2.8);
    case 'ondergronds': return lijn(x - 4.75, ver, x + 4.75, ver) + lijn(x - 3.8, y - 5, x + 3.8, y - 5) + lijn(x - 2.8, dicht, x + 2.8, dicht);
    default: return '';
  }
}

/** Een klein voorbeeld van een symbool, voor knoppen, lijsten en de legende. */
export function icoon(item, grootte = 28) {
  const s = item === 'bord' ? bordSymbool() : symbool(item);
  const boven = Math.min(-13, (s.boven ?? -13) - 2);
  const onder = Math.max(13, (s.onder ?? 13) + 2);
  const hoogte = onder - boven;
  const breedte = Math.max(s.b + 4, 24);
  const schaal = grootte / 26;
  return `<svg class="icoon" viewBox="-2 ${boven} ${breedte} ${hoogte}" width="${Math.round(breedte * schaal)}" height="${Math.round(hoogte * schaal)}" aria-hidden="true">${s.svg}</svg>`;
}

