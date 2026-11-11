const express = require("express");
const router = express.Router();
const prisma = require("../db");

// 1. Get Feedback
router.get("/", async (req, res) => {
  try {
    const { studentId, mentorId } = req.query;

    const where = {};
    if (studentId) where.studentId = studentId;
    if (mentorId) where.mentorId = mentorId;

    const feedbacks = await prisma.monthlyFeedback.findMany({
      where,
      include: {
        mentor: { include: { user: { select: { name: true, email: true } } } },
        student: { include: { user: { select: { name: true, email: true, rollNo: false } } } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Submit Monthly Feedback (by Mentor)
router.post("/", async (req, res) => {
  try {
    const { mentorId, studentId, month, academicRating, behaviouralRating, personalDevRating, remarks } = req.body;

    if (!mentorId || !studentId || !remarks) {
      return res.status(400).json({ success: false, message: "mentorId, studentId, and remarks are required." });
    }

    const feedback = await prisma.monthlyFeedback.create({
      data: {
        mentorId,
        studentId,
        month: month || new Date().toLocaleString("default", { month: "long", year: "numeric" }),
        academicRating: academicRating ? parseInt(academicRating) : 5,
        behaviouralRating: behaviouralRating ? parseInt(behaviouralRating) : 5,
        personalDevRating: personalDevRating ? parseInt(personalDevRating) : 5,
        remarks
      },
      include: {
        student: { include: { user: true, parent: { include: { user: true } } } },
        mentor: { include: { user: true } }
      }
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: feedback.student.userId,
        title: "Monthly Feedback Submitted",
        message: `Your mentor ${feedback.mentor.user.name} posted your evaluation for ${feedback.month}.`,
        type: "INFO"
      }
    });

    // If parent is linked, notify parent too
    if (feedback.student.parent?.userId) {
      await prisma.notification.create({
        data: {
          userId: feedback.student.parent.userId,
          title: "New Student Progress Report",
          message: `Monthly appraisal report for ${feedback.student.user.name} is available for review.`,
          type: "INFO"
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Monthly appraisal feedback submitted successfully.",
      feedback
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Parent Acknowledgment
router.patch("/:id/acknowledge", async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await prisma.monthlyFeedback.update({
      where: { id },
      data: { parentAcknowledged: true }
    });

    res.json({
      success: true,
      message: "Feedback acknowledged by parent.",
      feedback
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

