// Het tabblad Ééndraadschema: de boom links, de tekening in het midden, de eigenschappen rechts.
import {
  NETTEN, AUTOMAAT_STROMEN, CURVES, DIFF_GEVOELIGHEDEN, DIFF_TYPES, SECTIES, ADERS, KABELTYPES,
  SOORTEN, SOORT_GROEPEN, PALET, itemNaam, kabelTekst, automaatLabel, komma,
} from './catalogus.js';
import {
  nieuwDifferentieel, nieuweKring, nieuwItem, voegKnoopToe, voegItemToe, verwijder, verschuif, dupliceer, verplaatsNaar,
  zoek, codes, alleKnopen, alleKringen, kopieerNode, plakNode, losseSymbolen, koppelLos,
} from './model.js';
import { vraag, melding } from './dialoog.js';
import { tekenEendraad, SCHEMA_STIJL } from './eendraad.js';
import { icoon, esc, automaatSymbool } from './symbolen.js';
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

// ---------- Kopiëren en favorieten ----------

const MAX_KOPIEEN = 7;
const MAX_FAVORIETEN = 91;
const FAV = 'elektro-favorieten';
const gekopieerd = []; // de laatste gekopieerde groepen, kringen of onderdelen (nieuwste eerst)

/** Het gekozen ding kopiëren; het staat daarna onder "Gekopieerd" en plakken doet Ctrl+V. */
export function kopieerGekozen() {
  if (!staat.selectie || staat.selectie === 'hoofd') { melding('Kies eerst een kring of onderdeel om te kopiëren.'); return; }
  const node = kopieerNode(staat.project, staat.selectie);
  if (!node) return;
  gekopieerd.unshift(node);
  gekopieerd.length = Math.min(gekopieerd.length, MAX_KOPIEEN);
  melding('Gekopieerd. Plak met Ctrl+V of kies het onder "Gekopieerd".');
  tekenEigenschappen();
}

/** Een gekopieerd ding invoegen na de selectie (standaard het laatst gekopieerde). */
export function plakGekopieerd(index = 0) {
  const node = gekopieerd[index];
  if (!node) { melding('Er is niets gekopieerd.'); return; }
  const nieuw = wijzig((p) => plakNode(p, staat.selectie, node));
  if (nieuw) kies(nieuw.id);
  else melding('Hier kan dit niet geplakt worden: kies een kring voor onderdelen, of het hoofdbord of een groep voor kringen.', 'fout');
}

function leesFavorieten() {
  try { return JSON.parse(localStorage.getItem(FAV) || '[]'); } catch { return []; }
}
function bewaarFavorieten(lijst) {
  try { localStorage.setItem(FAV, JSON.stringify(lijst)); } catch { melding('De favorieten konden niet bewaard worden.', 'fout'); }
}

/** Het gekozen onderdeel bij de favorieten zetten: een kopie met jouw eigenschappen, altijd beschikbaar. */
function favorietToevoegen() {
  const plek = zoek(staat.project, staat.selectie);
  if (!plek || plek.ding.soort === 'kring' || plek.ding.soort === 'differentieel') { melding('Kies eerst een onderdeel.'); return; }
  const lijst = leesFavorieten();
  if (lijst.length >= MAX_FAVORIETEN) { melding(`Er kunnen maximaal ${MAX_FAVORIETEN} favorieten bewaard worden.`, 'fout'); return; }
  const { id, ...item } = structuredClone(plek.ding);
  lijst.push({ id: Math.random().toString(36).slice(2, 9), naam: itemNaam(plek.ding), item });
  bewaarFavorieten(lijst);
  melding('Toegevoegd aan je favorieten.');
  tekenEigenschappen();
}

/** Een afbeelding als eigen symbool importeren (max. 250 × 250 pixels), met de breedte waarmee het wordt afgedrukt. */
async function eigenSymboolImporteren(bestand) {
  const src = await new Promise((ok, fout) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => fout(r.error); r.readAsDataURL(bestand); });
  const img = await new Promise((ok, fout) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fout(new Error('Deze afbeelding kan niet geopend worden.')); i.src = src; });
  const f = Math.min(1, 250 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * f));
  c.height = Math.max(1, Math.round(img.naturalHeight * f));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const afb = c.toDataURL('image/png');
  const { knop, waarden } = await vraag({
    titel: 'Eigen symbool',
    tekst: 'Het symbool komt bij je favorieten. Een eigen symbool verandert niet van uitzicht als je eigenschappen wijzigt.',
    velden: [
      { naam: 'breedte', label: 'Breedte op papier (mm)', type: 'number', waarde: 10, min: 2 },
      { naam: 'omschrijving', label: 'Omschrijving op materiaallijst', waarde: '' },
    ],
  });
  if (knop !== 'ok') return;
  const lijst = leesFavorieten();
  if (lijst.length >= MAX_FAVORIETEN) { melding(`Er kunnen maximaal ${MAX_FAVORIETEN} favorieten bewaard worden.`, 'fout'); return; }
  const { id, ...item } = nieuwItem('eigen', { afb, verhouding: c.height / c.width, breedteMm: Math.max(2, waarden.breedte || 10), omschrijving: waarden.omschrijving.trim() });
  lijst.push({ id: Math.random().toString(36).slice(2, 9), naam: waarden.omschrijving.trim() || bestand.name, item });
  bewaarFavorieten(lijst);
  tekenEigenschappen();
}

/** Favorieten, gekopieerde onderdelen en losse symbolen als knoppen om toe te voegen. */
function extraKeuzes(voorKring = null) {
  const wrap = document.createElement('div');
  const favorieten = leesFavorieten();
  wrap.append(kop('Favorieten'));
  const rij = document.createElement('div');
  rij.className = 'palet';
  for (const f of favorieten) {
    const b = knop(`${icoon(nieuwItem(f.item.soort, f.item), 26)}<span>${esc(f.naam)}</span>`, () => voegOnderdeelToe(f.item.soort, f.item));
    b.title = `${f.naam} toevoegen (rechtsklik haalt het uit je favorieten)`;
    b.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      bewaarFavorieten(leesFavorieten().filter((x) => x.id !== f.id));
      tekenEigenschappen();
    });
    rij.append(b);
  }
  wrap.append(rij);
  const invoer = document.createElement('input');
  invoer.type = 'file';
  invoer.accept = 'image/*';
  invoer.hidden = true;
  invoer.addEventListener('change', async () => {
    const bestand = invoer.files?.[0];
    if (bestand) await eigenSymboolImporteren(bestand).catch((e) => melding(e.message, 'fout'));
  });
  wrap.append(invoer, knoppenrij(
    knop('☆ Gekozen onderdeel als favoriet', favorietToevoegen, { titel: 'Bewaar het gekozen onderdeel met zijn eigenschappen' }),
    knop('Eigen symbool importeren…', () => invoer.click(), { titel: 'Een afbeelding (max. 250 × 250 pixels) als symbool' }),
  ));
  if (gekopieerd.length) {
    wrap.append(kop('Gekopieerd'));
    const k = document.createElement('div');
    k.className = 'palet';
    gekopieerd.forEach((node, i) => {
      const inhoud = node.soort === 'kring' ? `<span class="ic letter">K</span><span>Kring ${esc(node.naam || '')}</span>`
        : node.soort === 'differentieel' ? `<span class="ic letter groep">G</span><span>Groep ${esc(node.naam || '')}</span>`
          : `${icoon(node, 26)}<span>${esc(itemNaam(node))}</span>`;
      k.append(knop(inhoud, () => plakGekopieerd(i), { titel: 'Invoegen' }));
    });
    wrap.append(k);
  }
  const los = losseSymbolen(staat.project);
  if (los.length && voorKring) {
    wrap.append(kop('Losse symbolen van het situatieschema'));
    const l = document.createElement('div');
    l.className = 'palet';
    for (const x of los) {
      l.append(knop(`${icoon(x.item, 26)}<span>${esc(itemNaam(x.item))}</span>`, () => { wijzig((p) => koppelLos(p, x.id, voorKring)); }, { titel: `Op ${x.planNaam}; toevoegen aan deze kring` }));
    }
    wrap.append(l);
  }
  return wrap;
}

