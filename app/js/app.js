// Opstarten: tabbladen, bestanden openen en opslaan, afdrukken, sneltoetsen en herstel na een crash.
import { nieuwProject, voorbeeldProject, leesProject, teBewaren, EXTENSIE } from './model.js';
import { staat, herteken, laad, wijzig, ongedaan, opnieuw, opWijziging, opGewijzigd, zetGewijzigd } from './staat.js';
import * as editor from './editor.js';
import * as situatie from './situatie.js';
import { startLijsten, csvTekst } from './lijsten.js';
import { bouwAfdruk, ruimAfdrukOp } from './afdruk.js';
import { vraag, bevestig, melding } from './dialoog.js';

const desktop = window.elektro?.desktop ? window.elektro : null;
const $ = (s) => document.querySelector(s);
const HERSTEL = 'elektro-schema-herstel';

// ---------- Tabbladen ----------

function naarTab(tab) {
  staat.tab = tab;
  for (const b of document.querySelectorAll('[data-tab]')) b.classList.toggle('aan', b.dataset.tab === tab);
  for (const s of document.querySelectorAll('.tab')) s.hidden = s.id !== `tab-${tab}`;
  herteken();
}

// ---------- Titel en herstel ----------

function zetTitel() {
  const naam = staat.project.info.titel || 'Nieuw project';
  document.title = `${staat.gewijzigd ? '• ' : ''}${naam} – Elektro Schema`;
  $('#projectnaam').textContent = naam;
  $('#projectnaam').title = staat.pad || 'Nog niet opgeslagen';
  $('#opgeslagen').textContent = staat.gewijzigd ? 'niet opgeslagen' : staat.pad ? 'opgeslagen' : '';
}

let herstelTimer = null;
function bewaarHerstel() {
  clearTimeout(herstelTimer);
  herstelTimer = setTimeout(() => {
    if (!staat.gewijzigd) return;
    const inhoud = JSON.stringify({ pad: staat.pad, project: JSON.parse(teBewaren(staat.project)) });
    if (desktop) {
      desktop.herstelBewaar(inhoud).catch(() => {});
    } else {
      try { localStorage.setItem(HERSTEL, inhoud); } catch { /* te groot of geen opslag */ }
    }
  }, 1500);
}

async function wisHerstel() {
  clearTimeout(herstelTimer);
  if (desktop) await desktop.herstelWis().catch(() => {});
  else try { localStorage.removeItem(HERSTEL); } catch { /* geen opslag */ }
}

async function leesHerstel() {
  try {
    return desktop ? await desktop.herstelLees() : localStorage.getItem(HERSTEL);
  } catch {
    return null;
  }
}

// ---------- Bestanden ----------

/** Vraag wat te doen met niet-opgeslagen wijzigingen. Geeft false als de gebruiker annuleert. */
async function magVerder() {
  if (!staat.gewijzigd) return true;
  const { knop } = await vraag({
    titel: 'Wijzigingen opslaan?',
    tekst: `"${staat.project.info.titel}" heeft wijzigingen die nog niet opgeslagen zijn.`,
    knoppen: [{ tekst: 'Opslaan', waarde: 'opslaan', hoofd: true }, { tekst: 'Niet opslaan', waarde: 'weg' }, { tekst: 'Annuleren', waarde: null }],
  });
  if (knop === 'opslaan') return opslaan();
  return knop === 'weg';
}

function openProject(project, pad) {
  laad(project, pad);
  editor.herstelZicht();
  situatie.herstelZicht();
  herteken();
}

async function nieuw() {
  if (!await magVerder()) return;
  await wisHerstel();
  openProject(nieuwProject(), null);
  naarTab('eendraad');
  projectgegevens();
}

async function openTekst(tekst, pad) {
  try {
    openProject(leesProject(tekst), pad);
    await wisHerstel();
    melding('Project geopend.');
  } catch (e) {
    melding(e.message, 'fout');
  }
}

async function openen() {
  if (!await magVerder()) return;
  if (desktop) {
    const r = await desktop.openen().catch((e) => { melding(`Openen mislukt: ${e.message}`, 'fout'); return null; });
    if (r) await openTekst(r.inhoud, r.pad);
  } else {
    $('#open-bestand').click();
  }
}

