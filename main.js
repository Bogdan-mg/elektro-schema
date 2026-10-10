// Elektro Schema voor Windows: ééndraadschema, situatieschema en materiaallijst, volledig offline.
import { app, BrowserWindow, Menu, dialog, ipcMain, protocol, shell } from 'electron';
import { readFile, writeFile, rename, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HIER, 'app');
const HERSTEL = () => path.join(app.getPath('userData'), 'herstel.eschema');
const EXTENSIE = 'eschema';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
};

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

let venster = null;
let gewijzigd = false;
let magSluiten = false;

// ---------- Bestanden ----------

/** Eerst naar een tijdelijk bestand en dan hernoemen: zo raakt een project nooit half beschreven. */
async function schrijfVeilig(bestand, inhoud) {
  await mkdir(path.dirname(bestand), { recursive: true });
  const tijdelijk = bestand + '.tmp';
  await writeFile(tijdelijk, inhoud);
  await rename(tijdelijk, bestand);
}

const veiligeNaam = (naam) => String(naam || 'project').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim() || 'project';

async function leesProjectBestand(pad) {
  return { pad, inhoud: await readFile(pad, 'utf8') };
}

/** Een projectbestand dat bij het opstarten meegegeven werd (dubbelklik in Verkenner). */
function bestandUitArgumenten(argv) {
  return argv.slice(1).find((a) => a.toLowerCase().endsWith(`.${EXTENSIE}`)) || null;
}

async function bestandStatisch(pad) {
  const relatief = pad === '/' ? 'index.html' : decodeURIComponent(pad).replace(/^\/+/, '');
  const vol = path.normalize(path.join(APP, relatief));
  if (!vol.startsWith(APP)) return new Response('Niet toegestaan', { status: 403 });
  try {
    return new Response(await readFile(vol), { headers: { 'Content-Type': TYPES[path.extname(vol)] || 'application/octet-stream' } });
  } catch {
    return new Response('Niet gevonden', { status: 404 });
  }
}

// ---------- Menu ----------

const stuur = (actie, extra) => venster?.webContents.send('menu', actie, extra);

function maakMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Bestand',
      submenu: [
        { label: 'Nieuw project', accelerator: 'CmdOrCtrl+N', click: () => stuur('nieuw') },
        { label: 'Openen…', accelerator: 'CmdOrCtrl+O', click: () => stuur('openen') },
        { label: 'Opslaan', accelerator: 'CmdOrCtrl+S', click: () => stuur('opslaan') },
        { label: 'Opslaan als…', accelerator: 'CmdOrCtrl+Shift+S', click: () => stuur('opslaanAls') },
        { type: 'separator' },
        { label: 'Projectgegevens…', click: () => stuur('project') },
        { type: 'separator' },
        { label: 'Afdrukken of PDF…', accelerator: 'CmdOrCtrl+P', click: () => stuur('afdrukken') },
        { label: 'Materiaallijst naar Excel (CSV)…', click: () => stuur('csv') },
        { type: 'separator' },
        { label: 'Voorbeeldproject openen', click: () => stuur('voorbeeld') },
        { label: 'Alle symbolen bekijken', click: () => stuur('symbolen') },
        { type: 'separator' },
        { label: 'Afsluiten', role: 'quit' },
      ],
    },
    {
      label: 'Bewerken',
      submenu: [
        { label: 'Ongedaan maken', accelerator: 'CmdOrCtrl+Z', click: () => stuur('ongedaan') },
        { label: 'Opnieuw', accelerator: 'CmdOrCtrl+Y', click: () => stuur('opnieuw') },
        { type: 'separator' },
        { label: 'Knippen', role: 'cut' },
        { label: 'Kopiëren', accelerator: 'CmdOrCtrl+C', click: () => stuur('kopieer') },
        { label: 'Plakken', accelerator: 'CmdOrCtrl+V', click: () => stuur('plak') },
        { label: 'Alles selecteren', accelerator: 'CmdOrCtrl+A', click: () => stuur('alles') },
      ],
    },
    {
      label: 'Beeld',
      submenu: [
        { label: 'Ééndraadschema', accelerator: 'CmdOrCtrl+1', click: () => stuur('tab', 'eendraad') },
        { label: 'Situatieschema', accelerator: 'CmdOrCtrl+2', click: () => stuur('tab', 'situatie') },
        { label: 'Materiaallijst', accelerator: 'CmdOrCtrl+3', click: () => stuur('tab', 'materiaal') },
        { label: 'Controle', accelerator: 'CmdOrCtrl+4', click: () => stuur('tab', 'controle') },
        { type: 'separator' },
        { label: 'Alles groter', role: 'zoomIn' },
        { label: 'Alles kleiner', role: 'zoomOut' },
        { label: 'Normale grootte', role: 'resetZoom' },
        { label: 'Volledig scherm', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Ontwikkelaarshulpmiddelen', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Help',
      submenu: [{
        label: 'Over Elektro Schema',
        click: () => dialog.showMessageBox(venster, {
          message: `Elektro Schema ${app.getVersion()}`,
          detail: 'Ééndraadschema\'s, situatieschema\'s en materiaallijsten tekenen. Werkt volledig offline.\n\n'
            + 'De controle volgt de belangrijkste AREI-regels voor woningen, maar vervangt de keuring niet.',
        }),
      }],
    },
  ]);
}

