import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import * as authApi from '../api/auth'

// Componente auxiliar para exponer el contexto en tests
function TestConsumer() {
  const { user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <button onClick={() => login('test@test.com', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue(null)
  })

  it('empieza sin usuario', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('none'))
  })

  it('actualiza el usuario tras login', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      sub: 1, email: 'admin@test.com', role: 'admin', can_write: true, can_manage: true,
    })
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('admin@test.com'))
  })

  it('limpia el usuario tras logout', async () => {
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue({
      sub: 1, email: 'admin@test.com', role: 'admin', can_write: true, can_manage: true,
    })
    vi.spyOn(authApi, 'logout').mockResolvedValue()
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('admin@test.com'))
    await userEvent.click(screen.getByText('Logout'))
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('none'))
  })
})
