// Alles wat in een schema kan staan: keuzelijsten, onderdelen met hun eigenschappen en standaardwaarden.
// De soorten en eigenschappen volgen de symbolenlijst van Trikker; de tekens zelf staan in symbolen.js.

export const NETTEN = {
  '1F230': { naam: '1-fasig 230 V', kort: '230V ~ 50Hz', polen: 2 },
  '3F230': { naam: '3-fasig 3×230 V', kort: '3 x 230V ~ 50Hz', polen: 3 },
  '3N400': { naam: '3-fasig 3N 400 V', kort: '3 x 400V + N ~ 50Hz', polen: 4 },
};

export const AUTOMAAT_STROMEN = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80];
export const CURVES = ['B', 'C', 'D'];
export const POLEN = [1, 2, 3, 4];
export const DIFF_GEVOELIGHEDEN = [10, 30, 100, 300, 500];
export const DIFF_STROMEN = [25, 40, 63, 80, 100];
export const DIFF_TYPES = ['AC', 'A', 'F', 'B'];
export const SECTIES = [1.5, 2.5, 4, 6, 10, 16, 25, 35];
export const ADERS = [2, 3, 4, 5];

export const KABELTYPES = {
  XVB: { naam: 'XVB (kabel)', soort: 'kabel', brandklasse: true },
  EXVB: { naam: 'EXVB (kabel, buiten/grond)', soort: 'kabel', brandklasse: true },
  XGB: { naam: 'XGB (halogeenvrij)', soort: 'kabel', brandklasse: true },
  VOB: { naam: 'VOB (draad in buis)', soort: 'draad' },
  'H07RN-F': { naam: 'H07RN-F (soepel)', soort: 'kabel' },
};

// ---------- Varianten van de bestaande onderdelen ----------

export const LICHTPUNTEN = {
  plafond: { naam: 'Lichtpunt', kort: 'lichtpunt' },
  tl: { naam: 'TL / lichtlijn', kort: 'TL' },
  spot: { naam: 'Spot', kort: 'spot' },
  led: { naam: 'LED', kort: 'LED' },
  ledstrip: { naam: 'LED-strip', kort: 'LED-strip' },
  signalisatie: { naam: 'Signalisatielamp', kort: 'signalisatie' },
};

export const SCHAKELAARS = {
  enkelpolig: { naam: 'Enkelpolige schakelaar', kort: 'enkelp.' },
  onbepaald: { naam: 'Schakelaar (polen niet gespecificeerd)', kort: 'schakelaar' },
  tweepolig: { naam: 'Tweepolige schakelaar', kort: 'tweep.' },
  vierpolig: { naam: 'Vierpolige schakelaar', kort: 'vierp.' },
  wissel: { naam: 'Wisselschakelaar', kort: 'wissel' },
  dubbelewissel: { naam: 'Dubbele wisselschakelaar', kort: 'dubbele wissel' },
  kruis: { naam: 'Kruisschakelaar', kort: 'kruis' },
  serie: { naam: 'Serieschakelaar (dubbele aansteking)', kort: 'serie' },
};

/**
 * Vaste en aangesloten toestellen.
 * dertig: moet volgens het AREI achter een differentieel van max. 30 mA.
 * eigenKring: hoort normaal op een eigen kring.
 */
