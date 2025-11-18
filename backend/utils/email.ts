import nodemailer from 'nodemailer';

// Create SMTP transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP configuration not set. Email functionality will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465' || process.env.SMTP_USE_TLS === 'true',
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const transporter = createTransporter();

export async function sendQRCodeEmail(
  email: string,
  studentName: string,
  qrCodeDataURL: string
): Promise<void> {
  if (!transporter) {
    console.log('Email service not configured. Would send QR code to:', email);
    return;
  }

  try {
    // Convert data URL to buffer
    const base64Data = qrCodeDataURL.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Nardi's Attendance'}" <${process.env.SMTP_FROM || process.env.SMTP_USERNAME}>`,
      to: email,
      subject: 'Your QR Code for Attendance',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Nardi's Attendance!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${studentName}!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Your QR code for attendance has been generated. Please find it attached below.
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              You can use this QR code to check in and check out of classes. Simply present it when scanning.
            </p>
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-weight: 500;">
                ⚠️ Keep this QR code safe and do not share it with others.
              </p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Best regards,<br/>
                <strong style="color: #1f2937;">${process.env.SMTP_FROM_NAME || 'Nardi's Attendance'}</strong>
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `qr-code-${studentName.replace(/\s+/g, '-')}.png`,
          content: buffer,
          cid: 'qrcode',
        },
      ],
    });

    console.log(`✅ QR code email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendWarningEmail(email: string, studentName: string, daysAbsent: number): Promise<void> {
  if (!transporter) {
    console.log('Email service not configured. Would send warning to:', email);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Nardi's Attendance'}" <${process.env.SMTP_FROM || process.env.SMTP_USERNAME}>`,
      to: email,
      subject: 'Attendance Warning - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ Attendance Warning</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Dear ${studentName},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              You have been absent for <strong style="color: #dc2626;">${daysAbsent} consecutive days</strong>.
            </p>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; line-height: 1.6;">
                Please ensure you attend classes regularly. Continued absence may result in being blocked from the system.
              </p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">
              If you have any questions or concerns, please contact your administrator.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Best regards,<br/>
                <strong style="color: #1f2937;">${process.env.SMTP_FROM_NAME || 'Nardi's Attendance'}</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`✅ Warning email sent to ${email}`);
  } catch (error) {
    console.error('Error sending warning email:', error);
    throw new Error('Failed to send warning email');
  }
}

export async function sendBlockEmail(email: string, studentName: string): Promise<void> {
  if (!transporter) {
    console.log('Email service not configured. Would send block notification to:', email);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Nardi's Attendance'}" <${process.env.SMTP_FROM || process.env.SMTP_USERNAME}>`,
      to: email,
      subject: 'Account Blocked - Attendance Violation',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🚫 Account Blocked</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Dear ${studentName},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Your account has been <strong style="color: #dc2626;">blocked</strong> due to excessive absences (4 or more days).
            </p>
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #991b1b; margin: 0; line-height: 1.6;">
                You will not be able to check in or access the system until your account is restored by an administrator.
              </p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">
              Please contact the administrator immediately to restore your access and discuss your attendance record.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Best regards,<br/>
                <strong style="color: #1f2937;">${process.env.SMTP_FROM_NAME || 'Nardi's Attendance'}</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`✅ Block notification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending block email:', error);
    throw new Error('Failed to send block email');
  }
}

export async function sendCourseScheduleUpdateEmail(
  email: string,
  studentName: string,
  courseName: string,
  schedule: any
): Promise<void> {
  if (!transporter) {
    console.log('Email service not configured. Would send schedule update to:', email);
    return;
  }

  // Format schedule for display
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let scheduleHtml = '';
  
  if (schedule.days) {
    scheduleHtml = '<ul style="list-style: none; padding: 0; margin: 15px 0;">';
    Object.entries(schedule.days).forEach(([day, daySchedule]: [string, any]) => {
      const dayName = weekdays[Number(day)];
      scheduleHtml += `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <strong>${dayName}:</strong> ${daySchedule.startTime} - ${daySchedule.endTime}
      </li>`;
    });
    scheduleHtml += '</ul>';
  } else if (schedule.weekdays && schedule.startTime && schedule.endTime) {
    const dayNames = schedule.weekdays.map((d: number) => weekdays[d]).join(', ');
    scheduleHtml = `<p style="margin: 15px 0;"><strong>Days:</strong> ${dayNames}<br/>
      <strong>Time:</strong> ${schedule.startTime} - ${schedule.endTime}</p>`;
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Attendance System'}" <${process.env.SMTP_FROM || process.env.SMTP_USERNAME}>`,
      to: email,
      subject: `Course Schedule Updated - ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">📅 Schedule Update</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Dear ${studentName},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              The schedule for <strong style="color: #667eea;">${courseName}</strong> has been updated.
            </p>
            <div style="background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #1e3a8a; margin-top: 0; margin-bottom: 10px;">Updated Schedule:</h3>
              ${scheduleHtml}
              <p style="color: #1e3a8a; margin: 10px 0 0 0; font-size: 14px;">
                <strong>Note:</strong> Check-in opens 30 minutes before each class starts.
              </p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">
              Please make note of the new schedule and ensure you attend classes at the updated times.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Best regards,<br/>
                <strong style="color: #1f2937;">${process.env.SMTP_FROM_NAME || 'Attendance System'}</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`✅ Schedule update email sent to ${email}`);
  } catch (error) {
    console.error('Error sending schedule update email:', error);
    throw new Error('Failed to send schedule update email');
  }
}
