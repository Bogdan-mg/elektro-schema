// Het project: het bord met differentiëlen, kringen en onderdelen, plus de plannen van het situatieschema.
import { TOESTELLEN, NETTEN, SOORTEN } from './catalogus.js';

export const VERSIE = 1;
export const EXTENSIE = 'eschema';

export const nieuwId = () => Math.random().toString(36).slice(2, 10);
const vandaag = () => new Date().toISOString().slice(0, 10);

export function nieuwPlan(naam = 'Gelijkvloers') {
  return {
    id: nieuwId(),
    naam,
    achtergrond: null, // id in project.afbeeldingen
    zichtbaarheid: 0.6, // hoe sterk de achtergrond te zien is
    breedte: 1600,
    hoogte: 1000,
    symbool: 1.5, // grootte van de symbolen op dit plan
    schaal: 100, // tekeneenheden per meter; null = nog niet ingesteld
    kleefMuur: true, // symbolen tegen de dichtstbijzijnde muur zetten
    alleMaten: false, // alle lengtes tonen; anders enkel tijdens het tekenen of van het gekozen lijnstuk
    muren: [], // lijnstukken: { soort: 'muur' | 'deur' | 'raam' | 'meet', x1, y1, x2, y2 }
    teksten: [],
    plaatsingen: {}, // item-id (of 'bord') -> { x, y, rot }
  };
}

export function nieuwProject() {
  return {
    versie: VERSIE,
    info: { titel: 'Nieuw project', klant: '', adres: '', installateur: '', datum: vandaag(), opmerking: '' },
    aansluiting: { net: '1F230', hoofdzekering: 40, aardingsweerstand: 0, kabelNet: '', kabelBord: '' },
    hoofd: { beveiliging: 'differentieel', gevoeligheid: 300, type: 'A', stroom: 40, polen: 2, curve: 'C', onderbreking: 0, teller: true },
    kinderen: [],
    plannen: [nieuwPlan()],
    afbeeldingen: {},
    materiaal: { marge: 10 },
  };
}

/**
 * Een groep op een verdeellijn, met zijn beveiliging: differentieel, automaat (bv. generaal zekering),
 * differentieelautomaat, of geen (een "rij"). Zoals in Trikker krijgt ook een groep een letter en een naam.
 */
export function nieuwDifferentieel(waarden = {}) {
  return {
    id: nieuwId(), soort: 'differentieel', beveiliging: 'differentieel', naam: '', letter: '',
    gevoeligheid: 30, type: 'A', stroom: 40, polen: 2, curve: 'C', onderbreking: 3000, opmerking: '', kinderen: [], ...waarden,
  };
}

export function nieuweKring(waarden = {}) {
  const { automaat, kabel, ...rest } = waarden;
  return {
    id: nieuwId(),
    soort: 'kring',
    naam: '',
    letter: '', // vaste kringletter; leeg = automatisch (A, B, C, …)
    automaat: { stroom: 20, curve: 'C', polen: 2, onderbreking: 3000, gevoeligheid: 0, type: 'A', ...automaat },
    kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 0, plaatsing: 'inWand', ...kabel },
    badkamer: false,
    opmerking: '', // eigen opmerking, komt op de bladzijde "Opmerkingen"
    items: [],
    ...rest,
  };
}

export function nieuwItem(soort, waarden = {}) {
  const def = SOORTEN[soort];
  const basis = { id: nieuwId(), soort, tekst: '', adres: '', aantal: 1, ...structuredClone(def?.standaard || {}) };
  if (soort === 'toestel') {
    const variant = waarden.variant || 'ander';
    const t = TOESTELLEN[variant] || TOESTELLEN.ander;
    return { ...basis, variant, aansluiting: t.aansluiting, vermogen: t.vermogen, ...waarden };
  }
  return { ...basis, ...waarden };
}

/** Onderdelen uit oudere versies omzetten naar de soorten en eigenschappen van nu. */
function zetOm(item) {
  const it = { ...item };
  if (it.soort === 'lichtpunt') {
    if (it.variant === 'wand') Object.assign(it, { variant: 'plafond', wand: true });
    if (it.variant === 'buiten') Object.assign(it, { variant: 'plafond', waterdicht: true });
    if (it.variant === 'nood') Object.assign(it, { variant: 'plafond', nood: 'decentraal' });
  }
  if (it.soort === 'schakelaar') {
    if (it.variant === 'dimmer') Object.assign(it, { variant: 'enkelpolig', dimmer: true });
    if (it.variant === 'rolluik') Object.assign(it, { variant: 'enkelpolig', rolluik: true });
    if (it.variant === 'drukknop') { it.soort = 'drukknop'; delete it.variant; }
    if (it.variant === 'bewegingsmelder') { it.soort = 'bewegingsdetector'; it.variant = 'basis'; it.infrarood = true; }
  }
  return it;
}

