// Controle van het schema op de belangrijkste AREI-regels voor woningen.
// Dit is een hulp bij het tekenen, geen vervanging van de keuring: kijk de regels zelf na.
import { TOESTELLEN, KABELTYPES } from './catalogus.js';
import { alleKringen, codes } from './model.js';

/** Grootste automaat per koperdoorsnede (mm²) voor huishoudelijke kringen. Pas aan als je legwijze dat vraagt. */
export const MAX_AUTOMAAT = { 1.5: 16, 2.5: 20, 4: 25, 6: 32, 10: 40, 16: 50, 25: 63, 35: 80 };
export const MAX_STOPCONTACTEN = 8;
export const MAX_AARDING = 30;
export const MAX_AARDING_ABSOLUUT = 100;

/** Telt als contactdoos: een (meervoudig) stopcontact, of een toestel dat via een stopcontact aangesloten is. */
const isContactdoos = (item) => item.soort === 'stopcontact' || (item.soort === 'toestel' && item.aansluiting === 'stopcontact');

/** Is dit een beveiliging met een differentieel van hoogstens 30 mA? Een gewone automaat telt niet. */
const isDertig = (b) => (b.beveiliging === 'differentieel' || b.beveiliging === 'diffautomaat') && Number(b.gevoeligheid) > 0 && Number(b.gevoeligheid) <= 30;

export function controleer(project) {
  const meldingen = [];
  const code = codes(project);
  const meld = (niveau, id, tekst) => meldingen.push({ niveau, id, tekst });
  const { aansluiting, hoofd } = project;

  const hoofdDiff = hoofd.beveiliging === 'differentieel' || hoofd.beveiliging === 'diffautomaat';
  if (hoofdDiff && hoofd.gevoeligheid > 300) {
    meld('fout', 'hoofd', `De hoofddifferentieel is ${hoofd.gevoeligheid} mA; dat mag hoogstens 300 mA zijn.`);
  }
  if (hoofdDiff && hoofd.stroom < aansluiting.hoofdzekering) {
    meld('waarschuwing', 'hoofd', `De hoofddifferentieel (${hoofd.stroom} A) is kleiner dan de hoofdzekering (${aansluiting.hoofdzekering} A).`);
  }
  const r = Number(aansluiting.aardingsweerstand) || 0;
  if (!r) {
    meld('info', 'hoofd', 'De aardingsweerstand is nog niet ingevuld.');
  } else if (r > MAX_AARDING_ABSOLUUT) {
    meld('fout', 'hoofd', `Aardingsweerstand ${r} Ω is te hoog (meer dan ${MAX_AARDING_ABSOLUUT} Ω).`);
  } else if (r > MAX_AARDING) {
    meld('waarschuwing', 'hoofd', `Aardingsweerstand ${r} Ω is meer dan ${MAX_AARDING} Ω: daarvoor zijn extra maatregelen nodig.`);
  }

  const kringen = alleKringen(project);
  if (!kringen.length) meld('info', 'hoofd', 'Er zijn nog geen kringen.');

  for (const { knoop: kring, ouders } of kringen) {
    const naam = `Kring ${code.get(kring.id)}${kring.naam ? ` (${kring.naam})` : ''}`;
    const dertig = ouders.some(isDertig) || isDertig({ ...kring.automaat, beveiliging: Number(kring.automaat.gevoeligheid) ? 'diffautomaat' : 'automaat' });

    if (!kring.items.length) meld('waarschuwing', kring.id, `${naam} heeft nog geen onderdelen.`);

    const max = MAX_AUTOMAAT[kring.kabel.sectie];
    if (max && kring.automaat.stroom > max) {
      meld('fout', kring.id, `${naam}: een automaat van ${kring.automaat.stroom} A is te groot voor ${String(kring.kabel.sectie).replace('.', ',')} mm² (max. ${max} A).`);
    }

    const contactdozen = kring.items.filter(isContactdoos).length;
    if (contactdozen > MAX_STOPCONTACTEN) {
      meld('fout', kring.id, `${naam} heeft ${contactdozen} stopcontacten; max. ${MAX_STOPCONTACTEN} per kring (een meervoudig stopcontact telt als één).`);
    }

    if (kring.badkamer && !dertig) {
      meld('fout', kring.id, `${naam} ligt in een badkamer of natte ruimte en moet achter een differentieel van 30 mA.`);
    }

    for (const item of kring.items) {
      const t = item.soort === 'toestel' ? TOESTELLEN[item.variant] : null;
      if (t?.dertig && !dertig) {
        meld('fout', item.id, `${code.get(item.id)} ${t.naam} moet achter een differentieel van 30 mA.`);
      }
      if (t?.eigenKring && kring.items.length > 1) {
        meld('waarschuwing', item.id, `${code.get(item.id)} ${t.naam} staat best op een eigen kring.`);
      }
    }

    if (kring.automaat.polen >= 3 && KABELTYPES[kring.kabel.type]?.soort !== 'draad' && kring.kabel.aders < kring.automaat.polen + 1) {
      meld('waarschuwing', kring.id, `${naam}: een ${kring.automaat.polen}-polige automaat met een kabel van ${kring.kabel.aders} aders; kijk na of er genoeg aders zijn.`);
    }

    if (!Number(kring.kabel.lengte)) {
      meld('info', kring.id, `${naam}: geen kabellengte ingevuld (nodig voor de materiaallijst).`);
    }
  }

  // Onderdelen die nog niet op een plan staan.
  const geplaatst = new Set(project.plannen.flatMap((p) => Object.keys(p.plaatsingen)));
  const niet = kringen.flatMap(({ knoop }) => knoop.items).filter((it) => !geplaatst.has(it.id));
  if (niet.length) {
    const voorbeeld = niet.slice(0, 6).map((it) => code.get(it.id)).join(', ');
    meld('info', niet[0].id, `${niet.length} onderdelen staan nog niet op het situatieschema (${voorbeeld}${niet.length > 6 ? ', …' : ''}).`);
  }
  if (kringen.length && !geplaatst.has('bord')) {
    meld('info', 'hoofd', 'Het verdeelbord staat nog niet op het situatieschema.');
  }

  const volgorde = { fout: 0, waarschuwing: 1, info: 2 };
  return meldingen.sort((a, b) => volgorde[a.niveau] - volgorde[b.niveau]);
}
