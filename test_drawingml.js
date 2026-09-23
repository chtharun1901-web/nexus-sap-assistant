const JSZip = require('./client/node_modules/jszip');
const fs = require('fs');
const path = require('path');

const EMU_PER_IN = 914400;
function emu(inch) {
  return String(Math.round(inch * EMU_PER_IN));
}

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

let _id = 1;
function nextId() {
  return ++_id;
}

const FONT = "Arial";

function txbody(textLines, fontSize = 9, bold = false, color = "1A1A1A") {
  if (!textLines || textLines.length === 0) return "";
  const sz = String(Math.round(fontSize * 100));
  const b = bold ? "1" : "0";
  const paras = textLines.map(line => 
    `<a:p><a:pPr algn="ctr" indent="0" marL="0"><a:buNone/></a:pPr>` +
    `<a:r><a:rPr lang="en-US" sz="${sz}" b="${b}" dirty="0">` +
    `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>` +
    `<a:latin typeface="${FONT}" pitchFamily="34" charset="0"/>` +
    `<a:ea typeface="${FONT}" pitchFamily="34" charset="-122"/>` +
    `<a:cs typeface="${FONT}" pitchFamily="34" charset="-120"/></a:rPr>` +
    `<a:t>${escapeXml(line)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${sz}" dirty="0"/></a:p>`
  ).join("");

  return `<xdr:txBody><a:bodyPr wrap="square" lIns="25400" tIns="25400" rIns="25400" bIns="25400" rtlCol="0" anchor="ctr"/><a:lstStyle/>${paras}</xdr:txBody>`;
}

function shape(prst, x, y, w, h, fill, lineColor, text = null, fontSize = 9, bold = false, textColor = "1A1A1A", lineWidth = 1.25, name = null) {
  const sid = nextId();
  const nm = name || `Shape ${sid}`;
  const fillXml = `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>`;
  const lw = String(Math.round(lineWidth * 12700));
  const textLines = text ? text.split("\n") : null;
  const body = txbody(textLines, fontSize, bold, textColor);
  const sp = 
    `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${sid}" name="${escapeXml(nm)}"/>` +
    `<xdr:cNvSpPr/></xdr:nvSpPr>` +
    `<xdr:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
    `<a:prstGeom prst="${prst}"><a:avLst/></a:prstGeom>${fillXml}` +
    `<a:ln w="${lw}"><a:solidFill><a:srgbClr val="${lineColor}"/></a:solidFill></a:ln></xdr:spPr>` +
    `${body}</xdr:sp>`;
  return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/>${sp}<xdr:clientData/></xdr:absoluteAnchor>`;
}

function arrow(x1, y1, x2, y2, color = "595959", dash = "solid", width = 1.5) {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1) || 0.01;
  const h = Math.abs(y2 - y1) || 0.01;
  const flipH = x2 < x1;
  const flipV = y2 < y1;
  const sid = nextId();
  let flipAttrs = "";
  if (flipH) flipAttrs += ' flipH="1"';
  if (flipV) flipAttrs += ' flipV="1"';
  const lw = String(Math.round(width * 12700));
  const dashXml = dash === "solid" ? "" : `<a:prstDash val="${dash}"/>`;
  const sp = 
    `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${sid}" name="Line ${sid}"/>` +
    `<xdr:cNvSpPr/></xdr:nvSpPr>` +
    `<xdr:spPr><a:xfrm${flipAttrs}><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
    `<a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:noFill/>` +
    `<a:ln w="${lw}"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill>${dashXml}` +
    `<a:tailEnd type="triangle"/></a:ln></xdr:spPr></xdr:sp>`;
  return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/>${sp}<xdr:clientData/></xdr:absoluteAnchor>`;
}

