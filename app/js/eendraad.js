// Het ééndraadschema tekenen zoals in Trikker: de hoofdverdeellijn onderaan met de voeding eronder,
// groepen (generaal zekering, differentiëlen) als ketting naar boven tot hun verdeellijn, en de kringen
// naar boven met hun onderdelen genummerd per rij, van onder naar boven.
import { NETTEN, kabelTekst, komma } from './catalogus.js';
import { codes, rijen } from './model.js';
import {
  symbool, zonderLeiding, plaatsingTeken, automaatSymbool, diffLiggend, aardeSymbool, aardingsonderbreker, ondergronds,
  tellerSymbool, lijn, tekst, esc,
} from './symbolen.js';

const LINKS = 32; // ruimte links van de kringlijn (nummers, kringletter, groepsnaam)
const STUB = 10; // leiding van de kringlijn naar het eerste symbool van een rij
const MIN_STAP = 34; // minimale afstand tussen twee rijen
const MAX_HOOGTE = 640; // daarboven gaat een kring verder in een kolom ernaast
const MIN_KOLOM = 84;
const VOEDING = 52; // hoogte van de voedingslijn onder de hoofdverdeellijn
const LETTERBREEDTE = 4.9;
const r1 = (n) => Math.round(n * 10) / 10;
const breedte = (t, per = LETTERBREEDTE) => String(t ?? '').length * per;

/** Onderdelen die als laatste van een kring op de kringlijn zelf komen ("evenwijdig"), zoals Trikker automatisch doet. */
const EVENWIJDIG = new Set(['toestel', 'ketel', 'boiler', 'verwarmingstoestel', 'motor', 'pomp', 'ventiel', 'aftakdoos', 'domotica',
  'toestelKlein', 'teller', 'omvormer', 'voorschakelapparaat', 'zonnepaneel', 'monitor', 'intercom']);

/** Tekst die van onder naar boven leest, met het begin op (x, y). */
const draai = (x, y, t, klasse = 'k', anker = 'start') =>
  `<text class="${klasse}" transform="translate(${r1(x)} ${r1(y)}) rotate(-90)"${anker !== 'start' ? ` text-anchor="${anker}"` : ''}>${esc(t)}</text>`;

/** Gedraaide tekst met een kader errond, zoals het onderbrekingsvermogen ("3000") bij een automaat. */
function kader(x, y, t) {
  const b = breedte(t, 5.2) + 3;
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(-90)"><rect class="l" x="-1.5" y="-8.4" width="${r1(b)}" height="10.4"/>`
    + `<text class="k" x="0" y="0">${esc(t)}</text></g>`;
}

/**
 * De opschriften naast een beveiliging, in kolommen die van onder naar boven lezen.
 * Elke kolom is een lijst van stukken: tekst, of { kader: '3000' }.
 */
function opschriften(b) {
  const polen = `${b.polen}P`;
  const onderbreking = Number(b.onderbreking) ? { kader: String(b.onderbreking) } : null;
  const diff = Number(b.gevoeligheid) ? `Type ${b.type || 'A'} - Δ${b.gevoeligheid}mA` : '';
  switch (b.beveiliging) {
    case 'differentieel':
      return [[diff], [onderbreking, `${polen} - ${b.stroom}A`]];
    case 'diffautomaat':
      return [[diff], [onderbreking, `${polen} - M${b.curve ? ` ${b.curve} ` : ''}${b.stroom}A`]];
    case 'geen':
      return [];
    default: // gewone automaat: geen differentieel
      return [[onderbreking, `${polen} - ${b.curve ? `${b.curve} ` : ''}${b.stroom}A`]];
  }
}

const stukLengte = (stuk) => (stuk?.kader ? breedte(stuk.kader, 5.2) + 6 : breedte(stuk));
const kolomLengte = (kolom) => kolom.filter(Boolean).reduce((som, s) => som + stukLengte(s) + 4, 0);

/** Teken de opschriften: kolommen rechts van de lijn op x, beginnend op y (onderaan). */
function tekenOpschriften(kolommen, x, y) {
  const uit = [];
  kolommen.forEach((kolom, i) => {
    let yy = y;
    const kx = x + 10 + i * 10.5;
    for (const stuk of kolom.filter(Boolean)) {
      uit.push(stuk.kader ? kader(kx, yy, stuk.kader) : draai(kx, yy, stuk));
      yy -= stukLengte(stuk) + 4;
    }
  });
  return uit.join('');
}

