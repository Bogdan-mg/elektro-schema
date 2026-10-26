// Het tabblad Situatieschema: plannen per verdieping, het grondplan tekenen, en de onderdelen op hun plaats zetten.
import { nieuwPlan, nieuwId, nieuwElement, nieuwItem, nieuweKring, voegKnoopToe, alleKringen, codes, wijsToe } from './model.js';
import { itemNaam, PALET } from './catalogus.js';
import {
  tekenPlan, onderdelen, PLAN_STIJL, segmentSvg, afstand, lengteTekst, ketenLengte, muurKeten, ELEMENTEN,
  kleefAanMuur, kleeftAanMuur, draaiStap, draaiRondSteel, volgendeTekstPlaats, volgendeAdresPlaats, plaatsingSvg, symboolBreedte, handvatten, omhulsel, verschuifElement, draaiPunt, deelVan, rechthoekVan,
} from './plan.js';
import { SCHEMA_STIJL } from './eendraad.js';
import { icoon, esc } from './symbolen.js';
import { staat, wijzig, herteken, opWijziging, zetGewijzigd, ongedaan } from './staat.js';
import { Vlak } from './vlak.js';
import { vraag, vraagTekst, bevestig, melding } from './dialoog.js';
import { importeer, leesBeeldBestand } from './import.js';
import { bouwTabs, paneelHtml, tabHtml, sleutelVan, eersteKiesbare } from './trikker/toolbox.js';

const $ = (s) => document.querySelector(s);
const GRID = 20; // de maat van het raster, in tekeneenheden
let vlak;
let gereedschap = 'kies'; // 'kies' | een soort uit TEKEN | 'tekst' | 'schaal' | 'los'
let plaatsen = null; // id van het onderdeel dat geplaatst wordt
let laatstePlaatsMuis = null; // de laatste plaats van de muis of vinger op het plan, om het symbool opnieuw te tonen na het draaien
let plaatsRot = 0; // de hoek waaronder het volgende onderdeel geplaatst wordt (rechtermuisknop draait)
let losKeuze = null; // index in PALET voor losse symbolen
let punten = []; // de punten die al aangeklikt zijn voor het element dat getekend wordt
let tekenSpiegel = false; // rechtermuisknop tijdens het tekenen van een deur
let lopendeSom = 0; // samengetelde lengte van de muren die je in één keer aan het tekenen bent
let nieuweAfb = null; // { afb, verhouding } voor het gereedschap "afbeelding"
let achtergrondSleutel = null;
let klembord = null;
let verbindVan = null; // de schakelaar waarvan je lampen aan het verbinden bent
let plakTeller = 0;
let tbTab = 'huis'; // het gekozen tabblad van de toolbox
let tbTabs = [];
let tbSleutel = null; // het gekozen element van de toolbox

/** Hoeveel klikken elk gereedschap nodig heeft. */
const TEKEN = {
  muur: { stappen: 2, keten: true },
  boog: { stappen: 3 },
  deur: { stappen: 2 },
  poort: { stappen: 2 },
  raam: { stappen: 2 },
  trap: { stappen: 2 },
  draaitrap: { stappen: 2 },
  rechthoek: { stappen: 2 },
  vlak: { stappen: 2 },
  lijn: { stappen: 2 },
  maat: { stappen: 3 },
  meet: { stappen: 2 },
  afbeelding: { stappen: 2 },
};

const huidigPlan = (p = staat.project) => p.plannen.find((pl) => pl.id === staat.planId) || p.plannen[0];
const gekozen = (soort, id) => staat.planKeuze.some((k) => k.soort === soort && k.id === id);
const zetKeuze = (lijst) => { staat.planKeuze = lijst; };
const afger = (n) => Math.round(n * 10) / 10;

/** Een afmeting in cm als de schaal gekend is, anders in tekeneenheden. */
const naarCm = (plan, eenheden) => (plan.schaal ? Math.round((eenheden / plan.schaal) * 100) : Math.round(eenheden));
const vanCm = (plan, cm) => (plan.schaal ? (cm / 100) * plan.schaal : cm);

// ---------- Lijsten ----------

function tekenPlannen() {
  const p = staat.project;
  $('#plannen').innerHTML = p.plannen.map((pl) => {
    const n = Object.keys(pl.plaatsingen).length;
    return `<div class="rij${pl.id === huidigPlan().id ? ' gekozen' : ''}" data-plan="${esc(pl.id)}">
      <span class="ic">▦</span><b>${esc(pl.naam)}</b><small>${n} op plan</small>
      <button class="mini" data-hernoem="${esc(pl.id)}" title="Naam wijzigen">✎</button>
      ${p.plannen.length > 1 ? `<button class="mini gevaar" data-wis="${esc(pl.id)}" title="Plan verwijderen">✕</button>` : ''}
    </div>`;
  }).join('');
}

/** Volgorde waarin onderdelen geplaatst worden: eerst het bord, dan kring per kring. */
function volgorde(p) {
  return ['bord', ...alleKringen(p).flatMap(({ knoop }) => knoop.items.map((it) => it.id))];
}

function tekenLijst() {
  const p = staat.project;
  const lijst = $('#te-plaatsen');
  const scroll = lijst.scrollTop;
  const losOpen = p.opties?.losseSymbolen;
  $('#plan-los').hidden = !losOpen;
  if (gereedschap === 'los' && losOpen) {
    $('#plaats-kop').textContent = 'Losse symbolen';
    $('#plaats-hint').textContent = 'Kies een symbool en klik op het plan. Losse symbolen horen nog bij geen kring; je koppelt ze later in het ééndraadschema.';
    lijst.innerHTML = PALET.map((w, i) => `<div class="rij item open${losKeuze === i ? ' actief' : ''}" data-los="${i}" style="--diepte:1">${icoon(nieuwItem(w.soort, w.waarden), 22)}<span>${esc(w.naam)}</span></div>`).join('');
    $('#plaats-teller').textContent = '';
    lijst.scrollTop = scroll;
    return;
  }
  $('#plaats-kop').textContent = 'Toolbox';
  $('#plaats-hint').textContent = '';
  const plan = huidigPlan();
  const waar = new Set();
  for (const pl of p.plannen) for (const [id, x] of Object.entries(pl.plaatsingen)) if (!x.los) waar.add(id);
  tbTabs = bouwTabs(p, waar);
  if (!tbTabs.some((t) => t.id === tbTab)) tbTab = 'huis';
  const tab = tbTabs.find((t) => t.id === tbTab);
  const sleutel = plaatsen ? (plaatsen === 'bord' ? 'bord' : `knoop:${plaatsen}`) : (gereedschap !== 'kies' ? tbSleutel : null);
  lijst.innerHTML = `<div class="ss-toolbox"><div class="tb-tabs">${tbTabs.map((t) => `<button type="button" class="tb-tab${t.id === tbTab ? ' aan' : ''}" data-tbtab="${esc(t.id)}" title="${esc(t.naam || '')}">${tabHtml(t)}</button>`).join('')}</div>
    <div class="tb-hoofd"><div class="tb-paneel">${paneelHtml(tab, sleutel)}</div></div></div>`;
  lijst.scrollTop = scroll;
  const open = volgorde(p).filter((id) => !waar.has(id)).length;
  $('#plaats-teller').textContent = open ? `${open} nog te plaatsen` : 'alles geplaatst';
  void plan;
}

/** Een klik in de toolbox: een gereedschap met twee punten, een symbool om te plaatsen of een tekst. */
function toolboxKlik(e) {
  const tabKnop = e.target.closest('[data-tbtab]');
  if (tabKnop) {
    tbTab = tabKnop.dataset.tbtab;
    const t = tbTabs.find((x) => x.id === tbTab);
    const eerste = t?.soort === 'kring' ? eersteKiesbare(t) : null;
    if (eerste) { klikToolbox(sleutelVan(eerste), eerste); return; }
    tekenLijst();
    return;
  }
  const knop = e.target.closest('[data-sleutel]');
  if (!knop || knop.classList.contains('uit')) return;
  const tab = tbTabs.find((x) => x.id === tbTab);
  const it = tab?.items.find((x) => sleutelVan(x) === knop.dataset.sleutel);
  if (it) klikToolbox(knop.dataset.sleutel, it);
}

function klikToolbox(sleutel, it) {
  tbSleutel = sleutel;
  if (it.type === 'tweepunt') { zetGereedschap(it.gereedschap); tbSleutel = sleutel; tekenLijst(); return; }
  if (it.type === 'import') { $('#plan-afb-bestand').click(); return; }
  if (it.type === 'nota') { zetGereedschap('tekst'); tbSleutel = sleutel; tekenLijst(); return; }
  if (it.type === 'bord') { startPlaatsen(plaatsen === 'bord' ? null : 'bord'); return; }
  if (it.type === 'knoop') {
    const id = it.id;
    if (huidigPlan().plaatsingen[id] && plaatsen !== id) {
      zetKeuze([{ soort: 'item', id }]);
      staat.selectie = id;
      plaatsen = null;
      herteken({ paneel: true });
    } else startPlaatsen(plaatsen === id ? null : id);
    return;
  }
  if (it.type === 'los') {
    const i = PALET.findIndex((w) => w.soort === it.item.soort && (it.item.soort !== 'toestelKlein' || (w.waarden?.opschrift || '') === (it.item.opschrift || '')));
    const j = i >= 0 ? i : PALET.findIndex((w) => w.soort === it.item.soort);
    if (j < 0) { melding('Dit symbool kan nog niet als los symbool op het plan.', 'info'); return; }
    zetGereedschap('los');
    losKeuze = j;
    tbSleutel = sleutel;
    tekenLijst();
  }
}

// ---------- Tekenvlak ----------

function tekenPlanLaag() {
  const p = staat.project;
  const plan = huidigPlan();
  const afb = plan.achtergrond && p.afbeeldingen[plan.achtergrond];
  const zonder = { ...plan, achtergrond: null };
  $('#situatie-svg .plan-laag').innerHTML = tekenPlan(p, zonder, { selectie: staat.planKeuze, raster: !afb });
  if (afb) $('#situatie-svg .plan-laag .plan-vlak')?.setAttribute('fill-opacity', '0');
  tekenHandvatten();
}

/** De oranje vierkantjes waarmee je de uiteinden van het gekozen element apart versleept. */
function tekenHandvatten() {
  const laag = $('#situatie-svg .hand-laag');
  const plan = huidigPlan();
  const el = enkelElement(plan);
  if (!el || el.slot || gereedschap !== 'kies') {
    laag.innerHTML = '';
    return;
  }
  const z = 9 / (vlak?.s || 1);
  laag.innerHTML = handvatten(el).map((h) => (h.rond
    ? `<circle class="handvat" data-handvat="${h.k}" cx="${afger(h.x)}" cy="${afger(h.y)}" r="${afger(z * 0.62)}"/>`
    : `<rect class="handvat" data-handvat="${h.k}" x="${afger(h.x - z / 2)}" y="${afger(h.y - z / 2)}" width="${afger(z)}" height="${afger(z)}"/>`)).join('');
}

/** Het ene gekozen element, als er precies één ding gekozen is en dat een element is. */
function enkelElement(plan) {
  if (staat.planKeuze.length !== 1 || staat.planKeuze[0].soort !== 'el') return null;
  return plan.muren.find((m, i) => (m.id ?? i) === staat.planKeuze[0].id) || null;
}

