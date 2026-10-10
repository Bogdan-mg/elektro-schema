// Ketel, nagebouwd naar Ketel.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { penMiddel, penDun, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Ketel';

const TYPES = ['NietGespecifieerd', 'KetelMetBoiler', 'KetelMetTapspiraal', 'Warmtewisselaar', 'Warmtekrachtkoppeling'];
const BRONNEN = ['NietGespecifieerd', 'VasteBrandstof', 'VloeibareBrandstof', 'GasAtmosferisch', 'GasVentilator', 'Elektriciteit'];
const FUNCTIES = ['NietGespecifieerd', 'Verwarmend', 'Koelend', 'VerwarmendKoelend'];

export function maak(props = {}) {
  const n = {
    Width: 9, Height: 9, Aantal: 1, Adres: '', DomoticaFunctie: 'Output', Type: 'NietGespecifieerd', Energiebron: 'NietGespecifieerd',
    WarmteFunctie: 'NietGespecifieerd', ToonOpBom: 'Nee', Kind: null,
  };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue; // zoals de setter van Trikker
    n[k] = v;
  }

  n.textOffset = () => {
    const l = n.Width / 2 + 0.5; const t = n.Height / 2 + 0.5;
    return { left: l, top: n.Type === 'Warmtewisselaar' ? t + 2 : t, right: l, bottom: t };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    g.drawRectangle(middel, -W / 2, -H / 2, W, H);
    let bewaard = g.save();
    if (n.WarmteFunctie === 'NietGespecifieerd') g.translateTransform(0, H / 4);
    else g.translateTransform(-W / 4, H / 4);
    switch (n.Energiebron) {
      case 'Elektriciteit':
        g.drawLine(dun, 0, -1.5, -0.75, 0);
        g.drawLine(dun, -0.75, 0, 0.75, 0);
        g.drawLine(dun, 0.75, 0, 0, 1.5);
        g.drawLine(dun, 0, 1.5, 0, 0.5);
        g.drawLine(dun, 0, 1.5, 0.8, 0.9);
        break;
      case 'GasAtmosferisch':
        g.drawLine(dun, 0, -1.5, -1.5, 1.5);
        g.drawLine(dun, 0, -1.5, 1.5, 1.5);
        g.drawLine(dun, -1.5, 1.5, 1.5, 1.5);
        break;
      case 'GasVentilator':
        // GraphicsPath: AddLine(0,-1.5,-1.5,1.5), AddLine(-1.5,1.5,1.5,1.5), CloseFigure
        g.fillPath(vast, 'M0 -1.5L-1.5 1.5M-1.5 1.5L1.5 1.5Z');
        break;
      case 'VasteBrandstof':
        g.fillRectangle(vast, -1.5, -1.5, 3, 3);
        break;
      case 'VloeibareBrandstof':
        g.fillEllipse(vast, -1.5, -1.5, 3, 3);
        break;
      default:
    }
    g.restore(bewaard);
    bewaard = g.save();
    if (n.Energiebron === 'NietGespecifieerd') g.translateTransform(0, H / 4);
    else g.translateTransform(W / 4, H / 4);
    const tekst = { Koelend: '-', Verwarmend: '+', VerwarmendKoelend: '+/-' }[n.WarmteFunctie] ?? null;
    if (tekst !== null) g.tryDrawString(tekst, font, vast, 0, 0, SF.centerCenter);
    g.restore(bewaard);
    switch (n.Type) {
      case 'KetelMetBoiler':
        g.drawRectangle(dun, -2, -3.5, 4, 2);
        break;
      case 'KetelMetTapspiraal':
        g.drawLine(dun, W / 2, -4, -W / 2, -2.5);
        g.drawLine(dun, -W / 2, -2.5, W / 2, -1);
        break;
      case 'Warmtekrachtkoppeling':
        g.drawEllipse(dun, -1.5, -3.5, 3, 3);
        g.tryDrawString('G', font, vast, 0, -1.75, SF.centerCenter);
        break;
      case 'Warmtewisselaar':
        g.drawLine(dun, -3, -6.5, -3, -4.5);
        g.drawLine(dun, -3, -4.5, -1.5, 0);
        g.drawLine(dun, -1.5, 0, 0, -2.5);
        g.drawLine(dun, 1.5, 0, 0, -2.5);
        g.drawLine(dun, 3, -4.5, 1.5, 0);
        g.drawLine(dun, 3, -6.5, 3, -4.5);
        break;
      default:
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) g.tryDrawString(`x${n.Aantal}`, font, vast, 0, -6, SF.centerCenter);
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const Energiebron of BRONNEN) for (const WarmteFunctie of FUNCTIES) uit.push({ Energiebron, WarmteFunctie });
  for (const Type of TYPES) for (const Aantal of [1, 2]) uit.push({ Type, Aantal });
  for (const Type of TYPES.slice(1)) uit.push({ Aantal: 3, Type, Energiebron: 'GasVentilator', WarmteFunctie: 'VerwarmendKoelend' });
  uit.push({ Aantal: 0 }, { Aantal: 12, Energiebron: 'Elektriciteit' }, { Type: 'Warmtewisselaar', Energiebron: 'VasteBrandstof', WarmteFunctie: 'Koelend' });
  return uit;
}
