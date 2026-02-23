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
    ArrowRight,
    Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

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
    const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'billing' | 'branding' | 'security' | 'admin'>('general')

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

    const tabs = [
        { id: 'general', label: 'General', icon: Building2 },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'billing', label: 'Billing', icon: Crown },
        ...(isPrincipalOrAdmin ? [{ id: 'branding', label: 'Branding', icon: Palette }] : []),
        { id: 'security', label: 'Security', icon: Shield },
        ...(session?.user?.role === 'SUPER_ADMIN' ? [{ id: 'admin', label: 'Admin', icon: AlertCircle }] : [])
    ]

    return (
        <DashboardLayout>
            <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: 'var(--spacing-3xl)' }}>
                {/* Header Section */}
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.02em', margin: 0 }}>Account Settings</h1>
                    <p style={{ color: 'var(--neutral-500)', marginTop: '4px' }}>Manage your school configuration, billing, and platform preferences</p>
                </div>

                {success && <div className="alert alert-success mt-md mb-md animate-slide-up"><CheckCircle2 size={18} /> {success}</div>}
                {error && <div className="alert alert-error mt-md mb-md animate-slide-up"><AlertCircle size={18} /> {error}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--spacing-2xl)', alignItems: 'start' }}>

                    {/* Mini Menu (Side Tabs) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: isActive ? 'var(--primary-600)' : 'transparent',
                                        color: isActive ? 'white' : 'var(--neutral-600)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'left',
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                    {isActive && <motion.div layoutId="activeTabIndicator" style={{ marginLeft: 'auto', width: '4px', height: '16px', background: 'white', borderRadius: '2px' }} />}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="animate-fade-in">
                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="card shadow-md">
                                <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>School Information</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: '4px' }}>Configure the basic public details for your institution.</p>
                                </div>
                                <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                                    <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-xl">
                                        <div className="sm:col-span-2 form-group">
                                            <label className="form-label">Official School Name</label>
                                            <input type="text" className="form-input" value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} />
                                        </div>
                                        <div className="sm:col-span-2 form-group">
                                            <label className="form-label">School Motto / Tagline</label>
                                            <input type="text" className="form-input" value={form.school_motto} onChange={(e) => setForm({ ...form, school_motto: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Primary Contact Phone</label>
                                            <input type="text" className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Institutional Email</label>
                                            <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                        </div>
                                        <div className="sm:col-span-2 form-group">
                                            <label className="form-label">Physical Address</label>
                                            <input type="text" className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Active Academic Term</label>
                                            <select className="form-input" value={form.current_term} onChange={(e) => setForm({ ...form, current_term: e.target.value })}>
                                                <option value="Term 1">Term 1</option>
                                                <option value="Term 2">Term 2</option>
                                                <option value="Term 3">Term 3</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Current Academic Year</label>
                                            <input type="text" className="form-input" value={form.current_year} onChange={(e) => setForm({ ...form, current_year: e.target.value })} />
                                        </div>
                                        <div className="sm:col-span-2" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--spacing-md)' }}>
                                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                                {saving ? <div className="spinner spinner-xs"></div> : <><Save size={18} /> Save General Changes</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* PAYMENTS TAB */}
                        {activeTab === 'payments' && (
                            <div className="card shadow-md">
                                <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>M-Pesa Gateway</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: '4px' }}>Set up your institutional paybill for automated fee collections.</p>
                                </div>
                                <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                                    <form onSubmit={handleSaveSettings} className="space-y-xl">
                                        <div className="form-group">
                                            <label className="form-label">M-Pesa Paybill Number</label>
                                            <input type="text" className="form-input" placeholder="e.g. 247247" value={form.mpesa_paybill} onChange={(e) => setForm({ ...form, mpesa_paybill: e.target.value })} />
                                        </div>
                                        <div style={{ transition: 'all 0.3s ease', background: 'var(--primary-50)', border: '1px solid var(--primary-100)', padding: 'var(--spacing-lg)', borderRadius: '16px', display: 'flex', gap: '16px' }}>
                                            <Zap size={24} className="text-primary-600" style={{ flexShrink: 0 }} />
                                            <div>
                                                <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>Automated Reconciliation</h4>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', lineHeight: 1.5 }}>
                                                    Linking your Paybill allows PayDesk to automatically trigger STK Push prompts for parents and reconcile payments in real-time.
                                                </p>
                                                <button type="button" className="btn btn-ghost btn-xs mt-sm" style={{ padding: 0, fontWeight: 700 }} onClick={() => router.push('/dashboard/inquiries')}>Contact Support for API Setup <ArrowRight size={14} /></button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                                {saving ? <div className="spinner spinner-xs"></div> : <><Save size={18} /> Update Payment Gateway</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* BILLING TAB */}
                        {activeTab === 'billing' && (
                            <div className="card shadow-md">
                                <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Subscription & Tiers</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: '4px' }}>Manage your PayDesk platform plan based on your school's size.</p>
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
                                                        borderColor: isActive ? 'var(--primary-500)' : 'var(--neutral-200)',
                                                        background: isActive ? 'var(--primary-50)' : 'white',
                                                        transform: isActive ? 'translateY(-4px)' : 'none',
                                                        boxShadow: isActive ? 'var(--shadow-lg)' : 'none'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <h4 style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>{plan.name}</h4>
                                                        {isActive && <div className="badge badge-primary">Active</div>}
                                                    </div>
                                                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neutral-900)', margin: '0' }}>{plan.price}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '16px', fontWeight: 600 }}>{plan.students}</p>
                                                    <hr style={{ border: 'none', borderTop: '1px solid var(--neutral-100)', margin: '12px 0' }} />
                                                    <div className="space-y-sm">
                                                        {plan.features.map(f => (
                                                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                                                                <Check size={14} className="text-primary-500" /> {f}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--neutral-50)', padding: 'var(--spacing-md)', borderRadius: '12px' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', margin: 0 }}>Need a custom Enterprise plan?</p>
                                        <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>Save Tier Selection</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BRANDING TAB */}
                        {activeTab === 'branding' && isPrincipalOrAdmin && (
                            <div className="card shadow-md">
                                <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Visual Identity</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: '4px' }}>Customize how your school appears to parents and students.</p>
                                </div>
                                <div className="card-content" style={{ padding: 'var(--spacing-xl)', opacity: isPro ? 1 : 0.4, pointerEvents: isPro ? 'auto' : 'none', position: 'relative' }}>
                                    {!isPro && (
                                        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(3px)' }}>
                                            <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: 'var(--shadow-xl)', textAlign: 'center', maxWidth: '340px' }}>
                                                <Lock size={40} style={{ margin: '0 auto 16px', color: 'var(--warning-500)' }} />
                                                <h4 style={{ fontWeight: 900, fontSize: '1.25rem' }}>PRO Branding</h4>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', marginBottom: '1.5rem', lineHeight: 1.5 }}>Upload your logo and change dashboard colors to match your school's brand.</p>
                                                <button className="btn btn-primary w-full" style={{ height: '48px' }} onClick={() => setActiveTab('billing')}>Upgrade to Pro</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2xl">
                                        <div style={{ textAlign: 'center' }}>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', color: 'var(--neutral-500)' }}>Institutional Logo</label>
                                            <div style={{ width: '140px', height: '140px', margin: '0 auto', borderRadius: '24px', border: '2px dashed var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fff' }}>
                                                {logoPreview ? <img src={logoPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={48} className="text-neutral-200" />}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                                                <label className="btn btn-ghost btn-xs" style={{ cursor: 'pointer' }}>
                                                    <Camera size={14} /> Change Logo
                                                    <input type="file" hidden onChange={handleLogoUpload} />
                                                </label>
                                                {logoPreview && <button className="btn btn-ghost btn-xs text-error" onClick={() => setLogoPreview('')}><Trash2 size={14} /> Remove</button>}
                                            </div>
                                        </div>
                                        <div className="md:col-span-3 space-y-xl">
                                            <div className="form-group">
                                                <label className="form-label">Brand Motto (Statement Footer)</label>
                                                <input type="text" className="form-input" value={tagline} placeholder="e.g. Empowering Tomorrow's Leaders" onChange={(e) => setTagline(e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Primary UI Accent Color</label>
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '80px', height: '48px', padding: '4px', borderRadius: '12px', border: '1px solid var(--neutral-200)', cursor: 'pointer' }} />
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--neutral-600)', margin: 0 }}>HEX: <strong>{primaryColor}</strong></p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
                                                <button className="btn btn-primary" onClick={handleUpdateBranding} disabled={brandingLoading}>
                                                    {brandingLoading ? <div className="spinner spinner-xs"></div> : <><Check size={18} /> Apply Branding</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="space-y-xl">
                                <div className="card shadow-md">
                                    <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Account Information</h3>
                                    </div>
                                    <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                                            <div className="form-group">
                                                <label className="form-label">Full Name</label>
                                                <input type="text" className="form-input" style={{ background: 'var(--neutral-50)' }} value={session?.user?.name || ''} disabled />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Email Address</label>
                                                <input type="email" className="form-input" style={{ background: 'var(--neutral-50)' }} value={session?.user?.email || ''} disabled />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Account Role</label>
                                                <div className="badge badge-outline" style={{ display: 'inline-flex', padding: '8px 12px' }}>{session?.user?.role}</div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Assigned School</label>
                                                <p style={{ fontWeight: 600, margin: 0 }}>{session?.user?.schoolName || 'System Admin'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-md">
                                    <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-100)', padding: 'var(--spacing-lg)' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Update Password</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: '4px' }}>Ensure your account stays secure with a strong password.</p>
                                    </div>
                                    <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                                        <form onSubmit={handlePasswordChange} className="space-y-xl">
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
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
                                                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                                                    {passwordLoading ? <div className="spinner spinner-xs"></div> : "Update Password"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ADMIN TAB */}
                        {activeTab === 'admin' && session?.user?.role === 'SUPER_ADMIN' && (
                            <div className="card" style={{ border: '2px solid var(--error-200)', background: 'var(--error-50)' }}>
                                <div className="card-header" style={{ padding: 'var(--spacing-lg)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <AlertCircle size={28} className="text-error-600" />
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--error-700)', margin: 0 }}>Emergency Controls</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--error-600)', margin: 0 }}>Global platform operations. Use with caution.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-content" style={{ padding: 'var(--spacing-xl)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--error-100)' }}>
                                        <div>
                                            <h4 style={{ fontWeight: 800, margin: '0 0 4px', color: 'var(--error-700)' }}>Global Maintenance Mode</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', margin: 0, maxWidth: '400px' }}>
                                                Immediately disconnects all users and schools. Only Super Admins can authenticate.
                                            </p>
                                        </div>
                                        <button
                                            className={`btn ${maintenanceMode ? 'btn-error' : 'btn-outline'}`}
                                            onClick={handleToggleMaintenance}
                                            disabled={maintenanceLoading}
                                            style={{ height: '48px', padding: '0 24px', fontWeight: 800 }}
                                        >
                                            {maintenanceMode ? "Disable Maintenance Mode" : "Activate Maintenance"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
