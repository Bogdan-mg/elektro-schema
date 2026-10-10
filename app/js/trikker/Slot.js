// Slot, nagebouwd naar Slot.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF, punt } from './g.js';

export const KLASSE = 'Slot';

export function maak(props = {}) {
  const n = { Width: 5, Height: 12, Type: 'Codeslot', Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: 3, right: n.Width / 2 + 0.5, bottom: 3 });

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    g.drawRectangle(middel, -W / 2, -W / 2, W, W);
    switch (n.Type) {
      case 'Inschakelslot':
        g.fillEllipse(vast, -0.75, -1.5, 1.5, 1.5);
        g.fillPolygon(vast, [punt(0, -1.5), punt(-1, 1.5), punt(1, 1.5)]);
        break;
      case 'Tijdslot':
        g.drawEllipse(dun, -1.5, -1.5, 3, 3);
        g.drawLine(dun, 0, -1.5, 0, 0);
        g.drawLine(dun, 0.7, 0, 0, 0);
        break;
      default:
        // float-lus zoals in C#: num loopt -1.25, 0, 1.25
        for (let num = -1.25; num < 2; num += 1.25) {
          g.drawLine(dun, -W / 2, -num, W / 2, -num);
          g.drawLine(dun, num, -W / 2, num, W / 2);
        }
        break;
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const type of ['Codeslot', 'Inschakelslot', 'Tijdslot']) uit.push({ Type: type }, { Type: type, Aantal: 3 });
  uit.push({ Aantal: 0 });
  return uit;
}
