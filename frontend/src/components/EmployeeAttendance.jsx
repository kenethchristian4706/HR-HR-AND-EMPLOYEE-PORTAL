import React, { useEffect, useState } from 'react';
import axios from 'axios';

import '../styles/attendance.css';

export default function EmployeeAttendance({ employeeId }) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [todayRecord, setTodayRecord] = useState(null);
  const [error, setError] = useState(null);

  const fetchToday = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/attendance/', { params: { date: new Date().toISOString().slice(0,10), employee: employeeId } });
      setTodayRecord(res.data && res.data.length ? res.data[0] : null);
    } catch (err) {
      setError('Failed to fetch today\'s attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchRange = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const params = { employee: employeeId };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await axios.get('http://127.0.0.1:8000/api/attendance/', { params });
      setRecords(res.data || []);
    } catch (err) {
      setError('Failed to fetch records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchToday(); }, [employeeId]);

  const markAttendance = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/attendance/mark/', { employee: employeeId });
      setTodayRecord(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const markCheckout = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/attendance/checkout/', { employee: employeeId });
      setTodayRecord(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-card">
      <div className="attendance-header">
        <h3>Your Attendance</h3>
        <div className="attendance-filters">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button className="btn-primary" onClick={fetchRange}>Show</button>
        </div>
      </div>

      <div className="attendance-body">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="today-block">
          <div><strong>Today:</strong> {todayRecord ? todayRecord.status : 'No record'}</div>
          <div>Check-in: {todayRecord?.check_in || '—'}</div>
          <div>Check-out: {todayRecord?.check_out || '—'}</div>
          <div className="today-actions">
            {!todayRecord || todayRecord.status !== 'Present' ? (
              <button className="btn-primary" onClick={markAttendance} disabled={loading}>Mark Attendance</button>
            ) : (
              <button className="btn-primary" onClick={markCheckout} disabled={loading || !!todayRecord.check_out}>{todayRecord.check_out ? 'Checked out' : 'Mark Checkout'}</button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr><th>Date</th><th>Status</th><th>Check-in</th><th>Check-out</th></tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.status}</td>
                  <td>{r.check_in || '—'}</td>
                  <td>{r.check_out || '—'}</td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={4} className="no-data">No records for selected range</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
