// De toolbox van het situatieschema, nagebouwd naar GrondplanToolbox.cs van Trikker:
// verticale tabbladen (huis, standaardteksten, één per kring) met links daarvan de gereedschappen en symbolen.
// Dit bestand bevat enkel gegevens en HTML; de bediening zit in situatie.js.
import { krijg } from './tekst.js';

const tekst = (sleutel, standaard = '') => krijg(sleutel) ?? standaard;
import { trikkerIcoon, notaIcoon } from './kaart.js';
import { alleKringen, codes, rijen, nieuwItem } from '../model.js';
import { itemNaam } from '../catalogus.js';

/** De map met de afbeeldingen uit Trikker (index.html staat in app/). */
export const AFB = 'img/trikker/';

/** De standaardteksten van het tabblad "Tekst", in de volgorde van Trikker (FillPanelDefaultTexts). */
export const STANDAARD_TEKSTEN = ['Kelder', 'Gelijkvloers', '1e Verdieping', '2e Verdieping', '3e Verdieping', 'Zolder', 'Garage', 'Woonkamer',
  'Bureau', 'WC', 'Badkamer', 'Keuken', 'Berging', 'Slaapkamer', 'Gang', 'Terras', 'Tuin'];

/** De zes maatlijnen van het tabblad "huis": de gedeelde waarde, het aantal cijfers na de komma en het achtervoegsel (Maat.cs). */
export const MATEN = [
  { afb: 'maat_1000', delenDoor: 1, decimalen: 0, suffix: '' },
  { afb: 'maat_100', delenDoor: 10, decimalen: 0, suffix: '' },
  { afb: 'maat_1_00', delenDoor: 1000, decimalen: 2, suffix: '' },
  { afb: 'maat_1000_mm', delenDoor: 1, decimalen: 0, suffix: ' mm' },
  { afb: 'maat_100_cm', delenDoor: 10, decimalen: 0, suffix: ' cm' },
  { afb: 'maat_1_00_m', delenDoor: 1000, decimalen: 2, suffix: ' m' },
];

/**
 * De elementen van het tabblad "huis" (FillPanelHouseElements): eerst de gereedschappen met twee punten, dan de maatlijnen,
 * dan een aantal losse symbolen, dan de nota's. `scheiding` is de gestippelde lijn tussen de groepen.
 */
export function huisItems() {
  const tweepunt = (id, sleutel, afb, gereedschap = id, extra = {}) => ({ type: 'tweepunt', id, sleutel, afb, gereedschap, ...extra });
  const los = (id, sleutel, soort, waarden = {}) => ({ type: 'los', id, sleutel, item: nieuwItem(soort, waarden) });
  const nota = (n, tekstGrootte, breedte) => ({ type: 'nota', id: `nota${n}`, tekst: tekst('Text.Tekst', 'Tekst'), tekstGrootte, breedte, hoogte: 4 });
  return [
    tweepunt('muur', 'GrondplanToolboxMuur', 'bricks'),
    tweepunt('boog', 'GrondplanToolboxBoog', 'round_bricks'),
    tweepunt('raam', 'GrondplanToolboxRaam', 'window'),
    tweepunt('deur', 'GrondplanToolboxDeur', 'door'),
    tweepunt('poort', 'GrondplanToolboxGaragepoort', 'gate'),
    tweepunt('trap', 'GrondplanToolboxTrap', 'stairs', 'trap', { breedte: 800 }),
    tweepunt('draaitrap', 'GrondplanToolboxDraaitrap', 'stairs_round'),
    tweepunt('rechthoek', 'GrondplanToolboxRechthoek', 'rectangle'),
    tweepunt('vlak', 'GrondplanToolboxVlak', 'area', 'vlak', { transparantie: 50 }),
    tweepunt('lijn', 'GrondplanToolboxLijn', 'lines'),
    { type: 'import', id: 'import', sleutel: 'GrondplanToolboxImport', afb: 'picture', gereedschap: 'afbeelding' },
    { type: 'scheiding' },
    ...MATEN.map((m, i) => ({ type: 'tweepunt', id: `maat${i}`, sleutel: 'GrondplanToolboxMaat', afb: m.afb, gereedschap: 'maat', maat: m })),
    { type: 'scheiding' },
    los('communicatie', 'GrondplanToolboxContactdoosCommunicatie', 'communicatie', { opschrift: '' }),
    los('aansluitpunt', 'GrondplanToolboxAansluitpunt', 'aansluitpunt', { opschrift: '' }),
    { type: 'bord', id: 'bord', sleutel: 'GrondplanToolboxVerdeelbordGrondplan' },
    los('aarding', 'GrondplanToolboxAarding', 'aarding'),
    los('aardingsstrip', 'GrondplanToolboxAardingsstrip', 'aardingsstrip'),
    { type: 'scheiding' },
    los('branddetector', 'GrondplanToolboxBranddetector', 'branddetector'),
    los('bewegingsdetector', 'GrondplanToolboxBewegingsdetector', 'bewegingsdetector'),
    los('toestelklein', 'GrondplanToolboxToestelKleinC', 'toestelKlein', { opschrift: 'C' }),
    los('luidspreker', 'GrondplanToolboxLuidspreker', 'luidspreker'),
    { type: 'scheiding' },
    nota(1, 2, 10),
    nota(2, 3, 12),
    nota(3, 4, 20),
    { type: 'scheiding' },
  ];
}

