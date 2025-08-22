import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HrDashboard.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaUsers, FaBuilding, FaCalendarAlt, FaCog, FaSignOutAlt, FaUserPlus, FaUserCircle, FaDoorOpen, FaTasks } from 'react-icons/fa';
import EmployeePage from './EmployeePage';
import LeaveList from './components/LeaveList';
import HrLeaveManagement from './components/HrLeaveManagement';
import HRAttendance from './components/HRAttendance';
import HrCharts from './components/HrCharts';
import HrTasks from './components/HrTasks'; // << added import

const sidebarMenu = [
  { label: 'Dashboard', icon: <FaHome />, path: 'dashboard' },
  { label: 'Employees', icon: <FaUsers />, path: 'employees' },
  { label: 'Attendance', icon: <FaCalendarAlt />, path: 'attendance' },
  // replaced Departments with Tasks
  { label: 'Tasks', icon: <FaTasks />, path: 'tasks' },
  { label: 'Leave', icon: <FaCalendarAlt />, path: 'leave' },
];

const quickActions = [
  { label: 'Add Employee', icon: <FaUserPlus />, path: '/hr-dashboard/add-employee' },
  { label: 'Departments', icon: <FaBuilding />, path: '/hr-dashboard/departments' },
  { label: 'Employees', icon: <FaUsers />, path: '/hr-dashboard/view-employees' },
];

// Load logged-in user (HR) from localStorage to display dynamic welcome
const defaultAvatar = 'https://randomuser.me/api/portraits/men/32.jpg';
let storedUser = null;
try {
  const raw = localStorage.getItem('hrUser');
  storedUser = raw ? JSON.parse(raw) : null;
} catch (e) {
  storedUser = null;
}
const user = storedUser || { name: 'HR User', avatar: defaultAvatar };

const Sidebar = ({ view, onNavigate, onLogout }) => (
  <aside
    className="hr-sidebar"
    style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: 250,
      background: '#23272f',
      color: '#fff',
      boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minWidth: 220
    }}
  >
    <div>
      <div className="hr-sidebar-title" style={{ fontWeight: 700, fontSize: 24, padding: '2rem 1.5rem', letterSpacing: 1, color: '#fff' }}>
        HR+
      </div>
      <nav className="hr-sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sidebarMenu.map(item => (
          <div
            key={item.label}
            className={`hr-menu-item${view === item.path ? ' active' : ''}`}
            onClick={() => onNavigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              cursor: 'pointer',
              background: view === item.path ? '#181b20' : 'none',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 17,
              transition: 'background 0.2s'
            }}
          >
            {/* icon removed; only label */}
            <span className="hr-menu-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>

    <div
      className="hr-menu-item hr-logout"
      onClick={onLogout}
      style={{
        padding: '1rem 1.5rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#ff4d4f',
        fontWeight: 500,
        fontSize: 17
      }}
    >
      <span className="hr-menu-label">Logout</span>
    </div>
  </aside>
);

const Header = ({ user, onProfileMenu }) => (
  <header className="hr-header">
    <div className="hr-header-left">
      <div className="hr-welcome-card">
        <span className="hr-welcome-title">Welcome back, {user.name}</span>
      </div>
    </div>
    <div className="hr-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {/* avatar/logo removed: show simple name or keep empty */}
      <div style={{ fontWeight: 600, color: '#111827' }}>{user.name}</div>
      <div className="hr-header-dropdown" style={{ display: 'none' }}>
        <span className="hr-header-dropdown-item">Profile</span>
        <span className="hr-header-dropdown-item">Settings</span>
        <span className="hr-header-dropdown-item" onClick={onProfileMenu}>Logout</span>
      </div>
    </div>
  </header>
);

const QuickActions = ({ onNavigate }) => (
  <div className="hr-quick-actions">
    {quickActions.map(action => (
      <div key={action.label} className="hr-quick-action-card" onClick={() => onNavigate(action.path)}>
        <span className="hr-quick-action-icon">{action.icon}</span>
        <span className="hr-quick-action-label">{action.label}</span>
      </div>
    ))}
  </div>
);

