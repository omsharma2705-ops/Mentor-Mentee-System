const express = require("express");
const router = express.Router();
const prisma = require("../db");
const { protect, allowRoles } = require("../middleware/auth");

// 1. Get Institution Overview Stats
router.get("/stats", async (req, res) => {
  try {
    const totalStudents = await prisma.studentProfile.count();
    const totalMentors = await prisma.mentorProfile.count();
    const activeMentees = await prisma.studentProfile.count({
      where: { mentorId: { not: null } }
    });
    const pendingAllocations = await prisma.studentProfile.count({
      where: { mentorId: null }
    });
    const totalDepartments = await prisma.department.count();
    const pendingComplaints = await prisma.complaint.count({
      where: { status: { in: ["OPEN", "IN_REVIEW"] } }
    });
    const totalDefaulters = await prisma.studentProfile.count({
      where: { isDefaulter: true }
    });

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalMentors,
        activeMentees,
        pendingRequests: pendingAllocations,
        totalDepartments,
        pendingComplaints,
        totalDefaulters
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get All Mentors with assigned student counts & details
router.get("/mentors", async (req, res) => {
  try {
    const mentors = await prisma.mentorProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        department: true,
        assignedStudents: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        _count: { select: { assignedStudents: true, sessions: true } }
      }
    });

    const formattedMentors = mentors.map(m => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      avatar: m.user.avatar,
      department: m.department ? m.department.code : "N/A",
      departmentName: m.department ? m.department.name : "N/A",
      designation: m.designation,
      cabin: m.cabin,
      expertise: m.expertise,
      bio: m.bio,
      assignedStudentsCount: m._count.assignedStudents,
      maxCapacity: m.maxCapacity,
      sessionsCount: m._count.sessions
    }));

    res.json({ success: true, mentors: formattedMentors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2b. Add / Register New Faculty Mentor
router.post("/mentors", async (req, res) => {
  try {
    const { name, email, department, designation, maxCapacity, cabin, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const bcrypt = require("bcryptjs");
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash("mentor123", 10);
      const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");

      user = await prisma.user.create({
        data: {
          name,
          email,
          username,
          password: hashedPassword,
          role: "MENTOR",
          phone: phone || "+91 98765 00000"
        }
      });
    }

    let dept = null;
    if (department) {
      dept = await prisma.department.findFirst({
        where: { OR: [{ code: department }, { name: department }] }
      });
    }

    let mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: user.id } });
    if (!mentorProfile) {
      mentorProfile = await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          designation: designation || "Assistant Professor",
          maxCapacity: Number(maxCapacity) || 20,
          cabin: cabin || "Block B - Room 204",
          departmentId: dept ? dept.id : null,
          expertise: ["Academic Mentorship", "Technical Guidance"]
        }
      });
    }

    res.json({
      success: true,
      message: `Mentor ${name} registered successfully!`,
      mentor: {
        id: mentorProfile.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        department: dept ? dept.code : "CSE",
        designation: mentorProfile.designation,
        assignedStudentsCount: 0,
        maxCapacity: mentorProfile.maxCapacity,
        cabin: mentorProfile.cabin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get All Students
router.get("/students", async (req, res) => {
  try {
    const { department, status, defaulterOnly } = req.query;

    const where = {};
    if (department && department !== "ALL") {
      where.department = { code: department };
    }
    if (defaulterOnly === "true") {
      where.isDefaulter = true;
    }
    if (status === "UNALLOCATED") {
      where.mentorId = null;
    } else if (status === "ALLOCATED") {
      where.mentorId = { not: null };
    }

    const students = await prisma.studentProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        department: true,
        mentor: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        parent: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        }
      },
      orderBy: { rollNo: "asc" }
    });

    const formatted = students.map(s => ({
      id: s.id,
      userId: s.userId,
      name: s.user.name,
      rollNo: s.rollNo,
      email: s.user.email,
      phone: s.user.phone,
      avatar: s.user.avatar,
      department: s.department ? s.department.code : "N/A",
      semester: s.semester,
      cgpa: s.cgpa,
      attendance: s.attendance,
      backlogs: s.backlogs,
      isDefaulter: s.isDefaulter || s.attendance < 75 || s.cgpa < 6.0,
      mentorId: s.mentorId,
      mentorName: s.mentor?.user ? s.mentor.user.name : "Unassigned",
      parentName: s.parent?.user ? s.parent.user.name : "Not Linked"
    }));

    res.json({ success: true, students: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3b. Enroll / Register New Student
router.post("/students", async (req, res) => {
  try {
    const { name, email, rollNo, department, semester, cgpa, attendance } = req.body;
    if (!name || !rollNo) {
      return res.status(400).json({ success: false, message: "Name and rollNo are required" });
    }

    const bcrypt = require("bcryptjs");
    const studentEmail = email || `${rollNo.toLowerCase()}@student.college.edu`;
    let user = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!user) {
      const hashedPassword = await bcrypt.hash("student123", 10);
      const username = rollNo.toLowerCase().replace(/[^a-z0-9_]/g, "");

      user = await prisma.user.create({
        data: {
          name,
          email: studentEmail,
          username,
          password: hashedPassword,
          role: "STUDENT"
        }
      });
    }

    let dept = null;
    if (department) {
      dept = await prisma.department.findFirst({
        where: { OR: [{ code: department }, { name: department }] }
      });
    }

    let studentProfile = await prisma.studentProfile.findFirst({
      where: { OR: [{ userId: user.id }, { rollNo }] }
    });

    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          rollNo,
          semester: Number(semester) || 1,
          cgpa: parseFloat(cgpa) || 8.0,
          attendance: parseFloat(attendance) || 85.0,
          departmentId: dept ? dept.id : null
        }
      });
    }

    res.json({
      success: true,
      message: `Student ${name} enrolled successfully!`,
      student: {
        id: studentProfile.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        rollNo: studentProfile.rollNo,
        department: dept ? dept.code : "CSE",
        semester: `${studentProfile.semester}th Semester`,
        cgpa: studentProfile.cgpa,
        attendance: studentProfile.attendance,
        status: "Unassigned",
        mentorName: "Unassigned"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Manual Student-Mentor Allocation (flexible ID / userId / email resolution)
router.post("/allocate", async (req, res) => {
  try {
    const { studentId, mentorId } = req.body;

    if (!studentId || !mentorId) {
      return res.status(400).json({ success: false, message: "studentId and mentorId are required." });
    }

    // Find mentor by id, userId, or user email
    const mentor = await prisma.mentorProfile.findFirst({
      where: {
        OR: [
          { id: mentorId },
          { userId: mentorId },
          { user: { email: mentorId } }
        ]
      },
      include: {
        user: true,
        _count: { select: { assignedStudents: true } }
      }
    });

    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found in database." });
    }

    // Find student by id, userId, rollNo, or user email
    const student = await prisma.studentProfile.findFirst({
      where: {
        OR: [
          { id: studentId },
          { userId: studentId },
          { rollNo: studentId },
          { user: { email: studentId } }
        ]
      },
      include: { user: true }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found in database." });
    }

    const updatedStudent = await prisma.studentProfile.update({
      where: { id: student.id },
      data: { mentorId: mentor.id },
      include: {
        user: true,
        mentor: { include: { user: true } }
      }
    });

    res.json({
      success: true,
      message: `Successfully allocated student ${student.user.name} to mentor ${mentor.user.name}!`,
      student: updatedStudent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Smart Auto-Allocation Algorithm
router.post("/auto-allocate", async (req, res) => {
  try {
    const { departmentCode } = req.body;

    const studentWhere = { mentorId: null };
    const mentorWhere = {};

    if (departmentCode && departmentCode !== "ALL") {
      studentWhere.department = { code: departmentCode };
      mentorWhere.department = { code: departmentCode };
    }

    // Get unallocated students
    const unallocatedStudents = await prisma.studentProfile.findMany({
      where: studentWhere,
      include: { department: true }
    });

    if (unallocatedStudents.length === 0) {
      return res.json({
        success: true,
        message: "No unallocated students found matching the criteria.",
        allocatedCount: 0
      });
    }

    // Get mentors with their current assigned student count
    const mentors = await prisma.mentorProfile.findMany({
      where: mentorWhere,
      include: {
        _count: { select: { assignedStudents: true } }
      }
    });

    if (mentors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No eligible mentors found for allocation."
      });
    }

    let allocatedCount = 0;
    const allocationPairs = [];

    // Round-robin capacity-aware allocation
    for (const student of unallocatedStudents) {
      // Find mentor with least load who hasn't exceeded maxCapacity
      const availableMentors = mentors
        .filter(m => (m._count.assignedStudents) < m.maxCapacity)
        .sort((a, b) => a._count.assignedStudents - b._count.assignedStudents);

      if (availableMentors.length === 0) {
        break; // All mentors full
      }

      const selectedMentor = availableMentors[0];
      allocationPairs.push({ studentId: student.id, mentorId: selectedMentor.id });
      selectedMentor._count.assignedStudents += 1;
      allocatedCount += 1;
    }

    // Perform database updates
    await prisma.$transaction(
      allocationPairs.map(pair =>
        prisma.studentProfile.update({
          where: { id: pair.studentId },
          data: { mentorId: pair.mentorId }
        })
      )
    );

    res.json({
      success: true,
      message: `Smart Auto-Allocation completed successfully: ${allocatedCount} students allocated.`,
      allocatedCount,
      remainingUnallocated: unallocatedStudents.length - allocatedCount
    });
  } catch (error) {
    console.error("Auto allocation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Departments list
router.get("/departments", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { mentors: true, students: true } }
      }
    });

    const formatted = departments.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      hod: d.hodName || "Faculty In-Charge",
      mentorsCount: d._count.mentors,
      studentsCount: d._count.students
    }));

    res.json({ success: true, departments: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

