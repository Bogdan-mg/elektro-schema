// De materiaallijst, rechtstreeks uit het ééndraadschema.
import { TOESTELLEN, KABELTYPES, SOORTEN, kabelTekst, komma, itemNaam } from './catalogus.js';
import { alleKnopen } from './model.js';

export const GROEPEN = ['Verdeelbord', 'Kabels en draad', 'Stopcontacten', 'Schakelaars', 'Verlichting', 'Toestellen', 'Beveiliging',
  'Alarm en detectie', 'Toegang', 'Communicatie', 'Sturing', 'Algemeen', 'Contactdozen', 'Dozen'];

const MEERVOUD = ['enkel', 'dubbel', 'drievoudig', 'viervoudig'];
const voudig = (n) => MEERVOUD[n - 1] || `${n}-voudig`;

function stopcontactNaam({ aantal, aarding, kinderveilig, waterdicht }) {
  const delen = [`Stopcontact ${voudig(aantal)}`];
  if (aarding) delen.push('met aarding');
  if (kinderveilig) delen.push('kinderveilig');
  if (waterdicht) delen.push('waterdicht opbouw (IP44)');
  return delen.join(', ');
}

const diffNaam = (d) => `Differentieel ${d.polen}P ${d.stroom} A ${d.gevoeligheid} mA type ${d.type}`;

/** De beveiliging van een groep of het hoofdbord, zoals die in het schema gekozen is. Geeft niets terug bij een rij. */
function beveiligingNaam(b) {
  switch (b.beveiliging) {
    case 'geen': return null;
    case 'automaat': return `Automaat ${b.polen}P ${b.curve || ''}${b.stroom}`.replace('  ', ' ');
    case 'diffautomaat': return `Differentieelautomaat ${b.polen}P ${b.curve || ''}${b.stroom} A ${b.gevoeligheid} mA type ${b.type}`.replace('  ', ' ');
    default: return diffNaam(b);
  }
}
const automaatNaam = (a) => `Automaat ${a.polen === 2 ? '1P+N' : `${a.polen}P`} ${a.curve}${a.stroom}`;

/** Modules op de DIN-rail: een 1P+N-automaat telt als 1 module. */
const automaatModules = (polen) => (polen === 2 ? 1 : polen);

/**
 * @returns {{ regels: {sleutel, groep, omschrijving, aantal, eenheid}[], modules: number }}
 */
