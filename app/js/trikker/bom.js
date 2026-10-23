// De materiaallijst van Trikker, nagebouwd naar Bom.cs en BomLine.cs: per knoop één of meer omschrijvingen met een aantal;
// regels met dezelfde omschrijving worden samengeteld. Een knoop is { klasse, props } met de namen en waarden van Trikker.
// Gecontroleerd met de echte Bom-klasse van Trikker (test/bom-vergelijk.test.js en tools/trikker/LEESMIJ.md).
import { M, TF } from './tekst.js';

const JA = 'Ja';

/** De waarden die Trikker een eigenschap geeft als je er niets voor invult (de beginwaarden uit de Model-klassen). */
const STANDAARD = {
  AutomatischeSchakelaar: { Type: 'Automaat', AantalPolen: 'Dubbelpolig' },
  Beveiliging: { Type: 'Thermisch' },
  Beveiligingscontact: { Type: 'Magneetcontact', Aantal: 1 },
  Bewegingsdetector: { Type: 'Gespreid', Infrarood: JA, Aantal: 1 },
  Branddetector: { Type: 'Rookdetector', Aantal: 1 },
  Camera: { Type: 'NietGespecifieerd', Aantal: 1 },
  Contactdoos: { Beschermingsgeleider: JA, Kinderbescherming: JA, Aantal: 'Een', IngebouwdeSchakelaar: 'NietGespecifieerd', AantalFasen: 'NietGespecifieerd' },
  Geluidsbron: { Type: 'Bel', Aantal: 1 },
  Ketel: { Type: 'NietGespecifieerd', Energiebron: 'NietGespecifieerd', WarmteFunctie: 'NietGespecifieerd', Aantal: 1 },
  Lichtpunt: { Type: 'NietGespecifieerd', NoodverlivhtingType: 'Nee', AantalBuislampen: 'Een', IngebouwdeSensor: 'Geen', Aantal: 1 },
  Motor: { Tekst: 'M', Aantal: 1 },
  Overspanningsbeveiliging: { Type: 'Vonkbrug' },
  Relais: { Type: 'NietGespecifieerd' },
  Schakelaar: { Type: 'Gewoon', AantalPolen: 'Enkelpolig' },
  Slot: { Type: 'Codeslot', Aantal: 1 },
  Smeltveiligheid: { AantalPolen: 'NietGespecifieerd' },
  Teller: { Tekst: 'kWh' },
  Toestel: { Type: 'NietGespecifierd' },
  Transformator: { Veiligheidstransformator: 'Nee' },
  Trillingsdetector: { Type: 'Glasbreuk', Aantal: 1 },
  Ventiel: { Tekst: 'M', Aantal: 1 },
  Drukknop: { AantalKnoppen: 1, Aantal: 1 },
  DomoticaModule: { SymboolIngang: 'Geen', SymboolUitgangen: 'Geen' },
  BewegingsdetectorActief: { Aantal: 1 },
  Batterij: { Aantal: 1 },
  Deurslot: { Aantal: 1 },
  Intercom: { Aantal: 1 },
  Kiezer: { Aantal: 1 },
  Luidspreker: { Aantal: 1 },
  Microfoon: { Aantal: 1 },
  Monitor: { Aantal: 1 },
  Pomp: { Aantal: 1 },
  ToestelKlein: { Aantal: 1 },
  Touchscreen: { Aantal: 1 },
  Zonnepaneel: { Aantal: 1 },
  CustomNode: { Aantal: 1 },
};

/** Klassen met een eigen aantal (IAantal in Trikker): alle andere tellen één keer per knoop. */
const MET_AANTAL = new Set(['Batterij', 'Beveiligingscontact', 'Bewegingsdetector', 'BewegingsdetectorActief', 'Branddetector', 'Camera', 'CombiNode',
  'CustomNode', 'Deurslot', 'Drukknop', 'Geluidsbron', 'Intercom', 'Ketel', 'Kiezer', 'Lichtpunt', 'Luidspreker', 'Microfoon', 'Monitor', 'Motor', 'Pomp', 'Slot',
  'ToestelKlein', 'Touchscreen', 'Trillingsdetector', 'Ventiel', 'Zonnepaneel']);

