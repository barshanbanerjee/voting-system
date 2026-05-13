const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const data = [
  { voterId: 'STU101', name: 'John Doe', verificationCode: '123456', email: 'john@example.com' },
  { voterId: 'STU102', name: 'Jane Smith', verificationCode: '654321', email: 'jane@example.com' }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);

XLSX.utils.book_append_sheet(wb, ws, "Voters");

const filePath = path.join(process.cwd(), 'public', 'voters_template.xlsx');

// Ensure public dir exists
if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
  fs.mkdirSync(path.join(process.cwd(), 'public'));
}

XLSX.writeFile(wb, filePath);
console.log('Template generated at:', filePath);
