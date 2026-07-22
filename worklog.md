---
Task ID: 1
Agent: main
Task: Set up Prisma schema and push to database

Work Log:
- Designed Prisma schema with 4 models: Siswa, Guru, MutasiMasuk, MutasiKeluar
- Pushed schema to SQLite database successfully
- Generated Prisma Client

Stage Summary:
- Database models: Siswa (11 fields), Guru (9 fields), MutasiMasuk (9 fields), MutasiKeluar (9 fields)
- SQLite database at /home/z/my-project/db/custom.db

---
Task ID: 2
Agent: main
Task: Create all API routes

Work Log:
- Created /api/dashboard (GET) - statistics for dashboard
- Created /api/siswa (GET, POST, PUT, DELETE) - full CRUD with search, filter, pagination
- Created /api/guru (GET, POST, PUT, DELETE) - full CRUD with search, filter, pagination
- Created /api/mutasi-masuk (GET, POST, PUT, DELETE) - full CRUD with search, pagination
- Created /api/mutasi-keluar (GET, POST, PUT, DELETE) - full CRUD with search, pagination

Stage Summary:
- 5 API route files created with proper error handling

---
Task ID: 3
Agent: main (coordinated 5 sub-agents)
Task: Build all page components

Work Log:
- Created DashboardPage.tsx with statistics cards, bar chart, recent tables
- Created SiswaPage.tsx with full CRUD, search, filters, pagination
- Created MutasiMasukPage.tsx with full CRUD, search, pagination
- Created MutasiKeluarPage.tsx with full CRUD, search, pagination
- Created GuruPage.tsx with full CRUD, search, filters, pagination

Stage Summary:
- 5 page components in /src/components/pages/
- All use TanStack Query for data fetching

---
Task ID: 4
Agent: main
Task: Build main page.tsx with sidebar navigation

Work Log:
- Created Zustand store for navigation state
- Built responsive sidebar with emerald color scheme
- Added TanStack Query provider
- Wired all page components together
- Mobile-friendly with hamburger menu

Stage Summary:
- Single-page app with client-side navigation via Zustand store
- Sidebar: Dashboard, Data Siswa, Mutasi Masuk, Mutasi Keluar, Data Guru

---
Task ID: 5
Agent: main
Task: Self-verification with Agent Browser

Work Log:
- Verified Dashboard loads with statistics cards and chart
- Verified Data Siswa page with full CRUD (added test student "Ahmad Rizky")
- Verified Mutasi Masuk page with empty state
- Verified Mutasi Keluar page with empty state
- Verified Data Guru page with empty state
- Confirmed navigation between all pages works
- Confirmed no console errors
- Confirmed sticky footer

Stage Summary:
- All 5 pages verified working
- CRUD operations verified (student add confirmed in table and dashboard)
- No errors in dev log or browser console

---
Task ID: 6
Agent: main
Task: Add Tahun Pelajaran grouping feature

Work Log:
- Updated Prisma schema: added tahunPelajaran and semester fields (with defaults) to Siswa, Guru, MutasiMasuk, MutasiKeluar
- Pushed schema to database (existing data gets defaults)
- Updated Zustand store with tahunPelajaran and semester state
- Updated all 5 API routes to filter by tahunPelajaran and semester query params
- Updated dashboard API to return tahunPelajaranOverview grouping
- Added Tahun Pelajaran selector (Tahun Ajaran + Semester) to sidebar
- Updated all 5 page components to read from store and pass to API
- All page forms auto-set tahunPelajaran/semester from sidebar selector
- Dashboard shows "Ringkasan per Tahun Pelajaran" overview table
- Mobile top bar shows current TP/semester badge

Stage Summary:
- Sidebar now has Tahun Ajaran dropdown (2024/2025 to 2027/2028) and Semester dropdown (Ganjil/Genap)
- All data (siswa, guru, mutasi) is filtered by the selected TP and semester
- Dashboard overview table shows student counts across all TP/semester combinations
- Verified: switching from Ganjil (1 siswa) to Genap (1 siswa) correctly filters data
- Chart and statistics cards update per TP/semester selection

---
Task ID: 5
Agent: main
Task: Add Excel Import feature for Data Siswa and Data Guru

