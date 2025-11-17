import { NextRequest, NextResponse } from 'next/server';
import { StudentModel } from '../../../../../backend/models/Student';
import { AttendanceModel } from '../../../../../backend/models/Attendance';

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

    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = await AttendanceModel.findByStudentAndDate(student._id!, today);

    const now = new Date();

    if (!existingAttendance) {
      // First scan of the day - mark IN
      const attendance = await AttendanceModel.create({
        studentId: student._id!,
        date: today,
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
        // Mark OUT
        await AttendanceModel.updateStatus(existingAttendance._id!, 'OUT', now);
        return NextResponse.json({
          success: true,
          student: {
            fullname: student.fullname,
            email: student.email,
          },
          attendance: {
            ...existingAttendance,
            status: 'OUT',
            checkOutTime: now,
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

