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

  static async findByDateAndBatch(date: string, batchId: string): Promise<AttendanceType[]> {
    const db = await getDb();
    // Get all students in the batch
    const students = await db.collection('students').find({ batchId }).toArray();
    const studentIds = students.map(s => s._id.toString());
    
    // Get attendance for those students on the date
    const attendance = await db.collection('attendance').find({
      date,
      studentId: { $in: studentIds }
    }).toArray();
    return attendance.map(a => ({ ...a, _id: a._id.toString() })) as AttendanceType[];
  }

  static async findByDateAndCourse(date: string, courseId: string): Promise<AttendanceType[]> {
    const db = await getDb();
    // Get all batches for the course
    const batches = await db.collection('batches').find({ courseId }).toArray();
    const batchIds = batches.map(b => b._id.toString());
    
    // Get all students in those batches
    const students = await db.collection('students').find({ 
      batchId: { $in: batchIds } 
    }).toArray();
    const studentIds = students.map(s => s._id.toString());
    
    // Get attendance for those students on the date
    const attendance = await db.collection('attendance').find({
      date,
      studentId: { $in: studentIds }
    }).toArray();
    return attendance.map(a => ({ ...a, _id: a._id.toString() })) as AttendanceType[];
  }
}