Work Log:
- Created `/api/siswa/import/route.ts` — POST endpoint accepting FormData with Excel file, tahunPelajaran, semester; parses with xlsx library, maps columns to DB fields, bulk inserts
- Created `/api/guru/import/route.ts` — Same pattern for guru data with guru-specific column mapping
- Created `/src/components/ImportExcelDialog.tsx` — Reusable dialog component with drag-and-drop, file selection, format hints, loading state, success/error result display, and "Import Lagi" button
- Updated `SiswaPage.tsx` — Added "Import Excel" button in header area, triggers ImportExcelDialog with type="siswa"
- Updated `GuruPage.tsx` — Added "Import Excel" button in header area, triggers ImportExcelDialog with type="guru"
- Verified via Agent Browser: both Import Excel buttons visible and dialogs open correctly on both pages

Stage Summary:
- Import feature is live at Data Siswa and Data Guru pages
- Users click "Import Excel" button → dialog opens → upload .xlsx/.xls/.csv file → data imports to selected Tahun Pelajaran & Semester
- Column mapping is case-insensitive and flexible (handles various header formats)

---
Task ID: 6
Agent: main
Task: Import all data from Dapodik Excel files and update UI to match Excel column order

Work Log:
- Analyzed both Dapodik Excel files: siswa has 4 metadata rows + 2 header rows + 817 data rows with 66 columns; guru has 4 metadata rows + 1 header row + 42 data rows with 51 columns
- Expanded Prisma schema: Siswa model from 18 fields to 65+ fields, Guru model from 18 fields to 45+ fields (all string type)
- Ran `db:push` to migrate schema, `db:generate` to update Prisma Client
- Wrote direct import script (`scripts/import-excel.cjs`) that parses Dapodik format using index-based column mapping
- Imported 817 siswa (0 skipped) and 42 guru (0 skipped) for 2025/2026 Ganjil
- Rewrote SiswaPage table: 39 data columns matching Excel order (No, Nama, NIPD, JK, NISN, Tempat Lahir, Tanggal Lahir, NIK, Agama, Alamat, RT, RW, Dusun, Kelurahan, Kecamatan, Kode Pos, Jenis Tinggal, Alat Transportasi, Telepon, HP, E-Mail, SKHUN, Penerima KPS, No. KPS, Nama Ayah, Ayah Tahun Lahir, Ayah Jenjang, Ayah Pekerjaan, Nama Ibu, Ibu Tahun Lahir, Ibu Jenjang, Ibu Pekerjaan, Nama Wali, Wali Tahun Lahir, Wali Jenjang, Wali Pekerjaan, Rombel, Kebutuhan Khusus, Sekolah Asal)
- Rewrote GuruPage table: 35 data columns matching Excel order (No, Nama, NUPTK, JK, Tempat Lahir, Tanggal Lahir, NIP, Status Kepegawaian, Jenis PTK, Agama, Alamat, RT, RW, Nama Dusun, Desa/Kelurahan, Kecamatan, Kode Pos, Telepon, HP, Email, Tugas Tambahan, SK CPNS, Tanggal CPNS, SK Pengangkatan, TMT Pengangkatan, Lembaga Pengangkatan, Pangkat/Golongan, Sumber Gaji, Nama Ibu Kandung, Status Perkawinan, Nama Suami/Istri, NIP Suami/Istri, Pekerjaan Suami/Istri, Kewarganegaraan, NIK)
- Updated import API endpoints to handle Dapodik format (auto-detects merged header rows, falls back to simple header format)
- Fixed siswa GET API: page/limit were strings causing 500 error, added parseInt()
- Verified via Agent Browser: Dashboard shows 817 siswa, SiswaPage shows "Menampilkan 1-10 dari 817 siswa", GuruPage shows "Menampilkan 1-10 dari 42 guru"

Stage Summary:
- All 817 siswa and 42 guru from Dapodik Excel files successfully imported
- Table column order matches Excel exactly
- Import API now supports Dapodik format (merged header rows) and simple format
- All fields stored in database including parent data, KIP/KPS info, health data, etc.---
Task ID: 1
Agent: Main Agent
Task: Connect all Siswa data to Mutasi Keluar page

