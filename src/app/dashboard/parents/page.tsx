'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    Users,
    Search,
    Edit,
    UserCheck,
    UserX,
    Mail,
    Phone,
    X,
    Save,
    Plus,
    Trash2,
    KeyRound,
    Loader2,
    Calendar,
    GraduationCap,
    ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function ParentsPage() {
    const { data: session } = useSession()
    const [parents, setParents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal States
    const [showFormModal, setShowFormModal] = useState(false)
    const [editingParent, setEditingParent] = useState<any>(null)

    // Form States
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchParents()
    }, [])

    const fetchParents = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/parents')
            const data = await res.json()
            setParents(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to fetch parents:', error)
            toast.error("Resource acquisition failure")
        } finally {
            setLoading(false)
        }
    }

    const toggleParentStatus = async (parent: any) => {
        try {
            const res = await fetch(`/api/parents/${parent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !parent.isActive })
            })
            if (res.ok) {
                toast.success(`Access ${parent.isActive ? 'suspended' : 'restored'} successfully`)
                fetchParents()
            }
        } catch (error) {
            toast.error('System synchronization error')
        }
    }

    const handleDeleteParent = async (parent: any) => {
        if (!confirm(`Are you sure you want to remove ${parent.firstName} ${parent.lastName}? This will also un-link them from any students.`)) return

        try {
            const res = await fetch(`/api/parents/${parent.id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Account permanently expunged")
                fetchParents()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Deletion rejected')
            }
        } catch (error) {
            toast.error('Data destruction process failed')
        }
    }

    const handleResetPassword = async (parent: any) => {
        if (!confirm(`Are you sure you want to reset the password for ${parent.firstName}?`)) return

        try {
            const res = await fetch(`/api/users/${parent.id}/reset-password`, { method: 'POST' })
            if (res.ok) {
                toast.success('Authentication reset successfully!')
            } else {
                toast.error('Failed to reset security terminal')
            }
        } catch (error) {
            toast.error('Cryptographic sync failure')
        }
    }

    const handleEditClick = (parent: any) => {
        setEditingParent(parent)
        setForm({
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            phoneNumber: parent.phoneNumber || ''
        })
        setShowFormModal(true)
    }

    const handleAddClick = () => {
        setEditingParent(null)
        setForm({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: ''
        })
        setShowFormModal(true)
    }

    const handleSaveParent = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const url = editingParent ? `/api/parents/${editingParent.id}` : '/api/parents'
            const method = editingParent ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                setShowFormModal(false)
                setEditingParent(null)
                fetchParents()
                toast.success(editingParent ? "Registry record updated" : "Parent account established")
            } else {
                const data = await res.json()
                toast.error(data.error || 'Operation rejected')
            }
        } catch (error) {
            toast.error('Database connection error during write')
        } finally {
            setIsSaving(false)
        }
    }

    const closeModal = () => {
        setShowFormModal(false)
        setEditingParent(null)
    }

    const filteredParents = (parents || []).filter(parent =>
        `${parent.firstName} ${parent.lastName} ${parent.email} ${parent.phoneNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
                {/* Modern Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-800">
                            <Users size={28} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-foreground dark:text-white leading-none">
                                Guardians
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-blue-500" />
                                Family access & communications hub
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleAddClick}
                        className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 dark:bg-white dark:text-slate-950 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} className="mr-2" />
                        Register Parent
                    </Button>
                </div>

                {/* Performance Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-950 overflow-hidden group">
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                                <Users size={28} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-1">Total Verified</div>
                                <div className="text-3xl font-black italic tracking-tighter uppercase">{parents.length} Accounts</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-950 overflow-hidden group">
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-100/50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                                <UserCheck size={28} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-1">Active Status</div>
                                <div className="text-3xl font-black italic tracking-tighter uppercase">{parents.filter(p => p.isActive).length} Verified</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-950 overflow-hidden group">
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-purple-100/50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
                                <GraduationCap size={28} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-1">Student Density</div>
                                <div className="text-3xl font-black italic tracking-tighter uppercase">High Coverage</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtering Hub */}
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 p-2 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                    <div className="flex items-center gap-4 px-6 h-16">
                        <Search size={18} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="OPERATIONAL SEARCH: FIND GUARDIANS BY IDENTITY, BIO OR CHANNEL..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest placeholder:opacity-30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-[9px] font-black uppercase italic tracking-widest text-slate-500">
                            <Loader2 size={12} className={cn("animate-spin", !loading && "hidden")} />
                            {loading ? "Syncing..." : "Ready"}
                        </div>
                    </div>
                </Card>

                {/* Data Grid */}
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5 border-b border-border dark:border-slate-900">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Identity Platform</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Comm Channels</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Associated Units</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Access Crypt</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                <AnimatePresence mode='popLayout'>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="animate-spin text-blue-600" size={48} />
                                                    <span className="text-xl font-black italic uppercase tracking-tighter animate-pulse text-slate-400">Synchronizing Parent Registry...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredParents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-24 text-center">
                                                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                                    <Users size={40} className="text-slate-200" />
                                                </div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Null Data Array</h3>
                                                <p className="text-slate-500 font-bold text-xs uppercase italic tracking-widest">No guardian records identified within current filter.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredParents.map((parent, idx) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={parent.id}
                                                className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm uppercase italic shadow-lg">
                                                            {parent.firstName[0]}{parent.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black uppercase tracking-tight text-foreground dark:text-white">{parent.firstName} {parent.lastName}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase italic flex items-center gap-2 mt-1">
                                                                <Calendar size={10} />
                                                                DEPLOYED: {new Date(parent.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400">
                                                            <Mail size={12} className="text-blue-500" />
                                                            {parent.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400">
                                                            <Phone size={12} className="text-emerald-500" />
                                                            {parent.phoneNumber || 'NO SIGNAL'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-wrap gap-2">
                                                        {parent.guardianships && parent.guardianships.length > 0 ? (
                                                            parent.guardianships.map((g: any) => (
                                                                <Badge key={g.student.id} variant="outline" className="h-6 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2">
                                                                    {g.student.firstName}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] font-black uppercase italic text-slate-300">UNLINKED</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge className={cn(
                                                        "h-7 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-sm",
                                                        parent.isActive
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    )}>
                                                        {parent.isActive ? 'OPERATIONAL' : 'OFFLINE'}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
                                                            onClick={() => handleEditClick(parent)}
                                                        >
                                                            <Edit size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "h-9 w-9 rounded-xl",
                                                                parent.isActive
                                                                    ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                                                    : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500"
                                                            )}
                                                            onClick={() => toggleParentStatus(parent)}
                                                        >
                                                            {parent.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                                            onClick={() => handleResetPassword(parent)}
                                                        >
                                                            <KeyRound size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl hover:bg-red-600 hover:text-white text-red-500 transition-all"
                                                            onClick={() => handleDeleteParent(parent)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Integration Info Bar */}
                <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative border border-slate-800 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                            <Mail size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="font-black uppercase tracking-tighter italic text-xl">Guardian Portal Security</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic flex items-center gap-2">
                                <ShieldCheck size={12} className="text-blue-500" />
                                256-bit AES encryption active on all communication channels
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 relative z-10 pr-4">
                        <div className="text-right">
                            <div className="text-xs font-black text-blue-400 uppercase italic">Network Load</div>
                            <div className="text-xl font-black tracking-widest uppercase italic leading-none mt-1">OPTIMIZED</div>
                        </div>
                    </div>
                </div>

                {/* MODAL SYSTEM */}
                <AnimatePresence>
                    {showFormModal && (
                        <div className="modal-overlay" onClick={closeModal}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="modal-content"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                                            {editingParent ? <Edit size={20} /> : <Plus size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="modal-title">{editingParent ? 'Modify Guardian' : 'Establish Guardian'}</h3>
                                            <p className="text-blue-400 font-black text-[9px] uppercase tracking-[0.2em] mt-1 italic">
                                                {editingParent ? 'Updating secure registry data' : 'Creating new family authentication channel'}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors" onClick={closeModal}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleSaveParent} className="flex flex-col flex-1 overflow-hidden">
                                    <div className="modal-body space-y-8 py-10 custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity: First Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-6 font-black uppercase text-sm text-foreground dark:text-white placeholder:opacity-20"
                                                    placeholder="GIVEN NAME"
                                                    value={form.firstName}
                                                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity: Last Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-6 font-black uppercase text-sm text-foreground dark:text-white placeholder:opacity-20"
                                                    placeholder="SURNAME"
                                                    value={form.lastName}
                                                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Digital Channel: Email</label>
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-14 pr-6 font-black uppercase text-sm text-foreground dark:text-white placeholder:opacity-20"
                                                    placeholder="SECURE@EMAIL.COM"
                                                    value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Comms Platform: Phone (M-Pesa)</label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
                                                    type="tel"
                                                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-14 pr-6 font-black uppercase text-sm text-foreground dark:text-white placeholder:opacity-20"
                                                    placeholder="07XX XXX XXX"
                                                    value={form.phoneNumber}
                                                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest ml-1 mt-2">Required for billing notifications and automated STK push payments.</p>
                                        </div>

                                        {!editingParent && (
                                            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[1.5rem] flex items-start gap-4">
                                                <KeyRound size={20} className="text-blue-600 mt-1" />
                                                <div>
                                                    <div className="text-[11px] font-black uppercase tracking-[0.1em] text-blue-700 dark:text-blue-400">Security Clearance Credentials</div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase italic leading-relaxed mt-1">
                                                        Temporal access key: <strong className="text-blue-600 underline tracking-widest">{session?.user?.schoolName?.toUpperCase() || 'SCHOOL'}@123</strong>.
                                                        Forced rotation requested on initial deployment.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer bg-slate-50 dark:bg-slate-900/50">
                                        <Button type="button" variant="ghost" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400" onClick={closeModal}>
                                            Abort Operation
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="h-12 px-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Save size={18} className="mr-2" />
                                                    {editingParent ? 'Update Registry' : 'Establish Access'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    )
}
