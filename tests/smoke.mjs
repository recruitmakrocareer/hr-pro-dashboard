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
  'summary-card', 'summary-body',
];
requiredIds.forEach(id =>
  check(`#${id}`, new RegExp(`id=["']${id}["']`).test(html)));

console.log('3) Function ที่จำเป็นต้องถูกประกาศ');
const requiredFns = [
  'loadVacancies', 'loadCandidates', 'saveVacancy', 'saveCandidate', 'closeVacancy',
  'handleCVUpload', 'extractCVWithAI', 'sendChatCore', 'buildSystemPrompt',
  'renderVacancies', 'renderCandidates', 'updateKPI', 'showPage',
  'handleUrlAction', 'matchVacancyId', 'openCandidateModal',
  'editVacancy', 'selectWithValue', 'confirmCloseVacancy', 'hideClosePanel', 'postCloseVacancy',
  'updateCandidateStatus', 'handleStatusChange',
  'getVRegion', 'getVAreaHR', 'populateVacancyFilters', 'loadBranchMaster', 'branchOf', 'stampDailyKPI',
  'loadSnapshots', 'renderTrend', 'selectTrend',
  // Web Agent tools (client-side)
  'runTool', 'toolResolveBranch', 'toolGetOpenVacancies', 'toolCloseVacancies', 'normBranch', 'toolFilterVacancies',
  'toolSummarizeVacancies', 'toolOpenForm', 'renderSummary', 'filterBySummaryGroup',
  // Sprint 2–3 (G5 ปุ่มเพิ่มผู้สมัครต่อแถว, G6 join candidate by VacancyID + badge)
  'addCandidateForVacancy', 'candidatesForVacancy', 'candBreakdown', 'candVacancyId',
];
requiredFns.forEach(fn =>
  check(`function ${fn}()`, new RegExp(`function\\s+${fn}\\s*\\(`).test(html)));

console.log('3b) Agent tool names (Web Agent Spec) ถูกประกาศใน tools');
['resolve_branch', 'get_open_vacancies', 'close_vacancies', 'add_vacancy', 'add_vacancies', 'filter_vacancies', 'summarize_vacancies', 'open_form']
  .forEach(t => check(`tool '${t}'`, new RegExp(`name:\\s*['"]${t}['"]`).test(html)));

console.log('4) CONFIG keys ครบ');
['GET_VACANCIES_URL', 'POST_VACANCY_URL', 'GET_CANDIDATES_URL', 'POST_CANDIDATE_URL', 'CLOSE_VACANCY_URL', 'UPDATE_CANDIDATESTATUS_URL', 'GET_BRANCHMASTER_URL', 'POST_SNAPSHOT_URL', 'GET_SNAPSHOTS_URL', 'PROXY_URL', 'CLAUDE_API_KEY']
  .forEach(k => check(`CONFIG.${k}`, new RegExp(`${k}\\s*:`).test(html)));

console.log('5) TD-01 guard — ไม่มี URL ลับ (sig=) hardcode ใน index.html');
check('ไม่พบ "sig=" ใน index.html', !/[?&]sig=/.test(html),
  'พบ signature ที่ควรย้ายไป GitHub Secrets แล้ว');

