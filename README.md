# Elektro Schema

Windows-programma om voor een elektrische installatie (België, AREI) te tekenen:

- het **ééndraadschema**,
- het **situatieschema** (per verdieping, op het plan van de architect),
- de **materiaallijst**, rechtstreeks uit het schema.

Alles werkt **offline** en staat in één projectbestand (`.eschema`) op je pc.

De symbolen en de opbouw van het schema volgen **Trikker** en het **AREI** (Boek 1, hoofdstuk 2.13, tabel 2.23):
de verdeellijn onderaan, de kringen naar boven met hun letter, naam, automaat en kabel, en alle onderdelen
genummerd van onder naar boven.

## Installeren

1. Ga naar **[Releases → laatste](../../releases/tag/laatste)** en download `Elektro-Schema-Setup-….exe`.
2. Open het bestand. Windows kan waarschuwen omdat het programma niet ondertekend is:
   klik op **Meer informatie → Toch uitvoeren**.
3. Het programma komt in het startmenu en op het bureaublad. Een `.eschema`-bestand openen kan met een dubbelklik.

Het installatiebestand wordt automatisch gemaakt bij elke wijziging op `main` (zie **Actions** op GitHub).

## Werken met het programma

### Ééndraadschema

- Links staat het **bord**: het hoofdbord, **groepen** (generaal zekering, differentieel, differentieelautomaat of een gewone rij)
  en **kringen**. Klik iets aan om het rechts aan te passen.
- **+ Groep** en **+ Kring** voegen toe op de gekozen plaats. Groepen en kringen krijgen automatisch een letter
  (A, B, …, AA, AB, …) of een **vaste letter** die je zelf kiest (bv. XYZ). De **naam** komt bovenaan de kring te staan.
- Een kring heeft een automaat (stroom, curve, polen, onderbrekingsvermogen, eventueel differentieelautomaat) en een kabel
  (type, aders, doorsnede, lengte en plaatsing: in/op een wand, lucht, ondergronds, in een buis).
- Onderdelen worden per rij genummerd: een schakelaar met de lampen erna is één rij. Rechts staat een **palet** voor de
  meest gebruikte onderdelen en een keuzelijst met **alle 43 soorten**: contactdoos, schakelaar, drukknop, lichtpunt,
  toestellen, ketel, boiler, motor, pomp, transformator, beveiligingen, alarm en detectie, camera, intercom, slot,
  domotica, zonnepaneel en meer. Elk onderdeel heeft zijn eigen eigenschappen (zoals in Trikker).
- Per onderdeel kan je ook een **adres** (de tekst langs het symbool), een **tekst rechts**, een **aantal** (x3) en de
  **plaatsing** instellen: automatisch, op de kringlijn (evenwijdig) of op een eigen rij.
- **Kopiëren** (Ctrl+C) en **plakken** (Ctrl+V) van kringen, groepen en onderdelen; de laatste 7 staan onder **Gekopieerd**.
  **Favorieten**: bewaar een onderdeel met jouw eigenschappen (tot 91). Met **Eigen symbool importeren…** maak je van een afbeelding
  (max. 250 × 250 pixels) een symbool met een eigen breedte en een omschrijving voor de materiaallijst.
- **Nummer** bij het hoofdbord of een groep zet een voorvoegsel voor de kringen eronder (1A, 1B, …; 2A, 2B, …).
  **Op nieuwe pagina starten** (rode lijn) bepaalt waar het schema bij het afdrukken een nieuw blad begint.
- **Domotica functie** (input of output) en **adres**: een input toont de kring van de output met hetzelfde adres.
- Sneltoetsen: **Delete** verwijdert, **Ctrl+D** dupliceert, **Alt+↑/↓** verschuift, **Ctrl+C / Ctrl+V** kopieert en plakt, **Ctrl+Z / Ctrl+Y** ongedaan maken / opnieuw.
- Zoomen met het muiswiel, verschuiven door te slepen. **Bestand → Alle symbolen bekijken** toont alle onderdelen met hun varianten.

### Situatieschema

**Het grondplan**

