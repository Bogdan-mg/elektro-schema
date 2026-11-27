// Controle van het schema op de belangrijkste AREI-regels voor woningen.
// Dit is een hulp bij het tekenen, geen vervanging van de keuring: kijk de regels zelf na.
//
// Elke melding is { niveau, id, tekst } en, als ze over een kring of een onderdeel ervan gaat, ook { kring }:
// het id van die kring. Zo kan een kring ook de meldingen over zijn onderdelen tonen.
import { TOESTELLEN, KABELTYPES, komma } from './catalogus.js';
import { alleKringen, alleKnopen, codes } from './model.js';

/** Grootste automaat per koperdoorsnede (mm²) voor huishoudelijke kringen. Pas aan als je legwijze dat vraagt. */
export const MAX_AUTOMAAT = { 1.5: 16, 2.5: 20, 4: 25, 6: 32, 10: 40, 16: 50, 25: 63, 35: 80 };
export const MAX_STOPCONTACTEN = 8;
export const MAX_AARDING = 30;
export const MAX_AARDING_ABSOLUUT = 100;
/** Gevoeligheid (mA) van de algemene differentieel van een woning: hoogstens zoveel. */
export const MAX_HOOFD_GEVOELIGHEID = 300;

/** Telt als contactdoos: een (meervoudig) stopcontact, of een toestel dat via een stopcontact aangesloten is. */
const isContactdoos = (item) => item.soort === 'stopcontact' || (item.soort === 'toestel' && item.aansluiting === 'stopcontact');
/** Hoeveel contactdozen: een meervoudig stopcontact telt als één, elk toestel via een stopcontact heeft er een. */
const contactdozenVan = (item) => (item.soort === 'stopcontact' ? 1 : Math.max(1, Number(item.aantal) || 1));

/** Is dit een differentieel (of differentieelautomaat) met een ingevulde gevoeligheid? */
const isDiff = (b) => (b.beveiliging === 'differentieel' || b.beveiliging === 'diffautomaat') && Number(b.gevoeligheid) > 0;
/** Is dit een beveiliging met een differentieel van hoogstens 30 mA? Een gewone automaat telt niet. */
const isDertig = (b) => isDiff(b) && Number(b.gevoeligheid) <= 30;
/** Beschermt deze differentieel tegen onrechtstreekse aanraking in een woning (hoogstens 300 mA)? */
const isBeschermend = (b) => isDiff(b) && Number(b.gevoeligheid) <= MAX_HOOFD_GEVOELIGHEID;

/** De automaat van een kring als beveiliging: met een gevoeligheid is het een differentieelautomaat. */
const kringBeveiliging = (kring) => ({ ...kring.automaat, beveiliging: Number(kring.automaat.gevoeligheid) ? 'diffautomaat' : 'automaat' });

/** De gegevens van een toestel uit de catalogus; ook het aparte symbool "boiler" telt als boiler. */
const toestelVan = (item) => (item.soort === 'toestel' ? TOESTELLEN[item.variant] : item.soort === 'boiler' ? TOESTELLEN.boiler : null);

/** Onderdelen die niets verbruiken en dus een "eigen kring" niet storen. */
const BIJKOMSTIG = new Set(['aftakdoos', 'nota', 'aarding', 'aardingsstrip']);

/** Een naam die doet denken aan een badkamer of douche. */
const BADKAMER_NAAM = /\b(bad|douche)/i;
/** Een naam die doet denken aan een kring voor wasmachine, droogkast of vaatwasser. */
const WAS_NAAM = /wasmachine|droogkast|droogtrommel|vaatwas/i;

/** Stroom (A) die een vermogen (W) vraagt op een kring met zoveel polen, op dit net. */
function stroomVoor(vermogen, polen, net) {
  if (polen >= 3) return vermogen / (Math.sqrt(3) * (net === '3N400' ? 400 : 230));
  return vermogen / 230;
}