// ---------- Boom ----------

/** Korte omschrijving van een beveiliging, voor in de boom. */
function beveiligingKort(b) {
  const polen = `${b.polen}P`;
  switch (b.beveiliging) {
    case 'geen': return 'rij';
    case 'automaat': return `${polen} ${b.curve || ''}${b.stroom}A`.replace('  ', ' ');
    case 'diffautomaat': return `Δ${b.gevoeligheid}mA ${polen} M${b.stroom}A`;
    default: return `Δ${b.gevoeligheid}mA ${polen} ${b.stroom}A`;
  }
}

function tekenBoom() {
  const p = staat.project;
  const code = codes(p);
  const rij = (id, diepte, inhoud, extra = '') =>
    `<div class="rij${id === staat.selectie ? ' gekozen' : ''}${extra}" data-id="${esc(id)}" style="--diepte:${diepte}">${inhoud}</div>`;
  const html = [rij('hoofd', 0, `<span class="ic hoofd-ic">⚡</span><b>Hoofdbord</b><small>${esc(beveiligingKort(p.hoofd))}</small>`)];
  const loop = (kinderen, diepte) => {
    for (const k of kinderen) {
      if (k.soort === 'differentieel') {
        html.push(rij(k.id, diepte, `<span class="ic letter groep">${esc(code.get(k.id))}</span><b>${esc(k.naam || 'Groep')}</b><small>${esc(beveiligingKort(k))}</small>`));
        loop(k.kinderen, diepte + 1);
      } else {
        const dicht = staat.dicht.has(k.id);
        html.push(rij(k.id, diepte,
          `<button class="klap" data-klap="${esc(k.id)}" title="${dicht ? 'Openklappen' : 'Dichtklappen'}">${k.items.length ? (dicht ? '▸' : '▾') : ''}</button>`
          + `<span class="ic letter">${esc(code.get(k.id))}</span><b>${esc(k.naam || 'Kring')}</b><small title="${esc(kabelTekst(k.kabel))}">${esc(automaatLabel(k.automaat))}</small>`));
        if (!dicht) {
          for (const item of k.items) {
            html.push(rij(item.id, diepte + 1, `${icoon(item, 22)}<span class="code">${esc(code.get(item.id))}</span><span>${esc(itemNaam(item))}</span>${item.tekst ? `<small>${esc(item.tekst)}</small>` : ''}`, ' item'));
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
  tekenPunten();
  $('#eendraad-zoom').value = vlak.s;
  $('#naam-op-schema').checked = staat.project.opties?.naamOpSchema !== false;
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
    } else if (v.type === 'textarea') {
      el = document.createElement('textarea');
      el.rows = v.rijen || 4;
      el.value = waarde ?? '';
      if (v.placeholder) el.placeholder = v.placeholder;
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
    knop('Kopiëren', kopieerGekozen, { titel: 'Ctrl+C: daarna plakken met Ctrl+V' }),
    knop('Verwijderen', verwijderGekozen, { titel: 'Delete', klasse: 'gevaar' }),
  );
}

function verplaatsKeuze(id, isItem) {
  const p = staat.project;
  const code = codes(p);
  const plek = zoek(p, id);
  const keuzes = isItem
    ? alleKringen(p).filter(({ knoop }) => knoop.id !== plek.ouder.id).map(({ knoop }) => [knoop.id, `Kring ${code.get(knoop.id)} ${knoop.naam || ''}`])
    : [['hoofd', 'Hoofdbord'], ...alleKnopen(p).filter(({ knoop }) => knoop.soort === 'differentieel' && knoop.id !== id)
      .map(({ knoop, ouders }) => [knoop.id, `${'  '.repeat(ouders.length)}Groep ${code.get(knoop.id)} ${knoop.naam || ''}`])];
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

/** Alle soorten onderdelen uit de catalogus, per groep, in een keuzelijst. */
function alleSoorten() {
  const label = document.createElement('label');
  label.className = 'veld';
  const span = document.createElement('span');
  span.textContent = 'Alle onderdelen';
  const sel = document.createElement('select');
  const groepen = SOORT_GROEPEN.map((g) => {
    const lijst = Object.entries(SOORTEN).filter(([, d]) => d.groep === g);
    return lijst.length ? `<optgroup label="${esc(g)}">${lijst.map(([k, d]) => `<option value="${esc(k)}">${esc(d.naam)}</option>`).join('')}</optgroup>` : '';
  });
  sel.innerHTML = `<option value="">Kies een onderdeel…</option>${groepen.join('')}`;
  sel.addEventListener('change', () => {
    if (sel.value) voegOnderdeelToe(sel.value, {});
  });
  label.append(span, sel);
  return label;
}

/** Een eigen opmerking per kring of groep; die komt op de bladzijde "Opmerkingen" bij het afdrukken. */
const OPMERKING = {
  label: 'Wat kan beter?', pad: 'opmerking', type: 'textarea', rijen: 4,
  placeholder: 'bv. De oven staat best op een eigen kring.',
};

const BEVEILIGINGEN = {
  differentieel: 'Differentieel',
  diffautomaat: 'Differentieelautomaat',
  automaat: 'Automatische schakelaar (bv. generaal zekering)',
  geen: 'Geen (enkel een rij)',
};
const PLAATSINGEN = {
  inWand: 'In een wand', opWand: 'Op een wand', lucht: 'Luchtleiding', buis: 'In een buis', ondergronds: 'Ondergronds', '': 'Niet tonen',
};
const stroomKeuzes = (huidig) => [...new Set([...AUTOMAAT_STROMEN, 100, 125, 160, 200, 250, Number(huidig)].filter(Boolean))].sort((a, b) => a - b);

/** De velden van een beveiliging (hoofdbord of groep): welke er getoond worden hangt af van het soort. */
function beveiligingVelden(pre, b, herbouw = true) {
  const v = (naam) => `${pre}${naam}`;
  const soort = b.beveiliging || 'differentieel';
  const velden = [
    { label: 'Soort', pad: v('beveiliging'), type: 'select', opties: Object.entries(BEVEILIGINGEN), herbouw },
  ];
  if (soort === 'geen') return velden;
  velden.push(
    { label: 'Aantal polen', pad: v('polen'), type: 'select', opties: [[1, '1P'], [2, '2P'], [3, '3P'], [4, '4P']], getal: true },
    { label: 'Nominale stroom', pad: v('stroom'), type: 'select', opties: stroomKeuzes(b.stroom).map((n) => [n, `${n} A`]), getal: true },
  );
  if (soort !== 'differentieel') velden.push({ label: 'Uitschakelcurve', pad: v('curve'), type: 'select', opties: [['', 'Niet tonen'], ...CURVES.map((c) => [c, c])] });
  if (soort !== 'automaat') {
    velden.push(
      { label: 'Gevoeligheid', pad: v('gevoeligheid'), type: 'select', opties: DIFF_GEVOELIGHEDEN.map((n) => [n, `${n} mA`]), getal: true },
      { label: 'Type', pad: v('type'), type: 'select', opties: DIFF_TYPES.map((t) => [t, `Type ${t}`]) },
    );
  }
  velden.push({ label: 'Onderbrekingsvermogen (A)', pad: v('onderbreking'), type: 'number', getal: true, min: 0, placeholder: '0 = niet tonen' });
  return velden;
}

/** Velden die bij elk onderdeel horen, naast de velden van zijn soort. */
function algemeneVelden(def, ding) {
  const velden = [];
  if (!def?.eigenAantal) velden.push({ label: 'Aantal (x3, x5, …)', pad: 'aantal', type: 'number', getal: true, min: 1, max: 99 });
  velden.push(
    { label: 'Adres (langs het symbool)', pad: 'adres', placeholder: 'bv. ZONE.01' },
    { label: 'Domotica functie', pad: 'functie', type: 'select', opties: [['', 'Niet gespecificeerd'], ['input', 'Input (stuurt aan)'], ['output', 'Output (wordt aangestuurd)']] },
    { label: 'Tekst rechts', pad: 'tekst', placeholder: 'bv. hal, spiegel, tv' },
    {
      label: 'Plaatsing', pad: 'plaatsing', type: 'select',
      opties: [['auto', 'Automatisch'], ['evenwijdig', 'Op de kringlijn (evenwijdig)'], ['eigenRij', 'Op een eigen rij']],
    },
  );
  return velden;
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
        { label: 'Net', pad: 'aansluiting.net', type: 'select', opties: Object.entries(NETTEN).map(([k, v]) => [k, v.naam]) },
        { label: 'Hoofdzekering (A)', pad: 'aansluiting.hoofdzekering', type: 'number', getal: true, min: 0 },
        { label: 'Aardingsweerstand (Ω)', pad: 'aansluiting.aardingsweerstand', type: 'number', getal: true, min: 0, stap: 0.1 },
        { label: 'Kabel van het net', pad: 'aansluiting.kabelNet', placeholder: 'bv. EXVB 4x70' },
        { label: 'Kabel naar het bord', pad: 'aansluiting.kabelBord', placeholder: 'bv. XVB 5G10' },
        { label: 'Met teller (kWh)', pad: 'hoofd.teller', type: 'checkbox' },
        { label: 'Nummer (voorvoegsel van de kringen)', pad: 'hoofd.nummer', placeholder: 'bv. 1: kringen 1A, 1B, …' },
      ], (pr) => pr, 'hoofd'),
      kop('Hoofdbeveiliging'),
      formulier(beveiligingVelden('hoofd.', p.hoofd), (pr) => pr, 'hoofd'),
      kop('Toevoegen op het hoofdbord'),
      knoppenrij(knop('+ Groep', voegDifferentieelToe), knop('+ Kring', voegKringToe)),
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
      kop(`Groep ${code.get(id)}`, ding.naam),
      formulier([
        { label: 'Naam', pad: 'naam', placeholder: 'bv. diff 30mA wassalon' },
        { label: 'Vaste letter', pad: 'letter', placeholder: 'leeg = automatisch' },
        { label: 'Nummer (voorvoegsel van de kringen hierboven)', pad: 'nummer', placeholder: 'bv. 2: dan 2A, 2B, … vanaf A' },
        { label: 'Op nieuwe pagina starten', pad: 'nieuwePagina', type: 'checkbox' },
      ], doel, id),
      kop('Opmerking'),
      formulier([OPMERKING], doel, id),
      kop('Beveiliging'),
      formulier(beveiligingVelden('', ding), doel, id),
      kop('Toevoegen op de verdeellijn van deze groep'),
      knoppenrij(knop('+ Kring', voegKringToe), knop('+ Groep', voegDifferentieelToe)),
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
        { label: 'Naam (bovenaan)', pad: 'naam', placeholder: 'bv. keuken stopcontacten' },
        { label: 'Vaste letter', pad: 'letter', placeholder: 'leeg = automatisch' },
        { label: 'Badkamer of natte ruimte', pad: 'badkamer', type: 'checkbox' },
        { label: 'Op nieuwe pagina starten', pad: 'nieuwePagina', type: 'checkbox' },
      ], doel, id),
      kop('Opmerking'),
      formulier([OPMERKING], doel, id),
      kop('Automaat'),
      formulier([
        { label: 'Stroom', pad: 'automaat.stroom', type: 'select', opties: stroomKeuzes(ding.automaat.stroom).map((n) => [n, `${n} A`]), getal: true },
        { label: 'Curve', pad: 'automaat.curve', type: 'select', opties: [['', 'Niet tonen'], ...CURVES.map((c) => [c, `curve ${c}`])] },
        { label: 'Aantal polen', pad: 'automaat.polen', type: 'select', opties: [[1, '1P'], [2, '2P'], [3, '3P'], [4, '4P']], getal: true },
        { label: 'Onderbrekingsvermogen (A)', pad: 'automaat.onderbreking', type: 'number', getal: true, min: 0, placeholder: '0 = niet tonen' },
        { label: 'Differentieelautomaat (mA)', pad: 'automaat.gevoeligheid', type: 'select', getal: true, opties: [[0, 'Nee'], ...DIFF_GEVOELIGHEDEN.map((n) => [n, `${n} mA`])] },
      ], doel, id),
      kop('Kabel'),
      formulier([
        { label: 'Type', pad: 'kabel.type', type: 'select', opties: Object.entries(KABELTYPES).map(([k, v]) => [k, v.naam]) },
        { label: 'Aders', pad: 'kabel.aders', type: 'select', opties: ADERS.map((n) => [n, String(n)]), getal: true },
        { label: 'Doorsnede', pad: 'kabel.sectie', type: 'select', opties: SECTIES.map((n) => [n, `${komma(n)} mm²`]), getal: true },
        { label: 'Lengte (m)', pad: 'kabel.lengte', type: 'number', getal: true, min: 0 },
        { label: 'Plaatsing', pad: 'kabel.plaatsing', type: 'select', opties: Object.entries(PLAATSINGEN) },
      ], doel, id),
      kop('Onderdeel toevoegen'),
      palet(),
      alleSoorten(),
      extraKeuzes(id),
      knoppenrij(knop('+ Kring hierna', voegKringToe)),
      kop('Ordenen'),
      verplaatsKeuze(id, false),
      basisActies(),
    );
    return;
  }

  // Een onderdeel: de velden van zijn soort, dan de algemene velden.
  const def = SOORTEN[ding.soort];
  paneel.append(
    kop(`${code.get(id)} ${itemNaam(ding)}`, `in kring ${code.get(plek.ouder.id)}`),
    formulier([...(def?.velden || []).map((v) => ({ herbouw: v.type === 'select' || v.type === 'checkbox', ...v })), ...algemeneVelden(def, ding)], doel, id),
    knoppenrij(knop('Zoek op situatieschema', () => window.dispatchEvent(new CustomEvent('actie', { detail: 'zoekSS' })), { titel: 'Toon dit symbool op het plan (Ctrl+F op het plan zoekt terug)' })),
    kop('Onderdeel toevoegen na dit'),
    palet(),
    alleSoorten(),
    extraKeuzes(null),
    kop('Ordenen'),
    verplaatsKeuze(id, true),
    basisActies(),
  );
}

