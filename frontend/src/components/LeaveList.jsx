import React from 'react';

export default function LeaveList({ leaves, loading, onAction }) {
  if (loading) return <div className="text-center text-gray-600">Loading...</div>;
  if (!leaves || leaves.length === 0) return <div className="text-gray-600">No leaves found.</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto card-spacious">
      <h3 className="text-xl font-semibold mb-4">Leave Requests</h3>
      <table className="min-w-full table-auto" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
        <thead>
          <tr className="text-left text-sm text-gray-600">
            {/* Employee column may be missing for employee-facing lists */}
            <th className="pb-2">Employee</th>
            <th className="pb-2">Start</th>
            <th className="pb-2">End</th>
            <th className="pb-2">Reason</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Submitted</th>
            <th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map(l => (
              <tr key={l.id} style={{ background: '#fff', borderRadius: 10 }}>
              <td style={{ padding: '14px 12px', verticalAlign: 'top' }}>{l.employee_name ? `${l.employee_name} (${l.employee})` : (l.employee?.name ?? l.employee)}</td>
              <td style={{ padding: '14px 12px', verticalAlign: 'top' }}>{l.start_date}</td>
              <td style={{ padding: '14px 12px', verticalAlign: 'top' }}>{l.end_date}</td>
              <td style={{ padding: '14px 12px', verticalAlign: 'top', maxWidth: 340 }}>{l.reason}</td>
              <td style={{ padding: '14px 12px', verticalAlign: 'top' }}>
                <span className={`px-3 py-1 rounded text-sm ${l.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : l.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {l.status}
                </span>
              </td>
              <td style={{ padding: '14px 12px', verticalAlign: 'top' }}>{new Date(l.created_at).toLocaleString()}</td>
              <td style={{ padding: '14px 12px', verticalAlign: 'top' }}>
                {onAction ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={() => onAction(l, 'approve')} className="px-3 py-1 bg-green-600 text-white rounded" style={{ minWidth: 84 }}>Approve</button>
                    <button onClick={() => onAction(l, 'reject')} className="px-3 py-1 bg-red-600 text-white rounded" style={{ minWidth: 84 }}>Reject</button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
