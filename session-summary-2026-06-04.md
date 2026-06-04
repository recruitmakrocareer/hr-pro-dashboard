# HR Pro Dashboard — Session Summary
**วันที่:** 4 มิถุนายน 2026  
**Repo:** https://github.com/recruitmakrocareer/hr-pro-dashboard  
**Live URL:** https://recruitmakrocareer.github.io/hr-pro-dashboard  
**Branch งาน:** claude/vibrant-cerf-ZQXy9 (merge เข้า main ทุก PR)

---

## สถานะปัจจุบัน

### ✅ ทำเสร็จแล้ว

| Feature | สถานะ | หมายเหตุ |
|---|---|---|
| Chat Widget → Claude AI | ✅ ทำงานได้ | ผ่าน Cloudflare Worker proxy |
| GET Vacancies | ✅ ทำงานได้ | โหลดจาก SharePoint ผ่าน Power Automate |
| GET Candidates | ✅ ทำงานได้ | โหลดจาก SharePoint ผ่าน Power Automate |
| POST Vacancy (Create/Edit) | ✅ Deploy แล้ว | รอทดสอบหลัง fix ID=null |
| POST Candidate | ⬜ ยังไม่ได้ set URL | POST_CANDIDATE_URL ยังว่างอยู่ |
| Claude รู้ข้อมูล real-time | ✅ ทำงานได้ | buildSystemPrompt() inject vacancies+candidates |

---

## CONFIG object ปัจจุบัน (index.html ~line 677)

```js
const CONFIG = {
  GET_VACANCIES_URL:  'https://4d5e96e05cb6e591aefe0bce82117f.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7eced539609c4e658e10d8b4ca8a0c84/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=NnZW8Uu1Vq1P-CMNE4sN7gofQTfWe9VadtkB6t42zAk',
  POST_VACANCY_URL:   'https://4d5e96e05cb6e591aefe0bce82117f.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/49e89cc1a25a4775b146a8b1bdabb67a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vTna3wQzrAriHFEHuZMHDlqrVnQOKpkHglohjf4uEWc',
  GET_CANDIDATES_URL: 'https://4d5e96e05cb6e591aefe0bce82117f.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6d922addd2cd45cc8467e008e0b21631/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Y4vSOZ9qB4H4CKMKWatHthc4prdMwyrCaCGK2Pw29UI',
  POST_CANDIDATE_URL: '',   // ← ยังว่าง รอ URL จาก Power Automate
  COPILOT_IFRAME_URL: '',
  CLAUDE_API_KEY:     '__CLAUDE_API_KEY__',  // inject โดย GitHub Actions
  PROXY_URL:          'https://hr-pro-claude-proxy.oonllos.workers.dev',
};
```

---

## Architecture

```
Browser (GitHub Pages)
  │
  ├─→ Power Automate Flow → SharePoint  (GET/POST Vacancies, GET/POST Candidates)
  │
  └─→ Cloudflare Worker (hr-pro-claude-proxy.oonllos.workers.dev)
           │
           └─→ Claude API (api.anthropic.com)
                  API Key เก็บใน Cloudflare Worker Secret (ชื่อ: CLAUDE_API_KEY)
```

**หมายเหตุ CORS:** Browser เรียก api.anthropic.com โดยตรงไม่ได้ (CORS block) จึงต้องผ่าน Cloudflare Worker

---

## Power Automate Flows

| Flow | URL Pattern | สถานะ |
|---|---|---|
| GET_Vacancies | workflows/7eced539... | ✅ ใช้งานได้ |
| POST_Vacancy (Create/Edit) | workflows/49e89cc1... | ✅ Deploy แล้ว |
| GET_Candidates | workflows/6d922add... | ✅ ใช้งานได้ |
| POST_Candidate | ยังไม่มี | ⬜ ต้องสร้าง |
| HR_CHAT_Claude | workflows/054a7ae2... | ❌ ถูก IT บล็อก (ไม่ได้ใช้แล้ว) |

### โครงสร้าง Payload

**POST Vacancy:**
```json
{
  "Title":     "ชื่อตำแหน่ง",
  "Branch":    "สาขา",
  "Status":    "Open/Hold/Close",
  "Slots":     1,
  "Recruiter": "ชื่อ",
  "OpenDate":  "2026-06-04",
  "Notes":     "หมายเหตุ",
  "ID":        null
}
```
> Condition ใน Flow: `@triggerBody()?['ID']` → null = Create (False branch), มีค่า = Update (True branch)

**GET Candidates Response:** `{ value: [...] }`

---

## Cloudflare Worker

**URL:** https://hr-pro-claude-proxy.oonllos.workers.dev  
**Account:** oonllos  
**ไฟล์:** worker.js (อยู่ใน root ของ repo)  
**Secret:** `CLAUDE_API_KEY` (ตั้งค่าใน Cloudflare Dashboard → Workers & Pages → hr-pro-claude-proxy → Settings → Variables and Secrets)

---

## GitHub Actions

**ไฟล์:** .github/workflows/deploy.yml  
**ทำงาน:** push ไป main → inject `CLAUDE_API_KEY` จาก GitHub Secret → deploy ไป gh-pages branch  
**GitHub Secret ที่ต้องมี:** `CLAUDE_API_KEY`

---

## งานที่เหลือ / Next Steps

1. **ทดสอบ POST Vacancy** — กด "+ เพิ่มตำแหน่ง" ว่าบันทึกลง SharePoint ได้ไหม
2. **POST_CANDIDATE_URL** — สร้าง Power Automate Flow สำหรับเพิ่มผู้สมัคร แล้วเอา URL มาใส่ใน CONFIG
3. **ทดสอบ Chat** — ถ้า Cloudflare Worker ยัง "Failed to fetch" ให้เช็ค Worker Dashboard ว่า Active ไหม
4. **ผู้สมัครรวม = 0** — เช็คว่า GET_Candidates Flow return `{ value: [...] }` ถูกต้องไหม

---

## PR History วันนี้

| PR | เรื่อง |
|---|---|
| #6 | Connect Chat Widget to Power Automate (Claude AI) |
| #7 | Fix chatHistory on API error |
| #8 | Switch Chat to direct Claude API (GitHub Actions secret inject) |
| #9 | Debug: log real error in sendChat() |
| #10 | Add Cloudflare Worker proxy (fix CORS) |
| #11 | Update worker.js try/catch; fix sendChatMobile PROXY_URL |
| #12 | Set PROXY_URL = hr-pro-claude-proxy.oonllos.workers.dev |
| #13 | Set GET_CANDIDATES_URL |
| #14 | Inject real data into Claude system prompt |
| #15 | Set POST_VACANCY_URL |
| #16 | Fix saveVacancy: send ID=null when creating new |
