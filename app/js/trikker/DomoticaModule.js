// DomoticaModule, nagebouwd naar DomoticaModule.cs van Trikker.
import { penDun, penDik, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'DomoticaModule';

export function maak(props = {}) {
  const n = { Width: 10, Height: 20, NaamModule: null, Nummeren: 'Ja', SymboolIngang: 'Geen', SymboolUitgangen: 'Geen', Kind: null };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2, top: n.Height / 2 - 2, right: n.Width / 2, bottom: n.Height / 2 - 2 });

  const symboolAC = (g, x, y) => {
    const a = 1.5; const b = 3;
    const p = [{ x: 0, y: -b / 2 }, { x: a, y: -b / 3 }, { x: a, y: -b / 6 }, { x: 0, y: 0 }, { x: -a, y: b / 6 }, { x: -a, y: b / 3 }, { x: 0, y: b / 2 }];
    const bew = g.save();
    g.translateTransform(x, y);
    g.drawBezier(penDun(), p[0], p[1], p[2], p[3]);
    g.drawBezier(penDun(), p[3], p[4], p[5], p[6]);
    g.restore(bew);
  };
  const symboolDC = (g, x, y) => {
    const a = 1; const b = 3;
    const bew = g.save();
    g.translateTransform(x, y);
    g.drawLine(penDun(), a / 2, -b / 2, a / 2, b / 2);
    for (let i = 0; i < 3; i++) g.drawLine(penDun(), -a / 2, -b / 2 + (2 * i * b) / 5, -a / 2, -b / 2 + ((2 * i + 1) * b) / 5);
    g.restore(bew);
  };
  const diagonaal = (g) => {
    if (n.SymboolIngang === 'Geen' || n.SymboolUitgangen === 'Geen') return;
    const x1 = -3; const y1 = -n.Height / 2 + 2;
    const x2 = n.Width / 2; const y2 = n.Height / 2 - 2;
    if (!n.NaamModule) { g.drawLine(penDun(), x1, y1, x2, y2); return; }
    const mx = (x1 + x2) / 2;
    const yOp = (x) => y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
    g.drawLine(penDun(), x1, y1, mx - 1.5, yOp(mx - 1.5));
    g.drawLine(penDun(), x2, y2, mx + 1.5, yOp(mx + 1.5));
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const dik = penDik(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    g.drawRectangle(dik, -3, -H / 2 + 2, W / 2 + 3, H - 4);
    g.drawLine(dun, -W / 2, -H / 2 + 10, -3, -H / 2 + 10);
    const x = -W / 2 + 4; const y = H / 2 - 4.5;
    const x2 = W / 2 - 2; const y2 = -H / 2 + 4.5;
    if (n.SymboolIngang === 'AC') symboolAC(g, x, y); else if (n.SymboolIngang === 'DC') symboolDC(g, x, y);
    if (n.SymboolUitgangen === 'AC') symboolAC(g, x2, y2); else if (n.SymboolUitgangen === 'DC') symboolDC(g, x2, y2);
    diagonaal(g);
    if (n.NaamModule) {
      const bew = g.save();
      let r;
      if (shouldFlipText((rotation ?? 0) - Math.PI / 2)) {
        g.rotateTransform(90);
        r = { x: -H / 2 + 2, y: -W / 2, w: H - 4, h: W / 2 + 3 };
      } else {
        g.rotateTransform(270);
        r = { x: -H / 2 + 2, y: -W / 2 + 2, w: H - 4, h: W / 2 + 3 };
      }
      g.tryDrawString(n.NaamModule, font, vast, r, SF.centerCenter);
      g.restore(bew);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  const S = ['Geen', 'AC', 'DC'];
  for (const i of S) for (const u of S) {
    uit.push({ SymboolIngang: i, SymboolUitgangen: u });
    uit.push({ SymboolIngang: i, SymboolUitgangen: u, NaamModule: 'Dimmer' });
  }
  uit.push({ NaamModule: 'M1' }, { Nummeren: 'Nee' }, { Height: 30, SymboolIngang: 'AC', SymboolUitgangen: 'DC', NaamModule: 'Relais 4x' }, { Width: 14, Height: 26, SymboolIngang: 'DC', SymboolUitgangen: 'AC' });
  return uit;
}
