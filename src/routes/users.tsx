import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { UserList, CreateUserModal } from '@/features/users/components'

export const Route = createFileRoute('/users')({ component: Users })

interface User {
  id: string
  name: string
  email: string
}

function Users() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: users, isLoading, refetch } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
  })

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Usuários</h1>
            <p className="text-gray-300">Gerencie os usuários do sistema</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <UserPlus className="mr-2" size={20} />
            Novo Usuário
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white text-xl">Carregando...</div>
          </div>
        ) : users && users.length > 0 ? (
          <UserList users={users} onUpdate={refetch} />
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-400 text-lg mb-4">Nenhum usuário encontrado</div>
            <Button
              variant="link"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Criar o primeiro usuário
            </Button>
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}