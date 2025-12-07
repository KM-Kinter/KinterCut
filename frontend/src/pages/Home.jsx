import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { shortenLink, saveUserLink, getUserLinkHistory, removeUserLink } from '../api/api'

function Home() {
    const [url, setUrl] = useState('')
    const [customSlug, setCustomSlug] = useState('')
    const [shortUrl, setShortUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [userLinks, setUserLinks] = useState([])

    useEffect(() => {
        setUserLinks(getUserLinkHistory())
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setShortUrl(null)

        if (!url.trim()) {
            setError('Please enter a URL')
            return
        }

        // Add protocol if missing
        let processedUrl = url.trim()
        if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
            processedUrl = 'https://' + processedUrl
        }

        setLoading(true)
        try {
            // Use custom slug if provided, otherwise random
            const result = await shortenLink(processedUrl, customSlug.trim() || '')
            setShortUrl(result)
            saveUserLink(result)
            setUserLinks(getUserLinkHistory())
            setUrl('')
            setCustomSlug('')
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to shorten link. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async (linkUrl) => {
        await navigator.clipboard.writeText(linkUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRemoveLink = (id) => {
        removeUserLink(id)
        setUserLinks(getUserLinkHistory())
    }

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Header */}
            <header className="relative z-10 py-4 sm:py-6 px-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <span className="text-lg sm:text-xl font-semibold gradient-text">KinterCut</span>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-12">
                <div className="w-full max-w-2xl">
                    {/* Hero */}
                    <div className="text-center mb-8 sm:mb-12 animate-fade-in">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                            <span className="gradient-text">Shorten your link</span>
                            <br />
                            <span className="text-dark-100">in seconds</span>
                        </h1>
                        <p className="text-dark-400 text-base sm:text-lg max-w-lg mx-auto px-2">
                            Fast, reliable, and secure link shortening.
                            Create short, memorable URLs in an instant.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="animate-slide-up">
                        <div className="glass-card p-4 sm:p-6">
                            <div className="flex flex-col gap-3 sm:gap-4">
                                {/* URL input */}
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-1.5 sm:mb-2">
                                        URL to shorten
                                    </label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/long-url..."
                                        className="input text-base sm:text-lg py-3 sm:py-4 px-4"
                                        disabled={loading}
                                    />
                                </div>

                                {/* Custom slug input */}
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-1.5 sm:mb-2">
                                        Custom slug <span className="text-dark-500">(optional)</span>
                                    </label>
                                    <div className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-dark-800/50 border border-dark-600 rounded-xl">
                                        <span className="text-dark-400 text-xs sm:text-sm whitespace-nowrap">go.kinter.one/</span>
                                        <input
                                            type="text"
                                            value={customSlug}
                                            onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                            placeholder="custom-slug"
                                            className="flex-1 min-w-0 bg-transparent border-none outline-none text-dark-100 font-mono text-sm sm:text-base placeholder-dark-500"
                                            maxLength={30}
                                            disabled={loading}
                                        />
                                    </div>
                                    <p className="text-xs text-dark-500 mt-1">
                                        Leave empty for a random slug
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Shortening...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Shorten
                                        </span>
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Result */}
                    {shortUrl && (
                        <div className="mt-4 sm:mt-6 glass-card p-4 sm:p-6 animate-slide-up">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                                <span className="text-sm text-dark-400">Your shortened link:</span>
                                {shortUrl.permanent ? (
                                    <span className="badge-success self-start sm:self-auto">Permanent</span>
                                ) : (
                                    <span className="badge-warning self-start sm:self-auto">Expires in 48h</span>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 bg-dark-800/50 rounded-xl">
                                <a
                                    href={shortUrl.short_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-base sm:text-lg font-mono text-primary-400 hover:text-primary-300 truncate"
                                >
                                    {shortUrl.short_url}
                                </a>
                                <button
                                    onClick={() => handleCopy(shortUrl.short_url)}
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
                                <span className="block truncate">Original: {shortUrl.original_url}</span>
                            </div>
                        </div>
                    )}

                    {/* User's recent links */}
                    {userLinks.length > 0 && (
                        <div className="mt-6 sm:mt-8 glass-card p-4 sm:p-6 animate-fade-in">
                            <h2 className="text-base sm:text-lg font-semibold text-dark-100 mb-3 sm:mb-4">Your Recent Links</h2>
                            <div className="space-y-2 sm:space-y-3">
                                {userLinks.slice(0, 5).map((link) => (
                                    <div key={link.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-dark-800/50 rounded-xl">
                                        <div className="flex-1 min-w-0">
                                            <a
                                                href={link.short_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block font-mono text-xs sm:text-sm text-primary-400 hover:text-primary-300 truncate"
                                            >
                                                /{link.slug}
                                            </a>
                                            <span className="block text-xs text-dark-500 truncate" title={link.original_url}>
                                                {link.original_url}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                            {link.expires_at && (
                                                <span className="hidden sm:block text-xs text-dark-500 whitespace-nowrap">
                                                    {new Date(link.expires_at).toLocaleDateString()}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleCopy(link.short_url)}
                                                className="p-1.5 sm:p-2 text-dark-400 hover:text-dark-200 transition-colors"
                                                title="Copy"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveLink(link.id)}
                                                className="p-1.5 sm:p-2 text-dark-400 hover:text-red-400 transition-colors"
                                                title="Remove from history"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-dark-500 text-center">
                                Links removed by admin won't work. Remove them from your history if needed.
                            </p>
                        </div>
                    )}

                    {/* Features */}
                    <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
                        <div className="text-center p-4 sm:p-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-dark-100 mb-1 sm:mb-2 text-sm sm:text-base">Lightning Fast</h3>
                            <p className="text-xs sm:text-sm text-dark-400">Instant redirects with no delays.</p>
                        </div>
                        <div className="text-center p-4 sm:p-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-dark-100 mb-1 sm:mb-2 text-sm sm:text-base">Custom Slugs</h3>
                            <p className="text-xs sm:text-sm text-dark-400">Create memorable custom links.</p>
                        </div>
                        <div className="text-center p-4 sm:p-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-dark-100 mb-1 sm:mb-2 text-sm sm:text-base">Analytics</h3>
                            <p className="text-xs sm:text-sm text-dark-400">Track your link performance.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-4 sm:py-6 px-4 text-center text-dark-500 text-xs sm:text-sm">
                <p>Made with ❤️ by <a href="https://kinter.one" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 transition-colors">Kinter</a></p>
            </footer>
        </div>
    )
}

export default Home