// ---------- Tekenen met de bibliotheek en de oranje aansluitpunten (zoals in Trikker) ----------

let modus = 'selecteren'; // 'tekenen' | 'selecteren' | 'verplaats'
let bibCat = 'kringen';
let bibGekozen = null; // { sleutel, soort: 'item'|'kring'|'groep'|'kabel', maak: () => ... }
let verplaatsId = null;

const STROMEN = [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63];
const kringIcoon = (polen, curve, stroom) =>
  `<svg viewBox="0 0 90 50" width="86" height="48" class="icoon"><g transform="translate(0 -3)"><line class="l" x1="2" y1="22" x2="30" y2="22"/><g transform="rotate(90 31 22) translate(9 -9)">${automaatSymbool(22, 0)}</g><line class="l" x1="38" y1="22" x2="88" y2="22"/></g><rect x="34" y="23" width="22" height="9" fill="none" stroke="#000" stroke-width="0.6"/><text class="k" x="45" y="31" text-anchor="middle">3000</text><text class="k" x="45" y="43" text-anchor="middle">${polen}P - ${curve}${stroom}A</text></svg>`;
const diffIcoon = (polen, stroom, g) =>
  `<svg viewBox="0 0 100 60" width="96" height="58" class="icoon"><g transform="translate(0 -7)"><line class="l" x1="2" y1="22" x2="30" y2="22"/><g transform="rotate(90 31 22) translate(9 -9)">${automaatSymbool(22, 0)}</g><line class="l" x1="38" y1="22" x2="92" y2="22"/></g><line x1="92" y1="2" x2="92" y2="38" stroke="#000" stroke-width="1.6"/><text class="k" x="45" y="27" text-anchor="middle">Type A - Δ${g}mA</text><rect x="34" y="30" width="22" height="9" fill="none" stroke="#000" stroke-width="0.6"/><text class="k" x="45" y="38" text-anchor="middle">3000</text><text class="k" x="45" y="50" text-anchor="middle">${polen}P - ${stroom}A</text></svg>`;
