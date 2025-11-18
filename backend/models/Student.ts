import { getDb } from '../utils/db';
import { Student as StudentType } from '../types';
import { ObjectId } from 'mongodb';

export class StudentModel {
  static async create(student: Omit<StudentType, '_id' | 'createdAt'>): Promise<StudentType> {
    const db = await getDb();
    const result = await db.collection('students').insertOne({
      ...student,
      createdAt: new Date(),
    });
    return { ...student, _id: result.insertedId.toString() };
  }

  static async findById(id: string): Promise<StudentType | null> {
    const db = await getDb();
    const student = await db.collection('students').findOne({ _id: new ObjectId(id) });
    if (!student) return null;
    return { ...student, _id: student._id.toString() } as StudentType;
  }

  static async findByEmail(email: string): Promise<StudentType | null> {
    const db = await getDb();
    const student = await db.collection('students').findOne({ email });
    if (!student) return null;
    return { ...student, _id: student._id.toString() } as StudentType;
  }

  static async findAll(): Promise<StudentType[]> {
    const db = await getDb();
    const students = await db.collection('students').find({}).toArray();
    return students.map(s => ({ ...s, _id: s._id.toString() })) as StudentType[];
  }

  static async findByBatchId(batchId: string): Promise<StudentType[]> {
    const db = await getDb();
    const students = await db.collection('students').find({ batchId }).toArray();
    return students.map(s => ({ ...s, _id: s._id.toString() })) as StudentType[];
  }

  static async findByCourseId(courseId: string): Promise<StudentType[]> {
    const db = await getDb();
    // First, get all batches for this course
    const batches = await db.collection('batches').find({ courseId }).toArray();
    const batchIds = batches.map(b => b._id.toString());
    
    // Then, get all students in those batches
    const students = await db.collection('students').find({ 
      batchId: { $in: batchIds } 
    }).toArray();
    
    return students.map(s => ({ ...s, _id: s._id.toString() })) as StudentType[];
  }

  static async update(id: string, updates: Partial<StudentType>): Promise<void> {
    const db = await getDb();
    await db.collection('students').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
  }

  static async block(id: string): Promise<void> {
    await this.update(id, { isBlocked: true });
  }

  static async incrementAbsentCount(id: string): Promise<void> {
    const db = await getDb();
    await db.collection('students').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { absentCount: 1 } }
    );
  }

  static async resetAbsentCount(id: string): Promise<void> {
    await this.update(id, { absentCount: 0 });
  }

  static async delete(id: string): Promise<void> {
    const db = await getDb();
    const result = await db.collection('students').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      throw new Error('Student not found');
    }
  }
}

