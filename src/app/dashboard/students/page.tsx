'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { GraduationCap, Search, Filter, Edit, Trash2, FileText, Download, Users, UserPlus, AlertTriangle, Loader2, ChevronLeft, Building2, ChevronRight } from 'lucide-react'
import StudentForm from '@/components/forms/StudentForm'
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
        if (confirm(`PURGE RECORD: Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
            try {
                const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' })
                if (res.ok) {
                    toast.success("Student record purged from system")
                    if (selectedClass) {
                        fetchStudents(selectedClass.id)
                    } else {
                        fetchClasses()
                    }
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
                            {selectedClass ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                                    onClick={() => { setSelectedClass(null); setStudents([]); }}
                                >
                                    <ChevronLeft size={20} />
                                </Button>
                            ) : (
                                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Users size={24} />
                                </div>
                            )}
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                                {selectedClass ? `${selectedClass.name} ${selectedClass.stream || ''}` : 'Registry'}
                            </h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                            {selectedClass ? 'Viewing division personnel' : 'Command center for student personnel by division'} at <span className="text-blue-600 font-black uppercase not-italic">{session?.user?.schoolName}</span>
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

                {loading && !selectedClass && (
                    <div className="flex justify-center p-20">
                        <div className="inline-flex items-center gap-3">
                            <Loader2 className="animate-spin text-blue-600" size={24} />
                            <span className="text-lg font-black text-slate-400 uppercase italic tracking-tighter">Syncing Divisions...</span>
                        </div>
                    </div>
                )}

                {!selectedClass && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {classes.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">No Divisions Configured</h3>
                                <p className="text-slate-500 font-medium mt-2">Setup classes/divisions first before viewing the registry.</p>
                            </div>
                        ) : (
                            classes.map(c => (
                                <Card
                                    key={c.id}
                                    className="cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:border-blue-200 transition-all border-slate-200 rounded-[2rem] overflow-hidden"
                                    onClick={() => setSelectedClass(c)}
                                >
                                    <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                                                <Users size={20} />
                                            </div>
                                            <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest bg-white">
                                                {c._count?.students || 0} Cadets
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight mt-4">
                                            {c.name} {c.stream && <span className="text-blue-600">{c.stream}</span>}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic mb-4">Division Sector</p>
                                        <Button variant="ghost" className="w-full justify-between hover:bg-blue-50 hover:text-blue-700 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors">
                                            View Personnel
                                            <ChevronRight size={14} />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Tracking View For Selected Class */}
                {selectedClass && (
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden animate-in slide-in-from-right-4 duration-500">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900 p-8">
                            <div className="flex flex-col lg:flex-row gap-6 items-center">
                                <div className="relative flex-1 group">
                                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <Input
                                        type="text"
                                        placeholder="Scouring Sector: Search by name, admission ID..."
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
                                        <span className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest leading-none mb-1">Division Strength</span>
                                        <span className="text-xl font-black text-blue-700 dark:text-blue-400 leading-none">{filteredStudents.length}</span>
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
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:table-cell">Liaison (Parent)</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-32 text-center">
                                                    <div className="inline-flex items-center gap-3">
                                                        <Loader2 className="animate-spin text-blue-600" size={24} />
                                                        <span className="text-lg font-black text-slate-400 uppercase italic tracking-tighter">Syncing Sector Personnel...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-32 text-center bg-slate-50/30 dark:bg-slate-900/10">
                                                    <div className="max-w-xs mx-auto flex flex-col items-center">
                                                        <div className="h-20 w-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-300 dark:text-slate-800 mb-6 shadow-inner">
                                                            <GraduationCap size={48} />
                                                        </div>
                                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Division Empty</h3>
                                                        <p className="text-slate-400 text-sm font-medium italic">
                                                            No personnel matching your reconnaissance parameters were located in this division.
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
                )}
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
                                if (selectedClass) {
                                    fetchStudents(selectedClass.id)
                                    // also update classes so counts update
                                    fetchClasses()
                                } else {
                                    fetchClasses()
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
