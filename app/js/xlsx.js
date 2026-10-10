// Een Excel-bestand (.xlsx) maken zonder bibliotheek: een zip zonder compressie met de nodige XML-bestanden.

const tabel = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = tabel[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const tekstBytes = (s) => new TextEncoder().encode(s);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Een zip met bestanden { naam, data: Uint8Array } zonder compressie ("stored"). */
export function maakZip(bestanden) {
  const delen = [];
  const centraal = [];
  let positie = 0;
  const u16 = (n) => [n & 0xff, (n >>> 8) & 0xff];
  const u32 = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  for (const { naam, data } of bestanden) {
    const nm = tekstBytes(naam);
    const crc = crc32(data);
    const kop = Uint8Array.from([
      0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0),
    ]);
    delen.push(kop, nm, data);
    centraal.push({ nm, crc, lengte: data.length, positie });
    positie += kop.length + nm.length + data.length;
  }
  const begin = positie;
  let grootte = 0;
  for (const c of centraal) {
    const kop = Uint8Array.from([
      0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(c.crc), ...u32(c.lengte), ...u32(c.lengte), ...u16(c.nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(c.positie),
    ]);
    delen.push(kop, c.nm);
    grootte += kop.length + c.nm.length;
  }
  delen.push(Uint8Array.from([0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(centraal.length), ...u16(centraal.length), ...u32(grootte), ...u32(begin), ...u16(0)]));
  const totaal = delen.reduce((som, d) => som + d.length, 0);
  const uit = new Uint8Array(totaal);
  let o = 0;
  for (const d of delen) { uit.set(d, o); o += d.length; }
  return uit;
}

const kolomNaam = (i) => {
  let s = '';
  let n = i + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
};

/**
 * Een werkblad als .xlsx. rijen: lijst van lijsten; een getal wordt een getal, de rest tekst.
 * De eerste rij is de kop (vet). breedtes: de kolombreedtes in tekens.
 */
export function maakXlsx(rijen, { blad = 'Materiaallijst', breedtes = [] } = {}) {
  const cel = (w, r, k) => {
    if (w === '' || w == null) return '';
    const ref = `${kolomNaam(k)}${r + 1}`;
    const stijl = r === 0 ? ' s="1"' : '';
    if (typeof w === 'number' && Number.isFinite(w)) return `<c r="${ref}"${stijl}><v>${w}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${stijl}><is><t xml:space="preserve">${esc(w)}</t></is></c>`;
  };
  const kolommen = breedtes.length ? `<cols>${breedtes.map((b, i) => `<col min="${i + 1}" max="${i + 1}" width="${b}" customWidth="1"/>`).join('')}</cols>` : '';
  const data = rijen.map((rij, r) => `<row r="${r + 1}">${rij.map((w, k) => cel(w, r, k)).join('')}</row>`).join('');
  const bestanden = [
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(blad.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Standaard" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
    ['xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${kolommen}<sheetData>${data}</sheetData></worksheet>`],
  ].map(([naam, tekst]) => ({ naam, data: tekstBytes(tekst) }));
  return maakZip(bestanden);
}

/** Bytes naar base64, om over te sturen naar het Windows-gedeelte. */
export function naarBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
