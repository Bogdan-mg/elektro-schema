// De tabbladen Materiaallijst en Controle.
import { materiaallijst, naarCsv, GROEPEN } from './materiaal.js';
import { controleer } from './regels.js';
import { esc } from './symbolen.js';
import { staat, wijzig, kies, opWijziging } from './staat.js';

const $ = (s) => document.querySelector(s);
const PRIJZEN = 'elektro-schema-prijzen';
const euro = (n) => `€ ${n.toFixed(2).replace('.', ',')}`;

/** Prijzen worden per pc onthouden (niet per project), zodat je ze maar één keer invult. */
export function leesPrijzen() {
  try {
    return JSON.parse(localStorage.getItem(PRIJZEN)) || {};
  } catch {
    return {};
  }
}
function bewaarPrijzen(prijzen) {
  try {
    localStorage.setItem(PRIJZEN, JSON.stringify(prijzen));
  } catch {
    // Geen opslag beschikbaar: de prijzen gelden dan enkel nu.
  }
}

export function huidigeLijst() {
  return materiaallijst(staat.project, { marge: Number(staat.project.materiaal?.marge) || 0 });
}

export function csvTekst() {
  return naarCsv(huidigeLijst().regels, leesPrijzen());
}

/** Tabel van de materiaallijst; bewerkbaar = met prijsvelden (op het scherm). */
export function materiaalTabel(bewerkbaar) {
  const { regels } = huidigeLijst();
  const prijzen = leesPrijzen();
  let totaal = 0;
  const rijen = [];
  for (const groep of GROEPEN) {
    const inGroep = regels.filter((r) => r.groep === groep);
    if (!inGroep.length) continue;
    rijen.push(`<tr class="groep"><th colspan="5">${esc(groep)}</th></tr>`);
    for (const r of inGroep) {
      const prijs = Number(prijzen[r.sleutel]) || 0;
      totaal += prijs * r.aantal;
      const prijsCel = bewerkbaar
        ? `<input type="number" min="0" step="0.01" data-prijs="${esc(r.sleutel)}" value="${prijs || ''}" placeholder="—" aria-label="Prijs per eenheid">`
        : prijs ? euro(prijs) : '';
      rijen.push(`<tr><td>${esc(r.omschrijving)}</td><td class="getal">${r.aantal}</td><td>${esc(r.eenheid)}</td><td class="getal">${prijsCel}</td><td class="getal" data-totaal="${esc(r.sleutel)}">${prijs ? euro(prijs * r.aantal) : ''}</td></tr>`);
    }
  }
  return {
    html: `<table class="materiaal"><thead><tr><th>Omschrijving</th><th class="getal">Aantal</th><th>Eenheid</th><th class="getal">Prijs/eenh.</th><th class="getal">Totaal</th></tr></thead>
      <tbody>${rijen.join('')}</tbody>
      <tfoot><tr><td colspan="4">Totaal (excl. btw)</td><td class="getal" id="materiaal-totaal">${totaal ? euro(totaal) : '—'}</td></tr></tfoot></table>`,
    totaal,
  };
}

function tekenMateriaal() {
  const { modules } = huidigeLijst();
  const reserve = Math.ceil(modules * 1.2);
  const marge = $('#marge');
  if (document.activeElement !== marge) marge.value = staat.project.materiaal?.marge ?? 10;
  $('#modules').textContent = `Verdeelkast: ${modules} modules in gebruik, met 20 % reserve ${reserve} modules`
    + ` (${Math.ceil(reserve / 13)} rij${Math.ceil(reserve / 13) > 1 ? 'en' : ''} van 13). Een 1P+N-automaat is als 1 module gerekend.`;
  $('#materiaal-tabel').innerHTML = materiaalTabel(true).html;
}

function tekenControle() {
  const meldingen = controleer(staat.project);
  const lijst = $('#controle-lijst');
  if (!meldingen.length) {
    lijst.innerHTML = '<p class="goed">Geen opmerkingen gevonden.</p>';
    return;
  }
  const ic = { fout: '✕', waarschuwing: '!', info: 'i' };
  const naam = { fout: 'Fout', waarschuwing: 'Let op', info: 'Info' };
  lijst.innerHTML = meldingen.map((m) => `<button type="button" class="melding-rij ${m.niveau}" data-ga="${esc(m.id)}">
      <span class="niveau" title="${naam[m.niveau]}">${ic[m.niveau]}</span><span>${esc(m.tekst)}</span></button>`).join('');
}

/** Aantal fouten en waarschuwingen, voor het tabblad. */
export function tekenTeller() {
  const meldingen = controleer(staat.project);
  const fouten = meldingen.filter((m) => m.niveau === 'fout').length;
  const let_op = meldingen.filter((m) => m.niveau === 'waarschuwing').length;
  const el = $('#controle-teller');
  el.textContent = fouten || let_op || '';
  el.className = `teller ${fouten ? 'fout' : let_op ? 'waarschuwing' : ''}`;
}

export function startLijsten({ naarTab }) {
  $('#marge').addEventListener('input', (e) => {
    wijzig((p) => { p.materiaal = { ...p.materiaal, marge: Math.max(0, Number(e.target.value) || 0) }; }, { sleutel: 'marge', paneel: false });
  });
  $('#materiaal-tabel').addEventListener('input', (e) => {
    const veld = e.target.closest('[data-prijs]');
    if (!veld) return;
    const prijzen = leesPrijzen();
    const waarde = Number(veld.value);
    if (waarde > 0) prijzen[veld.dataset.prijs] = waarde; else delete prijzen[veld.dataset.prijs];
    bewaarPrijzen(prijzen);
    // Enkel de totalen bijwerken, zodat het veld de focus houdt.
    const { regels } = huidigeLijst();
    let totaal = 0;
    for (const r of regels) {
      const prijs = Number(prijzen[r.sleutel]) || 0;
      totaal += prijs * r.aantal;
      const cel = document.querySelector(`[data-totaal="${CSS.escape(r.sleutel)}"]`);
      if (cel) cel.textContent = prijs ? euro(prijs * r.aantal) : '';
    }
    $('#materiaal-totaal').textContent = totaal ? euro(totaal) : '—';
  });
  $('#controle-lijst').addEventListener('click', (e) => {
    const rij = e.target.closest('[data-ga]');
    if (!rij) return;
    naarTab('eendraad');
    kies(rij.dataset.ga);
  });

  opWijziging(() => {
    tekenTeller();
    if (staat.tab === 'materiaal') tekenMateriaal();
    if (staat.tab === 'controle') tekenControle();
  });
}
