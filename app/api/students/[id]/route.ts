import { NextRequest, NextResponse } from 'next/server';
import { StudentModel } from '@backend/models/Student';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await StudentModel.findById(params.id);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

