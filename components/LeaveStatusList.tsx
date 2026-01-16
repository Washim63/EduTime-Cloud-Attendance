
import React from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, XCircle, Info, Paperclip } from 'lucide-react';
import { COLORS } from '../constants.tsx';
import { LeaveRequest } from '../types.ts';

interface LeaveStatusListProps {
  teacherId: string;
}

const LeaveStatusList: React.FC<LeaveStatusListProps> = ({ teacherId }) => {
  const [leaves, setLeaves] = React.useState<LeaveRequest[]>([]);

  React.useEffect(() => {
    const fetchLeaves = () => {
      const allLeaves = JSON.parse(localStorage.getItem('edutime_leave_requests') || '[]');
      const myLeaves = allLeaves.filter((l: any) => l.teacherId === teacherId);
      // Sort by latest applied
      myLeaves.sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      setLeaves(myLeaves);
    };

    fetchLeaves();
    // Listen for storage changes in same window if needed, or just rely on parent refresh
    window.addEventListener('storage', fetchLeaves);
    return () => window.removeEventListener('storage', fetchLeaves);
  }, [teacherId]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Approved':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
      case 'Rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
      default:
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' };
    }
  };

  if (leaves.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm animate-fadeIn">
        <div className="inline-flex p-4 rounded-2xl bg-gray-50 mb-4">
          <Calendar className="w-8 h-8 text-gray-300" />
        </div>
        <h4 className="text-gray-900 font-bold mb-1">No Leave Records</h4>
        <p className="text-gray-400 text-xs">Your submitted applications will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slideUp">
      {leaves.map((leave) => {
        const config = getStatusConfig(leave.status);
        const Icon = config.icon;
        
        return (
          <div key={leave.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-gray-900">{leave.type}</h4>
                    {leave.isHalfDay && (
                      <span className="bg-blue-100 text-blue-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Half Day</span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {leave.isHalfDay ? leave.startDate : `${leave.startDate} — ${leave.endDate}`}
                  </p>
                </div>
              </div>
              <span className={`flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.bg} ${config.color} ${config.border}`}>
                <Icon className="w-3 h-3 mr-1.5" />
                {leave.status}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <div className="flex items-start space-x-2">
                <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
                  "{leave.reason || 'No reason provided'}"
                </p>
              </div>
              {leave.attachment && (
                <div className="mt-2 flex items-center space-x-1.5 text-[9px] font-bold text-blue-500 uppercase tracking-widest">
                  <Paperclip className="w-3 h-3" />
                  <span>Document: {leave.attachmentName || 'Attachment.pdf'}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
              <div className="flex items-center uppercase tracking-widest">
                <Clock className="w-3 h-3 mr-1" />
                Applied {new Date(leave.appliedAt).toLocaleDateString()}
              </div>
              <div className="text-gray-300 font-mono">ID: {leave.id.toUpperCase()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaveStatusList;
