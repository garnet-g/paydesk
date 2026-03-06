'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    School as SchoolIcon,
    Plus,
    Search,
    MapPin,
    Phone,
    Mail,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    Settings,
    KeyRound,
    Trash2,
    Edit,
    Users,
    Activity,
    Globe,
    Building2,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import AddSchoolForm from '@/components/forms/AddSchoolForm'
import EditSchoolForm from '@/components/forms/EditSchoolForm'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function SchoolsPage() {
    const { data: session } = useSession()
    const [schools, setSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingSchool, setEditingSchool] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetchSchools()
    }, [])

    const fetchSchools = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/schools')
            if (res.ok) {
                const data = await res.json()
                setSchools(data)
            }
        } catch (error) {
            console.error('Failed to fetch schools:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return

        try {
            const res = await fetch(`/api/schools/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchSchools()
            } else {
                alert('Failed to delete school')
            }
        } catch (error) {
            alert('Error deleting school')
        }
    }

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Unauthorized access. Only Super Admins can view this page.</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-10 animate-fade-in pb-12">
                {/* Header Section */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Building2 size={20} className="text-blue-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Institutional Ecosystem</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">School Partners</h1>
                        <p className="max-w-xl text-sm font-medium text-muted-foreground">Manage and oversee all educational institutions within the PayDesk network.</p>
                    </div>
                    <button
                        className="group flex items-center justify-center gap-2 rounded-xl bg-[#030213] px-6 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-black active:scale-[0.98]"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={20} className="transition-transform group-hover:rotate-90" />
                        Onboard New School
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="relative group">
                    <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors group-focus-within:text-blue-600" />
                    <input
                        type="text"
                        placeholder="Search schools by name, code, or location..."
                        className="w-full h-16 rounded-[1.5rem] border border-border bg-card pl-14 pr-6 text-base font-medium transition-all focus:border-blue-600/50 focus:outline-none focus:ring-4 focus:ring-blue-600/5 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Schools List */}
                <div className="space-y-4">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/50"></div>
                        ))
                    ) : filteredSchools.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2.5rem] border border-dashed border-border bg-muted/10">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white text-muted-foreground/20 shadow-sm border border-border">
                                <SchoolIcon size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">No schools found</h3>
                            <p className="mt-2 text-sm font-medium text-muted-foreground max-w-xs">
                                No schools match your search. Try broadening your criteria or onboard a new institution.
                            </p>
                        </div>
                    ) : (
                        filteredSchools.map((school, index) => (
                            <SchoolListItem
                                key={school.id}
                                school={school}
                                index={index}
                                onEdit={() => setEditingSchool(school)}
                                onDelete={() => handleDelete(school.id, school.name)}
                                router={router}
                            />
                        ))
                    )}
                </div>
            </div>

            {showAddModal && (
                <AddSchoolForm
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => fetchSchools()}
                />
            )}

            {editingSchool && (
                <EditSchoolForm
                    school={editingSchool}
                    onClose={() => setEditingSchool(null)}
                    onSuccess={() => fetchSchools()}
                />
            )}
        </DashboardLayout>
    )
}

function SchoolListItem({ school, index, onEdit, onDelete, router }: any) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "group relative overflow-hidden rounded-[2rem] border border-border bg-card transition-all duration-300",
                isExpanded ? "shadow-2xl ring-1 ring-blue-600/10" : "shadow-sm hover:border-black/10 hover:shadow-lg"
            )}
        >
            {/* Summary Row */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex cursor-pointer items-center p-6 md:p-8 transition-colors",
                    isExpanded ? "bg-muted/30" : "bg-white"
                )}
            >
                {/* School Avatar */}
                <div className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg transition-transform group-hover:scale-105",
                    school.isActive ? "bg-blue-600 shadow-blue-200" : "bg-muted-foreground/30 shadow-none grayscale"
                )}>
                    {school.name[0]}
                </div>

                {/* Primary Info */}
                <div className="ml-6 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h3 className="truncate text-lg font-extrabold tracking-tight text-foreground">
                            {school.name}
                        </h3>
                        {!school.isActive && (
                            <span className="rounded-md bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-600 ring-1 ring-red-600/10">
                                Suspended
                            </span>
                        )}
                        <span className={cn(
                            "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                            school.planTier === 'ENTERPRISE' ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-600/10" :
                                school.planTier === 'PRO' ? "bg-purple-50 text-purple-600 ring-1 ring-purple-600/10" :
                                    "bg-gray-50 text-gray-600 ring-1 ring-gray-600/10"
                        )}>
                            {school.planTier || 'Classic'}
                        </span>
                    </div>
                    <p className="mt-1 text-xs font-bold font-mono text-muted-foreground/60">{school.code}</p>
                </div>

                {/* Quick Stats */}
                <div className="hidden items-center gap-12 lg:flex mr-12 text-right">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Students</p>
                        <p className="text-sm font-black text-foreground">{school._count?.students.toLocaleString() || 0}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Status</p>
                        <div className="flex justify-end">
                            {school.isActive ? <CheckCircle2 size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-400" />}
                        </div>
                    </div>
                </div>

                {/* Interaction */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-muted group-hover:text-blue-600">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expansion Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <div className="border-t border-border bg-white px-8 py-10">
                            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
                                {/* Governance Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                        <Globe size={14} /> Local Footprint
                                    </div>
                                    <div className="space-y-4">
                                        <InfoItem icon={<MapPin size={16} />} text={school.address || 'Location undefined'} />
                                        <InfoItem icon={<Phone size={16} />} text={school.phoneNumber || 'Contact unavailable'} />
                                        <InfoItem icon={<Mail size={16} />} text={school.email || 'Email missing'} />
                                    </div>
                                </div>

                                {/* Administrative Access */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                        <KeyRound size={14} /> Executive Access
                                    </div>
                                    <div className="rounded-[1.5rem] border border-border bg-muted/10 p-6 shadow-inner">
                                        {school.users?.[0] ? (
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Platform Delegate</p>
                                                    <p className="truncate text-sm font-bold text-foreground">{school.users[0].email}</p>
                                                </div>
                                                <button
                                                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 transition-opacity hover:opacity-80"
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        if (confirm(`Reset credentials for ${school.users[0].email}?`)) {
                                                            const res = await fetch(`/api/users/${school.users[0].id}/reset-password`, { method: 'POST' })
                                                            if (res.ok) alert('Success: Credentials reset to standard default.')
                                                            else alert('Unable to process request.')
                                                        }
                                                    }}
                                                >
                                                    <Activity size={14} /> Rotate Security Keys
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center py-2 h-full">
                                                <p className="text-xs font-bold text-muted-foreground/40 italic uppercase tracking-widest">No assigned delegate</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Performance & Governance */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                        <Settings size={14} /> Governance Controls
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-3">
                                            <button
                                                className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]"
                                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                            >
                                                Adjust Configuration
                                            </button>
                                            <button
                                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                                                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/reports'); }}
                                            >
                                                <TrendingUp size={18} />
                                            </button>
                                        </div>
                                        <button
                                            className="w-full rounded-xl border border-red-100 py-3 text-xs font-bold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]"
                                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                        >
                                            Retire Institution
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

function InfoItem({ icon, text }: { icon: any, text: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-0.5 text-muted-foreground/40">{icon}</div>
            <span className="text-sm font-semibold text-foreground/80 leading-snug">{text}</span>
        </div>
    )
}
