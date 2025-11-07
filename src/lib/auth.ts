// Authentication utility for managing tokens

const TOKEN_KEY = 'authToken'

// Check if we're in the browser (not SSR)
const isBrowser = typeof window !== 'undefined'

export const auth = {
  // Store token (localStorage)
  setToken: (token: string) => {
    if (isBrowser) {
      localStorage.setItem(TOKEN_KEY, token)
    }
  },

  // Get token
  getToken: (): string | null => {
    if (isBrowser) {
      return localStorage.getItem(TOKEN_KEY)
    }
    return null
  },

  // Remove token (logout)
  removeToken: () => {
    if (isBrowser) {
      localStorage.removeItem(TOKEN_KEY)
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (isBrowser) {
      return !!localStorage.getItem(TOKEN_KEY)
    }
    return false
  },

  // Get headers with auth token for API requests
  getAuthHeaders: (): HeadersInit => {
    const token = auth.getToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  },
}

// Alternative: Using sessionStorage (clears on tab close)
export const sessionAuth = {
  setToken: (token: string) => {
    sessionStorage.setItem(TOKEN_KEY, token)
  },

  getToken: (): string | null => {
    return sessionStorage.getItem(TOKEN_KEY)
  },

  removeToken: () => {
    sessionStorage.removeItem(TOKEN_KEY)
  },

  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem(TOKEN_KEY)
  },

  getAuthHeaders: (): HeadersInit => {
    const token = sessionAuth.getToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  },
}

// Alternative: Using cookies (if you want to manage client-side cookies)
export const cookieAuth = {
  setToken: (token: string, days: number = 7) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${TOKEN_KEY}=${token};expires=${expires.toUTCString()};path=/;SameSite=Strict`
  },

  getToken: (): string | null => {
    const name = TOKEN_KEY + '='
    const decodedCookie = decodeURIComponent(document.cookie)
    const cookies = decodedCookie.split(';')
    
    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length)
      }
    }
    return null
  },

  removeToken: () => {
    document.cookie = `${TOKEN_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  },

  isAuthenticated: (): boolean => {
    return !!cookieAuth.getToken()
  },

  getAuthHeaders: (): HeadersInit => {
    const token = cookieAuth.getToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  },
}