/** Knopen die Trikker standaard niet op de materiaallijst zet (ToonOpBom = Nee in hun constructor: Ketel, Nota, Toestel, ToestelKlein, Verdeelbord). */
const STANDAARD_NIET_OP_BOM = new Set(['Ketel', 'Nota', 'Toestel', 'ToestelKlein', 'Verdeelbord']);

const POLEN = { NietGespecifieerd: 0, Enkelpolig: 1, Dubbelpolig: 2, Driepolig: 3, Vierpolig: 4 };
const AANTAL = { NietGespecifieerd: 0, Een: 1, Twee: 2, Drie: 3, Vier: 4, Vijf: 5, Zes: 6, Zeven: 7, Acht: 8, Negen: 9, Tien: 10 };
const FASEN = { NietGespecifieerd: 0, Een: 1, Twee: 2, Drie: 3 };

/** De beschrijving van een Leiding zoals Leiding.BuildText: "XVB Cca 3G2,5". */
export function leidingTekst(p) {
  let uit = '';
  let ervoor = false;
  if (p.GeleiderType) { uit += p.GeleiderType; ervoor = true; }
  if (p.Brandklasse) { ervoor = true; uit += ` ${p.Brandklasse}`; }
  const beschermd = (p.Beschermingsgeleider ?? JA) === JA;
  if (Number(p.AantalGeleiders) > 0 && (p.GeleidersAanduiding ?? 'Tekst') === 'Tekst' && p.GeleiderDoorsnede) {
    uit += `${ervoor ? ' ' : ''}${p.AantalGeleiders}${beschermd ? 'G' : 'x'}${p.GeleiderDoorsnede}`;
  } else if (p.GeleiderDoorsnede) {
    uit += `${ervoor ? ' ' : ''}${p.GeleiderDoorsnede}`;
  }
  return uit.trim();
}

/**
 * De lijnen die één knoop op de materiaallijst zet, zoals Bom.AddLinesForNode.
 * @param {{klasse:string, props:object, toonOpBom?:boolean}} knoop
 * @returns {{omschrijving:string, aantal:number, symbool:'zelf'|'lamp'|null}[]}
 */
