
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export enum AdminSubRole {
  PRINCIPAL = 'Principal', // Super Admin - All access
  HR_MANAGER = 'HR Manager', // Personnel & Approvals
  COORDINATOR = 'Academic Coordinator', // Approvals & Analytics
  NONE = 'None'
}

export enum AttendanceStatus {
  NORMAL = 'Normal',
  LATE = 'Late',
  EARLY = 'Early',
  ABSENT = 'Absent',
  LEAVE = 'Leave'
}

export interface Teacher {
  id: string;
  name: string;
  department: string;
  position: string;
  avatar: string;
  email: string;
  mobile?: string;
  deviceId?: string;
  adminSubRole?: AdminSubRole;
  employeeCode?: string; // For Teachers
  officeId?: string; // For Admins
}

export interface AttendanceRecord {
  id: string;
  teacherId: string;
  date: string;
  punchIn: string;
  punchOut: string;
  status: AttendanceStatus;
  location?: string;
  photo?: string;
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  type: 'Annual' | 'Sick' | 'Casual' | 'Other' | string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
  isHalfDay: boolean;
  attachment?: string; // Base64 encoded file
  attachmentName?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // "ADMIN" or specific teacher ID
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface ProfileUpdateRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  changes: {
    field: 'name' | 'department' | 'position';
    oldValue: string;
    newValue: string;
  }[];
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
}

export interface GPSReport {
  id: string;
  teacherId: string;
  teacherName: string;
  location: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  photo?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface CustomLeaveType {
  id: string;
  name: string;
  defaultBalance: number;
  icon: string;
  color: string;
}
