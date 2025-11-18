'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { coursesApi, batchesApi, studentsApi } from '@/lib/api';
import Layout from '@/components/Layout';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterBatchId, setFilterBatchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCourses();
  }, [router]);

  useEffect(() => {
    if (filterCourseId) {
      loadBatches(filterCourseId);
    } else {
      setBatches([]);
      setFilterBatchId('');
    }
  }, [filterCourseId]);

  useEffect(() => {
    loadStudents();
  }, [filterCourseId, filterBatchId]);

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
      // Reset batch filter if current batch is not in the new list
      if (filterBatchId && !data.find((b: any) => b._id === filterBatchId)) {
        setFilterBatchId('');
      }
    } catch (err: any) {
      console.error('Error loading batches:', err);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const filters: { courseId?: string; batchId?: string } = {};
      if (filterCourseId) filters.courseId = filterCourseId;
      if (filterBatchId) filters.batchId = filterBatchId;
      
      const data = await studentsApi.getAll(filters);
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const getBatchName = (batchId: string) => {
    const batch = batches.find(b => b._id === batchId);
    return batch ? batch.name : 'Unknown';
  };

  const getCourseName = (batchId: string) => {
    const batch = batches.find(b => b._id === batchId);
    if (!batch) return 'Unknown';
    const course = courses.find(c => c._id === batch.courseId);
    return course ? course.name : 'Unknown';
  };

  if (loading && students.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading students...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Student List</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterCourseId}
              onChange={(e) => {
                setFilterCourseId(e.target.value);
                setFilterBatchId('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
            <select
              value={filterBatchId}
              onChange={(e) => setFilterBatchId(e.target.value)}
              disabled={!filterCourseId}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.fullname}</div>
                        <div className="text-xs text-gray-500 sm:hidden mt-1">{student.email}</div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.phone}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getCourseName(student.batchId)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getBatchName(student.batchId)}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                        {student.totalHours ? `${student.totalHours.toFixed(1)}h` : '0h'}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.isBlocked
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {student.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {filterCourseId || filterBatchId
                        ? 'No students found with the selected filters'
                        : 'No students registered yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {students.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            Showing {students.length} student{students.length !== 1 ? 's' : ''}
            {filterCourseId && ` in ${courses.find(c => c._id === filterCourseId)?.name || 'selected course'}`}
            {filterBatchId && ` - ${batches.find(b => b._id === filterBatchId)?.name || 'selected batch'}`}
          </div>
        )}
      </div>
    </Layout>
  );
}

