// Alles wat in een schema kan staan: keuzelijsten, onderdelen en hun standaardwaarden.

export const NETTEN = {
  '1F230': { naam: '1-fasig 230 V', polen: 2 },
  '3F230': { naam: '3-fasig 3×230 V', polen: 3 },
  '3N400': { naam: '3-fasig 3N 400 V', polen: 4 },
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
  XVB: { naam: 'XVB (kabel)', soort: 'kabel', klasse: 'Cca' },
  EXVB: { naam: 'EXVB (kabel, buiten/grond)', soort: 'kabel' },
  XGB: { naam: 'XGB (halogeenvrij)', soort: 'kabel' },
  VOB: { naam: 'VOB (draad in buis)', soort: 'draad' },
  'H07RN-F': { naam: 'H07RN-F (soepel)', soort: 'kabel' },
};

export const LICHTPUNTEN = {
  plafond: { naam: 'Lichtpunt plafond', kort: 'plafond' },
  wand: { naam: 'Wandlicht', kort: 'wand' },
  spot: { naam: 'Inbouwspot', kort: 'spot' },
  ledstrip: { naam: 'LED-strip', kort: 'LED' },
  tl: { naam: 'Lichtlijn / TL', kort: 'TL' },
  buiten: { naam: 'Buitenlicht', kort: 'buiten' },
  nood: { naam: 'Noodverlichting', kort: 'nood' },
};

export const SCHAKELAARS = {
  enkelpolig: { naam: 'Enkelpolige schakelaar', kort: 'enkelp.' },
  tweepolig: { naam: 'Tweepolige schakelaar', kort: 'tweep.' },
  wissel: { naam: 'Wisselschakelaar', kort: 'wissel' },
  kruis: { naam: 'Kruisschakelaar', kort: 'kruis' },
  serie: { naam: 'Serieschakelaar', kort: 'serie' },
  dimmer: { naam: 'Dimmer', kort: 'dimmer' },
  drukknop: { naam: 'Drukknop', kort: 'drukknop' },
  bewegingsmelder: { naam: 'Bewegingsmelder', kort: 'beweging' },
  rolluik: { naam: 'Rolluikschakelaar', kort: 'rolluik' },
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
  kookplaat: { naam: 'Kookplaat', kort: 'KP', eigenKring: true, aansluiting: 'vast', vermogen: 7400 },
  oven: { naam: 'Oven', kort: 'OV', eigenKring: true, aansluiting: 'stopcontact', vermogen: 3500 },
  microgolf: { naam: 'Microgolfoven', kort: 'MG', aansluiting: 'stopcontact', vermogen: 1500 },
  dampkap: { naam: 'Dampkap', kort: 'DA', aansluiting: 'stopcontact', vermogen: 300 },
  koelkast: { naam: 'Koelkast', kort: 'KK', aansluiting: 'stopcontact', vermogen: 200 },
  diepvries: { naam: 'Diepvriezer', kort: 'DV', aansluiting: 'stopcontact', vermogen: 200 },
  boiler: { naam: 'Boiler', kort: 'BO', eigenKring: true, aansluiting: 'vast', vermogen: 2400 },
  warmtepomp: { naam: 'Warmtepomp', kort: 'WP', eigenKring: true, aansluiting: 'vast', vermogen: 3000 },
  airco: { naam: 'Airco', kort: 'AC', eigenKring: true, aansluiting: 'vast', vermogen: 2500 },
  verwarming: { naam: 'Elektrische verwarming', kort: 'EV', aansluiting: 'vast', vermogen: 2000 },
  laadpaal: { naam: 'Laadpaal', kort: 'LP', eigenKring: true, aansluiting: 'vast', vermogen: 7400 },
  omvormer: { naam: 'Omvormer zonnepanelen', kort: 'PV', eigenKring: true, aansluiting: 'vast', vermogen: 4000 },
  ventilatie: { naam: 'Ventilatie', kort: 'VE', aansluiting: 'vast', vermogen: 100 },
  rolluikmotor: { naam: 'Rolluikmotor', kort: 'RL', aansluiting: 'vast', vermogen: 200 },
  poort: { naam: 'Poortmotor', kort: 'PM', aansluiting: 'vast', vermogen: 500 },
  bel: { naam: 'Bel', kort: 'BEL', aansluiting: 'vast', vermogen: 10 },
  beltransfo: { naam: 'Beltransformator', kort: 'TR', aansluiting: 'vast', vermogen: 10 },
  ander: { naam: 'Ander toestel', kort: '?', aansluiting: 'vast', vermogen: 0 },
};

export const AANSLUITINGEN = { stopcontact: 'Via stopcontact', vast: 'Vast aangesloten' };

