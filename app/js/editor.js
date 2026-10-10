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