// ---------- Zoeken in de boom ----------

/** Alle differentiëlen en kringen, in tekenvolgorde, met hun ouders. */
export function alleKnopen(project) {
  const lijst = [];
  const loop = (kinderen, ouders) => {
    for (const k of kinderen) {
      lijst.push({ knoop: k, ouders });
      if (k.soort === 'differentieel') loop(k.kinderen, [...ouders, k]);
    }
  };
  loop(project.kinderen, []);
  return lijst;
}

export const alleKringen = (project) => alleKnopen(project).filter((k) => k.knoop.soort === 'kring');

export function alleItems(project) {
  return alleKringen(project).flatMap(({ knoop, ouders }) => knoop.items.map((item) => ({ item, kring: knoop, ouders })));
}

/** Waar staat dit id: de lijst waarin het staat, de plaats daarin en het ding zelf. */
export function zoek(project, id) {
  const loop = (kinderen, ouder) => {
    for (let i = 0; i < kinderen.length; i++) {
      const k = kinderen[i];
      if (k.id === id) return { ding: k, lijst: kinderen, index: i, ouder };
      if (k.soort === 'differentieel') {
        const r = loop(k.kinderen, k);
        if (r) return r;
      } else if (k.soort === 'kring') {
        const j = k.items.findIndex((it) => it.id === id);
        if (j >= 0) return { ding: k.items[j], lijst: k.items, index: j, ouder: k };
      }
    }
    return null;
  };
  return loop(project.kinderen, null);
}

