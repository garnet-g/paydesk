'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import StudentStatement from '@/components/StudentStatement'
import {
    User,
    Mail,
    Phone,
    GraduationCap,
    Calendar,
    CreditCard,
    ArrowLeft,
    ChevronRight,
    Edit,
    AlertCircle,
    ArrowRight,
    History
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import StudentForm from '@/components/forms/StudentForm'

export default function StudentProfilePage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'statement' | 'history'>('overview')
    const [showEditModal, setShowEditModal] = useState(false)
    const [gradeHistory, setGradeHistory] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)

    useEffect(() => {
        if (id) fetchStudent()
    }, [id])

    useEffect(() => {
        if (activeTab === 'history' && id) fetchGradeHistory()
    }, [activeTab, id])

    const fetchGradeHistory = async () => {
        setHistoryLoading(true)
        try {
            const res = await fetch(`/api/students/${id}/grade-history`)
            if (res.ok) setGradeHistory(await res.json())
        } catch { }
        finally { setHistoryLoading(false) }
    }

    const fetchStudent = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/students/${id}`)
            if (res.ok) {
                const data = await res.json()
                setStudent(data)
            } else {
                router.push('/dashboard/students')
            }
        } catch (error) {
            console.error('Failed to fetch student:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-height-[60vh]">
                    <div className="spinner"></div>
                </div>
            </DashboardLayout>
        )
    }

    if (!student) return null

    const primaryGuardian = student.guardians?.find((g: any) => g.isPrimary)?.user || student.guardians?.[0]?.user

    return (
        <DashboardLayout>
            <div className="animate-fade-in max-w-6xl mx-auto">
                {/* Breadcrumbs / Back */}
                <div className="flex items-center gap-sm mb-xl">
                    <button onClick={() => router.push('/dashboard/students')} className="btn btn-ghost btn-sm">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-xs text-sm text-muted">
                        <Link href="/dashboard/students" className="hover:text-primary-600">Students</Link>
                        <ChevronRight size={14} />
                        <span className="text-foreground font-medium">{student.firstName} {student.lastName}</span>
                    </div>
                </div>

                {/* Header Profile Card */}
                <div className="card p-0 overflow-hidden mb-xl shadow-md border-primary-100">
                    <div style={{ height: '100px', background: 'linear-gradient(135deg, var(--primary-700), var(--primary-500))' }} />
                    <div className="px-2xl pb-xl" style={{ marginTop: '-40px' }}>
                        <div className="flex flex-col md:flex-row gap-xl items-end justify-between">
                            <div className="flex gap-lg items-end">
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    background: 'white',
                                    borderRadius: '32px',
                                    border: '4px solid white',
                                    boxShadow: 'var(--shadow-xl)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3rem',
                                    fontWeight: 800,
                                    color: 'var(--primary-600)'
                                }}>
                                    {student.firstName[0]}
                                </div>
                                <div className="pb-sm">
                                    <h1 style={{ fontSize: '2.25rem', marginBottom: 'var(--spacing-xs)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                        {student.firstName} {student.lastName}
                                    </h1>
                                    <div className="flex flex-wrap gap-md">
                                        <span className="badge badge-primary"><GraduationCap size={14} className="mr-xs" /> {student.class?.name || 'Unassigned'} {student.class?.stream}</span>
                                        <span className="badge badge-neutral">Adm: {student.admissionNumber}</span>
                                        <span className={`badge ${student.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>{student.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pb-sm flex gap-md">
                                <button className="btn btn-outline btn-sm" onClick={() => setShowEditModal(true)}>
                                    <Edit size={16} /> Edit Profile
                                </button>
                                <button className="btn btn-primary btn-sm">
                                    <Calendar size={16} /> Term History
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t px-xl bg-neutral-50/50">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-lg py-md font-bold text-sm transition-all border-b-2 ${activeTab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-muted hover:text-foreground'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('statement')}
                            className={`px-lg py-md font-bold text-sm transition-all border-b-2 ${activeTab === 'statement' ? 'border-primary-600 text-primary-600' : 'border-transparent text-muted hover:text-foreground'}`}
                        >
                            Financial Statement
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-lg py-md font-bold text-sm transition-all border-b-2 flex items-center gap-xs ${activeTab === 'history' ? 'border-primary-600 text-primary-600' : 'border-transparent text-muted hover:text-foreground'}`}
                        >
                            <History size={14} /> Grade History
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
                    <div className="lg:col-span-2 space-y-xl">
                        {activeTab === 'overview' ? (
                            <>
                                {/* Personal Info Card */}
                                <div className="card">
                                    <div className="flex justify-between items-center mb-lg">
                                        <h3 className="card-title text-lg m-0">Personal Information</h3>
                                        <AlertCircle size={18} className="text-muted" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                                        <div className="space-y-md">
                                            <div>
                                                <label className="text-xs font-bold text-muted  tracking-wider">Full Name</label>
                                                <p className="font-semibold text-lg">{student.firstName} {student.middleName || ''} {student.lastName}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted  tracking-wider">Admission Number</label>
                                                <p className="font-semibold text-lg text-primary-700">{student.admissionNumber}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted  tracking-wider">Enrollment Status</label>
                                                <p className="font-semibold text-lg">{student.status}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-md">
                                            <div>
                                                <label className="text-xs font-bold text-muted  tracking-wider">Date of Birth</label>
                                                <p className="font-semibold text-lg">{student.dateOfBirth ? formatDate(student.dateOfBirth) : 'Not recorded'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted  tracking-wider">Gender</label>
                                                <p className="font-semibold text-lg text-capitalize">{student.gender || 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted  tracking-wider">Joined Date</label>
                                                <p className="font-semibold text-lg">{formatDate(student.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Guardian Info */}
                                <div className="card">
                                    <h3 className="card-title text-lg mb-lg">Guardian Information</h3>
                                    {primaryGuardian ? (
                                        <div className="p-lg bg-primary-50/30 rounded-xl border border-primary-100 flex flex-col md:flex-row gap-lg items-center">
                                            <div className="w-16 h-16 bg-white rounded-2xl border border-primary-100 flex items-center justify-center shadow-sm">
                                                <User size={32} className="text-primary-600" />
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <h4 className="font-bold text-xl m-0">{primaryGuardian.firstName} {primaryGuardian.lastName}</h4>
                                                <p className="text-primary-600 text-sm font-semibold  tracking-tight mt-1">
                                                    {student.guardians?.find((g: any) => g.user.id === primaryGuardian.id)?.relationship || 'Primary Guardian'}
                                                </p>

                                                <div className="flex flex-wrap justify-center md:justify-start gap-xl mt-md">
                                                    <div className="flex items-center gap-xs text-sm font-medium">
                                                        <Mail size={16} className="text-muted" />
                                                        <span>{primaryGuardian.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-xs text-sm font-medium">
                                                        <Phone size={16} className="text-muted" />
                                                        <span>{primaryGuardian.phoneNumber || 'No phone recorded'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="btn btn-primary btn-sm">Message</button>
                                        </div>
                                    ) : (
                                        <div className="p-xl text-center border-2 border-dashed rounded-xl bg-neutral-50">
                                            <AlertCircle size={32} className="mx-auto text-muted mb-sm" />
                                            <p className="text-muted mb-md font-medium">No guardian linked to this student profile.</p>
                                            <button className="btn btn-primary btn-sm" onClick={() => setShowEditModal(true)}>Link Guardian</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : activeTab === 'statement' ? (
                            <StudentStatement studentId={id} />
                        ) : (
                            // Grade History Tab
                            <div className="card">
                                <div className="flex items-center gap-md mb-lg">
                                    <History size={20} style={{ color: 'var(--primary-600)' }} />
                                    <h3 className="card-title m-0">Grade History</h3>
                                </div>
                                {historyLoading ? (
                                    <p className="text-center py-xl text-muted text-sm">Loading...</p>
                                ) : gradeHistory.length === 0 ? (
                                    <div className="text-center py-xl">
                                        <History size={32} className="mx-auto mb-sm text-muted" />
                                        <p className="text-muted text-sm">No class transitions recorded yet.</p>
                                        <p className="text-xs text-muted mt-xs">Transitions are logged each time a student is promoted or moved.</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
                                        <div className="space-y-lg">
                                            {gradeHistory.map((h: any, i: number) => (
                                                <div key={h.id} className="flex items-start gap-lg" style={{ paddingLeft: '36px', position: 'relative' }}>
                                                    {/* Dot */}
                                                    <div style={{
                                                        position: 'absolute', left: 0, top: 4,
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        background: i === 0 ? 'var(--primary-600)' : 'var(--neutral-200)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: '3px solid var(--card-bg)',
                                                        zIndex: 1
                                                    }}>
                                                        <GraduationCap size={14} color={i === 0 ? 'white' : 'var(--neutral-500)'} />
                                                    </div>
                                                    {/* Content */}
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-sm mb-xs">
                                                            {h.fromClass ? (
                                                                <><span className="badge badge-neutral text-xs">{h.fromClass.name}{h.fromClass.stream ? ' ' + h.fromClass.stream : ''}</span>
                                                                    <ArrowRight size={12} className="text-muted" /></>
                                                            ) : null}
                                                            <span className="badge badge-primary text-xs">{h.toClass.name}{h.toClass.stream ? ' ' + h.toClass.stream : ''}</span>
                                                            <span className="badge text-xs" style={{
                                                                background: h.reason === 'PROMOTION' ? 'var(--success-50)' : 'var(--warning-50)',
                                                                color: h.reason === 'PROMOTION' ? 'var(--success-700)' : 'var(--warning-700)',
                                                                border: h.reason === 'PROMOTION' ? '1px solid var(--success-100)' : '1px solid var(--warning-100)'
                                                            }}>{h.reason}</span>
                                                        </div>
                                                        <p className="text-xs text-muted">
                                                            {formatDate(h.promotionDate)} · {h.academicYear} {h.term}
                                                        </p>
                                                        {h.notes && <p className="text-xs mt-xs " style={{ color: 'var(--neutral-500)' }}>"{h.notes}"</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Financial Snapshot */}
                    <div className="space-y-xl">
                        <div className="card">
                            <div className="flex items-center justify-between mb-lg">
                                <h3 className="card-title text-lg m-0">Recent Activity</h3>
                                <CreditCard size={18} className="text-muted" />
                            </div>
                            <div className="space-y-md">
                                <p className="text-center py-xl text-muted text-sm ">No recent payments or invoices found for this student.</p>
                                <button className="btn btn-primary w-full shadow-md" onClick={() => setActiveTab('statement')}>
                                    <CreditCard size={18} /> Record manual Payment
                                </button>
                            </div>
                        </div>

                        <div className="card bg-primary-900 text-white border-none overflow-hidden relative shadow-xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-xs text-primary-100">Net Account Balance</h3>
                                <p className="text-primary-200 text-xs mb-lg  font-bold ">Across all invoice terms</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }} className="mb-0">
                                    KES {student.balance?.toLocaleString() || '0.00'}
                                </h2>
                                <div className="mt-xl flex flex-col gap-sm">
                                    <button className="btn btn-white w-full font-bold" style={{ background: 'white', color: 'var(--primary-900)' }}>
                                        Send Fee Balance Reminder
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showEditModal && (
                <StudentForm
                    student={student}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => fetchStudent()}
                />
            )}

            <style jsx>{`
                .text-capitalize {
                    text-transform: capitalize;
                }
            `}</style>
        </DashboardLayout>
    )
}
