// Het tabblad Document, zoals in Trikker: klant, plaats van de installatie, installateur (met logo) en controleorganisme.
import { staat, wijzig, opWijziging } from './staat.js';
import { esc } from './symbolen.js';
import { leesInstellingen } from './instellingen.js';
import { melding } from './dialoog.js';

const $ = (s) => document.querySelector(s);

/** De velden van een adresblok; wat extra is (ondernemingsnummer, tel, …) staat per blok in BLOKKEN. */
const ADRES = [
  ['straat', 'Straat'], ['nummer', 'Nummer'], ['bus', 'Bus'], ['postcode', 'Postcode'], ['gemeente', 'Gemeente'], ['land', 'Land'],
];
const CONTACT = [['tel', 'Tel.'], ['gsm', 'GSM'], ['email', 'e-mail']];

function blok(sleutel, titel, { ean = false, gelijk = false, logo = false, zoek = false } = {}) {
  const veld = (naam, label, klasse = '') => `<label class="dveld ${klasse}"><span>${label}:</span><input data-pad="${sleutel}.${naam}" autocomplete="off"></label>`;
  return `<fieldset class="dblok" id="blok-${sleutel}"><legend>${titel}</legend>
    ${ean ? `<label class="dveld breed"><span>EAN:</span><input data-pad="${sleutel}.ean" placeholder="EAN van de aansluiting"></label>
      <label class="dvink"><input type="checkbox" data-pad="${sleutel}.gelijk"> Hetzelfde als het adres van de klant</label>` : `
    <div class="drij"><label class="dveld breed"><span>Naam:</span><input data-pad="${sleutel}.naam" autocomplete="off"></label>
      ${zoek ? '<button type="button" class="dknop" data-doc="controle-standaard" title="Mijn standaard controleorganisme invullen">🔍</button><button type="button" class="dknop" data-doc="controle-leeg" title="Alles leegmaken">✖</button>' : ''}
      ${veld('btw', 'Ondernemingsnummer', 'btw')}</div>`}
    <div class="adresgroep${gelijk ? ' gelijk' : ''}">
      <div class="drij">${veld('straat', 'Straat', 'breed')}${veld('nummer', 'Nummer', 'kort')}${veld('bus', 'Bus', 'kort')}</div>
      <div class="drij">${veld('postcode', 'Postcode', 'kort')}${veld('gemeente', 'Gemeente', 'breed')}${veld('land', 'Land', 'kort')}</div>
    </div>
    ${ean ? '' : `<div class="drij">${CONTACT.map(([n, l]) => veld(n, l, n === 'email' ? 'breed' : 'middel')).join('')}</div>`}
    ${logo ? `<div class="dlogo"><b>Logo:</b>
      <label class="dvink"><input type="radio" name="logomodus" value="geen"> Geen logo</label>
      <label class="dvink"><input type="radio" name="logomodus" value="naast"> Logo afdrukken naast gegevens</label>
      <label class="dvink"><input type="radio" name="logomodus" value="enkel"> Enkel logo afdrukken</label>
      <div class="dlogorij"><div class="dlogovak" id="doc-logo-vak"></div><button type="button" class="dknop groot" data-doc="logo">📂 Logo bestand kiezen</button></div></div>` : ''}
  </fieldset>`;
}

const toolknop = (actie, icoon, tekst) => `<button type="button" class="doc-knop" data-actie="${actie}"><span class="doc-ic">${icoon}</span>${tekst}</button>`;

export function startDocument() {
  const sectie = $('#tab-document');
  sectie.innerHTML = `<div class="doc-balk">${toolknop('nieuw', '✦', 'Nieuw')}${toolknop('openen', '📂', 'Openen')}<span class="doc-scheiding"></span>${toolknop('opslaan', '💾', 'Opslaan')}${toolknop('opslaanAls', '📝', 'Opslaan als')}<span class="doc-scheiding"></span>${toolknop('afsluiten', '✖', 'Afsluiten')}</div>
    <div class="doc-inhoud"><label class="dveld breed projectveld"><span>Projectnaam:</span><input data-pad="info.titel" autocomplete="off"></label>
    ${blok('klant', 'Klant')}${blok('plaats', 'Plaats van de elektrische installatie', { ean: true, gelijk: true })}${blok('installateur', 'Installateur', { logo: true })}${blok('controle', 'Controleorganisme', { zoek: true })}
    <label class="dveld breed"><span>Opmerking:</span><input data-pad="info.opmerking"></label></div>`;

  const lees = (o, pad) => pad.split('.').reduce((x, k) => x?.[k], o);
  const zet = (o, pad, w) => { const d = pad.split('.'); const l = d.pop(); d.reduce((x, k) => (x[k] ??= {}), o)[l] = w; };

  sectie.addEventListener('input', (e) => {
    const pad = e.target.dataset.pad;
    if (pad) {
      const w = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      wijzig((p) => zet(pad.startsWith('info.') ? p : p.document, pad.startsWith('info.') ? pad : pad, w), { sleutel: `doc:${pad}`, paneel: false });
      if (e.target.type === 'checkbox') teken();
    }
    if (e.target.name === 'logomodus') wijzig((p) => { p.document.installateur.logoModus = e.target.value; }, { paneel: false });
  });
  sectie.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-doc]')?.dataset.doc;
    if (a === 'controle-standaard') {
      const t = leesInstellingen().controle;
      if (!t) { melding('Stel eerst een standaard controleorganisme in bij Instellingen.'); return; }
      wijzig((p) => { p.document.controle.naam = t; });
    }
    if (a === 'controle-leeg') wijzig((p) => { p.document.controle = { naam: '', btw: '', straat: '', nummer: '', bus: '', postcode: '', gemeente: '', land: 'België', tel: '', gsm: '', email: '' }; });
    if (a === 'logo') {
      const inv = document.createElement('input');
      inv.type = 'file';
      inv.accept = 'image/*';
      inv.onchange = async () => {
        const f = inv.files?.[0];
        if (!f) return;
        const src = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
        const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
        const k = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        wijzig((p) => { p.document.installateur.logo = c.toDataURL('image/png'); if (p.document.installateur.logoModus === 'geen') p.document.installateur.logoModus = 'naast'; });
      };
      inv.click();
    }
  });

  function teken() {
    const p = staat.project;
    for (const el of sectie.querySelectorAll('[data-pad]')) {
      if (el === document.activeElement) continue;
      const w = lees(el.dataset.pad.startsWith('info.') ? p : p.document, el.dataset.pad);
      if (el.type === 'checkbox') el.checked = Boolean(w); else el.value = w ?? '';
    }
    for (const r of sectie.querySelectorAll('[name=logomodus]')) r.checked = r.value === (p.document.installateur.logoModus || 'geen');
    const logo = p.document.installateur.logo;
    $('#doc-logo-vak').innerHTML = logo ? `<img src="${esc(logo)}" alt="Logo">` : '';
    $('#blok-plaats .adresgroep').classList.toggle('uit', p.document.plaats.gelijk !== false);
    for (const i of sectie.querySelectorAll('#blok-plaats .adresgroep input')) i.disabled = p.document.plaats.gelijk !== false;
  }
  opWijziging(() => { if (staat.tab === 'document') teken(); });
}
