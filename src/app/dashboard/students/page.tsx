'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { GraduationCap, Search, Filter, Edit, Trash2, FileText, Download, Users, UserPlus, AlertTriangle, Loader2, ChevronLeft, Building2, ChevronRight, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import StudentForm from '@/components/forms/StudentForm'
import StudentProfileModal from '@/components/modals/StudentProfileModal'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function StudentsPage() {
    const { data: session } = useSession()
    const [classes, setClasses] = useState<any[]>([])
    const [selectedClass, setSelectedClass] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])

    // Limits
    const [totalStudents, setTotalStudents] = useState(0)

    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [showFormModal, setShowFormModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [selectedProfileStudent, setSelectedProfileStudent] = useState<any>(null)

    const planTier = session?.user?.planTier || 'FREE'
    const isPro = planTier === 'PRO' || planTier === 'ENTERPRISE' || session?.user?.role === 'SUPER_ADMIN'
    const isLimitReached = !isPro && totalStudents >= 100

    useEffect(() => {
        fetchClasses()
    }, [])

    useEffect(() => {
        if (selectedClass) {
            fetchStudents(selectedClass.id)
        }
    }, [selectedClass])

    const fetchClasses = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/classes')
            if (res.ok) {
                const data = await res.json()
                setClasses(data)

                let total = 0
                data.forEach((c: any) => total += c._count?.students || 0)
                setTotalStudents(total)
            } else {
                toast.error("Failed to load classes")
            }
        } catch (error) {
            toast.error("Network error while fetching classes")
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async (classId: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/students?classId=${classId}`)
            if (res.ok) {
                const data = await res.json()
                setStudents(data)
            } else {
                toast.error("Failed to load student registry")
            }
        } catch (error) {
            toast.error("Network error while fetching students")
        } finally {
            setLoading(false)
        }
    }

    const handleAddStudent = () => {
        if (isLimitReached) {
            toast.error('Free tier limit reached (100 students). Upgrade to PRO to expand your registry.')
            return
        }
        setSelectedStudent(null)
        setShowFormModal(true)
    }

    const handleEditStudent = (student: any) => {
        setSelectedStudent(student)
        setShowFormModal(true)
    }

    const handleDeleteStudent = async (student: any) => {
        if (confirm(`DELETE: Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
            try {
                const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' })
                if (res.ok) {
                    toast.success("Student deleted successfully")
                    if (selectedClass) {
                        fetchStudents(selectedClass.id)
                    } else {
                        fetchClasses()
                    }
                } else {
                    toast.error('Failed to delete student')
                }
            } catch (error) {
                toast.error('Error deleting student')
            }
        }
    }

    const filteredStudents = students.filter(student => {
        const matchesSearch = `${student.firstName} ${student.lastName} ${student.admissionNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            case 'INACTIVE': return 'bg-muted text-slate-500 dark:bg-slate-900 dark:text-slate-500'
            case 'SUSPENDED': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            case 'GRADUATED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            default: return 'bg-muted text-slate-500'
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-10 animate-fade-in pb-12">
                {/* Header Section */}
                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {selectedClass ? (
                                <button
                                    onClick={() => { setSelectedClass(null); setStudents([]); }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-muted"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            ) : (
                                <Users size={20} className="text-blue-600" />
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                {selectedClass ? 'Division Registry' : 'Ecumenical Student Registry'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                            {selectedClass ? `${selectedClass.name}` : 'Student Body'}
                        </h1>
                        <p className="max-w-xl text-sm font-medium text-muted-foreground">
                            {selectedClass
                                ? `Active enrollment for ${selectedClass.name} ${selectedClass.stream || ''}`
                                : `Comprehensive directory of ${totalStudents} students at ${session?.user?.schoolName || 'the institution'}.`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {session?.user?.role !== 'SUPER_ADMIN' && (
                            <Link href="/dashboard/settings/import">
                                <Button variant="outline" className="h-12 rounded-2xl border-border bg-white px-6 font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-accent">
                                    <Download size={18} className="mr-2 text-blue-600" />
                                    Batch Import
                                </Button>
                            </Link>
                        )}
                        <button
                            disabled={isLimitReached}
                            className={cn(
                                "flex h-12 items-center justify-center gap-2 rounded-2xl px-8 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all active:scale-[0.98]",
                                isLimitReached ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-[#030213] hover:bg-black shadow-gray-200/50"
                            )}
                            onClick={handleAddStudent}
                        >
                            <UserPlus size={18} />
                            {isLimitReached ? 'Registry Full' : 'Enroll Student'}
                        </button>
                    </div>
                </div>

                {loading && !selectedClass && (
                    <div className="flex h-[400px] items-center justify-center rounded-[2.5rem] border border-border bg-muted/5">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600/40" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Synchronizing Rosters...</p>
                        </div>
                    </div>
                )}

                {!selectedClass && !loading && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {classes.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center rounded-[2.5rem] border border-dashed border-border bg-muted/10">
                                <Building2 size={48} className="text-muted-foreground/20 mb-6" />
                                <h3 className="text-xl font-bold text-foreground">No Classes Configured</h3>
                                <p className="mt-2 text-sm font-medium text-muted-foreground max-w-xs">
                                    Set up your educational tiers and segments to begin managing the student registry.
                                </p>
                            </div>
                        ) : (
                            classes.map(c => (
                                <motion.div
                                    key={c.id}
                                    whileHover={{ y: -5 }}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:border-blue-600/10 hover:shadow-2xl"
                                    onClick={() => setSelectedClass(c)}
                                >
                                    <div className="mb-8 flex items-start justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                            <GraduationCap size={24} />
                                        </div>
                                        <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            {c._count?.students || 0} Members
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tight text-foreground truncate">
                                            {c.name}
                                        </h3>
                                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600/60">
                                            {c.stream || 'Global Segment'}
                                        </p>
                                    </div>
                                    <div className="mt-8 border-t border-border/50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
                                            Open Registry <ChevronRight size={14} />
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {/* Tracking View For Selected Class */}
                {selectedClass && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        {/* Filters & Search */}
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                            <div className="relative group flex-1">
                                <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-colors group-focus-within:text-blue-600" />
                                <input
                                    type="text"
                                    placeholder="Search by student name or unique ID..."
                                    className="w-full h-16 rounded-[1.5rem] border border-border bg-card pl-14 pr-6 text-base font-medium transition-all focus:border-blue-600/50 focus:outline-none focus:ring-4 focus:ring-blue-600/5 shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
                                    <SelectTrigger className="h-16 w-full lg:w-[240px] rounded-2xl border-border bg-card font-bold text-[11px] uppercase tracking-widest text-muted-foreground shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Filter size={18} className="text-blue-600/40" />
                                            <SelectValue placeholder="Status: All" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border">
                                        <SelectItem value="ALL" className="font-bold text-xs">ALL ENROLLMENTS</SelectItem>
                                        <SelectItem value="ACTIVE" className="font-bold text-xs text-green-600">ACTIVE ONLY</SelectItem>
                                        <SelectItem value="INACTIVE" className="font-bold text-xs text-muted-foreground">INACTIVE</SelectItem>
                                        <SelectItem value="SUSPENDED" className="font-bold text-xs text-amber-600">SUSPENDED</SelectItem>
                                        <SelectItem value="GRADUATION" className="font-bold text-xs text-blue-600">ALUMNI</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Student Cards Grid */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {loading ? (
                                [1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-[280px] animate-pulse rounded-[2rem] bg-muted/50"></div>
                                ))
                            ) : filteredStudents.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-32 text-center rounded-[2.5rem] border border-dashed border-border bg-muted/10">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white text-muted-foreground/10 shadow-sm border border-border">
                                        <GraduationCap size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Registry Empty</h3>
                                    <p className="mt-2 text-sm font-medium text-muted-foreground max-w-xs">
                                        No students in this division match your criteria. Expand your search or enroll a student.
                                    </p>
                                </div>
                            ) : (
                                filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:border-black/10 hover:shadow-xl"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white shadow-lg shadow-blue-100">
                                                    {student.firstName[0]}{student.lastName[0]}
                                                </div>
                                                <div className={cn(
                                                    "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                                                    student.status === 'ACTIVE' ? "bg-green-50 text-green-600 ring-1 ring-green-600/10" :
                                                        student.status === 'SUSPENDED' ? "bg-amber-50 text-amber-600 ring-1 ring-amber-600/10" :
                                                            "bg-muted text-muted-foreground ring-1 ring-border"
                                                )}>
                                                    {student.status || 'Active'}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="truncate text-lg font-extrabold tracking-tight text-foreground capitalize">
                                                    {student.firstName} {student.lastName}
                                                </h3>
                                                <p className="font-mono text-[10px] font-bold text-muted-foreground/60">{student.admissionNumber}</p>
                                            </div>

                                            <div className="mt-6 space-y-3 pb-6 border-b border-border/50">
                                                <div className="flex justify-between items-center text-[11px] font-medium">
                                                    <span className="text-muted-foreground/60 uppercase tracking-widest">Attendance</span>
                                                    <span className="font-bold text-foreground">98.5%</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px] font-medium">
                                                    <span className="text-muted-foreground/60 uppercase tracking-widest">Performance</span>
                                                    <span className="font-bold text-blue-600">Top 10%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-[#030213] hover:text-white"
                                            onClick={() => {
                                                setSelectedProfileStudent(student);
                                                setShowProfileModal(true);
                                            }}
                                        >
                                            <Eye size={16} /> Details
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer Status */}
                        <div className="flex items-center justify-between rounded-2xl bg-muted/20 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                                Viewing {filteredStudents.length} Students in {selectedClass.name}
                            </div>
                            {isLimitReached && (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-600 ring-1 ring-red-600/10">
                                        <AlertTriangle size={14} />
                                        Limit Reached
                                    </div>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:opacity-80 underline">
                                        Upgrade
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals & Forms Overlay */}
            {showFormModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#030213]/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowFormModal(false)}></div>
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up rounded-[2.5rem] bg-white shadow-2xl">
                        <StudentForm
                            student={selectedStudent}
                            onClose={() => {
                                setShowFormModal(false)
                                setSelectedStudent(null)
                            }}
                            onSuccess={() => {
                                setShowFormModal(false)
                                if (selectedClass) {
                                    fetchStudents(selectedClass.id)
                                    fetchClasses()
                                } else {
                                    fetchClasses()
                                }
                                toast.success("Registry updated successfully")
                            }}
                        />
                    </div>
                </div>
            )}

            {showProfileModal && selectedProfileStudent && (
                <StudentProfileModal
                    student={selectedProfileStudent}
                    onClose={() => {
                        setShowProfileModal(false)
                        setSelectedProfileStudent(null)
                    }}
                />
            )}
        </DashboardLayout>
    )
}
