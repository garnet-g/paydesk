'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { GraduationCap, Plus, Search, Filter, MoreVertical, Edit, Trash2, FileText, Download } from 'lucide-react'
import StudentForm from '@/components/forms/StudentForm'
import Link from 'next/link'

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
            const data = await res.json()
            setStudents(data)
        } catch (error) {
            console.error('Failed to fetch students:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddStudent = () => {
        if (isLimitReached) {
            alert('Free tier limit reached (100 students). Please contact Super Admin to upgrade to PRO plan.')
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
        if (confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}? This will also delete their fee records.`)) {
            try {
                const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' })
                if (res.ok) {
                    fetchStudents()
                } else {
                    alert('Failed to delete student')
                }
            } catch (error) {
                alert('Error deleting student')
            }
        }
    }

    const filteredStudents = students.filter(student => {
        const matchesSearch = `${student.firstName} ${student.lastName} ${student.admissionNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Students</h2>
                        <p className="text-muted">Manage student records for {session?.user?.schoolName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        {session?.user?.role !== 'SUPER_ADMIN' && (
                            <Link
                                href="/dashboard/settings/import"
                                className="btn btn-secondary"
                            >
                                <Download size={18} />
                                Batch Upload
                            </Link>
                        )}
                        <button
                            className={`btn ${isLimitReached ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={handleAddStudent}
                            style={isLimitReached ? { opacity: 0.7 } : {}}
                        >
                            <Plus size={18} />
                            {isLimitReached ? 'Limit Reached (Upgrade)' : 'Add New Student'}
                        </button>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name or admission number..."
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={18} />
                        </button>
                    </div>

                    {showFilters && (
                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <select
                                className="form-input text-sm w-full md:w-auto"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="GRADUATED">Graduated</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student Info</th>
                                    <th>Admission #</th>
                                    <th className="hide-mobile">Class</th>
                                    <th className="hide-mobile">Parent</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <GraduationCap size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)' }} />
                                            <p>No students found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: 'var(--primary-100)',
                                                        color: 'var(--primary-700)',
                                                        borderRadius: 'var(--radius-full)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700
                                                    }}>
                                                        {student.firstName[0]}{student.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{student.firstName} {student.lastName}</div>
                                                        <div className="text-xs text-muted">{student.gender}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><code className="badge badge-neutral">{student.admissionNumber}</code></td>
                                            <td className="hide-mobile">{student.class?.name} {student.class?.stream}</td>
                                            <td className="hide-mobile">
                                                {student.guardians && student.guardians.length > 0 ? (
                                                    <>
                                                        <div className="text-sm">
                                                            {student.guardians[0].user.firstName} {student.guardians[0].user.lastName}
                                                        </div>
                                                        <div className="text-xs text-muted">{student.guardians[0].user.phoneNumber}</div>
                                                    </>
                                                ) : (
                                                    <span className="text-muted text-xs">Not Assigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${student.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        title="View Statement"
                                                        onClick={() => window.location.href = `/dashboard/students/${student.id}/statement`}
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        title="Edit"
                                                        onClick={() => handleEditStudent(student)}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        title="Delete"
                                                        style={{ color: 'var(--error-600)' }}
                                                        onClick={() => handleDeleteStudent(student)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @media (max-width: 640px) {
                    .hide-mobile {
                        display: none;
                    }
                }
            `}</style>
            {showFormModal && (
                <StudentForm
                    student={selectedStudent}
                    onClose={() => {
                        setShowFormModal(false)
                        setSelectedStudent(null)
                    }}
                    onSuccess={() => fetchStudents()}
                />
            )}
        </DashboardLayout>
    )
}

