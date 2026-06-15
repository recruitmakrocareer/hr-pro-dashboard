# 📋 HR Pro Dashboard — Task Backlog (วางแผนต่อ)

อัปเดต: 2026-06-15 · สถานะปัจจุบัน: ฟีเจอร์หลักขึ้น production แล้ว
**🔄 Sync update (2026-06-15):** ครอสเช็คกับ Agent HR Pro session — มี 4 item เปลี่ยนสถานะ + เพิ่ม EPIC F (Dev tasks ใหม่) — ดูตารางสรุปท้ายไฟล์

> **🟢 Dev sync (2026-06-15, web session):** ทำ **F1, F2, F3, E3** + ส่วนข้อมูลของ **D3** เสร็จและขึ้น main แล้ว — ดู "Dev update ล่าสุด" ท้ายไฟล์

ผู้รับผิดชอบ (ย่อ): Dev = พัฒนาเว็บ · IT = ตั้ง Power Automate/SharePoint/Secret · Biz = Business/HR · Design = UX

---

## 🟥 EPIC A — เปิดใช้ฟีเจอร์ที่โค้ดพร้อมแล้ว (Quick Wins, ต้องตั้ง flow/secret)
ทุกข้อ "โค้ดเสร็จแล้ว" รอแค่ฝั่ง IT ตั้ง flow + secret

| ID | Task | ผู้รับผิดชอบ | Effort | Acceptance |
|---|---|---|---|---|
| A1 | เปิดกราฟเทรนด์ KPI: สร้าง List `KPISnapshot` + flow POST + flow GET + ตั้ง secret `POST_SNAPSHOT_URL`, `GET_SNAPSHOTS_URL` | IT | S | การ์ดกราฟขึ้นบน Dashboard, ตัวเลขสะสมรายวัน |
| A2 | flow POST snapshot ทำ upsert ตาม Date (กัน record ซ้ำข้ามผู้ใช้) | IT | S | 1 วัน = 1 record |
| A3 | (ทางเลือก) เปลี่ยน stamp เป็น Scheduled flow (รันเที่ยงคืน) แทน client-driven | IT | M | มี snapshot ทุกวันแม้ไม่มีคนเปิดเว็บ |

**P0** — คุ้มสุด ทำได้เร็ว ปลดล็อกการดูเทรนด์/รายงาน

---

## 🟧 EPIC B — ความถูกต้องของข้อมูล (Data Integrity)

| ID | Task | ผู้รับผิดชอบ | Effort | Acceptance | สถานะ |
|---|---|---|---|---|---|
| B1 | ทดสอบ POST New Candidate ว่า save เข้า SharePoint จริง (อาจติด stale URL → 400) | IT+Dev | S | เพิ่มผู้สมัครจากเว็บแล้วเห็นใน List | ค้าง |
| B2 | ยืนยันคอลัมน์ CV ของผู้สมัครจริง → เพิ่มชื่อ field ใน `cvLinkOf()` ถ้าต่าง | Dev | S | กดดู CV ได้ | ค้าง |
| B3 | Standardize ชื่อสาขา: `JobVacancy.Branch` กับ master ใช้รูปแบบเดียว (มี/ไม่มี "สาขา") | Biz+IT | M | ลดการพึ่ง normalize, ลดความเสี่ยง match พลาด | ✅ **Resolved** — ดู F1 |
| B4 | ยืนยันรายการ ตำแหน่ง 32 ตัว ตามสเปก vs Choice จริงใน SharePoint (ตอนนี้ในเว็บ 26) | Biz | S | POSITIONS ตรงกับ List | ✅ **SharePoint = 32 แล้ว** — Dev sync ดู F2 |

**P1**

---

## 🟨 EPIC C — Close Vacancy ครบวงจร

| ID | Task | ผู้รับผิดชอบ | Effort | Dependency | Acceptance | สถานะ |
|---|---|---|---|---|---|---|
| C1 | เพิ่ม column `ClosedDate`/`ClosedBy`/`CloseNote` ใน List `JobVacancy` | IT | S | — | มี column | ⚠️ **2/3 มีอยู่แล้ว** — `CloseDate` (ชื่อต่างจาก spec), `ClosedBy` มี — เหลือเพิ่มแค่ `CloseNote`. **ดู F3 เรื่อง naming** |
| C2 | สร้าง flow `HR_CLOSE_Vacancy` + secret `CLOSE_VACANCY_URL` (รับ id/Status/CloseDate/CloseNote, ประทับ ClosedBy) | IT | M | C1 | ปิดแล้วบันทึกครบ | ค้าง — design เสร็จจาก Agent HR Pro session แล้ว (3-path resolution) |
| C3 | FL-02 / CL-05 duplicate check ตอนปิด — รอ OQ-01/OQ-02 ให้ Biz/Design ตอบก่อน | Biz+Design | M | Open Questions | มีกติกาชัดเจน | ค้าง |

