import { getDb } from '../utils/db';
import { Batch as BatchType } from '../types';
import { ObjectId } from 'mongodb';

export class BatchModel {
  static async create(batch: Omit<BatchType, '_id' | 'createdAt'>): Promise<BatchType> {
    const db = await getDb();
    const result = await db.collection('batches').insertOne({
      ...batch,
      createdAt: new Date(),
    });
    return { ...batch, _id: result.insertedId.toString() };
  }

  static async findAll(): Promise<BatchType[]> {
    const db = await getDb();
    const batches = await db.collection('batches').find({}).toArray();
    return batches.map(b => ({ ...b, _id: b._id.toString() })) as BatchType[];
  }

  static async findByCourseId(courseId: string): Promise<BatchType[]> {
    const db = await getDb();
    const batches = await db.collection('batches').find({ courseId }).toArray();
    return batches.map(b => ({ ...b, _id: b._id.toString() })) as BatchType[];
  }

  static async findById(id: string): Promise<BatchType | null> {
    const db = await getDb();
    const batch = await db.collection('batches').findOne({ _id: new ObjectId(id) });
    if (!batch) return null;
    return { ...batch, _id: batch._id.toString() } as BatchType;
  }
}

