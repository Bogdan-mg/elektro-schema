// De symbolen volgens het AREI (Boek 1, hoofdstuk 2.13, tabel 2.23 "Grafische symbolen"), als SVG-tekst.
// Elk onderdeelsymbool begint op x = 0, waar de leiding van links aankomt, op hoogte y = 0.
// boven/onder geven aan hoe ver een symbool boven en onder die lijn komt.

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;

export const lijn = (x1, y1, x2, y2, klasse = 'l') => `<line class="${klasse}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
export const tekst = (x, y, t, klasse = 'k', anker = 'start') =>
  `<text class="${klasse}" x="${r1(x)}" y="${r1(y)}"${anker !== 'start' ? ` text-anchor="${anker}"` : ''}>${esc(t)}</text>`;
const rechthoek = (x, y, b, h, klasse = 'l') => `<rect class="${klasse}" x="${r1(x)}" y="${r1(y)}" width="${r1(b)}" height="${r1(h)}"/>`;
const cirkel = (x, y, r, klasse = 'l') => `<circle class="${klasse}" cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"/>`;
const pad = (d, klasse = 'l') => `<path class="${klasse}" d="${d}"/>`;
const stip = (x, y, r = 1.7) => cirkel(x, y, r, 'v');
const kruis = (cx, cy, h) => lijn(cx - h, cy - h, cx + h, cy + h) + lijn(cx - h, cy + h, cx + h, cy - h);

/** Punt op een hoek (in graden, tegen de klok in, 0 = rechts) en afstand van een middelpunt. */
function punt(cx, cy, hoek, afstand) {
  const a = (hoek * Math.PI) / 180;
  return [cx + Math.cos(a) * afstand, cy - Math.sin(a) * afstand];
}

// ---------- F. Contactdozen ----------

/**
 * Contactdoos: de leiding komt van links, draait naar beneden en eindigt in een halve cirkel die naar onder open is.
 * Aarding (contact voor beschermingsgeleider): streep over de top. Kinderbescherming: voetjes onderaan.
 * Meervoudig: de halve cirkels onder elkaar; vanaf 4 één halve cirkel met het aantal erbij.
 */
function contactdoos({ aantal = 1, aarding = true, kinderveilig = true, waterdicht = false }) {
  const n = Math.max(1, Math.min(9, Number(aantal) || 1));
  const r = 5;
  const sx = 4 * r; // aanvoerleiding: twee keer de breedte van de boog, zoals op de AREI-plaat
  // Enkel: steel van twee stralen. Meervoudig: de bogen op 1,33 straal van elkaar op een doorlopende steel.
  const toppen = n === 1 ? [1.8 * r] : n <= 3 ? Array.from({ length: n }, (_, i) => 1.75 * r + i * 1.33 * r) : [2 * r];
  let s = lijn(0, 0, sx, 0) + lijn(sx, 0, sx, toppen.at(-1));
  for (const t of toppen) {
    s += pad(`M${sx - r} ${r1(t + r)} A${r} ${r} 0 0 1 ${sx + r} ${r1(t + r)}`);
    if (aarding) s += lijn(sx - r - 0.8, t, sx + r + 0.8, t);
    if (kinderveilig) s += lijn(sx - r - 2.5, t + r, sx - r, t + r) + lijn(sx + r, t + r, sx + r + 2.5, t + r);
  }
  let b = sx + r + 3;
  if (n > 3) {
    // Meervoudige contactdoos in het kort: één boog met het aantal en een schuin streepje.
    const t = toppen[0];
    s += lijn(sx + r - 2.2, t + r - 0.2, sx + r + 1.2, t + r - 3.2) + lijn(sx + r - 2.2, t + r - 3.2, sx + r + 1.2, t + r - 0.2)
      + tekst(sx + r + 2, t - 1, String(n), 'b');
    b += 6;
  }
  if (waterdicht) {
    s += tekst(sx + 2.5, toppen[0] - 1.5, 'h', 'b');
    b = Math.max(b, sx + 9);
  }
  return { svg: s, b, boven: -1, onder: toppen.at(-1) + r + 1 };
}

// ---------- E. Schakelaars ----------

