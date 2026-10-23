// De woning-werkwijze, zoals de iPad-versie: eerst de symbolen in het huis zetten (componenten), dan schakelaars met lampen
// verbinden, dan het verdeelbord opbouwen en tot slot elk symbool aan een kring hangen. Het ééndraadschema volgt daaruit.
import {
  nieuwId, nieuwItem, nieuweKring, nieuwDifferentieel, codes, zoek, kastNamen, kringVanItem, wijsToeEen, maakLos, maakKringLeeg,
} from './model.js';
import { itemNaam, TOESTELLEN, AUTOMAAT_STROMEN, CURVES, SECTIES, komma } from './catalogus.js';
import { tekenPlan, onderdelen, volgendeTekstPlaats, volgendeAdresPlaats, kleefAanMuur, kleeftAanMuur, draaiStap, draaiRondSteel, symboolBreedte, plaatsingSvg } from './plan.js';
import { icoon, esc } from './symbolen.js';
import { staat, wijzig, opWijziging, ongedaan } from './staat.js';
import { Vlak } from './vlak.js';
import { vraag, vraagTekst, bevestig, melding } from './dialoog.js';
import { controleer } from './regels.js';

const $ = (s, ouder = document) => ouder.querySelector(s);
const STAPPEN = [
  ['componenten', 'componenten', '💡'],
  ['verbindingen', 'verbindingen', '⤴'],
  ['verdeelbord', 'verdeelbord', '▥'],
  ['kringen', 'kringen', '∞'],
];

let stap = 'componenten';
let vlak = null;
let acties = {};
let categorie = 'verlichting';
let gewapend = null; // het symbool uit het palet dat je op het plan wil zetten
let gewapendRot = 0; // de hoek waaronder het volgende symbool komt (rechtermuisknop draait)
let gekozenId = null; // het geplaatste symbool dat gekozen is
let gekozenKring = null; // de kring waaraan je symbolen hangt
let kast = null; // het gekozen tabblad in de stap kringen
let toonLabels = true;
let verbindVan = null;
let sleep = null;
let laatsteTik = { id: null, tijd: 0 };

const huidigPlan = (p = staat.project) => p.plannen.find((pl) => pl.id === staat.planId) || p.plannen[0];
const afger = (n) => Math.round(n * 10) / 10;

// ---------- Het palet ----------

const P = (soort, waarden = {}, naam) => ({ soort, waarden, naam: naam || itemNaam(nieuwItem(soort, waarden)) });

function favorieten() {
  try { return JSON.parse(localStorage.getItem('elektro-favorieten') || '[]').map((f) => ({ ...P(f.item.soort, f.item), naam: f.naam })); } catch { return []; }
}

export function palet() {
  const toestellen = Object.keys(TOESTELLEN).map((v) => P('toestel', { variant: v }));
  return [
    { id: 'favorieten', naam: 'Favorieten', items: favorieten() },
    { id: 'verlichting', naam: 'Verlichting', items: [
      P('lichtpunt'), P('lichtpunt', { wand: true }, 'Wandverlichting'), P('lichtpunt', { variant: 'spot' }), P('lichtpunt', { variant: 'led' }), P('lichtpunt', { variant: 'ledstrip' }),
      P('lichtpunt', { variant: 'tl' }), P('lichtpunt', { variant: 'tl', buizen: 2 }, 'TL met 2 buislampen'), P('lichtpunt', { variant: 'tl', buizen: 3 }, 'TL met 3 buislampen'),
      P('lichtpunt', { variant: 'signalisatie' }), P('lichtpunt', { nood: 'centraal' }, 'Noodverlichting centraal'), P('lichtpunt', { nood: 'decentraal' }, 'Noodverlichting decentraal'),
      P('lichtpunt', { waterdicht: true }, 'Lichtpunt (halfwaterdicht)'), P('transformator'), P('voorschakelapparaat'),
    ] },
    { id: 'schakelaars', naam: 'Schakelaars', items: [
      P('schakelaar'), P('schakelaar', { variant: 'tweepolig' }), P('schakelaar', { variant: 'wissel' }), P('schakelaar', { variant: 'dubbelewissel' }), P('schakelaar', { variant: 'kruis' }),
      P('schakelaar', { variant: 'serie' }), P('schakelaar', { dimmer: true }, 'Dimmer'), P('schakelaar', { rolluik: true }, 'Rolluikschakelaar'), P('schakelaar', { verklikker: true }, 'Schakelaar met verklikkerlamp'),
      P('schakelaar', { signalisatie: true }, 'Schakelaar met signalisatielamp'), P('schakelaar', { trek: true }, 'Trekschakelaar'), P('schakelaar', { waterdicht: true }, 'Schakelaar (halfwaterdicht)'),
      P('drukknop'), P('drukknop', { knoppen: 2 }), P('drukknop', { knoppen: 4 }), P('drukknop', { verklikker: true }, 'Drukknop met verklikkerlamp'),
      P('relais', { variant: 'impuls' }), P('relais', { variant: 'dimmer' }), P('relais', { variant: 'tijd' }), P('relais', { variant: 'thermostaat' }),
    ] },
    { id: 'stopcontacten', naam: 'Stopcontacten', items: [
      P('stopcontact'), P('stopcontact', { aantal: 2 }), P('stopcontact', { aantal: 3 }), P('stopcontact', { aantal: 4 }),
      P('stopcontact', { kinderveilig: false, aarding: false }, 'Contactdoos zonder bescherming'), P('stopcontact', { waterdicht: true }), P('stopcontact', { waterdicht: true, aantal: 2 }),
      P('stopcontact', { schakelaar: 'enkel' }, 'Stopcontact met schakelaar'), P('stopcontact', { transformator: true, opschrift: 'USB' }, 'Stopcontact met USB'),
      P('stopcontact', { fasen: 3, nul: true, pe: true }, 'Driefasig stopcontact'), P('communicatie'),
    ] },
    { id: 'toestellen', naam: 'Verbruikstoestellen', items: [
      P('toestel'), ...toestellen, P('boiler'), P('ketel'), P('verwarmingstoestel'), P('motor'), P('pomp'), P('ventiel'), P('zonnepaneel', { gestandaardiseerd: true }), P('omvormer'), P('aftakdoos'), P('teller'),
    ] },
    { id: 'alarm', naam: 'Beveiliging', items: [
      P('bewegingsdetector'), P('bewegingsdetector', { variant: 'gespreid' }), P('bewegingsdetector', { variant: 'rondom' }), P('branddetector', { variant: 'rook' }), P('branddetector', { variant: 'warmte' }), P('branddetector', { variant: 'gas' }),
      P('camera'), P('camera', { variant: 'dome' }), P('beveiligingscontact'), P('beveiligingscontact', { variant: 'schoot' }), P('geluidsbron', { variant: 'bel' }), P('geluidsbron', { variant: 'sirene' }), P('geluidsbron', { variant: 'hoorn' }),
      P('deurslot'), P('slot'), P('intercom'), P('monitor'), P('luidspreker'), P('microfoon'), P('kiezer'), P('toestelKlein', { opschrift: 'C' }, 'Centrale'),
    ] },
    { id: 'tekst', naam: 'Tekst', items: [{ tekst: true, naam: 'Tekst op het plan' }] },
  ];
}