export const TOESTELLEN = {
  wasmachine: { naam: 'Wasmachine', kort: 'WM', dertig: true, eigenKring: true, aansluiting: 'stopcontact', vermogen: 2500 },
  droogkast: { naam: 'Droogkast', kort: 'DK', dertig: true, eigenKring: true, aansluiting: 'stopcontact', vermogen: 2500 },
  vaatwasser: { naam: 'Vaatwasser', kort: 'VW', dertig: true, eigenKring: true, aansluiting: 'stopcontact', vermogen: 2200 },
  kookplaat: { naam: 'Kookfornuis / kookplaat', kort: 'KP', eigenKring: true, aansluiting: 'vast', vermogen: 7400 },
  oven: { naam: 'Elektrische oven', kort: 'OV', eigenKring: true, aansluiting: 'stopcontact', vermogen: 3500 },
  stoomoven: { naam: 'Stoomoven', kort: 'SO', aansluiting: 'stopcontact', vermogen: 2500 },
  microgolf: { naam: 'Microgolfoven', kort: 'MG', aansluiting: 'stopcontact', vermogen: 1500 },
  dampkap: { naam: 'Dampkap', kort: 'DA', aansluiting: 'stopcontact', vermogen: 300 },
  koelkast: { naam: 'Koelkast', kort: 'KK', aansluiting: 'stopcontact', vermogen: 200 },
  diepvries: { naam: 'Diepvriezer', kort: 'DV', aansluiting: 'stopcontact', vermogen: 200 },
  ventilatie: { naam: 'Ventilator', kort: 'VE', aansluiting: 'vast', vermogen: 100 },
  boiler: { naam: 'Boiler', kort: 'BO', eigenKring: true, aansluiting: 'vast', vermogen: 2400 },
  warmtepomp: { naam: 'Warmtepomp', kort: 'WP', eigenKring: true, aansluiting: 'vast', vermogen: 3000 },
  airco: { naam: 'Airco', kort: 'AC', eigenKring: true, aansluiting: 'vast', vermogen: 2500 },
  verwarming: { naam: 'Elektrische verwarming', kort: 'EV', aansluiting: 'vast', vermogen: 2000 },
  laadpaal: { naam: 'Laadpaal', kort: 'LP', eigenKring: true, aansluiting: 'vast', vermogen: 7400 },
  omvormer: { naam: 'Omvormer zonnepanelen', kort: 'PV', eigenKring: true, aansluiting: 'vast', vermogen: 4000 },
  rolluikmotor: { naam: 'Rolluikmotor', kort: 'RL', aansluiting: 'vast', vermogen: 200 },
  poort: { naam: 'Poortmotor', kort: 'PM', aansluiting: 'vast', vermogen: 500 },
  bel: { naam: 'Bel', kort: 'BEL', aansluiting: 'vast', vermogen: 10 },
  beltransfo: { naam: 'Beltransformator', kort: 'TR', aansluiting: 'vast', vermogen: 10 },
  ander: { naam: 'Toestel', kort: '?', aansluiting: 'vast', vermogen: 0 },
};

export const AANSLUITINGEN = { stopcontact: 'Via stopcontact', vast: 'Vast aangesloten' };

// ---------- Alle soorten onderdelen, met hun eigenschappen ----------

const optie = (o) => Object.entries(o);
const keuze = (pad, label, opties, extra = {}) => ({ pad, label, type: 'select', opties: optie(opties), ...extra });
const getalKeuze = (pad, label, opties) => keuze(pad, label, opties, { getal: true });
const ja = (pad, label) => ({ pad, label, type: 'checkbox' });
const tekstveld = (pad, label, placeholder = '') => ({ pad, label, placeholder });
const getal = (pad, label, min = 0, max = 999) => ({ pad, label, type: 'number', getal: true, min, max });
const namen = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.naam]));

/**
 * Per soort: naam, groep (voor het palet en de materiaallijst), standaardwaarden en de velden in het eigenschappenpaneel.
 * eigenAantal: de soort gebruikt "aantal" zelf (bv. meervoudig stopcontact), dus geen algemeen aantal-veld.
 */
