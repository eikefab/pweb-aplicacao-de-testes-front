import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { auth } from '../lib/auth'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authentication on mount
    setIsAuthenticated(auth.isAuthenticated())
  }, [])

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Render home content if authenticated
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Your App
          </h1>
          <p className="text-xl text-gray-300">
            This is your home screen. Start building your application here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Dashboard
            </h2>
            <p className="text-gray-400">
              View your dashboard and analytics
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Profile
            </h2>
            <p className="text-gray-400">
              Manage your profile settings
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Settings
            </h2>
            <p className="text-gray-400">
              Configure your preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}