// ---------- Het plan ----------

function planOpties() {
  const plan = huidigPlan();
  const labels = stap === 'kringen' && toonLabels;
  return { ...plan, beletteren: labels, nummeren: labels };
}

function tekenPlanLaag() {
  const p = staat.project;
  const plan = huidigPlan();
  const keuze = [];
  if (stap === 'kringen' && gekozenKring) {
    const k = zoek(p, gekozenKring)?.ding;
    for (const it of k?.items || []) keuze.push({ soort: 'item', id: it.id });
  } else if (gekozenId) keuze.push({ soort: 'item', id: gekozenId });
  if (verbindVan) keuze.push({ soort: 'item', id: verbindVan });
  $('#woning-svg .plan-laag').innerHTML = tekenPlan(p, planOpties(), { selectie: keuze, raster: false, stijl: 'woning', delen: onderdelen(p) });
  $('#woning-svg .plan-laag .plan-vlak')?.setAttribute('fill', 'transparent');
  // Verbindingen tonen we alleen bij het verbinden en bij de kringen.
  $('#woning-svg').classList.toggle('gewapend', Boolean(gewapend));
  if (!gewapend) $('#woning-svg .voorbeeld-laag').innerHTML = '';
  $('#woning-svg').classList.toggle('zonder-verbindingen', stap === 'componenten' || stap === 'verdeelbord');
}

/**
 * Waar een symbool terechtkomt, zoals in Trikker: contactdozen kleven met hun steeltje tegen de dichtstbijzijnde muur en
 * kijken de kamer in; al het andere komt vrij of op het raster te staan, onder de hoek die je met de rechtermuisknop koos.
 */
function bepaalPlaats(punt, item, alt = false, rot = 0) {
  const plan = huidigPlan();
  const kleef = !alt && plan.kleefMuur !== false && kleeftAanMuur(item) ? kleefAanMuur(plan, punt, symboolBreedte({ item, code: '' })) : null;
  if (kleef) {
    // Het steeltje blijft op het punt van de muur; de draaiing die je koos komt erbovenop.
    const w = draaiRondSteel({ x: kleef.x, y: kleef.y, rot: kleef.rot }, { item, code: '' }, plan.symbool || 1, rot);
    return { x: w.x, y: w.y, rot: w.rot };
  }
  const raster = !alt && plan.kleefGrid !== false ? 10 : 0;
  const v = (n) => (raster ? Math.round(n / raster) * raster : afger(n));
  return { x: v(punt.x), y: v(punt.y), rot };
}

async function plaatsGewapend(punt, alt) {
  if (!gewapend) return;
  if (gewapend.tekst) {
    const t = await vraagTekst('Tekst op het plan', '', 'Tekst');
    if (!t?.trim()) return;
    wijzig((p) => { huidigPlan(p).teksten.push({ id: nieuwId(), x: afger(punt.x), y: afger(punt.y), tekst: t.trim(), grootte: 16 }); });
    return;
  }
  const item = nieuwItem(gewapend.soort, gewapend.waarden);
  const plek = bepaalPlaats(punt, item, alt, gewapendRot);
  wijzig((p) => { huidigPlan(p).plaatsingen[item.id] = { ...plek, los: true, item }; });
  gekozenId = item.id;
  teken();
}

// ---------- Acties op een gekozen symbool ----------

function draaiGekozen(alt = false) {
  if (!gekozenId) return;
  wijzig((p) => {
    for (const pl of p.plannen) {
      const x = pl.plaatsingen[gekozenId];
      if (!x) continue;
      const item = x.los ? x.item : kringVanItem(p, gekozenId)?.items.find((i) => i.id === gekozenId);
      const stap = draaiStap(item, alt);
      if (kleeftAanMuur(item)) Object.assign(x, draaiRondSteel(x, { item, code: '' }, pl.symbool || 1, stap));
      else x.rot = (((x.rot || 0) + stap) % 360);
    }
  });
}

