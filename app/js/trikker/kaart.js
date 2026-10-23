// Koppelt een onderdeel van deze app aan het symbool van Trikker (de nagebouwde klassen in deze map)
// en tekent het zoals Trikker het op het situatieschema doet (Grondplan).
import { Graphics, fontCursief, kwast, SF } from './g.js';
import * as Aansluitklem from './Aansluitklem.js';
import * as Aansluitpunt from './Aansluitpunt.js';
import * as Aarding from './Aarding.js';
import * as Aardingsstrip from './Aardingsstrip.js';
import * as Aftakkast from './Aftakkast.js';
import * as AutomatischeSchakelaar from './AutomatischeSchakelaar.js';
import * as Batterij from './Batterij.js';
import * as Beveiliging from './Beveiliging.js';
import * as Beveiligingscontact from './Beveiligingscontact.js';
import * as Bewegingsdetector from './Bewegingsdetector.js';
import * as BewegingsdetectorActief from './BewegingsdetectorActief.js';
import * as Boiler from './Boiler.js';
import * as Branddetector from './Branddetector.js';
import * as Camera from './Camera.js';
import * as Contactdoos from './Contactdoos.js';
import * as ContactdoosCommunicatie from './ContactdoosCommunicatie.js';
import * as Deurslot from './Deurslot.js';
import * as DomoticaModule from './DomoticaModule.js';
import * as Drukknop from './Drukknop.js';
import * as Geluidsbron from './Geluidsbron.js';
import * as Intercom from './Intercom.js';
import * as Ketel from './Ketel.js';
import * as Kiezer from './Kiezer.js';
import * as Lichtpunt from './Lichtpunt.js';
import * as Luidspreker from './Luidspreker.js';
import * as Microfoon from './Microfoon.js';
import * as Monitor from './Monitor.js';
import * as Motor from './Motor.js';
import * as Omvormer from './Omvormer.js';
import * as Overspanningsbeveiliging from './Overspanningsbeveiliging.js';
import * as Pomp from './Pomp.js';
import * as Relais from './Relais.js';
import * as Schakelaar from './Schakelaar.js';
import * as Slot from './Slot.js';
import * as Smeltveiligheid from './Smeltveiligheid.js';
import * as Teller from './Teller.js';
import * as Toestel from './Toestel.js';
import * as ToestelKlein from './ToestelKlein.js';
import * as Touchscreen from './Touchscreen.js';
import * as Transformator from './Transformator.js';
import * as Trillingsdetector from './Trillingsdetector.js';
import * as Ventiel from './Ventiel.js';
import * as Verdeelbord from './Verdeelbord.js';
import * as Verwarmingstoestel from './Verwarmingstoestel.js';
import * as Voorschakelapparaat from './Voorschakelapparaat.js';
import * as Zonnepaneel from './Zonnepaneel.js';
import * as Leiding from './Leiding.js';
import * as Nota from './Nota.js';
import * as StartNode from './StartNode.js';
import * as NullNode from './NullNode.js';

// In Trikker staan de teksten in een bronbestand; hier gewoon in het Nederlands.
Bewegingsdetector.TEKSTEN.radar = 'Radar';
Bewegingsdetector.TEKSTEN.ultrasoon = 'Ultrasoon';

export const KLASSEN = {
  Aansluitklem, Aansluitpunt, Aarding, Aardingsstrip, Aftakkast, AutomatischeSchakelaar, Batterij, Beveiliging, Beveiligingscontact,
  Bewegingsdetector, BewegingsdetectorActief, Boiler, Branddetector, Camera, Contactdoos, ContactdoosCommunicatie, Deurslot, DomoticaModule,
  Drukknop, Geluidsbron, Intercom, Ketel, Kiezer, Lichtpunt, Luidspreker, Microfoon, Monitor, Motor, Omvormer, Overspanningsbeveiliging, Pomp,
  Relais, Schakelaar, Slot, Smeltveiligheid, Teller, Toestel, ToestelKlein, Touchscreen, Transformator, Trillingsdetector, Ventiel, Verdeelbord,
  Verwarmingstoestel, Voorschakelapparaat, Zonnepaneel, Leiding, Nota, StartNode, NullNode,
};

/** Eén eenheid in Trikker (35 mm op de tekening) in tekeneenheden van deze app. */
export const SCHAAL = 3.5;

const jn = (b) => (b ? 'Ja' : 'Nee');
const aantal = (it) => Math.max(1, Number(it.aantal) || 1);
const POLEN = ['NietGespecifieerd', 'Enkelpolig', 'Dubbelpolig', 'Driepolig', 'Vierpolig'];