const kabelIcoon = (t) => `<svg viewBox="0 0 90 28" width="86" height="26" class="icoon"><line class="l" x1="6" y1="8" x2="84" y2="8"/><text class="k" x="45" y="22" text-anchor="middle">${esc(t)}</text></svg>`;

/**
 * De bibliotheek, opgebouwd zoals in Trikker: tien tabbladen, per symbool een eerste kolom met een tweede kolom
 * met varianten. Combinaties (kring met kabel en onderdelen, schakelaar met lamp) komen in één klik op het schema.
 */
function bibliotheek() {
  const nieuw = (soort, w = {}) => nieuwItem(soort, structuredClone(w));
  const item = (soort, w = {}, naam) => ({ type: 'item', naam: naam || itemNaam(nieuw(soort, w)), icoon: icoon(nieuw(soort, w), 30), maak: () => nieuw(soort, w) });
  const tekst = () => ({ ...item('nota', { opschrift: 'Tekst' }), naam: 'Tekst', icoon: '<span class="k">Tekst</span>' });
  /** Een rij onderdelen die samen komen (bv. schakelaar met lichtpunt). */
  const keten = (lijst, naam) => ({
    type: 'items', naam,
    icoon: `<span class="combo">${lijst.map(([s, w]) => icoon(nieuw(s, w), 24)).join('')}</span>`,
    maak: () => lijst.map(([s, w]) => nieuw(s, w)),
  });
  const automaatWaarden = (polen, stroom, curve = 'C') => ({ stroom, curve, polen, onderbreking: 3000 });
  const KABELS = { VOB: { type: 'VOB', aders: 3, sectie: 1.5 }, XVB: { type: 'XVB', aders: 3, sectie: 1.5 } };
  /** Een volledige kring: automaat, kabel en onderdelen. */
  const kring = ({ polen = 2, stroom = 16, kabel = {}, items = [], naam, icoonItems = items, plaatsing }) => ({
    type: 'kring', naam: naam || `${polen}P - C${stroom}A${kabel.type ? ` ${kabel.type}` : ''}`,
    icoon: `<span class="combo">${kringIcoon(polen, 'C', stroom)}${icoonItems.map(([s, w]) => icoon(nieuw(s, w), 24)).join('')}</span>`,
    maak: () => {
      const k = nieuweKring({ automaat: automaatWaarden(polen, stroom), kabel: { lengte: 0, ...kabel, ...(plaatsing !== undefined ? { plaatsing } : {}) } });
      k.items.push(...items.map(([s, w]) => nieuw(s, w)));
      return k;
    },
  });
  const PLAATSINGEN3 = [['', 'Zonder plaatsing'], ['inWand', 'In de wand'], ['opWand', 'Op de wand']];
  /** Een kring met kabel in drie plaatsingen: de eerste is het hoofditem, de andere komen in het tweede vak. */
  const metPlaatsingen = (opties) => {
    const [basis, ...rest] = PLAATSINGEN3.map(([p, l]) => ({ ...kring({ ...opties, plaatsing: p }), naam: `${kring(opties).naam} (${l.toLowerCase()})` }));
    return { ...basis, tweede: [basis, ...rest] };
  };
  const cats = [];

  // 1. Verlichting
  const trafoSpot = [['transformator', {}], ['lichtpunt', { variant: 'spot' }]];
  const trafoLed = [['transformator', {}], ['lichtpunt', { variant: 'led' }]];
  const licht = (extra) => [
    { ...item('lichtpunt'), tweede: [
      item('lichtpunt', { variant: 'spot' }), keten(trafoSpot, 'Transformator met spot'), item('lichtpunt', { variant: 'led' }), item('lichtpunt', { variant: 'ledstrip' }),
      keten(trafoLed, 'Transformator met led'), item('lichtpunt', { variant: 'signalisatie' }), item('lichtpunt', { wand: true }, 'Wandverlichting'),
      item('lichtpunt', { nood: 'centraal' }, 'Noodverlichting centraal'), item('lichtpunt', { nood: 'decentraal' }, 'Noodverlichting decentraal'), item('transformator'),
    ] },
    { ...item('lichtpunt', { variant: 'tl' }), tweede: [2, 3].map((n) => item('lichtpunt', { variant: 'tl', buizen: n }, `TL met ${n} buislampen`)) },
    ...extra,
  ];
  const lichtKring = (kabel) => metPlaatsingen({ polen: 2, stroom: 16, kabel });
  cats.push({
    id: 'verlichting', naam: 'Verlichting', icoon: icoon(nieuw('schakelaar'), 34),
    items: [
      { ...item('schakelaar'), tweede: [item('schakelaar', { variant: 'wissel' }), item('schakelaar', { variant: 'kruis' }), item('schakelaar', { variant: 'tweepolig' }), item('schakelaar', { variant: 'serie' })] },
      ...licht([
        lichtKring(KABELS.VOB), lichtKring(KABELS.XVB),
        keten([['schakelaar', {}], ['lichtpunt', {}]], 'Enkelpolige schakeling'),
        keten([['schakelaar', { variant: 'wissel' }], ['schakelaar', { variant: 'wissel' }], ['lichtpunt', {}]], 'Wisselschakeling'),
        keten([['schakelaar', { variant: 'wissel' }], ['schakelaar', { variant: 'kruis' }], ['schakelaar', { variant: 'wissel' }], ['lichtpunt', {}]], 'Kruisschakeling'),
        { ...keten([['schakelaar', { variant: 'tweepolig' }], ['lichtpunt', {}]], 'Tweepolige schakelaar met lichtpunt'), tweede: [
          keten([['schakelaar', { variant: 'tweepolig' }], ['lichtpunt', {}]], 'Tweepolige schakelaar met lichtpunt'),
          keten([['schakelaar', { variant: 'tweepolig', verklikker: true }], ['lichtpunt', {}]], 'Met verklikkerlamp'),
          keten([['schakelaar', { variant: 'serie' }], ['lichtpunt', {}], ['lichtpunt', {}]], 'Serieschakelaar met twee lichtpunten'),
          keten([['schakelaar', { variant: 'dubbelewissel' }], ['schakelaar', { variant: 'wissel' }], ['lichtpunt', {}], ['lichtpunt', {}]], 'Dubbele wisselschakeling'),
        ] },
        item('automaat', { variant: 'contact', polen: 0 }, 'Contact'), item('voorschakelapparaat'),
      ]),
      tekst(),
    ],
  });

  // 2. Kringen
  const poolKeuzes = (polen) => ({ type: 'kring', naam: `Automaat ${polen}P`, icoon: kringIcoon(polen, 'C', 16), maak: () => nieuweKring({ automaat: automaatWaarden(polen, 2) }),
    tweede: STROMEN.map((a) => ({ type: 'kring', naam: `${polen}P - C${a}A`, icoon: kringIcoon(polen, 'C', a), maak: () => nieuweKring({ automaat: automaatWaarden(polen, a) }) })) });
  const diffs = [2, 4].flatMap((polen) => [40, 63].flatMap((stroom) => [30, 300].map((g) => ({ polen, stroom, g }))));
  const diffItem = ({ polen, stroom, g }) => ({ type: 'groep', naam: `Type A - Δ${g}mA ${polen}P - ${stroom}A`, icoon: diffIcoon(polen, stroom, g), maak: () => nieuwDifferentieel({ gevoeligheid: g, polen, stroom }) });
  const kabelRij = (aders) => ({ type: 'kabel', naam: `Leiding ${aders}G`, icoon: kabelIcoon(`${aders}G1,5`), maak: () => ({ aders, sectie: 1.5 }),
    tweede: [1.5, 2.5, 4, 6, 10, 16].map((x) => ({ type: 'kabel', naam: `${aders}G${x}`, icoon: kabelIcoon(`${aders}G${komma(x)}`), maak: () => ({ aders, sectie: x }) })) });
  const meter = (sectie) => kring({ polen: 4, stroom: 40, kabel: { type: 'EXVB', aders: 4, sectie, plaatsing: 'ondergronds' }, items: [['teller', { opschrift: 'kWh' }]], naam: `Teller met EXVB 4G${sectie}` });
  cats.push({
    id: 'kringen', naam: 'Kringen', icoon: kringIcoon(2, 'C', 16),
    items: [
      poolKeuzes(2), poolKeuzes(4),
      { ...diffItem(diffs[1]), tweede: diffs.map(diffItem) },
      { type: 'groep', naam: 'Verdeelbord', icoon: '<svg viewBox="0 0 80 30" width="80" height="26" class="icoon"><line class="l bus" x1="6" y1="8" x2="74" y2="8"/><line class="l" x1="40" y1="8" x2="40" y2="24"/></svg>', maak: () => nieuwDifferentieel({ beveiliging: 'geen' }) },
      { ...item('smeltveiligheid'), tweede: [item('automaat', { variant: 'zekeringscheider', polen: 0 }, 'Zekeringscheider'), item('beveiliging', { variant: 'thermisch' }), item('beveiliging', { variant: 'elektromagnetisch' }), item('overspanning')] },
      kabelRij(3), kabelRij(5),
      item('aansluitpunt', {}, 'Aansluitklem'), item('automaat', { variant: 'draai', polen: 0 }, 'Draaischakelaar'),
      { ...item('aardingsstrip'), tweede: [item('aarding')] },
      { ...item('teller'), tweede: [10, 16, 25].map(meter) },
      tekst(),
    ],
  });

  // 3. Stopcontacten
  const sc = (w, naam) => item('stopcontact', w, naam);
  const stopKring = (kabel) => metPlaatsingen({ polen: 2, stroom: 16, kabel: { ...kabel, sectie: 2.5 }, items: [['stopcontact', {}]] });
  cats.push({
    id: 'stopcontacten', naam: 'Stopcontacten', icoon: icoon(nieuw('stopcontact'), 34),
    items: [
      sc({}), sc({ aantal: 2 }), sc({ aantal: 3 }), sc({ aantal: 4 }),
      { ...sc({ kinderveilig: false, aarding: false }, 'Contactdoos zonder bescherming'), tweede: [
        sc({ kinderveilig: true, aarding: false }), sc({ kinderveilig: false, aarding: false, fasen: 1, nul: true }), sc({ kinderveilig: false, aarding: true, fasen: 1, nul: true, pe: true }),
        sc({ kinderveilig: false, aarding: false, fasen: 3 }), sc({ kinderveilig: false, aarding: true, fasen: 3, nul: true, pe: true }),
        sc({ kinderveilig: false, aarding: false, transformator: true }), sc({ kinderveilig: false, aarding: false, transformator: true, opschrift: 'USB' }),
      ] },
      { ...sc({ waterdicht: true }), tweede: [sc({ waterdicht: true, aantal: 2 }), sc({ waterdicht: true, aantal: 3 })] },
      stopKring(KABELS.VOB), stopKring(KABELS.XVB),
      tekst(),
    ],
  });

  // 4. Toestellen
  const toestel = (variant) => item('toestel', { variant });
  cats.push({
    id: 'toestellen', naam: 'Toestellen', icoon: icoon(nieuw('toestel', { variant: 'kookplaat' }), 34),
    items: [
      ...['ander', 'wasmachine', 'droogkast', 'kookplaat', 'vaatwasser', 'koelkast', 'diepvries', 'oven', 'microgolf', 'stoomoven', 'ventilatie'].map(toestel),
      { ...item('ketel', { energie: 'gasVentilator' }), tweede: [
        item('ketel', { energie: 'gasAtmosferisch' }), item('ketel', { energie: 'vloeibaar' }), item('ketel', { energie: 'vast' }), item('ketel', { energie: 'elektriciteit' }),
        item('pomp'), item('ventiel'), item('relais', { variant: 'thermostaat' }),
      ] },
      item('ketel', { energie: 'elektriciteit', variant: 'warmtewisselaar', functie: 'beide' }), item('aftakdoos'),
      tekst(),
    ],
  });

  // 5. Impulsschakelingen
  const drukRelais = (soortRelais, kinderen, naam) => keten([['drukknop', {}], ['relais', { variant: soortRelais }], ...kinderen], naam);
  cats.push({
    id: 'impuls', naam: 'Impulsschakelingen', icoon: icoon(nieuw('drukknop'), 34),
    items: [
      { ...item('drukknop'), tweede: [
        item('drukknop', { waterdicht: true }), item('drukknop', { verklikker: true }, 'Drukknop met verklikkerlamp'), item('drukknop', { afgeschermd: true }),
        item('drukknop', { knoppen: 2 }), item('drukknop', { knoppen: 4 }), item('drukknop', { knoppen: 6 }), item('drukknop', { dimmer: true }), item('drukknop', { rolluik: true }),
      ] },
      { ...item('relais', { variant: 'impuls' }), tweede: ['dimmer', 'relais', 'basis', 'minuterie', 'thermostaat', 'tijd'].map((v) => item('relais', { variant: v })) },
      ...licht([
        lichtKring(KABELS.VOB), lichtKring(KABELS.XVB),
        { ...drukRelais('impuls', [['lichtpunt', {}]], 'Drukknop, impulsrelais en lichtpunt'), tweede: [
          drukRelais('impuls', [['lichtpunt', {}]], 'Drukknop, impulsrelais en lichtpunt'), drukRelais('impuls', [], 'Drukknop en impulsrelais'),
          drukRelais('impuls', [['lichtpunt', { variant: 'tl' }]], 'Met TL'), drukRelais('impuls', [['lichtpunt', { variant: 'spot' }]], 'Met spot'),
          drukRelais('impuls', trafoSpot, 'Met transformator en spot'), drukRelais('impuls', trafoLed, 'Met transformator en led'),
        ] },
        { ...drukRelais('dimmer', [['lichtpunt', {}]], 'Drukknop, dimmer en lichtpunt'), tweede: [
          drukRelais('dimmer', [['lichtpunt', {}]], 'Drukknop, dimmer en lichtpunt'), drukRelais('dimmer', [], 'Drukknop en dimmer'),
          drukRelais('dimmer', [['lichtpunt', { variant: 'tl' }]], 'Met TL'), drukRelais('dimmer', [['lichtpunt', { variant: 'spot' }]], 'Met spot'),
          drukRelais('dimmer', trafoSpot, 'Met transformator en spot'), drukRelais('dimmer', trafoLed, 'Met transformator en led'),
        ] },
        kring({ polen: 2, stroom: 6, items: [['transformator', {}], ['drukknop', {}]], naam: 'Kring met transformator en drukknoppen' }),
      ]),
      tekst(),
    ],
  });

  // 6. Laagspanning
  cats.push({
    id: 'laagspanning', naam: 'Laagspanning', icoon: icoon(nieuw('geluidsbron'), 34),
    items: [
      keten([['transformator', {}], ['drukknop', {}], ['geluidsbron', { variant: 'bel' }]], 'Transformator, drukknop en bel'),
      item('transformator'), item('drukknop'),
      { ...item('geluidsbron', { variant: 'bel' }), tweede: ['hoorn', 'sirene', 'zoemer'].map((v) => item('geluidsbron', { variant: v })) },
      item('deurslot'), item('intercom'), item('monitor'), item('luidspreker'),
      tekst(),
    ],
  });

  // 7. Beveiliging (alarm en detectie)
  const alarmKabel = (t) => ({ type: 'kabel', naam: t, icoon: kabelIcoon(t), maak: () => ({ type: 'XVB', tekst: t }) });
  cats.push({
    id: 'alarm', naam: 'Beveiliging', icoon: icoon(nieuw('bewegingsdetector'), 34),
    items: [
      { ...kring({ polen: 2, stroom: 6, items: [['transformator', {}], ['domotica', { module: 'Centrale' }]], naam: 'Kring met transformator en centrale' }) },
      { ...alarmKabel('2x0,75 + 4x0,22'), tweede: ['2x0,75 + 4x0,22', '2x0,75 + 6x0,22', '2x0,75 + 8x0,22', '4x0,22', '6x0,22', '8x0,22'].map(alarmKabel) },
      { ...item('branddetector', { variant: 'rook' }), tweede: ['gas', 'manueel', 'straal', 'vlam', 'warmte'].map((v) => item('branddetector', { variant: v })) },
      item('bewegingsdetector', { variant: 'basis' }),
      { ...item('bewegingsdetector', { variant: 'gespreid' }), tweede: [
        item('bewegingsdetector', { variant: 'gericht' }), item('bewegingsdetector', { variant: 'rondom' }), item('bewegingsdetectorActief'),
        item('bewegingsdetector', { variant: 'gespreid', infrarood: false, ultrasoon: true }), item('bewegingsdetector', { variant: 'gespreid', infrarood: false, radar: true }),
        item('bewegingsdetector', { variant: 'gespreid', radar: true }), item('bewegingsdetector', { variant: 'gespreid', ultrasoon: true }),
        item('bewegingsdetector', { variant: 'rondom', radar: true }), item('bewegingsdetector', { variant: 'rondom', ultrasoon: true }),
      ] },
      { ...item('geluidsbron', { variant: 'hoorn' }), tweede: [
        item('geluidsbron', { variant: 'hoorn', autonoom: true }), keten([['lichtpunt', { variant: 'signalisatie' }], ['geluidsbron', { variant: 'hoorn' }]], 'Signalisatielamp met hoorn'),
        keten([['lichtpunt', { variant: 'signalisatie' }], ['geluidsbron', { variant: 'hoorn', autonoom: true }]], 'Signalisatielamp met autonome hoorn'),
        item('geluidsbron', { variant: 'bel' }), item('geluidsbron', { variant: 'sirene' }), item('geluidsbron', { variant: 'zoemer' }), item('lichtpunt', { variant: 'signalisatie' }),
      ] },
      { ...item('beveiligingscontact', { variant: 'magneet' }), tweede: ['schoot', 'mechanisch', 'tril', 'drukmat', 'afneem'].map((v) => item('beveiligingscontact', { variant: v })) },
      { ...item('trillingsdetector', { variant: 'glasbreuk' }), tweede: [item('trillingsdetector', { variant: 'glasbreuk', actief: true }), item('trillingsdetector', { variant: 'mechanisch' }), item('trillingsdetector', { variant: 'mechanisch', actief: true })] },
      { ...item('camera'), tweede: [
        item('camera', { beweegbaar: true }), item('camera', { variant: 'dome', beweegbaar: true }), item('camera', { variant: 'behuizing' }), item('camera', { variant: 'behuizing', beweegbaar: true }),
        item('intercom'), item('microfoon'), item('monitor'),
      ] },
      { ...item('slot', { variant: 'code' }), tweede: [item('slot', { variant: 'inschakel' }), item('slot', { variant: 'tijd' }), item('deurslot'), item('drukknop')] },
      item('kiezer'),
      item('toestelKlein', { opschrift: 'C' }, 'Centrale'),
      tekst(),
    ],
  });

  // 8. Relais
  cats.push({
    id: 'relais', naam: 'Relais', icoon: icoon(nieuw('relais', { variant: 'relais' }), 34),
    items: [
      ...['basis', 'relais', 'dimmer', 'impuls', 'minuterie', 'thermostaat', 'tijd'].map((v) => item('relais', { variant: v })),
      item('automaat', { variant: 'contact', polen: 0 }, 'Contact'), item('automaat', { variant: 'schemer', polen: 0 }, 'Schemerschakelaar'),
      tekst(),
    ],
  });

  // 9. Domotica
  const domKring = (items, naam) => kring({ polen: 2, stroom: 16, kabel: { ...KABELS.VOB }, items, naam });
  cats.push({
    id: 'domotica', naam: 'Domotica', icoon: '<span class="k">Domotica</span>',
    items: [
      domKring([['domotica', { module: 'Domotica' }]], 'Kring met domoticamodule'), kring({ polen: 2, stroom: 16, kabel: { ...KABELS.VOB }, naam: 'Kring met leiding' }),
      item('domotica', { module: 'Domotica' }),
      { ...item('drukknop', { compact: true }, 'Drukknop (domotica)'), tweede: [item('drukknop', { knoppen: 2 }), item('drukknop', { knoppen: 4 }), item('drukknop', { verklikker: true }), item('schakelaar', { variant: 'enkelpolig', verklikker: true })] },
      { ...item('schakelaar', { variant: 'enkelpolig', verklikker: true }), tweede: [item('drukknop'), item('drukknop', { verklikker: true })] },
      { ...item('stopcontact', { schakelaar: 'enkel' }, 'Contactdoos met schakelaar'), tweede: [item('drukknop'), item('drukknop', { verklikker: true })] },
      item('domotica', { module: 'Sturing', uitgangen: '' }, 'Domoticasturing'),
      { ...item('aansluitpunt'), tweede: [item('aansluitpunt', { opschrift: '1' })] },
      { ...keten([['relais', { variant: 'relais' }], ['lichtpunt', {}]], 'Relais met lichtpunt'), tweede: [keten([['relais', { variant: 'dimmer' }], ['lichtpunt', {}]], 'Dimmer met lichtpunt')] },
      tekst(),
    ],
  });

  // 10. Varia
  const batterij = item('omvormer', {}, 'Omvormer');
  cats.push({
    id: 'varia', naam: 'Varia', icoon: icoon(nieuw('zonnepaneel', { gestandaardiseerd: true }), 34),
    items: [
      item('zonnepaneel', { gestandaardiseerd: true }), batterij, item('toestel', { variant: 'laadpaal' }),
      item('ketel', { energie: 'elektriciteit', variant: 'warmtewisselaar', functie: 'beide' }), item('verwarmingstoestel'), item('boiler'), item('motor'),
      item('schakelaar', { rolluik: true }, 'Rolluikschakelaar'), item('pomp'), item('ventiel'), item('communicatie'),
      { ...item('aansluitpunt', {}, 'Aansluitklem'), tweede: [item('aansluitpunt', { opschrift: '1' })] },
      tekst(),
    ],
  });

  const VOLGORDE = ['kringen', 'stopcontacten', 'verlichting', 'impuls', 'relais', 'toestellen', 'laagspanning', 'alarm', 'domotica', 'varia'];
  cats.sort((a, b) => VOLGORDE.indexOf(a.id) - VOLGORDE.indexOf(b.id));
  cats.push({ id: 'gekopieerd', naam: 'Gekopieerd', icoon: '⧉', items: gekopieerd.map((node) => ({ type: node.soort === 'kring' ? 'kring' : node.soort === 'differentieel' ? 'groep' : 'item', naam: node.naam || itemNaam(node), icoon: node.soort === 'kring' || node.soort === 'differentieel' ? `<span class="k">${esc(node.naam || node.soort)}</span>` : icoon(node, 30), maak: () => plakKopie(node) })) });
  cats.push({ id: 'favorieten', naam: 'Favorieten', icoon: '☆', items: leesFavorieten().map((f) => ({ type: 'item', naam: f.naam, icoon: icoon(nieuwItem(f.item.soort, f.item), 30), maak: () => { const { id, ...rest } = structuredClone(f.item); return nieuwItem(f.item.soort, rest); } })) });
  return cats;
}

