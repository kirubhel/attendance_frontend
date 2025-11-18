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

  static async update(id: string, updates: Partial<BatchType>): Promise<BatchType> {
    const db = await getDb();
    const result = await db.collection('batches').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Batch not found');
    }
    
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Batch not found after update');
    }
    return updated;
  }

  static async delete(id: string): Promise<void> {
    const db = await getDb();
    const result = await db.collection('batches').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      throw new Error('Batch not found');
    }
  }
}

