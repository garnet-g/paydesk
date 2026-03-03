'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    ShieldCheck, Plus, Trash2, KeyRound, Mail, Phone,
    User, Eye, EyeOff, X, CheckCircle, AlertCircle, Crown
} from 'lucide-react'

interface PlatformAdmin {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    isActive: boolean
    requiresPasswordChange: boolean
    createdAt: string
    lastLogin?: string
}

export default function PlatformAdminsPage() {
    const { data: session } = useSession()
    const [admins, setAdmins] = useState<PlatformAdmin[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        if (session?.user?.role === 'SUPER_ADMIN') fetchAdmins()
    }, [session])

    const fetchAdmins = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/platform-admins')
            if (res.ok) setAdmins(await res.json())
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(''), 4000)
    }

    const showError = (msg: string) => {
        setErrorMsg(msg)
        setTimeout(() => setErrorMsg(''), 5000)
    }

    const handleToggleActive = async (admin: PlatformAdmin) => {
        if (admin.email === session?.user?.email) return showError("You can't suspend your own account!")
        if (!confirm(`${admin.isActive ? 'Suspend' : 'Reactivate'} ${admin.firstName} ${admin.lastName}?`)) return
        setActionLoading(admin.id)
        try {
            const res = await fetch(`/api/admin/platform-admins/${admin.id}/toggle`, { method: 'PATCH' })
            if (res.ok) {
                showSuccess(`${admin.firstName} has been ${admin.isActive ? 'suspended' : 'reactivated'}.`)
                fetchAdmins()
            } else {
                const d = await res.json()
                showError(d.error || 'Action failed')
            }
        } finally { setActionLoading(null) }
    }

    const handleResetPassword = async (admin: PlatformAdmin) => {
        if (!confirm(`Reset password for ${admin.firstName} ${admin.lastName}? They will be forced to change it on next login.`)) return
        setActionLoading(admin.id + '-pwd')
        try {
            const res = await fetch(`/api/users/${admin.id}/reset-password`, { method: 'POST' })
            const d = await res.json()
            if (res.ok && d.success) {
                showSuccess(`Password reset! Temporary password: ${d.defaultPassword}`)
            } else {
                showError(d.error || 'Reset failed')
            }
        } finally { setActionLoading(null) }
    }

    const handleDelete = async (admin: PlatformAdmin) => {
        if (admin.email === session?.user?.email) return showError("You can't delete your own account!")
        if (!confirm(`Permanently delete admin account for ${admin.firstName} ${admin.lastName}? This cannot be undone.`)) return
        setActionLoading(admin.id + '-del')
        try {
            const res = await fetch(`/api/admin/platform-admins/${admin.id}`, { method: 'DELETE' })
            if (res.ok) {
                showSuccess(`${admin.firstName}'s account has been deleted.`)
                fetchAdmins()
            } else {
                const d = await res.json()
                showError(d.error || 'Delete failed')
            }
        } finally { setActionLoading(null) }
    }

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Access Denied. Only the Super Administrator can manage platform admins.</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div>
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-xs)' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Crown size={18} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Platform Admins</h2>
                        </div>
                        <p className="text-muted">
                            Manage sub-administrators who help you run the PayDesk platform. They have the same access as you, but you can suspend or remove them at any time.
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} />
                        Add Platform Admin
                    </button>
                </div>

                {/* Alerts */}
                {successMsg && (
                    <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} /> {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} /> {errorMsg}
                    </div>
                )}

                {/* Info banner */}
                <div className="alert alert-info" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <strong>What can Platform Admins do?</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>
                            Platform Admins can add schools, manage subscriptions, view system logs, broadcast to all users, and access all school dashboards — just like you. You are the root Super Admin and cannot be removed by others.
                        </p>
                    </div>
                </div>

                {/* Admins List */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--spacing-lg) var(--spacing-xl)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldCheck size={18} style={{ color: 'var(--primary-600)' }} />
                        <span style={{ fontWeight: 700 }}>All Platform Admins ({admins.length})</span>
                    </div>
                    <div className="table-wrapper" style={{ margin: 0 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Administrator</th>
                                    <th>Contact</th>
                                    <th>Account Status</th>
                                    <th>Last Active</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                                        </td>
                                    </tr>
                                ) : admins.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <ShieldCheck size={48} style={{ opacity: 0.15, margin: '0 auto var(--spacing-md)', display: 'block' }} />
                                            <p className="text-muted">No platform admins yet. Add one to delegate management tasks.</p>
                                        </td>
                                    </tr>
                                ) : admins.map(admin => (
                                    <tr key={admin.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '38px', height: '38px', borderRadius: '10px',
                                                    background: admin.email === session?.user?.email
                                                        ? 'linear-gradient(135deg, var(--primary-600), var(--primary-700))'
                                                        : 'var(--primary-50)',
                                                    color: admin.email === session?.user?.email ? 'white' : 'var(--primary-700)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '0.875rem', flexShrink: 0
                                                }}>
                                                    {admin.firstName[0]}{admin.lastName[0]}
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontWeight: 600 }}>{admin.firstName} {admin.lastName}</span>
                                                        {admin.email === session?.user?.email && (
                                                            <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>You</span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                                                        Added {new Date(admin.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Mail size={12} style={{ color: 'var(--neutral-400)' }} /> {admin.email}
                                                </span>
                                                {admin.phoneNumber && (
                                                    <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <Phone size={12} style={{ color: 'var(--neutral-400)' }} /> {admin.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className={`badge ${admin.isActive ? 'badge-success' : 'badge-error'}`} style={{ width: 'fit-content' }}>
                                                    {admin.isActive ? 'Active' : 'Suspended'}
                                                </span>
                                                {admin.requiresPasswordChange && (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--warning-600)', fontWeight: 600 }}>
                                                        ⚠ Pending password change
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                                                {admin.lastLogin
                                                    ? new Date(admin.lastLogin).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                    : 'Never logged in'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {admin.email !== session?.user?.email && (
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleResetPassword(admin)}
                                                        disabled={actionLoading === admin.id + '-pwd'}
                                                        title="Reset Password"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                                    >
                                                        <KeyRound size={14} />
                                                        <span className="hide-mobile">Reset Pwd</span>
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${admin.isActive ? 'btn-outline' : 'btn-success'}`}
                                                        onClick={() => handleToggleActive(admin)}
                                                        disabled={actionLoading === admin.id}
                                                        title={admin.isActive ? 'Suspend' : 'Reactivate'}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                                    >
                                                        {admin.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        <span className="hide-mobile">{admin.isActive ? 'Suspend' : 'Restore'}</span>
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(admin)}
                                                        disabled={actionLoading === admin.id + '-del'}
                                                        title="Delete Admin"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {admin.email === session?.user?.email && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontStyle: 'italic' }}>Root Admin</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Admin Modal */}
                {showCreateModal && (
                    <CreateAdminModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={(msg) => { showSuccess(msg); setShowCreateModal(false); fetchAdmins() }}
                        onError={showError}
                    />
                )}
            </div>
        </DashboardLayout>
    )
}

function CreateAdminModal({ onClose, onSuccess, onError }: {
    onClose: () => void
    onSuccess: (msg: string) => void
    onError: (msg: string) => void
}) {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [generatedPwd, setGeneratedPwd] = useState('')
    const [loading, setLoading] = useState(false)

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
        const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        setGeneratedPwd(pwd)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!generatedPwd) return onError('Please generate a temporary password first.')
        setLoading(true)
        try {
            const res = await fetch('/api/admin/platform-admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, password: generatedPwd })
            })
            const d = await res.json()
            if (res.ok) {
                onSuccess(`Admin account created for ${form.firstName} ${form.lastName}. Share their temporary password securely.`)
            } else {
                onError(d.error || 'Failed to create admin.')
            }
        } finally { setLoading(false) }
    }

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={18} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>Add Platform Admin</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--neutral-500)' }}>They will have full platform access</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', padding: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">First Name *</label>
                            <input className="form-input" required placeholder="John" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Last Name *</label>
                            <input className="form-input" required placeholder="Mwangi" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />Email Address *</label>
                        <input className="form-input" type="email" required placeholder="john@paydesk.co.ke" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />Phone Number</label>
                        <input className="form-input" type="tel" placeholder="254712345678" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} />
                    </div>

                    <div className="form-group">
                        <label className="form-label"><KeyRound size={14} style={{ display: 'inline', marginRight: '4px' }} />Temporary Password *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    className="form-input"
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="Click Generate →"
                                    value={generatedPwd}
                                    onChange={e => setGeneratedPwd(e.target.value)}
                                    style={{ paddingRight: '40px', fontFamily: 'monospace' }}
                                />
                                <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}>
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <button type="button" className="btn btn-secondary" onClick={generatePassword} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                Generate
                            </button>
                        </div>
                        <p className="form-hint" style={{ fontSize: '0.75rem', marginTop: '6px' }}>Share this password securely with the admin. They will be asked to change it on first login.</p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {loading ? <><span className="spinner" />Creating...</> : <><User size={16} />Create Admin</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
