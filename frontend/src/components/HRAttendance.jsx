import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/attendance.css';

export default function HRAttendance() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ q: '', department: '', start_date: '', end_date: '' });
  const [error, setError] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.department) params.department = filters.department;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await axios.get('http://127.0.0.1:8000/api/attendance/', { params });
      setRecords(res.data);
    } catch (err) {
      setError('Failed to load attendance records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <div className="attendance-card">
      <div className="attendance-header">
        <h3>Attendance Report</h3>
        <div className="attendance-filters">
          <input name="q" placeholder="Search name or ID" value={filters.q} onChange={handleFilterChange} />
          <input name="department" placeholder="Department" value={filters.department} onChange={handleFilterChange} />
          <input name="start_date" type="date" value={filters.start_date} onChange={handleFilterChange} />
          <input name="end_date" type="date" value={filters.end_date} onChange={handleFilterChange} />
          <button className="btn-primary" onClick={fetchRecords}>Apply</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Check-out</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td className="employee-name">{r.employee_name || '—'}</td>
                  <td>{r.employee}</td>
                  <td>{r.date}</td>
                  <td>{r.status}</td>
                  <td>{r.check_in || '—'}</td>
                  <td>{r.check_out || '—'}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={6} className="no-data">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {error && <div className="text-red-600 mt-3">{error}</div>}
    </div>
  );
}