/**
 * @returns {{ inhoud: string, breedte: number, hoogte: number, kolommen: {x0: number, x1: number}[] }}
 * inhoud is SVG zonder het <svg>-element zelf; kolommen zijn de plaatsen waar een blad mag eindigen.
 */
export function tekenEendraad(project, { selectie = null } = {}) {
  const code = codes(project);
  const doelen = [];
  const lijnen = [];
  const snijpunten = [];
  let hoogste = -120; // kleinste y (de hoofdverdeellijn ligt op y = 0, naar boven is negatief)
  const doel = (x, y, b, h, id) => doelen.push(
    `<rect class="doel${id === selectie ? ' gekozen' : ''}" data-id="${esc(id)}" x="${r1(x)}" y="${r1(y)}" width="${r1(b)}" height="${r1(h)}" rx="4"/>`,
  );

  /** Een rij tekenen: de onderdelen na elkaar op één lijn, de leiding loopt door. */
  function rijMaat(rij) {
    const delen = rij.map((item) => ({ item, s: symbool(item) }));
    let x = 0;
    let boven = 0;
    let onder = 0;
    for (const d of delen) {
      d.x = x;
      const aantal = !d.item.eigenAantalTonen && d.item.soort !== 'stopcontact' && d.item.aantal > 1 ? `x${d.item.aantal}` : '';
      d.aantal = aantal;
      boven = Math.max(boven, -d.s.boven + (aantal ? 10 : 0));
      onder = Math.max(onder, d.s.onder + (d.item.adres ? breedte(d.item.adres, 5.2) + 8 : 0));
      x += d.s.door;
    }
    const laatste = delen.at(-1);
    const tekstje = rij.map((i) => i.tekst).filter(Boolean).join(', ');
    const b = laatste.x + laatste.s.b + (tekstje ? 8 + breedte(tekstje) : 0);
    return { delen, boven, onder, b, tekstje };
  }

  /** Een onderdeel op de kringlijn zelf (evenwijdig): zonder aanvoerleiding, gecentreerd op de lijn. */
  function inlineMaat(item) {
    const s = zonderLeiding(symbool(item));
    const lamp = item.soort === 'lichtpunt';
    // Het punt waar de kringlijn het symbool raakt, ten opzichte van y = 0 van het symbool.
    const anker = lamp ? 0 : s.onder - 1;
    return { s, anker, hoogte: anker - s.boven, lamp };
  }

  /** Plaats de rijen van een kring: posities, kolommen en breedte. */
  function schik(k, kop) {
    const alle = rijen(k);
    const kolommen = [{ rijen: [], breedte: MIN_KOLOM }];
    let y = -kop;
    let vorigeBoven = 0;
    alle.forEach((rij, i) => {
      const laatste = i === alle.length - 1;
      const item = rij[0];
      const plaatsing = item.plaatsing || 'auto';
      const evenwijdig = rij.length === 1 && (plaatsing === 'evenwijdig'
        || (plaatsing === 'auto' && laatste && EVENWIJDIG.has(item.soort) && !(item.soort === 'toestel' && item.aansluiting === 'stopcontact')));
      // Een toestel op een stopcontact als laatste: de contactdoos op een rij, het toestel bovenaan op de lijn.
      const toestelBoven = rij.length === 1 && laatste && plaatsing === 'auto' && item.soort === 'toestel' && item.aansluiting === 'stopcontact';
      let maat;
      if (evenwijdig) {
        const m = inlineMaat(item);
        maat = { inline: m, boven: m.hoogte + 4, onder: 4, b: m.s.b - m.s.begin + 12 + (item.tekst ? 8 + breedte(item.tekst) : 0) };
      } else {
        const rijItems = toestelBoven ? [{ ...item, soort: 'stopcontact', aantal: 1, aarding: true, kinderveilig: true }] : rij;
        maat = rijMaat(rijItems);
        maat.echt = rij;
        if (toestelBoven) {
          maat.bovenToestel = inlineMaat({ ...item, aansluiting: 'vast' });
          maat.boven += maat.bovenToestel.hoogte + 16;
        }
      }
      let kol = kolommen.at(-1);
      if (kol.rijen.length) {
        y = Math.min(y - MIN_STAP, y - vorigeBoven - maat.onder - 6);
        if (y - maat.boven < -MAX_HOOGTE) {
          kol = { rijen: [], breedte: MIN_KOLOM };
          kolommen.push(kol);
          y = -kop;
        }
      }
      kol.breedte = Math.max(kol.breedte, LINKS + STUB + maat.b + 12);
      kol.rijen.push({ ...maat, y, nr: i + 1, rij });
      vorigeBoven = maat.boven;
    });
    return kolommen;
  }

  function tekenRij(r, kolX, y) {
    const sx = kolX + STUB;
    lijnen.push(lijn(kolX, y, sx, y), tekst(kolX - 8, y + 3.5, String(r.nr), 'k', 'end'));
    for (const d of r.delen) {
      const x = sx + d.x;
      lijnen.push(`<g transform="translate(${r1(x)} ${r1(y)})">${d.s.svg}</g>`);
      if (d.aantal) lijnen.push(tekst(x + d.s.midden, y + d.s.boven - 2, d.aantal, 'k', 'middle'));
      if (d.item.adres) lijnen.push(draai(x + d.s.midden + 3.5, y + d.s.onder + 4, d.item.adres, 'k cursief', 'end'));
    }
    const laatste = r.delen.at(-1);
    if (r.tekstje) lijnen.push(tekst(sx + laatste.x + laatste.s.b + 8, y + 3.5, r.tekstje, 'k'));
  }

  function tekenInline(m, item, x, y, nr) {
    const { s, anker } = m;
    const tx = x - s.midden;
    const ty = y - anker;
    lijnen.push(`<g transform="translate(${r1(tx)} ${r1(ty)})">${s.svg}</g>`);
    if (nr) lijnen.push(tekst(x - (s.midden - s.begin) - 4, ty + 3.5, String(nr), 'k', 'end'));
    if (item.tekst) lijnen.push(tekst(tx + s.b + 6, ty + 3.5, item.tekst, 'k'));
    if (item.adres) lijnen.push(draai(x + 3.5, ty + s.onder + 4, item.adres, 'k cursief', 'end'));
  }

  function kring(k, x, yb) {
    const lx = x + LINKS;
    const label = opschriften({ ...k.automaat, beveiliging: Number(k.automaat.gevoeligheid) ? 'diffautomaat' : 'automaat' });
    const apparaat = Math.max(40, ...label.map(kolomLengte)) + 6;
    const kabel = kabelTekst(k.kabel) + (Number(k.kabel.lengte) ? ` - ${komma(k.kabel.lengte)}m` : '');
    const kabelY = yb - apparaat - 12;
    const kabelEinde = kabelY - breedte(kabel);
    const kop = apparaat + 12 + breedte(kabel) + 22;
    const kolommen = schik(k, kop);

    // Onderaan: automaat, kringletter en opschriften; daarboven de kabel met zijn plaatsing.
    lijnen.push(
      lijn(lx, yb, lx, yb - 6),
      automaatSymbool(lx, yb - 38),
      tekst(lx - 8, yb - 4, code.get(k.id), 'letter', 'end'),
      tekenOpschriften(label, lx, yb - 4),
      draai(lx + 10, kabelY, kabel),
    );
    if (k.kabel.plaatsing) {
      for (const py of [kabelY + 4, kabelEinde - 8]) lijnen.push(`<g transform="translate(${lx} ${r1(py)}) rotate(-90)">${plaatsingTeken(0, -6, k.kabel.plaatsing)}</g>`);
    }
    doel(x + 2, yb - kop + 14, LINKS + 34, kop - 12, k.id);

    let kolX = lx;
    let top = yb - kop + 20;
    kolommen.forEach((kol, ki) => {
      // Eerst de onderdelen, zodat we weten tot waar de kringlijn moet lopen.
      let lijnTop = yb - kop + 20;
      for (const r of kol.rijen) {
        const y = yb + r.y;
        const items = r.echt || r.rij;
        doel(kolX - LINKS + 4, y - r.boven - 2, kol.breedte - 6, r.boven + r.onder + 4, items[0].id);
        lijnTop = Math.min(lijnTop, y);
        if (r.inline) {
          tekenInline(r.inline, r.rij[0], kolX, y, r.nr);
          top = Math.min(top, y - r.inline.hoogte);
          continue;
        }
        tekenRij(r, kolX, y);
        top = Math.min(top, y - r.boven);
        if (r.bovenToestel) {
          const ty = y - 16 - r.bovenToestel.anker + r.bovenToestel.s.onder;
          tekenInline(r.bovenToestel, {}, kolX, ty, 0);
          lijnTop = Math.min(lijnTop, ty);
          top = Math.min(top, ty - r.bovenToestel.hoogte);
        }
      }
      if (ki === 0) lijnen.push(lijn(lx, yb - 38, lx, lijnTop));
      else {
        // Verder in een kolom ernaast, zoals in Trikker.
        const yv = yb - kop + 22;
        lijnen.push(lijn(lx, yv, kolX, yv), lijn(kolX, yv, kolX, lijnTop));
      }
      kolX += kol.breedte;
    });

    // Bovenaan: de naam van de kring.
    if (k.naam) {
      lijnen.push(draai(lx + 4, top - 8, k.naam, 'b'));
      hoogste = Math.min(hoogste, top - 8 - breedte(k.naam, 6));
    }
    hoogste = Math.min(hoogste, top - 12);
    const b = Math.max(kolommen.reduce((som, kol) => som + kol.breedte, 0), MIN_KOLOM, LINKS + 10 + label.length * 10.5 + 14);
    snijpunten.push({ x0: x, x1: x + b });
    return { breedte: b };
  }

  /** Een groep: beveiliging (of niets bij een rij), en daarboven een verdeellijn met de kringen; één groep als kind komt er recht boven. */
  function groep(g, x, yb) {
    const lx = x + LINKS;
    const label = opschriften(g);
    let hoogte = 18;
    lijnen.push(tekst(lx - 8, yb - 4, code.get(g.id), 'letter', 'end'));
    // Hoog genoeg voor de naam, zodat namen van groepen boven elkaar niet overlappen.
    const naamHoogte = g.naam ? breedte(g.naam, 5.7) + 14 : 0;
    if (g.beveiliging !== 'geen') {
      hoogte = Math.max(46, naamHoogte, ...label.map(kolomLengte)) + 10;
      lijnen.push(lijn(lx, yb, lx, yb - 6), automaatSymbool(lx, yb - 38), tekenOpschriften(label, lx, yb - 4), lijn(lx, yb - 38, lx, yb - hoogte));
    } else {
      hoogte = Math.max(hoogte, naamHoogte);
      lijnen.push(lijn(lx, yb, lx, yb - hoogte));
    }
    if (g.naam) lijnen.push(draai(lx - 24, yb - 4, g.naam, 'b'));
    doel(x + 2, yb - hoogte + 4, LINKS + 34, hoogte - 2, g.id);
    const sb = yb - hoogte;

    if (!g.kinderen.length) {
      lijnen.push(lijn(lx - 8, sb, lx + 30, sb, 'l bus'));
      hoogste = Math.min(hoogste, sb - 16);
      const b = Math.max(MIN_KOLOM, LINKS + 10 + label.length * 10.5 + 14);
      snijpunten.push({ x0: x, x1: x + b });
      return { breedte: b };
    }
    // Eén groep erboven: recht in de ketting, zonder verdeellijn (zoals generaal zekering → 300 mA → 30 mA).
    if (g.kinderen.length === 1 && g.kinderen[0].soort === 'differentieel') {
      return teken(g.kinderen[0], x, sb);
    }
    let cx = x;
    let laatste = lx;
    for (const kind of g.kinderen) {
      laatste = cx + LINKS;
      cx += teken(kind, cx, sb).breedte;
    }
    lijnen.push(lijn(lx - 8, sb, laatste + 14, sb, 'l bus'));
    return { breedte: Math.max(MIN_KOLOM, cx - x) };
  }

  const teken = (k, x, yb) => (k.soort === 'differentieel' ? groep(k, x, yb) : kring(k, x, yb));

  // Alles naast elkaar op de hoofdverdeellijn.
  const START = 26;
  let x = START;
  let laatsteLijn = START + LINKS;
  for (const kind of project.kinderen) {
    laatsteLijn = x + LINKS;
    x += teken(kind, x, 0).breedte;
  }
  if (!project.kinderen.length) lijnen.push(tekst(START + 20, -14, 'Voeg een groep of kring toe', 'k'));

  // Voeding onder de hoofdverdeellijn: aarding met meetklem, net, kabel, teller, hoofdbeveiliging.
  const { aansluiting, hoofd } = project;
  const Y = VOEDING;
  let vx = 36;
  lijnen.push(
    lijn(14, 0, 14, 10), aardingsonderbreker(14, 12), lijn(14, 13.6, 14, 22), aardingsonderbreker(14, 24), lijn(14, 25.6, 14, 36),
    aardeSymbool(14, 36),
    tekst(24, 60, Number(aansluiting.aardingsweerstand) ? `${komma(aansluiting.aardingsweerstand)} Ω` : '', 'k'),
    ondergronds(vx, Y),
  );
  vx += 12;
  const kabelStuk = (tekstje) => {
    const lengte = Math.max(70, breedte(tekstje) + 20);
    lijnen.push(lijn(vx, Y, vx + lengte, Y));
    if (tekstje) {
      lijnen.push(tekst(vx + lengte / 2, Y + 12, tekstje, 'k', 'middle'));
      lijnen.push(plaatsingTeken(vx + 12, Y - 3, 'opWand'), plaatsingTeken(vx + lengte - 12, Y - 3, 'opWand'));
    }
    vx += lengte;
  };
  kabelStuk(aansluiting.kabelNet);
  if (hoofd.teller !== false) {
    lijnen.push(tellerSymbool(vx, Y));
    vx += 32;
    kabelStuk(aansluiting.kabelBord);
  }
  lijnen.push(diffLiggend(vx, Y));
  const hx = vx + 16;
  const hoofdSoort = hoofd.beveiliging || 'differentieel';
  const hoofdLabels = opschriften({ ...hoofd, beveiliging: hoofdSoort }).flat().filter(Boolean);
  hoofdLabels.forEach((stuk, i) => {
    const y = Y + 14 + i * 12;
    if (stuk.kader) {
      const b = breedte(stuk.kader, 5.2) + 3;
      lijnen.push(`<rect class="l" x="${r1(hx - b / 2 - 1.5)}" y="${y - 8.4}" width="${r1(b)}" height="10.4"/>`, tekst(hx, y, stuk.kader, 'k', 'middle'));
    } else lijnen.push(tekst(hx, y, stuk, 'k', 'middle'));
  });
  vx += 32;
  const aansluitX = Math.max(vx + 24, START + LINKS + 70);
  lijnen.push(lijn(vx, Y, aansluitX, Y), lijn(aansluitX, Y, aansluitX, 0));
  lijnen.push(tekst(36, Y + 14 + Math.max(hoofdLabels.length, 2) * 12, `${NETTEN[aansluiting.net]?.kort || ''} · hoofdzekering ${aansluiting.hoofdzekering} A`, 'm'));
  doel(4, 4, aansluitX + 4, Y + 40, 'hoofd');

  const eindeBus = Math.max(laatsteLijn + 30, aansluitX + 20);
  lijnen.push(lijn(10, 0, eindeBus, 0, 'l bus'));

  const boven = -hoogste + 16;
  return {
    inhoud: `<g transform="translate(0 ${r1(boven)})"><g class="doelen">${doelen.join('')}</g><g class="tekening">${lijnen.join('')}</g></g>`,
    breedte: Math.max(x, eindeBus) + 20,
    hoogte: boven + Y + 30 + Math.max(hoofdLabels.length, 2) * 12,
    kolommen: snijpunten.sort((a, b) => a.x0 - b.x0),
  };
}

