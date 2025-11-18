'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { dashboardApi } from '@/lib/api';
import { testDatabaseConnection } from '@/lib/db-test';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Test database connection
    testDatabaseConnection().then((result) => {
      setDbStatus(result.success ? 'connected' : 'disconnected');
      if (!result.success) {
        toast.error('Database connection issue');
      }
    });

    loadDashboard();
  }, [router]);

  const loadDashboard = async () => {
    try {
      const dashboardData = await dashboardApi.getStats();
      setData(dashboardData);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load dashboard';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  const { stats, studentsByBatch, todayAttendance, students } = data || {};

  // Calculate attendance rate
  const attendanceRate = stats?.totalStudents > 0 
    ? Math.round((stats?.presentToday / stats?.totalStudents) * 100) 
    : 0;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome back! Here's your overview</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${
              dbStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              dbStatus === 'disconnected' ? 'bg-red-500' : 
              'bg-yellow-500'
            }`}></div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              {dbStatus === 'connected' ? 'Connected' : 
               dbStatus === 'disconnected' ? 'Disconnected' : 
               'Checking...'}
            </span>
          </div>
        </div>

        {/* Stats Grid - Enhanced with icons and gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalStudents || 0}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Students */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Students</p>
                <p className="text-3xl font-bold mt-2">{stats?.activeStudents || 0}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Present Today */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Present Today</p>
                <p className="text-3xl font-bold mt-2">{stats?.presentToday || 0}</p>
                <p className="text-xs text-blue-100 mt-1">{attendanceRate}% attendance</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Absent Today */}
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Absent Today</p>
                <p className="text-3xl font-bold mt-2">{stats?.absentToday || 0}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Blocked Students */}
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm font-medium">Blocked</p>
                <p className="text-3xl font-bold mt-2">{stats?.blockedStudents || 0}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Courses */}
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Courses</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalCourses || 0}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Batches */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Batches</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalBatches || 0}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          {/* Warnings Sent */}
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Warnings Sent</p>
                <p className="text-3xl font-bold mt-2">{stats?.warningsCount || 0}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Students by Batch - Enhanced */}
        {studentsByBatch && Object.keys(studentsByBatch).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-indigo-100 rounded-lg p-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Students by Batch</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(studentsByBatch).map(([batch, count]) => (
                <div key={batch} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-gray-50 to-white">
                  <h3 className="font-semibold text-gray-700 text-sm sm:text-base">{batch}</h3>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">{count as number}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Attendance - Enhanced */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Today's Attendance</h2>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {todayAttendance?.length || 0} present
            </span>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todayAttendance && todayAttendance.length > 0 ? (
                    todayAttendance.map((attendance: any) => (
                      <tr key={attendance._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {attendance.student?.fullname || 'Unknown'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              attendance.status === 'IN'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {attendance.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attendance.checkInTime
                            ? new Date(attendance.checkInTime).toLocaleTimeString()
                            : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                        No attendance records for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Students List - Enhanced with mobile responsiveness */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-100 rounded-lg p-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">All Students</h2>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students && students.length > 0 ? (
                    students.map((student: any) => (
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.fullname}</div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">{student.email}</div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.phone}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                          {student.totalHours ? `${student.totalHours.toFixed(1)}h` : '0h'}
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.rank ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              #{student.rank}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.absentCount}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                      <td colSpan={7} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                        No students registered yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
