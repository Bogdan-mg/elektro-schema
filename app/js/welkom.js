// Het welkomstscherm (bij de eerste keer) en het hulpvenster (knop "?"): snel beginnen, de werkwijze in vier stappen en de sneltoetsen.
import { esc } from './symbolen.js';

const SLEUTEL = 'elektro-schema-welkom-gezien';

export function welkomGezien() {
  try { return localStorage.getItem(SLEUTEL) === '1'; } catch { return false; }
}
function onthoud(aan) {
  try { if (aan) localStorage.setItem(SLEUTEL, '1'); else localStorage.removeItem(SLEUTEL); } catch { /* geen opslag */ }
}

const STAPPEN = [
  ['1', 'Het huis tekenen', 'Tab Situatieschema: teken de muren, deuren en ramen, of laad het plan van de architect als achtergrond.'],
  ['2', 'Symbolen plaatsen', 'Tab Woning: kies onderaan een symbool en tik op het plan. Een stopcontact kleeft zelf aan de muur.'],
  ['3', 'Kringen maken', 'Tab Woning, stap "verdeelbord" en "kringen": sleep de symbolen naar hun zekering. De kringletter komt op het plan.'],
  ['4', 'Schema en lijsten', 'Het ééndraadschema, de materiaallijst en de afdruk maakt het programma zelf. Controleer onder "Controle" of alles klopt.'],
];

const TOETSEN = [
  ['Ctrl + S', 'Opslaan'], ['Ctrl + O', 'Openen'], ['Ctrl + N', 'Nieuw project'], ['Ctrl + P', 'Afdrukken of PDF'],
  ['Ctrl + Z / Ctrl + Y', 'Ongedaan maken / opnieuw'], ['Delete', 'Het gekozen onderdeel wissen'],
  ['Rechtermuisknop', 'Een symbool draaien (Alt: kleine stap)'], ['Shift + rechtermuisknop', 'De plaats van de tekst bij een symbool wisselen'],
  ['Ctrl + rechtermuisknop', 'De plaats van het adres wisselen'], ['R', 'Het gekozen symbool draaien'], ['Alt', 'Even niet aan de muur of het raster kleven'],
  ['Esc', 'Stoppen met plaatsen of tekenen'], ['F1', 'De handleiding'], ['?', 'Dit hulpvenster'],
];

/**
 * @param {{ eerste?: boolean, nieuw: Function, voorbeeld: Function, openen: Function, handleiding: Function }} acties
 */
export function toonHulp({ eerste = false, nieuw, voorbeeld, openen, handleiding }) {
  if (document.querySelector('dialog.welkom')) return;
  const d = document.createElement('dialog');
  d.className = 'dialoog welkom';
  d.innerHTML = `
    <form method="dialog">
      <h2>${eerste ? 'Welkom bij Elektro Schema' : 'Hulp'}</h2>
      <p>${eerste ? 'Een elektrisch schema maken, van het plan van het huis tot de afdruk.' : 'Zo werkt het programma, en de sneltoetsen.'}</p>
      <div class="welkom-kaarten">
        <button value="nieuw" class="welkom-kaart"><b>Nieuw project</b><span>Begin met een leeg project</span></button>
        <button value="voorbeeld" class="welkom-kaart"><b>Voorbeeld bekijken</b><span>Een ingevulde woning om rond te kijken</span></button>
        <button value="openen" class="welkom-kaart"><b>Project openen</b><span>Een eerder opgeslagen bestand (.eschema)</span></button>
      </div>
      <h3>Zo werk je</h3>
      <ol class="welkom-stappen">${STAPPEN.map(([n, titel, uitleg]) => `<li><span class="nr">${n}</span><div><b>${esc(titel)}</b><span>${esc(uitleg)}</span></div></li>`).join('')}</ol>
      <details class="welkom-toetsen"><summary>Sneltoetsen</summary>
        <dl>${TOETSEN.map(([t, u]) => `<dt><kbd>${esc(t)}</kbd></dt><dd>${esc(u)}</dd>`).join('')}</dl>
      </details>
      <p class="welkom-tip">Tip: je werk wordt automatisch bewaard voor als het programma onverwacht sluit. Vergeet het zelf wel niet op te slaan.</p>
      <div class="knoppen">
        <label class="vink welkom-niet"><input type="checkbox" id="welkom-niet" ${welkomGezien() || eerste ? 'checked' : ''}> Dit scherm niet meer vanzelf tonen</label>
        <button value="handleiding">Handleiding</button>
        <button value="sluiten" class="hoofd">${eerste ? 'Later' : 'Sluiten'}</button>
      </div>
    </form>`;
  document.body.append(d);
  d.addEventListener('close', () => {
    const keuze = d.returnValue;
    onthoud(d.querySelector('#welkom-niet').checked);
    d.remove();
    if (keuze === 'nieuw') nieuw();
    else if (keuze === 'voorbeeld') voorbeeld();
    else if (keuze === 'openen') openen();
    else if (keuze === 'handleiding') handleiding();
  });
  d.showModal();
  d.querySelector('.welkom-kaart')?.focus();
}
