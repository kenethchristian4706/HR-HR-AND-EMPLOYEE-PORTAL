import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmployeePage.css';

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [viewedEdit, setViewedEdit] = useState(false);
  const [viewedForm, setViewedForm] = useState({ name: '', email: '', department: '', designation: '', salary: '' });

  useEffect(() => {
    fetchEmployees();
  }, [search, department]);

  const viewedEmployee = employees.find(emp => emp.id === viewId);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(false);
    try {
      let url = 'http://127.0.0.1:8000/api/employees/?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (department) url += `department=${encodeURIComponent(department)}&`;
      const res = await axios.get(url);
      setEmployees(res.data);
      // Extract unique departments for dropdown
      const uniqueDepartments = [...new Set(res.data.map(emp => emp.department))];
      setDepartments(uniqueDepartments);
    } catch (err) {
      setError(true);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp) => {
    // Open the details card in edit mode so Edit button and "Edit Details" behave the same
    setEditId(null); // clear inline edit mode
    setViewId(emp.id);
    setViewedForm({
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || '',
      designation: emp.designation || '',
      salary: emp.salary || '',
      phone: emp.phone || '',
      address: emp.address || ''
    });
    setViewedEdit(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/employee/update/${editId}/`, editForm);
      // update local employees state so UI is responsive without refetch
      setEmployees(prev => prev.map(emp => emp.id === editId ? { ...emp, ...editForm } : emp));
      setEditId(null);
      setEditForm({ name: '', email: '', department: '' });
    } catch (err) {
      // Optionally show error
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://127.0.0.1:8000/api/employee/delete/${id}/`);
      // remove locally so UI updates immediately
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      // if we were viewing or editing this employee, clear those states
      if (viewId === id) setViewId(null);
      if (editId === id) setEditId(null);
    } catch (err) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  const handleView = (emp) => {
    setViewId(emp.id);
    setViewedForm({
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || '',
      designation: emp.designation || '',
      salary: emp.salary || ''
    });
    setViewedEdit(false);
  };

  const handleViewedChange = (e) => {
    setViewedForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleViewedSave = async () => {
    if (!viewId) return;
    try {
      // send updated data to backend
      const payload = { ...viewedForm };
      await axios.put(`http://127.0.0.1:8000/api/employee/update/${viewId}/`, payload);
      // update local employees state
      setEmployees(prev => prev.map(emp => emp.id === viewId ? { ...emp, ...payload } : emp));
      // ensure inline edit state cleared
      setEditId(null);
      setViewedEdit(false);
    } catch (err) {
      // optionally show error
    }
  };

  const handleViewedCancel = () => {
    // reset to original values from employees array
    const orig = employees.find(emp => emp.id === viewId);
    if (orig) {
      setViewedForm({ name: orig.name || '', email: orig.email || '', department: orig.department || '', designation: orig.designation || '', salary: orig.salary || '' });
    }
    setViewedEdit(false);
  };

  return (
    <div className="employee-page-wrapper" style={{ background: 'none', padding: 0 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid #e0e3e8', fontSize: 17, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minWidth: 220 }}
        />
        <select
          value={department}
          onChange={e => setDepartment(e.target.value)}
          style={{ padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid #e0e3e8', fontSize: 17, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minWidth: 180 }}
        >
          <option value="">All Departments</option>
          {departments.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem 2.5rem', minHeight: 320 }}>
        {loading ? (
          <div style={{ fontSize: 18, color: '#888', textAlign: 'center' }}>Loading...</div>
        ) : error ? (
          <div style={{ fontSize: 18, color: '#ff4d4f', textAlign: 'center' }}>Error fetching employees.</div>
        ) : employees.length === 0 ? (
          <div style={{ fontSize: 18, color: '#888', textAlign: 'center' }}>No employees found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 17 }}>
            <thead>
              <tr style={{ background: '#f7f8fa' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#23272f', borderBottom: '1px solid #e0e3e8' }}>Name</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#23272f', borderBottom: '1px solid #e0e3e8' }}>Email</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#23272f', borderBottom: '1px solid #e0e3e8' }}>Department</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#23272f', borderBottom: '1px solid #e0e3e8' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                editId === emp.id ? (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #e0e3e8', background: '#f7f8fa' }}>
                    <td style={{ padding: '1rem', width: '25%' }}>
                      <input name="name" value={editForm.name} onChange={handleEditChange} placeholder="Name" style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #e0e3e8', fontSize: 16 }} required />
                    </td>
                    <td style={{ padding: '1rem', width: '25%' }}>
                      <input name="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #e0e3e8', fontSize: 16 }} required />
                    </td>
                    <td style={{ padding: '1rem', width: '25%' }}>
                      <input name="department" value={editForm.department} onChange={handleEditChange} placeholder="Department" style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #e0e3e8', fontSize: 16 }} required />
                    </td>
                    <td style={{ padding: '1rem', width: '25%', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button type="button" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#888', color: '#fff', fontWeight: 500, cursor: 'pointer' }} onClick={() => setEditId(null)}>Cancel</button>
                      <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#23272f', color: '#fff', fontWeight: 500, cursor: 'pointer' }} disabled={editLoading} onClick={handleEditSubmit}>{editLoading ? 'Saving...' : 'Save'}</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #e0e3e8' }}>
                    <td style={{ padding: '1rem' }}>{emp.name}</td>
                    <td style={{ padding: '1rem' }}>{emp.email}</td>
                    <td style={{ padding: '1rem' }}>{emp.department}</td>
                    <td style={{ padding: '1rem' }}>
                      <button className="employee-action-btn view" style={{ marginRight: 8, padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#1890ff', color: '#fff', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} onClick={() => handleView(emp)}>View</button>
                      <button className="employee-action-btn edit" style={{ marginRight: 8, padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#23272f', color: '#fff', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} onClick={() => handleEdit(emp)}>Edit</button>
                      <button className="employee-action-btn delete" style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#ff4d4f', color: '#fff', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} onClick={() => handleDelete(emp.id)}>Delete</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
        {viewedEmployee && (
           <div style={{ marginTop: 24, background: '#f7f8fa', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '1.5rem 1rem', maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Header with action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{viewedEmployee.name}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>{viewedEmployee.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!viewedEdit ? (
                    <button style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#23272f', color: '#fff', fontWeight: 500, cursor: 'pointer' }} onClick={() => setViewedEdit(true)}>Edit Details</button>
                  ) : (
                    <>
                      <button style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#888', color: '#fff', fontWeight: 500, cursor: 'pointer' }} onClick={handleViewedCancel}>Cancel</button>
                      <button style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#23272f', color: '#fff', fontWeight: 500, cursor: 'pointer' }} onClick={handleViewedSave}>Save</button>
                    </>
                  )}
                  <button style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #e0e3e8', background: '#fff', color: '#333', fontWeight: 500, cursor: 'pointer' }} onClick={() => { setViewId(null); setViewedEdit(false); }}>Close</button>
                </div>
              </div>

              {/* Details area: view or edit */}
              {!viewedEdit ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><strong>Department:</strong> {viewedEmployee.department}</div>
                  <div><strong>Designation:</strong> {viewedEmployee.designation}</div>
                  <div><strong>Salary:</strong> {viewedEmployee.salary}</div>
                  {/* show any additional fields that might exist on the object */}
                  {viewedEmployee.phone && <div><strong>Phone:</strong> {viewedEmployee.phone}</div>}
                  {viewedEmployee.address && <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {viewedEmployee.address}</div>}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 6 }}>Name</label>
                    <input name="name" value={viewedForm.name} onChange={handleViewedChange} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e0e3e8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 6 }}>Email</label>
                    <input name="email" value={viewedForm.email} onChange={handleViewedChange} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e0e3e8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 6 }}>Department</label>
                    <input name="department" value={viewedForm.department} onChange={handleViewedChange} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e0e3e8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 6 }}>Designation</label>
                    <input name="designation" value={viewedForm.designation} onChange={handleViewedChange} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e0e3e8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 6 }}>Salary</label>
                    <input name="salary" value={viewedForm.salary} onChange={handleViewedChange} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e0e3e8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 6 }}>Phone</label>
                    <input name="phone" value={viewedForm.phone || ''} onChange={handleViewedChange} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e0e3e8' }} />
                  </div>
                  {/* <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 6 }}>Address</label>
                    <input name="address" value={viewedForm.address || ''} onChange={handleViewedChange} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e0e3e8' }} />
                  </div> */}
                </div>
              )}
            </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default EmployeePage;
