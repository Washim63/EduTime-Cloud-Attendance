
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_TEACHERS, COLORS, SCHOOL_HOURS, DEFAULT_LEAVE_TYPES } from '../constants.tsx';
import AttendanceTable from './AttendanceTable.tsx';
import { 
  Users, Clock, TrendingUp, Search, Edit3, X, 
  Eye, Activity, RefreshCw, Smartphone, 
  CheckCircle, XCircle, ShieldCheck, Lock, 
  Fingerprint, Landmark, Calendar, ArrowRight,
  Zap, Plus, Save, GraduationCap, BarChart3, Users2,
  BrainCircuit, Sparkles, TrendingDown, Info, FileDown, Table,
  AlertTriangle, Trash2, Sun, Stethoscope, Coffee, Briefcase, Settings as SettingsIcon,
  Palette, Trash, Award, MapPin
} from 'lucide-react';
import { AppNotification, ProfileUpdateRequest, LeaveRequest, AdminSubRole, CustomLeaveType } from '../types.ts';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie
} from 'recharts';

interface AdminDashboardProps {
  adminSubRole: AdminSubRole;
}

interface ConfirmDialogState {
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'success' | 'danger' | 'info';
  confirmText: string;
  icon?: React.ReactNode;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminSubRole }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'personnel' | 'approvals' | 'settings'>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastLiveMessage, setLastLiveMessage] = useState<string | null>(null);
  
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Manual Log Form State
  const [manualLog, setManualLog] = useState({
    teacherId: '',
    type: 'Punch In',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    reason: 'Staff request'
  });

  // Leave Type Management State
  const [leaveTypes, setLeaveTypes] = useState<CustomLeaveType[]>([]);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState<Partial<CustomLeaveType>>({
    name: '',
    defaultBalance: 10,
    icon: 'Sun',
    color: 'emerald'
  });

  // Export State
  const [exportRange, setExportRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Load custom leave types
    const saved = localStorage.getItem('edutime_leave_types');
    if (saved) {
      setLeaveTypes(JSON.parse(saved));
    } else {
      localStorage.setItem('edutime_leave_types', JSON.stringify(DEFAULT_LEAVE_TYPES));
      setLeaveTypes(DEFAULT_LEAVE_TYPES);
    }

    const channel = new BroadcastChannel('edutime_live_stream');
    setIsLive(true);
    channel.onmessage = (e) => {
      setLastLiveMessage(`Alert: ${e.data.name} ${e.data.action}`);
      setRefreshTrigger(p => p + 1);
      setTimeout(() => setLastLiveMessage(null), 4000);
    };
    return () => channel.close();
  }, []);

  const allTeachers = useMemo(() => {
    const cloudUsers = JSON.parse(localStorage.getItem('edutime_cloud_users') || '[]');
    const cloudEmails = new Set(cloudUsers.map((u: any) => u.email.toLowerCase()));
    const uniqueMocks = MOCK_TEACHERS.filter(m => !cloudEmails.has(m.email.toLowerCase()));
    return [...uniqueMocks, ...cloudUsers];
  }, [refreshTrigger]);

  const attendanceLogs = useMemo(() => JSON.parse(localStorage.getItem('edutime_attendance_logs') || '[]'), [refreshTrigger]);
  const leaveRequests = useMemo(() => JSON.parse(localStorage.getItem('edutime_leave_requests') || '[]'), [refreshTrigger]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = attendanceLogs.filter((l: any) => l.date === today && l.type === 'Punch In');
    const presentIds = new Set(todayLogs.map((l: any) => l.teacherId));
    
    return {
      present: presentIds.size,
      late: todayLogs.filter((l: any) => l.status === 'Late').length,
      onLeave: leaveRequests.filter((l: any) => l.status === 'Approved' && today >= l.startDate && today <= l.endDate).length,
      total: allTeachers.length
    };
  }, [attendanceLogs, allTeachers, leaveRequests]);

  const triggerConfirm = (config: ConfirmDialogState) => {
    setConfirmDialog(config);
  };

  const handleManualEntry = () => {
    if (!manualLog.teacherId) return alert("Select a faculty member.");
    
    const target = allTeachers.find(t => t.id === manualLog.teacherId);
    if (!target) return;

    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      teacherId: target.id,
      name: target.name,
      dept: target.department,
      time: manualLog.time,
      date: manualLog.date,
      type: manualLog.type,
      location: 'Administrative Override',
      status: manualLog.time > SCHOOL_HOURS.grace ? 'Late' : 'Normal'
    };

    const allLogs = JSON.parse(localStorage.getItem('edutime_attendance_logs') || '[]');
    localStorage.setItem('edutime_attendance_logs', JSON.stringify([newLog, ...allLogs]));
    
    setRefreshTrigger(p => p + 1);
    setShowManualEntry(false);
    createNotification('ADMIN', 'Manual Entry Recorded', `${target.name} entry updated by Admin.`, 'info');
  };

  const handleAddLeaveType = () => {
    if (!newLeaveType.name) return;
    
    const id = 'lt-' + Math.random().toString(36).substr(2, 5);
    const updated = [...leaveTypes, { ...newLeaveType, id } as CustomLeaveType];
    localStorage.setItem('edutime_leave_types', JSON.stringify(updated));
    setLeaveTypes(updated);
    setShowAddLeaveModal(false);
    setNewLeaveType({ name: '', defaultBalance: 10, icon: 'Sun', color: 'emerald' });
    
    createNotification('ADMIN', 'Configuration Updated', `New leave type "${newLeaveType.name}" added to the system.`, 'info');
  };

  const deleteLeaveType = (id: string, name: string) => {
    triggerConfirm({
      title: 'Remove Leave Type',
      message: `Are you sure you want to delete "${name}"? This will hide it from new applications but existing records will remain.`,
      type: 'danger',
      confirmText: 'Delete Category',
      icon: <Trash className="w-8 h-8 text-rose-600" />,
      onConfirm: () => {
        const updated = leaveTypes.filter(lt => lt.id !== id);
        localStorage.setItem('edutime_leave_types', JSON.stringify(updated));
        setLeaveTypes(updated);
        setConfirmDialog(null);
      }
    });
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

  const handleExportCSV = () => {
    triggerConfirm({
      title: 'Export Records',
      message: `Authorize CSV export for attendance records between ${exportRange.start} and ${exportRange.end}?`,
      type: 'info',
      confirmText: 'Export Now',
      icon: <FileDown className="w-8 h-8 text-blue-600" />,
      onConfirm: () => {
        const filteredLogs = attendanceLogs.filter((log: any) => 
          log.date >= exportRange.start && log.date <= exportRange.end
        );

        if (filteredLogs.length === 0) {
          alert("No attendance records found for the selected range.");
          return;
        }

        const headers = ["Date", "Name", "Department", "Time", "Type", "Status", "Location"];
        const csvRows = [headers.join(",")];

        filteredLogs.forEach((log: any) => {
          const row = [log.date, `"${log.name}"`, `"${log.dept}"`, log.time, log.type, log.status, `"${log.location}"` ];
          csvRows.push(row.join(","));
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `school_attendance_${exportRange.start}_to_${exportRange.end}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setConfirmDialog(null);
      }
    });
  };

  const handleLeaveApproval = (requestId: string, approve: boolean) => {
    const allLeaves = JSON.parse(localStorage.getItem('edutime_leave_requests') || '[]');
    const req = allLeaves.find((l: LeaveRequest) => l.id === requestId);
    if (!req) return;

    triggerConfirm({
      title: approve ? 'Approve Leave' : 'Reject Leave',
      message: `Are you sure you want to ${approve ? 'APPROVE' : 'REJECT'} the ${req.type} request for ${req.teacherName}?`,
      type: approve ? 'success' : 'danger',
      confirmText: approve ? 'Confirm Approval' : 'Confirm Rejection',
      icon: approve ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />,
      onConfirm: () => {
        const index = allLeaves.findIndex((l: LeaveRequest) => l.id === requestId);
        allLeaves[index].status = approve ? 'Approved' : 'Rejected';
        localStorage.setItem('edutime_leave_requests', JSON.stringify(allLeaves));
        setRefreshTrigger(p => p + 1);
        setConfirmDialog(null);
      }
    });
  };

  const resetStaffDevice = (teacherId: string, name: string) => {
    triggerConfirm({
      title: 'Security Reset',
      message: `Clear hardware binding for ${name}? This action cannot be undone and will force the user to re-verify their device on next login.`,
      type: 'danger',
      confirmText: 'Reset Hardware ID',
      icon: <Smartphone className="w-8 h-8 text-red-600" />,
      onConfirm: () => {
        const cloudUsers = JSON.parse(localStorage.getItem('edutime_cloud_users') || '[]');
        const updated = cloudUsers.map((u: any) => String(u.id) === String(teacherId) ? { ...u, deviceId: undefined } : u);
        localStorage.setItem('edutime_cloud_users', JSON.stringify(updated));
        alert("Security binding cleared.");
        setRefreshTrigger(p => p + 1);
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteRecord = (recordId: string) => {
    triggerConfirm({
      title: 'Delete Record',
      message: 'Are you sure you want to permanently delete this attendance log entry? This action is audited.',
      type: 'danger',
      confirmText: 'Delete Permanently',
      icon: <Trash2 className="w-8 h-8 text-red-600" />,
      onConfirm: () => {
        const allLogs = JSON.parse(localStorage.getItem('edutime_attendance_logs') || '[]');
        const updated = allLogs.filter((l: any) => l.id !== recordId);
        localStorage.setItem('edutime_attendance_logs', JSON.stringify(updated));
        setRefreshTrigger(p => p + 1);
        setConfirmDialog(null);
      }
    });
  };

  const updateTeacherProfile = () => {
    if (!selectedTeacher || !selectedTeacher.name) return alert("Name is required.");
    triggerConfirm({
      title: 'Update Record',
      message: `Authorize administrative changes to the profile of ${selectedTeacher.name}?`,
      type: 'success',
      confirmText: 'Save Changes',
      icon: <Save className="w-8 h-8 text-emerald-600" />,
      onConfirm: () => {
        const cloudUsers = JSON.parse(localStorage.getItem('edutime_cloud_users') || '[]');
        const userIndex = cloudUsers.findIndex((u: any) => String(u.id) === String(selectedTeacher.id));
        let updatedUsers = [...cloudUsers];
        if (userIndex > -1) updatedUsers[userIndex] = { ...selectedTeacher };
        else updatedUsers.push({ ...selectedTeacher });
        localStorage.setItem('edutime_cloud_users', JSON.stringify(updatedUsers));
        setIsEditing(false);
        setRefreshTrigger(p => p + 1);
        setConfirmDialog(null);
      }
    });
  };

  // Analytics Data Preparation
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayLogs = attendanceLogs.filter((l: any) => l.date === date && l.type === 'Punch In');
      return {
        name: new Date(date).toLocaleDateString([], { weekday: 'short' }),
        Present: new Set(dayLogs.map((l: any) => l.teacherId)).size,
        Late: dayLogs.filter((l: any) => l.status === 'Late').length,
      };
    });
  }, [attendanceLogs]);

  const absenceReasonData = useMemo(() => {
    const reasons = leaveRequests.reduce((acc: any, curr: any) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(reasons).map(key => ({ name: key, value: reasons[key] }));
  }, [leaveRequests]);

  const filteredTeachers = allTeachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const aiInsights = useMemo(() => {
    if (stats.late > 2) return "Punctuality is down 15% today. Recommend staff meeting regarding the new morning traffic routes.";
    if (stats.present / stats.total > 0.9) return "Exceptional attendance trend detected this week. Faculty engagement is at a seasonal high.";
    return "Attendance patterns are stable. System monitoring active.";
  }, [stats]);

  const teacherLeaveBalances = useMemo(() => {
    if (!selectedTeacher) return null;
    const saved = localStorage.getItem(`edutime_balances_${selectedTeacher.id}`);
    if (saved) return JSON.parse(saved);
    
    // Auto-provision balances if first view
    const initial = leaveTypes.reduce((acc: any, lt) => {
      acc[lt.name] = lt.defaultBalance;
      return acc;
    }, {});
    localStorage.setItem(`edutime_balances_${selectedTeacher.id}`, JSON.stringify(initial));
    return initial;
  }, [selectedTeacher, leaveTypes]);

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
    return <div className={`p-2 rounded-xl ${colorMap[color] || colorMap.emerald}`}><IconComponent className="w-4 h-4" /></div>;
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* CONFIRMATION OVERLAY */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl animate-slideUp border border-slate-100 max-w-sm w-full">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${
              confirmDialog.type === 'success' ? 'bg-emerald-50' : 
              confirmDialog.type === 'danger' ? 'bg-rose-50' : 'bg-blue-50'
            }`}>
              {confirmDialog.icon || <AlertTriangle className="w-8 h-8 text-amber-500" />}
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{confirmDialog.title}</h2>
            <p className="text-slate-500 font-medium mt-3 text-sm leading-relaxed">{confirmDialog.message}</p>
            <div className="mt-10 flex flex-col w-full gap-3">
              <button 
                onClick={confirmDialog.onConfirm}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 ${
                  confirmDialog.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                  confirmDialog.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
              <button 
                onClick={() => setConfirmDialog(null)}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel Action
              </button>
            </div>
          </div>
        </div>
      )}

      {lastLiveMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] animate-slideUp">
           <div className="bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl border border-slate-700 flex items-center space-x-4">
              <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest">{lastLiveMessage}</p>
           </div>
        </div>
      )}

      {/* MANUAL LOG MODAL */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[600] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative animate-slideUp shadow-2xl border border-white">
             <button onClick={() => setShowManualEntry(false)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Admin Manual Override</h3>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Faculty Member</label>
                   <select 
                     className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none font-bold text-sm"
                     value={manualLog.teacherId}
                     onChange={(e) => setManualLog({...manualLog, teacherId: e.target.value})}
                   >
                      <option value="">Choose teacher...</option>
                      {allTeachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.department})</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Punch Type</label>
                    <select 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none font-bold text-sm"
                      value={manualLog.type}
                      onChange={(e) => setManualLog({...manualLog, type: e.target.value})}
                    >
                       <option>Punch In</option>
                       <option>Punch Out</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                    <input 
                      type="time" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none font-bold text-sm"
                      value={manualLog.time}
                      onChange={(e) => setManualLog({...manualLog, time: e.target.value})}
                    />
                  </div>
                </div>
                <button onClick={handleManualEntry} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all">Submit Institutional Log</button>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center space-x-5">
           <div className="p-4 bg-white rounded-[2rem] shadow-xl border border-slate-100">
             <GraduationCap className="w-10 h-10 text-emerald-600" />
           </div>
           <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Institutional <span className="text-emerald-600">Hub</span></h1>
              <div className="flex items-center space-x-2 mt-1">
                 <span className="text-[10px] font-black text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest">{adminSubRole}</span>
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Morning Shift Active</span>
              </div>
           </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowManualEntry(true)} className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-slate-800 transition-all"><Plus className="w-4 h-4 mr-2" /> Manual Log</button>
          <button onClick={() => setRefreshTrigger(p => p + 1)} className="bg-white border border-slate-200 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center shadow-sm hover:bg-slate-50 transition-all"><RefreshCw className="w-4 h-4 mr-2" /> Sync</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present Today', value: stats.present, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Late Arrivals', value: stats.late, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Faculty on Leave', value: stats.onLeave, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Attendance Rate', value: `${Math.round((stats.present / stats.total) * 100 || 0)}%`, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center group transition-all hover:shadow-xl">
            <div className={`p-4 rounded-3xl mr-5 ${stat.bg} ${stat.color}`}><stat.icon className="w-7 h-7" /></div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <nav className="border-b border-slate-200 flex space-x-10">
        {(['analytics', 'personnel', 'approvals', 'settings'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`pb-5 px-1 border-b-4 font-black text-xs tracking-widest uppercase transition-all ${
              activeTab === tab ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-400'
            }`}
          >
            {tab === 'settings' ? <span className="flex items-center"><SettingsIcon className="w-3.5 h-3.5 mr-2" /> settings</span> : tab}
          </button>
        ))}
      </nav>

      <div className="min-h-[500px]">
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-[3rem] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-10">
                  <BrainCircuit className="w-40 h-40" />
               </div>
               <div className="flex items-center space-x-6 relative z-10">
                  <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl">
                     <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-80 mb-1">AI Smart Insights</h3>
                    <p className="text-xl font-bold max-w-2xl leading-tight">"{aiInsights}"</p>
                  </div>
               </div>
               <button className="bg-white text-emerald-900 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg relative z-10">Generate Full Report</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Attendance Volume</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">7-Day Rolling Analysis</p>
                   </div>
                   <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                      <Area type="monotone" dataKey="Late" stroke="#f59e0b" strokeWidth={3} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Absence Archetypes</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Categorical Distribution</p>
                   </div>
                   <Activity className="w-6 h-6 text-blue-500" />
                </div>
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={absenceReasonData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                           {absenceReasonData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][index % 4]} />
                           ))}
                        </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="flex items-center space-x-4">
                      <div className="p-3 bg-slate-900 rounded-2xl text-white">
                         <FileDown className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Institutional Archive Export</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Download CSV Records for Audits</p>
                      </div>
                   </div>
                   <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                      <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                         <span className="text-[9px] font-black text-slate-400 uppercase">From</span>
                         <input 
                            type="date" 
                            className="bg-transparent text-[10px] font-black outline-none" 
                            value={exportRange.start}
                            onChange={(e) => setExportRange({...exportRange, start: e.target.value})}
                         />
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                         <span className="text-[9px] font-black text-slate-400 uppercase">To</span>
                         <input 
                            type="date" 
                            className="bg-transparent text-[10px] font-black outline-none" 
                            value={exportRange.end}
                            onChange={(e) => setExportRange({...exportRange, end: e.target.value})}
                         />
                      </div>
                      <button 
                        onClick={handleExportCSV}
                        className="bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center"
                      >
                         <FileDown className="w-4 h-4 mr-2" /> Export CSV
                      </button>
                   </div>
                </div>
            </div>

            <AttendanceTable refreshKey={refreshTrigger} onDelete={handleDeleteRecord} isAdmin={true} />
          </div>
        )}

        {activeTab === 'personnel' && (
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="p-8 border-b flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50/30">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Staff Directory</h3>
              <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-5 top-4 w-5 h-5 text-slate-300" />
                <input type="text" placeholder="Search Teachers, IDs or Departments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <th className="px-8 py-5">Faculty Member</th>
                    <th className="px-8 py-5">Security Bind</th>
                    <th className="px-8 py-5">Access Tier</th>
                    <th className="px-8 py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/50 group">
                      <td className="px-8 py-6">
                         <div className="flex items-center space-x-4">
                            <img src={teacher.avatar} className="w-12 h-12 rounded-2xl shadow-lg border-2 border-white" />
                            <div>
                               <p className="text-sm font-black text-slate-900">{teacher.name}</p>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{teacher.department}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                           {teacher.deviceId ? (
                             <span className="flex items-center text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase w-fit tracking-tighter">
                               <Smartphone className="w-3 h-3 mr-1.5" /> Bound
                             </span>
                           ) : (
                             <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase w-fit tracking-tighter">Unbound</span>
                           )}
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">{teacher.adminSubRole || 'TEACHER'}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => setSelectedTeacher(teacher)} className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm border border-slate-100 hover:bg-emerald-600 hover:text-white transition-all"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedTeacher(teacher); setIsEditing(true); }} className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                          {adminSubRole === AdminSubRole.PRINCIPAL && (
                             <button onClick={() => resetStaffDevice(teacher.id, teacher.name)} className="p-3 bg-white text-red-600 rounded-xl shadow-sm border border-slate-100 hover:bg-red-600 hover:text-white transition-all"><Smartphone className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <Users2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No staff records matching query</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-fit">
              <div className="p-8 bg-emerald-50/30 border-b border-emerald-100 flex justify-between items-center">
                <div className="flex items-center space-x-3 text-emerald-800">
                  <Calendar className="w-5 h-5" />
                  <span className="font-black uppercase text-xs tracking-widest">Absence Queue</span>
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-[500px] divide-y divide-slate-50">
                {leaveRequests.length > 0 ? leaveRequests.map((req) => (
                  <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors rounded-3xl mb-2">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black uppercase">{req.teacherName.charAt(0)}</div>
                          <div>
                            <p className="text-xs font-black text-slate-900">{req.teacherName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{req.type}</p>
                          </div>
                       </div>
                       <div className="flex space-x-2">
                          <button onClick={() => handleLeaveApproval(req.id, true)} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => handleLeaveApproval(req.id, false)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><XCircle className="w-4 h-4" /></button>
                       </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-slate-300">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">All processed</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fadeIn">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Institutional Policies</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure leave categories and annual staff entitlements</p>
                   </div>
                   <button 
                     onClick={() => setShowAddLeaveModal(true)}
                     className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl flex items-center"
                   >
                     <Plus className="w-4 h-4 mr-2" /> Define New Leave Type
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {leaveTypes.map((lt) => (
                     <div key={lt.id} className="bg-slate-50 p-7 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                           {getLeaveIcon(lt.icon, lt.color)}
                           <button 
                             onClick={() => deleteLeaveType(lt.id, lt.name)}
                             className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <Trash className="w-4 h-4" />
                           </button>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{lt.name}</h4>
                        <div className="mt-4 flex items-center justify-between">
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Default Entitlement</p>
                              <p className="text-xl font-black text-slate-900">{lt.defaultBalance} Days / Year</p>
                           </div>
                           <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                             <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>

      {showAddLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 relative animate-slideUp border border-white">
             <button onClick={() => setShowAddLeaveModal(false)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-600"><X className="w-6 h-6" /></button>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">New Leave Category</h3>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type Name</label>
                   <input 
                     type="text" 
                     className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none font-bold text-sm" 
                     placeholder="e.g. Sabbatical Leave"
                     value={newLeaveType.name}
                     onChange={(e) => setNewLeaveType({...newLeaveType, name: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Days</label>
                      <input 
                        type="number" 
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none font-bold text-sm" 
                        value={newLeaveType.defaultBalance}
                        onChange={(e) => setNewLeaveType({...newLeaveType, defaultBalance: parseInt(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Theme Color</label>
                      <select 
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none font-bold text-xs"
                        value={newLeaveType.color}
                        onChange={(e) => setNewLeaveType({...newLeaveType, color: e.target.value})}
                      >
                         <option value="emerald">Emerald Green</option>
                         <option value="blue">Slate Blue</option>
                         <option value="orange">Autumn Orange</option>
                         <option value="purple">Royal Purple</option>
                         <option value="rose">Soft Rose</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Icon</label>
                   <div className="grid grid-cols-6 gap-2">
                      {['Sun', 'Stethoscope', 'Coffee', 'Briefcase', 'Award', 'Palette'].map(iconName => (
                         <button 
                           key={iconName}
                           onClick={() => setNewLeaveType({...newLeaveType, icon: iconName})}
                           className={`p-3 rounded-xl border-2 transition-all ${newLeaveType.icon === iconName ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                         >
                            {iconName === 'Sun' && <Sun className="w-5 h-5 mx-auto" />}
                            {iconName === 'Stethoscope' && <Stethoscope className="w-5 h-5 mx-auto" />}
                            {iconName === 'Coffee' && <Coffee className="w-5 h-5 mx-auto" />}
                            {iconName === 'Briefcase' && <Briefcase className="w-5 h-5 mx-auto" />}
                            {iconName === 'Award' && <Award className="w-5 h-5 mx-auto" />}
                            {iconName === 'Palette' && <Palette className="w-5 h-5 mx-auto" />}
                         </button>
                      ))}
                   </div>
                </div>

                <button 
                  onClick={handleAddLeaveType}
                  className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all mt-4"
                >
                   Publish Configuration
                </button>
             </div>
          </div>
        </div>
      )}

      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 relative animate-slideUp shadow-2xl border border-white">
            <button onClick={() => { setSelectedTeacher(null); setIsEditing(false); }} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X className="w-6 h-6" /></button>
            <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-slate-50">
               <img src={selectedTeacher.avatar} className="w-24 h-24 rounded-[2.5rem] shadow-2xl border-4 border-white" />
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedTeacher.name}</h2>
                  <p className="text-emerald-600 font-black uppercase text-[10px] tracking-widest bg-emerald-50 px-3 py-1 rounded-full mt-2 w-fit">{selectedTeacher.department}</p>
               </div>
            </div>
            
            {!isEditing && teacherLeaveBalances && (
              <div className="mb-10 animate-fadeIn">
                <div className="flex items-center space-x-3 mb-6">
                   <div className="p-2.5 bg-slate-900 text-white rounded-xl"><Briefcase className="w-4 h-4" /></div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Leave Entitlements</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   {Object.entries(teacherLeaveBalances).map(([name, value], i) => {
                     const lt = leaveTypes.find(t => t.name === name) || DEFAULT_LEAVE_TYPES.find(d => d.name === name) || DEFAULT_LEAVE_TYPES[0];
                     return (
                       <div key={i} className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center text-center border border-slate-100">
                          {getLeaveIcon(lt.icon, lt.color)}
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-2 line-clamp-1">{name}</p>
                          <p className="text-lg font-black text-slate-900">{value as number}d</p>
                       </div>
                     );
                   })}
                </div>
              </div>
            )}
            
            {isEditing ? (
              <div className="space-y-6">
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm focus:bg-white focus:border-green-500/20 outline-none"
                  value={selectedTeacher.name}
                  onChange={(e) => setSelectedTeacher({...selectedTeacher, name: e.target.value})}
                  placeholder="Full Name"
                />
                <button onClick={updateTeacherProfile} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" /> <span>Commit Profile Changes</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee Code</p>
                    <p className="text-sm font-black text-slate-900 mt-1">{selectedTeacher.employeeCode || selectedTeacher.officeId || 'N/A'}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Position</p>
                    <p className="text-sm font-black text-slate-900 mt-1">{selectedTeacher.position || 'Teacher'}</p>
                  </div>
                </div>
                <button className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all">Download Attendance Transcript</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
