// DomoticaSturing, nagebouwd naar DomoticaSturing.cs van Trikker.
import { penDun } from './g.js';

export const KLASSE = 'DomoticaSturing';

export function maak(props = {}) {
  const n = { Height: 3, Drukknop: 'Nee', Draadloos: 'Nee', Geprogrammeerd: 'Nee', Detectie: 'Nee', Kind: null };
  const tel = () => [n.Detectie, n.Draadloos, n.Drukknop, n.Geprogrammeerd].filter((p) => p === 'Ja').length;
  // De breedte volgt uit het aantal pictogrammen; een gezette waarde wordt genegeerd.
  Object.defineProperty(n, 'Width', { get: () => Math.max(5, tel() * 2.5), set: () => {}, enumerable: true });
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g) => {
    const dun = penDun();
    const verschuif = (dx) => g.translateTransform(dx, 0);
    verschuif(((-tel() + 1) * 2.5) / 2);
    if (n.Draadloos === 'Ja') {
      for (const r of [0.5, 1, 1.5]) g.drawArc(dun, -0.85 - r, -r, 2 * r, 2 * r, -45, 90);
      verschuif(2.5);
    }
    if (n.Drukknop === 'Ja') {
      g.drawEllipse(dun, -1, -1, 2, 2);
      g.drawEllipse(dun, -0.6, -0.6, 1.2, 1.2);
      verschuif(2.5);
    }
    if (n.Geprogrammeerd === 'Ja') {
      g.drawEllipse(dun, -1, -1, 2, 2);
      g.drawLine(dun, 0, 0, 0, -0.75);
      g.drawLine(dun, 0, 0, -0.5, 0);
      verschuif(2.5);
    }
    if (n.Detectie === 'Ja') {
      for (const x of [-1.85, -0.85]) g.drawArc(dun, x - 1.5, -1.5, 3, 3, -45, 90);
      verschuif(2.5);
    }
  };
  return n;
}

export function varianten() {
  const uit = [];
  const JN = ['Nee', 'Ja'];
  for (const a of JN) for (const b of JN) for (const c of JN) for (const d of JN) {
    uit.push({ Drukknop: a, Draadloos: b, Geprogrammeerd: c, Detectie: d });
  }
  return uit;
}
