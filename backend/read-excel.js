const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '12월-kc빌당.xlsx');
const workbook = XLSX.readFile(filePath);

// 모든 시트 이름 출력
console.log('=== 시트 목록 ===');
console.log(workbook.SheetNames);

// 각 시트의 내용 출력
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  data.forEach((row, index) => {
    console.log(`Row ${index}: ${JSON.stringify(row)}`);
  });
});
