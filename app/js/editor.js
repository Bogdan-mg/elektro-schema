// Het tabblad Ééndraadschema: de boom links, de tekening in het midden, de eigenschappen rechts.
import {
  NETTEN, AUTOMAAT_STROMEN, CURVES, POLEN, DIFF_GEVOELIGHEDEN, DIFF_STROMEN, DIFF_TYPES, SECTIES, ADERS, KABELTYPES,
  LICHTPUNTEN, SCHAKELAARS, TOESTELLEN, AANSLUITINGEN, PALET, itemNaam, kabelTekst, automaatTekst, komma,
} from './catalogus.js';
import {
  nieuwDifferentieel, nieuweKring, nieuwItem, voegKnoopToe, voegItemToe, verwijder, verschuif, dupliceer, verplaatsNaar,
  zoek, codes, alleKnopen, alleKringen,
} from './model.js';
import { tekenEendraad, SCHEMA_STIJL } from './eendraad.js';
import { icoon, esc } from './symbolen.js';
import { staat, wijzig, kies, opWijziging } from './staat.js';
import { Vlak } from './vlak.js';

let vlak;
const $ = (s) => document.querySelector(s);

const opties = (lijst, eenheid = '') => lijst.map((w) => [w, `${komma(w)}${eenheid}`]);

// ---------- Acties (ook gebruikt door menu en sneltoetsen) ----------

export function voegDifferentieelToe() {
  const d = wijzig((p) => voegKnoopToe(p, staat.selectie, nieuwDifferentieel()));
  kies(d.id);
}

export function voegKringToe() {
  const k = wijzig((p) => voegKnoopToe(p, staat.selectie, nieuweKring()));
  kies(k.id);
}

function voegOnderdeelToe(soort, waarden) {
  const item = wijzig((p) => voegItemToe(p, staat.selectie, nieuwItem(soort, structuredClone(waarden))));
  if (item) kies(item.id);
}

export function verwijderGekozen() {
  if (!staat.selectie || staat.selectie === 'hoofd') return;
  const volgende = wijzig((p) => verwijder(p, staat.selectie));
  kies(volgende || 'hoofd');
}

export function dupliceerGekozen() {
  if (!staat.selectie || staat.selectie === 'hoofd') return;
  const kopie = wijzig((p) => dupliceer(p, staat.selectie));
  if (kopie) kies(kopie.id);
}

export function verschuifGekozen(richting) {
  if (!staat.selectie || staat.selectie === 'hoofd') return;
  if (!zoek(staat.project, staat.selectie)) return;
  wijzig((p) => verschuif(p, staat.selectie, richting));
}

// ---------- Boom ----------

function tekenBoom() {
  const p = staat.project;
  const code = codes(p);
  const rij = (id, diepte, inhoud, extra = '') =>
    `<div class="rij${id === staat.selectie ? ' gekozen' : ''}${extra}" data-id="${esc(id)}" style="--diepte:${diepte}">${inhoud}</div>`;
  const html = [rij('hoofd', 0, `<span class="ic hoofd-ic">⚡</span><b>Hoofdbord</b><small>${p.hoofd.gevoeligheid} mA</small>`)];
  const loop = (kinderen, diepte) => {
    for (const k of kinderen) {
      if (k.soort === 'differentieel') {
        html.push(rij(k.id, diepte, `<span class="ic diff-ic">ΔI</span><b>Differentieel</b><small>${k.gevoeligheid} mA</small>`));
        loop(k.kinderen, diepte + 1);
      } else {
        const dicht = staat.dicht.has(k.id);
        html.push(rij(k.id, diepte,
          `<button class="klap" data-klap="${esc(k.id)}" title="${dicht ? 'Openklappen' : 'Dichtklappen'}">${k.items.length ? (dicht ? '▸' : '▾') : ''}</button>`
          + `<span class="ic letter">${code.get(k.id)}</span><b>${esc(k.naam || 'Kring')}</b><small>${automaatTekst(k.automaat)} · ${esc(kabelTekst(k.kabel))}</small>`));
        if (!dicht) {
          for (const item of k.items) {
            html.push(rij(item.id, diepte + 1, `${icoon(item, 22)}<span class="code">${code.get(item.id)}</span><span>${esc(itemNaam(item))}</span>${item.tekst ? `<small>${esc(item.tekst)}</small>` : ''}`, ' item'));
          }
        }
      }
    }
  };
  loop(p.kinderen, 1);
  const boom = $('#boom');
  const scroll = boom.scrollTop;
  boom.innerHTML = html.join('');
  boom.scrollTop = scroll;
  boom.querySelector('.gekozen')?.scrollIntoView({ block: 'nearest' });
}

