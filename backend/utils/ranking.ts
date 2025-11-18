import { StudentModel } from '../models/Student';
import { AttendanceModel } from '../models/Attendance';
import { Student } from '../types';

/**
 * Calculate and update total hours for all students
 */
export async function calculateTotalHours(): Promise<void> {
  const students = await StudentModel.findAll();
  
  for (const student of students) {
    const attendances = await AttendanceModel.findByStudentId(student._id!);
    
    let totalHours = 0;
    for (const attendance of attendances) {
      if (attendance.attendanceHours) {
        totalHours += attendance.attendanceHours;
      }
    }
    
    await StudentModel.update(student._id!, { totalHours });
  }
}

/**
 * Rank students based on total hours attended
 */
export async function rankStudents(): Promise<Student[]> {
  // First, calculate total hours for all students
  await calculateTotalHours();
  
  const students = await StudentModel.findAll();
  
  // Sort by total hours (descending)
  const ranked = students
    .filter(s => s.totalHours !== undefined)
    .sort((a, b) => (b.totalHours || 0) - (a.totalHours || 0))
    .map((student, index) => ({
      ...student,
      rank: index + 1,
    }));
  
  // Update ranks in database
  for (const student of ranked) {
    await StudentModel.update(student._id!, { rank: student.rank });
  }
  
  return ranked;
}