/** A, B, … Z, AA, AB, … */
export function letter(i) {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** De codes zoals op het schema: kringen krijgen een letter, onderdelen letter + nummer (A1, A2, …). */
export function codes(project) {
  const map = new Map();
  // Zoals in Trikker krijgt elke kring en elke groep een letter, in tekenvolgorde.
  // Een vaste letter (zoals "XYZ") telt niet mee voor de automatische letters.
  let i = 0;
  for (const { knoop } of alleKnopen(project)) {
    const l = knoop.letter?.trim() || letter(i++);
    map.set(knoop.id, l);
    if (knoop.soort === 'kring') rijen(knoop).forEach((rij, j) => rij.forEach((item) => map.set(item.id, `${l}${j + 1}`)));
  }
  return map;
}

/** Soorten die een schakelaar mee op zijn rij neemt (de lampen die hij bedient). */
const OP_RIJ = new Set(['lichtpunt']);
const BEDIENING = new Set(['schakelaar', 'drukknop']);

/**
 * De onderdelen van een kring per rij, zoals in Trikker: een schakelaar staat samen met de lampen erna op één rij
 * en heeft één nummer. Met "eigenRij" begint een lamp toch een nieuwe rij.
 */
export function rijen(kring) {
  const uit = [];
  for (const item of kring.items) {
    const rij = uit.at(-1);
    if (rij && OP_RIJ.has(item.soort) && !item.eigenRij && item.plaatsing !== 'eigenRij' && item.plaatsing !== 'evenwijdig' && BEDIENING.has(rij[0].soort)) rij.push(item);
    else uit.push([item]);
  }
  return uit;
}

// ---------- Wijzigen ----------

/** Voeg een differentieel of kring toe, na of in de huidige selectie. */
export function voegKnoopToe(project, selectieId, knoop) {
  const plek = selectieId && selectieId !== 'hoofd' ? zoek(project, selectieId) : null;
  if (!plek) {
    project.kinderen.push(knoop);
  } else if (plek.ding.soort === 'differentieel') {
    plek.ding.kinderen.push(knoop);
  } else if (plek.ding.soort === 'kring') {
    plek.lijst.splice(plek.index + 1, 0, knoop);
  } else {
    // Een onderdeel is gekozen: na zijn kring.
    const kring = zoek(project, plek.ouder.id);
    kring.lijst.splice(kring.index + 1, 0, knoop);
  }
  return knoop;
}

/** Voeg een onderdeel toe aan de gekozen kring, of na het gekozen onderdeel. */
export function voegItemToe(project, selectieId, item) {
  const plek = selectieId ? zoek(project, selectieId) : null;
  if (!plek) return null;
  if (plek.ding.soort === 'kring') plek.ding.items.push(item);
  else if (plek.ouder?.soort === 'kring') plek.lijst.splice(plek.index + 1, 0, item);
  else return null;
  return item;
}

/** Verwijder iets; ook van de plannen. Geeft het id terug dat daarna gekozen moet worden. */
export function verwijder(project, id) {
  const plek = zoek(project, id);
  if (!plek) return null;
  const weg = new Set([id]);
  const verzamel = (k) => {
    weg.add(k.id);
    if (k.soort === 'differentieel') k.kinderen.forEach(verzamel);
    if (k.soort === 'kring') k.items.forEach((it) => weg.add(it.id));
  };
  verzamel(plek.ding);
  plek.lijst.splice(plek.index, 1);
  for (const plan of project.plannen) for (const w of weg) delete plan.plaatsingen[w];
  const buur = plek.lijst[plek.index] || plek.lijst[plek.index - 1];
  return buur?.id || plek.ouder?.id || 'hoofd';
}

export function verschuif(project, id, richting) {
  const plek = zoek(project, id);
  if (!plek) return false;
  const doel = plek.index + richting;
  if (doel < 0 || doel >= plek.lijst.length) return false;
  [plek.lijst[plek.index], plek.lijst[doel]] = [plek.lijst[doel], plek.lijst[plek.index]];
  return true;
}

/** Kopie met nieuwe id's, net na het origineel. */
export function dupliceer(project, id) {
  const plek = zoek(project, id);
  if (!plek) return null;
  const kopie = structuredClone(plek.ding);
  const herid = (k) => {
    k.id = nieuwId();
    k.kinderen?.forEach(herid);
    k.items?.forEach(herid);
  };
  herid(kopie);
  plek.lijst.splice(plek.index + 1, 0, kopie);
  return kopie;
}

/**
 * Verplaats naar een andere plek: een kring of differentieel naar een differentieel ('hoofd' = het hoofdbord),
 * een onderdeel naar een andere kring.
 */
export function verplaatsNaar(project, id, doelId) {
  const plek = zoek(project, id);
  if (!plek || id === doelId) return false;
  const isItem = plek.ouder?.soort === 'kring' && plek.ding.soort !== 'kring' && plek.ding.soort !== 'differentieel';
  let doelLijst;
  if (isItem) {
    const doel = zoek(project, doelId);
    if (doel?.ding.soort !== 'kring') return false;
    doelLijst = doel.ding.items;
  } else if (doelId === 'hoofd') {
    doelLijst = project.kinderen;
  } else {
    const doel = zoek(project, doelId);
    if (doel?.ding.soort !== 'differentieel') return false;
    // Niet in zichzelf of in een eigen kind steken.
    if (plek.ding.soort === 'differentieel' && bevat(plek.ding, doelId)) return false;
    doelLijst = doel.ding.kinderen;
  }
  plek.lijst.splice(plek.index, 1);
  doelLijst.push(plek.ding);
  return true;
}

function bevat(diff, id) {
  return diff.kinderen.some((k) => k.id === id || (k.soort === 'differentieel' && bevat(k, id)));
}

/** Een geopend bestand nakijken en aanvullen, zodat oudere of onvolledige bestanden ook werken. */
export function leesProject(tekst) {
  let data;
  try {
    data = JSON.parse(tekst);
  } catch {
    throw new Error('Dit bestand is geen geldig Elektro Schema-project.');
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.kinderen)) {
    throw new Error('Dit bestand is geen geldig Elektro Schema-project.');
  }
  if (data.versie > VERSIE) throw new Error('Dit project is gemaakt met een nieuwere versie van Elektro Schema.');
  const basis = nieuwProject();
  const project = {
    ...basis,
    ...data,
    info: { ...basis.info, ...data.info },
    aansluiting: { ...basis.aansluiting, ...data.aansluiting },
    hoofd: { ...basis.hoofd, ...data.hoofd },
    materiaal: { ...basis.materiaal, ...data.materiaal },
    afbeeldingen: data.afbeeldingen || {},
    versie: VERSIE,
  };
  if (!NETTEN[project.aansluiting.net]) project.aansluiting.net = '1F230';
  project.plannen = (Array.isArray(data.plannen) && data.plannen.length ? data.plannen : [nieuwPlan()])
    .map(({ afmetingen: _oud, ...p }) => ({
      ...nieuwPlan(),
      ...p,
      // Een plan uit een oudere versie met een achtergrond heeft geen gekende schaal.
      schaal: p.schaal === undefined ? (p.achtergrond ? null : 100) : p.schaal,
      plaatsingen: p.plaatsingen || {},
      muren: (p.muren || []).map((m) => ({ soort: 'muur', ...m })),
      teksten: p.teksten || [],
    }));
  const vul = (k) => {
    if (k.soort === 'differentieel') {
      Object.assign(k, { ...nieuwDifferentieel(), onderbreking: 0, ...k, kinderen: k.kinderen || [] });
      k.kinderen.forEach(vul);
    } else if (k.soort === 'kring') {
      const n = nieuweKring();
      Object.assign(k, { ...n, ...k, automaat: { ...n.automaat, ...k.automaat }, kabel: { ...n.kabel, ...k.kabel }, items: k.items || [] });
      k.items = k.items.map(zetOm).map((it) => ({ ...nieuwItem(it.soort, it.variant ? { variant: it.variant } : {}), ...it }));
    }
  };
  project.kinderen.forEach(vul);
  return project;
}

