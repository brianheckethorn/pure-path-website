import { pdfFonts } from '../components/result-pdf-fonts.js';
// Browser-local English/Spanish PDF writer. Embedded brand fonts, WinAnsi and a
// ToUnicode map preserve accented text without fetching fonts or using a service.
const extraCodes = new Map([
  ['€', 128], ['‚', 130], ['ƒ', 131], ['„', 132], ['…', 133], ['†', 134], ['‡', 135],
  ['ˆ', 136], ['‰', 137], ['Š', 138], ['‹', 139], ['Œ', 140], ['Ž', 142],
  ['‘', 145], ['’', 146], ['“', 147], ['”', 148], ['•', 149], ['–', 150], ['—', 151],
  ['˜', 152], ['™', 153], ['š', 154], ['›', 155], ['œ', 156], ['ž', 158], ['Ÿ', 159]
]);
const clean = text => String(text).normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\u00a0/g, ' ');
const supportedCodeFor = character => {
  const code = character.codePointAt(0);
  return (code >= 32 && code <= 126) || (code >= 160 && code <= 255) ? code : extraCodes.get(character);
};
const codeFor = character => supportedCodeFor(character) ?? 63;
export const findUnsupportedPDFCharacters = text => [...new Set([...clean(text)].filter(character => character !== '\n' && supportedCodeFor(character) === undefined))];
const hex = (value, length) => value.toString(16).padStart(length, '0').toUpperCase();
const encoded = text => [...text].map(character => hex(codeFor(character), 2)).join('');

