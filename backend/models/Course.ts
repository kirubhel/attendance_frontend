import { getDb } from '../utils/db';
import { Course as CourseType } from '../types';
import { ObjectId } from 'mongodb';
import { getDefaultSchedule, calculateDuration } from '../utils/schedule';

export class CourseModel {
  static async create(course: Omit<CourseType, '_id' | 'createdAt'>): Promise<CourseType> {
    const db = await getDb();
    
    // Set default schedule if not provided
    let schedule = course.schedule;
    if (!schedule) {
      schedule = getDefaultSchedule();
    }
    
    // Calculate duration for each day if not provided
    if (schedule && schedule.days) {
      for (const day in schedule.days) {
        const daySchedule = schedule.days[Number(day)];
        if (!daySchedule.duration) {
          daySchedule.duration = calculateDuration(daySchedule.startTime, daySchedule.endTime);
        }
      }
    }
    
    // Legacy format: calculate duration if not provided
    if (schedule && schedule.startTime && schedule.endTime && !schedule.duration) {
      schedule.duration = calculateDuration(schedule.startTime, schedule.endTime);
    }
    
    const result = await db.collection('courses').insertOne({
      ...course,
      schedule,
      createdAt: new Date(),
    });
    return { ...course, schedule, _id: result.insertedId.toString() };
  }

  static async findAll(): Promise<CourseType[]> {
    const db = await getDb();
    const courses = await db.collection('courses').find({}).toArray();
    return courses.map(c => ({ ...c, _id: c._id.toString() })) as CourseType[];
  }

  static async findById(id: string): Promise<CourseType | null> {
    const db = await getDb();
    const course = await db.collection('courses').findOne({ _id: new ObjectId(id) });
    if (!course) return null;
    return { ...course, _id: course._id.toString() } as CourseType;
  }
}

