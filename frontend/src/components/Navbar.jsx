import React from 'react';
import { 
  GraduationCap, 
  LogOut, 
  Bell, 
  UserCheck, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  UserCircle2,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ currentRole, setRole, user, onLogout }) {
  const roles = [
    { id: 'ADMIN', label: 'Admin', icon: ShieldCheck, color: '#DC2626' },
    { id: 'HOD', label: 'HOD', icon: UserCheck, color: '#D97706' },
    { id: 'MENTOR', label: 'Mentor', icon: BookOpen, color: '#0D5C63' },
    { id: 'STUDENT', label: 'Student', icon: GraduationCap, color: '#2563EB' },
    { id: 'PARENT', label: 'Parent', icon: Users, color: '#7C3AED' }
  ];

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 24px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Brand & College Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 10px rgba(13, 92, 99, 0.25)'
          }}>
            <GraduationCap size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#0F172A' }}>
                EduMentor
              </span>
              <span style={{
                background: '#E6F4F5',
                color: '#0D5C63',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid #BCE5E8'
              }}>
                Portal v2.4
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>
              Institute of Engineering & Technology
            </p>
          </div>
        </div>

        {/* Quick Role Switcher Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#F1F5F9',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0'
        }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            color: '#64748B', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            padding: '0 10px'
          }}>
            Switch Role:
          </span>
          {roles.map((r) => {
            const Icon = r.icon;
            const active = currentRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: active ? '700' : '500',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#0F172A' : '#64748B',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} color={active ? r.color : '#94A3B8'} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Profile & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button style={{
            position: 'relative',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            cursor: 'pointer'
          }}>
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: '#EF4444'
            }}></span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '5px 10px',
            borderRadius: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              background: '#0D5C63',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px'
            }}>
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                {user?.name || 'Authorized User'}
              </div>
              <div style={{ fontSize: '11px', color: '#0D5C63', fontWeight: '600' }}>
                {currentRole}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log Out"
            style={{
              background: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FEE2E2',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
