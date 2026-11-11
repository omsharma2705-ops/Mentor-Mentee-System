require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./db");

// Import route modules
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const studentRoutes = require("./routes/studentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger for dev
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Home & Health Route
app.get("/", (req, res) => {
  res.json({
    name: "Digital Mentor-Mentee Governance System API",
    version: "2.0.0",
    status: "Active & Operational",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", async (req, res) => {
  try {
    // Quick DB ping
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: "Backend server and database connection are healthy.",
      status: "Running",
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database ping failed",
      error: error.message
    });
  }
});

// Mount Feature API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

// Generic Mentors & Mentees endpoints for backward compatibility
app.get("/api/mentors", async (req, res) => {
  try {
    const mentors = await prisma.mentorProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, phone: true } },
        assignedStudents: true,
        sessions: true
      }
    });
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/mentees", async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        mentor: { include: { user: true } },
        sessions: true
      }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Mentor-Mentee API Server running on http://localhost:${PORT}`);
});
