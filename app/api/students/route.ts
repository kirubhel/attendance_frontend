import { NextRequest, NextResponse } from 'next/server';
import { StudentModel } from '../../../../backend/models/Student';
import { generateQRCode } from '../../../../backend/utils/qr';
import { sendQRCodeEmail } from '../../../../backend/utils/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (batchId) {
      const students = await StudentModel.findByBatchId(batchId);
      return NextResponse.json(students);
    }

    const students = await StudentModel.findAll();
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fullname, phone, email, nationalId, batchId } = await request.json();

    if (!fullname || !phone || !email || !batchId) {
      return NextResponse.json(
        { error: 'Full name, phone, email, and batch ID are required' },
        { status: 400 }
      );
    }

    // Check if student with email already exists
    const existingStudent = await StudentModel.findByEmail(email);
    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 400 }
      );
    }

    // Create student first to get ID
    const student = await StudentModel.create({
      fullname,
      phone,
      email,
      nationalId: nationalId || null,
      batchId,
      qrCode: '', // Will be updated after generation
      isBlocked: false,
      absentCount: 0,
    });

    // Generate QR code using student ID
    const qrCodeDataURL = await generateQRCode(student._id!);
    
    // Update student with QR code
    await StudentModel.update(student._id!, { qrCode: qrCodeDataURL });

    // Send email with QR code
    try {
      await sendQRCodeEmail(email, fullname, qrCodeDataURL);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      { ...student, qrCode: qrCodeDataURL },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