export const SOORTEN = {
  eigen: {
    naam: 'Eigen symbool', groep: 'Eigen symbolen', eigenAantal: false,
    standaard: { afb: '', breedteMm: 10, verhouding: 1, omschrijving: '' },
    velden: [
      { label: 'Omschrijving op materiaallijst', pad: 'omschrijving', placeholder: 'leeg = niet op de materiaallijst' },
      { label: 'Breedte op papier (mm)', pad: 'breedteMm', type: 'number', getal: true, min: 2, max: 80 },
    ],
  },
  aansluitpunt: { naam: 'Aansluitpunt', groep: 'Algemeen', standaard: { opschrift: '' }, velden: [tekstveld('opschrift', 'Tekst', 'bv. 1.2.3')] },
  aarding: { naam: 'Aarding', groep: 'Algemeen', standaard: { opschrift: '' }, velden: [tekstveld('opschrift', 'Tekst', 'bv. < 30Ω')] },
  aardingsstrip: { naam: 'Aardingsstrip', groep: 'Algemeen', standaard: {}, velden: [] },
  aftakdoos: { naam: 'Aftakkast', groep: 'Algemeen', standaard: {}, velden: [] },
  automaat: {
    naam: 'Automatische Schakelaar', groep: 'Beveiliging',
    standaard: { variant: 'automaat', polen: 0, stroom: 0, curve: '', eenheid: 'A', gevoeligheid: 0, maxstroom: false, kortsluit: 0, selectief: false, gesloten: false, fase: '' },
    velden: [
      keuze('variant', 'Type', { automaat: 'Automaat', contact: 'Contact', schemer: 'Schemerschakelaar', draai: 'Draaischakelaar', zekeringscheider: 'Zekeringscheider' }),
      getalKeuze('polen', 'Aantal polen', { 0: 'Niet gespecificeerd', 1: '1P', 2: '2P', 3: '3P', 4: '4P' }),
      getal('stroom', 'Nominale stroom (0 = niet tonen)'),
      keuze('eenheid', 'Eenheid', { A: 'A', mA: 'mA' }),
      keuze('curve', 'Uitschakelcurve', { '': 'Niet tonen', B: 'B', C: 'C', D: 'D' }),
      getal('gevoeligheid', 'Δ verliesstroom in mA (0 = geen)'),
      ja('maxstroom', 'Max. stroombeveiliging (differentieelautomaat)'),
      getal('kortsluit', 'Kortsluitstroom in kA (0 = niet tonen)'),
      ja('selectief', 'Selectief'),
      ja('gesloten', 'Normaal gesloten'),
      keuze('fase', 'Fase', { '': 'Niet tonen', L1: 'L1', L2: 'L2', L3: 'L3' }),
    ],
  },
  beveiliging: { naam: 'Beveiliging', groep: 'Beveiliging', standaard: { variant: 'elektromagnetisch' }, velden: [keuze('variant', 'Type', { elektromagnetisch: 'Elektromagnetisch', thermisch: 'Thermisch' })] },
  beveiligingscontact: {
    naam: 'Beveiligingscontact', groep: 'Alarm en detectie', standaard: { variant: 'magneet' },
    velden: [keuze('variant', 'Type', { magneet: 'Magneetcontact', mechanisch: 'Mechanisch contact', schoot: 'Schootcontact', tril: 'Trilcontact', drukmat: 'Drukmat', afneem: 'Afneemcontact' })],
  },
  bewegingsdetector: {
    naam: 'Bewegingsdetector', groep: 'Alarm en detectie', standaard: { variant: 'basis', infrarood: false, radar: false, ultrasoon: false },
    velden: [keuze('variant', 'Type', { basis: 'Basis', gericht: 'Gericht', gespreid: 'Gespreid', rondom: 'Rondom' }), ja('infrarood', 'Infrarood'), ja('radar', 'Radar'), ja('ultrasoon', 'Ultrasoon')],
  },
  bewegingsdetectorActief: { naam: 'Actieve bewegingsdetector', groep: 'Alarm en detectie', standaard: {}, velden: [] },
  batterij: { naam: 'Batterij', groep: 'Toestellen', standaard: {}, velden: [] },
  boiler: { naam: 'Boiler', groep: 'Toestellen', standaard: { accumulatie: false }, velden: [ja('accumulatie', 'Accumulatie')] },
  branddetector: {
    naam: 'Branddetector', groep: 'Alarm en detectie', standaard: { variant: 'onbepaald' },
    velden: [keuze('variant', 'Type', { onbepaald: 'Niet gespecificeerd', rook: 'Rookdetector', vlam: 'Vlamdetector', warmte: 'Warmtedetector', gas: 'Gasdetector', manueel: 'Manueel', straal: 'Straaldetector' })],
  },
  camera: {
    naam: 'Camera', groep: 'Alarm en detectie', standaard: { variant: 'basis', discreet: false, beweegdetectie: false, beweegbaar: false },
    velden: [keuze('variant', 'Type', { basis: 'Camera', dome: 'Domecamera', behuizing: 'In behuizing' }), ja('discreet', 'Discreet'), ja('beweegdetectie', 'Beweegdetectie'), ja('beweegbaar', 'Beweegbaar')],
  },
  stopcontact: {
    naam: 'Contactdoos', groep: 'Contactdozen', eigenAantal: true,
    standaard: { aantal: 1, aarding: true, kinderveilig: true, waterdicht: false, schakelaar: 'geen', transformator: false, fasen: 0, nul: false, pe: false, opschrift: '' },
    velden: [
      getalKeuze('aantal', 'Aantal', { 1: 'Enkel', 2: 'Dubbel', 3: 'Drievoudig', 4: 'Viervoudig' }),
      ja('aarding', 'Beschermingsgeleider (aarding)'),
      ja('kinderveilig', 'Kinderbescherming'),
      ja('waterdicht', 'Half waterdicht'),
      keuze('schakelaar', 'Schakelaar ingebouwd', { geen: 'Nee', enkel: 'Enkelpolig', dubbel: 'Dubbelpolig' }),
      ja('transformator', 'Transformator ingebouwd'),
      getalKeuze('fasen', 'Aantal fasen', { 0: 'Niet tonen', 1: 'Eén', 3: 'Drie' }),
      ja('nul', 'Nulgeleider tonen'),
      ja('pe', 'Beschermingsgeleider tonen'),
      tekstveld('opschrift', 'Tekst', 'bv. 32A'),
    ],
  },
  communicatie: { naam: 'Contactdoos communicatie', groep: 'Contactdozen', standaard: { opschrift: '' }, velden: [tekstveld('opschrift', 'Tekst', 'bv. UTP Cat6')] },
  deurslot: { naam: 'Deurslot', groep: 'Toegang', standaard: {}, velden: [] },
  domotica: {
    naam: 'Domoticamodule', groep: 'Sturing', standaard: { module: '', uitgangen: '' },
    velden: [tekstveld('module', 'Naam module', 'bv. BTicino'), tekstveld('uitgangen', 'Namen uitgangen', 'bv. O.1, O.2')],
  },
  drukknop: {
    naam: 'Drukknop', groep: 'Schakelaars', standaard: { knoppen: 1, verklikker: false, waterdicht: false, afgeschermd: false, rolluik: false, dimmer: false },
    velden: [getal('knoppen', 'Aantal knoppen', 1, 12), ja('verklikker', 'Verklikkerlamp'), ja('waterdicht', 'Half waterdicht'), ja('afgeschermd', 'Afgeschermd'), ja('rolluik', 'Rolluikdrukknop'), ja('dimmer', 'Dimmer')],
  },
  geluidsbron: {
    naam: 'Geluidsbron', groep: 'Communicatie', standaard: { variant: 'bel', autonoom: false },
    velden: [keuze('variant', 'Type', { bel: 'Bel', zoemer: 'Zoemer', hoorn: 'Hoorn', sirene: 'Sirene' }), ja('autonoom', 'Autonoom')],
  },
  intercom: { naam: 'Intercom', groep: 'Communicatie', standaard: {}, velden: [] },
  ketel: {
    naam: 'Ketel', groep: 'Toestellen', standaard: { energie: 'onbepaald', variant: 'basis', functie: '' },
    velden: [
      keuze('energie', 'Energiebron', { onbepaald: 'Niet gespecificeerd', elektriciteit: 'Elektriciteit', gasVentilator: 'Gas (ventilator)', gasAtmosferisch: 'Gas (atmosferisch)', vloeibaar: 'Vloeibare brandstof', vast: 'Vaste brandstof' }),
      keuze('variant', 'Type', { basis: 'Ketel', boiler: 'Met boiler', tapspiraal: 'Met tapspiraal', warmtewisselaar: 'Warmtewisselaar', wkk: 'Warmtekrachtkoppeling' }),
      keuze('functie', 'Warmte functie', { '': 'Niet tonen', verwarmend: 'Verwarmend', koelend: 'Koelend', beide: 'Verwarmend en koelend' }),
    ],
  },
  kiezer: { naam: 'Kiezer', groep: 'Communicatie', standaard: {}, velden: [] },
  lichtpunt: {
    naam: 'Lichtpunt', groep: 'Verlichting', standaard: { variant: 'plafond', aantal: 1, wand: false, waterdicht: false, schakelaar: false, nood: 'geen', buizen: 1 },
    velden: [
      keuze('variant', 'Type', namen(LICHTPUNTEN)),
      ja('wand', 'Wandverlichting'),
      ja('waterdicht', 'Half waterdicht'),
      ja('schakelaar', 'Schakelaar ingebouwd'),
      keuze('nood', 'Noodverlichting', { geen: 'Nee', centraal: 'Centraal', decentraal: 'Decentraal' }),
      getalKeuze('buizen', 'Aantal buislampen (TL)', { 1: 'Eén', 2: 'Twee', 3: 'Drie' }),
    ],
  },
  luidspreker: { naam: 'Luidspreker', groep: 'Communicatie', standaard: {}, velden: [] },
  microfoon: { naam: 'Microfoon', groep: 'Communicatie', standaard: { selectief: false }, velden: [ja('selectief', 'Selectief')] },
  monitor: { naam: 'Monitor', groep: 'Communicatie', standaard: {}, velden: [] },
  motor: { naam: 'Motor', groep: 'Toestellen', standaard: { opschrift: 'M' }, velden: [tekstveld('opschrift', 'Tekst in de cirkel', 'M')] },
  nota: { naam: 'Nota', groep: 'Algemeen', standaard: { opschrift: 'Nota', grootte: 2 }, velden: [tekstveld('opschrift', 'Tekst'), getalKeuze('grootte', 'Tekstgrootte', { 1: 'Klein', 2: 'Normaal', 3: 'Groot' })] },
  omvormer: { naam: 'Omvormer', groep: 'Toestellen', standaard: {}, velden: [] },
  overspanning: { naam: 'Overspanningsbeveiliging', groep: 'Beveiliging', standaard: { opschrift: '' }, velden: [tekstveld('opschrift', 'Tekst', 'bv. 2L + PE')] },
  pomp: { naam: 'Pomp', groep: 'Toestellen', standaard: {}, velden: [] },
  relais: {
    naam: 'Relais', groep: 'Sturing', standaard: { variant: 'basis' },
    velden: [keuze('variant', 'Type', { basis: 'Relais (basis)', relais: 'Relais', dimmer: 'Dimmer', thermostaat: 'Thermostaat', impuls: 'Impulsschakelaar (teleruptor)', tijd: 'Tijdschakelaar', minuterie: 'Minuterie' })],
  },
  schakelaar: {
    naam: 'Schakelaar', groep: 'Schakelaars',
    standaard: { variant: 'enkelpolig', aantal: 1, dimmer: false, rolluik: false, verklikker: false, signalisatie: false, trek: false, vertraagd: false, waterdicht: false },
    velden: [
      keuze('variant', 'Type', namen(SCHAKELAARS)),
      ja('dimmer', 'Dimmer'),
      ja('rolluik', 'Rolluikschakelaar'),
      ja('verklikker', 'Verklikkerlamp'),
      ja('signalisatie', 'Signalisatielamp'),
      ja('trek', 'Trekschakelaar'),
      ja('vertraagd', 'Vertraagde opening'),
      ja('waterdicht', 'Half waterdicht'),
    ],
  },
  slot: { naam: 'Slot', groep: 'Toegang', standaard: { variant: 'code' }, velden: [keuze('variant', 'Type', { code: 'Codeslot', inschakel: 'Inschakelslot', tijd: 'Tijdslot' })] },
  smeltveiligheid: {
    naam: 'Smeltveiligheid', groep: 'Beveiliging', standaard: { stroom: 0, eenheid: 'A', polen: 0, fase: '', opschrift: '' },
    velden: [
      getal('stroom', 'Nominale stroom (0 = niet tonen)'),
      keuze('eenheid', 'Eenheid', { A: 'A', mA: 'mA' }),
      getalKeuze('polen', 'Aantal polen', { 0: 'Niet tonen', 1: '1P', 2: '2P', 3: '3P', 4: '4P' }),
      keuze('fase', 'Fase', { '': 'Niet tonen', L1: 'L1', L2: 'L2', L3: 'L3' }),
      tekstveld('opschrift', 'Type / tekst'),
    ],
  },
  teller: { naam: 'Teller', groep: 'Toestellen', standaard: { opschrift: 'kWh' }, velden: [tekstveld('opschrift', 'Tekst', 'kWh')] },
  toestel: {
    naam: 'Toestel', groep: 'Toestellen', standaard: { variant: 'ander' },
    velden: [
      keuze('variant', 'Type', namen(TOESTELLEN), { herbouw: true, daarna: (o, w) => { o.aansluiting = TOESTELLEN[w].aansluiting; o.vermogen = TOESTELLEN[w].vermogen; } }),
      keuze('aansluiting', 'Aansluiting', AANSLUITINGEN),
      getal('vermogen', 'Vermogen (W)', 0, 100000),
    ],
  },
  toestelKlein: { naam: 'Toestel (klein)', groep: 'Toestellen', standaard: { opschrift: '' }, velden: [tekstveld('opschrift', 'Tekst', 'bv. C (alarmcentrale)')] },
  transformator: {
    naam: 'Transformator', groep: 'Toestellen', standaard: { veiligheid: 'nee', bescherming: false, kortsluitvast: false, opschrift: '' },
    velden: [
      keuze('veiligheid', 'Veiligheidstransformator', { nee: 'Nee', open: 'Open', gesloten: 'Gesloten' }),
      ja('bescherming', 'Beschermingstransformator'),
      ja('kortsluitvast', 'Kortsluitvast'),
      tekstveld('opschrift', 'Tekst', 'bv. 12V'),
    ],
  },
  touchscreen: { naam: 'Touchscreen', groep: 'Sturing', standaard: {}, velden: [] },
  trillingsdetector: {
    naam: 'Trillingsdetector', groep: 'Alarm en detectie', standaard: { variant: 'glasbreuk', actief: false },
    velden: [keuze('variant', 'Type', { glasbreuk: 'Glasbreuk', mechanisch: 'Mechanisch' }), ja('actief', 'Actief')],
  },
  ventiel: { naam: 'Ventiel', groep: 'Toestellen', standaard: { motor: true }, velden: [ja('motor', 'Met motor (M)')] },
  verwarmingstoestel: {
    naam: 'Verwarmingstoestel', groep: 'Toestellen', standaard: { accumulatie: false, ventilator: false },
    velden: [ja('accumulatie', 'Accumulatie'), ja('ventilator', 'Ventilator')],
  },
  voorschakelapparaat: { naam: 'Voorschakelapparaat', groep: 'Verlichting', standaard: {}, velden: [] },
  zonnepaneel: { naam: 'Zonnepaneel', groep: 'Toestellen', standaard: { gestandaardiseerd: false }, velden: [ja('gestandaardiseerd', 'Gestandaardiseerd symbool')] },
};

