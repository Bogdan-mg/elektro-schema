// Opstarten: tabbladen, bestanden openen en opslaan, afdrukken, sneltoetsen en herstel na een crash.
import { nieuwProject, voorbeeldProject, leesProject, teBewaren, EXTENSIE } from './model.js';
import { toonHulp, welkomGezien } from './welkom.js';
import { staat, herteken, laad, wijzig, ongedaan, opnieuw, opWijziging, opGewijzigd, zetGewijzigd } from './staat.js';
import * as editor from './editor.js';
import * as situatie from './situatie.js';
import { startDocument } from './document.js';
import { startLijsten, csvTekst } from './lijsten.js';
import { bouwAfdruk, ruimAfdrukOp } from './afdruk.js';
import { startAfdrukTab, afdrukParameters, toonVoorbeeld } from './afdruktab.js';
import { startExtra } from './extra.js';
import { startWoning } from './woning.js';
import { vraag, bevestig, melding } from './dialoog.js';
import { symbolenProject } from './overzicht.js';
import { leesInstellingen, instellingenDialoog } from './instellingen.js';
import { xlsxBase64 } from './lijsten.js';
import { grondplanPng } from './exporteer.js';
import { naarBase64 } from './xlsx.js';

const desktop = window.elektro?.desktop ? window.elektro : null;
const $ = (s) => document.querySelector(s);
const HERSTEL = 'elektro-schema-herstel';

// ---------- Tabbladen ----------

function naarTab(tab) {
  staat.tab = tab;
  if (tab === 'afdrukken') setTimeout(() => window.dispatchEvent(new Event('afdruktab-open')), 0);
  if (tab === 'woning') setTimeout(() => window.dispatchEvent(new Event('woning-open')), 0);
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
  const p = nieuwProject();
  p.document.controle.naam = leesInstellingen().controle || '';
  openProject(p, null);
  naarTab('document');
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
      { naam: 'adres', label: 'Adres van de klant', waarde: i.adres },
      { naam: 'werfAdres', label: 'Werfadres (leeg = hetzelfde adres)', waarde: i.werfAdres || '' },
      { naam: 'installateurType', label: 'Installateur', type: 'select', waarde: i.installateurEigen === false ? 'ander' : 'eigen', opties: [['eigen', 'Ikzelf (mijn gegevens uit Instellingen)'], ['ander', 'Iemand anders']] },
      { naam: 'uitvoerder', label: 'Gegevens van de installateur (als iemand anders)', type: 'textarea', waarde: i.uitvoerder || i.installateur || '' },
      { naam: 'controle', label: 'Controleorganisme', type: 'textarea', waarde: i.controle || '' },
      { naam: 'datum', label: 'Datum', type: 'date', waarde: i.datum },
      { naam: 'opmerking', label: 'Opmerking', type: 'textarea', waarde: i.opmerking },
    ],
  });
  if (knop !== 'ok') return;
  const { installateurType, ...rest } = waarden;
  wijzig((p) => { p.info = { ...p.info, ...rest, installateurEigen: installateurType !== 'ander', titel: waarden.titel.trim() || 'Nieuw project' }; });
}

async function instellingen() {
  const r = await instellingenDialoog(staat.project, desktop);
  if (!r) return;
  wijzig((p) => { p.opties = { ...p.opties, ...r.opties }; });
  window.dispatchEvent(new Event('instellingen-bewaard'));
  melding('Instellingen bewaard.');
}

async function symbolen() {
  if (!await magVerder()) return;
  openProject(symbolenProject(), null);
  naarTab('eendraad');
  melding('Alle onderdelen met hun varianten. Sla dit project niet op over je eigen werk.');
}

async function voorbeeld() {
  if (!await magVerder()) return;
  openProject(voorbeeldProject(), null);
  naarTab('eendraad');
  melding('Voorbeeldproject geopend. Sla het op als je het wil bewaren.');
}

// ---------- Afdrukken, PDF en CSV ----------