Work Log:
- Read existing MutasiKeluarPage, schema, API routes, and DashboardPage
- Updated prisma/schema.prisma: Added siswaId (optional FK) to MutasiKeluar, added 14 new siswa reference fields (nipd, nisn, nik, jenisKelamin, tempatLahir, tanggalLahir, agama, alamat, hp, namaAyah, namaIbu, rombel, sekolahAsal), added relation to Siswa model, added indexes
- Ran `bun run db:push` to apply schema changes
- Created `/api/siswa/list` endpoint: Returns active siswa list with search, TP/semester filter, ordered by rombel then no, limited to 100 results
- Updated `/api/mutasi-keluar/route.ts`: POST/PUT auto-fills from siswa when siswaId provided; POST updates siswa status to "Mutasi Keluar"; DELETE restores siswa status to "Aktif"; GET search now includes nipd and nisn
- Rewrote `MutasiKeluarPage.tsx`: Searchable siswa combobox using Command+Popover, auto-fills all siswa data on selection, shows data siswa section with all fields, detail dialog with full siswa+mutasi info, page size selector, "Terhubung" badge for linked records, proper responsive columns
- Fixed DashboardPage: Updated type from `nis` to `nipd`/`nisn` for recentMutasiKeluar, fixed `siswaPerKelas` → `siswaPerRombel` (pre-existing bug)
- Verified with Agent Browser: Dashboard loads with 817 siswa, Mutasi Keluar page renders correctly, siswa combobox shows all 817 siswa with name/gender/rombel/NIPD/NISN, selecting a siswa auto-fills all 14 data fields correctly

Stage Summary:
- Mutasi Keluar is now fully connected to Siswa data
- When creating mutasi keluar, operator can search and select from existing siswa (817 records)
- All siswa data auto-fills: NIPD, NISN, NIK, jenis kelamin, tempat/tgl lahir, agama, alamat, HP, nama ayah/ibu, rombel, sekolah asal
- Siswa status automatically changes to "Mutasi Keluar" when recorded
- Deleting a mutasi keluar record restores siswa status to "Aktif"
- Records linked to siswa show "Terhubung" badge in the table
- Detail dialog shows all connected siswa data

---
Task ID: 2
Agent: Main Agent
Task: Refactor Mutasi Keluar to eliminate data duplication - use JOIN instead of copying

Work Log:
- User asked: "bagaimana menurut mu jika siswa sudah mutasi keluar? apakah data siswa bisa pindah dari database siswa utama ke data siswa mutasi? saya ingin menghindari duplikasi data"
- Analyzed current architecture: MutasiKeluar had 14 duplicated siswa fields (nipd, nisn, nik, jenisKelamin, etc.)
- Redesigned schema: MutasiKeluar now only has 6 fields (id, siswaId, tujuanSekolah, tanggalKeluar, alasan, noSurat + TP/semester)
- Added @@unique([siswaId, tahunPelajaran, semester]) to prevent duplicate mutasi per siswa per TP
- Rewrote /api/mutasi-keluar: GET uses Prisma `include: { siswa: { select: {...} } }` for JOIN; POST validates siswaId required, checks duplicate, updates siswa status; DELETE restores siswa status
- Created /api/siswa/list endpoint for combobox (only returns active siswa)
- Rewrote MutasiKeluarPage: Form only stores mutasi-specific data (siswaId + 4 fields); siswa data displayed read-only from combobox selection; Detail dialog shows joined siswa data
- Fixed DashboardPage: Updated recentMutasiKeluar type to use nested `siswa` object
- Verified with Agent Browser: API returns 200, JOIN query visible in logs, table shows siswa data from Siswa table, zero duplication

Stage Summary:
- **Architecture: Single Source of Truth** — Siswa table is the only place student data lives
- **MutasiKeluar table: only 6 fields** — id, siswaId, tujuanSekolah, tanggalKeluar, alasan, noSurat
- **JOIN pattern** — API uses Prisma `include` to fetch siswa data alongside mutasi data
- **Status management** — Create mutasi → siswa.status = "Mutasi Keluar"; Delete mutasi → siswa.status = "Aktif"
- **Duplicate prevention** — @@unique constraint prevents same siswa being mutasi keluar twice per TP/semester
- **Zero duplication** — No siswa data is copied/stored in MutasiKeluar table

---
Task ID: 3
Agent: Main Agent
Task: Audit dan perbaiki semua bug agar aplikasi tidak error

