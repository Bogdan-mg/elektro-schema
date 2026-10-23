// Schema's (boomstructuren zoals Trikker ze opbouwt) om de nabouw van de ééndraadschema-layout mee te vergelijken.
// Een knoop is { k: klasse, p: eigenschappen, c: kinderen, s: satellieten }.
export const N = (k, p, ...c) => ({ k, ...(p && Object.keys(p).length ? { p } : {}), ...(c.length ? { c } : {}) });

/** Een kabel zoals Trikker hem toont: type, aders en doorsnede. */
export const kabel = (p = {}, ...c) => N('Leiding', { GeleiderType: 'XVB', Brandklasse: 'Cca', AantalGeleiders: 3, GeleiderDoorsnede: '2,5', Plaatsing: 'InWand', ...p }, ...c);
export const automaat = (stroom, p = {}, ...c) => N('AutomatischeSchakelaar', { AantalPolen: 'Dubbelpolig', Uitschakelcurve: 'C', NominaleStroomsterkte: stroom, Kortsluitstroom: '3000', ...p }, ...c);
export const diff = (ma, stroom, p = {}, ...c) => N('AutomatischeSchakelaar', {
  AantalPolen: 'Dubbelpolig', NominaleStroomsterkte: stroom, VerliesStroomsterkte: ma, VerliesstroomschakelaarType: 'Type A', VerliesstroomschakelaarNummeren: 'Ja', ...p,
}, ...c);
export const bord = (p = {}, ...c) => N('Verdeelbord', p, ...c);
export const start = (...c) => N('StartNode', {}, ...c);

const lamp = (p = {}, ...c) => N('Lichtpunt', { Type: 'NietGespecifieerd', ...p }, ...c);
const schakelaar = (p = {}, ...c) => N('Schakelaar', p, ...c);
const stopcontact = (p = {}, ...c) => N('Contactdoos', { Aantal: 'Een', ...p }, ...c);

/** De voeding: aansluitklem, kabel, teller, kabel, hoofdbeveiliging, en dan het bord. */
const voeding = (...bordKinderen) => start(
  N('Aansluitklem', { Tekst: '' },
    kabel({ GeleiderType: 'EXVB', AantalGeleiders: 4, GeleiderDoorsnede: '16' },
      N('Teller', {},
        kabel({ GeleiderType: 'XVB', AantalGeleiders: 4, GeleiderDoorsnede: '10' },
          diff(300, 40, { Kortsluitstroom: '10000' }, bord({}, ...bordKinderen)))))),
);

const schakelaarsRij = () => kabel({}, schakelaar({}, lamp({}), lamp({})), schakelaar({}, lamp({})), lamp({ Type: 'Spot' }));

export const SCHEMAS = [
  {
    naam: 'eenvoudig',
    opties: { marge: 25, naamKring: true },
    boom: start(bord({}, automaat(16, { NaamKring: 'Verlichting' }, kabel({ AantalGeleiders: 3, GeleiderDoorsnede: '1,5' }, lamp(), lamp(), schakelaar())), automaat(20, {}, kabel({}, stopcontact(), stopcontact())))),
  },
  {
    naam: 'woning-8-kringen',
    opties: { marge: 25, naamKring: true },
    boom: voeding(
      N('Aardingsstrip'),
      automaat(16, { NaamKring: 'Verlichting gelijkvloers' }, schakelaarsRij()),
      automaat(16, { NaamKring: 'Verlichting verdieping' }, kabel({ GeleiderDoorsnede: '1,5' }, schakelaar({}, lamp()), schakelaar({}, lamp(), lamp()), lamp())),
      automaat(20, { NaamKring: 'Stopcontacten living' }, kabel({}, stopcontact({ Aantal: 'Twee' }), stopcontact({ Aantal: 'Een' }), stopcontact({ Aantal: 'Twee' }), stopcontact())),
      automaat(20, { NaamKring: 'Stopcontacten keuken' }, kabel({}, stopcontact({ Aantal: 'Twee' }), stopcontact({ Aantal: 'Twee' }), N('Toestel', { Type: 'Koelkast' }))),
      automaat(20, { NaamKring: 'Vaatwasser' }, kabel({}, N('Toestel', { Type: 'Vaatwasmachine' }))),
      automaat(32, { NaamKring: 'Kookplaat', AantalPolen: 'Dubbelpolig' }, kabel({ GeleiderDoorsnede: '6' }, N('Toestel', { Type: 'Kookfornuis' }))),
      automaat(16, { NaamKring: 'Wasmachine' }, kabel({}, N('Toestel', { Type: 'Wasmachine' }), N('Toestel', { Type: 'Droogkast' }))),
      automaat(10, { NaamKring: 'Boiler' }, kabel({ AantalGeleiders: 3, GeleiderDoorsnede: '1,5' }, N('Boiler', {}))),
    ),
  },
];
