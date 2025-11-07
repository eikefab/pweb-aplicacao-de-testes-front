// API utility for making authenticated requests
import { auth } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generic API request function
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...auth.getAuthHeaders(), // Automatically adds token
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      auth.removeToken()
      window.location.href = '/login'
      throw new ApiError(401, 'Unauthorized')
    }

    // Parse response
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.message || 'Request failed',
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Network error')
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}

// Example usage in your components:
// const data = await api.get('/users/me')
// const result = await api.post('/login', { email, password })
