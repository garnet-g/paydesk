'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ShieldAlert, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'

interface ChangePasswordModalProps {
    onSuccess: () => void
}

export default function ChangePasswordModal({ onSuccess }: ChangePasswordModalProps) {
    const { update } = useSession()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            if (res.ok) {
                // Update the local session
                await update({ requiresPasswordChange: false })

                setIsSuccess(true)
                setTimeout(() => {
                    onSuccess()
                }, 2000)
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to change password')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="modal-overlay">
                <div className="card modal-content text-center animate-slide-up" style={{ maxWidth: '400px' }}>
                    <div style={{ color: 'var(--success-600)', marginBottom: 'var(--spacing-lg)' }}>
                        <CheckCircle2 size={64} style={{ margin: '0 auto' }} />
                    </div>
                    <h3 className="card-title">Password Updated!</h3>
                    <p className="text-muted">Your password has been changed successfully. You can now access your dashboard.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay">
            <div className="card modal-content animate-slide-up" style={{ maxWidth: '450px', width: '90%' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'var(--warning-50)',
                        color: 'var(--warning-600)',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)'
                    }}>
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="card-title">Security Recommendation</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        This is your first login or your password was recently reset. Please set a new permanent password to continue.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Current (Default) Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="password"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="password"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="password"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.875rem', marginTop: 'var(--spacing-md)' }}
                        disabled={loading}
                    >
                        {loading ? 'Updating Password...' : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                Save New Password <ArrowRight size={18} />
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
