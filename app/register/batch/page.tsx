'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { coursesApi, batchesApi } from '@/lib/api';
import Layout from '@/components/Layout';

export default function RegisterBatchPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCourses();
    loadBatches();
  }, [router]);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (err: any) {
      console.error('Error loading courses:', err);
    }
  };

  const loadBatches = async () => {
    try {
      const data = await batchesApi.getAll();
      setBatches(data);
    } catch (err: any) {
      console.error('Error loading batches:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await batchesApi.create(name, courseId);
      setSuccess('Batch created successfully!');
      setName('');
      setCourseId('');
      loadBatches();
    } catch (err: any) {
      setError(err.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Register Batch</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                id="courseId"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Batch A, Batch B"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </form>
        </div>

        {/* Existing Batches */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Batches</h2>
          {batches.length > 0 ? (
            <div className="space-y-2">
              {batches.map((batch) => {
                const course = courses.find((c) => c._id === batch.courseId);
                return (
                  <div key={batch._id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{batch.name}</h3>
                    {course && (
                      <p className="text-sm text-gray-500 mt-1">Course: {course.name}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No batches registered yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

