const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");
const { protect, JWT_SECRET } = require("../middleware/auth");

// Token generator helper
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// 1. Login (accepts either email OR username)
router.post("/login", async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;
    const lookup = (identifier || email || username || "").toLowerCase().trim();

    if (!lookup || !password) {
      return res.status(400).json({ success: false, message: "Please provide your email/username and password." });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lookup },
          { username: lookup }
        ]
      },
      include: {
        department: true,
        mentorProfile: true,
        studentProfile: {
          include: {
            mentor: { include: { user: { select: { name: true, email: true, phone: true } } } }
          }
        },
        parentProfile: {
          include: {
            students: {
              include: {
                user: { select: { name: true, email: true, avatar: true } },
                mentor: { include: { user: { select: { name: true, email: true } } } }
              }
            }
          }
        },
        hodProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email/username or password." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email/username or password." });
    }

    const token = generateToken(user);

    // Sanitize user object (omit password)
    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userSafe
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error during login.", error: error.message });
  }
});

// 2. Register (choose own name, username, email, password, and role)
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password, role, phone, departmentCode, rollNo, designation, bio, expertise } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username ? username.toLowerCase().trim() : cleanEmail.split("@")[0].replace(/[^a-z0-9._-]/g, "")).trim();

    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email is already registered. Please sign in instead." });
    }

    if (cleanUsername) {
      const existingUsername = await prisma.user.findFirst({ where: { username: cleanUsername } });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: `Username "${cleanUsername}" is already taken. Please choose another username.` });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let dept = null;
    if (departmentCode) {
      dept = await prisma.department.findUnique({ where: { code: departmentCode.toUpperCase() } });
    }

    const assignedRole = role || "STUDENT";

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername || null,
        email: cleanEmail,
        password: hashedPassword,
        role: assignedRole,
        phone: phone || null,
        departmentId: dept ? dept.id : null,
        ...(assignedRole === "MENTOR" && {
          mentorProfile: {
            create: {
              designation: designation || "Assistant Professor",
              bio: bio || "",
              expertise: expertise || [],
              departmentId: dept ? dept.id : null
            }
          }
        }),
        ...(assignedRole === "STUDENT" && {
          studentProfile: {
            create: {
              rollNo: rollNo || `ROLL-${Date.now().toString().slice(-6)}`,
              departmentId: dept ? dept.id : null
            }
          }
        }),
        ...(assignedRole === "PARENT" && {
          parentProfile: {
            create: {}
          }
        }),
        ...(assignedRole === "HOD" && {
          hodProfile: {
            create: {
              departmentCode: departmentCode || "CSE"
            }
          }
        })
      },
      include: {
        department: true,
        mentorProfile: true,
        studentProfile: true,
        parentProfile: true,
        hodProfile: true
      }
    });

    const token = generateToken(newUser);
    const { password: _, ...userSafe } = newUser;

    res.status(201).json({
      success: true,
      message: "Account registered successfully",
      token,
      user: userSafe
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Registration failed.", error: error.message });
  }
});

// 3. Get Current User Profile (me)
router.get("/me", protect, async (req, res) => {
  const { password: _, ...userSafe } = req.user;
  res.json({
    success: true,
    user: userSafe
  });
});

// 4. Quick Demo Switch (for demo presentations)
router.post("/quick-demo", async (req, res) => {
  try {
    const { role } = req.body;
    const targetRole = role ? role.toUpperCase() : "MENTOR";

    const user = await prisma.user.findFirst({
      where: { role: targetRole },
      include: {
        department: true,
        mentorProfile: true,
        studentProfile: {
          include: {
            mentor: { include: { user: { select: { name: true, email: true, phone: true } } } }
          }
        },
        parentProfile: {
          include: {
            students: {
              include: {
                user: { select: { name: true, email: true, avatar: true } },
                mentor: { include: { user: { select: { name: true, email: true } } } }
              }
            }
          }
        },
        hodProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: `No demo user found for role ${targetRole}` });
    }

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      token,
      user: userSafe
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

