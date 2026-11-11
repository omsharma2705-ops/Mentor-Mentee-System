import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Shuffle, 
  Award, 
  LogOut, 
  Building2, 
  Calendar, 
  FileCheck, 
  UserCheck, 
  MessageSquare,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

export default function Sidebar({ 
  currentRole, 
  setRole, 
  user, 
  onLogout,
  activeTab,
  setActiveTab
}) {
  const roleNavItems = {
    ADMIN: [
      { id: 'overview', label: 'Institutional Overview', icon: LayoutDashboard },
      { id: 'mentors', label: 'Mentors Hub', icon: Users },
      { id: 'students', label: 'All Students Roster', icon: GraduationCap },
      { id: 'allocation', label: 'Bulk Mentor Assignment', icon: Shuffle },
      { id: 'departments', label: 'Class Coordinators', icon: Building2 },
      { id: 'complaints', label: 'Grievance Redressal Cell', icon: MessageSquare },
      { id: 'history', label: 'Allocation Audit Trail', icon: FileCheck },
    ],
    HOD: [
      { id: 'overview', label: 'Department Overview', icon: LayoutDashboard },
      { id: 'mentors', label: 'Faculty Mentorship Load', icon: Users },
      { id: 'defaulters', label: 'Attendance Alerts (<75%)', icon: AlertTriangle },
      { id: 'approvals', label: 'Pending Approvals', icon: FileCheck },
    ],
    MENTOR: [
      { id: 'mentees', label: 'My Assigned Mentees', icon: Users },
      { id: 'meetings', label: 'Mentoring Sessions', icon: Calendar },
      { id: 'feedback', label: 'Monthly Appraisals', icon: Award },
      { id: 'complaints', label: 'Student Grievances', icon: MessageSquare },
      { id: 'reports', label: 'Mentor-Mentee Log', icon: FileCheck },
    ],
    STUDENT: [
      { id: 'profile', label: 'My Student Profile', icon: UserCheck },
      { id: 'academic', label: 'Semester Results & SGPA', icon: Award },
      { id: 'grievances', label: 'Issues & Grievances', icon: MessageSquare },
      { id: 'communication', label: 'Ask Mentor', icon: MessageSquare },
    ],
    PARENT: [
      { id: 'overview', label: 'Student Academic Progress', icon: LayoutDashboard },
      { id: 'attendance', label: 'Attendance & Backlogs', icon: GraduationCap },
      { id: 'feedback', label: 'Monthly Mentor Remarks', icon: Award },
      { id: 'contact', label: 'Mentor Contact Info', icon: Users },
    ],
  };

  const navItems = roleNavItems[currentRole] || roleNavItems.ADMIN;

  const roles = [
    { id: 'ADMIN', label: 'College Admin', badge: 'Admin Portal' },
    { id: 'HOD', label: 'HOD (CSE)', badge: 'Dept Portal' },
    { id: 'MENTOR', label: 'Faculty Mentor', badge: 'Faculty Portal' },
    { id: 'STUDENT', label: 'Student (Mentee)', badge: 'Student Portal' },
    { id: 'PARENT', label: 'Parent / Guardian', badge: 'Guardian Portal' },
  ];

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      background: '#EEF4F3',
      borderRight: '1px solid #E0EBE9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Top Branding & Nav */}
      <div>
        {/* Brand Header: Nordic Emerald + Sage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', padding: '0 6px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(13, 92, 99, 0.25)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Shield size={24} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ 
              fontSize: '17px', 
              fontWeight: '900', 
              color: '#0F172A', 
              letterSpacing: '0.4px', 
              lineHeight: '1.1' 
            }}>
              COLLEGE
            </div>
            <div style={{ 
              fontSize: '17px', 
              fontWeight: '900', 
              color: '#0D5C63', 
              letterSpacing: '0.4px', 
              lineHeight: '1.1' 
            }}>
              {currentRole === 'ADMIN' ? 'ADMIN' : currentRole}
            </div>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: '800', 
              color: '#0F766E', 
              letterSpacing: '0.8px', 
              marginTop: '3px',
              textTransform: 'uppercase'
            }}>
              Institutional Portal
            </div>
          </div>
        </div>

        {/* Quick Persona Switcher */}
        <div style={{ marginBottom: '24px', padding: '0 4px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '10px', 
            fontWeight: '800', 
            color: '#64748B', 
            textTransform: 'uppercase', 
            letterSpacing: '0.8px', 
            marginBottom: '6px' 
          }}>
            Active Persona:
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={currentRole}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 32px 9px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label} ({r.badge})
                </option>
              ))}
            </select>
            <ChevronDown 
              size={14} 
              color="#64748B" 
              style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none' }} 
            />
          </div>
        </div>

        {/* Navigation Category Header */}
        <div style={{ 
          fontSize: '11px', 
          fontWeight: '800', 
          color: '#64748B', 
          textTransform: 'uppercase', 
          letterSpacing: '0.9px', 
          padding: '0 10px', 
          marginBottom: '10px' 
        }}>
          Governance & Controls
        </div>

        {/* Navigation Items List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab && setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #E0EBE9' : '1px solid transparent',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#0D5C63' : '#4B635F',
                  fontSize: '13px',
                  fontWeight: isActive ? '800' : '600',
                  boxShadow: isActive ? '0 2px 6px rgba(13, 92, 99, 0.08)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#E0EBE9';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} color={isActive ? '#0D5C63' : '#64748B'} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Session & User Profile Section */}
      <div>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: '800', 
          color: '#64748B', 
          textTransform: 'uppercase', 
          letterSpacing: '0.9px', 
          padding: '0 10px', 
          marginBottom: '10px' 
        }}>
          Session
        </div>

        {/* Admin Logout button */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: '#DC2626',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} color="#DC2626" />
          <span>{currentRole === 'ADMIN' ? 'Admin Logout' : 'Sign Out'}</span>
        </button>

        {/* Bottom Profile Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '12px',
          background: '#FFFFFF',
          border: '1px solid #E0EBE9',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#CCFBF1',
            color: '#0D5C63',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '15px'
          }}>
            <Shield size={20} color="#0D5C63" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: '800', 
              color: '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.name || 'Authorized User'}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#64748B', 
              fontWeight: '600',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.username ? `@${user.username}` : (user?.email || (currentRole === 'ADMIN' ? 'Chief Administrative Officer' : currentRole))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
