import { NextRequest, NextResponse } from 'next/server';
import { BatchModel } from '@backend/models/Batch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (courseId) {
      const batches = await BatchModel.findByCourseId(courseId);
      return NextResponse.json(batches);
    }

    const batches = await BatchModel.findAll();
    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, courseId } = await request.json();

    if (!name || !courseId) {
      return NextResponse.json(
        { error: 'Batch name and course ID are required' },
        { status: 400 }
      );
    }

    const batch = await BatchModel.create({ name, courseId });
    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

