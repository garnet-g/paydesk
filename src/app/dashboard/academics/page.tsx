'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Calendar, GraduationCap, Plus, Search, CheckCircle, XCircle, Clock, BookOpen, User } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AcademicsPage() {
    const [activeTab, setActiveTab] = useState<'attendance' | 'results' | 'classes'>('attendance')
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Attendance State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // Results State
    const [exams, setExams] = useState<any[]>([])
    const [showExamModal, setShowExamModal] = useState(false)
    const [examForm, setExamForm] = useState({ name: '', date: new Date().toISOString().split('T')[0] })

    // Classes State
    const [classes, setClasses] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [showTeacherModal, setShowTeacherModal] = useState(false)
    const [selectedClass, setSelectedClass] = useState<any>(null)

    useEffect(() => {
        fetchStudents()
        if (activeTab === 'results') fetchExams()
        if (activeTab === 'classes') {
            fetchClasses()
            fetchTeachers()
        }
    }, [activeTab])

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/students')
            if (res.ok) setStudents(await res.json())
        } catch (err) {
            console.warn(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchExams = async () => {
        try {
            const res = await fetch('/api/exams')
            if (res.ok) setExams(await res.json())
        } catch (err) {
            console.warn(err)
        }
    }

    const handleLogAttendance = async (studentId: string, status: string) => {
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, date, status })
            })
            if (res.ok) {
                // Optimistic UI update or just show a small toast
                alert(`Attendance logged as ${status}`)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(examForm)
            })
            if (res.ok) {
                fetchExams()
                setShowExamModal(false)
                setExamForm({ name: '', date: new Date().toISOString().split('T')[0] })
            }
        } catch (err) {
            console.error(err)
        }
    }

    const fetchClasses = async () => {
        try {
            const res = await fetch('/api/classes')
            if (res.ok) setClasses(await res.json())
        } catch (error) {
            console.error(error)
        }
    }

    const fetchTeachers = async () => {
        try {
            const res = await fetch('/api/teachers')
            if (res.ok) setTeachers(await res.json())
        } catch (error) {
            console.error(error)
        }
    }

    const handleAssignTeacher = async (teacherId: string | null) => {
        if (!selectedClass) return
        try {
            const res = await fetch(`/api/classes/${selectedClass.id}/teacher`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId })
            })
            if (res.ok) {
                fetchClasses()
                setShowTeacherModal(false)
                setSelectedClass(null)
            }
        } catch (error) {
            console.error('Failed to assign teacher', error)
        }
    }

    const filteredStudents = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="page-header">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
                            Academics
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage student attendance and examination records</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-md mb-xl border-b border-neutral-100 mt-6">
                <button
                    className={`pb-md px-lg font-bold text-xs transition-all ${activeTab === 'attendance' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-neutral-400'}`}
                    onClick={() => setActiveTab('attendance')}
                >
                    Attendance
                </button>
                <button
                    className={`pb-md px-lg font-bold text-xs transition-all ${activeTab === 'classes' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-neutral-400'}`}
                    onClick={() => setActiveTab('classes')}
                >
                    Classes & Teachers
                </button>
                <button
                    className={`pb-md px-lg font-bold text-xs transition-all ${activeTab === 'results' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-neutral-400'}`}
                    onClick={() => setActiveTab('results')}
                >
                    Examinations
                </button>
            </div>

            {activeTab === 'attendance' && (
                <div className="space-y-lg">
                    <div className="card p-lg flex flex-wrap items-center justify-between gap-md">
                        <div className="flex items-center gap-md">
                            <div className="p-sm bg-primary-50 text-primary-600 rounded-xl">
                                <Calendar size={20} />
                            </div>
                            <input
                                type="date"
                                className="form-input text-sm font-bold"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="relative" style={{ width: '300px' }}>
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className="form-input pl-10 text-sm"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        <table className="table-modern w-full">
                            <thead>
                                <tr className="bg-neutral-50/50">
                                    <th className="text-[10px] font-semibold text-muted-foreground p-md border-b">Student</th>
                                    <th className="text-[10px] font-semibold text-muted-foreground p-md border-b">Class</th>
                                    <th className="text-[10px] font-semibold text-muted-foreground p-md border-b text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={3} className="text-center py-xl"><div className="spinner mx-auto" /></td></tr>
                                ) : filteredStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="p-md">
                                            <div className="flex items-center gap-sm">
                                                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-[10px] font-semibold">{student.firstName[0]}{student.lastName[0]}</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-primary-900">{student.firstName} {student.lastName}</div>
                                                    <div className="text-[10px] font-semibold text-muted-foreground ">{student.admissionNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-md text-sm font-medium text-muted-foreground">
                                            {student.class?.name} {student.class?.stream}
                                        </td>
                                        <td className="p-md">
                                            <div className="flex justify-center gap-sm">
                                                <button onClick={() => handleLogAttendance(student.id, 'PRESENT')} className="btn btn-ghost p-sm text-success-600 hover:bg-success-50 rounded-xl" title="Mark Present">
                                                    <CheckCircle size={20} />
                                                </button>
                                                <button onClick={() => handleLogAttendance(student.id, 'LATE')} className="btn btn-ghost p-sm text-warning-600 hover:bg-warning-50 rounded-xl" title="Mark Late">
                                                    <Clock size={20} />
                                                </button>
                                                <button onClick={() => handleLogAttendance(student.id, 'ABSENT')} className="btn btn-ghost p-sm text-error-600 hover:bg-error-50 rounded-xl" title="Mark Absent">
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'classes' && (
                <div className="space-y-lg animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.length === 0 ? (
                            <div className="col-span-full card text-center py-2xl">
                                <p className="font-bold text-muted-foreground">No classes registered.</p>
                            </div>
                        ) : classes.map(cls => (
                            <div key={cls.id} className="card p-6 border-neutral-100 hover:shadow-xl transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">{cls.name} {cls.stream}</h3>
                                        <p className="text-sm font-medium text-slate-500">{cls._count.students} Students Enrolled</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Homeroom Teacher</p>
                                    {cls.homeroomTeacher ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-xs">
                                                {cls.homeroomTeacher.user.firstName[0]}{cls.homeroomTeacher.user.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{cls.homeroomTeacher.user.firstName} {cls.homeroomTeacher.user.lastName}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm italic text-slate-500 font-medium">No teacher assigned</p>
                                    )}
                                </div>
                                <button
                                    className="w-full btn btn-ghost bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-semibold text-sm h-10"
                                    onClick={() => {
                                        setSelectedClass(cls)
                                        setShowTeacherModal(true)
                                    }}
                                >
                                    {cls.homeroomTeacher ? 'Reassign Teacher' : 'Assign Homeroom Teacher'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'results' && (
                <div className="space-y-lg">
                    <div className="flex justify-between items-center bg-white p-lg card">
                        <div>
                            <h3 className="text-lg font-semibold text-primary-900 ">Examination Registry</h3>
                            <p className="text-xs text-muted-foreground font-medium ">Create and manage standardized assessments</p>
                        </div>
                        <button className="btn btn-primary shadow-xl shadow-primary-100 px-xl text-xs font-semibold  " onClick={() => setShowExamModal(true)}>
                            <Plus size={18} /> New Exam
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
                        {exams.length === 0 ? (
                            <div className="col-span-full card text-center py-2xl">
                                <BookOpen size={48} className="mx-auto text-muted-foreground opacity-20 mb-md" />
                                <p className="font-bold text-muted-foreground">No examinations registered this term.</p>
                            </div>
                        ) : exams.map(exam => (
                            <div key={exam.id} className="card hover:shadow-2xl transition-all border-neutral-100 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-lg opacity-5 group-hover:scale-110 transition-transform">
                                    <BookOpen size={60} />
                                </div>
                                <h4 className="text-xl font-semibold text-primary-900 mb-xs  tracking-tight">{exam.name}</h4>
                                <div className="text-[10px] font-semibold text-muted-foreground   mb-xl">{formatDate(exam.date)}</div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-[9px] font-semibold text-muted-foreground ">Results Recorded</div>
                                        <div className="text-2xl font-semibold text-primary-600">{exam.results?.length || 0}</div>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-sm text-[10px] font-semibold   text-primary-600 hover:bg-primary-50 px-4"
                                        onClick={() => window.location.href = `/dashboard/academics/exams/${exam.id}`}
                                    >
                                        Enter Scores →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Exam Creation Modal */}
            {showExamModal && (
                <div className="modal-overlay" onClick={() => setShowExamModal(false)}>
                    <div className="card modal-content animate-slide-up shadow-2xl border-none p-xl" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold text-primary-900 mb-lg ">Create New Exam</h3>
                        <form onSubmit={handleCreateExam} className="space-y-md">
                            <div>
                                <label className="text-[10px] font-semibold  text-muted-foreground mb-xs block">Exam Name</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Mid-Term 2024"
                                    required
                                    value={examForm.name}
                                    onChange={e => setExamForm({ ...examForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold  text-muted-foreground mb-xs block">Examination Date</label>
                                <input
                                    type="date"
                                    className="form-input font-semibold"
                                    required
                                    value={examForm.date}
                                    onChange={e => setExamForm({ ...examForm, date: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-sm pt-md">
                                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowExamModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1 shadow-lg shadow-primary-100">Initialize</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Teacher Assignment Modal */}
            {showTeacherModal && selectedClass && (
                <div className="modal-overlay" onClick={() => setShowTeacherModal(false)}>
                    <div className="card modal-content animate-slide-up p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-2">Assign Teacher</h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Assign a homeroom teacher for <span className="font-bold text-foreground">{selectedClass.name} {selectedClass.stream}</span>.</p>

                        <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {teachers.length === 0 ? (
                                <p className="text-sm text-slate-500 italic text-center py-4">No staff with TEACHER role found.</p>
                            ) : teachers.map(teacher => {
                                const isAssigned = selectedClass.homeroomTeacherId === teacher.id
                                return (
                                    <div key={teacher.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                                                {teacher.user.firstName[0]}{teacher.user.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{teacher.user.firstName} {teacher.user.lastName}</p>
                                                {teacher.homeroomClass && teacher.homeroomClass.id !== selectedClass.id && (
                                                    <p className="text-[10px] font-semibold text-amber-600">Already handling {teacher.homeroomClass.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        {isAssigned ? (
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Current</span>
                                        ) : (
                                            <button
                                                onClick={() => handleAssignTeacher(teacher.id)}
                                                className="btn btn-ghost bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs font-bold rounded-lg px-4"
                                            >
                                                Assign
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex gap-4">
                            <button className="btn btn-outline flex-1 rounded-xl" onClick={() => setShowTeacherModal(false)}>Cancel</button>
                            {selectedClass.homeroomTeacherId && (
                                <button
                                    className="btn btn-ghost bg-red-50 hover:bg-red-100 text-red-600 font-bold flex-1 rounded-xl"
                                    onClick={() => handleAssignTeacher(null)}
                                >
                                    Remove Record
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