- **Plan laden…**: een plan van de architect als achtergrond: afbeelding (JPG, PNG, …), **PDF** of **DXF** (AutoCAD).
  Bij een PDF of DXF verschijnt eerst een venster waarin je de **pagina** kiest, **lagen** aan of uit zet, met de muis een
  **uitsnede** sleept en eventueel **alles één kleur** (bv. lichtgrijs) geeft. Met **Tekening aanpassen** kan dat later nog.
  Een DXF met eenheden brengt zijn **schaal** mee; anders klik je twee punten waarvan je de afstand kent. DWG kan niet rechtstreeks
  gelezen worden: sla de tekening op als DXF of PDF.
- Geen plan? Teken zelf. Het raster is 20 punten; 100 punten zijn standaard één meter (aanpasbaar met **Schaal…**).
- **Tekenen**: **muur** (klik per hoek; klik opnieuw op het beginpunt, rechtsklik of Esc om te stoppen), **ronde muur** (begin, einde en
  een punt op de ronding), **deur** (draai-, dubbele of schuifdeur; rechtsklik draait de openingsrichting om), **garagepoort**, **raam**,
  **trap**, **draaitrap**, **rechthoek**, **vlak** (kleur en transparantie), **lijn** (dikte en kleur), **maatlijn** (twee meetpunten en
  waar de lijn komt; eventueel een eigen tekst), **meetlijn**, **tekst** en **afbeelding** (of sleep een bestand op het plan).
  **Ctrl** houdt de lijn recht, **Alt** zet het kleven even uit. De **lengte en hoek** staan onderaan terwijl je tekent.
- De **lengte in meter** zie je enkel terwijl je tekent of als je iets aanklikt (bij een muur ook het **totaal van de aaneengesloten
  muren**); met **Alle afmetingen** staan ze er altijd (ook op de afdruk).

**Selecteren en wijzigen**

- **Selecteren**: klik, **Shift+klik** om bij te voegen, of sleep een kader. Sleep om te **verplaatsen**; de oranje handvatten verplaatsen
  een uiteinde, vergroten of draaien een rechthoek, vlak of afbeelding. De **pijltjestoetsen** verplaatsen (Shift = enkel het eerste,
  Ctrl = enkel het tweede uiteinde, Alt = kleine stappen). **Ctrl+A** selecteert alles.
- **Kopiëren** en **plakken** (Ctrl+C / Ctrl+V, ook naar een andere pagina), **spiegelen** (↔ ↕), **roteren** over een hoek,
  **schalen** (vergroten of verkleinen), **kleuren** en **wissen**. **R** draait een symbool een kwartslag (met Alt in kleine stappen).
- Rechts staan de **eigenschappen** van wat gekozen is: breedte, hoek, type van een deur, kleur, transparantie, vaste tekst bij een
  maatlijn, plaats van de tekst en het adres bij een symbool, enz. Een afbeelding kan je **vergrendelen**.
- Een **grid** (tonen en **kleven**), **Kleef aan muren** (muren springen naar andere muren en symbolen kleven tegen de muur) en een
  **transparante modus** om iets over te tekenen. **A4- en A3-hulplijnen** tonen wat op een redelijke grootte afgedrukt wordt.

**Symbolen plaatsen**

- Klik links een onderdeel en klik op het plan: het staat er en het volgende staat klaar. Je ziet vooraf een voorbeeld. Symbolen
  **kleven aan de muur** en wijzen de ruimte in; rechtsklik draait ze tijdens het plaatsen (met Alt in kleine stappen), **Alt** zet ze vrij.
- De **tekst** bij een symbool staat zo dat ze geen muur of ander symbool raakt; je kan de plaats ook zelf kiezen (links, rechts, boven,
  onder of verbergen). Zoals in Trikker staat het **adres** (bij een input ook de kring van de output) in plaats van de kring als het ingevuld is.
  **Beletteren** en **Nummeren** zetten letter en nummer per pagina aan of uit.
