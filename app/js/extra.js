// Het tabblad Extra, zoals in Trikker: instellingen, handleiding en een overzicht van alle symbolen.
const $ = (s) => document.querySelector(s);

export function startExtra({ acties }) {
  $('#tab-extra').innerHTML = `<div class="extra-inhoud">
    <h2 class="extra-titel">Elektro Schema</h2>
    <hr class="extra-lijn">
    <p><b>Een eigen programma voor ééndraadschema, situatieschema en materiaallijst volgens het AREI.</b></p>
    <p class="hint">Voor persoonlijk gebruik. Je werk wordt bewaard in <code>.eschema</code>-bestanden en automatisch als back-up.</p>
    <hr class="extra-lijn">
    <div class="extra-knoppen">
      <button class="extra-knop" data-x="instellingen"><span>⚙</span> Instellingen</button>
      <button class="extra-knop" data-x="hulp"><span>❓</span> Snelstart en sneltoetsen</button>
      <button class="extra-knop" data-x="handleiding"><span>📖</span> Handleiding</button>
      <button class="extra-knop" data-x="symbolen"><span>⏚</span> Overzicht Symbolen</button>
      <button class="extra-knop" data-x="voorbeeld"><span>✦</span> Voorbeeldproject</button>
    </div></div>`;
  $('#tab-extra').addEventListener('click', (e) => {
    if (e.target.closest('#versie-zoek')) { zoekNieuweVersie(); return; }
    const k = e.target.closest('[data-x]');
    if (k) acties()[k.dataset.x]?.();
  });
  toonVersie();
}

/** De datum van de versie die je gebruikt (enkel bij de webapp, die bestanden.json heeft). */
async function toonVersie() {
  try {
    const r = await fetch('bestanden.json', { cache: 'no-store' }).catch(() => null) || await fetch('bestanden.json');
    if (!r?.ok) return;
    const { datum, versie } = await r.json();
    const tekst = datum ? new Date(datum).toLocaleString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : versie;
    const el = document.createElement('p');
    el.className = 'hint versie';
    el.innerHTML = `Versie van <b></b> <button type="button" id="versie-zoek">Zoek naar nieuwe versie</button>`;
    el.querySelector('b').textContent = tekst;
    $('#tab-extra .extra-inhoud').append(el);
  } catch { /* computerversie: geen versiebestand */ }
}

/** De webapp nakijken op een nieuwe versie en dan opnieuw laden. */
async function zoekNieuweVersie() {
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.update().catch(() => {});
  for (const k of await caches.keys().catch(() => [])) await caches.delete(k);
  location.reload();
}
