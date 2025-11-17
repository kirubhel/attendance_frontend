import { NextResponse } from 'next/server';
import { StudentModel } from '../../../../backend/models/Student';
import { AttendanceModel } from '../../../../backend/models/Attendance';
import { sendWarningEmail, sendBlockEmail } from '../../../../backend/utils/email';
import { getDb } from '../../../../backend/utils/db';

// This endpoint should be called by Vercel Cron or external cron service
export async function GET(request: Request) {
  try {
    // Verify cron secret if needed
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const allStudents = await StudentModel.findAll();
    const todayAttendance = await AttendanceModel.findByDate(today);

    const presentStudentIds = new Set(todayAttendance.map(a => a.studentId));

    const results = {
      checked: 0,
      warningsSent: 0,
      blocksApplied: 0,
    };

    for (const student of allStudents) {
      if (student.isBlocked) continue; // Skip already blocked students

      const wasPresent = presentStudentIds.has(student._id!);

      if (!wasPresent) {
        // Student is absent today
        await StudentModel.incrementAbsentCount(student._id!);
        const updatedStudent = await StudentModel.findById(student._id!);

        if (updatedStudent) {
          if (updatedStudent.absentCount === 2) {
            // Send warning email
            try {
              await sendWarningEmail(
                updatedStudent.email,
                updatedStudent.fullname,
                updatedStudent.absentCount
              );
              results.warningsSent++;
            } catch (error) {
              console.error(`Error sending warning to ${updatedStudent.email}:`, error);
            }
          } else if (updatedStudent.absentCount >= 4) {
            // Block student
            await StudentModel.block(student._id!);
            try {
              await sendBlockEmail(
                updatedStudent.email,
                updatedStudent.fullname
              );
              results.blocksApplied++;
            } catch (error) {
              console.error(`Error sending block email to ${updatedStudent.email}:`, error);
            }
          }
        }
      } else {
        // Student was present - reset absent count
        if (student.absentCount > 0) {
          await StudentModel.resetAbsentCount(student._id!);
        }
      }

      results.checked++;
    }

    return NextResponse.json({
      success: true,
      date: today,
      results,
    });
  } catch (error) {
    console.error('Error in absence check cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

