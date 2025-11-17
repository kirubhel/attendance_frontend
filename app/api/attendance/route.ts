import { NextRequest, NextResponse } from 'next/server';
import { AttendanceModel } from '../../../../backend/models/Attendance';
import { StudentModel } from '../../../../backend/models/Student';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const attendance = await AttendanceModel.findByDate(date);
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

    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = await AttendanceModel.findByStudentAndDate(studentId, today);

    const now = new Date();

    if (!existingAttendance) {
      // First scan of the day - mark IN
      const attendance = await AttendanceModel.create({
        studentId,
        date: today,
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
        // Mark OUT
        await AttendanceModel.updateStatus(existingAttendance._id!, 'OUT', now);
        return NextResponse.json({
          ...existingAttendance,
          status: 'OUT',
          checkOutTime: now,
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

