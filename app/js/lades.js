// Op een smal scherm (iPad rechtop) schuiven de lijst links en de eigenschappen rechts als lades over de tekening,
// zodat de tekening de hele breedte krijgt. Twee knoppen onderaan openen ze.
const SMAL = window.matchMedia('(max-width: 1100px), (pointer: coarse), (any-pointer: coarse)');

export function startLades() {
  for (const tab of document.querySelectorAll('.tab.drie')) {
    const knoppen = document.createElement('div');
    knoppen.className = 'lade-knoppen';
    knoppen.innerHTML = '<button type="button" data-lade="links">☰ Lijst</button><button type="button" data-lade="rechts">⚙ Eigenschappen</button>';
    tab.append(knoppen);
    const zet = (kant, aan) => tab.classList.toggle(`${kant}-open`, aan);
    knoppen.addEventListener('click', (e) => {
      const kant = e.target.closest('[data-lade]')?.dataset.lade;
      if (!kant) return;
      const ander = kant === 'links' ? 'rechts' : 'links';
      zet(ander, false);
      zet(kant, !tab.classList.contains(`${kant}-open`));
    });
    // Op de tekening tikken sluit de lades.
    tab.querySelector('.vlak-wrap')?.addEventListener('pointerdown', () => { if (SMAL.matches) { zet('links', false); zet('rechts', false); } });
    // Iets kiezen in de lijst: de lijst gaat dicht. In het ééndraadschema gaan dan de eigenschappen open.
    const links = tab.querySelector('aside.paneel:not(.eigenschappen)');
    links?.addEventListener('click', (e) => {
      if (!SMAL.matches) return;
      const keuze = e.target.closest('[data-sleutel], [data-item], [data-zoek-los], [data-los], .boom .rij, [data-id]');
      if (!keuze || e.target.closest('[data-tbtab], button.mini, input, select')) return;
      zet('links', false);
      if (tab.id === 'tab-eendraad') zet('rechts', true);
    });
  }
}
