// Persoonlijke instellingen (per pc, niet per project): mijn gegevens, logo, standaard controleorganisme en backups.
import { esc } from './symbolen.js';
import { melding } from './dialoog.js';

const SLEUTEL = 'elektro-instellingen';
const STANDAARD = {
  ik: { naam: '', adres: '', telefoon: '', btw: '' },
  logo: '',
  controle: '',
  backup: { aan: true, minuten: 10, map: '' },
};

export function leesInstellingen() {
  try {
    const x = JSON.parse(localStorage.getItem(SLEUTEL)) || {};
    return { ...STANDAARD, ...x, ik: { ...STANDAARD.ik, ...x.ik }, backup: { ...STANDAARD.backup, ...x.backup } };
  } catch {
    return structuredClone(STANDAARD);
  }
}

export function bewaarInstellingen(i) {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(i));
  } catch {
    melding('De instellingen konden niet bewaard worden (het logo is misschien te groot).', 'fout');
  }
}

/** Mijn gegevens als tekst voor de titelhoek, bv. "Jan Peeters, Kerkstraat 1, 2000 Antwerpen". */
export const ikTekst = (i = leesInstellingen()) => [i.ik.naam, i.ik.adres, i.ik.telefoon, i.ik.btw && `BTW ${i.ik.btw}`].filter(Boolean).join(', ');

const leesLogo = (bestand) => new Promise((ok, fout) => {
  const r = new FileReader();
  r.onload = () => {
    // Verkleinen tot hoogstens 600 pixels: genoeg voor 28 mm op papier.
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * f);
      c.height = Math.round(img.naturalHeight * f);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/png'));
    };
    img.onerror = () => fout(new Error('Deze afbeelding kan niet geopend worden.'));
    img.src = r.result;
  };
  r.onerror = () => fout(r.error);
  r.readAsDataURL(bestand);
});

/**
 * Het venster met instellingen. project: het open project (voor "losse symbolen", dat per project geldt).
 * desktop: de brug naar Windows (voor de map met backups). Geeft { instellingen, opties } of null.
 */
export async function instellingenDialoog(project, desktop) {
  const i = leesInstellingen();
  const d = document.createElement('dialog');
  d.className = 'dialoog breed';
  const werk = { ...i, ik: { ...i.ik }, backup: { ...i.backup } };
  let losse = Boolean(project.opties?.losseSymbolen);
  const teken = () => {
    d.innerHTML = `<form method="dialog"><h2>Instellingen</h2>
      <p>Deze instellingen horen bij jouw pc en gelden voor alle projecten.</p>
      <h4>Mijn gegevens (installateur)</h4>
      <label class="veld"><span>Naam</span><input data-i="naam" value="${esc(werk.ik.naam)}"></label>
      <label class="veld"><span>Adres</span><input data-i="adres" value="${esc(werk.ik.adres)}"></label>
      <label class="veld"><span>Telefoon / e-mail</span><input data-i="telefoon" value="${esc(werk.ik.telefoon)}"></label>
      <label class="veld"><span>Ondernemingsnummer (BTW)</span><input data-i="btw" value="${esc(werk.ik.btw)}"></label>
      <h4>Logo op elke pagina</h4>
      <div class="logorij">${werk.logo ? `<img src="${esc(werk.logo)}" alt="Logo" class="logo-voorbeeld">` : '<small>Geen logo ingesteld.</small>'}
        <button type="button" data-op="logo">Logo kiezen…</button>${werk.logo ? '<button type="button" data-op="logo-weg">Verwijderen</button>' : ''}
        <input type="file" accept="image/*" id="instellingen-logo" hidden></div>
      <h4>Standaard controleorganisme voor nieuwe projecten</h4>
      <label class="veld"><span>Naam en adres</span><textarea data-i="controle" rows="3">${esc(werk.controle)}</textarea></label>
      <h4>Backups</h4>
      <label class="vink"><input type="checkbox" data-b="aan" ${werk.backup.aan ? 'checked' : ''}> Bewaar automatisch een backup van mijn project</label>
      <label class="veld"><span>Om de … minuten</span><input type="number" min="1" max="240" data-b="minuten" value="${werk.backup.minuten}"></label>
      ${desktop ? `<label class="veld"><span>Map</span><input data-b="map" value="${esc(werk.backup.map)}" placeholder="Documenten\\Elektro Schema\\Backups"></label>
      <div class="knoppenrij"><button type="button" data-op="map">Map kiezen…</button><button type="button" data-op="open">Map met backups openen</button></div>` : '<small>Backups worden enkel gemaakt in het Windows-programma.</small>'}
      <small>Het programma verwijdert nooit zelf oude backups.</small>
      <h4>Voor dit project</h4>
      <label class="vink"><input type="checkbox" id="instellingen-los" ${losse ? 'checked' : ''}> Losse symbolen: symbolen op het situatieschema zetten die (nog) niet op het ééndraadschema staan</label>
      <div class="knoppen"><button value="ok" class="hoofd">Bewaren</button><button value="">Annuleren</button></div></form>`;
  };
  teken();
  document.body.append(d);
  d.addEventListener('input', (e) => {
    if (e.target.dataset.i) { if (e.target.dataset.i === 'controle') werk.controle = e.target.value; else werk.ik[e.target.dataset.i] = e.target.value; }
    if (e.target.dataset.b) werk.backup[e.target.dataset.b] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) || 10 : e.target.value;
    if (e.target.id === 'instellingen-los') losse = e.target.checked;
  });
  d.addEventListener('click', async (e) => {
    const op = e.target.closest('[data-op]')?.dataset.op;
    if (op === 'logo') d.querySelector('#instellingen-logo').click();
    if (op === 'logo-weg') { werk.logo = ''; teken(); }
    if (op === 'map') { const m = await desktop.kiesBackupMap(); if (m) { werk.backup.map = m; teken(); } }
    if (op === 'open') desktop.openMap(werk.backup.map);
  });
  d.addEventListener('change', async (e) => {
    if (e.target.id !== 'instellingen-logo') return;
    const bestand = e.target.files?.[0];
    if (!bestand) return;
    try { werk.logo = await leesLogo(bestand); teken(); } catch (fout) { melding(fout.message, 'fout'); }
  });
  d.showModal();
  const knop = await new Promise((klaar) => {
    let gekozen = null;
    d.addEventListener('click', (e) => { if (e.target.closest('button[value="ok"]')) gekozen = 'ok'; });
    d.addEventListener('close', () => klaar(gekozen), { once: true });
  });
  d.remove();
  if (knop !== 'ok') return null;
  bewaarInstellingen(werk);
  return { instellingen: werk, opties: { losseSymbolen: losse } };
}