/**
 * Schakelaar: een cirkeltje met een hendel; elk streepje aan het uiteinde is een pool.
 * Wissel: hendels naar twee kanten. Kruis: twee hendels door elkaar. Omschakelaar (serie): twee hendels in een V.
 */
function schakelaar(item) {
  // Hendels die naar links wijzen hebben meer leiding nodig, zodat ze de kringlijn niet raken.
  const cx = { wissel: 14, kruis: 14, serie: 11, rolluik: 11 }[item.variant] || 8;
  const rx = 3.8; // het lichaam is een licht ovaal
  const ry = 3.4;
  const lang = 3.6 + 10.5; // vanaf het midden: rand + hendel
  let s = '';
  const hendel = (hoek, streepjes, kant) => {
    const [x1, y1] = punt(cx, 0, hoek, 3.5);
    const [x2, y2] = punt(cx, 0, hoek, lang);
    let t = lijn(x1, y1, x2, y2);
    const boven = Math.sin((hoek * Math.PI) / 180) > 0;
    for (let i = 0; i < streepjes; i++) {
      const [px, py] = punt(cx, 0, hoek, lang - i * 2.6);
      // Het streepje wijst naar buiten en een beetje van het uiteinde weg (22°), zoals op de AREI-plaat.
      t += lijn(px, py, px + kant * 4.9, py + (boven ? 2 : -2));
    }
    return t;
  };
  const rond = () => lijn(0, 0, cx - rx, 0) + `<ellipse class="l" cx="${cx}" cy="0" rx="${rx}" ry="${ry}"/>`;
  let b = cx + 12;
  switch (item.variant) {
    case 'tweepolig': s += rond() + hendel(67, 2, 1); break;
    case 'wissel': s += rond() + hendel(68, 1, 1) + hendel(248, 1, -1); break;
    case 'kruis': s += rond() + hendel(68, 1, 1) + hendel(112, 1, -1) + hendel(248, 1, -1) + hendel(292, 1, 1); break;
    case 'serie': s += rond() + hendel(70, 1, 1) + hendel(110, 1, -1); break;
    case 'dimmer': {
      // Dimmer: de hendel door een driehoekje met de punt naar links.
      s += rond() + hendel(69, 0, 1);
      const [mx, my] = punt(cx, 0, 69, 3.6 + 6.5);
      s += pad(`M${r1(mx - 4.8)} ${r1(my + 0.2)} L${r1(mx + 6.6)} ${r1(my - 2.9)} L${r1(mx + 6.6)} ${r1(my + 2.9)} Z`);
      b = cx + 17;
      break;
    }
    case 'drukknop': s += lijn(0, 0, 3, 0) + cirkel(10, 0, 7) + cirkel(10, 0, 2.6); b = 18; break;
    case 'bewegingsmelder':
      s += lijn(0, 0, 3, 0) + rechthoek(3, -11, 18, 22) + lijn(3, 5, 21, 5) + tekst(12, 1, '))', 'b', 'middle') + tekst(12, 10.5, 'IR', 'm', 'middle');
      b = 22;
      break;
    case 'rolluik':
      // Geen apart AREI-symbool: een omschakelaar, met pijltjes voor op en neer.
      s += rond() + hendel(70, 1, 1) + hendel(110, 1, -1) + pad(`M${cx + 12} 2 l3 4 h-6 Z M${cx + 12} 12 l3 -4 h-6 Z`, 'v');
      b = cx + 16;
      break;
    default: s += rond() + hendel(67, 1, 1);
  }
  if (item.aantal > 1) s += tekst(b + 1, 11, `×${item.aantal}`, 'm');
  if (item.waterdicht) s += tekst(cx + 5, 12, 'h', 'b');
  return { svg: s, b: b + (item.aantal > 1 ? 8 : 0) };
}

// ---------- G. Verlichting ----------

/** Fluorescentieverlichting: een dikke lijn met dikke eindstreepjes. */
const tl = (x) => lijn(x, -4, x, 4, 'l half') + lijn(x, 0, x + 24, 0, 'l half') + lijn(x + 24, -4, x + 24, 4, 'l half');

