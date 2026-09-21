import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve('cpanel_compatibility_matrix.html');
const tempPdf = path.resolve('temp_cpanel_matrix.pdf');

const desktopPath = 'C:/Users/TUF GAMING/OneDrive/Desktop/CPANEL_COMPATIBILITY_REPORT.pdf';
const localPath = path.resolve('CPANEL_COMPATIBILITY_REPORT.pdf');

console.log('[1/3] Rendering single-page cPanel Compatibility PDF via Headless Chrome...');

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--run-all-compositor-stages-before-draw',
  '--virtual-time-budget=4000',
  '--print-to-pdf=' + tempPdf,
  'file:///' + htmlPath.replace(/\\/g, '/')
];

try {
  execFileSync(chromePath, args, { encoding: 'utf8', timeout: 30000 });
  console.log('[2/3] Chrome render completed!');
} catch (err) {
  console.error('Error executing Chrome:', err.message);
  process.exit(1);
}

if (!fs.existsSync(tempPdf)) {
  console.error('ERROR: tempPdf was not created!');
  process.exit(1);
}

const pdfBuffer = fs.readFileSync(tempPdf);
console.log(`[3/3] High-fidelity PDF generated. Size: ${pdfBuffer.length} bytes (~${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

const desktopPaths = [
  'C:/Users/TUF GAMING/OneDrive/Desktop/CPANEL_ARCHITECTURE_MARATHI.pdf',
  'C:/Users/TUF GAMING/OneDrive/Desktop/CPANEL_COMPATIBILITY_REPORT_FINAL.pdf',
  'C:/Users/TUF GAMING/OneDrive/Desktop/CPANEL_COMPATIBILITY_REPORT.pdf'
];

for (const p of desktopPaths) {
  try {
    fs.writeFileSync(p, pdfBuffer);
    console.log('[SUCCESS] Saved to Desktop:', p);
  } catch (e) {
    console.log('[INFO] File locked or busy:', p, e.message);
  }
}

// Save local copy
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

console.log('COMPLETE! Single-page PDF is ready on Desktop.');
