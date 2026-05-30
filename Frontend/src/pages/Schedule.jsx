import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Swal from 'sweetalert2';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Users, Activity, X, UserPlus, FileText } from 'lucide-react';

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import TimePicker from "react-multi-date-picker/plugins/time_picker";

const toFaDigit = (text) => {
  return text?.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) || '';
};

const toFaDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(new Date(dateStr));
  } catch {
    return toFaDigit(dateStr);
  }
};

export default function Schedule() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: null, start_time: '09:00', end_time: '14:00', duration: 30, description: ''
  });

  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reserveForm, setReserveForm] = useState({
    first_name: '', last_name: '', phone_number: '', national_id: '', gender: 'UNKNOWN', problem: ''
  });

  const getToken = () => localStorage.getItem('access');

  useEffect(() => {
    const initData = async () => {
      try {
        const profRes = await fetch('http://localhost:8080/profile/', { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (profRes.ok) setProfile(await profRes.json());
        else navigate('/login');

        fetchSchedules();
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    initData();
  }, [navigate]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch('http://localhost:8080/schedule/', { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
        if (data.length > 0 && !activeSchedule) {
          fetchScheduleDetails(data[0].id);
        } else if (data.length === 0) {
          setActiveSchedule(null);
        }
      }
    } catch (err) { console.error(err); }
  };

  const fetchScheduleDetails = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/schedule/${id}/`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setActiveSchedule(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.date) return Swal.fire('خطا', 'لطفاً تاریخ را انتخاب کنید.', 'error');

    const gregorianDate = scheduleForm.date.convert(gregorian, gregorian_en).format("YYYY-MM-DD");
    
    const selectedDateTime = new Date(`${gregorianDate}T${scheduleForm.end_time}`);
    if (selectedDateTime < new Date()) {
      return Swal.fire('خطا', 'امکان ثبت شیفت در زمان گذشته وجود ندارد.', 'error');
    }

    try {
      const res = await fetch('http://localhost:8080/schedule/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ ...scheduleForm, date: gregorianDate })
      });
      if (res.ok) {
        setIsScheduleModalOpen(false);
        setScheduleForm({ date: null, start_time: '09:00', end_time: '14:00', duration: 30, description: '' });
        fetchSchedules();
        Swal.fire({ icon: 'success', title: 'شیفت ایجاد شد', timer: 1500, showConfirmButton: false });
      } else {
        const error = await res.json();
        Swal.fire('خطا در ثبت', JSON.stringify(error), 'error');
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteSchedule = async (id) => {
    const result = await Swal.fire({ title: 'حذف شیفت؟', text: "فقط در صورتی حذف می‌شود که نوبت فعالی نداشته باشد.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'حذف شیفت', cancelButtonText: 'لغو' });
    if (result.isConfirmed) {
      const res = await fetch(`http://localhost:8080/schedule/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) {
        if(activeSchedule?.id === id) setActiveSchedule(null);
        fetchSchedules();
        Swal.fire('حذف شد', '', 'success');
      } else {
        const err = await res.json();
        Swal.fire('خطا', err.error || 'این شیفت دارای نوبت فعال است.', 'error');
      }
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();

    if (!/^\d+$/.test(reserveForm.phone_number)) {
      return Swal.fire('خطا', 'شماره موبایل باید فقط شامل اعداد باشد.', 'error');
    }
    if (reserveForm.national_id && !/^\d+$/.test(reserveForm.national_id)) {
      return Swal.fire('خطا', 'کد ملی باید فقط شامل اعداد باشد.', 'error');
    }

    const slotDateTime = new Date(`${activeSchedule.date}T${selectedSlot}`);
    if (slotDateTime < new Date()) {
      return Swal.fire('خطا', 'زمان این نوبت گذشته است و قابل رزرو نیست.', 'error');
    }

    try {
      const res = await fetch('http://localhost:8080/reserve/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...reserveForm,
          schedule_id: activeSchedule.id,
          reserved_time_start: selectedSlot,
          duration: activeSchedule.duration
        })
      });

      if (res.ok) {
        setIsReserveModalOpen(false);
        fetchScheduleDetails(activeSchedule.id);
        Swal.fire({ icon: 'success', title: 'نوبت با موفقیت رزرو شد', timer: 1500, showConfirmButton: false });
        setReserveForm({ first_name: '', last_name: '', phone_number: '', national_id: '', gender: 'UNKNOWN', problem: '' });
      } else {
        const error = await res.json();
        Swal.fire('خطا', error.error || 'اطلاعات نامعتبر است', 'error');
      }
    } catch (err) { console.error(err); }
  };

  const changeReservationStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8080/reserve/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchScheduleDetails(activeSchedule.id);
    } catch (err) { console.error(err); }
  };

  const handleDeleteReservation = async (id) => {
    const result = await Swal.fire({ title: 'لغو نوبت؟', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'بله، لغو شود' });
    if (result.isConfirmed) {
      const res = await fetch(`http://localhost:8080/reserve/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) fetchScheduleDetails(activeSchedule.id);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'PENDING': { text: 'در انتظار', color: 'bg-yellow-100 text-yellow-700' },
      'ACCEPTED': { text: 'تایید شده', color: 'bg-green-100 text-green-700' },
      'REJECTED': { text: 'رد شده', color: 'bg-red-100 text-red-700' },
      'DONE': { text: 'انجام شده', color: 'bg-blue-100 text-blue-700' },
      'CANCELLED': { text: 'کنسل شده', color: 'bg-gray-100 text-gray-700' },
      'ABSENT': { text: 'غایب', color: 'bg-orange-100 text-orange-700' },
    };
    const s = map[status] || map['PENDING'];
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${s.color}`}>{s.text}</span>;
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-blue-600">بارگذاری...</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative text-right">
        <Topbar profile={profile} />

        <main className="p-8 max-w-7xl mx-auto w-full pb-20 space-y-8">
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-2xl"><CalendarIcon className="text-blue-600 w-6 h-6"/></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">شیفت‌های کاری کلینیک</h2>
                  <p className="text-sm text-gray-500 mt-1">مدیریت روزهای حضور پزشک</p>
                </div>
              </div>
              {profile?.role === 'DOCTOR' && (
                <button onClick={() => setIsScheduleModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                  <Plus className="w-5 h-5" /> تعریف شیفت جدید
                </button>
              )}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {schedules.length > 0 ? schedules.map(schedule => (
                <div 
                  key={schedule.id} 
                  onClick={() => fetchScheduleDetails(schedule.id)}
                  className={`min-w-[280px] p-5 rounded-2xl border-2 cursor-pointer transition-all ${activeSchedule?.id === schedule.id ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-gray-100 hover:border-blue-300 hover:bg-blue-50/50'}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-800 text-[15px]">{toFaDate(schedule.date)}</span>
                    <span className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-1 rounded-lg font-bold shadow-sm">{toFaDigit(schedule.duration)} دقیقه</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                      <Clock className="w-4 h-4 text-blue-500"/>
                      <span>از {toFaDigit(schedule.start_time.slice(0,5))} تا {toFaDigit(schedule.end_time.slice(0,5))}</span>
                    </div>
                    {profile?.role === 'DOCTOR' && (
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(schedule.id); }} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4"/></button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="w-full text-center p-10 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-medium flex flex-col items-center gap-3">
                    <Activity className="w-10 h-10 text-gray-300"/>
                    هیچ شیفتی ثبت نشده است. ابتدا یک شیفت جدید بسازید.
                </div>
              )}
            </div>
          </div>

          {activeSchedule ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    نوبت‌های شیفت <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-xl text-lg">{toFaDate(activeSchedule.date)}</span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">{activeSchedule.description || 'بدون توضیحات اضافی'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-1 bg-gray-50/80 p-6 rounded-3xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-green-500"/> زمان‌های قابل رزرو</h3>
                  <div className="flex flex-wrap gap-3">
                    {activeSchedule.available_slots.length > 0 ? (
                      activeSchedule.available_slots.map((slot, index) => {
                        const isPastSlot = new Date(`${activeSchedule.date}T${slot}`) < new Date();
                        return (
                          <button 
                            key={index} 
                            disabled={isPastSlot}
                            onClick={() => { 
                              if (isPastSlot) return;
                              setSelectedSlot(slot); 
                              setIsReserveModalOpen(true); 
                            }}
                            className={`w-[calc(33.33%-0.5rem)] py-2.5 rounded-xl font-bold transition shadow-sm border ${isPastSlot ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60' : 'bg-white border-green-200 text-green-700 hover:bg-green-500 hover:text-white'}`}
                          >
                            {toFaDigit(slot)}
                          </button>
                        );
                      })
                    ) : (
                      <div className="w-full text-center text-sm text-red-500 bg-red-50 p-4 rounded-xl font-bold border border-red-100">
                        ظرفیت این شیفت تکمیل است.
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500"/> لیست بیماران</h3>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-4">بیمار / موبایل</th>
                          <th className="px-5 py-4 text-center">ساعت</th>
                          <th className="px-5 py-4 text-center">وضعیت</th>
                          <th className="px-5 py-4 text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {activeSchedule.reservations.length > 0 ? (
                          activeSchedule.reservations.map(res => (
                            <tr key={res.id} className="hover:bg-blue-50/30 transition">
                              <td className="px-5 py-4">
                                <div className="font-bold text-gray-800">{res.patient_name}</div>
                                <div className="text-gray-500 text-xs mt-1">{toFaDigit(res.phone_number)}</div>
                              </td>
                              <td className="px-5 py-4 font-bold text-blue-600 text-base text-center">{toFaDigit(res.reserved_time_start.slice(0,5))}</td>
                              <td className="px-5 py-4 text-center">{getStatusBadge(res.status)}</td>
                              <td className="px-5 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <select 
                                    className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-2 outline-none font-bold text-gray-600 focus:border-blue-500"
                                    value={res.status}
                                    onChange={(e) => changeReservationStatus(res.id, e.target.value)}
                                  >
                                    <option value="PENDING">در انتظار</option>
                                    <option value="ACCEPTED">تایید نهایی</option>
                                    <option value="DONE">انجام شد</option>
                                    <option value="ABSENT">غایب</option>
                                    <option value="CANCELLED">کنسل شد</option>
                                  </select>
                                  <button onClick={() => handleDeleteReservation(res.id)} className="text-red-500 bg-red-50 hover:bg-red-500 hover:text-white p-2 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="text-center py-10 text-gray-400 font-medium">هیچ بیماری در این شیفت ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white/50 border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
              <FileText className="w-16 h-16 mb-4 text-gray-300"/>
              <p className="font-bold text-lg text-gray-500">موردی انتخاب نشده است</p>
              <p className="text-sm mt-2">برای مشاهده نوبت‌ها، یکی از شیفت‌های بالا را انتخاب کنید.</p>
            </div>
          )}

        </main>

        {isScheduleModalOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 text-right">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-lg font-bold text-gray-800">ایجاد شیفت کاری جدید</h2>
                <button onClick={() => setIsScheduleModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreateSchedule} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">تاریخ (تقویم شمسی)</label>
                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={scheduleForm.date}
                    onChange={date => setScheduleForm({...scheduleForm, date})}
                    calendarPosition="bottom-right"
                    inputClass="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 text-center font-bold text-gray-700 bg-gray-50"
                    placeholder="یک روز را انتخاب کنید"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">شروع شیفت</label>
                    <DatePicker
                      disableDayPicker
                      format="HH:mm"
                      plugins={[<TimePicker hideSeconds />]}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      value={new DateObject().set({ hour: scheduleForm.start_time.split(':')[0], minute: scheduleForm.start_time.split(':')[1] })}
                      onChange={date => setScheduleForm({...scheduleForm, start_time: date ? date.format("HH:mm") : "09:00"})}
                      inputClass="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">پایان شیفت</label>
                    <DatePicker
                      disableDayPicker
                      format="HH:mm"
                      plugins={[<TimePicker hideSeconds />]}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      value={new DateObject().set({ hour: scheduleForm.end_time.split(':')[0], minute: scheduleForm.end_time.split(':')[1] })}
                      onChange={date => setScheduleForm({...scheduleForm, end_time: date ? date.format("HH:mm") : "14:00"})}
                      inputClass="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">مدت زمان هر ویزیت</label>
                  <select value={scheduleForm.duration} onChange={e => setScheduleForm({...scheduleForm, duration: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 font-bold">
                    <option value={15}>۱۵ دقیقه (معاینه سریع)</option>
                    <option value={20}>۲۰ دقیقه</option>
                    <option value={30}>۳۰ دقیقه (استاندارد)</option>
                    <option value={45}>۴۵ دقیقه (خدمات ویژه)</option>
                    <option value={60}>۶۰ دقیقه (یک ساعت)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">توضیحات (اختیاری)</label>
                  <input type="text" placeholder="مثلا: فقط معاینه و کشیدن" value={scheduleForm.description} onChange={e => setScheduleForm({...scheduleForm, description: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 mt-6">ذخیره شیفت</button>
              </form>
            </div>
          </div>
        )}

        {isReserveModalOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 text-right">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-6 h-6 text-green-500"/> ثبت نوبت جدید</h2>
                <button onClick={() => setIsReserveModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center justify-between mb-8 border border-green-200">
                 <span className="font-bold text-sm">ساعت رزرو انتخاب شده:</span>
                 <span className="text-xl font-black">{toFaDigit(selectedSlot)}</span>
              </div>

              <form onSubmit={handleReserve} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">نام</label>
                    <input type="text" required value={reserveForm.first_name} onChange={e => setReserveForm({...reserveForm, first_name: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">نام خانوادگی</label>
                    <input type="text" required value={reserveForm.last_name} onChange={e => setReserveForm({...reserveForm, last_name: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-green-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">موبایل</label>
                    <input type="text" required value={reserveForm.phone_number} onChange={e => setReserveForm({...reserveForm, phone_number: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-left" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">کد ملی</label>
                    <input type="text" value={reserveForm.national_id} onChange={e => setReserveForm({...reserveForm, national_id: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-left" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">علت مراجعه</label>
                  <textarea value={reserveForm.problem} onChange={e => setReserveForm({...reserveForm, problem: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:border-green-500 min-h-[100px]" placeholder="مثال: درد دندان، عصب کشی و..." />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition shadow-lg shadow-green-200 mt-4">ثبت قطعی نوبت</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}