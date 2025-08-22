import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function HrTasks() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    employee: '',
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium'
  });
  const [message, setMessage] = useState(null);

  // auto-dismiss message after 4s
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const getHrId = () => {
    const direct = localStorage.getItem('hrId');
    if (direct) return direct;
    const raw = localStorage.getItem('hrUser');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed;
    } catch (e) {
      return raw;
    }
  };
  const hrId = getHrId();

  // min date for date inputs (today in local timezone) to prevent selecting past dates
  const getTodayInputValue = () => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const minDate = getTodayInputValue();

  useEffect(() => {
    if (hrId) fetchTasks();
  }, [hrId]);

  const fetchEmployees = async (query) => {
    try {
      setSearchLoading(true);
      const url = query ? `http://127.0.0.1:8000/api/employees/?search=${encodeURIComponent(query)}` : 'http://127.0.0.1:8000/api/employees/';
      const res = await axios.get(url);
      const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const filtered = query && query.trim() ? list.filter(emp => (emp.name || '').toLowerCase().includes(query.toLowerCase())) : list;
      setSearchResults(filtered);
      setEmployees(filtered);
    } catch (err) {
      console.error('fetchEmployees error', err, err?.response?.data);
      setSearchResults([]);
      setEmployees([]);
      setMessage({ type: 'error', text: 'Failed to load employees.' });
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/tasks/', { params: { hr_id: hrId } });
      const tasksList = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setTasks(tasksList);
    } catch (err) {
      console.error('fetchTasks error', err, err?.response?.data);
      setMessage({ type: 'error', text: 'Failed to load tasks.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setSelectedEmployee(null);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) fetchEmployees(searchQuery);
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!hrId) {
      setMessage({ type: 'error', text: 'No HR id found in localStorage (hrId). Please login as HR.' });
      return;
    }
    if (!selectedEmployee && !form.employee) {
      setMessage({ type: 'error', text: 'Select an employee (search by name or email).' });
      return;
    }
    if (!form.title || !form.title.trim()) {
      setMessage({ type: 'error', text: 'Enter a title for the task.' });
      return;
    }
    if (!form.due_date) {
      setMessage({ type: 'error', text: 'Please provide a due date.' });
      return;
    }
    try {
      setSubmitting(true);
      const safePayload = {
        ...form,
        hr: Number(hrId),
        employee: Number((selectedEmployee && selectedEmployee.id) || form.employee),
      };
      if (safePayload.due_date) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(safePayload.due_date);
        if (due < today) {
          setMessage({ type: 'error', text: 'Due date cannot be in the past.' });
          return;
        }
      }
      const res = await axios.post('http://127.0.0.1:8000/api/tasks/', safePayload);
      console.log('create task response', res.data);
      setMessage({ type: 'success', text: 'Task created.' });
      setForm({ employee: '', title: '', description: '', due_date: '', priority: 'Medium' });
      setSelectedEmployee(null);
      fetchTasks();
    } catch (err) {
      console.error('create task error', err, err?.response?.data);
      let text = 'Failed to create task.';
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') text = err.response.data;
        else if (err.response.data.error) text = err.response.data.error;
        else text = JSON.stringify(err.response.data);
      } else if (err.message) text = err.message;
      setMessage({ type: 'error', text });
    }
    finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const base = 'px-2 py-1 rounded text-sm';
    if (status === 'Pending') return <span className={`${base} bg-yellow-200 text-yellow-800`}>{status}</span>;
    if (status === 'In Progress') return <span className={`${base} bg-blue-200 text-blue-800`}>{status}</span>;
    if (status === 'Completed') return <span className={`${base} bg-green-200 text-green-800`}>{status}</span>;
    return <span className={base}>{status}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 center-xy">
      {message && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', minWidth: 320, maxWidth: '90%', background: message.type === 'error' ? '#fff5f5' : '#f0fdf4', color: message.type === 'error' ? '#991b1b' : '#065f46', border: '1px solid rgba(0,0,0,0.06)', padding: '14px 18px', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>{message.text}</div>
              <button onClick={() => setMessage(null)} style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          </div>
        </div>
      )}

  <div className="attendance-card card-spacious">
        <div className="attendance-header">
          <h2 className="text-2xl font-semibold">Task Management</h2>
          <div className="attendance-filters">
            <input value={searchQuery} onChange={handleSearchChange} placeholder="Search by name" />
            <select className="ml-2 p-2 rounded border">
              <option>All Departments</option>
              <option>Development</option>
              <option>Marketing</option>
              <option>Sales</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="leave-form">
          <div className="leave-row">
            <div className="field">
              <label>Employee</label>
              <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search employees..." className="input" />
              {searchLoading && <div className="text-sm text-gray-500 mt-1">Searching...</div>}
              {searchResults && searchResults.length > 0 && (
                <ul className="mt-2 max-h-44 overflow-auto border rounded bg-white shadow-sm z-10">
                  {searchResults.map(emp => (
                    <li key={emp.id} className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedEmployee(emp); setSearchQuery(emp.name); setSearchResults([]); }}>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-gray-600">{emp.email} • {emp.department}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="field">
              <label>Title</label>
              <input name="title" value={form.title} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="textarea" rows="3" />
          </div>

              <div className="leave-row">
                <div className="field">
                  <label>Due date</label>
                  <input type="date" name="due_date" value={form.due_date} onChange={handleChange} className="input" min={minDate} />
                </div>
            <div className="field">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>

          <div className="leave-actions">
            <button type="submit" disabled={submitting} className={`btn-primary`}>{submitting ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>

        <h3 className="text-lg font-medium mt-6 mb-4">Assigned Tasks</h3>
        {loading ? (
          <div>Loading tasks...</div>
        ) : (
          <div className="table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Due</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">{t.employee_name}</td>
                    <td className="py-4 px-4 font-medium">{t.title}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{t.description}</td>
                    <td className="py-4 px-4">{t.due_date}</td>
                    <td className="py-4 px-4">{t.priority}</td>
                    <td className="py-4 px-4">{t.status || 'Pending'}</td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan="5" className="p-6 text-center text-gray-500">No tasks</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}