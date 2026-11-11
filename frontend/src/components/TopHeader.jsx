import React from 'react';
import { Calendar } from 'lucide-react';

export default function TopHeader({ currentRole, user, activeTabLabel = 'Institutional Administration' }) {
  const roleBreadcrumbs = {
    ADMIN: 'College Admin',
    HOD: 'Head of Department (CSE)',
    MENTOR: 'Faculty Mentorship Portal',
    STUDENT: 'Student Portal',
    PARENT: 'Parent & Guardian Portal'
  };

  const breadcrumbPrefix = roleBreadcrumbs[currentRole] || 'Institutional Administration';

  return (
    <header style={{
      height: '64px',
      background: '#FFFFFF',
      borderBottom: '1px solid #E0EBE9',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 3px rgba(13, 92, 99, 0.04)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Left: Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ color: '#4B635F', fontWeight: '500' }}>
          {breadcrumbPrefix}
        </span>
        <span style={{ color: '#CBD5E1' }}>/</span>
        <span style={{ color: '#0F172A', fontWeight: '800' }}>
          {activeTabLabel}
        </span>
      </div>

      {/* Right: Nordic Sage Badge & User Chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Academic Year Badge - Mint Glow Accent */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: '#CCFBF1',
          border: '1px solid #99F6E4',
          color: '#0F766E',
          fontSize: '12px',
          fontWeight: '800',
          letterSpacing: '0.2px'
        }}>
          <Calendar size={13} color="#0D5C63" />
          <span>Academic Year 2026–27</span>
        </div>

        {/* User Chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 12px 4px 4px',
          borderRadius: '999px',
          background: '#F6F9F8',
          border: '1px solid #E0EBE9'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '800'
          }}>
            {user?.name ? user.name.charAt(0) : 'C'}
          </div>
          <div style={{ lineHeight: '1.2' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
              {user?.name || 'Authorized User'}
            </div>
            <div style={{ fontSize: '10px', color: '#4B635F', fontWeight: '600' }}>
              {user?.username ? `@${user.username}` : (user?.email || breadcrumbPrefix)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