// ---------- Venster ----------

function maakVenster() {
  venster = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Elektro Schema',
    show: false,
    icon: path.join(HIER, 'build', 'icon.png'),
    backgroundColor: '#f4f5f7',
    webPreferences: { preload: path.join(HIER, 'preload.cjs'), contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(maakMenu());

  venster.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  venster.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) e.preventDefault();
  });

  venster.once('ready-to-show', () => {
    venster.maximize();
    venster.show();
  });

  venster.on('close', async (e) => {
    if (magSluiten || !gewijzigd) return;
    e.preventDefault();
    const { response } = await dialog.showMessageBox(venster, {
      type: 'question',
      buttons: ['Opslaan', 'Niet opslaan', 'Annuleren'],
      defaultId: 0,
      cancelId: 2,
      message: 'Wijzigingen opslaan?',
      detail: 'Er zijn wijzigingen die nog niet opgeslagen zijn.',
    });
    if (response === 0) {
      stuur('opslaanEnSluiten');
    } else if (response === 1) {
      await rm(HERSTEL(), { force: true });
      magSluiten = true;
      venster.close();
    }
  });
  venster.on('closed', () => { venster = null; });

  venster.loadURL('app://elektro/');
}

function registreer() {
  ipcMain.handle('start-bestand', async () => {
    const pad = bestandUitArgumenten(process.argv);
    return pad ? leesProjectBestand(pad).catch(() => null) : null;
  });

  ipcMain.handle('openen', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(venster, {
      title: 'Project openen',
      defaultPath: app.getPath('documents'),
      filters: [{ name: 'Elektro Schema-project', extensions: [EXTENSIE] }, { name: 'Alle bestanden', extensions: ['*'] }],
      properties: ['openFile'],
    });
    if (canceled || !filePaths?.[0]) return null;
    return leesProjectBestand(filePaths[0]);
  });

  ipcMain.handle('opslaan', async (_e, pad, inhoud, naam) => {
    let doel = pad;
    if (!doel) {
      const { canceled, filePath } = await dialog.showSaveDialog(venster, {
        title: 'Project opslaan',
        defaultPath: path.join(app.getPath('documents'), `${veiligeNaam(naam)}.${EXTENSIE}`),
        filters: [{ name: 'Elektro Schema-project', extensions: [EXTENSIE] }],
      });
      if (canceled || !filePath) return null;
      doel = filePath;
    }
    await schrijfVeilig(doel, inhoud);
    await rm(HERSTEL(), { force: true });
    return doel;
  });

  ipcMain.handle('csv', async (_e, naam, inhoud) => {
    const { canceled, filePath } = await dialog.showSaveDialog(venster, {
      title: 'Materiaallijst opslaan',
      defaultPath: path.join(app.getPath('documents'), `${veiligeNaam(naam)} - materiaallijst.csv`),
      filters: [{ name: 'CSV (Excel)', extensions: ['csv'] }],
    });
    if (canceled || !filePath) return null;
    await writeFile(filePath, inhoud);
    return filePath;
  });

  ipcMain.handle('pdf', async (e, naam) => {
    const pdf = await e.sender.printToPDF({ preferCSSPageSize: true, printBackground: true, margins: { marginType: 'none' } });
    // Enkel voor tests: rechtstreeks bewaren zonder venster.
    if (process.env.ELEKTRO_TEST_PDF) {
      await writeFile(process.env.ELEKTRO_TEST_PDF, pdf);
      return process.env.ELEKTRO_TEST_PDF;
    }
    const { canceled, filePath } = await dialog.showSaveDialog(venster, {
      title: 'PDF opslaan',
      defaultPath: path.join(app.getPath('documents'), `${veiligeNaam(naam)}.pdf`),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return null;
    await writeFile(filePath, pdf);
    shell.openPath(filePath);
    return filePath;
  });

  ipcMain.handle('afdrukken', (e) => new Promise((resolve) => {
    e.sender.print({ silent: false, printBackground: true }, (ok, fout) => resolve({ ok, fout: ok ? '' : String(fout || '') }));
  }));

  ipcMain.handle('transparant', (_e, aan) => { venster?.setOpacity(aan ? 0.55 : 1); });

  ipcMain.handle('herstel-lees', () => readFile(HERSTEL(), 'utf8').catch(() => null));
  ipcMain.handle('herstel-bewaar', (_e, inhoud) => schrijfVeilig(HERSTEL(), inhoud));
  ipcMain.handle('herstel-wis', () => rm(HERSTEL(), { force: true }));

  ipcMain.on('gewijzigd', (_e, waarde) => { gewijzigd = Boolean(waarde); });
  ipcMain.on('sluit', () => {
    magSluiten = true;
    venster?.close();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', async (_e, argv) => {
    if (!venster) return;
    if (venster.isMinimized()) venster.restore();
    venster.focus();
    const pad = bestandUitArgumenten(argv);
    if (pad) stuur('openPad', await leesProjectBestand(pad).catch(() => null));
  });

  app.whenReady().then(() => {
    protocol.handle('app', (request) => bestandStatisch(new URL(request.url).pathname));
    registreer();
    maakVenster();
  });

  app.on('window-all-closed', () => app.quit());
}
