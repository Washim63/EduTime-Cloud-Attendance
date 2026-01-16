
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { COLORS } from '../constants.tsx';
import { 
  User, Mail, BookOpen, Lock, ShieldCheck, ChevronLeft, 
  Phone, ShieldEllipsis, CheckCircle2, SmartphoneNfc, 
  Briefcase, Hash, Landmark, ShieldAlert, MessageSquare, Loader2
} from 'lucide-react';
import { AppNotification, UserRole, AdminSubRole } from '../types.ts';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [otpStep, setOtpStep] = useState<'none' | 'sending' | 'pending' | 'verified'>('none');
  const [otpCode, setOtpCode] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [showSmsToast, setShowSmsToast] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    employeeCode: '',
    officeId: '',
    department: 'Science',
    position: 'Junior Teacher',
    adminRole: AdminSubRole.HR_MANAGER,
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  // Handle simulated SMS toast auto-hide
  useEffect(() => {
    if (showSmsToast) {
      const timer = setTimeout(() => setShowSmsToast(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [showSmsToast]);

  const generateOTP = () => {
    if (formData.mobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpStep('sending');
    
    // Simulate API delay for SMS gateway
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(code);
      setOtpStep('pending');
      setShowSmsToast(true);
      console.log(`[EduTime Security] SIMULATED SMS: Verification code for ${formData.mobile} is ${code}`);
    }, 1500);
  };

  const verifyOTP = () => {
    if (otpCode === sentOtp) {
      setOtpStep('verified');
      setShowSmsToast(false);
    } else {
      alert("Invalid verification code. Please check the simulated SMS notification at the top of the screen.");
    }
  };

  const createNotification = (userId: string, title: string, message: string, type: AppNotification['type']) => {
    const existing = JSON.parse(localStorage.getItem('edutime_notifications') || '[]');
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      userId, title, message, type,
      timestamp: new Date().toISOString(),
      read: false
    };
    localStorage.setItem('edutime_notifications', JSON.stringify([newNotif, ...existing]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (otpStep !== 'verified') {
      alert("Mobile verification is required for institutional security.");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      const existingUsers = JSON.parse(localStorage.getItem('edutime_cloud_users') || '[]');
      
      // Generate unique hardware binding token
      const deviceId = 'SEC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('edutime_hardware_token', deviceId);

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email.toLowerCase(),
        mobile: formData.mobile,
        password: formData.password,
        department: role === UserRole.ADMIN ? 'Administration' : formData.department,
        position: role === UserRole.ADMIN ? formData.adminRole : formData.position,
        employeeCode: role === UserRole.TEACHER ? formData.employeeCode : undefined,
        officeId: role === UserRole.ADMIN ? formData.officeId : undefined,
        avatar: `https://picsum.photos/seed/${formData.name}/200`,
        role: role,
        adminSubRole: role === UserRole.ADMIN ? formData.adminRole : AdminSubRole.NONE,
        deviceId: deviceId, 
        verifiedAt: new Date().toISOString()
      };

      if (existingUsers.find((u: any) => u.email === newUser.email)) {
        alert("This institutional email is already enrolled.");
        setLoading(false);
        return;
      }

      existingUsers.push(newUser);
      localStorage.setItem('edutime_cloud_users', JSON.stringify(existingUsers));

      createNotification('ADMIN', `New Enrollment: ${role}`, `${newUser.name} has joined the system.`, 'success');

      alert(`${role} account created successfully! Your device is now bound to this account for secure punching.`);
      setLoading(false);
      navigate('/login');
    }, 1800);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      
      {/* Simulated SMS Toast - Crucial for UX */}
      {showSmsToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-sm z-[100] animate-slideUp px-4">
          <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl border border-slate-700 flex items-start space-x-4">
            <div className="p-2.5 bg-green-500 rounded-full">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional SMS Alert</p>
              <p className="text-sm font-bold mt-1">
                EduTime: Your verification code is <span className="text-green-400 font-black text-xl ml-1">{sentOtp}</span>
              </p>
            </div>
            <button onClick={() => setShowSmsToast(false)} className="text-slate-500 hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-slideUp border border-slate-100">
        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex items-center justify-between">
            <Link to="/login" className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="text-center flex-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Cloud Portal</span>
               <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mt-1">
                 SECURE <span style={{ color: COLORS.primary }}>SETUP</span>
               </h1>
            </div>
            <div className="w-11 h-11"></div>
          </div>

          <div className="flex p-1.5 bg-slate-100 rounded-3xl border border-slate-200/50 shadow-inner">
            <button
              type="button"
              onClick={() => setRole(UserRole.TEACHER)}
              className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] flex items-center justify-center space-x-2 ${role === UserRole.TEACHER ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'}`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.ADMIN)}
              className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] flex items-center justify-center space-x-2 ${role === UserRole.ADMIN ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-green-600 transition-colors" />
                <input type="text" name="name" required placeholder="Full Legal Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-green-500/20 outline-none font-bold text-slate-800" value={formData.name} onChange={handleChange} />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-green-600 transition-colors" />
                <input type="email" name="email" required placeholder="Institutional Email" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-green-500/20 outline-none font-bold text-slate-800" value={formData.email} onChange={handleChange} />
              </div>

              <div className="space-y-3">
                <div className="relative flex items-center group">
                  <Phone className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-green-600 transition-colors" />
                  <input 
                    type="tel" 
                    name="mobile" 
                    required 
                    placeholder="Mobile Number" 
                    className={`w-full pl-12 pr-28 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-green-500/20 outline-none font-bold text-slate-800 ${otpStep === 'verified' ? 'border-green-100 bg-green-50/20' : ''}`} 
                    value={formData.mobile} 
                    onChange={handleChange}
                    disabled={otpStep === 'verified'}
                  />
                  {otpStep === 'none' && (
                    <button 
                      type="button" 
                      onClick={generateOTP}
                      disabled={formData.mobile.length < 10}
                      className="absolute right-2.5 px-4 py-2 text-[10px] font-black rounded-xl uppercase tracking-tighter bg-green-600 text-white shadow-lg shadow-green-200 disabled:bg-slate-200"
                    >
                      SEND OTP
                    </button>
                  )}
                  {otpStep === 'sending' && <div className="absolute right-4 text-slate-400 animate-spin"><Loader2 className="w-4 h-4" /></div>}
                  {otpStep === 'verified' && <div className="absolute right-4 text-green-600 animate-fadeIn"><CheckCircle2 className="w-4 h-4" /></div>}
                </div>

                {otpStep === 'pending' && (
                  <div className="relative flex animate-slideUp">
                    <ShieldEllipsis className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="ENTER 6-DIGIT CODE" 
                      className="w-full pl-12 pr-32 py-4 bg-green-50 border-2 border-green-200 rounded-[1.5rem] outline-none font-black tracking-[0.6em] text-center text-green-700" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                    />
                    <button 
                      type="button" 
                      onClick={verifyOTP}
                      className="absolute right-2.5 top-2.5 bottom-2.5 px-5 bg-green-600 text-white text-[10px] font-black rounded-[1rem] uppercase transition-all active:scale-95"
                    >
                      VERIFY
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-inner">
               {role === UserRole.TEACHER ? (
                 <>
                   <div className="relative group">
                      <Hash className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                      <input type="text" name="employeeCode" required placeholder="Staff ID Code" className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold" value={formData.employeeCode} onChange={handleChange} />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <select name="department" className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold" value={formData.department} onChange={handleChange}>
                        <option>Science</option><option>Mathematics</option><option>Language</option><option>Administration</option>
                      </select>
                      <select name="position" className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold" value={formData.position} onChange={handleChange}>
                        <option>Junior Teacher</option><option>Senior Teacher</option><option>Staff Member</option>
                      </select>
                   </div>
                 </>
               ) : (
                 <>
                    <div className="relative group">
                      <Landmark className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                      <input type="text" name="officeId" required placeholder="Office ID" className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold" value={formData.officeId} onChange={handleChange} />
                    </div>
                    <select name="adminRole" className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold" value={formData.adminRole} onChange={handleChange}>
                      <option value={AdminSubRole.HR_MANAGER}>Personnel/HR</option>
                      <option value={AdminSubRole.COORDINATOR}>Academic Coordinator</option>
                      <option value={AdminSubRole.PRINCIPAL}>Principal</option>
                    </select>
                 </>
               )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="password" name="password" required placeholder="Password" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold" value={formData.password} onChange={handleChange} />
              <input type="password" name="confirmPassword" required placeholder="Confirm" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold" value={formData.confirmPassword} onChange={handleChange} />
            </div>

            <button 
              type="submit" 
              disabled={loading || otpStep !== 'verified'} 
              className={`w-full py-5 rounded-[2.5rem] text-white font-black text-xs tracking-[0.3em] uppercase shadow-2xl transition-all flex items-center justify-center ${otpStep !== 'verified' ? 'opacity-40 bg-slate-400' : 'hover:brightness-110 active:scale-95'}`}
              style={otpStep === 'verified' ? { backgroundColor: COLORS.primary } : {}}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "COMPLETE ENROLLMENT"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
