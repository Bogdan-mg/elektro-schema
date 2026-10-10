// Camera, nagebouwd naar Camera.cs van Trikker.
import { penMiddel, penDun, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Camera';

const P = (x, y) => ({ x, y });

export function maak(props = {}) {
  const n = {
    Width: 11, Height: 12, Type: 'NietGespecifieerd', Discreet: 'Nee', Beweegbaar: 'Nee', Beweegdetectie: 'Nee',
    Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null,
  };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => {
    let boven; let onder; let rechts; let links;
    switch (n.Type) {
      case 'InBehuizing': boven = onder = 3.5; links = 6; rechts = n.Beweegbaar !== 'Ja' ? 5 : 6; break;
      case 'DomeCamera': onder = 3; boven = 3.5; links = rechts = 5.5; break;
      default: boven = onder = 2; rechts = n.Beweegbaar !== 'Ja' ? 4 : 6; links = 5.5; break;
    }
    return { left: links, top: boven, right: rechts, bottom: onder };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    const bewaard = g.save();
    switch (n.Type) {
      case 'InBehuizing':
        g.drawPolygon(middel, [P(-5.5, -3), P(-5.5, 3), P(3.5, 3), P(4.7, -3)]);
        break;
      case 'DomeCamera':
        g.drawLine(middel, -5.5, -3, 5.5, -3);
        g.drawArc(middel, -5.5, -8.5, 11, 11, 0, 180);
        g.scaleTransform(0.7, 0.7);
        g.rotateTransform(10);
        g.translateTransform(-0.2, -1);
        break;
      default:
        if (ctx === 'Eendraadschema') g.drawLine(dun, -W / 2, 0, -W / 2 + 0.5, 0);
        break;
    }
    g.drawPolygon(middel, [P(-5, -1.5), P(-5, 1.5), P(1.7, 1.5), P(2.7, -1.5)]);
    g.drawLines(middel, [P(2.35, -0.5), P(3.3, -0.5), P(3.3, 0.5), P(2, 0.5)]);
    if (n.Discreet === 'Ja') {
      g.drawLine(dun, -5, -1.5, 1.7, 1.5);
      g.drawLine(dun, 2.7, -1.5, -5, 1.5);
    }
    if (n.Beweegdetectie === 'Ja') {
      g.drawLine(dun, 0, 0, -3, 0);
      g.drawLine(dun, -3, 0, -2, 0.5);
      g.drawLine(dun, -3, 0, -2, -0.5);
    }
    if (n.Beweegbaar === 'Ja') {
      g.drawArc(dun, 1.414, -2, 4, 4, -45, 90);
      g.drawLine(dun, 4.707, -1.414, 5, -0.414);
      g.drawLine(dun, 4.707, 1.414, 5, 0.414);
      g.drawLine(dun, 4.707, -1.414, 5.707, -0.707);
      g.drawLine(dun, 4.707, 1.414, 5.707, 0.707);
    }
    g.restore(bewaard);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, fontNormaal(), vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const t of ['NietGespecifieerd', 'InBehuizing', 'DomeCamera']) {
    for (const d of ['Nee', 'Ja']) for (const bw of ['Nee', 'Ja']) for (const bd of ['Nee', 'Ja']) {
      uit.push({ Type: t, Discreet: d, Beweegbaar: bw, Beweegdetectie: bd });
    }
    uit.push({ Type: t, Aantal: 2 });
  }
  return uit;
}