function tekenVlak() {
  const p = staat.project;
  const plan = huidigPlan();
  // De achtergrond enkel opnieuw zetten als die echt veranderd is (groot beeld).
  const afb = plan.achtergrond && p.afbeeldingen[plan.achtergrond];
  const sleutel = `${plan.id}|${plan.achtergrond}|${plan.zichtbaarheid}|${plan.breedte}x${plan.hoogte}`;
  if (sleutel !== achtergrondSleutel) {
    $('#situatie-svg .achtergrond-laag').innerHTML = afb
      ? `<image href="${esc(afb.src)}" x="0" y="0" width="${plan.breedte}" height="${plan.hoogte}" opacity="${plan.zichtbaarheid ?? 0.6}" preserveAspectRatio="none"/>`
      : '';
    achtergrondSleutel = sleutel;
  }
  tekenPlanLaag();
  if (!vlak.ingesteld) vlak.passend(plan.breedte, plan.hoogte, { max: 2 });
  tekenHandvatten();

  $('#plan-symbool').value = plan.symbool;
  $('#plan-zicht').value = plan.zichtbaarheid ?? 0.6;
  $('#plan-zicht').disabled = !afb;
  $('#plan-weg').disabled = !afb;
  $('#plan-aanpas').disabled = !(afb && afb.bron);
  const el = enkelElement(plan);
  const lengteBaar = el && ['muur', 'deur', 'raam', 'meet', 'poort', 'lijn', 'trap'].includes(el.soort || 'muur');
  const lengte = $('#plan-lengte');
  lengte.disabled = !(lengteBaar && plan.schaal);
  if (document.activeElement !== lengte) lengte.value = lengteBaar && plan.schaal ? (afstand(el) / plan.schaal).toFixed(2) : '';
  $('#plan-maten').checked = plan.alleMaten === true;
  $('#plan-kleef').checked = plan.kleefMuur !== false;
  $('#plan-kleefgrid').checked = plan.kleefGrid === true;
  $('#plan-hoek').value = String(plan.hoekStap ?? 90);
  vulKringKeuze();
  $('#plan-grid').checked = plan.toonGrid !== false;
  $('#plan-beletter').checked = plan.beletteren !== false;
  $('#plan-nummer').checked = plan.nummeren !== false;
  $('#plan-kleur-kies').value = plan.kleur || '#c2410c';
  const info = $('#plan-schaal-info');
  info.textContent = plan.schaal ? `Schaal: 1 m = ${Math.round(plan.schaal * 10) / 10} punten` : 'Schaal nog niet ingesteld: kies Schaal…';
  info.classList.toggle('mist', !plan.schaal);
  for (const b of document.querySelectorAll('[data-gereedschap]')) b.classList.toggle('aan', b.dataset.gereedschap === gereedschap && !plaatsen);
  const iets = staat.planKeuze.length > 0;
  for (const id of ['plan-verwijder', 'plan-kopieer', 'plan-draai', 'plan-spiegel-h', 'plan-spiegel-v', 'plan-roteer', 'plan-groter', 'plan-kleur', 'plan-zoek']) $(`#${id}`).disabled = !iets;
  $('#plan-plak').disabled = !klembord;
  $('#plan-vorige').disabled = p.plannen.indexOf(plan) <= 0;
  $('#plan-volgende').disabled = p.plannen.indexOf(plan) >= p.plannen.length - 1;
  $('#plan-pagina').textContent = `Pagina ${p.plannen.indexOf(plan) + 1} / ${p.plannen.length}`;
  tekenStatus();
}

const STATUS = {
  muur: 'Klik om een muur te beginnen en klik voor elke hoek · klik opnieuw op het beginpunt, rechtsklik of Esc om te stoppen',
  boog: 'Ronde muur: klik het beginpunt, het eindpunt en daarna een punt op de ronding',
  deur: 'Deur: klik beide kanten van de opening · rechtsklik draait de openingsrichting om',
  poort: 'Garagepoort: klik beide kanten van de opening',
  raam: 'Raam: klik het begin en het einde',
  trap: 'Trap: klik het begin en het einde',
  draaitrap: 'Draaitrap: klik het middelpunt en daarna de buitenkant',
  rechthoek: 'Rechthoek: klik twee hoekpunten',
  vlak: 'Vlak: klik twee hoekpunten (kleur en transparantie stel je daarna in)',
  lijn: 'Lijn: klik het begin en het einde',
  maat: 'Maatlijn: klik de twee meetpunten en daarna waar de maatlijn moet staan',
  meet: 'Meetlijn: klik het begin en het einde',
  afbeelding: 'Afbeelding: klik een hoek en verplaats de muis om de grootte te bepalen, klik opnieuw',
};

function tekenStatus() {
  const delen = onderdelen(staat.project);
  let t;
  if (plaatsen) {
    const d = delen.get(plaatsen);
    t = `Klik op het plan om ${d?.item === 'bord' ? 'het verdeelbord' : `${d?.code} ${itemNaam(d.item)}`} te plaatsen: het kleeft aan een muur in de buurt (Alt = vrij) · rechtsklik draait · Esc om te stoppen`;
  } else if (gereedschap === 'los') {
    t = 'Losse symbolen: kies links een symbool en klik op het plan · rechtsklik draait · Esc om te stoppen';
  } else if (gereedschap === 'verbind') {
    t = verbindVan ? 'Klik nu de lampen die deze schakelaar bedient (nogmaals klikken haalt de verbinding weg) · Esc stopt' : 'Verbinden: klik eerst een schakelaar (of drukknop) en daarna de lampen die hij bedient';
  } else if (gereedschap === 'kring') {
    t = 'Kring-modus: kies een kring (zekering) in de lijst en klik de symbolen die erop staan: stopcontacten, lampen, schakelaars · Esc stopt';
  } else if (STATUS[gereedschap]) {
    t = `${STATUS[gereedschap]} · Alt = vrij (anders recht) · Esc stopt`;
  } else if (gereedschap === 'schaal') {
    t = 'Schaal instellen: klik twee punten op het plan waarvan je de afstand kent (bv. de breedte van een deur of een muur) · Esc om te stoppen';
  } else if (gereedschap === 'tekst') {
    t = 'Klik waar de tekst moet komen (bv. de naam van een ruimte)';
  } else {
    t = gekozenLengte() || 'Sleep om te selecteren (Shift = bijvoegen) · sleep een geselecteerd ding om het te verplaatsen · pijltjestoetsen verplaatsen · R draait · Delete wist · scroll zoomt';
  }
  $('#plan-status').textContent = t;
  $('#situatie-svg').classList.toggle('plaatsen', Boolean(plaatsen) || gereedschap !== 'kies');
}

/** De lengte van het gekozen lijnstuk, bij een muur ook van alle muren die eraan vastzitten. */
function gekozenLengte() {
  const plan = huidigPlan();
  const m = enkelElement(plan);
  if (!m || !['muur', 'deur', 'raam', 'meet', 'poort', 'lijn', 'trap', 'maat'].includes(m.soort || 'muur')) return '';
  const naam = ELEMENTEN[m.soort || 'muur'].naam;
  if (!plan.schaal) return `${naam} gekozen · stel eerst de schaal in (Schaal…) om de lengte in meter te zien`;
  const hoek = Math.round(((Math.atan2(-(m.y2 - m.y1), m.x2 - m.x1) * 180) / Math.PI + 360) % 360);
  let t = `${naam}: ${lengteTekst(afstand(m), plan.schaal)} · hoek ${hoek}°`;
  const i = plan.muren.indexOf(m);
  if ((m.soort || 'muur') === 'muur' && muurKeten(plan, i).length > 1) {
    t += ` · aaneengesloten muren samen: ${lengteTekst(ketenLengte(plan, i), plan.schaal)}`;
  }
  return `${t} · Delete wist`;
}

// ---------- Handelingen ----------

function zetGereedschap(g) {
  gereedschap = g;
  verbindVan = null;
  plaatsen = null;
  punten = [];
  tekenSpiegel = false;
  plaatsRot = 0;
  lopendeSom = 0;
  $('#situatie-svg .voorbeeld-laag').innerHTML = '';
  tekenLijst();
  tekenVlak();
}

function startPlaatsen(id) {
  plaatsen = id;
  gereedschap = 'kies';
  punten = [];
  plaatsRot = 0;
  tekenLijst();
  tekenVlak();
}

/**
 * Waar een onderdeel terechtkomt als je het bij dit punt loslaat: tegen de dichtstbijzijnde muur (met Alt vrij),
 * anders precies op het punt met de hoek die het al had.
 */
function vastePlaats(punt, deel, alt, rot = 0) {
  const plan = huidigPlan();
  const kleef = !alt && plan.kleefMuur !== false && deel && kleeftAanMuur(deel.item) ? kleefAanMuur(plan, punt, symboolBreedte(deel)) : null;
  if (kleef) return { x: kleef.x, y: kleef.y, rot: kleef.rot };
  const v = vastPunt(punt, { alt });
  return { x: v.x, y: v.y, rot };
}

function plaatsOp(punt, alt = false) {
  const id = plaatsen;
  const deel = onderdelen(staat.project).get(id);
  const plek = { ...vastePlaats(punt, deel, alt, plaatsRot), ...(huidigPlan().kleur ? { kleur: huidigPlan().kleur } : {}) };
  $('#situatie-svg .voorbeeld-laag').innerHTML = '';
  wijzig((p) => {
    for (const pl of p.plannen) delete pl.plaatsingen[id];
    huidigPlan(p).plaatsingen[id] = plek;
  }, { paneel: false });
  zetKeuze([{ soort: 'item', id }]);
  if (id !== 'bord') staat.selectie = id;
  // Meteen door naar het volgende onderdeel dat nog nergens staat.
  const p = staat.project;
  const geplaatst = new Set(p.plannen.flatMap((pl) => Object.entries(pl.plaatsingen).filter(([, x]) => !x.los).map(([k]) => k)));
  const lijst = volgorde(p);
  plaatsen = lijst.slice(lijst.indexOf(id) + 1).find((x) => !geplaatst.has(x)) || null;
  plaatsRot = 0;
  herteken({ paneel: true });
}

/** Een los symbool op het plan zetten (nog niet gekoppeld aan het ééndraadschema). */
function plaatsLos(punt, alt) {
  const w = PALET[losKeuze];
  if (!w) return;
  const item = nieuwItem(w.soort, w.waarden);
  const plek = { ...vastePlaats(punt, { item, code: '' }, alt, plaatsRot), los: true, item, ...(huidigPlan().kleur ? { kleur: huidigPlan().kleur } : {}) };
  wijzig((p) => { huidigPlan(p).plaatsingen[item.id] = plek; }, { paneel: false });
  zetKeuze([{ soort: 'item', id: item.id }]);
  herteken({ paneel: true });
}

export function verwijderGekozen() {
  const keuze = staat.planKeuze;
  if (!keuze.length) return;
  wijzig((p) => {
    const plan = huidigPlan(p);
    for (const k of keuze) {
      if (k.soort === 'item') delete plan.plaatsingen[k.id];
      if (k.soort === 'tekst') plan.teksten = plan.teksten.filter((t) => t.id !== k.id);
      if (k.soort === 'verb') plan.verbindingen = (plan.verbindingen || []).filter((v) => v.id !== k.id);
      if (k.soort === 'el') plan.muren = plan.muren.filter((m, i) => (m.id ?? i) !== k.id || m.slot);
    }
  }, { paneel: false });
  zetKeuze([]);
  herteken({ paneel: false });
  melding('Verwijderd', '', { knop: 'Ongedaan maken', actie: ongedaan });
}

/** Zoals Shift + rechtermuisknop in Trikker: de plaats van de tekst bij de gekozen symbolen doorlopen (auto, links, boven, rechts, onder, verbergen). */
export function wisselTekstPlaats() {
  wijzig((p) => {
    const plan = huidigPlan(p);
    for (const k of staat.planKeuze) {
      const pl = k.soort === 'item' && plan.plaatsingen[k.id];
      if (pl) pl.tekstPlaats = volgendeTekstPlaats(pl.tekstPlaats);
    }
  }, { paneel: true });
}

/** Zoals Ctrl + rechtermuisknop in Trikker: de plaats van het adres doorlopen (0°, 90°, 180°, 270°, verbergen). */
export function wisselAdresPlaats() {
  wijzig((p) => {
    const plan = huidigPlan(p);
    for (const k of staat.planKeuze) {
      const pl = k.soort === 'item' && plan.plaatsingen[k.id];
      if (pl) pl.adresPlaats = volgendeAdresPlaats(pl.adresPlaats);
    }
  }, { paneel: true });
}

/** Draaien: symbolen een kwartslag (met Alt in kleine stappen), een deur de andere kant op. */
export function draaiGekozen(klein = false) {
  const keuze = staat.planKeuze;
  if (!keuze.length) return;
  wijzig((p) => {
    const plan = huidigPlan(p);
    for (const k of keuze) {
      if (k.soort === 'item') {
        const pl = plan.plaatsingen[k.id];
        if (!pl) continue;
        const delen = onderdelen(p);
        const item = deelVan(delen, k.id, pl)?.item;
        const stap = draaiStap(item, klein);
        // Een contactdoos draait rond het punt waar ze de muur raakt, zodat ze aan dezelfde kant van de muur blijft.
        if (kleeftAanMuur(item)) Object.assign(pl, draaiRondSteel(pl, { item, code: '' }, plan.symbool || 1, stap));
        else pl.rot = ((pl.rot || 0) + stap) % 360;
      } else if (k.soort === 'el') {
        const m = plan.muren.find((x, i) => (x.id ?? i) === k.id);
        if (m?.soort === 'deur') m.spiegel = !m.spiegel;
        else if (ELEMENTEN[m?.soort]?.rond && !m.slot) m.hoek = ((m.hoek || 0) + (klein ? 15 : 90)) % 360;
      }
    }
  }, { paneel: false });
}

