// Geluidsbron, nagebouwd naar Geluidsbron.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF, punt } from './g.js';

export const KLASSE = 'Geluidsbron';

export function maak(props = {}) {
  const n = { Width: 7, Height: 10, Type: 'Bel', Autonoom: 'Nee', Adres: null, DomoticaFunctie: 'Output', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue; // de setter weigert waarden kleiner dan 1
    n[k] = v;
  }

  n.textOffset = () => {
    const x = n.Width / 2 + 0.5;
    const onder = 2.5;
    let boven = onder;
    if (n.Autonoom === 'Ja' && n.Type !== 'Hoorn') boven = 3.75;
    return { left: x, top: boven, right: x, bottom: onder };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    switch (n.Type) {
      case 'Zoemer':
        g.drawArc(middel, 1.5, -2, 4, 4, 90, 180);
        g.drawLine(middel, W / 2, -2, W / 2, 2);
        g.drawLine(dun, -W / 2, 0, 1.5, 0);
        break;
      case 'Hoorn':
        g.drawRectangle(middel, -3.5, -2, 4, 4);
        g.drawLines(middel, [punt(0.5, 0), punt(3.5, -1), punt(2.5, 1.5), punt(0.5, 1)]);
        break;
      case 'Sirene':
        g.drawLine(middel, 1.5, -2, 1.5, 2);
        g.drawLine(middel, 1.5, -2, W / 2, 0);
        g.drawLine(middel, 1.5, 2, W / 2, 0);
        g.drawLine(dun, -W / 2, 0, 1.5, 0);
        break;
      default:
        g.drawArc(middel, -0.5, -2, 4, 4, 270, 180);
        g.drawLine(middel, 1.5, -2, 1.5, 2);
        g.drawLine(dun, -W / 2, 0, 1.5, 0);
        break;
    }
    if (n.Autonoom === 'Ja') {
      const y = n.Type !== 'Hoorn' ? -2 : 0;
      g.drawLine(dun, -2, y - 1.25, -2, y + 1.25);
      g.drawLine(middel, -1.5, y - 0.5, -1.5, y + 0.5);
      g.drawLine(dun, -2.75, y, -2, y);
      g.drawLine(dun, -1.5, y, -0.75, y);
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const type of ['Bel', 'Zoemer', 'Hoorn', 'Sirene']) {
    for (const autonoom of ['Nee', 'Ja']) {
      uit.push({ Type: type, Autonoom: autonoom }, { Type: type, Autonoom: autonoom, Aantal: 3 });
    }
  }
  uit.push({ Aantal: 0 }, { Aantal: 2 });
  return uit;
}
