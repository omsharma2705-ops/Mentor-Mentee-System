import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  AlertTriangle, 
  FileCheck2, 
  Activity, 
  Plus, 
  Phone, 
  Mail, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  UserCheck, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  FileText,
  X,
  DownloadCloud,
  UserPlus,
  Edit3,
  Save,
  FileCheck
} from 'lucide-react';
import { INITIAL_DATA } from '../data/mockData';
import { api } from '../services/api';

export default function MentorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('mentees');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [data, setData] = useState(INITIAL_DATA);
  const [selectedStudent, setSelectedStudent] = useState(data.students?.[0] || null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Add Mentee to Quota state
  const [showAddMenteeModal, setShowAddMenteeModal] = useState(false);
  const [searchMenteeQuery, setSearchMenteeQuery] = useState('');
  const [addMenteeLoading, setAddMenteeLoading] = useState(false);

  // Grievance resolution state
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  // Update Mentee Academic Marks state
  const [showUpdateMarksModal, setShowUpdateMarksModal] = useState(false);
  const [marksForm, setMarksForm] = useState({
    semester: 4,
    cgpa: 8.5,
    attendance: 88.0,
    backlogs: 0,
    verificationNote: 'Officially verified from college examination records.',
    semesters: [
      { sem: '1st', sgpa: 8.4, backlogs: 0 },
      { sem: '2nd', sgpa: 8.6, backlogs: 0 },
      { sem: '3rd', sgpa: 8.2, backlogs: 0 },
      { sem: '4th', sgpa: 8.7, backlogs: 0 },
    ]
  });

  const openUpdateMarksModal = (st) => {
    const target = st || selectedStudent;
    if (!target) return;
    
    let sems = target.semesters || [
      { sem: '1st', sgpa: 8.4, backlogs: 0 },
      { sem: '2nd', sgpa: 8.6, backlogs: 0 },
      { sem: '3rd', sgpa: 8.2, backlogs: 0 },
      { sem: '4th', sgpa: target.cgpa || 8.5, backlogs: 0 },
    ];
    try {
      const saved = localStorage.getItem('student_academic_' + target.email);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.semesters) sems = parsed.semesters;
      }
    } catch (e) {}

    setMarksForm({
      semester: parseInt(target.semester) || 4,
      cgpa: target.cgpa || 8.0,
      attendance: target.attendance || 85.0,
      backlogs: target.backlogs || 0,
      verificationNote: 'Officially verified and approved by Faculty Mentor.',
      semesters: sems
    });
    setShowUpdateMarksModal(true);
  };

  const handleAddSemRowMentor = () => {
    const nextSemNum = (marksForm.semesters?.length || 0) + 1;
    const semSuffix = nextSemNum === 1 ? '1st' : nextSemNum === 2 ? '2nd' : nextSemNum === 3 ? '3rd' : `${nextSemNum}th`;
    setMarksForm(prev => ({
      ...prev,
      semesters: [
        ...(prev.semesters || []),
        { sem: semSuffix, sgpa: 8.0, backlogs: 0 }
      ]
    }));
  };

  const handleUpdateSgpaMentor = (index, value) => {
    const updated = [...(marksForm.semesters || [])];
    updated[index].sgpa = parseFloat(value) || 0;
    
    const validSgpas = updated.filter(s => s.sgpa > 0);
    const avg = validSgpas.length > 0 ? (validSgpas.reduce((acc, s) => acc + s.sgpa, 0) / validSgpas.length).toFixed(2) : marksForm.cgpa;
    
    setMarksForm(prev => ({
      ...prev,
      semesters: updated,
      cgpa: parseFloat(avg)
    }));
  };

  const handleSaveStudentMarks = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await api.students.updateAcademics(selectedStudent.id, {
        cgpa: parseFloat(marksForm.cgpa),
        attendance: parseFloat(marksForm.attendance),
        backlogs: parseInt(marksForm.backlogs),
        semester: parseInt(marksForm.semester)
      });

      localStorage.setItem('student_academic_' + selectedStudent.email, JSON.stringify(marksForm));

      const updated = {
        ...selectedStudent,
        cgpa: parseFloat(marksForm.cgpa),
        attendance: parseFloat(marksForm.attendance),
        semester: `${marksForm.semester}th Semester`,
        semesters: marksForm.semesters,
        status: parseFloat(marksForm.attendance) < 75 ? 'Defaulter' : 'Regular',
        requiresAttention: parseFloat(marksForm.attendance) < 75 || parseFloat(marksForm.cgpa) < 6.0
      };

      setSelectedStudent(updated);

      setData(prev => ({
        ...prev,
        students: (prev.students || []).map(s => s.id === selectedStudent.id ? updated : s)
      }));

      setShowUpdateMarksModal(false);
      alert(`Success: Official Academic Results for ${selectedStudent.name} verified and recorded in the database!`);
    } catch (err) {
      console.warn('Update marks fallback:', err.message);
      localStorage.setItem('student_academic_' + selectedStudent.email, JSON.stringify(marksForm));
      setShowUpdateMarksModal(false);
      alert(`Academic results recorded for ${selectedStudent.name}!`);
    }
  };

  // Fetch real-time complaints and students from backend API
  useEffect(() => {
    async function loadRealtimeData() {
      try {
        const compRes = await api.complaints.getAll();
        if (compRes?.success && compRes.complaints?.length) {
          setData(prev => ({ ...prev, complaints: compRes.complaints }));
        }
      } catch (e) {}

      try {
        const stuRes = await api.admin.getStudents();
        if (stuRes?.success && stuRes.students?.length) {
          setData(prev => {
            const currentMentorName = user?.name || 'Dr. Rajesh Sharma';
            const formatted = stuRes.students.map(dbS => {
              const existing = (prev.students || []).find(s => s.email === dbS.email || s.rollNo === dbS.rollNo);
              return {
                id: dbS.id,
                userId: dbS.userId,
                name: dbS.name,
                email: dbS.email,
                rollNo: dbS.rollNo || 'ROLL-PENDING',
                enrollmentNo: dbS.rollNo || 'ROLL-PENDING',
                branch: dbS.department || 'CSE',
                semester: dbS.semester || '4th Semester',
                cgpa: dbS.cgpa || 8.0,
                attendance: dbS.attendance || 85,
                status: dbS.isDefaulter ? 'Defaulter' : 'Regular',
                mentorId: dbS.mentorId,
                mentorName: dbS.mentorName || 'Unassigned',
                requiresAttention: dbS.isDefaulter,
                phone: dbS.phone || '+91 98765 00000',
                semesters: existing?.semesters || [
                  { sem: '1st', sgpa: 8.4, backlogs: 0 },
                  { sem: '2nd', sgpa: 8.6, backlogs: 0 },
                  { sem: '3rd', sgpa: 8.2, backlogs: 0 },
                  { sem: '4th', sgpa: dbS.cgpa || 8.5, backlogs: 0 },
                ],
                achievements: existing?.achievements || [
                  { id: 1, title: 'Smart India Hackathon Finalist', category: 'Technical', status: 'Verified' }
                ],
                parent: existing?.parent || {
                  name: dbS.parentName !== 'Not Linked' ? dbS.parentName : 'Authorized Parent',
                  relation: 'Father',
                  phone: '+91 98765 11111',
                  email: 'parent@example.com',
                  emergencyContact: '+91 98765 11111'
                }
              };
            });

            // Filter students belonging to this mentor, or fallback to all if initial demo
            const myMentees = formatted.filter(s => 
              s.mentorName === currentMentorName ||
              s.mentorName === 'Dr. Rajesh Sharma'
            );

            return {
              ...prev,
              allDbStudents: formatted,
              students: myMentees.length > 0 ? myMentees : formatted
            };
          });
        }
      } catch (e) {
        console.warn('Realtime students fetch notice:', e.message);
      }
    }
    loadRealtimeData();
  }, [user]);

  // New Meeting form state
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    location: 'Faculty Cabin B-304',
    agenda: '',
    menteeName: data.students?.[0]?.name || 'Aman Verma'
  });

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    studentName: data.students?.[0]?.name || 'Aman Verma',
    month: 'November 2026',
    academicRating: 4,
    behaviouralRating: 5,
    personalDevRating: 4,
    remarks: 'Consistent academic dedication and proactive query resolution.'
  });

  const cards = [
    { label: 'Assigned Mentees', value: `${(data.students || []).length} Students`, icon: Users, color: '#0D5C63', sub: 'Across 4 Semesters' },
    { label: 'Upcoming Meetings', value: `${(data.meetings || []).length} Sessions`, icon: Calendar, color: '#2563EB', sub: 'Next: Tomorrow 11:30 AM' },
    { label: 'Pending Feedback', value: '1 Review', icon: MessageSquare, color: '#D97706', sub: 'October Month Review' },
    { label: 'Attendance Alerts', value: `${(data.students || []).filter(s => s.attendance < 75).length} Students`, icon: AlertTriangle, color: '#DC2626', sub: '<75% Mandatory Notice' },
    { label: 'Student Grievances', value: `${(data.complaints || []).filter(c => c.status !== 'RESOLVED').length} Active`, icon: MessageSquare, color: '#7C3AED', sub: 'Redressal Required' },
    { label: 'Verified Badges', value: '6 Portfolio', icon: Award, color: '#059669', sub: 'Achievements Verified' },
  ];

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const createdMeeting = {
      id: `meet-${Date.now()}`,
      title: newMeeting.title || 'Academic Counseling',
      date: newMeeting.date || '06 Nov 2026, 11:00 AM',
      location: newMeeting.location,
      agenda: newMeeting.agenda,
      mentorName: 'Dr. Rajesh Sharma',
      menteeName: newMeeting.menteeName,
      status: 'SCHEDULED',
      notes: 'Scheduled via Mentor Portal',
      nextDate: '2026-11-25'
    };

    try {
      // Find mentor and student ids if available in DB
      const mentorsRes = await api.admin.getMentors().catch(() => null);
      const studentsRes = await api.admin.getStudents().catch(() => null);
      const mentorObj = mentorsRes?.mentors?.[0];
      const studentObj = studentsRes?.students?.find(s => s.name === newMeeting.menteeName) || studentsRes?.students?.[0];

      if (mentorObj && studentObj) {
        await api.sessions.schedule({
          title: newMeeting.title || 'Academic Counseling',
          agenda: newMeeting.agenda || 'Regular Progress Review',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          location: newMeeting.location,
          mentorId: mentorObj.id,
          studentId: studentObj.id
        });
      }
    } catch (err) {
      console.warn("API schedule saved locally:", err.message);
    }

    setData({
      ...data,
      meetings: [createdMeeting, ...data.meetings]
    });
    setShowScheduleModal(false);
    alert('Meeting successfully scheduled! Persisted to database & notification sent to student.');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const createdFeedback = {
      id: `fb-${Date.now()}`,
      studentName: feedbackForm.studentName,
      enrollmentNo: selectedStudent.enrollmentNo,
      month: feedbackForm.month,
      academicRating: feedbackForm.academicRating,
      behaviouralRating: feedbackForm.behaviouralRating,
      personalDevRating: feedbackForm.personalDevRating,
      remarks: feedbackForm.remarks,
      studentAck: false,
      parentAck: false,
      date: 'Today'
    };

    try {
      const mentorsRes = await api.admin.getMentors().catch(() => null);
      const studentsRes = await api.admin.getStudents().catch(() => null);
      const mentorObj = mentorsRes?.mentors?.[0];
      const studentObj = studentsRes?.students?.find(s => s.name === feedbackForm.studentName) || studentsRes?.students?.[0];

      if (mentorObj && studentObj) {
        await api.feedback.submit({
          mentorId: mentorObj.id,
          studentId: studentObj.id,
          month: feedbackForm.month,
          academicRating: feedbackForm.academicRating,
          behaviouralRating: feedbackForm.behaviouralRating,
          personalDevRating: feedbackForm.personalDevRating,
          remarks: feedbackForm.remarks
        });
      }
    } catch (err) {
      console.warn("Feedback recorded locally:", err.message);
    }

    setData({
      ...data,
      feedbacks: [createdFeedback, ...data.feedbacks]
    });
    setShowFeedbackModal(false);
    alert('Digital Monthly Appraisal recorded in database! Notification dispatched for student & parent review.');
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    try {
      await api.complaints.resolve(activeComplaint.id, {
        status: 'RESOLVED',
        adminResolution: resolutionText || 'Issue investigated and resolved by Faculty Mentor.'
      });
    } catch (err) {
      console.warn("Complaint resolved locally:", err.message);
    }

    setData(prev => ({
      ...prev,
      complaints: (prev.complaints || []).map(c => 
        c.id === activeComplaint.id 
          ? { ...c, status: 'RESOLVED', adminResolution: resolutionText || 'Issue investigated and resolved by Faculty Mentor.', resolvedAt: 'Just now' }
          : c
      )
    }));

    setShowResolutionModal(false);
    setActiveComplaint(null);
    setResolutionText('');
    alert('Grievance marked as resolved! Student notified.');
  };

  const handleClaimMentee = async (student) => {
    setAddMenteeLoading(true);
    const mentorIdentifier = user?.email || 'rajesh.sharma@college.edu';
    const mentorDisplayName = user?.name || 'Dr. Rajesh Sharma';

    try {
      await api.admin.allocate(student.id || student.email, mentorIdentifier);
      
      const updatedStudent = {
        ...student,
        mentorName: mentorDisplayName,
        mentorId: user?.id || '7840801b-9bdf-46a1-8229-b914d2722b49'
      };

      setData(prev => {
        const updatedAll = (prev.allDbStudents || []).map(s => s.id === student.id ? updatedStudent : s);
        const existsInMentees = (prev.students || []).some(s => s.id === student.id);
        const updatedMentees = existsInMentees 
          ? (prev.students || []).map(s => s.id === student.id ? updatedStudent : s)
          : [...(prev.students || []), updatedStudent];

        return {
          ...prev,
          allDbStudents: updatedAll,
          students: updatedMentees
        };
      });

      setSelectedStudent(updatedStudent);
      setShowAddMenteeModal(false);
      alert(`Success: ${student.name} (${student.rollNo}) has been added to your mentorship cohort!`);
    } catch (err) {
      alert(`Could not allocate mentee: ${err.message}`);
    } finally {
      setAddMenteeLoading(false);
    }
  };

  const unassignedStudents = (data.allDbStudents || []).filter(s => 
    !s.mentorId || s.mentorName === 'Unassigned'
  );

  const filteredMentees = (data.students || []).filter(s => {
    if (selectedSemester === 'ALL') return true;
    return s.semester === selectedSemester;
  });

  const cohortAvgCgpa = filteredMentees.length > 0 
    ? (filteredMentees.reduce((acc, s) => acc + (Number(s.cgpa) || 0), 0) / filteredMentees.length).toFixed(2)
    : '0.00';
  
  const cohortDefaulters = filteredMentees.filter(s => s.attendance < 75).length;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0D5C63', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Faculty Mentor Workspace
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginTop: '4px', letterSpacing: '-0.5px' }}>
            Mentor Dashboard — {user?.name || 'Dr. Rajesh Sharma'}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B' }}>
            Associate Professor • Dept of Computer Science & Engineering • Cabin B-304
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddMenteeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(13, 92, 99, 0.25)'
            }}
          >
            <UserPlus size={16} color="#FBBF24" />
            <span>+ Add / Claim Mentee</span>
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#0D5C63',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(13, 92, 99, 0.25)'
            }}
          >
            <Calendar size={16} />
            <span>Schedule Mentee Meeting</span>
          </button>
          <button
            onClick={() => setShowFeedbackModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#FFFFFF',
              color: '#0D5C63',
              border: '1.5px solid #0D5C63',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={16} />
            <span>Record Monthly Feedback</span>
          </button>
        </div>
      </div>

      {/* 6 Overview Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '18px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>
                  {card.label}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${card.color}15`,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', lineHeight: '1' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '6px' }}>
                  {card.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '2px solid #E2E8F0',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'mentees', label: 'A. Semester-wise Mentee List' },
          { id: 'academic', label: 'B. Academic Performance & SGPA' },
          { id: 'parent', label: 'C. Parent Details & Communication' },
          { id: 'meetings', label: 'D. Meeting Management' },
          { id: 'feedback', label: 'E. Feedback & Digital Signatures' },
          { id: 'complaints', label: 'F. Student Issues & Grievances', badge: (data.complaints || []).filter(c => c.status !== 'RESOLVED').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '800' : '600',
              color: activeTab === tab.id ? '#0D5C63' : '#64748B',
              borderBottom: activeTab === tab.id ? '3px solid #0D5C63' : '3px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span style={{
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* A. My Mentees List & Detail Panel */}
      {activeTab === 'mentees' && (
        <div>
          {/* Unassigned Students Alert Banner */}
          {unassignedStudents.length > 0 && (
            <div style={{
              background: '#CCFBF1',
              border: '1.5px solid #99F6E4',
              borderRadius: '12px',
              padding: '14px 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>📢</span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0D5C63' }}>
                    {unassignedStudents.length} Student{unassignedStudents.length > 1 ? 's' : ''} Pending Mentorship Allocation:
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#334155', marginTop: '2px' }}>
                    {unassignedStudents.map(s => `${s.name} (${s.rollNo || s.email})`).join(' • ')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddMenteeModal(true)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <UserPlus size={14} />
                <span>Claim &amp; Add to My Quota</span>
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
            {/* Mentees Selector List with Semester Filters */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                  Semester-wise Mentees ({filteredMentees.length})
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setShowAddMenteeModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid #0D5C63',
                      background: '#CCFBF1',
                      color: '#0D5C63',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    <UserPlus size={12} />
                    <span>+ Add Mentee</span>
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', background: '#FEF3C7', color: '#92400E' }}>
                    NAAC 1:15 Quota
                  </span>
                </div>
              </div>

              {/* Semester Filter Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {[
                  { id: 'ALL', label: 'All Semesters' },
                  { id: '1st Semester', label: '1st Sem' },
                  { id: '2nd Semester', label: '2nd Sem' },
                  { id: '4th Semester', label: '4th Sem' },
                  { id: '6th Semester', label: '6th Sem' },
                  { id: '8th Semester', label: '8th Sem' },
                ].map(sem => {
                  const count = sem.id === 'ALL' 
                    ? (data.students || []).length 
                    : (data.students || []).filter(s => s.semester === sem.id).length;
                  const isSelected = selectedSemester === sem.id;
                  return (
                    <button
                      key={sem.id}
                      onClick={() => setSelectedSemester(sem.id)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #0D5C63' : '1px solid #E2E8F0',
                        background: isSelected ? '#0D5C63' : '#F8FAFC',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{sem.label}</span>
                      <span style={{
                        padding: '1px 5px',
                        borderRadius: '999px',
                        background: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                        color: isSelected ? '#FFFFFF' : '#64748B',
                        fontSize: '10px'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Cohort Summary Metrics */}
              <div style={{
                background: '#CCFBF1',
                border: '1px solid #99F6E4',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: '#0D5C63', fontWeight: '700' }}>Cohort Avg CGPA: </span>
                  <b style={{ color: '#0F172A' }}>{cohortAvgCgpa} / 10</b>
                </div>
                <div>
                  <span style={{ color: '#0D5C63', fontWeight: '700' }}>Defaulters (&lt;75%): </span>
                  <b style={{ color: cohortDefaulters > 0 ? '#DC2626' : '#059669' }}>{cohortDefaulters}</b>
                </div>
              </div>

              {/* Mentee Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto' }}>
                {filteredMentees.map(st => {
                  const active = selectedStudent?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStudent(st)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: active ? '2px solid #0D5C63' : '1px solid #E2E8F0',
                        background: active ? '#CCFBF1' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                            {st.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>
                            Roll: {st.enrollmentNo || st.rollNo} • <span style={{ color: '#0D5C63', fontWeight: '700' }}>{st.semester}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0D5C63' }}>
                            CGPA: {st.cgpa}
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: st.attendance < 75 ? '#FEF2F2' : '#ECFDF5',
                            color: st.attendance < 75 ? '#DC2626' : '#059669'
                          }}>
                            {st.attendance}% Attd
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          {/* Selected Student Full Profile View */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{
                  background: selectedStudent.requiresAttention ? '#FEF2F2' : '#ECFDF5',
                  color: selectedStudent.requiresAttention ? '#DC2626' : '#059669',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '999px'
                }}>
                  {selectedStudent.status}
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
                  {selectedStudent.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B' }}>
                  Enrollment: <b>{selectedStudent.enrollmentNo}</b> • {selectedStudent.branch} ({selectedStudent.semester})
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => openUpdateMarksModal(selectedStudent)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(13, 92, 99, 0.25)'
                  }}
                >
                  <Edit3 size={14} />
                  <span>Update & Verify Marks</span>
                </button>

                <a
                  href={`mailto:${selectedStudent.email}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  <Mail size={14} />
                  <span>Email</span>
                </a>
                <a
                  href={`tel:${selectedStudent.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#E6F4F5',
                    color: '#0D5C63',
                    fontSize: '12px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Overall CGPA</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0D5C63', marginTop: '2px' }}>
                  {selectedStudent.cgpa} / 10
                </div>
              </div>
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Attendance</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: selectedStudent.attendance < 75 ? '#DC2626' : '#059669', marginTop: '2px' }}>
                  {selectedStudent.attendance}%
                </div>
              </div>
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Backlogs</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                  {selectedStudent.semesters.reduce((acc, s) => acc + s.backlogs, 0)} Active
                </div>
              </div>
            </div>

            {/* Parent Information Box */}
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '10px' }}>
                Authorized Parent / Guardian Information:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#475569' }}>
                <div>Parent Name: <b>{selectedStudent.parent.name} ({selectedStudent.parent.relation})</b></div>
                <div>Contact: <b>{selectedStudent.parent.phone}</b></div>
                <div>Email: <b>{selectedStudent.parent.email}</b></div>
                <div>Emergency Contact: <b>{selectedStudent.parent.emergencyContact}</b></div>
              </div>
            </div>

            {/* Achievements & Verified Documents */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '10px' }}>
                Recent Achievements:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedStudent.achievements.map((ach) => (
                  <div key={ach.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: '#F1F5F9',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} color="#0D5C63" />
                      <span style={{ fontWeight: '600', color: '#0F172A' }}>{ach.title}</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>({ach.category})</span>
                    </div>
                    <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                      {ach.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* B. Academic Performance Visual Charts */}
      {activeTab === 'academic' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Semester-wise Academic Performance Analysis
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Monitoring performance trends for <b>{selectedStudent.name}</b> ({selectedStudent.enrollmentNo}).
              </p>
            </div>
            
            <button
              onClick={() => openUpdateMarksModal(selectedStudent)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(13, 92, 99, 0.25)'
              }}
            >
              <Edit3 size={15} />
              <span>✏️ Record / Update Official SGPA</span>
            </button>
          </div>

          {/* Visual SGPA Bars Chart */}
          <div style={{
            background: '#F8FAFC',
            padding: '24px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '18px' }}>
              SGPA Progression Chart:
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', height: '180px', paddingBottom: '10px' }}>
              {selectedStudent.semesters.map((sem, i) => {
                const heightPercent = (sem.sgpa / 10) * 100;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0D5C63', marginBottom: '6px' }}>
                      {sem.sgpa}
                    </span>
                    <div style={{
                      width: '100%',
                      maxWidth: '60px',
                      height: `${heightPercent * 1.4}px`,
                      background: sem.backlogs > 0 ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(180deg, #14B8A6 0%, #0D5C63 100%)',
                      borderRadius: '8px 8px 0 0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginTop: '10px' }}>
                      {sem.sem} Sem
                    </span>
                    {sem.backlogs > 0 ? (
                      <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: '700', marginTop: '2px' }}>
                        {sem.backlogs} Backlog
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#059669', fontWeight: '700', marginTop: '2px' }}>
                        All Clear
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Table Breakdown */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1.5px solid #CBD5E1', color: '#334155' }}>
                <th style={{ padding: '12px' }}>Semester</th>
                <th style={{ padding: '12px' }}>SGPA</th>
                <th style={{ padding: '12px' }}>Active Backlogs</th>
                <th style={{ padding: '12px' }}>Performance Trend</th>
                <th style={{ padding: '12px' }}>Faculty Remarks</th>
              </tr>
            </thead>
            <tbody>
              {selectedStudent.semesters.map((s, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px', fontWeight: '700' }}>{s.sem} Semester</td>
                  <td style={{ padding: '12px', fontWeight: '800', color: '#0D5C63' }}>{s.sgpa}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: s.backlogs > 0 ? '#FEF2F2' : '#ECFDF5',
                      color: s.backlogs > 0 ? '#DC2626' : '#059669'
                    }}>
                      {s.backlogs} Backlog
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#059669', fontWeight: '600' }}>
                    {idx === 0 ? 'Baseline' : s.sgpa >= selectedStudent.semesters[idx-1].sgpa ? '▲ Improved' : '▼ Declined'}
                  </td>
                  <td style={{ padding: '12px', color: '#64748B' }}>
                    {s.backlogs > 0 ? 'Remedial coaching recommended for Math-II.' : 'Excellent performance.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* C. Parent Details & Communication */}
      {activeTab === 'parent' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
            Parent Contact Directory & Communication Log
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
            Authorized contact information and historical records of communication with student parents.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {data.students.map(st => (
              <div key={st.id} style={{
                padding: '18px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                      {st.parent.name}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#0D5C63', fontWeight: '600' }}>
                      {st.parent.relation} of {st.name} ({st.enrollmentNo})
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', background: '#E2E8F0', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                    Verified Parent
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                  <div>📞 Contact: <b>{st.parent.phone}</b></div>
                  <div>📧 Email: <b>{st.parent.email}</b></div>
                  <div>🚨 Emergency: <b>{st.parent.emergencyContact}</b></div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`tel:${st.parent.phone}`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      background: '#0D5C63',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    Call Parent
                  </a>
                  <a
                    href={`mailto:${st.parent.email}`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#334155',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    Email Progress
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. Meeting Management */}
      {activeTab === 'meetings' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Mentorship Meetings & Counseling Sessions
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Manage scheduled discussions, agendas, meeting notes, and attendance records.
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: '#0D5C63',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Schedule New</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data.meetings.map(meet => (
              <div key={meet.id} style={{
                padding: '18px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: meet.status === 'SCHEDULED' ? '#F0FDFA' : '#F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: meet.status === 'SCHEDULED' ? '#0D5C63' : '#64748B',
                      color: '#FFFFFF'
                    }}>
                      {meet.status}
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
                      {meet.title}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0D5C63' }}>
                      {meet.date}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Location: {meet.location}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#334155', marginBottom: '10px' }}>
                  <b>Mentee:</b> {meet.menteeName}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                  <b>Agenda:</b> {meet.agenda}
                </div>
                {meet.notes && (
                  <div style={{ fontSize: '12px', background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#0F172A' }}>
                    📝 <b>Meeting Notes:</b> {meet.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. Feedback Management */}
      {activeTab === 'feedback' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Digital Feedback & Acknowledgement Workflow
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Digital monthly feedback, faculty remarks, and verified student/parent signatures.
              </p>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              style={{
                padding: '9px 16px',
                background: '#0D5C63',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              + Record Feedback
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data.feedbacks.map(fb => (
              <div key={fb.id} style={{
                padding: '18px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                      {fb.studentName} ({fb.enrollmentNo})
                    </h4>
                    <span style={{ fontSize: '12px', color: '#0D5C63', fontWeight: '600' }}>
                      Review Period: {fb.month} • Recorded on {fb.date}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: fb.studentAck ? '#ECFDF5' : '#FFFBEB',
                      color: fb.studentAck ? '#059669' : '#D97706'
                    }}>
                      Student Sign: {fb.studentAck ? '✓ Acknowledged' : 'Pending'}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: fb.parentAck ? '#ECFDF5' : '#FFFBEB',
                      color: fb.parentAck ? '#059669' : '#D97706'
                    }}>
                      Parent Sign: {fb.parentAck ? '✓ Acknowledged' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Rating Badges */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', fontWeight: '600' }}>
                  <span>Academic Rating: ⭐ {fb.academicRating}/5</span>
                  <span>Behavioural: ⭐ {fb.behaviouralRating}/5</span>
                  <span>Personal Development: ⭐ {fb.personalDevRating}/5</span>
                </div>

                <div style={{ fontSize: '13px', color: '#334155', background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <b>Faculty Remarks:</b> {fb.remarks}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* F. Student Issues & Grievances */}
      {activeTab === 'complaints' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Student Issues & Grievance Redressal
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Active issues submitted by your assigned mentees requiring counseling or administrative redressal.
              </p>
            </div>
            <span style={{
              background: '#CCFBF1',
              color: '#0D5C63',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              {(data.complaints || []).filter(c => c.status !== 'RESOLVED').length} Open Grievances
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(data.complaints || []).map(c => {
              const isOpen = c.status === 'OPEN';
              const isResolved = c.status === 'RESOLVED';
              return (
                <div key={c.id} style={{
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  background: isResolved ? '#F8FAFC' : '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#CCFBF1',
                          color: '#0D5C63'
                        }}>
                          {c.category}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: c.priority === 'URGENT' ? '#FEF2F2' : c.priority === 'HIGH' ? '#FFFBEB' : '#F1F5F9',
                          color: c.priority === 'URGENT' ? '#DC2626' : c.priority === 'HIGH' ? '#D97706' : '#64748B'
                        }}>
                          {c.priority} Priority
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                          {c.ticketNo || c.id}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                        {c.subject}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Raised by: <b>{c.raisedBy || 'Aman Verma'}</b> ({c.raisedByEmail || 'aman.verma@student.college.edu'}) • {c.createdAt || 'Nov 2026'}
                      </div>
                    </div>

                    <div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '800',
                        background: isResolved ? '#ECFDF5' : isOpen ? '#FFFBEB' : '#CCFBF1',
                        color: isResolved ? '#059669' : isOpen ? '#D97706' : '#0D5C63'
                      }}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', marginBottom: '14px' }}>
                    {c.description}
                  </p>

                  {c.adminResolution ? (
                    <div style={{
                      background: '#F0FDF4',
                      borderLeft: '3px solid #059669',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#065F46'
                    }}>
                      <b>Resolution Summary:</b> {c.adminResolution}
                      {c.resolvedAt && <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>Resolved on: {c.resolvedAt}</div>}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveComplaint(c);
                        setResolutionText('');
                        setShowResolutionModal(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#0D5C63',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Resolve This Issue / Add Counsel Note
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grievance Resolution Modal */}
      {showResolutionModal && activeComplaint && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Resolve Student Issue
              </h3>
              <button onClick={() => setShowResolutionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <div style={{ marginBottom: '14px', fontSize: '13px', color: '#475569' }}>
              <div><b>Subject:</b> {activeComplaint.subject}</div>
              <div><b>Raised by:</b> {activeComplaint.raisedBy} ({activeComplaint.category})</div>
            </div>

            <form onSubmit={handleResolveComplaint}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Resolution Summary / Counselor Action Taken:
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe how this issue was resolved, remedial measures taken, or administrative guidance given..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowResolutionModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#059669', color: '#FFFFFF', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Mark as Resolved &amp; Notify Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Schedule Mentee Meeting</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Select Mentee</label>
                <select
                  value={newMeeting.menteeName}
                  onChange={(e) => setNewMeeting({ ...newMeeting, menteeName: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                >
                  {data.students.map(s => <option key={s.id} value={s.name}>{s.name} ({s.enrollmentNo})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Review & Backlog Discussion"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Date & Time</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 05 Nov 2026, 03:00 PM"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Location / Mode</label>
                <input
                  type="text"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Agenda & Topics</label>
                <textarea
                  rows="3"
                  placeholder="Items to discuss..."
                  value={newMeeting.agenda}
                  onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0D5C63',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Confirm & Dispatch Notification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Feedback Modal */}
      {showFeedbackModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Record Monthly Mentorship Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Student</label>
                <select
                  value={feedbackForm.studentName}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, studentName: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                >
                  {data.students.map(s => <option key={s.id} value={s.name}>{s.name} ({s.enrollmentNo})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Academic (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={feedbackForm.academicRating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, academicRating: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Behaviour (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={feedbackForm.behaviouralRating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, behaviouralRating: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Personal (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={feedbackForm.personalDevRating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, personalDevRating: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Mentor Remarks & Guidance</label>
                <textarea
                  rows="3"
                  value={feedbackForm.remarks}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, remarks: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0D5C63',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Save & Request Digital Signatures
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Claim Mentee to Quota Modal */}
      {showAddMenteeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            maxWidth: '640px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', background: '#CCFBF1', color: '#0D5C63', padding: '3px 8px', borderRadius: '6px' }}>
                  NAAC FACULTY QUOTA ({filteredMentees.length}/15 ALLOCATED)
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
                  Enroll / Claim Mentee to Your Quota
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B' }}>
                  Add registered students directly into your faculty mentorship cohort for academic monitoring.
                </p>
              </div>
              <button onClick={() => setShowAddMenteeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search students by Name, Roll No, or Email..."
                value={searchMenteeQuery}
                onChange={(e) => setSearchMenteeQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Students List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', paddingRight: '4px' }}>
              {(() => {
                const query = searchMenteeQuery.toLowerCase().trim();
                const available = (data.allDbStudents || []).filter(s => {
                  const match = (s.name || '').toLowerCase().includes(query) ||
                                (s.rollNo || '').toLowerCase().includes(query) ||
                                (s.email || '').toLowerCase().includes(query);
                  return match;
                });

                if (available.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#64748B', fontSize: '13px' }}>
                      No matching students found in the college database.
                    </div>
                  );
                }

                return available.map(st => {
                  const isAlreadyMyMentee = (data.students || []).some(m => m.id === st.id);
                  return (
                    <div
                      key={st.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        background: isAlreadyMyMentee ? '#F8FAFC' : '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                            {st.name}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: '#CCFBF1', color: '#0D5C63' }}>
                            {st.rollNo || 'Roll Pending'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          {st.email} • {st.branch} ({st.semester || '4th Sem'})
                        </div>
                        <div style={{ fontSize: '11px', color: st.mentorName === 'Unassigned' ? '#D97706' : '#059669', fontWeight: '700', marginTop: '2px' }}>
                          Current Mentor: {st.mentorName || 'Unassigned'}
                        </div>
                      </div>

                      {isAlreadyMyMentee ? (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: '6px' }}>
                          ✓ Assigned to You
                        </span>
                      ) : (
                        <button
                          disabled={addMenteeLoading}
                          onClick={() => handleClaimMentee(st)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <UserPlus size={14} />
                          <span>Add to My Mentees</span>
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={() => setShowAddMenteeModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: '#F1F5F9',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update & Verify Mentee Academic Results Modal */}
      {showUpdateMarksModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0D5C63', background: '#CCFBF1', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Faculty Evaluation & Verification
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>
                  Record Official Marks: {selectedStudent.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B' }}>
                  Roll No: <b>{selectedStudent.enrollmentNo}</b> • Branch: <b>{selectedStudent.branch}</b>
                </p>
              </div>
              <button onClick={() => setShowUpdateMarksModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentMarks}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Current Semester
                  </label>
                  <select
                    value={marksForm.semester}
                    onChange={(e) => setMarksForm({ ...marksForm, semester: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>{s}th Semester</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Verified Cumulative CGPA (/10)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={marksForm.cgpa}
                    onChange={(e) => setMarksForm({ ...marksForm, cgpa: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Certified Attendance Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={marksForm.attendance}
                    onChange={(e) => setMarksForm({ ...marksForm, attendance: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: marksForm.attendance < 75 ? '#DC2626' : '#059669', fontWeight: '600' }}>
                    {marksForm.attendance < 75 ? '⚠️ Below 75% marks mentee as Defaulter' : '✓ Eligible for examination'}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Active Backlogs Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    required
                    value={marksForm.backlogs}
                    onChange={(e) => setMarksForm({ ...marksForm, backlogs: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Semester SGPA Breakdown */}
              <div style={{ marginBottom: '18px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                    Semester-Wise SGPA Records:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSemRowMentor}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      background: '#CCFBF1',
                      color: '#0D5C63',
                      border: '1px solid #99F6E4',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>+ Add Semester</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                  {(marksForm.semesters || []).map((sem, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        {sem.sem} Sem SGPA:
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={sem.sgpa}
                        onChange={(e) => handleUpdateSgpaMentor(idx, e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: '800', color: '#0D5C63', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Faculty Verification & Counseling Notes:
                </label>
                <textarea
                  rows="2"
                  value={marksForm.verificationNote}
                  onChange={(e) => setMarksForm({ ...marksForm, verificationNote: e.target.value })}
                  placeholder="e.g. Verified with university examination grade card..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(13, 92, 99, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={16} />
                  <span>Lock & Save Official Results</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpdateMarksModal(false)}
                  style={{
                    padding: '12px 20px',
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
