// Vergelijking van de JavaScript-nabouw van het ééndraadschema met de uitvoer van Trikker (de proefopstelling).
import { opties } from '../../app/js/trikker/g.js';
import { berekenSchema } from '../../app/js/trikker/eendraad/index.js';
import { vergelijkSvg } from './vergelijk-lib.mjs';

opties.regelsSamenvoegen = true;

const TOL = 0.01;
const dicht = (a, b) => Math.abs(a - b) <= TOL;
const rij = (a, b) => a.length === b.length && a.every((x, i) => dicht(x, b[i]));

/** Geeft een lijst met verschillen (leeg als alles gelijk is). */
export function vergelijkSchema(spec, waar, { svg = true } = {}) {
  if (!waar.ok) return [`Trikker zelf geeft een fout: ${waar.fout}`];
  let js;
  try { js = berekenSchema(spec.boom, spec.opties || {}); } catch (e) { return [`berekenSchema gooit: ${e.stack}`]; }
  const m = [];
  if (!rij(js.gebied, waar.gebied)) m.push(`gebied [${js.gebied.map((x) => +x.toFixed(3))}] tegenover [${waar.gebied}]`);
  if (js.knopen.length !== waar.knopen.length) m.push(`${js.knopen.length} knopen tegenover ${waar.knopen.length}`);
  else {
    for (let i = 0; i < js.knopen.length; i++) {
      const a = js.knopen[i]; const b = waar.knopen[i];
      const v = [];
      if (a.pad !== b.pad || a.k !== b.k) v.push(`${a.pad}/${a.k} tegenover ${b.pad}/${b.k}`);
      for (const veld of ['pos', 'wa', 'in', 'out']) if (!rij(a[veld], b[veld])) v.push(`${veld} [${a[veld].map((x) => +x.toFixed(3))}] tegenover [${b[veld]}]`);
      for (const veld of ['rot', 'w', 'h']) if (!dicht(a[veld], b[veld])) v.push(`${veld} ${a[veld]} tegenover ${b[veld]}`);
      for (const veld of ['kring', 'sub', 'adres', 'nieuweKring', 'nieuweSub']) if ((a[veld] ?? null) !== (b[veld] ?? null)) v.push(`${veld} ${JSON.stringify(a[veld])} tegenover ${JSON.stringify(b[veld])}`);
      if (v.length) m.push(`knoop ${b.pad} (${b.k}): ${v.join('; ')}`);
      if (m.length > 12) break;
    }
  }
  if (js.breaks.length !== waar.breaks.length || !rij(js.breaks, waar.breaks)) m.push(`paginabreuken ${js.breaks.length} tegenover ${waar.breaks.length}`);
  if (JSON.stringify(js.secties.map((s) => [+s.links.toFixed(2), s.nieuw, s.kring])) !== JSON.stringify(waar.secties.map((s) => [+s.links.toFixed(2), s.nieuw, s.kring]))) m.push('secties verschillen');
  if (svg) m.push(...vergelijkSvg(js.svg, waar.svg, 'svg'));
  return m;
}
