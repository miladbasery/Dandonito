// register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '', password: '', fullName: '', phoneNumber: '', email: '', 
    clinicName: '', clinicUsername: '', clinicPhone: '', otp: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/register/request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username, password: formData.password, full_name: formData.fullName,
          phone_number: formData.phoneNumber, email: formData.email, 
          clinic_name: formData.clinicName, clinic_username: formData.clinicUsername
        })
      });
      if (res.ok) setStep(2);
      else setError('اطلاعات وارد شده معتبر نیست یا نام کاربری تکراری است.');
    } catch {
      setError('خطا در ارتباط با سرور.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/register/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username, password: formData.password, full_name: formData.fullName,
          phone_number: formData.phoneNumber, email: formData.email, 
          clinic_name: formData.clinicName, clinic_username: formData.clinicUsername, 
          clinic_phone_number: formData.clinicPhone || formData.phoneNumber, otp: formData.otp
        })
      });
      if (res.ok) navigate('/login');
      else setError('کد تایید اشتباه است.');
    } catch {
      setError('خطا در ارتباط با سرور.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] py-12 px-4" dir="rtl">
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] w-full max-w-xl transition-all">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-4 shadow-sm">
            د
          </div>
          <h2 className="text-xl md:text-2xl font-black text-gray-800">ثبت‌نام و راه‌اندازی کلینیک</h2>
          <p className="text-gray-400 text-xs mt-2 font-medium">پلتفرم هوشمند مدیریت و نوبت‌دهی دندان‌پزشکی</p>
        </div>

        {error && (
          <div className="text-red-600 text-xs font-bold mb-6 text-center bg-red-50/60 border border-red-100 p-3 rounded-2xl animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-6 text-right">
            <div>
              <h3 className="font-black text-gray-800 text-sm border-r-4 border-blue-500 pr-2 mb-4">مشخصات پزشک (مدیر کلینیک)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">نام و نام خانوادگی</label>
                  <input name="fullName" type="text" placeholder="مثال: دکتر علی محمدی" onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition duration-200" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">نام کاربری</label>
                  <input name="username" type="text" placeholder="username" onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition duration-200 text-left" dir="ltr" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">شماره موبایل</label>
                  <input name="phoneNumber" type="text" placeholder="09123456789" onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition duration-200 text-left" dir="ltr" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">ایمیل</label>
                  <input name="email" type="email" placeholder="example@mail.com" onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition duration-200 text-left" dir="ltr" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">رمز عبور</label>
                  <input name="password" type="password" placeholder="حداقل ۸ کاراکتر ترکیبی" onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition duration-200 text-left" dir="ltr" required />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-black text-gray-800 text-sm border-r-4 border-purple-500 pr-2 mb-4">مشخصات کلینیک</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">نام کلینیک</label>
                  <input name="clinicName" type="text" placeholder="مثال: کلینیک دندان‌پزشکی صدف" onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition duration-200" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">نام کاربری کلینیک (لینک اختصاصی)</label>
                  <input name="clinicUsername" type="text" placeholder="sadaf-clinic" onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition duration-200 text-left" dir="ltr" required />
                </div>
              </div>
            </div>

            <button className="bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition duration-200 shadow-lg shadow-blue-100 mt-2 text-sm text-center">
              ثبت نهایی اطلاعات و دریافت پیامک تایید
            </button>
            
            <div className="flex justify-center pt-4 border-t border-gray-50">
              <Link to="/login" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">
                حساب کاربری دارید؟ ورود به سیستم
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-5 text-center">
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl mb-2 text-right">
              <p className="text-xs text-blue-700 font-bold leading-relaxed">
                اطلاعات اولیه با موفقیت ثبت شد. کد تایید پیامک شده به شماره موبایل پزشک را وارد کنید تا حساب کاربری و کلینیک شما فعال گردند.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 mr-1 text-right">کد تایید فعال‌سازی</label>
              <input 
                name="otp" 
                type="text"
                placeholder="••••" 
                maxLength={4}
                onChange={handleChange} 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-green-500/20 text-xl text-center tracking-[12px] font-black outline-none transition duration-200" 
                required 
              />
            </div>

            <button className="bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition duration-200 shadow-lg shadow-green-100 mt-2 text-sm">
              تایید و تکمیل ساخت حساب کلینیک
            </button>

            <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition mt-2">
              اصلاح و ویرایش اطلاعات ثبت‌نام
            </button>
          </form>
        )}
      </div>
    </div>
  );
}