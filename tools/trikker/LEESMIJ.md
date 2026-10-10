# Trikker-symbolen overnemen (werk in uitvoering)

Doel: de symbolen van Trikker (Render-methoden van de Node-klassen) exact nabouwen in JavaScript, voor het situatieschema
(context `Grondplan`) en later ook het ééndraadschema (context `Eendraadschema`).

Wat er al is
- `app/js/trikker/g.js`: een nagebootste GDI+-`Graphics` die alle tekenopdrachten als SVG vastlegt (zelfde uitvoer als de C#-proefopstelling).
- De proefopstelling (niet in de repo, want ze bestaat uit de gedecompileerde code van Trikker): een .NET-project dat de echte
  `Render`-methoden draait met een eigen `System.Drawing`-nabootsing en per variant JSON uitschrijft
  (breedte, hoogte, tekstmarges per draaiing en de SVG voor beide contexten). Werkwijze: exe uit `voorbeelden/` decompileren met
  `ilspycmd`, de Model-klassen compileren tegen een eigen `System.Drawing`-shim, invoer `Klasse;Eigenschap=Waarde;Kind=Klasse`.
- Gebleken: 1 Trikker-eenheid = 3,5 eenheden op ons plan; dunne pen 0,25, middel 0,35, dik 0,7; lettertype Arial 2.

Plan
1. Per klasse een module `app/js/trikker/<Klasse>.js` met `maak(props)` (Width/Height/render/textOffset) en `varianten()`.
2. Vergelijken met de echte uitvoer voor alle variantcombinaties (getalvergelijking met tolerantie), fixtures bewaren in `test/trikker/`.
3. `planSymbool()` in `app/js/symbolen.js` laten teken met deze modules; tekst- en adresplaatsing (Shift/Ctrl + rechtermuisknop) volgens
   `GrondplanPageRenderer` en `Node.RenderAdres`.
4. Muur kleven aan de hoeken van muren (zoals `Muur.ClosestConnectionPoint`).

Opmerking: een contactdoos in Trikker heeft een rechte streep van ±2 eenheden op de steel; onze eerdere symbolen waren iets korter.