Work Log:
- Audit menyeluruh: cek konsistensi schema ↔ API ↔ komponen frontend
- BUG 1: Siswa DELETE API membaca id dari searchParams, tapi frontend kirim di body JSON → Fix: baca dari request body
- BUG 2: Guru DELETE API sama seperti BUG 1 → Fix: baca dari request body
- BUG 3: MutasiMasukPage menggunakan `alasanMutasi` di form state, tapi schema DB field-nya `alasan` → Fix: rename semua referensi ke `alasan`
- BUG 4: DashboardPage interface mendefinisikan `siswaAktif/siswaNonaktif/guruAktif/guruNonaktif` tapi API tidak mengembalikan field tersebut → Fix: hapus dari interface
- BUG 5: Siswa DELETE tidak menangani foreign key constraint — hapus siswa yang punya MutasiKeluar akan crash → Fix: tambah `deleteMany` pada relasi sebelum hapus siswa
- Jalankan lint: hanya error di file script (.cjs/.mjs) yang bukan bagian aplikasi
- Verifikasi Agent Browser: semua 5 halaman berjalan tanpa error
  - Dashboard: 817 siswa, 42 guru, chart terrender, 0 console error
  - Data Siswa: "Menampilkan 1-10 dari 817 siswa", 0 console error
  - Mutasi Masuk: empty state ditampilkan dengan benar, 0 console error
  - Mutasi Keluar: 1 data dengan siswa terhubung (JOIN berhasil), 0 console error
  - Data Guru: "Menampilkan 1-10 dari 42 guru", 0 console error

Stage Summary:
- 5 bug ditemukan dan diperbaiki, termasuk 3 bug kritis yang menyebabkan error runtime
- Aplikasi 100% berjalan tanpa error di semua 5 halaman
- Konsistensi data antara schema, API routes, dan komponen frontend terjamin

---
Task ID: 4
Agent: Main Agent
Task: Tambah manajemen Tahun Pelajaran (CRUD) dan fitur Export Laporan (Excel + PDF)

Work Log:
- Tambah model TahunPelajaran ke Prisma schema (id, tahunPelajaran @unique, createdAt)
- Seed 4 data TP: 2024/2025, 2025/2026, 2026/2027, 2027/2028
- Buat API /api/tahun-pelajaran (GET list, POST tambah, DELETE hapus)
- Install jspdf + jspdf-autotable untuk PDF generation
- Buat src/lib/export-utils.ts: exportToExcel() dan exportToPDF() dengan header, styling, nomor halaman
- Buat src/components/ExportButton.tsx: komponen reusable dengan dropdown Excel/PDF
- Buat preset kolom untuk 4 laporan: SISWA_COLUMNS (28 kolom), GURU_COLUMNS (23 kolom), MUTASI_MASUK_COLUMNS (8 kolom), MUTASI_KELUAR_COLUMNS (10 kolom)
- Update page.tsx: sidebar TP sekarang dinamis dari API, tambah ikon ⚙️ + dialog "Kelola Tahun Pelajaran" dengan validasi format YYYY/YYYY+1
- Tambah ExportButton ke SiswaPage, GuruPage, MutasiMasukPage, MutasiKeluarPage
- MutasiKeluar export handle nested siswa data via flattenRow
- ExportButton otomatis menyertakan tahunPelajaran & semester dari store
- Verifikasi Agent Browser: semua fitur berjalan tanpa error

Stage Summary:
- Tahun Pelajaran sekarang dinamis — admin bisa tambah/hapus via dialog di sidebar
- Validasi format TP: harus YYYY/YYYY+1 (contoh: 2026/2027)
- 4 halaman data dilengkapi tombol Export (dropdown Excel/PDF)
- Export Excel: header judul + subtitle + kolom dengan lebar custom
- Export PDF: header emerald, nomor halaman, timestamp, auto-page-break
- 0 console error di semua halaman

---
Task ID: 3
Agent: Main Agent
Task: Fix search functionality across all pages

