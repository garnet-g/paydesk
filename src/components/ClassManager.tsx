'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Users, Coins, X, Calendar, Loader2, Layers } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import AcademicPeriodManager from './AcademicPeriodManager'

export default function ClassManager() {
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Add Class Form State
    const [formData, setFormData] = useState({
        name: '',
        stream: ''
    })

    // Fee Management State
    const [showFeeModal, setShowFeeModal] = useState(false)
    const [selectedClass, setSelectedClass] = useState<any>(null)
    const [classFees, setClassFees] = useState<any[]>([])
    const [feeLoading, setFeeLoading] = useState(false)
    const [feeData, setFeeData] = useState({ name: '', amount: '', category: 'TUITION' })
    const [applyToGrade, setApplyToGrade] = useState(false)

    // Academic Period Manager State
    const [showPeriodManager, setShowPeriodManager] = useState(false)

    useEffect(() => {
        fetchClasses()
    }, [])

    const fetchClasses = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/classes')
            if (res.ok) {
                const data = await res.json()
                setClasses(data)
            }
        } catch (error) {
            console.error('Failed to fetch classes', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                fetchClasses()
                setShowAddModal(false)
                setFormData({ name: '', stream: '' })
            } else {
                const err = await res.text()
                alert('Error: ' + err)
            }
        } catch (error) {
            alert('Failed to add class')
        } finally {
            setSubmitting(false)
        }
    }

    const openFeeModal = async (cls: any) => {
        setSelectedClass(cls)
        setShowFeeModal(true)
        fetchClassFees(cls.id)
    }

    const fetchClassFees = async (classId: string) => {
        setFeeLoading(true)
        try {
            const res = await fetch(`/api/classes/${classId}/fees`)
            if (res.ok) {
                const data = await res.json()
                setClassFees(data.fees || [])
            }
        } catch (error) {
            console.error('Error fetching fees', error)
        } finally {
            setFeeLoading(false)
        }
    }

    const handleAddFee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClass) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/classes/${selectedClass.id}/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...feeData, applyToGrade })
            })

            if (res.ok) {
                fetchClassFees(selectedClass.id)
                setFeeData({ name: '', amount: '', category: 'TUITION' })
                setApplyToGrade(false)
            } else {
                const err = await res.text()
                alert('Error: ' + err)
            }
        } catch (error) {
            alert('Failed to add fee')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Classes</h2>
                    <p className="text-muted">Manage your school's classes and fee structures</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowPeriodManager(true)}
                    >
                        <Calendar size={16} />
                        Term Cycle
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={18} />
                        Add Class
                    </button>
                </div>
            </div>

            {/* Classes Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                    <div className="spinner" style={{ margin: '0 auto var(--spacing-md)' }}></div>
                    <p className="text-muted text-sm">Loading classes...</p>
                </div>
            ) : classes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                    <div style={{
                        width: '80px', height: '80px',
                        background: 'var(--neutral-50)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto var(--spacing-lg)',
                        color: 'var(--neutral-300)'
                    }}>
                        <Layers size={36} />
                    </div>
                    <h3 className="font-semibold" style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-xs)' }}>No classes yet</h3>
                    <p className="text-muted text-sm" style={{ maxWidth: '360px', margin: '0 auto var(--spacing-lg)' }}>
                        Add your first class to start setting up fee structures and enrolling students.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Add Your First Class
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Class Name</th>
                                    <th>Stream</th>
                                    <th>Students</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.map(cls => (
                                    <tr key={cls.id}>
                                        <td>
                                            <span className="font-semibold" style={{ fontSize: '1rem' }}>{cls.name}</span>
                                        </td>
                                        <td>
                                            {cls.stream ? (
                                                <span className="badge badge-neutral">{cls.stream}</span>
                                            ) : (
                                                <span className="text-muted text-sm">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Users size={16} style={{ color: 'var(--muted-foreground)' }} />
                                                <span className="font-semibold">{cls._count?.students || 0}</span>
                                                <span className="text-xs text-muted">enrolled</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => openFeeModal(cls)}
                                                >
                                                    <Coins size={14} />
                                                    Fees
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    title="Edit Class"
                                                    style={{ padding: '6px' }}
                                                >
                                                    <Edit2 size={14} />
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

            {/* Manage Fees Modal */}
            {showFeeModal && selectedClass && (
                <div className="modal-overlay" onClick={() => setShowFeeModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '600px', padding: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">{selectedClass.name} — Fees</h3>
                                <p className="text-xs text-muted">Set up the fee items for this class</p>
                            </div>
                            <button onClick={() => setShowFeeModal(false)} className="btn btn-ghost btn-sm">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {/* Current Fee Items */}
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <h4 className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-sm)' }}>Current Fee Items</h4>
                                {feeLoading ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                                    </div>
                                ) : classFees.length === 0 ? (
                                    <div style={{
                                        padding: 'var(--spacing-lg)',
                                        background: 'var(--neutral-50)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px dashed var(--border)',
                                        textAlign: 'center'
                                    }}>
                                        <p className="text-sm text-muted">No fee items added yet for this class.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                        {classFees.map(fee => (
                                            <div key={fee.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: 'var(--spacing-md)',
                                                background: 'var(--neutral-50)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div>
                                                    <div className="font-semibold text-sm">{fee.name}</div>
                                                    <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>{fee.category}</span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className="font-semibold">{formatCurrency(fee.amount)}</div>
                                                    <div className="text-xs text-muted">per term</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add New Fee Form */}
                            <div style={{
                                padding: 'var(--spacing-lg)',
                                background: 'var(--neutral-50)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border)'
                            }}>
                                <h4 className="font-semibold" style={{ marginBottom: 'var(--spacing-md)' }}>Add Fee Item</h4>
                                <form onSubmit={handleAddFee}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Name</label>
                                            <input
                                                className="form-input"
                                                placeholder="e.g. Lab Fee"
                                                value={feeData.name}
                                                onChange={e => setFeeData({ ...feeData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Amount (KES)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="0.00"
                                                step="0.01"
                                                value={feeData.amount}
                                                onChange={e => setFeeData({ ...feeData, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <label className="form-label">Category</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                            {['TUITION', 'BOARDING', 'TRANSPORT', 'OTHER'].map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setFeeData({ ...feeData, category: cat })}
                                                    style={{
                                                        height: '36px',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.03em',
                                                        border: feeData.category === cat ? 'none' : '1px solid var(--border)',
                                                        background: feeData.category === cat ? 'var(--primary-600)' : 'white',
                                                        color: feeData.category === cat ? 'white' : 'var(--muted-foreground)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={applyToGrade}
                                                onChange={e => setApplyToGrade(e.target.checked)}
                                                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                                            />
                                            <span className="text-xs text-muted">Apply to all streams of this grade</span>
                                        </label>
                                        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                            {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Add Fee'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Class Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '460px', padding: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Class</h3>
                            <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <label className="form-label">Class Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="e.g. Grade 1"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted" style={{ marginTop: '4px' }}>The name students and parents will see</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Stream (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. East, Blue, A"
                                        value={formData.stream}
                                        onChange={e => setFormData({ ...formData, stream: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Academic Period Manager Modal */}
            {showPeriodManager && (
                <div className="modal-overlay" onClick={() => setShowPeriodManager(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '56rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <AcademicPeriodManager
                            onClose={() => setShowPeriodManager(false)}
                            onSuccess={() => { fetchClasses(); }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