export function materiaallijst(project, { marge = 10 } = {}) {
  const regels = new Map();
  const tel = (groep, omschrijving, aantal = 1, eenheid = 'st') => {
    if (!aantal) return;
    const sleutel = `${groep}|${omschrijving}`;
    const r = regels.get(sleutel) || { sleutel, groep, omschrijving, aantal: 0, eenheid };
    r.aantal += aantal;
    regels.set(sleutel, r);
  };
  const kabels = new Map();
  let modules = project.hoofd.beveiliging === 'geen' ? 0 : project.hoofd.polen;

  const hoofdNaam = beveiligingNaam(project.hoofd);
  if (hoofdNaam) tel('Verdeelbord', `${hoofdNaam} (hoofdschakelaar)`);
  if (project.hoofd.teller !== false) tel('Verdeelbord', 'kWh-teller');

  for (const { knoop } of alleKnopen(project)) {
    if (knoop.soort === 'differentieel') {
      const naam = beveiligingNaam(knoop);
      if (naam) {
        tel('Verdeelbord', naam);
        modules += knoop.polen;
      }
      continue;
    }
    const kring = knoop;
    tel('Verdeelbord', Number(kring.automaat.gevoeligheid) ? beveiligingNaam({ ...kring.automaat, beveiliging: 'diffautomaat' }) : automaatNaam(kring.automaat));
    modules += automaatModules(kring.automaat.polen);

    const lengte = Number(kring.kabel.lengte) || 0;
    if (lengte) {
      if (KABELTYPES[kring.kabel.type]?.soort === 'draad') {
        const k = `${kring.kabel.type} ${komma(kring.kabel.sectie)} mm²`;
        kabels.set(k, (kabels.get(k) || 0) + lengte * kring.kabel.aders);
        kabels.set('Buis', (kabels.get('Buis') || 0) + lengte);
      } else {
        const k = kabelTekst(kring.kabel);
        kabels.set(k, (kabels.get(k) || 0) + lengte);
      }
    }

    for (const item of kring.items) {
      switch (item.soort) {
        case 'stopcontact':
          tel('Stopcontacten', stopcontactNaam(item));
          if (!item.waterdicht) tel('Dozen', `Inbouwdoos ${item.aantal}-voudig`);
          break;
        case 'schakelaar':
          tel('Schakelaars', itemNaam({ ...item, aantal: 1 }) + (item.waterdicht ? ', halfwaterdicht' : ''), item.aantal);
          if (!item.waterdicht) tel('Dozen', `Inbouwdoos ${item.aantal}-voudig`);
          break;
        case 'drukknop':
          tel('Schakelaars', `Drukknop${item.knoppen > 1 ? ` ${item.knoppen}-voudig` : ''}${item.verklikker ? ' met verklikkerlamp' : ''}${item.waterdicht ? ', halfwaterdicht' : ''}`, item.aantal);
          if (!item.waterdicht) tel('Dozen', 'Inbouwdoos 1-voudig', item.aantal);
          break;
        case 'lichtpunt':
          tel('Verlichting', itemNaam({ ...item, aantal: 1 }) + (item.waterdicht ? ', halfwaterdicht' : ''), item.aantal);
          if (item.variant === 'plafond' && (!item.nood || item.nood === 'geen')) tel('Dozen', 'Centraaldoos (lichtpunt)');
          break;
        case 'nota':
          break;
        case 'toestel': {
          const t = TOESTELLEN[item.variant] || TOESTELLEN.ander;
          if (item.aansluiting === 'stopcontact') {
            tel('Stopcontacten', stopcontactNaam({ aantal: 1, aarding: true, kinderveilig: true, waterdicht: false }));
            tel('Dozen', 'Inbouwdoos 1-voudig');
          } else {
            tel('Toestellen', `Aansluitpunt ${t.naam.toLowerCase()}`);
            tel('Dozen', 'Aansluitdoos (vast toestel)');
          }
          break;
        }
        case 'aftakdoos':
          tel('Dozen', 'Aftakdoos');
          break;
        default:
          // Alle andere onderdelen uit de catalogus: per soort en variant.
          tel(SOORTEN[item.soort]?.groep || 'Algemeen', itemNaam(item), item.aantal || 1);
      }
    }
  }

  for (const [naam, meter] of kabels) {
    tel('Kabels en draad', naam, Math.ceil(meter * (1 + marge / 100)), 'm');
  }

  const lijst = [...regels.values()].sort((a, b) =>
    GROEPEN.indexOf(a.groep) - GROEPEN.indexOf(b.groep) || a.omschrijving.localeCompare(b.omschrijving, 'nl', { numeric: true }));
  return { regels: lijst, modules };
}

/** Als CSV voor Excel (met ; en een komma als decimaalteken, zoals Excel in België verwacht). */
export function naarCsv(regels, prijzen = {}) {
  const veld = (v) => (/[;"\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const bedrag = (n) => n.toFixed(2).replace('.', ',');
  const lijnen = [['Groep', 'Omschrijving', 'Aantal', 'Eenheid', 'Prijs per eenheid', 'Totaal'].join(';')];
  let totaal = 0;
  for (const r of regels) {
    const prijs = Number(prijzen[r.sleutel]) || 0;
    totaal += prijs * r.aantal;
    lijnen.push([r.groep, r.omschrijving, r.aantal, r.eenheid, prijs ? bedrag(prijs) : '', prijs ? bedrag(prijs * r.aantal) : ''].map(veld).join(';'));
  }
  if (totaal) lijnen.push(['', 'Totaal (excl. btw)', '', '', '', bedrag(totaal)].join(';'));
  return '﻿' + lijnen.join('\r\n') + '\r\n';
}
