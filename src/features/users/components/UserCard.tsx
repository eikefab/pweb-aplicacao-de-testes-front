import { useState } from 'react'
import { Mail, User as UserIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EditUserModal } from './EditUserModal'

interface User {
  id: string
  name: string
  email: string
  createdAt?: string
}

interface UserCardProps {
  user: User
  onUpdate: () => void
}

export function UserCard({ user, onUpdate }: UserCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <>
      <Card 
        className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer"
        onClick={() => setIsEditModalOpen(true)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-full">
              <UserIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-2 truncate">
                {user.name}
              </h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail size={16} />
                <span className="truncate">{user.email}</span>
              </div>
              {user.createdAt && (
                <p className="text-gray-500 text-xs mt-2">
                  Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onUpdate}
        user={user}
      />
    </>
  )
}
