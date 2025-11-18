import { NextRequest, NextResponse } from 'next/server';
import { CourseModel } from '@backend/models/Course';
import { BatchModel } from '@backend/models/Batch';
import { StudentModel } from '@backend/models/Student';
import { sendCourseScheduleUpdateEmail } from '@backend/utils/email';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await CourseModel.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, schedule } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    // Get the old course to check if schedule changed
    const oldCourse = await CourseModel.findById(id);
    if (!oldCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = await CourseModel.update(id, { name, description, schedule });

    // If schedule was updated, notify all students in the course
    if (schedule && JSON.stringify(oldCourse.schedule) !== JSON.stringify(schedule)) {
      try {
        // Get all batches for this course
        const batches = await BatchModel.findByCourseId(id);
        
        // Get all students in those batches
        const allStudents: any[] = [];
        for (const batch of batches) {
          const students = await StudentModel.findByBatchId(batch._id!);
          allStudents.push(...students);
        }

        // Send email to each student (don't wait for all to complete)
        const emailPromises = allStudents.map(student =>
          sendCourseScheduleUpdateEmail(
            student.email,
            student.fullname,
            course.name,
            schedule
          ).catch(err => {
            console.error(`Failed to send schedule update email to ${student.email}:`, err);
            // Don't throw - continue with other emails
          })
        );

        // Send emails in background (don't block the response)
        Promise.all(emailPromises).then(() => {
          console.log(`✅ Schedule update emails sent to ${allStudents.length} students`);
        }).catch(err => {
          console.error('Error sending schedule update emails:', err);
        });
      } catch (emailError) {
        console.error('Error notifying students of schedule update:', emailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await CourseModel.delete(id);
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

