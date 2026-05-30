import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Swal from 'sweetalert2';
import { Search, Plus, User as UserIcon, X, FileText, Trash2, Phone, CreditCard, Activity, Edit, Calendar, Droplet, Hash } from 'lucide-react';

export default function Patients() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedPatient, setSelectedPatient] = useState(null); 
  
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientFormMode, setPatientFormMode] = useState('add'); 
  
  const [patientForm, setPatientForm] = useState({ 
    first_name: '', 
    last_name: '', 
    phone_number: '', 
    national_id: '', 
    gender: 'UNKNOWN',
    age: '',
    blood_group: ''
  });

  const [isHistoryEditModalOpen, setIsHistoryEditModalOpen] = useState(false);
  const [historyForm, setHistoryForm] = useState({ id: null, title: '', description: '' });
  
  const [newHistory, setNewHistory] = useState({ title: '', description: '' });

  const getToken = () => localStorage.getItem('access');

  const fetchPatientsList = async () => {
    try {
      const res = await fetch('http://localhost:8080/patients/', { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setPatients(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const init = async () => {
      if (!getToken()) return navigate('/login');
      try {
        const profileRes = await fetch('http://localhost:8080/profile/', { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (profileRes.ok) setProfile(await profileRes.json());
        await fetchPatientsList();
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    init();
  }, [navigate]);

  const fetchPatientDetails = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/patients/${id}/`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setSelectedPatient(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    const isEdit = patientFormMode === 'edit';
    const url = isEdit ? `http://localhost:8080/patients/${selectedPatient.id}/` : 'http://localhost:8080/patients/';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(patientForm)
      });
      
      if (res.ok) {
        setIsPatientModalOpen(false);
        fetchPatientsList();
        if (isEdit) fetchPatientDetails(selectedPatient.id);
      } else {
        const errorData = await res.json();
        console.error("جزئیات ارور بک‌اند:", errorData);
        let errorMessage = "خطا در ذخیره! دلیل رد شدن توسط جنگو:\n\n";
        for (const key in errorData) {
          errorMessage += `- فیلد ${key}: ${errorData[key]}\n`;
        }
        alert(errorMessage);
      }
    } catch (err) { 
        console.error(err); 
        alert('خطا در ارتباط با سرور!');
    }
  };

  const openEditPatientModal = () => {
    setPatientForm({
      first_name: selectedPatient.first_name, 
      last_name: selectedPatient.last_name,
      phone_number: selectedPatient.phone_number, 
      national_id: selectedPatient.national_id || '', 
      gender: selectedPatient.gender,
      age: selectedPatient.age || '',
      blood_group: selectedPatient.blood_group || ''
    });
    setPatientFormMode('edit');
    setIsPatientModalOpen(true);
  };

  const handleDeletePatient = async (id) => {
  const result = await Swal.fire({
    title: 'آیا مطمئن هستید؟',
    text: "این عملیات غیرقابل بازگشت است!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#ef4444',
    confirmButtonText: 'بله، حذف شود',
    cancelButtonText: 'انصراف'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`http://localhost:8080/patients/${id}/`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${getToken()}` } 
      });
      if (res.ok) {
        setSelectedPatient(null);
        fetchPatientsList();
        Swal.fire('حذف شد!', 'پرونده بیمار با موفقیت حذف گردید.', 'success');
      }
    } catch (err) {
      Swal.fire('خطا!', 'مشکلی در ارتباط با سرور رخ داد.', 'error');
    }
  }
};

  const handleAddHistory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8080/patients/${selectedPatient.id}/history/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(newHistory)
      });
      if (res.ok) {
        setNewHistory({ title: '', description: '' });
        fetchPatientDetails(selectedPatient.id);
        fetchPatientsList();
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateHistory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8080/patients/${selectedPatient.id}/history/${historyForm.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ title: historyForm.title, description: historyForm.description })
      });
      if (res.ok) {
        setIsHistoryEditModalOpen(false);
        fetchPatientDetails(selectedPatient.id);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteHistory = async (historyId) => {
    if(!window.confirm('آیا از حذف این سابقه پزشکی مطمئن هستید؟')) return;
    try {
      const res = await fetch(`http://localhost:8080/patients/${selectedPatient.id}/history/${historyId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) fetchPatientDetails(selectedPatient.id);
    } catch (err) { console.error(err); }
  };

  const filteredPatients = patients.filter(p => 
    (p.first_name + ' ' + p.last_name).includes(searchQuery) || p.phone_number.includes(searchQuery) || (p.national_id && p.national_id.includes(searchQuery))
  );

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-blue-600 font-bold">در حال بارگذاری سیستم...</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative text-right" dir="rtl">
        <Topbar profile={profile} />

        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">بیماران کلینیک</h1>
              <p className="text-gray-500 text-sm mt-1">مدیریت جامع بیماران و پرونده‌های پزشکی</p>
            </div>
            <button 
              onClick={() => {
                setPatientForm({ first_name: '', last_name: '', phone_number: '', national_id: '', gender: 'UNKNOWN', age: '', blood_group: '' });
                setPatientFormMode('add');
                setIsPatientModalOpen(true);
              }} 
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="w-5 h-5" /> افزودن بیمار
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="جستجو بر اساس نام، موبایل یا کدملی..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl pr-12 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6 text-right">نام بیمار</th>
                  <th className="py-4 px-6 text-right">شماره تماس</th>
                  <th className="py-4 px-6 text-right">کد ملی</th>
                  <th className="py-4 px-6 text-right">وضعیت پرونده</th>
                  <th className="py-4 px-6 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-blue-50/40 transition group">
                      <td className="py-4 px-6 font-bold text-gray-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                           {patient.first_name.charAt(0)}
                        </div>
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-medium" dir="ltr">{patient.phone_number}</td>
                      <td className="py-4 px-6 text-gray-500">{patient.national_id || '---'}</td>
                      <td className="py-4 px-6">
                        {patient.has_history ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">دارای سابقه</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium">بدون سابقه</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-left">
                        <button onClick={() => fetchPatientDetails(patient.id)} className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition border border-blue-100 hover:border-blue-200">
                          مدیریت پرونده
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="py-12 text-center text-gray-400">بیماری یافت نشد.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        {isPatientModalOpen && (
           <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60]">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h2 className="text-lg font-bold text-gray-800">{patientFormMode === 'add' ? 'ثبت بیمار جدید' : 'ویرایش اطلاعات بیمار'}</h2>
               <button onClick={() => setIsPatientModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleSavePatient} className="p-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">نام</label>
                   <input type="text" required value={patientForm.first_name} onChange={e => setPatientForm({...patientForm, first_name: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">نام خانوادگی</label>
                   <input type="text" required value={patientForm.last_name} onChange={e => setPatientForm({...patientForm, last_name: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">شماره موبایل</label>
                   <input type="text" required value={patientForm.phone_number} onChange={e => setPatientForm({...patientForm, phone_number: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500" dir="ltr" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">کد ملی</label>
                   <input type="text" value={patientForm.national_id} onChange={e => setPatientForm({...patientForm, national_id: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500" />
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 text-right">سن</label>
                    <input type="number" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 text-right">جنسیت</label>
                    <select value={patientForm.gender} onChange={e => setPatientForm({...patientForm, gender: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none">
                      <option value="UNKNOWN">نامشخص</option>
                      <option value="MALE">مرد</option>
                      <option value="FEMALE">زن</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 text-right">گروه خونی</label>
                    <input type="text" placeholder="+A" value={patientForm.blood_group} onChange={e => setPatientForm({...patientForm, blood_group: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none" />
                  </div>
               </div>
               <div className="pt-4 flex gap-3">
                 <button type="submit" className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700">{patientFormMode === 'add' ? 'ثبت بیمار' : 'ذخیره تغییرات'}</button>
                 <button type="button" onClick={() => setIsPatientModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-200">انصراف</button>
               </div>
             </form>
           </div>
         </div>
        )}

        {selectedPatient && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-start z-[55]">
            <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-5 border-b flex justify-between items-center z-10 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">پرونده پزشکی</h2>
                <button onClick={() => setSelectedPatient(null)} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 text-right">
                <div className="bg-blue-50/50 rounded-2xl p-5 mb-8 border border-blue-100">
                  <div className="flex items-center gap-4 mb-4 justify-end">
                    <div className="text-right">
                      <h3 className="text-lg font-bold text-gray-800">{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                      <p className="text-sm text-gray-500">ثبت: {new Date(selectedPatient.created_at).toLocaleDateString('fa-IR')}</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
                      {selectedPatient.first_name.charAt(0)}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-5 flex flex-col items-end">
                    <div className="flex items-center gap-3 text-gray-600 text-sm">{selectedPatient.phone_number} <Phone className="w-4 h-4 text-gray-400"/></div>
                    <div className="flex items-center gap-3 text-gray-600 text-sm">کد ملی: {selectedPatient.national_id || '---'} <CreditCard className="w-4 h-4 text-gray-400"/></div>
                    <div className="flex items-center gap-3 text-gray-600 text-sm">گروه خونی: {selectedPatient.blood_group || '---'} <Droplet className="w-4 h-4 text-gray-400"/></div>
                    <div className="flex items-center gap-3 text-gray-600 text-sm">سن: {selectedPatient.age || '---'} <Hash className="w-4 h-4 text-gray-400"/></div>
                  </div>
                  
                  <div className="flex gap-2 mt-5 pt-4 border-t border-blue-100/50">
                    <button onClick={openEditPatientModal} className="flex-1 py-2 flex items-center justify-center gap-2 text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-xl text-sm font-medium transition">
                      ویرایش مشخصات <Edit className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleDeletePatient(selectedPatient.id)} className="flex-1 py-2 flex items-center justify-center gap-2 text-red-500 bg-white border border-red-200 hover:bg-red-50 rounded-xl text-sm font-medium transition">
                      حذف پرونده <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 justify-end">ثبت سابقه جدید <Activity className="w-5 h-5 text-blue-500"/></h4>
                <form onSubmit={handleAddHistory} className="mb-8 space-y-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <input type="text" placeholder="عنوان ویزیت" required value={newHistory.title} onChange={e => setNewHistory({...newHistory, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition text-right" />
                  <textarea placeholder="توضیحات پزشک..." required value={newHistory.description} onChange={e => setNewHistory({...newHistory, description: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white min-h-[100px] transition text-right" />
                  <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm text-sm">ثبت در پرونده</button>
                </form>

                <h4 className="font-bold text-gray-800 mb-5 flex items-center gap-2 justify-end">تاریخچه پزشکی <FileText className="w-5 h-5 text-blue-500"/></h4>
                {selectedPatient.history && selectedPatient.history.length > 0 ? (
                  <div className="space-y-6 relative border-r-2 border-gray-100 pr-4">
                    {selectedPatient.history.map((record) => (
                      <div key={record.id} className="relative pr-5 py-1">
                        <span className="absolute -right-[9px] top-3 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white"></span>
                        <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-xl hover:border-blue-200 transition group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                              {new Date(record.created_at).toLocaleDateString('fa-IR')} <Calendar className="w-3 h-3"/>
                            </span>
                            <h5 className="font-bold text-gray-800 text-right">{record.title}</h5>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed mb-4 text-right">{record.description}</p>
                          <div className="flex gap-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition duration-200 justify-end">
                             <button onClick={() => { setHistoryForm({ id: record.id, title: record.title, description: record.description }); setIsHistoryEditModalOpen(true); }} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">ویرایش <Edit className="w-3 h-3"/></button>
                             <button onClick={() => handleDeleteHistory(record.id)} className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1">حذف <Trash2 className="w-3 h-3"/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm bg-gray-50">سابقه‌ای یافت نشد.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {isHistoryEditModalOpen && (
           <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[70]">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 text-right">
             <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h2 className="font-bold text-gray-800">ویرایش سابقه</h2>
               <button onClick={() => setIsHistoryEditModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleUpdateHistory} className="p-5 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1 text-right">عنوان</label>
                 <input type="text" required value={historyForm.title} onChange={e => setHistoryForm({...historyForm, title: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500 text-sm text-right" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1 text-right">توضیحات</label>
                 <textarea required value={historyForm.description} onChange={e => setHistoryForm({...historyForm, description: e.target.value})} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-blue-500 min-h-[120px] text-sm text-right" />
               </div>
               <div className="pt-2 flex gap-3">
                 <button type="submit" className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-xl text-sm hover:bg-blue-700">ذخیره</button>
                 <button type="button" onClick={() => setIsHistoryEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 font-medium py-2 rounded-xl text-sm hover:bg-gray-200">لغو</button>
               </div>
             </form>
           </div>
         </div>
        )}

      </div>
    </div>
  );
}