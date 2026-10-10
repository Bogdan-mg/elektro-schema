// Het ééndraadschema van Trikker: boom opbouwen, schikken (EendraadschemaLayouter) en tekenen (ConnectedNodeRenderer).
import { Knoop, bouwBoom, gebiedEendraad } from './knoop.js';
import { bouwLayout, mogelijkePaginabreuken, secties } from './layout.js';
import { tekenBoom } from './render.js';


export { Knoop, bouwBoom, bouwLayout, tekenBoom, mogelijkePaginabreuken, secties, gebiedEendraad };

/** De marge boven het schema voor de kringnamen: 25 met namen, anders 0 (afdrukken) of 10 (scherm). */
export const MARGE_NAAM = 25;

/**
 * Een boom uit een beschrijving schikken en tekenen. Geeft per knoop de plaats, het gebied, de kring en het adres,
 * en verder het totale gebied, de mogelijke paginabreuken en de SVG (in de vorm van de proefopstelling).
 */
export function berekenSchema(spec, { marge = MARGE_NAAM, naamKring = true, context = 'Schema' } = {}) {
  const wortel = bouwBoom(spec);
  wortel.herbereken();
  tekenBoom([wortel], { naamKring }); // een eerste keer tekenen: Nota's meten zich bij het eerste tekenen
  bouwLayout([wortel], marge, context);
  const svg = tekenBoom([wortel], { naamKring });
  return { wortel, ...beschrijf(wortel, marge), svg };
}

/** De gegevens van elke knoop in dezelfde vorm als de proefopstelling ze wegschrijft. */
export function beschrijf(wortel, marge) {
  const knopen = [];
  const loop = (k, pad, sat) => {
    const ip = k.inPunt; const op = k.uitPunt;
    knopen.push({
      pad, k: k.klasse, sat, pos: [k.pos.x, k.pos.y], rot: k.rotation, w: k.Width, h: k.Height,
      wa: [k.gebied.x, k.gebied.y, k.gebied.w, k.gebied.h],
      in: [ip.pos.x, ip.pos.y, ip.rot], out: [op.pos.x, op.pos.y, op.rot],
      kring: k.kring ?? null, sub: k.subKring ?? null, adres: k.adresTekst ?? null,
      nieuweKring: k.begintNieuweKring, nieuweSub: k.begintNieuweSubKring,
    });
    k.satellieten.forEach((s, i) => loop(s, `${pad}s${i}`, true));
    k.kinderen.forEach((c, i) => loop(c, `${pad}.${i}`, false));
  };
  loop(wortel, '0', false);
  const g = gebiedEendraad(wortel, marge);
  return {
    gebied: [g.x, g.y, g.w, g.h],
    knopen,
    breaks: mogelijkePaginabreuken(wortel),
    secties: secties(wortel).map((s) => ({ links: s.links, nieuw: s.nieuw, kring: s.knoop.kring ?? '' })),
  };
}
