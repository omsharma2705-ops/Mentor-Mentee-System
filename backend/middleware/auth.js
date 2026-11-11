const jwt = require("jsonwebtoken");
const prisma = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "mentor_mentee_super_secret_jwt_key_2026";

// Protect middleware: verifies JWT token
async function protect(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided."
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
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
                user: { select: { name: true, email: true, phone: true, avatar: true } },
                mentor: { include: { user: { select: { name: true, email: true, phone: true } } } }
              }
            }
          }
        },
        hodProfile: true,
        department: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User session invalid or account deactivated."
      });
    }

    // Attach user to req
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      error: error.message
    });
  }
}

// Role-based authorization middleware
function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    // Map MENTEE to STUDENT if needed
    const userRole = req.user.role === 'MENTEE' ? 'STUDENT' : req.user.role;

    if (!allowedRoles.includes(userRole) && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]. Your role is ${req.user.role}.`
      });
    }

    next();
  };
}

module.exports = {
  protect,
  allowRoles,
  JWT_SECRET
};

