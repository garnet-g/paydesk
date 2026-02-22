'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    Lock,
    Save,
    User,
    Shield,
    Bell,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Plus,
    Check,
    School as SchoolIcon,
    Camera,
    Trash2,
    Palette
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [brandingLoading, setBrandingLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    // Password States
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Branding States
    const [logoUrl, setLogoUrl] = useState(session?.user?.logoUrl || '')
    const [primaryColor, setPrimaryColor] = useState('#4f46e5')
    const [tagline, setTagline] = useState('')

    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [maintenanceLoading, setMaintenanceLoading] = useState(false)

    useEffect(() => {
        const fetchSchoolDetails = async () => {
            if (session?.user?.schoolId) {
                try {
                    const res = await fetch(`/api/schools/${session.user.schoolId}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (data.logoUrl) setLogoUrl(data.logoUrl)
                        if (data.primaryColor) setPrimaryColor(data.primaryColor)
                        if (data.tagline) setTagline(data.tagline)
                    }
                } catch (err) {
                    console.error('Failed to fetch school details:', err)
                }
            }
        }

        const fetchMaintenanceSate = async () => {
            if (session?.user?.role === 'SUPER_ADMIN') {
                try {
                    const res = await fetch('/api/admin/maintenance')
                    if (res.ok) {
                        const data = await res.json()
                        setMaintenanceMode(data.active)
                    }
                } catch (err) { }
            }
        }

        fetchSchoolDetails()
        fetchMaintenanceSate()
    }, [session?.user?.schoolId, session?.user?.role])

    const handleToggleMaintenance = async () => {
        if (!confirm(`Are you sure you want to ${maintenanceMode ? 'disable' : 'enable'} Global Maintenance Mode?\n\nThis will lock out EVERY user on the platform except Super Admins.`)) return

        setMaintenanceLoading(true)
        try {
            const res = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !maintenanceMode })
            })
            if (res.ok) {
                const data = await res.json()
                setMaintenanceMode(data.active)
                setSuccess(`Maintenance Mode successfully ${data.active ? 'enabled. All non-admin accounts are locked out.' : 'disabled. System is back online.'}`)
                setTimeout(() => setSuccess(''), 5000)
            } else {
                setError('Failed to update maintenance mode')
            }
        } catch (err) {
            setError('Error updating maintenance state')
        } finally {
            setMaintenanceLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            const data = await res.json()

            if (res.ok) {
                setSuccess('Password updated successfully!')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setTimeout(() => setSuccess(''), 5000)
            } else {
                setError(data.error || 'Failed to update password')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            alert('File too large. Max 2MB.')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setLogoUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleUpdateBranding = async () => {
        if (!session?.user?.schoolId) return

        setBrandingLoading(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch(`/api/schools/${session.user.schoolId}/branding`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoUrl, primaryColor, tagline })
            })

            if (res.ok) {
                setSuccess('School branding updated successfully! Refreshing...')
                // Force update session with the new logo
                await update({
                    user: {
                        ...session?.user,
                        logoUrl: logoUrl
                    }
                })
                // Refresh the page to ensure all components (Sidebar, etc) pick up the change
                setTimeout(() => window.location.reload(), 1500)
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to update branding')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setBrandingLoading(false)
        }
    }

    const removeLogo = () => {
        setLogoUrl('')
    }

    const isPrincipalOrAdmin = ['PRINCIPAL', 'SUPER_ADMIN'].includes(session?.user?.role || '')
    const isPro = ['PRO', 'ENTERPRISE'].includes(session?.user?.planTier || 'FREE') || session?.user?.role === 'SUPER_ADMIN'

    return (
        <DashboardLayout>
            <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Account Settings</h2>
                    <p className="text-muted">Manage your profile and security preferences</p>
                </div>

                <div className="grid grid-cols-1 gap-xl">
                    {/* Branding Section (Principals Only) */}
                    {isPrincipalOrAdmin && (
                        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'var(--primary-50)',
                                    color: 'var(--primary-600)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Palette size={20} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div>
                                        <h3 className="card-title">School Branding</h3>
                                        <p className="card-description">Customize your school's visual identity</p>
                                    </div>
                                    {!isPro && <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> PRO Feature</span>}
                                </div>
                            </div>

                            <div className="card-content" style={{ opacity: isPro ? 1 : 0.3, pointerEvents: isPro ? 'auto' : 'none' }}>
                                <div style={{ display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'flex-start' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '2px dashed var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            background: 'var(--neutral-50)',
                                            position: 'relative'
                                        }}>
                                            {logoUrl ? (
                                                <img src={logoUrl} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <SchoolIcon size={40} className="text-muted" opacity={0.3} />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-md)', justifyContent: 'center' }}>
                                            <label className="btn btn-ghost btn-xs" style={{ cursor: 'pointer' }}>
                                                <Camera size={14} /> Upload
                                                <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                                            </label>
                                            {logoUrl && (
                                                <button className="btn btn-ghost btn-xs text-error" onClick={removeLogo}>
                                                    <Trash2 size={14} /> Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div className="form-group">
                                            <label className="form-label">School Tagline</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. Striving for Excellence"
                                                value={tagline}
                                                onChange={(e) => setTagline(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Primary Brand Color</label>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <input
                                                    type="color"
                                                    className="form-input"
                                                    style={{ width: '50px', padding: '2px', height: '40px' }}
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-primary" onClick={handleUpdateBranding} disabled={brandingLoading}>
                                        {brandingLoading ? <div className="spinner spinner-sm"></div> : <><Save size={18} /> Save Branding</>}
                                    </button>
                                </div>
                            </div>

                            {!isPro && (
                                <div style={{
                                    position: 'absolute',
                                    top: '72px',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(255, 255, 255, 0.4)',
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 10
                                }}>
                                    <div style={{ background: 'white', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', textAlign: 'center', maxWidth: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Lock size={32} style={{ color: 'var(--warning-500)', marginBottom: 'var(--spacing-md)' }} />
                                        <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>Unlock Custom Branding</h4>
                                        <p className="text-sm text-muted" style={{ marginBottom: 'var(--spacing-md)' }}>Upgrade to a PRO plan to upload your school's logo and customize dashboard colors.</p>
                                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => alert('Contact your Super Admin to upgrade your platform tier.')}>Upgrade Plan</button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* Profile Section */}
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--secondary-50)',
                                color: 'var(--secondary-600)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="card-title">Profile Information</h3>
                                <p className="card-description">Your basic account details</p>
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="grid grid-cols-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-input" value={session?.user?.name || ''} disabled />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input type="email" className="form-input" value={session?.user?.email || ''} disabled />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <input type="text" className="form-input" value={session?.user?.role || ''} disabled />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">School</label>
                                    <input type="text" className="form-input" value={session?.user?.schoolName || 'System'} disabled />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--warning-50)',
                                color: 'var(--warning-600)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="card-title">Password & Security</h3>
                                <p className="card-description">Change your password to keep your account secure</p>
                            </div>
                        </div>
                        <div className="card-content">
                            <form onSubmit={handlePasswordChange}>
                                {success && (
                                    <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <CheckCircle2 size={18} />
                                        {success}
                                    </div>
                                )}
                                {error && (
                                    <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
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

                                <div className="grid grid-cols-2 gap-md">
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
                                </div>

                                <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? <div className="spinner spinner-sm"></div> : <><Save size={18} /> Update Password</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--indigo-50)',
                                color: 'var(--indigo-600)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Bell size={20} />
                            </div>
                            <div>
                                <h3 className="card-title">System Support</h3>
                                <p className="card-description">Need help with your account?</p>
                            </div>
                        </div>
                        <div className="card-content">
                            <p className="text-sm text-muted mb-lg">
                                If you're having trouble with your account or noticed any issues, please contact the technical support team.
                            </p>
                            <button className="btn btn-outline" onClick={() => router.push('/dashboard/inquiries')}>
                                Contact Support
                            </button>
                        </div>
                    </div>

                    {/* Super Admin System Operations */}
                    {session?.user?.role === 'SUPER_ADMIN' && (
                        <div className="card" style={{ borderColor: 'var(--error-200)', background: 'var(--error-50)' }}>
                            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'var(--error-100)',
                                    color: 'var(--error-700)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="card-title text-error-700">System Operations (Super Admin)</h3>
                                    <p className="card-description text-error-600">Global platform controls</p>
                                </div>
                            </div>
                            <div className="card-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 className="font-semibold" style={{ marginBottom: '4px' }}>Maintenance Mode</h4>
                                        <p className="text-sm text-error-600">Lock out all users across all schools. Only Super Admins can log in.</p>
                                    </div>
                                    <button
                                        className={`btn ${maintenanceMode ? 'btn-error' : 'btn-outline'}`}
                                        onClick={handleToggleMaintenance}
                                        disabled={maintenanceLoading}
                                    >
                                        {maintenanceLoading ? 'Updating...' : maintenanceMode ? 'Turn Off Maintenance' : 'Enable Maintenance Mode'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DashboardLayout>
    )
}

