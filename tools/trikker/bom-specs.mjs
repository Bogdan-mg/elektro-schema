// Maakt de gevallen (een regel per knoop) waarmee de materiaallijst van Trikker en die van deze app vergeleken worden.
// Uitvoer op stdout: "Klasse;Eigenschap=Waarde;..." voor de C#-proefopstelling (zie LEESMIJ.md), met per klasse alle waarden
// van elke eigenschap (een voor een) en een vaste steekproef van de combinaties.
const JN = ['Nee', 'Ja'];
const AANTAL = ['Een', 'Twee', 'Drie', 'Vier', 'Vijf', 'Zes'];
const POLEN = ['NietGespecifieerd', 'Enkelpolig', 'Dubbelpolig', 'Driepolig', 'Vierpolig'];
const A12 = [1, 2, 4];

export const DIMENSIES = {
  Aansluitklem: {}, Aansluitpunt: {}, Aarding: {}, Aardingsstrip: {}, Aftakkast: {}, Omvormer: {}, Voorschakelapparaat: {}, Verdeelbord: {}, VerdeelbordGrondplan: {},
  ContactdoosCommunicatie: {},
  AutomatischeSchakelaar: {
    Type: ['Automaat', 'Schemerschakelaar', 'Contact', 'Draaischakelaar', 'Zekeringscheider'], VerliesStroomsterkte: [0, 30, 300], NominaleStroomsterkte: [0, 16, 40],
    MaximumstroomBeveiliging: JN, VerliesstroomschakelaarType: ['', 'Type A'], Kortsluitstroom: ['', '3000', '6kA'], AantalPolen: POLEN,
    Uitschakelcurve: ['NietGespecifieerd', 'B', 'C', 'D', 'F', 'K', 'MA', 'Z'], StroomsterkteEenheid: ['A', 'mA'], Selectief: JN, NormaalGesloten: JN,
  },
  Batterij: { Aantal: A12 },
  Beveiliging: { Type: ['Thermisch', 'Elektromagnetisch'] },
  Beveiligingscontact: { Type: ['Magneetcontact', 'MechanischContact', 'Schootcontact', 'Trilcontact', 'Drukmat', 'Afneemcontact'], Aantal: A12 },
  Bewegingsdetector: { Type: ['Gericht', 'Gespreid', 'Rondom', 'Algemeen'], Infrarood: JN, Ultrasoon: JN, Radar: JN, Aantal: A12 },
  BewegingsdetectorActief: { Aantal: A12 },
  Boiler: { Accumulatie: JN },
  Branddetector: { Type: ['NietGespecifieerd', 'Rookdetector', 'Vlamdetector', 'Warmtedetector', 'Gasdetector', 'Straaldetector', 'Manueel'], Aantal: A12 },
  Camera: { Type: ['NietGespecifieerd', 'InBehuizing', 'DomeCamera'], Discreet: JN, Beweegbaar: JN, Beweegdetectie: JN, Aantal: A12 },
  Contactdoos: {
    HalfWaterdicht: JN, IngebouwdeSchakelaar: POLEN, IngebouwdeTransformator: JN, Kinderbescherming: JN, InBord: JN,
    AantalFasen: ['NietGespecifieerd', 'Een', 'Twee', 'Drie'], Nulgeleider: JN, Beschermingsgeleider: JN, Aantal: AANTAL,
  },
  CustomNode: { BomOmschrijving: ['', 'Mijn symbool'], Aantal: A12 },
  Deurslot: { Aantal: A12 },
  DomoticaModule: { SymboolIngang: ['Geen', 'AC', 'DC'], SymboolUitgangen: ['Geen', 'AC', 'DC'], NaamModule: ['', 'DM1'] },
  Drukknop: { AantalKnoppen: A12, Rolluikdrukknop: JN, HalfWaterdicht: JN, Dimmer: JN, Afgeschermd: JN, Verklikkerlamp: JN, Aantal: [1, 3] },
  Geluidsbron: { Type: ['Bel', 'Zoemer', 'Hoorn', 'Sirene'], Autonoom: JN, Aantal: A12 },
  Intercom: { Aantal: A12 }, Kiezer: { Aantal: A12 }, Luidspreker: { Aantal: A12 }, Monitor: { Aantal: A12 }, Motor: { Aantal: A12 }, Pomp: { Aantal: A12 },
  Touchscreen: { Aantal: A12 }, Ventiel: { Aantal: A12 }, Zonnepaneel: { Aantal: A12 },
  ToestelKlein: { Tekst: ['', 'WP'], Aantal: A12 },
  Ketel: {
    Type: ['NietGespecifieerd', 'KetelMetBoiler', 'KetelMetTapspiraal', 'Warmtewisselaar', 'Warmtekrachtkoppeling'],
    Energiebron: ['NietGespecifieerd', 'VasteBrandstof', 'VloeibareBrandstof', 'GasAtmosferisch', 'GasVentilator', 'Elektriciteit'],
    WarmteFunctie: ['NietGespecifieerd', 'Verwarmend', 'Koelend', 'VerwarmendKoelend'], Aantal: A12, ToonOpBom: JN,
  },
  Lichtpunt: {
    Type: ['NietGespecifieerd', 'TL', 'Spot', 'LED', 'LEDStrip', 'Signalisatielamp'], NoodverlivhtingType: ['Nee', 'Centraal', 'Decentraal'],
    AantalBuislampen: ['NietGespecifieerd', 'Een', 'Twee', 'Drie', 'Vier'], HalfWaterdicht: JN, Wandverlichting: JN, IngebouwdeSchakelaar: JN,
    IngebouwdeSensor: ['Geen', 'Infrarood'], Aantal: [1, 4],
  },
  Microfoon: { Selectief: JN, Aantal: A12 },
  Nota: { Tekst: ['', 'abc'], ToonOpBom: JN },
  Overspanningsbeveiliging: { Type: ['Vonkbrug', 'Bliksembeveiliging'] },
  Relais: { Type: ['NietGespecifieerd', 'Minuterie', 'Tijdschakelaar', 'Impulsschakelaar', 'Thermostaat', 'Dimmer', 'Relais'] },
  Schakelaar: {
    Type: ['Gewoon', 'Wissel', 'Kruis', 'DubbeleAansteking', 'DubbeleWissel'], AantalPolen: POLEN, HalfWaterdicht: JN, InBord: JN, Dimmer: JN, Trekschakelaar: JN,
    Rolluikschakelaar: JN, VertraagdeOpening: JN, Verklikkerlamp: JN, Signalisatielamp: JN,
  },
  Slot: { Type: ['Codeslot', 'Inschakelslot', 'Tijdslot'], Aantal: A12 },
  Smeltveiligheid: { Type: ['', 'gG'], NominaleStroomsterkte: [0, 16], StroomsterkteEenheid: ['A', 'mA'], AantalPolen: POLEN },
  Toestel: { Type: ['NietGespecifierd', 'Kookfornuis', 'Microgolfoven', 'ElektrischeOven', 'Wasmachine', 'Droogkast', 'Vaatwasmachine', 'Koelkast', 'Diepvriezer', 'Ventilator', 'Stoomoven', 'LaadpuntAuto', 'LaadpuntAuto2'] },
  Teller: { Tekst: ['kWh', '', 'Dag/nacht'] },
  Transformator: { Veiligheidstransformator: ['Nee', 'Open', 'Gesloten'], Beschermingstransformator: JN, Kortsluitvast: JN },
  Trillingsdetector: { Type: ['Glasbreuk', 'Mechanisch'], Actief: JN, Aantal: A12 },
  Verwarmingstoestel: { Accumulatie: JN, Ventilator: JN },
  Leiding: { GeleiderType: ['', 'XVB'], Brandklasse: ['', 'Cca', 'B2ca'], AantalGeleiders: [0, 3], GeleiderDoorsnede: ['', '2,5'], Beschermingsgeleider: JN },
};

