// De toestand van de app: het open project, wat gekozen is, en ongedaan maken / opnieuw.
import { nieuwProject } from './model.js';

export const staat = {
  project: nieuwProject(),
  pad: null, // waar het project op schijf staat (desktop)
  gewijzigd: false,
  selectie: 'hoofd', // gekozen ding in het ééndraadschema
  tab: 'eendraad',
  planId: null,
  planSelectie: null, // { soort: 'item' | 'muur' | 'tekst', id }
  dicht: new Set(), // ingeklapte kringen in de boom
};

const terug = [];
const vooruit = [];
let laatsteSleutel = null;
let laatsteTijd = 0;
const luisteraars = new Set();
const MAX_STAPPEN = 200;

export const opWijziging = (fn) => luisteraars.add(fn);

/** Alles opnieuw tekenen. paneel: false laat formulieren staan (zodat je verder kan typen). */
export function herteken(opties = {}) {
  for (const fn of luisteraars) fn({ paneel: true, ...opties });
}

// Afbeeldingen veranderen niet en zijn groot: die blijven buiten de geschiedenis.
const momentopname = () => JSON.stringify({ ...staat.project, afbeeldingen: null, _selectie: staat.selectie });
function zetMoment(tekst) {
  const { _selectie, ...data } = JSON.parse(tekst);
  data.afbeeldingen = staat.project.afbeeldingen;
  staat.project = data;
  staat.selectie = _selectie || 'hoofd';
  staat.planSelectie = null;
  if (!data.plannen.some((p) => p.id === staat.planId)) staat.planId = data.plannen[0]?.id;
}

/**
 * Pas het project aan. Opeenvolgende wijzigingen met dezelfde sleutel (bv. typen in één veld)
 * worden één stap bij ongedaan maken.
 */
export function wijzig(fn, { sleutel = null, paneel = true } = {}) {
  const nu = Date.now();
  if (!(sleutel && sleutel === laatsteSleutel && nu - laatsteTijd < 2000)) {
    terug.push(momentopname());
    if (terug.length > MAX_STAPPEN) terug.shift();
    vooruit.length = 0;
  }
  laatsteSleutel = sleutel;
  laatsteTijd = nu;
  const resultaat = fn(staat.project);
  zetGewijzigd(true);
  herteken({ paneel });
  return resultaat;
}

export function ongedaan() {
  if (!terug.length) return false;
  vooruit.push(momentopname());
  zetMoment(terug.pop());
  laatsteSleutel = null;
  zetGewijzigd(true);
  herteken();
  return true;
}

export function opnieuw() {
  if (!vooruit.length) return false;
  terug.push(momentopname());
  zetMoment(vooruit.pop());
  laatsteSleutel = null;
  zetGewijzigd(true);
  herteken();
  return true;
}

export const kanOngedaan = () => terug.length > 0;
export const kanOpnieuw = () => vooruit.length > 0;

export function kies(id) {
  staat.selectie = id;
  herteken();
}

export function laad(project, pad = null) {
  staat.project = project;
  staat.pad = pad;
  staat.selectie = 'hoofd';
  staat.planId = project.plannen[0]?.id || null;
  staat.planSelectie = null;
  staat.dicht.clear();
  terug.length = 0;
  vooruit.length = 0;
  laatsteSleutel = null;
  zetGewijzigd(false);
  herteken();
}

const gewijzigdLuisteraars = new Set();
export const opGewijzigd = (fn) => gewijzigdLuisteraars.add(fn);
export function zetGewijzigd(waarde) {
  staat.gewijzigd = waarde;
  for (const fn of gewijzigdLuisteraars) fn(waarde);
}
