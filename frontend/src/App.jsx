import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import LinkDetails from './pages/LinkDetails'
import LinkExpired from './pages/LinkExpired'
import LinkNotFound from './pages/LinkNotFound'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin" replace />
    }

    return children
}

function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-dark-950">
                {/* Background gradient effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
                </div>

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/links/:id" element={
                        <ProtectedRoute>
                            <LinkDetails />
                        </ProtectedRoute>
                    } />
                    <Route path="/expired" element={<LinkExpired />} />
                    <Route path="/not-found" element={<LinkNotFound />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </AuthProvider>
    )
}

export default App