// ---------- Tekening ----------

function tekenSchema() {
  const r = tekenEendraad(staat.project, { selectie: staat.selectie });
  vlak.g.innerHTML = r.inhoud;
  vlak.laatste = r;
  if (!vlak.ingesteld) leesbaar();
}

/** Bij het openen: groot genoeg om te lezen; is het schema breder dan het scherm, dan begint het links. */
function leesbaar() {
  const r = vlak.laatste;
  const vak = vlak.svg.getBoundingClientRect();
  if (!r || !vak.height) return;
  const s = Math.min(1.3, Math.max(0.85, (vak.height - 48) / r.hoogte));
  if (r.breedte * s <= vak.width - 48) {
    passend();
    return;
  }
  vlak.s = s;
  vlak.x = 24;
  vlak.y = 24;
  vlak.ingesteld = true;
  vlak.pas();
}

export function passend() {
  const r = vlak.laatste;
  if (r) vlak.passend(r.breedte, r.hoogte, { boven: true, max: 1.3 });
}

// ---------- Eigenschappen ----------

/** Lees of zet een waarde via een pad zoals 'automaat.stroom'. */
const lees = (obj, pad) => pad.split('.').reduce((o, k) => o?.[k], obj);
function zet(obj, pad, waarde) {
  const delen = pad.split('.');
  const laatste = delen.pop();
  delen.reduce((o, k) => o[k], obj)[laatste] = waarde;
}

/**
 * Een formulier waarvan elke wijziging meteen in het project gaat.
 * doel(p) geeft het object binnen het (mogelijk vervangen) project terug.
 */
function formulier(velden, doel, sleutel) {
  const huidig = doel(staat.project);
  const wrap = document.createElement('div');
  wrap.className = 'formulier';
  for (const v of velden) {
    const waarde = lees(huidig, v.pad);
    const label = document.createElement('label');
    label.className = v.type === 'checkbox' ? 'vink' : 'veld';
    let el;
    if (v.type === 'select') {
      el = document.createElement('select');
      for (const [w, l] of v.opties) {
        const o = document.createElement('option');
        o.value = String(w);
        o.textContent = l;
        if (String(w) === String(waarde)) o.selected = true;
        el.append(o);
      }
    } else {
      el = document.createElement('input');
      el.type = v.type || 'text';
      if (v.type === 'checkbox') el.checked = Boolean(waarde);
      else el.value = waarde ?? '';
      if (v.min != null) el.min = v.min;
      if (v.max != null) el.max = v.max;
      if (v.stap != null) el.step = v.stap;
      if (v.placeholder) el.placeholder = v.placeholder;
    }
    const pasToe = () => {
      let w = v.type === 'checkbox' ? el.checked : el.value;
      if (v.getal) w = Number(String(w).replace(',', '.')) || 0;
      wijzig((p) => {
        const o = doel(p);
        zet(o, v.pad, w);
        v.daarna?.(o, w);
      }, { sleutel: `${sleutel}:${v.pad}`, paneel: Boolean(v.herbouw) });
    };
    el.addEventListener(v.type === 'checkbox' || v.type === 'select' ? 'change' : 'input', pasToe);
    if (v.type === 'checkbox') {
      label.append(el, ` ${v.label}`);
    } else {
      const span = document.createElement('span');
      span.textContent = v.label;
      label.append(span, el);
    }
    wrap.append(label);
  }
  return wrap;
}

function knop(tekst, actie, { titel = '', klasse = '' } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = tekst;
  if (titel) b.title = titel;
  if (klasse) b.className = klasse;
  b.addEventListener('click', actie);
  return b;
}

