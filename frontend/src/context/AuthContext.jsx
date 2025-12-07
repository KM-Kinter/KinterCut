import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for existing token on mount
        const storedToken = localStorage.getItem('admin_token')
        const expiresAt = localStorage.getItem('token_expires_at')

        if (storedToken && expiresAt) {
            const isExpired = Date.now() > parseInt(expiresAt) * 1000
            if (!isExpired) {
                setToken(storedToken)
            } else {
                localStorage.removeItem('admin_token')
                localStorage.removeItem('token_expires_at')
            }
        }
        setLoading(false)
    }, [])

    const login = (newToken, expiresAt) => {
        localStorage.setItem('admin_token', newToken)
        localStorage.setItem('token_expires_at', expiresAt.toString())
        setToken(newToken)
    }

    const logout = () => {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('token_expires_at')
        setToken(null)
    }

    const value = {
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