function plakKopie(node) {
  const k = structuredClone(node);
  const herid = (x) => { x.id = Math.random().toString(36).slice(2, 10); x.kinderen?.forEach(herid); x.items?.forEach(herid); };
  herid(k);
  return k;
}

function tekenBibliotheek() {
  const cats = bibliotheek();
  if (!cats.some((c) => c.id === bibCat)) bibCat = cats[0].id;
  $('#bib-cats').innerHTML = cats.map((c) => `<button class="${c.id === bibCat ? 'aan' : ''}" data-cat="${esc(c.id)}" title="${esc(c.naam)}">${c.icoon.startsWith('<') ? c.icoon : `<span style="font-size:22px">${c.icoon}</span>`}</button>`).join('');
  const cat = cats.find((c) => c.id === bibCat);
  const lijst = cat.items;
  const sleutel = (i, j = '') => `${cat.id}:${i}${j === '' ? '' : `.${j}`}`;
  $('#bib-lijst').innerHTML = lijst.map((it, i) => `<button class="bib-item${bibGekozen?.sleutel === sleutel(i) ? ' aan' : ''}" data-i="${i}" title="${esc(it.naam)}"><span>${it.icoon}</span>${it.tweede ? '<span class="pijl">▶</span>' : ''}</button>`).join('') || '<p class="hint">Hier staat nog niets.</p>';
  const open = lijst[bibGekozen?.i ?? -1];
  $('#bib-lijst2').innerHTML = open?.tweede && bibGekozen?.cat === cat.id ? open.tweede.map((it, j) => `<button class="bib-item${bibGekozen?.sleutel === sleutel(bibGekozen.i, j) ? ' aan' : ''}" data-i="${bibGekozen.i}" data-j="${j}" title="${esc(it.naam)}">${it.icoon}</button>`).join('') : '';
  cat.lijst = lijst;
  bibliotheek.laatste = cat;
}