async function afdrukken(modus) {
  if (!['print', 'pdf', 'voorbeeld'].includes(modus)) { naarTab('afdrukken'); return; }
  if (modus === 'voorbeeld') { toonVoorbeeld(); return; }
  const knop = modus;
  const waarden = afdrukParameters();
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

/** Een binair bestand bewaren: via het Windows-gedeelte, of als download in de browser. */
async function bewaarBestand(naam, bytes, soort, extensie, mime) {
  if (desktop) return desktop.bewaarBinair(naam, naarBase64(bytes), soort, extensie);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes], { type: mime }));
  a.download = `${naam}.${extensie}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return naam;
}

async function xlsx() {
  const naam = `${staat.project.info.titel || 'project'} - materiaallijst`;
  const bytes = Uint8Array.from(atob(xlsxBase64()), (c) => c.charCodeAt(0));
  const pad = await bewaarBestand(naam, bytes, 'Excel', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').catch((e) => { melding(`Opslaan mislukt: ${e.message}`, 'fout'); return null; });
  if (pad) melding('Materiaallijst opgeslagen als Excel-bestand.');
}

async function niko() {
  try {
    const blob = await grondplanPng(staat.project);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const pad = await bewaarBestand(`${staat.project.info.titel || 'project'} - grondplan`, bytes, 'PNG-afbeelding', 'png', 'image/png');
    if (pad) melding('Grondplan opgeslagen. In Niko Home Control importeer je het via Grondplan opladen.');
  } catch (e) {
    melding(e.message, 'fout');
  }
}

function handleiding() {
  if (desktop) desktop.handleiding();
  else window.open('/handleiding.html', '_blank');
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

const inVeldActief = () => Boolean(document.activeElement?.closest?.('input, textarea, [contenteditable]'));

function zetTransparant(aan) {
  if (desktop?.transparant) desktop.transparant(aan);
  else document.body.style.opacity = aan ? '0.55' : '';
}

function hulp(eerste = false) {
  toonHulp({ eerste, nieuw, voorbeeld, openen, handleiding });
}

const acties = {
  hulp: () => hulp(false),
  nieuw,
  openen,
  opslaan: () => opslaan(false),
  opslaanAls: () => opslaan(true),
  project: () => naarTab('document'),
  afsluiten: async () => { if (!await magVerder()) return; if (desktop) desktop.sluit(); else window.close(); },
  afdrukken,
  csv,
  xlsx,
  niko,
  instellingen,
  handleiding,
  voorbeeld,
  symbolen,
  ongedaan: () => { if (!ongedaan()) melding('Niets meer om ongedaan te maken.'); },
  opnieuw: () => { if (!opnieuw()) melding('Niets om opnieuw te doen.'); },
  tab: (t) => naarTab(t),
  zoekES: () => {
    const id = situatie.gekozenSymbool();
    if (!id) return;
    staat.selectie = id;
    naarTab('eendraad');
  },
  zoekSS: () => {
    const id = staat.selectie;
    if (!id || id === 'hoofd') return;
    naarTab('situatie');
    if (!situatie.toonOpPlan(id)) melding('Dit onderdeel staat nog niet op het situatieschema.');
  },
  kopieer: () => (inVeldActief() ? document.execCommand('copy') : staat.tab === 'situatie' ? situatie.kopieer() : editor.kopieerGekozen?.()),
  plak: () => (inVeldActief() ? navigator.clipboard?.readText().then((t) => document.execCommand('insertText', false, t)).catch(() => {}) : staat.tab === 'situatie' ? situatie.plak() : editor.plakGekopieerd?.()),
  alles: () => (inVeldActief() ? document.activeElement.select?.() : staat.tab === 'situatie' ? situatie.alleSelecteren() : undefined),
  transparantAan: () => zetTransparant(true),
  transparantUit: () => zetTransparant(false),
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
    if (toets === '5') { e.preventDefault(); acties.afdrukken(); return; }
    if (toets === '6') { e.preventDefault(); acties.instellingen(); return; }
  }
  if (e.key === 'F1') { e.preventDefault(); handleiding(); return; }
  if (inVeld) return;
  if (e.key === '?') { e.preventDefault(); hulp(false); return; }
  // In de desktopversie doet het menu kopiëren, plakken en alles selecteren zelf.
  if (desktop && ctrl && ['c', 'v', 'a'].includes(toets)) return;

  if (staat.tab === 'eendraad') {
    if (editor.eendraadToets(e)) { e.preventDefault(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); editor.verwijderGekozen(); }
    else if (ctrl && toets === 'd') { e.preventDefault(); editor.dupliceerGekozen(); }
    else if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); editor.verschuifGekozen(-1); }
    else if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); editor.verschuifGekozen(1); }
  } else if (staat.tab === 'situatie') {
    if (situatie.situatieToets(e)) e.preventDefault();
  }
}

// ---------- Backups ----------

let laatsteBackup = '';
async function maakBackup() {
  const i = leesInstellingen().backup;
  if (!desktop || !i.aan || !staat.gewijzigd) return;
  const inhoud = teBewaren(staat.project);
  if (inhoud === laatsteBackup) return; // niets veranderd sinds de vorige backup
  laatsteBackup = inhoud;
  await desktop.backup(staat.project.info.titel || 'project', inhoud, i.map).catch(() => {});
}

function startBackups() {
  let timer = null;
  const plan = () => {
    clearInterval(timer);
    timer = setInterval(maakBackup, Math.max(1, leesInstellingen().backup.minuten) * 60_000);
  };
  plan();
  window.addEventListener('instellingen-bewaard', plan);
}

// ---------- Opstarten ----------

async function start() {
  startDocument();
  startAfdrukTab({ afdrukken });
  startWoning({ acties: { tab: naarTab } });
  startExtra({ acties: () => acties });
  editor.startEditor();
  situatie.startSituatie();
  startLijsten({ naarTab });

  for (const b of document.querySelectorAll('[data-tab]')) b.addEventListener('click', () => naarTab(b.dataset.tab));
  for (const b of document.querySelectorAll('[data-actie]')) b.addEventListener('click', () => acties[b.dataset.actie]());
  $('#projectnaam').addEventListener('click', () => naarTab('document'));
  $('#open-bestand').addEventListener('change', async (e) => {
    const bestand = e.target.files?.[0];
    e.target.value = '';
    if (bestand) await openTekst(await bestand.text(), null);
  });
  window.addEventListener('keydown', sneltoetsen);
  // Een projectbestand op het venster slepen opent het (een afbeelding op het plan slepen blijft gewoon werken).
  const isProject = (e) => [...(e.dataTransfer?.items || [])].some((i) => i.kind === 'file') && [...(e.dataTransfer?.files || [])].every((f) => !f.name || /\.(eschema|json)$/i.test(f.name));
  window.addEventListener('dragover', (e) => { if (!e.defaultPrevented && isProject(e)) e.preventDefault(); });
  window.addEventListener('drop', async (e) => {
    if (e.defaultPrevented) return;
    const bestand = [...(e.dataTransfer?.files || [])].find((f) => /\.(eschema|json)$/i.test(f.name));
    if (!bestand) return;
    e.preventDefault();
    if (await magVerder()) await openTekst(await bestand.text(), null);
  });
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

  naarTab('woning');
  zetTitel();
  startBackups();

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
  // Voor wie het programma voor het eerst opent: een kort welkom met de werkwijze.
  if (!welkomGezien()) hulp(true);
}

start();
