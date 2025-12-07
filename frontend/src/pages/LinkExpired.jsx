import { Link } from 'react-router-dom'

function LinkExpired() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md animate-fade-in">
                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                {/* Message */}
                <h1 className="text-3xl font-bold text-dark-100 mb-4">Link Expired</h1>
                <p className="text-dark-400 mb-8 leading-relaxed">
                    Sorry, but this shortened link has expired. Public links are only active for 48 hours after creation.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/" className="btn-primary py-3 px-6">
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Link
                        </span>
                    </Link>
                    <Link to="/" className="btn-secondary py-3 px-6">
                        Home
                    </Link>
                </div>

                {/* Info */}
                <div className="mt-12 p-6 glass-card text-left">
                    <h3 className="font-semibold text-dark-200 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Why do links expire?
                    </h3>
                    <p className="text-dark-400 text-sm leading-relaxed">
                        Public links expire after 48 hours to keep our service fast and secure.
                        If you need permanent links, please contact the administrator.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LinkExpired
