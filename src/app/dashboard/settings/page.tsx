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
    Check,
    Building2,
    CreditCard,
    Crown,
    Camera,
    Trash2,
    Palette,
    ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const plans = [
    { id: "FREE", name: "Starter", price: "KES 2,500/mo", students: "Up to 200 students", features: ["Fee collection", "Basic reports", "SMS receipts"] },
    { id: "PRO", name: "Growth", price: "KES 5,000/mo", students: "Up to 500 students", features: ["Everything in Starter", "M-Pesa STK Push", "Email receipts", "Analytics"] },
    { id: "ENTERPRISE", name: "Premium", price: "KES 10,000/mo", students: "Unlimited students", features: ["Everything in Growth", "API access", "Priority support", "Custom branding"] },
]

export default function SettingsPage() {
    const { data: session, update } = useSession()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    // Form Stats
    const [form, setForm] = useState({
        school_name: "",
        school_motto: "",
        phone: "",
        email: "",
        address: "",
        current_term: "Term 1",
        current_year: new Date().getFullYear().toString(),
        mpesa_paybill: "",
        subscription_plan: "FREE",
    })

    // Password States
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    // Branding States
    const [logoPreview, setLogoPreview] = useState(session?.user?.logoUrl || '')
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [primaryColor, setPrimaryColor] = useState('#4f46e5')
    const [tagline, setTagline] = useState('')
    const [brandingLoading, setBrandingLoading] = useState(false)

    // Maintenance
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [maintenanceLoading, setMaintenanceLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (session?.user?.schoolId) {
                try {
                    const res = await fetch(`/api/schools/${session.user.schoolId}/settings`)
                    if (res.ok) {
                        const data = await res.json()
                        setForm({
                            school_name: data.name || "",
                            school_motto: data.motto || "",
                            phone: data.phoneNumber || "",
                            email: data.email || "",
                            address: data.address || "",
                            current_term: data.currentTerm || "Term 1",
                            current_year: data.currentYear || new Date().getFullYear().toString(),
                            mpesa_paybill: data.mpesaPaybill || "",
                            subscription_plan: data.planTier || "FREE",
                        })
                        setLogoPreview(data.logoUrl || "")
                        setPrimaryColor(data.primaryColor || "#4f46e5")
                        setTagline(data.tagline || "")
                    }
                } catch (err) {
                    console.error('Failed to fetch settings:', err)
                } finally {
                    setLoading(false)
                }
            }

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

        fetchData()
    }, [session?.user?.schoolId, session?.user?.role])

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session?.user?.schoolId) return

        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch(`/api/schools/${session.user.schoolId}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.school_name,
                    motto: form.school_motto,
                    phoneNumber: form.phone,
                    email: form.email,
                    address: form.address,
                    currentTerm: form.current_term,
                    currentYear: form.current_year,
                    mpesaPaybill: form.mpesa_paybill,
                    planTier: form.subscription_plan
                })
            })

            if (res.ok) {
                setSuccess('Settings saved successfully!')
                setTimeout(() => setSuccess(''), 5000)
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to save settings')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordLoading(true)
        setError('')
        setSuccess('')

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match')
            setPasswordLoading(false)
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
            setPasswordLoading(false)
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            alert('File too large. Max 2MB.')
            return
        }

        setLogoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            setLogoPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const uploadToSupabase = async (file: File): Promise<string | null> => {
        if (!session?.user?.schoolId) return null

        const fileExt = file.name.split('.').pop()
        const fileName = `${session.user.schoolId}-${Math.random()}.${fileExt}`
        const filePath = `logos/${fileName}`

        const { data, error } = await supabase.storage
            .from('school-assets')
            .upload(filePath, file, { cacheControl: '3600', upsert: true })

        if (error) throw new Error('Failed to upload logo')

        const { data: { publicUrl } } = supabase.storage
            .from('school-assets')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleUpdateBranding = async () => {
        if (!session?.user?.schoolId) return

        setBrandingLoading(true)
        setError('')
        setSuccess('')

        try {
            let finalLogoUrl = logoPreview

            if (logoFile) {
                const uploadedUrl = await uploadToSupabase(logoFile)
                if (uploadedUrl) finalLogoUrl = uploadedUrl
            }

            const res = await fetch(`/api/schools/${session.user.schoolId}/branding`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoUrl: finalLogoUrl, primaryColor, tagline })
            })

            if (res.ok) {
                setSuccess('Branding updated!')
                await update({
                    user: { ...session?.user, logoUrl: finalLogoUrl }
                })
                setTimeout(() => window.location.reload(), 1500)
            } else {
                setError('Failed to update branding')
            }
        } catch (err) {
            setError('Branding update error')
        } finally {
            setBrandingLoading(false)
        }
    }

    const handleToggleMaintenance = async () => {
        if (!confirm('Toggle global maintenance mode?')) return

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
                setSuccess(`Maintenance Mode ${data.active ? 'Enabled' : 'Disabled'}`)
            }
        } catch (err) { }
        finally { setMaintenanceLoading(false) }
    }

    if (loading) return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="spinner"></div>
            </div>
        </DashboardLayout>
    )

    const isPrincipalOrAdmin = ['PRINCIPAL', 'SUPER_ADMIN'].includes(session?.user?.role || '')
    const isPro = ['PRO', 'ENTERPRISE'].includes(session?.user?.planTier || 'FREE') || session?.user?.role === 'SUPER_ADMIN'

    return (
        <DashboardLayout>
            <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: 'var(--spacing-3xl)' }}>
                {/* Header Section */}
                <div style={{ marginBottom: 'var(--spacing-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.02em', margin: 0 }}>Settings</h1>
                        <p style={{ color: 'var(--neutral-500)', marginTop: '4px' }}>School configuration and institutional preferences</p>
                    </div>
                </div>

                {success && <div className="alert alert-success mt-md mb-md animate-slide-up"><CheckCircle2 size={18} /> {success}</div>}
                {error && <div className="alert alert-error mt-md mb-md animate-slide-up"><AlertCircle size={18} /> {error}</div>}

                <div className="grid grid-cols-1 gap-xl">

                    {/* 1. School Information Card */}
                    <div className="card shadow-md">
                        <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>School Information</h3>
                            </div>
                        </div>
                        <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-xl">
                                <div className="sm:col-span-2 form-group">
                                    <label className="form-label">School Name</label>
                                    <input type="text" className="form-input"
                                        value={form.school_name}
                                        onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2 form-group">
                                    <label className="form-label">School Motto / Tagline</label>
                                    <input type="text" className="form-input"
                                        value={form.school_motto}
                                        onChange={(e) => setForm({ ...form, school_motto: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Phone</label>
                                    <input type="text" className="form-input"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Institutional Email</label>
                                    <input type="email" className="form-input"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2 form-group">
                                    <label className="form-label">Physical Address</label>
                                    <input type="text" className="form-input"
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Current Academic Term</label>
                                    <select className="form-input" value={form.current_term} onChange={(e) => setForm({ ...form, current_term: e.target.value })}>
                                        <option value="Term 1">Term 1</option>
                                        <option value="Term 2">Term 2</option>
                                        <option value="Term 3">Term 3</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Current Year</label>
                                    <input type="text" className="form-input"
                                        value={form.current_year}
                                        onChange={(e) => setForm({ ...form, current_year: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '160px' }}>
                                        {saving ? <div className="spinner spinner-xs"></div> : <><Save size={18} /> Save Changes</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* 2. M-Pesa Configuration Card */}
                    <div className="card shadow-md">
                        <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', background: 'var(--success-50)', color: 'var(--success-600)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>M-Pesa Configuration</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>Configure automated payment collection</p>
                                </div>
                            </div>
                        </div>
                        <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                            <div className="form-group">
                                <label className="form-label">Paybill Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. 247247"
                                    value={form.mpesa_paybill}
                                    onChange={(e) => setForm({ ...form, mpesa_paybill: e.target.value })}
                                />
                            </div>
                            <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-md)', background: 'var(--neutral-50)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
                                <AlertCircle size={20} className="text-warning-500" style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', margin: 0 }}>
                                    <strong>Note:</strong> Enabling automated STK Push requires M-Pesa Daraja API credentials. Contact the support team to complete your integration.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Subscription Plans Card */}
                    <div className="card shadow-md">
                        <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', background: 'var(--warning-50)', color: 'var(--warning-600)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Crown size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Subscription Plan</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>Choose a tier that fits your institution's scale</p>
                                </div>
                            </div>
                        </div>
                        <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                                {plans.map((plan) => {
                                    const isActive = form.subscription_plan === plan.id;
                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => setForm({ ...form, subscription_plan: plan.id })}
                                            className="card clickable"
                                            style={{
                                                padding: 'var(--spacing-lg)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                borderColor: isActive ? 'var(--primary-500)' : 'var(--neutral-100)',
                                                background: isActive ? 'var(--primary-50)' : 'white',
                                                scale: isActive ? '1.02' : '1',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h4 style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>{plan.name}</h4>
                                                {isActive && <div className="badge badge-primary">Current</div>}
                                            </div>
                                            <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--neutral-900)', margin: '0 0 4px' }}>{plan.price}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '16px' }}>{plan.students}</p>
                                            <div className="space-y-sm">
                                                {plan.features.map(f => (
                                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
                                                        <Check size={14} className="text-primary-500" /> {f}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 4. Branding Section (Preserved Functionality) */}
                    {isPrincipalOrAdmin && (
                        <div className="card shadow-md">
                            <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', background: 'var(--indigo-50)', color: 'var(--indigo-600)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Palette size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Visual Identity</h3>
                                </div>
                            </div>
                            <div className="card-content" style={{ padding: 'var(--spacing-xl)', opacity: isPro ? 1 : 0.4, pointerEvents: isPro ? 'auto' : 'none', position: 'relative' }}>
                                {!isPro && (
                                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)' }}>
                                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: 'var(--shadow-xl)', textAlign: 'center', maxWidth: '300px' }}>
                                            <Lock size={32} style={{ margin: '0 auto 12px', color: 'var(--warning-500)' }} />
                                            <h4 style={{ fontWeight: 800 }}>PRO Feature</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: '1rem' }}>Upgrade to unlock custom logos and branding colors.</p>
                                            <button className="btn btn-primary btn-sm w-full" onClick={() => router.push('/dashboard/subscription')}>Upgrade Plan</button>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-xl">
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: '120px', height: '120px', margin: '0 auto', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--neutral-50)' }}>
                                            {logoPreview ? <img src={logoPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={40} className="text-muted" />}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                                            <label className="btn btn-ghost btn-xs" style={{ cursor: 'pointer' }}>
                                                <Camera size={14} /> Upload
                                                <input type="file" hidden onChange={handleLogoUpload} />
                                            </label>
                                            {logoPreview && <button className="btn btn-ghost btn-xs text-error" onClick={() => setLogoPreview('')}><Trash2 size={14} /></button>}
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 space-y-md">
                                        <div className="form-group">
                                            <label className="form-label">Primary Brand Color</label>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '60px', height: '40px', padding: '2px', borderRadius: '8px' }} />
                                                <input type="text" className="form-input" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button className="btn btn-primary btn-sm" onClick={handleUpdateBranding} disabled={brandingLoading}>
                                                {brandingLoading ? "Saving..." : "Apply Branding"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Password & Security */}
                    <div className="card shadow-md">
                        <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', background: 'var(--error-50)', color: 'var(--error-600)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Security Settings</h3>
                            </div>
                        </div>
                        <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                            <form onSubmit={handlePasswordChange} className="space-y-md">
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <input type="password" required className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <input type="password" required className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Confirm New Password</label>
                                        <input type="password" required className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={passwordLoading}>
                                        {passwordLoading ? "Updating..." : "Change Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* 6. Super Admin Operations */}
                    {session?.user?.role === 'SUPER_ADMIN' && (
                        <div className="card" style={{ border: '2px solid var(--error-200)', background: 'var(--error-50)' }}>
                            <div className="card-header" style={{ padding: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <AlertCircle size={24} className="text-error-600" />
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--error-700)', margin: 0 }}>Global Platform Controls</h3>
                                </div>
                            </div>
                            <div className="card-content" style={{ padding: '0 var(--spacing-lg) var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--error-700)', margin: 0 }}>
                                        <strong>Maintenance Mode:</strong> Lock all access across entire platform.
                                    </p>
                                    <button
                                        className={`btn btn-sm ${maintenanceMode ? 'btn-error' : 'btn-outline'}`}
                                        onClick={handleToggleMaintenance}
                                        disabled={maintenanceLoading}
                                    >
                                        {maintenanceMode ? "Turn Off Maintenance" : "Go Global Maintenance"}
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
