const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==> [1/3] Validating JavaScript syntax...');
const jsFiles = [
  'js/app.js',
  'js/audioEngine.js',
  'js/auth.js',
  'js/data.js',
  'js/recommendationEngine.js'
];
for (const file of jsFiles) {
  execSync(`node -c "${path.join(__dirname, file)}"`, { stdio: 'inherit' });
}
console.log('    ✓ All JavaScript files validated successfully.');

console.log('==> [2/3] Preparing production dist/ directory...');
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('==> [3/3] Copying production static assets into dist/...');
const itemsToCopy = [
  'index.html',
  'login.html',
  'signup.html',
  'css',
  'js',
  'public',
  '1000374910.mp4',
  'cafe vibe video.mp4'
];

for (const item of itemsToCopy) {
  const src = path.join(__dirname, item);
  const dest = path.join(distDir, item);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`    ✓ Copied ${item} -> dist/${item}`);
  }
}

// Generate route directory index fallbacks for /login and /signup
const loginDirDist = path.join(distDir, 'login');
const signupDirDist = path.join(distDir, 'signup');
fs.mkdirSync(loginDirDist, { recursive: true });
fs.mkdirSync(signupDirDist, { recursive: true });
fs.copyFileSync(path.join(distDir, 'login.html'), path.join(loginDirDist, 'index.html'));
fs.copyFileSync(path.join(distDir, 'signup.html'), path.join(signupDirDist, 'index.html'));

// Also ensure root workspace has login/index.html and signup/index.html for static folder servers
const loginDirRoot = path.join(__dirname, 'login');
const signupDirRoot = path.join(__dirname, 'signup');
fs.mkdirSync(loginDirRoot, { recursive: true });
fs.mkdirSync(signupDirRoot, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'login.html'), path.join(loginDirRoot, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'signup.html'), path.join(signupDirRoot, 'index.html'));
console.log('    ✓ Generated route directory indices for /login and /signup');

// Verify index.html exists at the root of dist
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('ERROR: dist/index.html is missing!');
  process.exit(1);
}

console.log('==> Production build completed successfully! Output directory: dist/');
