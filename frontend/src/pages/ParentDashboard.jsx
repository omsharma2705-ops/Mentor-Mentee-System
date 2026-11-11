import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  BookOpen, 
  FileCheck 
} from 'lucide-react';
import { INITIAL_DATA } from '../data/mockData';
import { api } from '../services/api';

export default function ParentDashboard() {
  const [student, setStudent] = useState(INITIAL_DATA?.students?.[0] || {
    name: 'Aman Verma',
    enrollmentNo: '0827CS221012',
    cgpa: 8.32,
    attendance: 91,
    backlogs: 0,
    semester: '4th Semester'
  });
  const [mentor, setMentor] = useState(INITIAL_DATA?.mentors?.[0] || {
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@college.edu',
    phone: '+91 98765 43210'
  });
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    async function loadParentData() {
      try {
        const studentsRes = await api.admin.getStudents().catch(() => null);
        if (studentsRes?.success && studentsRes.students?.length) {
          const s = studentsRes.students[0];
          setStudent(prev => ({
            ...prev,
            name: s.name || prev.name,
            rollNo: s.rollNo || prev.enrollmentNo,
            cgpa: s.cgpa || prev.cgpa,
            attendance: s.attendance || prev.attendance,
            backlogs: s.backlogs ?? prev.backlogs
          }));
        }
      } catch (err) {
        console.warn("Parent view offline mode:", err.message);
      }
    }
    loadParentData();
  }, []);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '12px', fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Parent / Guardian Portal
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginTop: '4px', letterSpacing: '-0.5px' }}>
          Student Progress Overview — {student?.name || 'Aman Verma'}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          Logged in as <b>{student?.parent?.name || 'Sanjay Verma'}</b> ({student?.parent?.relation || 'Parent'}) • Enrollment: <b>{student?.enrollmentNo || student?.rollNo || '0827CS221012'}</b>
        </p>
      </div>

      {/* Progress Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Overall Attendance</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: student.attendance >= 75 ? '#059669' : '#DC2626', marginTop: '4px' }}>
            {student.attendance}%
          </div>
          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>✓ Above Mandatory 75%</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Cumulative CGPA</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0D5C63', marginTop: '4px' }}>
            {student.cgpa} / 10
          </div>
          <div style={{ fontSize: '11px', color: '#0D5C63', fontWeight: '700', marginTop: '4px' }}>Rank: Top 10% in CSE</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Active Backlogs</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
            0 Active
          </div>
          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>All Previous Cleared</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Assigned Faculty Mentor</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
            {mentor.name}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '4px' }}>Cabin: {mentor.cabin}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Semester-wise Academic Progress */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
            Semester-wise Performance Records
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 14px' }}>Semester</th>
                <th style={{ padding: '12px 14px' }}>SGPA</th>
                <th style={{ padding: '12px 14px' }}>Backlogs</th>
                <th style={{ padding: '12px 14px' }}>Academic Standing</th>
              </tr>
            </thead>
            <tbody>
              {student.semesters.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>{s.sem} Semester</td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#0D5C63' }}>{s.sgpa}</td>
                  <td style={{ padding: '12px 14px' }}>{s.backlogs} Backlog</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                      Cleared
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Monthly Feedback for Parent Acknowledgement */}
          <div style={{ marginTop: '24px', padding: '18px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                October Monthly Mentor Remarks
              </h4>
              <span style={{ fontSize: '11px', background: '#E6F4F5', color: '#0D5C63', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                Dr. Rajesh Sharma
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: '8px 0 14px 0' }}>
              "Aman has shown exemplary curiosity and academic discipline this term. Cleared previous mathematics backlog with distinction and is preparing for national hackathons."
            </p>
            {acknowledged ? (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                ✓ Digitally Acknowledged by Parent ({student.parent.name}) on Today.
              </div>
            ) : (
              <button
                onClick={async () => {
                  setAcknowledged(true);
                  try {
                    const fbRes = await api.feedback.getAll().catch(() => null);
                    if (fbRes?.feedbacks?.[0]?.id) {
                      await api.feedback.acknowledge(fbRes.feedbacks[0].id);
                    }
                  } catch (err) {
                    console.warn("Feedback ack local:", err.message);
                  }
                }}
                style={{
                  background: '#0D5C63',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Sign & Acknowledge Monthly Report
              </button>
            )}
          </div>
        </div>

        {/* Mentor Contact & Consultation */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
            Faculty Mentor Contact
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#0D5C63',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800'
            }}>
              {mentor?.name ? mentor.name.charAt(0) : 'M'}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                {mentor?.name || 'Dr. Rajesh Sharma'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                {mentor?.designation || 'Associate Professor'} • Dept of {mentor?.department || 'CSE'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569', marginBottom: '20px' }}>
            <div>📞 Direct Line: <b>{mentor.phone}</b></div>
            <div>📧 Official Email: <b>{mentor.email}</b></div>
            <div>🏛️ Consultation Cabin: <b>{mentor.cabin}</b></div>
            <div>⏰ Parent Calling Hours: <b>Mon-Fri, 3:30 PM - 5:00 PM</b></div>
          </div>

          <a
            href={`tel:${mentor.phone}`}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '11px',
              background: '#0D5C63',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            Call Mentor
          </a>
        </div>
      </div>
    </div>
  );
}
