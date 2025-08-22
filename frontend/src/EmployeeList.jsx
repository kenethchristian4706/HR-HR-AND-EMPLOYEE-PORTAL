import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Professional Employee list component using TailwindCSS classes
export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // Debounce search to avoid excessive requests
  useEffect(() => {
    const id = setTimeout(() => {
      fetchEmployees();
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, department]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = 'http://127.0.0.1:8000/api/employees/';
      const params = {};
      if (search) params.search = search;
      if (department) params.department = department;
      const res = await axios.get(url, { params });
      setEmployees(res.data || []);
      const uniq = Array.from(new Set((res.data || []).map(e => e.department).filter(Boolean)));
      setDepartments(uniq);
    } catch (err) {
      setError('Unable to load employees.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Employees</h2>
          <p className="text-sm text-gray-500 mt-1">Overview of your organisation's employees</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="w-72">
            <label htmlFor="search" className="sr-only">Search</label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full px-4 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label htmlFor="department" className="sr-only">Department</label>
            <select
              id="department"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Departments</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-600">{loading ? 'Loading employees...' : `${employees.length} employees`}</div>
          <div className="text-sm text-gray-500">{error ? error : ''}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">{error}</td>
                </tr>
              )}

              {!loading && !error && employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No employees found.</td>
                </tr>
              )}

              {!loading && !error && employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.designation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{emp.salary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
