import { NextRequest, NextResponse } from 'next/server';
import { CourseModel } from '@backend/models/Course';

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

    const course = await CourseModel.findByIdAndUpdate(id, { name, description, schedule });
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