/** Shift + rechtermuisknop (tekst) of Ctrl + rechtermuisknop (adres): de plaats van de tekst bij het gekozen symbool doorlopen, zoals in Trikker. */
function wisselPlaats(veld, volgende) {
  if (!gekozenId) return;
  wijzig((p) => {
    for (const pl of p.plannen) if (pl.plaatsingen[gekozenId]) pl.plaatsingen[gekozenId][veld] = volgende(pl.plaatsingen[gekozenId][veld]);
  });
}

function wisGekozen() {
  if (!gekozenId) return;
  const id = gekozenId;
  gekozenId = null;
  wijzig((p) => {
    const k = kringVanItem(p, id);
    if (k) k.items.splice(k.items.findIndex((i) => i.id === id), 1);
    for (const pl of p.plannen) {
      delete pl.plaatsingen[id];
      pl.verbindingen = (pl.verbindingen || []).filter((v) => v.van !== id && v.naar !== id);
    }
  });
  melding('Symbool gewist', '', { knop: 'Ongedaan maken', actie: ongedaan });
}

function kopieerGekozen() {
  if (!gekozenId) return;
  const p = staat.project;
  const pl = p.plannen.find((x) => x.plaatsingen[gekozenId]);
  const x = pl?.plaatsingen[gekozenId];
  if (!x) return;
  const bron = x.los ? x.item : kringVanItem(p, gekozenId)?.items.find((i) => i.id === gekozenId);
  if (!bron) return;
  const kopie = { ...structuredClone(bron), id: nieuwId() };
  wijzig((pr) => { pr.plannen.find((q) => q.id === pl.id).plaatsingen[kopie.id] = { ...x, x: x.x + 18, y: x.y + 18, los: true, item: kopie }; });
  gekozenId = kopie.id;
  teken();
}

// ---------- Het plan bedienen ----------

const symboolOp = (e) => e.target.closest?.('[data-plaats]');

function koppelPlan() {
  const svg = $('#woning-svg');
  vlak = new Vlak(svg, { leegSlepen: () => !gewapend });

  svg.addEventListener('pointerdown', (e) => {
    const g = symboolOp(e);
    if (!g || e.button !== 0) return;
    const id = g.dataset.plaats;
    if (stap === 'verbindingen') {
      const x = huidigPlan().plaatsingen[id];
      if (!x) return;
      verbindVan = id;
      sleep = { soort: 'verbind', id };
      svg.setPointerCapture(e.pointerId);
      e.stopPropagation();
      return;
    }
    if (stap === 'componenten') {
      const x = huidigPlan().plaatsingen[id];
      if (!x) return;
      // Een symbool aanklikken kiest het (om te verslepen of te wissen), ook als er nog een symbool aan de muis hing.
      gewapend = null;
      gekozenId = id;
      sleep = { soort: 'zet', id, start: { x: e.clientX, y: e.clientY }, x0: x.x, y0: x.y, bewogen: false, g };
      svg.setPointerCapture(e.pointerId);
      e.stopPropagation();
      teken();
    }
  }, true);

  svg.addEventListener('pointermove', (e) => {
    if (!sleep) { toonSpook(e); return; }
    if (sleep.soort === 'zet') {
      const dx = e.clientX - sleep.start.x;
      const dy = e.clientY - sleep.start.y;
      if (!sleep.bewogen && Math.abs(dx) + Math.abs(dy) < 4) return;
      sleep.bewogen = true;
      const x = sleep.x0 + dx / vlak.s;
      const y = sleep.y0 + dy / vlak.s;
      sleep.nu = { x, y };
      const g = $(`[data-plaats="${CSS.escape(sleep.id)}"]`, svg);
      if (g) g.setAttribute('transform', `translate(${afger(x)} ${afger(y)})`);
    } else if (sleep.soort === 'verbind') {
      const a = huidigPlan().plaatsingen[sleep.id];
      const p = vlak.naarTekening(e.clientX, e.clientY);
      $('#woning-svg .voorbeeld-laag').innerHTML = a ? `<path class="verbinding" d="M${a.x} ${a.y}L${afger(p.x)} ${afger(p.y)}"/>` : '';
    }
  });

  svg.addEventListener('pointerup', (e) => {
    const s = sleep;
    sleep = null;
    $('#woning-svg .voorbeeld-laag').innerHTML = '';
    if (!s) return;
    if (s.soort === 'zet' && s.bewogen && s.nu) {
      const x = huidigPlan().plaatsingen[s.id];
      const deel = x?.los ? x.item : kringVanItem(staat.project, s.id)?.items.find((i) => i.id === s.id);
      const plek = bepaalPlaats(s.nu, deel || 'bord', e.altKey, x?.rot || 0);
      wijzig((p) => { Object.assign(huidigPlan(p).plaatsingen[s.id], plek); });
    } else if (s.soort === 'verbind') {
      const doel = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-plaats]')?.dataset.plaats;
      verbindVan = null;
      if (doel && doel !== s.id) maakVerbinding(s.id, doel);
      else teken();
    }
  });
  svg.addEventListener('pointerleave', () => { if (!sleep) $('#woning-svg .voorbeeld-laag').innerHTML = ''; });
  svg.addEventListener('pointercancel', () => { sleep = null; verbindVan = null; teken(); });

  svg.addEventListener('contextmenu', (e) => {
    if (stap !== 'componenten') return;
    e.preventDefault();
    if (gewapend && !gewapend.tekst) {
      gewapendRot = (gewapendRot + draaiStap({ soort: gewapend.soort }, e.altKey)) % 360;
      toonSpook(e);
    } else {
      const g = symboolOp(e);
      if (g) {
        gekozenId = g.dataset.plaats;
        if (e.shiftKey) wisselPlaats('tekstPlaats', volgendeTekstPlaats);
        else if (e.ctrlKey) wisselPlaats('adresPlaats', volgendeAdresPlaats);
        else draaiGekozen(e.altKey);
      }
    }
  });

  svg.addEventListener('click', (e) => {
    if (vlak.gesleept || (e.detail > 1 && false)) return;
    const punt = vlak.naarTekening(e.clientX, e.clientY);
    const verb = e.target.closest('[data-verb]')?.dataset.verb;
    if (stap === 'verbindingen' && verb) {
      const nu = Date.now();
      if (laatsteTik.id === verb && nu - laatsteTik.tijd < 700) {
        wijzig((p) => { for (const pl of p.plannen) pl.verbindingen = (pl.verbindingen || []).filter((v) => v.id !== verb); });
        laatsteTik = { id: null, tijd: 0 };
      } else laatsteTik = { id: verb, tijd: nu };
      return;
    }
    const g = symboolOp(e);
    if (stap === 'componenten') {
      if (gewapend) plaatsGewapend(punt, e.altKey);
      else if (!g) { gekozenId = null; teken(); }
    } else if (stap === 'kringen' && g) {
      hangAanKring(g.dataset.plaats);
    }
  });
}