/** De stijl van de tekening, ook voor afdrukken. */
export const SCHEMA_STIJL = `
.l{fill:none;stroke:currentColor;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
.l.dik{stroke-width:2.6}
.l.half{stroke-width:1.8}
.l.dun{stroke-width:0.8}
.l.bus{stroke-width:2.6}
.l.blok{stroke-width:3.4;stroke-linecap:butt}
.l.w{fill:#fff}
.l.vol{fill:currentColor}
.l.stippel{stroke-dasharray:1.6 1.2;stroke-linecap:butt}
.v{fill:currentColor;stroke:none}
.b{font:600 10px Arial,"Segoe UI",sans-serif;fill:currentColor}
.k{font:9px Arial,"Segoe UI",sans-serif;fill:currentColor}
.k.cursief{font-style:italic}
.m{font:7px Arial,"Segoe UI",sans-serif;fill:currentColor}
.groot{font:14px Arial,"Segoe UI",sans-serif;fill:currentColor}
.letter{font:700 14px Arial,"Segoe UI",sans-serif;fill:currentColor}
.doel{fill:transparent;stroke:none;cursor:pointer}
.doel:hover{fill:rgba(37,99,235,.06)}
.doel.gekozen{fill:rgba(37,99,235,.13);stroke:rgba(37,99,235,.55);stroke-width:1}
`;
