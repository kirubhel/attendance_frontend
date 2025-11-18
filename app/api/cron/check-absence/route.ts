import { NextRequest, NextResponse } from 'next/server';
import { StudentModel } from '@backend/models/Student';
import { AttendanceModel } from '@backend/models/Attendance';
import { BatchModel } from '@backend/models/Batch';
import { CourseModel } from '@backend/models/Course';
import { sendWarningEmail, sendBlockEmail } from '@backend/utils/email';
import { getScheduledClassTime, calculateAttendanceHours } from '@backend/utils/schedule';
import { calculateTotalHours } from '@backend/utils/ranking';
import { getDb } from '@backend/utils/db';

/**
 * This endpoint checks for student absences and automatically:
 * - Sends warning email after 2 consecutive days absent
 * - Sends block email and blocks student after 4 total days absent
 * 
 * Can be called by:
 * - Vercel Cron (automatically daily)
 * - Manual trigger via GET request (for testing)
 */
export async function GET(request: NextRequest) {
  try {
    // Allow manual trigger for testing (skip auth in development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require authentication
    if (!isDevelopment && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🔍 Starting absence check for ${today}...`);

    const allStudents = await StudentModel.findAll();
    const todayAttendance = await AttendanceModel.findByDate(today);

    const presentStudentIds = new Set(todayAttendance.map(a => a.studentId));

    const results = {
      checked: 0,
      warningsSent: 0,
      blocksApplied: 0,
      emailsSent: 0,
      hoursCalculated: 0,
      errors: [] as string[],
    };

    // Calculate hours for students who checked in but didn't check out
    console.log(`\n⏰ Calculating attendance hours for students who didn't check out...`);
    const checkedInToday = todayAttendance.filter(a => a.status === 'IN' && a.checkInTime);
    for (const attendance of checkedInToday) {
      try {
        const student = await StudentModel.findById(attendance.studentId);
        if (!student) continue;

        const batch = await BatchModel.findById(student.batchId);
        if (!batch) continue;

        const course = await CourseModel.findById(batch.courseId);
        if (!course || !course.schedule) continue;

        const classTime = getScheduledClassTime(new Date(), course.schedule);
        if (!classTime) continue;

        // Calculate hours using scheduled end time (or current time if class hasn't ended)
        const endTime = new Date() < classTime.end ? new Date() : classTime.end;
        const hours = calculateAttendanceHours(
          new Date(attendance.checkInTime!),
          null, // No check-out
          classTime.end
        );

        if (hours > 0) {
          await AttendanceModel.updateAttendanceHours(attendance._id!, hours);
          results.hoursCalculated++;
        }
      } catch (error) {
        console.error(`  ❌ Error calculating hours for attendance ${attendance._id}:`, error);
      }
    }

    // Update total hours for all students
    await calculateTotalHours();

    for (const student of allStudents) {
      // Skip already blocked students (they've already been notified)
      if (student.isBlocked) {
        results.checked++;
        continue;
      }

      const wasPresent = presentStudentIds.has(student._id!);

      if (!wasPresent) {
        // Student is absent today - increment absent count
        await StudentModel.incrementAbsentCount(student._id!);
        const updatedStudent = await StudentModel.findById(student._id!);

        if (updatedStudent) {
          console.log(`  📊 ${updatedStudent.fullname}: Absent count = ${updatedStudent.absentCount}`);

          // Send warning email after 2 consecutive days absent
          if (updatedStudent.absentCount === 2) {
            try {
              console.log(`  ⚠️  Sending warning email to ${updatedStudent.email}...`);
              await sendWarningEmail(
                updatedStudent.email,
                updatedStudent.fullname,
                updatedStudent.absentCount
              );
              results.warningsSent++;
              results.emailsSent++;
              console.log(`  ✅ Warning email sent to ${updatedStudent.email}`);
            } catch (error) {
              const errorMsg = `Failed to send warning to ${updatedStudent.email}: ${error}`;
              console.error(`  ❌ ${errorMsg}`);
              results.errors.push(errorMsg);
            }
          }
          
          // Block student and send block email after 4 total days absent
          if (updatedStudent.absentCount >= 4) {
            try {
              console.log(`  🚫 Blocking student ${updatedStudent.fullname} (${updatedStudent.absentCount} absences)...`);
              
              // Block the student
              await StudentModel.block(student._id!);
              results.blocksApplied++;

              // Send block email
              console.log(`  📧 Sending block email to ${updatedStudent.email}...`);
              await sendBlockEmail(
                updatedStudent.email,
                updatedStudent.fullname
              );
              results.emailsSent++;
              console.log(`  ✅ Block email sent to ${updatedStudent.email}`);
            } catch (error) {
              const errorMsg = `Failed to block/send email to ${updatedStudent.email}: ${error}`;
              console.error(`  ❌ ${errorMsg}`);
              results.errors.push(errorMsg);
            }
          }
        }
      } else {
        // Student was present today - reset absent count if they had any
        if (student.absentCount > 0) {
          console.log(`  ✅ ${student.fullname}: Present - resetting absent count`);
          await StudentModel.resetAbsentCount(student._id!);
        }
      }

      results.checked++;
    }

    console.log(`\n✅ Absence check completed:`);
    console.log(`   - Checked: ${results.checked} students`);
    console.log(`   - Warnings sent: ${results.warningsSent}`);
    console.log(`   - Blocks applied: ${results.blocksApplied}`);
    console.log(`   - Total emails sent: ${results.emailsSent}`);
    console.log(`   - Hours calculated: ${results.hoursCalculated}`);
    if (results.errors.length > 0) {
      console.log(`   - Errors: ${results.errors.length}`);
    }

    return NextResponse.json({
      success: true,
      date: today,
      results,
      message: `Checked ${results.checked} students. Sent ${results.warningsSent} warnings and ${results.blocksApplied} block notifications. Calculated hours for ${results.hoursCalculated} students.`,
    });
  } catch (error) {
    console.error('❌ Error in absence check cron:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering (useful for testing)
 */
export async function POST(request: NextRequest) {
  // Same logic as GET, but explicitly for manual triggers
  return GET(request);
}