function lichtpunt(item) {
  let s = '';
  let b = 20;
  switch (item.variant) {
    case 'wand': s += lijn(0, 0, 12, 0) + kruis(12, 0, 6) + lijn(22.5, -12.5, 22.5, 12.5); b = 23; break;
    case 'spot': {
      // Projector: lichtpunt in een cirkel met een boog erachter.
      s += lijn(0, 0, 5.4, 0) + cirkel(15, 0, 6) + kruis(15, 0, 4.2) + pad('M15 -9.6 A9.6 9.6 0 0 0 15 9.6');
      b = 21;
      break;
    }
    case 'ledstrip': s += lijn(0, 0, 3, 0) + tl(3) + tekst(15, -6.5, 'LED', 'm', 'middle'); b = 27; break;
    case 'tl': s += lijn(0, 0, 3, 0) + tl(3); b = 27; break;
    case 'buiten': s += lijn(0, 0, 20, 0) + kruis(20, 0, 6) + tekst(27, -3, 'h', 'b'); b = 33; break;
    case 'nood': s += lijn(0, 0, 4, 0) + rechthoek(4, -9, 18, 18, 'l dik') + kruis(13, 0, 6) + stip(13, 0, 1.8); b = 22; break;
    default: s += lijn(0, 0, 20, 0) + kruis(20, 0, 6); b = 26;
  }
  if (item.aantal > 1) s += tekst(b + 1, -6, `×${item.aantal}`, 'm');
  return { svg: s, b: b + (item.aantal > 1 ? 8 : 0) };
}

// ---------- G. Gebruikstoestellen ----------

/** Sneeuwvlok: zes armen met een V aan elk uiteinde. */
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

/** Het symbool van een toestel, met de leiding van links als metLeiding. */
function toestelSymbool(variant, x0, metLeiding) {
  const x = x0 + (metLeiding ? 5 : 0);
  let s = metLeiding ? lijn(x0, 0, x, 0) : '';
  let b = x + 18;
  const doos = () => rechthoek(x, -9, 18, 18);
  switch (variant) {
    case 'kookplaat': s += doos() + stip(x + 4.7, -4.5, 2.3) + stip(x + 13.3, -4.5, 2.3) + stip(x + 13.3, 4.3, 2.3); break;
    case 'microgolf':
      s += doos() + [-4.5, 0, 4.5].map((dy) => pad(`M${x + 5} ${dy + 1} q2 -3 4 0 t4 0`)).join('');
      break;
    case 'oven': s += doos() + lijn(x, -6.3, x + 18, -6.3) + stip(x + 9, 2.7, 2.3); break;
    case 'wasmachine': s += doos() + `<ellipse class="l" cx="${x + 9}" cy="0" rx="6.4" ry="7"/>` + stip(x + 9, 0, 2.3); break;
    case 'droogkast': s += doos() + cirkel(x + 6.8, -3.8, 2.2) + cirkel(x + 11.2, -3.8, 2.2) + stip(x + 9, 3.8, 2.2); break;
    case 'vaatwasser': s += doos() + lijn(x, -9, x + 18, 9) + lijn(x, 9, x + 18, -9) + cirkel(x + 9, 0, 3.5, 'l w'); break;
    case 'koelkast': s += doos() + sneeuwvlok(x + 9, 0, 6.5); break;
    case 'diepvries':
      s += rechthoek(x, -8, 30, 16) + sneeuwvlok(x + 6, 0, 4) + sneeuwvlok(x + 15, 0, 4) + sneeuwvlok(x + 24, 0, 4);
      b = x + 30;
      break;
    case 'dampkap':
    case 'ventilatie': s += doos() + cirkel(x + 5.5, 0, 3) + cirkel(x + 12.5, 0, 3); break;
    case 'boiler': {
      s += cirkel(x + 9, 0, 9);
      for (const dx of [-6.75, -4.5, -2.25, 0, 2.25, 4.5, 6.75]) {
        const h = Math.sqrt(81 - dx * dx);
        s += lijn(x + 9 + dx, -h, x + 9 + dx, h);
      }
      break;
    }
    case 'verwarming': {
      s += rechthoek(x, -7, 20, 14);
      for (let i = 3; i < 20; i += 3) s += lijn(x + i, -7, x + i, 7);
      b = x + 20;
      break;
    }
    case 'laadpaal':
      s += rechthoek(x, -11, 13, 21) + rechthoek(x + 2, -9, 9, 5) + tekst(x + 6.5, 6, 'VE', 'm', 'middle')
        + lijn(x - 1, 10, x + 14, 10) + lijn(x + 13, -3, x + 16, -3) + lijn(x + 16, -3, x + 16, 6) + rechthoek(x + 15, -11, 2, 5, 'v');
      b = x + 17;
      break;
    case 'omvormer':
      // Omvormer DC -> AC: gelijkstroom (volle en stippellijn) linksboven, wisselstroom rechtsonder.
      s += doos() + lijn(x, 9, x + 18, -9) + lijn(x + 2.5, -6, x + 8, -6) + lijn(x + 2.5, -4, x + 8, -4, 'l stippel')
        + pad(`M${x + 10} 5 q1.5 -2.5 3 0 t3 0`);
      break;
    case 'rolluikmotor':
    case 'poort': s += cirkel(x + 9, 0, 9) + tekst(x + 9, 3.5, 'M', 'b', 'middle'); break;
    case 'bel': s = lijn(x0, 0, x0 + 8, 0) + lijn(x0 + 8, -7, x0 + 8, 7) + pad(`M${x0 + 8} -7 A7 7 0 0 1 ${x0 + 8} 7`); b = x0 + 15; break;
    case 'beltransfo': s += cirkel(x + 6, 0, 6) + cirkel(x + 13, 0, 6); b = x + 19; break;
    case 'warmtepomp': s += doos() + tekst(x + 9, 3.5, 'WP', 'm', 'middle'); break;
    case 'airco': s += doos() + tekst(x + 9, 3.5, 'AC', 'm', 'middle'); break;
    default: s += doos();
  }
  return { svg: s, b };
}

