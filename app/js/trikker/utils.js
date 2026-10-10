// Hulpfuncties uit Trikker (Utilities.cs).
const TWEE_PI = Math.PI * 2;

export const normalizedAngleRadians = (r) => { let n = r % TWEE_PI; if (n < 0) n += TWEE_PI; return n; };

/** Moet de tekst bij deze draaiing (in radialen) 180° gedraaid worden zodat ze leesbaar blijft? */
export function shouldFlipText(rotation) {
  if (rotation === null || rotation === undefined) return false;
  const n = normalizedAngleRadians(rotation);
  const d = 0.087;
  return n >= Math.PI / 2 - d && n < 4.71238898038469 - d;
}

export const floatsAreEqual = (a, b) => Math.abs(a - b) < 0.05;
