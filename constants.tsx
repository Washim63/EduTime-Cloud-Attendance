
import { CustomLeaveType } from './types.ts';

export const COLORS = {
  primary: '#10b981', // Emerald School Green
  secondary: '#334155', // Slate Blue
  background: '#f8fafc',
  success: '#059669',
  warning: '#f59e0b',
  danger: '#e11d48',
  info: '#2563eb'
};

export const MOCK_TEACHERS = [
  { id: '3', name: 'Dr. Albert Smith', department: 'Science (Physics)', position: 'Senior Faculty', avatar: 'https://picsum.photos/seed/albert/200', email: 'albert@stmarys.edu' },
  { id: '22', name: 'Mrs. Keith Jones', department: 'Mathematics', position: 'Class Teacher (Grade 10)', avatar: 'https://picsum.photos/seed/keith/200', email: 'keith@stmarys.edu' },
  { id: '47', name: 'Mr. Mark Wilson', department: 'Administration', position: 'Principal', avatar: 'https://picsum.photos/seed/mark/200', email: 'principal@stmarys.edu' },
  { id: '52', name: 'Ms. Sarah Lee', department: 'Language (English)', position: 'Assistant Teacher', avatar: 'https://picsum.photos/seed/sarah/200', email: 'sarah@stmarys.edu' },
];

export const SCHOOL_HOURS = {
  start: '08:00',
  grace: '08:15',
  end: '15:00'
};

export const DEFAULT_LEAVE_TYPES: CustomLeaveType[] = [
  { id: 'lt-1', name: 'Annual Leave', defaultBalance: 22, icon: 'Sun', color: 'orange' },
  { id: 'lt-2', name: 'Medical Leave', defaultBalance: 12, icon: 'Stethoscope', color: 'blue' },
  { id: 'lt-3', name: 'Casual Leave', defaultBalance: 8, icon: 'Coffee', color: 'emerald' },
  { id: 'lt-4', name: 'Sabbatical', defaultBalance: 1, icon: 'Award', color: 'purple' },
  { id: 'lt-5', name: 'Professional Dev', defaultBalance: 5, icon: 'Palette', color: 'rose' },
  { id: 'lt-6', name: 'Duty Leave', defaultBalance: 10, icon: 'Briefcase', color: 'blue' },
];
