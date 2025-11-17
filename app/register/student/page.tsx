'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { coursesApi, batchesApi, studentsApi } from '@/lib/api';
import Layout from '@/components/Layout';

export default function RegisterStudentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    nationalId: '',
    batchId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCourses();
  }, [router]);

  useEffect(() => {
    if (selectedCourseId) {
      loadBatches(selectedCourseId);
    } else {
      setBatches([]);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (err: any) {
      console.error('Error loading courses:', err);
    }
  };

  const loadBatches = async (courseId: string) => {
    try {
      const data = await batchesApi.getAll(courseId);
      setBatches(data);
    } catch (err: any) {
      console.error('Error loading batches:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'courseId') {
      setSelectedCourseId(value);
      setFormData({ ...formData, batchId: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await studentsApi.create({
        fullname: formData.fullname,
        phone: formData.phone,
        email: formData.email,
        nationalId: formData.nationalId || undefined,
        batchId: formData.batchId,
      });
      setSuccess('Student registered successfully! QR code has been sent to their email.');
      setFormData({
        fullname: '',
        phone: '',
        email: '',
        nationalId: '',
        batchId: '',
      });
      setSelectedCourseId('');
    } catch (err: any) {
      setError(err.message || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Register Student</h1>

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
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                value={formData.fullname}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
                National ID (Optional)
              </label>
              <input
                id="nationalId"
                name="nationalId"
                type="text"
                value={formData.nationalId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="123456789"
              />
            </div>

            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                id="courseId"
                name="courseId"
                value={selectedCourseId}
                onChange={handleChange}
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
              <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-1">
                Batch <span className="text-red-500">*</span>
              </label>
              <select
                id="batchId"
                name="batchId"
                value={formData.batchId}
                onChange={handleChange}
                required
                disabled={!selectedCourseId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Registering...' : 'Register Student'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

