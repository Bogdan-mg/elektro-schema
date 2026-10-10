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
      <button class="extra-knop" data-x="handleiding"><span>📖</span> Handleiding</button>
      <button class="extra-knop" data-x="symbolen"><span>⏚</span> Overzicht Symbolen</button>
      <button class="extra-knop" data-x="voorbeeld"><span>✦</span> Voorbeeldproject</button>
    </div></div>`;
  $('#tab-extra').addEventListener('click', (e) => {
    const k = e.target.closest('[data-x]');
    if (k) acties()[k.dataset.x]?.();
  });
}
