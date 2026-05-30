import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients'; 
import Profile from './pages/Profile'; 
import Assistants from './pages/Assistants';
import Schedule from './pages/Schedule';


export default function App() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 font-sans" dir="rtl">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/assistants" element={<Assistants />} />
        <Route path="/schedule" element={<Schedule />} />

      </Routes>
    </div>
  );
}