/** Waar mag het gekozen symbool komen? */
function geldigePunten(punten) {
  const vrij = $('#vrij-tekenen').checked;
  const soort = modus === 'verplaats' ? (() => { const d = zoek(staat.project, verplaatsId)?.ding; return d ? (d.soort === 'kring' || d.soort === 'differentieel' ? 'knoop' : 'item') : null; })() : bibGekozen ? ({ kring: 'knoop', groep: 'knoop', item: 'item', items: 'item', kabel: 'kabel' })[bibGekozen.soort] : null;
  if (!soort) return [];
  return punten.filter((p) => {
    if (vrij) return true;
    if (p.soort !== soort) return false;
    if (modus === 'verplaats') {
      const d = zoek(staat.project, verplaatsId)?.ding;
      if (p.ouder === verplaatsId) return false;
      if (d?.soort === 'differentieel') { const probeer = (x) => x.kinderen.some((c) => c.id === p.ouder || (c.soort === 'differentieel' && probeer(c))); if (probeer(d)) return false; }
    }
    return true;
  });
}

function tekenPunten() {
  vlak.g.querySelector('.punten')?.remove();
  if (modus === 'selecteren' || !vlak.laatste) return;
  const lijst = geldigePunten(vlak.laatste.punten || []);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'punten');
  g.innerHTML = lijst.map((p, i) => `<circle class="punt" data-punt="${(vlak.laatste.punten).indexOf(p)}" cx="${p.x}" cy="${p.y}" r="6"/>`).join('');
  vlak.g.append(g);
}