**P1 (C1–C2) · P2 (C3 รอ business)**

---

## 🟩 EPIC D — ต่อยอด AI Agent / Generative UI

| ID | Task | ผู้รับผิดชอบ | Effort | Acceptance | สถานะ |
|---|---|---|---|---|---|
| D1 | สรุปเชิงวิเคราะห์จากแชท: "นับตำแหน่งว่างต่อ Region", "Top 5 สาขาขาดคน" | Dev | M | agent ตอบ + (option) แสดงตาราง/ชาร์ต | ✅ **ทำแล้ว (web session)** — tool `summarize_vacancies` |
| D2 | สั่งเปิด modal เพิ่มตำแหน่ง/ผู้สมัครจากแชท (generative action) | Dev | S | พิมพ์สั่งแล้ว modal เด้ง pre-fill | ✅ **ทำแล้ว (web session)** — tool `open_form` |
| D3 | `resolve_branch` แบบเต็ม (location_code/region/Area HR) ผ่าน BranchMaster ที่โหลดแล้ว | Dev | S | agent ตอบ Area HR/Region ของสาขาได้ | ✅ **ทำแล้ว (web session)** — resolve_branch คืน location_code/name_en/region/area_hr/od/regional_ceo |
| D4 | TD-02: ออกแบบ Candidate Stage Model (pipeline) ก่อนเพิ่มฟีเจอร์ผู้สมัคร | Design+Biz | L | มี state model อนุมัติแล้ว | ค้าง |

**P2 (D4 เป็น prerequisite ของงานผู้สมัครก้อนใหญ่)**

