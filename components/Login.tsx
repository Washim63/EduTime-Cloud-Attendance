
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole, AdminSubRole } from '../types.ts';
import { COLORS, MOCK_TEACHERS } from '../constants.tsx';
import { Clock, Mail, Lock, ChevronRight, AlertCircle, ShieldAlert, Smartphone, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: (id: string, name: string, role: UserRole, subRole?: AdminSubRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'auth' | 'security'; userId?: string } | null>(null);
  
  // Device Recovery State
  const [showRecovery, setShowRecovery] = useState(false);
  const [otpStep, setOtpStep] = useState<'none' | 'sending' | 'pending' | 'verified'>('none');
  const [otpCode, setOtpCode] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [showSmsToast, setShowSmsToast] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (showSmsToast) {
      const timer = setTimeout(() => setShowSmsToast(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showSmsToast]);

  const startRecovery = () => {
    setOtpStep('sending');
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(code);
      setOtpStep('pending');
      setShowSmsToast(true);
    }, 1500);
  };

  const handleLinkDevice = () => {
    if (otpCode !== sentOtp) {
      alert("Invalid verification code.");
      return;
    }

    const cloudUsers = JSON.parse(localStorage.getItem('edutime_cloud_users') || '[]');
    const newDeviceId = 'SEC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Update the user's device binding in the "Cloud"
    const updatedUsers = cloudUsers.map((u: any) => {
      if (u.id === error?.userId) {
        return { ...u, deviceId: newDeviceId };
      }
      return u;
    });

    localStorage.setItem('edutime_cloud_users', JSON.stringify(updatedUsers));
    localStorage.setItem('edutime_hardware_token', newDeviceId);
    
    setOtpStep('verified');
    setTimeout(() => {
      setError(null);
      setShowRecovery(false);
      alert("Device re-linked successfully. You can now log in.");
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      const emailLower = email.toLowerCase();
      const currentDeviceToken = localStorage.getItem('edutime_hardware_token');

      // Admin Bypass for Principal
      if (role === UserRole.ADMIN) {
        if (emailLower === 'admin@school.edu' && password === 'admin123') {
          onLogin('admin-1', 'Principal Wilson', UserRole.ADMIN, AdminSubRole.PRINCIPAL);
          setLoading(false);
          navigate('/');
          return;
        }
      }

      const cloudUsers = JSON.parse(localStorage.getItem('edutime_cloud_users') || '[]');
      const user = cloudUsers.find((u: any) => u.email === emailLower && u.role === role);

      if (user) {
        if (user.password === password) {
          // SECURITY CHECK: Device Hardware Binding
          if (user.deviceId && user.deviceId !== currentDeviceToken) {
            setError({ 
              message: "This account is bound to another device ID. If you've changed phones or cleared your data, please re-verify your device.", 
              type: 'security',
              userId: user.id
            });
            setLoading(false);
            return;
          }

          // If no deviceId is set on user (first login ever or reset), link this device
          if (!user.deviceId) {
            const newDeviceId = currentDeviceToken || 'SEC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            localStorage.setItem('edutime_hardware_token', newDeviceId);
            user.deviceId = newDeviceId;
            const updated = cloudUsers.map((u: any) => u.id === user.id ? user : u);
            localStorage.setItem('edutime_cloud_users', JSON.stringify(updated));
          }

          onLogin(user.id, user.name, user.role, user.adminSubRole || (user.role === UserRole.ADMIN ? AdminSubRole.PRINCIPAL : undefined));
          setLoading(false);
          navigate('/');
          return;
        } else {
          setError({ message: "Incorrect password for this institutional account.", type: 'auth' });
          setLoading(false);
          return;
        }
      }

      // Mock Fallback
      if (role === UserRole.TEACHER) {
        const mockTeacher = MOCK_TEACHERS.find(t => t.email.toLowerCase() === emailLower);
        if (mockTeacher) {
          onLogin(mockTeacher.id, mockTeacher.name, UserRole.TEACHER);
          setLoading(false);
          navigate('/');
          return;
        }
      }

      setError({ message: "Staff account not found. Please verify role or enroll.", type: 'auth' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      
      {showSmsToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-sm z-[100] animate-slideUp px-4">
          <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl border border-slate-700 flex items-start space-x-4">
            <div className="p-2.5 bg-blue-500 rounded-full"><MessageSquare className="w-5 h-5 text-white" /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Recovery SMS</p>
              <p className="text-sm font-bold mt-1">EduTime: Recovery code is <span className="text-blue-400 font-black text-xl">{sentOtp}</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-slideUp border border-gray-100">
        <div className="p-8 sm:p-10 space-y-8">
          <div className="text-center">
            <div className="inline-flex p-5 rounded-[1.5rem] bg-green-50 mb-6 shadow-sm">
               <Clock className="w-10 h-10" stroke={COLORS.primary} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">EDU<span style={{ color: COLORS.primary }}>TIME</span></h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Mobile Attendance System</p>
          </div>

          {error && (
            <div className={`p-4 rounded-2xl text-sm font-medium flex flex-col animate-fadeIn border ${error.type === 'security' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
              <div className="flex items-start mb-3">
                {error.type === 'security' ? <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="font-black text-[10px] uppercase mb-0.5 tracking-wider">{error.type === 'security' ? 'Lockdown Active' : 'Login Error'}</p>
                  <p className="text-xs opacity-90 leading-relaxed">{error.message}</p>
                </div>
              </div>
              
              {error.type === 'security' && !showRecovery && (
                <button 
                  onClick={() => setShowRecovery(true)}
                  className="w-full py-2.5 mt-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Re-link This Device</span>
                </button>
              )}
            </div>
          )}

          {showRecovery ? (
            <div className="space-y-6 animate-slideUp bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <div className="text-center">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Device Recovery</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Verify identity to authorize this hardware.</p>
              </div>

              {otpStep === 'none' && (
                <button onClick={startRecovery} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Send Recovery OTP</span>
                </button>
              )}

              {otpStep === 'sending' && (
                <div className="flex items-center justify-center py-4 text-slate-400">
                   <Loader2 className="w-6 h-6 animate-spin mr-2" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Processing...</span>
                </div>
              )}

              {otpStep === 'pending' && (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="6-DIGIT CODE" 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-center font-black tracking-[0.5em] outline-none focus:border-blue-500" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                  />
                  <button onClick={handleLinkDevice} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    Confirm & Link Device
                  </button>
                </div>
              )}

              {otpStep === 'verified' && (
                <div className="flex items-center justify-center py-4 text-green-600 space-x-2">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Authorized!</span>
                </div>
              )}

              <button onClick={() => setShowRecovery(false)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.TEACHER)}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${role === UserRole.TEACHER ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.ADMIN)}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${role === UserRole.ADMIN ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Admin
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" strokeWidth={2} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Official Email" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-500/30 outline-none transition-all font-medium" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" strokeWidth={2} />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Access Password" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-500/30 outline-none transition-all font-medium" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl text-white font-black text-sm tracking-widest uppercase shadow-xl transition-all flex items-center justify-center space-x-2" style={{ backgroundColor: COLORS.primary }}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span>AUTHENTICATE</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-500">New around here? <Link to="/register" className="font-black text-green-600">Enroll here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
