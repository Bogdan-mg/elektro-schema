# Elektro Schema

Windows-programma om voor een elektrische installatie (België, AREI) te tekenen:

- het **ééndraadschema**,
- het **situatieschema** (per verdieping, op het plan van de architect),
- de **materiaallijst**, rechtstreeks uit het schema.

Alles werkt **offline** en staat in één projectbestand (`.eschema`) op je pc.

De symbolen volgen het AREI (Boek 1, hoofdstuk 2.13, tabel 2.23 "Grafische symbolen"): contactdozen met
aarding en kinderbescherming, schakelaars (enkel- en tweepolig, wissel, kruis, omschakelaar, dimmer, drukknop),
lichtpunten, toestellen, automaten ("C20") en differentiëlen ("40/0,3A type A").

## Installeren

1. Ga naar **[Releases → laatste](../../releases/tag/laatste)** en download `Elektro-Schema-Setup-….exe`.
2. Open het bestand. Windows kan waarschuwen omdat het programma niet ondertekend is:
   klik op **Meer informatie → Toch uitvoeren**.
3. Het programma komt in het startmenu en op het bureaublad. Een `.eschema`-bestand openen kan met een dubbelklik.

Het installatiebestand wordt automatisch gemaakt bij elke wijziging op `main` (zie **Actions** op GitHub).

## Werken met het programma

### Ééndraadschema

- Links staat het **bord**: hoofdbord, differentiëlen en kringen. Klik iets aan om het rechts aan te passen.
- **+ Differentieel** en **+ Kring** voegen toe op de gekozen plaats. Kringen krijgen automatisch een letter (A, B, C, …),
  onderdelen een nummer (A1, A2, …), net als op een gewoon schema.
- Bij een kring of onderdeel staat rechts een **palet**: één klik op *Stopcontact*, *Lichtpunt*, *Wasmachine*, … voegt het toe.
- Per kring: automaat (stroom, curve, polen), kabel (type, aders, doorsnede, lengte) en of het een badkamer/natte ruimte is.
- Sneltoetsen: **Delete** verwijdert, **Ctrl+D** dupliceert, **Alt+↑/↓** verschuift, **Ctrl+Z / Ctrl+Y** ongedaan maken / opnieuw.
- Zoomen met het muiswiel, verschuiven door te slepen.

### Situatieschema

- **Plan laden…**: een plan van de architect als achtergrond, als afbeelding (JPG, PNG) of PDF (bij meerdere pagina's kies je er één).
- Geen plan? Teken zelf **muren** (klik per hoek, rechtsklik om te stoppen; Alt voor een schuine muur) en zet er **tekst** bij.
- Klik links een onderdeel aan en klik op het plan: het staat er, en het volgende onderdeel staat meteen klaar.
  Zo zet je alles snel na elkaar. **Esc** stopt.
- Symbolen verslepen, **R** draait, **Delete** haalt van het plan. Met de schuifjes zet je de grootte van de symbolen
  en hoe sterk het plan te zien is.
- **+ Plan** voor een extra verdieping, kelder, garage, …

### Materiaallijst

Automaten, differentiëlen, kabel (met marge), stopcontacten, schakelaars, verlichting, inbouwdozen en aansluitpunten.
Vul prijzen in en je krijgt een totaal; de prijzen worden onthouden voor volgende projecten.
**Naar Excel (CSV)** bewaart de lijst voor Excel.

### Controle

Een controle op de belangrijkste AREI-regels voor woningen, o.a.:

- hoofddifferentieel max. 300 mA; badkamer en wasmachine, droogkast en vaatwasser achter 30 mA;
- max. 8 stopcontacten per kring (een meervoudig stopcontact telt als één);
- automaat niet groter dan de kabel toelaat (1,5 mm² → 16 A, 2,5 mm² → 20 A, 4 mm² → 25 A, 6 mm² → 32 A, …);
- aardingsweerstand (boven 30 Ω extra maatregelen, boven 100 Ω te hoog);
- toestellen die best een eigen kring hebben, onderdelen die nog niet op het situatieschema staan.

> Dit is een hulp bij het tekenen en **vervangt de keuring niet**. Kijk de regels zelf na; de tabel met
> kabeldoorsneden staat in `app/js/regels.js` en is makkelijk aan te passen.

### Afdrukken en PDF

**Afdrukken / PDF** (Ctrl+P): kies A4 of A3 liggend en wat er op moet. Elk blad krijgt een titelhoek met project, klant,
adres, installateur, datum en bladnummer (die vul je in via de projectnaam bovenaan). Een lang ééndraadschema wordt
over meerdere bladen verdeeld, tussen twee kringen. Het situatieschema krijgt een legende.

### Opslaan en veiligheid

- **Ctrl+S** slaat het project op als `.eschema` (standaard in *Documenten*).
- Loopt er iets mis voor je opgeslagen hebt, dan vraagt het programma bij de volgende start of het je werk mag terugzetten.

## Voor ontwikkelaars

```bash
npm install
npm test          # tests van model, AREI-controle en materiaallijst
npm start         # het programma openen (Electron)
npm run dev       # dezelfde app in een browser: http://localhost:5173
npm run dist      # installatiebestand maken (op Windows, of op Linux met Wine)
```

- `main.js` en `preload.cjs`: het Windows-programma (venster, menu, bestanden, PDF).
- `app/`: de app zelf (gewone HTML, CSS en JavaScript, geen build nodig).
  - `js/model.js` het project, `js/catalogus.js` de onderdelen, `js/regels.js` de AREI-controle,
    `js/materiaal.js` de materiaallijst, `js/eendraad.js` en `js/plan.js` de tekeningen.
- PDF-plannen worden ingelezen met [pdf.js](https://mozilla.github.io/pdf.js/) (Apache-2.0), dat bij `npm start`,
  `npm run dev` en `npm run dist` naar `app/vendor/` gekopieerd wordt.
- Verhoog `version` in `package.json` voor een nieuwe versie. Een tag `v1.2.3` maakt een aparte release.
