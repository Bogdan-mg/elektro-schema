// AutomatischeSchakelaar, nagebouwd naar AutomatischeSchakelaar.cs van Trikker (zonder RenderAdres).
import { penDun, penMiddel, penDik, kwast, fontNormaal, SF, rechthoek } from './g.js';

export const KLASSE = 'AutomatischeSchakelaar';

const POLEN = { NietGespecifieerd: 0, Enkelpolig: 1, Dubbelpolig: 2, Driepolig: 3, Vierpolig: 4 };
// Environment.NewLine tussen de tekstregels (g.js kan ze samenvoegen om met de proefopstelling te vergelijken).
const NIEUWE_REGEL = '\n';
// MeasureString van de proefopstelling (geen echte Arial-meting): breedte = tekens × grootte × 0,55, hoogte = grootte × 1,15.
const meetBreedte = (tekst, grootte) => tekst.length * grootte * 0.55;
const meetHoogte = (grootte) => grootte * 1.15;

export function maak(props = {}) {
  const n = {
    Height: 10, Fase: '', VerliesstroomschakelaarNummeren: 'Nee', VerliesStroomsterkte: 0, AantalPolen: 'Dubbelpolig', Kortsluitstroom: '',
    VerliesstroomschakelaarType: '', MaximumstroomBeveiliging: 'Nee', NominaleStroomsterkte: 0, NormaalGesloten: 'Nee', Selectief: 'Nee',
    StroomsterkteEenheid: 'A', Type: 'Automaat', Uitschakelcurve: 'NietGespecifieerd', Adres: '', DomoticaFunctie: 'Output',
    // De breedte hangt van de langste tekstregel af (zoals de Width-getter in Trikker).
    get Width() { return Math.max(0, ...tekstRegels().map((s) => s.length)) <= 12 ? 14 : 20; },
    set Width(v) { /* de setter doet niets in Trikker */ },
  };
  const tekstRegels = () => {
    const uit = [];
    let s = '';
    if (n.VerliesstroomschakelaarType) s += n.VerliesstroomschakelaarType;
    if (Number(n.VerliesStroomsterkte) > 0) {
      if (s) s += ' - ';
      s += `Δ${n.VerliesStroomsterkte}mA`;
    }
    if (s) uit.push(s);
    if (n.Kortsluitstroom) uit.push(n.Kortsluitstroom);
    let t = '';
    if (POLEN[n.AantalPolen] !== 0) t += `${POLEN[n.AantalPolen]}P`;
    if (Number(n.NominaleStroomsterkte) > 0) {
      if (t) t += ' - ';
      if (n.Uitschakelcurve !== 'NietGespecifieerd') t += `${n.Uitschakelcurve} `;
      if (n.MaximumstroomBeveiliging === 'Ja') t += 'M';
      t += `${n.NominaleStroomsterkte}${n.StroomsterkteEenheid}`;
    }
    if (t) uit.push(t);
    return uit;
  };
  n.tekstRegels = tekstRegels; // voor de lay-out (WorldAreaMargin)
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => {
    const links = n.Width / 2 + 0.5;
    const rechts = links;
    let boven;
    if (n.NormaalGesloten === 'Ja') {
      boven = n.Type === 'Draaischakelaar' ? 1.5 : n.Type === 'Schemerschakelaar' ? 5.5 : 0.5;
    } else if (n.Type === 'Contact' || n.Type === 'Draaischakelaar') boven = 2.5;
    else if (n.Type === 'Schemerschakelaar') boven = 5.5;
    else boven = 3;
    const regels = tekstRegels().length;
    let onder;
    if (regels === 0) {
      if (n.Type === 'Draaischakelaar') { onder = 1.5; if (n.NormaalGesloten === 'Ja') onder += 1.5; }
      else { onder = 0.5; if (n.NormaalGesloten === 'Ja') onder += 2.5; }
    } else {
      onder = 4 + 2.5 * (regels - 1);
      if (n.NormaalGesloten === 'Ja') onder += 2;
    }
    return { left: links, top: boven, right: rechts, bottom: onder };
  };

  const pijl = (g, p, x, y) => {
    // Vector2D(-1,5; 2) en twee korte streepjes onder een hoek van 3,4415927 rad.
    const vx = -1.5; const vy = 2;
    const rot = Math.atan2(vy, vx);
    const a = rot + 3.4415927; const b = rot - 3.4415927;
    const [ax, ay] = [Math.cos(a), Math.sin(a)];
    const [bx, by] = [Math.cos(b), Math.sin(b)];
    g.drawLine(p, x, y, x + vx, y + vy);
    g.drawLine(p, x + vx, y + vy, x + vx + ax, y + vy + ay);
    g.drawLine(p, x + vx, y + vy, x + vx + bx, y + vy + by);
  };

  n.render = (g) => {
    const font = fontNormaal(); const dik = penDik(); const dun = penDun(); const middel = penMiddel(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    g.drawLine(dun, -W / 2, 0, -2, 0);
    if (n.Type === 'Draaischakelaar') {
      g.drawEllipse(dun, 2, -1, 2, 2);
      g.drawLine(dun, 4, -1, 4, 1);
      g.drawLine(dun, W / 2, 0, 4, 0);
    } else {
      g.drawLine(dun, W / 2, 0, 2, 0);
    }
    if (n.NormaalGesloten === 'Ja') {
      g.drawLine(dun, 2.5, 2, -2, 0);
      g.drawLine(dun, 2, 0, 2, 2.5);
      if (n.Type === 'Automaat') {
        g.drawLine(dik, 2.25, 2, 1.25, 1.5);
      } else if (n.Type === 'Zekeringscheider') {
        const bew = g.save();
        g.translateTransform(0.25, 1);
        g.rotateTransform(Math.atan(0.4444444477558136) * 180 / Math.PI);
        g.drawRectangle(dun, -1.2, -0.5, 2.4, 1);
        g.restore(bew);
      }
    } else {
      g.drawLine(dun, 2, -2, -2, 0);
      if (n.Type === 'Automaat') {
        g.drawLine(dik, 2, -2 - dik.breedte / 2, 1, -2 - dik.breedte / 2 + 0.5);
      } else if (n.Type === 'Zekeringscheider') {
        const bew = g.save();
        g.translateTransform(0, -1);
        g.rotateTransform(-Math.atan(0.5) * 180 / Math.PI);
        g.drawRectangle(dun, -1.5, -0.6, 3, 1.2);
        g.restore(bew);
      }
    }
    if (n.Selectief === 'Ja') {
      const r = rechthoek(3.5, -3.5, 2.5, 2.5);
      g.drawRectangle(middel, r.x, r.y, r.w, r.h);
      g.tryDrawString('s', font, vast, r, SF.centerCenter);
    }
    const regels = tekstRegels();
    if (regels.length > 0) {
      let y = H / 2 - (n.NormaalGesloten === 'Ja' ? 2 : 4);
      g.tryDrawString(regels.join(NIEUWE_REGEL), font, vast, 0, y, SF.centerTopNoClipNoWrap);
      const ks = (n.Kortsluitstroom || '').toUpperCase().replace(/ /g, '');
      if (n.Kortsluitstroom && (ks.endsWith('00A') || ks.endsWith('00'))) {
        const hoogte = meetHoogte(font.grootte);
        if (n.VerliesstroomschakelaarType || Number(n.VerliesStroomsterkte) > 0) y += hoogte;
        const breedte = meetBreedte(n.Kortsluitstroom, font.grootte);
        g.drawRectangle(dun, -breedte / 2 - 0.2, y, breedte + 0.4, hoogte);
      }
    }
    if (n.Type === 'Schemerschakelaar') {
      pijl(g, dun, 0, -H / 2);
      pijl(g, dun, 1.5, -H / 2);
    }
    if (n.Fase) {
      const bew = g.save();
      g.rotateTransform(90);
      g.tryDrawString(n.Fase, font, vast, -1, W / 2 + 3);
      g.restore(bew);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  const types = ['Automaat', 'Schemerschakelaar', 'Contact', 'Draaischakelaar', 'Zekeringscheider'];
  for (const type of types) {
    for (const nc of ['Nee', 'Ja']) {
      uit.push({ Type: type, NormaalGesloten: nc });
      uit.push({ Type: type, NormaalGesloten: nc, NominaleStroomsterkte: 16, Selectief: 'Ja' });
    }
  }
  for (const polen of ['NietGespecifieerd', 'Enkelpolig', 'Driepolig', 'Vierpolig']) {
    uit.push({ AantalPolen: polen, NominaleStroomsterkte: 20 });
  }
  for (const curve of ['B', 'C', 'D', 'F', 'K', 'MA', 'Z']) uit.push({ Uitschakelcurve: curve, NominaleStroomsterkte: 32 });
  uit.push({ NominaleStroomsterkte: 300, StroomsterkteEenheid: 'mA' }, { Uitschakelcurve: 'C', MaximumstroomBeveiliging: 'Ja', NominaleStroomsterkte: 16 });
  uit.push({ AantalPolen: 'NietGespecifieerd' }, { AantalPolen: 'NietGespecifieerd', NormaalGesloten: 'Ja', Type: 'Draaischakelaar' });
  uit.push({ AantalPolen: 'NietGespecifieerd', Type: 'Schemerschakelaar' }, { AantalPolen: 'NietGespecifieerd', Selectief: 'Ja' });
  uit.push({ VerliesStroomsterkte: 30 }, { VerliesStroomsterkte: 300, VerliesstroomschakelaarType: 'A', NominaleStroomsterkte: 40 });
  uit.push({ VerliesstroomschakelaarType: 'Type B' }, { VerliesstroomschakelaarType: 'Type B', VerliesStroomsterkte: 30, VerliesstroomschakelaarNummeren: 'Ja' });
  uit.push({ Kortsluitstroom: '6000A', NominaleStroomsterkte: 16 }, { Kortsluitstroom: '10kA', NominaleStroomsterkte: 16 }, { Kortsluitstroom: '4500', Uitschakelcurve: 'B', NominaleStroomsterkte: 10 });
  uit.push({ Kortsluitstroom: '10 000 A', VerliesStroomsterkte: 30, NominaleStroomsterkte: 25 }, { Kortsluitstroom: '6000A', VerliesstroomschakelaarType: 'A', NormaalGesloten: 'Ja' });
  uit.push({ Fase: 'L1', NominaleStroomsterkte: 16 }, { Fase: 'L1+L2+L3', AantalPolen: 'Driepolig', NominaleStroomsterkte: 63, Type: 'Zekeringscheider' });
  // Adres/DomoticaFunctie veranderen enkel RenderAdres (adrestekst naast het symbool), dat de aanroeper tekent; niet in de varianten.
  uit.push({ Uitschakelcurve: 'MA', MaximumstroomBeveiliging: 'Ja', NominaleStroomsterkte: 100, AantalPolen: 'Vierpolig', VerliesstroomschakelaarType: 'Type A-EV' });
  return uit;
}
