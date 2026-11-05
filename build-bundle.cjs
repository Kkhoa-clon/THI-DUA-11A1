const fs = require('fs');
const path = require('path');

const dir = __dirname;
const configSrc = fs.readFileSync(path.join(dir, 'js', 'config.js'), 'utf8');
const rulesSrc = fs.readFileSync(path.join(dir, 'js', 'rules.js'), 'utf8');
const storeSrc = fs.readFileSync(path.join(dir, 'js', 'store.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(dir, 'js', 'app.js'), 'utf8');

function stripModules(code) {
  return code
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+(async\s+)?(const|let|var|function|class)\s+/gm, (_, asyncPrefix = '', declaration) => `${asyncPrefix}${declaration} `)
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s*\{[\s\S]*?\};?\s*$/gm, '');
}

const bundled = [
  '/**',
  ' * 11A1 Thi Đua Web App — Standalone Bundle (Zero-CORS)',
  ' * Tự động chạy mượt mà trên cả file:/// (Double-click từ Desktop) lẫn http(s):// (GitHub Pages)',
  ' */',
  '(function () {',
  '  "use strict";',
  '',
  '  // ========================================== ',
  '  // 1. CẤU HÌNH HỆ THỐNG & ROSTER LỚP 11A1',
  '  // ========================================== ',
  stripModules(configSrc),
  '',
  '  // ========================================== ',
  '  // 2. DANH MỤC NỘI QUY & QUY CHẾ 11A1',
  '  // ========================================== ',
  stripModules(rulesSrc),
  '',
  '  // ========================================== ',
  '  // 3. STORE DỮ LIỆU & SUPABASE REALTIME',
  '  // ========================================== ',
  stripModules(storeSrc),
  '',
  '  // ========================================== ',
  '  // 4. BỘ ĐIỀU PHỐI GIAO DIỆN & SỰ KIỆN (APP)',
  '  // ========================================== ',
  stripModules(appSrc),
  '',
  '})();'
].join('\n');

let finalCode = bundled;
try {
  const JavaScriptObfuscator = require('javascript-obfuscator');
  finalCode = JavaScriptObfuscator.obfuscate(bundled, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    identifierNamesGenerator: 'hexadecimal',
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 1,
    target: 'browser',
    unicodeEscapeSequence: false,
  }).getObfuscatedCode();
  console.log('Obfuscated bundle created successfully! Size:', finalCode.length, 'bytes');
} catch (e) {
  console.log('Created bundle (without obfuscator):', finalCode.length, 'bytes');
}

fs.writeFileSync(path.join(dir, 'js', 'app.bundle.js'), finalCode, 'utf8');
