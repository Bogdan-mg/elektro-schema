// Toestel, nagebouwd naar Toestel.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { penMiddel, penDun, kwast, fontTiny, SF, rechthoek } from './g.js';

export const KLASSE = 'Toestel';

const TYPES = ['NietGespecifierd', 'Kookfornuis', 'Microgolfoven', 'ElektrischeOven', 'Wasmachine', 'Droogkast', 'Vaatwasmachine',
  'Koelkast', 'Diepvriezer', 'Ventilator', 'Stoomoven', 'LaadpuntAuto', 'LaadpuntAuto2'];

export function maak(props = {}) {
  const n = {
    Width: 9, Height: 9, Type: 'NietGespecifierd', Adres: '', DomoticaFunctie: 'Output', ToonOpBom: 'Nee',
    Rotation: 0, Parent: null, Kind: null,
  };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => {
    const l = n.Width / 2 + 0.5; const t = n.Height / 2 + 0.5;
    return { left: l, top: t, right: l, bottom: t };
  };

  const bolleke = (g, x, y, vast) => g.fillEllipse(vast, x - 1, y - 1, 2, 2);
  const sterretje = (g, x, y, dun, vast) => {
    for (let i = 0; i < 6; i++) {
      const hoek = ((30 + i * 30) * Math.PI * 2) / 180;
      const px = x + Math.cos(hoek);
      const py = y + Math.sin(hoek);
      g.drawLine(dun, px, py, x, y);
      g.fillEllipse(vast, px - 0.4, py - 0.4, 0.8, 0.8);
    }
  };

  // meerregelig: de laadpunttekst bestaat in Trikker uit twee regels; de proefopstelling schrijft haar als één tekst (zonder regeleinde).
  n.render = (g, ctx = 'Grondplan', rotation = null, adresPlaatsing = null, opties = {}) => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const tiny = fontTiny();
    const W = n.Width; const H = n.Height;
    if (n.Type !== 'LaadpuntAuto') g.drawRectangle(middel, -W / 2, -H / 2, W, H);
    const bewaard = g.save();
    if (ctx === 'Eendraadschema') g.rotateTransform((-n.Rotation * 180) / Math.PI);
    switch (n.Type) {
      case 'Kookfornuis':
        bolleke(g, -W / 4, -H / 4, vast); bolleke(g, W / 4, -H / 4, vast); bolleke(g, W / 4, H / 4, vast);
        break;
      case 'Microgolfoven':
        for (let j = 0; j < 3; j++) {
          g.drawArc(dun, -W / 4, (H / 4) * (j - 1.5), W / 4, H / 4, 0, -180);
          g.drawArc(dun, 0, (H / 4) * (j - 1.5), W / 4, H / 4, 0, 180);
        }
        break;
      case 'ElektrischeOven':
        g.drawLine(dun, -W / 2, -H / 4, W / 2, -H / 4);
        bolleke(g, 0, H / 4, vast);
        break;
      case 'Wasmachine':
        g.drawEllipse(dun, -W / 3, -H / 3, (2 * W) / 3, (2 * H) / 3);
        bolleke(g, 0, 0, vast);
        break;
      case 'Droogkast':
        g.drawEllipse(dun, -W / 3, -H / 3, W / 3, H / 3);
        g.drawEllipse(dun, 0, -H / 3, W / 3, H / 3);
        bolleke(g, 0, H / 4, vast);
        break;
      case 'Vaatwasmachine': {
        g.drawEllipse(dun, -W / 4, -H / 4, W / 2, H / 2);
        const k = W / 2 - (Math.sqrt(2) * W) / 8;
        g.drawLine(dun, -W / 2, -H / 2, k - W / 2, k - H / 2);
        g.drawLine(dun, -W / 2, H / 2, k - W / 2, -k + H / 2);
        g.drawLine(dun, W / 2, -H / 2, -k + W / 2, k - H / 2);
        g.drawLine(dun, W / 2, H / 2, -k + W / 2, -k + H / 2);
        break;
      }
      case 'Koelkast':
        sterretje(g, 0, 0, dun, vast);
        break;
      case 'Diepvriezer':
        for (let k = 0; k < 3; k++) sterretje(g, (k - 1) * 3, 0, dun, vast);
        break;
      case 'Ventilator':
        g.drawEllipse(dun, -3, -1.5, 3, 3);
        g.drawEllipse(dun, 0, -1.5, 3, 3);
        break;
      case 'Stoomoven': {
        const a = 2.2; const b = 3; const c = 1.3;
        for (let i = -1; i <= 1; i++) {
          g.drawArc(dun, -b, i * c, b, a, 180, 90);
          g.drawArc(dun, -b / 2, i * c - a / 2, b, a, 180, 180);
          g.drawArc(dun, 0, i * c, b, a, 270, 90);
        }
        break;
      }
      case 'LaadpuntAuto': {
        g.drawRectangle(middel, -3.5, 3.5, 7, 1);
        g.drawLine(middel, -3, 3.5, -3, -4.5);
        g.drawLine(middel, -3, -4.5, 3, -4.5);
        g.drawLine(middel, 3, 3.5, 3, -4.5);
        g.drawRectangle(dun, -2, -4, 4, 2.5);
        g.drawLine(dun, 0, -1, 0, 3);
        g.drawLine(dun, 3, -2, 3.5, -2);
        g.drawLine(dun, 3.5, -2, 3.5, 2);
        g.drawLine(dun, 3.5, 2, 4, 2);
        g.drawLine(dun, 4, 2, 4, -3);
        const w = 0.7;
        g.fillRectangle(vast, 4 - w / 2, -4.5, w, 1.5);
        if (opties.meerregelig) {
          // twee regels, samen gecentreerd in het vak (-3,-1,6,4); Arial heeft een regelafstand van ±1,149 em
          const halve = 1.149 / 2;
          g.tryDrawString('V  E', tiny, vast, 0, 1 - halve, SF.centerCenter);
          g.tryDrawString('E  V', tiny, vast, 0, 1 + halve, SF.centerCenter);
        } else {
          g.tryDrawString('V  EE  V', tiny, vast, rechthoek(-3, -1, 6, 4), SF.centerCenter);
        }
        if (ctx === 'Eendraadschema' && n.Parent && Math.abs(n.Rotation) < 0.05) g.drawLine(dun, -4.5, 0, -3, 0);
        break;
      }
      case 'LaadpuntAuto2':
        g.drawArc(middel, -2.5, -3, 6, 6, 270, 270);
        g.drawArc(middel, -3.25, -2.5, 1.5, 2, 0, 180);
        g.drawLine(middel, -2.5, -0.5, -2.5, 0);
        g.drawLine(middel, -3.25, -1.5, -3.25, -2.25);
        g.drawLine(middel, -3.25, -2.25, -1.75, -2.25);
        g.drawLine(middel, -1.75, -2.25, -1.75, -1.5);
        g.drawLine(middel, -3, -2.25, -3, -3);
        g.drawLine(middel, -2, -2.25, -2, -3);
        g.drawArc(dun, -1.25, 1.25, 1, 0.5, 0, 180);
        g.drawLine(dun, -1.25, 1.5, -1.25, 1);
        g.drawLine(dun, -0.25, 1.5, -0.25, 1);
        g.drawArc(dun, 1.25, 1.25, 1, 0.5, 0, 180);
        g.drawLine(dun, 1.25, 1.5, 1.25, 1);
        g.drawLine(dun, 2.25, 1.5, 2.25, 1);
        g.drawLine(dun, -1.5, 1, -1.25, 1);
        g.drawLine(dun, -0.25, 1, 1.25, 1);
        g.drawLine(dun, 2.25, 1, 2.5, 1);
        g.drawLine(dun, -1.5, 1, -1.5, 0);
        g.drawLine(dun, -1.5, 0, -1.25, 0);
        g.drawLine(dun, -1.25, 0, -0.75, -1.5);
        g.drawLine(dun, -0.75, -1.5, 1.75, -1.5);
        g.drawLine(dun, 1.75, -1.5, 2.25, 0);
        g.drawLine(dun, 2.25, 0, 2.5, 0);
        g.drawLine(dun, 2.5, 0, 2.5, 1);
        g.drawEllipse(dun, -1, 0, 0.75, 0.75);
        g.drawEllipse(dun, 1.25, 0, 0.75, 0.75);
        g.drawLine(dun, 0, 0, 1, 0);
        break;
      default:
    }
    g.restore(bewaard);
  };
  return n;
}

export function varianten() {
  const uit = TYPES.map((Type) => ({ Type }));
  uit.push({}, { Type: 'LaadpuntAuto', ToonOpBom: 'Ja' }, { Type: 'Kookfornuis', ToonOpBom: 'Ja' });
  return uit;
}
