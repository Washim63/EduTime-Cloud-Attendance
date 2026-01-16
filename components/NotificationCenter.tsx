
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { AppNotification } from '../types.ts';
import { COLORS } from '../constants.tsx';

interface NotificationCenterProps {
  userId: string;
  userRole: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, userRole }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    const all = JSON.parse(localStorage.getItem('edutime_notifications') || '[]');
    // Admins see notifications for "ADMIN", teachers see for their specific ID
    const targetId = userRole === 'ADMIN' ? 'ADMIN' : userId;
    const filtered = all.filter((n: AppNotification) => n.userId === targetId);
    filtered.sort((a: AppNotification, b: AppNotification) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setNotifications(filtered);
  };

  useEffect(() => {
    loadNotifications();
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'edutime_notifications') loadNotifications();
    };
    
    window.addEventListener('storage', handleStorage);
    // Poll for changes in the same window (since localStorage events don't fire in the same tab)
    const interval = setInterval(loadNotifications, 3000);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userId, userRole]);

  const markAllRead = () => {
    const all = JSON.parse(localStorage.getItem('edutime_notifications') || '[]');
    const targetId = userRole === 'ADMIN' ? 'ADMIN' : userId;
    const updated = all.map((n: AppNotification) => 
      n.userId === targetId ? { ...n, read: true } : n
    );
    localStorage.setItem('edutime_notifications', JSON.stringify(updated));
    loadNotifications();
  };

  const clearAll = () => {
    const all = JSON.parse(localStorage.getItem('edutime_notifications') || '[]');
    const targetId = userRole === 'ADMIN' ? 'ADMIN' : userId;
    const updated = all.filter((n: AppNotification) => n.userId !== targetId);
    localStorage.setItem('edutime_notifications', JSON.stringify(updated));
    loadNotifications();
  };

  const markRead = (id: string) => {
    const all = JSON.parse(localStorage.getItem('edutime_notifications') || '[]');
    const updated = all.map((n: AppNotification) => 
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('edutime_notifications', JSON.stringify(updated));
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string, isRead: boolean) => {
    const iconClass = `w-4 h-4 ${isRead ? 'grayscale opacity-50' : ''}`;
    switch (type) {
      case 'success': return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'warning': return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'error': return <XCircle className={`${iconClass} text-red-500`} />;
      default: return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-slideUp">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Notifications</h3>
            <div className="flex space-x-2">
              <button 
                onClick={markAllRead} 
                className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={clearAll} 
                className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => !n.read && markRead(n.id)}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-all cursor-pointer relative ${
                    !n.read ? 'bg-blue-50/20' : 'bg-white opacity-60'
                  }`}
                >
                  {!n.read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full animate-fadeIn"></div>
                  )}
                  <div className={`flex space-x-3 transition-opacity ${n.read ? 'grayscale-[0.5]' : ''}`}>
                    <div className="mt-0.5">{getTypeIcon(n.type, n.read)}</div>
                    <div className="flex-1">
                      <p className={`text-xs text-gray-900 transition-all ${!n.read ? 'font-black' : 'font-semibold text-gray-500'}`}>
                        {n.title}
                      </p>
                      <p className={`text-[11px] mt-0.5 leading-relaxed transition-all ${!n.read ? 'text-gray-700 font-medium' : 'text-gray-400 font-normal'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="mx-1">•</span>
                        {new Date(n.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex p-3 rounded-full bg-gray-50 mb-3 text-gray-300">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-400">All caught up!</p>
                <p className="text-[10px] text-gray-300 uppercase font-black mt-1">No new alerts</p>
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-50 text-center">
             <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
               View Full History
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
