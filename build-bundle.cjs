const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const dir = __dirname;
const configSrc = fs.readFileSync(path.join(dir, 'js', 'config.js'), 'utf8');
const rulesSrc = fs.readFileSync(path.join(dir, 'js', 'rules.js'), 'utf8');
const storeSrc = fs.readFileSync(path.join(dir, 'js', 'store.js'), 'utf8');
const flagsSrcRaw = fs.readFileSync(path.join(dir, 'js', 'flags.js'), 'utf8');
// flags.js khai báo lại fetchWithTimeout y hệt store.js — bỏ bản trùng để khỏi lỗi
// "redeclaration" khi gộp chung một scope (không sửa source flags.js).
const flagsSrc = flagsSrcRaw.replace(
  /async function fetchWithTimeout\(url, options = \{\}, ms = 10000\) \{[\s\S]*?\n\}\n/,
  ''
);
const notificationsSrc = fs.readFileSync(path.join(dir, 'js', 'notifications.js'), 'utf8');
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
  '  // 3b. BẢNG CỜ LUÂN LƯU (FlagStore)',
  '  // ========================================== ',
  stripModules(flagsSrc),
  '',
  '  // ========================================== ',
  '  // 4. WEB PUSH NOTIFICATIONS',
  '  // ========================================== ',
  stripModules(notificationsSrc),
  '',
  '  // ========================================== ',
  '  // 5. BỘ ĐIỀU PHỐI GIAO DIỆN & SỰ KIỆN (APP)',
  '  // ========================================== ',
  stripModules(appSrc),
  '',
  '})();'
].join('\n');

const obfuscated = JavaScriptObfuscator.obfuscate(bundled, {
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

fs.writeFileSync(path.join(dir, 'js', 'app.bundle.js'), obfuscated, 'utf8');
console.log(
  'Obfuscated bundle created successfully! Size:',
  obfuscated.length,
  'bytes'
);
