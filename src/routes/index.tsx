import { createFileRoute, Navigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Users,
  FileText,
  BarChart3,
  Share2,
  ClipboardList,
  BookOpen,
} from 'lucide-react'
import { auth } from '../lib/auth'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated())
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12 h-full overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Sistema de Testes
          </h1>
          <p className="text-xl text-gray-300">
            Bem-vindo, escolha uma das opções abaixo para começar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/tests"
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <FileText className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Testes</h2>
            </div>
            <p className="text-gray-300">Gerencie testes no sistema.</p>
          </Link>

          <Link
            to="/users"
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <Users className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Usuários</h2>
            </div>
            <p className="text-gray-300">Gerencie acessos</p>
          </Link>

          <Link
            to="/assigned-tests"
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <ClipboardList className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Meus Testes</h2>
            </div>
            <p className="text-gray-300">Testes atribuídos a você</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
