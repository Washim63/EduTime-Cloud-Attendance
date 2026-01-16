
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.tsx';
import TeacherDashboard from './components/TeacherDashboard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx';
import { UserRole, AdminSubRole } from './types.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<{ id: string; name: string; role: UserRole; subRole?: AdminSubRole } | null>(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('edutime_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        sessionStorage.removeItem('edutime_user');
      }
    }
  }, []);

  const handleLogin = (id: string, name: string, role: UserRole, subRole?: AdminSubRole) => {
    const userData = { id, name, role, subRole };
    setUser(userData);
    sessionStorage.setItem('edutime_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('edutime_user');
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className="flex-1">
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/" /> : <Register />} 
            />
            <Route 
              path="/" 
              element={
                !user ? <Navigate to="/login" /> : 
                user.role === UserRole.ADMIN ? <AdminDashboard adminSubRole={user.subRole || AdminSubRole.PRINCIPAL} /> : <TeacherDashboard teacherId={user.id} />
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;