/** Opslaan; als = altijd naar een nieuw bestand vragen. Geeft true als het gelukt is. */
async function opslaan(als = false) {
  const inhoud = teBewaren(staat.project);
  const naam = staat.project.info.titel || 'project';
  if (desktop) {
    try {
      const pad = await desktop.opslaan(als ? null : staat.pad, inhoud, naam);
      if (!pad) return false;
      staat.pad = pad;
    } catch (e) {
      melding(`Opslaan mislukt: ${e.message}`, 'fout');
      return false;
    }
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([inhoud], { type: 'application/json' }));
    a.download = `${naam}.${EXTENSIE}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  await wisHerstel();
  zetGewijzigd(false);
  melding('Opgeslagen.');
  return true;
}

async function projectgegevens() {
  const i = staat.project.info;
  const { knop, waarden } = await vraag({
    titel: 'Projectgegevens',
    tekst: 'Deze gegevens komen in de titelhoek van elk blad.',
    velden: [
      { naam: 'titel', label: 'Project', waarde: i.titel },
      { naam: 'klant', label: 'Klant', waarde: i.klant },
      { naam: 'adres', label: 'Adres van de installatie', waarde: i.adres },
      { naam: 'installateur', label: 'Installateur', waarde: i.installateur },
      { naam: 'datum', label: 'Datum', type: 'date', waarde: i.datum },
      { naam: 'opmerking', label: 'Opmerking', type: 'textarea', waarde: i.opmerking },
    ],
  });
  if (knop !== 'ok') return;
  wijzig((p) => { p.info = { ...p.info, ...waarden, titel: waarden.titel.trim() || 'Nieuw project' }; });
}

async function voorbeeld() {
  if (!await magVerder()) return;
  openProject(voorbeeldProject(), null);
  naarTab('eendraad');
  melding('Voorbeeldproject geopend. Sla het op als je het wil bewaren.');
}

// ---------- Afdrukken, PDF en CSV ----------

async function afdrukken() {
  const { knop, waarden } = await vraag({
    titel: 'Afdrukken of PDF',
    velden: [
      { naam: 'formaat', label: 'Papier', type: 'select', waarde: 'A4', opties: [['A4', 'A4 liggend'], ['A3', 'A3 liggend']] },
      { naam: 'eendraad', label: 'Ééndraadschema', type: 'checkbox', waarde: true },
      { naam: 'situatie', label: 'Situatieschema', type: 'checkbox', waarde: true },
      { naam: 'materiaal', label: 'Materiaallijst', type: 'checkbox', waarde: true },
    ],
    knoppen: [
      ...(desktop ? [{ tekst: 'PDF opslaan', waarde: 'pdf', hoofd: true }] : []),
      { tekst: 'Afdrukken', waarde: 'print', hoofd: !desktop },
      { tekst: 'Annuleren', waarde: null },
    ],
  });
  if (!knop) return;
  const aantal = bouwAfdruk(waarden);
  if (!aantal) {
    melding('Er is niets om af te drukken.', 'fout');
    return;
  }
  document.body.classList.add('afdrukken');
  // Even wachten zodat afbeeldingen in de bladen geladen zijn.
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 150)));
  try {
    if (knop === 'pdf') {
      const pad = await desktop.pdf(staat.project.info.titel || 'project');
      if (pad) melding('PDF opgeslagen.');
    } else if (desktop) {
      await desktop.afdrukken();
    } else {
      window.print();
    }
  } catch (e) {
    melding(`Afdrukken mislukt: ${e.message}`, 'fout');
  } finally {
    document.body.classList.remove('afdrukken');
    ruimAfdrukOp();
  }
}

async function csv() {
  const inhoud = csvTekst();
  const naam = staat.project.info.titel || 'project';
  if (desktop) {
    const pad = await desktop.csv(naam, inhoud).catch((e) => { melding(`Opslaan mislukt: ${e.message}`, 'fout'); return null; });
    if (pad) melding('Materiaallijst opgeslagen.');
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([inhoud], { type: 'text/csv;charset=utf-8' }));
    a.download = `${naam} - materiaallijst.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
}

// ---------- Acties en sneltoetsen ----------

const acties = {
  nieuw,
  openen,
  opslaan: () => opslaan(false),
  opslaanAls: () => opslaan(true),
  project: projectgegevens,
  afdrukken,
  csv,
  voorbeeld,
  ongedaan: () => { if (!ongedaan()) melding('Niets meer om ongedaan te maken.'); },
  opnieuw: () => { if (!opnieuw()) melding('Niets om opnieuw te doen.'); },
  tab: (t) => naarTab(t),
  openPad: (r) => r && magVerder().then((ok) => ok && openTekst(r.inhoud, r.pad)),
  opslaanEnSluiten: async () => { if (await opslaan(false)) desktop?.sluit(); },
};

