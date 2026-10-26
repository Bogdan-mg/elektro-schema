// Het tabblad Afdrukken, zoals in Trikker: papier, opties, info, handtekeningen en een voorbeeld.
import { staat, wijzig, opWijziging } from './staat.js';
import { bouwAfdruk } from './afdruk.js';
import { esc } from './symbolen.js';
import { melding } from './dialoog.js';

const $ = (s) => document.querySelector(s);
const STROMEN = ['2 x 230V ~ 50Hz', '3 x 230V ~ 50Hz', '3 x 400V + N ~ 50Hz', '230V ~ 50Hz'];
const STANDAARD = {
  formaat: 'A4', eendraad: true, situatie: true, lijst: true, opmerkingen: true, nood: true, materiaal: false, paginering: 'auto', kringVolgorde: 'schema',
  toonDatum: false, datum: '', toonStroom: true, stroom: STROMEN[0], versieAuto: false, versie: '', tekst: '', eigenaar: '', installateur: '',
};

export const afdrukOpties = () => ({ ...STANDAARD, ...(staat.project.opties?.afdruk || {}) });
const bewaar = (deel) => wijzig((p) => { p.opties = { ...p.opties, afdruk: { ...afdrukOpties(), ...deel } }; });

const vandaag = () => new Date().toISOString().slice(0, 10);
const nu = () => { const d = new Date(); const t = (n) => String(n).padStart(2, '0'); return `V.${d.getFullYear()}-${t(d.getMonth() + 1)}-${t(d.getDate())} ${t(d.getHours())}:${t(d.getMinutes())}:${t(d.getSeconds())}`; };

/** De opties zoals bouwAfdruk ze verwacht. */
export function afdrukParameters() {
  const o = afdrukOpties();
  return {
    ...o,
    datum: o.toonDatum ? o.datum || vandaag() : '',
    versie: o.versieAuto ? nu() : o.versie,
    handtekeningen: o.eigenaar || o.installateur ? { eigenaar: o.eigenaar, installateur: o.installateur } : null,
  };
}

function vul() {
  const o = afdrukOpties();
  const sectie = $('#tab-afdrukken');
  for (const el of sectie.querySelectorAll('[data-o]')) {
    const w = o[el.dataset.o];
    if (el.type === 'radio') el.checked = String(w) === el.value;
    else if (el.type === 'checkbox') el.checked = Boolean(w);
    else if (document.activeElement !== el) el.value = w ?? '';
  }
  $('#afd-auto-versie').textContent = nu();
  for (const wie of ['eigenaar', 'installateur']) {
    const vak = $(`#afd-${wie}`);
    vak.style.backgroundImage = o[wie] ? `url("${o[wie]}")` : '';
    vak.classList.toggle('leeg', !o[wie]);
  }
}

function voorbeeld() {
  const doel = document.createElement('div');
  const aantal = bouwAfdruk({ ...afdrukParameters(), doel });
  const kader = $('#afd-voorbeeld');
  kader.innerHTML = doel.innerHTML || '<p class="hint">Er is niets om af te drukken.</p>';
  kader.dataset.aantal = aantal;
  // Verklein elk blad zodat het in de breedte past.
  const breedte = kader.clientWidth - 24;
  for (const blad of kader.querySelectorAll('.blad')) {
    const b = blad.getBoundingClientRect().width || 1100;
    blad.style.zoom = String(Math.min(1, breedte / b));
  }
}

function lees(bestand, wie) {
  const r = new FileReader();
  r.onload = () => bewaar({ [wie]: r.result });
  r.readAsDataURL(bestand);
}

