'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { coursesApi } from '@/lib/api';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function RegisterCoursePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // New format: days map with individual schedules
  const [daySchedules, setDaySchedules] = useState<Record<number, { startTime: string; endTime: string }>>({
    1: { startTime: '09:00', endTime: '11:00' }, // Monday
    3: { startTime: '09:00', endTime: '11:00' }, // Wednesday
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
      // Show user-friendly error message
      if (err.message?.includes('timeout') || err.message?.includes('connection')) {
        setError('Database connection issue. Please check your network and try again.');
      }
    }
  };

  const handleWeekdayToggle = (day: number) => {
    setDaySchedules(prev => {
      const newSchedules = { ...prev };
      if (newSchedules[day]) {
        // Remove day
        delete newSchedules[day];
      } else {
        // Add day with default times
        newSchedules[day] = { startTime: '09:00', endTime: '11:00' };
      }
      return newSchedules;
    });
  };

  const updateDayTime = (day: number, field: 'startTime' | 'endTime', value: string) => {
    setDaySchedules(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Convert to new format: days map
      const schedule = {
        days: daySchedules,
      };
      
      if (editingCourse) {
        // Update existing course
        await coursesApi.update(editingCourse._id, name, description, schedule);
        toast.success('Course updated successfully!');
        setSuccess('Course updated successfully!');
        setEditingCourse(null);
      } else {
        // Create new course
        await coursesApi.create(name, description, schedule);
        toast.success('Course created successfully!');
        setSuccess('Course created successfully!');
      }
      
      // Reset form
      setName('');
      setDescription('');
      setDaySchedules({
        1: { startTime: '09:00', endTime: '11:00' },
        3: { startTime: '09:00', endTime: '11:00' },
      });
      loadCourses();
    } catch (err: any) {
      // Provide user-friendly error messages
      let errorMsg = editingCourse ? 'Failed to update course' : 'Failed to create course';
      if (err.message?.includes('timeout') || err.message?.includes('connection')) {
        errorMsg = 'Database connection timeout. Please check your network connection.';
      } else if (err.message?.includes('host not found') || err.message?.includes('DNS')) {
        errorMsg = 'Cannot connect to database. Please verify your MongoDB connection settings.';
      } else {
        errorMsg = err.message || errorMsg;
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setName(course.name);
    setDescription(course.description || '');
    
    // Load schedule
    if (course.schedule?.days) {
      setDaySchedules(course.schedule.days);
    } else if (course.schedule?.weekdays && course.schedule?.startTime && course.schedule?.endTime) {
      // Convert legacy format to new format
      const legacySchedule: Record<number, { startTime: string; endTime: string }> = {};
      course.schedule.weekdays.forEach((day: number) => {
        legacySchedule[day] = {
          startTime: course.schedule.startTime,
          endTime: course.schedule.endTime,
        };
      });
      setDaySchedules(legacySchedule);
    } else {
      setDaySchedules({
        1: { startTime: '09:00', endTime: '11:00' },
        3: { startTime: '09:00', endTime: '11:00' },
      });
    }
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
    setName('');
    setDescription('');
    setDaySchedules({
      1: { startTime: '09:00', endTime: '11:00' },
      3: { startTime: '09:00', endTime: '11:00' },
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await coursesApi.delete(id);
      toast.success('Course deleted successfully!');
      loadCourses();
      setDeleteConfirm(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete course';
      toast.error(errorMsg);
    }
  };

  const selectedDays = Object.keys(daySchedules).map(Number).sort();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            {editingCourse ? 'Edit Course' : 'Register Course'}
          </h1>
          {editingCourse && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Course description..."
              />
            </div>

            {/* Schedule Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Schedule</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select class days and set different times for each day. Default: Monday & Wednesday (9:00 AM - 11:00 AM).
              </p>

              <div className="space-y-4">
                {/* Weekdays Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Days <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = daySchedules[day.value] !== undefined;
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleWeekdayToggle(day.value)}
                          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                          }`}
                        >
                          {day.label.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDays.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one day</p>
                  )}
                </div>

                {/* Per-Day Time Selection */}
                {selectedDays.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Times (Set different times for each day)
                    </label>
                    <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                      {selectedDays.map((day) => {
                        const dayInfo = WEEKDAYS.find(d => d.value === day);
                        const schedule = daySchedules[day];
                        return (
                          <div key={day} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">{dayInfo?.label}</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={schedule.startTime}
                                  onChange={(e) => updateDayTime(day, 'startTime', e.target.value)}
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={schedule.endTime}
                                  onChange={(e) => updateDayTime(day, 'endTime', e.target.value)}
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            {schedule.startTime && schedule.endTime && (
                              <p className="text-xs text-gray-500 mt-2">
                                Duration: {(() => {
                                  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                                  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                                  const startMinutes = startHour * 60 + startMin;
                                  const endMinutes = endHour * 60 + endMin;
                                  const duration = endMinutes - startMinutes;
                                  const hours = Math.floor(duration / 60);
                                  const minutes = duration % 60;
                                  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                                })()}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedDays.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Schedule Summary:</strong>
                    </p>
                    <ul className="text-xs text-blue-600 mt-1 space-y-1">
                      {selectedDays.map((day) => {
                        const dayInfo = WEEKDAYS.find(d => d.value === day);
                        const schedule = daySchedules[day];
                        return (
                          <li key={day}>
                            {dayInfo?.label}: {schedule.startTime} - {schedule.endTime}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="text-xs text-blue-600 mt-2">
                      Check-in opens 30 minutes before each class starts
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || selectedDays.length === 0}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (editingCourse ? 'Updating...' : 'Creating...') : (editingCourse ? 'Update Course' : 'Create Course')}
            </button>
          </form>
        </div>

        {/* Existing Courses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Courses</h2>
          {courses.length > 0 ? (
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{course.name}</h3>
                      {course.description && (
                        <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                      )}
                      {course.schedule && (
                        <div className="mt-3 text-sm text-gray-600">
                          {course.schedule.days ? (
                            <div>
                              <strong className="text-gray-700">Schedule:</strong>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                {Object.entries(course.schedule.days).map(([day, daySchedule]: [string, any]) => {
                                  const dayInfo = WEEKDAYS.find(d => d.value === Number(day));
                                  return (
                                    <li key={day} className="text-gray-600">
                                      {dayInfo?.label}: {daySchedule.startTime} - {daySchedule.endTime}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : course.schedule.weekdays ? (
                            <p>
                              <strong className="text-gray-700">Schedule:</strong> {course.schedule.weekdays.map((d: number) => 
                                WEEKDAYS.find(w => w.value === d)?.label
                              ).join(', ')} 
                              {' '}from {course.schedule.startTime} to {course.schedule.endTime}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(course)}
                        className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        title="Edit course"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(course._id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        title="Delete course"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Delete Confirmation */}
                  {deleteConfirm === course._id && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 mb-3">
                        Are you sure you want to delete <strong>{course.name}</strong>? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(course._id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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
