import { useState, useEffect, useRef } from 'react';
import { Search, Calendar as CalendarIcon, Activity, Menu, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DateObject from "react-date-object";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

export default function Topbar({ profile }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [todayReservations, setTodayReservations] = useState([]);
  const [loadingToday, setLoadingToday] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ patients: [], reservations: [] });
  const [loadingSearch, setLoadingSearch] = useState(false);

  const topbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (topbarRef.current && !topbarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ patients: [], reservations: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const token = localStorage.getItem('access');
        const res = await fetch(`http://localhost:8080/search/?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            patients: data.patients || [],
            reservations: data.reservations || []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSearch(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toggleMenu = (menuName) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuName);
      if (menuName === 'today') fetchTodayReservations();
    }
  };

  const openMobileSidebar = () => {
    window.dispatchEvent(new Event('toggleSidebar'));
  };

  const fetchTodayReservations = async () => {
    setLoadingToday(true);
    try {
      const todayStr = new DateObject().convert(gregorian, gregorian_en).format("YYYY-MM-DD");
      const token = localStorage.getItem('access');
      const res = await fetch(`http://localhost:8080/schedule/daily/?date=${todayStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let allRes = [];
        data.forEach(schedule => {
          if (schedule.reservations) {
            allRes = [...allRes, ...schedule.reservations];
          }
        });
        allRes.sort((a, b) => a.reserved_time_start.localeCompare(b.reserved_time_start));
        setTodayReservations(allRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingToday(false);
    }
  };

  return (
    <header 
      ref={topbarRef}
      className="h-20 min-h-[80px] flex-shrink-0 mt-4 mx-4 md:ml-4 z-30 sticky top-4 
                 bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] 
                 rounded-3xl flex items-center justify-between px-6 transition-all w-auto"
    >
      
      <div className="flex items-center gap-4 w-full max-w-md relative">
        <button 
          onClick={openMobileSidebar}
          className="md:hidden bg-white/50 border border-gray-100 p-2.5 rounded-xl text-gray-600 shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeMenu !== 'search') setActiveMenu('search');
            }}
            onFocus={() => {
              if (searchQuery.trim()) setActiveMenu('search');
            }}
            placeholder="جستجوی بیمار، نوبت یا کد ملی..." 
            className="w-full bg-white/50 border border-white shadow-inner rounded-2xl pr-12 pl-4 py-2.5 focus:ring-2 focus:ring-blue-400/30 transition-all text-sm outline-none placeholder-gray-400"
          />

          {activeMenu === 'search' && searchQuery.trim() && (
            <div className="absolute right-0 top-full mt-4 w-full bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-100/80 p-4 z-50 max-h-[420px] overflow-y-auto custom-scrollbar text-right animate-in fade-in slide-in-from-top-2">
              {loadingSearch ? (
                <div className="flex justify-center py-6"><Activity className="w-6 h-6 animate-spin text-blue-500"/></div>
              ) : (searchResults.patients.length === 0 && searchResults.reservations.length === 0) ? (
                <p className="text-center text-gray-400 text-xs py-4 font-medium">نتیجه‌ای یافت نشد.</p>
              ) : (
                <div className="space-y-4">
                  {searchResults.patients.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-gray-400 mb-2 px-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold">بیماران</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.patients.map((patient) => (
                          <div 
                            key={patient.id} 
                            onClick={() => {
                              setActiveMenu(null);
                              setSearchQuery('');
                              navigate('/patients', { state: { openPatientId: patient.id } });
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/60 cursor-pointer transition"
                          >
                            <span className="text-xs text-gray-400" dir="ltr">{patient.phone_number}</span>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-800">{patient.first_name} {patient.last_name}</p>
                              {patient.national_id && <p className="text-[10px] text-gray-400 mt-0.5">کد ملی: {patient.national_id}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.reservations.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1.5 text-gray-400 mb-2 px-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-bold">نوبت‌ها</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.reservations.map((res) => (
                          <div 
                            key={res.id} 
                            onClick={() => {
                              setActiveMenu(null);
                              setSearchQuery('');
                              navigate('/schedule', { state: { highlightScheduleId: res.schedule_id } });
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-green-50/40 cursor-pointer transition"
                          >
                            <div className="flex flex-col items-start">
                              <span className="bg-blue-50 text-blue-600 font-bold text-[10px] px-1.5 py-0.5 rounded-lg mb-1" dir="ltr">
                                {res.reserved_time_start.slice(0,5)}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-800">{res.patient_name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">وضعیت: {res.status === 'ACCEPTED' ? 'تایید شده' : res.status === 'DONE' ? 'انجام شده' : 'در انتظار'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        
        <div className="relative">
          <button 
            onClick={() => toggleMenu('today')}
            className={`flex items-center gap-2 transition px-4 py-2.5 rounded-2xl text-sm font-bold border ${activeMenu === 'today' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20 shadow-sm' : 'bg-white/50 border-white text-gray-600 hover:bg-white hover:shadow-sm'}`}
          >
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <span className="hidden sm:inline">برنامه امروز</span>
          </button>

          {activeMenu === 'today' && (
            <div className="absolute left-0 top-full mt-4 w-80 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/80 p-5 z-50 animate-in fade-in slide-in-from-top-2 text-right">
              <div className="flex justify-between items-center border-b border-gray-100/80 pb-3 mb-4">
                <h3 className="font-bold text-gray-800 text-sm">نوبت‌های رزرو شده امروز</h3>
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-xs font-bold">{todayReservations.length} مورد</span>
              </div>
              
              <div className="max-h-64 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {loadingToday ? (
                  <div className="flex justify-center py-4"><Activity className="w-6 h-6 animate-spin text-blue-400"/></div>
                ) : todayReservations.length > 0 ? (
                  todayReservations.map((res, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setActiveMenu(null);
                        navigate('/schedule', { state: { highlightScheduleId: res.schedule_id } });
                      }}
                      className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-100/50 hover:bg-white hover:shadow-sm transition cursor-pointer"
                    >
                      <div className="bg-white border border-blue-100 text-blue-600 font-bold text-xs px-2 py-1.5 rounded-xl shadow-sm" dir="ltr">
                        {res.reserved_time_start.slice(0,5)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{res.patient_name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{res.status === 'ACCEPTED' ? 'تایید شده' : res.status === 'DONE' ? 'انجام شد' : 'در انتظار'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 text-xs py-4 font-medium">امروز هیچ نوبتی ثبت نشده است.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block w-px h-8 bg-gray-200/50 mx-1"></div>

        <div className="relative">
          <div 
            className="flex items-center gap-3 cursor-pointer group bg-white/40 border border-white hover:bg-white/80 px-2 py-1.5 rounded-2xl transition shadow-sm"
            onClick={() => toggleMenu('profile')}
          >
            <div className="hidden md:flex flex-col items-end mr-2">
              <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition">
                {profile?.full_name || 'کاربر سیستم'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                {profile?.role === 'DOCTOR' ? 'پزشک متخصص' : 'مدیریت کلینیک'}
              </p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-xl flex items-center justify-center font-bold shadow-md border border-white/50">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>
          </div>

          {activeMenu === 'profile' && (
            <div className="absolute left-0 top-full mt-4 w-64 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/80 p-5 z-50 animate-in fade-in slide-in-from-top-2 text-right">
              <div className="flex flex-col items-center border-b border-gray-100/80 pb-5 mb-4 mt-2">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-white mb-3">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <p className="font-bold text-gray-800 text-base">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 mt-1" dir="ltr">{profile?.phone_number || '---'}</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                  <span className="font-bold text-gray-500 text-xs">کلینیک:</span>
                  <span className="text-xs text-gray-800 font-bold truncate max-w-[120px]">{profile?.clinic?.clinic_name || 'ثبت نشده'}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                  <span className="font-bold text-gray-500 text-xs">ایمیل:</span>
                  <span className="text-xs text-gray-800 font-bold truncate max-w-[120px]" dir="ltr">{profile?.email || '---'}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                  <span className="font-bold text-gray-500 text-xs">نقش کاربری:</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold">
                    {profile?.role === 'DOCTOR' ? 'پزشک' : 'منشی'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}