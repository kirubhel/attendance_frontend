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
 * Get current time in UTC+3 for date string generation
 * This is used to get the correct date string (YYYY-MM-DD) in UTC+3
 */
export function getCurrentTimeUTC3(): Date {
  const now = new Date();
  const utc3Offset = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  return new Date(now.getTime() + utc3Offset);
}

/**
 * Get the scheduled class time for a given date (using UTC+3 timezone)
 * date parameter should be the current date to determine day of week
 * Returns UTC Date objects that represent the UTC+3 scheduled times
 */
export function getScheduledClassTime(date: Date, schedule: CourseSchedule): {
  start: Date;
  end: Date;
} | null {
  // Get day of week from current UTC time
  // We need to determine what day it is in UTC+3, so we add 3 hours first
  const utc3Offset = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const dateInUTC3 = new Date(date.getTime() + utc3Offset);
  const dayOfWeek = dateInUTC3.getUTCDay();
  
  const daySchedule = getDaySchedule(dayOfWeek, schedule);
  
  if (!daySchedule) {
    return null;
  }

  const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
  const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);

  // Get date components from UTC+3 date
  const year = dateInUTC3.getUTCFullYear();
  const month = dateInUTC3.getUTCMonth();
  const day = dateInUTC3.getUTCDate();

  // Create UTC dates representing UTC+3 times:
  // To represent "9:00 AM UTC+3", we create "6:00 AM UTC" (9 - 3 = 6)
  // This ensures correct comparison with current UTC time
  const start = new Date(Date.UTC(year, month, day, startHour - 3, startMin, 0, 0));
  const end = new Date(Date.UTC(year, month, day, endHour - 3, endMin, 0, 0));

  return { start, end };
}

/**
 * Check if check-in is allowed (up to 30 minutes before class, or during class)
 * currentTime should be the current UTC time (new Date())
 * classStartTime and classEndTime are UTC dates representing UTC+3 scheduled times
 */
export function canCheckIn(currentTime: Date, classStartTime: Date, classEndTime?: Date): {
  allowed: boolean;
  reason?: string;
} {
  // currentTime is already in UTC, classStartTime is also in UTC (representing UTC+3 time)
  // So we can compare them directly
  const thirtyMinutesBefore = new Date(classStartTime);
  thirtyMinutesBefore.setMinutes(thirtyMinutesBefore.getMinutes() - 30);

  // Check if too early (before 30 minutes before class)
  if (currentTime < thirtyMinutesBefore) {
    const minutesUntilOpen = Math.ceil((thirtyMinutesBefore.getTime() - currentTime.getTime()) / (1000 * 60));
    // Format time in UTC+3 for display (add 3 hours to show UTC+3 time)
    const utc3Offset = 3 * 60 * 60 * 1000;
    const displayTime = new Date(classStartTime.getTime() + utc3Offset);
    const hours = displayTime.getUTCHours();
    const minutes = displayTime.getUTCMinutes();
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return {
      allowed: false,
      reason: `Check-in opens 30 minutes before class (in ${minutesUntilOpen} minutes). Class starts at ${timeStr}`,
    };
  }

  // If class end time is provided, allow check-in until class ends
  if (classEndTime) {
    if (currentTime > classEndTime) {
      const utc3Offset = 3 * 60 * 60 * 1000;
      const displayTime = new Date(classEndTime.getTime() + utc3Offset);
      const hours = displayTime.getUTCHours();
      const minutes = displayTime.getUTCMinutes();
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      return {
        allowed: false,
        reason: `Check-in window has closed. Class ended at ${timeStr}`,
      };
    }
    // Allow check-in from 30 min before until class ends
    return { allowed: true };
  }

  // Fallback: Allow check-in up to 1 hour after class starts (late check-in)
  const oneHourAfter = new Date(classStartTime);
  oneHourAfter.setHours(oneHourAfter.getHours() + 1);

  if (currentTime > oneHourAfter) {
    const utc3Offset = 3 * 60 * 60 * 1000;
    const displayTime = new Date(classStartTime.getTime() + utc3Offset);
    const hours = displayTime.getUTCHours();
    const minutes = displayTime.getUTCMinutes();
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return {
      allowed: false,
      reason: `Check-in window has closed. Class started at ${timeStr} and check-in is only allowed up to 1 hour after class starts.`,
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


