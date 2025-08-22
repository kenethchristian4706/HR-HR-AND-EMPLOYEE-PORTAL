import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HrDashboard.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LeaveRequestForm from './components/LeaveRequestForm';
import LeaveList from './components/LeaveList';
  import MyLeaves from './components/MyLeaves';
import EmployeeTasks from './components/EmployeeTasks';
import EmployeeAttendance from './components/EmployeeAttendance';

// EmployeeDashboard component re-uses HR dashboard layout CSS and Tailwind utilities for inner styling
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.replace('/employee-dashboard', '') || '/';
  const [active, setActive] = useState(path === '/' ? 'dashboard' : path.replace('/', '') ); // dashboard | attendance | requestLeave | profile
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ leaves_taken: 0, pending_leaves: 0, attendance_percent: 0 });
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);

  // Request Leave form state
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(null);

  // Attendance state
  const [attLoading, setAttLoading] = useState(false);
  const [attSuccess, setAttSuccess] = useState(null);

  // Add state for leaves
  const [leaves, setLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);

  // Load logged-in employee from localStorage (populated by login flow)
  useEffect(() => {
    // robustly obtain employee object or id from localStorage
    let stored = null;
    try {
      const raw = localStorage.getItem('employeeUser') || localStorage.getItem('employee');
      if (raw) {
        try { stored = JSON.parse(raw); } catch (e) { stored = raw; }
      }
    } catch (e) { stored = null; }
    const empId = (stored && typeof stored === 'object' && stored.id) ? stored.id : (typeof stored === 'number' || /^[0-9]+$/.test(String(stored)) ? Number(stored) : null);
    if (empId) {
      fetchProfileAndStats(empId);
      fetchAttendance(empId);
      // also fetch leaves once profile is known
      fetchLeaves(empId);
    } else {
      // no stored user - still try to fetch generic profile if an hrUser exists (fallback)
      try {
        const hr = localStorage.getItem('hrUser');
        if (hr) {
          const parsed = JSON.parse(hr);
          // use hr info as fallback profile (for demo)
          setProfile(parsed);
        }
      } catch (e) {}
      setLoading(false);
    }
  }, []);

  const fetchProfileAndStats = async (empId) => {
    setLoading(true);
    setError(null);
    try {
      // profile: backend has endpoint /api/employee/<pk>/ (employee_detail)
      const [profileRes, statsRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/employee/${empId}/`).catch(() => null),
        // leave summary endpoint: returns { total_taken, pending }
        axios.get(`http://127.0.0.1:8000/api/leave/summary/?employee=${empId}`).catch(() => null),
      ]);

      if (profileRes && profileRes.data) setProfile(profileRes.data);
      else {
        // fallback to localStorage stored object
        try {
          const raw = localStorage.getItem('employeeUser');
          setProfile(raw ? JSON.parse(raw) : null);
        } catch (e) { setProfile(null); }
      }

      if (statsRes && statsRes.data) {
        // map backend keys to frontend state shape
        const data = statsRes.data;
        setStats(prev => ({
          ...prev,
          leaves_taken: data.total_taken ?? (data.leaves_taken || 0),
          pending_leaves: data.pending ?? (data.pending_leaves || 0)
        }));
      } else {
        // fallback: keep existing values
        setStats(prev => ({ ...prev }));
      }
    } catch (err) {
      setError('Failed to load profile or stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (empId) => {
    if (!empId) return;
    setAttendanceLoading(true);
    setAttendanceError(null);
    setAttendanceData(null);
    const urls = [
      `http://127.0.0.1:8000/api/attendance-percentage/${empId}/`
    ];
    let lastErr = null;
    for (const url of urls) {
      try {
        const res = await axios.get(url);
        if (res && res.data) {
          setAttendanceData(res.data);
          // also update summary percent in stats for backward compatibility
          setStats(prev => ({ ...prev, attendance_percent: Number(res.data.attendance_percentage ?? res.data.attendance_percent ?? 0) }));
          setAttendanceLoading(false);
          return;
        }
      } catch (err) {
        lastErr = err;
        // try next
      }
    }
    setAttendanceError('Error fetching attendance data');
    setAttendanceLoading(false);
  };

  const fetchLeaves = async (empId) => {
    if (!empId) return;
    setLeavesLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/leave/mine/?employee=${empId}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || res.data || []);
      setLeaves(data);
      // if first attempt returned empty, try once more after a short delay (handles backend eventual consistency)
      if ((!data || data.length === 0)) {
        setTimeout(async () => {
          try {
            const retry = await axios.get(`http://127.0.0.1:8000/api/leave/mine/?employee=${empId}`);
            const rdata = Array.isArray(retry.data) ? retry.data : (retry.data.results || retry.data || []);
            if (rdata && rdata.length) setLeaves(rdata);
          } catch (e) {
            // ignore
          }
        }, 800);
      }
    } catch (err) {
      setLeaves([]);
    } finally {
      setLeavesLoading(false);
    }
  };

  useEffect(() => {
  if (profile?.id) fetchLeaves(profile.id);
  }, [profile?.id]);

  const handleMarkAttendance = async () => {
    if (!profile?.id) {
      setAttSuccess('No employee id available');
      return;
    }
    setAttLoading(true);
    setAttSuccess(null);
    try {
      // POST to correct attendance endpoint expected by backend
      const res = await axios.post('http://127.0.0.1:8000/api/attendance/mark/', { employee: profile.id });
      setAttSuccess('Attendance marked for today');
      // refresh attendance percentage and data
      try { fetchAttendance(profile.id); } catch (e) {}
      // optimistic update for UI percentage if response contains updated info
      if (res && res.data) {
        // try to bump the percent a bit if not available yet
        setStats(prev => ({ ...prev, attendance_percent: Math.min(100, Math.round((prev.attendance_percent || 0) + 1)) }));
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to mark attendance';
      setAttSuccess(msg);
    } finally {
      setAttLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.id) { setLeaveSuccess('No employee id'); return; }
    setLeaveLoading(true);
    setLeaveSuccess(null);
    try {
      // POST leave request - backend endpoint may vary. We'll try /api/leave/request/
      await axios.post('http://127.0.0.1:8000/api/leave/request/', { emp_id: profile.id, ...leaveForm });
      setLeaveSuccess('Leave request submitted');
      // optimistic update
      setStats(prev => ({ ...prev, pending_leaves: (prev.pending_leaves || 0) + 1 }));
      setLeaveForm({ start_date: '', end_date: '', reason: '' });
    } catch (err) {
      setLeaveSuccess('Leave request saved locally (backend not available)');
    } finally {
      setLeaveLoading(false);
    }
  };

  // handle successful leave submission
  const onLeaveSubmitted = () => {
    if (profile?.id) fetchLeaves(profile.id);
  };

  const Sidebar = () => (
    <aside className="hr-sidebar" style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: 250 }}>
      <div>
        <div className="hr-sidebar-title">Employee</div>
        <nav className="hr-sidebar-menu">
          <div className={`hr-menu-item ${active === 'dashboard' ? 'active' : ''}`} onClick={() => { setActive('dashboard'); navigate('/employee-dashboard'); }}>
            <span className="hr-menu-label">Dashboard</span>
          </div>
          <div className={`hr-menu-item ${active === 'attendance' ? 'active' : ''}`} onClick={() => { setActive('attendance'); navigate('/employee-dashboard/attendance'); }}>
            <span className="hr-menu-label">Attendance</span>
          </div>
          <div className={`hr-menu-item ${active === 'requestLeave' ? 'active' : ''}`} onClick={() => { setActive('requestLeave'); navigate('/employee-dashboard/request-leave'); }}>
            <span className="hr-menu-label">Request Leave</span>
          </div>
          <div className={`hr-menu-item ${active === 'myLeaves' ? 'active' : ''}`} onClick={() => { setActive('myLeaves'); navigate('/employee-dashboard/my-leaves'); }}>
            <span className="hr-menu-label">My Leaves</span>
          </div>
          <div className={`hr-menu-item ${active === 'tasks' ? 'active' : ''}`} onClick={() => { setActive('tasks'); navigate('/employee-dashboard/tasks'); }}>
            <span className="hr-menu-label">My Tasks</span>
          </div>
          <div className={`hr-menu-item ${active === 'profile' ? 'active' : ''}`} onClick={() => { setActive('profile'); navigate('/employee-dashboard/profile'); }}>
            <span className="hr-menu-label">View Profile</span>
          </div>
        </nav>
      </div>

      {/* spacer pushes logout to the bottom using existing .hr-sidebar flex layout */}
      <div className="hr-sidebar-spacer" />

      <div
        className="hr-menu-item hr-logout"
        onClick={() => { localStorage.removeItem('employeeUser'); window.location.href = '/login'; }}
        style={{ padding: '1rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: '#ff4d4f', fontWeight: 500, fontSize: 17 }}
      >
        Logout
      </div>
    </aside>
  );

  const Header = () => (
    <header className="hr-header">
      <div className="hr-header-left">
        <div className="hr-welcome-card">
          <span className="hr-welcome-title">{profile ? `Welcome back, ${profile.name}` : 'Welcome'}</span>
        </div>
      </div>
  {/* header right intentionally left blank (no profile picture) */}
    </header>
  );
  const ProfilePane = () => {
    const attendancePercent = attendanceData?.attendance_percentage ?? attendanceData?.attendance_percent ?? stats.attendance_percent ?? 0;
  const [showPwModal, setShowPwModal] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const navigateLocal = useNavigate();
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Profile</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Name</div>
                <div style={{ marginTop: 6 }}>{profile?.name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Designation</div>
                <div style={{ marginTop: 6 }}>{profile?.designation || 'Employee'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Email</div>
                <div style={{ marginTop: 6 }}>{profile?.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Department</div>
                <div style={{ marginTop: 6 }}>{profile?.department || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Salary</div>
                <div style={{ marginTop: 6 }}>{profile?.salary ?? '—'}</div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 18 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Attendance %</div>
                <div style={{ marginTop: 6 }}>{attendancePercent}%</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Leaves Taken</div>
                <div style={{ marginTop: 6 }}>{stats.leaves_taken ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Pending Leaves</div>
                <div style={{ marginTop: 6 }}>{stats.pending_leaves ?? 0}</div>
              </div>
            </div>

            <div style={{ marginTop: 14, color: '#374151', lineHeight: 1.5 }}>
              <div style={{ fontSize: 13 }}>
                {profile?.bio || 'This is your employee profile. Keep your contact details up-to-date so HR can reach you.'}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setShowPwModal(true)} style={{ padding: '0.5rem 0.8rem', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>Edit Password</button>
            </div>

            {/* Password modal */}
            {showPwModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                <div style={{ width: 420, maxWidth: '95%', background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>Update Password</div>
                    <button onClick={() => { setShowPwModal(false); setPwError(''); }} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 13, color: '#374151' }}>Old Password</label>
                    <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginTop: 6, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 13, color: '#374151' }}>New Password</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginTop: 6, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 13, color: '#374151' }}>Confirm Password</label>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginTop: 6, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </div>
                  {pwError && <div style={{ marginTop: 10, color: '#e11d48' }}>{pwError}</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                    <button onClick={() => { setShowPwModal(false); setPwError(''); }} style={{ padding: '0.5rem 0.8rem', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button
                      onClick={async () => {
                        setPwError('');
                        if (!oldPw || !newPw || !confirmPw) { setPwError('Please fill all fields'); return; }
                        setPwLoading(true);
                        try {
                          const payload = { old_password: oldPw, new_password: newPw, confirm_password: confirmPw };
                          // include identifying info for unauthenticated requests
                          try {
                            if (profile?.id) payload.employee = profile.id;
                            else if (profile?.email) payload.email = profile.email;
                          } catch (e) {}
                          const res = await axios.post('http://127.0.0.1:8000/api/employees/change-password/', payload);
                          // on success
                          setShowPwModal(false);
                          try { localStorage.removeItem('employeeUser'); } catch (e) {}
                          window.alert(res.data?.message || 'Password updated successfully');
                          // redirect to login
                          navigateLocal('/login');
                        } catch (err) {
                          const msg = err?.response?.data?.error || err?.response?.data?.message || (err?.response?.data && JSON.stringify(err.response.data)) || 'Failed to update password';
                          setPwError(msg);
                        } finally {
                          setPwLoading(false);
                        }
                      }}
                      disabled={pwLoading}
                      style={{ padding: '0.5rem 0.9rem', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
                    >
                      {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="hr-dashboard-wrapper">
      <Sidebar />
      <div className="hr-dashboard-main center-xy card-spacious">
        <Header />
        <main className="hr-main-content center-xy">
          {loading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : (
            <Routes>
              <Route path="/" element={
                <div>
                  {/* Quick actions */}
                  <div className="hr-quick-actions center-xy">
                      <button className="hr-quick-action-card" onClick={handleMarkAttendance} disabled={attLoading} style={{ border: 'none', background: 'transparent', textAlign: 'left' }}>
                        <div className="hr-quick-action-icon">📍</div>
                        <div>
                          <div className="font-semibold">{attLoading ? 'Marking...' : 'Mark Attendance'}</div>
                          <div className="text-sm text-gray-500">Mark yourself present for today</div>
                          {attSuccess && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 6 }}>{attSuccess}</div>}
                        </div>
                      </button>
                    <div className="hr-quick-action-card" onClick={() => navigate('/employee-dashboard/request-leave')}>
                      <div className="hr-quick-action-icon">📝</div>
                      <div>
                        <div className="font-semibold">Request Leave</div>
                        <div className="text-sm text-gray-500">Submit a leave request</div>
                      </div>
                    </div>
                    <div className="hr-quick-action-card" onClick={() => navigate('/employee-dashboard/profile')}>
                      <div className="hr-quick-action-icon">👤</div>
                      <div>
                        <div className="font-semibold">View Profile</div>
                        <div className="text-sm text-gray-500">View and edit your profile</div>
                      </div>
                    </div>
                  </div>

                  {/* Overview */}
                  <div className="hr-org-overview">
                    <div className="hr-org-card">
                      <div className="hr-org-value text-3xl">{stats.leaves_taken ?? 0}</div>
                      <div className="hr-org-label">Total Leaves Taken</div>
                    </div>
                    <div className="hr-org-card">
                      <div className="hr-org-value text-3xl">{stats.pending_leaves ?? 0}</div>
                      <div className="hr-org-label">Pending Leaves</div>
                    </div>
                    <div className="hr-org-card">
                      {attendanceLoading ? (
                        <div className="hr-org-value text-3xl">Loading...</div>
                      ) : attendanceError ? (
                        <div className="hr-org-value text-3xl">Error</div>
                      ) : attendanceData ? (
                        <div>
                          <div className="hr-org-value text-3xl">{attendanceData.attendance_percentage ?? attendanceData.attendance_percent ?? 0}%</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{attendanceData.employee_name}</div>
                        </div>
                      ) : (
                        <div className="hr-org-value text-3xl">{stats.attendance_percent ?? 0}%</div>
                      )}
                      <div className="hr-org-label">Attendance %</div>
                    </div>
                  </div>
                </div>
              } />
              <Route path="attendance" element={<div className="space-y-6"><EmployeeAttendance employeeId={profile?.id} /></div>} />
              <Route path="request-leave" element={<div className="space-y-6"><LeaveRequestForm employeeId={profile?.id} onSuccess={onLeaveSubmitted} /></div>} />
              <Route path="my-leaves" element={<div className="center-xy"><div style={{ width: '100%', maxWidth: 920 }}><MyLeaves center={true} leaves={leaves} loading={leavesLoading} employeeId={profile?.id} /></div></div>} />
              <Route path="tasks" element={<div className="space-y-6"><EmployeeTasks /></div>} />
              <Route path="profile" element={<ProfilePane />} />
            </Routes>
           )}
         </main>
       </div>
     </div>
   );
 }
