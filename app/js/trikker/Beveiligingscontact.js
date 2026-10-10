// Beveiligingscontact, nagebouwd naar Beveiligingscontact.cs van Trikker.
import { penMiddel, penDun, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Beveiligingscontact';

const P = (x, y) => ({ x, y });

export function maak(props = {}) {
  const n = { Width: 5, Height: 12, Type: 'Magneetcontact', Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null, Parent: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => {
    let zij; let onder; let boven;
    switch (n.Type) {
      case 'Afneemcontact': zij = 1.5; onder = 1.5; boven = 3.5; break;
      case 'Drukmat': zij = 3.5; onder = 2.5; boven = 2.5; break;
      case 'MechanischContact': zij = 3; onder = 3; boven = 3; break;
      case 'Schootcontact': zij = 2; onder = 3.5; boven = 3.5; break;
      case 'Trilcontact': zij = 2.5; onder = 2.5; boven = 2.5; break;
      default: zij = 2.5; onder = 2.5; boven = 2.5; break;
    }
    return { left: zij, top: boven, right: zij, bottom: onder };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    const verbinding = (xOff) => {
      if (ctx === 'Eendraadschema') {
        if (n.Parent) g.drawLine(dun, -W / 2, 0, -xOff, 0);
        if (n.Kind && n.Kind !== 'Nota') g.drawLine(dun, xOff, 0, W / 2, 0);
      }
    };
    switch (n.Type) {
      case 'Schootcontact':
        verbinding(0);
        g.fillEllipse(vast, -1.5, -3, 3, 3);
        g.fillPolygon(vast, [P(0, -3), P(-1.5, 3), P(1.5, 3)]);
        break;
      case 'MechanischContact':
        g.fillEllipse(vast, -W / 2, -W / 2, W, W);
        break;
      case 'Trilcontact':
        verbinding(0);
        g.drawLine(middel, -2, -2, 2, -2);
        g.fillPolygon(vast, [P(0, -2), P(-2, 2), P(2, 2)]);
        break;
      case 'Drukmat':
        verbinding(0);
        g.drawLine(middel, -3, 2, 3, 2);
        g.fillPolygon(vast, [P(-3, -2), P(-1.5, 2), P(1.5, 2), P(3, -2)]);
        break;
      case 'Afneemcontact':
        verbinding(1);
        g.drawEllipse(middel, -1, -1, 2, 2);
        g.drawLine(middel, 0, -1, 0, -3);
        break;
      default:
        verbinding(0);
        g.fillRectangle(vast, -2, -2, 4, 4);
        break;
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, fontNormaal(), vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const t of ['Magneetcontact', 'MechanischContact', 'Schootcontact', 'Trilcontact', 'Drukmat', 'Afneemcontact']) {
    uit.push({ Type: t }, { Type: t, Aantal: 2 }, { Type: t, Kind: 'Lichtpunt' }, { Type: t, Kind: 'Nota' });
  }
  return uit;
}
