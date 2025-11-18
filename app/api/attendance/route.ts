import { NextRequest, NextResponse } from 'next/server';
import { AttendanceModel } from '@backend/models/Attendance';
import { StudentModel } from '@backend/models/Student';
import { BatchModel } from '@backend/models/Batch';
import { CourseModel } from '@backend/models/Course';
import { 
  getScheduledClassTime, 
  canCheckIn, 
  calculateAttendanceHours,
  isScheduledDay,
  getCurrentTimeUTC3
} from '@backend/utils/schedule';
import { calculateTotalHours } from '@backend/utils/ranking';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const courseId = searchParams.get('courseId');
    const batchId = searchParams.get('batchId');

    let attendance;
    if (batchId) {
      attendance = await AttendanceModel.findByDateAndBatch(date, batchId);
    } else if (courseId) {
      attendance = await AttendanceModel.findByDateAndCourse(date, courseId);
    } else {
      attendance = await AttendanceModel.findByDate(date);
    }
    
    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check if student exists and is not blocked
    const student = await StudentModel.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
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
    const existingAttendance = await AttendanceModel.findByStudentAndDate(studentId, todayStr);

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
      // First scan of the day - mark IN
      const attendance = await AttendanceModel.create({
        studentId,
        date: todayStr,
        status: 'IN',
        checkInTime: now,
      });

      // Reset absent count if student was absent before
      if (student.absentCount > 0) {
        await StudentModel.resetAbsentCount(studentId);
      }

      return NextResponse.json({
        ...attendance,
        message: 'Checked in successfully',
      });
    } else {
      // Already checked in today
      if (existingAttendance.status === 'IN') {
        // Mark OUT (optional check-out)
        const checkOutTime = now;
        
        // Calculate attendance hours if course has schedule
        let attendanceHours = 0;
        if (course.schedule && existingAttendance.checkInTime) {
          const classTime = getScheduledClassTime(now, course.schedule);
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
          ...existingAttendance,
          status: 'OUT',
          checkOutTime: checkOutTime,
          attendanceHours,
          message: 'Checked out successfully',
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
    console.error('Error processing attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
