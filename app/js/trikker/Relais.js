// Relais, nagebouwd naar Relais.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Relais';

export function maak(props = {}) {
  const n = { Width: 10, Height: 10, Type: 'NietGespecifieerd', Adres: null, DomoticaFunctie: 'Output', ToonOpGrondplan: 'Nee', Kind: null };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = (rotation = null) => {
    const b = n.Width / 2 + 0.5;
    let top = 3; let bottom = 3;
    if ((n.Type === 'Impulsschakelaar' || n.Type === 'Dimmer') && !n.Adres) {
      if (shouldFlipText(rotation)) top = 6; else bottom = 6;
    }
    return { left: b, top, right: b, bottom };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width;
    g.drawRectangle(middel, -W / 2, -2.5, W, 5);
    switch (n.Type) {
      case 'Impulsschakelaar': {
        const a = 1; const b = 0.4;
        g.drawLine(dun, -3 * a, 3 * b, -a, 3 * b);
        g.drawLine(dun, 3 * a, 3 * b, a, 3 * b);
        g.drawLine(dun, a, 3 * b, a, -3 * b);
        g.drawLine(dun, -a, 3 * b, -a, -3 * b);
        break;
      }
      case 'Relais':
        g.drawLine(dun, -W / 4, -2.5, W / 4, 2.5);
        break;
      case 'Dimmer':
        g.drawLine(dun, -1.75, 0.75, -1.75, -0.75);
        g.drawLine(dun, -1.75, -0.75, 1.75, 0.75);
        g.drawLine(dun, 1.75, 0.75, -1.75, 0.75);
        break;
      case 'Minuterie': {
        let bew = null;
        if (shouldFlipText(rotation)) { bew = g.save(); g.rotateTransform(180); }
        g.tryDrawString('t', font, vast, 0, 0, SF.centerCenter);
        if (bew) g.restore(bew);
        break;
      }
      case 'Thermostaat':
        g.drawEllipse(dun, -1.5, -1.5, 3, 3);
        g.drawLine(dun, -1.5, 0, 1.5, 0);
        break;
      case 'Tijdschakelaar':
        g.drawEllipse(dun, -4, -1.5, 3, 3);
        g.drawLine(dun, -2.5, 0, -1.5, 0);
        g.drawLine(dun, -2.5, 0, -2.5, -1.2);
        g.fillEllipse(vast, -2.75, -0.25, 0.5, 0.5);
        g.drawLine(dun, -0.5, 0, 0.5, 0);
        g.drawLine(dun, 0.5, -1, 2.5, 0);
        g.drawLine(dun, 2.5, 0, 3.5, 0);
        break;
      default:
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const t of ['NietGespecifieerd', 'Minuterie', 'Tijdschakelaar', 'Impulsschakelaar', 'Thermostaat', 'Dimmer', 'Relais']) {
    uit.push({ Type: t }, { Type: t, DomoticaFunctie: 'Input' }, { Type: t, ToonOpGrondplan: 'Ja' });
  }
  uit.push({ Type: 'Dimmer', Adres: '' }, { Width: 14, Type: 'Relais' });
  return uit;
}
