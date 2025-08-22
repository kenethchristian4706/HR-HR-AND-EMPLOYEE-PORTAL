import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/attendance.css';

export default function LeaveRequestForm({ employeeId, onSuccess }) {
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const fetchLeaves = async () => {
    if (!employeeId) return;
    setLeavesLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/leave/mine/?employee=${employeeId}`);
      setLeaves(res.data || []);
    } catch (err) {
      setLeaves([]);
    } finally {
      setLeavesLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!employeeId) { setError('Employee id not available'); return; }
  // client-side validations
  const today = new Date().toISOString().slice(0,10);
  if (!form.start_date || !form.end_date) { setError('Please select start and end dates'); return; }
  if (form.start_date < today || form.end_date < today) { setError('Cannot select past dates'); return; }
  if (form.start_date > form.end_date) { setError('Start date cannot be after end date'); return; }
  // check overlap with any approved leave in local cache
  const overlap = leaves.some(l => l.status === 'Approved' && !(form.end_date < l.start_date || form.start_date > l.end_date));
  if (overlap) { setError('You already have an approved leave overlapping this range'); return; }

  setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/leave/request/', { employee: employeeId, ...form });
      setForm({ start_date: '', end_date: '', reason: '' });
      if (onSuccess) onSuccess();
      await fetchLeaves();
    } catch (err) {
      setError(err.response?.data || 'Failed to submit leave');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setForm({ start_date: '', end_date: '', reason: '' });

  return (
    <div className="leave-container">
      <div className="leave-card">
        <div className="leave-card-header">
          <h3 className="leave-title">📅 Request Leave</h3>
        </div>
    <form onSubmit={handleSubmit} className="leave-form">
          <div className="leave-row">
            <div className="field">
              <label>Start Date</label>
      <input name="start_date" type="date" className="input" value={form.start_date} onChange={handleChange} required min={new Date().toISOString().slice(0,10)} />
            </div>
            <div className="field">
              <label>End Date</label>
      <input name="end_date" type="date" className="input" value={form.end_date} onChange={handleChange} required min={new Date().toISOString().slice(0,10)} />
            </div>
          </div>

          <div className="field">
            <label>Reason</label>
            <textarea name="reason" className="textarea" value={form.reason} onChange={handleChange} rows={4} required />
          </div>

          <div className="leave-actions">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
            <button type="button" className="btn-secondary" onClick={handleReset} disabled={loading}>Reset</button>
          </div>

          {error && <div className="error-text">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
        </form>
      </div>

      <div className="leave-history">
        <h4>Leave History</h4>
        {leavesLoading ? <div className="loading">Loading...</div> : (
          <div className="table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr><th>Start</th><th>End</th><th>Reason</th><th>Status</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td>{l.reason}</td>
                    <td>{l.status}</td>
                    <td>{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {leaves.length === 0 && <tr><td colSpan={5} className="no-data">No leave history</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
