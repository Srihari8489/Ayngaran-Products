const fs = require('fs');

const xml = fs.readFileSync('B:/HARI/GIT-PROJECTS/Ayngaran-Products/requirements/document.xml', 'utf8');

function extractText(str) {
  const matches = str.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
  if (!matches) return '';
  return matches
    .map(m => m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
    .join('');
}

// Split into tables
const tableBlocks = xml.split('</w:tbl>');
console.log(`Total table blocks: ${tableBlocks.length - 1}`);

const allData = [];

tableBlocks.slice(0, -1).forEach((tblBlock, tblIdx) => {
  const trBlocks = tblBlock.split('</w:tr>');
  const rows = [];
  trBlocks.slice(0, -1).forEach((trBlock) => {
    const tcBlocks = trBlock.split('</w:tc>');
    const cells = [];
    tcBlocks.slice(0, -1).forEach((tcBlock) => {
      const text = extractText(tcBlock).trim();
      cells.push(text);
    });
    if (cells.some(c => c.length > 0)) {
      rows.push(cells);
    }
  });
  allData.push(rows);
});

fs.writeFileSync('B:/HARI/GIT-PROJECTS/Ayngaran-Products/requirements/extracted_tables.json', JSON.stringify(allData, null, 2));
console.log('Saved extracted_tables.json');
