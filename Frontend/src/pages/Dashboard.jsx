import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JalaliDatePicker from '../components/JalaliDatePicker';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { Users, FileText, CheckCircle, Clock, Activity, Calendar as CalendarIcon, Phone } from 'lucide-react';

const toFaDigit = (text) => {
  if (text === null || text === undefined) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return text.toString().replace(/\d/g, (x) => farsiDigits[x]);
};

const getJalaliDisplayDate = (gregorianDateStr) => {
  if (!gregorianDateStr) return '';
  const date = new Date(gregorianDateStr);
  return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [patientCount, setPatientCount] = useState(0);
  
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReservations, setDailyReservations] = useState([]);
  const [isFetchingReservations, setIsFetchingReservations] = useState(false);

  const getToken = () => localStorage.getItem('access');

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = getToken();
      if (!token) return navigate('/login');

      try {
        const profileRes = await fetch('http://localhost:8080/profile/', { headers: { 'Authorization': `Bearer ${token}` } });
        if (profileRes.ok) setProfile(await profileRes.json());
        else throw new Error('توکن نامعتبر');

        const patientsRes = await fetch('http://localhost:8080/patients/', { headers: { 'Authorization': `Bearer ${token}` } });
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatientCount(patientsData.length);
        }

        fetchDailySchedule(selectedDateStr);

      } catch (err) {
        localStorage.removeItem('access');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const fetchDailySchedule = async (formattedDate) => {
    setIsFetchingReservations(true);
    try {
      const res = await fetch(`http://localhost:8080/schedule/daily/?date=${formattedDate}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        let allReservations = [];
        data.forEach(schedule => {
           if(schedule.reservations) {
               allReservations = [...allReservations, ...schedule.reservations];
           }
        });
        
        allReservations.sort((a, b) => a.reserved_time_start.localeCompare(b.reserved_time_start));
        setDailyReservations(allReservations);
      } else {
        setDailyReservations([]); 
      }
    } catch (err) {
      console.error(err);
      setDailyReservations([]);
    } finally {
      setIsFetchingReservations(false);
    }
  };

  const handleDateChange = (gregorianDate) => {
    setSelectedDateStr(gregorianDate);
    fetchDailySchedule(gregorianDate);
  };

  const getStatusBadge = (status) => {
    const map = {
      'PENDING': { text: 'در انتظار', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      'ACCEPTED': { text: 'تایید شده', color: 'bg-green-100 text-green-700 border-green-200' },
      'REJECTED': { text: 'رد شده', color: 'bg-red-100 text-red-700 border-red-200' },
      'DONE': { text: 'انجام شده', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      'CANCELLED': { text: 'کنسل شده', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      'ABSENT': { text: 'غایب', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    };
    const s = map[status] || map['PENDING'];
    return <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${s.color}`}>{s.text}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-blue-600 font-bold">در حال بارگذاری داشبورد...</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto text-right custom-scrollbar">
        <Topbar profile={profile} />

        <main className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
          
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">داشبورد مدیریت کلینیک</h1>
            <p className="text-gray-500 text-sm mt-1">خلاصه‌ای از وضعیت امروز کلینیک شما</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-blue-100 p-4 rounded-2xl shrink-0"><Users className="text-blue-600 w-6 h-6 md:w-7 md:h-7" /></div>
              <div>
                <h3 className="text-gray-500 text-xs md:text-sm font-bold mb-1">کل پرونده‌های ثبت شده</h3>
                <p className="text-2xl md:text-3xl font-black text-gray-800">{toFaDigit(patientCount)} <span className="text-xs md:text-sm font-medium text-gray-400">بیمار</span></p>
              </div>
            </div>
            
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-green-100 p-4 rounded-2xl shrink-0"><CheckCircle className="text-green-600 w-6 h-6 md:w-7 md:h-7" /></div>
              <div>
                <h3 className="text-gray-500 text-xs md:text-sm font-bold mb-1">نوبت‌های تایید شده امروز</h3>
                <p className="text-2xl md:text-3xl font-black text-gray-800">
                   {toFaDigit(dailyReservations.filter(r => r.status === 'ACCEPTED').length)} <span className="text-xs md:text-sm font-medium text-gray-400">نفر</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300 sm:col-span-2 lg:col-span-1">
              <div className="bg-purple-100 p-4 rounded-2xl shrink-0"><FileText className="text-purple-600 w-6 h-6 md:w-7 md:h-7" /></div>
              <div>
                <h3 className="text-gray-500 text-xs md:text-sm font-bold mb-1">موجودی پنل شما</h3>
                <p className="text-xl md:text-2xl font-black text-gray-800">{toFaDigit((profile?.clinic?.balance || 0).toLocaleString())} <span className="text-xs md:text-sm font-medium text-gray-400">ریال</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            
            <div className="xl:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
              <h2 className="w-full font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500"/> تقویم کاری
              </h2>
              
              <div className="w-full flex justify-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100/80">
                <JalaliDatePicker 
                  outputFormat="gregorian" 
                  onChange={handleDateChange} 
                  value={selectedDateStr}    
                  inline={true} 
                  showClearButton={false}
                />
              </div>
              <p className="text-xs text-gray-400 mt-6 text-center leading-relaxed px-4 font-medium">
                برای مشاهده نوبت‌های هر روز، روی تاریخ مورد نظر در تقویم کلیک کنید.
              </p>
            </div>

            <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-8 min-h-[450px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-orange-500"/> 
                  برنامه روزانه: <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-xl text-base md:text-lg">{toFaDigit(getJalaliDisplayDate(selectedDateStr))}</span>
                </h2>
                <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold w-full sm:w-auto text-center">
                  {toFaDigit(dailyReservations.length)} نوبت ثبت شده
                </span>
              </div>

              {isFetchingReservations ? (
                 <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Activity className="w-10 h-10 animate-spin mb-3 text-blue-400"/>
                    <p className="font-medium">در حال دریافت اطلاعات...</p>
                 </div>
              ) : dailyReservations.length > 0 ? (
                <div className="space-y-4">
                  {dailyReservations.map((res, index) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/80 border border-gray-100 p-4 md:p-5 rounded-2xl hover:bg-white hover:shadow-md hover:border-blue-100 transition duration-300 gap-4">
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="bg-white border border-blue-100 text-blue-600 font-black text-lg px-4 py-2.5 rounded-xl shadow-sm shrink-0" dir="ltr">
                          {toFaDigit(res.reserved_time_start.slice(0,5))}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-base md:text-lg">{res.patient_name}</p>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs md:text-sm mt-1.5" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-gray-400"/> {toFaDigit(res.phone_number)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 md:gap-6 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-200">
                        {getStatusBadge(res.status)}
                        <button 
                          onClick={() => navigate('/schedule')}
                          className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-colors"
                        >
                          مدیریت تقویم
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 md:py-24 text-gray-400 border-2 border-dashed border-gray-100 bg-gray-50/50 rounded-3xl mt-4">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <CheckCircle className="w-12 h-12 text-gray-300"/>
                  </div>
                  <p className="font-bold text-lg text-gray-500">روز خلوت!</p>
                  <p className="text-sm mt-2 text-gray-400">هیچ نوبتی برای این تاریخ ثبت نشده است.</p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
