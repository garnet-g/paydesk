'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-wrapper" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-lg)'
        }}>
            <div className="card" style={{
                maxWidth: '450px',
                width: '100%',
                boxShadow: 'var(--shadow-2xl)',
                animation: 'slideUp 0.5s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                        borderRadius: 'var(--radius-xl)',
                        margin: '0 auto var(--spacing-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                    }}>
                        🎓
                    </div>
                    <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>PayDesk</h1>
                    <p className="text-muted">Sign in to manage school fees</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="principal@school.ac.ke"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>
                        <a href="#" className="text-sm" style={{ color: 'var(--primary-600)' }}>
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.875rem' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <span className="spinner"></span>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>



                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    paddingTop: 'var(--spacing-xl)',
                    borderTop: '1px solid var(--border)',
                    textAlign: 'center'
                }}>
                    <p className="text-sm text-muted">
                        Need help? Contact your school administrator
                    </p>
                </div>
            </div>

            <div style={{
                position: 'fixed',
                bottom: 'var(--spacing-lg)',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                fontSize: '0.875rem',
                opacity: 0.9,
                width: '100%',
                textAlign: 'center'
            }}>
                © 2026 PayDesk.
            </div>

            <style jsx>{`
                @media (max-width: 480px) {
                    h1 { font-size: 1.75rem !important; }
                    .card { padding: var(--spacing-lg) !important; margin: 0 var(--spacing-sm); }
                }
            `}</style>
        </div>
    )
}
