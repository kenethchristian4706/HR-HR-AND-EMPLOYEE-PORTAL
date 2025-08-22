import React from 'react';
import '../styles/attendance.css';

export default function LeaveListHR({ leaves, loading, onAction }) {
  if (loading) return <div className="loading">Loading...</div>;
  if (!leaves || leaves.length === 0) return <div className="no-data">No leaves found.</div>;

  return (
    <div className="table-wrapper">
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Employee ID</th>
            <th>Start</th>
            <th>End</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Submitted</th>
            {onAction && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {leaves.map(l => (
            <tr key={l.id}>
              <td className="employee-name">{l.employee?.name ?? l.employee}</td>
              <td>{l.employee?.id ?? l.employee}</td>
              <td>{l.start_date}</td>
              <td>{l.end_date}</td>
              <td className="max-w-xs">{l.reason}</td>
              <td>
                <span className={`px-2 py-1 rounded text-sm ${l.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : l.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {l.status}
                </span>
              </td>
              <td>{new Date(l.created_at).toLocaleString()}</td>
              {onAction && (
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onAction(l, 'approve')} className="btn-primary">Approve</button>
                    <button onClick={() => onAction(l, 'reject')} className="btn-primary" style={{ background: '#dc2626' }}>Reject</button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