/** Per soort: de klasse van Trikker en de eigenschappen die uit het onderdeel volgen (in de volgorde waarin Trikker ze zet). */
const KAART = {
  stopcontact: (it) => ['Contactdoos', {
    Aantal: ['Een', 'Twee', 'Drie', 'Vier', 'Vijf', 'Zes'][Math.min(6, aantal(it)) - 1],
    Kinderbescherming: jn(it.kinderveilig), Beschermingsgeleider: jn(it.aarding), HalfWaterdicht: jn(it.waterdicht),
    IngebouwdeSchakelaar: { enkel: 'Enkelpolig', dubbel: 'Dubbelpolig' }[it.schakelaar] || 'NietGespecifieerd',
    IngebouwdeTransformator: jn(it.transformator), AantalFasen: { 1: 'Een', 2: 'Twee', 3: 'Drie' }[it.fasen] || 'NietGespecifieerd',
    Nulgeleider: jn(it.nul), Tekst: it.opschrift || '',
  }],
  communicatie: (it) => ['ContactdoosCommunicatie', { Tekst: it.opschrift || '' }],
  aansluitpunt: (it) => ['Aansluitpunt', { Tekst: it.opschrift || '', ToonOpGrondplan: 'Ja' }],
  aarding: (it) => ['Aarding', { Tekst: it.opschrift || '' }],
  aardingsstrip: () => ['Aardingsstrip', {}],
  aftakdoos: () => ['Aftakkast', {}],
  automaat: (it) => ['AutomatischeSchakelaar', {
    Type: { automaat: 'Automaat', contact: 'Contact', schemer: 'Schemerschakelaar', draai: 'Draaischakelaar', zekeringscheider: 'Zekeringscheider' }[it.variant] || 'Automaat',
    NormaalGesloten: jn(it.gesloten), NominaleStroomsterkte: Number(it.stroom) || 0, Selectief: jn(it.selectief), AantalPolen: POLEN[it.polen] || 'NietGespecifieerd',
    ...(it.curve ? { Uitschakelcurve: it.curve } : {}), StroomsterkteEenheid: it.eenheid || 'A', MaximumstroomBeveiliging: jn(it.maxstroom),
    VerliesStroomsterkte: Number(it.gevoeligheid) || 0, Kortsluitstroom: it.kortsluit ? `${it.kortsluit}kA` : '', Fase: it.fase || '',
  }],
  beveiliging: (it) => ['Beveiliging', { Type: it.variant === 'thermisch' ? 'Thermisch' : 'Elektromagnetisch' }],
  beveiligingscontact: (it) => ['Beveiligingscontact', {
    Type: { magneet: 'Magneetcontact', mechanisch: 'MechanischContact', schoot: 'Schootcontact', tril: 'Trilcontact', drukmat: 'Drukmat', afneem: 'Afneemcontact' }[it.variant] || 'Magneetcontact',
    Aantal: aantal(it),
  }],
  bewegingsdetector: (it) => ['Bewegingsdetector', {
    Type: { basis: 'Algemeen', gericht: 'Gericht', gespreid: 'Gespreid', rondom: 'Rondom' }[it.variant] || 'Algemeen',
    Infrarood: jn(it.infrarood), Radar: jn(it.radar), Ultrasoon: jn(it.ultrasoon), Aantal: aantal(it),
  }],
  bewegingsdetectorActief: (it) => ['BewegingsdetectorActief', { Aantal: aantal(it) }],
  batterij: (it) => ['Batterij', { Aantal: aantal(it) }],
  touchscreen: (it) => ['Touchscreen', { Aantal: aantal(it) }],
  boiler: (it) => ['Boiler', { Accumulatie: jn(it.accumulatie) }],
  branddetector: (it) => ['Branddetector', {
    Type: { onbepaald: 'NietGespecifieerd', rook: 'Rookdetector', vlam: 'Vlamdetector', warmte: 'Warmtedetector', gas: 'Gasdetector', manueel: 'Manueel', straal: 'Straaldetector' }[it.variant] || 'NietGespecifieerd',
    Aantal: aantal(it),
  }],
  camera: (it) => ['Camera', {
    Type: { dome: 'DomeCamera', behuizing: 'InBehuizing' }[it.variant] || 'NietGespecifieerd',
    Discreet: jn(it.discreet), Beweegbaar: jn(it.beweegbaar), Beweegdetectie: jn(it.beweegdetectie), Aantal: aantal(it),
  }],
  deurslot: (it) => ['Deurslot', { Aantal: aantal(it) }],
  domotica: (it) => ['DomoticaModule', { NaamModule: it.module || '' }],
  drukknop: (it) => ['Drukknop', {
    AantalKnoppen: Math.max(1, Number(it.knoppen) || 1), Afgeschermd: jn(it.afgeschermd), HalfWaterdicht: jn(it.waterdicht), Aantal: aantal(it),
    Verklikkerlamp: jn(it.verklikker), Rolluikdrukknop: jn(it.rolluik), Dimmer: jn(it.dimmer),
  }],
  geluidsbron: (it) => ['Geluidsbron', {
    Type: { bel: 'Bel', zoemer: 'Zoemer', hoorn: 'Hoorn', sirene: 'Sirene' }[it.variant] || 'Bel', Autonoom: jn(it.autonoom), Aantal: aantal(it),
  }],
  intercom: (it) => ['Intercom', { Aantal: aantal(it) }],
  ketel: (it) => ['Ketel', {
    Energiebron: { elektriciteit: 'Elektriciteit', gasVentilator: 'GasVentilator', gasAtmosferisch: 'GasAtmosferisch', vloeibaar: 'VloeibareBrandstof', vast: 'VasteBrandstof' }[it.energie] || 'NietGespecifieerd',
    Type: { boiler: 'KetelMetBoiler', tapspiraal: 'KetelMetTapspiraal', warmtewisselaar: 'Warmtewisselaar', wkk: 'Warmtekrachtkoppeling' }[it.variant] || 'NietGespecifieerd',
    WarmteFunctie: { verwarmend: 'Verwarmend', koelend: 'Koelend', beide: 'VerwarmendKoelend' }[it.functie] || 'NietGespecifieerd', Aantal: aantal(it),
  }],
  kiezer: (it) => ['Kiezer', { Aantal: aantal(it) }],
  lichtpunt: (it) => ['Lichtpunt', {
    Type: { tl: 'TL', spot: 'Spot', led: 'LED', ledstrip: 'LEDStrip', signalisatie: 'Signalisatielamp' }[it.variant] || 'NietGespecifieerd',
    Wandverlichting: jn(it.wand), HalfWaterdicht: jn(it.waterdicht), IngebouwdeSchakelaar: jn(it.schakelaar),
    NoodverlivhtingType: { centraal: 'Centraal', decentraal: 'Decentraal' }[it.nood] || 'Nee',
    AantalBuislampen: ['Een', 'Twee', 'Drie', 'Vier'][Math.min(4, Math.max(1, Number(it.buizen) || 1)) - 1], Aantal: aantal(it),
  }],
  luidspreker: (it) => ['Luidspreker', { Aantal: aantal(it) }],
  microfoon: (it) => ['Microfoon', { Selectief: jn(it.selectief), Aantal: aantal(it) }],
  monitor: (it) => ['Monitor', { Aantal: aantal(it) }],
  motor: (it) => ['Motor', { Tekst: it.opschrift ?? 'M', Aantal: aantal(it) }],
  omvormer: () => ['Omvormer', {}],
  overspanning: (it) => ['Overspanningsbeveiliging', { Tekst: it.opschrift || '' }],
  pomp: (it) => ['Pomp', { Aantal: aantal(it) }],
  relais: (it) => ['Relais', {
    Type: { relais: 'Relais', dimmer: 'Dimmer', thermostaat: 'Thermostaat', impuls: 'Impulsschakelaar', tijd: 'Tijdschakelaar', minuterie: 'Minuterie' }[it.variant] || 'NietGespecifieerd',
  }],
  schakelaar: (it) => {
    const v = it.variant;
    const type = { wissel: 'Wissel', dubbelewissel: 'DubbeleWissel', kruis: 'Kruis', serie: 'DubbeleAansteking' }[v] || 'Gewoon';
    const polen = { enkelpolig: 'Enkelpolig', tweepolig: 'Dubbelpolig', vierpolig: 'Vierpolig' }[v] || 'NietGespecifieerd';
    return ['Schakelaar', {
      Type: type, AantalPolen: polen, HalfWaterdicht: jn(it.waterdicht), VertraagdeOpening: jn(it.vertraagd), Signalisatielamp: jn(it.signalisatie),
      Verklikkerlamp: jn(it.verklikker), Dimmer: jn(it.dimmer), Trekschakelaar: jn(it.trek), Rolluikschakelaar: jn(it.rolluik), Aantal: aantal(it),
    }];
  },
  slot: (it) => ['Slot', { Type: { inschakel: 'Inschakelslot', tijd: 'Tijdslot' }[it.variant] || 'Codeslot', Aantal: aantal(it) }],
  smeltveiligheid: (it) => ['Smeltveiligheid', {
    AantalPolen: POLEN[it.polen] || 'NietGespecifieerd', NominaleStroomsterkte: Number(it.stroom) || 0, StroomsterkteEenheid: it.eenheid || 'A',
    Type: it.opschrift || '', Fase: it.fase || '',
  }],
  teller: (it) => ['Teller', { Tekst: it.opschrift || '' }],
  toestel: (it) => {
    const type = {
      wasmachine: 'Wasmachine', droogkast: 'Droogkast', vaatwasser: 'Vaatwasmachine', kookplaat: 'Kookfornuis', oven: 'ElektrischeOven',
      stoomoven: 'Stoomoven', microgolf: 'Microgolfoven', koelkast: 'Koelkast', diepvries: 'Diepvriezer', ventilatie: 'Ventilator', laadpaal: 'LaadpuntAuto',
    }[it.variant];
    if (type) return ['Toestel', { Type: type }];
    switch (it.variant) {
      case 'boiler': return ['Boiler', {}];
      case 'omvormer': return ['Omvormer', {}];
      case 'verwarming': return ['Verwarmingstoestel', {}];
      case 'rolluikmotor': case 'poort': return ['Motor', { Tekst: 'M' }];
      case 'bel': return ['Geluidsbron', { Type: 'Bel' }];
      case 'beltransfo': return ['Transformator', {}];
      case 'warmtepomp': return ['ToestelKlein', { Tekst: 'WP' }];
      case 'airco': return ['ToestelKlein', { Tekst: 'AC' }];
      default: return ['Toestel', { Type: 'NietGespecifierd' }];
    }
  },
  toestelKlein: (it) => ['ToestelKlein', { Tekst: it.opschrift || '', Aantal: aantal(it) }],
  transformator: (it) => ['Transformator', {
    Veiligheidstransformator: { open: 'Open', gesloten: 'Gesloten' }[it.veiligheid] || 'Nee', Beschermingstransformator: jn(it.bescherming),
    Kortsluitvast: jn(it.kortsluitvast), Tekst: it.opschrift || '',
  }],
  trillingsdetector: (it) => ['Trillingsdetector', { Type: it.variant === 'mechanisch' ? 'Mechanisch' : 'Glasbreuk', Actief: jn(it.actief), Aantal: aantal(it) }],
  ventiel: (it) => ['Ventiel', { Tekst: it.motor === false ? '' : 'M', Aantal: aantal(it) }],
  verwarmingstoestel: (it) => ['Verwarmingstoestel', { Accumulatie: jn(it.accumulatie), Ventilator: jn(it.ventilator) }],
  voorschakelapparaat: () => ['Voorschakelapparaat', {}],
  zonnepaneel: (it) => ['Zonnepaneel', { Symbool: it.gestandaardiseerd ? 'Gestandaardiseerd' : 'Trikker', Aantal: aantal(it) }],
};