/** Het gekozen symbool hangt aan de muis tot je klikt: een doorschijnend voorbeeld op de plaats waar het zou komen. */
function toonSpook(e) {
  const laag = $('#woning-svg .voorbeeld-laag');
  if (stap !== 'componenten' || !gewapend || gewapend.tekst) { laag.innerHTML = ''; return; }
  const item = nieuwItem(gewapend.soort, gewapend.waarden);
  const plek = bepaalPlaats(vlak.naarTekening(e.clientX, e.clientY), item, e.altKey, gewapendRot);
  const plan = huidigPlan();
  laag.innerHTML = `<g opacity=".55" pointer-events="none">${plaatsingSvg({ item, code: '' }, { ...plek, los: true }, plan.symbool || 1, false, '', { plan: { ...plan, beletteren: false, nummeren: false }, stijl: 'woning' })}</g>`;
}

function maakVerbinding(van, naar) {
  const plan = huidigPlan();
  const bestaat = (plan.verbindingen || []).find((v) => v.van === van && v.naar === naar);
  wijzig((p) => {
    const pl = huidigPlan(p);
    pl.verbindingen = (pl.verbindingen || []).filter((v) => !(v.van === van && v.naar === naar));
    if (!bestaat) pl.verbindingen.push({ id: nieuwId(), van, naar });
  });
}

function hangAanKring(id) {
  if (!gekozenKring || !zoek(staat.project, gekozenKring)) {
    melding('Kies onderaan eerst een kring (zekering).');
    return;
  }
  const p = staat.project;
  const kring = zoek(p, gekozenKring).ding;
  if (kring.soort !== 'kring') {
    melding('Kies een kring, geen differentieel.');
    return;
  }
  const zit = kring.items.some((i) => i.id === id);
  wijzig((pr) => {
    if (zit) maakLos(pr, id);
    else wijsToeEen(pr, id, gekozenKring, { volgorde: huidigPlan(pr).verbindingVolgorde !== false });
  });
}

// ---------- Onderkant: de stappen ----------

function tekenComponenten() {
  const cats = palet();
  if (!cats.some((c) => c.id === categorie)) categorie = cats[1].id;
  const cat = cats.find((c) => c.id === categorie);
  const items = cat.items;
  const sleutel = (it) => (it.tekst ? 'tekst' : `${it.soort}:${JSON.stringify(it.waarden)}`);
  return `<div class="w-pal">
    <div class="w-cats">${cats.map((c) => `<button class="${c.id === categorie ? 'aan' : ''}" data-cat="${c.id}">${esc(c.naam)}</button>`).join('')}</div>
    <div class="w-items">${items.length ? items.map((it, i) => `<button class="w-item${gewapend && sleutel(gewapend) === sleutel(it) ? ' aan' : ''}" data-i="${i}" title="${esc(it.naam)}">${it.tekst ? '<b>Aa</b>' : icoon(nieuwItem(it.soort, it.waarden), 30)}</button>`).join('') : '<p class="w-leeg">Nog geen favorieten. Sla ze op in de gewone versie.</p>'}</div>
  </div>`;
}

function tekenVerbindingen() {
  const plan = huidigPlan();
  return `<div class="w-uitleg"><h3>Verbindingen</h3>
    <p>Maak verbindingen tussen schakelaars en verlichtingselementen om aan te duiden welke schakelaar welke verlichting bedient. Je maakt een verbinding door een lijn te trekken vanuit de schakelaar naar een verlichtingselement. Je verwijdert een verbinding door twee keer op de verbinding te klikken.</p>
    <label class="w-schakel"><span>Gebruik de volgorde van de verbindingen</span><input type="checkbox" id="w-volgorde" ${plan.verbindingVolgorde !== false ? 'checked' : ''}></label></div>`;
}