/** Knoppen om snel iets aan een kring toe te voegen. */
export const PALET = [
  { soort: 'stopcontact', waarden: { aantal: 1 }, naam: 'Stopcontact' },
  { soort: 'stopcontact', waarden: { aantal: 2 }, naam: 'Dubbel stopcontact' },
  { soort: 'stopcontact', waarden: { aantal: 1, waterdicht: true }, naam: 'Waterdicht stopcontact' },
  { soort: 'lichtpunt', waarden: { variant: 'plafond' }, naam: 'Lichtpunt' },
  { soort: 'lichtpunt', waarden: { variant: 'wand' }, naam: 'Wandlicht' },
  { soort: 'lichtpunt', waarden: { variant: 'spot' }, naam: 'Spot' },
  { soort: 'lichtpunt', waarden: { variant: 'buiten' }, naam: 'Buitenlicht' },
  { soort: 'lichtpunt', waarden: { variant: 'nood' }, naam: 'Noodverlichting' },
  { soort: 'schakelaar', waarden: { variant: 'enkelpolig' }, naam: 'Schakelaar' },
  { soort: 'schakelaar', waarden: { variant: 'wissel' }, naam: 'Wisselschakelaar' },
  { soort: 'schakelaar', waarden: { variant: 'serie' }, naam: 'Serieschakelaar' },
  { soort: 'schakelaar', waarden: { variant: 'drukknop' }, naam: 'Drukknop' },
  { soort: 'schakelaar', waarden: { variant: 'dimmer' }, naam: 'Dimmer' },
  { soort: 'toestel', waarden: { variant: 'wasmachine' }, naam: 'Wasmachine' },
  { soort: 'toestel', waarden: { variant: 'droogkast' }, naam: 'Droogkast' },
  { soort: 'toestel', waarden: { variant: 'vaatwasser' }, naam: 'Vaatwasser' },
  { soort: 'toestel', waarden: { variant: 'kookplaat' }, naam: 'Kookplaat' },
  { soort: 'toestel', waarden: { variant: 'oven' }, naam: 'Oven' },
  { soort: 'toestel', waarden: { variant: 'koelkast' }, naam: 'Koelkast' },
  { soort: 'toestel', waarden: { variant: 'boiler' }, naam: 'Boiler' },
  { soort: 'toestel', waarden: { variant: 'laadpaal' }, naam: 'Laadpaal' },
  { soort: 'toestel', waarden: { variant: 'ander' }, naam: 'Ander toestel' },
  { soort: 'aftakdoos', waarden: {}, naam: 'Aftakdoos' },
];

/** Een getal zoals een elektricien het schrijft: 2,5 in plaats van 2.5. */
export const komma = (getal) => String(getal).replace('.', ',');

/** Zoals in het AREI: "XVB Cca 3G2,5" (met de brandklasse als die gekend is). */
export function kabelTekst(kabel) {
  const t = KABELTYPES[kabel.type];
  if (t?.soort === 'draad') return `${kabel.type} ${kabel.aders}×${komma(kabel.sectie)}`;
  return `${kabel.type}${t?.klasse ? ` ${t.klasse}` : ''} ${kabel.aders}G${komma(kabel.sectie)}`;
}

export const automaatTekst = (a) => `${a.curve}${a.stroom}`;

/** In/ΔIn zoals in het AREI, bv. "40/0,3A" voor 40 A en 300 mA. */
export const diffTekst = (d) => `${d.stroom}/${komma(d.gevoeligheid / 1000)}A`;

/** De naam van een onderdeel, zoals in de lijsten. */
export function itemNaam(item) {
  switch (item.soort) {
    case 'stopcontact': {
      const soort = ['Stopcontact', 'Dubbel stopcontact', 'Drievoudig stopcontact', 'Viervoudig stopcontact'][item.aantal - 1] || `${item.aantal}-voudig stopcontact`;
      return item.waterdicht ? `${soort} (waterdicht)` : soort;
    }
    case 'lichtpunt': return (LICHTPUNTEN[item.variant]?.naam || 'Lichtpunt') + (item.aantal > 1 ? ` ×${item.aantal}` : '');
    case 'schakelaar': return (SCHAKELAARS[item.variant]?.naam || 'Schakelaar') + (item.aantal > 1 ? ` ×${item.aantal}` : '');
    case 'toestel': return TOESTELLEN[item.variant]?.naam || 'Toestel';
    case 'aftakdoos': return 'Aftakdoos';
    default: return item.soort;
  }
}

/** Korte tekst onder de code in het ééndraadschema. */
export function itemKort(item) {
  if (item.tekst) return item.tekst;
  switch (item.soort) {
    case 'stopcontact': return item.aantal > 1 ? `${item.aantal}× stopc.` : 'stopc.';
    case 'lichtpunt': return (LICHTPUNTEN[item.variant]?.kort || '') + (item.aantal > 1 ? ` ×${item.aantal}` : '');
    case 'schakelaar': return (SCHAKELAARS[item.variant]?.kort || '') + (item.aantal > 1 ? ` ×${item.aantal}` : '');
    case 'toestel': return TOESTELLEN[item.variant]?.naam || '';
    case 'aftakdoos': return 'aftakdoos';
    default: return '';
  }
}