export function annuleer() {
  if (verbindVan) {
    verbindVan = null;
    $('#situatie-svg .voorbeeld-laag').innerHTML = '';
    tekenStatus();
  } else if (punten.length) {
    punten = [];
    lopendeSom = 0;
    $('#situatie-svg .voorbeeld-laag').innerHTML = '';
  } else if (plaatsen || gereedschap !== 'kies') {
    zetGereedschap('kies');
    tekenLijst();
  } else if (staat.planKeuze.length) {
    zetKeuze([]);
    herteken({ paneel: false });
  }
}

/**
 * Een punt aanpassen aan het raster en aan de muren die er al staan. Ctrl houdt de lijn recht ten opzichte van het
 * vorige punt, Alt zet alle kleven uit.
 */
function vastPunt(punt, { van = null, ctrl = false, alt = false } = {}) {
  const plan = huidigPlan();
  let { x, y } = punt;
  if (plan.kleefGrid && !alt) {
    x = Math.round(x / GRID) * GRID;
    y = Math.round(y / GRID) * GRID;
  }
  // Rechte hoeken: standaard recht (0° en 90°) tenzij Alt; zonder die instelling houdt Ctrl de lijn recht.
  const stap = plan.hoekStap ?? 90;
  const recht = Boolean(van) && stap === 90 && !alt;
  if (van && !alt && stap > 0 && stap < 90) {
    // Op de dichtstbijzijnde hoek in stappen van 45° of 15°, met dezelfde lengte.
    const l = Math.hypot(x - van.x, y - van.y);
    const hoek = Math.round(Math.atan2(y - van.y, x - van.x) / ((stap * Math.PI) / 180)) * ((stap * Math.PI) / 180);
    x = van.x + Math.cos(hoek) * l;
    y = van.y + Math.sin(hoek) * l;
  } else if (van && stap === 0 && ctrl) {
    if (Math.abs(x - van.x) > Math.abs(y - van.y)) y = van.y; else x = van.x;
  }
  if (recht) {
    if (Math.abs(x - van.x) > Math.abs(y - van.y)) y = van.y; else x = van.x;
  }
  if (plan.kleefMuur !== false && !alt && !(plan.kleefGrid)) {
    const marge = 10 / (vlak?.s || 1);
    let gelijkX = null;
    let gelijkY = null;
    for (const m of plan.muren) {
      if ((m.soort || 'muur') !== 'muur') continue;
      for (const h of [{ x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 }]) {
        if (Math.hypot(h.x - x, h.y - y) < marge) return { x: h.x, y: h.y };
        if (Math.abs(h.x - x) < marge) gelijkX = h.x;
        if (Math.abs(h.y - y) < marge) gelijkY = h.y;
      }
    }
    if (gelijkX != null && !recht) x = gelijkX;
    if (gelijkY != null && !recht) y = gelijkY;
    if (gelijkX != null && recht && van && y === van.y) x = gelijkX;
    if (gelijkY != null && recht && van && x === van.x) y = gelijkY;
  }
  return { x: Math.round(x), y: Math.round(y) };
}

// ---------- Elementen aanmaken ----------

const standaardDikte = (plan, soort) => plan.standaard?.[soort];