function tekenKringenBalk() {
  const p = staat.project;
  const kasten = kastNamen(p);
  if (!kast || !kasten.includes(kast)) kast = kasten[0];
  const code = codes(p);
  const groepen = p.kinderen.filter((g) => g.soort === 'differentieel' && kastVan(g, p) === kast);
  const kaart = (k, diff) => {
    const aantal = diff ? '' : `<small>${k.items.length} symbool${k.items.length === 1 ? '' : 'en'}</small>`;
    return `<button class="w-kaart${diff ? ' diff' : ''}${gekozenKring === k.id ? ' aan' : ''}" data-kring="${k.id}"><b>${esc(code.get(k.id))} - ${esc(k.naam || (diff ? 'Diff' : 'Kring'))}</b><span class="${niveauKlasse(k.id)}">${k.stroom ?? k.automaat?.stroom}A / ${diff ? `${k.polen}P` : `${k.automaat.polen}P`}</span>${aantal}</button>`;
  };
  const kaarten = groepen.flatMap((g) => [kaart(g, true), ...g.kinderen.filter((k) => k.soort === 'kring').map((k) => kaart(k, false))]);
  const los = [...Object.values(huidigPlan().plaatsingen)].filter((x) => x.los).length;
  return `<div class="w-kast">${kasten.map((n) => `<button class="${n === kast ? 'aan' : ''}" data-kast="${esc(n)}">${esc(n)}</button>`).join('')}<span class="w-teller">${los ? `${los} symbo${los === 1 ? 'ol' : 'len'} zonder kring` : 'alle symbolen hebben een kring'}</span></div>
    <div class="w-kaarten">${kaarten.join('') || '<p class="w-leeg">Maak eerst kringen aan bij “verdeelbord”.</p>'}</div>`;
}

let waarschuwingen = new Map();
function berekenWaarschuwingen() {
  waarschuwingen = new Map();
  for (const m of controleer(staat.project)) {
    if (m.niveau === 'info') continue;
    const oud = waarschuwingen.get(m.id);
    if (!oud || (oud.niveau !== 'fout' && m.niveau === 'fout')) waarschuwingen.set(m.id, { niveau: m.niveau, tekst: m.tekst });
  }
}
const niveauKlasse = (id) => (waarschuwingen.get(id)?.niveau === 'fout' ? 'rood' : waarschuwingen.get(id) ? 'oranje' : 'groen');

function kastVan(groep, p = staat.project) {
  const kasten = kastNamen(p);
  return kasten.includes(groep.kast) ? groep.kast : kasten[0];
}

// ---------- Het verdeelbord ----------

function tekenVerdeel() {
  const p = staat.project;
  const code = codes(p);
  berekenWaarschuwingen();
  const kasten = kastNamen(p);
  const kaart = (k, diep, diff) => {
    const w = waarschuwingen.get(k.id);
    const sub = diff ? `${k.stroom}A / ${k.gevoeligheid}mA` : `${k.automaat.stroom}A / ${k.automaat.polen}P`;
    return `<div class="w-rij${diep ? ' diep' : ''}">
      <div class="w-kaartje${diff ? ' diff' : ''}" draggable="true" data-sleep="${k.id}" data-open="${k.id}" title="${esc(w?.tekst || '')}">
        <div><div class="w-titel">${esc(code.get(k.id))} - ${esc(k.naam || (diff ? 'Diff' : 'Kring'))}</div><div class="w-sub ${niveauKlasse(k.id)}">${sub}</div></div>
        <span class="w-knoppen"><button data-op="${k.id}" title="Omhoog">▲</button><button data-neer="${k.id}" title="Omlaag">▼</button><span class="w-greep" title="Sleep om te verplaatsen">✥</span></span>
      </div></div>`;
  };
  const kolom = (naam, i) => {
    const groepen = p.kinderen.filter((g) => g.soort === 'differentieel' && kastVan(g, p) === naam);
    const inhoud = groepen.map((g) => `${kaart(g, false, true)}${g.kinderen.filter((k) => k.soort === 'kring').map((k) => kaart(k, true, false)).join('')}<button class="w-pil klein" data-nieuwkring="${g.id}">+ kring</button>`).join('');
    return `<div class="w-kolom" data-kolom="${esc(naam)}"><div class="w-pil kop" data-kastnaam="${esc(naam)}">${esc(naam)}${i > 0 ? `<button class="w-x" data-kastwis="${esc(naam)}" title="Kast verwijderen">✕</button>` : ''}</div>${inhoud}
      <button class="w-pil" data-nieuwdiff="${esc(naam)}">+ differentieel</button></div>`;
  };
  return `<div class="w-kolommen">${kasten.map(kolom).join('')}<div class="w-kolom"><button class="w-pil groot" id="w-nieuwekast">Voeg kastmodule toe</button></div></div>`;
}