function kop(tekst, sub = '') {
  const h = document.createElement('h3');
  h.textContent = tekst;
  if (sub) {
    const s = document.createElement('small');
    s.textContent = sub;
    h.append(' ', s);
  }
  return h;
}

function knoppenrij(...knoppen) {
  const d = document.createElement('div');
  d.className = 'knoppenrij';
  d.append(...knoppen);
  return d;
}

function basisActies() {
  return knoppenrij(
    knop('↑', () => verschuifGekozen(-1), { titel: 'Omhoog (Alt+↑)' }),
    knop('↓', () => verschuifGekozen(1), { titel: 'Omlaag (Alt+↓)' }),
    knop('Dupliceren', dupliceerGekozen, { titel: 'Ctrl+D' }),
    knop('Verwijderen', verwijderGekozen, { titel: 'Delete', klasse: 'gevaar' }),
  );
}

function verplaatsKeuze(id, isItem) {
  const p = staat.project;
  const code = codes(p);
  const plek = zoek(p, id);
  const keuzes = isItem
    ? alleKringen(p).filter(({ knoop }) => knoop.id !== plek.ouder.id).map(({ knoop }) => [knoop.id, `Kring ${code.get(knoop.id)} ${knoop.naam || ''}`])
    : [['hoofd', 'Hoofdbord (300 mA)'], ...alleKnopen(p).filter(({ knoop }) => knoop.soort === 'differentieel' && knoop.id !== id)
      .map(({ knoop, ouders }) => [knoop.id, `${'  '.repeat(ouders.length)}Differentieel ${knoop.gevoeligheid} mA`])];
  if (!keuzes.length) return document.createDocumentFragment();
  const label = document.createElement('label');
  label.className = 'veld';
  const span = document.createElement('span');
  span.textContent = 'Verplaatsen naar';
  const sel = document.createElement('select');
  sel.innerHTML = `<option value="">Kies…</option>${keuzes.map(([w, l]) => `<option value="${esc(w)}">${esc(l)}</option>`).join('')}`;
  sel.addEventListener('change', () => {
    if (!sel.value) return;
    wijzig((pr) => verplaatsNaar(pr, id, sel.value));
  });
  label.append(span, sel);
  return label;
}

function palet() {
  const wrap = document.createElement('div');
  wrap.className = 'palet';
  for (const sjabloon of PALET) {
    const item = nieuwItem(sjabloon.soort, structuredClone(sjabloon.waarden));
    const b = knop(`${icoon(item, 26)}<span>${esc(sjabloon.naam)}</span>`, () => voegOnderdeelToe(sjabloon.soort, sjabloon.waarden));
    b.title = `${sjabloon.naam} toevoegen`;
    wrap.append(b);
  }
  return wrap;
}

