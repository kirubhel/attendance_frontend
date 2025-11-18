'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    presentToday: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real stats from API
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        const total = data.stats?.totalStudents || 0;
        const active = data.stats?.activeStudents || 0;
        const present = data.stats?.presentToday || 0;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        setStats({
          totalStudents: total,
          activeStudents: active,
          presentToday: present,
          attendanceRate: rate,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Attendance System
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-indigo-600 px-4 py-2 font-medium transition-colors"
              >
                Login
              </Link>
              <button
                onClick={() => router.push('/login')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Modern Attendance
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Management System
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline student attendance tracking with QR codes, automated warnings, and real-time analytics. 
            Built for educators who value efficiency and accuracy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/login')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors font-semibold text-lg"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Hero Image/Illustration with Real Data */}
        <div className="mt-16 flex justify-center">
          <div className="relative w-full max-w-4xl">
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-indigo-200 rounded w-20 mb-2"></div>
                        <div className="h-4 bg-indigo-200 rounded w-24"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-indigo-600 mb-1">
                          {stats.totalStudents.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Total Students</div>
                      </>
                    )}
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-green-200 rounded w-16 mb-2"></div>
                        <div className="h-4 bg-green-200 rounded w-28"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-green-600 mb-1">
                          {stats.attendanceRate}%
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Attendance Rate</div>
                      </>
                    )}
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-purple-200 rounded w-16 mb-2"></div>
                        <div className="h-4 bg-purple-200 rounded w-20"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-purple-600 mb-1">
                          {stats.presentToday}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Present Today</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage student attendance efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Attendance</h3>
            <p className="text-gray-600">
              Quick and contactless attendance tracking using QR codes. Students check in/out with a simple scan.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Automated Warnings</h3>
            <p className="text-gray-600">
              Automatic email notifications when students are absent. Smart tracking prevents attendance issues.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Dashboard</h3>
            <p className="text-gray-600">
              Comprehensive dashboard with live statistics, attendance reports, and student management tools.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile Responsive</h3>
            <p className="text-gray-600">
              Fully optimized for mobile devices. Scan QR codes and manage attendance from any device, anywhere.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Notifications</h3>
            <p className="text-gray-600">
              Automatic email delivery of QR codes, absence warnings, and important notifications to students.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">
              Built with security in mind. JWT authentication, encrypted data, and reliable cloud infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Register Students</h3>
              <p className="text-gray-600">
                Add students to your system. QR codes are automatically generated and sent via email.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Scan QR Codes</h3>
              <p className="text-gray-600">
                Students scan their QR codes to check in. First scan marks attendance, second scan checks out.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Track & Manage</h3>
              <p className="text-gray-600">
                Monitor attendance in real-time. Get automated warnings and insights on your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Attendance Management?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join hundreds of educators who are already using Attendance System to streamline their attendance tracking.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Attendance System</h3>
              <p className="text-sm">
                Modern attendance management for educational institutions.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Attendance System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
