import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import HrDashboard from './HrDashboard';
import EmployeePage from './EmployeePage';
import EmployeeDashboard from './EmployeeDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
  <Route path="/hr-dashboard/*" element={<HrDashboard />} />
      <Route path="/employees" element={<EmployeePage />} />
      <Route path="/employee-dashboard/*" element={<EmployeeDashboard />} />
      <Route path="*" element={<Navigate to="/hr-dashboard" replace />} />
    </Routes>
  );
}

export default App;