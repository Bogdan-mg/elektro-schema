// Wat sommige klassen van Trikker anders doen dan de basisklasse Node, voor de lay-out van het ééndraadschema:
// verbindingspunten (InPointLocalSpace, OutPointsLocalSpace), extra ruimte rond het symbool (WorldAreaMargin)
// en of een onderdeel een nieuwe kring of subkring begint.
import { f, PI2 } from './vec.js';

/** De klassen die IDomotica zijn: ze hebben een adres en reserveren daar ruimte voor. */
export const DOMOTICA = new Set([
  'Aftakkast', 'AutomatischeSchakelaar', 'Beveiligingscontact', 'Bewegingsdetector', 'BewegingsdetectorActief', 'Boiler', 'Branddetector',
  'Camera', 'Contactdoos', 'CustomNode', 'Deurslot', 'Drukknop', 'Geluidsbron', 'Intercom', 'Ketel', 'Kiezer', 'Lichtpunt', 'Luidspreker',
  'Microfoon', 'Monitor', 'Motor', 'Omvormer', 'Pomp', 'Relais', 'Schakelaar', 'Slot', 'Toestel', 'ToestelKlein', 'Touchscreen',
  'Transformator', 'Trillingsdetector', 'Ventiel', 'Verwarmingstoestel',
]);

const AANTAL = { NietGespecifieerd: 0, Een: 1, Twee: 2, Drie: 3, Vier: 4, Vijf: 5, Zes: 6 };
const aantal = (n) => Number(n.Aantal) || 0;

export const HAKEN = {
  StartNode: { begintNieuweKring: () => false },
  Aarding: {
    inPoint: (n) => ({ x: 0, y: f(f(0 - n.Height) / 2), r: PI2 }),
    begintNieuweKring: () => false,
  },
  Aardingsstrip: { begintNieuweKring: () => false },
  Verdeelbord: {
    outPoint: () => ({ x: 0, y: 0, r: 0 }),
    begintNieuweSubKring: () => false,
  },
  Nota: { begintNieuweSubKring: () => false },
  Leiding: { begintNieuweSubKring: (k) => k.ouder?.klasse === 'DomoticaModule' },
  Aansluitklem: { begintNieuweSubKring: (k) => (k.sym.StartSubkring === 'Automatisch' ? k.basisBegintNieuweSubKring : false) },
  AutomatischeSchakelaar: {
    begintNieuweKring: (k) => (Number(k.sym.VerliesStroomsterkte) > 0 ? k.sym.VerliesstroomschakelaarNummeren === 'Ja' : k.basisBegintNieuweKring),
    marge: (n, m) => {
      const regels = n.tekstRegels().length;
      if (regels > 0) {
        m.bottom = f(m.bottom + f(2.5 * (regels - 1)));
        if (n.NormaalGesloten === 'Ja') m.bottom = f(m.bottom + 2);
      }
    },
  },
  Contactdoos: {
    outPoint: (n) => {
      const nr = Math.max(1, AANTAL[n.Aantal] ?? 0);
      let x = f(f(f(0 - n.Width) / 2) + f(3 * nr) + 2);
      if ((n.AantalFasen && n.AantalFasen !== 'NietGespecifieerd') || n.Nulgeleider === 'Ja') x = f(x + 6);
      if (n.IngebouwdeTransformator === 'Ja') x = f(x + 3);
      return { x, y: 0, r: 0 };
    },
  },
  ContactdoosCommunicatie: { outPoint: () => ({ x: 0, y: 0, r: 0 }) },
  DomoticaModule: {
    inPoint: (n) => ({ x: f(f(0 - n.Width) / 2), y: f(f(f(0 - n.Height) / 2) + 10), r: 0 }),
    outPoint: (n) => ({ x: f(n.Width / 2), y: f(f(f(0 - n.Height) / 2) + 10), r: 0 }),
    begintNieuweSubKring: (k) => k.sym.Nummeren === 'Ja',
  },
  Overspanningsbeveiliging: {
    inPoint: (n) => ({ x: f(f(0 - n.Width) / 2), y: 5, r: 0 }),
    outPoint: (n) => ({ x: f(n.Width / 2), y: 5, r: 0 }),
  },
  Lichtpunt: {
    outPoint: (n) => {
      let num = f(n.Width / 2);
      if (n.IngebouwdeSensor !== 'Geen') num = Math.max(4, num);
      return { x: num, y: 0, r: 0 };
    },
    marge: (n, m) => {
      const sensor = n.IngebouwdeSensor !== 'Geen';
      const wand = n.Wandverlichting === 'Ja';
      if (sensor) {
        if (n.Type === 'TL') m.bottom = f(m.bottom + f(f(Math.max(1, n.aantalBuislampen()) - 1) * 0.75));
        else if (n.Type === 'LEDStrip') m.bottom = f(m.bottom + (wand ? 2 : 1.5));
        else m.bottom = f(m.bottom + (wand ? 1.5 : 0.5));
      }
      if (n.Type === 'LEDStrip' && ((n.NoodverlivhtingType && n.NoodverlivhtingType !== 'Nee') || n.HalfWaterdicht === 'Ja')) m.top = f(m.top + 1);
      if (aantal(n) > 1) {
        if (n.Type === 'LEDStrip') m.top = f(m.top + 2);
        else if (n.Type === 'LED') m.top = f(m.top + 1);
        else if (n.Type === 'NietGespecifieerd' || n.Type === 'Spot' || n.Type === 'Signalisatielamp') m.top = f(m.top + 0.5);
      }
    },
  },
  Ketel: { marge: (n, m) => { if (aantal(n) > 1 || n.Type === 'Warmtewisselaar') m.top = f(m.top + 3); } },
  Motor: { marge: (n, m) => { if (aantal(n) > 1) m.top = f(m.top + 3); } },
  Pomp: { marge: (n, m) => { if (aantal(n) > 1) m.top = f(m.top + 3); } },
  ToestelKlein: { marge: (n, m) => { if (aantal(n) > 1) m.top = f(m.top + 2); } },
  Smeltveiligheid: {
    marge: (n, m) => {
      const t = n.tekst();
      if (t) {
        m.bottom = f(m.bottom + 2);
        if (t.includes('\n')) m.bottom = f(m.bottom + 2);
      }
    },
  },
};