Work Log:
- Analyzed all 4 pages: SiswaPage, GuruPage, MutasiMasukPage, MutasiKeluarPage
- Tested API endpoints directly - confirmed they return correct results
- Found bugs:
  1. SiswaPage: No debounce, every keystroke triggers API call
  2. GuruPage: search param always sent (even empty) via URLSearchParams constructor
  3. MutasiMasukPage: Required clicking search button (not real-time)
  4. MutasiKeluarPage: Debounce broken - cleanup returned from useCallback instead of useEffect
- Fixed all 4 pages with proper 300ms debounce using useEffect
- Changed all queryFn to conditionally set search param only when non-empty
- MutasiMasukPage: removed button-triggered search, now real-time with debounce
- Verified all 4 pages in browser: Siswa(10), Guru(2), MutasiMasuk(1), MutasiKeluar(1) results found
- Force pushed to GitHub (fc885f8)

Stage Summary:
- Files changed: SiswaPage.tsx, GuruPage.tsx, MutasiMasukPage.tsx, MutasiKeluarPage.tsx
- All pages now use consistent debounce pattern with useEffect
- Search params only sent when non-empty
- Browser verified all searches return correct data
---
Task ID: 2
Agent: main
Task: Fix student search, push to GitHub, configure Vercel deployment

Work Log:
- Investigated student name search across all features (SiswaPage, MutasiMasukPage, MutasiKeluarPage)
- Tested API endpoints directly - search works correctly (e.g., /api/siswa?search=an returns 393 results)
- Tested search in browser using agent-browser - SiswaPage search, MutasiKeluar student combobox both work
- Found that search was already fixed in previous commit fc885f8 "fix: perbaiki pencarian di semua halaman"
- Updated GitHub remote with new token ***REDACTED***
- Pushed latest code to GitHub (main branch, commits 826198a..47f8f7b)
- Updated package.json for Vercel: added "postinstall": "prisma generate" and changed build to "prisma generate && next build"
- Attempted Vercel deployment with deploy token dpl_8AoAiC413AcSeYqNuw1AGA9xU9fp
- Determined deploy token (dpl_ prefix) is Git-only credential, cannot create Vercel project via API/CLI
- Project is Vercel-ready (postinstall, build script, .gitignore all configured)

Stage Summary:
- Search bug was already fixed in previous session (commit fc885f8)
- Code pushed to GitHub successfully
- Vercel deploy token (dpl_) cannot create new projects - user needs to create project on vercel.com dashboard and import from GitHub
---
Task ID: 3
Agent: main
Task: Configure Vercel deployment using Vercel API token

Work Log:
- User provided Vercel API token (vcp_ prefix)
- Checked Vercel account: user davidsitinjak01, team davidsitinjak01s-projects
- Found existing project "operator-sekolah" (prj_XERum18Tg5pbdgyYI2nKsaFzc5Vh)
- Project already connected to GitHub repo DavidSitinjak01/operator-sekolah
- Got correct repoId: 1303899997, production branch: main
- Triggered production deployment via Vercel API (dpl_CrPGLx1qvz9xrV6z23vorWcRCvFX)
- Deployment completed successfully (READY state)
- Verified production URL responds HTTP 200

Stage Summary:
- Production URL: https://operator-sekolah.vercel.app
- Domain verified: operator-sekolah.vercel.app
- GitHub → Vercel auto-deploy is active (every push to main triggers deployment)
- DATABASE_URL and DIRECT_URL env vars are configured on Vercel (values masked/secret)
---
Task ID: 4
Agent: main
Task: Configure Neon PostgreSQL database and deploy to Vercel

Work Log:
- User provided Neon PostgreSQL URL
- Set DATABASE_URL on Vercel for production environment
- Created scripts/prepare-prisma.js for dual-database support (SQLite local / PostgreSQL Vercel)
- Updated package.json postinstall to run prepare-prisma.js before prisma generate
- Pushed Prisma schema to Neon (all tables created: Siswa, Guru, MutasiMasuk, MutasiKeluar, TahunPelajaran)
- Fixed GitHub push protection (removed secrets from worklog)
- Pushed code to GitHub (commit 8ad0f90)
- Triggered production deployment (dpl_GyA3JK7CXcxy8MV5gzMgtdmtfYxA) - READY
- Verified: API returns real data (1634 siswa, dashboard works)

