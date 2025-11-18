import { NextResponse } from 'next/server';
import { StudentModel } from '@backend/models/Student';
import { AttendanceModel } from '@backend/models/Attendance';
import { BatchModel } from '@backend/models/Batch';
import { CourseModel } from '@backend/models/Course';
import { getDb } from '@backend/utils/db';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all students
    const allStudents = await StudentModel.findAll();
    const totalStudents = allStudents.length;
    const blockedStudents = allStudents.filter(s => s.isBlocked).length;
    const activeStudents = totalStudents - blockedStudents;

    // Get batches and courses
    const batches = await BatchModel.findAll();
    const courses = await CourseModel.findAll();

    // Get students by batch
    const studentsByBatch: Record<string, number> = {};
    for (const batch of batches) {
      const students = await StudentModel.findByBatchId(batch._id!);
      studentsByBatch[batch.name] = students.length;
    }

    // Get today's attendance
    const todayAttendance = await AttendanceModel.findByDate(today);
    const presentToday = todayAttendance.filter(a => a.status === 'IN').length;
    const absentToday = totalStudents - presentToday;

    // Get warnings (students with absentCount >= 2)
    const warningsCount = allStudents.filter(s => s.absentCount >= 2 && s.absentCount < 4).length;

    // Get attendance records with student details
    const attendanceWithStudents = await Promise.all(
      todayAttendance.map(async (attendance) => {
        const student = await StudentModel.findById(attendance.studentId);
        return {
          ...attendance,
          student: student ? {
            fullname: student.fullname,
            email: student.email,
            batchId: student.batchId,
          } : null,
        };
      })
    );

    return NextResponse.json({
      stats: {
        totalStudents,
        activeStudents,
        blockedStudents,
        presentToday,
        absentToday,
        warningsCount,
        totalBatches: batches.length,
        totalCourses: courses.length,
      },
      studentsByBatch,
      todayAttendance: attendanceWithStudents,
      students: allStudents.map(s => ({
        _id: s._id,
        fullname: s.fullname,
        email: s.email,
        phone: s.phone,
        batchId: s.batchId,
        isBlocked: s.isBlocked,
        absentCount: s.absentCount,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

