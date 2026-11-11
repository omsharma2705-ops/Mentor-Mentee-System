import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  TrendingUp, 
  Clock 
} from 'lucide-react';
import { INITIAL_DATA } from '../data/mockData';
import { api } from '../services/api';

export default function HODDashboard() {
  const [data, setData] = useState(INITIAL_DATA);
  const [cseMentors, setCseMentors] = useState((INITIAL_DATA?.mentors || []).filter(m => m.department === 'CSE'));
  const [deptStats, setDeptStats] = useState({
    totalStudents: 420,
    mentorsCount: 18,
    defaultersCount: 4,
    pendingApprovals: 2
  });

  useEffect(() => {
    async function loadHODData() {
      try {
        const [mentorsRes, studentsRes] = await Promise.all([
          api.admin.getMentors().catch(() => null),
          api.admin.getStudents({ department: 'CSE' }).catch(() => null)
        ]);

        if (mentorsRes?.success && mentorsRes.mentors?.length) {
          const cse = mentorsRes.mentors.filter(m => m.department === 'CSE');
          if (cse.length) {
            setCseMentors(cse);
            setDeptStats(prev => ({ ...prev, mentorsCount: cse.length }));
          }
        }

        if (studentsRes?.success && studentsRes.students?.length) {
          const defaulters = studentsRes.students.filter(s => s.isDefaulter || s.attendance < 75);
          setDeptStats(prev => ({
            ...prev,
            totalStudents: studentsRes.students.length,
            defaultersCount: defaulters.length
          }));
        }
      } catch (err) {
        console.warn("HOD offline mode:", err.message);
      }
    }
    loadHODData();
  }, []);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '12px', fontWeight: '800', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Head of Department Oversight
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginTop: '4px', letterSpacing: '-0.5px' }}>
          Department of Computer Science & Engineering — Dr. K.V. Raman
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B' }}>
          Real-time department monitoring: faculty mentorship loads, attendance compliance, and student grievance escalation.
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>CSE Total Students</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{deptStats.totalStudents}</div>
          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>100% Mentors Assigned</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>CSE Faculty Mentors</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0D5C63', marginTop: '4px' }}>{deptStats.mentorsCount} Mentors</div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '4px' }}>Avg load: 15-18 students</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Attendance Alerts (&lt;75%)</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>{deptStats.defaultersCount} Students</div>
          <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700', marginTop: '4px' }}>Parents notified</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Pending HOD Approvals</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{deptStats.pendingApprovals} Requests</div>
          <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '700', marginTop: '4px' }}>Medical leave waivers</div>
        </div>
      </div>

      {/* Faculty Mentorship Distribution Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
          CSE Department Mentorship Load Balancer
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 16px' }}>Faculty Member</th>
              <th style={{ padding: '12px 16px' }}>Designation</th>
              <th style={{ padding: '12px 16px' }}>Current Load</th>
              <th style={{ padding: '12px 16px' }}>Capacity Bar</th>
              <th style={{ padding: '12px 16px' }}>Meetings Held (Oct)</th>
              <th style={{ padding: '12px 16px' }}>Compliance Status</th>
            </tr>
          </thead>
          <tbody>
            {cseMentors.map(m => {
              const pct = Math.round((m.assignedStudentsCount / m.maxCapacity) * 100);
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0F172A' }}>
                    {m.name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{m.designation}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '800', color: '#0D5C63' }}>
                    {m.assignedStudentsCount} / {m.maxCapacity} Mentees
                  </td>
                  <td style={{ padding: '12px 16px', width: '160px' }}>
                    <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#0D5C63' }} />
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>3 Sessions</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#ECFDF5', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                      ✓ On Track
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
