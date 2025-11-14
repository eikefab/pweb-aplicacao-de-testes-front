import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '../lib/api'
import { auth } from '../lib/auth'
import { ErrorDisplay } from './ErrorDisplay'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (response: {
    user: { id: string; email: string; name: string }
    token: string
  }) => void
}

export default function RegisterModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const registerMutation = useMutation({
    mutationFn: async (credentials: {
      name: string
      email: string
      password: string
    }) => {
      return api.post<{
        user: { id: string; email: string; name: string }
        token: string
      }>('/auth/register', credentials)
    },
    onSuccess: (response) => {
      auth.setUserId(response.user.id)
      onClose()
      onSuccess?.(response)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate({ name, email, password })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">Criar Usuário</DialogTitle>
          <DialogDescription className="text-gray-400">
            Preencha os dados do novo usuário
          </DialogDescription>
        </DialogHeader>

        <ErrorDisplay
          error={registerMutation.error}
          fallbackMessage="Falha ao criar usuário. Tente novamente."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
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
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
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
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
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
      </DialogContent>
    </Dialog>
  )
}
