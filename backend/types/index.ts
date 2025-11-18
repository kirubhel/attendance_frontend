export interface Student {
  _id?: string;
  fullname: string;
  phone: string;
  email: string;
  nationalId?: string | null;
  batchId: string;
  qrCode: string;
  isBlocked: boolean;
  absentCount: number;
  totalHours?: number; // Total hours attended across all sessions
  rank?: number; // Rank based on total hours
  createdAt?: Date;
}

export interface Attendance {
  _id?: string;
  studentId: string;
  date: string; // YYYY-MM-DD format
  status: 'IN' | 'OUT';
  checkInTime?: Date;
  checkOutTime?: Date;
  attendanceHours?: number; // Total hours attended for this session
  createdAt?: Date;
}

export interface DaySchedule {
  startTime: string; // HH:mm format (e.g., "09:00")
  endTime: string; // HH:mm format (e.g., "11:00")
  duration?: number; // Duration in minutes (calculated from start/end)
}

export interface CourseSchedule {
  // Map of weekday (0-6) to schedule for that day
  // Allows different times for different days
  days: Record<number, DaySchedule>; // e.g., { 1: { startTime: "09:00", endTime: "11:00" }, 3: { startTime: "14:00", endTime: "16:00" } }
  // Legacy support: if days is not provided, use these for all weekdays
  weekdays?: number[]; // Deprecated: use days keys instead
  startTime?: string; // Deprecated: use days values instead
  endTime?: string; // Deprecated: use days values instead
  duration?: number; // Deprecated: use days values instead
}

export interface Course {
  _id?: string;
  name: string;
  description?: string;
  schedule?: CourseSchedule; // Optional schedule, defaults to twice a week
  createdAt?: Date;
}

export interface Batch {
  _id?: string;
  name: string;
  courseId: string;
  createdAt?: Date;
}

export interface Warning {
  _id?: string;
  studentId: string;
  date: string;
  type: 'absent_warning' | 'block_notification';
  createdAt?: Date;
}

export interface User {
  _id?: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin';
  createdAt?: Date;
}