export function controleer(project) {
  const meldingen = [];
  const code = codes(project);
  const meld = (niveau, id, tekst, kring) => meldingen.push(kring ? { niveau, id, tekst, kring } : { niveau, id, tekst });
  const { aansluiting, hoofd } = project;

  const hoofdDiff = hoofd.beveiliging === 'differentieel' || hoofd.beveiliging === 'diffautomaat';
  if (hoofdDiff && hoofd.gevoeligheid > MAX_HOOFD_GEVOELIGHEID) {
    meld('fout', 'hoofd', `De hoofddifferentieel is ${hoofd.gevoeligheid} mA; dat mag hoogstens ${MAX_HOOFD_GEVOELIGHEID} mA zijn.`);
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

  // Differentiëlen van type AC: in woningen wordt type A gevraagd. Niet zeker genoeg voor een fout, dus enkel ter info.
  const typeAC = '; voor woningen wordt doorgaans type A gevraagd (zeker voor wasmachine, droogkast, vaatwasser en laadpaal). Kijk na.';
  if (isDiff(hoofd) && hoofd.type === 'AC') meld('info', 'hoofd', `De hoofddifferentieel is van type AC${typeAC}`);
  for (const { knoop } of alleKnopen(project)) {
    if (knoop.soort === 'differentieel' && isDiff(knoop) && knoop.type === 'AC') {
      meld('info', knoop.id, `Groep ${code.get(knoop.id)}${knoop.naam ? ` (${knoop.naam})` : ''}: de differentieel is van type AC${typeAC}`);
    }
  }

  const kringen = alleKringen(project);
  if (!kringen.length) meld('info', 'hoofd', 'Er zijn nog geen kringen.');

  for (const { knoop: kring, ouders } of kringen) {
    const naam = `Kring ${code.get(kring.id)}${kring.naam ? ` (${kring.naam})` : ''}`;
    const beveiligingen = [hoofd, ...ouders, kringBeveiliging(kring)];
    const dertig = beveiligingen.some(isDertig);
    const k = (niveau, id, tekst) => meld(niveau, id, tekst, kring.id);

    if (!kring.items.length) k('waarschuwing', kring.id, `${naam} heeft nog geen onderdelen.`);

    // In een woning moet elke kring achter een differentieel van hoogstens 300 mA (de algemene differentieel).
    // Is de hoofddifferentieel zelf te ongevoelig, dan zegt de melding over het hoofdbord dat al.
    if (!beveiligingen.some(isBeschermend)) {
      if (!beveiligingen.some(isDiff)) {
        k('fout', kring.id, `${naam} staat niet achter een differentieel: in een woning moet elke kring achter een differentieel van hoogstens ${MAX_HOOFD_GEVOELIGHEID} mA.`);
      } else if (!(hoofdDiff && hoofd.gevoeligheid > MAX_HOOFD_GEVOELIGHEID)) {
        k('fout', kring.id, `${naam} staat enkel achter een differentieel van meer dan ${MAX_HOOFD_GEVOELIGHEID} mA; dat mag hoogstens ${MAX_HOOFD_GEVOELIGHEID} mA zijn.`);
      }
    }

    if (kring.automaat.gevoeligheid && Number(kring.automaat.gevoeligheid) > 0 && kring.automaat.type === 'AC') {
      k('info', kring.id, `${naam}: de differentieelautomaat is van type AC${typeAC}`);
    }

    const max = MAX_AUTOMAAT[kring.kabel.sectie];
    if (max && kring.automaat.stroom > max) {
      k('fout', kring.id, `${naam}: een automaat van ${kring.automaat.stroom} A is te groot voor ${komma(kring.kabel.sectie)} mm² (max. ${max} A).`);
    }

    const contactdozen = kring.items.filter(isContactdoos).reduce((som, it) => som + contactdozenVan(it), 0);
    if (contactdozen > MAX_STOPCONTACTEN) {
      k('fout', kring.id, `${naam} heeft ${contactdozen} stopcontacten; max. ${MAX_STOPCONTACTEN} per kring (een meervoudig stopcontact telt als één).`);
    }

    if (kring.badkamer && !dertig) {
      k('fout', kring.id, `${naam} ligt in een badkamer of natte ruimte en moet achter een differentieel van 30 mA.`);
    } else if (!kring.badkamer && BADKAMER_NAAM.test(kring.naam || '')) {
      if (dertig) k('info', kring.id, `${naam}: de naam doet een badkamer vermoeden. Vink "Badkamer of natte ruimte" aan als dat zo is.`);
      else k('waarschuwing', kring.id, `${naam}: de naam doet een badkamer vermoeden, maar de kring staat niet achter een differentieel van 30 mA. Kijk na; vink "Badkamer of natte ruimte" aan als het een badkamer is.`);
    }

    const toestellen = kring.items.map((item) => ({ item, t: toestelVan(item) })).filter((x) => x.t);
    if (!dertig && WAS_NAAM.test(kring.naam || '') && !toestellen.some((x) => x.t.dertig)) {
      k('waarschuwing', kring.id, `${naam}: de naam doet een kring voor wasmachine, droogkast of vaatwasser vermoeden; die moet achter een differentieel van 30 mA. Kijk na.`);
    }

    const andere = kring.items.filter((it) => !BIJKOMSTIG.has(it.soort));
    for (const { item, t } of toestellen) {
      if (t.dertig && !dertig) {
        k('fout', item.id, `${code.get(item.id)} ${t.naam} moet achter een differentieel van 30 mA.`);
      }
      if (t.eigenKring && andere.length > 1) {
        const n = andere.length - 1;
        k('waarschuwing', item.id, `${code.get(item.id)} ${t.naam} staat best op een eigen kring; nu staan er nog ${n} andere onderdel${n === 1 ? '' : 'en'} op.`);
      }
      if (item.variant === 'laadpaal' && item.soort === 'toestel' && !dertig) {
        k('info', item.id, `${code.get(item.id)} ${t.naam}: een laadpaal moet achter een differentieel van 30 mA (type A met 6 mA DC-detectie, of type B). Zit die niet in de laadpaal zelf, dan hoort hij in het bord. Kijk na.`);
      }
    }

    // Vragen de toestellen meer stroom dan de automaat? Geen AREI-regel op zich, wel iets om na te kijken.
    const vermogen = toestellen.reduce((som, { item }) => som + (Number(item.vermogen) || 0) * Math.max(1, Number(item.aantal) || 1), 0);
    const stroom = Number(kring.automaat.stroom) || 0;
    if (vermogen && stroom) {
      const nodig = stroomVoor(vermogen, Number(kring.automaat.polen) || 2, aansluiting.net);
      if (Math.round(nodig) > stroom) {
        k('info', kring.id, `${naam}: de toestellen samen (${vermogen} W, ongeveer ${Math.round(nodig)} A) vragen meer dan de automaat van ${stroom} A. Kijk na of automaat en kabel volstaan (een kookplaat vraagt bv. 32 A op 6 mm², of een driefasige aansluiting).`);
      }
    }

    if (kring.automaat.polen >= 3 && KABELTYPES[kring.kabel.type]?.soort !== 'draad' && kring.kabel.aders < kring.automaat.polen + 1) {
      k('waarschuwing', kring.id, `${naam}: een ${kring.automaat.polen}-polige automaat met een kabel van ${kring.kabel.aders} aders; kijk na of er genoeg aders zijn.`);
    }

    if (!Number(kring.kabel.lengte)) {
      k('info', kring.id, `${naam}: geen kabellengte ingevuld (nodig voor de materiaallijst).`);
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

/** De meldingen over een kring zelf of over een van zijn onderdelen (voor wie een kring als geheel toont). */
export const meldingenVoor = (meldingen, id) => meldingen.filter((m) => m.id === id || m.kring === id);
