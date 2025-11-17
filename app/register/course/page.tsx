'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { coursesApi } from '@/lib/api';
import Layout from '@/components/Layout';

export default function RegisterCoursePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCourses();
  }, [router]);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (err: any) {
      console.error('Error loading courses:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await coursesApi.create(name, description);
      setSuccess('Course created successfully!');
      setName('');
      setDescription('');
      loadCourses();
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Register Course</h1>

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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Python Bootcamp"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Course description..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </form>
        </div>

        {/* Existing Courses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Courses</h2>
          {courses.length > 0 ? (
            <div className="space-y-2">
              {courses.map((course) => (
                <div key={course._id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{course.name}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No courses registered yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