/** Volgorde van de groepen in het palet en de keuzelijst. */
export const SOORT_GROEPEN = ['Contactdozen', 'Verlichting', 'Schakelaars', 'Toestellen', 'Beveiliging', 'Alarm en detectie', 'Toegang', 'Communicatie', 'Sturing', 'Algemeen', 'Eigen symbolen'];

/** Knoppen om snel iets aan een kring toe te voegen. */
export const PALET = [
  { soort: 'stopcontact', waarden: { aantal: 1 }, naam: 'Stopcontact' },
  { soort: 'stopcontact', waarden: { aantal: 2 }, naam: 'Dubbel stopcontact' },
  { soort: 'stopcontact', waarden: { aantal: 1, waterdicht: true }, naam: 'Halfwaterdicht stopcontact' },
  { soort: 'lichtpunt', waarden: { variant: 'plafond' }, naam: 'Lichtpunt' },
  { soort: 'lichtpunt', waarden: { variant: 'plafond', wand: true }, naam: 'Wandlicht' },
  { soort: 'lichtpunt', waarden: { variant: 'spot' }, naam: 'Spot' },
  { soort: 'lichtpunt', waarden: { variant: 'tl' }, naam: 'TL' },
  { soort: 'lichtpunt', waarden: { variant: 'plafond', nood: 'decentraal' }, naam: 'Noodverlichting' },
  { soort: 'schakelaar', waarden: { variant: 'enkelpolig' }, naam: 'Schakelaar' },
  { soort: 'schakelaar', waarden: { variant: 'wissel' }, naam: 'Wisselschakelaar' },
  { soort: 'schakelaar', waarden: { variant: 'serie' }, naam: 'Serieschakelaar' },
  { soort: 'schakelaar', waarden: { variant: 'kruis' }, naam: 'Kruisschakelaar' },
  { soort: 'schakelaar', waarden: { variant: 'enkelpolig', dimmer: true }, naam: 'Dimmer' },
  { soort: 'drukknop', waarden: {}, naam: 'Drukknop' },
  { soort: 'bewegingsdetector', waarden: {}, naam: 'Bewegings-detector' },
  { soort: 'toestel', waarden: { variant: 'wasmachine' }, naam: 'Wasmachine' },
  { soort: 'toestel', waarden: { variant: 'droogkast' }, naam: 'Droogkast' },
  { soort: 'toestel', waarden: { variant: 'vaatwasser' }, naam: 'Vaatwasser' },
  { soort: 'toestel', waarden: { variant: 'kookplaat' }, naam: 'Kookfornuis' },
  { soort: 'toestel', waarden: { variant: 'oven' }, naam: 'Oven' },
  { soort: 'toestel', waarden: { variant: 'koelkast' }, naam: 'Koelkast' },
  { soort: 'boiler', waarden: {}, naam: 'Boiler' },
  { soort: 'toestel', waarden: { variant: 'laadpaal' }, naam: 'Laadpaal' },
  { soort: 'aftakdoos', waarden: {}, naam: 'Aftakkast' },
];

