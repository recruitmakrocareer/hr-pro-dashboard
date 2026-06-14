# HR Pro Dashboard — Handoff

เอกสารส่งต่องาน (สำหรับเปิดในแชท/เซสชันใหม่) — อัปเดต: 2026-06-14

## โปรเจกต์
- **Repo:** `recruitmakrocareer/hr-pro-dashboard`
- **Branch dev:** `claude/focused-pasteur-0h4bfm` (พัฒนาบนนี้ แล้ว merge เข้า `main`)
- **Stack:** SPA ไฟล์เดียว `index.html` → โฮสต์ GitHub Pages (`https://recruitmakrocareer.github.io/hr-pro-dashboard/`)
- **Data:** SharePoint ผ่าน Power Automate flows
- **AI:** Claude ผ่าน Cloudflare Worker proxy (`hr-pro-claude-proxy`, ดู `worker.js`)
- **Deploy:** push เข้า `main` → workflow `.github/workflows/deploy.yml` inject secrets ลง `index.html` → publish branch `gh-pages`

## สถาปัตยกรรมสำคัญ (อ่านก่อนแก้)
- Flow URLs (ความลับ มี `sig=`) **ไม่ hardcode** — เก็บใน **GitHub Repository Secrets** 4 ตัว:
  `GET_VACANCIES_URL`, `POST_VACANCY_URL`, `GET_CANDIDATES_URL`, `POST_CANDIDATE_URL`
  → inject ตอน deploy ด้วย node script ใน `deploy.yml` (แทนที่ placeholder `__NAME__`)
- ถ้า secret ว่าง → `CONFIG.*` กลายเป็น `''` → เว็บตกไปใช้ **MOCK data** (ตรวจง่ายจาก console)
- **Smoke Test:** `tests/smoke.mjs` + workflow `.github/workflows/test.yml` รันทุก push/PR (เช็ก syntax, element/function/CONFIG, กัน `sig=` หลุดเข้า HTML)
- **deploy.yml มี `workflow_dispatch`** แต่ token ของ Claude **dispatch/re-run Actions ไม่ได้ (403)**
  → วิธี trigger deploy เดียวที่ใช้ได้: **merge PR เข้า `main`** (push เข้า main = deploy)
- **Diagnostic logs ใน console:** `[CONFIG] URLs present?` (ตอนโหลด) และ `[loadCandidates] ...`

## ⚠️ กับดัก Power Automate (สำคัญมาก)
ถ้า flow ถูกลบ/สร้างใหม่ → **URL เปลี่ยน (sig ใหม่) และ URL เก่าตายถาวร** → คืน
`400 { "code": "WorkflowTriggerIsNotEnabled", ... state 'Deleted' }`
**วิธีแก้:** เอา HTTP POST URL ปัจจุบันจาก trigger ของ flow มาอัปเดต secret ที่เกี่ยวข้อง แล้ว re-deploy
(Claude ตั้ง/แก้ secret เองไม่ได้ — ต้องให้ผู้ใช้ทำใน Settings > Secrets and variables > Actions แบบ **Repository secret** เท่านั้น ไม่ใช่ Environment secret)

## ✅ ทำเสร็จแล้ว (session ก่อน)
- ตั้ง Repository secrets ครบ 4 ตัว → ตำแหน่งงาน + ผู้สมัคร โหลดข้อมูลจริงได้แล้ว
- สร้าง flow **`HR_GET_Candidates`** ใหม่ (workflow id `3e550fb4...`) แทนตัวเก่าที่ถูกลบ (`6d922add...`) + อัปเดต `GET_CANDIDATES_URL`
- โค้ด (อยู่บน `main` แล้ว):
  - ย้าย Flow URLs → GitHub Secrets (inject ตอน deploy)
  - `saveCandidate()` กัน payload `{}` / 400, `fieldVal()` อ่าน input ปลอดภัย, timing guard ระหว่าง CV extraction
  - `loadCandidates()` เช็ก `res.ok` + log error จริง (ไม่ swallow), error → แสดง list ว่าง (ไม่ใช่ mock)
  - `cvLinkOf()` อ่าน CV link ทนทาน (รองรับชื่อ field สำรอง + SharePoint Hyperlink object `{Url}`)
  - `deploy.yml` fail-loud ถ้า secret หาย + พิมพ์สถานะ OK/MISSING + `workflow_dispatch`
  - Smoke Test + CI

## 🔧 งานที่เหลือ / ต้องเช็กต่อ
1. **CV ของผู้สมัครจริง** — ถ้ามี CV แต่ขึ้น "ยังไม่มี CV" → ดู console `[loadCandidates] first item keys: [...]` หาชื่อคอลัมน์ CV จริง แล้วเพิ่มชื่อนั้นใน `cvLinkOf()` (`index.html`)
2. **บันทึกผู้สมัคร (POST New Candidate)** — ยังไม่ได้ทดสอบว่า save เข้า SharePoint จริง; อาจติด stale URL เหมือน GET → ถ้า save 400 ให้เอา URL ปัจจุบันมาอัปเดต `POST_CANDIDATE_URL`
3. **Security** — `sig=` เก่าเคยอยู่บน gh-pages public → ควร regenerate URL ของ flows ที่เหลือ แล้วอัปเดต secret

## 📝 งานใหญ่ที่ยังไม่เริ่ม (จาก Master Task List)
- **Close Vacancy:** SP-01–03 (เพิ่ม column Status/ClosedDate/ClosedBy), FL-01 (`HR_CLOSE_Vacancy` flow ใหม่ แยกจาก POST), FL-02 (duplicate check), CL-01–05 (client tools close + duplicate)
- **TD-02:** ออกแบบ Candidate Stage Model (pipeline) ก่อนเพิ่ม feature ผู้สมัคร
- **OQ-01 / OQ-02:** เป็น Open Questions ต้องให้ Design/Business ตอบก่อน implement FL-02/CL-05 (อย่าเดาเอง)
- **Backlog:** Thai Greeting (Claude ทักทายไทยตอนเริ่ม session), Admin Approve via Microsoft Teams

## ไฟล์สำคัญ
- `index.html` — ทั้งแอป (UI + JS) ~1,500 บรรทัด; CONFIG block อยู่ต้น `<script>` แรก
- `.github/workflows/deploy.yml` — inject secrets + deploy
- `.github/workflows/test.yml` — smoke test
- `tests/smoke.mjs` — smoke test (รัน `node tests/smoke.mjs`)
- `worker.js` / `wrangler.toml` — Cloudflare Worker proxy ไป Claude API