/** Om op te slaan: enkel de afbeeldingen die nog gebruikt worden. */
export function teBewaren(project) {
  const gebruikt = new Set(project.plannen.map((p) => p.achtergrond).filter(Boolean));
  const afbeeldingen = Object.fromEntries(Object.entries(project.afbeeldingen).filter(([id]) => gebruikt.has(id)));
  return JSON.stringify({ ...project, afbeeldingen });
}

/** Een ingevuld voorbeeld van een woning, om het programma te leren kennen. */
export function voorbeeldProject() {
  const p = nieuwProject();
  p.info = { ...p.info, titel: 'Voorbeeld woning', klant: 'Familie Peeters', adres: 'Kerkstraat 1, 2000 Antwerpen', installateur: '' };
  p.aansluiting.aardingsweerstand = 18;
  const s = (waarden) => nieuwItem('stopcontact', waarden);
  const l = (variant, waarden) => nieuwItem('lichtpunt', { variant, ...waarden });
  const sch = (variant, waarden) => nieuwItem('schakelaar', { variant, ...waarden });
  const t = (variant, waarden) => nieuwItem('toestel', { variant, ...waarden });

  const dertig = nieuwDifferentieel({ gevoeligheid: 30, stroom: 40 });
  dertig.kinderen.push(
    nieuweKring({ naam: 'Badkamer', badkamer: true, kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 14 }, items: [
      sch('enkelpolig'), l('plafond'), l('plafond', { wand: true, tekst: 'spiegel' }), s({ aantal: 2 }), s(),
    ] }),
    nieuweKring({ naam: 'Wasmachine', kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 9 }, items: [t('wasmachine')] }),
    nieuweKring({ naam: 'Droogkast', kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 9 }, items: [t('droogkast')] }),
    nieuweKring({ naam: 'Vaatwasser', kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 7 }, items: [t('vaatwasser')] }),
  );
  p.kinderen.push(
    dertig,
    nieuweKring({ naam: 'Keuken', kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 18 }, items: [
      s({ aantal: 2 }), s({ aantal: 2 }), s(), t('koelkast'), t('dampkap'), t('microgolf'),
    ] }),
    nieuweKring({ naam: 'Kookplaat', automaat: { stroom: 32, curve: 'C', polen: 2 }, kabel: { type: 'XVB', aders: 3, sectie: 6, lengte: 8 }, items: [t('kookplaat')] }),
    nieuweKring({ naam: 'Oven', kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 8 }, items: [t('oven')] }),
    nieuweKring({ naam: 'Verlichting gelijkvloers', automaat: { stroom: 16, curve: 'C', polen: 2 }, kabel: { type: 'XVB', aders: 3, sectie: 1.5, lengte: 32 }, items: [
      sch('wissel'), sch('wissel'), l('plafond', { tekst: 'hal' }), sch('serie'), l('plafond', { tekst: 'living' }), l('spot', { aantal: 4, tekst: 'living' }),
      sch('enkelpolig'), l('plafond', { tekst: 'keuken' }), l('plafond', { waterdicht: true, tekst: 'voordeur' }),
    ] }),
    nieuweKring({ naam: 'Living', kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 22 }, items: [
      s({ aantal: 2 }), s(), s(), s({ aantal: 3, tekst: 'tv' }), s(),
    ] }),
  );
  return p;
}