/** Het element dat bij het gereedschap en de aangeklikte punten hoort. extra = het punt waar de muis nu staat. */
function bouwElement(soort, pts, plan) {
  const [a, b, c] = pts;
  if (!a || !b) return null;
  const basis = { soort, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  const dikte = standaardDikte(plan, soort);
  if (dikte && ['muur', 'raam', 'deur', 'poort', 'boog'].includes(soort)) basis.dikte = dikte;
  switch (soort) {
    case 'boog':
      return c ? { ...basis, bx: c.x, by: c.y } : { ...basis, soort: 'muur' };
    case 'deur':
      return { ...basis, type: plan.deurType || 'draai', spiegel: tekenSpiegel };
    case 'trap':
      return { ...basis, breedte: standaardDikte(plan, 'trap') || 90, ...(plan.kleur ? { kleur: plan.kleur } : {}) };
    case 'lijn':
      return { ...basis, dikte: plan.lijnDikte || 0.35, kleur: plan.kleur || '#2b2f36' };
    case 'rechthoek':
    case 'vlak': {
      const w = Math.abs(b.x - a.x);
      const h = Math.abs(b.y - a.y);
      return { soort, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, w, h, hoek: 0, ...(soort === 'vlak' ? { kleur: plan.kleur || '#93c5fd', transparantie: 0.6 } : plan.kleur ? { kleur: plan.kleur } : {}) };
    }
    case 'maat': {
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = -(b.y - a.y) / l;
      const ny = (b.x - a.x) / l;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const o = c ? (c.x - mx) * nx + (c.y - my) * ny : 30;
      return { ...basis, afstand: Math.round(o), ...(plan.kleur ? { kleur: plan.kleur } : {}) };
    }
    case 'afbeelding': {
      if (!nieuweAfb) return null;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const w = Math.max(Math.abs(dx), Math.abs(dy) / nieuweAfb.verhouding, 10);
      const h = w * nieuweAfb.verhouding;
      return { soort, afb: nieuweAfb.afb, cx: a.x + (dx >= 0 ? w / 2 : -w / 2), cy: a.y + (dy >= 0 ? h / 2 : -h / 2), w, h, hoek: 0, slot: false };
    }
    default:
      return basis;
  }
}

function toonVoorbeeld(punt) {
  const laag = $('#situatie-svg .voorbeeld-laag');
  const plan = huidigPlan();
  const soort = gereedschap === 'schaal' ? 'meet' : gereedschap;
  const pts = [...punten, punt];
  // Een ronde muur of maatlijn toont eerst de rechte lijn tussen de eerste twee punten.
  const stuk = bouwElement(soort, pts.length >= 2 ? pts : [pts[0], pts[0]], plan);
  if (!stuk || (pts.length < 2 && soort !== 'afbeelding')) {
    laag.innerHTML = '';
    return;
  }
  const rekenPlan = gereedschap === 'schaal' ? { ...plan, schaal: 1 } : plan;
  const { svg, maat } = segmentSvg(stuk, null, rekenPlan, { afbeeldingen: staat.project.afbeeldingen });
  laag.innerHTML = `<g opacity=".6">${svg}</g>${gereedschap === 'schaal' ? '' : maat}`;
  if (stuk.x1 != null && plan.schaal) {
    const eigen = Math.hypot(stuk.x2 - stuk.x1, stuk.y2 - stuk.y1);
    const hoek = Math.round(((Math.atan2(-(stuk.y2 - stuk.y1), stuk.x2 - stuk.x1) * 180) / Math.PI + 360) % 360);
    const extra = gereedschap === 'muur' && lopendeSom > 0 ? ` · samen met de vorige: ${lengteTekst(lopendeSom + eigen, plan.schaal)}` : '';
    $('#plan-status').textContent = `${ELEMENTEN[soort]?.naam || ''}: ${lengteTekst(eigen, plan.schaal)} · hoek ${hoek}°${extra} · Ctrl = recht · Alt = vrij · Esc stopt`;
  }
}

/** Een geklikt punt voor het huidige tekengereedschap. */
function tekenKlik(punt, e) {
  const plan = huidigPlan();
  const p = vastPunt(punt, { van: punten.at(-1), ctrl: e.ctrlKey, alt: e.altKey });
  const def = TEKEN[gereedschap];
  // Nogmaals op het beginpunt klikken stopt een reeks muren.
  if (def.keten && punten.length && p.x === punten[0].x && p.y === punten[0].y && punten.length >= 2) {
    annuleer();
    return;
  }
  punten.push(p);
  if (punten.length < def.stappen) return;
  const stuk = bouwElement(gereedschap, punten, plan);
  const laatste = punten.at(-1);
  const vorige = punten.at(0);
  if (!stuk || (stuk.x1 != null && stuk.x1 === stuk.x2 && stuk.y1 === stuk.y2 && !ELEMENTEN[stuk.soort]?.rond)) {
    punten = def.keten ? [laatste] : [];
    return;
  }
  const element = nieuwElement(stuk.soort, (({ soort, ...rest }) => rest)(stuk));
  wijzig((pr) => huidigPlan(pr).muren.push(element), { paneel: false });
  if (def.keten) {
    lopendeSom += Math.hypot(stuk.x2 - stuk.x1, stuk.y2 - stuk.y1);
    punten = [laatste];
  } else {
    punten = [];
    $('#situatie-svg .voorbeeld-laag').innerHTML = '';
    if (gereedschap !== 'afbeelding') {
      // Een deur, raam, trap, … is één stuk; daarna is het element gekozen zodat je de eigenschappen kan zien.
      zetKeuze([{ soort: 'el', id: element.id }]);
    } else {
      nieuweAfb = null;
      zetGereedschap('kies');
      zetKeuze([{ soort: 'el', id: element.id }]);
    }
    herteken({ paneel: true });
  }
  void vorige;
}

// ---------- Selecteren, verplaatsen en transformeren ----------

/** Alles wat gekozen is, als objecten in het huidige plan. */
function gekozenObjecten(plan = huidigPlan()) {
  const uit = { elementen: [], teksten: [], symbolen: [] };
  for (const k of staat.planKeuze) {
    if (k.soort === 'el') {
      const m = plan.muren.find((x, i) => (x.id ?? i) === k.id);
      if (m) uit.elementen.push(m);
    } else if (k.soort === 'tekst') {
      const t = plan.teksten.find((x) => x.id === k.id);
      if (t) uit.teksten.push(t);
    } else {
      const pl = plan.plaatsingen[k.id];
      if (pl) uit.symbolen.push({ id: k.id, pl });
    }
  }
  return uit;
}

/** Het midden van alles wat gekozen is. */
function middenGekozen(plan) {
  const o = gekozenObjecten(plan);
  const xs = [];
  const ys = [];
  for (const m of o.elementen) { const b = omhulsel(m); xs.push(b.x0, b.x1); ys.push(b.y0, b.y1); }
  for (const t of o.teksten) { xs.push(t.x); ys.push(t.y); }
  for (const s of o.symbolen) { xs.push(s.pl.x); ys.push(s.pl.y); }
  if (!xs.length) return { x: 0, y: 0 };
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/** Pas een punt-afbeelding toe op alles wat gekozen is. hoek = de verdraaiing die symbolen en rechthoeken erbij krijgen. */
function transformeerGekozen(naam, mapPunt, hoekFn) {
  wijzig((p) => {
    const plan = huidigPlan(p);
    const o = gekozenObjecten(plan);
    for (const m of o.elementen) {
      if (m.slot) continue;
      if (ELEMENTEN[m.soort]?.rond) {
        const c = mapPunt(m.cx, m.cy);
        m.cx = c.x;
        m.cy = c.y;
        m.hoek = hoekFn(m.hoek || 0);
      } else {
        for (const [a, b] of [['x1', 'y1'], ['x2', 'y2'], ['bx', 'by']]) {
          if (m[a] == null) continue;
          const c = mapPunt(m[a], m[b]);
          m[a] = afger(c.x);
          m[b] = afger(c.y);
        }
        if (naam !== 'groter' && m.soort === 'deur' && naam.startsWith('spiegel')) m.spiegel = !m.spiegel;
      }
    }
    for (const t of o.teksten) { const c = mapPunt(t.x, t.y); t.x = Math.round(c.x); t.y = Math.round(c.y); }
    for (const s of o.symbolen) {
      const c = mapPunt(s.pl.x, s.pl.y);
      s.pl.x = afger(c.x);
      s.pl.y = afger(c.y);
      s.pl.rot = ((Math.round(hoekFn(s.pl.rot || 0)) % 360) + 360) % 360;
    }
  }, { paneel: false });
}

function spiegel(horizontaal) {
  const m = middenGekozen(huidigPlan());
  transformeerGekozen(horizontaal ? 'spiegel-h' : 'spiegel-v',
    (x, y) => (horizontaal ? { x: 2 * m.x - x, y } : { x, y: 2 * m.y - y }),
    (h) => (horizontaal ? 180 - h : -h));
}

async function roteerGekozen() {
  const { knop, waarden } = await vraag({
    titel: 'Roteren',
    tekst: 'Alles wat gekozen is, draait rond zijn middelpunt.',
    velden: [{ naam: 'hoek', label: 'Hoek (°, positief = met de klok mee)', type: 'number', waarde: 90 }],
  });
  if (knop !== 'ok' || !waarden.hoek) return;
  const m = middenGekozen(huidigPlan());
  transformeerGekozen('roteer', (x, y) => draaiPunt(x, y, m.x, m.y, waarden.hoek), (h) => h + waarden.hoek);
}

async function schaalGekozen() {
  const { knop, waarden } = await vraag({
    titel: 'Vergroten of verkleinen',
    tekst: 'Symbolen blijven even groot en worden anders verdeeld. Muren, deuren en ramen worden langer of korter.',
    velden: [{ naam: 'f', label: 'Factor (2 = dubbel zo groot, 0,5 = half)', type: 'text', waarde: '1,5' }],
  });
  const f = Number(String(waarden.f).replace(',', '.'));
  if (knop !== 'ok' || !(f > 0) || f === 1) return;
  const m = middenGekozen(huidigPlan());
  transformeerGekozen('groter', (x, y) => ({ x: m.x + (x - m.x) * f, y: m.y + (y - m.y) * f }), (h) => h);
  wijzig((p) => {
    for (const o of gekozenObjecten(huidigPlan(p)).elementen) if (ELEMENTEN[o.soort]?.rond && !o.slot) { o.w *= f; o.h *= f; }
  }, { paneel: false });
}

async function kleurGekozen() {
  const plan = huidigPlan();
  const k = $('#plan-kleur-kies');
  const { knop, waarden } = await vraag({
    titel: 'Kleur',
    tekst: 'Alle gekozen symbolen, lijnen, teksten en vlakken krijgen deze kleur. Nieuwe symbolen krijgen ze ook. Muren, deuren en ramen blijven zwart.',
    velden: [{ naam: 'kleur', label: 'Kleur', type: 'color', waarde: plan.kleur || k.value || '#c2410c' }],
    knoppen: [{ tekst: 'OK', waarde: 'ok', hoofd: true }, { tekst: 'Standaardkleur', waarde: 'terug' }, { tekst: 'Annuleren', waarde: null }],
  });
  if (!knop) return;
  const kleur = knop === 'terug' ? null : waarden.kleur;
  wijzig((p) => {
    const pl = huidigPlan(p);
    pl.kleur = kleur;
    const o = gekozenObjecten(pl);
    for (const s of o.symbolen) { if (kleur) s.pl.kleur = kleur; else delete s.pl.kleur; }
    for (const t of o.teksten) { if (kleur) t.kleur = kleur; else delete t.kleur; }
    for (const m of o.elementen) {
      if (['lijn', 'maat', 'vlak', 'rechthoek', 'trap', 'draaitrap'].includes(m.soort)) { if (kleur) m.kleur = kleur; else delete m.kleur; }
    }
  }, { paneel: true });
}

export function kopieer() {
  const plan = huidigPlan();
  const o = gekozenObjecten(plan);
  // Symbolen die ook op het ééndraadschema staan, mogen maar op één plaats getekend worden: die kopiëren we niet.
  const los = o.symbolen.filter((s) => s.pl.los).map((s) => structuredClone(s.pl));
  klembord = {
    elementen: o.elementen.map((m) => structuredClone(m)),
    teksten: o.teksten.map((t) => structuredClone(t)),
    los,
  };
  plakTeller = 0;
  const n = klembord.elementen.length + klembord.teksten.length + los.length;
  melding(n ? `${n} gekopieerd.` : 'Er is niets te kopiëren: symbolen uit het ééndraadschema kunnen maar op één plaats staan.');
  if (!n) klembord = null;
  tekenVlak();
}

export function plak() {
  if (!klembord) return;
  plakTeller += 1;
  const d = 20 * plakTeller;
  const nieuweKeuze = [];
  wijzig((p) => {
    const plan = huidigPlan(p);
    for (const m of klembord.elementen) {
      const kopie = { ...structuredClone(m), id: nieuwId() };
      verschuifElement(kopie, d, d);
      plan.muren.push(kopie);
      nieuweKeuze.push({ soort: 'el', id: kopie.id });
    }
    for (const t of klembord.teksten) {
      const kopie = { ...structuredClone(t), id: nieuwId(), x: t.x + d, y: t.y + d };
      plan.teksten.push(kopie);
      nieuweKeuze.push({ soort: 'tekst', id: kopie.id });
    }
    for (const s of klembord.los) {
      const id = nieuwId();
      plan.plaatsingen[id] = { ...structuredClone(s), x: s.x + d, y: s.y + d, item: { ...structuredClone(s.item), id } };
      nieuweKeuze.push({ soort: 'item', id });
    }
  }, { paneel: false });
  zetKeuze(nieuweKeuze);
  herteken({ paneel: true });
}

export function alleSelecteren() {
  const plan = huidigPlan();
  zetKeuze([
    ...plan.muren.map((m, i) => ({ soort: 'el', id: m.id ?? i })),
    ...plan.teksten.map((t) => ({ soort: 'tekst', id: t.id })),
    ...Object.keys(plan.plaatsingen).map((id) => ({ soort: 'item', id })),
  ]);
  herteken({ paneel: true });
}

/** Pijltjestoetsen: alles wat gekozen is een stap verplaatsen. Shift = enkel het eerste, Ctrl = enkel het tweede uiteinde, Alt = kleine stap. */
function pijl(dx, dy, e) {
  const plan = huidigPlan();
  const stap = e.altKey ? 1 : plan.kleefGrid ? GRID : 5;
  const welke = e.shiftKey ? 'p1' : e.ctrlKey ? 'p2' : 'alles';
  wijzig((p) => {
    const o = gekozenObjecten(huidigPlan(p));
    for (const m of o.elementen) if (!m.slot) verschuifElement(m, dx * stap, dy * stap, welke);
    if (welke === 'alles') {
      for (const t of o.teksten) { t.x += dx * stap; t.y += dy * stap; }
      for (const s of o.symbolen) { s.pl.x += dx * stap; s.pl.y += dy * stap; }
    }
  }, { sleutel: 'pijl', paneel: false });
}

// ---------- Kringen en verbindingen ----------

function vulKringKeuze() {
  const sel = $('#plan-kring-kies');
  const code = codes(staat.project);
  const huidig = sel.value;
  sel.innerHTML = alleKringen(staat.project).map(({ knoop }) => `<option value="${esc(knoop.id)}">${esc(code.get(knoop.id))} ${esc(knoop.naam || 'Kring')}</option>`).join('') || '<option value="">Nog geen kringen</option>';
  if (huidig && [...sel.options].some((o) => o.value === huidig)) sel.value = huidig;
}

/** Een kring (zekering) kiezen, of een nieuwe maken. Geeft het id van de kring of null. */
async function kiesKring() {
  const code = codes(staat.project);
  const kringen = alleKringen(staat.project).map(({ knoop }) => [knoop.id, `${code.get(knoop.id)} ${knoop.naam || 'Kring'}`]);
  const { knop, waarden } = await vraag({
    titel: 'Aan welke kring (zekering)?',
    tekst: 'De gekozen symbolen komen in het ééndraadschema in deze kring. Een schakelaar komt met zijn verbonden lampen op één rij.',
    velden: [
      { naam: 'kring', label: 'Kring', type: 'select', waarde: kringen[0]?.[0] || 'nieuw', opties: [...kringen, ['nieuw', '+ Nieuwe kring']] },
      { naam: 'naam', label: 'Naam van een nieuwe kring', waarde: '' },
    ],
  });
  if (knop !== 'ok') return null;
  if (waarden.kring !== 'nieuw') return waarden.kring;
  const nieuw = nieuweKring({ naam: waarden.naam.trim() });
  wijzig((p) => voegKnoopToe(p, null, nieuw), { paneel: false });
  return nieuw.id;
}

/** De losse symbolen die gekozen zijn aan een kring toewijzen. */
async function toewijzen(kringId = null) {
  const plan = huidigPlan();
  const ids = staat.planKeuze.filter((k) => k.soort === 'item' && plan.plaatsingen[k.id]?.los).map((k) => k.id);
  if (!ids.length) { melding('Kies eerst losse symbolen op het plan (sleep een kader om er meerdere te kiezen).'); return; }
  const kring = kringId || await kiesKring();
  if (!kring) return;
  const n = wijzig((p) => wijsToe(p, ids, kring), { paneel: true });
  melding(`${n} symbool${n === 1 ? '' : 'en'} aan de kring toegewezen.`);
}

/** Een verbinding tussen een schakelaar en een lamp aanmaken of weghalen. */
function verbind(id) {
  const plan = huidigPlan();
  const x = plan.plaatsingen[id];
  const soort = (i) => { const pl = plan.plaatsingen[i]; return pl?.los ? pl.item?.soort : onderdelen(staat.project).get(i)?.item?.soort; };
  if (!x) return;
  if (!verbindVan || ['schakelaar', 'drukknop'].includes(soort(id))) {
    if (!['schakelaar', 'drukknop'].includes(soort(id))) { melding('Klik eerst een schakelaar of drukknop.'); return; }
    verbindVan = id;
    $('#plan-status').textContent = 'Klik nu de lampen die deze schakelaar bedient · Esc stopt';
    return;
  }
  wijzig((p) => {
    const pl = huidigPlan(p);
    pl.verbindingen = pl.verbindingen || [];
    const bestaand = pl.verbindingen.findIndex((v) => v.van === verbindVan && v.naar === id);
    if (bestaand >= 0) pl.verbindingen.splice(bestaand, 1);
    else pl.verbindingen.push({ id: nieuwId(), van: verbindVan, naar: id });
  }, { paneel: false });
}

// ---------- Zoeken ----------

/** Het id van het gekozen symbool (niet het bord, niet een los symbool), voor "zoek op het ééndraadschema". */
export function gekozenSymbool() {
  const k = staat.planKeuze.find((x) => x.soort === 'item' && x.id !== 'bord');
  if (!k) { melding('Kies eerst een symbool op het plan.'); return null; }
  if (huidigPlan().plaatsingen[k.id]?.los) { melding('Dit is een los symbool: het staat (nog) niet op het ééndraadschema.'); return null; }
  return k.id;
}

/** Een symbool opzoeken op het situatieschema (aangeroepen vanuit het ééndraadschema). */
export function toonOpPlan(id) {
  const p = staat.project;
  const plan = p.plannen.find((pl) => pl.plaatsingen[id]);
  if (!plan) return false;
  staat.planId = plan.id;
  zetKeuze([{ soort: 'item', id }]);
  achtergrondSleutel = null;
  herteken({ paneel: true });
  const pl = plan.plaatsingen[id];
  const r = $('#situatie-svg').getBoundingClientRect();
  if (r.width) {
    vlak.s = Math.max(vlak.s, 1);
    vlak.x = r.width / 2 - pl.x * vlak.s;
    vlak.y = r.height / 2 - pl.y * vlak.s;
    vlak.pas();
    tekenHandvatten();
  }
  return true;
}

// ---------- Plannen en pagina's ----------

async function nieuwPlanToevoegen() {
  const naam = await vraagTekst('Nieuw plan', `Verdieping ${staat.project.plannen.length}`, 'Naam (bv. Eerste verdieping, Kelder)');
  if (!naam) return;
  const plan = nieuwPlan(naam);
  wijzig((p) => p.plannen.push(plan));
  kiesPlan(plan.id);
}

function kiesPlan(id) {
  staat.planId = id;
  zetKeuze([]);
  plaatsen = null;
  punten = [];
  vlak.ingesteld = false;
  herteken();
}

async function hernoemPlan(id) {
  const plan = staat.project.plannen.find((p) => p.id === id);
  const naam = await vraagTekst('Plan hernoemen', plan.naam, 'Naam');
  if (naam) wijzig((p) => { p.plannen.find((x) => x.id === id).naam = naam; });
}

async function wisPlan(id) {
  const plan = staat.project.plannen.find((p) => p.id === id);
  if (!await bevestig('Plan verwijderen', `"${plan.naam}" verwijderen? De onderdelen blijven in het ééndraadschema staan.`, 'Verwijderen', true)) return;
  wijzig((p) => { p.plannen = p.plannen.filter((x) => x.id !== id); });
  kiesPlan(staat.project.plannen[0].id);
}

/** Een venster om de pagina's te herschikken en per pagina de titel, de ondertitel en het kader in te stellen. */
async function paginasHerschikken() {
  const dlg = document.createElement('dialog');
  dlg.className = 'dialoog breed';
  document.body.append(dlg);
  const teken = () => {
    const pl = staat.project.plannen;
    dlg.innerHTML = `<form method="dialog"><h2>Pagina’s herschikken</h2>
      <p>Verplaats pagina’s en stel per pagina een titel in. Met een compact kader blijft er meer plaats over; de klant- en installateurgegevens worden dan niet afgedrukt.</p>
      <div class="paginarijen">${pl.map((x, i) => `<div class="paginarij" data-i="${i}">
        <b>${i + 1}</b>
        <input data-v="naam" value="${esc(x.naam)}" title="Naam van de pagina" placeholder="Naam">
        <input data-v="titel" value="${esc(x.titel || '')}" placeholder="Titel op de afdruk">
        <input data-v="subtitel" value="${esc(x.subtitel || '')}" placeholder="Subtitel">
        <label class="vink"><input type="checkbox" data-v="compact" ${x.compact ? 'checked' : ''}> Compact kader</label>
        <button type="button" data-op="omhoog" ${i === 0 ? 'disabled' : ''} title="Naar boven">▲</button>
        <button type="button" data-op="omlaag" ${i === pl.length - 1 ? 'disabled' : ''} title="Naar onderen">▼</button>
        ${!Object.keys(x.plaatsingen).length && !x.muren.length && !x.teksten.length && pl.length > 1 ? '<button type="button" data-op="wis" class="gevaar" title="Lege pagina wissen">✕</button>' : ''}
      </div>`).join('')}</div>
      <div class="knoppen"><button type="button" data-op="nieuw">+ Lege pagina</button><button value="ok" class="hoofd">Klaar</button></div></form>`;
  };
  teken();
  dlg.addEventListener('input', (e) => {
    const rij = e.target.closest('.paginarij');
    if (!rij || !e.target.dataset.v) return;
    const i = Number(rij.dataset.i);
    const v = e.target.dataset.v;
    wijzig((p) => { p.plannen[i][v] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; }, { sleutel: `pagina${i}${v}`, paneel: false });
  });
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-op]');
    if (!b) return;
    const rij = e.target.closest('.paginarij');
    const i = rij ? Number(rij.dataset.i) : -1;
    wijzig((p) => {
      if (b.dataset.op === 'omhoog') [p.plannen[i - 1], p.plannen[i]] = [p.plannen[i], p.plannen[i - 1]];
      if (b.dataset.op === 'omlaag') [p.plannen[i + 1], p.plannen[i]] = [p.plannen[i], p.plannen[i + 1]];
      if (b.dataset.op === 'wis') p.plannen.splice(i, 1);
      if (b.dataset.op === 'nieuw') p.plannen.push(nieuwPlan(`Pagina ${p.plannen.length + 1}`));
    }, { paneel: false });
    if (!staat.project.plannen.some((x) => x.id === staat.planId)) staat.planId = staat.project.plannen[0].id;
    teken();
  });
  dlg.showModal();
  await new Promise((ok) => dlg.addEventListener('close', ok, { once: true }));
  dlg.remove();
  achtergrondSleutel = null;
  herteken();
}

