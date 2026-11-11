# 🎓 Mentor-Mentee Management System

A full-stack, enterprise-grade academic mentoring portal designed for engineering colleges and universities (NAAC & NBA compliant). Built with **React 19**, **Vite**, **Express.js**, and styled with modern **Nordic Emerald & Sage (Theme 3)** aesthetics.

---

## 🌟 Key Features

### 👨‍🏫 Faculty Mentor Portal
- **Semester-wise Mentee Directory**: Filter mentees by semester (Semester 1 to 8), track CGPA, attendance, and backlogs in real time.
- **Academic Marks Governance**: Mentors officially verify and update student academic records, certifying attendance %, CGPA, and semester-wise SGPA history.
- **Intervention & Defaulter Tracking**: Auto-flag students with attendance below 75% or active academic backlogs.
- **Mentoring Meeting Logs**: Schedule, track, and log official 1-on-1 and group mentoring sessions.
- **Grievance Resolution**: Respond to student issues with verified status transitions (Pending, In Progress, Resolved).

### 🎓 Student / Mentee Portal
- **Academic Dashboard**: View official, mentor-verified CGPA, attendance, and semester results.
- **Official Marksheet Submission**: Upload grade cards and request verified academic updates from faculty mentors.
- **Grievance & Issue Submission**: Raise academic, hostel, fee, or technical complaints with auto-generated tracking IDs.
- **Digital Portfolio**: Record certifications, research publications, awards, internships, and extracurricular achievements.

### 🏛️ Department / Admin Portal
- **System-wide Analytics**: High-level overview of total mentors, mentees, meetings, and pending grievances.
- **Batch Mentor Allocation**: Assign students to faculty mentors.
- **Academic Governance**: Monitor mentor compliance and generate NAAC/NBA audit reports.

---

## 🎨 Theme & UI Design
- **Theme**: *Nordic Emerald & Sage*
- **Primary Palette**:
  - Deep Emerald: `#0D5C63`
  - Mint / Teal Accent: `#14B8A6`
  - Mint Glow Background: `#CCFBF1`
  - Surface Background: `#F6F9F8`
  - Card & Container Surface: `#FFFFFF`
  - Borders: `#E0EBE9` / `#E2E8F0`

---

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express.js, CORS, Multer (File uploads)
- **Database / Mock Engine**: Express in-memory & file-persisted mock state with relational integrity (Students, Mentors, Meetings, Grievances, Notifications)

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/omsharma2705-ops/Mentor-Mentee-System.git
cd Mentor-Mentee-System
```

Install root, backend, and frontend dependencies:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Running the Application

Run both frontend and backend concurrently:
```bash
# Start backend API (Port 5000)
cd backend
npm start

# In a separate terminal, start frontend dev server (Port 5173)
cd frontend
npm run dev
```

Visit the app in your browser at `http://localhost:5173`.

---

## 👥 Default Demo Credentials

| Role | Username / Email | Password |
|---|---|---|
| **Admin** | `admin` / `admin@amity.edu` | `admin123` |
| **Faculty Mentor** | `rajesh` / `rajesh.sharma@amity.edu` | `mentor123` |
| **Student** | `om.sharma` / `om.sharma@amity.edu` | `student123` |

---

## 📄 License
MIT License. Developed for University Academic Mentoring Systems.
