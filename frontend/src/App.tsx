import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { LocationList } from './pages/locations/LocationList'
import { LocationDetail } from './pages/locations/LocationDetail'
import { Users } from './pages/admin/Users'
import { Catalog } from './pages/admin/Catalog'
import { ChangePassword } from './pages/ChangePassword'
import { ActionsPage } from './pages/actions/ActionsPage'
import { MaterialsPage } from './pages/materials/MaterialsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/change-password" element={<ChangePassword />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/locations" element={<LocationList />} />
                <Route path="/locations/:id" element={<LocationDetail />} />
                <Route path="/actions" element={<ActionsPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/admin" element={<Users />} />
                <Route path="/admin/catalog" element={<Catalog />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
