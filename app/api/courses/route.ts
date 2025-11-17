import { NextRequest, NextResponse } from 'next/server';
import { CourseModel } from '../../../../backend/models/Course';

export async function GET() {
  try {
    const courses = await CourseModel.findAll();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    const course = await CourseModel.create({ name, description });
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

