import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { auth } from '../lib/auth'
import { api } from '../lib/api'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return api.post<{ token: string }>('/auth/login', credentials)
    },
    onSuccess: (response) => {
      auth.setToken(response.token)
      navigate({ to: '/' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>
        
        {loginMutation.isError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {loginMutation.error?.message || 'Login failed. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter your email"
              required
              disabled={loginMutation.isPending}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter your password"
              required
              disabled={loginMutation.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <a href="#" className="text-cyan-400 hover:text-cyan-300">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
