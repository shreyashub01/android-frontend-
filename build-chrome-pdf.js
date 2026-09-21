import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve('report.html');
const tempPdf = path.resolve('temp_report.pdf');

const desktopPath1 = 'C:/Users/TUF GAMING/OneDrive/Desktop/CYBER_SHIELD_PROJECT_REPORT_FINAL.pdf';
const desktopPath2 = 'C:/Users/TUF GAMING/OneDrive/Desktop/CYBER_SHIELD_TECHNICAL_REPORT.pdf';
const desktopPathOriginal = 'C:/Users/TUF GAMING/OneDrive/Desktop/CYBER_SHIELD_PROJECT_REPORT.pdf';
const localPath = path.resolve('CYBER_SHIELD_PROJECT_REPORT.pdf');

console.log('[1/4] Starting Headless Chrome PDF Rendering Engine...');
console.log('Source HTML:', htmlPath);

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--run-all-compositor-stages-before-draw',
  '--virtual-time-budget=5000',
  '--print-to-pdf=' + tempPdf,
  'file:///' + htmlPath.replace(/\\/g, '/')
];

try {
  execFileSync(chromePath, args, { encoding: 'utf8', timeout: 30000 });
  console.log('[2/4] Headless Chrome rendered PDF successfully!');
} catch (err) {
  console.error('Error executing Chrome:', err.message);
  process.exit(1);
}

if (!fs.existsSync(tempPdf)) {
  console.error('ERROR: tempPdf was not created!');
  process.exit(1);
}

const pdfBuffer = fs.readFileSync(tempPdf);
console.log(`[3/4] High-fidelity PDF generated. Size: ${pdfBuffer.length} bytes (~${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

// 1. Write to Desktop Final
try {
  fs.writeFileSync(desktopPath1, pdfBuffer);
  console.log('[SUCCESS] Saved to Desktop:', desktopPath1);
} catch (e) {
  console.error('Failed to write to', desktopPath1, e.message);
}

// 2. Write to Desktop Technical
try {
  fs.writeFileSync(desktopPath2, pdfBuffer);
  console.log('[SUCCESS] Saved to Desktop:', desktopPath2);
} catch (e) {
  console.error('Failed to write to', desktopPath2, e.message);
}

// 3. Try to update original if not locked
try {
  fs.writeFileSync(desktopPathOriginal, pdfBuffer);
  console.log('[SUCCESS] Updated Desktop Original:', desktopPathOriginal);
} catch (e) {
  console.log('[INFO] Original file is currently open in viewer, alternative final file is ready on Desktop.');
}

// 4. Save local copy
try {
  fs.writeFileSync(localPath, pdfBuffer);
  console.log('[SUCCESS] Saved local copy:', localPath);
} catch (e) {
  console.error('Failed to write local copy:', e.message);
}

// Clean up temp
try {
  fs.unlinkSync(tempPdf);
} catch (e) {}

console.log('[4/4] COMPLETE! High-resolution Skia/PDF report is on your Desktop.');