function tekenEigenschappen() {
  const paneel = $('#eigenschappen');
  paneel.replaceChildren();
  const p = staat.project;
  const id = staat.selectie;
  const code = codes(p);

  if (!id || id === 'hoofd') {
    paneel.append(
      kop('Hoofdbord'),
      formulier([
        { label: 'Net', pad: 'aansluiting.net', type: 'select', opties: Object.entries(NETTEN).map(([k, v]) => [k, v.naam]),
          daarna: (o, w) => { o.hoofd.polen = NETTEN[w].polen; } },
        { label: 'Hoofdzekering (A)', pad: 'aansluiting.hoofdzekering', type: 'number', getal: true, min: 0 },
        { label: 'Aardingsweerstand (Ω)', pad: 'aansluiting.aardingsweerstand', type: 'number', getal: true, min: 0, stap: 0.1 },
      ], (pr) => pr, 'hoofd'),
      kop('Hoofddifferentieel'),
      formulier([
        { label: 'Gevoeligheid', pad: 'hoofd.gevoeligheid', type: 'select', opties: opties(DIFF_GEVOELIGHEDEN, ' mA'), getal: true },
        { label: 'Stroom', pad: 'hoofd.stroom', type: 'select', opties: opties(DIFF_STROMEN, ' A'), getal: true },
        { label: 'Polen', pad: 'hoofd.polen', type: 'select', opties: opties([2, 4], 'P'), getal: true },
        { label: 'Type', pad: 'hoofd.type', type: 'select', opties: DIFF_TYPES.map((t) => [t, `type ${t}`]) },
      ], (pr) => pr, 'hoofd'),
      kop('Toevoegen op het hoofdbord'),
      knoppenrij(knop('+ Differentieel', voegDifferentieelToe), knop('+ Kring', voegKringToe)),
    );
    if (!p.kinderen.length) {
      paneel.append(
        kop('Eerste keer?'),
        knoppenrij(knop('Voorbeeldproject bekijken', () => window.dispatchEvent(new CustomEvent('actie', { detail: 'voorbeeld' })))),
      );
    }
    return;
  }

  const plek = zoek(p, id);
  if (!plek) {
    staat.selectie = 'hoofd';
    tekenEigenschappen();
    return;
  }
  const ding = plek.ding;
  const doel = (pr) => zoek(pr, id).ding;

  if (ding.soort === 'differentieel') {
    paneel.append(
      kop('Differentieel', `${ding.gevoeligheid} mA`),
      formulier([
        { label: 'Gevoeligheid', pad: 'gevoeligheid', type: 'select', opties: opties(DIFF_GEVOELIGHEDEN, ' mA'), getal: true },
        { label: 'Stroom', pad: 'stroom', type: 'select', opties: opties(DIFF_STROMEN, ' A'), getal: true },
        { label: 'Polen', pad: 'polen', type: 'select', opties: opties([2, 4], 'P'), getal: true },
        { label: 'Type', pad: 'type', type: 'select', opties: DIFF_TYPES.map((t) => [t, `type ${t}`]) },
      ], doel, id),
      kop('Toevoegen onder deze differentieel'),
      knoppenrij(knop('+ Kring', voegKringToe), knop('+ Differentieel', voegDifferentieelToe)),
      kop('Ordenen'),
      verplaatsKeuze(id, false),
      basisActies(),
    );
    return;
  }

  if (ding.soort === 'kring') {
    paneel.append(
      kop(`Kring ${code.get(id)}`, ding.naam),
      formulier([
        { label: 'Naam / ruimte', pad: 'naam', placeholder: 'bv. Keuken stopcontacten' },
        { label: 'Badkamer of natte ruimte', pad: 'badkamer', type: 'checkbox' },
      ], doel, id),
      kop('Automaat'),
      formulier([
        { label: 'Stroom', pad: 'automaat.stroom', type: 'select', opties: opties(AUTOMAAT_STROMEN, ' A'), getal: true },
        { label: 'Curve', pad: 'automaat.curve', type: 'select', opties: CURVES.map((c) => [c, `curve ${c}`]) },
        { label: 'Polen', pad: 'automaat.polen', type: 'select', opties: POLEN.map((n) => [n, n === 2 ? '2P (1P+N)' : `${n}P`]), getal: true },
      ], doel, id),
      kop('Kabel'),
      formulier([
        { label: 'Type', pad: 'kabel.type', type: 'select', opties: Object.entries(KABELTYPES).map(([k, v]) => [k, v.naam]) },
        { label: 'Aders', pad: 'kabel.aders', type: 'select', opties: opties(ADERS), getal: true },
        { label: 'Doorsnede', pad: 'kabel.sectie', type: 'select', opties: opties(SECTIES, ' mm²'), getal: true },
        { label: 'Lengte (m)', pad: 'kabel.lengte', type: 'number', getal: true, min: 0 },
      ], doel, id),
      kop('Onderdeel toevoegen'),
      palet(),
      knoppenrij(knop('+ Kring hierna', voegKringToe)),
      kop('Ordenen'),
      verplaatsKeuze(id, false),
      basisActies(),
    );
    return;
  }

  // Een onderdeel.
  const velden = [];
  switch (ding.soort) {
    case 'stopcontact':
      velden.push(
        { label: 'Soort', pad: 'aantal', type: 'select', getal: true, herbouw: true, opties: [[1, 'Enkel'], [2, 'Dubbel'], [3, 'Drievoudig'], [4, 'Viervoudig']] },
        { label: 'Met aarding', pad: 'aarding', type: 'checkbox' },
        { label: 'Kinderveilig', pad: 'kinderveilig', type: 'checkbox' },
        { label: 'Waterdicht (IP44)', pad: 'waterdicht', type: 'checkbox' },
      );
      break;
    case 'lichtpunt':
      velden.push(
        { label: 'Soort', pad: 'variant', type: 'select', herbouw: true, opties: Object.entries(LICHTPUNTEN).map(([k, v]) => [k, v.naam]) },
        { label: 'Aantal', pad: 'aantal', type: 'number', getal: true, min: 1, max: 50 },
      );
      break;
    case 'schakelaar':
      velden.push(
        { label: 'Soort', pad: 'variant', type: 'select', herbouw: true, opties: Object.entries(SCHAKELAARS).map(([k, v]) => [k, v.naam]) },
        { label: 'Aantal op deze plaats', pad: 'aantal', type: 'number', getal: true, min: 1, max: 4 },
        { label: 'Waterdicht (IP44)', pad: 'waterdicht', type: 'checkbox' },
      );
      break;
    case 'toestel':
      velden.push(
        { label: 'Toestel', pad: 'variant', type: 'select', herbouw: true, opties: Object.entries(TOESTELLEN).map(([k, v]) => [k, v.naam]),
          daarna: (o, w) => { o.aansluiting = TOESTELLEN[w].aansluiting; o.vermogen = TOESTELLEN[w].vermogen; } },
        { label: 'Aansluiting', pad: 'aansluiting', type: 'select', opties: Object.entries(AANSLUITINGEN) },
        { label: 'Vermogen (W)', pad: 'vermogen', type: 'number', getal: true, min: 0 },
      );
      break;
  }
  velden.push({ label: 'Omschrijving / ruimte', pad: 'tekst', placeholder: 'bv. hal, tv, spiegel' });
  paneel.append(
    kop(`${code.get(id)} ${itemNaam(ding)}`, `in kring ${code.get(plek.ouder.id)}`),
    formulier(velden, doel, id),
    kop('Onderdeel toevoegen na dit'),
    palet(),
    kop('Ordenen'),
    verplaatsKeuze(id, true),
    basisActies(),
  );
}

