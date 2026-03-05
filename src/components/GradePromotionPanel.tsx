'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, GraduationCap, Users, CheckCircle, AlertCircle, Loader2, ChevronRight, Info } from 'lucide-react'

interface GradePromotionPanelProps {
    onComplete?: () => void
}

type Step = 'select-classes' | 'review-students' | 'confirm'

export default function GradePromotionPanel({ onComplete }: GradePromotionPanelProps) {
    const [step, setStep] = useState<Step>('select-classes')
    const [classes, setClasses] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [activePeriod, setActivePeriod] = useState<any>(null)
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
    const [fromClassId, setFromClassId] = useState('')
    const [toClassId, setToClassId] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [targetFees, setTargetFees] = useState<any[]>([])

    useEffect(() => {
        fetchClasses()
    }, [])

    useEffect(() => {
        if (fromClassId) fetchStudents(fromClassId)
        else setStudents([])
    }, [fromClassId])

    useEffect(() => {
        if (toClassId) fetchTargetFees(toClassId)
        else setTargetFees([])
    }, [toClassId])

    const fetchClasses = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/grade-promotion')
            const data = await res.json()
            setClasses(data.classes || [])
            setActivePeriod(data.activePeriod)
        } catch (err) {
            setError('Failed to load classes')
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async (classId: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/grade-promotion?fromClassId=${classId}`)
            const data = await res.json()
            const studentList = data.students || []
            setStudents(studentList)
            setSelectedStudentIds(new Set(studentList.map((s: any) => s.id)))
        } catch (err) {
            setError('Failed to load students')
        } finally {
            setLoading(false)
        }
    }

    const fetchTargetFees = async (classId: string) => {
        try {
            const res = await fetch(`/api/fee-structures?classId=${classId}`)
            if (res.ok) {
                const data = await res.json()
                setTargetFees(data.filter((f: any) => f.isActive) || [])
            }
        } catch { }
    }

    const toggleStudent = (id: string) => {
        setSelectedStudentIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedStudentIds.size === students.length) {
            setSelectedStudentIds(new Set())
        } else {
            setSelectedStudentIds(new Set(students.map(s => s.id)))
        }
    }

    const handleSubmit = async () => {
        if (selectedStudentIds.size === 0) {
            setError('Select at least one student to promote')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            const res = await fetch('/api/grade-promotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromClassId,
                    toClassId,
                    studentIds: Array.from(selectedStudentIds),
                    notes
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Submission failed')
            setSuccess(`✅ ${data.message}`)
            onComplete?.()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const fromClass = classes.find(c => c.id === fromClassId)
    const toClass = classes.find(c => c.id === toClassId)
    const totalNewFees = targetFees.reduce((sum, f) => sum + f.amount, 0)
    const canProceedStep1 = fromClassId && toClassId && fromClassId !== toClassId

    if (success) {
        return (
            <div className="card text-center" style={{ padding: 'var(--spacing-3xl)' }}>
                <CheckCircle size={56} className="mx-auto mb-lg" style={{ color: 'var(--success-600)' }} />
                <h3 className="text-2xl font-bold mb-sm">Promotion Request Submitted</h3>
                <p className="text-muted-foreground mb-xl">{success}</p>
                <p className="text-sm text-muted-foreground mb-xl">
                    The principal must <strong>approve</strong> this request before students are moved. Check the Pending Approvals section on the Payments page.
                </p>
                <button className="btn btn-primary" onClick={() => {
                    setStep('select-classes')
                    setFromClassId('')
                    setToClassId('')
                    setStudents([])
                    setNotes('')
                    setSuccess('')
                }}>
                    Start Another Promotion
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-xl">
            {/* Progress Steps */}
            <div className="flex items-center gap-sm mb-xl">
                {[
                    { key: 'select-classes', label: 'Select Classes', num: 1 },
                    { key: 'review-students', label: 'Review Students', num: 2 },
                    { key: 'confirm', label: 'Confirm', num: 3 }
                ].map((s, i) => {
                    const steps: Step[] = ['select-classes', 'review-students', 'confirm']
                    const idx = steps.indexOf(step)
                    const sIdx = steps.indexOf(s.key as Step)
                    const isDone = idx > sIdx
                    const isActive = step === s.key
                    return (
                        <div key={s.key} className="flex items-center gap-sm flex-1">
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                background: isDone ? 'var(--success-600)' : isActive ? 'var(--primary-600)' : 'var(--neutral-200)',
                                color: isDone || isActive ? 'white' : 'var(--neutral-500)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem', fontWeight: 800
                            }}>
                                {isDone ? <CheckCircle size={14} /> : s.num}
                            </div>
                            <span style={{
                                fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--primary-700)' : 'var(--neutral-500)',
                                whiteSpace: 'nowrap'
                            }}>{s.label}</span>
                            {i < 2 && <div style={{ flex: 1, height: 2, background: isDone ? 'var(--success-200)' : 'var(--neutral-200)', borderRadius: 2 }} />}
                        </div>
                    )
                })}
            </div>

            {error && (
                <div className="alert alert-error flex items-center gap-sm">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Step 1: Select Classes */}
            {step === 'select-classes' && (
                <div className="card">
                    <h3 className="card-title mb-lg">Select Source & Target Classes</h3>

                    {activePeriod && (
                        <div className="p-md rounded-xl mb-lg flex items-start gap-sm" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)' }}>
                            <Info size={16} style={{ color: 'var(--primary-600)', marginTop: 2, flexShrink: 0 }} />
                            <p className="text-sm" style={{ color: 'var(--primary-700)' }}>
                                Active period: <strong>{activePeriod.academicYear} – {activePeriod.term}</strong>.
                                New invoices will be auto-generated for this period upon approval.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                        <div className="form-group">
                            <label className="form-label">From Class (Current)</label>
                            <select
                                className="form-control"
                                value={fromClassId}
                                onChange={e => { setFromClassId(e.target.value); setToClassId('') }}
                            >
                                <option value="">— Select source class —</option>
                                {classes.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.stream ? ` ${c.stream}` : ''} ({c._count?.students || 0} students)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">To Class (Target)</label>
                            <select
                                className="form-control"
                                value={toClassId}
                                onChange={e => setToClassId(e.target.value)}
                                disabled={!fromClassId}
                            >
                                <option value="">— Select target class —</option>
                                {classes.filter(c => c.id !== fromClassId).map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.stream ? ` ${c.stream}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {fromClassId && toClassId && (
                        <div className="mt-lg p-lg rounded-xl flex items-center gap-lg" style={{ background: 'var(--neutral-50)', border: '1px solid var(--border)' }}>
                            <div className="text-center">
                                <GraduationCap size={24} style={{ color: 'var(--primary-600)', margin: '0 auto 4px' }} />
                                <p className="font-bold text-sm">{fromClass?.name}{fromClass?.stream ? ' ' + fromClass.stream : ''}</p>
                                <p className="text-xs text-muted-foreground">{students.length} students</p>
                            </div>
                            <ArrowRight size={24} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                            <div className="text-center">
                                <GraduationCap size={24} style={{ color: 'var(--success-600)', margin: '0 auto 4px' }} />
                                <p className="font-bold text-sm">{toClass?.name}{toClass?.stream ? ' ' + toClass.stream : ''}</p>
                                {totalNewFees > 0 && (
                                    <p className="text-xs" style={{ color: 'var(--success-600)' }}>KES {totalNewFees.toLocaleString()} new fees</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-xl flex justify-end">
                        <button
                            className="btn btn-primary"
                            disabled={!canProceedStep1 || loading}
                            onClick={() => setStep('review-students')}
                        >
                            Review Students <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Review Students */}
            {step === 'review-students' && (
                <div className="card">
                    <div className="flex items-center justify-between mb-lg">
                        <h3 className="card-title m-0">
                            Review Students — {fromClass?.name} → {toClass?.name}
                        </h3>
                        <span className="badge badge-primary">
                            <Users size={14} className="mr-xs" />
                            {selectedStudentIds.size} / {students.length} selected
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-xl text-muted-foreground">
                            <Loader2 size={24} className="mx-auto mb-sm animate-spin" />
                            Loading students...
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-xl">
                            <AlertCircle size={32} className="mx-auto mb-sm text-muted-foreground" />
                            <p className="text-muted-foreground">No active students in this class.</p>
                        </div>
                    ) : (
                        <div className="space-y-sm">
                            {/* Select All */}
                            <div
                                className="flex items-center gap-md p-sm rounded-xl cursor-pointer"
                                style={{ background: 'var(--neutral-50)', border: '1px solid var(--border)' }}
                                onClick={toggleAll}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedStudentIds.size === students.length}
                                    onChange={toggleAll}
                                    className="form-checkbox"
                                    onClick={e => e.stopPropagation()}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <span className="font-bold text-sm">Select All Students</span>
                            </div>

                            <div style={{ maxHeight: '280px', overflowY: 'auto' }} className="space-y-xs pr-xs">
                                {students.map((s: any) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center gap-md p-sm rounded-xl cursor-pointer transition-all"
                                        style={{
                                            border: '1px solid',
                                            borderColor: selectedStudentIds.has(s.id) ? 'var(--primary-200)' : 'var(--border)',
                                            background: selectedStudentIds.has(s.id) ? 'var(--primary-50)' : 'transparent'
                                        }}
                                        onClick={() => toggleStudent(s.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.has(s.id)}
                                            onChange={() => toggleStudent(s.id)}
                                            onClick={e => e.stopPropagation()}
                                            style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0, accentColor: 'var(--primary-600)' }}
                                        />
                                        <div
                                            style={{
                                                width: 32, height: 32, borderRadius: '10px', flexShrink: 0,
                                                background: 'var(--primary-100)', color: 'var(--primary-700)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 800, fontSize: '0.875rem'
                                            }}
                                        >
                                            {s.firstName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{s.firstName} {s.lastName}</p>
                                            <p className="text-xs text-muted-foreground">Adm: {s.admissionNumber}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-xl flex justify-between">
                        <button className="btn btn-ghost" onClick={() => setStep('select-classes')}>
                            ← Back
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={selectedStudentIds.size === 0}
                            onClick={() => setStep('confirm')}
                        >
                            Continue <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 'confirm' && (
                <div className="card">
                    <h3 className="card-title mb-lg">Confirm Promotion Request</h3>

                    <div className="space-y-md mb-xl">
                        <div className="p-lg rounded-xl" style={{ background: 'var(--neutral-50)', border: '1px solid var(--border)' }}>
                            <div className="grid grid-cols-3 gap-lg text-center">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-xs">From</p>
                                    <p className="font-bold">{fromClass?.name}{fromClass?.stream ? ' ' + fromClass.stream : ''}</p>
                                </div>
                                <div className="flex items-center justify-center">
                                    <ArrowRight size={20} style={{ color: 'var(--primary-400)' }} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-xs">To</p>
                                    <p className="font-bold">{toClass?.name}{toClass?.stream ? ' ' + toClass.stream : ''}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-md">
                            <div className="p-md rounded-xl text-center" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)' }}>
                                <p className="text-2xl font-bold" style={{ color: 'var(--primary-700)' }}>{selectedStudentIds.size}</p>
                                <p className="text-xs text-muted-foreground font-semibold">Students Affected</p>
                            </div>
                            <div className="p-md rounded-xl text-center" style={{ background: totalNewFees > 0 ? 'var(--success-50)' : 'var(--neutral-50)', border: `1px solid ${totalNewFees > 0 ? 'var(--success-100)' : 'var(--border)'}` }}>
                                <p className="text-2xl font-bold" style={{ color: totalNewFees > 0 ? 'var(--success-700)' : 'var(--neutral-500)' }}>
                                    KES {totalNewFees > 0 ? totalNewFees.toLocaleString() : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground font-semibold">New Fees Per Student</p>
                            </div>
                        </div>

                        {activePeriod && totalNewFees > 0 && (
                            <div className="p-sm rounded-xl flex items-start gap-sm" style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-100)' }}>
                                <Info size={14} style={{ color: 'var(--warning-600)', marginTop: 2, flexShrink: 0 }} />
                                <p className="text-xs" style={{ color: 'var(--warning-700)' }}>
                                    Upon approval, invoices for <strong>KES {totalNewFees.toLocaleString()}</strong> will be auto-generated for each promoted student for <strong>{activePeriod.academicYear} {activePeriod.term}</strong>.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="form-group mb-xl">
                        <label className="form-label">Notes / Reason (optional)</label>
                        <textarea
                            className="form-control"
                            rows={2}
                            placeholder="e.g. End of Term 2 promotion – all students cleared"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="p-md rounded-xl mb-xl flex items-start gap-sm" style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-100)' }}>
                        <AlertCircle size={16} style={{ color: 'var(--warning-600)', marginTop: 1, flexShrink: 0 }} />
                        <p className="text-sm" style={{ color: 'var(--warning-700)' }}>
                            This will create a <strong>pending approval request</strong>. Students will only be moved once a principal approves it. Old fee records are preserved permanently.
                        </p>
                    </div>

                    <div className="flex justify-between">
                        <button className="btn btn-ghost" onClick={() => setStep('review-students')}>
                            ← Back
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin mr-xs" /> : null}
                            Submit for Approval
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
