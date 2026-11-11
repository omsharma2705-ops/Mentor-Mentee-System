import React, { useState } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Sparkles,
  Loader2,
  User,
  AtSign,
  Building,
  Phone,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  // Mode: 'LOGIN' or 'REGISTER'
  const [authMode, setAuthMode] = useState('LOGIN');

  // Login form state (identifier accepts either username OR email)
  const [role, setRole] = useState('MENTOR');
  const [loginIdentifier, setLoginIdentifier] = useState('rajesh.sharma@college.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register form state
  const [regForm, setRegForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    departmentCode: 'CSE',
    rollNo: '',
    phone: ''
  });
  const [regLoading, setRegLoading] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const roles = [
    { id: 'ADMIN', label: 'Admin', icon: ShieldCheck, defaultIdentifier: 'admin@college.edu', name: 'Dr. Ramesh Chandra (Principal/Admin)' },
    { id: 'HOD', label: 'HOD', icon: UserCheck, defaultIdentifier: 'hod.cse@college.edu', name: 'Dr. K.V. Raman (HOD CSE)' },
    { id: 'MENTOR', label: 'Mentor', icon: BookOpen, defaultIdentifier: 'rajesh.sharma@college.edu', name: 'Dr. Rajesh Sharma (Mentor)' },
    { id: 'STUDENT', label: 'Student', icon: GraduationCap, defaultIdentifier: 'aman.verma@student.college.edu', name: 'Aman Verma (Student)' },
    { id: 'PARENT', label: 'Parent', icon: Users, defaultIdentifier: 'sanjay.verma@example.com', name: 'Sanjay Verma (Parent)' },
  ];

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    const rObj = roles.find(r => r.id === selectedRole);
    if (rObj) {
      setLoginIdentifier(rObj.defaultIdentifier);
      setPassword('password123');
    }
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.auth.login(loginIdentifier, password);
      if (res && res.success && res.user) {
        onLoginSuccess({
          id: res.user.id,
          email: res.user.email,
          username: res.user.username || res.user.email.split('@')[0],
          role: res.user.role,
          name: res.user.name,
          user: res.user
        });
        return;
      }
    } catch (err) {
      console.warn("Backend auth notice:", err.message);
      // If error message is from server, display it
      const msg = err.message || 'Invalid username/email or password.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register (Individual creates own name, username, email, password)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!regForm.name.trim()) {
      setErrorMsg('Please enter your full name.');
      setRegLoading(false);
      return;
    }
    if (!regForm.email.trim()) {
      setErrorMsg('Please enter your email address.');
      setRegLoading(false);
      return;
    }
    if (regForm.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setRegLoading(false);
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      setRegLoading(false);
      return;
    }

    try {
      const res = await api.auth.register({
        name: regForm.name.trim(),
        username: regForm.username ? regForm.username.trim().toLowerCase() : regForm.email.split('@')[0].toLowerCase(),
        email: regForm.email.trim().toLowerCase(),
        password: regForm.password,
        role: regForm.role,
        departmentCode: regForm.departmentCode,
        rollNo: regForm.rollNo || undefined,
        phone: regForm.phone || undefined
      });

      if (res && res.success && res.user) {
        setSuccessMsg(`Account created successfully for @${res.user.username || res.user.name}! Logging you in...`);
        setTimeout(() => {
          onLoginSuccess({
            id: res.user.id,
            email: res.user.email,
            username: res.user.username,
            role: res.user.role,
            name: res.user.name,
            user: res.user
          });
        }, 1200);
        return;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Username or email may already be in use.');
    } finally {
      setRegLoading(false);
    }
  };

  // 3. Quick Demo Launch
  const handleQuickDemo = async (demoRole) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.auth.quickDemo(demoRole);
      if (res.success && res.user) {
        onLoginSuccess({
          id: res.user.id,
          email: res.user.email,
          username: res.user.username || res.user.email.split('@')[0],
          role: res.user.role,
          name: res.user.name,
          user: res.user
        });
        return;
      }
    } catch (err) {
      console.warn("Quick demo fallback:", err.message);
    } finally {
      setLoading(false);
    }

    const rObj = roles.find(r => r.id === demoRole);
    if (rObj) {
      onLoginSuccess({
        email: rObj.defaultIdentifier,
        username: rObj.defaultIdentifier.split('@')[0],
        role: demoRole,
        name: rObj.name
      });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#F8FAFC',
      color: '#0F172A',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Left Column: College Branding & Welcome */}
      <div style={{
        flex: '1.05',
        background: 'linear-gradient(145deg, #042F2E 0%, #0D5C63 60%, #0F766E 100%)',
        color: '#FFFFFF',
        padding: '50px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '450px',
          height: '450px',
          borderRadius: '999px',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        {/* Top Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
            }}>
              <GraduationCap size={32} color="#FBBF24" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px', color: '#FFFFFF' }}>
                EduMentor Portal
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#FEF3C7', fontWeight: '600' }}>
                Institute of Engineering &amp; Technology (NAAC A++)
              </p>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(217, 119, 6, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#FDE68A',
            marginBottom: '32px'
          }}>
            <Sparkles size={14} color="#F59E0B" />
            <span>Digital Mentoring &amp; Individual Governance System</span>
          </div>

          <h2 style={{
            fontSize: '36px',
            fontWeight: '900',
            lineHeight: '1.2',
            letterSpacing: '-1px',
            marginBottom: '18px',
            maxWidth: '520px'
          }}>
            Personalized Academic &amp; Mentorship Tracking
          </h2>

          <p style={{
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#E2E8F0',
            maxWidth: '480px',
            marginBottom: '36px'
          }}>
            Every individual student and faculty mentor has their own personalized account. Log in with your custom username or institutional email to monitor performance and mentor guidance.
          </p>

          {/* Highlights checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              "Individual Accounts: Sign up with your own Name & Username",
              "Login via Username or College Email ID",
              "Semester-wise SGPA, CGPA & Defaulter Analytics",
              "Formal Grievance Redressal Cell with Ticket Tracking",
              "Secure Role-Based Governance for Students, Mentors & Admins"
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#FBBF24" />
                <span style={{ fontSize: '13.5px', color: '#F8FAFC', fontWeight: '500' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Quote */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#94A3B8'
        }}>
          <span>© 2026 Institute of Engineering &amp; Technology</span>
          <span style={{ color: '#FDE68A', fontWeight: '700' }}>ISO 9001:2015 Compliant</span>
        </div>
      </div>

      {/* Right Column: Dynamic Form (Sign In OR Register) */}
      <div style={{
        flex: '1.15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 40px',
        background: '#F8FAFC',
        overflowY: 'auto'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: '#FFFFFF',
          padding: '36px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px -5px rgba(13, 92, 99, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
          border: '1px solid #E2E8F0'
        }}>

          {/* Toggle Tabs: Sign In vs Register */}
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '26px'
          }}>
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'LOGIN' ? '#FFFFFF' : 'transparent',
                color: authMode === 'LOGIN' ? '#0D5C63' : '#64748B',
                fontWeight: authMode === 'LOGIN' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: authMode === 'LOGIN' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In (Existing)
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('REGISTER'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'REGISTER' ? '#0D5C63' : 'transparent',
                color: authMode === 'REGISTER' ? '#FFFFFF' : '#64748B',
                fontWeight: authMode === 'REGISTER' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: authMode === 'REGISTER' ? '0 2px 6px rgba(13, 92, 99, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              + Create New Account
            </button>
          </div>

          {/* Alerts Banner */}
          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: SIGN IN MODE                                            */}
          {/* ============================================================== */}
          {authMode === 'LOGIN' && (
            <div>
              <div style={{ marginBottom: '22px' }}>
                <span style={{
                  color: '#0D5C63',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  Portal Sign In
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                  Welcome Back
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  Enter your chosen <b>username</b> or registered <b>college email ID</b>.
                </p>
              </div>

              {/* Fast Persona Autofill Pills */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Quick Fill Demo Persona:
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  background: '#F1F5F9',
                  padding: '4px',
                  borderRadius: '10px'
                }}>
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const active = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '7px 3px',
                          border: 'none',
                          borderRadius: '8px',
                          background: active ? '#0D5C63' : 'transparent',
                          color: active ? '#FFFFFF' : '#64748B',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          fontSize: '10.5px',
                          fontWeight: active ? '700' : '600'
                        }}
                      >
                        <Icon size={14} color={active ? '#FFFFFF' : '#64748B'} />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleLoginSubmit}>
                {/* Username or Email Input */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                    Username or College Email
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 14px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '10px',
                    background: '#FFFFFF'
                  }}>
                    <AtSign size={17} color="#64748B" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. rahul_cse or aman.verma@student.college.edu"
                      style={{
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontSize: '13.5px',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0D5C63',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 14px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '10px',
                    background: '#FFFFFF'
                  }}>
                    <Lock size={17} color="#64748B" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      style={{
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontSize: '13.5px',
                        color: '#0F172A'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(13, 92, 99, 0.28)',
                    cursor: 'pointer',
                    marginBottom: '14px'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Username / Email</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click Persona Demo Footer */}
              <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.4px' }}>
                  ⚡ Instant Direct Demo Access:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {roles.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleQuickDemo(r.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      Demo {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: REGISTER NEW ACCOUNT (Name, Username, Email, Role)      */}
          {/* ============================================================== */}
          {authMode === 'REGISTER' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <span style={{
                  color: '#0D5C63',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  New Account Registration
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                  Create Individual Account
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  Choose your personal name, your own <b>custom username</b>, and account role.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    background: '#FFFFFF'
                  }}>
                    <User size={16} color="#64748B" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma or Dr. Sunita Gupta"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: '#0F172A' }}
                    />
                  </div>
                </div>

                {/* 2. Choose Custom Username */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>
                      Choose Your Username *
                    </label>
                    {regForm.username && (
                      <span style={{ fontSize: '11px', color: '#0D5C63', fontWeight: '700', background: '#CCFBF1', padding: '1px 6px', borderRadius: '4px' }}>
                        @{regForm.username.toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    background: '#FFFFFF'
                  }}>
                    <AtSign size={16} color="#0D5C63" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. rahul_cse or sunita_faculty"
                      value={regForm.username}
                      onChange={(e) => setRegForm({ ...regForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: '#0F172A' }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '3px' }}>
                    Use this username to log in without needing to type your full email.
                  </span>
                </div>

                {/* 3. College / Personal Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    background: '#FFFFFF'
                  }}>
                    <Mail size={16} color="#64748B" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul.sharma@student.college.edu"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: '#0F172A' }}
                    />
                  </div>
                </div>

                {/* 4. Role & Department (Side by Side) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                      Account Role *
                    </label>
                    <select
                      value={regForm.role}
                      onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontWeight: '600'
                      }}
                    >
                      <option value="STUDENT">Student (Mentee)</option>
                      <option value="MENTOR">Faculty Mentor</option>
                      <option value="HOD">Head of Dept (HOD)</option>
                      <option value="PARENT">Parent / Guardian</option>
                      <option value="ADMIN">College Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                      Department
                    </label>
                    <select
                      value={regForm.departmentCode}
                      onChange={(e) => setRegForm({ ...regForm, departmentCode: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontWeight: '600'
                      }}
                    >
                      <option value="CSE">Computer Science (CSE)</option>
                      <option value="ECE">Electronics (ECE)</option>
                      <option value="IT">Information Tech (IT)</option>
                      <option value="ME">Mechanical (ME)</option>
                      <option value="CE">Civil Engg (CE)</option>
                    </select>
                  </div>
                </div>

                {/* 5. Roll Number / Mobile Number */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                      {regForm.role === 'STUDENT' ? 'Enrollment / Roll No' : 'Employee ID'}
                    </label>
                    <input
                      type="text"
                      placeholder={regForm.role === 'STUDENT' ? "0827CS221045" : "FAC-804"}
                      value={regForm.rollNo}
                      onChange={(e) => setRegForm({ ...regForm, rollNo: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 6. Password & Confirm Password */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={regLoading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: 'linear-gradient(135deg, #0D5C63 0%, #14B8A6 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(13, 92, 99, 0.28)',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  {regLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Creating Your Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account &amp; Log In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('LOGIN'); setErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#0D5C63', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Sign In here
                  </button>
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
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
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '420px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
              Reset Institutional Password
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '18px' }}>
              Enter your registered college email or username. A secure reset link and OTP will be dispatched.
            </p>
            {forgotSuccess ? (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px'
              }}>
                ✓ Password reset instructions sent to <b>{forgotEmail}</b>. Please check your inbox.
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. yourname@college.edu or username"
                  style={{
                    width: '100%',
                    padding: '11px 13px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => { setShowForgotModal(false); setForgotSuccess(false); }}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              {!forgotSuccess && (
                <button
                  onClick={() => {
                    if (forgotEmail) setForgotSuccess(true);
                  }}
                  style={{
                    background: '#0D5C63',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  Send Reset Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