export function lijnenVoorKnoop(knoop, { extended = false, negeerToonOpBom = false } = {}) {
  const { klasse } = knoop;
  const toon = knoop.toonOpBom ?? !STANDAARD_NIET_OP_BOM.has(klasse);
  if (!toon && !negeerToonOpBom) return [];
  const v = (naam) => knoop.props?.[naam] ?? STANDAARD[klasse]?.[naam];
  const is = (naam) => v(naam) === JA;
  const uit = [];
  const voeg = (omschrijving, aantal, symbool = 'zelf') => {
    if (omschrijving === null || omschrijving === undefined || String(omschrijving).trim() === '') return;
    uit.push({ omschrijving: String(omschrijving), aantal, symbool });
  };
  const num = MET_AANTAL.has(klasse) ? Number(v('Aantal') ?? 1) : 1;
  const sleutel = (k) => M(k);

  switch (klasse) {
    case 'Aansluitklem': case 'Aansluitpunt': case 'Aarding': case 'Aardingsstrip': case 'Aftakkast':
      voeg(sleutel(klasse), num);
      break;
    case 'AutomatischeSchakelaar': {
      let s = '';
      switch (v('Type')) {
        case 'Contact': s += sleutel('Contact'); break;
        case 'Schemerschakelaar': s += sleutel('Schemerschakelaar'); break;
        case 'Draaischakelaar': s += sleutel('Draaischakelaar'); break;
        case 'Zekeringscheider': s += sleutel('Zekeringscheider'); break;
        default:
          if (Number(v('VerliesStroomsterkte')) > 0) {
            s += Number(v('NominaleStroomsterkte')) > 0 && is('MaximumstroomBeveiliging') ? sleutel('Differentieelautomaat') : sleutel('Verliesstroomschakelaar');
            if (v('VerliesstroomschakelaarType')) s += ` - ${v('VerliesstroomschakelaarType')}`;
            s += ` - Δ${Number(v('VerliesStroomsterkte'))}mA`;
          } else {
            s += sleutel('Automaat');
          }
      }
      if (v('Kortsluitstroom')) s += ` - ${v('Kortsluitstroom')}`;
      const polen = POLEN[v('AantalPolen')] ?? 0;
      if (polen !== 0) s += ` - ${polen}P`;
      if (Number(v('NominaleStroomsterkte')) > 0) {
        s += ' - ';
        if (v('Uitschakelcurve') && v('Uitschakelcurve') !== 'NietGespecifieerd') s += `${v('Uitschakelcurve')} `;
        if (is('MaximumstroomBeveiliging')) s += 'M';
        s += `${Number(v('NominaleStroomsterkte'))}${v('StroomsterkteEenheid') || 'A'}`;
      }
      if (is('Selectief')) s += ` - ${sleutel('Selectief')}`;
      if (is('NormaalGesloten')) s += ` - ${sleutel('NormaalGesloten.Short')}`;
      voeg(s, num);
      break;
    }
    case 'Batterij': voeg(sleutel('Batterij'), num); break;
    case 'Beveiliging': voeg(sleutel(`BeveiligingType.BOM.${v('Type')}`), num); break;
    case 'Beveiligingscontact': voeg(sleutel(`BeveiligingscontactType.${v('Type')}`), num); break;
    case 'Bewegingsdetector': {
      let s = sleutel('Bewegingsdetector');
      const delen = [];
      if (is('Infrarood')) delen.push(sleutel('Infrarood'));
      if (is('Ultrasoon')) delen.push(sleutel('Ultrasoon'));
      if (is('Radar')) delen.push(sleutel('Radar'));
      if (delen.length) s += ` - ${delen.join(' + ')}`;
      s += ` - ${sleutel(v('Type'))}`;
      voeg(s, num);
      break;
    }
    case 'BewegingsdetectorActief': voeg(sleutel('BewegingsdetectorActief'), num); break;
    case 'Boiler': voeg(sleutel('Boiler') + (is('Accumulatie') ? ` - ${sleutel('Accumulatie')}` : ''), num); break;
    case 'Branddetector': voeg(sleutel(`BranddetectorType.BOM.${v('Type')}`), num); break;
    case 'Camera': {
      let s = sleutel(`CameraType.BOM.${v('Type')}`);
      if (is('Discreet')) s += ` - ${sleutel('Discreet')}`;
      if (is('Beweegbaar')) s += ` - ${sleutel('Beweegbaar')}`;
      if (is('Beweegdetectie')) s += ` - ${sleutel('Beweegdetectie')}`;
      voeg(s, num);
      break;
    }
    case 'Contactdoos': {
      let s = sleutel('Contactdoos');
      if (is('HalfWaterdicht')) s += ` - ${sleutel('HalfWaterdicht')}`;
      const schakelaar = v('IngebouwdeSchakelaar');
      if (schakelaar && schakelaar !== 'NietGespecifieerd') s += ` - ${sleutel('IngebouwdeSchakelaar')}, ${sleutel(`Polen.${schakelaar}`)}`;
      if (is('IngebouwdeTransformator')) s += ` - ${sleutel('IngebouwdeTransformator')}`;
      if (is('Kinderbescherming')) s += ` - ${sleutel('Kinderbescherming')}`;
      if (is('InBord')) s += ` - ${sleutel('InBord')}`;
      const fasen = FASEN[v('AantalFasen')] ?? 0;
      if (fasen !== 0) {
        s += ` - ${fasen}${sleutel('Fase.Short')}`;
        if (is('Nulgeleider')) s += `+${sleutel('Nulgeleider.Short')}`;
        if (is('Beschermingsgeleider')) s += `+${sleutel('Beschermingsgeleider.Short')}`;
      } else if (v('Beschermingsgeleider') === 'Nee') {
        s += ` - ${sleutel('GeenBeschermingsgeleider')}`;
      }
      voeg(s, Math.max(1, AANTAL[v('Aantal')] ?? 1));
      break;
    }
    case 'ContactdoosCommunicatie': voeg(sleutel('ContactdoosCommunicatie'), num); break;
    case 'CustomNode': if (knoop.props?.BomOmschrijving) voeg(knoop.props.BomOmschrijving, num); break;
    case 'Deurslot': voeg(sleutel('Deurslot'), num); break;
    case 'DomoticaModule': {
      let s;
      if (v('SymboolUitgangen') === 'Geen' || v('SymboolIngang') === 'Geen') s = sleutel('DomoticaModule');
      else s = `${sleutel('Omvormer')} ${sleutel(`DomoticaModuleSymbool.${v('SymboolIngang')}`)}/${sleutel(`DomoticaModuleSymbool.${v('SymboolUitgangen')}`)}`;
      if (v('NaamModule') && String(v('NaamModule')).trim()) s += ` - ${v('NaamModule')}`;
      voeg(s, num);
      break;
    }
    case 'Drukknop': {
      let s = is('Rolluikdrukknop') ? sleutel('Rolluikdrukknop') : sleutel('Drukknop');
      if (Number(v('AantalKnoppen')) > 1) s += ` - ${TF('Text.Model.XVoudig', Number(v('AantalKnoppen')))}`;
      if (is('HalfWaterdicht')) s += ` - ${sleutel('HalfWaterdicht')}`;
      if (is('Dimmer')) s += ` - ${sleutel('Dimmer')}`;
      if (is('Afgeschermd')) s += ` - ${sleutel('Afgeschermd')}`;
      voeg(s, num);
      if (is('Verklikkerlamp')) voeg(sleutel('Drukknop.Verklikkerlamp'), num * Number(v('AantalKnoppen')), 'lamp');
      break;
    }
    case 'Geluidsbron': {
      let s = sleutel(`GeluidsbronType.${v('Type')}`);
      if (is('Autonoom')) s += ` - ${sleutel('Autonoom')}`;
      voeg(s, num);
      break;
    }
    case 'Intercom': voeg(sleutel('Intercom'), num); break;
    case 'Ketel': {
      let s = sleutel(`KetelType.BOM.${v('Type')}`);
      if (v('Energiebron') && v('Energiebron') !== 'NietGespecifieerd') s += ` - ${sleutel(`Energiebron.BOM.${v('Energiebron')}`)}`;
      if (v('WarmteFunctie') && v('WarmteFunctie') !== 'NietGespecifieerd') s += ` - ${sleutel(`WarmteFunctie.${v('WarmteFunctie')}`)}`;
      voeg(s, num);
      break;
    }
    case 'Kiezer': voeg(sleutel('Kiezer'), num); break;
    case 'Leiding': {
      const tekst = leidingTekst(knoop.props || {});
      if (!tekst.trim()) break;
      let s = `${sleutel('Leiding')} - ${tekst}`;
      const plaatsing = v('Plaatsing');
      if (extended && (is('InBuis') || (plaatsing && plaatsing !== 'NietGespecifieerd'))) {
        s += ' (';
        let eerder = false;
        if (is('InBuis')) { s += sleutel('InBuis'); eerder = true; }
        if (plaatsing && plaatsing !== 'NietGespecifieerd') s += `${eerder ? ', ' : ''}${sleutel(`LeidingPlaatsing.${plaatsing}`)}`;
        s += ')';
      }
      voeg(s, 0);
      break;
    }
    case 'Lichtpunt': {
      let s;
      const nood = v('NoodverlivhtingType');
      if (nood && nood !== 'Nee' && (v('Type') === 'NietGespecifieerd' || v('Type') === 'TL')) s = sleutel(`NoodverlichtingType.BOM.${nood}`);
      else s = sleutel(`LichtpuntType.BOM.${v('Type')}`);
      if (v('Type') === 'TL') {
        const buizen = AANTAL[v('AantalBuislampen')] ?? 0;
        if (buizen > 0) s += ` - ${buizen} ${buizen === 1 ? sleutel('Buislamp') : sleutel('Buislampen')}`;
      }
      if (is('HalfWaterdicht')) s += ` - ${sleutel('HalfWaterdicht')}`;
      if (is('Wandverlichting')) s += ` - ${sleutel('Wandverlichting')}`;
      if (is('IngebouwdeSchakelaar')) s += ` - ${sleutel('IngebouwdeSchakelaar')}`;
      if (v('IngebouwdeSensor') && v('IngebouwdeSensor') !== 'Geen') s += ` - ${sleutel('IngebouwdeSensor')}`;
      voeg(s, num);
      break;
    }
    case 'Luidspreker': voeg(sleutel('Luidspreker'), num); break;
    case 'Microfoon': voeg(sleutel('Microfoon') + (is('Selectief') ? ` - ${sleutel('Selectief')}` : ''), num); break;
    case 'Monitor': voeg(sleutel('Monitor'), num); break;
    case 'Motor': voeg(sleutel('Motor'), num); break;
    case 'Nota': if (knoop.props?.Tekst && String(knoop.props.Tekst).trim()) voeg(knoop.props.Tekst, num); break;
    case 'Omvormer': voeg(sleutel('Omvormer'), num); break;
    case 'Overspanningsbeveiliging': voeg(`${sleutel('Overspanningsbeveiliging')} - ${sleutel(`OverspanningsbeveiligingType.${v('Type')}`)}`, num); break;
    case 'Pomp': voeg(sleutel('Pomp'), num); break;
    case 'Relais': voeg(sleutel(`RelaisType.BOM.${v('Type')}`), num); break;
    case 'Schakelaar': {
      let s = sleutel(`SchakelaarType.BOM.${v('Type')}`);
      const polen = v('AantalPolen');
      if (polen && polen !== 'NietGespecifieerd') s += ` - ${sleutel(`Polen.${polen}`)}`;
      if (v('Type') !== 'DubbeleWissel') {
        if (is('HalfWaterdicht')) s += ` - ${sleutel('HalfWaterdicht')}`;
        if (is('InBord')) s += ` - ${sleutel('InBord')}`;
        if (is('Dimmer')) s += ` - ${sleutel('Dimmer')}`;
        if (is('Trekschakelaar')) s += ` - ${sleutel('Trekschakelaar')}`;
        if (is('Rolluikschakelaar')) s += ` - ${sleutel('Rolluikschakelaar')}`;
        if (is('VertraagdeOpening')) s += ` - ${sleutel('VertraagdeOpening')}`;
        if (is('Verklikkerlamp')) voeg(sleutel('Schakelaar.Verklikkerlamp'), num, 'lamp');
        if (is('Signalisatielamp')) voeg(sleutel('Schakelaar.Signalisatielamp'), num, 'lamp');
      }
      voeg(s, num);
      break;
    }
    case 'Slot': voeg(sleutel(`SlotType.${v('Type')}`), num); break;
    case 'Smeltveiligheid': {
      let s = sleutel('Smeltveiligheid');
      if (v('Type')) s += ` - ${v('Type')}`;
      if (Number(v('NominaleStroomsterkte')) > 0) s += ` - ${Number(v('NominaleStroomsterkte'))}${v('StroomsterkteEenheid') || 'A'}`;
      voeg(s, Math.max(1, POLEN[v('AantalPolen')] ?? 0));
      break;
    }
    case 'Toestel': {
      let k = `ToestelType.${v('Type')}`;
      if (v('Type') === 'LaadpuntAuto2') k = 'ToestelType.LaadpuntAuto';
      voeg(sleutel(k), num);
      break;
    }
    case 'ToestelKlein': {
      let s = sleutel('Toestel');
      if (v('Tekst')) s += ` "${v('Tekst')}"`;
      voeg(s, num);
      break;
    }
    case 'Touchscreen': voeg(sleutel('Touchscreen'), num); break;
    case 'Teller': voeg(sleutel('Teller') + (v('Tekst') && String(v('Tekst')).trim() ? ` - ${v('Tekst')}` : ''), num); break;
    case 'Transformator': {
      let s;
      const veilig = v('Veiligheidstransformator');
      if (veilig && veilig !== 'Nee') {
        s = sleutel(`VeiligheidstransformatorType.BOM.${veilig}`);
        if (is('Beschermingstransformator')) s += ` - ${sleutel('Bescherming')}`;
      } else if (is('Beschermingstransformator')) s = sleutel('Beschermingstransformator');
      else s = sleutel('Transformator');
      if (is('Kortsluitvast')) s += ` - ${sleutel('Kortsluitvast')}`;
      voeg(s, num);
      break;
    }
    case 'Trillingsdetector': {
      let s = sleutel(`TrillingsdetectorType.BOM.${v('Type')}`);
      if (is('Actief')) s += ` - ${sleutel('Actief')}`;
      voeg(s, num);
      break;
    }
    case 'Ventiel': voeg(sleutel('Ventiel'), num); break;
    case 'Verdeelbord': case 'VerdeelbordGrondplan': voeg(sleutel('Verdeelbord'), num); break;
    case 'Verwarmingstoestel': {
      let s = sleutel('Verwarmingstoestel');
      if (is('Accumulatie')) s += ` - ${sleutel('Accumulatie')}`;
      if (is('Ventilator')) s += ` - ${sleutel('Ventilator')}`;
      voeg(s, num);
      break;
    }
    case 'Voorschakelapparaat': voeg(sleutel('Voorschakelapparaat'), num); break;
    case 'Zonnepaneel': voeg(sleutel('Zonnepaneel'), num); break;
    default: break;
  }
  return uit;
}

