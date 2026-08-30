# EURO – Unit Test 1 & 2 Management System
### Production-Grade Academic Evaluation & Continuous Assessment Platform

EURO is a web-based, database-driven Continuous Assessment and Unit Test 1 & 2 Examination Management System designed for engineering and diploma colleges (aligned with MSBTE/Autonomous curriculum standards).

---

## 🌟 Key Capabilities & Features

1. **Relational Database Engine (`euro_unit_test.db`)**:
   - Stores all students, faculty members, academic subjects, and examination marks in normalized SQL tables.
   - Enforces foreign keys (`PRAGMA foreign_keys = ON`), unique enrollment numbers, and academic group constraints.
   - High-performance indexing on `roll_number`, `enrollment_number`, `student_name`, `department`, `year`, `student_id`, and `subject_id`.

2. **Automated Continuous Evaluation & Analytics**:
   - **Unit Test 1 & 2 Percentages**: Automatic calculation based on configured maximum marks (e.g. 30, 20, 50, etc.).
   - **Dynamic Weighted Averages**: Normalized average calculations across tests.
   - **Performance Classification**: Categorization into *Excellent (90–100%)*, *Very Good (80–89%)*, *Good (70–79%)*, *Average (60–69%)*, *Below Average (40–59%)*, and *Poor (<40%)*.
   - **Improvement Detection**: Automated progression detection (*📈 Improved*, *📉 Declined*, *➡️ Consistent*) with score delta percentages.
   - **Dynamic Rankings**: Live dynamic class, year, and college rankings without static lock-in.

3. **Role-Based Access Control (RBAC)**:
   - **Administrator/Dean**: Roster management, curriculum catalog configuration, institution-wide analytics, and audit logging.
   - **Teacher/Subject Incharge**: Subject-specific marks entry, batch Excel imports, AI document scanning, and student counseling.

4. **Multi-Format Reporting & Export**:
   - Official formatted PDF reports with institutional headers and tabular marks.
   - Excel (`.xlsx`) and CSV spreadsheet exports.

5. **AI Academic Advisor (Gemini 3.7 Flash)**:
   - Multimodal OCR scanner for marks sheets and roster lists.
   - Pedagogical remedial recommendation engine for struggling students.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Motion animations.
- **Backend**: Node.js, Express, TypeScript (`tsx` in dev, `esbuild` bundled CJS in prod).
- **Database**: SQLite (via `sql.js` / native SQLite engine), easily portable to PostgreSQL.
- **AI Integration**: Google Gen AI SDK (`@google/genai`).

---

## 🚀 Quick Start & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```
Runs the Express + Vite server at `http://localhost:3000`.

### 3. Production Build & Execution
```bash
npm run build
npm run start
```
Bundles the client into `dist/` and the server into `dist/server.cjs`, then launches the production server at port `3000`.

---

## 🌐 Production Cloud Deployment Guide

The application is structured for zero-configuration container deployment on **Google Cloud Run**, **Render**, **Railway**, or any standard Node.js container host.

### Deploying to Render / Railway / Cloud Run

1. **Build Command**:
   ```bash
   npm run build
   ```
2. **Start Command**:
   ```bash
   npm run start
   ```
3. **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `DATABASE_PATH=euro_unit_test.db`
   - `GEMINI_API_KEY=<your_google_ai_key>`
   - `APP_URL=https://your-domain.com`

---

## 💾 Database Backup & Restore Procedure

### Backup
Download or copy `euro_unit_test.db`:
```bash
# Example backup command
cp euro_unit_test.db backups/euro_unit_test_backup_$(date +%Y%m%d_%H%M%S).db
```

### Restore
To restore from a backup snapshot:
```bash
cp backups/euro_unit_test_backup_YYYYMMDD_HHMMSS.db euro_unit_test.db
```

---

## 🔒 Security & Privacy

- Passwords are securely hashed with `bcryptjs`.
- Parameterized SQL queries prevent SQL injection attacks.
- Sensitive environment variables are kept server-side and never exposed to client bundles.
- Database and secret files are excluded from Git via `.gitignore`.