function toestel(item) {
  if (item.aansluiting === 'stopcontact') {
    // Toestel op een stopcontact: de contactdoos, met het toestel ernaast.
    const c = contactdoos({ aantal: 1, aarding: true, kinderveilig: true });
    const t = toestelSymbool(item.variant, c.b + 3, false);
    return { svg: c.svg + `<g transform="translate(0 11)">${t.svg}</g>`, b: t.b, boven: -2, onder: 22 };
  }
  return toestelSymbool(item.variant, 0, true);
}

// ---------- B. Dozen en bord ----------

function aftakdoos() {
  return { svg: lijn(0, 0, 3, 0) + cirkel(9, 0, 6) + stip(9, 0, 2.5), b: 15 };
}

export function symbool(item) {
  switch (item.soort) {
    case 'stopcontact': return contactdoos(item);
    case 'lichtpunt': return lichtpunt(item);
    case 'schakelaar': return schakelaar(item);
    case 'toestel': return toestel(item);
    case 'aftakdoos': return aftakdoos();
    default: return { svg: rechthoek(0, -8, 16, 16), b: 16 };
  }
}

/** Schakel- en verdeelbord (algemene voorstelling), voor op het situatieschema. */
export function bordSymbool() {
  return { svg: rechthoek(0, -7, 34, 14), b: 34 };
}

// ---------- D. Beschermingstoestellen ----------

/**
 * Automatische schakelaar (en differentieel, met andere opschriften) op een verticale lijn, van y tot y + 32:
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

/** Differentieelstroombeschermingsinrichting: zelfde teken, met In/ΔIn en type ernaast (zoals "40/0,3A type A"). */
export const diffSymbool = automaatSymbool;

/** Hetzelfde teken liggend op de hoofdlijn, van x tot x + 32, met het mes naar boven. */
export function diffLiggend(x, y) {
  return `<g transform="matrix(0 1 1 0 ${x} ${y})">${automaatSymbool(0, 0)}</g>`;
}

/** Aardelektrode, aarding. */
export function aardeSymbool(x, y) {
  return lijn(x, y, x, y + 12) + lijn(x - 10, y + 12, x + 10, y + 12) + lijn(x - 6.5, y + 16, x + 6.5, y + 16) + lijn(x - 3, y + 20, x + 3, y + 20);
}

/** kWh-teller: rechthoek met een band bovenaan en "kWh". */
export function tellerSymbool(x, y) {
  return rechthoek(x, y - 15, 40, 30) + lijn(x, y - 8, x + 40, y - 8) + tekst(x + 20, y + 7, 'kWh', 'b', 'middle');
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