/** Een getal zoals een elektricien het schrijft: 2,5 in plaats van 2.5. */
export const komma = (getal) => String(getal).replace('.', ',');

/** De keuzes voor de brandklasse (reactie bij brand, EN 50575) van een kabel. */
export const BRANDKLASSEN = [['Cca', 'Cca'], ['Cca-s1b,d1,a1', 'Cca-s1b,d1,a1'], ['Dca', 'Dca'], ['Eca', 'Eca'], ['B2ca', 'B2ca'], ['geen', 'Geen (niet tonen)']];
export const STANDAARD_BRANDKLASSE = 'Cca';

/**
 * De brandklasse die bij een kabel hoort: die van de kring zelf, anders de standaard van het project.
 * Draad in een buis en soepel snoer (H07RN-F) krijgen er geen automatisch. "geen" laat ze weg.
 * @param {string} [standaard] de standaard van het project (project.opties.brandklasse)
 */
export function brandklasse(kabel, standaard = STANDAARD_BRANDKLASSE) {
  if (kabel.klasse === 'geen') return '';
  if (kabel.klasse) return kabel.klasse;
  if (!KABELTYPES[kabel.type]?.brandklasse) return '';
  return standaard === 'geen' ? '' : standaard || STANDAARD_BRANDKLASSE;
}

