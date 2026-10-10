// Een project met alle onderdelen en hun varianten, zoals de symbolenlijst van Trikker.
// Handig om de symbolen te bekijken of af te drukken.
import { nieuwProject, nieuweKring, nieuwItem } from './model.js';

const kring = (naam, items, extra = {}) => nieuweKring({ naam, items, kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 0 }, automaat: { stroom: 16, curve: '', polen: 2 }, ...extra });
const reeks = (soort, lijst) => lijst.map((w) => nieuwItem(soort, w));

export function symbolenProject() {
  const p = nieuwProject();
  p.info = { ...p.info, titel: 'Symbolenoverzicht', klant: '', adres: '' };
  p.aansluiting = { ...p.aansluiting, net: '3N400', kabelNet: 'EXVB 4x10', kabelBord: 'XVB 5G10' };
  p.hoofd = { ...p.hoofd, polen: 4 };
  p.kinderen.push(
    kring('Aansluitpunt', reeks('aansluitpunt', [{}, { opschrift: '1.2.3' }])),
    kring('Aarding', reeks('aarding', [{}, { opschrift: '< 30Ω' }])),
    kring('Aardingsstrip', reeks('aardingsstrip', [{}])),
    kring('Aftakkast', reeks('aftakdoos', [{}])),
    kring('Automatische schakelaar', reeks('automaat', [
      {}, { polen: 4 }, { kortsluit: 3 }, { polen: 2, fase: 'L1' }, { selectief: true }, { gesloten: true },
      { variant: 'contact' }, { variant: 'schemer' }, { variant: 'draai' }, { variant: 'zekeringscheider' },
      { polen: 2, stroom: 22 }, { polen: 2, stroom: 22, curve: 'C' }, { polen: 2, stroom: 500, eenheid: 'mA' },
      { polen: 2, stroom: 40, gevoeligheid: 300 }, { polen: 2, stroom: 40, gevoeligheid: 300, maxstroom: true }, { polen: 2, adres: 'A.B.C' },
    ])),
    kring('Beveiliging', reeks('beveiliging', [{ variant: 'elektromagnetisch' }, { variant: 'thermisch' }])),
    kring('Beveiligingscontact', reeks('beveiligingscontact', [
      { aantal: 10 }, { adres: 'ZONE.01' }, { variant: 'magneet' }, { variant: 'mechanisch' }, { variant: 'schoot' },
      { variant: 'tril' }, { variant: 'drukmat' }, { variant: 'afneem' },
    ])),
    kring('Bewegingsdetector', reeks('bewegingsdetector', [
      {}, { radar: true }, { ultrasoon: true }, { radar: true, infrarood: true }, { variant: 'gespreid' },
      { variant: 'gericht' }, { variant: 'rondom' }, { aantal: 4 }, { adres: 'IR1' },
    ])),
    kring('Bewegingsdetector actief', reeks('bewegingsdetectorActief', [{}, { adres: 'Zone.02' }, { aantal: 6 }])),
    kring('Boiler', reeks('boiler', [{}, { accumulatie: true }, { adres: 'BOILER1' }])),
    kring('Branddetector', reeks('branddetector', [
      { variant: 'onbepaald' }, { variant: 'rook' }, { variant: 'vlam' }, { variant: 'warmte' }, { variant: 'gas' },
      { variant: 'straal' }, { variant: 'manueel' }, { variant: 'rook', aantal: 5 }, { variant: 'rook', adres: 'R4.2' },
    ])),
    kring('Camera', reeks('camera', [
      {}, { beweegbaar: true }, { beweegdetectie: true }, { discreet: true }, { variant: 'dome' }, { variant: 'behuizing' },
      { variant: 'dome', discreet: true, beweegbaar: true }, { aantal: 5 }, { adres: 'CAM ZONE2' },
    ])),
    kring('Contactdoos', reeks('stopcontact', [
      {}, { aantal: 3 }, { waterdicht: true }, { kinderveilig: false }, { opschrift: '32A' }, { aarding: false },
      { schakelaar: 'dubbel' }, { transformator: true }, { fasen: 3, nul: true, pe: true }, { fasen: 3, nul: true },
      { fasen: 3 }, { fasen: 1, nul: true, pe: true }, { fasen: 1, nul: true }, { adres: 'Adres.X' },
    ]), { automaat: { stroom: 20, curve: '', polen: 2 } }),
    kring('Contactdoos communicatie', reeks('communicatie', [{}, { opschrift: 'UTP Cat6' }]), { automaat: { stroom: 20, curve: '', polen: 2 } }),
    kring('Deurslot', reeks('deurslot', [{}, { adres: 'LCK.03' }, { aantal: 2 }]), { automaat: { stroom: 20, curve: '', polen: 2 } }),
    kring('Domoticamodule', reeks('domotica', [{}, { module: 'BTicino' }, { module: 'Domotica', uitgangen: 'O.1, O.2' }])),
    kring('Drukknop', reeks('drukknop', [
      {}, { afgeschermd: true }, { waterdicht: true }, { verklikker: true }, { rolluik: true }, { dimmer: true }, { knoppen: 4 },
      { verklikker: true, waterdicht: true, afgeschermd: true, aantal: 7 }, { aantal: 5 }, { adres: 'ADR.03' },
    ])),
    kring('Geluidsbron', reeks('geluidsbron', [
      { variant: 'bel' }, { variant: 'zoemer' }, { variant: 'hoorn' }, { variant: 'sirene' }, { autonoom: true }, { aantal: 3 }, { adres: 'Bel 4' },
    ])),
    kring('Intercom', reeks('intercom', [{}, { aantal: 2 }, { adres: 'INTER 3' }])),
    kring('Ketel', reeks('ketel', [
      {}, { energie: 'vast' }, { energie: 'vloeibaar' }, { energie: 'gasAtmosferisch' }, { energie: 'gasVentilator' }, { energie: 'elektriciteit' },
      { variant: 'boiler' }, { variant: 'tapspiraal' }, { variant: 'warmtewisselaar' }, { variant: 'wkk' },
      { functie: 'verwarmend' }, { functie: 'koelend' }, { functie: 'beide' },
      { variant: 'warmtewisselaar', energie: 'elektriciteit', functie: 'beide', tekst: 'warmtepomp' },
      { variant: 'wkk', energie: 'gasVentilator', functie: 'verwarmend' }, { aantal: 3 }, { adres: 'KET1' },
    ])),
    kring('Kiezer', reeks('kiezer', [{}, { aantal: 2 }, { adres: 'DIAL-X' }])),
    kring('Lichtpunt', reeks('lichtpunt', [
      {}, { waterdicht: true }, { nood: 'centraal' }, { nood: 'decentraal' }, { schakelaar: true }, { wand: true },
      { variant: 'tl' }, { variant: 'tl', buizen: 3 }, { variant: 'tl', nood: 'centraal' }, { variant: 'tl', nood: 'decentraal' },
      { variant: 'tl', wand: true }, { variant: 'spot' }, { variant: 'led' }, { variant: 'signalisatie' },
      { variant: 'tl', buizen: 3, nood: 'centraal', aantal: 11 }, { aantal: 3 }, { adres: 'ADR.01' },
    ])),
    kring('Luidspreker', reeks('luidspreker', [{}, { aantal: 4 }, { adres: 'FL' }])),
    kring('Microfoon', reeks('microfoon', [{}, { selectief: true }, { aantal: 4 }, { adres: 'MIC1' }])),
    kring('Monitor', reeks('monitor', [{}, { aantal: 2 }, { adres: 'Monitor 5' }])),
    kring('Motor', reeks('motor', [{}, { opschrift: 'V' }, { adres: 'ABC.123' }])),
    kring('Nota', reeks('nota', [{ opschrift: 'Tekstgrootte = 2' }, { opschrift: 'Tekstgrootte = 3', grootte: 3 }])),
    kring('Omvormer', reeks('omvormer', [{}, { adres: 'S/N 12345678' }])),
    kring('Overspanningsbeveiliging', reeks('overspanning', [{}, { opschrift: '2L + PE' }])),
    kring('Pomp', reeks('pomp', [{}, { aantal: 2 }, { adres: 'P.01' }])),
    kring('Relais', reeks('relais', [
      { variant: 'basis' }, { variant: 'minuterie' }, { variant: 'tijd' }, { variant: 'impuls' }, { variant: 'thermostaat' },
      { variant: 'dimmer' }, { variant: 'relais' }, { adres: 'ADR.02' },
    ])),
    kring('Schakelaar', reeks('schakelaar', [
      {}, { variant: 'onbepaald' }, { variant: 'tweepolig' }, { variant: 'vierpolig' }, { dimmer: true }, { waterdicht: true },
      { rolluik: true }, { signalisatie: true }, { trek: true }, { variant: 'wissel' }, { variant: 'dubbelewissel' },
      { variant: 'kruis' }, { variant: 'serie' }, { verklikker: true }, { vertraagd: true },
      { variant: 'wissel', verklikker: true, waterdicht: true, trek: true }, { adres: 'S1' },
    ])),
    kring('Slot', reeks('slot', [{ variant: 'code' }, { variant: 'inschakel' }, { variant: 'tijd' }, { aantal: 7 }, { adres: 'X.Y.Z' }])),
    kring('Smeltveiligheid', reeks('smeltveiligheid', [
      {}, { polen: 2 }, { stroom: 10 }, { stroom: 500, eenheid: 'mA' }, { fase: 'L3' }, { opschrift: 'XXX' },
    ])),
    kring('Teller', reeks('teller', [{}, { opschrift: 'h' }])),
    kring('Toestel', reeks('toestel', [
      'ander', 'kookplaat', 'microgolf', 'oven', 'wasmachine', 'droogkast', 'vaatwasser', 'koelkast', 'diepvries', 'ventilatie', 'stoomoven',
    ].map((variant) => ({ variant, aansluiting: 'vast' })).concat([{ variant: 'ander', aansluiting: 'vast', adres: 'ToestelX' }])), { automaat: { stroom: 20, curve: '', polen: 2 } }),
    kring('Toestel (klein)', reeks('toestelKlein', [{}, { opschrift: 'C', tekst: '(=> Alarmcentrale)' }, { aantal: 10 }, { adres: 'T7.1' }])),
    kring('Transformator', reeks('transformator', [
      {}, { bescherming: true }, { kortsluitvast: true }, { veiligheid: 'open' }, { veiligheid: 'gesloten' }, { opschrift: '24V DC' },
      { veiligheid: 'gesloten', kortsluitvast: true, bescherming: true, opschrift: '12V' },
    ])),
    kring('Trillingsdetector', reeks('trillingsdetector', [{ variant: 'glasbreuk' }, { variant: 'mechanisch' }, { actief: true }, { aantal: 3 }, { adres: 'X.Y.Z' }])),
    kring('Ventiel', reeks('ventiel', [{}, { motor: false }, { aantal: 2 }, { adres: 'VENT_01' }])),
    kring('Verwarmingstoestel', reeks('verwarmingstoestel', [{}, { accumulatie: true }, { accumulatie: true, ventilator: true }, { adres: 'AA.007' }]), { automaat: { stroom: 20, curve: '', polen: 2 } }),
    kring('Voorschakelapparaat', reeks('voorschakelapparaat', [{}])),
    kring('Zonnepaneel', reeks('zonnepaneel', [{}, { gestandaardiseerd: true }, { aantal: 15 }])),
    kring('Kring met vaste letter', [], { letter: 'XYZ', kabel: { type: 'VOB', aders: 3, sectie: 2.5, lengte: 0 } }),
  );
  return p;
}
