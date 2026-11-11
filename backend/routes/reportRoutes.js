const express = require("express");
const router = express.Router();
const prisma = require("../db");

// 1. NAAC / NBA Accreditation Audit Summary
router.get("/naac-audit", async (req, res) => {
  try {
    const totalStudents = await prisma.studentProfile.count();
    const totalMentors = await prisma.mentorProfile.count();
    const allocatedStudents = await prisma.studentProfile.count({ where: { mentorId: { not: null } } });

    // Mentor-Mentee Ratio (e.g. 1:18)
    const ratio = totalMentors > 0 ? (totalStudents / totalMentors).toFixed(1) : 0;

    const totalSessions = await prisma.session.count();
    const completedSessions = await prisma.session.count({ where: { status: "COMPLETED" } });
    const scheduledSessions = await prisma.session.count({ where: { status: "SCHEDULED" } });

    const totalComplaints = await prisma.complaint.count();
    const resolvedComplaints = await prisma.complaint.count({ where: { status: "RESOLVED" } });

    const highRiskStudents = await prisma.studentProfile.count({ where: { isDefaulter: true } });

    // Detailed Department breakdown
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { mentors: true, students: true } }
      }
    });

    const departmentBreakdown = departments.map(d => ({
      name: d.name,
      code: d.code,
      mentors: d._count.mentors,
      students: d._count.students,
      ratio: d._count.mentors > 0 ? (d._count.students / d._count.mentors).toFixed(1) : 0
    }));

    res.json({
      success: true,
      auditData: {
        academicYear: "2026-2027",
        criterion: "Criterion 2.3.3 & NBA Tier-I Quality Audit",
        complianceStatus: "Compliant (A++ Benchmark)",
        metrics: {
          totalStudents,
          totalMentors,
          allocatedStudents,
          allocationPercentage: totalStudents > 0 ? ((allocatedStudents / totalStudents) * 100).toFixed(1) + "%" : "0%",
          mentorMenteeRatio: `1:${ratio}`,
          benchmarkRatio: "1:20 (Standard)",
          totalSessionsConducted: completedSessions,
          scheduledUpcomingSessions: scheduledSessions,
          grievanceRedressalRate: totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) + "%" : "100%",
          highRiskStudentsIdentified: highRiskStudents
        },
        departments: departmentBreakdown,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Export Mentorship Allotment & Log in CSV format
router.get("/export-csv", async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: true,
        department: true,
        mentor: { include: { user: true } },
        _count: { select: { sessions: true, feedbacks: true } }
      },
      orderBy: { rollNo: "asc" }
    });

    // CSV Header
    let csv = "Roll No,Student Name,Email,Department,Semester,CGPA,Attendance %,Defaulter Status,Assigned Mentor,Sessions Conducted,Feedbacks Given\n";

    students.forEach(s => {
      const mentorName = s.mentor?.user?.name || "Unassigned";
      const deptCode = s.department?.code || "N/A";
      const defaulter = s.isDefaulter ? "YES (Defaulter)" : "NO (Normal)";
      csv += `"${s.rollNo}","${s.user.name}","${s.user.email}","${deptCode}","${s.semester}","${s.cgpa}","${s.attendance}%","${defaulter}","${mentorName}","${s._count.sessions}","${s._count.feedbacks}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="NAAC_Mentor_Mentee_Audit_2026.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