/** Zoals in het AREI: "XVB Cca 3G2,5" (met de brandklasse als die gekend is). */
export function kabelTekst(kabel, standaard = STANDAARD_BRANDKLASSE) {
  if (kabel.tekst) return kabel.tekst;
  const t = KABELTYPES[kabel.type];
  if (t?.soort === 'draad') return `${kabel.type} ${kabel.aders}×${komma(kabel.sectie)}`;
  const klasse = brandklasse(kabel, standaard);
  return `${kabel.type}${klasse ? ` ${klasse}` : ''} ${kabel.aders}G${komma(kabel.sectie)}`;
}

export const automaatTekst = (a) => `${a.curve}${a.stroom}`;

/** Zoals Trikker het onder een automaat schrijft: "2P - C 16A". */
export const automaatLabel = (a) => `${a.polen}P - ${a.curve ? `${a.curve} ` : ''}${a.stroom}A`;

/** In/ΔIn zoals in het AREI, bv. "40/0,3A" voor 40 A en 300 mA. */
export const diffTekst = (d) => `${d.stroom}/${komma(d.gevoeligheid / 1000)}A`;

/** Naam van de variant van een onderdeel, zoals in de keuzelijst. */
function variantNaam(item) {
  const def = SOORTEN[item.soort];
  const veld = def?.velden.find((v) => v.pad === 'variant');
  return veld?.opties.find(([w]) => w === item.variant)?.[1] || '';
}

