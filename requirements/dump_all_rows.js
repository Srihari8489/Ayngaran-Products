const fs = require('fs');
const xml = fs.readFileSync('B:/HARI/GIT-PROJECTS/Ayngaran-Products/requirements/document.xml', 'utf8');
const trs = xml.split('</w:tr>');

trs.forEach((tr, idx) => {
  const tcs = tr.split('</w:tc>');
  const rowData = [];
  tcs.forEach((tc, ci) => {
    const m = tc.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g);
    const txt = m ? m.map(x => x.replace(/<w:t\b[^>]*>/, '').replace(/<\/w:t>/, '')).join('').trim() : '';
    if (txt) {
      rowData.push({ cell: ci, text: txt });
    }
  });
  if (rowData.length > 0) {
    console.log(`Row ${idx}: ` + JSON.stringify(rowData));
  }
});