// Vaste pseudowillekeur, zodat de gevallen bij elke run dezelfde zijn.
function maakWillekeur(zaad) {
  let a = zaad;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gevallen(maxPerKlasse = 150) {
  const uit = [];
  const wil = maakWillekeur(20241);
  for (const [klasse, dims] of Object.entries(DIMENSIES)) {
    const namen = Object.keys(dims);
    const regel = (waarden) => [klasse, ...namen.map((n, i) => (waarden[i] === undefined ? null : `${n}=${waarden[i]}`)).filter(Boolean)].join(';');
    const gezien = new Set();
    const voeg = (waarden) => { const r = regel(waarden); if (!gezien.has(r)) { gezien.add(r); uit.push(r); } };
    voeg([]);
    // Elke waarde van elke eigenschap apart (de rest op de beginwaarde)
    namen.forEach((n, i) => dims[n].forEach((w) => { const x = []; x[i] = w; voeg(x); }));
    // Combinaties: alles als het kan, anders een vaste steekproef
    const totaal = namen.reduce((p, n) => p * dims[n].length, 1);
    if (!namen.length) continue;
    if (totaal <= maxPerKlasse) {
      for (let k = 0; k < totaal; k++) {
        let rest = k;
        voeg(namen.map((n) => { const l = dims[n].length; const w = dims[n][rest % l]; rest = Math.floor(rest / l); return w; }));
      }
    } else {
      for (let k = 0; k < maxPerKlasse; k++) voeg(namen.map((n) => dims[n][Math.floor(wil() * dims[n].length)]));
    }
  }
  return uit;
}

/** Documenten: meerdere knopen onder een startknoop, gesorteerd zoals BomScreen (DOC|spec|spec|...). */
export function documenten() {
  const wil = maakWillekeur(7);
  const alle = gevallen(20).filter((s) => !s.startsWith('Leiding') || true);
  const uit = [];
  for (let d = 0; d < 60; d++) {
    const n = 4 + Math.floor(wil() * 14);
    const delen = [];
    for (let i = 0; i < n; i++) delen.push(alle[Math.floor(wil() * alle.length)]);
    uit.push(`DOC|${delen.join('|')}`);
  }
  return uit;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const g of [...gevallen(), ...documenten()]) console.log(g);
}
