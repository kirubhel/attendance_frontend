import { NextRequest, NextResponse } from 'next/server';
import { BatchModel } from '@backend/models/Batch';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await BatchModel.findById(id);
    
    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(batch);
  } catch (error: any) {
    console.error('Error fetching batch:', error);
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
    const { name, courseId } = await request.json();

    if (!name || !courseId) {
      return NextResponse.json(
        { error: 'Batch name and course ID are required' },
        { status: 400 }
      );
    }

    const batch = await BatchModel.update(id, { name, courseId });
    return NextResponse.json(batch);
  } catch (error: any) {
    console.error('Error updating batch:', error);
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
    await BatchModel.delete(id);
    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

