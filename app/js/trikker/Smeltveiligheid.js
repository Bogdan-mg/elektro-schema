// Smeltveiligheid, nagebouwd naar Smeltveiligheid.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Smeltveiligheid';

const POLEN = { NietGespecifieerd: 0, Enkelpolig: 1, Dubbelpolig: 2, Driepolig: 3, Vierpolig: 4 };
// Environment.NewLine tussen de tekstregels (g.js kan ze samenvoegen om met de proefopstelling te vergelijken).
const NIEUWE_REGEL = '\n';

export function maak(props = {}) {
  const n = { Width: 14, Height: 10, NominaleStroomsterkte: 0, StroomsterkteEenheid: 'A', AantalPolen: 'NietGespecifieerd', Fase: '', Type: '' };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  const tekst = () => {
    const polen = [];
    if (POLEN[n.AantalPolen] !== 0) polen.push(`${POLEN[n.AantalPolen]}P`);
    if (Number(n.NominaleStroomsterkte) > 0) {
      if (polen.length) polen.push(' - ');
      polen.push(`${n.NominaleStroomsterkte}${n.StroomsterkteEenheid}`);
    }
    const onder = polen.join('');
    const boven = n.Type || '';
    return boven + (boven && onder ? NIEUWE_REGEL : '') + onder;
  };

  n.tekst = tekst; // voor de lay-out (WorldAreaMargin)
  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g) => {
    const W = n.Width;
    g.drawLine(penDun(), -W / 2, 0, W / 2, 0);
    g.drawRectangle(penMiddel(), -4, -1.75, 8, 3.5);
    const t = tekst();
    if (t) g.tryDrawString(t, fontNormaal(), kwast(), 0, 3, SF.centerTop);
    if (n.Fase) {
      const bew = g.save();
      g.rotateTransform(90);
      g.tryDrawString(n.Fase, fontNormaal(), kwast(), -1, W / 2 + 3);
      g.restore(bew);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const polen of ['NietGespecifieerd', 'Enkelpolig', 'Dubbelpolig', 'Driepolig', 'Vierpolig']) {
    uit.push({ AantalPolen: polen, NominaleStroomsterkte: 16 });
    uit.push({ AantalPolen: polen });
  }
  uit.push({ NominaleStroomsterkte: 63, StroomsterkteEenheid: 'A' }, { NominaleStroomsterkte: 300, StroomsterkteEenheid: 'mA' });
  uit.push({ Type: 'gG' }, { Type: 'gG', NominaleStroomsterkte: 25 }, { Type: 'gL', AantalPolen: 'Driepolig', NominaleStroomsterkte: 40 });
  uit.push({ Type: 'aM', AantalPolen: 'Enkelpolig' }, { Type: 'D02', NominaleStroomsterkte: 10, StroomsterkteEenheid: 'mA' });
  uit.push({ Fase: 'L1' }, { Fase: 'L1+L2+L3', Type: 'gG', NominaleStroomsterkte: 16 }, { Fase: 'N', AantalPolen: 'Enkelpolig' });
  return uit;
}