/** De afdrukschaal van de pagina: automatisch of een vaste schaal. */
async function afdrukSchaal() {
  const plan = huidigPlan();
  const { knop, waarden } = await vraag({
    titel: 'Afdrukschaal',
    tekst: plan.schaal
      ? 'Automatisch past Trikker-stijl alles op de pagina. Manueel drukt het plan op een vaste schaal af; kijk dan in het afdrukvoorbeeld of alles op het blad past.'
      : 'Stel eerst de schaal van het plan in (Schaal…) om op een vaste schaal af te kunnen drukken.',
    velden: [
      { naam: 'manueel', label: 'Manueel', type: 'checkbox', waarde: plan.afdrukSchaal > 0 },
      { naam: 'noemer', label: 'Schaal 1 : …', type: 'number', waarde: plan.afdrukSchaal || 100, min: 1 },
      { naam: 'symbool', label: 'Grootte van symbolen en tekst', type: 'number', waarde: plan.symbool, min: 0.3 },
    ],
  });
  if (knop !== 'ok') return;
  wijzig((p) => {
    const pl = huidigPlan(p);
    pl.afdrukSchaal = waarden.manueel && plan.schaal ? Math.max(1, Math.round(waarden.noemer)) : 0;
    pl.symbool = Math.max(0.3, waarden.symbool || pl.symbool);
  });
}

// ---------- Eigenschappen van wat gekozen is ----------

const veldRij = (label, invoer) => { const l = document.createElement('label'); l.className = 'veld'; const s = document.createElement('span'); s.textContent = label; l.append(s, invoer); return l; };

/** Een formulierveld dat bij elke wijziging de waarde doorgeeft. */
function maakVeld({ label, type = 'text', waarde, opties = null, min, max, stap, bij }) {
  let el;
  if (opties) {
    el = document.createElement('select');
    for (const [w, l] of opties) { const o = document.createElement('option'); o.value = String(w); o.textContent = l; if (String(w) === String(waarde)) o.selected = true; el.append(o); }
  } else {
    el = document.createElement('input');
    el.type = type;
    if (type === 'checkbox') el.checked = Boolean(waarde); else el.value = waarde ?? '';
    if (min != null) el.min = min;
    if (max != null) el.max = max;
    if (stap != null) el.step = stap;
  }
  const gebeurtenis = type === 'checkbox' || opties || type === 'color' ? 'change' : 'input';
  el.addEventListener(gebeurtenis, () => bij(type === 'checkbox' ? el.checked : el.value));
  if (type === 'checkbox') { const l = document.createElement('label'); l.className = 'vink'; l.append(el, ` ${label}`); return l; }
  return veldRij(label, el);
}

const PLAATSEN = [['auto', 'Automatisch'], ['links', 'Links'], ['boven', 'Boven'], ['rechts', 'Rechts'], ['onder', 'Onder'], ['verbergen', 'Verbergen']];
const ADRES_OPTIES = [['plus0', 'Rechts (0°)'], ['plus90', 'Onder (90°)'], ['plus180', 'Links (180°)'], ['plus270', 'Boven (270°)'], ['verbergen', 'Verbergen']];

function tekenEigenschappen() {
  const paneel = $('#plan-eigenschappen');
  const plan = huidigPlan();
  paneel.innerHTML = '';
  const kop = (t) => { const h = document.createElement('h3'); h.textContent = t; paneel.append(h); };
  const form = document.createElement('div');
  form.className = 'formulier';
  paneel.append(form);
  const zet = (fn, sleutel) => wijzig((p) => fn(huidigPlan(p)), { sleutel, paneel: false });
  const o = gekozenObjecten(plan);
  const aantal = o.elementen.length + o.teksten.length + o.symbolen.length;

  if (!aantal) {
    kop('Pagina');
    const wrap = form;
    wrap.append(
      maakVeld({ label: 'Naam', waarde: plan.naam, bij: (v) => zet((pl) => { pl.naam = v || pl.naam; }, 'pnaam') }),
      maakVeld({ label: 'Titel op de afdruk', waarde: plan.titel || '', bij: (v) => zet((pl) => { pl.titel = v; }, 'ptitel') }),
      maakVeld({ label: 'Subtitel', waarde: plan.subtitel || '', bij: (v) => zet((pl) => { pl.subtitel = v; }, 'psub') }),
      maakVeld({ label: 'Compact kader bij het afdrukken', type: 'checkbox', waarde: plan.compact, bij: (v) => zet((pl) => { pl.compact = v; }) }),
      maakVeld({ label: 'Deurtype voor nieuwe deuren', opties: [['draai', 'Draaideur'], ['dubbel', 'Dubbele deur'], ['schuif', 'Schuifdeur']], waarde: plan.deurType || 'draai', bij: (v) => zet((pl) => { pl.deurType = v; }) }),
    );
    const info = document.createElement('p');
    info.className = 'hint';
    info.textContent = 'Kies iets op het plan om zijn eigenschappen te zien.';
    paneel.append(info);
    return;
  }
  if (aantal > 1) {
    kop(`${aantal} dingen gekozen`);
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'Verplaats ze samen met de muis of de pijltjestoetsen. Met de knoppen bovenaan kan je ze kopiëren, spiegelen, roteren, vergroten of kleuren.';
    paneel.append(p);
    return;
  }

  if (o.symbolen.length) {
    const { id, pl } = o.symbolen[0];
    const deel = deelVan(onderdelen(staat.project), id, pl);
    kop(deel ? (deel.item === 'bord' ? 'Verdeelbord' : `${deel.code || 'Los symbool'} ${itemNaam(deel.item)}`) : 'Symbool');
    const rot = () => zet((pp) => pp);
    form.append(
      maakVeld({ label: 'Hoek (°)', type: 'number', waarde: pl.rot || 0, bij: (v) => zet((pp) => { const x = pp.plaatsingen[id]; if (x) x.rot = ((Number(v) || 0) % 360 + 360) % 360; }, `hoek${id}`) }),
      maakVeld({ label: 'Plaatsing tekst', opties: PLAATSEN, waarde: pl.tekstPlaats || 'auto', bij: (v) => zet((pp) => { pp.plaatsingen[id].tekstPlaats = v; }) }),
      maakVeld({ label: 'Plaatsing adres', opties: ADRES_OPTIES, waarde: pl.adresPlaats || 'plus0', bij: (v) => zet((pp) => { pp.plaatsingen[id].adresPlaats = v; }) }),
      maakVeld({ label: 'Kleur', type: 'color', waarde: pl.kleur || '#c2410c', bij: (v) => zet((pp) => { pp.plaatsingen[id].kleur = v; }) }),
    );
    void rot;
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = pl.los
      ? 'Een los symbool: koppel het later aan een kring in het ééndraadschema (kies een kring en kijk onder “Losse symbolen van het situatieschema”).'
      : 'Het adres vul je in bij het onderdeel in het ééndraadschema.';
    paneel.append(hint);
    return;
  }

  if (o.teksten.length) {
    const t = o.teksten[0];
    kop('Tekst');
    form.append(
      maakVeld({ label: 'Tekst', waarde: t.tekst, bij: (v) => zet((pl) => { pl.teksten.find((x) => x.id === t.id).tekst = v; }, `tekst${t.id}`) }),
      maakVeld({ label: 'Grootte', type: 'number', waarde: t.grootte || 16, min: 4, max: 200, bij: (v) => zet((pl) => { pl.teksten.find((x) => x.id === t.id).grootte = Number(v) || 16; }, `tg${t.id}`) }),
      maakVeld({ label: 'Kleur', type: 'color', waarde: t.kleur || '#3a3f47', bij: (v) => zet((pl) => { pl.teksten.find((x) => x.id === t.id).kleur = v; }) }),
    );
    return;
  }

  const m = o.elementen[0];
  const soort = m.soort || 'muur';
  const dit = (pl) => pl.muren.find((x, i) => (x.id ?? i) === (m.id ?? plan.muren.indexOf(m)));
  kop(ELEMENTEN[soort].naam);
  const standaard = Math.max(4, 6 * (plan.symbool || 1));
  if (['muur', 'raam', 'deur', 'poort', 'boog'].includes(soort)) {
    form.append(maakVeld({ label: plan.schaal ? 'Breedte (cm)' : 'Breedte', type: 'number', waarde: naarCm(plan, m.dikte || standaard), min: 1, bij: (v) => zet((pl) => { const w = vanCm(pl, Number(v) || 1); dit(pl).dikte = w; pl.standaard = { ...(pl.standaard || {}), [soort]: w }; }, `db${m.id}`) }));
  }
  if (soort === 'deur') {
    form.append(
      maakVeld({ label: 'Type', opties: [['draai', 'Draaideur'], ['dubbel', 'Dubbele deur'], ['schuif', 'Schuifdeur']], waarde: m.type || 'draai', bij: (v) => zet((pl) => { dit(pl).type = v; }) }),
      maakVeld({ label: 'Draairichting omkeren', type: 'checkbox', waarde: m.spiegel, bij: (v) => zet((pl) => { dit(pl).spiegel = v; }) }),
    );
  }
  if (soort === 'trap') {
    form.append(maakVeld({ label: plan.schaal ? 'Breedte (cm)' : 'Breedte', type: 'number', waarde: naarCm(plan, m.breedte || 90), min: 10, bij: (v) => zet((pl) => { const w = vanCm(pl, Number(v) || 90); dit(pl).breedte = w; pl.standaard = { ...(pl.standaard || {}), trap: w }; }, `tb${m.id}`) }));
  }
  if (soort === 'lijn') {
    form.append(maakVeld({ label: 'Dikte (mm)', type: 'number', waarde: m.dikte || 0.35, min: 0.1, max: 3, stap: 0.05, bij: (v) => zet((pl) => { dit(pl).dikte = Number(v) || 0.35; pl.lijnDikte = Number(v) || 0.35; }, `ld${m.id}`) }));
  }
  if (ELEMENTEN[soort].rond) {
    form.append(
      maakVeld({ label: plan.schaal ? 'Breedte (cm)' : 'Breedte', type: 'number', waarde: naarCm(plan, m.w), min: 1, bij: (v) => zet((pl) => { const e = dit(pl); const nieuw = vanCm(pl, Number(v) || 1); if (soort === 'afbeelding') e.h = (e.h / e.w) * nieuw; e.w = nieuw; }, `rb${m.id}`) }),
      maakVeld({ label: plan.schaal ? 'Hoogte (cm)' : 'Hoogte', type: 'number', waarde: naarCm(plan, m.h), min: 1, bij: (v) => zet((pl) => { const e = dit(pl); const nieuw = vanCm(pl, Number(v) || 1); if (soort === 'afbeelding') e.w = (e.w / e.h) * nieuw; e.h = nieuw; }, `rh${m.id}`) }),
      maakVeld({ label: 'Hoek (°)', type: 'number', waarde: Math.round(m.hoek || 0), bij: (v) => zet((pl) => { dit(pl).hoek = Number(v) || 0; }, `rhoek${m.id}`) }),
    );
  }
  if (soort === 'vlak') {
    form.append(
      maakVeld({ label: 'Kleur', type: 'color', waarde: m.kleur || '#93c5fd', bij: (v) => zet((pl) => { dit(pl).kleur = v; }) }),
      maakVeld({ label: 'Transparantie (0–1)', type: 'number', waarde: m.transparantie ?? 0.6, min: 0, max: 1, stap: 0.05, bij: (v) => zet((pl) => { dit(pl).transparantie = Math.min(1, Math.max(0, Number(v))); }, `tr${m.id}`) }),
    );
  } else if (['lijn', 'maat', 'rechthoek', 'trap', 'draaitrap'].includes(soort)) {
    form.append(maakVeld({ label: 'Kleur', type: 'color', waarde: m.kleur || '#2b2f36', bij: (v) => zet((pl) => { dit(pl).kleur = v; }) }));
  }
  if (soort === 'maat') {
    form.append(
      maakVeld({ label: 'Vaste tekst', waarde: m.tekst || '', bij: (v) => zet((pl) => { dit(pl).tekst = v; }, `mt${m.id}`) }),
      maakVeld({ label: 'Afstand tot de meetpunten', type: 'number', waarde: Math.round(m.afstand ?? 30), bij: (v) => zet((pl) => { dit(pl).afstand = Number(v) || 0; }, `ma${m.id}`) }),
    );
  }
  if (soort === 'afbeelding') {
    form.append(
      maakVeld({ label: 'Vergrendeld (niet verplaatsbaar of te wissen)', type: 'checkbox', waarde: m.slot, bij: (v) => zet((pl) => { dit(pl).slot = v; }) }),
      maakVeld({ label: 'Dekking (0–1)', type: 'number', waarde: m.dekking ?? 1, min: 0.05, max: 1, stap: 0.05, bij: (v) => zet((pl) => { dit(pl).dekking = Number(v); }, `dk${m.id}`) }),
    );
  }
  if (['muur', 'deur', 'raam', 'poort', 'lijn', 'trap', 'meet'].includes(soort) && plan.schaal) {
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = `Lengte: ${lengteTekst(afstand(m), plan.schaal)}. Typ een andere lengte in de werkbalk bovenaan om het stuk precies zo lang te maken.`;
    paneel.append(p);
  }
}

