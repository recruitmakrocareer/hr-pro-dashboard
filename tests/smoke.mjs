// TD-03 — Basic Smoke Test (ไม่มี dependency, รันด้วย `node tests/smoke.mjs`)
// เป้าหมาย: จับ build พังก่อน push — syntax ของ inline <script>, element/function/CONFIG ที่จำเป็นต้องมี,
// และกันไม่ให้ URL ลับ (sig=) หลุดกลับเข้า index.html (TD-01 guard)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

let failures = 0;
const check = (name, ok, detail = '') => {
  if (ok) { console.log(`  ✅ ${name}`); }
  else { console.error(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); failures++; }
};

console.log('1) Syntax check ของ inline <script> ทุก block');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1]).filter(s => s.trim());
check('พบ inline script', scripts.length > 0, `เจอ ${scripts.length} block`);
const dir = mkdtempSync(join(tmpdir(), 'smoke-'));
scripts.forEach((code, i) => {
  const f = join(dir, `block${i}.js`);
  writeFileSync(f, code);
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
    check(`script block #${i + 1} syntax OK`, true);
  } catch (e) {
    check(`script block #${i + 1} syntax OK`, false, String(e.stderr || e.message).split('\n').slice(0, 3).join(' '));
  }
});

console.log('2) Element IDs ที่จำเป็นต้องมีใน DOM');
const requiredIds = [
  'page-dashboard', 'page-candidate', 'page-chat',
  'vacancy-tbody', 'candidate-grid', 'candidate-modal', 'vacancy-modal',
  'cv-file', 'upload-zone', 'chat-input', 'chat-input-mobile',
  'c-first', 'c-last', 'c-vacancy', 'c-status', 'kpi-total',
  'v-branch', 'v-title', 'v-opendate', 'v-close-panel', 'v-close-note',
  'filter-region', 'filter-area', 'filter-position', 'trend-card', 'trend-body',
];
requiredIds.forEach(id =>
  check(`#${id}`, new RegExp(`id=["']${id}["']`).test(html)));

console.log('3) Function ที่จำเป็นต้องถูกประกาศ');
const requiredFns = [
  'loadVacancies', 'loadCandidates', 'saveVacancy', 'saveCandidate', 'closeVacancy',
  'handleCVUpload', 'extractCVWithAI', 'sendChatCore', 'buildSystemPrompt',
  'renderVacancies', 'renderCandidates', 'updateKPI', 'showPage',
  'handleUrlAction', 'matchVacancyId', 'openCandidateModal',
  'editVacancy', 'selectWithValue', 'confirmCloseVacancy', 'hideClosePanel',
  'getVRegion', 'getVAreaHR', 'populateVacancyFilters', 'loadBranchMaster', 'branchOf', 'stampDailyKPI',
  'loadSnapshots', 'renderTrend', 'selectTrend',
  // Web Agent tools (client-side)
  'runTool', 'toolResolveBranch', 'toolGetOpenVacancies', 'toolCloseVacancies', 'normBranch', 'toolFilterVacancies',
  'toolSummarizeVacancies', 'toolOpenForm',
];
requiredFns.forEach(fn =>
  check(`function ${fn}()`, new RegExp(`function\\s+${fn}\\s*\\(`).test(html)));

console.log('3b) Agent tool names (Web Agent Spec) ถูกประกาศใน tools');
['resolve_branch', 'get_open_vacancies', 'close_vacancies', 'add_vacancy', 'add_vacancies', 'filter_vacancies', 'summarize_vacancies', 'open_form']
  .forEach(t => check(`tool '${t}'`, new RegExp(`name:\\s*['"]${t}['"]`).test(html)));

console.log('4) CONFIG keys ครบ');
['GET_VACANCIES_URL', 'POST_VACANCY_URL', 'GET_CANDIDATES_URL', 'POST_CANDIDATE_URL', 'CLOSE_VACANCY_URL', 'GET_BRANCHMASTER_URL', 'POST_SNAPSHOT_URL', 'GET_SNAPSHOTS_URL', 'PROXY_URL', 'CLAUDE_API_KEY']
  .forEach(k => check(`CONFIG.${k}`, new RegExp(`${k}\\s*:`).test(html)));

console.log('5) TD-01 guard — ไม่มี URL ลับ (sig=) hardcode ใน index.html');
check('ไม่พบ "sig=" ใน index.html', !/[?&]sig=/.test(html),
  'พบ signature ที่ควรย้ายไป GitHub Secrets แล้ว');

console.log('');
if (failures) { console.error(`SMOKE TEST FAILED — ${failures} ข้อ ❌`); process.exit(1); }
console.log('SMOKE TEST PASSED ✅');
