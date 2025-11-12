import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { api, ApiError } from '../lib/api'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (response: { token: string }) => void
}

export default function RegisterModal({ isOpen, onClose, onSuccess }: RegisterModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const registerMutation = useMutation({
    mutationFn: async (credentials: { name: string; email: string; password: string }) => {
      return api.post<{ token: string }>('/auth/register', credentials)
    },
    onSuccess: (response) => {
      onClose()
      onSuccess?.(response)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate({ name, email, password })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-slate-800/95 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Criar Usuário</h2>
          <p className="text-gray-400 text-sm">Preencha os dados do novo usuário</p>
        </div>

        {registerMutation.isError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {registerMutation.error instanceof ApiError 
              ? registerMutation.error.message 
              : 'Falha ao criar usuário. Tente novamente.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Nome completo"
              required
              disabled={registerMutation.isPending}
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="email@exemplo.com"
              required
              disabled={registerMutation.isPending}
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Senha do usuário"
                required
                minLength={6}
                disabled={registerMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                disabled={registerMutation.isPending}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {registerMutation.isPending ? 'Criando...' : 'Criar Usuário'}
          </button>
        </form>
      </div>
    </div>
  )
}
