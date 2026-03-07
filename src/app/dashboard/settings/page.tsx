'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    Settings,
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
    Camera,
    Trash2,
    Palette,
    ArrowRight,
    Zap,
    Loader2,
    Building,
    Mail,
    Phone,
    MapPin,
    Calendar,
    KeyRound,
    ShieldCheck,
    Globe,
    Smartphone,
    CreditCard as BankIcon,
    ArrowUpRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function SettingsPage() {
    const { data: session, update } = useSession()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'branding' | 'security' | 'admin'>('general')

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
        mpesa_shortcode: "",
        mpesa_consumer_key: "",
        mpesa_consumer_secret: "",
        mpesa_passkey: "",
        mpesa_env: "sandbox",
        subscription_plan: "FREE",
        bank_name: "",
        bank_account: "",
        bank_account_name: "",
        bank_branch: "",
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
        if (session?.user?.role === 'PARENT' && activeTab === 'general') {
            setActiveTab('security')
        }

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
                            mpesa_shortcode: data.mpesaShortcode || "",
                            mpesa_consumer_key: data.mpesaConsumerKey || "",
                            mpesa_consumer_secret: data.mpesaConsumerSecret || "",
                            mpesa_passkey: data.mpesaPasskey || "",
                            mpesa_env: data.mpesaEnv || "sandbox",
                            subscription_plan: data.planTier || "FREE",
                            bank_name: data.bankName || "",
                            bank_account: data.bankAccount || "",
                            bank_account_name: data.bankAccountName || "",
                            bank_branch: data.bankBranch || "",
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
                    mpesaShortcode: form.mpesa_shortcode,
                    mpesaConsumerKey: form.mpesa_consumer_key,
                    mpesaConsumerSecret: form.mpesa_consumer_secret,
                    mpesaPasskey: form.mpesa_passkey,
                    mpesaEnv: form.mpesa_env,
                    planTier: form.subscription_plan,
                    bankName: form.bank_name,
                    bankAccount: form.bank_account,
                    bankAccountName: form.bank_account_name,
                    bankBranch: form.bank_branch,
                })
            })

            if (res.ok) {
                toast.success('System configuration synchronized successfully.')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to authorize settings change')
            }
        } catch (err) {
            toast.error('Network synchronization failure')
        } finally {
            setSaving(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordLoading(true)

        if (newPassword !== confirmPassword) {
            toast.error('Cryptographic mismatch: New passwords do not match')
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
                toast.success('Security credentials updated successfully.')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                toast.error(data.error || 'Authentication credential update rejected')
            }
        } catch (err) {
            toast.error('Security terminal connection failure')
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Payload size exceeded. Max 2MB.')
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
        const fileName = `${session.user.schoolId}-${crypto.randomUUID()}.${fileExt}`
        const filePath = `logos/${fileName}`

        const { data, error } = await supabase.storage
            .from('school-assets')
            .upload(filePath, file, { cacheControl: '3600', upsert: true })

        if (error) {
            toast.error('Asset upload terminal failure: ' + error.message)
            throw new Error('Failed to upload logo')
        }

        const { data: { publicUrl } } = supabase.storage
            .from('school-assets')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleUpdateBranding = async () => {
        if (!session?.user?.schoolId) return

        setBrandingLoading(true)
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
                const saved = await res.json()
                const confirmedLogoUrl = saved.logoUrl || finalLogoUrl
                toast.success('Visual identity re-indexed successfully.')
                await update({
                    user: { ...session?.user, logoUrl: confirmedLogoUrl }
                })
                setTimeout(() => window.location.reload(), 1500)
            } else {
                const data = await res.json()
                toast.error(data.error || 'Visual identity update rejected')
            }
        } catch (err: any) {
            if (!err.message.includes('upload')) {
                toast.error('Branding synchronization error')
            }
        } finally {
            setBrandingLoading(false)
        }
    }

    const handleToggleMaintenance = async () => {
        if (!confirm('Confirm: Execute global maintenance override?')) return

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
                toast.info(`System State: ${data.active ? 'MAINTENANCE_ACTIVE' : 'OPERATIONAL'}`)
            }
        } catch (err) {
            toast.error('System control link failure')
        } finally {
            setMaintenanceLoading(false)
        }
    }

    if (loading) return (
        <DashboardLayout>
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600/40" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Decrypting Settings Registry...</p>
                </div>
            </div>
        </DashboardLayout>
    )

    const isPrincipalOrAdmin = ['PRINCIPAL', 'SUPER_ADMIN'].includes(session?.user?.role || '')
    const isPro = ['PRO', 'ENTERPRISE'].includes(session?.user?.planTier || 'FREE') || session?.user?.role === 'SUPER_ADMIN'

    const tabs = [
        ...(session?.user?.role !== 'PARENT' ? [
            { id: 'general', label: 'Institutional', icon: Building2 },
            { id: 'payments', label: 'Financial Hub', icon: CreditCard }
        ] : []),
        ...(isPrincipalOrAdmin ? [{ id: 'branding', label: 'Visual Identity', icon: Palette }] : []),
        { id: 'security', label: 'Security Node', icon: Shield },
        ...(session?.user?.role === 'SUPER_ADMIN' ? [{ id: 'admin', label: 'System Admin', icon: AlertCircle }] : [])
    ]

    return (
        <DashboardLayout>
            <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 shadow-xl shadow-slate-200/50 dark:shadow-none border border-border dark:border-slate-800 transition-all hover:scale-105">
                            <Settings size={28} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-foreground dark:text-white leading-none">
                                Configuration
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-blue-500" />
                                Institutional Control & Platform Preferences
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Navigation Sidebar */}
                    <aside className="lg:w-64 shrink-0 flex flex-col gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all italic text-left",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-xl shadow-blue-100 dark:shadow-none scale-105"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900/50"
                                    )}
                                >
                                    <Icon size={18} className={cn(isActive ? "text-blue-400" : "text-slate-300")} />
                                    {tab.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'general' && (
                                    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden">
                                        <CardHeader className="p-10 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
                                            <div className="flex items-center gap-4 mb-2">
                                                <Building className="text-blue-600" size={24} />
                                                <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Institutional Details</CardTitle>
                                            </div>
                                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 italic">Configure the core profile of your educational facility</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-10">
                                            <form onSubmit={handleSaveSettings} className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Official Institution Name</Label>
                                                        <Input
                                                            value={form.school_name}
                                                            onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                                                            className="h-14 rounded-2xl border-border bg-white dark:bg-slate-900/50 font-bold uppercase ring-offset-background focus-visible:ring-2 focus-visible:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Motto / Tagline</Label>
                                                        <Input
                                                            value={form.school_motto}
                                                            onChange={(e) => setForm({ ...form, school_motto: e.target.value })}
                                                            className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold italic"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Contact Phone</Label>
                                                        <div className="relative group">
                                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600" size={18} />
                                                            <Input
                                                                value={form.phone}
                                                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                                className="h-14 pl-12 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Institutional Email</Label>
                                                        <div className="relative group">
                                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600" size={18} />
                                                            <Input
                                                                type="email"
                                                                value={form.email}
                                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                                className="h-14 pl-12 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Physical Address</Label>
                                                        <div className="relative group">
                                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600" size={18} />
                                                            <Input
                                                                value={form.address}
                                                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                                                className="h-14 pl-12 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Current Academic Term</Label>
                                                        <Select value={form.current_term} onValueChange={(v) => setForm({ ...form, current_term: v })}>
                                                            <SelectTrigger className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl">
                                                                <SelectItem value="Term 1" className="font-bold italic">Term 1</SelectItem>
                                                                <SelectItem value="Term 2" className="font-bold italic">Term 2</SelectItem>
                                                                <SelectItem value="Term 3" className="font-bold italic">Term 3</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Academic Year</Label>
                                                        <div className="relative group">
                                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600" size={18} />
                                                            <Input
                                                                value={form.current_year}
                                                                onChange={(e) => setForm({ ...form, current_year: e.target.value })}
                                                                className="h-14 pl-12 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-8 border-t border-slate-100 dark:border-slate-900">
                                                    <div className="flex items-center gap-4 mb-8">
                                                        <BankIcon className="text-emerald-600" size={24} />
                                                        <div>
                                                            <h3 className="text-lg font-black uppercase tracking-tighter italic">Banking Protocols</h3>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">For direct bank transfer instructions</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Bank Name</Label>
                                                            <Input
                                                                placeholder="e.g. KCB, EQUITY, CO-OP"
                                                                value={form.bank_name}
                                                                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold uppercase"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Account Number</Label>
                                                            <Input
                                                                value={form.bank_account}
                                                                onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold uppercase"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Account Holder Name</Label>
                                                            <Input
                                                                value={form.bank_account_name}
                                                                onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold uppercase"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Branch Name</Label>
                                                            <Input
                                                                value={form.bank_branch}
                                                                onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold uppercase"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-4">
                                                    <Button
                                                        type="submit"
                                                        disabled={saving}
                                                        className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] italic shadow-xl shadow-slate-200 dark:bg-white dark:text-slate-950 transition-all"
                                                    >
                                                        {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                                                        Synchronize Changes
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeTab === 'payments' && (
                                    <div className="space-y-8">
                                        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden">
                                            <CardHeader className="p-10 border-b border-slate-100 dark:border-slate-900 bg-emerald-50/50 dark:bg-emerald-900/10">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <Smartphone className="text-emerald-600" size={24} />
                                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">M-Pesa / Daraja Node</CardTitle>
                                                </div>
                                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/60 italic">Automated payment reconciliation system</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-10">
                                                <div className="bg-slate-950 rounded-[2rem] p-8 mb-10 border border-slate-800 relative overflow-hidden group">
                                                    <Zap className="absolute right-[-10px] top-[-10px] text-blue-600/10 h-32 w-32 transition-transform group-hover:scale-110" />
                                                    <div className="relative z-10 flex gap-6">
                                                        <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900">
                                                            <ShieldCheck size={24} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="text-white font-black uppercase tracking-tight italic">Secure Transmission Protocol</h4>
                                                            <p className="text-slate-400 text-xs leading-relaxed font-bold italic">
                                                                PayDesk utilizes direct Daraja TLS handshake. Transmissions bypass intermediary servers and settle directly in your shortcode.
                                                            </p>
                                                            <a href="https://developer.safaricom.co.ke" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors pt-2">
                                                                Access Safaricom Developer Hub <ArrowUpRight size={14} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>

                                                <form onSubmit={handleSaveSettings} className="space-y-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Service Shortcode / Paybill</Label>
                                                            <Input
                                                                value={form.mpesa_paybill}
                                                                onChange={e => setForm({ ...form, mpesa_paybill: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-mono font-bold"
                                                                placeholder="e.g. 247247"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">STK Push Shortcode</Label>
                                                            <Input
                                                                value={form.mpesa_shortcode}
                                                                onChange={e => setForm({ ...form, mpesa_shortcode: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-mono font-bold"
                                                                placeholder="e.g. 247247"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Consumer Key</Label>
                                                            <Input
                                                                type="password"
                                                                value={form.mpesa_consumer_key}
                                                                onChange={e => setForm({ ...form, mpesa_consumer_key: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-mono"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Consumer Secret</Label>
                                                            <Input
                                                                type="password"
                                                                value={form.mpesa_consumer_secret}
                                                                onChange={e => setForm({ ...form, mpesa_consumer_secret: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-mono"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Lipa Na M-Pesa Passkey</Label>
                                                            <Input
                                                                type="password"
                                                                value={form.mpesa_passkey}
                                                                onChange={e => setForm({ ...form, mpesa_passkey: e.target.value })}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-mono"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Environment Stage</Label>
                                                            <Select value={form.mpesa_env} onValueChange={e => setForm({ ...form, mpesa_env: e })}>
                                                                <SelectTrigger className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-2xl">
                                                                    <SelectItem value="sandbox" className="font-bold uppercase tracking-widest text-[10px] italic">Development / Sandbox</SelectItem>
                                                                    <SelectItem value="production" className="font-bold uppercase tracking-widest text-[10px] italic text-red-600">Live / Production</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            {form.mpesa_env === 'production' && (
                                                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-2 italic flex items-center gap-1">
                                                                    <AlertCircle size={10} /> CRITICAL: Real-world transactions enabled.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-4">
                                                        <Button
                                                            type="submit"
                                                            disabled={saving}
                                                            className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] italic shadow-xl shadow-emerald-100 dark:shadow-none transition-all"
                                                        >
                                                            {saving ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" size={18} />}
                                                            Authorize Payments
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden">
                                            <CardContent className="p-8 flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400">
                                                        <Zap size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black uppercase tracking-tighter italic">Reconciliation Testing</h4>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">Verify your automation rules without live funds</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => router.push('/dashboard/settings/mpesa')}
                                                    variant="secondary"
                                                    className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] italic"
                                                >
                                                    Open Simulator
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeTab === 'branding' && isPrincipalOrAdmin && (
                                    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden">
                                        <CardHeader className="p-10 border-b border-slate-100 dark:border-slate-900 bg-indigo-50/50 dark:bg-indigo-900/10">
                                            <div className="flex items-center gap-4 mb-2">
                                                <Palette className="text-indigo-600" size={24} />
                                                <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Visual Identity</CardTitle>
                                            </div>
                                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-indigo-600/60 italic">Standardize your institutional branding across the platform</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-10 relative">
                                            {!isPro && (
                                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
                                                    <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl max-w-sm text-center border border-slate-800 animate-in zoom-in-95 duration-500">
                                                        <Lock size={40} className="mx-auto mb-6 text-blue-400" />
                                                        <h4 className="text-2xl font-black uppercase tracking-tighter italic mb-2">PRO Identity Hub</h4>
                                                        <p className="text-slate-400 text-xs font-bold italic mb-8 leading-relaxed">
                                                            Unlock logo uploads, primary color calibration, and custom mottos in the platform footer.
                                                        </p>
                                                        <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] italic">
                                                            Upgrade Terminal
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-10">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
                                                    <div className="space-y-4">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Institutional Logo</Label>
                                                        <div className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center overflow-hidden relative group">
                                                            {logoPreview ? (
                                                                <>
                                                                    <img src={logoPreview} alt="Logo" className="w-[80%] h-[80%] object-contain" />
                                                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <label className="cursor-pointer p-4 bg-white text-slate-900 rounded-full shadow-xl">
                                                                            <Camera size={20} />
                                                                            <input type="file" hidden onChange={handleLogoUpload} />
                                                                        </label>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="text-center p-8 space-y-4">
                                                                    <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-200 mx-auto shadow-sm">
                                                                        <Camera size={32} />
                                                                    </div>
                                                                    <label className="block cursor-pointer">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Select Vector File</span>
                                                                        <input type="file" hidden onChange={handleLogoUpload} />
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {logoPreview && (
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => { setLogoPreview(''); setLogoFile(null); }}
                                                                className="w-full text-[9px] font-black uppercase tracking-widest text-red-500 italic"
                                                            >
                                                                <Trash2 size={12} className="mr-2" /> Expunge Logo
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="md:col-span-2 space-y-8">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Platform Tagline (Footer)</Label>
                                                            <Input
                                                                value={tagline}
                                                                onChange={(e) => setTagline(e.target.value)}
                                                                placeholder="e.g. EMPOWERING TOMORROW'S LEADERS"
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50 font-bold uppercase tracking-tight"
                                                            />
                                                        </div>

                                                        <div className="space-y-4">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">UI Accent Protocol (Primary Color)</Label>
                                                            <div className="flex items-center gap-6">
                                                                <div className="h-20 w-32 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none border border-border p-1.5 bg-white dark:bg-slate-900">
                                                                    <input
                                                                        type="color"
                                                                        value={primaryColor}
                                                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                                                        className="w-full h-full rounded-xl cursor-pointer border-none bg-transparent"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-black mono text-slate-900 dark:text-white uppercase">{primaryColor}</div>
                                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Identity Hex Code</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-4">
                                                    <Button
                                                        onClick={handleUpdateBranding}
                                                        disabled={brandingLoading}
                                                        className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px] italic shadow-xl shadow-indigo-100 dark:shadow-none transition-all"
                                                    >
                                                        {brandingLoading ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" size={18} />}
                                                        Deploy Visual Changes
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-8">
                                        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden group">
                                            <CardHeader className="p-10 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <User className="text-slate-900 dark:text-white" size={24} />
                                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Personal Matrix</CardTitle>
                                                </div>
                                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 italic">User identity & permission settings</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div className="space-y-1.5 p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 border border-border">
                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Verified Full Name</Label>
                                                        <div className="text-lg font-black uppercase italic tracking-tight">{session?.user?.name || 'N/A'}</div>
                                                    </div>
                                                    <div className="space-y-1.5 p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 border border-border">
                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Authorized Email</Label>
                                                        <div className="text-lg font-black italic tracking-tight">{session?.user?.email || 'N/A'}</div>
                                                    </div>
                                                    <div className="space-y-1.5 p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 border border-border">
                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Security clearance Role</Label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-lg font-black uppercase italic tracking-tight">{session?.user?.role}</div>
                                                            <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] italic rounded-lg">TRUSTED</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 border border-border">
                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Institutional Anchor</Label>
                                                        <div className="text-lg font-black uppercase italic tracking-tight">{session?.user?.schoolName || 'Global Services'}</div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden">
                                            <CardHeader className="p-10 border-b border-slate-100 dark:border-slate-900 bg-red-50/50 dark:bg-red-900/10">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <KeyRound className="text-red-600" size={24} />
                                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Credential Override</CardTitle>
                                                </div>
                                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-red-600/60 italic">Rotate security keys for account access</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-10">
                                                <form onSubmit={handlePasswordChange} className="space-y-8">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Current Password Artifact</Label>
                                                        <Input
                                                            type="password"
                                                            value={currentPassword}
                                                            onChange={e => setCurrentPassword(e.target.value)}
                                                            className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">New Terminal Password</Label>
                                                            <Input
                                                                type="password"
                                                                value={newPassword}
                                                                onChange={e => setNewPassword(e.target.value)}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50"
                                                                required
                                                                minLength={6}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Verification Code</Label>
                                                            <Input
                                                                type="password"
                                                                value={confirmPassword}
                                                                onChange={e => setConfirmPassword(e.target.value)}
                                                                className="h-14 rounded-2xl border-border bg-slate-50 dark:bg-slate-900/50"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end pt-4">
                                                        <Button
                                                            type="submit"
                                                            disabled={passwordLoading}
                                                            className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] italic shadow-xl shadow-slate-200 dark:bg-white dark:text-slate-950 transition-all"
                                                        >
                                                            {passwordLoading ? <Loader2 className="animate-spin mr-2" /> : <Lock className="mr-2" size={18} />}
                                                            Rotate Credentials
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeTab === 'admin' && session?.user?.role === 'SUPER_ADMIN' && (
                                    <div className="space-y-8">
                                        <Card className="rounded-[2.5rem] border-2 border-red-500/20 shadow-2xl bg-red-50/50 dark:bg-red-950/20 overflow-hidden">
                                            <CardHeader className="p-10 border-b border-red-200 dark:border-red-900/50">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <AlertCircle className="text-red-600" size={24} />
                                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic text-red-700 dark:text-red-400">Strategic Overrides</CardTitle>
                                                </div>
                                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-red-600/60 italic">Critical platform-wide systemic controls</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-10">
                                                <div className="flex flex-col md:flex-row items-center justify-between gap-10 bg-white dark:bg-slate-950 p-10 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-lg">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <Shield className="text-red-600" size={20} />
                                                            <h4 className="text-xl font-black uppercase tracking-tighter italic">Global Maintenance Protocol</h4>
                                                        </div>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold italic leading-relaxed max-w-md">
                                                            Severing all non-admin sessions. This procedure places the platform in read-only state for standard accounts during critical infrastructure updates.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={handleToggleMaintenance}
                                                        disabled={maintenanceLoading}
                                                        variant={maintenanceMode ? "destructive" : "outline"}
                                                        className={cn(
                                                            "h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] italic shadow-xl group transition-all",
                                                            maintenanceMode ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "border-slate-200 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {maintenanceLoading ? (
                                                            <Loader2 className="animate-spin" />
                                                        ) : (
                                                            maintenanceMode ? "DEACTIVATE PROTOCOL" : "INITIALIZE OVERRIDE"
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