async function bewerkKnoop(id) {
  const p = staat.project;
  const k = zoek(p, id)?.ding;
  if (!k) return;
  const diff = k.soort === 'differentieel';
  const velden = diff
    ? [
      { naam: 'naam', label: 'Naam', waarde: k.naam || '' },
      { naam: 'stroom', label: 'Stroom (A)', type: 'select', waarde: k.stroom, opties: [25, 32, 40, 63, 80, 100].map((n) => [n, `${n} A`]) },
      { naam: 'polen', label: 'Polen', type: 'select', waarde: k.polen, opties: [[2, '2P'], [4, '4P']] },
      { naam: 'gevoeligheid', label: 'Gevoeligheid', type: 'select', waarde: k.gevoeligheid, opties: [[30, '30 mA'], [100, '100 mA'], [300, '300 mA']] },
    ]
    : [
      { naam: 'naam', label: 'Naam', waarde: k.naam || '' },
      { naam: 'stroom', label: 'Stroom (A)', type: 'select', waarde: k.automaat.stroom, opties: AUTOMAAT_STROMEN.map((n) => [n, `${n} A`]) },
      { naam: 'polen', label: 'Polen', type: 'select', waarde: k.automaat.polen, opties: [[1, '1P'], [2, '2P'], [3, '3P'], [4, '4P']] },
      { naam: 'curve', label: 'Curve', type: 'select', waarde: k.automaat.curve, opties: CURVES.map((c) => [c, c]) },
      { naam: 'sectie', label: 'Kabel', type: 'select', waarde: k.kabel.sectie, opties: SECTIES.map((n) => [n, `3G${komma(n)}`]) },
    ];
  const { knop, waarden } = await vraag({
    titel: `${codes(p).get(id)} – ${diff ? 'differentieel' : 'kring'}`,
    velden,
    knoppen: [{ tekst: 'OK', waarde: 'ok', hoofd: true }, { tekst: 'Verwijderen', waarde: 'wis', gevaar: true }, { tekst: 'Annuleren', waarde: null }],
  });
  if (knop === 'wis') {
    if (!(await bevestig(`“${k.naam || 'Deze kring'}” verwijderen?`, 'De symbolen blijven op het plan staan, zonder kring.', 'Verwijderen', true))) return;
    wijzig((pr) => {
      const plek = zoek(pr, id);
      if (!plek) return;
      const kringen = diff ? plek.ding.kinderen.filter((x) => x.soort === 'kring') : [plek.ding];
      kringen.forEach((kr) => maakKringLeeg(pr, kr));
      plek.lijst.splice(plek.index, 1);
    });
    if (gekozenKring === id) gekozenKring = null;
    return;
  }
  if (knop !== 'ok') return;
  wijzig((pr) => {
    const d = zoek(pr, id).ding;
    d.naam = waarden.naam.trim();
    if (diff) Object.assign(d, { stroom: Number(waarden.stroom), polen: Number(waarden.polen), gevoeligheid: Number(waarden.gevoeligheid) });
    else {
      Object.assign(d.automaat, { stroom: Number(waarden.stroom), polen: Number(waarden.polen), curve: waarden.curve });
      d.kabel.sectie = Number(waarden.sectie);
    }
  });
}

function verplaatsKnoop(id, doelId, voor = true) {
  wijzig((p) => {
    const plek = zoek(p, id);
    const doel = zoek(p, doelId);
    if (!plek || !doel || id === doelId) return;
    if (plek.ding.soort === 'differentieel' && doel.ding.soort === 'kring') return;
    // Een differentieel mag niet in zichzelf.
    if (plek.ding.soort === 'differentieel' && doel.ouder && doel.ouder.id === id) return;
    plek.lijst.splice(plek.index, 1);
    const nieuw = zoek(p, doelId);
    if (plek.ding.soort === 'kring' && nieuw.ding.soort === 'differentieel') {
      nieuw.ding.kinderen.push(plek.ding);
    } else {
      if (plek.ding.soort === 'differentieel') plek.ding.kast = nieuw.ding.soort === 'differentieel' ? kastVan(nieuw.ding, p) : plek.ding.kast;
      nieuw.lijst.splice(nieuw.index + (voor ? 0 : 1), 0, plek.ding);
    }
  });
}

function schuifKnoop(id, richting) {
  wijzig((p) => {
    const plek = zoek(p, id);
    if (!plek) return;
    const lijst = plek.lijst;
    const j = plek.index + richting;
    if (j < 0 || j >= lijst.length) return;
    [lijst[plek.index], lijst[j]] = [lijst[j], lijst[plek.index]];
  });
}

async function nieuweKastModule() {
  const naam = await vraagTekst('Nieuwe kastmodule', '', 'Naam (bv. Garage of Keuken)');
  if (!naam?.trim()) return;
  wijzig((p) => { p.kasten = [...kastNamen(p), naam.trim()]; });
}

