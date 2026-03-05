'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { GraduationCap, Plus, Search, Filter, Edit, Trash2, FileText, Download, Users, UserPlus, AlertTriangle, Loader2, ChevronRight, MoreHorizontal } from 'lucide-react'
import StudentForm from '@/components/forms/StudentForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function StudentsPage() {
    const { data: session } = useSession()
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [showFilters, setShowFilters] = useState(false)
    const [showFormModal, setShowFormModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)

    const planTier = session?.user?.planTier || 'FREE'
    const isPro = planTier === 'PRO' || planTier === 'ENTERPRISE' || session?.user?.role === 'SUPER_ADMIN'
    const isLimitReached = !isPro && students.length >= 100

    useEffect(() => {
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/students')
            if (res.ok) {
                const data = await res.json()
                setStudents(data)
            } else {
                toast.error("Failed to load student registry")
            }
        } catch (error) {
            console.error('Failed to fetch students:', error)
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
        if (confirm(`PURGE RECORD: Are you sure you want to delete ${student.firstName} ${student.lastName}? This action is irreversible and will purge all financial history.`)) {
            try {
                const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' })
                if (res.ok) {
                    toast.success("Student record purged from system")
                    fetchStudents()
                } else {
                    toast.error('Failed to delete student')
                }
            } catch (error) {
                toast.error('Error during purge operation')
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
            case 'INACTIVE': return 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500'
            case 'SUSPENDED': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            case 'GRADUATED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            default: return 'bg-slate-100 text-slate-500'
        }
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Users size={24} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Registry</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                            Command center for student personnel at <span className="text-blue-600 font-black uppercase not-italic">{session?.user?.schoolName}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        {session?.user?.role !== 'SUPER_ADMIN' && (
                            <Button asChild variant="outline" className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                                <Link href="/dashboard/settings/import">
                                    <Download size={18} className="mr-2 text-blue-600" />
                                    Batch Data Import
                                </Link>
                            </Button>
                        )}
                        <Button
                            className={cn(
                                "h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all",
                                isLimitReached
                                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none"
                            )}
                            onClick={handleAddStudent}
                        >
                            <UserPlus size={18} className="mr-2" />
                            {isLimitReached ? 'ENROLLMENT LOCKED' : 'Enroll New Cadet'}
                        </Button>
                    </div>
                </div>

                {/* Stats & Filters Card */}
                <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900 p-8">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative flex-1 group">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    type="text"
                                    placeholder="Scouring Registry: Search by name, admission ID..."
                                    className="h-14 pl-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white group-focus-within:ring-2 ring-blue-500/20 transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
                                    <SelectTrigger className="h-14 w-full lg:w-[220px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-600 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <Filter size={16} className="text-blue-600" />
                                            <SelectValue placeholder="Status: All" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                                        <SelectItem value="ALL" className="font-bold">ALL PERSONNEL</SelectItem>
                                        <SelectItem value="ACTIVE" className="font-bold text-emerald-600">ACTIVE</SelectItem>
                                        <SelectItem value="INACTIVE" className="font-bold text-slate-500">INACTIVE</SelectItem>
                                        <SelectItem value="SUSPENDED" className="font-bold text-amber-600">SUSPENDED</SelectItem>
                                        <SelectItem value="GRADUATED" className="font-bold text-blue-600">GRADUATED</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="hidden lg:flex flex-col items-center justify-center px-6 h-14 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl whitespace-nowrap">
                                    <span className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest leading-none mb-1">Total Unit Strength</span>
                                    <span className="text-xl font-black text-blue-700 dark:text-blue-400 leading-none">{filteredStudents.length} / {isPro ? '∞' : '100'}</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Matrix</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation #</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Division (Class)</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:table-cell">Liaison (Parent)</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="inline-flex items-center gap-3">
                                                    <Loader2 className="animate-spin text-blue-600" size={24} />
                                                    <span className="text-lg font-black text-slate-400 uppercase italic tracking-tighter">Syncing Registry...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center bg-slate-50/30 dark:bg-slate-900/10">
                                                <div className="max-w-xs mx-auto flex flex-col items-center">
                                                    <div className="h-20 w-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-300 dark:text-slate-800 mb-6 shadow-inner">
                                                        <GraduationCap size={48} />
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Registry Expunged</h3>
                                                    <p className="text-slate-400 text-sm font-medium italic">
                                                        No personnel matching your reconnaissance parameters were located in the current sector.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr key={student.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all border-l-4 border-transparent hover:border-blue-600">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-400 font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                            {student.firstName[0]}{student.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base leading-tight">
                                                                {student.firstName} {student.lastName}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.gender}</span>
                                                                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Verified Cadet</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <code className="px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black text-slate-600 dark:text-slate-400 uppercase">
                                                        {student.admissionNumber}
                                                    </code>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {student.class ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs">
                                                                {student.class.name} <span className="text-slate-400 ml-1">{student.class.stream}</span>
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 opacity-40">
                                                            <AlertTriangle size={14} className="text-amber-500" />
                                                            <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest italic">In-Transit</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 hidden xl:table-cell">
                                                    {student.guardians && student.guardians.length > 0 ? (
                                                        <div className="max-w-[180px]">
                                                            <div className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-tight truncate">
                                                                {student.guardians[0].user.firstName} {student.guardians[0].user.lastName}
                                                            </div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5 tracking-tighter">
                                                                {student.guardians[0].user.phoneNumber}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] italic">Proxy Needed</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge className={cn(
                                                        "font-black text-[9px] px-3 h-6 uppercase tracking-[0.2em] border-none shadow-none",
                                                        getStatusColor(student.status)
                                                    )}>
                                                        {student.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-all"
                                                            onClick={() => window.location.href = `/dashboard/students/${student.id}/statement`}
                                                            title="Intelligence Report (Statement)"
                                                        >
                                                            <FileText size={18} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                                            onClick={() => handleEditStudent(student)}
                                                            title="Modify Parameters"
                                                        >
                                                            <Edit size={18} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all"
                                                            onClick={() => handleDeleteStudent(student)}
                                                            title="Expunge Record"
                                                        >
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>

                    {/* Footer / Pagination Placeholder */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900 p-6 flex justify-between items-center whitespace-nowrap overflow-x-auto gap-8">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic shrink-0">
                            Displaying Sector {filteredStudents.length} Students • Central Intelligence Unit
                        </div>
                        {isLimitReached && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/30 rounded-xl shrink-0">
                                <AlertTriangle size={14} className="text-red-600" />
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.1em]">Free Tier Limit Reached • Enrollment Offline</span>
                                <Button variant="link" className="h-auto p-0 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 underline shadow-none">Upgrade Mission</Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Modals */}
            {showFormModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <StudentForm
                            student={selectedStudent}
                            onClose={() => {
                                setShowFormModal(false)
                                setSelectedStudent(null)
                            }}
                            onSuccess={() => {
                                setShowFormModal(false)
                                fetchStudents()
                            }}
                        />
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
