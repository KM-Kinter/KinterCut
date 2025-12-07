import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getLinkDetails, deleteLink } from '../api/api'

function LinkDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [link, setLink] = useState(null)
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchDetails()
    }, [id])

    const fetchDetails = async () => {
        try {
            const data = await getLinkDetails(id)
            setLink(data.link)
            setStats(data.stats)
        } catch (err) {
            setError('Failed to fetch link details')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) return

        setDeleting(true)
        try {
            await deleteLink(id)
            navigate('/admin/dashboard')
        } catch (err) {
            setError('Failed to delete link')
            setDeleting(false)
        }
    }

    const handleCopy = async () => {
        if (link?.slug) {
            await navigator.clipboard.writeText(`https://go.kinter.one/${link.slug}`)
            alert('Link copied!')
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    const formatShortDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (error || !link) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass-card text-center max-w-md">
                    <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-dark-100 mb-2">Error</h2>
                    <p className="text-dark-400 mb-6">{error || 'Link not found'}</p>
                    <Link to="/adminek/dashboard" className="btn-primary py-2 px-6">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b border-dark-800">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link to="/adminek/dashboard" className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Link info */}
                <div className="glass-card mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold gradient-text">/{link.slug}</h1>
                                <span className="badge-success">Permanent</span>
                            </div>
                            <p className="text-dark-400 text-sm truncate max-w-xl" title={link.original_url}>
                                → {link.original_url}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleCopy} className="btn-secondary py-2 px-4">
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy Link
                                </span>
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn-danger py-2 px-4 disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete Link'}
                            </button>
                        </div>
                    </div>

                    <div className="text-sm text-dark-500">
                        Created: {formatDate(link.created_at)}
                    </div>
                </div>

                {/* Stats overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="stat-card">
                        <div className="stat-value">{stats?.total_clicks || 0}</div>
                        <div className="stat-label">Total Clicks</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats?.unique_ips || 0}</div>
                        <div className="stat-label">Unique IPs</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats?.top_countries?.length || 0}</div>
                        <div className="stat-label">Countries</div>
                    </div>
                </div>

                {/* Top countries */}
                {stats?.top_countries?.length > 0 && (
                    <div className="glass-card mb-8">
                        <h2 className="text-lg font-semibold text-dark-100 mb-4">Top Countries</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {stats.top_countries.map((country, index) => (
                                <div key={index} className="bg-dark-800/50 rounded-xl p-4 text-center">
                                    <div className="text-xl font-bold text-dark-100">{country.count}</div>
                                    <div className="text-sm text-dark-400 truncate" title={country.country}>
                                        {country.country || 'Unknown'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent clicks */}
                <div className="glass-card">
                    <h2 className="text-lg font-semibold text-dark-100 mb-4">Click History</h2>

                    {!stats?.recent_clicks?.length ? (
                        <div className="text-center py-12 text-dark-400">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            <p>No clicks yet</p>
                            <p className="text-sm mt-1">This link has not been clicked yet</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>IP</th>
                                        <th>Location</th>
                                        <th>Browser / OS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_clicks.map((click) => (
                                        <tr key={click.id}>
                                            <td className="text-dark-300 whitespace-nowrap">
                                                {formatShortDate(click.clicked_at)}
                                            </td>
                                            <td className="font-mono text-sm text-dark-400">
                                                {click.ip_address}
                                            </td>
                                            <td>
                                                <span className="text-dark-300">
                                                    {click.city && click.city !== 'Unknown' ? `${click.city}, ` : ''}
                                                    {click.country || 'Unknown'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="block max-w-xs truncate text-dark-400 text-sm" title={click.user_agent}>
                                                    {parseUserAgent(click.user_agent)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

// Simple user agent parser
function parseUserAgent(ua) {
    if (!ua) return 'Unknown'

    let browser = 'Unknown Browser'
    let os = ''

    // Browser detection
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Edg')) browser = 'Edge'
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

    // OS detection
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac OS')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

    return `${browser}${os ? ' / ' + os : ''}`
}

export default LinkDetails