/** Het Trikker-object dat bij een onderdeel hoort, of null als Trikker er geen symbool voor heeft (eigen symbolen, nota's). */
export function trikkerKnoop(item) {
  const kaart = KAART[item?.soort];
  if (!kaart) return null;
  const [klasse, props] = kaart(item);
  const module = KLASSEN[klasse];
  return module ? module.maak(props) : null;
}

const cache = new Map();

/**
 * Het symbool zoals Trikker het op het situatieschema tekent, in het formaat van symbolen.js: gecentreerd rond (0, 0) in Trikker-eenheden,
 * maal SCHAAL. Het resultaat heeft ook textOffset (in tekeneenheden) voor de plaats van de tekst en het adres.
 * @returns {{svg:string,b:number,boven:number,onder:number,midden:number,door:number,tekstRuimte:object}|null}
 */
export function trikkerSymbool(item) {
  const sleutel = JSON.stringify(item, (k, v) => (k === 'id' || k === 'afb' ? undefined : v));
  if (cache.has(sleutel)) return cache.get(sleutel);
  let uit = null;
  try {
    const knoop = trikkerKnoop(item);
    if (knoop) {
      const g = new Graphics();
      knoop.render(g, 'Grondplan', 0, null, { meerregelig: true });
      const b = knoop.Width * SCHAAL;
      const h = knoop.Height * SCHAAL;
      const t = knoop.textOffset(0);
      const svg = g.uit.replace(/#000000/g, 'currentColor');
      uit = {
        svg: `<g class="tk" transform="translate(${b / 2} 0) scale(${SCHAAL})">${svg}</g>`,
        b, boven: -h / 2, onder: h / 2, midden: b / 2, door: b,
        tekstRuimte: { links: t.left * SCHAAL, boven: t.top * SCHAAL, rechts: t.right * SCHAAL, onder: t.bottom * SCHAAL },
      };
    }
  } catch (fout) {
    console.warn('Trikker-symbool niet getekend', item?.soort, fout);
  }
  if (cache.size > 500) cache.clear();
  cache.set(sleutel, uit);
  return uit;
}

/** De ruimte rond het symbool waar tekst moet wegblijven, voor een draaiing in radialen, in tekeneenheden (nog niet maal de schaal van het plan). */
export function trikkerTekstOffset(item, rotatie = 0) {
  try {
    const knoop = trikkerKnoop(item);
    if (!knoop) return null;
    if (item.adres) knoop.Adres = item.adres;
    const t = knoop.textOffset(rotatie);
    return { left: t.left * SCHAAL, top: t.top * SCHAAL, right: t.right * SCHAAL, bottom: t.bottom * SCHAAL };
  } catch {
    return null;
  }
}

export const ADRES_PLAATSEN = ['plus0', 'plus90', 'plus180', 'plus270', 'verbergen'];

const normaal = (hoek) => ((hoek % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

/**
 * De adrestekst van een domoticasymbool, zoals Node.RenderAdres van Trikker hem tekent (cursief, in het draaiende vlak van het symbool).
 * @param {string} plaatsing plus0 | plus90 | plus180 | plus270 | verbergen
 * @returns {string} SVG in tekeneenheden, rond het midden van het symbool (nog te draaien met het symbool)
 */
export function trikkerAdresSvg(item, rotatie, plaatsing, tekst) {
  if (!tekst || plaatsing === 'verbergen') return '';
  const knoop = trikkerKnoop(item);
  if (!knoop) return '';
  const g = new Graphics();
  const font = fontCursief(1.6);
  const zwart = kwast();
  const num3 = 32;
  const num4 = 12.8;
  const t = knoop.textOffset(rotatie);
  let rot = rotatie;
  let num5;
  switch (plaatsing) {
    case 'plus180': num5 = t.left; rot += Math.PI; g.rotateTransform(90); break;
    case 'plus270': num5 = t.top; rot += 4.712389; g.rotateTransform(180); break;
    case 'plus90': num5 = t.bottom; rot += Math.PI / 2; break;
    default: num5 = t.right; g.rotateTransform(-90); break;
  }
  const num7 = normaal(rot + 0.087);
  let sf = SF.leftCenter;
  let rect = { x: num5, y: -num3 / 2, w: num4, h: num3 };
  if (num7 >= Math.PI / 2 && num7 < 4.71238898038469) {
    sf = SF.rightCenter;
    rect = { x: -(num5 + num4), y: -num3 / 2, w: num4, h: num3 };
    g.rotateTransform(-90);
  } else {
    g.rotateTransform(90);
  }
  g.tryDrawString(tekst, font, zwart, rect, sf);
  return `<g class="tk-adres" transform="translate(${knoop.Width * SCHAAL / 2} 0) scale(${SCHAAL})">${g.uit.replace(/#000000/g, 'currentColor')}</g>`;
}

/** Leidinglengte (in Trikker-eenheden) vóór het eigenlijke teken, voor symbolen die Trikker zonder aanvoerleiding tekent. */
const LEIDING = { touchscreen: 3.15 };

/**
 * Het symbool zoals Trikker het in het ééndraadschema tekent, in het formaat van symbolen.js: het begint op x = 0 (waar de leiding aankomt)
 * en loopt over de breedte van het symbool. Voor de soorten waarvoor het ééndraadschema nog niet volledig van Trikker komt.
 */
export function trikkerEendraadSymbool(item) {
  const knoop = trikkerKnoop(item);
  if (!knoop) return null;
  const g = new Graphics();
  knoop.render(g, 'Eendraadschema', null, null, { meerregelig: true });
  const b = knoop.Width * SCHAAL;
  const h = knoop.Height * SCHAAL;
  const leiding = (LEIDING[item.soort] || 0) * SCHAAL;
  const svg = (leiding ? `<line class="l" x1="0" y1="0" x2="${leiding}" y2="0"/>` : '') + `<g class="tk" transform="translate(${b / 2} 0) scale(${SCHAAL})">${g.uit.replace(/#000000/g, 'currentColor')}</g>`;
  return { svg, b, boven: -h / 2, onder: h / 2, midden: b / 2, door: b };
}
