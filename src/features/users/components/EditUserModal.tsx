import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { ConfirmDialog } from '@/components/ConfirmDialog'

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

export function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const currentUserId = auth.getUserId()
  const isCurrentUser = user?.id === currentUserId

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPassword('')
    }
  }, [user])

  const deleteUserMutation = useMutation({
    mutationFn: () => api.delete(`/users/${user?.id}`),
    onSuccess: () => {
      onClose()
      onSuccess?.()
    },
  })

  const editUserMutation = useMutation({
    mutationFn: async (data: EditUser) => {
      const updates: EditUser = {}

      if (data.name && data.name.trim() && data.name !== user?.name) {
        updates.name = data.name
      }

      if (data.email && data.email.trim() && data.email !== user?.email) {
        updates.email = data.email
      }

      if (data.password && data.password.trim()) {
        updates.password = data.password
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('Nenhum dado para atualizar.')
      }

      return api.patch(`/users/${user?.id}`, updates)
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

  const handleDelete = () => {
    if (isCurrentUser) return
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    deleteUserMutation.mutate()
    setIsDeleteDialogOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Usuário</DialogTitle>
          <DialogDescription className="text-gray-400">
            Atualize os dados do usuário - {user?.name}
          </DialogDescription>
        </DialogHeader>

        <ErrorDisplay
          error={editUserMutation.error}
          fallbackMessage="Falha ao editar usuário. Tente novamente."
        />

        <ErrorDisplay
          error={deleteUserMutation.error}
          fallbackMessage="Falha ao excluir usuário. Tente novamente."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              disabled={editUserMutation.isPending}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
              disabled={editUserMutation.isPending}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">
              Nova Senha{' '}
              <span className="text-gray-500 text-xs">
                (deixe em branco para não alterar)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nova senha (opcional)"
                disabled={editUserMutation.isPending}
                className="bg-slate-700 border-slate-600 text-white pr-12"
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

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={editUserMutation.isPending}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600"
            >
              {editUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            {!isCurrentUser && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={deleteUserMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 size={18} />
              </Button>
            )}
          </div>
        </form>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Excluir Usuário"
          description={`Tem certeza que deseja excluir o usuário ${user?.name}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          isLoading={deleteUserMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
