const fs = require('fs');
const xml = fs.readFileSync('B:/HARI/GIT-PROJECTS/Ayngaran-Products/requirements/document.xml', 'utf8');
const trs = xml.split('</w:tr>');

[18, 19, 20].forEach(idx => {
  console.log('=== ROW ' + idx + ' ===');
  const tr = trs[idx];
  const tcs = tr.split('</w:tc>');
  tcs.forEach((tc, ci) => {
    const m = tc.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g);
    const txt = m ? m.map(x => x.replace(/<w:t\b[^>]*>/, '').replace(/<\/w:t>/, '')).join('') : '';
    const gs = tc.match(/<w:gridSpan\s+w:val="(\d+)"/);
    if (txt || gs) {
      console.log('  Cell ' + ci + ' (gridSpan=' + (gs ? gs[1] : 1) + '): "' + txt + '"');
    }
  });
});
