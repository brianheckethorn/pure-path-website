// Browser-local English/Spanish PDF writer. Standard Helvetica, WinAnsi and a
// ToUnicode map preserve accented text without fetching fonts or using a service.
const extraCodes = new Map([
  ['€', 128], ['‚', 130], ['ƒ', 131], ['„', 132], ['…', 133], ['†', 134], ['‡', 135],
  ['ˆ', 136], ['‰', 137], ['Š', 138], ['‹', 139], ['Œ', 140], ['Ž', 142],
  ['‘', 145], ['’', 146], ['“', 147], ['”', 148], ['•', 149], ['–', 150], ['—', 151],
  ['˜', 152], ['™', 153], ['š', 154], ['›', 155], ['œ', 156], ['ž', 158], ['Ÿ', 159]
]);
const specialWidths = { ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015, '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556, '`': 333, '{': 334, '|': 260, '}': 334, '~': 584 };
const upperWidths = [667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611];
const lowerWidths = [556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500];
const width = character => {
  const base = character.normalize('NFD')[0]; const code = base.charCodeAt(0);
  return specialWidths[base] ?? (code >= 65 && code <= 90 ? upperWidths[code - 65] : code >= 97 && code <= 122 ? lowerWidths[code - 97] : 556);
};
const clean = text => String(text).normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\u00a0/g, ' ');
const supportedCodeFor = character => {
  const code = character.codePointAt(0);
  return (code >= 32 && code <= 126) || (code >= 160 && code <= 255) ? code : extraCodes.get(character);
};
const codeFor = character => supportedCodeFor(character) ?? 63;
export const findUnsupportedPDFCharacters = text => [...new Set([...clean(text)].filter(character => character !== '\n' && supportedCodeFor(character) === undefined))];
const hex = (value, length) => value.toString(16).padStart(length, '0').toUpperCase();
const encoded = text => [...text].map(character => hex(codeFor(character), 2)).join('');

function wrapped(text, size, bold = false) {
  const limit = 508 / size * 1000 / (bold ? 1.1 : 1);
  const lines = []; let line = ''; let used = 0;
  for (const word of text.trim().split(/ +/)) {
    const wordWidth = [...word].reduce((sum, character) => sum + width(character), 0);
    if (line && used + 278 + wordWidth > limit) { lines.push(line); line = ''; used = 0; }
    // Wrap long URLs and tokens as well as prose.
    for (const character of (line ? ` ${word}` : word)) {
      const next = width(character);
      if (line && used + next > limit) { lines.push(line); line = ''; used = 0; }
      line += character; used += next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function createResultPDF(text, { language = 'en' } = {}) {
  const spanish = language === 'es';
  const pages = [[]]; let y = 714;
  const addPage = () => { pages.push([]); y = 714; };
  const blocks = clean(text).trim().split(/\n{2,}/).filter(Boolean);
  blocks.push(spanish
    ? 'Opcional: inscríbete para futuros eventos\nhttps://forms.gle/Zcc9QZbo9N7NTQcj6\nEl formulario es voluntario y separado de este informe. No recibe tus respuestas automáticamente.'
    : 'Optional: sign up for future events\nhttps://forms.gle/Zcc9QZbo9N7NTQcj6\nThe form is voluntary and separate from this report. Your answers are not sent to it automatically.');
  const usedCharacters = new Set();
  const draw = (copy, x, atY, size, bold = false, color = '0.15 0.19 0.10') => {
    for (const character of copy) usedCharacters.add(character);
    return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg 1 0 0 1 ${x} ${atY.toFixed(2)} Tm <${encoded(copy)}> Tj ET\n`;
  };
  for (const [blockIndex, block] of blocks.entries()) {
    const segments = block.split('\n'); const lines = [];
    for (const [index, segment] of segments.entries()) {
      const size = blockIndex === 0 ? 18 : 10.5;
      const bold = blockIndex === 0 || (segments.length > 1 && index === 0);
      for (const copy of wrapped(segment, size, bold)) lines.push({ copy, size, bold, height: blockIndex === 0 ? 23 : 14.8 });
    }
    const height = lines.reduce((sum, line) => sum + line.height, 0) + 7;
    if (height < 645 && y - height < 64) addPage();
    for (const line of lines) {
      if (y - line.height < 56) addPage();
      pages.at(-1).push(draw(line.copy, 52, y, line.size, line.bold)); y -= line.height;
    }
    y -= 7;
  }
  for (const [index, page] of pages.entries()) {
    page.unshift(draw('YOUR PURE PATH', 52, 753, 10, true), '0.72 0.81 0.36 RG 1.4 w 52 739 m 560 739 l S\n');
    page.push('0.82 0.86 0.75 RG 0.5 w 52 44 m 560 44 l S\n');
    page.push(draw(spanish ? 'Creado localmente en tu dispositivo' : 'Created locally on your device', 52, 28, 8, false, '0.3 0.34 0.26'));
    page.push(draw(`${spanish ? 'Página' : 'Page'} ${index + 1} / ${pages.length}`, 506, 28, 8, false, '0.3 0.34 0.26'));
  }
  // Unsupported input renders as '?'; never remap ordinary question marks to it.
  const mappings = [...usedCharacters].map(character => [codeFor(character), supportedCodeFor(character) === undefined ? 63 : character.codePointAt(0)]);
  const uniqueMappings = [...new Map(mappings).entries()].filter(([, unicode]) => unicode <= 65535);
  const cmap = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /LocalReportUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n'
    + uniqueMappings.map(([code, unicode]) => `1 beginbfchar\n<${hex(code, 2)}> <${hex(unicode, 4)}>\nendbfchar\n`).join('')
    + 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n';
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R /Lang (${spanish ? 'es' : 'en'}) >>`,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, index) => `${6 + index * 2} 0 R`).join(' ')}] >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding /ToUnicode 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding /ToUnicode 5 0 R >>',
    `<< /Length ${cmap.length} >>\nstream\n${cmap}endstream`
  ];
  for (const [index, page] of pages.entries()) {
    const stream = page.join('');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${7 + index * 2} 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  }
  let pdf = '%PDF-1.4\n%Local report - no remote resources\n'; const offsets = [0];
  for (const [index, object] of objects.entries()) { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Uint8Array.from(pdf, character => character.charCodeAt(0));
}
