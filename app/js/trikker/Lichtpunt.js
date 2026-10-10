// Lichtpunt, nagebouwd naar Lichtpunt.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker
// (let op: de eigenschap voor noodverlichting heet in Trikker "NoodverlivhtingType").
import { penDun, penMiddel, kwast, fontNormaal, SF, punt, rechthoek } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Lichtpunt';

const AANTAL = { NietGespecifieerd: 0, Een: 1, Twee: 2, Drie: 3, Vier: 4, Vijf: 5, Zes: 6, Zeven: 7, Acht: 8, Negen: 9, Tien: 10 };

export function maak(props = {}) {
  const n = {
    Width: 5, Height: 10, Type: 'NietGespecifieerd', Aantal: 1, AantalBuislampen: 'Een', NoodverlivhtingType: 'Nee',
    Wandverlichting: 'Nee', HalfWaterdicht: 'Nee', IngebouwdeSchakelaar: 'Nee', IngebouwdeSensor: 'Geen', Adres: null,
    DomoticaFunctie: 'Output', Kind: null, Parent: null,
  };
  const setSize = () => {
    if (n.Type === 'TL') { n.Width = 10; n.Height = 10; }
    else if (n.Type === 'LEDStrip') { n.Width = 10; n.Height = 8; }
    else { n.Width = 5; n.Height = 10; }
  };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(Number(v) >= 1)) continue;
    n[k] = k === 'Aantal' ? Number(v) : v;
    if (k === 'Type') setSize();
  }

  const buis = () => Math.max(1, AANTAL[n.AantalBuislampen]);
  const heeftKind = () => !!n.Kind && n.Kind !== 'Nota';
  const rechterRand = () => (n.IngebouwdeSensor !== 'Geen' ? Math.max(4, n.Width / 2) : n.Width / 2);

  n.textOffset = (rotation = null) => {
    const flip = shouldFlipText(rotation);
    const wand = n.Wandverlichting === 'Ja';
    const hw = n.HalfWaterdicht === 'Ja';
    const sensor = n.IngebouwdeSensor !== 'Geen';
    const nood = n.NoodverlivhtingType;
    let boven; let onder; let links; let rechts;
    switch (n.Type) {
      case 'TL':
        onder = (buis() - 1) * 0.75 + 1;
        if ((hw && !flip) || nood !== 'Nee') onder += 3;
        boven = (buis() - 1) * 0.75 + 1;
        if (hw && flip) boven += 3;
        else if (sensor) boven += 2.5;
        else if (wand) boven += 1.5;
        links = rechts = 5.5;
        break;
      case 'Spot':
        onder = 3; links = 3;
        boven = wand ? 4 : 3;
        if (sensor) boven += 1;
        if (hw) { if (flip) boven = 5.5; else onder = 5.5; }
        rechts = 2;
        break;
      case 'LED':
        onder = 4;
        if (n.Wandverlichting === 'Nee') { boven = 1.5; if (sensor) boven += 2.5; } else { boven = 3; if (sensor) boven += 2; }
        if (hw) { if (flip) boven = 6; else onder = 6; }
        links = 3; rechts = 3;
        break;
      case 'LEDStrip':
        onder = 3.5;
        if (n.Wandverlichting === 'Nee') { boven = 2; if (sensor) boven += 2; } else { boven = 3; if (sensor) boven += 1.5; }
        if (nood !== 'Nee') onder = 4.5;
        links = 13 / 2 - 1.5; rechts = 13 / 2 - 1.5;
        break;
      case 'Signalisatielamp':
        boven = wand ? 3.5 : 2.5;
        if (sensor) boven += 1.5;
        onder = 2.5;
        if (hw) { if (flip) boven = 5.5; else onder = 5.5; }
        links = rechts = 2.5;
        break;
      default:
        if (!sensor) {
          if (nood === 'Decentraal') { boven = wand ? 3.5 : 3; onder = 3; links = rechts = 3; }
          else { boven = wand ? 3.5 : 2.5; onder = 2.5; links = rechts = 2.5; }
          if (hw) { if (flip) boven = 5.5; else onder = 5.5; }
          break;
        }
        boven = wand ? 5 : 4;
        rechts = 4.5;
        if (nood === 'Decentraal') { onder = 3; links = 3; } else { onder = 2.5; links = 2.5; }
        if (hw) { if (flip) boven = 5.5; else onder = 5.5; }
        break;
    }
    return { left: links, top: onder, right: rechts, bottom: boven };
  };

  const tekenLedje = (g, pen, xc, yc, breedte) => {
    const h = breedte / 2;
    g.drawLine(pen, xc - h, yc - h, xc - h, yc + h);
    g.drawLine(pen, xc - h, yc - h, xc + h, yc + 0);
    g.drawLine(pen, xc - h, yc + h, xc + h, yc + 0);
    g.drawLine(pen, xc + h, yc - h, xc + h, yc + h);
  };

  const tekenPijltje = (g, pen, x, y) => {
    const a = 0.8; const b = -2;
    g.drawLine(pen, x, y, x + a, y + b);
    g.drawLine(pen, x + a, y + b, x + a, y + b + 0.9);
    g.drawLine(pen, x + a, y + b, x + a - 0.6, y + b + 0.7);
  };

  const tekenNood = (g, ctx, pen, vast, y) => {
    if (n.NoodverlivhtingType === 'Nee') return;
    let x = 0;
    if (ctx === 'Eendraadschema' && n.Aantal > 1) x = -3;
    if (n.Type === 'LEDStrip') x = -3;
    g.drawLine(pen, x - 1, y - 1, x + 1, y + 1);
    g.drawLine(pen, x - 1, y + 1, x + 1, y - 1);
    g.fillEllipse(vast, x - 0.6, y - 0.6, 1.2, 1.2);
    if (n.NoodverlivhtingType === 'Decentraal') g.drawRectangle(pen, x - 1.3, y - 1.3, 2.6, 2.6);
  };

  const tekenIrDriehoek = (g, xTop, yTop, hoek) => {
    const s = g.save();
    g.translateTransform(xTop, yTop);
    g.rotateTransform(hoek);
    g.fillPolygon(kwast(), [punt(0, 0), punt(1.05, -0.35), punt(1.05, 0.35)]);
    g.restore(s);
  };

  const tekenSensor = (g) => {
    if (n.IngebouwdeSensor === 'Geen') return;
    const wand = n.Wandverlichting === 'Ja';
    const lijnX = 0;
    let lijnY = 1.5;
    const sensorX = 1.5;
    let sensorY = 3.5;
    switch (n.Type) {
      case 'NietGespecifieerd':
        if (wand) { lijnY = 3.5; sensorY = 4.5; }
        break;
      case 'Signalisatielamp':
        if (wand) { lijnY = 3.5; sensorY = 4.5; } else lijnY = 2.5;
        break;
      case 'Spot':
        if (wand) { lijnY = 4; sensorY = 4.5; } else lijnY = 3;
        break;
      case 'TL': {
        const extra = (buis() - 1) * 0.75;
        lijnY = 0.5 + extra;
        sensorY = 3 + extra;
        if (wand) lijnY += 1.5;
        break;
      }
      case 'LEDStrip':
        if (wand) { lijnY = 3; sensorY = 4; }
        break;
      case 'LED':
        if (wand) { lijnY = 3.5; sensorY = 4.5; }
        break;
      default:
    }
    const dun = penDun(); const middel = penMiddel();
    g.drawLine(dun, lijnX, lijnY, lijnX, sensorY);
    g.drawLine(dun, lijnX, sensorY, sensorX, sensorY);
    const s = g.save();
    g.translateTransform(sensorX, sensorY);
    g.drawLine(middel, 0, 0, 1.94, -0.81);
    g.drawLine(middel, 0, 0, 1.94, 0.81);
    g.drawArc(middel, -2.1, -2.1, 4.2, 4.2, -30, 60);
    tekenIrDriehoek(g, 2.45, 0, 0);
    tekenIrDriehoek(g, 2.12, -1.23, -30);
    tekenIrDriehoek(g, 2.12, 1.23, 30);
    g.restore(s);
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const font = fontNormaal(); const middel = penMiddel(); const dun = penDun(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    const wand = n.Wandverlichting === 'Ja';
    const nood = n.NoodverlivhtingType;
    let num = -H / 2 + 3.25;
    switch (n.Type) {
      case 'Signalisatielamp':
        if (ctx === 'Eendraadschema') {
          if (n.Parent) g.drawLine(dun, -W / 2, 0, -2, 0);
          if (heeftKind()) g.drawLine(dun, 2, 0, W / 2, 0);
        }
        g.drawEllipse(middel, -2, -2, 4, 4);
        g.drawLine(middel, -1.4142, -1.4142, 1.4142, 1.4142);
        g.drawLine(middel, -1.4142, 1.4142, 1.4142, -1.4142);
        if (wand) g.drawLine(middel, -2, 3, 2, 3);
        break;
      case 'TL': {
        const aantal = Math.max(1, AANTAL[n.AantalBuislampen]);
        const stap = 1.5;
        num = -(aantal - 1) * stap / 2;
        for (let j = 0; j < aantal; j++) {
          const y = num + j * stap;
          g.drawLine(middel, -W / 2, y, W / 2, y);
        }
        g.drawLine(middel, -W / 2, num - 0.7, -W / 2, -num + 0.7);
        g.drawLine(middel, W / 2, num - 0.7, W / 2, -num + 0.7);
        if (wand) g.drawLine(middel, -2, -num + 1.5, 2, -num + 1.5);
        tekenNood(g, ctx, middel, vast, num - 2);
        break;
      }
      case 'Spot': {
        if (ctx === 'Eendraadschema' && heeftKind()) g.drawLine(dun, W / 4, 0, W / 2, 0);
        g.drawArc(middel, -W / 2, -W / 2, W, W, 90, 180);
        g.drawEllipse(middel, -W / 4, -W / 4, W / 2, W / 2);
        const d = 0.707 * W / 4;
        g.drawLine(middel, -d, -d, d, d);
        g.drawLine(middel, -d, d, d, -d);
        if (wand) g.drawLine(middel, -2, 3.5, 1.25, 3.5);
        break;
      }
      case 'LED':
        g.drawLine(dun, -W / 2, 0, W / 2, 0);
        tekenLedje(g, middel, 0, 0, 3.125);
        tekenPijltje(g, dun, 0.8, -1.4);
        tekenPijltje(g, dun, -0.2, -1.4);
        if (wand) g.drawLine(middel, -2, 3, 2, 3);
        break;
      case 'LEDStrip': {
        g.drawLine(dun, -W / 2, 0, W / 2, 0);
        const x0 = -W / 2 + 1 + 1;
        for (let i = 0; i < 3; i++) tekenLedje(g, middel, x0 + i * 3, 0, 2);
        tekenPijltje(g, dun, 0.8, -1.2);
        tekenPijltje(g, dun, -0.2, -1.2);
        if (wand) g.drawLine(middel, -2, 2.5, 2, 2.5);
        if (n.HalfWaterdicht === 'Ja') {
          let bew = null;
          if (shouldFlipText(rotation)) { bew = g.save(); g.rotateTransform(180); }
          g.tryDrawString('h', font, vast, W / 2 - 2.5, -4.5);
          if (bew) g.restore(bew);
        }
        tekenNood(g, ctx, middel, vast, -3);
        break;
      }
      default:
        if (ctx === 'Eendraadschema' && nood !== 'Decentraal') {
          if (n.Parent) g.drawLine(dun, -W / 2, 0, 0, 0);
          if (heeftKind()) g.drawLine(dun, 0, 0, rechterRand(), 0);
        }
        if (nood !== 'Decentraal') {
          g.drawLine(middel, -2, -2, 2, 2);
          g.drawLine(middel, -2, 2, 2, -2);
          if (n.IngebouwdeSchakelaar === 'Ja') g.drawLine(middel, 2, -2, 2.7, -1.3);
        } else {
          g.drawRectangle(middel, -2.5, -2.5, 5, 5);
          g.drawLine(middel, -1.5, -1.5, 1.5, 1.5);
          g.drawLine(middel, -1.5, 1.5, 1.5, -1.5);
        }
        if (nood !== 'Nee') g.fillEllipse(vast, -1.2, -1.2, 2.4, 2.4);
        if (wand) g.drawLine(middel, -2, 3, 2, 3);
        break;
    }
    tekenSensor(g);
    let tekst = '';
    if (ctx === 'Eendraadschema' && n.Aantal > 1) tekst += `x${n.Aantal}`;
    if (n.HalfWaterdicht === 'Ja' && n.Type !== 'LEDStrip') {
      if (tekst) tekst += ', ';
      tekst += 'h';
    }
    if (tekst) {
      let breed = W * 2;
      if (n.Type === 'TL' || n.Type === 'LEDStrip') breed = W;
      let sf = SF.centerTop;
      if (n.Type === 'TL' && nood !== 'Nee') sf = SF.rightCenter;
      let y;
      if (n.Type === 'LED') y = num - 4.5;
      else if (n.Type === 'LEDStrip') y = (nood !== 'Nee' || n.HalfWaterdicht !== 'Nee') ? -7.5 : -6.5;
      else y = num - 4;
      const rect = rechthoek(-breed / 2, y, breed, H / 2);
      let bew = null;
      if (shouldFlipText(rotation)) { bew = g.save(); g.rotateTransform(180); }
      g.tryDrawString(tekst, font, vast, rect, sf);
      if (bew) g.restore(bew);
    }
  };
  return n;
}