/** De elementen van het tabblad "Tekst": elke standaardtekst is een nota van tekstgrootte 3 (AddDefaultTextNode). */
export function tekstItems() {
  return STANDAARD_TEKSTEN.map((naam) => ({
    type: 'nota', id: `tekst:${naam}`, tekst: tekst(`Text.GrondplanToolbox.${naam}`, naam), tekstGrootte: 3, breedte: 35, hoogte: 3.7,
  }));
}

/**
 * De tabbladen van de toolbox, in de volgorde van Trikker: huis, (clipart: er is geen), standaardteksten, en één tabblad per kring
 * met de letter van de kring. De symbolen van een kring staan per rij (subkring) gegroepeerd, met het nummer als scheiding.
 * @param {object} project
 * @param {Set<string>} geplaatst id's van de onderdelen die al op een pagina staan
 */
export function bouwTabs(project, geplaatst = new Set()) {
  const tabs = [
    { id: 'huis', soort: 'huis', afb: 'house', items: huisItems() },
    { id: 'tekst', soort: 'tekst', afb: 'text', items: tekstItems() },
  ];
  const code = codes(project);
  for (const { knoop } of alleKringen(project)) {
    const items = [];
    rijen(knoop).forEach((rij, j) => {
      items.push({ type: 'subkring', tekst: String(j + 1) });
      for (const item of rij) items.push({ type: 'knoop', id: item.id, item, uit: geplaatst.has(item.id) });
    });
    const alleItems = items.filter((i) => i.type === 'knoop');
    tabs.push({
      id: `kring:${knoop.id}`, soort: 'kring', letter: code.get(knoop.id) || '', naam: knoop.naam || '',
      items, klaar: alleItems.length > 0 && alleItems.every((i) => i.uit),
    });
  }
  return tabs;
}

/** De sleutel waarmee een element van de toolbox herkend wordt. */
export const sleutelVan = (it) => (it.type === 'bord' ? 'bord' : it.type === 'knoop' ? `knoop:${it.id}` : `${it.type}:${it.id}`);

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Is dit element te kiezen? Een symbool dat al op een pagina staat niet meer (Selectable). */
export const kiesbaar = (it) => !['scheiding', 'subkring'].includes(it.type) && !it.uit;

/** Het eerste element van een tabblad dat gekozen kan worden (FillPanel kiest dat meteen). */
export const eersteKiesbare = (tab) => tab?.items.find(kiesbaar) || null;

/**
 * Het volgende kiesbare element na dit in hetzelfde tabblad, of anders het volgende tabblad (van de kringen) waar nog
 * iets niet geplaatst is (toolBoxControl_SelectedChanged).
 * @returns {{tab:number, item:object}|null}
 */
export function volgendeNa(tabs, tabIndex, sleutel) {
  const tab = tabs[tabIndex];
  const i = tab ? tab.items.findIndex((x) => sleutelVan(x) === sleutel) : -1;
  if (i >= 0) {
    const volgende = tab.items.slice(i + 1).find(kiesbaar);
    if (volgende) return { tab: tabIndex, item: volgende };
  }
  for (let t = tabIndex + 1; t < tabs.length; t++) {
    if (tabs[t].soort === 'kring' && !tabs[t].klaar) {
      const eerste = eersteKiesbare(tabs[t]);
      if (eerste) return { tab: t, item: eerste };
    }
  }
  return null;
}

/** De inhoud van één element van de toolbox als HTML (ToolBoxControl*.cs). */
function itemHtml(it, gekozen) {
  if (it.type === 'scheiding') return '<div class="tb-scheiding"></div>';
  if (it.type === 'subkring') return `<div class="tb-subkring"><span>${esc(it.tekst)}</span><i></i></div>`;
  const sleutel = sleutelVan(it);
  const aan = gekozen === sleutel ? ' aan' : '';
  const kleur = it.uit ? ' uit' : '';
  const naam = it.sleutel ? tekst(`Controls.${it.sleutel}.ToolTip`, '') : '';
  const titel = it.type === 'knoop' ? itemNaam(it.item) : naam;
  const data = `data-sleutel="${esc(sleutel)}"${titel ? ` title="${esc(titel)}"` : ''}`;
  if (it.type === 'tweepunt' || it.type === 'import') {
    return `<button type="button" class="tb-item tweepunt${aan}" ${data}><img src="${AFB}${it.afb}.png" alt="" draggable="false"></button>`;
  }
  let icoon = null;
  if (it.type === 'nota') icoon = notaIcoon(it.tekst, it.tekstGrootte, it.breedte, it.hoogte);
  else if (it.type === 'bord') icoon = trikkerIcoon('bord');
  else icoon = trikkerIcoon(it.item);
  if (!icoon) return `<button type="button" class="tb-item knoop${aan}${kleur}" ${data}>${esc(titel || '?')}</button>`;
  return `<button type="button" class="tb-item knoop${aan}${kleur}" ${data} style="width:${icoon.breedte}px;height:${icoon.hoogte}px">${icoon.svg}</button>`;
}

/** De inhoud van het paneel van een tabblad als HTML. */
export function paneelHtml(tab, gekozen = null) {
  return tab ? tab.items.map((it) => itemHtml(it, gekozen)).join('') : '';
}

/** De afbeelding of de letter op een tabblad (OnPaint van GrondplanToolbox). */
export function tabHtml(tab) {
  if (tab.afb) return `<img src="${AFB}${tab.afb}.png" alt="" draggable="false">`;
  return `<span class="tb-letter${tab.klaar ? ' klaar' : ''}">${esc(tab.letter)}</span>`;
}