// ---------- Vensters in de werkbalk ----------

async function schaalDialoog(px) {
  const { knop, waarden } = await vraag({
    titel: 'Schaal instellen',
    tekst: 'Hoeveel meter is de afstand tussen de twee punten die je aanklikte?',
    velden: [{ naam: 'm', label: 'Afstand (m)', type: 'number', waarde: '', min: 0 }],
  });
  const meter = Number(waarden.m);
  if (knop === 'ok' && meter > 0) {
    wijzig((pr) => { huidigPlan(pr).schaal = px / meter; }, { paneel: false });
    zetGereedschap('kies');
    melding('Schaal ingesteld: de afmetingen kloppen nu in meter.');
  }
}

// ---------- Achtergrond (afbeelding, PDF of DXF) ----------

const isTekening = (bestand) => /\.(pdf|dxf|dwg)$/i.test(bestand.name) || bestand.type === 'application/pdf';

/** Een bestand inlezen als { src, breedte, hoogte, schaal, bron }: een tekening via het importvenster, een foto direct. */
async function leesBestand(bestand) {
  if (isTekening(bestand)) return importeer(bestand);
  return { ...(await leesBeeldBestand(bestand)), schaal: null, bron: null };
}

/** Schuif alles wat op het plan staat op, bv. na een nieuwe uitsnede van de achtergrond. */
function schuifPlanOp(plan, dx, dy) {
  for (const pl of Object.values(plan.plaatsingen)) { pl.x += dx; pl.y += dy; }
  for (const m of plan.muren) verschuifElement(m, dx, dy);
  for (const t of plan.teksten) { t.x += dx; t.y += dy; }
}

/** De muren uit een PDF (dikke lijnen) op het plan zetten, groot genoeg en netjes in beeld. */
function wallenToevoegen(r) {
  const K = 2; // tekeneenheden per punt van de pagina
  const marge = 40;
  const xs = r.muren.flatMap((m) => [m.x1, m.x2]);
  const ys = r.muren.flatMap((m) => [m.y1, m.y2]);
  if (!xs.length) { melding('Geen dikke lijnen gevonden op deze pagina. Probeer een kleinere minimale dikte.', 'fout'); return; }
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const breedte = Math.ceil((Math.max(...xs) - x0) * K + 2 * marge);
  const hoogte = Math.ceil((Math.max(...ys) - y0) * K + 2 * marge);
  wijzig((p) => {
    const plan = huidigPlan(p);
    plan.breedte = Math.max(plan.breedte || 0, breedte);
    plan.hoogte = Math.max(plan.hoogte || 0, hoogte);
    for (const m of r.muren) {
      plan.muren.push(nieuwElement('muur', { x1: Math.round(((m.x1 - x0) * K + marge) * 10) / 10, y1: Math.round(((m.y1 - y0) * K + marge) * 10) / 10, x2: Math.round(((m.x2 - x0) * K + marge) * 10) / 10, y2: Math.round(((m.y2 - y0) * K + marge) * 10) / 10 }));
    }
    plan.schaal = null;
    plan.symbool = Math.round(Math.min(8, Math.max(0.6, (Math.max(plan.breedte, plan.hoogte) / 1000) * 1.2)) * 10) / 10;
  });
  vlak.ingesteld = false;
  herteken();
  zetGereedschap('schaal');
  melding(`${r.muren.length} muren overgenomen. Stel nu de schaal in: klik twee punten waarvan je de afstand kent.`);
}

async function laadAchtergrond(bestand) {
  melding(isTekening(bestand) ? 'Tekening inlezen…' : 'Afbeelding inlezen…');
  let beeld;
  try {
    beeld = await leesBestand(bestand);
  } catch (e) {
    console.error(e);
    melding(`Kan dit plan niet openen: ${e.message}`, 'fout');
    return;
  }
  if (!beeld) return;
  if (beeld.muren) { wallenToevoegen(beeld); return; }
  const id = nieuwId();
  wijzig((p) => {
    p.afbeeldingen[id] = { src: beeld.src, breedte: beeld.breedte, hoogte: beeld.hoogte, naam: bestand.name, ...(beeld.bron ? { bron: beeld.bron } : {}) };
    const plan = huidigPlan(p);
    const leeg = !Object.keys(plan.plaatsingen).length && !plan.muren.length && !plan.teksten.length;
    if (!leeg && plan.breedte && plan.hoogte) {
      // Wat al getekend was, mee schalen met het nieuwe plan.
      const fx = beeld.breedte / plan.breedte;
      const fy = beeld.hoogte / plan.hoogte;
      for (const pl of Object.values(plan.plaatsingen)) { pl.x *= fx; pl.y *= fy; }
      for (const m of plan.muren) {
        if (ELEMENTEN[m.soort]?.rond) { m.cx *= fx; m.cy *= fy; m.w *= fx; m.h *= fy; } else { m.x1 *= fx; m.x2 *= fx; m.y1 *= fy; m.y2 *= fy; if (m.bx != null) { m.bx *= fx; m.by *= fy; } }
      }
      for (const t of plan.teksten) { t.x *= fx; t.y *= fy; }
    }
    plan.achtergrond = id;
    plan.schaal = beeld.schaal || null; // de schaal van het nieuwe plan is nog niet gekend, tenzij de tekening ze meebrengt
    plan.breedte = beeld.breedte;
    plan.hoogte = beeld.hoogte;
    plan.symbool = Math.round(Math.min(8, Math.max(0.6, (Math.max(beeld.breedte, beeld.hoogte) / 1000) * 1.2)) * 10) / 10;
  });
  vlak.ingesteld = false;
  herteken();
  if (beeld.schaal) {
    zetGereedschap('kies');
    melding('Plan geladen. De schaal komt uit de tekening; controleer ze met een meetlijn.');
  } else {
    zetGereedschap('schaal');
    melding('Plan geladen. Stel nu de schaal in: klik twee punten waarvan je de afstand kent.');
  }
}

/** Lagen, kleur en uitsnede van het geladen plan opnieuw instellen. */
async function tekeningAanpassen() {
  const plan = huidigPlan();
  const afb = plan.achtergrond && staat.project.afbeeldingen[plan.achtergrond];
  if (!afb?.bron) { melding('Dit plan is een gewone afbeelding: er valt niets aan te passen.'); return; }
  let r;
  try {
    r = await importeer(null, afb.bron);
  } catch (e) {
    melding(`Aanpassen mislukt: ${e.message}`, 'fout');
    return;
  }
  if (!r) return;
  wijzig((p) => {
    const pl = huidigPlan(p);
    const a = p.afbeeldingen[pl.achtergrond];
    Object.assign(a, { src: r.src, breedte: r.breedte, hoogte: r.hoogte, bron: r.bron });
    schuifPlanOp(pl, -r.opschuiving.x, -r.opschuiving.y);
    pl.breedte = r.breedte;
    pl.hoogte = r.hoogte;
  });
  achtergrondSleutel = null;
  vlak.ingesteld = false;
  herteken();
}

// ---------- Opstarten ----------

