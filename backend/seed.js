const prisma = require("./db");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Seeding database with comprehensive demo data...");

  // Default hashed password for "password123"
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  // 1. Departments
  const deptCSE = await prisma.department.upsert({
    where: { code: "CSE" },
    update: {},
    create: {
      name: "Computer Science & Engineering",
      code: "CSE",
      hodName: "ullu ka patha"
    }
  });

  const deptECE = await prisma.department.upsert({
    where: { code: "ECE" },
    update: {},
    create: {
      name: "Electronics & Communication",
      code: "ECE",
      hodName: "Dr. Meenakshi Sundaram"
    }
  });

  const deptIT = await prisma.department.upsert({
    where: { code: "IT" },
    update: {},
    create: {
      name: "Information Technology",
      code: "IT",
      hodName: "Dr. Arvind Gupta"
    }
  });

  // 2. Admin User
  await prisma.user.upsert({
    where: { email: "admin@college.edu" },
    update: {},
    create: {
      name: "Dr. Ramesh Chandra",
      email: "admin@college.edu",
      password: hashedPassword,
      role: "ADMIN",
      phone: "+91 98765 00001",
      departmentId: deptCSE.id
    }
  });

  // 3. HOD User
  await prisma.user.upsert({
    where: { email: "hod.cse@college.edu" },
    update: {},
    create: {
      name: "Dr. K.V. Raman",
      email: "hod.cse@college.edu",
      password: hashedPassword,
      role: "HOD",
      phone: "+91 98765 00002",
      departmentId: deptCSE.id,
      hodProfile: {
        create: {
          departmentCode: "CSE",
          cabin: "Block A - Room 101"
        }
      }
    }
  });

  // 4. Mentors
  const mentor1User = await prisma.user.upsert({
    where: { email: "rajesh.sharma@college.edu" },
    update: {},
    create: {
      name: "Dr. Rajesh Sharma",
      email: "rajesh.sharma@college.edu",
      password: hashedPassword,
      role: "MENTOR",
      phone: "+91 98765 43210",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      departmentId: deptCSE.id,
      mentorProfile: {
        create: {
          designation: "Associate Professor",
          cabin: "Block B - Room 304",
          expertise: ["System Design", "Cloud Computing", "AI/ML", "Algorithms"],
          bio: "Senior faculty with 14 years academic and research mentorship experience.",
          maxCapacity: 20,
          departmentId: deptCSE.id
        }
      }
    },
    include: { mentorProfile: true }
  });

  const mentor2User = await prisma.user.upsert({
    where: { email: "ananya.sen@college.edu" },
    update: {},
    create: {
      name: "Prof. Ananya Sen",
      email: "ananya.sen@college.edu",
      password: hashedPassword,
      role: "MENTOR",
      phone: "+91 98765 88990",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      departmentId: deptCSE.id,
      mentorProfile: {
        create: {
          designation: "Assistant Professor",
          cabin: "Block B - Room 212",
          expertise: ["Database Systems", "Fullstack Web", "Cybersecurity"],
          bio: "Specialist in enterprise databases and web application architectures.",
          maxCapacity: 20,
          departmentId: deptCSE.id
        }
      }
    },
    include: { mentorProfile: true }
  });

  // 5. Parent User
  const parentUser = await prisma.user.upsert({
    where: { email: "sanjay.verma@example.com" },
    update: {},
    create: {
      name: "Sanjay Verma",
      email: "sanjay.verma@example.com",
      password: hashedPassword,
      role: "PARENT",
      phone: "+91 98111 22334",
      parentProfile: {
        create: {
          occupation: "Senior Officer (Govt. Services)",
          emergencyContact: "+91 98111 22334"
        }
      }
    },
    include: { parentProfile: true }
  });

  // 6. Students
  // Student 1: Aman Verma (Healthy progress, assigned to Mentor 1, linked to Parent)
  const student1User = await prisma.user.upsert({
    where: { email: "aman.verma@student.college.edu" },
    update: {},
    create: {
      name: "Aman Verma",
      email: "aman.verma@student.college.edu",
      password: hashedPassword,
      role: "STUDENT",
      phone: "+91 94150 12345",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
      departmentId: deptCSE.id,
      studentProfile: {
        create: {
          rollNo: "22CSE045",
          semester: 4,
          cgpa: 8.7,
          attendance: 88.5,
          backlogs: 0,
          isDefaulter: false,
          interests: ["Machine Learning", "Open Source", "Distributed Systems"],
          departmentId: deptCSE.id,
          mentorId: mentor1User.mentorProfile.id,
          parentId: parentUser.parentProfile.id
        }
      }
    },
    include: { studentProfile: true }
  });

  // Student 2: Priya Sharma (High risk: low attendance < 75%)
  const student2User = await prisma.user.upsert({
    where: { email: "priya.sharma@student.college.edu" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "priya.sharma@student.college.edu",
      password: hashedPassword,
      role: "STUDENT",
      phone: "+91 94150 99887",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      departmentId: deptCSE.id,
      studentProfile: {
        create: {
          rollNo: "22CSE078",
          semester: 4,
          cgpa: 6.2,
          attendance: 68.0, // < 75% -> triggers Defaulter warning!
          backlogs: 2,
          isDefaulter: true,
          interests: ["Web Design", "UI/UX"],
          departmentId: deptCSE.id,
          mentorId: mentor1User.mentorProfile.id
        }
      }
    },
    include: { studentProfile: true }
  });

  // Student 3: Rohit Kumar (ECE student assigned to Prof Ananya Sen)
  const student3User = await prisma.user.upsert({
    where: { email: "rohit.kumar@student.college.edu" },
    update: {},
    create: {
      name: "Rohit Kumar",
      email: "rohit.kumar@student.college.edu",
      password: hashedPassword,
      role: "STUDENT",
      phone: "+91 94150 55443",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      departmentId: deptECE.id,
      studentProfile: {
        create: {
          rollNo: "23ECE012",
          semester: 2,
          cgpa: 7.9,
          attendance: 82.0,
          backlogs: 0,
          isDefaulter: false,
          interests: ["Embedded Systems", "Robotics"],
          departmentId: deptECE.id,
          mentorId: mentor2User.mentorProfile.id
        }
      }
    },
    include: { studentProfile: true }
  });

  // Student 4: Om Sharma (Real User Account)
  const student4User = await prisma.user.upsert({
    where: { email: "omsharma2705@gmail.com" },
    update: {},
    create: {
      name: "Om Sharma",
      username: "om_sharma",
      email: "omsharma2705@gmail.com",
      password: hashedPassword,
      role: "STUDENT",
      phone: "7974059142",
      departmentId: deptCSE.id,
      studentProfile: {
        create: {
          rollNo: "A60205224079",
          semester: 1,
          cgpa: 8.5,
          attendance: 88.0,
          backlogs: 0,
          isDefaulter: false,
          interests: ["Fullstack Development", "AI/ML", "Web Architecture"],
          departmentId: deptCSE.id,
          mentorId: mentor1User.mentorProfile.id
        }
      }
    },
    include: { studentProfile: true }
  });

  // 7. Sessions / Meetings
  await prisma.session.create({
    data: {
      title: "Semester 4 Mid-Term Progress Review",
      agenda: "Review mid-term exam marks, discuss project ideas, and check attendance status.",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      location: "Faculty Cabin B-304",
      status: "SCHEDULED",
      mentorId: mentor1User.mentorProfile.id,
      studentId: student1User.studentProfile.id
    }
  });

  await prisma.session.create({
    data: {
      title: "Attendance & Academic Warning Counselling",
      agenda: "Address low attendance in Database Management and discuss remedial test strategy.",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      location: "Faculty Cabin B-304",
      status: "COMPLETED",
      notes: "Student cited medical issues for absence. Advised to submit doctor certificate to HOD and attend extra tutorial classes on Saturdays.",
      actionItems: ["Submit medical documents", "Attend Saturday tutorial", "Meet mentor again on 15 Nov"],
      mentorId: mentor1User.mentorProfile.id,
      studentId: student2User.studentProfile.id
    }
  });

  // 8. Monthly Feedback
  await prisma.monthlyFeedback.create({
    data: {
      month: "October 2026",
      academicRating: 5,
      behaviouralRating: 5,
      personalDevRating: 4,
      remarks: "Aman exhibits top-tier focus, good coding problem solving skills, and consistent class presence.",
      parentAcknowledged: true,
      mentorId: mentor1User.mentorProfile.id,
      studentId: student1User.studentProfile.id
    }
  });

  // 9. Student Goals
  await prisma.studentGoal.create({
    data: {
      title: "Solve 150 LeetCode Medium Problems",
      category: "Skills",
      targetDate: new Date("2026-12-31"),
      progress: 65,
      isCompleted: false,
      studentId: student1User.studentProfile.id
    }
  });

  await prisma.studentGoal.create({
    data: {
      title: "Achieve SGPA >= 8.5 in 4th Semester",
      category: "Academics",
      targetDate: new Date("2026-12-15"),
      progress: 80,
      isCompleted: false,
      studentId: student1User.studentProfile.id
    }
  });

  // 10. Sample Complaint
  await prisma.complaint.create({
    data: {
      category: "Academics",
      subject: "Clash in tutorial timings with lab schedule",
      description: "Operating Systems tutorial on Wednesday 2:00 PM clashes with Web Technologies lab slot.",
      priority: "MEDIUM",
      status: "IN_REVIEW",
      userId: student1User.id
    }
  });

  // 11. Sample Notification
  await prisma.notification.create({
    data: {
      userId: student1User.id,
      title: "Mentorship Session Scheduled",
      message: "Dr. Rajesh Sharma has scheduled a session on 'Semester 4 Mid-Term Progress Review'.",
      type: "INFO"
    }
  });

  console.log("Seeding finished successfully! All 5 roles with comprehensive data are ready.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