- **Begin met het situatieschema**: teken het huis (standaard met **rechte hoeken** en aan het raster, dus recht en netjes; Alt tekent vrij),
  zet met **Losse symbolen** alle stopcontacten, lichtpunten en schakelaars (ze kleven aan de muur), en **verbind** met het gereedschap
  *Verbinden* elke schakelaar met de lampen die hij bedient. Maak daarna in het ééndraadschema de kringen (zekeringen) aan en geef
  per zekering aan wat erop staat: met **Kring-modus** kies je een kring en klik je de symbolen, of kies je symbolen met een kader en
  gebruik je **Aan kring toewijzen…**. Een schakelaar komt met zijn lampen op één rij in de kring.
- **Zoek op ES** (Ctrl+F) toont het symbool op het ééndraadschema; **Zoek op situatieschema** in het ééndraadschema doet het omgekeerde.
- **Losse symbolen** (aanzetten via **Instellingen**): symbolen die (nog) niet op het ééndraadschema staan. Ze tellen mee op de
  materiaallijst en je koppelt ze later aan een kring in het ééndraadschema. Zo kan je ook eerst het situatieschema tekenen.
- **Pagina’s**: vorige, volgende, nieuw, wissen en **Pagina’s…** om te herschikken en per pagina een titel, subtitel en een
  **compact kader** in te stellen. **Afdrukschaal…** stelt per pagina een vaste schaal (1 : 100, …) in.
- **Grondplan exporteren als PNG** (menu Bestand) bundelt alle pagina’s zonder symbolen in één afbeelding, bv. als achtergrond voor Niko Home Control.

### Materiaallijst

Automaten, differentiëlen, kabel (met marge), stopcontacten, schakelaars, verlichting, inbouwdozen, aansluitpunten, eigen
symbolen en de losse symbolen van het situatieschema. Vul prijzen in en je krijgt een totaal; de prijzen worden onthouden voor
volgende projecten. **Naar Excel (.xlsx)** bewaart een echt Excel-bestand (of **Als CSV**). Met **Symbolen in de lijst** komt bij elke
regel ook het symbool, handig als legende bij het dossier.

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

**Afdrukken / PDF** (Ctrl+P): kies A4 of A3 liggend en wat er op moet: ééndraadschema (automatisch verdeeld over pagina’s, of enkel
waar je “nieuwe pagina” instelde), situatieschema met legende, **Lijst kringen** (in de volgorde van het schema of alfabetisch),
**Opmerkingen per kring** (wat de controle vindt plus wat je zelf bij een kring schreef) en de materiaallijst. Je kiest ook of de
datum en het stroomtype in de titelhoek komen en kan er een extra tekst bijzetten.

De titelhoek toont project, klant, plaats van de installatie (het werfadres), installateur, controleorganisme, datum, stroomtype, je
**logo** en het bladnummer. Wil je enkel een eendraadschema of enkel een situatieschema (met losse symbolen) afdrukken, vink dan de
rest uit.

### Gegevens en instellingen

- **Projectgegevens** (klik de projectnaam bovenaan): klant, adres, werfadres, installateur (ikzelf of iemand anders) en controleorganisme.
- **Instellingen** (Ctrl+6, menu Bestand): jouw gegevens als installateur, een logo, een standaard controleorganisme voor nieuwe projecten,
  **automatische backups** (om de zoveel minuten, in een map naar keuze; het programma wist nooit zelf een backup) en **losse symbolen**.
- **F1** opent deze handleiding. **Bestand → Alle symbolen bekijken** toont alle onderdelen met hun varianten.

### Opslaan en veiligheid

- **Ctrl+S** slaat het project op als `.eschema` (standaard in *Documenten*).
- Loopt er iets mis voor je opgeslagen hebt, dan vraagt het programma bij de volgende start of het je werk mag terugzetten, en er worden automatisch backups bewaard (zie Instellingen).

## Wat het niet doet

Dit programma is geen kopie van Trikker maar een eigen programma met dezelfde werkwijze. Een paar dingen zijn er bewust niet in:

- het tekenen van het ééndraadschema door op oranje aansluitpunten te klikken (hier werk je met de boom en de eigenschappen);
- DWG-bestanden lezen (gebruik DXF of PDF), en de talen Frans en Engels (alles is Nederlands);
- het formaat voor **Home Center** (Velbus/Qbus) en “Hulp op afstand”.

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