function wrapped(text, size, bold = false, availableWidth = 508, font = 'F1') {
  const metrics = pdfFonts[font === 'F3' ? 'serif' : bold ? 'bold' : 'regular'].widths;
  const glyphWidth = character => metrics[codeFor(character)] || 556;
  const limit = availableWidth / size * 1000;
  const lines = []; let line = ''; let used = 0;
  for (const word of text.trim().split(/ +/)) {
    const wordWidth = [...word].reduce((sum, character) => sum + glyphWidth(character), 0);
    if (line && used + 278 + wordWidth > limit) { lines.push(line); line = ''; used = 0; }
    // Wrap long URLs and tokens as well as prose.
    for (const character of (line ? ` ${word}` : word)) {
      const next = glyphWidth(character);
      if (line && used + next > limit) { lines.push(line); line = ''; used = 0; }
      line += character; used += next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Optional structured model affects presentation only. The plain-text fallback is
// retained for Wellness Snapshot. No measurements, scoring or clinical rules here.
export function createResultPDF(text, { language = 'en', model } = {}) {
  const es = language === 'es'; const pages = []; const usedCharacters = new Set();
  const H = 792, margin = 42, contentWidth = 528, bottom = 727;
  const colors = { forest: '0.149 0.188 0.102', ink: '0.122 0.149 0.086', muted: '0.294 0.325 0.251', line: '0.851 0.871 0.776', cream: '0.957 0.965 0.918', sage: '0.933 0.953 0.839', lime: '0.725 0.812 0.361', white: '1 1 1', warm: '0.957 0.945 0.902', brown: '0.306 0.247 0.09' };
  const portrait = model?.portrait;
  const hasPortrait = portrait?.bytes instanceof Uint8Array && portrait.bytes.length < 2_000_000 && portrait.bytes[0] === 255 && portrait.bytes[1] === 216 && Number.isInteger(portrait.width) && Number.isInteger(portrait.height) && portrait.width > 0 && portrait.height > 0;
  let page; let y; let groupedRecommendations = false; let deferredRecommendations = () => {};
  const draw = (copy, x, top, size = 10, font = 'F1', color = colors.ink) => {
    copy = clean(copy);
    for (const character of copy) usedCharacters.add(character);
    page.commands.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${(H - top).toFixed(2)} Tm <${encoded(copy)}> Tj ET\n`);
  };
  const rect = (x, top, w, h, fill) => page.commands.push(`${fill} rg ${x} ${H - top - h} ${w} ${h} re f\n`);
  const roundedPath = (x, top, w, h, radius = 10) => {
    const b = H - top - h, r = Math.min(radius, w / 2, h / 2), k = r * 0.55228475;
    return `${x + r} ${b} m ${x + w - r} ${b} l ${x + w - r + k} ${b} ${x + w} ${b + r - k} ${x + w} ${b + r} c ${x + w} ${b + h - r} l ${x + w} ${b + h - r + k} ${x + w - r + k} ${b + h} ${x + w - r} ${b + h} c ${x + r} ${b + h} l ${x + r - k} ${b + h} ${x} ${b + h - r + k} ${x} ${b + h - r} c ${x} ${b + r} l ${x} ${b + r - k} ${x + r - k} ${b} ${x + r} ${b} c h\n`;
  };
  const panel = (x, top, w, h, fill, stroke, radius = 10) => page.commands.push(`${fill} rg ${stroke || colors.line} RG 0.8 w\n${roundedPath(x, top, w, h, radius)}${stroke ? 'B' : 'f'}\n`);
  const rule = (top, x = margin, w = contentWidth) => page.commands.push(`${colors.line} RG 0.6 w ${x} ${H - top} m ${x + w} ${H - top} l S\n`);
  function newPage(label = '', cover = false) {
    page = { commands: [], label }; pages.push(page); y = 118;
    rect(0, 0, 612, cover ? 154 : 54, colors.forest);
    draw('Your Pure Path', margin, 34, 16, 'F3', colors.warm);
    panel(461, 20, 109, 19, colors.lime, undefined, 9.5);
    draw(es ? 'COPIA PERSONAL' : 'PERSONAL COPY', 472, 32, 7.5, 'F2');
    if (label) draw(label, margin, cover ? 69 : 85, 8, 'F2', cover ? colors.warm : colors.brown);
    if (cover) y = 106;
  }
  const ensure = height => { if (y + height > bottom) newPage(page.label); };
  const linesFor = (copy, size = 10, bold = false, w = contentWidth, font = 'F1') => clean(copy).split('\n').flatMap(line => wrapped(line, size, bold, w, font));
  function paragraph(copy, { size = 10.4, bold = false, gap = 10, color = colors.ink, x = margin, w = contentWidth, lineHeight = size * 1.4 } = {}) {
    const lines = linesFor(copy, size, bold, w); const height = lines.length * lineHeight + gap;
    if (height < 615) ensure(height);
    for (const line of lines) { ensure(lineHeight); draw(line, x, y, size, bold ? 'F2' : 'F1', color); y += lineHeight; }
    y += gap;
  }
  function heading(copy, size = 21, color = colors.ink) {
    const lines = linesFor(copy, size, false, contentWidth, 'F3'); ensure(lines.length * size * 1.18 + 28);
    for (const line of lines) { draw(line, margin, y, size, 'F3', color); y += size * 1.18; } y += 12;
  }
  function box(copy, label) {
    const lines = linesFor(copy, 10.2, false, contentWidth - 32); const h = lines.length * 14.2 + (label ? 43 : 28);
    if (h > 590) { if (label) paragraph(label, { bold: true }); paragraph(copy); return; }
    ensure(h + 12);
    panel(margin, y - 12, contentWidth, h, colors.cream, undefined, 10);
    if (label) { draw(label, margin + 16, y + 6, 8, 'F2', colors.muted); y += 25; }
    for (const line of lines) { draw(line, margin + 16, y + 3, 10.2); y += 14.2; } y += label ? 22 : 30;
  }
  function recommendation(copy, index) {
    const body = clean(copy).replace(/^\d+\.\s*/, ''); const lines = linesFor(body, 10.4, false, contentWidth - 50);
    const h = lines.length * 14.5 + 20;
    if (h > 590) { paragraph(`${index + 1}. ${body}`); return; }
    ensure(h + 7);
    panel(margin, y - 9, 27, 27, colors.lime, undefined, 13.5);
    draw(`${index + 1}.`, margin + 8, y + 9, 12, 'F3');
    for (const line of lines) { draw(line, margin + 43, y + 3, 10.4); y += 14.5; } y += 24;
    rule(y - 16, margin + 43, contentWidth - 43);
  }
  function answersRow(question, answer, index) {
    const q = linesFor(question, 10.1, false, 338); const a = linesFor(answer, 10.1, true, 174);
    const h = Math.max(q.length, a.length) * 14 + 16;
    if (h > 590) { paragraph(question, { bold: true }); paragraph(answer); return; }
    ensure(h + 5);
    q.forEach((line, lineIndex) => draw(line, margin, y + 3 + lineIndex * 14, 10.1, 'F1', colors.muted));
    a.forEach((line, lineIndex) => draw(line, margin + 354, y + 3 + lineIndex * 14, 10.1, 'F2'));
    y += h; rule(y - 12);
  }
  newPage('CONSULTATION PREPARATION', true);
  if (model) {
    heading(model.title || clean(text).split('\n')[0], 30, colors.warm); y = Math.max(y, 178);
    if (model.sampleNotice) paragraph(model.sampleNotice, { size: 9, bold: true, gap: 15 });
    if (model.actual) {
      const cards = [model.actual, model.estimate || {
        label: es ? 'Tu edad de salud aproximada' : 'Your approximate health-age estimate',
        pending: true
      }]; ensure(139);
      const top = y - 5;
      cards.forEach((card, index) => {
        const x = margin + index * 271; panel(x, top, 257, 119, index === 0 ? colors.white : colors.sage, index === 0 ? colors.line : '0.616 0.706 0.263');
        const labels = linesFor(`${card.label}:`, 10, true, 225);
        labels.forEach((line, row) => draw(line, x + 16, top + 22 + row * 14, 10, 'F2'));
        if (card.pending) draw(model.estimatePending ? (es ? 'En revisión' : 'Pending review') : (es ? 'No disponible' : 'Not available'), x + 16, top + 87, 25, 'F3');
        else {
          draw(String(card.value), x + 16, top + 87, 43, 'F3');
          draw(card.unit || (es ? 'años' : 'years'), x + 105, top + 86, 11);
        }
      }); y = top + 140;
    }
    if (model.disclosure) box(model.disclosure, es ? 'CÓMO ENTENDER ESTA ESTIMACIÓN' : 'HOW TO READ THIS ESTIMATE');
    if (model.notice) paragraph(model.notice, { size: 9.3, color: colors.muted, gap: 16 });
    if (model.recommendations) {
      const recommendations = model.recommendations;
      heading(recommendations.title, 21);
      if (recommendations.intro) paragraph(recommendations.intro, { size: 9.8, color: colors.muted });
      const grouped = ['primary', 'additional', 'care'].some(key => Array.isArray(recommendations[key]));
      groupedRecommendations = grouped;
      if (grouped) {
        const groups = [
          { key: 'primary', title: recommendations.primaryTitle || (es ? 'Empieza con estos pasos cotidianos' : 'Start with these everyday steps') },
          { key: 'additional', title: recommendations.additionalTitle || (es ? 'Más ideas según tus respuestas' : 'More ideas from your answers') },
          { key: 'care', title: recommendations.careTitle || (es ? 'Preguntas para tu equipo de atención' : 'Questions for your care team') }
        ];
        let recommendationIndex = 0;
        const renderGroup = group => {
          const items = recommendations[group.key] || [];
          if (!items.length) return;
          page.label = group.title;
          // Keep each subgroup heading with its first complete practical step.
          const firstHeight = linesFor(items[0], 10.4, false, contentWidth - 50).length * 14.5;
          ensure(Math.min(600, firstHeight + 70)); heading(group.title, 16);
          for (const item of items) recommendation(item, recommendationIndex++);
        };
        renderGroup(groups[0]);
        // Keep safety notices near the front, ahead of the longer optional list.
        deferredRecommendations = () => groups.slice(1).forEach(renderGroup);
      } else (recommendations.items || []).forEach(recommendation);
    }
    if (model.readingContext?.length) {
      const readingLabel = es ? 'LECTURAS Y ORIENTACIÓN' : 'READINGS AND GUIDANCE';
      const readingTitle = es ? 'Sobre las lecturas que compartiste' : 'About the readings you shared';
      if (groupedRecommendations) {
        page.label = readingLabel;
        const headingHeight = linesFor(readingTitle, 27, false, contentWidth, 'F3').length * 27 * 1.18 + 12;
        const firstBoxHeight = linesFor(model.readingContext[0], 10.2, false, contentWidth - 32).length * 14.2 + 28;
        // Flow after the priorities, keeping the guidance heading and first box together.
        ensure(Math.min(609, headingHeight + firstBoxHeight + 26)); y += 14;
      } else newPage(readingLabel);
      heading(readingTitle, 27);
      box(model.readingContext[0]);
      for (const item of model.readingContext.slice(1)) {
        if (/https:\/\//.test(item)) paragraph(item, { size: 8.8, gap: 18, color: colors.muted, lineHeight: 12.3 });
        else paragraph(item, { size: 10.5, gap: 16, lineHeight: 15.2 });
      }
    }
    deferredRecommendations();
    if (model.interpretation) {
      ensure(130); y += 5; heading(model.interpretation.title, 21);
      for (const item of model.interpretation.paragraphs || []) paragraph(item, { size: 10, gap: 10 });
    }
    if (model.answerGroups?.length) {
      newPage(es ? 'TUS RESPUESTAS' : 'YOUR ANSWERS');
      heading(es ? 'Revisar mis respuestas' : 'Review my answers', 27);
      for (const group of model.answerGroups) {
        const first = group.answers[0];
        const firstHeight = first ? Math.max(linesFor(first.question, 10.1, false, 338).length, linesFor(first.answer, 10.1, true, 174).length) * 14 + 16 : 0;
        if (group.title) page.label = group.title;
        ensure(Math.min(firstHeight + 42, 600));
        if (group.title) { panel(margin, y - 7, 7.5, 7.5, colors.lime, undefined, 2); draw(group.title, margin + 15, y, 10, 'F2', colors.brown); y += 21; }
        for (const [index, item] of group.answers.entries()) answersRow(item.question, item.answer, index);
        y += 12;
      }
    }
  } else {
    const blocks = clean(text).trim().split(/\n{2,}/).filter(Boolean);
    heading(blocks.shift() || (es ? 'Tu informe' : 'Your report'), 30, colors.warm); y = Math.max(y, 178);
    for (const block of blocks) {
      const segments = block.split('\n');
      if (segments.length > 1) { ensure(80); paragraph(segments[0], { bold: true, gap: 5 }); paragraph(segments.slice(1).join('\n')); }
      else paragraph(block, { bold: block.length < 65 && !/[.!?]$/.test(block) });
    }
  }

  for (const [index, current] of pages.entries()) {
    page = current; rule(747);
    draw(es ? 'Creado localmente en tu dispositivo' : 'Created locally on your device', margin, 763, 7.5, 'F1', colors.muted);
    draw(`${es ? 'Página' : 'Page'} ${index + 1} / ${pages.length}`, 506, 763, 7.5, 'F1', colors.muted);
  }
  const mappings = [...usedCharacters].map(character => [codeFor(character), supportedCodeFor(character) === undefined ? 63 : character.codePointAt(0)]);
  const uniqueMappings = [...new Map(mappings).entries()].filter(([, unicode]) => unicode <= 65535);
  const cmap = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /LocalReportUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n'
    + uniqueMappings.map(([code, unicode]) => `1 beginbfchar\n<${hex(code, 2)}> <${hex(unicode, 4)}>\nendbfchar\n`).join('')
    + 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n';
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R /Lang (${es ? 'es' : 'en'}) >>`,
    '', '', '',
    `<< /Length ${cmap.length} >>\nstream\n${cmap}endstream`,
    ''
  ];
  const bytesHex = bytes => [...bytes].map(value => hex(value, 2)).join('') + '>\n';
  for (const [key, objectIndex] of [['regular', 3], ['bold', 4], ['serif', 6]]) {
    const font = pdfFonts[key], descriptor = objects.length + 1, file = descriptor + 1;
    const stream = bytesHex(font.bytes);
    objects[objectIndex - 1] = `<< /Type /Font /Subtype /TrueType /BaseFont /${font.name} /Encoding /WinAnsiEncoding /FirstChar 0 /LastChar 255 /Widths [${font.widths.join(' ')}] /FontDescriptor ${descriptor} 0 R /ToUnicode 5 0 R >>`;
    objects.push(`<< /Type /FontDescriptor /FontName /${font.name} /Flags ${font.flags} /FontBBox [${font.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${font.ascent} /Descent ${font.descent} /CapHeight ${font.ascent} /StemV ${font.stemV} /FontFile2 ${file} 0 R >>`, `<< /Length ${stream.length} /Length1 ${font.bytes.length} /Filter /ASCIIHexDecode >>\nstream\n${stream}endstream`);
  }
  let portraitIndex;
  if (hasPortrait) {
    portraitIndex = objects.length + 1; const stream = bytesHex(portrait.bytes);
    objects.push(`<< /Type /XObject /Subtype /Image /Width ${portrait.width} /Height ${portrait.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${stream.length} >>\nstream\n${stream}endstream`);
  }
  const firstPage = objects.length + 1;
  objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, index) => `${firstPage + index * 2} 0 R`).join(' ')}] >>`;
  for (const [index, current] of pages.entries()) {
    const stream = current.commands.join('');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 6 0 R >> ${portraitIndex ? `/XObject << /Portrait ${portraitIndex} 0 R >>` : ''} >> /Contents ${firstPage + 1 + index * 2} 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  }
  let pdf = '%PDF-1.4\n%Local report - no remote resources\n'; const offsets = [0];
  for (const [index, object] of objects.entries()) { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Uint8Array.from(pdf, character => character.charCodeAt(0));
}
