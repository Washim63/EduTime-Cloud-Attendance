
import React from 'react';
import { UserRole } from '../types.ts';
import { COLORS } from '../constants.tsx';
import { LogOut, Clock, User } from 'lucide-react';
import NotificationCenter from './NotificationCenter.tsx';

interface NavbarProps {
  user: { id: string; name: string; role: UserRole };
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Clock className="w-8 h-8 mr-2" stroke={COLORS.primary} strokeWidth={2.5} />
              <span className="font-bold text-xl tracking-tight text-gray-800">
                EDU<span style={{ color: COLORS.primary }}>TIME</span>
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <span className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                Cloud Portal
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700">{user.name}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{user.role}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            
            <NotificationCenter userId={user.id} userRole={user.role} />

            <button
              onClick={onLogout}
              className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
