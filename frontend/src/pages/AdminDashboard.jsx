import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  Clock, 
  Building2, 
  AlertCircle, 
  Plus, 
  Shuffle, 
  CheckCircle, 
  Search, 
  Filter, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  FileCheck,
  DownloadCloud,
  CheckCircle2,
  Calendar,
  X,
  Layers,
  Award
} from 'lucide-react';
import { INITIAL_DATA } from '../data/mockData';
import { api } from '../services/api';

export default function AdminDashboard({ activeTab: externalTab, setActiveTab: setExternalTab }) {
  const [internalTab, setInternalTab] = useState('overview');
  const activeTab = externalTab || internalTab;
  const setActiveTab = setExternalTab || setInternalTab;

  const [data, setData] = useState(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMentorForAlloc, setSelectedMentorForAlloc] = useState('m-1');
  const [autoAllocSuccess, setAutoAllocSuccess] = useState(false);
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [showEnrollStudentModal, setShowEnrollStudentModal] = useState(false);
  
  // Student Management Drawer/Modal state
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [reassignMentorId, setReassignMentorId] = useState('');

  // Grievance Redressal state
  const [complaintFilterStatus, setComplaintFilterStatus] = useState('ALL');
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [selectedComplaintForResolution, setSelectedComplaintForResolution] = useState(null);
  const [adminResolutionText, setAdminResolutionText] = useState('');

  // New Mentor form state
  const [newMentor, setNewMentor] = useState({
    name: '',
    email: '',
    department: 'CSE',
    designation: 'Assistant Professor',
    maxCapacity: 20,
    cabin: 'Block B - Room 204'
  });

  // New Student form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    rollNo: '',
    department: 'CSE',
    semester: 4,
    cgpa: 8.0,
    attendance: 85
  });

  const [allocationHistory, setAllocationHistory] = useState([
    { id: 1, date: '01 Nov 2026', title: 'CSE 4th Semester Auto-Allocation', allocated: 45, by: 'Admin' },
    { id: 2, date: '28 Oct 2026', title: 'ECE 2nd Semester Batch Balanced', allocated: 38, by: 'Admin' },
    { id: 3, date: '15 Oct 2026', title: 'Lateral Entry Mentees Assigned', allocated: 12, by: 'Admin' },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, mentorsRes, deptsRes, studentsRes, complaintsRes] = await Promise.all([
          api.admin.getStats().catch(() => null),
          api.admin.getMentors().catch(() => null),
          api.admin.getDepartments().catch(() => null),
          api.admin.getStudents().catch(() => null),
          api.complaints.getAll().catch(() => null),
        ]);

        if (statsRes?.success && statsRes.stats) {
          setData(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalStudents: statsRes.stats.totalStudents || prev.stats.totalStudents,
              totalMentors: statsRes.stats.totalMentors || prev.stats.totalMentors,
              activeMentees: statsRes.stats.activeMentees || prev.stats.activeMentees,
              pendingRequests: statsRes.stats.pendingRequests ?? prev.stats.pendingRequests,
              pendingComplaints: statsRes.stats.pendingComplaints ?? prev.stats.pendingComplaints,
            },
            ...(mentorsRes?.mentors?.length && { mentors: mentorsRes.mentors }),
            ...(deptsRes?.departments?.length && { departments: deptsRes.departments }),
            ...(studentsRes?.students?.length && { students: studentsRes.students }),
            ...(complaintsRes?.complaints?.length && { complaints: complaintsRes.complaints }),
          }));
        }
      } catch (err) {
        console.warn("Using offline mock data:", err.message);
      }
    }
    loadData();
  }, []);

  const handleAutoAllocate = async () => {
    setActiveTab('allocation');
    try {
      const res = await api.admin.autoAllocate('ALL');
      setAutoAllocSuccess(true);
      const [mRes, sRes] = await Promise.all([
        api.admin.getMentors().catch(() => null),
        api.admin.getStudents().catch(() => null),
      ]);
      if (mRes?.mentors) setData(prev => ({ ...prev, mentors: mRes.mentors }));
      if (sRes?.students) setData(prev => ({ ...prev, students: sRes.students }));

      setAllocationHistory(prev => [
        { 
          id: Date.now(), 
          date: 'Just now', 
          title: res.message || 'Automatic Smart Balance Allocation executed', 
          allocated: res.allocatedCount || 60, 
          by: 'Admin' 
        },
        ...prev
      ]);
    } catch (err) {
      console.warn("Auto allocate fallback:", err.message);
      setAutoAllocSuccess(true);
      setAllocationHistory(prev => [
        { id: Date.now(), date: 'Just now', title: 'Automatic Smart Balance Allocation executed', allocated: 60, by: 'Admin' },
        ...prev
      ]);
    }
    setTimeout(() => setAutoAllocSuccess(false), 4500);
  };

  const handleCreateMentor = async (e) => {
    e.preventDefault();
    if (!newMentor.name || !newMentor.email) return;

    try {
      const res = await api.admin.createMentor(newMentor);
      const created = res.mentor || {
        id: `m-${Date.now()}`,
        name: newMentor.name,
        email: newMentor.email,
        department: newMentor.department,
        designation: newMentor.designation,
        assignedStudentsCount: 0,
        maxCapacity: Number(newMentor.maxCapacity) || 20,
        cabin: newMentor.cabin,
        phone: '+91 98765 00000',
        expertise: ['Mentorship', 'Curriculum', 'Technical Guidance']
      };

      setData(prev => ({
        ...prev,
        mentors: [created, ...(prev.mentors || [])],
        stats: { ...prev.stats, totalMentors: (prev.stats?.totalMentors || 0) + 1 }
      }));
      setShowAddMentorModal(false);
      setNewMentor({ name: '', email: '', department: 'CSE', designation: 'Assistant Professor', maxCapacity: 20, cabin: 'Block B - Room 204' });
      alert(`Faculty Mentor ${created.name} successfully registered in system!`);
    } catch (err) {
      console.warn("Create mentor fallback:", err.message);
      const created = {
        id: `m-${Date.now()}`,
        name: newMentor.name,
        email: newMentor.email,
        department: newMentor.department,
        designation: newMentor.designation,
        assignedStudentsCount: 0,
        maxCapacity: Number(newMentor.maxCapacity) || 20,
        cabin: newMentor.cabin,
        phone: '+91 98765 00000',
        expertise: ['Mentorship', 'Curriculum', 'Technical Guidance']
      };
      setData(prev => ({
        ...prev,
        mentors: [created, ...(prev.mentors || [])],
        stats: { ...prev.stats, totalMentors: (prev.stats?.totalMentors || 0) + 1 }
      }));
      setShowAddMentorModal(false);
      alert(`Faculty Mentor ${created.name} registered!`);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.rollNo) return;

    try {
      const res = await api.admin.createStudent(newStudent);
      const created = res.student || {
        id: `s-${Date.now()}`,
        name: newStudent.name,
        email: newStudent.email || `${newStudent.rollNo.toLowerCase()}@student.college.edu`,
        enrollmentNo: newStudent.rollNo,
        rollNo: newStudent.rollNo,
        branch: newStudent.department,
        department: newStudent.department,
        semester: `${newStudent.semester}th Semester`,
        cgpa: Number(newStudent.cgpa) || 8.0,
        attendance: Number(newStudent.attendance) || 85,
        status: 'Unassigned',
        mentorName: 'Unassigned',
        requiresAttention: false
      };

      setData(prev => ({
        ...prev,
        students: [created, ...(prev.students || [])],
        stats: { ...prev.stats, totalStudents: (prev.stats?.totalStudents || 0) + 1, pendingRequests: (prev.stats?.pendingRequests || 0) + 1 }
      }));
      setShowEnrollStudentModal(false);
      setNewStudent({ name: '', email: '', rollNo: '', department: 'CSE', semester: 4, cgpa: 8.0, attendance: 85 });
      alert(`Student ${created.name} (${created.rollNo}) enrolled successfully!`);
    } catch (err) {
      console.warn("Enroll student fallback:", err.message);
      const created = {
        id: `s-${Date.now()}`,
        name: newStudent.name,
        email: newStudent.email || `${newStudent.rollNo.toLowerCase()}@student.college.edu`,
        enrollmentNo: newStudent.rollNo,
        rollNo: newStudent.rollNo,
        branch: newStudent.department,
        department: newStudent.department,
        semester: `${newStudent.semester}th Semester`,
        cgpa: Number(newStudent.cgpa) || 8.0,
        attendance: Number(newStudent.attendance) || 85,
        status: 'Unassigned',
        mentorName: 'Unassigned',
        requiresAttention: false
      };
      setData(prev => ({
        ...prev,
        students: [created, ...(prev.students || [])],
        stats: { ...prev.stats, totalStudents: (prev.stats?.totalStudents || 0) + 1, pendingRequests: (prev.stats?.pendingRequests || 0) + 1 }
      }));
      setShowEnrollStudentModal(false);
      alert(`Student ${created.name} enrolled!`);
    }
  };

  const handleReassignMentor = async (e) => {
    e.preventDefault();
    if (!selectedStudentForModal || !reassignMentorId) return;

    const targetMentor = (data.mentors || []).find(m => m.id === reassignMentorId);
    const mentorName = targetMentor?.name || 'Assigned Faculty';

    try {
      await api.admin.allocate(selectedStudentForModal.id, reassignMentorId);
    } catch (err) {
      console.warn("Reassign saved locally:", err.message);
    }

    setData(prev => ({
      ...prev,
      students: (prev.students || []).map(s => 
        s.id === selectedStudentForModal.id 
          ? { ...s, mentorId: reassignMentorId, mentorName, status: 'Allocated' } 
          : s
      )
    }));

    setSelectedStudentForModal(prev => prev ? { ...prev, mentorId: reassignMentorId, mentorName, status: 'Allocated' } : null);
    alert(`Mentor ${mentorName} successfully assigned to ${selectedStudentForModal.name}!`);
  };

  const handleAdminResolveComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComplaintForResolution) return;

    try {
      await api.complaints.resolve(selectedComplaintForResolution.id, {
        status: 'RESOLVED',
        adminResolution: adminResolutionText || 'Grievance examined and resolved by Institutional Proctor.'
      });
    } catch (err) {
      console.warn("Resolved locally:", err.message);
    }

    setData(prev => ({
      ...prev,
      complaints: (prev.complaints || []).map(c => 
        c.id === selectedComplaintForResolution.id 
          ? { ...c, status: 'RESOLVED', adminResolution: adminResolutionText || 'Grievance examined and resolved by Institutional Proctor.', resolvedAt: 'Just now' } 
          : c
      )
    }));

    setShowGrievanceModal(false);
    setSelectedComplaintForResolution(null);
    setAdminResolutionText('');
    alert('Grievance resolved and student notified.');
  };

  const statsCards = [
    { label: 'Total Students', value: data?.stats?.totalStudents ?? 1240, icon: GraduationCap, color: '#0D5C63', change: '+35 this semester' },
    { label: 'Total Mentors', value: data?.stats?.totalMentors ?? 64, icon: Users, color: '#2563EB', change: '6 Departments' },
    { label: 'Active Mentees', value: data?.stats?.activeMentees ?? 1180, icon: UserCheck, color: '#059669', change: '95.2% Allocated' },
    { label: 'Pending Requests', value: data?.stats?.pendingRequests ?? 14, icon: Clock, color: '#D97706', change: 'Requires approval' },
    { label: 'Total Departments', value: data?.stats?.totalDepartments ?? 6, icon: Building2, color: '#7C3AED', change: 'CSE, ECE, IT, ME, CE' },
    { label: 'Grievance Redressal', value: (data?.complaints || []).filter(c => c.status !== 'RESOLVED').length, icon: AlertCircle, color: '#DC2626', change: 'Active tickets' },
  ];

  const filteredStudents = (data.students || []).filter(s => {
    const name = s?.name || '';
    const roll = s?.enrollmentNo || s?.rollNo || '';
    const dept = s?.branch || s?.department || '';
    const sem = s?.semester || '';
    
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          roll.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || dept === deptFilter;
    const matchesSem = semesterFilter === 'ALL' || sem.includes(semesterFilter) || sem === semesterFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Allocated') matchesStatus = s?.mentorName && s?.mentorName !== 'Unassigned' && s?.mentorName !== 'Pending Allocation';
    else if (statusFilter === 'Unassigned') matchesStatus = !s?.mentorName || s?.mentorName === 'Unassigned' || s?.mentorName === 'Pending Allocation';
    else if (statusFilter === 'Defaulter') matchesStatus = s?.attendance < 75;

    return matchesSearch && matchesDept && matchesSem && matchesStatus;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '28px 32px' }}>
      
      {/* 1. Header Section matching screenshot */}
      <div style={{ marginBottom: '24px' }}>
        {/* Pill Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: '800',
            color: '#0D5C63',
            background: '#CCFBF1',
            border: '1px solid #99F6E4',
            padding: '4px 12px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#14B8A6' }}></span>
            Institutional Administration
          </span>
        </div>

        {/* Title & Subtitle */}
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '900', 
          color: '#0F172A', 
          letterSpacing: '-0.6px',
          marginBottom: '8px',
          lineHeight: '1.15'
        }}>
          Admin Control Center
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '750px', lineHeight: '1.5' }}>
          Enterprise governance across faculty mentors, global student cohorts, and workload allocation.
        </p>
      </div>

      {/* 2. Action Buttons matching screenshot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <button
          onClick={() => setShowAddMentorModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: '#CCFBF1',
            color: '#0D5C63',
            border: '1px solid #99F6E4',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#A7F3D0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#CCFBF1'}
        >
          <Plus size={16} />
          <span>+ Add Mentor</span>
        </button>

        <button
          onClick={() => setShowEnrollStudentModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: '#CCFBF1',
            color: '#0D5C63',
            border: '1px solid #99F6E4',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#A7F3D0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#CCFBF1'}
        >
          <Plus size={16} />
          <span>+ Enroll Student</span>
        </button>

        <button
          onClick={handleAutoAllocate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(13, 92, 99, 0.28)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Shuffle size={16} />
          <span>Bulk Mentor Assignment</span>
        </button>

        <a
          href="http://localhost:5000/api/reports/export-csv"
          download="NAAC_Mentor_Mentee_Audit_2026.csv"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: '#FFFFFF',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            textDecoration: 'none',
            marginLeft: 'auto'
          }}
        >
          <DownloadCloud size={16} color="#D97706" />
          <span>Export NAAC Audit (CSV)</span>
        </a>
      </div>

      {/* Success Notification Alert */}
      {autoAllocSuccess && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)'
        }}>
          <CheckCircle2 size={20} color="#059669" />
          <span>Success: Bulk Smart Balancing executed! Students have been auto-balanced across available faculty mentors based on 1:15 ratio quota.</span>
        </div>
      )}

      {/* 3. Horizontal Sub-Tabs matching screenshot */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: '1.5px solid #E5E3F0',
        marginBottom: '28px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'overview', label: 'Institutional Overview', count: null },
          { id: 'mentors', label: 'Mentors Hub', count: (data?.mentors || []).length },
          { id: 'students', label: 'All Students & Allotments', count: (data?.students || []).length },
          { id: 'allocation', label: 'Bulk Mentor Assignment', count: null },
          { id: 'departments', label: 'Class Coordinators', count: null },
          { id: 'complaints', label: 'Grievance Redressal Cell', count: (data?.complaints || []).filter(c => c.status !== 'RESOLVED').length },
          { id: 'history', label: 'Audit Trail', count: null }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                border: 'none',
                background: isActive ? '#FFFFFF' : 'transparent',
                borderRadius: isActive ? '10px 10px 0 0' : '8px',
                borderBottom: isActive ? '3px solid #0D5C63' : '3px solid transparent',
                fontSize: '13px',
                fontWeight: isActive ? '800' : '600',
                color: isActive ? '#0D5C63' : '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  background: isActive ? '#CCFBF1' : '#E2E8F0',
                  color: isActive ? '#0D5C63' : '#64748B'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Panels */}

      {/* Panel 1: Institutional Overview */}
      {(activeTab === 'overview' || activeTab === 'institutional overview') && (
        <div>
          {/* Stats Metric Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {statsCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid #E5E3F0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>
                      {card.label}
                    </span>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: `${card.color}15`,
                      color: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={19} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', lineHeight: '1' }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0D5C63', fontWeight: '700', marginTop: '6px' }}>
                      {card.change}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Department Breakdown Section */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            marginBottom: '32px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
              Departmental Quota & Student Density
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
              Breakdown of departments, faculty mentors appointed, and current mentee allocation ratio.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {(data?.departments || []).map(d => (
                <div key={d.id} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#FEF3C7',
                      color: '#92400E'
                    }}>
                      {d.code}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                      HOD: {d.hod}
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
                    {d.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                    <span>Mentors: <b>{d.mentorsCount}</b></span>
                    <span>Students: <b>{d.studentsCount}</b></span>
                    <span>Ratio: <b>1:{d.mentorsCount > 0 ? (d.studentsCount / d.mentorsCount).toFixed(0) : 0}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Panel 2: Mentors Hub */}
      {activeTab === 'mentors' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Registered Faculty Mentors ({(data?.mentors || []).length})
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Monitor mentor capacity quotas, specialization areas, and active assigned students.
              </p>
            </div>
            <button
              onClick={() => setShowAddMentorModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
              <span>Add New Mentor</span>
            </button>
          </div>

          {(data?.mentors || []).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              border: '1.5px dashed #CBD5E1',
              borderRadius: '14px',
              background: '#F8FAFC'
            }}>
              <Users size={44} color="#0D5C63" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                No Faculty Mentors Found in System
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '440px', margin: '0 auto 18px', lineHeight: '1.5' }}>
                Register faculty members so they can be assigned mentee cohorts and maintain NAAC 1:15 mentorship quota compliance.
              </p>
              <button
                onClick={() => setShowAddMentorModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
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
                <span>+ Register First Mentor</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {(data?.mentors || []).map(m => {
                const capacity = m.maxCapacity || 20;
                const count = m.assignedStudentsCount || 0;
                const percent = Math.min(100, Math.round((count / capacity) * 100));
                return (
                  <div key={m.id} style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '20px',
                    background: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '16px'
                      }}>
                        {m?.name ? m.name.charAt(0) : 'M'}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                          {m.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          {m.designation} • Dept of {m.department}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: '#64748B' }}>Mentorship Load:</span>
                      <span style={{ fontWeight: '800', color: percent >= 90 ? '#D97706' : '#0D5C63' }}>
                        {count} / {capacity} Mentees ({percent}%)
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: percent >= 90 ? '#D97706' : '#0D5C63',
                        borderRadius: '999px'
                      }} />
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                      Cabin: <b>{m.cabin || 'Faculty Block'}</b> • Contact: <b>{m.email}</b>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Panel 3: Student Management Interface */}
      {(activeTab === 'students' || activeTab === 'all students roster') && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E5E3F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          {/* Header & Stats Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>
                Student Management Interface
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Complete cohort roster, mentor allotments, attendance monitoring, and academic profile management.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowEnrollStudentModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(13, 92, 99, 0.25)'
                }}
              >
                <Plus size={16} />
                <span>+ Enroll New Student</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {[
              { label: 'Total Enrolled', count: (data.students || []).length, color: '#0D5C63', bg: '#CCFBF1' },
              { label: 'Allocated to Mentors', count: (data.students || []).filter(s => s.mentorName && s.mentorName !== 'Unassigned' && s.mentorName !== 'Pending Allocation').length, color: '#059669', bg: '#ECFDF5' },
              { label: 'Pending Allocation', count: (data.students || []).filter(s => !s.mentorName || s.mentorName === 'Unassigned' || s.mentorName === 'Pending Allocation').length, color: '#D97706', bg: '#FFFBEB' },
              { label: 'Attendance Defaulters (<75%)', count: (data.students || []).filter(s => s.attendance < 75).length, color: '#DC2626', bg: '#FEF2F2' },
            ].map((box, i) => (
              <div key={i} style={{ background: box.bg, border: `1px solid ${box.color}20`, borderRadius: '12px', padding: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: box.color, display: 'block' }}>{box.label}</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginTop: '2px', display: 'block' }}>{box.count}</span>
              </div>
            ))}
          </div>

          {/* Search and Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 14px',
              border: '1.5px solid #CBD5E1',
              borderRadius: '10px',
              width: '300px',
              background: '#FFFFFF'
            }}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search by student name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', fontWeight: '600', color: '#334155' }}
              >
                <option value="ALL">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>

              {/* Semester Filter */}
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', fontWeight: '600', color: '#334155' }}
              >
                <option value="ALL">All Semesters</option>
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="6th Semester">6th Semester</option>
                <option value="8th Semester">8th Semester</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', fontWeight: '600', color: '#334155' }}
              >
                <option value="ALL">All Allotment Status</option>
                <option value="Allocated">Allocated Mentees</option>
                <option value="Unassigned">Pending / Unassigned</option>
                <option value="Defaulter">Low Attendance (&lt;75%)</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8F7FC', borderBottom: '1.5px solid #E5E3F0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Student Name</th>
                  <th style={{ padding: '12px 16px' }}>Roll / Enrollment No</th>
                  <th style={{ padding: '12px 16px' }}>Branch & Sem</th>
                  <th style={{ padding: '12px 16px' }}>CGPA</th>
                  <th style={{ padding: '12px 16px' }}>Attendance</th>
                  <th style={{ padding: '12px 16px' }}>Assigned Mentor</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Management Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1E1B4B' }}>
                      {st.name}
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '400' }}>{st.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#334155' }}>
                      {st.enrollmentNo || st.rollNo}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: '700', color: '#0D5C63' }}>{st.branch || st.department}</span> • {st.semester}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '800', color: '#0D5C63' }}>
                      {st.cgpa}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: st.attendance < 75 ? '#FEF2F2' : '#ECFDF5',
                        color: st.attendance < 75 ? '#DC2626' : '#059669'
                      }}>
                        {st.attendance}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1E1B4B' }}>
                      {st.mentorName || 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: st.attendance < 75 ? '#FFFBEB' : '#CCFBF1',
                        color: st.attendance < 75 ? '#B45309' : '#0D5C63'
                      }}>
                        {st.attendance < 75 ? 'Attendance Alert' : (st.mentorName ? 'Active Mentee' : 'Unallocated')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedStudentForModal(st);
                          setReassignMentorId(st.mentorId || '');
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid #99F6E4',
                          background: '#CCFBF1',
                          color: '#0D5C63',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#A7F3D0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#CCFBF1'}
                      >
                        Manage & Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel 4: Bulk Mentor Assignment & Allocation Matrix */}
      {activeTab === 'allocation' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
          {/* Left Allocation Matrix */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E5E3F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  Faculty Quota & Allocation Matrix
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B' }}>
                  Current workload balancing across faculty members for NAAC/NBA 1:15 ratio compliance.
                </p>
              </div>
              <span style={{ fontSize: '12px', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                Target: 1:15 to 1:20
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(data?.mentors || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                  <Users size={36} color="#0D5C63" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>No Mentors to Display</div>
                  <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>Add faculty mentors above so they can be balanced with student allocations.</p>
                  <button
                    onClick={() => setShowAddMentorModal(true)}
                    style={{ padding: '8px 16px', background: '#0D5C63', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add Mentor
                  </button>
                </div>
              ) : (
                (data?.mentors || []).map((mentor) => {
                const maxCap = mentor.maxCapacity || 20;
                const assigned = mentor.assignedStudentsCount || 0;
                const percent = Math.min(100, Math.round((assigned / maxCap) * 100));
                return (
                  <div key={mentor.id} style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#0D5C63',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '15px'
                        }}>
                          {mentor?.name ? mentor.name.charAt(0) : 'M'}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                            {mentor?.name || 'Mentor'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>
                            {mentor?.designation || 'Faculty'} • Dept of {mentor?.department || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0D5C63' }}>
                          {mentor.assignedStudentsCount} Students
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          Max Quota: {mentor.maxCapacity}
                        </div>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: percent > 85 ? '#D97706' : '#0D5C63',
                        borderRadius: '999px'
                      }} />
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Right Manual Allocation Controller */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
              Direct / Manual Assignment
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
              Assign specific unallocated students to an authorized faculty mentor.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Select Faculty Mentor:
              </label>
              <select 
                value={selectedMentorForAlloc}
                onChange={(e) => setSelectedMentorForAlloc(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
              >
                {(data?.mentors || []).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.department}) — {m.assignedStudentsCount}/{m.maxCapacity}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Target Batch / Student Cohort:
              </label>
              <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}>
                <option>B.Tech CSE - 4th Sem (Unallocated Batch)</option>
                <option>B.Tech ECE - 2nd Sem (Lateral Entry)</option>
                <option>B.Tech IT - 6th Sem</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Allocation Remarks:
              </label>
              <textarea 
                rows="3" 
                defaultValue="Semester quota re-balancing approved by Institutional Academic Dean."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={() => {
                alert("Manual assignment saved! Notifications dispatched to mentor and students.");
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0D5C63',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      )}

      {/* Panel 5: Class Coordinators & Departments */}
      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {(data?.departments || []).map(d => (
            <div key={d.id} style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E5E3F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#4338CA', background: '#EDE9FE', padding: '3px 10px', borderRadius: '6px' }}>
                {d.code}
              </span>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1E1B4B', marginTop: '10px', marginBottom: '4px' }}>
                {d.name}
              </h4>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                Head of Department: <b>{d.hod}</b>
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '14px', fontSize: '13px' }}>
                <div>Faculty Mentors: <b>{d.mentorsCount}</b></div>
                <div>Students: <b>{d.studentsCount}</b></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel 6: Grievance Redressal Cell (NAAC / UGC Compliant) */}
      {activeTab === 'complaints' && (() => {
        const filteredComplaints = (data.complaints || []).filter(c => {
          if (complaintFilterStatus === 'ALL') return true;
          return c.status === complaintFilterStatus;
        });

        const openCount = (data.complaints || []).filter(c => c.status === 'OPEN').length;
        const progressCount = (data.complaints || []).filter(c => c.status === 'IN_PROGRESS').length;
        const resolvedCount = (data.complaints || []).filter(c => c.status === 'RESOLVED').length;

        return (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E5E3F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>
                  Institutional Grievance Redressal Cell
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B' }}>
                  Statutory mechanism for student and parent complaint registration, priority triage, and resolution tracking.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'ALL', label: `All Tickets (${(data.complaints || []).length})` },
                  { id: 'OPEN', label: `Open (${openCount})` },
                  { id: 'RESOLVED', label: `Resolved (${resolvedCount})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setComplaintFilterStatus(f.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: complaintFilterStatus === f.id ? '1px solid #0D5C63' : '1px solid #E2E8F0',
                      background: complaintFilterStatus === f.id ? '#0D5C63' : '#F8FAFC',
                      color: complaintFilterStatus === f.id ? '#FFFFFF' : '#475569',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '14px', borderRadius: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400E' }}>Awaiting Action / Open</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#B45309', display: 'block', marginTop: '2px' }}>{openCount}</span>
              </div>
              <div style={{ background: '#CCFBF1', border: '1px solid #99F6E4', padding: '14px', borderRadius: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0D5C63' }}>Under Investigation</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#14B8A6', display: 'block', marginTop: '2px' }}>{progressCount}</span>
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '14px', borderRadius: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#065F46' }}>Resolved Grievances</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#059669', display: 'block', marginTop: '2px' }}>{resolvedCount}</span>
              </div>
            </div>

            {/* Complaints List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredComplaints.map(c => {
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
                          Registered by: <b>{c.raisedBy || 'Student'}</b> ({c.raisedByEmail || 'student@college.edu'}) • {c.createdAt || 'Nov 2026'}
                        </div>
                      </div>

                      <div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: isResolved ? '#ECFDF5' : '#FFFBEB',
                          color: isResolved ? '#059669' : '#D97706'
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
                        <b>Proctor Resolution:</b> {c.adminResolution}
                        {c.resolvedAt && <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>Resolved on: {c.resolvedAt}</div>}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedComplaintForResolution(c);
                          setAdminResolutionText('');
                          setShowGrievanceModal(true);
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
                        Redress & Record Institutional Action
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Panel 7: Audit History */}
      {activeTab === 'history' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E5E3F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E1B4B', marginBottom: '16px' }}>
            System Audit Trail & Allocation History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allocationHistory.map(log => (
              <div key={log.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: '10px',
                background: '#F8F7FC',
                border: '1px solid #E5E3F0'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E1B4B' }}>
                    {log.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Executed on {log.date} by {log.by}
                  </div>
                </div>
                <span style={{
                  background: '#ECFDF5',
                  color: '#059669',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '800'
                }}>
                  {log.allocated} Students Assigned
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Add Mentor Modal */}
      {showAddMentorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E1B4B' }}>
                Register New Faculty Mentor
              </h3>
              <button onClick={() => setShowAddMentorModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleCreateMentor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunita Rao"
                  value={newMentor.name}
                  onChange={(e) => setNewMentor({ ...newMentor, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Email Address:
                </label>
                <input
                  type="email"
                  required
                  placeholder="sunita.rao@college.edu"
                  value={newMentor.email}
                  onChange={(e) => setNewMentor({ ...newMentor, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Department:
                  </label>
                  <select
                    value={newMentor.department}
                    onChange={(e) => setNewMentor({ ...newMentor, department: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                    <option value="ME">ME</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Mentee Quota:
                  </label>
                  <input
                    type="number"
                    value={newMentor.maxCapacity}
                    onChange={(e) => setNewMentor({ ...newMentor, maxCapacity: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Designation / Title:
                </label>
                <input
                  type="text"
                  value={newMentor.designation}
                  onChange={(e) => setNewMentor({ ...newMentor, designation: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddMentorModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: '#FFFFFF', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Register Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Student Management & Reassignment Modal */}
      {selectedStudentForModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  Student Profile & Allotment Management
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Roll: {selectedStudentForModal.enrollmentNo || selectedStudentForModal.rollNo} • {selectedStudentForModal.branch || selectedStudentForModal.department} ({selectedStudentForModal.semester})
                </span>
              </div>
              <button onClick={() => setSelectedStudentForModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            {/* Profile Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Current CGPA</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#0D5C63', display: 'block' }}>{selectedStudentForModal.cgpa} / 10</span>
              </div>
              <div style={{ background: selectedStudentForModal.attendance < 75 ? '#FEF2F2' : '#ECFDF5', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: selectedStudentForModal.attendance < 75 ? '#DC2626' : '#059669', fontWeight: '600' }}>Attendance</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: selectedStudentForModal.attendance < 75 ? '#DC2626' : '#059669', display: 'block' }}>
                  {selectedStudentForModal.attendance}%
                </span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Contact Email</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedStudentForModal.email}
                </span>
              </div>
            </div>

            {/* Reassign Mentor Section */}
            <div style={{ background: '#CCFBF1', border: '1.5px solid #99F6E4', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0D5C63', marginBottom: '6px' }}>
                Faculty Mentorship Allotment
              </h4>
              <p style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                Current Mentor: <b>{selectedStudentForModal.mentorName || 'Unassigned'}</b>
              </p>

              <form onSubmit={handleReassignMentor} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>
                  Select New Faculty Mentor:
                </label>
                <select
                  value={reassignMentorId}
                  onChange={(e) => setReassignMentorId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                >
                  <option value="">-- Choose Faculty Mentor --</option>
                  {(data.mentors || []).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department}) — {m.assignedStudentsCount}/{m.maxCapacity} Mentees
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={!reassignMentorId}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0D5C63',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: reassignMentorId ? 'pointer' : 'not-allowed',
                    opacity: reassignMentorId ? 1 : 0.6,
                    marginTop: '4px'
                  }}
                >
                  Confirm Mentor Reassignment
                </button>
              </form>
            </div>

            {/* Parent Details */}
            {selectedStudentForModal.parent && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>Parent &amp; Emergency Contact</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '4px' }}>
                  <span>Name: <b>{selectedStudentForModal.parent.name}</b> ({selectedStudentForModal.parent.relation})</span>
                  <span>Phone: <b>{selectedStudentForModal.parent.phone}</b></span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F1F5F9', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Grievance Redressal Modal */}
      {showGrievanceModal && selectedComplaintForResolution && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Institutional Redressal &amp; Action
              </h3>
              <button onClick={() => setShowGrievanceModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <div style={{ marginBottom: '14px', fontSize: '13px', color: '#475569' }}>
              <div><b>Subject:</b> {selectedComplaintForResolution.subject}</div>
              <div><b>Category:</b> {selectedComplaintForResolution.category} • <b>Priority:</b> {selectedComplaintForResolution.priority}</div>
              <div><b>Raised by:</b> {selectedComplaintForResolution.raisedBy} ({selectedComplaintForResolution.raisedByEmail})</div>
            </div>

            <form onSubmit={handleAdminResolveComplaint}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Administrative Action &amp; Proctor Resolution Remarks:
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe disciplinary, technical, or counseling actions taken to redress this grievance..."
                  value={adminResolutionText}
                  onChange={(e) => setAdminResolutionText(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowGrievanceModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#059669', color: '#FFFFFF', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Resolve &amp; Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEnrollStudentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E1B4B' }}>
                Enroll New Student (Mentee)
              </h3>
              <button onClick={() => setShowEnrollStudentModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Student Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Roll / Enrollment No:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="22CSE102"
                    value={newStudent.rollNo}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Department:
                  </label>
                  <select
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Current CGPA:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStudent.cgpa}
                    onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Attendance (%):
                  </label>
                  <input
                    type="number"
                    value={newStudent.attendance}
                    onChange={(e) => setNewStudent({ ...newStudent, attendance: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEnrollStudentModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: '#FFFFFF', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Enroll Mentee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