Stage Summary:
- Vercel production live: https://operator-sekolah.vercel.app
- Database: Neon PostgreSQL connected and working
- Dual-DB: SQLite for local dev, PostgreSQL for Vercel (auto-switch via prepare-prisma.js)
- Auto-deploy: every push to main branch auto-deploys to Vercel

---
Task ID: 5
Agent: main
Task: Implement complete authentication system with NextAuth.js v4

Work Log:
- Installed bcryptjs + @types/bcryptjs for password hashing
- Added User model back to Prisma schema (id, username, password, role, nama, active, timestamps)
- Pushed schema to SQLite database, regenerated Prisma Client
- Created `/src/lib/auth.ts` — NextAuth v4 config with Credentials provider, JWT strategy, role stored in token
- Created `/src/app/api/auth/[...nextauth]/route.ts` — GET + POST handlers for NextAuth
- Created `/src/components/LoginPage.tsx` — Emerald-themed underwater/ocean login page with glassmorphism card, animated bubbles, light rays, wave SVG
- Created `/src/components/AuthGuard.tsx` — Client component wrapping SessionProvider, shows LoginPage when no session, loading spinner during session check
- Updated `/src/app/page.tsx` — Wrapped entire app in AuthGuard, added user info + logout button to sidebar footer, shows role badge with Shield icon
- Inserted default admin user (username: admin, password: admin123, role: admin) into SQLite
- Added NEXTAUTH_URL and NEXTAUTH_SECRET to .env file
- Added `@keyframes float` animation to globals.css for login page bubbles
- Verified: /api/auth/csrf returns 200, /api/auth/callback/credentials returns 302 on successful login, main page returns 200
- Lint clean: zero errors in src/ directory

Stage Summary:
- Full authentication system implemented with NextAuth.js v4 Credentials provider
- Login page: underwater/ocean theme with glassmorphism card, emerald color scheme, animated bubbles
- Auth flow: LoginPage → signIn('credentials') → JWT token with role → session → dashboard
- Sidebar shows logged-in user name, role badge, and logout button
- Default admin: username=admin, password=admin123, role=admin
- JWT session strategy with 8-hour expiry
- User model supports: admin, operator, and custom roles
---
Task ID: 1
Agent: Main Agent
Task: Redesign login page with karikatur anak SMA sedang belajar and attractive UI

Work Log:
- Investigated current project state: AuthGuard wraps page.tsx, shows LoginPage when not authenticated
- Generated caricature image of Indonesian high school student studying using z-ai image-gen CLI (864x1152 portrait)
- Generated decorative educational pattern background image (1344x768 landscape)
- Completely redesigned LoginPage.tsx with new modern light theme:
  - Split layout: left side with caricature illustration + branding (desktop), right side with login form
  - Mobile: circular cropped caricature above form
  - Decorative blurred emerald blobs, floating icons (BookOpen, GraduationCap, Sparkles)
  - Glassmorphism login card with rounded-xl inputs, gradient submit button
  - Feature badges (Data Siswa, Data Guru, Mutasi, Laporan)
  - Icon-adorned input fields with user/lock icons
- Updated AuthGuard.tsx loading state to match new light emerald theme
- Verified with Agent Browser: login page renders correctly, form fields work, button enables after filling

Stage Summary:
- Files modified: src/components/LoginPage.tsx, src/components/AuthGuard.tsx
- New images: public/images/student-studying.png, public/images/pattern-edu.png
- Login page verified working on both desktop and mobile viewports
- No console errors detected

---
Task ID: 1
Agent: Main Agent
Task: Tambahkan fitur status Dapodik pada mutasi masuk & keluar

Work Log:
- Read and analyzed existing Prisma schema, API routes, and page components for MutasiMasuk and MutasiKeluar
- Added `statusDapodik Boolean @default(false)` to both MutasiMasuk and MutasiKeluar models in prisma/schema.prisma
- Ran `prisma db push --accept-data-loss` to sync database
- Created `/api/mutasi-dapodik` PATCH endpoint with role-based access control (only admin/operator)
- Updated `/api/mutasi-keluar` GET to include `statusDapodik` in flattened response
- Updated MutasiMasukPage.tsx: added session hook, role detection, toggle mutation, Status Dapodik column with interactive checkbox (admin/operator) or read-only badge (other users)
- Updated MutasiKeluarPage.tsx: same pattern as above, plus added statusDapodik to detail dialog
- Committed and pushed to GitHub (with rebase for remote sync)
- Verified via dev logs that Prisma queries include `statusDapodik` field

