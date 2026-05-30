import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Swal from 'sweetalert2';
import { User, Mail, Phone, Building, Save, ShieldAlert, MapPin, Globe, CreditCard } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1); 
  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const getToken = () => localStorage.getItem('access');

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:8080/profile/', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setProfile(await res.json());
      else navigate('/login');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...profile };
      
      if (payload.role !== 'DOCTOR') {
        delete payload.clinic;
      }

      const res = await fetch('http://localhost:8080/profile/', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'بروزرسانی موفق', text: 'اطلاعات شما با موفقیت بروزرسانی شد.', timer: 2000, showConfirmButton: false });
      } else {
        const errorData = await res.json();
        Swal.fire({ icon: 'error', title: 'خطا در ثبت', html: `<pre dir="ltr" class="text-xs text-left">${JSON.stringify(errorData, null, 2)}</pre>` });
      }
    } catch (err) { console.error(err); }
  };

  const handleClinicChange = (field, value) => {
    setProfile({
      ...profile,
      clinic: {
        ...profile.clinic,
        [field]: value
      }
    });
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'حذف حساب کاربری؟',
      text: "حساب شما غیرفعال خواهد شد و برای فعال‌سازی مجدد باید با مدیریت تماس بگیرید.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'بله، غیرفعال کن',
      cancelButtonText: 'انصراف'
    });

    if (result.isConfirmed) {
      const res = await fetch('http://localhost:8080/profile/', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        localStorage.clear();
        navigate('/login');
        Swal.fire('غیرفعال شد', 'حساب شما با موفقیت غیرفعال گردید.', 'success');
      }
    }
  };

  const handlePhoneRequest = async () => {
    try {
      const res = await fetch('http://localhost:8080/profile/change-phone/request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ new_phone_number: newPhone })
      });
      if (res.ok) { setStep(2); Swal.fire('کد تایید ارسال شد', 'کد تایید به شماره جدید پیامک گردید.', 'info'); }
      else { const error = await res.json(); Swal.fire('خطا', error.new_phone_number?.[0] || 'خطایی رخ داد', 'error'); }
    } catch (err) { console.error(err); }
  };

  const handlePhoneVerify = async () => {
    try {
      const res = await fetch('http://localhost:8080/profile/change-phone/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ new_phone_number: newPhone, otp: otpCode })
      });
      if (res.ok) { setStep(1); setNewPhone(''); fetchProfile(); Swal.fire('تغییر یافت', 'شماره موبایل با موفقیت تغییر کرد.', 'success'); }
      else { Swal.fire('خطا', 'کد تایید اشتباه است.', 'error'); }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-blue-600">در حال بارگذاری تنظیمات...</div>;

  const isAssistant = profile?.role !== 'DOCTOR';
  const clinicInputClass = isAssistant 
    ? "w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-gray-500 cursor-not-allowed outline-none" 
    : "w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-purple-500 transition outline-none";

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative text-right" dir="rtl">
        <Topbar profile={profile} />
        <main className="p-8 max-w-7xl mx-auto w-full pb-20"> 

          <h1 className="text-2xl font-bold text-gray-800 mb-8">تنظیمات پروفایل</h1>

          <form onSubmit={handleUpdateProfile} className="space-y-8">
            
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b pb-4 border-gray-50">
                <User className="text-blue-600 w-6 h-6" />
                <h2 className="text-lg font-bold text-gray-800">اطلاعات شخصی</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-2">نام و نام خانوادگی</label>
                  <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-2">نام کاربری</label>
                  <input type="text" value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-2">ایمیل</label>
                  <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition text-left outline-none" dir="ltr" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-50">
                <div className="flex items-center gap-3">
                  <Building className="text-purple-600 w-6 h-6" />
                  <h2 className="text-lg font-bold text-gray-800">مشخصات کلینیک</h2>
                </div>
                {isAssistant && <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">غیرقابل ویرایش توسط منشی</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-2">نام کلینیک</label>
                  <input type="text" disabled={isAssistant} value={profile.clinic?.clinic_name || ''} onChange={e => handleClinicChange('clinic_name', e.target.value)} className={clinicInputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-2">نام کاربری کلینیک</label>
                  <input type="text" disabled={isAssistant} value={profile.clinic?.clinic_username || ''} onChange={e => handleClinicChange('clinic_username', e.target.value)} className={`${clinicInputClass} text-left`} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-2">شماره تماس کلینیک</label>
                  <input type="text" disabled={isAssistant} value={profile.clinic?.clinic_phone_number || ''} onChange={e => handleClinicChange('clinic_phone_number', e.target.value)} className={`${clinicInputClass} text-left`} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-2 flex items-center gap-1"><CreditCard className="w-3 h-3"/> موجودی پنل</label>
                  <input type="text" value={(profile.clinic?.balance || 0).toLocaleString() + ' ریال'} disabled className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-gray-500 cursor-not-allowed outline-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 mr-2 flex items-center gap-1"><Globe className="w-3 h-3"/> استان</label>
                      <input type="text" disabled={isAssistant} value={profile.clinic?.clinic_province || ''} onChange={e => handleClinicChange('clinic_province', e.target.value)} className={clinicInputClass} />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 mr-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> شهر</label>
                      <input type="text" disabled={isAssistant} value={profile.clinic?.clinic_city || ''} onChange={e => handleClinicChange('clinic_city', e.target.value)} className={clinicInputClass} />
                   </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-2">آدرس دقیق پستی</label>
                  <textarea disabled={isAssistant} value={profile.clinic?.clinic_address || ''} onChange={e => handleClinicChange('clinic_address', e.target.value)} className={`${clinicInputClass} min-h-[100px]`} />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                  <Save className="w-5 h-5" /> ذخیره تمامی تغییرات
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b pb-4 border-gray-50">
                <Phone className="text-orange-500 w-6 h-6" />
                <h2 className="text-lg font-bold text-gray-800">تغییر شماره موبایل شخصی</h2>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                {step === 1 ? (
                  <>
                    <input type="text" placeholder="شماره جدید (مثلا 0912...)" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 transition text-left outline-none" dir="ltr" />
                    <button type="button" onClick={handlePhoneRequest} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-600 transition">ارسال کد تایید</button>
                  </>
                ) : (
                  <>
                    <input type="text" placeholder="کد ۴ رقمی" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-green-500 transition text-center tracking-[10px] outline-none" maxLength={4} />
                    <button type="button" onClick={handlePhoneVerify} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 transition">تایید نهایی</button>
                    <button type="button" onClick={() => setStep(1)} className="text-gray-400 px-4">انصراف</button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-4 mr-2">شماره فعلی: {profile.phone_number}</p>
            </div>

            <div className="bg-red-50/50 rounded-3xl p-8 border border-red-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b pb-4 border-red-100">
                <ShieldAlert className="text-red-600 w-6 h-6" />
                <h2 className="text-lg font-bold text-red-800">منطقه خطر</h2>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800">غیرفعال‌سازی حساب</h3>
                  <p className="text-sm text-gray-500 mt-1">با انجام این کار، دسترسی شما و منشی‌ها به پنل قطع خواهد شد.</p>
                </div>
                <button type="button" onClick={handleDeleteAccount} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 transition">
                   غیرفعال‌سازی
                </button>
              </div>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