/** Varianten om te vergelijken met de echte Trikker-uitvoer (eigenschappen in de volgorde waarin ze gezet worden). */
export function varianten() {
  const uit = [{}];
  const types = ['NietGespecifieerd', 'TL', 'Spot', 'LED', 'LEDStrip', 'Signalisatielamp'];
  for (const type of types) {
    for (const wand of ['Nee', 'Ja']) {
      for (const sensor of ['Geen', 'Infrarood']) {
        uit.push({ Type: type, Wandverlichting: wand, IngebouwdeSensor: sensor });
      }
    }
    for (const nood of ['Centraal', 'Decentraal']) uit.push({ Type: type, NoodverlivhtingType: nood });
    uit.push({ Type: type, HalfWaterdicht: 'Ja' });
    uit.push({ Type: type, Aantal: 3 });
    uit.push({ Type: type, Aantal: 2, HalfWaterdicht: 'Ja', NoodverlivhtingType: 'Centraal' });
    uit.push({ Type: type, Kind: 'Lichtpunt' });
    uit.push({ Type: type, Aantal: 2, Wandverlichting: 'Ja', IngebouwdeSensor: 'Infrarood', HalfWaterdicht: 'Ja' });
  }
  for (const b of ['Een', 'Twee', 'Drie', 'Vier']) {
    uit.push({ Type: 'TL', AantalBuislampen: b });
    uit.push({ Type: 'TL', AantalBuislampen: b, Wandverlichting: 'Ja', IngebouwdeSensor: 'Infrarood' });
    uit.push({ Type: 'TL', AantalBuislampen: b, NoodverlivhtingType: 'Decentraal', HalfWaterdicht: 'Ja', Aantal: 2 });
  }
  uit.push({ IngebouwdeSchakelaar: 'Ja' }, { IngebouwdeSchakelaar: 'Ja', NoodverlivhtingType: 'Centraal' }, { IngebouwdeSchakelaar: 'Ja', Wandverlichting: 'Ja', Kind: 'Contactdoos' });
  uit.push({ NoodverlivhtingType: 'Decentraal', Kind: 'Lichtpunt' }, { IngebouwdeSensor: 'Infrarood', Kind: 'Schakelaar' });
  return uit;
}
