const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const data = [
  { 
    Name: "John Doe", 
    VoterID: "VOTER-1001", 
    Email: "john@example.com", 
    Phone: "+91 9876543210", 
    Address: "123 Main St, New Delhi", 
    verificationCode: "112233" 
  },
  { 
    Name: "Jane Smith", 
    VoterID: "VOTER-1002", 
    Email: "jane@example.com", 
    Phone: "+91 9123456789", 
    Address: "456 Park Ave, Mumbai", 
    verificationCode: "445566" 
  }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Voters Full Template");

const filePath = path.join(publicDir, 'voters_template.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`✅ Complete Template created at: ${filePath}`);