function koppelVerdeel() {
  const wortel = $('#w-verdeel');
  wortel.addEventListener('click', async (e) => {
    const t = e.target;
    const op = t.closest('[data-op]')?.dataset.op;
    const neer = t.closest('[data-neer]')?.dataset.neer;
    if (op) { schuifKnoop(op, -1); return; }
    if (neer) { schuifKnoop(neer, 1); return; }
    const nd = t.closest('[data-nieuwdiff]')?.dataset.nieuwdiff;
    if (nd) {
      wijzig((p) => { p.kinderen.push(nieuwDifferentieel({ naam: 'Diff 30 mA', kast: nd, gevoeligheid: 30, stroom: 40, polen: 2 })); });
      return;
    }
    const nk = t.closest('[data-nieuwkring]')?.dataset.nieuwkring;
    if (nk) {
      wijzig((p) => { zoek(p, nk).ding.kinderen.push(nieuweKring({ naam: 'Kring', automaat: { stroom: 16, polen: 2, curve: 'C', onderbreking: 3000 }, kabel: { type: 'XVB', aders: 3, sectie: 1.5, plaatsing: 'inWand' } })); });
      return;
    }
    if (t.closest('#w-nieuwekast')) { nieuweKastModule(); return; }
    const kw = t.closest('[data-kastwis]')?.dataset.kastwis;
    if (kw) {
      if (!(await bevestig(`De kastmodule “${kw}” verwijderen?`, 'Haar groepen gaan naar het hoofdbord.', 'Verwijderen', true))) return;
      wijzig((p) => { p.kasten = kastNamen(p).filter((n) => n !== kw); p.kinderen.forEach((g) => { if (g.kast === kw) g.kast = undefined; }); });
      return;
    }
    const kn = t.closest('[data-kastnaam]')?.dataset.kastnaam;
    if (kn) {
      const nieuw = await vraagTekst('Naam van de kastmodule', kn, 'Naam');
      if (!nieuw?.trim() || nieuw.trim() === kn) return;
      wijzig((p) => { p.kasten = kastNamen(p).map((n) => (n === kn ? nieuw.trim() : n)); p.kinderen.forEach((g) => { if (g.kast === kn) g.kast = nieuw.trim(); }); });
      return;
    }
    const open = t.closest('[data-open]')?.dataset.open;
    if (open) bewerkKnoop(open);
  });
  let sleepId = null;
  wortel.addEventListener('dragstart', (e) => {
    sleepId = e.target.closest?.('[data-sleep]')?.dataset.sleep || null;
    if (sleepId) e.dataTransfer.effectAllowed = 'move';
  });
  wortel.addEventListener('dragover', (e) => {
    if (sleepId && (e.target.closest('[data-sleep]') || e.target.closest('[data-kolom]'))) e.preventDefault();
  });
  wortel.addEventListener('drop', (e) => {
    if (!sleepId) return;
    e.preventDefault();
    const doelKaart = e.target.closest('[data-sleep]');
    if (doelKaart) {
      const r = doelKaart.getBoundingClientRect();
      verplaatsKnoop(sleepId, doelKaart.dataset.sleep, e.clientY < r.top + r.height / 2);
    } else {
      // Op een lege plek van een kolom: een differentieel verhuist naar die kast.
      const kol = e.target.closest('[data-kolom]')?.dataset.kolom;
      const d = zoek(staat.project, sleepId)?.ding;
      if (kol && d?.soort === 'differentieel') wijzig((p) => { const g = zoek(p, sleepId); g.ding.kast = kol; g.lijst.splice(g.index, 1); p.kinderen.push(g.ding); });
    }
    sleepId = null;
  });
}

// ---------- Alles samen ----------

function tekenBalk() {
  $('#w-stappen').innerHTML = STAPPEN.map(([id, naam, ic]) => `<button class="${id === stap ? 'aan' : ''}" data-stap="${id}"><span class="w-ic w-ic-${id}">${ic}</span>${naam}</button>`).join('');
  const p = staat.project;
  $('#w-plannen').innerHTML = p.plannen.length > 1 ? p.plannen.map((pl) => `<button class="${pl.id === huidigPlan().id ? 'aan' : ''}" data-plan="${esc(pl.id)}">${esc(pl.naam)}</button>`).join('') : '';
  $('#w-plannen').hidden = p.plannen.length < 2 || stap === 'verdeelbord';
  $('#w-oog').classList.toggle('uit', !toonLabels);
}

export function teken() {
  if (staat.tab !== 'woning' || !vlak) return;
  tekenBalk();
  const verdeel = stap === 'verdeelbord';
  $('#w-plan').hidden = verdeel;
  $('#w-verdeel').hidden = !verdeel;
  $('#w-acties').hidden = !(stap === 'componenten' && gekozenId && huidigPlan().plaatsingen[gekozenId]);
  const paneel = $('#w-paneel');
  paneel.hidden = verdeel;
  if (verdeel) {
    $('#w-verdeel').innerHTML = tekenVerdeel();
    return;
  }
  berekenWaarschuwingen();
  tekenPlanLaag();
  const leeg = !huidigPlan().muren.length && !Object.keys(huidigPlan().plaatsingen).length;
  $('#w-hint').hidden = !leeg;
  paneel.innerHTML = stap === 'componenten' ? tekenComponenten() : stap === 'verbindingen' ? tekenVerbindingen() : tekenKringenBalk();
  paneel.className = `w-paneel w-paneel-${stap}`;
  if (!vlak.ingesteld) {
    const plan = huidigPlan();
    vlak.passend(plan.breedte, plan.hoogte, { max: 1.2 });
    const m = muurRand(plan);
    if (m) zoomNaar(m);
  }
}

