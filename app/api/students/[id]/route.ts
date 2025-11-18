import { NextRequest, NextResponse } from 'next/server';
import { StudentModel } from '@backend/models/Student';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await StudentModel.findById(id);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { fullname, phone, email, nationalId, batchId } = await request.json();

    if (!fullname || !phone || !email || !batchId) {
      return NextResponse.json(
        { error: 'Full name, phone, email, and batch ID are required' },
        { status: 400 }
      );
    }

    // Check if email is being changed and if it conflicts with another student
    const student = await StudentModel.findById(id);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (email !== student.email) {
      const existingStudent = await StudentModel.findByEmail(email);
      if (existingStudent) {
        return NextResponse.json(
          { error: 'Student with this email already exists' },
          { status: 400 }
        );
      }
    }

    await StudentModel.update(id, {
      fullname,
      phone,
      email,
      nationalId: nationalId || null,
      batchId,
    });

    const updated = await StudentModel.findById(id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating student:', error);
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
    await StudentModel.delete(id);
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