> หมายเหตุ: **Generative UI (filter ตารางจากแชท)** = tool `filter_vacancies` ทำเสร็จแล้ว (PR #46)

---

## 🟦 EPIC E — Governance / Security / Ops

| ID | Task | ผู้รับผิดชอบ | Effort | Acceptance | สถานะ |
|---|---|---|---|---|---|
| E1 | Regenerate flow URL ที่เคยหลุดบน gh-pages (sig เก่า) แล้วอัปเดต secret | IT | M | URL เก่าใช้ไม่ได้, เว็บยังทำงาน | ค้าง |
| E2 | ทบทวนสิทธิ์ deploy: ปัจจุบัน Claude dispatch Actions ไม่ได้ (403) — merge PR เท่านั้น | IT | S | เอกสารชัด/ปรับ token ถ้าต้องการ | ค้าง |
| E3 | เพิ่ม guard เตือนใน console เมื่อข้อมูลถูก truncate (ลงท้าย 100/500 พอดี) | Dev | S | log เตือนอัตโนมัติ | ✅ **ทำแล้ว (web session)** |
| E4 | Backlog เดิม: Thai Greeting auto, Admin Approve via MS Teams | Dev+IT | M | ตามสเปกแยก | ⚠️ **Admin Approve ตัดออกแล้ว** ฝั่ง Agent HR Pro (ไม่ต้องขออนุมัติ) — Thai Greeting ยังอยู่ |

**P2**

---

## 🆕 EPIC F — Sync จาก Agent HR Pro Session (2026-06-15)

ข้อมูลใหม่ + master data จากไฟล์ `Agent_HR_Pro_MasterData_Proposal.xlsx` (172 สาขา + 32 ตำแหน่ง + 180 vacancy จริงถูก seed เข้า `JobVacancy` แล้ว)

| ID | Task | ผู้รับผิดชอบ | Effort | Acceptance | สถานะ |
|---|---|---|---|---|---|
| F1 | แก้ branch-name normalize ในโค้ดเว็บให้ใช้รูปแบบ **ไม่มี "สาขา" นำหน้า** ให้ตรงกับ `JobVacancy.Branch` | Dev | S | 180 vacancy ขึ้นตรงสาขา ไม่ตกหล่นจาก mismatch | ✅ **ทำแล้ว (web session)** — `BRANCHES` strip prefix "สาขา" |
| F2 | อัปเดต array `POSITIONS` 26 → **32 รายการ** | Dev | S | dropdown ตรงกับ Choice 32 รายการ | ✅ **ทำแล้ว (web session)** |
| F3 | Close Vacancy ใช้ field **`CloseDate`** (ไม่ใช่ `ClosedDate`), เพิ่ม `CloseNote` ใหม่ | IT+Dev | S | ไม่มี field name mismatch | ✅ **ฝั่งเว็บแก้แล้ว** — POST ส่ง `CloseDate`/`CloseNote`; IT ยังต้องเพิ่ม column `CloseNote` + flow |
| F4 | โหลด BranchMaster (LocationCode/NameEN/NameTH/Region/OD/RegionalCEO) เข้าเว็บ/agent | Dev | S | agent/เว็บ resolve สาขา → คืน Region/OD/RegionalCEO ได้ | ✅ **ทำแล้ว (web session)** — โหลดผ่าน `GET_BRANCHMASTER_URL`, ใช้ใน Area HR + resolve_branch |
| F5 | Smoke test ด้วยข้อมูลจริง 180 vacancy ที่ seed แล้ว | Dev | S | Dashboard แสดงครบ 180, group by Region/Position ถูก | ⏳ รอ verify ใน production (เชื่อมกับ B1/B2) |

**P0 (F1-F2) · P1 (F3-F4) · P2 (F5)**

### 📎 list ตำแหน่ง 32 รายการ (F2 — ใช้แล้วในโค้ด)
```
ASGM
Assistant Store Manager
Asst. FS Store Manager
FS Store Manager
Food/Fresh Shop Manager
Fresh Manager
Manager - Key Account
Order Fulfillment Manager
Sales Manager
Section Manager - ALC
Section Manager - ALC & Admin
Section Manager - B2B Sales
Section Manager - Bakery
Section Manager - Butchery
Section Manager - Credit Sales
Section Manager - Dry Food 1
Section Manager - Dry Food 2
Section Manager - F&V
Section Manager - Fish
Section Manager - Frozen
Section Manager - GA
Section Manager - GR
Section Manager - General Affair
Section Manager - HR
Section Manager - Non Food 1
Section Manager - Non Fresh
Section Manager - O2O Delivery
Section Manager - Siam Frozen
Section Manager - Store OCS
Section Manager-O2O Operation
Section Mgr.-Customer Service
Store General Manager (SGM)
```

---

## 🎯 แนะนำลำดับ Sprint (ปรับใหม่)

- **Sprint 1 (เร็ว, คุ้ม):** A1–A2, B1–B2 → ปลดล็อกกราฟ + ยืนยัน data flow *(F1–F2 Dev ทำเสร็จแล้ว)*
- **Sprint 2:** C1–C2 (พร้อม F3 — IT เพิ่ม column `CloseNote` + flow), E1 → Close Vacancy ครบ + security
- **Sprint 3:** D1–D2, F5 smoke test, D4 (เริ่ม design pipeline)
- **รอ Business:** C3 (OQ-01/OQ-02), D4, ยืนยันตัด E4 (Admin Approve)

---

## สรุปการเปลี่ยนสถานะรอบนี้

| เดิม | ใหม่ | เหตุผล |
|---|---|---|
| B3 ค้าง | ✅ Resolved → F1 | Branch format ตัดสินใจแล้ว จาก seed 180 records ใหม่ |
| B4 ค้าง | ✅ SharePoint=32 → F2 | Choice list อัปเดตเป็น 32 แล้ว เหลือ sync โค้ดเว็บ |
| C1 ค้าง | ⚠️ 2/3 มีแล้ว → F3 | `CloseDate`/`ClosedBy` มีอยู่แล้ว เหลือ `CloseNote` |
| E4 ค้าง | ⚠️ Admin Approve ตัดออก | Agent HR Pro ตัด feature นี้ — รอ confirm จาก Biz |

---

## ✅ Dev update ล่าสุด (2026-06-15, web session — ขึ้น main แล้ว)
- **F1** `BRANCHES` ตัด prefix "สาขา" → ตรงกับ `JobVacancy.Branch`
- **F2** `POSITIONS` 26 → 32 รายการ
- **F3** Close Vacancy POST ใช้ `CloseDate` (+ `CloseNote`) — *IT ยังต้องเพิ่ม column `CloseNote` + flow `HR_CLOSE_Vacancy`*
- **F4** โหลด BranchMaster (`GET_BRANCHMASTER_URL`) → Area HR แสดงแล้ว + เก็บ OD/RegionalCEO/NameEN
- **D3** `resolve_branch` คืน location_code/name_en/region/area_hr/od/regional_ceo
- **E3** guard เตือน console เมื่อข้อมูลอาจถูก truncate (100/500/1000/5000)

### Dev update รอบ 2 (2026-06-15)
- **D1** tool `summarize_vacancies` (group by region/branch/position/area/status/od, top N, slots/vacancies)
- **D2** tool `open_form` (เปิด modal candidate/vacancy จากแชท + pre-fill)

### ยังเหลือฝั่ง Dev (ทำต่อได้)
- B1/B2 (ทดสอบ POST candidate + CV column), F5 (verify 180 records บน production)

### ต้องรอฝั่ง IT/Biz
- A1–A3 (KPI snapshot flow), C1–C2 (column `CloseNote` + flow close), E1 (regenerate sig), C3/D4/E4 (รอ business)