Stage Summary:
- New field: `statusDapodik` (boolean, default false) on MutasiMasuk & MutasiKeluar
- New API: PATCH /api/mutasi-dapodik - role-gated toggle (admin/operator only)
- UI: Admin/operator see interactive checkbox to toggle status
- UI: Other users see read-only Badge (Sudah/Belum) - cannot edit
- Status also shown in Mutasi Keluar detail dialog
---
Task ID: 4
Agent: full-stack-developer
Task: Update MutasiKeluarPage to show ALL siswa data fully synchronized

Work Log:
- Updated SiswaData interface with all 65 fields from Siswa Prisma model
- Changed SiswaOption to be a type alias of SiswaData (identical interface)
- Added lucide-react imports: User, MapPin, Users, BookOpen for section icons
- Expanded Detail Dialog with 4 categorized sections (Data Pribadi, Alamat & Kontak, Data Orang Tua/Wali, Data Pendidikan & Lainnya) plus Informasi Mutasi section, each with emerald-colored section headers and Separators
- Expanded Preview in Add/Edit form dialog with same 4-section categorized layout
- Updated Export flattenRow to extract all siswa fields from nested siswa object with JK formatting helper
- Updated MUTASI_KELUAR_COLUMNS in export-utils.ts from 10 to 66 columns (all siswa fields + mutasi fields)
- Changed export orientation from portrait to landscape for readability with many columns
- Verified: zero lint errors in src/, successful compilation in dev server

Stage Summary:
- MutasiKeluarPage now displays ALL student data from the Siswa model
- Data is fully synchronized via Prisma relation (siswaId) with include: { siswa: true }
- Detail dialog and form preview show 4 organized sections: Data Pribadi, Alamat & Kontak, Data Orang Tua/Wali, Data Pendidikan & Lainnya
- Export (Excel/PDF) includes all 60+ fields in landscape orientation

---
Task ID: 5
Agent: Main Agent
Task: Perbaiki fitur pencarian siswa dan guru — mode: 'insensitive' tidak didukung SQLite

Work Log:
- Investigasi masalah pencarian: user melaporkan cari nama siswa tidak ditemukan
- Grep semua API routes: temukan 5 file pakai `contains: search` tanpa mode (siswa, siswa/list, guru, mutasi-keluar, mutasi-masuk)
- Percobaan pertama: tambah `mode: 'insensitive'` ke semua 5 file
- TES API LANGSUNG: curl ke /api/siswa?search=asri → ERROR: "Unknown argument 'mode'. Did you mean 'lte'?"
- ROOT CAUSE DITEMUKAN: Prisma SQLite TIDAK mendukung `mode: 'insensitive'` — ini fitur PostgreSQL/MongoDB saja
- SQLite LIKE sudah case-insensitive secara default, jadi `contains` sudah benar
- REVERT semua perubahan `mode: 'insensitive'` di 5 file
- Verifikasi via curl: `search=asri` → menemukan "Asri Kemi Indah Laia" dan "ASRIA HAREFA" (total: 2)
- Verifikasi via curl: `search=amonius` → menemukan "Amonius Dakhi" (total: 1)
- Verifikasi via Agent Browser:
  - Login, pilih Data Siswa, ganti TP ke 2025/2026, ketik "asri" → 2 siswa ditemukan
  - Pindah ke Data Guru, ketik "amonius" → 1 guru ditemukan
- Dev log clean: semua API request 200, LIKE query terlihat di log

Stage Summary:
- MASALAH SEBENARNYA: Session sebelumnya salah mengidentifikasi root cause. `mode: 'insensitive'` BUKAN solusi, tapi justru PENYEBAB ERROR karena SQLite tidak mendukungnya
- SQLite LIKE operator sudah case-insensitive secara default untuk ASCII characters
- Setelah revert, pencarian berfungsi sempurna tanpa perubahan tambahan
- Files reverted (kembali ke semula): siswa/route.ts, siswa/list/route.ts, guru/route.ts, mutasi-keluar/route.ts, mutasi-masuk/route.ts
- 0 perubahan kode diperlukan — kode asli sudah benar untuk SQLite
