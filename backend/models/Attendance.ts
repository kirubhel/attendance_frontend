import { getDb } from '../utils/db';
import { Attendance as AttendanceType } from '../types';
import { ObjectId } from 'mongodb';

export class AttendanceModel {
  static async create(attendance: Omit<AttendanceType, '_id' | 'createdAt'>): Promise<AttendanceType> {
    const db = await getDb();
    const result = await db.collection('attendance').insertOne({
      ...attendance,
      createdAt: new Date(),
    });
    return { ...attendance, _id: result.insertedId.toString() };
  }

  static async findByStudentAndDate(studentId: string, date: string): Promise<AttendanceType | null> {
    const db = await getDb();
    const attendance = await db.collection('attendance').findOne({
      studentId,
      date,
    });
    if (!attendance) return null;
    return { ...attendance, _id: attendance._id.toString() } as AttendanceType;
  }

  static async updateStatus(id: string, status: 'IN' | 'OUT', time: Date): Promise<void> {
    const db = await getDb();
    const update: any = { status };
    if (status === 'IN') {
      update.checkInTime = time;
    } else {
      update.checkOutTime = time;
    }
    await db.collection('attendance').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
  }

  static async findByDate(date: string): Promise<AttendanceType[]> {
    const db = await getDb();
    const attendance = await db.collection('attendance').find({ date }).toArray();
    return attendance.map(a => ({ ...a, _id: a._id.toString() })) as AttendanceType[];
  }

  static async getPresentToday(date: string): Promise<AttendanceType[]> {
    const db = await getDb();
    const attendance = await db.collection('attendance').find({
      date,
      status: 'IN',
    }).toArray();
    return attendance.map(a => ({ ...a, _id: a._id.toString() })) as AttendanceType[];
  }

  static async findByStudentId(studentId: string): Promise<AttendanceType[]> {
    const db = await getDb();
    const attendance = await db.collection('attendance').find({ studentId }).toArray();
    return attendance.map(a => ({ ...a, _id: a._id.toString() })) as AttendanceType[];
  }

  static async updateAttendanceHours(id: string, hours: number): Promise<void> {
    const db = await getDb();
    await db.collection('attendance').updateOne(
      { _id: new ObjectId(id) },
      { $set: { attendanceHours: hours } }
    );
  }
}