export function startSituatie() {
  const svg = $('#situatie-svg');
  const stijl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  stijl.textContent = `${SCHEMA_STIJL}${PLAN_STIJL}
.handvat{fill:#f59e0b;stroke:#fff;stroke-width:1.2;cursor:crosshair}
.marquee{fill:rgba(37,99,235,.08);stroke:#2563eb;stroke-width:1;stroke-dasharray:5 3}`;
  svg.prepend(stijl);
  vlak = new Vlak(svg, { leegSlepen: () => false });

  /** Het ding onder de muis: een symbool, tekst of element. */
  const doelVan = (e) => {
    const plaats = e.target.closest('[data-plaats]');
    if (plaats) return { soort: 'item', id: plaats.dataset.plaats };
    const tekstEl = e.target.closest('[data-tekst]');
    if (tekstEl) return { soort: 'tekst', id: tekstEl.dataset.tekst };
    const verb = e.target.closest('[data-verb]');
    if (verb) return { soort: 'verb', id: verb.dataset.verb };
    const el = e.target.closest('[data-muur]');
    if (el) return { soort: 'el', id: el.dataset.muur };
    return null;
  };

  /** Verplaats alles wat gekozen is met de muis. */
  const startVerplaats = (e, punt, doel) => {
    const plan = huidigPlan();
    const o = gekozenObjecten(plan);
    const orig = {
      elementen: o.elementen.filter((m) => !m.slot).map((m) => ({ m, kopie: structuredClone(m) })),
      teksten: o.teksten.map((t) => ({ t, x: t.x, y: t.y })),
      symbolen: o.symbolen.map((s) => ({ s, x: s.pl.x, y: s.pl.y, rot: s.pl.rot || 0 })),
    };
    const veel = orig.elementen.length + orig.teksten.length + orig.symbolen.length > 1;
    if (!orig.elementen.length && !orig.teksten.length && !orig.symbolen.length) return;
    const referentie = orig.symbolen[0] ? { x: orig.symbolen[0].x, y: orig.symbolen[0].y }
      : orig.teksten[0] ? { x: orig.teksten[0].x, y: orig.teksten[0].y }
        : orig.elementen[0] ? (({ x0, y0 }) => ({ x: x0, y: y0 }))(omhulsel(orig.elementen[0].kopie)) : { x: 0, y: 0 };
    let bewogen = false;
    let wacht = false;
    svg.setPointerCapture(e.pointerId);
    const beweeg = (ev) => {
      const q = vlak.naarTekening(ev.clientX, ev.clientY);
      let dx = q.x - punt.x;
      let dy = q.y - punt.y;
      if (!bewogen) {
        if (Math.hypot(dx, dy) * vlak.s < 3) return;
        bewogen = true;
        wijzig(() => {}, { paneel: false });
      }
      if (plan.kleefGrid && !ev.altKey) {
        dx = Math.round((referentie.x + dx) / GRID) * GRID - referentie.x;
        dy = Math.round((referentie.y + dy) / GRID) * GRID - referentie.y;
      }
      for (const { m, kopie } of orig.elementen) {
        Object.assign(m, structuredClone(kopie));
        verschuifElement(m, dx, dy);
      }
      for (const { t, x, y } of orig.teksten) { t.x = Math.round(x + dx); t.y = Math.round(y + dy); }
      for (const { s, x, y, rot } of orig.symbolen) {
        if (!veel) {
          // Een enkel symbool kleeft aan een muur in de buurt en draait mee; ver van een muur krijgt het zijn eigen hoek terug.
          const deel = deelVan(onderdelen(staat.project), s.id, s.pl);
          Object.assign(s.pl, vastePlaats({ x: x + dx, y: y + dy }, deel, ev.altKey, rot));
        } else {
          s.pl.x = afger(x + dx);
          s.pl.y = afger(y + dy);
        }
      }
      if (!wacht) {
        wacht = true;
        requestAnimationFrame(() => { wacht = false; tekenPlanLaag(); });
      }
    };
    const los = () => {
      svg.removeEventListener('pointermove', beweeg);
      svg.removeEventListener('pointerup', los);
      svg.removeEventListener('pointercancel', los);
      if (bewogen) {
        zetGewijzigd(true);
      } else if (veel && !e.shiftKey) {
        zetKeuze([doel]);
      }
      herteken({ paneel: true });
    };
    svg.addEventListener('pointermove', beweeg);
    svg.addEventListener('pointerup', los);
    svg.addEventListener('pointercancel', los);
  };

  /** Een uiteinde of hoekpunt van het gekozen element verslepen. */
  const startHandvat = (e, soortHandvat) => {
    const plan = huidigPlan();
    const el = enkelElement(plan);
    if (!el) return;
    let eerste = true;
    svg.setPointerCapture(e.pointerId);
    let wacht = false;
    const beweeg = (ev) => {
      if (eerste) { wijzig(() => {}, { paneel: false }); eerste = false; }
      const ruw = vlak.naarTekening(ev.clientX, ev.clientY);
      const andere = soortHandvat === 'p1' ? { x: el.x2, y: el.y2 } : { x: el.x1, y: el.y1 };
      const q = vastPunt(ruw, { van: andere, ctrl: ev.ctrlKey, alt: ev.altKey });
      if (soortHandvat === 'p1') { el.x1 = q.x; el.y1 = q.y; }
      else if (soortHandvat === 'p2') { el.x2 = q.x; el.y2 = q.y; }
      else if (soortHandvat === 'pb') { el.bx = q.x; el.by = q.y; }
      else if (soortHandvat === 'afstand') {
        const l = afstand(el) || 1;
        const nx = -(el.y2 - el.y1) / l;
        const ny = (el.x2 - el.x1) / l;
        el.afstand = Math.round((ruw.x - (el.x1 + el.x2) / 2) * nx + (ruw.y - (el.y1 + el.y2) / 2) * ny);
      } else if (soortHandvat === 'grootte') {
        const lokaal = draaiPunt(ruw.x, ruw.y, el.cx, el.cy, -(el.hoek || 0));
        const w = Math.max(10, Math.abs(lokaal.x - el.cx) * 2);
        if (el.soort === 'afbeelding') { const v = el.h / el.w; el.w = w; el.h = w * v; } else { el.w = w; el.h = Math.max(10, Math.abs(lokaal.y - el.cy) * 2); }
      } else if (soortHandvat === 'draai') {
        let hoek = (Math.atan2(ruw.y - el.cy, ruw.x - el.cx) * 180) / Math.PI + 90;
        if (ev.shiftKey) hoek = Math.round(hoek / 15) * 15;
        el.hoek = ((Math.round(hoek) % 360) + 360) % 360;
      }
      if (!wacht) {
        wacht = true;
        requestAnimationFrame(() => { wacht = false; tekenPlanLaag(); });
      }
    };
    const los = () => {
      svg.removeEventListener('pointermove', beweeg);
      svg.removeEventListener('pointerup', los);
      svg.removeEventListener('pointercancel', los);
      if (!eerste) zetGewijzigd(true);
      herteken({ paneel: true });
    };
    svg.addEventListener('pointermove', beweeg);
    svg.addEventListener('pointerup', los);
    svg.addEventListener('pointercancel', los);
  };

  /** Een selectierechthoek over het plan slepen. */
  const startKader = (e, punt) => {
    const plan = huidigPlan();
    const laag = $('#situatie-svg .voorbeeld-laag');
    const begin = e.shiftKey ? [...staat.planKeuze] : [];
    let bewogen = false;
    svg.setPointerCapture(e.pointerId);
    const vak = (ev) => {
      const q = vlak.naarTekening(ev.clientX, ev.clientY);
      return { x0: Math.min(punt.x, q.x), y0: Math.min(punt.y, q.y), x1: Math.max(punt.x, q.x), y1: Math.max(punt.y, q.y) };
    };
    const beweeg = (ev) => {
      const v = vak(ev);
      if (!bewogen && Math.hypot(v.x1 - v.x0, v.y1 - v.y0) * vlak.s < 4) return;
      bewogen = true;
      laag.innerHTML = `<rect class="marquee" x="${afger(v.x0)}" y="${afger(v.y0)}" width="${afger(v.x1 - v.x0)}" height="${afger(v.y1 - v.y0)}"/>`;
    };
    const los = (ev) => {
      svg.removeEventListener('pointermove', beweeg);
      svg.removeEventListener('pointerup', los);
      svg.removeEventListener('pointercancel', los);
      laag.innerHTML = '';
      if (bewogen && ev.type === 'pointerup') {
        const v = vak(ev);
        const binnen = (x, y) => x >= v.x0 && x <= v.x1 && y >= v.y0 && y <= v.y1;
        const nieuw = [];
        plan.muren.forEach((m, i) => {
          const b = omhulsel(m);
          if (b.x0 >= v.x0 && b.x1 <= v.x1 && b.y0 >= v.y0 && b.y1 <= v.y1) nieuw.push({ soort: 'el', id: m.id ?? i });
        });
        for (const t of plan.teksten) if (binnen(t.x, t.y)) nieuw.push({ soort: 'tekst', id: t.id });
        for (const [id, pl] of Object.entries(plan.plaatsingen)) if (binnen(pl.x, pl.y)) nieuw.push({ soort: 'item', id });
        const al = new Set(begin.map((k) => `${k.soort}:${k.id}`));
        zetKeuze([...begin, ...nieuw.filter((k) => !al.has(`${k.soort}:${k.id}`))]);
      } else if (!bewogen && !e.shiftKey) {
        zetKeuze([]);
      }
      herteken({ paneel: true });
    };
    svg.addEventListener('pointermove', beweeg);
    svg.addEventListener('pointerup', los);
    svg.addEventListener('pointercancel', los);
  };

  svg.addEventListener('pointerdown', async (e) => {
    if (e.button !== 0 || vlak.spatie) return;
    const punt = vlak.naarTekening(e.clientX, e.clientY);

    if (plaatsen) {
      plaatsOp(punt, e.altKey);
      return;
    }
    if (gereedschap === 'los') {
      if (losKeuze != null) plaatsLos(punt, e.altKey);
      return;
    }
    if (gereedschap === 'verbind' || gereedschap === 'kring') {
      const d = doelVan(e);
      if (d?.soort !== 'item') return;
      if (gereedschap === 'verbind') { verbind(d.id); return; }
      const kring = $('#plan-kring-kies').value;
      if (!kring) { melding('Maak eerst een kring (zekering) of kies er een.'); return; }
      const pl = huidigPlan().plaatsingen[d.id];
      if (!pl?.los) { melding('Dit symbool hoort al bij een kring.'); return; }
      zetKeuze([d]);
      await toewijzen(kring);
      return;
    }
    if (TEKEN[gereedschap]) {
      if (gereedschap === 'afbeelding' && !nieuweAfb) return;
      tekenKlik(punt, e);
      return;
    }
    if (gereedschap === 'schaal') {
      if (!punten.length) {
        punten = [{ x: punt.x, y: punt.y }];
        return;
      }
      const van = punten[0];
      const px = Math.hypot(punt.x - van.x, punt.y - van.y);
      punten = [];
      $('#situatie-svg .voorbeeld-laag').innerHTML = '';
      if (px >= 5) await schaalDialoog(px);
      return;
    }
    if (gereedschap === 'tekst') {
      const t = await vraagTekst('Tekst op het plan', '', 'Tekst (bv. Keuken, Badkamer)');
      if (t) {
        const id = nieuwId();
        wijzig((pr) => huidigPlan(pr).teksten.push({ id, x: Math.round(punt.x), y: Math.round(punt.y), tekst: t, grootte: 16, ...(huidigPlan().kleur ? { kleur: huidigPlan().kleur } : {}) }), { paneel: false });
      }
      return;
    }

    // Selecteren.
    const handvat = e.target.closest('[data-handvat]');
    if (handvat) {
      e.preventDefault();
      startHandvat(e, handvat.dataset.handvat);
      return;
    }
    const doel = doelVan(e);
    if (!doel) {
      startKader(e, punt);
      return;
    }
    e.preventDefault();
    const al = gekozen(doel.soort, doel.id);
    if (e.shiftKey) {
      zetKeuze(al ? staat.planKeuze.filter((k) => !(k.soort === doel.soort && k.id === doel.id)) : [...staat.planKeuze, doel]);
      herteken({ paneel: true });
      return;
    }
    if (!al) zetKeuze([doel]);
    if (doel.soort === 'item' && doel.id !== 'bord' && !huidigPlan().plaatsingen[doel.id]?.los) staat.selectie = doel.id;
    herteken({ paneel: true });
    startVerplaats(e, punt, doel);
  });

  svg.addEventListener('pointermove', (e) => {
    const laag = $('#situatie-svg .voorbeeld-laag');
    if (plaatsen || (gereedschap === 'los' && losKeuze != null)) {
      // Een doorschijnend voorbeeld van het onderdeel, op de plaats waar het zou komen.
      let deel;
      if (plaatsen) deel = onderdelen(staat.project).get(plaatsen);
      else { const w = PALET[losKeuze]; deel = { item: nieuwItem(w.soort, w.waarden), code: '' }; }
      if (!deel) return;
      const plek = vastePlaats(vlak.naarTekening(e.clientX, e.clientY), deel, e.altKey, plaatsRot);
      laag.innerHTML = `<g opacity=".55" pointer-events="none">${plaatsingSvg(deel, plek, huidigPlan().symbool || 1)}</g>`;
      return;
    }
    if (gereedschap === 'verbind' && verbindVan) {
      const a = huidigPlan().plaatsingen[verbindVan];
      const q = vlak.naarTekening(e.clientX, e.clientY);
      if (a) laag.innerHTML = `<line class="verbinding" pointer-events="none" x1="${a.x}" y1="${a.y}" x2="${q.x}" y2="${q.y}"/>`;
      return;
    }
    if (gereedschap === 'schaal' && punten.length) {
      toonVoorbeeld(vlak.naarTekening(e.clientX, e.clientY));
      return;
    }
    if (TEKEN[gereedschap] && (punten.length || gereedschap === 'afbeelding')) {
      if (gereedschap === 'afbeelding' && !punten.length) return;
      toonVoorbeeld(vastPunt(vlak.naarTekening(e.clientX, e.clientY), { van: punten.at(-1), ctrl: e.ctrlKey, alt: e.altKey }));
    }
  });

  svg.addEventListener('contextmenu', (e) => {
    if (plaatsen || (gereedschap === 'los' && losKeuze != null)) {
      e.preventDefault();
      const huidig = plaatsen ? onderdelen(staat.project).get(plaatsen)?.item : PALET[losKeuze] && { soort: PALET[losKeuze].soort };
      plaatsRot = (plaatsRot + draaiStap(huidig, e.altKey)) % 360;
      svg.dispatchEvent(new PointerEvent('pointermove', { clientX: e.clientX, clientY: e.clientY, altKey: e.altKey }));
    } else if (gereedschap === 'kies' && !punten.length && (e.target.closest?.('[data-plaats]') || staat.planKeuze.some((k) => k.soort === 'item'))) {
      // Rechtermuisknop op een symbool: zoals in Trikker draaien, met Shift de plaats van de tekst en met Ctrl die van het adres.
      e.preventDefault();
      const id = e.target.closest?.('[data-plaats]')?.dataset.plaats;
      if (id && !staat.planKeuze.some((k) => k.soort === 'item' && k.id === id)) zetKeuze([{ soort: 'item', id }]);
      if (e.shiftKey) wisselTekstPlaats();
      else if (e.ctrlKey) wisselAdresPlaats();
      else draaiGekozen(e.altKey);
    } else if (gereedschap === 'deur') {
      e.preventDefault();
      tekenSpiegel = !tekenSpiegel;
      if (punten.length) svg.dispatchEvent(new PointerEvent('pointermove', { clientX: e.clientX, clientY: e.clientY }));
    } else if (punten.length) {
      e.preventDefault();
      punten = [];
      lopendeSom = 0;
      $('#situatie-svg .voorbeeld-laag').innerHTML = '';
    }
  });

  svg.addEventListener('dblclick', async (e) => {
    const el = e.target.closest('[data-tekst]');
    if (!el || gereedschap !== 'kies') return;
    const id = el.dataset.tekst;
    const huidig = huidigPlan().teksten.find((t) => t.id === id);
    const nieuw = await vraagTekst('Tekst wijzigen', huidig.tekst, 'Tekst');
    if (nieuw) wijzig((p) => { huidigPlan(p).teksten.find((t) => t.id === id).tekst = nieuw; }, { paneel: true });
  });

  svg.addEventListener('wheel', () => requestAnimationFrame(tekenHandvatten), { passive: true });

  // Slepen van een bestand op het plan: een afbeelding (of tekening) toevoegen.
  svg.addEventListener('dragover', (e) => e.preventDefault());
  svg.addEventListener('drop', async (e) => {
    e.preventDefault();
    const bestand = e.dataTransfer?.files?.[0];
    if (bestand) await bestandToevoegen(bestand);
  });

  $('#plannen').addEventListener('click', (e) => {
    const hernoem = e.target.closest('[data-hernoem]');
    if (hernoem) return hernoemPlan(hernoem.dataset.hernoem);
    const wis = e.target.closest('[data-wis]');
    if (wis) return wisPlan(wis.dataset.wis);
    const rij = e.target.closest('[data-plan]');
    if (rij) kiesPlan(rij.dataset.plan);
    return undefined;
  });

  $('#te-plaatsen').addEventListener('click', (e) => {
    const los = e.target.closest('[data-los]');
    if (los) {
      losKeuze = Number(los.dataset.los);
      tekenLijst();
      return;
    }
    toolboxKlik(e);
  });

  $('#plan-nieuw').addEventListener('click', nieuwPlanToevoegen);
  for (const b of document.querySelectorAll('[data-gereedschap]')) {
    b.addEventListener('click', () => {
      if (b.dataset.gereedschap === 'afbeelding') { $('#plan-afb-bestand').click(); return; }
      zetGereedschap(b.dataset.gereedschap);
    });
  }
  $('#plan-afb-bestand').addEventListener('change', async (e) => {
    const bestand = e.target.files?.[0];
    e.target.value = '';
    if (bestand) await bestandToevoegen(bestand);
  });
  $('#plan-laden').addEventListener('click', () => $('#plan-bestand').click());
  $('#plan-bestand').addEventListener('change', async (e) => {
    const bestand = e.target.files?.[0];
    e.target.value = '';
    if (bestand) await laadAchtergrond(bestand);
  });
  $('#plan-weg').addEventListener('click', async () => {
    if (!await bevestig('Plan weghalen', 'De achtergrond weghalen? Muren, teksten en symbolen blijven staan.', 'Weghalen')) return;
    wijzig((p) => { huidigPlan(p).achtergrond = null; });
  });
  $('#plan-aanpas').addEventListener('click', () => tekeningAanpassen());
  svg.addEventListener('pointermove', (e) => { laatstePlaatsMuis = { clientX: e.clientX, clientY: e.clientY, altKey: e.altKey }; }, true);
  $('#plan-draai').addEventListener('click', () => {
    // Met een symbool aan de vinger (of muis) draait het volgende symbool; anders het gekozen symbool.
    if (plaatsen || (gereedschap === 'los' && losKeuze != null)) {
      const huidig = plaatsen ? onderdelen(staat.project).get(plaatsen)?.item : PALET[losKeuze] && { soort: PALET[losKeuze].soort };
      plaatsRot = (plaatsRot + draaiStap(huidig, false)) % 360;
      if (laatstePlaatsMuis) svg.dispatchEvent(new PointerEvent('pointermove', laatstePlaatsMuis));
    } else draaiGekozen();
  });
  $('#plan-verwijder').addEventListener('click', verwijderGekozen);
  $('#plan-toewijs').addEventListener('click', () => toewijzen());
  $('#plan-kopieer').addEventListener('click', kopieer);
  $('#plan-plak').addEventListener('click', plak);
  $('#plan-spiegel-h').addEventListener('click', () => spiegel(true));
  $('#plan-spiegel-v').addEventListener('click', () => spiegel(false));
  $('#plan-roteer').addEventListener('click', roteerGekozen);
  $('#plan-groter').addEventListener('click', schaalGekozen);
  $('#plan-kleur').addEventListener('click', kleurGekozen);
  $('#plan-zoek').addEventListener('click', () => window.dispatchEvent(new CustomEvent('actie', { detail: 'zoekES' })));
  $('#plan-vorige').addEventListener('click', () => { const p = staat.project.plannen; kiesPlan(p[Math.max(0, p.indexOf(huidigPlan()) - 1)].id); });
  $('#plan-volgende').addEventListener('click', () => { const p = staat.project.plannen; kiesPlan(p[Math.min(p.length - 1, p.indexOf(huidigPlan()) + 1)].id); });
  $('#plan-pagina-toevoegen').addEventListener('click', nieuwPlanToevoegen);
  $('#plan-pagina-wissen').addEventListener('click', () => wisPlan(huidigPlan().id));
  $('#plan-herschik').addEventListener('click', paginasHerschikken);
  $('#plan-afdrukschaal').addEventListener('click', afdrukSchaal);
  $('#plan-lengte').addEventListener('change', (e) => {
    const plan = huidigPlan();
    const meter = Number(String(e.target.value).replace(',', '.'));
    const el = enkelElement(plan);
    if (!el || !(meter > 0) || !plan.schaal) return;
    wijzig((p) => {
      const m = huidigPlan(p).muren.find((x, i) => (x.id ?? i) === (el.id ?? plan.muren.indexOf(el)));
      const nu = afstand(m);
      if (!nu) return;
      const f = (meter * plan.schaal) / nu;
      m.x2 = Math.round((m.x1 + (m.x2 - m.x1) * f) * 10) / 10;
      m.y2 = Math.round((m.y1 + (m.y2 - m.y1) * f) * 10) / 10;
    }, { paneel: true });
  });
  const vink = (id, sleutel) => $(id).addEventListener('change', (e) => wijzig((p) => { huidigPlan(p)[sleutel] = e.target.checked; }, { paneel: false }));
  vink('#plan-maten', 'alleMaten');
  vink('#plan-kleef', 'kleefMuur');
  vink('#plan-kleefgrid', 'kleefGrid');
  vink('#plan-grid', 'toonGrid');
  $('#plan-hoek').addEventListener('change', (e) => wijzig((p) => { huidigPlan(p).hoekStap = Number(e.target.value); }, { paneel: false }));
  vink('#plan-beletter', 'beletteren');
  vink('#plan-nummer', 'nummeren');
  $('#plan-transparant').addEventListener('change', (e) => window.dispatchEvent(new CustomEvent('actie', { detail: e.target.checked ? 'transparantAan' : 'transparantUit' })));
  $('#plan-symbool').addEventListener('input', (e) => {
    wijzig((p) => { huidigPlan(p).symbool = Number(e.target.value); }, { sleutel: 'symbool', paneel: false });
  });
  $('#plan-zicht').addEventListener('input', (e) => {
    wijzig((p) => { huidigPlan(p).zichtbaarheid = Number(e.target.value); }, { sleutel: 'zicht', paneel: false });
  });
  $('#situatie-zoom-in').addEventListener('click', () => { vlak.zoom(1.25); tekenHandvatten(); });
  $('#situatie-zoom-uit').addEventListener('click', () => { vlak.zoom(0.8); tekenHandvatten(); });
  $('#situatie-passend').addEventListener('click', () => {
    const plan = huidigPlan();
    vlak.passend(plan.breedte, plan.hoogte, { max: 2 });
    tekenHandvatten();
  });

  opWijziging(({ paneel }) => {
    if (staat.tab !== 'situatie') return;
    const p = staat.project;
    if (!p.plannen.some((pl) => pl.id === staat.planId)) staat.planId = p.plannen[0].id;
    if (plaatsen && plaatsen !== 'bord' && !onderdelen(p).has(plaatsen)) plaatsen = null;
    // Gekozen dingen die niet meer bestaan, uit de keuze halen.
    const plan = huidigPlan();
    staat.planKeuze = staat.planKeuze.filter((k) => (k.soort === 'item' ? plan.plaatsingen[k.id] : k.soort === 'tekst' ? plan.teksten.some((t) => t.id === k.id) : k.soort === 'verb' ? (plan.verbindingen || []).some((v) => v.id === k.id) : plan.muren.some((m, i) => String(m.id ?? i) === String(k.id))));
    tekenPlannen();
    tekenLijst();
    tekenVlak();
    if (paneel) tekenEigenschappen();
  });
}