/** De ruimte die de muren en symbolen innemen, zodat het huis groot in beeld komt. */
function muurRand(plan) {
  const punten = [...plan.muren.flatMap((m) => [[m.x1, m.y1], [m.x2, m.y2]]), ...Object.values(plan.plaatsingen).map((x) => [x.x, x.y])].filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (!punten.length) return null;
  const xs = punten.map((q) => q[0]);
  const ys = punten.map((q) => q[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function zoomNaar({ x0, y0, x1, y1 }) {
  const r = vlak.svg.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const b = Math.max(40, x1 - x0);
  const h = Math.max(40, y1 - y0);
  vlak.s = Math.min(3, (r.width - 60) / b, (r.height - 60) / h);
  vlak.x = (r.width - b * vlak.s) / 2 - x0 * vlak.s;
  vlak.y = (r.height - h * vlak.s) / 2 - y0 * vlak.s;
  vlak.ingesteld = true;
  vlak.pas();
}

function zetStap(s) {
  stap = s;
  gewapend = s === 'componenten' ? gewapend : null;
  verbindVan = null;
  teken();
}

function koppelBalk() {
  $('#w-stappen').addEventListener('click', (e) => {
    const b = e.target.closest('[data-stap]');
    if (b) zetStap(b.dataset.stap);
  });
  $('#w-plannen').addEventListener('click', (e) => {
    const b = e.target.closest('[data-plan]');
    if (!b) return;
    staat.planId = b.dataset.plan;
    vlak.ingesteld = false;
    gekozenId = null;
    teken();
  });
  $('#w-oog').addEventListener('click', () => { toonLabels = !toonLabels; teken(); });
  $('#w-home').addEventListener('click', () => acties.tab?.('document'));
  $('#w-potlood').addEventListener('click', () => acties.tab?.('situatie'));
  $('#w-delen').addEventListener('click', () => { $('#w-menu').hidden = !$('#w-menu').hidden; });
  $('#w-menu').addEventListener('click', (e) => {
    const b = e.target.closest('[data-naar]');
    if (!b) return;
    $('#w-menu').hidden = true;
    acties.tab?.(b.dataset.naar);
  });
  $('#w-draai').addEventListener('click', () => draaiGekozen());
  $('#w-kopie').addEventListener('click', kopieerGekozen);
  $('#w-wis').addEventListener('click', wisGekozen);
  $('#w-passend').addEventListener('click', () => { vlak.ingesteld = false; teken(); });
  $('#w-zoom-in').addEventListener('click', () => vlak.zoom(1.25));
  $('#w-zoom-uit').addEventListener('click', () => vlak.zoom(0.8));

  const paneel = $('#w-paneel');
  paneel.addEventListener('click', (e) => {
    const cat = e.target.closest('[data-cat]')?.dataset.cat;
    if (cat) { categorie = cat; teken(); return; }
    const it = e.target.closest('.w-item');
    if (it) {
      const gekozen = palet().find((c) => c.id === categorie).items[Number(it.dataset.i)];
      gewapend = gewapend && gewapend.naam === gekozen.naam && JSON.stringify(gewapend.waarden) === JSON.stringify(gekozen.waarden) ? null : gekozen;
      gekozenId = null;
      gewapendRot = 0;
      teken();
      return;
    }
    const k = e.target.closest('[data-kast]')?.dataset.kast;
    if (k) { kast = k; teken(); return; }
    const kr = e.target.closest('[data-kring]')?.dataset.kring;
    if (kr) {
      const ding = zoek(staat.project, kr)?.ding;
      if (ding?.soort === 'kring') gekozenKring = gekozenKring === kr ? null : kr;
      teken();
    }
  });
  paneel.addEventListener('change', (e) => {
    if (e.target.id === 'w-volgorde') wijzig((p) => { huidigPlan(p).verbindingVolgorde = e.target.checked; });
  });
  window.addEventListener('keydown', (e) => {
    if (staat.tab !== 'woning' || e.target.closest('input, textarea, select')) return;
    if (e.key === 'Escape') { gewapend = null; gekozenId = null; verbindVan = null; teken(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && stap === 'componenten') wisGekozen();
    if (e.key.toLowerCase() === 'r' && stap === 'componenten') draaiGekozen();
  });
}

export function startWoning({ acties: a }) {
  acties = a;
  $('#tab-woning').innerHTML = `
    <div class="w-balk">
      <button class="w-rond" id="w-home" title="Document: klant en gegevens">⌂</button>
      <button class="w-rond" id="w-potlood" title="Het huis tekenen: muren, deuren, ramen">▢</button>
      <nav id="w-stappen" class="w-stappen"></nav>
      <button class="w-rond" id="w-oog" title="Kringletters tonen of verbergen">◉</button>
      <button class="w-rond" id="w-delen" title="Verder naar het ééndraadschema, de materiaallijst of afdrukken">➦</button>
      <div id="w-menu" class="w-menu" hidden>
        <button data-naar="eendraad">Ééndraadschema bekijken</button><button data-naar="materiaal">Materiaallijst</button><button data-naar="afdrukken">Afdrukken</button><button data-naar="controle">Controle</button>
      </div>
    </div>
    <div id="w-plannen" class="w-plannen" hidden></div>
    <div class="w-hoofd">
      <div id="w-plan" class="w-plan">
        <svg id="woning-svg" class="tekening"><g class="inhoud"><g class="plan-laag"></g><g class="voorbeeld-laag"></g></g></svg>
        <div id="w-acties" class="w-acties" hidden><button id="w-draai" title="Draaien (R)">↻</button><button id="w-kopie" title="Kopiëren">⧉</button><button id="w-wis" title="Wissen (Delete)">🗑</button></div>
        <div id="w-hint" class="w-hint" hidden>Teken eerst de muren van het huis met de knop <b>▢</b> linksboven, of open een grondplan. Kom daarna terug om de symbolen te plaatsen.</div>
        <div class="w-zoom"><button id="w-zoom-uit">−</button><button id="w-passend">⤢</button><button id="w-zoom-in">+</button></div>
      </div>
      <div id="w-verdeel" class="w-verdeel" hidden></div>
    </div>
    <div id="w-paneel" class="w-paneel"></div>`;
  koppelPlan();
  koppelBalk();
  koppelVerdeel();
  opWijziging(() => teken());
  window.addEventListener('woning-open', () => { vlak.ingesteld = false; setTimeout(teken, 0); });
}
