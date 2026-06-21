import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { CategoriesList } from './pages/locations/CategoriesList'
import { CategoryLocationList } from './pages/locations/CategoryLocationList'
import { LocationDetail } from './pages/locations/LocationDetail'
import { Users } from './pages/admin/Users'
import { Catalog } from './pages/admin/Catalog'
import { ChangePassword } from './pages/ChangePassword'
import { ActionsPage } from './pages/actions/ActionsPage'
import { ActionDetail } from './pages/actions/ActionDetail'
import { ActionFormPage } from './pages/actions/ActionFormPage'
import { MaterialsPage } from './pages/materials/MaterialsPage'
import { LocationsMapPage } from './pages/locations/LocationsMapPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/change-password" element={<ChangePassword />} />
              <Route element={<Layout />}>
                <Route path="/" element={<CategoriesList />} />
                <Route path="/categories/:id" element={<CategoryLocationList />} />
                <Route path="/locations/:id" element={<LocationDetail />} />
                <Route path="/actions" element={<ActionsPage />} />
                <Route path="/actions/new" element={<ActionFormPage />} />
                <Route path="/actions/:id" element={<ActionDetail />} />
                <Route path="/map" element={<LocationsMapPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/admin" element={<Users />} />
                <Route path="/admin/catalog" element={<Catalog />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
