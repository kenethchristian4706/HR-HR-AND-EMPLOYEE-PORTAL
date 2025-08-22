import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/attendance.css';

export default function MyLeaves({ leaves = [], loading = false, employeeId = null, center = false }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [q, setQ] = useState('');
  const [localLeaves, setLocalLeaves] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);

  const sourceLeaves = (Array.isArray(leaves) && leaves.length) ? leaves : localLeaves;

  const counts = useMemo(() => {
    const total = sourceLeaves.length;
    const approved = sourceLeaves.filter(l => String(l.status).toLowerCase() === 'approved').length;
    const pending = sourceLeaves.filter(l => String(l.status).toLowerCase() === 'pending').length;
    const rejected = sourceLeaves.filter(l => String(l.status).toLowerCase() === 'rejected').length;
    return { total, approved, pending, rejected };
  }, [sourceLeaves]);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return sourceLeaves.filter(l => {
      if (statusFilter !== 'All' && String(l.status).toLowerCase() !== String(statusFilter).toLowerCase()) return false;
      if (!lower) return true;
      // search by reason, start_date, end_date
      const reason = (l.reason || '').toString();
      const start = (l.start_date || '').toString();
      const end = (l.end_date || '').toString();
      return (
        reason.toLowerCase().includes(lower) ||
        start.toLowerCase().includes(lower) ||
        end.toLowerCase().includes(lower)
      );
    });
  }, [sourceLeaves, statusFilter, q]);

  useEffect(() => {
    // if parent didn't provide leaves, try to fetch for employeeId
    if ((Array.isArray(leaves) && leaves.length) || !employeeId) return;
    let mounted = true;
    const fetchLeaves = async () => {
      setLocalLoading(true);
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/leave/mine/?employee=${employeeId}`);
        if (!mounted) return;
        setLocalLeaves(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!mounted) return;
        setLocalLeaves([]);
      } finally {
        if (mounted) setLocalLoading(false);
      }
    };
    fetchLeaves();
    return () => { mounted = false; };
  }, [employeeId, leaves]);

  return (
    <div className={center ? 'center-xy' : undefined}>
      <div className="leave-container" style={center ? { width: '100%', gridTemplateColumns: '1fr' } : undefined}>
        <div className={center ? 'leave-card card-spacious' : 'leave-card'} style={center ? { margin: '0 auto', maxWidth: 820 } : undefined}>
          <div className="leave-card-header">
            <h3 className="leave-title">📁 My Leaves</h3>
            <div className="leave-actions" style={{ gap: 8 }}>
              <div className="small-stats" style={{ display: 'flex', gap: 10 }}>
                <div className="stat">
                  <div className="stat-value">{counts.total}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat">
                  <div className="stat-value text-green-600">{counts.approved}</div>
                  <div className="stat-label">Approved</div>
                </div>
                <div className="stat">
                  <div className="stat-value text-yellow-600">{counts.pending}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="stat">
                  <div className="stat-value text-red-600">{counts.rejected}</div>
                  <div className="stat-label">Rejected</div>
                </div>
              </div>
            </div>
          </div>

          <div className="leave-card-body">
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <input placeholder="Search reason or date" value={q} onChange={(e) => setQ(e.target.value)} className="input" style={{ minWidth: 220 }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <div style={{ marginLeft: 'auto' }}>
                <button className="btn-primary" onClick={() => { setQ(''); setStatusFilter('All'); }}>Reset</button>
              </div>
            </div>

            { (loading || localLoading) ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Start</th>
                      <th>End</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => (
                      <tr key={l.id}>
                        <td>{l.start_date}</td>
                        <td>{l.end_date}</td>
                        <td className="max-w-xs">{l.reason}</td>
                        <td>
                          <span className={`px-2 py-1 rounded text-sm ${l.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : l.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td>{new Date(l.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={5} className="no-data">No leaves found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