/** Een nieuw ding op een aansluitpunt zetten. */
function plaatsBijPunt(p, ding, soort) {
  if (soort === 'kabel') { Object.assign(zoek(p, ding.ouder).ding.kabel, ding.waarden); return null; }
  return null;
}

function voegBijPunt(punt, nieuw) {
  return wijzig((p) => {
    if (punt.soort === 'knoop') {
      const lijst = punt.ouder === 'hoofd' ? p.kinderen : zoek(p, punt.ouder)?.ding.kinderen;
      if (lijst) lijst.push(nieuw);
    } else if (punt.soort === 'item') {
      const k = zoek(p, punt.ouder)?.ding;
      if (k?.items) {
        const i = punt.na ? k.items.findIndex((x) => x.id === punt.na) + 1 : k.items.length;
        k.items.splice(i, 0, nieuw);
      }
    }
  });
}

function klikPunt(punt) {
  if (modus === 'verplaats') {
    const id = verplaatsId;
    const node = kopieerNode(staat.project, id);
    if (!node) return;
    wijzig((p) => {
      const plek = zoek(p, id);
      if (!plek) return;
      plek.lijst.splice(plek.index, 1);
      if (punt.soort === 'knoop') (punt.ouder === 'hoofd' ? p.kinderen : zoek(p, punt.ouder).ding.kinderen).push(plek.ding);
      else { const k = zoek(p, punt.ouder).ding; const i = punt.na ? k.items.findIndex((x) => x.id === punt.na) + 1 : k.items.length; k.items.splice(i, 0, plek.ding); }
    });
    zetModus('selecteren');
    kies(id);
    return;
  }
  if (!bibGekozen) return;
  if (bibGekozen.soort === 'kabel') {
    wijzig((p) => { const k = zoek(p, punt.ouder)?.ding; if (k?.kabel) Object.assign(k.kabel, bibGekozen.maak()); });
    return;
  }
  const nieuw = bibGekozen.maak();
  if (Array.isArray(nieuw)) {
    wijzig((p) => {
      const k = zoek(p, punt.ouder)?.ding;
      if (!k?.items) return;
      const i = punt.na ? k.items.findIndex((x) => x.id === punt.na) + 1 : k.items.length;
      k.items.splice(i, 0, ...nieuw);
    });
    kies(nieuw[0].id);
    return;
  }
  voegBijPunt(punt, nieuw);
  kies(nieuw.id);
}

