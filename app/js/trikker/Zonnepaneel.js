// Zonnepaneel, nagebouwd naar Zonnepaneel.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Zonnepaneel';

const f = Math.fround;

export function maak(props = {}) {
  const n = { Width: 18, Height: 18, Aantal: 1, Symbool: 'Trikker', Kind: null };
  const zetGrootte = () => {
    if (n.Symbool === 'Trikker') { n.Width = 18; n.Height = 18; } else { n.Width = 12; n.Height = 12; }
  };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal') { if (v >= 1) n.Aantal = v; continue; }
    n[k] = v;
    if (k === 'Symbool') zetGrootte();
  }

  n.textOffset = () => {
    if (n.Symbool !== 'Gestandaardiseerd') return { left: 9.5, top: 9.5, right: 9.5, bottom: 2.5 };
    return { left: 6.5, top: 3.5, right: 6.5, bottom: 3.5 };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width;
    const heeftKind = n.Kind && n.Kind !== 'Nota';
    if (n.Symbool === 'Trikker') {
      const num = 4; const num2 = 3; const num3 = 0.75;
      const x = num / 2; const y = -6;
      if (ctx === 'Eendraadschema') {
        g.drawLine(dun, -W / 2, 0, -W / 2 + num / 2, 0);
        if (heeftKind) g.drawLine(dun, W / 2, 0, W / 2 - num / 2, 0);
      }
      g.drawLine(middel, -W / 2 + num, -num / 2, -W / 2, num / 2);
      g.drawLine(middel, -W / 2, num / 2, W / 2 - num, num / 2);
      g.drawLine(middel, W / 2 - num, num / 2, W / 2, -num / 2);
      g.drawLine(middel, -W / 2 + num, -num / 2, W / 2, -num / 2);
      g.drawLine(dun, -W / 2 + num / 2 + num3, 0, W / 2 - num / 2 - num3, 0);
      for (let i = 1; i < 4; i++) {
        const num4 = num / 2 - num3;
        const num5 = (-W + num) / 2 + (i * (W - num)) / 4;
        g.drawLine(dun, num5 - num4, num4, num5 + num4, -num4);
      }
      g.drawEllipse(middel, num / 2 - num2 / 2, -6 - num2 / 2, num2, num2);
      const stap = f(f(Math.PI) / 3); const eind = f(f(f(Math.PI) * 2));
      for (let a = 0; a < eind; a = f(a + stap)) {
        const x1 = x + 2 * Math.cos(a); const y1 = y + 2 * Math.sin(a);
        g.drawLine(middel, x1, y1, x1 + Math.cos(a), y1 + Math.sin(a));
      }
      if (ctx === 'Eendraadschema' && n.Aantal > 1) g.tryDrawString(`x${n.Aantal}`, font, vast, W / 2 + 1.5, -4, SF.rightCenter);
    } else {
      g.drawRectangle(middel, -W / 2, -3, W, 6);
      g.drawLine(middel, -W / 2, -3, -W / 2 + 5.19, 0);
      g.drawLine(middel, -W / 2, 3, -W / 2 + 5.19, 0);
      if (ctx === 'Eendraadschema' && n.Aantal > 1) g.tryDrawString(`x${n.Aantal}`, font, vast, 0, -5, SF.centerCenter);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const s of ['Trikker', 'Gestandaardiseerd']) {
    for (const a of [1, 2, 12]) {
      uit.push({ Symbool: s, Aantal: a }, { Aantal: a, Symbool: s }, { Symbool: s, Aantal: a, Kind: 'Lichtpunt' });
    }
  }
  uit.push({ Aantal: 0 }, { Symbool: 'Trikker', Kind: 'Nota', Aantal: 3 });
  return uit;
}
