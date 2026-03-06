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
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-2xl animate-slide-up">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 ring-4 ring-green-100/50">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-foreground">Password Updated!</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your password has been changed successfully. You can now access your dashboard securely.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl animate-slide-up">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-4 ring-amber-100/50">
                        <ShieldAlert size={28} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">Security Recommendation</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This is your first login or your password was recently reset. Please set a new permanent password to continue.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 animate-slide-down">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Current (Default) Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                            <input
                                type="password"
                                className="w-full rounded-md border border-border bg-input py-2.5 pl-10 pr-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">New Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                            <input
                                type="password"
                                className="w-full rounded-md border border-border bg-input py-2.5 pl-10 pr-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                            <input
                                type="password"
                                className="w-full rounded-md border border-border bg-input py-2.5 pl-10 pr-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-black/90 active:scale-[0.98] disabled:opacity-70"
                    >
                        {loading ? 'Updating Password...' : (
                            <>
                                Save New Password
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