export function zetModus(m) {
  modus = m;
  verplaatsId = m === 'verplaats' ? staat.selectie : null;
  const tekenen = m !== 'selecteren';
  $('#tab-eendraad').classList.toggle('bib', m === 'tekenen');
  $('#bib').hidden = m !== 'tekenen';
  $('#boom').hidden = m === 'tekenen';
  $('#boomkop').hidden = m === 'tekenen';
  for (const b of document.querySelectorAll('[data-eend=tekenen],[data-eend=selecteren],[data-eend=verplaatsen]')) {
    b.classList.toggle('aan', b.dataset.eend === (m === 'verplaats' ? 'verplaatsen' : m));
  }
  void tekenen;
  if (m === 'tekenen') tekenBibliotheek();
  tekenPunten();
}

function koppelBibliotheek() {
  $('#bib-cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    bibCat = b.dataset.cat;
    bibGekozen = null;
    tekenBibliotheek();
    tekenPunten();
  });
  const kies2 = (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const cat = bibliotheek.laatste;
    const i = Number(b.dataset.i);
    const j = b.dataset.j != null ? Number(b.dataset.j) : null;
    const it = j == null ? cat.items[i] : cat.items[i].tweede[j];
    bibGekozen = { cat: cat.id, i, sleutel: `${cat.id}:${i}${j == null ? '' : `.${j}`}`, soort: it.type, maak: it.maak };
    tekenBibliotheek();
    tekenPunten();
  };
  $('#bib-lijst').addEventListener('click', kies2);
  $('#bib-lijst2').addEventListener('click', kies2);
  vlak.svg.addEventListener('click', (e) => {
    const c = e.target.closest('[data-punt]');
    if (c && !vlak.gesleept) klikPunt(vlak.laatste.punten[Number(c.dataset.punt)]);
  });
  $('#vrij-tekenen').addEventListener('change', tekenPunten);
  $('#naam-op-schema').addEventListener('change', (e) => wijzig((p) => { p.opties = { ...p.opties, naamOpSchema: e.target.checked }; }, { paneel: false }));
  $('#eendraad-zoom').addEventListener('input', (e) => { vlak.zoom(Number(e.target.value) / vlak.s); });
  for (const b of document.querySelectorAll('[data-eend]')) {
    b.addEventListener('click', () => {
      const a = b.dataset.eend;
      if (a === 'tekenen') zetModus('tekenen');
      else if (a === 'selecteren') zetModus('selecteren');
      else if (a === 'wissen') verwijderGekozen();
      else if (a === 'kopieren') kopieerGekozen();
      else if (a === 'verplaatsen') { if (!staat.selectie || staat.selectie === 'hoofd') melding('Kies eerst iets om te verplaatsen.'); else zetModus('verplaats'); }
      else if (a === 'favoriet') favorietToevoegen();
      else if (a === 'verder') verschuifGekozen(1);
      else if (a === 'terug') verschuifGekozen(-1);
      else if (a === 'zoekss') window.dispatchEvent(new CustomEvent('actie', { detail: 'zoekSS' }));
    });
  }
}

/** Sneltoetsen van de tekenmodus (Ctrl+D tekenen, Ctrl+E selecteren, Ctrl+X verplaatsen, Ctrl+pijlen verder of terug). */
export function eendraadToets(e) {
  const ctrl = e.ctrlKey || e.metaKey;
  const t = e.key.toLowerCase();
  if (ctrl && t === 'd') { zetModus('tekenen'); return true; }
  if (ctrl && t === 'e') { zetModus('selecteren'); return true; }
  if (ctrl && t === 'x') { if (staat.selectie && staat.selectie !== 'hoofd') zetModus('verplaats'); return true; }
  if (ctrl && t === 'f') { window.dispatchEvent(new CustomEvent('actie', { detail: 'zoekSS' })); return true; }
  if (ctrl && e.key === 'ArrowRight') { verschuifGekozen(1); return true; }
  if (ctrl && e.key === 'ArrowLeft') { verschuifGekozen(-1); return true; }
  if (e.key === 'Escape' && modus !== 'selecteren') { bibGekozen = null; if (modus === 'verplaats') zetModus('selecteren'); else { tekenBibliotheek(); tekenPunten(); } return true; }
  return false;
}

// ---------- Opstarten ----------

export function startEditor() {
  const svg = $('#eendraad-svg');
  const stijl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  stijl.textContent = SCHEMA_STIJL;
  svg.prepend(stijl);
  vlak = new Vlak(svg);

  svg.addEventListener('click', (e) => {
    if (vlak.gesleept || e.target.closest('[data-punt]')) return;
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
  koppelBibliotheek();

  let vorigeSelectie = null;
  opWijziging(({ paneel }) => {
    if (staat.tab !== 'eendraad') return;
    tekenBoom();
    tekenSchema();
    if (modus === 'tekenen') tekenBibliotheek();
    if (paneel || vorigeSelectie !== staat.selectie) tekenEigenschappen();
    vorigeSelectie = staat.selectie;
  });
}

/** Na het wisselen van tabblad of laden van een project opnieuw passend zetten. */
export function herstelZicht() {
  if (vlak) vlak.ingesteld = false;
}