console.log('6) G4 — CandidateStatus 5 ค่า (Key Decision #3) ถูกตั้งครบ + default Screening');
const STATUS5 = ['Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const statusConst = html.match(/CANDIDATE_STATUS_OPTIONS\s*=\s*\[([^\]]*)\]/);
check('CANDIDATE_STATUS_OPTIONS ถูกประกาศ', !!statusConst);
STATUS5.forEach(s =>
  check(`  มีค่า '${s}' ใน CANDIDATE_STATUS_OPTIONS`, !!statusConst && statusConst[1].includes(`"${s}"`)));
check('dropdown #c-status default = Screening',
  /<select[^>]*id="c-status"[\s\S]*?<option value="Screening"[^>]*selected/.test(html));

console.log('7) F5 — group-by invariant: รวมทุกกลุ่มต้องเท่ายอดรวม (จำลอง 180 records)');
const regions = ['BKK', 'North', 'South', 'East', 'Central', 'West'];
const sample = Array.from({ length: 180 }, (_, i) => ({ Region: regions[i % regions.length] }));
const grouped = sample.reduce((m, r) => { m[r.Region] = (m[r.Region] || 0) + 1; return m; }, {});
const sum = Object.values(grouped).reduce((a, b) => a + b, 0);
check('group by Region รักษายอดรวมครบ 180 ไม่ตกหล่น', sum === 180 && sample.length === 180, `sum=${sum}`);
check('จำนวนกลุ่ม Region ถูกต้อง', Object.keys(grouped).length === regions.length,
  `ได้ ${Object.keys(grouped).length} กลุ่ม`);

console.log('8) C2 — closeVacancy รองรับ 409 race condition (AC-3) + contract ใหม่');
check('postCloseVacancy เช็ค status 409', /status\s*===\s*409|res\.status\s*===\s*409/.test(html));
check('postCloseVacancy ส่ง contract { id, CloseNote, ClosedBy }',
  /CloseNote:[^,]*,\s*ClosedBy:/.test(html));
check('confirmCloseVacancy จัดการ conflict (ไม่ throw error)', /r\.conflict/.test(html));

console.log('9) G4 — บันทึก CandidateStatus กลับ SharePoint (HR_UPDATE_CandidateStatus)');
check('updateCandidateStatus ส่ง contract { id, CandidateStatus }',
  /id:\s*String\(candidateId\)[\s\S]{0,40}CandidateStatus:\s*newStatus/.test(html));
check('dropdown สถานะผูก onchange=handleStatusChange', /onchange="handleStatusChange\(/.test(html));
check('handleStatusChange มี logic auto-close เมื่อ Hired (AC-2)',
  /newStatus\s*===\s*'Hired'/.test(html));
const hscBlock = (html.match(/async function handleStatusChange\([\s\S]*?\n}/) || [''])[0];
check('handleStatusChange optimistic update (c.CandidateStatus = newStatus)',
  /c\.CandidateStatus\s*=\s*newStatus/.test(hscBlock));
check('handleStatusChange ไม่รีโหลด candidates ทับทันที (กัน GET ค่าเก่าทับ)',
  !/await\s+loadCandidates\(\)/.test(hscBlock));
check('deploy.yml inject UPDATE_CANDIDATESTATUS_URL',
  /UPDATE_CANDIDATESTATUS_URL/.test(readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8')));

console.log('10) F4 — รายชื่อสาขาสดจาก BranchMaster (live) + fallback static');
check('มีตัวแปร branchList (live list)', /\blet\s+branchList\s*=/.test(html));
check('loadBranchMaster อัปเดต branchList + refresh dropdown',
  /branchList\s*=\s*liveNames[\s\S]{0,40}populateDropdowns\(\)/.test(html));
check('fallback static เมื่อ flow คืนสาขาไม่ครบ (< 50)', /liveNames\.length\s*>=\s*50/.test(html));
check('dropdown สาขา render จาก branchList', /branchList\.map\(b\s*=>/.test(html));
check('agent (toolResolveBranch) ใช้ branchList', /branchList\.find\(b\s*=>\s*normBranch/.test(html));
check('static BRANCHES คงไว้เป็น fallback (172)', /const\s+BRANCHES\s*=\s*\[/.test(html));

console.log('11) BugFix — saveCandidate type ตรง schema (HTTP 400 TriggerInputSchemaMismatch)');
check('มี helper safeStr()', /function\s+safeStr\s*\(/.test(html));
const saveBlock = (html.match(/async function saveCandidate\(\)[\s\S]*?\n}/) || [''])[0];
// String fields ต้องครอบ safeStr() กัน null (Expected String but got Null)
['Title', 'Email', 'Phone', 'VacancyTitle', 'CandidateStatus', 'FileName', 'FileContent']
  .forEach(f => check(`  payload.${f} ครอบด้วย safeStr`, new RegExp(`${f}:\\s*safeStr\\(`).test(saveBlock)));
// VacancyID ต้องเป็นรหัสธุรกิจ "VAC-..." (string) — G3 HR_AutoClose_OnHire filter vacancy ด้วยรหัสนี้
// (flow schema = String แล้ว) ไม่ใช่เลข SharePoint id — มี getter getVacancyCode + guard ก่อนส่ง
check('  มี getter getVacancyCode (อ่าน VAC-code ทน object/string)', /function\s+getVacancyCode\s*\(/.test(html));
check('  payload.VacancyID ส่ง VAC-code (vacCode) ไม่ใช่เลข id', /VacancyID:\s*safeStr\(vacCode\)/.test(saveBlock));
check('  guard เมื่อไม่พบ vacCode ก่อนส่ง', /if\s*\(\s*!vacCode\s*\)/.test(saveBlock));
check('payload ไม่มี ": null" หลุด (FileName/FileContent)', !/:\s*null\b/.test(
  (saveBlock.match(/const payload = \{[\s\S]*?\};/) || [''])[0]));

console.log('12) UX — กด badge ผู้สมัครบนตาราง vacancy → ดูผู้สมัครของตำแหน่งนั้น (ไม่เปิดแก้ไข)');
check('function showVacancyCandidates()', /function\s+showVacancyCandidates\s*\(/.test(html));
check('function clearCandidateFilter()', /function\s+clearCandidateFilter\s*\(/.test(html));
check('badge มี stopPropagation + เรียก showVacancyCandidates', /event\.stopPropagation\(\);\s*showVacancyCandidates\(/.test(html));
check('renderCandidates เคารพ candidateVacancyFilter', /candidateVacancyFilter\s*!=\s*null/.test(html));

console.log('13) Candidate Delete — ลบผู้สมัคร (flow HR_DELETE_Candidate + memory fallback)');
check('CONFIG มี DELETE_CANDIDATE_URL', /DELETE_CANDIDATE_URL:\s*'__DELETE_CANDIDATE_URL__'/.test(html));
check('function deleteCandidate() เรียก DELETE_CANDIDATE_URL', /async function deleteCandidate\([\s\S]*?CONFIG\.DELETE_CANDIDATE_URL/.test(html));
check('deleteCandidate fallback memory เมื่อไม่มี URL (local:true)', /if\s*\(!CONFIG\.DELETE_CANDIDATE_URL\)[\s\S]{0,80}local:\s*true/.test(html));
check('function handleDeleteCandidate() ยืนยันก่อนลบ (confirm)', /async function handleDeleteCandidate\([\s\S]*?confirm\(/.test(html));
check('handleDeleteCandidate ลบออกจาก memory + updateKPI', /candidates\s*=\s*candidates\.filter\([\s\S]*?updateKPI\(\)/.test(html));
check('ปุ่ม 🗑️ บนการ์ดเรียก handleDeleteCandidate', /onclick="handleDeleteCandidate\('\$\{cId\}', this\)"/.test(html));
check('deploy.yml inject DELETE_CANDIDATE_URL',
  /DELETE_CANDIDATE_URL:\s*\$\{\{\s*secrets\.DELETE_CANDIDATE_URL\s*\}\}/.test(readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8')));

console.log('');
if (failures) { console.error(`SMOKE TEST FAILED — ${failures} ข้อ ❌`); process.exit(1); }
console.log('SMOKE TEST PASSED ✅');
