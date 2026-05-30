import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, UserCog, X } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import logoImage from '../assets/logo.png';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    navigate('/login');
  };

  const getLinkStyle = (path) => {
    return location.pathname === path 
      ? "w-full flex items-center gap-3 px-4 py-3 bg-blue-500/10 text-blue-700 rounded-2xl font-bold transition shadow-sm border border-blue-500/10"
      : "w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 rounded-2xl font-medium transition";
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={`
        fixed md:sticky top-4 inset-y-0 right-0 z-50
        w-64 h-[calc(100vh-2rem)] my-4 mx-4 md:ml-0
        bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        rounded-3xl flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-[120%] md:translate-x-0'}
      `}>
        
        <div className="p-6 flex items-center justify-between border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl  flex items-center justify-center p-1 overflow-hidden">
              <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-wider">دندونیتو</span>
          </div>
          
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-red-500 bg-white/50 p-1.5 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto custom-scrollbar">
          <Link to="/dashboard" onClick={() => setIsOpen(false)} className={getLinkStyle('/dashboard')}>
            <LayoutDashboard className="w-5 h-5" /> داشبورد
          </Link>
          <Link to="/patients" onClick={() => setIsOpen(false)} className={getLinkStyle('/patients')}>
            <Users className="w-5 h-5" /> بیماران من
          </Link>
          <Link to="/schedule" onClick={() => setIsOpen(false)} className={getLinkStyle('/schedule')}>
            <Calendar className="w-5 h-5" /> تقویم و شیفت‌ها
          </Link>
          <Link to="/assistants" onClick={() => setIsOpen(false)} className={getLinkStyle('/assistants')}>
            <UserCog className="w-5 h-5" /> کارمندان کلینیک
          </Link>
          <Link to="/profile" onClick={() => setIsOpen(false)} className={getLinkStyle('/profile')}>
            <Settings className="w-5 h-5" /> تنظیمات پروفایل
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200/50 m-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50/80 rounded-2xl font-bold transition">
            <LogOut className="w-5 h-5" /> خروج از حساب
          </button>
        </div>
      </aside>
    </>
  );
}
