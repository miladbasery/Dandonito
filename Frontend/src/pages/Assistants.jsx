import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Swal from 'sweetalert2';
import { Search, Plus, UserCircle, X, Trash2, Edit, ShieldCheck } from 'lucide-react';

export default function Assistants() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); 
  const [selectedId, setSelectedId] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '', full_name: '', phone_number: '', email: '', role: 'ASSISTANT', password: ''
  });

  const getToken = () => localStorage.getItem('access');

  const fetchData = async () => {
    try {
      const profileRes = await fetch('http://localhost:8080/profile/', { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (profileRes.ok) setProfile(await profileRes.json());
      else return navigate('/login');

      const assistantsRes = await fetch('http://localhost:8080/assistants/', { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (assistantsRes.ok) setAssistants(await assistantsRes.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [navigate]);

  const handleSaveAssistant = async (e) => {
    e.preventDefault();
    const isEdit = formMode === 'edit';
    const url = isEdit ? `http://localhost:8080/assistants/${selectedId}/` : 'http://localhost:8080/assistants/';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = { ...formData };
    if (isEdit) delete payload.password;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        Swal.fire({ icon: 'success', title: isEdit ? 'ویرایش موفق' : 'ثبت موفق', timer: 1500, showConfirmButton: false });
      } else {
        const errorData = await res.json();
        let msg = "";
        for (const key in errorData) { msg += `${key}: ${errorData[key]} <br/>`; }
        Swal.fire({ icon: 'error', title: 'خطا', html: msg });
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'حذف دسترسی؟',
      text: "این کاربر دیگر قادر به ورود به سیستم نخواهد بود.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'انصراف',
      confirmButtonText: 'بله، حذف دسترسی'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:8080/assistants/${id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) {
          fetchData();
          Swal.fire('غیرفعال شد', 'کاربر با موفقیت از کلینیک حذف شد.', 'success');
        } else {
          const error = await res.json();
          Swal.fire('خطا', error.error || 'عملیات ناموفق بود', 'error');
        }
      } catch (err) { console.error(err); }
    }
  };

  const filteredAssistants = assistants.filter(a => 
    a.full_name.includes(searchQuery) || a.username.includes(searchQuery) || a.phone_number.includes(searchQuery)
  );

  if (loading) return <div className="flex items-center justify-center h-screen font-bold text-blue-600">در حال بارگذاری...</div>;

  if (profile?.role === 'ASSISTANT') return <div className="flex h-screen items-center justify-center text-red-500 font-bold">شما دسترسی به این بخش را ندارید.</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative text-right" dir="rtl">
        <Topbar profile={profile} />

        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">کارمندان و منشی‌ها</h1>
              <p className="text-gray-500 text-sm mt-1">مدیریت دسترسی کارمندان به پنل کلینیک</p>
            </div>
            <button 
              onClick={() => {
                setFormData({ username: '', full_name: '', phone_number: '', email: '', role: 'ASSISTANT', password: '' });
                setFormMode('add');
                setIsModalOpen(true);
              }} 
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="w-5 h-5" /> افزودن کارمند جدید
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="جستجو بر اساس نام، نام کاربری یا موبایل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl pr-12 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6 text-right">نام و نام خانوادگی</th>
                  <th className="py-4 px-6 text-right">نام کاربری (سیستم)</th>
                  <th className="py-4 px-6 text-right">شماره تماس</th>
                  <th className="py-4 px-6 text-right">نقش کاربری</th>
                  <th className="py-4 px-6 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAssistants.length > 0 ? (
                  filteredAssistants.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/40 transition group">
                      <td className="py-4 px-6 font-bold text-gray-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                           <UserCircle className="w-6 h-6" />
                        </div>
                        {user.full_name}
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-medium" dir="ltr">{user.username}</td>
                      <td className="py-4 px-6 text-gray-600" dir="ltr">{user.phone_number}</td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-1 w-max bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
                          <ShieldCheck className="w-3 h-3"/> {user.role === 'ASSISTANT' ? 'منشی' : 'دکتر'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => {
                            setFormData({ username: user.username, full_name: user.full_name, phone_number: user.phone_number, email: user.email || '', role: user.role, password: '' });
                            setSelectedId(user.id);
                            setFormMode('edit');
                            setIsModalOpen(true);
                          }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="py-12 text-center text-gray-400">کارمندی یافت نشد.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        {isModalOpen && (
           <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[60]">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h2 className="text-lg font-bold text-gray-800">{formMode === 'add' ? 'ایجاد دسترسی برای کارمند' : 'ویرایش اطلاعات کارمند'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleSaveAssistant} className="p-6 space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1 text-right">نام و نام خانوادگی</label>
      <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
    </div>
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1 text-right">موبایل</label>
      <input type="text" required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500" dir="ltr" />
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1 text-right">نقش کاربری</label>
      <select 
        value={formData.role} 
        onChange={e => setFormData({...formData, role: e.target.value})} 
        className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500 bg-white cursor-pointer">
        <option value="ASSISTANT">منشی</option>
        <option value="DOCTOR">پزشک</option>
      </select>
    </div>
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1 text-right">ایمیل (اختیاری)</label>
      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500 text-left" dir="ltr" />
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1 text-right">نام کاربری سیستم (Username)</label>
      <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500" dir="ltr" />
    </div>
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1 text-right">رمز عبور {formMode === 'edit' && <span className="text-orange-400 font-normal">(غیرقابل تغییر از اینجا)</span>}</label>
      <input type="password" required={formMode === 'add'} disabled={formMode === 'edit'} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500 ${formMode === 'edit' ? 'bg-gray-100' : ''}`} dir="ltr" />
    </div>
  </div>

  <div className="pt-4 flex gap-3">
    <button type="submit" className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition">
      {formMode === 'add' ? 'ایجاد اکانت' : 'ذخیره تغییرات'}
    </button>
    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-200 transition">
      انصراف
    </button>
  </div>
</form>
           </div>
         </div>
        )}

      </div>
    </div>
  );
}