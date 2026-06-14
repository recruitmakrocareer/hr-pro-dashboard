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

## 🆕 ทำเพิ่มใน session นี้ (Close Vacancy — client + plumbing)
- เพิ่มปุ่ม **🔒 ปิดตำแหน่งงาน** ในโมดัลแก้ไขตำแหน่ง (โชว์เฉพาะตำแหน่งเดิมที่ยัง "ไม่ปิด" เท่านั้น)
- ฟังก์ชัน `closeVacancy()` — ยืนยันก่อนปิด → POST `{ id, Status:'Close', ClosedDate }` แล้ว reload
  - ใช้ flow `CLOSE_VACANCY_URL` (ใหม่) ถ้ามี; **ถ้ายังไม่ตั้ง secret → fallback ไป `POST_VACANCY_URL`** (set Status ได้อยู่แล้ว) → ใช้งานได้ทันทีแบบ degrade
  - ไม่มี secret/flow เลย → mock update (set Status=Close ในหน่วยความจำ)
  - `ClosedBy` ตั้งใจไม่ส่งจาก client (เว็บไม่มี login) → ให้ flow ประทับจากผู้ใช้ของ SharePoint connection
- เพิ่ม `CONFIG.CLOSE_VACANCY_URL` + log สถานะ + inject ใน `deploy.yml` (เป็น **optional** ไม่อยู่ใน required → ไม่ทำ deploy fail ถ้ายังไม่ตั้ง)
- `renderVacancies()` อ่านวันที่ปิดทน `ClosedDate || CloseDate`
- Smoke test ครอบ `closeVacancy` + `CONFIG.CLOSE_VACANCY_URL` แล้ว (ผ่าน)

### ▶️ สิ่งที่ผู้ใช้ต้องทำต่อ เพื่อให้ Close Vacancy บันทึก ClosedDate/ClosedBy ลง SharePoint
1. **SP-01–03:** เพิ่ม column ใน List `JobVacancy`: `Status` (มีแล้ว?), `ClosedDate` (Date), `ClosedBy` (Person หรือ Text)
2. **FL-01:** สร้าง flow `HR_CLOSE_Vacancy` (HTTP request trigger) — รับ `{ id, Status, ClosedDate }` → Update item ตาม `id` → ตั้ง `ClosedDate` และประทับ `ClosedBy` จากผู้ใช้ → คืน 200
3. เอา HTTP POST URL จาก trigger ของ flow มาตั้ง **Repository secret** `CLOSE_VACANCY_URL` แล้ว merge เข้า `main` (re-deploy)
   - ก่อนตั้ง secret: ปิดตำแหน่งยัง work ผ่าน `POST_VACANCY_URL` (แต่จะไม่ได้ ClosedDate/ClosedBy เว้นแต่ flow POST เดิม map ให้)

## 🆕 ทำเพิ่ม (Copilot Agent → Dashboard deep-link, จาก Developer Task List)
- **Task 1 (HIGH):** `?action=add-applicant` → เปิด modal "เพิ่มผู้สมัครใหม่" อัตโนมัติตอนโหลด (`handleUrlAction()` เรียกหลัง `loadVacancies()` เสร็จ)
- **Task 2-4:** pre-select ตำแหน่งใน dropdown "ตำแหน่งที่สมัคร" (ไม่เพิ่ม UI ตามที่ตกลง) ผ่าน `matchVacancyId()`:
  - `vacancy=<id>` → เลือก vacancy นั้นตรง ๆ (precedence สูงสุด)
  - `position=<ชื่อตำแหน่ง>` + `branch=<ชื่อสาขาไทย>` → หา open vacancy ที่ตรงทั้งคู่
  - `position` เดี่ยว → ตัวแรกที่ตรง; ไม่ตรง/ไม่ส่ง → ปล่อยว่าง
  - **branch param เป็นชื่อสาขาภาษาไทย** (ไม่ใช่ location_code "001") — ตกลงกับผู้ใช้แล้ว
  - พิจารณาเฉพาะ vacancy ที่ Open (dropdown แสดงเฉพาะที่เปิด)
- URLSearchParams decode `%26`→`&`, `+`→space, Thai % ให้อัตโนมัติ → match ตรง POSITIONS/Branch
- Adaptive Card JSON (ฝั่ง Copilot Studio) ใช้ `Action.OpenUrl` ไป `.../?action=add-applicant[&branch=&position=]` — เป็นงานฝั่ง Agent (ไม่ใช่ code repo นี้)
- Smoke test ครอบ `handleUrlAction` / `matchVacancyId` / `openCandidateModal` แล้ว

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
