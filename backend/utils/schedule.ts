import { CourseSchedule, DaySchedule } from '../types';

/**
 * Get default schedule (twice a week - Monday and Wednesday)
 */
export function getDefaultSchedule(): CourseSchedule {
  return {
    days: {
      1: { startTime: '09:00', endTime: '11:00', duration: 120 }, // Monday
      3: { startTime: '09:00', endTime: '11:00', duration: 120 }, // Wednesday
    },
  };
}

/**
 * Get schedule for a specific day (handles both new and legacy formats)
 */
export function getDaySchedule(dayOfWeek: number, schedule: CourseSchedule): DaySchedule | null {
  // New format: use days map
  if (schedule.days && schedule.days[dayOfWeek]) {
    return schedule.days[dayOfWeek];
  }
  
  // Legacy format: use weekdays array and startTime/endTime
  if (schedule.weekdays && schedule.weekdays.includes(dayOfWeek)) {
    if (schedule.startTime && schedule.endTime) {
      return {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: schedule.duration || calculateDuration(schedule.startTime, schedule.endTime),
      };
    }
  }
  
  return null;
}

/**
 * Calculate duration in minutes from start and end time
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

/**
 * Check if a date falls on a scheduled weekday
 */
export function isScheduledDay(date: Date, schedule: CourseSchedule): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // New format: check days map
  if (schedule.days && schedule.days[dayOfWeek]) {
    return true;
  }
  
  // Legacy format: check weekdays array
  if (schedule.weekdays && schedule.weekdays.includes(dayOfWeek)) {
    return true;
  }
  
  return false;
}

/**
 * Get all scheduled weekdays
 */
export function getScheduledWeekdays(schedule: CourseSchedule): number[] {
  // New format: return keys from days map
  if (schedule.days) {
    return Object.keys(schedule.days).map(Number).sort();
  }
  
  // Legacy format: return weekdays array
  if (schedule.weekdays) {
    return schedule.weekdays;
  }
  
  return [];
}

/**
 * Get the scheduled class time for a given date
 */
export function getScheduledClassTime(date: Date, schedule: CourseSchedule): {
  start: Date;
  end: Date;
} | null {
  const dayOfWeek = date.getDay();
  const daySchedule = getDaySchedule(dayOfWeek, schedule);
  
  if (!daySchedule) {
    return null;
  }

  const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
  const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);

  const start = new Date(date);
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, endMin, 0, 0);

  return { start, end };
}

/**
 * Check if check-in is allowed (up to 30 minutes before class)
 */
export function canCheckIn(currentTime: Date, classStartTime: Date): {
  allowed: boolean;
  reason?: string;
} {
  const thirtyMinutesBefore = new Date(classStartTime);
  thirtyMinutesBefore.setMinutes(thirtyMinutesBefore.getMinutes() - 30);

  if (currentTime < thirtyMinutesBefore) {
    return {
      allowed: false,
      reason: `Check-in opens 30 minutes before class. Class starts at ${classStartTime.toLocaleTimeString()}`,
    };
  }

  // Allow check-in up to 1 hour after class starts (late check-in)
  const oneHourAfter = new Date(classStartTime);
  oneHourAfter.setHours(oneHourAfter.getHours() + 1);

  if (currentTime > oneHourAfter) {
    return {
      allowed: false,
      reason: 'Check-in window has closed. Class has already started more than 1 hour ago.',
    };
  }

  return { allowed: true };
}

/**
 * Calculate attendance hours from check-in and check-out times
 */
export function calculateAttendanceHours(
  checkInTime: Date,
  checkOutTime: Date | null,
  scheduledEndTime: Date
): number {
  if (!checkOutTime) {
    // If no check-out, use scheduled end time or current time (whichever is earlier)
    const endTime = new Date() < scheduledEndTime ? new Date() : scheduledEndTime;
    const diffMs = endTime.getTime() - checkInTime.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
  }

  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
}

/**
 * Get weekday name from number
 */
export function getWeekdayName(day: number): string {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[day] || 'Unknown';
}

