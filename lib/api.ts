const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// Courses
export const coursesApi = {
  getAll: () => apiRequest<any[]>('/courses'),
  create: (name: string, description?: string, schedule?: any) =>
    apiRequest<any>('/courses', {
      method: 'POST',
      body: JSON.stringify({ name, description, schedule }),
    }),
};

// Batches
export const batchesApi = {
  getAll: (courseId?: string) =>
    apiRequest<any[]>(courseId ? `/batches?courseId=${courseId}` : '/batches'),
  create: (name: string, courseId: string) =>
    apiRequest<any>('/batches', {
      method: 'POST',
      body: JSON.stringify({ name, courseId }),
    }),
};

// Students
export const studentsApi = {
  getAll: (batchId?: string) =>
    apiRequest<any[]>(batchId ? `/students?batchId=${batchId}` : '/students'),
  getById: (id: string) => apiRequest<any>(`/students/${id}`),
  create: (data: {
    fullname: string;
    phone: string;
    email: string;
    nationalId?: string;
    batchId: string;
  }) =>
    apiRequest<any>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Attendance
export const attendanceApi = {
  getAll: (date?: string) =>
    apiRequest<any[]>(date ? `/attendance?date=${date}` : '/attendance'),
  checkIn: (studentId: string) =>
    apiRequest<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
};

// QR Scan
export const qrApi = {
  scan: (qrCodeData: string) =>
    apiRequest<any>('/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ qrCodeData }),
    }),
};

// Dashboard
export const dashboardApi = {
  getStats: () => apiRequest<any>('/dashboard'),
};

// Ranking
export const rankingApi = {
  getRankings: () => apiRequest<any[]>('/students/ranking'),
};

// Health/Connection Test
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: string;
}> {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      return {
        success: true,
        message: 'Database connection successful',
        details: data.timestamp,
      };
    } else {
      return {
        success: false,
        message: data.error || 'Database connection failed',
        details: data.timestamp,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: 'Network or server error occurred',
    };
  }
}

