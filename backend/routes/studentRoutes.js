const express = require("express");
const router = express.Router();
const prisma = require("../db");

// 1. Get Student Full Academic & Mentorship Profile
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check by studentProfile id or userId
    const student = await prisma.studentProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }]
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        department: true,
        mentor: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
            department: true
          }
        },
        parent: {
          include: {
            user: { select: { name: true, email: true, phone: true } }
          }
        },
        sessions: {
          orderBy: { date: "desc" },
          take: 10
        },
        feedbacks: {
          orderBy: { createdAt: "desc" }
        },
        goals: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Update Student Academics & Attendance (with automatic Defaulter calculation)
router.patch("/:id/academics", async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance, cgpa, backlogs, semester } = req.body;

    const current = await prisma.studentProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });

    if (!current) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const newAttendance = attendance !== undefined ? parseFloat(attendance) : current.attendance;
    const newCgpa = cgpa !== undefined ? parseFloat(cgpa) : current.cgpa;
    const newBacklogs = backlogs !== undefined ? parseInt(backlogs) : current.backlogs;
    const newSemester = semester !== undefined ? parseInt(semester) : current.semester;

    // Defaulter condition: Attendance < 75% OR CGPA < 6.0 OR Backlogs >= 3
    const isDefaulter = newAttendance < 75.0 || newCgpa < 6.0 || newBacklogs >= 3;

    const updated = await prisma.studentProfile.update({
      where: { id: current.id },
      data: {
        attendance: newAttendance,
        cgpa: newCgpa,
        backlogs: newBacklogs,
        semester: newSemester,
        isDefaulter
      },
      include: {
        user: true,
        mentor: { include: { user: true } }
      }
    });

    // If student just became a defaulter, notify mentor & student
    if (isDefaulter && !current.isDefaulter) {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          title: "Academic Defaulter Warning",
          message: `Your attendance (${newAttendance}%) or CGPA (${newCgpa}) has breached the academic threshold. Please schedule a mandatory meeting with your mentor.`,
          type: "ALERT"
        }
      });

      if (updated.mentor?.userId) {
        await prisma.notification.create({
          data: {
            userId: updated.mentor.userId,
            title: "Student Flagged as High Risk",
            message: `Mentee ${updated.user.name} (Roll: ${updated.rollNo}) has dropped below academic attendance/CGPA threshold.`,
            type: "ALERT"
          }
        });
      }
    }

    res.json({
      success: true,
      message: "Academic metrics updated successfully.",
      student: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Goals Management
router.get("/:id/goals", async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.studentProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });

    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    const goals = await prisma.studentGoal.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/:id/goals", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, targetDate, progress } = req.body;

    const student = await prisma.studentProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });

    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    const goal = await prisma.studentGoal.create({
      data: {
        studentId: student.id,
        title,
        category: category || "Academics",
        targetDate: targetDate ? new Date(targetDate) : null,
        progress: progress ? parseInt(progress) : 0
      }
    });

    res.status(201).json({ success: true, message: "Goal created successfully.", goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/goals/:goalId", async (req, res) => {
  try {
    const { goalId } = req.params;
    const { progress, isCompleted } = req.body;

    const data = {};
    if (progress !== undefined) data.progress = parseInt(progress);
    if (isCompleted !== undefined) data.isCompleted = Boolean(isCompleted);

    const goal = await prisma.studentGoal.update({
      where: { id: goalId },
      data
    });

    res.json({ success: true, message: "Goal updated successfully.", goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

