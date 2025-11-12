import { memo } from 'react'
import { UserCard } from './UserCard'

interface User {
  id: string
  name: string
  email: string
  createdAt?: string
}

interface UserListProps {
  users: User[]
  onUpdate: () => void
}

export const UserList = memo(function UserList({ users, onUpdate }: UserListProps) {
  if (users.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
})