/** De naam van een onderdeel, zoals in de lijsten. */
export function itemNaam(item) {
  switch (item.soort) {
    case 'stopcontact': {
      const soort = ['Stopcontact', 'Dubbel stopcontact', 'Drievoudig stopcontact', 'Viervoudig stopcontact'][item.aantal - 1] || `${item.aantal}-voudig stopcontact`;
      return item.waterdicht ? `${soort} (halfwaterdicht)` : soort;
    }
    case 'lichtpunt': {
      let n = LICHTPUNTEN[item.variant]?.naam || 'Lichtpunt';
      if (item.nood && item.nood !== 'geen') n = item.variant === 'plafond' ? 'Noodverlichting' : `${n} met noodverlichting`;
      else if (item.wand) n = item.variant === 'plafond' ? 'Wandlicht' : `${n} (wand)`;
      return n + (item.aantal > 1 ? ` ×${item.aantal}` : '');
    }
    case 'schakelaar': {
      const n = item.dimmer ? 'Dimmer' : item.rolluik ? 'Rolluikschakelaar' : SCHAKELAARS[item.variant]?.naam || 'Schakelaar';
      return n + (item.aantal > 1 ? ` ×${item.aantal}` : '');
    }
    case 'toestel': return TOESTELLEN[item.variant]?.naam || 'Toestel';
    default: {
      const def = SOORTEN[item.soort];
      if (!def) return item.soort;
      if (item.soort === 'eigen') return item.omschrijving || def.naam;
      const v = variantNaam(item);
      return v && !/^(basis|niet gespecificeerd)/i.test(v) && v !== def.naam ? `${def.naam} (${v.toLowerCase()})` : def.naam;
    }
  }
}

/** Korte tekst, voor lijsten en het situatieschema. */
export function itemKort(item) {
  if (item.tekst) return item.tekst;
  switch (item.soort) {
    case 'stopcontact': return item.aantal > 1 ? `${item.aantal}× stopc.` : 'stopc.';
    case 'lichtpunt': return (LICHTPUNTEN[item.variant]?.kort || '') + (item.aantal > 1 ? ` ×${item.aantal}` : '');
    case 'schakelaar': return (SCHAKELAARS[item.variant]?.kort || '') + (item.aantal > 1 ? ` ×${item.aantal}` : '');
    case 'toestel': return TOESTELLEN[item.variant]?.naam || '';
    default: return itemNaam(item);
  }
}
