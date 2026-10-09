// Brug tussen de app en Windows: bestanden openen en opslaan, PDF en afdrukken, herstel na een crash.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('elektro', {
  desktop: true,
  startBestand: () => ipcRenderer.invoke('start-bestand'),
  openen: () => ipcRenderer.invoke('openen'),
  opslaan: (pad, inhoud, naam) => ipcRenderer.invoke('opslaan', pad, inhoud, naam),
  csv: (naam, inhoud) => ipcRenderer.invoke('csv', naam, inhoud),
  pdf: (naam) => ipcRenderer.invoke('pdf', naam),
  afdrukken: () => ipcRenderer.invoke('afdrukken'),
  herstelLees: () => ipcRenderer.invoke('herstel-lees'),
  herstelBewaar: (inhoud) => ipcRenderer.invoke('herstel-bewaar', inhoud),
  herstelWis: () => ipcRenderer.invoke('herstel-wis'),
  zetGewijzigd: (waarde) => ipcRenderer.send('gewijzigd', waarde),
  sluit: () => ipcRenderer.send('sluit'),
  opMenu: (fn) => ipcRenderer.on('menu', (_e, actie, extra) => fn(actie, extra)),
});