/** Sneltoetsen voor het situatieschema. Geeft true als de toets verwerkt is. */
export function situatieToets(e) {
  const ctrl = e.ctrlKey || e.metaKey;
  const toets = e.key.toLowerCase();
  if (e.key === 'Delete' || e.key === 'Backspace') { verwijderGekozen(); return true; }
  if (e.key === 'Escape') { annuleer(); return true; }
  if (!ctrl && toets === 'r') { draaiGekozen(e.altKey); return true; }
  if (ctrl && toets === 'a') { alleSelecteren(); return true; }
  if (ctrl && toets === 'c') { kopieer(); return true; }
  if (ctrl && toets === 'v') { plak(); return true; }
  if (ctrl && toets === 'e') { zetGereedschap('kies'); return true; }
  if (ctrl && toets === 'd') { zetGereedschap(gereedschap === 'kies' || !TEKEN[gereedschap] ? 'muur' : gereedschap); return true; }
  if (ctrl && toets === 'l' && staat.project.opties?.losseSymbolen) { zetGereedschap('los'); return true; }
  if (ctrl && toets === 'f') { window.dispatchEvent(new CustomEvent('actie', { detail: 'zoekES' })); return true; }
  const richting = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (richting && staat.planKeuze.length && gereedschap === 'kies') {
    pijl(richting[0], richting[1], e);
    return true;
  }
  return false;
}

export function herstelZicht() {
  if (vlak) vlak.ingesteld = false;
  achtergrondSleutel = null;
  plaatsen = null;
  punten = [];
  klembord = null;
  gereedschap = 'kies';
}

/** Een gekozen bestand op het plan zetten als afbeelding-element: een foto, of een tekening (PDF, DXF). */
async function bestandToevoegen(bestand) {
  let beeld;
  try {
    beeld = await leesBestand(bestand);
  } catch (e) {
    melding(`Kan dit bestand niet openen: ${e.message}`, 'fout');
    return;
  }
  if (!beeld) return;
  const id = nieuwId();
  wijzig((p) => { p.afbeeldingen[id] = { src: beeld.src, breedte: beeld.breedte, hoogte: beeld.hoogte, naam: bestand.name, ...(beeld.bron ? { bron: beeld.bron } : {}) }; }, { paneel: false });
  nieuweAfb = { afb: id, verhouding: beeld.hoogte / beeld.breedte };
  zetGereedschap('afbeelding');
}

