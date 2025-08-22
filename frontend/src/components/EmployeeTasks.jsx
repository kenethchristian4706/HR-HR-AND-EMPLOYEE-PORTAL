import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/attendance.css';

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Robustly obtain employee id: try employeeId direct key, else parse employeeUser
  const getEmployeeId = () => {
    const direct = localStorage.getItem('employeeId');
    if (direct) return direct;
    const raw = localStorage.getItem('employeeUser');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed;
    } catch (e) {
      return raw;
    }
  };

  const employeeId = getEmployeeId();

  useEffect(() => {
    if (employeeId) fetchTasks();
  }, [employeeId]);

  const fetchTasks = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/tasks/my-tasks/', { params: { employee_id: employeeId } });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || res.data || []);
      setTasks(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load tasks.' });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    setMessage(null);
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, _updating: true } : t));
      const res = await axios.patch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, { status: newStatus, employee: employeeId });
      const updated = res.data;
      if (updated && updated.id) {
        setTasks(prev => prev.map(t => (t.id === updated.id ? { ...updated, _updating: false } : t)));
      } else {
        await fetchTasks();
      }
      setMessage({ type: 'success', text: 'Task updated.' });
    } catch (err) {
      console.error(err);
      const text = err?.response?.data?.detail || JSON.stringify(err?.response?.data) || 'Failed to update.';
      setMessage({ type: 'error', text });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, _updating: false } : t));
    }
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const totalCount = tasks.length;
  const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-5xl mx-auto">
    <div className="attendance-card card-spacious">
        <h2 className="text-xl font-semibold mb-4">My Tasks</h2>

      {message && (
        <div className={`mb-4 p-2 rounded ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">Progress: {completedCount} / {totalCount} completed</div>
        <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
          <div style={{ width: `${pct}%` }} className="h-3 bg-green-500" />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="employee-name">{t.title}</td>
                  <td className="text-sm text-gray-700">{t.description || '\u2014'}</td>
                  <td>{t.due_date || '\u2014'}</td>
                  <td>{t.priority || 'Medium'}</td>
                  <td>
                    <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="input" disabled={t._updating}>
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <button onClick={() => updateStatus(t.id, 'Completed')} className={`btn-primary`} disabled={t._updating}>
                      {t._updating ? 'Saving...' : 'Mark Completed'}
                    </button>
                  </td>
                </tr>
              ))}

              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-data">No tasks assigned.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}