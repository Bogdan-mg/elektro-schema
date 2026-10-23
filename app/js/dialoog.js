// Eigen dialoogvensters (Electron kent geen prompt()) en korte meldingen.
import { esc } from './symbolen.js';

/**
 * @param {{ titel: string, tekst?: string, velden?: object[], knoppen?: {tekst: string, waarde: string, hoofd?: boolean, gevaar?: boolean}[] }} opties
 * velden: { naam, label, type: 'text'|'number'|'date'|'select'|'checkbox'|'textarea', waarde, opties: [[waarde, label]] }
 * @returns {Promise<{ knop: string|null, waarden: object }>}
 */
export function vraag({ titel, tekst = '', velden = [], knoppen = [{ tekst: 'OK', waarde: 'ok', hoofd: true }, { tekst: 'Annuleren', waarde: null }] }) {
  const d = document.createElement('dialog');
  d.className = 'dialoog';
  const veld = (v) => {
    const id = `v-${v.naam}`;
    if (v.type === 'checkbox') {
      return `<label class="vink"><input type="checkbox" id="${id}" name="${esc(v.naam)}" ${v.waarde ? 'checked' : ''}> ${esc(v.label)}</label>`;
    }
    let invoer;
    if (v.type === 'select') {
      invoer = `<select id="${id}" name="${esc(v.naam)}">${v.opties.map(([w, l]) => `<option value="${esc(w)}" ${String(w) === String(v.waarde) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    } else if (v.type === 'textarea') {
      invoer = `<textarea id="${id}" name="${esc(v.naam)}" rows="3">${esc(v.waarde ?? '')}</textarea>`;
    } else {
      invoer = `<input id="${id}" name="${esc(v.naam)}" type="${v.type || 'text'}" value="${esc(v.waarde ?? '')}" ${v.min != null ? `min="${v.min}"` : ''}>`;
    }
    return `<label class="veld"><span>${esc(v.label)}</span>${invoer}</label>`;
  };
  d.innerHTML = `
    <form method="dialog">
      <h2>${esc(titel)}</h2>
      ${tekst ? `<p>${esc(tekst).replace(/\n/g, '<br>')}</p>` : ''}
      ${velden.map(veld).join('')}
      <div class="knoppen">${knoppen.map((k) => `<button value="${esc(k.waarde ?? '')}" class="${k.hoofd ? 'hoofd' : ''}${k.gevaar ? ' gevaar' : ''}">${esc(k.tekst)}</button>`).join('')}</div>
    </form>`;
  document.body.append(d);
  return new Promise((resolve) => {
    let gekozen = null;
    d.querySelectorAll('.knoppen button').forEach((b, i) => b.addEventListener('click', () => { gekozen = knoppen[i].waarde; }));
    d.addEventListener('close', () => {
      const waarden = {};
      for (const v of velden) {
        const el = d.querySelector(`[name="${CSS.escape(v.naam)}"]`);
        waarden[v.naam] = v.type === 'checkbox' ? el.checked : v.type === 'number' ? Number(el.value) : el.value;
      }
      d.remove();
      resolve({ knop: gekozen, waarden });
    });
    d.showModal();
    const eerste = d.querySelector('input:not([type=checkbox]), select, textarea');
    if (eerste) { eerste.focus(); eerste.select?.(); } else d.querySelector('.knoppen .hoofd')?.focus();
  });
}

export async function bevestig(titel, tekst, jaTekst = 'OK', gevaar = false) {
  const { knop } = await vraag({ titel, tekst, knoppen: [{ tekst: jaTekst, waarde: 'ja', hoofd: !gevaar, gevaar }, { tekst: 'Annuleren', waarde: null }] });
  return knop === 'ja';
}

export async function vraagTekst(titel, waarde = '', label = '') {
  const { knop, waarden } = await vraag({ titel, velden: [{ naam: 't', label, waarde }] });
  return knop === 'ok' ? waarden.t.trim() : null;
}

let meldingTimer = null;
export function melding(tekst, soort = '', { knop = '', actie = null } = {}) {
  let el = document.getElementById('melding');
  if (!el) {
    el = document.createElement('div');
    el.id = 'melding';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = tekst;
  if (knop && actie) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = knop;
    b.addEventListener('click', () => { el.className = ''; actie(); });
    el.append(b);
  }
  el.className = `zichtbaar ${soort}${knop && actie ? ' met-knop' : ''}`;
  clearTimeout(meldingTimer);
  meldingTimer = setTimeout(() => { el.className = ''; }, knop && actie ? 7000 : 3500);
}