function label(text, x, y, w, h, fontSize = 8, italic = false, bold = false, color = "595959", align = "ctr") {
  const sid = nextId();
  const sz = String(Math.round(fontSize * 100));
  const b = bold ? "1" : "0";
  const i = italic ? "1" : "0";
  const sp = 
    `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${sid}" name="Label ${sid}"/>` +
    `<xdr:cNvSpPr txBox="1"/></xdr:nvSpPr>` +
    `<xdr:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></xdr:spPr>` +
    `<xdr:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/>` +
    `<a:p><a:pPr algn="${align}" indent="0" marL="0"><a:buNone/></a:pPr>` +
    `<a:r><a:rPr lang="en-US" sz="${sz}" b="${b}" i="${i}" dirty="0">` +
    `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>` +
    `<a:latin typeface="${FONT}" pitchFamily="34" charset="0"/></a:rPr>` +
    `<a:t>${escapeXml(text)}</a:t></a:r></a:p></xdr:txBody></xdr:sp>`;
  return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/>${sp}<xdr:clientData/></xdr:absoluteAnchor>`;
}

function rrectBg(x, y, w, h, fill = "F7F7F7", line = "BFBFBF") {
  const sid = nextId();
  const sp = 
    `<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="${sid}" name="BG ${sid}"/>` +
    `<xdr:cNvSpPr/></xdr:nvSpPr>` +
    `<xdr:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>` +
    `<a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>` +
    `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>` +
    `<a:ln w="9525"><a:solidFill><a:srgbClr val="${line}"/></a:solidFill><a:prstDash val="dash"/></a:ln></xdr:spPr></xdr:sp>`;
  return `<xdr:absoluteAnchor><xdr:pos x="${emu(x)}" y="${emu(y)}"/><xdr:ext cx="${emu(w)}" cy="${emu(h)}"/>${sp}<xdr:clientData/></xdr:absoluteAnchor>`;
}

async function testGenerate() {
  const shapesXml = [];
  const TERM = "flowChartTerminator", PROC = "flowChartProcess", DEC = "flowChartDecision";
  const GREEN = "C6E0B4", GREEN_L = "548235";
  const RED = "F4B7B3", RED_L = "C00000";
  const PEACH = "FBE0CE", PEACH_L = "C55A11";
  const GOLD = "FFE599", GOLD_L = "BF9000";

  shapesXml.push(label("CO01: Production order creation for a Finished Good — backend flow", 0.25, 0.08, 12.5, 0.28, 13, false, true, "1A1A1A", "l"));
  shapesXml.push(rrectBg(0.2, 0.45, 12.6, 1.35));
  shapesXml.push(label("PHASE 1 — Master data read & multi-level BOM explosion", 0.32, 0.5, 6, 0.2, 8, false, true, "808080", "l"));

  const r1y = 0.85, r1h = 0.72;
  shapesXml.push(shape(TERM, 0.35, r1y, 1.0, r1h, GREEN, GREEN_L, "Start\nCO01", 9, true));
  shapesXml.push(shape(PROC, 1.55, r1y, 1.55, r1h, PEACH, PEACH_L, "Enter FG, Plant,\nOrder type", 8));
  shapesXml.push(arrow(1.35, r1y + r1h / 2, 1.55, r1y + r1h / 2, "595959"));

  const drawingXml = 
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    shapesXml.join("") +
    `</xdr:wsDr>`;

  const zip = new JSZip();

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`);

  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

  zip.file("docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application></Properties>`);

  zip.file("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Antigravity SAP Knowledge Assistant</dc:creator><dc:title>SAP Process Flow</dc:title></cp:coreProperties>`);

  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Process Flow" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);

  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`);

  zip.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`);

  zip.file("xl/theme/theme1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2><a:accent1><a:srgbClr val="4F81BD"/></a:accent1><a:accent2><a:srgbClr val="C0504D"/></a:accent2><a:accent3><a:srgbClr val="9BBB59"/></a:accent3><a:accent4><a:srgbClr val="8064A2"/></a:accent4><a:accent5><a:srgbClr val="4BACC6"/></a:accent5><a:accent6><a:srgbClr val="F79646"/></a:accent6><a:hlink><a:srgbClr val="0000FF"/></a:hlink><a:folHlink><a:srgbClr val="800080"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`);

  zip.file("xl/worksheets/sheet1.xml", `<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><outlinePr summaryBelow="1" summaryRight="1"/><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:A1"/>
  <sheetViews><sheetView showGridLines="0" workbookViewId="0"><selection activeCell="A1" sqref="A1"/></sheetView></sheetViews>
  <sheetFormatPr baseColWidth="8" defaultRowHeight="15"/>
  <sheetData></sheetData>
  <pageMargins left="0.2" right="0.2" top="0.2" bottom="0.2" header="0.5" footer="0.5"/>
  <pageSetup orientation="landscape" paperSize="8" fitToHeight="1" fitToWidth="1"/>
  <drawing r:id="rIdDraw1"/>
</worksheet>`);

  zip.file("xl/worksheets/_rels/sheet1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdDraw1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`);

  zip.file("xl/drawings/drawing1.xml", drawingXml);

  zip.file("xl/drawings/_rels/drawing1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  const outPath = path.join(__dirname, 'test_output.xlsx');
  fs.writeFileSync(outPath, buf);
  console.log('Successfully generated test_output.xlsx, size:', buf.length);
}

testGenerate().catch(console.error);