/**
 * De materiaallijst van een reeks knopen: regels met dezelfde omschrijving worden samengeteld, in de volgorde van het eerste voorkomen
 * (zoals Bom.Lines), met als symbool dat van de eerste knoop met die omschrijving.
 * @param {{klasse:string, props:object, bron?:any}[]} knopen
 * @returns {{omschrijving:string, aantal:number, aantalTekst:string, symbool:null|{klasse:string, props:object, bron:any, soort:string}}[]}
 */
export function bom(knopen, opties = {}) {
  const regels = new Map();
  for (const knoop of knopen) {
    for (const l of lijnenVoorKnoop(knoop, opties)) {
      let r = regels.get(l.omschrijving);
      if (!r) {
        r = { omschrijving: l.omschrijving, aantal: 0, aantalTekst: '', symbool: opties.symbolen ? { knoop, soort: l.symbool } : null };
        regels.set(l.omschrijving, r);
      }
      r.aantal += l.aantal;
    }
  }
  for (const r of regels.values()) r.aantalTekst = r.aantal > 0 ? String(r.aantal) : '';
  return [...regels.values()];
}

let vergelijker;
/**
 * De volgorde van de BomScreen: OrderBy(Description) met de cultuur nl-BE. In Windows (NLS, "woordsortering") tellen een koppelteken en een
 * apostrof niet mee voor de volgorde zolang de rest verschilt; dat doen we hier ook, met de gewone nl-collatie voor de rest.
 */
export function vergelijkOmschrijving(a, b) {
  vergelijker ??= new Intl.Collator('nl-BE');
  const kaal = (s) => s.replace(/[-'‑]/g, '');
  return vergelijker.compare(kaal(a), kaal(b)) || vergelijker.compare(a, b);
}

/** De regels op omschrijving gesorteerd, zoals BomScreen.RefreshBom ze toont en afdrukt. */
export const sorteerBom = (regels) => [...regels].sort((a, b) => vergelijkOmschrijving(a.omschrijving, b.omschrijving));
