import { NextResponse } from 'next/server';
import { rankStudents } from '@backend/utils/ranking';

export async function GET() {
  try {
    const rankedStudents = await rankStudents();
    return NextResponse.json(rankedStudents);
  } catch (error) {
    console.error('Error ranking students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

