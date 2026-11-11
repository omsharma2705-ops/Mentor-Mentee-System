import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import HODDashboard from './pages/HODDashboard';
import MentorDashboard from './pages/MentorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import { api } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('token') || localStorage.getItem('user'));
  });
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('user'));
      return saved?.role || 'ADMIN';
    } catch {
      return 'ADMIN';
    }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('user'));
      if (saved && saved.name) return saved;
    } catch {}
    return {
      name: 'Dr. Ramesh Chandra',
      username: 'admin',
      email: 'admin@college.edu',
      role: 'ADMIN'
    };
  });

  const roleUsers = {
    ADMIN: { name: 'Dr. Ramesh Chandra', username: 'admin', email: 'admin@college.edu', role: 'ADMIN' },
    HOD: { name: 'Dr. K.V. Raman', username: 'hod_cse', email: 'hod.cse@college.edu', role: 'HOD' },
    MENTOR: { name: 'Dr. Rajesh Sharma', username: 'rajesh_sharma', email: 'rajesh.sharma@college.edu', role: 'MENTOR' },
    STUDENT: { name: 'Aman Verma', username: 'aman_verma', email: 'aman.verma@student.college.edu', role: 'STUDENT' },
    PARENT: { name: 'Sanjay Verma', username: 'sanjay_parent', email: 'sanjay.verma@example.com', role: 'PARENT' },
  };

  const handleRoleChange = async (newRole) => {
    setCurrentRole(newRole);
    setActiveTab(newRole === 'STUDENT' ? 'profile' : newRole === 'MENTOR' ? 'mentees' : 'overview');
    if (roleUsers[newRole]) {
      setUser(roleUsers[newRole]);
      localStorage.setItem('user', JSON.stringify(roleUsers[newRole]));
    }
    try {
      await api.auth.quickDemo(newRole);
    } catch (err) {
      // offline fallback
    }
  };

  const handleLoginSuccess = (loginData) => {
    const role = loginData.role || loginData.user?.role || 'STUDENT';
    setCurrentRole(role);
    setActiveTab(role === 'STUDENT' ? 'profile' : role === 'MENTOR' ? 'mentees' : 'overview');
    const u = {
      id: loginData.user?.id || loginData.id,
      name: loginData.name || loginData.user?.name || 'Authorized User',
      username: loginData.username || loginData.user?.username || (loginData.email ? loginData.email.split('@')[0] : 'user'),
      email: loginData.email || loginData.user?.email,
      role: role
    };
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    api.auth.logout();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const getActiveTabLabel = () => {
    switch (activeTab) {
      case 'overview': return 'Institutional Administration';
      case 'mentors': return 'Faculty Mentors Hub';
      case 'students': return 'All Students & Allotments Roster';
      case 'allocation': return 'Bulk Mentor Assignment';
      case 'departments': return 'Class Coordinators & Departments';
      case 'history': return 'Allocation Logs & Audit Trail';
      default: return 'Institutional Administration';
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F6F9F8',
      display: 'flex',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* 1. Left Sidebar Navigation matching concept screenshot */}
      <Sidebar
        currentRole={currentRole}
        setRole={handleRoleChange}
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Right Main Layout Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        {/* Top Header Bar with Breadcrumb, Academic Year Badge & User Profile */}
        <TopHeader
          currentRole={currentRole}
          user={user}
          activeTabLabel={getActiveTabLabel()}
        />

        {/* Dynamic Dashboard View */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {currentRole === 'ADMIN' && (
            <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
          )}
          {currentRole === 'HOD' && (
            <HODDashboard activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
          )}
          {currentRole === 'MENTOR' && (
            <MentorDashboard activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
          )}
          {currentRole === 'STUDENT' && (
            <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
          )}
          {currentRole === 'PARENT' && (
            <ParentDashboard activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
          )}
        </main>

        {/* Subtle Institutional Footer */}
        <footer style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E0EBE9',
          padding: '16px 32px',
          fontSize: '12px',
          color: '#4B635F'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span>© 2026 Institute of Engineering & Technology — Digital Mentor-Mentee Governance System</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>NAAC A++ Accredited</span>
              <span>•</span>
              <span>NBA Tier-I Institution</span>
              <span>•</span>
              <span>ISO 9001:2015 Compliant</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
