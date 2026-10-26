// De lijst met noodverlichting: elk lichtpunt dat als noodverlichting is ingesteld, met zijn kring, soort en plaats op het situatieschema.
import { alleKringen, losseSymbolen, codes } from './model.js';
import { itemNaam } from './catalogus.js';

const TYPE = { centraal: 'Centraal', decentraal: 'Decentraal' };
export const isNood = (item) => item?.soort === 'lichtpunt' && Boolean(TYPE[item.nood]);

const r1 = (n) => Math.round(n * 10) / 10;

/** De tekst op het plan die het dichtst bij (x, y) staat (meestal de naam van de ruimte), binnen een afstand in tekeneenheden. */
function dichtsteTekst(plan, x, y, bereik) {
  let beste = null;
  for (const t of plan.teksten || []) {
    const d = Math.hypot(t.x - x, t.y - y);
    if (d <= bereik && (!beste || d < beste.d)) beste = { d, tekst: String(t.tekst || '').trim() };
  }
  return beste?.tekst || '';
}

/**
 * Alle noodverlichting van het project.
 * @returns {{ rijen: object[], totaal: number, centraal: number, decentraal: number, zonderPlaats: number }}
 * Elke rij: code (bv. B3), kring (naam), kringCode, type, aantal, omschrijving, ruimte, plan, plaats, x en y (in meter, als de schaal gekend is), opPlan.
 */
export function noodLijst(project) {
  const code = codes(project);
  const plaats = new Map();
  for (const plan of project.plannen) {
    for (const [id, pl] of Object.entries(plan.plaatsingen || {})) if (!plaats.has(id)) plaats.set(id, { plan, pl });
  }
  const bron = [
    ...alleKringen(project).flatMap(({ knoop }) => knoop.items.map((item) => ({ item, kring: knoop }))),
    ...losseSymbolen(project).map(({ item }) => ({ item, kring: null })),
  ].filter(({ item }) => isNood(item));

  const rijen = bron.map(({ item, kring }) => {
    const p = plaats.get(item.id);
    const ruimte = String(item.tekst || '').trim() || (p ? dichtsteTekst(p.plan, p.pl.x, p.pl.y, (p.plan.schaal || 100) * 4) : '');
    const schaal = p?.plan.schaal || 0;
    const rij = {
      id: item.id,
      code: kring ? code.get(item.id) || '' : '',
      kring: kring?.naam || '',
      kringCode: kring ? code.get(kring.id) || '' : '',
      type: TYPE[item.nood],
      aantal: Math.max(1, Number(item.aantal) || 1),
      omschrijving: itemNaam({ ...item, nood: 'geen', aantal: 1 }),
      ruimte,
      plan: p?.plan.naam || '',
      opPlan: Boolean(p),
      x: schaal && p ? r1(p.pl.x / schaal) : null,
      y: schaal && p ? r1(p.pl.y / schaal) : null,
    };
    rij.plaats = rij.opPlan ? [rij.plan, rij.ruimte].filter(Boolean).join(' · ') : 'nog niet op het situatieschema';
    return rij;
  });
  // In de volgorde van het schema (kring, dan nummer), de losse symbolen achteraan.
  rijen.sort((a, b) => (a.code === '' ? 1 : 0) - (b.code === '' ? 1 : 0) || a.code.localeCompare(b.code, 'nl', { numeric: true }));
  const som = (type) => rijen.filter((r) => r.type === type).reduce((n, r) => n + r.aantal, 0);
  return {
    rijen,
    totaal: rijen.reduce((n, r) => n + r.aantal, 0),
    centraal: som('Centraal'),
    decentraal: som('Decentraal'),
    zonderPlaats: rijen.filter((r) => !r.opPlan).length,
  };
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** De lijst als tabel (op het scherm en op de afdruk). */
export function noodTabel(project) {
  const l = noodLijst(project);
  if (!l.rijen.length) return { html: '', ...l };
  const samenvatting = `${l.totaal} armatuur${l.totaal === 1 ? '' : 'en'}`
    + `${l.centraal ? `, ${l.centraal} centraal` : ''}${l.decentraal ? `, ${l.decentraal} decentraal` : ''}`
    + `${l.zonderPlaats ? ` · ${l.zonderPlaats} nog niet op het situatieschema` : ''}`;
  const meter = (r) => (r.x == null ? '' : `${String(r.x).replace('.', ',')} m, ${String(r.y).replace('.', ',')} m`);
  const html = `<table class="materiaal nood"><thead><tr><th>Nr.</th><th>Soort</th><th>Aantal</th><th>Kring</th><th>Plaats</th><th>Plek op het plan</th></tr></thead>
    <tbody>${l.rijen.map((r) => `<tr class="${r.opPlan ? '' : 'zonder-plaats'}"><td><b>${esc(r.code || '—')}</b></td><td>${esc(r.type)}</td><td class="getal">${r.aantal}</td>
      <td>${esc([r.kringCode, r.kring].filter(Boolean).join(' '))}</td><td>${esc(r.plaats)}</td><td>${esc(meter(r))}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="6">${esc(samenvatting)}</td></tr></tfoot></table>`;
  return { html, samenvatting, ...l };
}