export function startAfdrukTab({ afdrukken }) {
  const sectie = $('#tab-afdrukken');
  const radio = (naam, w, tekst) => `<label class="dvink"><input type="radio" name="o-${naam}" data-o="${naam}" value="${w}"> ${tekst}</label>`;
  const vink = (naam, tekst) => `<label class="dvink"><input type="checkbox" data-o="${naam}"> ${tekst}</label>`;
  const handtekening = (wie, titel) => `<div class="afd-ht"><b>${titel}</b><div class="afd-ht-rij"><div class="afd-ht-vak leeg" id="afd-${wie}"></div>
    <div class="afd-ht-knoppen"><button type="button" class="tb" data-ht="${wie}">✍ Instellen…</button><button type="button" class="tb" data-geen="${wie}">✖ Geen handtekening</button></div></div></div>`;
  sectie.innerHTML = `<div class="doc-balk">
      <button class="tb" data-afd="print"><span class="tb-i">🖨</span>Afdrukken</button>
      <button class="tb" data-afd="pdf"><span class="tb-i">📄</span>PDF</button>
      <button class="tb" data-afd="voorbeeld"><span class="tb-i">🔍</span>Voorbeeld</button></div>
    <div class="afd-inhoud">
      <fieldset class="dblok"><legend>Papierformaat</legend><div class="afd-rij">${radio('formaat', 'A4', 'A4')}${radio('formaat', 'A3', 'A3')}</div></fieldset>
      <div class="afd-twee">
        <fieldset class="dblok"><legend>Opties</legend>
          <div class="afd-rij">${vink('eendraad', 'Eendraadschema afdrukken')}${radio('paginering', 'auto', 'Automatisch in pagina’s verdelen')}${radio('paginering', 'manueel', 'Manueel in pagina’s verdelen')}</div>
          <div class="afd-rij">${vink('situatie', 'Situatieschema afdrukken')}</div>
          <div class="afd-rij">${vink('lijst', 'Lijst met kringen afdrukken')}${radio('kringVolgorde', 'schema', 'In volgorde van schema')}${radio('kringVolgorde', 'alfabet', 'Alfabetisch')}</div>
          <div class="afd-rij">${vink('opmerkingen', 'Opmerkingen per kring afdrukken')}</div>
          <div class="afd-rij">${vink('nood', 'Lijst met noodverlichting afdrukken (als die er is)')}</div>
          <div class="afd-rij">${vink('materiaal', 'Materiaallijst afdrukken')}</div></fieldset>
        <fieldset class="dblok"><legend>Info</legend>
          <div class="afd-rij"><label class="dvink"><input type="checkbox" data-o="toonDatum"> Datum:</label><input type="date" data-o="datum"></div>
          <div class="afd-rij"><label class="dvink"><input type="checkbox" data-o="toonStroom"> Stroomtype:</label><select data-o="stroom">${STROMEN.map((s) => `<option>${esc(s)}</option>`).join('')}</select></div>
          <div class="afd-rij"><label class="dvink"><input type="radio" name="o-versieAuto" data-o="versieAuto" value="false"> Manuele versie:</label><input data-o="versie"></div>
          <div class="afd-rij"><label class="dvink"><input type="radio" name="o-versieAuto" data-o="versieAuto" value="true"> Automatische versie:</label><span id="afd-auto-versie" class="afd-auto"></span></div>
          <label class="dveld breed"><span>Extra info:</span><textarea data-o="tekst" rows="3"></textarea></label></fieldset></div>
      <fieldset class="dblok"><legend>Handtekeningen</legend><div class="afd-twee">${handtekening('eigenaar', 'Handtekening eigenaar:')}${handtekening('installateur', 'Handtekening installateur:')}</div></fieldset>
      <div id="afd-voorbeeld" class="afd-voorbeeld"></div></div>
    <input type="file" id="afd-bestand" accept="image/*" hidden>`;

  let wie = null;
  sectie.addEventListener('input', (e) => {
    const naam = e.target.dataset.o;
    if (!naam) return;
    if (e.target.type === 'radio') bewaar({ [naam]: naam === 'versieAuto' ? e.target.value === 'true' : e.target.value });
    else if (e.target.type === 'checkbox') bewaar({ [naam]: e.target.checked });
    else bewaar({ [naam]: e.target.value });
  });
  sectie.addEventListener('click', (e) => {
    const k = e.target.closest('button');
    if (!k) return;
    if (k.dataset.afd) afdrukken(k.dataset.afd === 'voorbeeld' ? 'voorbeeld' : k.dataset.afd);
    if (k.dataset.ht) { wie = k.dataset.ht; $('#afd-bestand').click(); }
    if (k.dataset.geen) bewaar({ [k.dataset.geen]: '' });
  });
  $('#afd-bestand').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f || !wie) return;
    if (f.size > 1_500_000) { melding('Die afbeelding is te groot (max. 1,5 MB).', 'fout'); return; }
    lees(f, wie);
  });
  opWijziging(() => { if (staat.tab === 'afdrukken') vul(); });
  window.addEventListener('afdruktab-open', () => { vul(); voorbeeld(); });
  vul();
}

export { voorbeeld as toonVoorbeeld };
