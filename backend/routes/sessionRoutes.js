const express = require("express");
const router = express.Router();
const prisma = require("../db");

// 1. Get Sessions (with filters)
router.get("/", async (req, res) => {
  try {
    const { mentorId, studentId, status } = req.query;

    const where = {};
    if (mentorId) where.mentorId = mentorId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const sessions = await prisma.session.findMany({
      where,
      include: {
        mentor: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }
          }
        }
      },
      orderBy: { date: "asc" }
    });

    const formatted = sessions.map(s => ({
      id: s.id,
      title: s.title,
      agenda: s.agenda,
      date: s.date,
      location: s.location,
      status: s.status,
      notes: s.notes,
      actionItems: s.actionItems,
      feedback: s.feedback,
      mentorId: s.mentorId,
      mentorName: s.mentor.user.name,
      mentorEmail: s.mentor.user.email,
      studentId: s.studentId,
      menteeName: s.student.user.name,
      menteeEmail: s.student.user.email,
      menteeAvatar: s.student.user.avatar,
      createdAt: s.createdAt
    }));

    res.json({ success: true, sessions: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Schedule New Session
router.post("/", async (req, res) => {
  try {
    const { title, agenda, date, location, mentorId, studentId } = req.body;

    if (!title || !date || !mentorId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "title, date, mentorId, and studentId are required fields."
      });
    }

    const session = await prisma.session.create({
      data: {
        title,
        agenda: agenda || "",
        date: new Date(date),
        location: location || "Faculty Cabin",
        mentorId,
        studentId,
        status: "SCHEDULED"
      },
      include: {
        mentor: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    // Also trigger notification for student
    await prisma.notification.create({
      data: {
        userId: session.student.userId,
        title: "New Session Scheduled",
        message: `Mentorship session '${title}' scheduled on ${new Date(date).toLocaleDateString()} with ${session.mentor.user.name}.`,
        type: "INFO"
      }
    });

    res.status(201).json({
      success: true,
      message: "Session scheduled successfully",
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Update Session Status (Complete / Cancel / Reschedule)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, location } = req.body;

    const data = {};
    if (status) data.status = status;
    if (date) data.date = new Date(date);
    if (location) data.location = location;

    const session = await prisma.session.update({
      where: { id },
      data,
      include: {
        mentor: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    res.json({
      success: true,
      message: `Session updated to ${session.status}`,
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Add Minutes of Meeting (MoM) & Action Items
router.post("/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, actionItems, feedback } = req.body;

    const session = await prisma.session.update({
      where: { id },
      data: {
        notes: notes || "",
        actionItems: Array.isArray(actionItems) ? actionItems : [],
        feedback: feedback || "",
        status: "COMPLETED"
      },
      include: {
        mentor: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    // Notify student about meeting minutes
    await prisma.notification.create({
      data: {
        userId: session.student.userId,
        title: "Meeting Minutes (MoM) Uploaded",
        message: `Your mentor ${session.mentor.user.name} added meeting notes & action items for session: '${session.title}'.`,
        type: "SUCCESS"
      }
    });

    res.json({
      success: true,
      message: "Meeting Minutes (MoM) & Action Items saved successfully.",
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