function sneltoetsen(e) {
  if (document.querySelector('dialog[open]')) return;
  const inVeld = e.target.closest('input, textarea, select, [contenteditable]');
  const ctrl = e.ctrlKey || e.metaKey;
  const toets = e.key.toLowerCase();

  // In de desktopversie doet het menu Ctrl+S, Ctrl+O, … zelf.
  if (ctrl && !desktop) {
    const map = { s: e.shiftKey ? 'opslaanAls' : 'opslaan', o: 'openen', n: 'nieuw', p: 'afdrukken', z: e.shiftKey ? 'opnieuw' : 'ongedaan', y: 'opnieuw' };
    if (map[toets]) {
      e.preventDefault();
      acties[map[toets]]();
      return;
    }
    if (['1', '2', '3', '4'].includes(toets)) {
      e.preventDefault();
      naarTab(['eendraad', 'situatie', 'materiaal', 'controle'][Number(toets) - 1]);
      return;
    }
  }
  if (inVeld) return;

  if (staat.tab === 'eendraad') {
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); editor.verwijderGekozen(); }
    else if (ctrl && toets === 'd') { e.preventDefault(); editor.dupliceerGekozen(); }
    else if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); editor.verschuifGekozen(-1); }
    else if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); editor.verschuifGekozen(1); }
  } else if (staat.tab === 'situatie') {
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); situatie.verwijderGekozen(); }
    else if (toets === 'r' && !ctrl) { e.preventDefault(); situatie.draaiGekozen(); }
    else if (e.key === 'Escape') situatie.annuleer();
  }
}

// ---------- Opstarten ----------

async function start() {
  editor.startEditor();
  situatie.startSituatie();
  startLijsten({ naarTab });

  for (const b of document.querySelectorAll('[data-tab]')) b.addEventListener('click', () => naarTab(b.dataset.tab));
  for (const b of document.querySelectorAll('[data-actie]')) b.addEventListener('click', () => acties[b.dataset.actie]());
  $('#projectnaam').addEventListener('click', projectgegevens);
  $('#open-bestand').addEventListener('change', async (e) => {
    const bestand = e.target.files?.[0];
    e.target.value = '';
    if (bestand) await openTekst(await bestand.text(), null);
  });
  window.addEventListener('keydown', sneltoetsen);
  window.addEventListener('actie', (e) => acties[e.detail]?.());
  window.addEventListener('beforeunload', (e) => {
    if (!desktop && staat.gewijzigd) e.preventDefault();
  });

  opGewijzigd((waarde) => {
    desktop?.zetGewijzigd(waarde);
    zetTitel();
  });
  opWijziging(() => {
    zetTitel();
    if (staat.gewijzigd) bewaarHerstel();
  });

  if (desktop) {
    desktop.opMenu((actie, extra) => {
      // Terwijl een venster open is: ongedaan maken geldt voor het tekstveld, andere menu-acties wachten.
      if (document.querySelector('dialog[open]')) {
        if (actie === 'ongedaan' || actie === 'opnieuw') document.execCommand(actie === 'ongedaan' ? 'undo' : 'redo');
        return;
      }
      acties[actie]?.(extra);
    });
  }

  naarTab('eendraad');
  zetTitel();

  // Een bestand dat met een dubbelklik geopend werd, of werk dat niet opgeslagen was.
  const startBestand = desktop ? await desktop.startBestand() : null;
  if (startBestand) {
    await openTekst(startBestand.inhoud, startBestand.pad);
    return;
  }
  const herstel = await leesHerstel();
  if (herstel) {
    let data = null;
    try { data = JSON.parse(herstel); } catch { /* kapot herstelbestand */ }
    if (data?.project && await bevestig('Werk terugzetten?', `Er is niet-opgeslagen werk gevonden van "${data.project.info?.titel || 'een project'}". Wil je dat terugzetten?`, 'Terugzetten')) {
      try {
        openProject(leesProject(JSON.stringify(data.project)), data.pad || null);
        zetGewijzigd(true);
        return;
      } catch (e) {
        melding(e.message, 'fout');
      }
    }
    await wisHerstel();
  }
}

start();
