import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyLinks, getUserLinks, createAdminLink, deleteLink, getLoginAttempts } from '../api/api'
import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
    const [myLinks, setMyLinks] = useState([])
    const [userLinks, setUserLinks] = useState([])
    const [loginAttempts, setLoginAttempts] = useState([])
    const [failedLast24h, setFailedLast24h] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [customSlug, setCustomSlug] = useState('')
    const [creating, setCreating] = useState(false)
    const [deleting, setDeleting] = useState(null)
    const [activeTab, setActiveTab] = useState('my')
    const [createdLink, setCreatedLink] = useState(null)
    const [copied, setCopied] = useState(false)
    const { logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [myData, usersData, loginsData] = await Promise.all([
                getMyLinks(),
                getUserLinks(),
                getLoginAttempts()
            ])
            setMyLinks(myData.links || [])
            setUserLinks(usersData.links || [])
            setLoginAttempts(loginsData.attempts || [])
            setFailedLast24h(loginsData.failed_last_24h || 0)
        } catch (err) {
            setError('Failed to fetch data')
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
            const result = await createAdminLink(processedUrl, customSlug.trim())
            setCreatedLink(result)
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
        navigate('/admin')
    }

    const handleCopy = async (url) => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-8">
                    <div className="stat-card p-3 sm:p-4">
                        <div className="stat-value text-xl sm:text-2xl">{myLinks.length}</div>
                        <div className="stat-label text-xs">My Links</div>
                    </div>
                    <div className="stat-card p-3 sm:p-4">
                        <div className="stat-value text-xl sm:text-2xl">{totalMyClicks}</div>
                        <div className="stat-label text-xs">My Clicks</div>
                    </div>
                    <div className="stat-card p-3 sm:p-4">
                        <div className="stat-value text-xl sm:text-2xl">{userLinks.length}</div>
                        <div className="stat-label text-xs">User Links</div>
                    </div>
                    <div className="stat-card p-3 sm:p-4">
                        <div className="stat-value text-xl sm:text-2xl">{totalUserClicks}</div>
                        <div className="stat-label text-xs">User Clicks</div>
                    </div>
                    <div className={`stat-card p-3 sm:p-4 col-span-2 sm:col-span-1 ${failedLast24h > 0 ? 'border-red-500/50' : ''}`}>
                        <div className={`stat-value text-xl sm:text-2xl ${failedLast24h > 0 ? 'text-red-400' : ''}`}>{failedLast24h}</div>
                        <div className="stat-label text-xs">Failed Logins (24h)</div>
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
                                {creating ? 'Creating...' : 'Create Link'}
                            </button>
                        </div>
                    </form>

                    {/* Created Link Result */}
                    {createdLink && (
                        <div className="mt-4 sm:mt-6 glass-card p-4 sm:p-6 animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                                <span className="text-sm text-dark-400">Your shortened link:</span>
                                <span className="badge-success self-start sm:self-auto">Permanent</span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 bg-dark-800/50 rounded-xl">
                                <a
                                    href={createdLink.short_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-base sm:text-lg font-mono text-primary-400 hover:text-primary-300 truncate"
                                >
                                    {createdLink.short_url}
                                </a>
                                <button
                                    onClick={() => handleCopy(createdLink.short_url)}
                                    className="btn-secondary py-2 px-4 text-sm self-end sm:self-auto"
                                >
                                    {copied ? (
                                        <span className="flex items-center gap-1 text-green-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Copied!
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="mt-3 sm:mt-4 text-sm text-dark-500">
                                <span className="block truncate">Original: {createdLink.original_url}</span>
                            </div>
                        </div>
                    )}
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
                        className={`py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'my' ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                            }`}
                    >
                        My ({myLinks.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'users' ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                            }`}
                    >
                        Users ({userLinks.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('logins')}
                        className={`py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'logins' ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                            } ${failedLast24h > 0 ? 'ring-2 ring-red-500/50' : ''}`}
                    >
                        Logins {failedLast24h > 0 && <span className="ml-1 text-red-400">⚠</span>}
                    </button>
                </div>

                {/* Content based on active tab */}
                <div className="glass-card p-4 sm:p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    ) : activeTab === 'logins' ? (
                        /* Logins Tab */
                        <>
                            <h2 className="text-base sm:text-lg font-semibold text-dark-100 mb-3 sm:mb-4">Login History</h2>
                            {loginAttempts.length === 0 ? (
                                <div className="text-center py-8 text-dark-400">
                                    <p>No login attempts yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2 sm:space-y-3">
                                    {loginAttempts.map((attempt) => (
                                        <div
                                            key={attempt.id}
                                            className={`p-3 sm:p-4 rounded-xl ${attempt.success
                                                ? 'bg-green-500/10 border border-green-500/30'
                                                : 'bg-red-500/10 border border-red-500/30'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    {attempt.success ? (
                                                        <span className="text-green-400 text-sm font-medium">✓ Success</span>
                                                    ) : (
                                                        <span className="text-red-400 text-sm font-medium">✗ Failed</span>
                                                    )}
                                                    <span className="text-dark-300 text-sm">@{attempt.username}</span>
                                                </div>
                                                <span className="text-xs text-dark-500 whitespace-nowrap">
                                                    {formatDate(attempt.created_at)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-dark-400 space-y-1">
                                                <p><span className="text-dark-500">IP:</span> <span className="font-mono">{attempt.ip_address}</span></p>
                                                <p className="truncate" title={attempt.user_agent}>
                                                    <span className="text-dark-500">UA:</span> {attempt.user_agent}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Links Tab */
                        <>
                            <h2 className="text-base sm:text-lg font-semibold text-dark-100 mb-3 sm:mb-4">
                                {activeTab === 'my' ? 'My Links' : 'User Links'}
                            </h2>
                            {(activeTab === 'my' ? myLinks : userLinks).length === 0 ? (
                                <div className="text-center py-8 text-dark-400">
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
                                                <div className="flex items-center gap-2 text-xs text-dark-500">
                                                    <span>{formatDate(link.created_at)}</span>
                                                    {link.expires_at && (
                                                        <span className="text-yellow-500" title={`Expires: ${new Date(link.expires_at).toLocaleString()}`}>
                                                            → {new Date(link.expires_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {/* Copy button */}
                                                    <button
                                                        onClick={() => handleCopy(`https://go.kinter.one/${link.slug}`)}
                                                        className="p-1.5 sm:p-2 text-dark-400 hover:text-dark-200 transition-colors"
                                                        title="Copy link"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    {/* Details button */}
                                                    <Link
                                                        to={`/admin/links/${link.id}`}
                                                        className="p-1.5 sm:p-2 text-dark-400 hover:text-primary-400 transition-colors"
                                                        title="View details"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                    </Link>
                                                    {/* Delete button */}
                                                    <button
                                                        onClick={() => handleDelete(link.id, activeTab === 'users')}
                                                        disabled={deleting === link.id}
                                                        className="p-1.5 sm:p-2 text-dark-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                                        title="Delete link"
                                                    >
                                                        {deleting === link.id ? (
                                                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

export default AdminDashboard
