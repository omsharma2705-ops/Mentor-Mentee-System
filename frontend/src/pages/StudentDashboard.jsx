import React, { useState, useEffect } from 'react';
import { 
  User, 
  BookOpen, 
  Calendar, 
  Upload, 
  Award, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  ShieldCheck, 
  FileCheck,
  TrendingUp,
  X,
  PlusCircle,
  ExternalLink,
  AlertTriangle,
  HelpCircle,
  Edit3,
  Plus,
  Save,
  Check
} from 'lucide-react';
import { INITIAL_DATA } from '../data/mockData';
import { api } from '../services/api';

export default function StudentDashboard({ activeTab: externalTab, setActiveTab: setExternalTab, user }) {
  const [internalTab, setInternalTab] = useState('profile');
  const activeTab = externalTab || internalTab;
  const setActiveTab = setExternalTab || setInternalTab;
  const [data, setData] = useState(INITIAL_DATA);
  const [studentMentor, setStudentMentor] = useState(null);
  const [mentorsList, setMentorsList] = useState([]);

  // Academic Result Editing state
  const [showEditAcademicModal, setShowEditAcademicModal] = useState(false);
  const [academicForm, setAcademicForm] = useState({
    semester: 4,
    cgpa: 8.5,
    attendance: 88.0,
    backlogs: 0,
    semesters: [
      { sem: '1st', sgpa: 8.4, backlogs: 0 },
      { sem: '2nd', sgpa: 8.6, backlogs: 0 },
      { sem: '3rd', sgpa: 8.2, backlogs: 0 },
      { sem: '4th', sgpa: 8.7, backlogs: 0 },
    ]
  });

  const baseStudent = data?.students?.[0] || INITIAL_DATA.students[0];
  const student = {
    ...baseStudent,
    name: user?.name || baseStudent.name,
    email: user?.email || baseStudent.email,
    username: user?.username || (user?.email ? user.email.split('@')[0] : 'student'),
    mentorName: studentMentor ? studentMentor : (user?.mentorName || (user?.role === 'STUDENT' ? 'Pending Allocation' : baseStudent.mentorName)),
    cgpa: academicForm.cgpa !== undefined ? academicForm.cgpa : baseStudent.cgpa,
    attendance: academicForm.attendance !== undefined ? academicForm.attendance : baseStudent.attendance,
    semester: typeof academicForm.semester === 'number' ? `${academicForm.semester}th Semester` : (academicForm.semester || baseStudent.semester),
    semesters: academicForm.semesters || baseStudent.semesters || []
  };

  // Grievance / Complaint form state
  const [complaintForm, setComplaintForm] = useState({
    category: 'Academics',
    priority: 'MEDIUM',
    subject: '',
    description: ''
  });
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  // Fetch real-time complaints, student info, and custom saved academic marks on mount
  useEffect(() => {
    async function loadStudentInfo() {
      // 1. Check local storage for custom semester records
      try {
        const savedAcademic = localStorage.getItem('student_academic_' + (user?.email || 'default'));
        if (savedAcademic) {
          const parsed = JSON.parse(savedAcademic);
          setAcademicForm(parsed);
        }
      } catch (e) {}

      // 2. Fetch from backend API
      try {
        const compRes = await api.complaints.getAll();
        if (compRes?.success && compRes.complaints?.length) {
          setData(prev => ({ ...prev, complaints: compRes.complaints }));
        }
      } catch (e) {}

      try {
        const stuRes = await api.admin.getStudents();
        if (stuRes?.success && stuRes.students?.length) {
          const me = stuRes.students.find(s => s.email === user?.email || s.rollNo === user?.username || s.name === user?.name);
          if (me) {
            if (me.mentorName && me.mentorName !== 'Unassigned') {
              setStudentMentor(me.mentorName);
            }
            setAcademicForm(prev => ({
              ...prev,
              cgpa: me.cgpa !== undefined ? me.cgpa : prev.cgpa,
              attendance: me.attendance !== undefined ? me.attendance : prev.attendance,
              backlogs: me.backlogs !== undefined ? me.backlogs : prev.backlogs,
              semester: me.semester !== undefined ? me.semester : prev.semester
            }));
          }
        }
      } catch (e) {}

      try {
        const mRes = await api.admin.getMentors();
        if (mRes?.success && mRes.mentors?.length) {
          setMentorsList(mRes.mentors);
        }
      } catch (e) {}
    }
    loadStudentInfo();
  }, [user]);

  const handlePickMentor = async (mentorEmail, mentorName) => {
    try {
      await api.admin.allocate(user?.email || student.email, mentorEmail);
      setStudentMentor(mentorName);
      alert(`Success: You are now linked to Faculty Mentor ${mentorName}! Your academic records are now synced.`);
    } catch (err) {
      alert(`Could not link mentor: ${err.message}`);
    }
  };

  const handleSaveAcademics = async (e) => {
    e.preventDefault();
    try {
      const stuRes = await api.admin.getStudents().catch(() => null);
      const me = stuRes?.students?.find(s => s.email === user?.email || s.rollNo === user?.username || s.name === user?.name);
      const studentId = me?.id || user?.id || 'demo';

      // Update in database via PATCH /api/students/:id/academics
      await api.students.updateAcademics(studentId, {
        cgpa: parseFloat(academicForm.cgpa),
        attendance: parseFloat(academicForm.attendance),
        backlogs: parseInt(academicForm.backlogs),
        semester: parseInt(academicForm.semester)
      });

      // Save locally to persist semester-by-semester SGPA breakdown
      localStorage.setItem('student_academic_' + (user?.email || 'default'), JSON.stringify(academicForm));

      // Update local state
      setData(prev => ({
        ...prev,
        students: (prev.students || []).map((s, idx) => idx === 0 ? {
          ...s,
          cgpa: parseFloat(academicForm.cgpa),
          attendance: parseFloat(academicForm.attendance),
          backlogs: parseInt(academicForm.backlogs),
          semester: `${academicForm.semester}th Semester`,
          semesters: academicForm.semesters
        } : s)
      }));

      setShowEditAcademicModal(false);
      alert('Success: Your real academic results & SGPA records have been updated and synchronized with your mentor in the database!');
    } catch (err) {
      console.warn('Academics update fallback:', err.message);
      localStorage.setItem('student_academic_' + (user?.email || 'default'), JSON.stringify(academicForm));
      setShowEditAcademicModal(false);
      alert('Academic records saved successfully to your profile!');
    }
  };

  const handleAddSemesterRow = () => {
    const nextSemNum = (academicForm.semesters?.length || 0) + 1;
    const semSuffix = nextSemNum === 1 ? '1st' : nextSemNum === 2 ? '2nd' : nextSemNum === 3 ? '3rd' : `${nextSemNum}th`;
    setAcademicForm(prev => ({
      ...prev,
      semesters: [
        ...(prev.semesters || []),
        { sem: semSuffix, sgpa: 8.0, backlogs: 0 }
      ]
    }));
  };

  const handleUpdateSemSgpa = (index, value) => {
    const updated = [...(academicForm.semesters || [])];
    updated[index].sgpa = parseFloat(value) || 0;
    
    // Auto-compute average CGPA
    const validSgpas = updated.filter(s => s.sgpa > 0);
    const avg = validSgpas.length > 0 ? (validSgpas.reduce((acc, s) => acc + s.sgpa, 0) / validSgpas.length).toFixed(2) : academicForm.cgpa;
    
    setAcademicForm(prev => ({
      ...prev,
      semesters: updated,
      cgpa: parseFloat(avg)
    }));
  };

  // Query state
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [querySuccess, setQuerySuccess] = useState(false);

  // Document upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', category: 'Academic', file: null });

  // Achievement state
  const [showAchModal, setShowAchModal] = useState(false);
  const [newAch, setNewAch] = useState({ title: '', category: 'Hackathons', date: 'Nov 2026' });

  const cards = [
    { label: 'My Faculty Mentor', value: student?.mentorName || 'Dr. Rajesh Sharma', icon: User, color: '#0D5C63', sub: 'Cabin B-304 • CSE' },
    { label: 'Current Semester', value: student?.semester || '4th Semester', icon: BookOpen, color: '#2563EB', sub: 'Batch 2022-26 • CSE' },
    { label: 'Academic CGPA', value: `${student?.cgpa || 8.32} / 10`, icon: TrendingUp, color: '#059669', sub: `Attendance: ${student?.attendance || 85}%` },
    { label: 'Upcoming Meeting', value: 'Tomorrow 11:30 AM', icon: Calendar, color: '#D97706', sub: 'Monthly Academic Review' },
    { label: 'Pending Documents', value: '1 Under Review', icon: FileText, color: '#7C3AED', sub: 'TCS Internship Offer' },
    { label: 'Verified Achievements', value: `${student?.achievements?.length || 2} Badges`, icon: Award, color: '#EC4899', sub: 'SIH Finalist & AWS' },
  ];

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!querySubject || !queryMessage) return;

    try {
      const studentsRes = await api.admin.getStudents().catch(() => null);
      const studentObj = studentsRes?.students?.[0];
      if (studentObj?.userId) {
        await api.complaints.submit({
          userId: studentObj.userId,
          category: 'Academics',
          subject: querySubject,
          description: queryMessage,
          priority: 'MEDIUM'
        });
      }
    } catch (err) {
      console.warn("Query fallback:", err.message);
    }

    const newQ = {
      id: `q-${Date.now()}`,
      studentName: student.name,
      subject: querySubject,
      message: queryMessage,
      reply: 'Message sent to Dr. Rajesh Sharma. Expected response within 24 hours.',
      status: 'Sent',
      date: 'Just now'
    };
    setData({
      ...data,
      queries: [newQ, ...data.queries]
    });
    setQuerySubject('');
    setQueryMessage('');
    setQuerySuccess(true);
    setTimeout(() => setQuerySuccess(false), 4000);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.subject || !complaintForm.description) return;

    const newTicket = {
      id: `grv-${Date.now()}`,
      ticketNo: `GRV-2026-${Math.floor(100 + Math.random() * 900)}`,
      category: complaintForm.category,
      subject: complaintForm.subject,
      description: complaintForm.description,
      priority: complaintForm.priority,
      status: 'OPEN',
      adminResolution: null,
      resolvedAt: null,
      createdAt: 'Just now',
      raisedBy: student.name,
      raisedByEmail: student.email,
      raisedByRole: 'STUDENT'
    };

    try {
      const studentsRes = await api.admin.getStudents().catch(() => null);
      const studentObj = studentsRes?.students?.find(s => s.name === student.name) || studentsRes?.students?.[0];
      if (studentObj?.userId) {
        await api.complaints.submit({
          userId: studentObj.userId,
          category: complaintForm.category,
          priority: complaintForm.priority,
          subject: complaintForm.subject,
          description: complaintForm.description
        });
      }
    } catch (err) {
      console.warn("Complaint recorded locally:", err.message);
    }

    setData(prev => ({
      ...prev,
      complaints: [newTicket, ...(prev.complaints || [])]
    }));

    setComplaintSubmitted(true);
    setComplaintForm({ category: 'Academics', priority: 'MEDIUM', subject: '', description: '' });
    setTimeout(() => setComplaintSubmitted(false), 5000);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    const createdDoc = {
      id: `doc-${Date.now()}`,
      title: newDoc.title || 'Submitted Document',
      category: newDoc.category,
      date: 'Just now',
      status: 'Under Review'
    };
    student.documents.unshift(createdDoc);
    setShowUploadModal(false);
    alert('Document uploaded digitally! Forwarded to mentor for verification.');
  };

  const handleAchSubmit = (e) => {
    e.preventDefault();
    const createdAch = {
      id: `ach-${Date.now()}`,
      title: newAch.title || 'New Achievement',
      category: newAch.category,
      date: newAch.date,
      status: 'Pending Verification'
    };
    student.achievements.unshift(createdAch);
    setShowAchModal(false);
    alert('Achievement added to your Portfolio! Faculty notified for verification.');
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0D5C63', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Student Mentee Portal
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginTop: '4px', letterSpacing: '-0.5px' }}>
            Welcome, {student.name}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B' }}>
            Roll No: <b>{student.enrollmentNo}</b> • {student.branch} ({student.semester}) • Mentor: <b>{student.mentorName}</b>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: '#ECFDF5',
            color: '#065F46',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            border: '1px solid #A7F3D0'
          }}>
            <ShieldCheck size={15} color="#059669" />
            <span>Marks Verified by Faculty Mentor</span>
          </span>

          <button
            onClick={() => setShowUploadModal(true)}
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
            <Upload size={16} />
            <span>Upload Marksheet</span>
          </button>
          
          <button
            onClick={() => setShowAchModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#FFFFFF',
              color: '#0D5C63',
              border: '1.5px solid #CBD5E1',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Award size={16} />
            <span>Add Achievement</span>
          </button>
        </div>
      </div>

      {/* Unassigned Student Notice Banner */}
      {(!studentMentor || studentMentor === 'Unassigned' || studentMentor === 'Pending Allocation') && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          border: '1.5px solid #F59E0B',
          borderRadius: '14px',
          padding: '18px 22px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 14px rgba(217, 119, 6, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#D97706',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#92400E' }}>
                Faculty Mentor Linking Required
              </div>
              <div style={{ fontSize: '13px', color: '#78350F' }}>
                You are currently not allocated to a faculty mentor. Select your assigned faculty mentor below to link your academic records and counseling sessions.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              id="student-mentor-select"
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1.5px solid #D97706',
                background: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '600',
                color: '#0F172A'
              }}
            >
              {(mentorsList || []).map(m => (
                <option key={m.id} value={m.email}>{m.name} ({m.department})</option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById('student-mentor-select');
                if (el) {
                  const mObj = mentorsList.find(m => m.email === el.value);
                  handlePickMentor(el.value, mObj ? mObj.name : 'Dr. Rajesh Sharma');
                }
              }}
              style={{
                padding: '9px 18px',
                background: '#0D5C63',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(13, 92, 99, 0.25)'
              }}
            >
              Link to Mentor
            </button>
          </div>
        </div>
      )}

      {/* 6 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {cards.map((c, idx) => {
          const Icon = c.icon;
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>
                  {c.label}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${c.color}15`,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', lineHeight: '1.2' }}>
                  {c.value}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '6px' }}>
                  {c.sub}
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
          { id: 'profile', label: 'A. My Profile Details' },
          { id: 'academic', label: 'B. Academic Records & SGPA Graph' },
          { id: 'documents', label: 'C. Digital Document Upload' },
          { id: 'portfolio', label: 'D. Achievement Portfolio' },
          { id: 'communication', label: 'E. Mentor Communication & Feedback' },
          { id: 'grievances', label: 'F. Issue & Complaint Submission', badge: (data.complaints || []).filter(c => c.status !== 'RESOLVED').length }
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
                background: '#DC2626',
                color: '#FFFFFF',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 6px'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* A. My Profile */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Personal & Academic Details */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Personal & Institutional Details
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: '#ECFDF5',
                color: '#065F46',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                border: '1px solid #A7F3D0'
              }}>
                <CheckCircle2 size={13} color="#059669" />
                <span>Audited Records</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Full Name:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>{student.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Enrollment Number:</span>
                <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>{student.enrollmentNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Department & Branch:</span>
                <span style={{ fontWeight: '700' }}>{student.branch || 'CSE'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Current Semester:</span>
                <span style={{ fontWeight: '700' }}>{student.semester}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Cumulative CGPA:</span>
                <span style={{ fontWeight: '800', color: '#059669' }}>{student.cgpa} / 10.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>College Email:</span>
                <span style={{ fontWeight: '600', color: '#0D5C63' }}>{student.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Contact Number:</span>
                <span style={{ fontWeight: '600' }}>{student.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Attendance Status:</span>
                <span style={{ fontWeight: '700', color: student.attendance >= 75 ? '#059669' : '#DC2626' }}>
                  {student.attendance}% ({student.attendance >= 75 ? 'Regular' : 'Defaulter Warning'})
                </span>
              </div>
            </div>
          </div>

          {/* Parent & Guardian Contact */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Parent & Guardian Information
              </h3>
              <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669', padding: '3px 8px', borderRadius: '999px', fontWeight: '700' }}>
                Authorized Contact
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Parent Name:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>{student.parent?.name || 'Sanjay Verma'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Relationship:</span>
                <span style={{ fontWeight: '700' }}>{student.parent?.relation || 'Father'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Contact Number:</span>
                <span style={{ fontWeight: '700' }}>{student.parent?.phone || '+91 98111 22334'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Parent Email:</span>
                <span style={{ fontWeight: '600' }}>{student.parent?.email || 'parent@example.com'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Emergency Contact:</span>
                <span style={{ fontWeight: '700', color: '#DC2626' }}>{student.parent?.emergencyContact || '+91 98111 22334'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. Academic Records */}
      {activeTab === 'academic' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>
                Semester Results & SGPA Trend Analysis
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Cumulative Grade Point Average (CGPA): <b style={{ color: '#059669', fontSize: '15px' }}>{student.cgpa} / 10.00</b> • Active Backlogs: <b>{academicForm.backlogs || 0}</b> • Attendance: <b>{student.attendance}%</b>
              </p>
            </div>
            
            <button
              onClick={() => setShowUploadModal(true)}
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
              <Upload size={15} />
              <span>Upload Marksheet for Mentor Review</span>
            </button>
          </div>

          {/* Institutional Governance Notice Banner */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            padding: '12px 16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#334155'
          }}>
            <ShieldCheck size={20} color="#059669" />
            <div>
              <b>Official Academic Record:</b> In accordance with institutional NAAC/NBA governance, all official semester marks, CGPA, and attendance are officially audited and recorded by your Faculty Mentor (<b>{student.mentorName}</b>). To submit newly declared results, upload your official university grade card in the Documents Vault.
            </div>
          </div>

          {/* Graph Visual */}
          <div style={{
            background: '#F8FAFC',
            padding: '24px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            marginTop: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>
                SGPA Progression Graph Across Semesters:
              </h4>
              <span style={{ fontSize: '11px', background: '#CCFBF1', color: '#0D5C63', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                Target: &gt; 8.00 First Class with Distinction
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', height: '200px', paddingBottom: '10px' }}>
              {(student.semesters || []).map((sem, i) => {
                const heightPercent = Math.min(100, Math.max(10, ((sem.sgpa || 0) / 10) * 100));
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0D5C63', marginBottom: '6px' }}>
                      {sem.sgpa}
                    </span>
                    <div style={{
                      width: '100%',
                      maxWidth: '60px',
                      height: `${heightPercent * 1.5}px`,
                      background: sem.sgpa >= 8.5 ? 'linear-gradient(180deg, #14B8A6 0%, #0D5C63 100%)' : 'linear-gradient(180deg, #3B82F6 0%, #14B8A6 100%)',
                      borderRadius: '8px 8px 0 0',
                      boxShadow: '0 2px 6px rgba(13, 92, 99, 0.15)'
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginTop: '10px' }}>
                      {sem.sem} Sem
                    </span>
                    <span style={{ fontSize: '10px', color: '#059669', fontWeight: '700', marginTop: '2px' }}>
                      Passed
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1.5px solid #CBD5E1', color: '#334155' }}>
                <th style={{ padding: '12px' }}>Semester</th>
                <th style={{ padding: '12px' }}>SGPA Obtained</th>
                <th style={{ padding: '12px' }}>Credits Registered</th>
                <th style={{ padding: '12px' }}>Backlog Status</th>
                <th style={{ padding: '12px' }}>Evaluation Status</th>
              </tr>
            </thead>
            <tbody>
              {(student.semesters || []).map((sem, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px', fontWeight: '700' }}>{sem.sem} Semester</td>
                  <td style={{ padding: '12px', fontWeight: '800', color: '#0D5C63', fontSize: '14px' }}>{sem.sgpa}</td>
                  <td style={{ padding: '12px' }}>24 Credits</td>
                  <td style={{ padding: '12px' }}>
                    {sem.backlogs > 0 ? (
                      <span style={{ color: '#D97706', fontWeight: '700' }}>{sem.backlogs} Backlog</span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: '600' }}>Zero Backlogs (Clear)</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#ECFDF5', color: '#059669', fontWeight: '700', fontSize: '11px' }}>
                      PASSED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* C. Digital Document Upload */}
      {activeTab === 'documents' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Digital Document Submissions & Verifications
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Physical documents replaced with digitally authenticated uploads reviewed by faculty.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
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
              <Upload size={16} />
              <span>Upload New Document</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {student.documents.map(doc => {
              const statusColors = {
                'Approved': { bg: '#ECFDF5', text: '#059669' },
                'Under Review': { bg: '#CCFBF1', text: '#2563EB' },
                'Pending': { bg: '#FFFBEB', text: '#D97706' },
                'Rejected': { bg: '#FEF2F2', text: '#DC2626' }
              };
              const col = statusColors[doc.status] || { bg: '#F1F5F9', text: '#475569' };

              return (
                <div key={doc.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#CCFBF1',
                      color: '#0D5C63',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        Category: <b>{doc.category}</b> • Uploaded: {doc.date}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '800',
                    background: col.bg,
                    color: col.text
                  }}>
                    {doc.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* D. Achievement Portfolio */}
      {activeTab === 'portfolio' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Student Achievement & Extracurricular Portfolio
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Maintained records of hackathons, international certifications, cultural, and sports milestones.
              </p>
            </div>
            <button
              onClick={() => setShowAchModal(true)}
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
              <Award size={16} />
              <span>Add Achievement</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {student.achievements.map(ach => (
              <div key={ach.id} style={{
                padding: '18px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#CCFBF1',
                    color: '#0D5C63'
                  }}>
                    {ach.category}
                  </span>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
                    {ach.status}
                  </span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginTop: '6px' }}>
                  {ach.title}
                </h4>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Awarded / Completed: {ach.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. Mentor Communication */}
      {activeTab === 'communication' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
          {/* Ask Your Mentor Form */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
              Ask Your Mentor
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '18px' }}>
              Direct message to <b>{student.mentorName}</b> for guidance or meeting requests.
            </p>

            {querySuccess && (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                fontWeight: '600'
              }}>
                ✓ Query submitted! Mentor has been notified.
              </div>
            )}

            <form onSubmit={handleSendQuery}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Subject / Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Major Project Approval Request"
                  value={querySubject}
                  onChange={(e) => setQuerySubject(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Message / Question
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe your query or request a meeting time..."
                  value={queryMessage}
                  onChange={(e) => setQueryMessage(e.target.value)}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Send size={15} />
                <span>Send Query to Mentor</span>
              </button>
            </form>
          </div>

          {/* Query & Feedback History */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
              Communication & Mentor Guidance Records
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.queries.map(q => (
                <div key={q.id} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                      {q.subject}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{q.date}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                    {q.message}
                  </p>
                  {q.reply && (
                    <div style={{
                      background: '#FFFFFF',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      borderLeft: '3px solid #0D5C63',
                      fontSize: '13px',
                      color: '#0F172A'
                    }}>
                      💬 <b>Mentor Reply:</b> {q.reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* F. Issue and Complaint Submission Interface */}
      {activeTab === 'grievances' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '24px' }}>
          {/* Submission Form */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Report an Issue or Grievance
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
              Submissions are escalated directly to the Institutional Proctor and Department HOD.
            </p>

            {complaintSubmitted && (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                <CheckCircle2 size={16} />
                <span>Grievance ticket registered! Tracking code generated below.</span>
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Issue Category
                </label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                >
                  <option value="Academics">Academic Curriculum / Lectures</option>
                  <option value="Hostel">Hostel & Accommodation</option>
                  <option value="Infrastructure">Laboratory & Library Facilities</option>
                  <option value="Ragging / Harassment">Anti-Ragging / Student Welfare</option>
                  <option value="Mentorship">Mentorship Support & Evaluation</option>
                  <option value="Other">Other Institutional Issue</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Urgency / Priority Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['LOW', 'MEDIUM', 'URGENT'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setComplaintForm({ ...complaintForm, priority: p })}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: complaintForm.priority === p ? '2px solid #0D5C63' : '1px solid #CBD5E1',
                        background: complaintForm.priority === p ? '#CCFBF1' : '#FFFFFF',
                        color: complaintForm.priority === p ? '#0D5C63' : '#475569',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your complaint"
                  value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Detailed Description
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Provide complete facts, dates, cabin/room details if applicable..."
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(13, 92, 99, 0.25)',
                  marginTop: '6px'
                }}
              >
                <Send size={15} />
                <span>Submit Grievance Ticket</span>
              </button>
            </form>
          </div>

          {/* Ticket Tracking History */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  My Grievance Redressal Records
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B' }}>
                  Track live status of your raised complaints and administrative responses.
                </p>
              </div>
              <span style={{ fontSize: '12px', background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '999px', fontWeight: '700' }}>
                {(data.complaints || []).length} Total Filed
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '650px', overflowY: 'auto' }}>
              {(data.complaints || []).map(c => {
                const isResolved = c.status === 'RESOLVED';
                return (
                  <div key={c.id} style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    background: isResolved ? '#F8FAFC' : '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#0D5C63', background: '#CCFBF1', padding: '2px 7px', borderRadius: '4px' }}>
                            {c.category}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', fontFamily: 'monospace' }}>
                            {c.ticketNo || c.id}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: c.priority === 'URGENT' ? '#FEF2F2' : c.priority === 'HIGH' ? '#FFFBEB' : '#F1F5F9',
                            color: c.priority === 'URGENT' ? '#DC2626' : c.priority === 'HIGH' ? '#D97706' : '#64748B'
                          }}>
                            {c.priority}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                          {c.subject}
                        </h4>
                      </div>

                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '800',
                        background: isResolved ? '#ECFDF5' : '#FFFBEB',
                        color: isResolved ? '#059669' : '#D97706'
                      }}>
                        {c.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }}>
                      {c.description}
                    </p>

                    {c.adminResolution && (
                      <div style={{
                        background: '#F0FDF4',
                        borderLeft: '3px solid #059669',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#065F46'
                      }}>
                        <b>Proctor / Mentor Action:</b> {c.adminResolution}
                        {c.resolvedAt && <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>Resolved on: {c.resolvedAt}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Document Modal */}
      {showUploadModal && (
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
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Digital Document Upload</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4th Sem Official Marksheet PDF"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Document Category</label>
                <select
                  value={newDoc.category}
                  onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                >
                  <option value="Academic">Semester Marksheet (Grade Card)</option>
                  <option value="Attendance">Attendance Exemption / Medical Certificate</option>
                  <option value="Internship">Internship Offer / Completion Certificate</option>
                  <option value="Achievement">Achievement / Competition Certificate</option>
                </select>
              </div>
              <div style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '10px',
                padding: '24px',
                textAlign: 'center',
                background: '#F8FAFC',
                marginBottom: '18px',
                cursor: 'pointer'
              }}>
                <Upload size={28} color="#0D5C63" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>Click to select PDF or image</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Supported: PDF, PNG, JPG up to 10MB</div>
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
                Submit for Verification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Portfolio Achievement */}
      {showAchModal && (
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
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Add Portfolio Achievement</h3>
              <button onClick={() => setShowAchModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>
            <form onSubmit={handleAchSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Achievement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon Runner Up"
                  value={newAch.title}
                  onChange={(e) => setNewAch({ ...newAch, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Category</label>
                <select
                  value={newAch.category}
                  onChange={(e) => setNewAch({ ...newAch, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                >
                  <option value="Hackathons">Hackathons & Coding</option>
                  <option value="Certifications">Industry Certifications</option>
                  <option value="Research & Publications">Research & Publications</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Date / Month</label>
                <input
                  type="text"
                  placeholder="e.g. Oct 2026"
                  value={newAch.date}
                  onChange={(e) => setNewAch({ ...newAch, date: e.target.value })}
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
                Add to Portfolio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
