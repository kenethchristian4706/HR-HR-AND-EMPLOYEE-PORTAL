import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const STATUS_COLORS = {
  Pending: '#F59E0B', // amber
  Approved: '#10B981', // green
  Rejected: '#EF4444', // red
};

const PIE_COLORS = ['#2563EB', '#06B6D4', '#A78BFA', '#F97316', '#84CC16'];

export default function HrCharts() {
  const [leaves, setLeaves] = useState(null); // { pending, approved, rejected }
  const [departments, setDepartments] = useState(null); // [{ department, count }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

  // Use backend absolute URLs to avoid dev-server proxy issues
  const leavesReq = axios.get('http://127.0.0.1:8000/api/leaves/status-summary/');
  const deptReq = axios.get('http://127.0.0.1:8000/api/employees/department-count/');

    Promise.all([leavesReq, deptReq])
      .then(([leavesRes, deptRes]) => {
        if (!mounted) return;
        setLeaves(leavesRes.data || { pending: 0, approved: 0, rejected: 0 });
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to load HR charts data', err);
        setError('Failed to load chart data');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Transform leaves summary into bar chart data: [{ status, count }, ...]
  const barData = leaves
    ? [
        { status: 'Pending', count: leaves.pending ?? 0 },
        { status: 'Approved', count: leaves.approved ?? 0 },
        { status: 'Rejected', count: leaves.rejected ?? 0 },
      ]
    : [];

  // Transform departments into pie data: [{ name, value }]
  const pieData = (departments || []).map((d) => ({ name: d.department, value: d.count }));

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 12 }}>Loading...</div>;
  }

  // Compact side-by-side layout using inline styles (doesn't require Tailwind)
  const totalLeaves = barData.reduce((s, b) => s + (b.count || 0), 0);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 300, maxWidth: 520, background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Leave Requests by Status</div>
        <div style={{ width: '100%', height: 180 }}>
          {totalLeaves === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No leave requests</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Leaves" isAnimationActive={false} barSize={30}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#ccc'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 300, maxWidth: 520, background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Employees by Department</div>
        <div style={{ width: '100%', height: 180 }}>
          {pieData.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No employees data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={64} innerRadius={28} paddingAngle={2} isAnimationActive={false}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, props?.payload?.name || name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
