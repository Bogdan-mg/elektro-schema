// De teksten van Trikker (Nederlands), met dezelfde regels als ResourceStore.Get/GetSafe/GetSafeFormat in Trikker.
import { TEKSTEN } from './teksten.js';

/** {{Sleutel}} vervangen door de tekst van die sleutel; zoals in Trikker enkel de eerste verwijzing in een tekst. */
function verwerk(waarde) {
  const begin = waarde.indexOf('{{');
  const einde = waarde.indexOf('}}');
  if (begin > -1 && einde > -1 && einde > begin) {
    const sleutel = waarde.slice(begin + 2, einde);
    const nieuw = krijg(sleutel);
    return waarde.split(`{{${sleutel}}}`).join(nieuw ?? '');
  }
  return waarde;
}

/** De tekst, of null als de sleutel niet bestaat (ResourceStore.Get). */
export function krijg(sleutel) {
  const w = TEKSTEN[sleutel];
  if (w === undefined) return null;
  return verwerk(w).replace(/\\n/g, '\n');
}

/** De tekst, of de sleutel zelf als die niet bestaat (ResourceStore.GetSafe). */
export const T = (sleutel) => krijg(sleutel) ?? sleutel;

/** Een tekst met {0}, {1}, … (ResourceStore.GetSafeFormat). */
export function TF(sleutel, ...args) {
  const f = krijg(sleutel);
  if (f === null) return sleutel;
  return f.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? ''));
}

/** De tekst van een Model-eigenschap of -waarde: Text.Model.<sleutel>. */
export const M = (sleutel) => T(`Text.Model.${sleutel}`);