const OrgOverview = ({ employeesCount, departmentsCount, loading, error }) => (
  <div className="hr-org-overview">
    <div className="hr-org-card">
      <span className="hr-org-value">
        {loading ? 'Loading...' : error ? 'Error fetching data' : employeesCount}
      </span>
      <span className="hr-org-label">Employees</span>
    </div>
    <div className="hr-org-card">
      <span className="hr-org-value">
        {loading ? 'Loading...' : error ? 'Error fetching data' : departmentsCount}
      </span>
      <span className="hr-org-label">Departments</span>
    </div>
  </div>
);

const AddEmployee = ({ onViewEmployees, onAdded }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', designation: '', salary: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hrId = 1;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        await axios.post('http://127.0.0.1:8000/api/employee/create/', { ...form, hr: hrId });
      if (onViewEmployees) onViewEmployees();
      if (onAdded) onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-content">
  <h2 className="hr-card-title">Add Employee</h2>
  <form className="hr-form" onSubmit={handleSubmit} style={{ maxWidth: 820 }}>
        <div className="hr-form-row">
          <div className="hr-field">
            <label>Name</label>
            <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="hr-field">
            <label>Email</label>
            <input name="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
          </div>
        </div>

        <div className="hr-form-row">
          <div className="hr-field">
            <label>Password</label>
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="hr-field">
            <label>Department</label>
            <input name="department" placeholder="Department" value={form.department} onChange={handleChange} required />
          </div>
        </div>

        <div className="hr-form-row">
          <div className="hr-field">
            <label>Designation</label>
            <input name="designation" placeholder="Designation" value={form.designation} onChange={handleChange} required />
          </div>
          <div className="hr-field">
            <label>Salary</label>
            <input name="salary" type="number" placeholder="Salary" value={form.salary} onChange={handleChange} required />
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Employee'}</button>
          <button type="button" className="btn-secondary" onClick={() => setForm({ name: '', email: '', password: '', department: '', designation: '', salary: '' })}>Clear</button>
        </div>
      </form>
      {error && <div className="hr-error">{error}</div>}
    </div>
  );
};

