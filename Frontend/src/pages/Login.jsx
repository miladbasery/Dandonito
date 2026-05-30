// login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ phoneNumber: '', password: '', otp: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/login/request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formData.phoneNumber, password: formData.password })
      });
      if (res.ok) setStep(2);
      else setError('شماره یا رمز عبور اشتباه است.');
    } catch {
      setError('خطا در ارتباط با سرور بک‌اند.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/login/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formData.phoneNumber, otp: formData.otp })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('access', data.tokens.access);
        navigate('/dashboard'); 
      } else setError('کد تایید اشتباه است.');
    } catch {
      setError('خطا در ارتباط با سرور.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] px-4" dir="rtl">
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] w-full max-w-md transition-all">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-4 shadow-sm">
            د
          </div>
          <h2 className="text-xl md:text-2xl font-black text-gray-800">ورود به سیستم دندونیتو</h2>
          <p className="text-gray-400 text-xs mt-2 font-medium">لطفاً اطلاعات حساب کاربری خود را وارد کنید</p>
        </div>

        {error && (
          <div className="text-red-600 text-xs font-bold mb-6 text-center bg-red-50/60 border border-red-100 p-3 rounded-2xl animate-in fade-in duration-200">
            {error}
          </div>
        )}
        
        {step === 1 ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-5 text-right">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">شماره موبایل</label>
              <input 
                name="phoneNumber" 
                type="text"
                placeholder="مثلاً ۰۹۱۲۳۴۵۶۷۸۹" 
                onChange={handleChange} 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition duration-200 text-left" 
                dir="ltr"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 mr-1">رمز عبور</label>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                onChange={handleChange} 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition duration-200 text-left" 
                dir="ltr"
                required 
              />
            </div>

            <button className="bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition duration-200 shadow-lg shadow-blue-100 mt-2 text-sm">
              دریافت کد تایید
            </button>
            
            <div className="flex justify-center mt-4 pt-4 border-t border-gray-50">
              <Link to="/register" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">
                ثبت‌نام کلینیک یا پزشک جدید
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-5 text-center">
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl mb-2">
              <p className="text-xs text-blue-700 font-bold leading-relaxed">
                کد تایید پیامک شده به شماره <span className="font-black" dir="ltr">{formData.phoneNumber}</span> را وارد کنید.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 mr-1 text-right">کد تایید</label>
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
              ورود به پنل مدیریت
            </button>

            <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition mt-2">
              تغییر شماره موبایل یا رمز عبور
            </button>
          </form>
        )}
      </div>
    </div>
  );
}