// ---------- Opstarten ----------

export function startEditor() {
  const svg = $('#eendraad-svg');
  const stijl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  stijl.textContent = SCHEMA_STIJL;
  svg.prepend(stijl);
  vlak = new Vlak(svg);

  svg.addEventListener('click', (e) => {
    if (vlak.gesleept) return;
    const el = e.target.closest('[data-id]');
    if (el) kies(el.dataset.id);
  });

  $('#boom').addEventListener('click', (e) => {
    const klap = e.target.closest('[data-klap]');
    if (klap) {
      const id = klap.dataset.klap;
      if (staat.dicht.has(id)) staat.dicht.delete(id); else staat.dicht.add(id);
      tekenBoom();
      return;
    }
    const rij = e.target.closest('[data-id]');
    if (rij) kies(rij.dataset.id);
  });

  $('#knop-diff').addEventListener('click', voegDifferentieelToe);
  $('#knop-kring').addEventListener('click', voegKringToe);
  $('#eendraad-zoom-in').addEventListener('click', () => vlak.zoom(1.25));
  $('#eendraad-zoom-uit').addEventListener('click', () => vlak.zoom(0.8));
  $('#eendraad-passend').addEventListener('click', passend);

  let vorigeSelectie = null;
  opWijziging(({ paneel }) => {
    if (staat.tab !== 'eendraad') return;
    tekenBoom();
    tekenSchema();
    if (paneel || vorigeSelectie !== staat.selectie) tekenEigenschappen();
    vorigeSelectie = staat.selectie;
  });
}

/** Na het wisselen van tabblad of laden van een project opnieuw passend zetten. */
export function herstelZicht() {
  if (vlak) vlak.ingesteld = false;
}
