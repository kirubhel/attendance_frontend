import { NextRequest, NextResponse } from 'next/server';
import { CourseModel } from '@backend/models/Course';

export async function GET() {
  try {
    const courses = await CourseModel.findAll();
    return NextResponse.json(courses);
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('ETIMEOUT') || error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Database connection timeout',
          message: 'Unable to connect to MongoDB. Please check your network connection and ensure MongoDB Atlas cluster is running.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('DNS')) {
      return NextResponse.json(
        { 
          error: 'Database host not found',
          message: 'Cannot resolve MongoDB hostname. Please check your connection string and network settings.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Failed to fetch courses'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, schedule } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    const course = await CourseModel.create({ name, description, schedule });
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('Error creating course:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('ETIMEOUT') || error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Database connection timeout',
          message: 'Unable to connect to MongoDB. Please check your network connection and ensure MongoDB Atlas cluster is running.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('DNS')) {
      return NextResponse.json(
        { 
          error: 'Database host not found',
          message: 'Cannot resolve MongoDB hostname. Please check your connection string and network settings.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Failed to create course'
      },
      { status: 500 }
    );
  }
}

