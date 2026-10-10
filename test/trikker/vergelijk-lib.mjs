// Gemeenschappelijke vergelijking: de nabouw tegenover de uitvoer van Trikker (getallen met een kleine tolerantie).
import { Graphics, opties } from '../../app/js/trikker/g.js';

// De proefopstelling (Linux) schrijft de regeleinden uit de tekst weg: voeg de regels ook hier samen.
opties.regelsSamenvoegen = true;

const TOL = 0.0025;
const tokens = (s) => String(s).split(/(-?\d+(?:\.\d+)?(?:e-?\d+)?)/).filter((x) => x !== '');
const isGetal = (t) => /^-?\d/.test(t);

/** Vergelijk twee SVG-reeksen: gelijke tekst en getallen binnen de tolerantie. Geeft een lijst met verschillen. */
export function vergelijkSvg(a, b, naam) {
  const ta = tokens(a); const tb = tokens(b);
  if (ta.length !== tb.length) return [`${naam}: ${ta.length} delen tegenover ${tb.length} (andere tekenopdrachten)\n      jij:     ${a.slice(0, 300)}\n      Trikker: ${b.slice(0, 300)}`];
  for (let i = 0; i < ta.length; i++) {
    const g1 = isGetal(ta[i]); const g2 = isGetal(tb[i]);
    if (g1 !== g2 || (g1 ? Math.abs(Number(ta[i]) - Number(tb[i])) > TOL : ta[i] !== tb[i])) {
      return [`${naam}: verschil bij deel ${i}: "${ta.slice(Math.max(0, i - 3), i + 2).join('')}" tegenover "${tb.slice(Math.max(0, i - 3), i + 2).join('')}"\n      jij:     ${a.slice(0, 300)}\n      Trikker: ${b.slice(0, 300)}`];
    }
  }
  return [];
}

/** Vergelijk één variant: breedte, hoogte, tekstmarges en de SVG in beide contexten en gedraaid. */
export function vergelijkResultaat(mod, props, waar) {
  if (!waar.ok) return [`Trikker zelf geeft een fout: ${waar.fout}`];
  const meld = [];
  let n;
  try { n = mod.maak(props); } catch (e) { return [`maak() gooit: ${e.message}`]; }
  if (Math.abs(n.Width - waar.width) > TOL) meld.push(`Width ${n.Width} tegenover ${waar.width}`);
  if (Math.abs(n.Height - waar.height) > TOL) meld.push(`Height ${n.Height} tegenover ${waar.height}`);
  for (const [r, v] of Object.entries(waar.offsets)) {
    const o = n.textOffset(r === 'null' ? null : Number(r));
    const mijn = [o.left, o.top, o.right, o.bottom];
    if (mijn.some((x, i) => Math.abs(x - v[i]) > TOL)) meld.push(`textOffset(${r}) [${mijn}] tegenover [${v}]`);
  }
  for (const [ctx, svg] of Object.entries(waar.svg)) {
    if (!n.render) { meld.push('geen render()'); break; }
    if (svg.startsWith('FOUT')) continue; // Trikker kon deze context niet zonder rekenwerk van de lay-out tekenen
    const g = new Graphics();
    try { n.render(g, ctx, null, null); } catch (e) { meld.push(`render(${ctx}) gooit: ${e.message}`); continue; }
    meld.push(...vergelijkSvg(g.uit, svg, `render ${ctx}`));
  }
  for (const [r, svg] of Object.entries(waar.gedraaid || {})) {
    if (svg.startsWith('FOUT')) continue;
    const g = new Graphics();
    try { n.render(g, 'Grondplan', Number(r), 'Plus0'); } catch (e) { meld.push(`render(gedraaid ${r}) gooit: ${e.message}`); continue; }
    meld.push(...vergelijkSvg(g.uit, svg, `render gedraaid ${r}`));
  }
  return meld;
}
