
import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, RefreshCw, Zap, Trash2 } from 'lucide-react';

interface AttendanceTableProps {
  refreshKey?: number;
  onDelete?: (recordId: string) => void;
  isAdmin?: boolean;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ refreshKey = 0, onDelete, isAdmin = false }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [internalRefresh, setInternalRefresh] = useState(0);

  const records = useMemo(() => {
    const cloudLogs = JSON.parse(localStorage.getItem('edutime_attendance_logs') || '[]');
    
    // Group cloud logs by teacher and date for a clean consolidated view
    const grouped = cloudLogs.reduce((acc: any, log: any) => {
      const key = `${log.teacherId}_${log.date}`;
      if (!acc[key]) {
        acc[key] = { 
          id: log.teacherId,
          recordIds: [], // Keep track of individual log IDs for deletion
          name: log.name,
          dept: log.dept,
          date: log.date,
          in: '-', 
          out: '-',
          location: log.location || 'Staff Room',
          status: 'Normal',
          isNew: false 
        };
      }
      acc[key].recordIds.push(log.id);
      
      // Handle multiple punches: track earliest IN and latest OUT
      if (log.type === 'Punch In') {
        if (acc[key].in === '-' || log.time < acc[key].in) acc[key].in = log.time;
      }
      if (log.type === 'Punch Out') {
        if (acc[key].out === '-' || log.time > acc[key].out) acc[key].out = log.time;
      }

      // Inherit the location from the most recent punch
      acc[key].location = log.location || acc[key].location;
      
      // Update status if any punch was late
      if (log.status === 'Late') acc[key].status = 'Late';
      
      return acc;
    }, {});

    const dynamicData = Object.values(grouped);

    // Filter by date and sort (most recent first)
    return dynamicData
      .filter((r: any) => r.date === selectedDate)
      .sort((a: any, b: any) => {
        return b.in.localeCompare(a.in);
      });
  }, [selectedDate, refreshKey, internalRefresh]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-100 text-green-700 border-green-200';
      case 'Late': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Absent': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-7 border-b flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30">
        <div className="flex items-center space-x-3">
          <h3 className="font-black text-gray-800 flex items-center text-xs uppercase tracking-[0.2em]">
            <Clock className="w-5 h-5 mr-3 text-green-600" /> Daily Attendance Log
          </h3>
          <button onClick={() => setInternalRefresh(prev => prev + 1)} className="p-2 hover:bg-white rounded-xl text-gray-400 border border-transparent hover:border-gray-200 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Calendar className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
          <input 
            type="date" 
            className="pl-11 pr-5 py-2.5 border border-gray-200 rounded-2xl text-xs font-black bg-white outline-none focus:ring-4 focus:ring-green-500/10 transition-all" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
              <th className="px-8 py-5">Faculty Member</th>
              <th className="px-8 py-5">Entry (In)</th>
              <th className="px-8 py-5">Exit (Out)</th>
              <th className="px-8 py-5">Validation</th>
              <th className="px-8 py-5">Geo-Zone</th>
              {isAdmin && <th className="px-8 py-5 text-center">Manage</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.length > 0 ? records.map((row: any, i) => (
              <tr key={i} className={`hover:bg-slate-50 transition-colors group ${i === 0 && refreshKey > 0 ? 'bg-green-50/30' : ''}`}>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                       <span className="text-sm font-black text-gray-900 tracking-tight">{row.name}</span>
                       {i === 0 && refreshKey > 0 && <Zap className="w-3 h-3 ml-2 text-green-500 fill-green-500 animate-pulse" />}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{row.dept}</span>
                  </div>
                </td>
                <td className="px-8 py-6 font-black text-sm text-slate-700">{row.in}</td>
                <td className="px-8 py-6 font-black text-sm text-slate-700">{row.out}</td>
                <td className="px-8 py-6">
                  <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase border tracking-widest ${getStatusStyle(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-[10px] font-bold text-gray-400 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-blue-400" /> {row.location}
                </td>
                {isAdmin && (
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => onDelete && row.recordIds.forEach((id: string) => onDelete(id))}
                      className="p-2.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-8 py-20 text-center">
                   <div className="flex flex-col items-center">
                      <Calendar className="w-12 h-12 text-slate-100 mb-4" />
                      <p className="text-slate-300 italic text-sm font-medium tracking-widest">No institutional records found for this period</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
