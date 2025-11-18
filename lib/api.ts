const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
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
  getById: (id: string) => apiRequest<any>(`/courses/${id}`),
  create: (name: string, description?: string, schedule?: any) =>
    apiRequest<any>('/courses', {
      method: 'POST',
      body: JSON.stringify({ name, description, schedule }),
    }),
  update: (id: string, name: string, description?: string, schedule?: any) =>
    apiRequest<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description, schedule }),
    }),
  delete: (id: string) =>
    apiRequest<any>(`/courses/${id}`, {
      method: 'DELETE',
    }),
};

// Batches
export const batchesApi = {
  getAll: (courseId?: string) =>
    apiRequest<any[]>(courseId ? `/batches?courseId=${courseId}` : '/batches'),
  getById: (id: string) => apiRequest<any>(`/batches/${id}`),
  create: (name: string, courseId: string) =>
    apiRequest<any>('/batches', {
      method: 'POST',
      body: JSON.stringify({ name, courseId }),
    }),
  update: (id: string, name: string, courseId: string) =>
    apiRequest<any>(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, courseId }),
    }),
  delete: (id: string) =>
    apiRequest<any>(`/batches/${id}`, {
      method: 'DELETE',
    }),
};

// Students
export const studentsApi = {
  getAll: (filters?: { batchId?: string; courseId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.batchId) params.append('batchId', filters.batchId);
    if (filters?.courseId) params.append('courseId', filters.courseId);
    const query = params.toString();
    return apiRequest<any[]>(query ? `/students?${query}` : '/students');
  },
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
  update: (id: string, data: {
    fullname: string;
    phone: string;
    email: string;
    nationalId?: string;
    batchId: string;
  }) =>
    apiRequest<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<any>(`/students/${id}`, {
      method: 'DELETE',
    }),
};

// Attendance
export const attendanceApi = {
  getAll: (date: string, filters?: { courseId?: string; batchId?: string }) => {
    const params = new URLSearchParams();
    params.append('date', date);
    if (filters?.courseId) params.append('courseId', filters.courseId);
    if (filters?.batchId) params.append('batchId', filters.batchId);
    return apiRequest<any[]>(`/attendance?${params.toString()}`);
  },
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

