import { NextResponse } from 'next/server';
import { StudentModel } from '@backend/models/Student';
import { AttendanceModel } from '@backend/models/Attendance';
import { sendWarningEmail, sendBlockEmail } from '@backend/utils/email';

/**
 * Test endpoint to manually trigger absence check
 * Useful for testing email functionality
 * 
 * Usage: GET /api/test-absence-check
 */
export async function GET() {
  try {
    console.log('\n🧪 TEST MODE: Running absence check...\n');

    const today = new Date().toISOString().split('T')[0];
    const allStudents = await StudentModel.findAll();
    const todayAttendance = await AttendanceModel.findByDate(today);

    const presentStudentIds = new Set(todayAttendance.map(a => a.studentId));

    const results = {
      checked: 0,
      warningsSent: 0,
      blocksApplied: 0,
      emailsSent: 0,
      details: [] as any[],
    };

    for (const student of allStudents) {
      if (student.isBlocked) {
        results.checked++;
        continue;
      }

      const wasPresent = presentStudentIds.has(student._id!);

      if (!wasPresent) {
        // Increment absent count
        await StudentModel.incrementAbsentCount(student._id!);
        const updatedStudent = await StudentModel.findById(student._id!);

        if (updatedStudent) {
          const detail: any = {
            student: updatedStudent.fullname,
            email: updatedStudent.email,
            absentCount: updatedStudent.absentCount,
            actions: [],
          };

          // Send warning at 2 absences
          if (updatedStudent.absentCount === 2) {
            try {
              await sendWarningEmail(
                updatedStudent.email,
                updatedStudent.fullname,
                updatedStudent.absentCount
              );
              results.warningsSent++;
              results.emailsSent++;
              detail.actions.push('Warning email sent');
            } catch (error) {
              detail.actions.push(`Warning email failed: ${error}`);
            }
          }

          // Block and send email at 4+ absences
          if (updatedStudent.absentCount >= 4) {
            try {
              await StudentModel.block(student._id!);
              results.blocksApplied++;
              detail.actions.push('Student blocked');

              await sendBlockEmail(
                updatedStudent.email,
                updatedStudent.fullname
              );
              results.emailsSent++;
              detail.actions.push('Block email sent');
            } catch (error) {
              detail.actions.push(`Block/email failed: ${error}`);
            }
          }

          if (detail.actions.length > 0) {
            results.details.push(detail);
          }
        }
      } else {
        // Reset if present
        if (student.absentCount > 0) {
          await StudentModel.resetAbsentCount(student._id!);
        }
      }

      results.checked++;
    }

    return NextResponse.json({
      success: true,
      test: true,
      date: today,
      results,
      message: `Test completed. Checked ${results.checked} students.`,
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

