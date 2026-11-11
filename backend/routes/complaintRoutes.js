const express = require("express");
const router = express.Router();
const prisma = require("../db");

// 1. Get Complaints
router.get("/", async (req, res) => {
  try {
    const { userId, status, priority } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = complaints.map(c => ({
      id: c.id,
      category: c.category,
      subject: c.subject,
      description: c.description,
      priority: c.priority,
      status: c.status,
      adminResolution: c.adminResolution,
      resolvedAt: c.resolvedAt,
      createdAt: c.createdAt,
      raisedBy: c.user.name,
      raisedByEmail: c.user.email,
      raisedByRole: c.user.role
    }));

    res.json({ success: true, complaints: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Submit New Complaint / Grievance
router.post("/", async (req, res) => {
  try {
    const { userId, category, subject, description, priority } = req.body;

    if (!userId || !subject || !description) {
      return res.status(400).json({ success: false, message: "userId, subject, and description are required." });
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId,
        category: category || "Academics",
        subject,
        description,
        priority: priority || "MEDIUM",
        status: "OPEN"
      },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: "Grievance submitted successfully. Admin / Proctor committee notified.",
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Resolve / Update Status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResolution } = req.body;

    const data = {};
    if (status) data.status = status;
    if (adminResolution) data.adminResolution = adminResolution;
    if (status === "RESOLVED") data.resolvedAt = new Date();

    const complaint = await prisma.complaint.update({
      where: { id },
      data,
      include: {
        user: true
      }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: complaint.userId,
        title: `Grievance Status: ${complaint.status}`,
        message: `Your ticket regarding '${complaint.subject}' has been updated: ${adminResolution || complaint.status}`,
        type: complaint.status === "RESOLVED" ? "SUCCESS" : "INFO"
      }
    });

    res.json({
      success: true,
      message: `Grievance status updated to ${complaint.status}`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

