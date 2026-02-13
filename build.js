#!/usr/bin/env node

/**
 * Build script for Schema Viewer
 * Combines all modular files into a single HTML file for static distribution
 */

const fs = require('fs');
const path = require('path');

const JS_FILES = [
  'js/config.js',
  'js/state.js',
  'js/parser.js',
  'js/layout.js',
  'js/renderer.js',
  'js/camera.js',
  'js/search.js',
  'js/ui.js',
  'js/savedUrls.js',
  'js/sample.js',
  'js/main.js'
];

const CSS_FILE = 'style.css';
const HTML_TEMPLATE = 'index.html';
const OUTPUT_FILE = 'schemaviewer-compiled.html';

console.log('📐 Schema Viewer - Build Script');
console.log('================================\n');

try {
  console.log('📄 Reading HTML template...');
  let html = fs.readFileSync(HTML_TEMPLATE, 'utf8');

  console.log('🎨 Inlining CSS...');
  const css = fs.readFileSync(CSS_FILE, 'utf8');
  html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    () => '<style>\n' + css + '\n  </style>'
  );

  console.log('📦 Combining JavaScript modules...');
  let combinedJS = '';

  for (const file of JS_FILES) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.error('❌ Error: File not found: ' + file);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    combinedJS += '\n// ===== ' + file + ' =====\n';
    combinedJS += content;
    combinedJS += '\n';
    console.log('   ✓ ' + file);
  }

  // Remove individual script tags
  html = html.replace(/<script src="js\/.*?"><\/script>\s*/g, '');

  // Escape closing tags in JS
  let escapedJS = combinedJS;
  escapedJS = escapedJS.replace(/<\/script>/gi, '<\\/script>');
  escapedJS = escapedJS.replace(/<\/html>/gi, '<\\/html>');
  escapedJS = escapedJS.replace(/<\/body>/gi, '<\\/body>');

  // Insert combined script before closing body tag
  html = html.replace(
    '</body>',
    () => '  <script>\n' + escapedJS + '\n  </script>\n</body>'
  );

  // Add build timestamp
  const timestamp = new Date().toISOString();
  html = html.replace(
    '<head>',
    () => '<head>\n  <!-- Built: ' + timestamp + ' -->'
  );

  console.log('\n💾 Writing output to ' + OUTPUT_FILE + '...');
  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

  const originalSize = fs.statSync(HTML_TEMPLATE).size +
    fs.statSync(CSS_FILE).size +
    JS_FILES.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  const compiledSize = fs.statSync(OUTPUT_FILE).size;

  console.log('\n✅ Build complete!');
  console.log('================================');
  console.log('📊 Original: ' + (originalSize / 1024).toFixed(2) + ' KB (' + (JS_FILES.length + 2) + ' files)');
  console.log('📊 Compiled: ' + (compiledSize / 1024).toFixed(2) + ' KB (1 file)');
  console.log('\n🔍 Open ' + OUTPUT_FILE + ' in your browser!');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
