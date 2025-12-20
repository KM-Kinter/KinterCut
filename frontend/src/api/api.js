import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token')
            localStorage.removeItem('token_expires_at')
            window.location.href = '/admin'
        }
        return Promise.reject(error)
    }
)

// Public endpoints
export const shortenLink = async (url, customSlug = '') => {
    const payload = { url }
    if (customSlug) {
        payload.custom_slug = customSlug
    }
    const response = await api.post('/api/shorten', payload)
    return response.data
}

// Admin endpoints
export const adminLogin = async (username, password) => {
    const response = await api.post('/api/admin/login', { username, password })
    return response.data
}

export const getMyLinks = async () => {
    const response = await api.get('/api/admin/my')
    return response.data
}

export const getUserLinks = async () => {
    const response = await api.get('/api/admin/users')
    return response.data
}

export const getLinkDetails = async (id) => {
    const response = await api.get(`/api/admin/links/${id}`)
    return response.data
}

export const deleteLink = async (id) => {
    const response = await api.delete(`/api/admin/links/${id}`)
    return response.data
}

export const createAdminLink = async (url, customSlug = '') => {
    const payload = { url }
    if (customSlug) {
        payload.custom_slug = customSlug
    }
    const response = await api.post('/api/admin/links', payload)
    return response.data
}

export const getLoginAttempts = async () => {
    const response = await api.get('/api/admin/logins')
    return response.data
}

// User link history (localStorage)
export const saveUserLink = (link) => {
    const links = getUserLinkHistory()
    links.unshift({
        ...link,
        savedAt: new Date().toISOString()
    })
    // Keep only last 50 links
    localStorage.setItem('user_links', JSON.stringify(links.slice(0, 50)))
}

export const getUserLinkHistory = () => {
    try {
        const stored = localStorage.getItem('user_links')
        if (!stored) return []
        const links = JSON.parse(stored)
        // Filter out expired links
        const now = new Date()
        return links.filter(link => {
            if (!link.expires_at) return true
            return new Date(link.expires_at) > now
        })
    } catch {
        return []
    }
}

export const removeUserLink = (id) => {
    const links = getUserLinkHistory()
    const filtered = links.filter(link => link.id !== id)
    localStorage.setItem('user_links', JSON.stringify(filtered))
}

export default api
