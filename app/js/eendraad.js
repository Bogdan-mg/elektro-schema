// Het ééndraadschema tekenen: hoofdbord links, kringen verticaal onder de verdeelbus.
import { NETTEN, kabelTekst, automaatTekst, itemKort, komma } from './catalogus.js';
import { codes } from './model.js';
import { symbool, automaatSymbool, diffSymbool, diffLiggend, aardeSymbool, lijn, tekst, esc } from './symbolen.js';

export const KOLOM = 130; // breedte per kring
export const STAP = 46; // hoogte per onderdeel
const LIJN = 18; // waar de kringlijn binnen de kolom staat
const Y0 = 70; // hoogte van de hoofdlijn
const START = 236; // waar de eerste kring begint
const KOP = 128; // hoogte van automaat + kringlabel

/** Tekst inkorten zodat hij in de kolom past (ruwe schatting van de letterbreedte). */
function kort(t, ruimte, letter = 5) {
  const max = Math.max(3, Math.floor(ruimte / letter));
  const s = String(t ?? '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/**
 * @returns {{ inhoud: string, breedte: number, hoogte: number, kolommen: {x0: number, x1: number}[] }}
 * inhoud is SVG zonder het <svg>-element zelf; kolommen zijn de plaatsen waar een blad mag eindigen.
 */
export function tekenEendraad(project, { selectie = null } = {}) {
  const code = codes(project);
  const doelen = [];
  const lijnen = [];
  const doel = (x, y, b, h, id) => doelen.push(
    `<rect class="doel${id === selectie ? ' gekozen' : ''}" data-id="${esc(id)}" x="${x}" y="${y}" width="${b}" height="${h}" rx="4"/>`,
  );

  function kring(k, x, y) {
    const lx = x + LIJN;
    const ruimte = x + KOLOM - (lx + 16);
    doel(x + 2, y + 8, KOLOM - 4, KOP - 22, k.id);
    lijnen.push(
      lijn(lx, y, lx, y + 18),
      automaatSymbool(lx, y + 18),
      tekst(lx + 12, y + 34, automaatTekst(k.automaat), 'b'),
      tekst(lx + 12, y + 46, `${k.automaat.polen}P`, 'k'),
      lijn(lx, y + 50, lx, y + 69),
      `<circle class="l" cx="${lx}" cy="${y + 80}" r="11"/>`,
      tekst(lx, y + 84, code.get(k.id), 'b', 'middle'),
      tekst(lx + 16, y + 78, kort(k.naam || 'Kring', ruimte, 6), 'b'),
      tekst(lx + 16, y + 90, kort(kabelTekst(k.kabel), ruimte), 'k'),
    );
    if (Number(k.kabel.lengte)) lijnen.push(tekst(lx + 16, y + 101, `${komma(k.kabel.lengte)} m`, 'k'));
    if (k.badkamer) lijnen.push(tekst(lx + 16, y + 112, 'badkamer', 'k'));

    const n = k.items.length;
    const y1 = y + KOP;
    if (n) lijnen.push(lijn(lx, y + 91, lx, y1 + (n - 1) * STAP));
    k.items.forEach((item, i) => {
      const iy = y1 + i * STAP;
      const s = symbool(item);
      const tx = lx + 8 + s.b + 6;
      doel(x + 2, iy - STAP / 2 + 2, KOLOM - 4, STAP - 4, item.id);
      lijnen.push(
        lijn(lx, iy, lx + 8, iy),
        `<g transform="translate(${lx + 8},${iy})">${s.svg}</g>`,
        tekst(tx, iy - 2, code.get(item.id), 'b'),
        tekst(tx, iy + 10, kort(itemKort(item), x + KOLOM - tx - 2), 'k'),
      );
    });
    return { breedte: KOLOM, hoogte: n ? KOP + (n - 1) * STAP + STAP / 2 : KOP - 10 };
  }

  function differentieel(d, x, y) {
    const lx = x + LIJN;
    doel(x + 2, y + 8, KOLOM - 4, 62, d.id);
    lijnen.push(
      lijn(lx, y, lx, y + 16),
      diffSymbool(lx, y + 16),
      tekst(lx + 20, y + 30, `${d.gevoeligheid} mA`, 'b'),
      tekst(lx + 20, y + 42, `${d.stroom} A · ${d.polen}P`, 'k'),
      tekst(lx + 20, y + 53, `type ${d.type}`, 'k'),
      lijn(lx, y + 60, lx, y + 80),
    );
    const by = y + 80;
    if (!d.kinderen.length) {
      lijnen.push(tekst(lx + 8, by + 14, '(nog leeg)', 'k'));
      return { breedte: KOLOM, hoogte: 100 };
    }
    let cx = x;
    let hoogte = 0;
    let laatste = lx;
    for (const kind of d.kinderen) {
      laatste = cx + LIJN;
      const r = teken(kind, cx, by);
      cx += r.breedte;
      hoogte = Math.max(hoogte, r.hoogte);
    }
    if (laatste > lx) lijnen.push(lijn(lx, by, laatste, by, 'l bus'));
    return { breedte: Math.max(KOLOM, cx - x), hoogte: 80 + hoogte };
  }

  const teken = (k, x, y) => (k.soort === 'differentieel' ? differentieel(k, x, y) : kring(k, x, y));

  // Hoofdbord: net, teller en hoofddifferentieel op de hoofdlijn.
  const { aansluiting, hoofd } = project;
  doel(8, Y0 - 48, START - 26, 128, 'hoofd');
  lijnen.push(
    tekst(20, Y0 - 34, NETTEN[aansluiting.net]?.naam || '', 'b'),
    tekst(20, Y0 - 22, `Hoofdzekering ${aansluiting.hoofdzekering} A`, 'k'),
    lijn(20, Y0, 60, Y0),
    `<rect class="l" x="60" y="${Y0 - 13}" width="40" height="26"/>`,
    tekst(80, Y0 + 4, 'kWh', 'b', 'middle'),
    lijn(100, Y0, 128, Y0),
    diffLiggend(150, Y0),
    tekst(128, Y0 + 28, `${hoofd.gevoeligheid} mA`, 'b'),
    tekst(128, Y0 + 40, `${hoofd.stroom} A · ${hoofd.polen}P · type ${hoofd.type}`, 'k'),
    aardeSymbool(40, Y0 + 30),
    tekst(54, Y0 + 50, 'Aarding', 'k'),
    tekst(54, Y0 + 61, Number(aansluiting.aardingsweerstand) ? `${komma(aansluiting.aardingsweerstand)} Ω` : '… Ω', 'k'),
  );

  const kolommen = [];
  let x = START;
  let hoogte = 0;
  let laatste = 172;
  for (const kind of project.kinderen) {
    laatste = x + LIJN;
    const r = teken(kind, x, Y0);
    kolommen.push({ x0: x, x1: x + r.breedte });
    x += r.breedte;
    hoogte = Math.max(hoogte, r.hoogte);
  }
  lijnen.push(lijn(172, Y0, Math.max(laatste, START + 10), Y0, 'l bus'));
  if (!project.kinderen.length) lijnen.push(tekst(START, Y0 + 24, 'Voeg een differentieel of kring toe', 'k'));

  return {
    inhoud: `<g class="doelen">${doelen.join('')}</g><g class="tekening">${lijnen.join('')}</g>`,
    breedte: Math.max(x, START + KOLOM) + 20,
    hoogte: Y0 + Math.max(hoogte, 100) + 20,
    kolommen,
  };
}

/** De stijl van de tekening, ook voor afdrukken. */
export const SCHEMA_STIJL = `
.l{fill:none;stroke:currentColor;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}
.l.dik{stroke-width:3}
.l.bus{stroke-width:2.6}
.v{fill:currentColor;stroke:none}
.b{font:600 10px "Segoe UI",Arial,sans-serif;fill:currentColor}
.k{font:9px "Segoe UI",Arial,sans-serif;fill:currentColor;opacity:.8}
.m{font:600 7px "Segoe UI",Arial,sans-serif;fill:currentColor}
.doel{fill:transparent;stroke:none;cursor:pointer}
.doel:hover{fill:rgba(37,99,235,.06)}
.doel.gekozen{fill:rgba(37,99,235,.13);stroke:rgba(37,99,235,.55);stroke-width:1}
`;
