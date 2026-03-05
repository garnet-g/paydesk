'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Briefcase, Plus, Search, Trash2, Mail, Phone, MailQuestion, UserCog, UserPlus, Shield, ShieldCheck, ShieldAlert, Loader2, MoreHorizontal, Ghost } from 'lucide-react'
import AddStaffForm from '@/components/forms/AddStaffForm'
import { formatDateTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function StaffPage() {
    const { data: session } = useSession()
    const [staff, setStaff] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/staff')
            if (res.ok) {
                const data = await res.json()
                setStaff(data)
            } else {
                toast.error("Security briefing: Failed to fetch personnel files")
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error)
            toast.error("Communications blackout: Network error")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`REVOKE CLEARANCE: Are you sure you want to terminate ${name}? This action will expunge all access privileges.`)) return

        try {
            const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Security clearance revoked")
                fetchStaff()
            } else {
                toast.error('Termination rejected: Server error')
            }
        } catch (error) {
            toast.error('Termination operation failed')
        }
    }

    if (session?.user?.role !== 'PRINCIPAL' && session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-in fade-in duration-500">
                    <div className="h-24 w-24 bg-red-100 dark:bg-red-900/30 rounded-[2rem] flex items-center justify-center text-red-600 mb-8 border-4 border-white dark:border-slate-800 shadow-xl">
                        <ShieldAlert size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 text-center">Security Violation</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic text-center max-w-md">
                        Clearance Level Insufficient. Only <span className="text-red-600 font-black uppercase">Command Staff (Principal)</span> are authorized to access the Personnel Module.
                    </p>
                    <Button variant="outline" className="mt-8 rounded-xl font-black text-xs uppercase tracking-widest" onClick={() => window.history.back()}>
                        Abort Access
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    const filteredStaff = staff.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getRoleStyles = (role: string) => {
        switch (role) {
            case 'PRINCIPAL': return 'bg-blue-600 text-white border-blue-600'
            case 'BURSAR': return 'bg-emerald-600 text-white border-emerald-600'
            case 'REGISTRAR': return 'bg-purple-600 text-white border-purple-600'
            default: return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        }
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <ShieldCheck size={24} className="text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Command Center</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                            Managing high-clearance administrators at <span className="text-blue-600 font-black uppercase not-italic">{session?.user?.schoolName}</span>
                        </p>
                    </div>
                    <Button
                        className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 dark:shadow-none"
                        onClick={() => setShowAddModal(true)}
                    >
                        <UserPlus size={18} className="mr-2" />
                        Authorize New Staff
                    </Button>
                </div>

                {/* Personnel Registry Card */}
                <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900 p-8">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="relative flex-1 group">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    type="text"
                                    placeholder="Scanning Database: Search by name or secure email..."
                                    className="h-14 pl-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="hidden md:flex flex-col items-center justify-center px-8 h-14 bg-slate-900 rounded-2xl text-white">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Corps Strength</span>
                                <span className="text-xl font-black leading-none">{filteredStaff.length} UNIT(S)</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Biometrics</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Clearance (Role)</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Channels</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Transmission</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="inline-flex items-center gap-3">
                                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                                    <span className="text-2xl font-black text-slate-400 uppercase italic tracking-tighter">Syncing Secure Files...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="max-w-xs mx-auto flex flex-col items-center">
                                                    <div className="h-20 w-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-300 dark:text-slate-800 mb-6 shadow-inner">
                                                        <Ghost size={48} />
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Registry Void</h3>
                                                    <p className="text-slate-400 text-sm font-medium italic">No personnel matching those signatures were located in the current sector.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((member) => (
                                            <tr key={member.id} className={cn(
                                                "group hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all border-l-4 border-transparent hover:border-blue-600",
                                                !member.isActive && "opacity-50 grayscale select-none"
                                            )}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner group-hover:scale-110 transition-transform border-4 border-white dark:border-slate-900",
                                                            member.role === 'PRINCIPAL' ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                        )}>
                                                            {member.firstName[0]}{member.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base leading-tight">
                                                                {member.firstName} {member.lastName}
                                                            </div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
                                                                ID Ref: {member.id.substring(0, 8).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge className={cn(
                                                        "font-black text-[9px] px-3 h-6 uppercase tracking-[0.2em] border-none",
                                                        getRoleStyles(member.role)
                                                    )}>
                                                        {member.role.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            <Mail size={14} className="text-blue-600" />
                                                            {member.email}
                                                        </div>
                                                        {member.phoneNumber && (
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                                <Phone size={12} className="text-slate-300" />
                                                                {member.phoneNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "h-2 w-2 rounded-full",
                                                            member.isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                                                        )}></div>
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-[0.2em] italic",
                                                            member.isActive ? "text-emerald-600" : "text-red-600"
                                                        )}>{member.isActive ? 'Operationally Active' : 'Decommissioned'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                                                        {member.lastLogin ? formatDateTime(member.lastLogin) : 'ZERO ACTIVITY RECORDED'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {member.id !== session.user.id && member.role !== 'PRINCIPAL' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all"
                                                            onClick={() => handleDelete(member.id, member.firstName)}
                                                            title="Expunge Record"
                                                        >
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    )}
                                                    {member.id === session.user.id && (
                                                        <Badge variant="outline" className="font-black text-[8px] uppercase text-blue-600 border-blue-600 italic">Self (Command)</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>

                    <div className="bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900 p-6">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                            <Shield size={14} /> Total Authorized Personnel in Cluster: {filteredStaff.length} • Central Command Network
                        </div>
                    </div>
                </Card>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <AddStaffForm
                            onClose={() => setShowAddModal(false)}
                            onSuccess={fetchStaff}
                        />
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
