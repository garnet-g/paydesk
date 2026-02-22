'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'

export default function SchoolLoginPage() {
    const router = useRouter()
    const { schoolCode } = useParams()
    const [school, setSchool] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchingSchool, setFetchingSchool] = useState(true)

    useEffect(() => {
        if (schoolCode) {
            fetchSchool()
        }
    }, [schoolCode])

    const fetchSchool = async () => {
        try {
            const res = await fetch(`/api/schools/by-code/${schoolCode}`)
            if (res.ok) {
                const data = await res.json()
                setSchool(data)
            }
        } catch (err) {
            console.error('Failed to fetch school:', err)
        } finally {
            setFetchingSchool(false)
        }
    }

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

    if (fetchingSchool) {
        return (
            <div className="page-wrapper flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        )
    }

    const schoolName = school?.name || 'PayDesk'
    const brandColor = '#4f46e5' // Could be dynamic if school had a primary color field

    return (
        <div className="page-wrapper" style={{
            background: school ? 'var(--neutral-50)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                animation: 'slideUp 0.5s ease-out',
                background: 'white',
                border: school ? `2px solid var(--primary-100)` : 'none'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    {school?.logoUrl ? (
                        <img src={school.logoUrl} alt={schoolName} style={{ height: '80px', margin: '0 auto var(--spacing-lg)', objectFit: 'contain' }} />
                    ) : (
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
                    )}
                    <h1 style={{ marginBottom: 'var(--spacing-xs)', fontSize: '1.5rem' }}>{schoolName}</h1>
                    <p className="text-muted">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="#" className="text-primary">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.875rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <p className="text-xs text-muted">
                        Official {schoolName} Portal
                        <br />
                        {school?.phoneNumber && `Support: ${school.phoneNumber}`}
                    </p>
                </div>
            </div>

            <div style={{
                position: 'fixed',
                bottom: '20px',
                color: school ? 'var(--neutral-500)' : 'white',
                fontSize: '0.75rem',
                textAlign: 'center',
                width: '100%'
            }}>
                Powered by PayDesk © 2026 <span style={{ opacity: 0.5 }}>v1.0.1</span>
            </div>
        </div>
    )
}
