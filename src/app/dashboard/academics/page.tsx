'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Calendar, GraduationCap, Plus, Search, CheckCircle, XCircle, Clock, BookOpen, User } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AcademicsPage() {
    const [activeTab, setActiveTab] = useState<'attendance' | 'results'>('attendance')
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Attendance State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // Results State
    const [exams, setExams] = useState<any[]>([])
    const [showExamModal, setShowExamModal] = useState(false)
    const [examForm, setExamForm] = useState({ name: '', date: new Date().toISOString().split('T')[0] })

    useEffect(() => {
        fetchStudents()
        if (activeTab === 'results') fetchExams()
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

    const filteredStudents = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="page-header">
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-900)', letterSpacing: '-0.025em' }}>
                            Academic Office
                        </h2>
                        <p className="text-muted font-medium">Manage daily attendance and examination outcomes</p>
                    </div>
                </div>

                <div className="flex gap-md mb-xl border-b border-neutral-100">
                    <button
                        className={`pb-md px-lg font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'attendance' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-neutral-400'}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        Daily Attendance
                    </button>
                    <button
                        className={`pb-md px-lg font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'results' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-neutral-400'}`}
                        onClick={() => setActiveTab('results')}
                    >
                        Examination Results
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
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                    className="form-input pl-10 text-sm"
                                    placeholder="Search student..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="card p-0 overflow-hidden">
                            <table className="table-modern w-full">
                                <thead>
                                    <tr className="bg-neutral-50/50">
                                        <th className="text-[10px] font-black uppercase tracking-widest text-muted p-md border-b">Student</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-muted p-md border-b">Class</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-muted p-md border-b text-center">Protocol Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={3} className="text-center py-xl"><div className="spinner mx-auto" /></td></tr>
                                    ) : filteredStudents.map(student => (
                                        <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-md">
                                                <div className="flex items-center gap-sm">
                                                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-[10px] font-black">{student.firstName[0]}{student.lastName[0]}</div>
                                                    <div>
                                                        <div className="text-sm font-bold text-primary-900">{student.firstName} {student.lastName}</div>
                                                        <div className="text-[10px] font-bold text-muted uppercase">{student.admissionNumber}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-md text-sm font-medium text-muted">
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

                {activeTab === 'results' && (
                    <div className="space-y-lg">
                        <div className="flex justify-between items-center bg-white p-lg card">
                            <div>
                                <h3 className="text-lg font-black text-primary-900 uppercase">Examination Registry</h3>
                                <p className="text-xs text-muted font-medium italic">Create and manage standardized assessments</p>
                            </div>
                            <button className="btn btn-primary shadow-xl shadow-primary-100 px-xl text-xs font-black uppercase tracking-widest" onClick={() => setShowExamModal(true)}>
                                <Plus size={18} /> New Examination
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
                            {exams.length === 0 ? (
                                <div className="col-span-full card text-center py-2xl">
                                    <BookOpen size={48} className="mx-auto text-muted opacity-20 mb-md" />
                                    <p className="font-bold text-muted">No examinations registered this term.</p>
                                </div>
                            ) : exams.map(exam => (
                                <div key={exam.id} className="card hover:shadow-2xl transition-all border-neutral-100 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-lg opacity-5 group-hover:scale-110 transition-transform">
                                        <BookOpen size={60} />
                                    </div>
                                    <h4 className="text-xl font-black text-primary-900 mb-xs uppercase tracking-tighter">{exam.name}</h4>
                                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-xl">{formatDate(exam.date)}</div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-[9px] font-bold text-muted uppercase">Registry Entries</div>
                                            <div className="text-2xl font-black text-primary-600">{exam.results?.length || 0}</div>
                                        </div>
                                        <button
                                            className="btn btn-ghost btn-sm text-[10px] font-black uppercase tracking-widest text-primary-600 hover:bg-primary-50 px-4"
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
                            <h3 className="text-xl font-black text-primary-900 mb-lg uppercase">Create New Exam</h3>
                            <form onSubmit={handleCreateExam} className="space-y-md">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-xs block">Exam Name</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Mid-Term 2024"
                                        required
                                        value={examForm.name}
                                        onChange={e => setExamForm({ ...examForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-xs block">Examination Date</label>
                                    <input
                                        type="date"
                                        className="form-input font-bold"
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
            </div>
        </DashboardLayout>
    )
}