const EditEmployee = ({ employeeId, onViewEmployees }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', designation: '', salary: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hrId = 1;

  useEffect(() => {
    if (!employeeId) return;
    axios.get(`http://127.0.0.1:8000/api/employee/${employeeId}/`)
      .then(res => {
        setForm({ ...res.data, password: '' });
        setLoading(false);
      })
      .catch(() => setError('Failed to load employee'));
  }, [employeeId]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.put(`http://127.0.0.1:8000/api/employee/update/${employeeId}/`, { ...form, hr: hrId });
      if (onViewEmployees) onViewEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="hr-content">Loading...</div>;

  return (
    <div className="hr-content">
      <h2>Edit Employee</h2>
      <form className="hr-form" onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password (leave blank to keep)" value={form.password} onChange={handleChange} />
        <input name="department" placeholder="Department" value={form.department} onChange={handleChange} required />
        <input name="designation" placeholder="Designation" value={form.designation} onChange={handleChange} required />
        <input name="salary" type="number" placeholder="Salary" value={form.salary} onChange={handleChange} required />
        <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Employee'}</button>
      </form>
      {error && <div className="hr-error">{error}</div>}
    </div>
  );
};

const DeleteEmployee = ({ employeeId, onViewEmployees }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.delete(`http://127.0.0.1:8000/api/employee/delete/${employeeId}/`);
      if (onViewEmployees) onViewEmployees();
    } catch (err) {
      setError('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-content">
      <h2>Delete Employee</h2>
      <p>Are you sure you want to delete this employee?</p>
      <button className="hr-delete-btn" onClick={handleDelete} disabled={loading}>{loading ? 'Deleting...' : 'Yes, Delete'}</button>
      <button className="hr-cancel-btn" onClick={onViewEmployees}>Cancel</button>
      {error && <div className="hr-error">{error}</div>}
    </div>
  );
};

const ViewEmployees = ({ onEdit, onDelete }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hrId = 1;

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/employee/list/?hr_id=${hrId}`)
      .then(res => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch employees');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="hr-content">Loading...</div>;

  return (
    <div className="hr-content">
      <h2>Employees</h2>
      {error && <div className="hr-error">{error}</div>}
      <table className="hr-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.department}</td>
              <td>{emp.designation}</td>
              <td>{emp.salary}</td>
              <td>
                <button className="hr-action-btn" onClick={() => onEdit(emp.id)}>Edit</button>
                <button className="hr-action-btn" onClick={() => onDelete(emp.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const HrDashboard = () => {
  const [view, setView] = useState("home");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newEmployeeForm, setNewEmployeeForm] = useState({ name: '', email: '', department: '', designation: '', salary: '' });
  const [newEmployeeLoading, setNewEmployeeLoading] = useState(false);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [departmentsCount, setDepartmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCounts = () => {
    setLoading(true);
    setError(false);
    axios.get("http://127.0.0.1:8000/api/counts/")
      .then(res => {
        setEmployeesCount(res.data.employees_count ?? 0);
        setDepartmentsCount(res.data.departments_count ?? 0);
      })
      .catch(err => {
        setError(true);
        setEmployeesCount(0);
        setDepartmentsCount(0);
      })
      .finally(() => setLoading(false));
  };

  const fetchPendingLeaves = async () => {
    setPendingLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/leave/pending/');
      setPendingLeaves(res.data);
    } catch (err) {
      setPendingLeaves([]);
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchPendingLeaves();
  }, []);

  // keep view in sync with the URL so navigation updates the address bar
  useEffect(() => {
    try {
      const rel = location.pathname.replace('/hr-dashboard', '').replace(/^\//, '');
      if (!rel) {
        setView('home');
        return;
      }
      const parts = rel.split('/');
      const first = parts[0];
      if (first === 'add-employee') setView('addEmployee');
      else if (first === 'view-employees' || first === 'employees') setView('employees');
      else if (first === 'edit' && parts[1]) { setSelectedEmployee(parts[1]); setView('editEmployee'); }
      else if (first === 'delete' && parts[1]) { setSelectedEmployee(parts[1]); setView('deleteEmployee'); }
      else if (first === 'leave') { setView('leave'); }
      else if (first === 'attendance') { setView('attendance'); }
      else if (first === 'tasks') { setView('tasks'); } // << support tasks route
      else setView('home');
    } catch (e) {
      setView('home');
    }
  }, [location.pathname]);

  // Handlers for navigation and actions
  const handleAddEmployee = () => { navigate('/hr-dashboard/add-employee'); setView('addEmployee'); };
  const handleViewEmployees = () => { navigate('/hr-dashboard/view-employees'); setView('employees'); };
  const handleEditEmployee = (id) => { setSelectedEmployee(id); navigate(`/hr-dashboard/edit/${id}`); setView('editEmployee'); };
  const handleDeleteEmployee = (id) => { setSelectedEmployee(id); navigate(`/hr-dashboard/delete/${id}`); setView('deleteEmployee'); };
  const handleLogout = () => { try { localStorage.removeItem('hrUser'); } catch (e) {} ; navigate('/login'); };
  const handleProfileMenu = () => { navigate('/profile'); };
  const handleNavigate = (path) => {
    // if full path provided, navigate directly
    if (!path) return;
    if (path.startsWith('/')) {
      navigate(path);
      return;
    }
    // support token paths used in the old sidebar config
    if (path === 'dashboard') { navigate('/hr-dashboard'); return; }
    if (path === 'employees') { navigate('/hr-dashboard/view-employees'); return; }
    if (path === 'leave') { navigate('/hr-dashboard/leave'); return; }
    if (path === 'attendance') { navigate('/hr-dashboard/attendance'); return; }
    if (path === 'tasks') { navigate('/hr-dashboard/tasks'); return; } // << new mapping
    // fallback: navigate to hr dashboard root
    navigate('/hr-dashboard');
  };

  const handleLeaveAction = async (leave, action) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/leave/action/${leave.id}/`, { action });
      // optimistic update: remove from list
      setPendingLeaves(prev => prev.filter(l => l.id !== leave.id));
    } catch (err) {
      // optionally show error
      fetchPendingLeaves();
    }
  };

  const handleNewEmployeeChange = (e) => setNewEmployeeForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setNewEmployeeLoading(true);
    try {
      // post to backend (best-effort); hrId is not wired here, backend may accept default
      await axios.post('http://127.0.0.1:8000/api/employee/create/', { ...newEmployeeForm, hr: 1 });
      setNewEmployeeForm({ name: '', email: '', department: '', designation: '', salary: '' });
      // refresh counts
      fetchCounts();
    } catch (err) {
      // ignore error for now, optionally show a toast
    } finally {
      setNewEmployeeLoading(false);
    }
  };

  return (
    <div className="hr-dashboard-wrapper" style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fa' }}>
      <Sidebar view={view} onNavigate={handleNavigate} onLogout={handleLogout} />
      <div className="hr-dashboard-main" style={{ flex: 1, marginLeft: 220, minHeight: '100vh', padding: '2.5rem 3rem' }}>
        {/* Only switch right-side content */}
        {view === "home" && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Welcome back, {user.name}!</div>
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: 32 }}>
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem 2rem', minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s', fontWeight: 500 }} onClick={handleAddEmployee}>
                <span style={{ fontSize: 28, color: '#23272f', marginBottom: 8 }}><FaUserPlus /></span>
                <span style={{ fontSize: 18 }}>Add Employee</span>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem 2rem', minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontWeight: 500 }}>
                <span style={{ fontSize: 28, color: '#23272f', marginBottom: 8 }}><FaBuilding /></span>
                <span style={{ fontSize: 18 }}>Departments</span>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem 2rem', minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontWeight: 500 }} onClick={() => handleViewEmployees()}> {/* Fix: Employees card opens Employees list */}
                <span style={{ fontSize: 28, color: '#23272f', marginBottom: 8 }}><FaUsers /></span>
                <span style={{ fontSize: 18 }}>Employees</span>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem 2rem', minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontWeight: 500 }} onClick={() => handleNavigate('leave')}>
                <span style={{ fontSize: 28, color: '#23272f', marginBottom: 8 }}><FaDoorOpen /></span>
                <span style={{ fontSize: 18 }}>Leave</span>
              </div>
            </div>
            {/* Summary Cards */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: 32 }}>
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem 2.5rem', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#23272f' }}>{loading ? '...' : employeesCount}</div>
                <div style={{ color: '#888', fontSize: 18, marginTop: 8 }}>Total Employees</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem 2.5rem', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#23272f' }}>{loading ? '...' : departmentsCount}</div>
                <div style={{ color: '#888', fontSize: 18, marginTop: 8 }}>Total Departments</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem 2.5rem', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#23272f' }}>{pendingLoading ? '...' : pendingLeaves.length}</div>
                <div style={{ color: '#888', fontSize: 18, marginTop: 8 }}>Pending Leaves</div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem 2.5rem', marginTop: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 500, color: '#23272f' }}>Manage your Employee.</div>
            </div>

            {/* Charts placed at the bottom of the dashboard, compact row */}
            <div style={{ marginTop: 20, display: 'flex', gap: 16, alignItems: 'stretch' }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
                  <HrCharts />
                </div>
              </div>
            </div>
          </div>
        )}
        {view === "employees" && (
          <main className="hr-main-content" style={{ maxWidth: 900, margin: '0 auto' }}>
            <EmployeePage />
          </main>
        )}
        {view === 'attendance' && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <HRAttendance />
          </div>
        )}
        {view === 'tasks' && (  /* << render HrTasks when view === 'tasks' */
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <HrTasks />
          </div>
        )}
        {view === "addEmployee" && <AddEmployee onViewEmployees={handleViewEmployees} onAdded={fetchCounts} />}
        {view === "editEmployee" && <EditEmployee employeeId={selectedEmployee} onViewEmployees={handleViewEmployees} />}
        {view === "deleteEmployee" && <DeleteEmployee employeeId={selectedEmployee} onViewEmployees={handleViewEmployees} />}
        {view === 'leave' && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Use dedicated HR leave management component for richer UI */}
            <HrLeaveManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default HrDashboard;
