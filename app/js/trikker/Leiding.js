// Leiding (kabel), nagebouwd naar Leiding.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
// Niet nagebouwd: GeleiderKleuren (kleurvakjes en functies bij de aders).
import { penDun, penMiddel, kwast, fontNormaal, fontKlein, SF } from './g.js';

export const KLASSE = 'Leiding';

// MeasureString van de proefopstelling (geen echte Arial-meting): breedte = tekens × grootte × 0,55, hoogte = grootte × 1,15.
const meetBreedte = (tekst, grootte) => tekst.length * grootte * 0.55;

export function maak(props = {}) {
  const n = {
    Height: 10, Plaatsing: 'NietGespecifieerd', AantalGeleiders: 0, GeleidersAanduiding: 'Tekst', InBuis: 'Nee', Beschermingsgeleider: 'Ja',
    Nulgeleider: 'Nee', GeleiderType: '', Brandklasse: '', GeleiderDoorsnede: '', Kind: null, Parent: null,
  };
  for (const [k, v] of Object.entries(props)) if (k !== 'Width') n[k] = v;

  const nodigVoorLijnen = () => Number(n.AantalGeleiders) + (n.Beschermingsgeleider === 'Ja' ? 1 : 0) + (n.Nulgeleider === 'Ja' ? 1 : 0);
  Object.defineProperty(n, 'Width', {
    configurable: true,
    enumerable: true,
    get() {
      if (n.Plaatsing === 'NietGespecifieerd' && (!(Number(n.AantalGeleiders) > 0) || n.GeleidersAanduiding !== 'Tekst') && n.InBuis === 'Nee' && !n.GeleiderType && !n.Brandklasse && !n.GeleiderDoorsnede) {
        let b = 5;
        if (n.GeleidersAanduiding === 'Lijnen') b = Math.max(b, nodigVoorLijnen() + 2);
        return b;
      }
      return 20;
    },
    set() { /* de breedte volgt uit de eigenschappen */ },
  });

  const tekstDelen = () => {
    const uit = [];
    let tekstEerder = false;
    if (n.GeleiderType) { tekstEerder = true; uit.push({ t: n.GeleiderType, sub: false }); }
    if (n.Brandklasse) {
      tekstEerder = true; // zoals in Trikker: dit wordt altijd gezet vóór de controle op de spatie
      if (n.Brandklasse.length > 2 && n.Brandklasse.toUpperCase().endsWith('CA')) {
        uit.push({ t: ` ${n.Brandklasse.slice(0, -2)}`, sub: false });
        uit.push({ t: n.Brandklasse.slice(-2), sub: true });
      } else uit.push({ t: ` ${n.Brandklasse}`, sub: false });
    }
    if (Number(n.AantalGeleiders) > 0 && n.GeleidersAanduiding === 'Tekst' && n.GeleiderDoorsnede) {
      uit.push({ t: `${tekstEerder ? ' ' : ''}${n.AantalGeleiders}${n.Beschermingsgeleider === 'Ja' ? 'G' : 'x'}${n.GeleiderDoorsnede}`, sub: false });
    } else if (n.GeleiderDoorsnede) {
      uit.push({ t: `${tekstEerder ? ' ' : ''}${n.GeleiderDoorsnede}`, sub: false });
    }
    return uit;
  };
  n.bouwTekst = () => tekstDelen().map((d) => d.t).join('').trim();

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  const tekstFormaat = (g, delen, y) => {
    const gewoon = fontNormaal(); const klein = fontKlein(); const vast = kwast();
    const totaal = delen.reduce((s, d) => s + meetBreedte(d.t, d.sub ? klein.grootte : gewoon.grootte), 0);
    let x = 0 - totaal / 2;
    for (const d of delen) {
      const font = d.sub ? klein : gewoon;
      const num3 = d.sub ? (gewoon.grootte * 1.15) / 3 : 0;
      g.tryDrawString(d.t, font, vast, x, y + num3);
      x += meetBreedte(d.t, font.grootte);
    }
  };

  n.render = (g) => {
    const dun = penDun(); const middel = penMiddel(); const vast = kwast(); const regulier = fontNormaal();
    const W = n.Width;
    const waarde = n.bouwTekst();
    g.drawLine(dun, -W / 2, 0, W / 2, 0);
    tekstFormaat(g, tekstDelen(), 1);
    if (n.GeleidersAanduiding === 'Lijnen') {
      let num = -1.5;
      if (waarde) num -= 0.5;
      const stap = 1;
      let aantal = Number(n.AantalGeleiders);
      if (n.Beschermingsgeleider === 'Ja') aantal--;
      if (n.Nulgeleider === 'Ja') aantal--;
      let x = -nodigVoorLijnen() / 2;
      if (n.InBuis === 'Ja') x -= 2;
      for (let i = 0; i < aantal; i++) { g.drawLine(dun, x, num + 3, x + 1, num); x += stap; }
      if (n.Nulgeleider === 'Ja') {
        x += stap;
        g.drawLine(dun, x, num + 3, x + 1, num);
        g.fillEllipse(vast, x - 0.4, num + 2.2, 1, 1);
        x += stap;
      }
      if (n.Beschermingsgeleider === 'Ja') {
        x += stap;
        g.drawLine(dun, x, num + 3, x + 1, num);
        g.drawLine(middel, x - 1, num + 3, x + 1, num + 3);
      }
    } else if (n.GeleidersAanduiding === 'LijnMetCijfer' && Number(n.AantalGeleiders) > 0) {
      let num = -1.5;
      if (waarde) num -= 0.5;
      const x = n.InBuis === 'Ja' ? -2 : -0.5;
      g.drawLine(dun, x, num + 3, x + 1, num);
      g.tryDrawString(String(n.AantalGeleiders), regulier, vast, x + 1, num + 0.5, SF.centerBottom);
    }
    if (n.InBuis === 'Ja') g.drawEllipse(dun, W / 2 - 8, -3.5, 2.5, 2.5);
    const y1 = -3.5; const y2 = y1 + 2.5;
    switch (n.Plaatsing) {
      case 'InWand':
        g.drawLine(middel, -W / 2, y1, -W / 2 + 4, y1);
        g.drawLine(middel, -W / 2, y1, -W / 2, y2);
        g.drawLine(middel, -W / 2 + 2, y1, -W / 2 + 2, y2);
        g.drawLine(middel, -W / 2 + 4, y1, -W / 2 + 4, y2);
        g.drawLine(middel, W / 2, y1, W / 2 - 4, y1);
        g.drawLine(middel, W / 2, y1, W / 2, y2);
        g.drawLine(middel, W / 2 - 2, y1, W / 2 - 2, y2);
        g.drawLine(middel, W / 2 - 4, y1, W / 2 - 4, y2);
        break;
      case 'Luchtleiding':
        g.drawEllipse(dun, W / 2 - 4, -1.25, 2.5, 2.5);
        break;
      case 'Ondergronds':
        g.drawLine(middel, -W / 2, y1, -W / 2 + 4, y1);
        g.drawLine(middel, -W / 2 + 0.4, (y2 + y1) / 2, -W / 2 + 4 - 0.4, (y2 + y1) / 2);
        g.drawLine(middel, -W / 2 + 0.8, y2, -W / 2 + 4 - 0.8, y2);
        break;
      case 'OpWand':
        g.drawLine(middel, -W / 2, y2, -W / 2 + 4, y2);
        g.drawLine(middel, -W / 2, y1, -W / 2, y2);
        g.drawLine(middel, -W / 2 + 2, y1, -W / 2 + 2, y2);
        g.drawLine(middel, -W / 2 + 4, y1, -W / 2 + 4, y2);
        g.drawLine(middel, W / 2, y2, W / 2 - 4, y2);
        g.drawLine(middel, W / 2, y1, W / 2, y2);
        g.drawLine(middel, W / 2 - 2, y1, W / 2 - 2, y2);
        g.drawLine(middel, W / 2 - 4, y1, W / 2 - 4, y2);
        break;
      default:
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const Plaatsing of ['NietGespecifieerd', 'Ondergronds', 'Luchtleiding', 'InWand', 'OpWand']) {
    uit.push({ Plaatsing }, { Plaatsing, GeleiderType: 'XVB', AantalGeleiders: 3, GeleiderDoorsnede: '2,5' });
  }
  uit.push({ GeleiderType: 'XVB', Brandklasse: 'Cca', AantalGeleiders: 5, GeleiderDoorsnede: '1,5', Plaatsing: 'InWand' });
  uit.push({ GeleiderType: 'VOB', Brandklasse: 'B2ca', AantalGeleiders: 3, Beschermingsgeleider: 'Nee', GeleiderDoorsnede: '2,5' });
  uit.push({ Brandklasse: 'Eca' }, { Brandklasse: 'E' }, { GeleiderDoorsnede: '4' }, { GeleiderType: 'EXVB' });
  uit.push({ InBuis: 'Ja' }, { InBuis: 'Ja', GeleiderType: 'H07V-K', GeleiderDoorsnede: '2,5', AantalGeleiders: 2, Beschermingsgeleider: 'Nee' });
  for (const GeleidersAanduiding of ['Lijnen', 'LijnMetCijfer']) {
    uit.push({ GeleidersAanduiding, AantalGeleiders: 3 }, { GeleidersAanduiding, AantalGeleiders: 4, Nulgeleider: 'Ja' }, { GeleidersAanduiding, AantalGeleiders: 5, Nulgeleider: 'Ja', InBuis: 'Ja' });
    uit.push({ GeleidersAanduiding, AantalGeleiders: 3, GeleiderType: 'XVB', GeleiderDoorsnede: '2,5' }, { GeleidersAanduiding, AantalGeleiders: 3, Beschermingsgeleider: 'Nee' });
  }
  return uit;
}
