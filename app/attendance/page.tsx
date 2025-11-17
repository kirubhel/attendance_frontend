'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { attendanceApi, studentsApi } from '@/lib/api';
import Layout from '@/components/Layout';

export default function AttendancePage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router, date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attendanceData, studentsData] = await Promise.all([
        attendanceApi.getAll(date),
        studentsApi.getAll(),
      ]);
      setAttendance(attendanceData);
      setStudents(studentsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s._id === studentId);
    return student ? student.fullname : 'Unknown';
  };

  const presentStudentIds = new Set(
    attendance.filter((a) => a.status === 'IN').map((a) => a.studentId)
  );
  const absentStudents = students.filter((s) => !presentStudentIds.has(s._id) && !s.isBlocked);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Attendance List</h1>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Present Students */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Present Students ({attendance.filter((a) => a.status === 'IN').length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.filter((a) => a.status === 'IN').length > 0 ? (
                  attendance
                    .filter((a) => a.status === 'IN')
                    .map((record) => (
                      <tr key={record._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getStudentName(record.studentId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.checkInTime
                            ? new Date(record.checkInTime).toLocaleString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            IN
                          </span>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No students present
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Absent Students */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Absent Students ({absentStudents.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {absentStudents.length > 0 ? (
                  absentStudents.map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.fullname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.absentCount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      All students are present
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

