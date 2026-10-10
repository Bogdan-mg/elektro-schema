// Transformator, nagebouwd naar Transformator.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Transformator';

export function maak(props = {}) {
  const n = {
    Width: 12, Height: 10, Adres: null, DomoticaFunctie: 'Output', Tekst: null, ToonOpGrondplan: 'Nee',
    Beschermingstransformator: 'Nee', Kortsluitvast: 'Nee', Veiligheidstransformator: 'Nee', Kind: null,
  };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => {
    let top; let bottom; let right;
    if (n.Veiligheidstransformator === 'Nee') {
      top = bottom = n.Beschermingstransformator === 'Ja' ? 3 : 2.5;
      right = n.Kortsluitvast === 'Ja' ? 5 : 4;
    } else {
      top = bottom = 3.5;
      right = 6.5;
    }
    if (n.Tekst) top += 2.5;
    return { left: 6.5, top, right, bottom };
  };

  n.render = (g) => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width;
    const veilig = n.Veiligheidstransformator;
    g.drawEllipse(middel, -3.5, -2, 4, 4);
    g.drawEllipse(middel, -0.5, -2, 4, 4);
    if (n.Beschermingstransformator === 'Ja') g.drawLine(dun, 0, -2.5, 0, 2.5);
    if (n.Kortsluitvast === 'Ja') {
      g.drawLine(middel, 4.25, -1, 4.25, 1);
      g.drawLine(middel, 3.25, -1, 4.25, -1);
      g.drawLine(middel, 3.25, 1, 4.25, 1);
    }
    if (veilig !== 'Nee') {
      g.drawLine(middel, -4, -3, 0, -3);
      g.drawLine(middel, -4, 3, 0, 3);
      g.drawBezier(middel, { x: 0, y: -3 }, { x: 2, y: -3 }, { x: 4.5, y: -2 }, { x: 6, y: 0 });
      g.drawBezier(middel, { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 4.5, y: 2 }, { x: 6, y: 0 });
    }
    if (veilig === 'Gesloten') g.drawLine(middel, -4, -3, -4, 3);
    const links = veilig === 'Gesloten' ? -4 : -3.5;
    g.drawLine(dun, -W / 2, 0, links, 0);
    let rechts = 3.5;
    if (veilig !== 'Nee') rechts = 6;
    else if (n.Kortsluitvast === 'Ja') rechts = 4.25;
    if (n.Kind && n.Kind !== 'Nota') g.drawLine(dun, W / 2, 0, rechts, 0);
    let y = -1.7;
    if (veilig !== 'Nee') y = -2.7;
    else if (n.Beschermingstransformator === 'Ja') y = -2.2;
    if (n.Tekst) g.tryDrawString(n.Tekst, font, vast, 0, y, SF.centerBottom);
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const v of ['Nee', 'Open', 'Gesloten']) {
    for (const b of ['Nee', 'Ja']) for (const k of ['Nee', 'Ja']) {
      uit.push({ Veiligheidstransformator: v, Beschermingstransformator: b, Kortsluitvast: k });
      uit.push({ Veiligheidstransformator: v, Beschermingstransformator: b, Kortsluitvast: k, Tekst: '12V' });
    }
    uit.push({ Veiligheidstransformator: v, Kind: 'Lichtpunt' }, { Veiligheidstransformator: v, Kind: 'Lichtpunt', Kortsluitvast: 'Ja' });
  }
  uit.push({ Kind: 'Nota' });
  return uit;
}
