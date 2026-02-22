'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, UserPlus, X, Check, Loader2, GraduationCap, Mail, Phone, User as UserIcon } from 'lucide-react'

interface StudentFormProps {
    student?: any
    onClose: () => void
    onSuccess: () => void
}

export default function StudentForm({ student, onClose, onSuccess }: StudentFormProps) {
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<any[]>([])

    // Parent Search State
    const [parentQuery, setParentQuery] = useState('')
    const [parents, setParents] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedParent, setSelectedParent] = useState<any>(student?.guardians?.[0]?.user || null)
    const [showResults, setShowResults] = useState(false)

    const [formData, setFormData] = useState({
        admissionNumber: student?.admissionNumber || '',
        firstName: student?.firstName || '',
        lastName: student?.lastName || '',
        middleName: student?.middleName || '',
        gender: student?.gender || 'Male',
        dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        classId: student?.classId || '',
        status: student?.status || 'ACTIVE'
    })

    const isEditing = !!student

    useEffect(() => {
        console.log('[StudentForm] Initializing with student:', student)
        console.log('[StudentForm] Found guardian user:', student?.guardians?.[0]?.user)
        fetchClasses()
        fetchParents()
    }, [])

    const fetchParents = async () => {
        setSearching(true)
        try {
            console.log('[StudentForm] Fetching parents...')
            const res = await fetch('/api/parents')
            if (res.ok) {
                const data = await res.json()
                console.log(`[StudentForm] Found ${data.length} parents for this school`)
                setParents(data)
            }
        } catch (error) {
            console.error('[StudentForm] Failed to fetch parents:', error)
        } finally {
            setSearching(false)
        }
    }

    const fetchClasses = async () => {
        try {
            const res = await fetch('/api/classes')
            if (res.ok) {
                const data = await res.json()
                setClasses(data)
            }
        } catch (error) {
            console.error('Failed to fetch classes:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const payload = {
            ...formData,
            parentEmail: selectedParent?.email || '',
        }

        console.log('[StudentForm] Submitting student payload:', payload)
        if (!selectedParent) {
            console.warn('[StudentForm] No parent selected. Student will be unlinked.')
        }

        try {
            const url = isEditing ? `/api/students/${student.id}` : '/api/students'
            const method = isEditing ? 'PATCH' : 'POST'

            console.log(`[StudentForm] Calling ${method} ${url}`)
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const updatedData = await res.json()
                console.log('[StudentForm] Success! Updated student:', updatedData)
                onSuccess()
                onClose()
            } else {
                const err = await res.text()
                console.error('[StudentForm] Error response:', err)
                alert('Error: ' + err)
            }
        } catch (error) {
            console.error('[StudentForm] Request failed:', error)
            alert('Failed to save student')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '750px', border: 'none' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title flex items-center gap-md">
                        <div className="p-sm bg-primary-100 text-primary-700 rounded-lg">
                            <GraduationCap size={24} />
                        </div>
                        {isEditing ? 'Edit Student Profile' : 'Register New Student'}
                    </h3>
                    <button className="btn btn-ghost p-sm" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="modal-body">
                        <div className="alert alert-info py-xs px-md mb-md">
                            <GraduationCap size={16} />
                            <p className="text-[10px] m-0">Ensure student data matches physical records.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-md mb-md">
                            <div className="form-group">
                                <label className="form-label">Admission Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={formData.admissionNumber}
                                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                                    disabled={isEditing}
                                    placeholder="e.g. ADM2024001"
                                />
                                {isEditing && <p className="form-hint">Admission number cannot be changed.</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Class / Grade</label>
                                <select
                                    className="form-select"
                                    required
                                    value={formData.classId}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                >
                                    <option value="">Select a Class</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.stream}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-md mb-md">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Middle Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.middleName}
                                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-md mb-md">
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select
                                    className="form-select"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="form-group mb-md">
                                <label className="form-label">Enrollment Status</label>
                                <div className="grid grid-cols-4 gap-sm">
                                    {['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`btn btn-xs ${formData.status === s ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => setFormData({ ...formData, status: s })}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ padding: 'var(--spacing-md)', background: 'var(--neutral-50)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-700)' }}>
                                <UserIcon size={14} /> Parent / Guardian Connection
                            </h4>

                            {selectedParent ? (
                                <div className="p-md bg-white border border-primary-100 rounded-lg flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-md">
                                        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                                            {selectedParent.firstName?.[0]}{selectedParent.lastName?.[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold">{selectedParent.firstName} {selectedParent.lastName}</div>
                                            <div className="text-xs text-muted font-medium">{selectedParent.email}</div>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setSelectedParent(null)} className="btn btn-ghost btn-sm text-error-600">
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ paddingLeft: '36px' }}
                                            placeholder="Search registered parents by name or email..."
                                            value={parentQuery}
                                            onChange={(e) => {
                                                setParentQuery(e.target.value)
                                                setShowResults(true)
                                            }}
                                            onFocus={() => setShowResults(true)}
                                        />
                                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={16} />}
                                    </div>

                                    {showResults && (
                                        <div className="popout-card mt-xs w-full max-h-60 overflow-y-auto z-50 shadow-xl border border-neutral-200">
                                            {parents
                                                .filter(p => !parentQuery ||
                                                    p.firstName?.toLowerCase().includes(parentQuery.toLowerCase()) ||
                                                    p.lastName?.toLowerCase().includes(parentQuery.toLowerCase()) ||
                                                    p.email?.toLowerCase().includes(parentQuery.toLowerCase())
                                                )
                                                .map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="p-sm hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer flex items-center gap-md"
                                                        onClick={() => {
                                                            setSelectedParent(p)
                                                            setShowResults(false)
                                                            setParentQuery('')
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold">
                                                            {p.firstName?.[0]}{p.lastName?.[0]}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold">{p.firstName} {p.lastName}</div>
                                                            <div className="text-[10px] text-muted">{p.email}</div>
                                                        </div>
                                                        <Check className="text-primary opacity-0 group-hover:opacity-100" size={16} />
                                                    </div>
                                                ))}
                                            {parents.length === 0 && !searching && (
                                                <div className="p-xl text-center">
                                                    <p className="text-sm text-muted mb-sm">No parents found in database.</p>
                                                    <Link href="/dashboard/settings/import" className="btn btn-primary btn-sm">Import Parents</Link>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <p className="text-[10px] text-muted mt-sm">Parents must be registered first to be linked for automated billing.</p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ minWidth: '140px' }} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : isEditing ? 'Save Changes' : 'Enroll Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
