import { NextRequest, NextResponse } from 'next/server';
import { StudentModel } from '@backend/models/Student';
import { AttendanceModel } from '@backend/models/Attendance';
import { BatchModel } from '@backend/models/Batch';
import { CourseModel } from '@backend/models/Course';
import { 
  getScheduledClassTime, 
  canCheckIn, 
  getCurrentTimeUTC3,
  getDaySchedule
} from '@backend/utils/schedule';
import { calculateTotalHours } from '@backend/utils/ranking';

export async function POST(request: NextRequest) {
  try {
    const { qrCodeData } = await request.json();

    if (!qrCodeData) {
      return NextResponse.json(
        { error: 'QR code data is required' },
        { status: 400 }
      );
    }

    // QR code contains student ID
    const student = await StudentModel.findById(qrCodeData);
    if (!student) {
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 404 }
      );
    }

    if (student.isBlocked) {
      return NextResponse.json(
        { error: 'Student is blocked from attendance' },
        { status: 403 }
      );
    }

    // Get batch and course to check schedule
    const batch = await BatchModel.findById(student.batchId);
    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    const course = await CourseModel.findById(batch.courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get current time in UTC+3 for date string generation
    const nowUTC3 = getCurrentTimeUTC3();
    
    // Use UTC+3 date for today's date string
    const todayStr = `${nowUTC3.getUTCFullYear()}-${String(nowUTC3.getUTCMonth() + 1).padStart(2, '0')}-${String(nowUTC3.getUTCDate()).padStart(2, '0')}`;
    let existingAttendance = await AttendanceModel.findByStudentAndDate(student._id!, todayStr);

    // Get current UTC time for comparisons
    const now = new Date();

    // Check schedule if course has one
    if (course.schedule) {
      // Pass current UTC time to get scheduled class times
      const classTime = getScheduledClassTime(now, course.schedule);
      
      if (!classTime) {
        return NextResponse.json(
          { error: 'No class scheduled for today' },
          { status: 400 }
        );
      }

      // Validate check-in time (30 minutes before class, or during class)
      // Use current UTC time for comparison (classTime is also in UTC)
      if (!existingAttendance) {
        const checkInValidation = canCheckIn(now, classTime.start, classTime.end);
        if (!checkInValidation.allowed) {
          return NextResponse.json(
            { error: checkInValidation.reason },
            { status: 400 }
          );
        }
      }
    }

    if (!existingAttendance) {
      // First scan of the day - mark IN and assign full course hours
      // Re-check for existing attendance right before creating to prevent race conditions
      // This handles cases where two requests arrive simultaneously
      const doubleCheckAttendance = await AttendanceModel.findByStudentAndDate(student._id!, todayStr);
      
      if (doubleCheckAttendance) {
        // Another request already created attendance, handle as existing attendance
        existingAttendance = doubleCheckAttendance;
      } else {
        // Calculate attendance hours from course schedule duration
        let attendanceHours = 0;
        if (course.schedule) {
          const classTime = getScheduledClassTime(now, course.schedule);
          if (classTime) {
            // Get the day schedule to get duration
            const utc3Offset = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
            const dateInUTC3 = new Date(now.getTime() + utc3Offset);
            const dayOfWeek = dateInUTC3.getUTCDay();
            const daySchedule = getDaySchedule(dayOfWeek, course.schedule);
            
            if (daySchedule && daySchedule.duration) {
              // Convert duration from minutes to hours
              attendanceHours = daySchedule.duration / 60;
            } else {
              // Fallback: calculate from start/end time if duration not available
              const startTime = new Date(classTime.start);
              const endTime = new Date(classTime.end);
              attendanceHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            }
          }
        }

        // Create attendance with hours immediately
        const attendance = await AttendanceModel.create({
          studentId: student._id!,
          date: todayStr,
          status: 'IN',
          checkInTime: now,
        });

        // Update attendance with hours
        if (attendanceHours > 0) {
          await AttendanceModel.updateAttendanceHours(attendance._id!, attendanceHours);
          attendance.attendanceHours = attendanceHours;
        }

        // Reset absent count if student was absent before
        if (student.absentCount > 0) {
          await StudentModel.resetAbsentCount(student._id!);
        }

        // Update student's total hours
        await calculateTotalHours();

        return NextResponse.json({
          success: true,
          student: {
            fullname: student.fullname,
            email: student.email,
          },
          attendance: {
            ...attendance,
            attendanceHours,
            message: `Checked in successfully. ${attendanceHours.toFixed(2)} hours recorded.`,
          },
        });
      }
    }
    
    // Handle existing attendance (either from initial check or race condition)
    if (existingAttendance) {
      // Already checked in today - no check-out needed
      return NextResponse.json({
        success: true,
        student: {
          fullname: student.fullname,
          email: student.email,
        },
        attendance: {
          ...existingAttendance,
          message: 'Already checked in for today. No need to check out.',
        },
      });
    }
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
