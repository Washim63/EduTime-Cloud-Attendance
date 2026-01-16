
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { COLORS, MOCK_TEACHERS, SCHOOL_HOURS, DEFAULT_LEAVE_TYPES } from '../constants.tsx';
import { 
  Fingerprint, LogOut, MapPin, Calendar, 
  History, User, Edit3, X, Timer, ShieldCheck, Navigation, ArrowRight,
  Check, Loader2, Clock, Sun, Stethoscope, Coffee, Briefcase, 
  BookOpen, Award, BellRing, ChevronRight, AlertCircle, Palette
} from 'lucide-react';
import LeaveStatusList from './LeaveStatusList.tsx';
import { AppNotification, ProfileUpdateRequest, LeaveRequest, CustomLeaveType } from '../types.ts';

interface TeacherDashboardProps {
  teacherId: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacherId }) => {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [punches, setPunches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'punch' | 'leave' | 'history' | 'profile'>('punch');
  const [isLocating, setIsLocating] = useState(true);
  const [showPunchSuccess, setShowPunchSuccess] = useState(false);
  const [lastAction, setLastAction] = useState<'IN' | 'OUT' | null>(null);
  
  // Dynamic Configuration
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<CustomLeaveType[]>([]);
  
  // Leave Form State
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const [leaveBalances, setLeaveBalances] = useState<Record<string, number>>({});

  const cloudUsers = JSON.parse(localStorage.getItem('edutime_cloud_users') || '[]');
  const teacher = cloudUsers.find((u: any) => String(u.id) === String(teacherId)) || MOCK_TEACHERS.find(t => t.id === teacherId) || MOCK_TEACHERS[0];
  
  const liveStream = useRef(new BroadcastChannel('edutime_live_stream'));

  useEffect(() => {
    // Load Global Configuration - Initialize with defaults if empty to satisfy "show by default" requirement
    let globalTypes: CustomLeaveType[] = JSON.parse(localStorage.getItem('edutime_leave_types') || '[]');
    if (globalTypes.length === 0) {
      globalTypes = DEFAULT_LEAVE_TYPES;
      localStorage.setItem('edutime_leave_types', JSON.stringify(DEFAULT_LEAVE_TYPES));
    }
    
    setAvailableLeaveTypes(globalTypes);
    if (globalTypes.length > 0) setLeaveType(globalTypes[0].name);

    // Load personal balances
    let savedBalances = JSON.parse(localStorage.getItem(`edutime_balances_${teacherId}`) || '{}');
    
    // Sync with global types - if new types exist in global but not in user's balances, add them with defaults
    let updated = false;
    globalTypes.forEach(gt => {
      if (!(gt.name in savedBalances)) {
        savedBalances[gt.name] = gt.defaultBalance;
        updated = true;
      }
    });

    if (updated || Object.keys(savedBalances).length === 0) {
      localStorage.setItem(`edutime_balances_${teacherId}`, JSON.stringify(savedBalances));
    }
    setLeaveBalances(savedBalances);
    
    const todayISO = new Date().toISOString().split('T')[0];
    const allLogs = JSON.parse(localStorage.getItem('edutime_attendance_logs') || '[]');
    const myTodayLogs = allLogs.filter((l: any) => l.teacherId === teacherId && l.date === todayISO);
    myTodayLogs.sort((a: any, b: any) => b.time.localeCompare(a.time));
    
    setPunches(myTodayLogs);
    if (myTodayLogs.length > 0) setIsPunchedIn(myTodayLogs[0].type === 'Punch In');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
          setIsLocating(false);
        },
        () => { setLocation("School Main Gate"); setIsLocating(false); }
      );
    } else { setLocation("School Zone"); setIsLocating(false); }
  }, [teacherId]);

  const handlePunch = () => {
    if (isLocating) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toISOString().split('T')[0];
    
    let status = 'Normal';
    if (!isPunchedIn) {
      if (timeStr > SCHOOL_HOURS.grace) status = 'Late';
      else if (timeStr > SCHOOL_HOURS.start) status = 'On Time';
      else status = 'Early';
    }

    const type = isPunchedIn ? 'Punch Out' : 'Punch In';
    const newPunch = { 
      id: Math.random().toString(36).substr(2, 9),
      teacherId: teacher.id,
      name: teacher.name,
      dept: teacher.department,
      time: timeStr, 
      date: dateStr,
      type: type, 
      location: location || 'Staff Room',
      status: status 
    };
    
    const allLogs = JSON.parse(localStorage.getItem('edutime_attendance_logs') || '[]');
    localStorage.setItem('edutime_attendance_logs', JSON.stringify([newPunch, ...allLogs]));
    
    liveStream.current.postMessage({
      type: 'PUNCH_EVENT',
      teacherId: teacher.id,
      name: teacher.name,
      action: isPunchedIn ? 'departed' : 'arrived',
      time: timeStr
    });

    setPunches([newPunch, ...punches]);
    setIsPunchedIn(!isPunchedIn);
    setLastAction(isPunchedIn ? 'OUT' : 'IN');
    setShowPunchSuccess(true);
    setTimeout(() => setShowPunchSuccess(false), 3000);
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || (!isHalfDay && !toDate)) {
      alert("Please select dates.");
      return;
    }

    setIsSubmittingLeave(true);

    // Simulate Network Latency
    setTimeout(() => {
      const start = new Date(fromDate);
      const end = isHalfDay ? new Date(fromDate) : new Date(toDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = isHalfDay ? 0.5 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const currentBalance = leaveBalances[leaveType];

      if (diffDays > currentBalance) {
        alert(`Insufficient balance! You only have ${currentBalance} days left for ${leaveType}.`);
        setIsSubmittingLeave(false);
        return;
      }

      const newRequest: LeaveRequest = {
        id: 'LV-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        teacherId: teacherId,
        teacherName: teacher.name,
        type: leaveType,
        startDate: fromDate,
        endDate: isHalfDay ? fromDate : toDate,
        reason: reason,
        status: 'Pending',
        appliedAt: new Date().toISOString(),
        isHalfDay: isHalfDay
      };

      // Save Request
      const allRequests = JSON.parse(localStorage.getItem('edutime_leave_requests') || '[]');
      localStorage.setItem('edutime_leave_requests', JSON.stringify([newRequest, ...allRequests]));

      // Update Local Balance
      const updatedBalances = {
        ...leaveBalances,
        [leaveType]: currentBalance - diffDays
      };
      setLeaveBalances(updatedBalances);
      localStorage.setItem(`edutime_balances_${teacherId}`, JSON.stringify(updatedBalances));

      // Notify Admin
      const notifications = JSON.parse(localStorage.getItem('edutime_notifications') || '[]');
      notifications.unshift({
        id: Math.random().toString(36).substr(2, 9),
        userId: 'ADMIN',
        title: 'New Leave Request',
        message: `${teacher.name} applied for ${diffDays} day(s) of ${leaveType}.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      });
      localStorage.setItem('edutime_notifications', JSON.stringify(notifications));

      // Reset Form
      setFromDate('');
      setToDate('');
      setReason('');
      setIsSubmittingLeave(false);
      alert("Application submitted successfully. It is now pending Principal approval.");
      setActiveTab('history');
    }, 1500);
  };

  const getLeaveIcon = (iconName: string, color: string) => {
    const colorMap: Record<string, string> = {
      orange: 'text-orange-500 bg-orange-50',
      blue: 'text-blue-500 bg-blue-50',
      emerald: 'text-emerald-500 bg-emerald-50',
      purple: 'text-purple-500 bg-purple-50',
      rose: 'text-rose-500 bg-rose-50',
    };
    
    const icons: Record<string, any> = { Sun, Stethoscope, Coffee, Briefcase, Award, Palette };
    const IconComponent = icons[iconName] || Sun;
    return <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.emerald} mb-2`}><IconComponent className="w-4 h-4" /></div>;
  };

  const isLate = !isPunchedIn && new Date().toTimeString().slice(0, 5) > SCHOOL_HOURS.grace;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 animate-fadeIn pb-32">
      {showPunchSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl animate-slideUp border border-slate-100 max-w-xs w-full">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-checkmark ${lastAction === 'IN' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {lastAction === 'IN' ? <Check className="w-12 h-12 text-emerald-600" /> : <LogOut className="w-10 h-10 text-red-600" />}
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{lastAction === 'IN' ? 'Welcome!' : 'Goodbye!'}</h2>
            <p className="text-slate-500 font-medium mt-2">Attendance captured at <span className="font-bold text-slate-800">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.</p>
            <button onClick={() => setShowPunchSuccess(false)} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Continue</button>
          </div>
        </div>
      )}

      {/* SCHOOL BRANDING HEADER */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img src={teacher.avatar} className="w-16 h-16 rounded-[1.5rem] border-4 border-white shadow-lg" alt="avatar" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isPunchedIn ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{teacher.name}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{teacher.department}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><BellRing className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex bg-white rounded-[2rem] p-1.5 shadow-sm border border-slate-100 sticky top-4 z-10 backdrop-blur-md bg-white/90">
        <button onClick={() => setActiveTab('punch')} className={`flex-1 py-3.5 text-[10px] font-black rounded-[1.5rem] uppercase tracking-widest transition-all ${activeTab === 'punch' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>Clock</button>
        <button onClick={() => setActiveTab('leave')} className={`flex-1 py-3.5 text-[10px] font-black rounded-[1.5rem] uppercase tracking-widest transition-all ${activeTab === 'leave' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>Leaves</button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3.5 text-[10px] font-black rounded-[1.5rem] uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>Logs</button>
      </div>

      {activeTab === 'punch' && (
        <div className="space-y-6 animate-fadeIn">
          {/* DAILY SCHEDULE CARD */}
          <div className="bg-emerald-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden">
            <BookOpen className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Next Academic Period</p>
              <h3 className="text-xl font-black mt-1">Physics Lab - Grade 11-A</h3>
              <div className="flex items-center mt-4 space-x-4">
                <div className="bg-white/20 px-3 py-1.5 rounded-xl flex items-center backdrop-blur-md">
                   <Clock className="w-3.5 h-3.5 mr-2" />
                   <span className="text-[10px] font-bold">09:15 - 10:45 AM</span>
                </div>
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-emerald-600 bg-emerald-400 flex items-center justify-center text-[8px] font-bold">S{i}</div>)}
                   <div className="w-6 h-6 rounded-full border-2 border-emerald-600 bg-white/30 flex items-center justify-center text-[8px] font-bold">+24</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl flex flex-col items-center space-y-8 border border-slate-100 relative">
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-black text-slate-900">{isPunchedIn ? 'On Duty' : 'Ready to Start'}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geo-Fence: School Perimeter</p>
            </div>

            <div className="relative">
              {isLate && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-bounce z-20">
                  Late Arrival
                </div>
              )}
              <div className={`absolute inset-0 rounded-full scale-110 opacity-20 ${isPunchedIn ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
              <button 
                onClick={handlePunch} 
                disabled={isLocating}
                className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all active:scale-90 shadow-2xl relative z-10 border-[10px] border-white ${isPunchedIn ? 'bg-rose-600' : 'bg-emerald-600'} ${isLocating ? 'opacity-50 grayscale' : ''}`}
              >
                {isPunchedIn ? <LogOut className="w-12 h-12 text-white mb-2" /> : <Fingerprint className="w-12 h-12 text-white mb-2" />}
                <span className="text-white font-black text-[10px] uppercase tracking-widest">{isPunchedIn ? 'Check Out' : 'Check In'}</span>
              </button>
            </div>

            <div className="flex flex-col items-center space-y-3 w-full">
               <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <MapPin className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                  {location || 'Detecting...'}
               </div>
               <div className="w-full h-px bg-slate-100"></div>
               <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center">
                 <Award className="w-4 h-4 mr-2" /> View Today's Performance
               </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="space-y-6 animate-slideUp">
          <div className="grid grid-cols-3 gap-3">
             {availableLeaveTypes.map((lt, i) => (
               <div key={i} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center transition-transform hover:scale-105">
                  {getLeaveIcon(lt.icon, lt.color)}
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest line-clamp-1">{lt.name}</p>
                  <p className="text-lg font-black text-slate-900">{leaveBalances[lt.name] ?? lt.defaultBalance}d</p>
               </div>
             ))}
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Apply for Absence</h3>
            <form onSubmit={handleLeaveSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Type</label>
                <select 
                  className="w-full border-2 border-slate-50 rounded-2xl p-4 bg-slate-50 text-sm font-bold appearance-none outline-none focus:border-emerald-500/20"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                   {availableLeaveTypes.map(lt => (
                     <option key={lt.id} value={lt.name}>{lt.name}</option>
                   ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 ml-1">
                <input 
                  type="checkbox" 
                  id="halfday" 
                  className="w-4 h-4 accent-emerald-600" 
                  checked={isHalfDay} 
                  onChange={(e) => setIsHalfDay(e.target.checked)} 
                />
                <label htmlFor="halfday" className="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">Request Half Day</label>
              </div>

              <div className={`grid ${isHalfDay ? 'grid-cols-1' : 'grid-cols-2'} gap-4 transition-all`}>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{isHalfDay ? 'Date' : 'Start Date'}</label>
                    <input 
                      type="date" 
                      required
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-bold focus:bg-white focus:border-emerald-500/20 outline-none" 
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                 </div>
                 {!isHalfDay && (
                   <div className="space-y-2 animate-fadeIn">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-bold focus:bg-white focus:border-emerald-500/20 outline-none" 
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        min={fromDate}
                      />
                   </div>
                 )}
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Reason</label>
                <textarea 
                  rows={3} 
                  required
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold resize-none focus:bg-white focus:border-emerald-500/20 outline-none" 
                  placeholder="Explain the purpose of absence to the Principal..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={isSubmittingLeave || availableLeaveTypes.length === 0}
                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmittingLeave ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Application...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'history' && <LeaveStatusList teacherId={teacherId} />}
    </div>
  );
};

export default TeacherDashboard;
