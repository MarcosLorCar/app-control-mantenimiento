import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

interface RoleGuardProps {
  require: 'write' | 'manage'
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ require, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth()
  if (!user) return <>{fallback}</>
  if (require === 'write' && !user.can_write) return <>{fallback}</>
  if (require === 'manage' && !user.can_manage) return <>{fallback}</>
  return <>{children}</>
}
