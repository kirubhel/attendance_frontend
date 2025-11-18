import { NextRequest, NextResponse } from 'next/server';
import { StudentModel } from '@backend/models/Student';
import { AttendanceModel } from '@backend/models/Attendance';
import { BatchModel } from '@backend/models/Batch';
import { CourseModel } from '@backend/models/Course';
import { 
  getScheduledClassTime, 
  canCheckIn, 
  calculateAttendanceHours 
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

    // Use local date (not UTC) for today's date string
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const existingAttendance = await AttendanceModel.findByStudentAndDate(student._id!, todayStr);

    // Use current local time for validation
    const now = new Date();

    // Check schedule if course has one
    if (course.schedule) {
      const classTime = getScheduledClassTime(today, course.schedule);
      
      if (!classTime) {
        return NextResponse.json(
          { error: 'No class scheduled for today' },
          { status: 400 }
        );
      }

      // Validate check-in time (30 minutes before class, or during class)
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
      // First scan of the day - mark IN
      const attendance = await AttendanceModel.create({
        studentId: student._id!,
        date: todayStr,
        status: 'IN',
        checkInTime: now,
      });

      // Reset absent count if student was absent before
      if (student.absentCount > 0) {
        await StudentModel.resetAbsentCount(student._id!);
      }

      return NextResponse.json({
        success: true,
        student: {
          fullname: student.fullname,
          email: student.email,
        },
        attendance: {
          ...attendance,
          message: 'Checked in successfully',
        },
      });
    } else {
      // Already checked in today
      if (existingAttendance.status === 'IN') {
        // Mark OUT (optional check-out)
        const checkOutTime = now;
        
        // Calculate attendance hours if course has schedule
        let attendanceHours = 0;
        if (course.schedule && existingAttendance.checkInTime) {
          const classTime = getScheduledClassTime(today, course.schedule);
          if (classTime) {
            attendanceHours = calculateAttendanceHours(
              new Date(existingAttendance.checkInTime),
              checkOutTime,
              classTime.end
            );
            
            // Update attendance with hours
            await AttendanceModel.updateAttendanceHours(existingAttendance._id!, attendanceHours);
          }
        }
        
        await AttendanceModel.updateStatus(existingAttendance._id!, 'OUT', checkOutTime);
        
        // Update student's total hours
        await calculateTotalHours();
        
        return NextResponse.json({
          success: true,
          student: {
            fullname: student.fullname,
            email: student.email,
          },
          attendance: {
            ...existingAttendance,
            status: 'OUT',
            checkOutTime: checkOutTime,
            attendanceHours,
            message: 'Checked out successfully',
          },
        });
      } else {
        // Already checked out - prevent duplicate
        return NextResponse.json(
          { error: 'Already checked out for today' },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
