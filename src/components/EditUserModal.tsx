import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorDisplay } from './ErrorDisplay'

interface User {
  id: string
  name: string
  email: string
}

interface EditUser {
  name?: string
  email?: string
  password?: string
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  user: User | null
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const deleteUserMutation = useMutation({
    mutationKey: ['users', user?.id, 'delete'],
    mutationFn: () => api.delete(`users/${user?.id}`),
  })

  const editUserMutation = useMutation({
    mutationFn: async (data: EditUser) => {
      if (!data.password?.trim() && !data.email?.trim() && !data.name?.trim()) {
        throw new Error('Nenhum dado para atualizar.')
      }

      const filteredData: EditUser = {}
      if (data.name && data.name.trim()) filteredData.name = data.name
      if (data.email && data.email.trim()) filteredData.email = data.email
      if (data.password && data.password.trim())
        filteredData.password = data.password
      return api.patch(`/users/${user?.id}`, filteredData)
    },
    onSuccess: () => {
      onClose()
      onSuccess?.()
      setPassword('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    editUserMutation.mutate({ name, email, password })
  }

  function handleDelete() {
    deleteUserMutation.mutate()
    onClose()
    onSuccess?.()
  }

  if (!isOpen || !user) return null

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
          <h2 className="text-3xl font-bold text-white mb-2">Editar Usuário</h2>
          <p className="text-gray-400 text-sm">
            Atualize os dados do usuário - {user?.name}
          </p>
        </div>

        <ErrorDisplay
          error={editUserMutation.error}
          fallbackMessage="Falha ao editar usuário. Tente novamente."
        />

        <ErrorDisplay
          error={deleteUserMutation.error}
          fallbackMessage="Falha ao excluir usuário. Tente novamente."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Nome
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Nome completo"
              disabled={editUserMutation.isPending}
            />
          </div>

          <div>
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="email@exemplo.com"
              required
              disabled={editUserMutation.isPending}
            />
          </div>

          <div>
            <label
              htmlFor="edit-password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Nova Senha{' '}
              <span className="text-gray-500">
                (deixe em branco para não alterar)
              </span>
            </label>
            <div className="relative">
              <input
                id="edit-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Nova senha (opcional)"
                disabled={editUserMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                disabled={editUserMutation.isPending}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={editUserMutation.isPending}
            className="w-full flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {editUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
