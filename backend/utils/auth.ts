import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { User } from '../types';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const user = await db.collection('users').findOne({ email });
  if (!user) return null;
  return { ...user, _id: user._id.toString() } as User;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = await getDb();
  const user = await db.collection('users').findOne({ username });
  if (!user) return null;
  return { ...user, _id: user._id.toString() } as User;
}

export async function createAdminUser(username: string, password: string, email?: string): Promise<User> {
  const db = await getDb();
  const hashedPassword = await hashPassword(password);
  const result = await db.collection('users').insertOne({
    username,
    email: email || null,
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date(),
  });
  return {
    _id: result.insertedId.toString(),
    username,
    email: email || undefined,
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date(),
  };
}

