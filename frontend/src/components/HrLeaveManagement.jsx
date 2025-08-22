import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LeaveList from './LeaveList';
import '../styles/attendance.css';

export default function HrLeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState({ q: '', department: '', start_date: '', end_date: '' });

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.department) params.department = filters.department;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      // reuse a backend endpoint to list leaves; prefer leave/pending for pending only
      const res = await axios.get('http://127.0.0.1:8000/api/leave/pending/', { params });
      setLeaves(res.data || []);
    } catch (err) {
      setError('Failed to load leaves');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleAction = async (leave, action) => {
    setError(null);
    try {
      await axios.post(`http://127.0.0.1:8000/api/leave/action/${leave.id}/`, { action });
      setMessage(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      await fetchLeaves();
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    }
  };

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <div className="attendance-card card-spacious center-xy" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="attendance-header">
        <h3>Leave Management</h3>
        <div className="attendance-filters">
          <input name="q" placeholder="Search name or ID" value={filters.q} onChange={handleFilterChange} />
          <input name="department" placeholder="Department" value={filters.department} onChange={handleFilterChange} />
          <input name="start_date" type="date" value={filters.start_date} onChange={handleFilterChange} />
          <input name="end_date" type="date" value={filters.end_date} onChange={handleFilterChange} />
          <button className="btn-primary" onClick={fetchLeaves}>Apply</button>
        </div>
      </div>

      {message && <div style={{ background: '#EEF2FF', color: '#3730A3', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{message}</div>}
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <LeaveList leaves={leaves} loading={loading} onAction={handleAction} />
    </div>
  );
}
