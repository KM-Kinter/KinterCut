import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyLinks, getUserLinks, createAdminLink, deleteLink } from '../api/api'
import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
    const [myLinks, setMyLinks] = useState([])
    const [userLinks, setUserLinks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [customSlug, setCustomSlug] = useState('')
    const [creating, setCreating] = useState(false)
    const [deleting, setDeleting] = useState(null)
    const [activeTab, setActiveTab] = useState('my')
    const { logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [myData, usersData] = await Promise.all([
                getMyLinks(),
                getUserLinks()
            ])
            setMyLinks(myData.links || [])
            setUserLinks(usersData.links || [])
        } catch (err) {
            setError('Failed to fetch statistics')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateLink = async (e) => {
        e.preventDefault()
        if (!newUrl.trim()) return

        let processedUrl = newUrl.trim()
        if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
            processedUrl = 'https://' + processedUrl
        }

        setCreating(true)
        try {
            await createAdminLink(processedUrl, customSlug.trim())
            setNewUrl('')
            setCustomSlug('')
            fetchData()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create link')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id, isUserLink = false) => {
        const message = isUserLink
            ? 'Delete this user link? They may still see it in their browser history.'
            : 'Are you sure you want to delete this link?'
        if (!confirm(message)) return

        setDeleting(id)
        try {
            await deleteLink(id)
            if (isUserLink) {
                setUserLinks(userLinks.filter(link => link.id !== id))
            } else {
                setMyLinks(myLinks.filter(link => link.id !== id))
            }
        } catch (err) {
            setError('Failed to delete link')
        } finally {
            setDeleting(null)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/adminek')
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        })
    }

    const totalMyClicks = myLinks.reduce((sum, link) => sum + (link.click_count || 0), 0)
    const totalUserClicks = userLinks.reduce((sum, link) => sum + (link.click_count || 0), 0)

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b border-dark-800">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link to="/" className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <span className="text-base sm:text-xl font-semibold gradient-text">Admin</span>
                        </Link>
                    </div>
                    <button onClick={handleLogout} className="btn-secondary py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm">
                        <span className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Logout</span>
                        </span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
                    <div className="stat-card p-3 sm:p-6">
                        <div className="stat-value text-xl sm:text-3xl">{myLinks.length}</div>
                        <div className="stat-label text-xs sm:text-sm">My Links</div>
                    </div>
                    <div className="stat-card p-3 sm:p-6">
                        <div className="stat-value text-xl sm:text-3xl">{totalMyClicks}</div>
                        <div className="stat-label text-xs sm:text-sm">My Clicks</div>
                    </div>
                    <div className="stat-card p-3 sm:p-6">
                        <div className="stat-value text-xl sm:text-3xl">{userLinks.length}</div>
                        <div className="stat-label text-xs sm:text-sm">User Links</div>
                    </div>
                    <div className="stat-card p-3 sm:p-6">
                        <div className="stat-value text-xl sm:text-3xl">{totalUserClicks}</div>
                        <div className="stat-label text-xs sm:text-sm">User Clicks</div>
                    </div>
                </div>

                {/* Create new link */}
                <div className="glass-card p-4 sm:p-6 mb-4 sm:mb-8">
                    <h2 className="text-base sm:text-lg font-semibold text-dark-100 mb-3 sm:mb-4">Create Permanent Link</h2>
                    <form onSubmit={handleCreateLink} className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="Paste URL to shorten..."
                                className="input text-sm sm:text-base"
                                disabled={creating}
                            />

                            {/* Custom slug field */}
                            <div className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-dark-800/50 border border-dark-600 rounded-xl">
                                <span className="text-dark-400 text-xs sm:text-sm whitespace-nowrap">go.kinter.one/</span>
                                <input
                                    type="text"
                                    value={customSlug}
                                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                    placeholder="custom-slug (optional)"
                                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-dark-100 font-mono text-sm placeholder-dark-500"
                                    maxLength={30}
                                    disabled={creating}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={creating || !newUrl.trim()}
                                className="btn-primary py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Link
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                        <button onClick={() => setError('')} className="ml-2 underline">Close</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${activeTab === 'my'
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                            }`}
                    >
                        My ({myLinks.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${activeTab === 'users'
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                            }`}
                    >
                        Users ({userLinks.length})
                    </button>
                </div>

                {/* Links - Mobile Card View */}
                <div className="glass-card p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-dark-100 mb-3 sm:mb-4">
                        {activeTab === 'my' ? 'My Links' : 'User Links'}
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    ) : (activeTab === 'my' ? myLinks : userLinks).length === 0 ? (
                        <div className="text-center py-8 sm:py-12 text-dark-400">
                            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <p className="text-sm sm:text-base">No links yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(activeTab === 'my' ? myLinks : userLinks).map((link) => (
                                <div key={link.id} className="p-3 sm:p-4 bg-dark-800/50 rounded-xl">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <a
                                            href={`https://go.kinter.one/${link.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-sm sm:text-base text-primary-400 hover:text-primary-300 truncate"
                                        >
                                            /{link.slug}
                                        </a>
                                        <span className="text-xs sm:text-sm font-semibold text-dark-100 whitespace-nowrap">
                                            {link.click_count || 0} clicks
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-dark-400 truncate mb-2" title={link.original_url}>
                                        {link.original_url}
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-dark-500">
                                            {formatDate(link.created_at)}
                                            {activeTab === 'users' && link.expires_at && (
                                                <> · Exp: {formatDate(link.expires_at)}</>
                                            )}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/adminek/links/${link.id}`}
                                                className="text-xs text-dark-300 hover:text-dark-100 underline"
                                            >
                                                Details
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(link.id, activeTab === 'users')}
                                                disabled={deleting === link.id}
                                                className="text-xs text-red-400 hover:text-red-300 underline disabled:opacity-50"
                                            >
                                                {deleting === link.id ? '...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default AdminDashboard
