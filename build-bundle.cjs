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
    .replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ')
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

fs.writeFileSync(path.join(dir, 'js', 'app.bundle.js'), bundled, 'utf8');
console.log('Bundle created successfully! Size:', bundled.length, 'bytes');
