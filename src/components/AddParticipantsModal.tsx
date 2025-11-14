import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Users as UsersIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { ErrorDisplay } from './ErrorDisplay'

interface User {
  id: string
  email: string
  name: string
}

interface Assignee {
  id: string
  userId: string
  testId: string
  user?: {
    id: string
    email: string
    name: string
  }
}

interface AddParticipantsModalProps {
  isOpen: boolean
  onClose: () => void
  testId: string
  createdBy?: string
  onSuccess?: () => void
}

export function AddParticipantsModal({
  isOpen,
  onClose,
  testId,
  createdBy,
  onSuccess,
}: AddParticipantsModalProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [initialAssignedIds, setInitialAssignedIds] = useState<Set<string>>(
    new Set(),
  )

  // Fetch all users
  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
    enabled: isOpen,
  })

  // Fetch current assignees
  const { data: assignees, isLoading: assigneesLoading } = useQuery<Assignee[]>(
    {
      queryKey: ['assignees', testId],
      queryFn: () => api.get(`/tests/${testId}/assignees`),
      enabled: isOpen,
    },
  )

  // Initialize selected users when data loads
  useEffect(() => {
    if (assignees) {
      const assignedIds = new Set(assignees.map((a) => a.userId))
      setSelectedUserIds(assignedIds)
      setInitialAssignedIds(assignedIds)
    }
  }, [assignees])

  // Add participant mutation
  const addMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/tests/${testId}/assign`, { userId }),
  })

  // Remove participant mutation
  const removeMutation = useMutation({
    mutationFn: (assigneeId: string) =>
      api.delete(`/tests/${testId}/assignees/${assigneeId}`),
  })

  const handleToggle = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    // Determine which users to add and which to remove
    const toAdd = Array.from(selectedUserIds).filter(
      (id) => !initialAssignedIds.has(id),
    )
    const toRemove = Array.from(initialAssignedIds).filter(
      (id) => !selectedUserIds.has(id),
    )

    try {
      // Add new participants
      const addPromises = toAdd.map((userId) => addMutation.mutateAsync(userId))

      // Remove participants - need to find assignee ID for each userId
      const removePromises = toRemove.map((userId) => {
        const assignee = assignees?.find((a) => a.userId === userId)
        if (assignee) {
          return removeMutation.mutateAsync(assignee.id)
        }
        return Promise.resolve()
      })

      await Promise.all([...addPromises, ...removePromises])

      onSuccess?.()
      onClose()
    } catch (error) {
      // Errors are handled by mutations
      console.error('Error updating participants:', error)
    }
  }

  const handleClose = () => {
    // Reset to initial state on close
    setSelectedUserIds(initialAssignedIds)
    onClose()
  }

  // Filter out logged-in user and test creator
  const loggedUserId = auth.getUserId()
  const availableUsers =
    allUsers?.filter(
      (u) => u.id !== loggedUserId && u.id !== createdBy,
    ) || []

  const isLoading = usersLoading || assigneesLoading
  const isSaving = addMutation.isPending || removeMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Gerenciar Participantes
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Selecione os usuários que podem participar deste teste
          </DialogDescription>
        </DialogHeader>

        <ErrorDisplay
          error={addMutation.error}
          fallbackMessage="Falha ao adicionar participante. Tente novamente."
        />

        <ErrorDisplay
          error={removeMutation.error}
          fallbackMessage="Falha ao remover participante. Tente novamente."
        />

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-300">Carregando usuários...</div>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Nenhum usuário disponível</div>
            </div>
          ) : (
            <div className="space-y-2">
              {availableUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-700/30 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(user.id)}
                    onChange={() => handleToggle(user.id)}
                    disabled={isSaving}
                    className="w-5 h-5 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-cyan-500/20 rounded-full">
                      <UsersIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
