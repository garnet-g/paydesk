'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Coins, X, Loader2 } from 'lucide-react'

interface FeeStructureManagerProps {
    schoolId?: string
}

const FEE_CATEGORIES = [
    { value: 'TUITION', label: 'Tuition', color: 'var(--primary-600)' },
    { value: 'BOARDING', label: 'Boarding', color: '#8b5cf6' },
    { value: 'TRANSPORT', label: 'Transport', color: 'var(--success-600)' },
    { value: 'TRIPS', label: 'Trips/Excursions', color: '#f59e0b' },
    { value: 'UNIFORMS', label: 'Uniforms', color: '#ec4899' },
    { value: 'BOOKS', label: 'Books/Materials', color: '#6366f1' },
    { value: 'EXAM_FEES', label: 'Exam Fees', color: 'var(--error-600)' },
    { value: 'ACTIVITIES', label: 'Activities/Clubs', color: '#14b8a6' },
    { value: 'OTHER', label: 'Other', color: 'var(--muted-foreground)' }
]

export default function FeeStructureManager({ schoolId }: FeeStructureManagerProps) {
    const [feeStructures, setFeeStructures] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [academicPeriods, setAcademicPeriods] = useState<any[]>([])
    const [selectedPeriod, setSelectedPeriod] = useState('')
    const [selectedClass, setSelectedClass] = useState('')
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingFee, setEditingFee] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        category: 'TUITION',
        displayOrder: 0,
        classId: '',
        applyToAllClasses: false
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (selectedPeriod) {
            fetchFeeStructures()
        }
    }, [selectedPeriod, selectedClass])

    const fetchInitialData = async () => {
        try {
            const [classesRes, periodsRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/academic-periods')
            ])

            if (classesRes.ok) {
                const classesData = await classesRes.json()
                setClasses(classesData)
            }

            if (periodsRes.ok) {
                const periodsData = await periodsRes.json()
                setAcademicPeriods(periodsData)
                const activePeriod = periodsData.find((p: any) => p.isActive)
                if (activePeriod) {
                    setSelectedPeriod(activePeriod.id)
                }
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchFeeStructures = async () => {
        if (!selectedPeriod) return

        setLoading(true)
        try {
            const params = new URLSearchParams({
                academicPeriodId: selectedPeriod,
                ...(selectedClass && { classId: selectedClass }),
                ...(schoolId && { schoolId })
            })

            const res = await fetch(`/api/fee-structures?${params}`)
            if (res.ok) {
                const data = await res.json()
                setFeeStructures(data)
            }
        } catch (error) {
            console.error('Failed to fetch fee structures:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const url = editingFee ? `/api/fee-structures/${editingFee.id}` : '/api/fee-structures'
            const method = editingFee ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    academicPeriodId: selectedPeriod,
                    ...(schoolId && { schoolId })
                })
            })

            if (res.ok) {
                fetchFeeStructures()
                setShowAddModal(false)
                setEditingFee(null)
                resetForm()
            } else {
                const err = await res.text()
                alert('Error: ' + err)
            }
        } catch (error) {
            alert('Failed to save fee structure')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this fee structure?')) return

        try {
            const res = await fetch(`/api/fee-structures/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchFeeStructures()
            }
        } catch (error) {
            alert('Failed to delete fee structure')
        }
    }

    const handleEdit = (fee: any) => {
        setEditingFee(fee)
        setFormData({
            name: fee.name,
            description: fee.description || '',
            amount: fee.amount.toString(),
            category: fee.category,
            displayOrder: fee.displayOrder,
            classId: fee.classId || '',
            applyToAllClasses: false
        })
        setShowAddModal(true)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            amount: '',
            category: 'TUITION',
            displayOrder: 0,
            classId: '',
            applyToAllClasses: false
        })
    }

    const closeModal = () => {
        setShowAddModal(false)
        setEditingFee(null)
        resetForm()
    }

    const getCategoryMeta = (category: string) =>
        FEE_CATEGORIES.find(c => c.value === category) || { label: category, color: 'var(--muted-foreground)' }

    const groupedFees = feeStructures.reduce((acc: any, fee: any) => {
        const key = fee.classId || 'general'
        if (!acc[key]) {
            acc[key] = {
                className: fee.class?.name || (fee.classId ? 'Loading Class...' : 'General / All Classes'),
                fees: []
            }
        }
        acc[key].fees.push(fee)
        return acc
    }, {})

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Fee Structures</h2>
                    <p className="text-muted">Define and manage fee categories for each academic period</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowAddModal(true) }}
                >
                    <Plus size={18} />
                    Add Fee Structure
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="grid grid-cols-2 gap-md">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Academic Period</label>
                        <select
                            className="form-select"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                        >
                            <option value="">Select a period...</option>
                            {academicPeriods.map(period => (
                                <option key={period.id} value={period.id}>
                                    {period.academicYear} — {period.term.replace('_', ' ')} {period.isActive && '(Active)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Class (Optional)</label>
                        <select
                            className="form-select"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name} {cls.stream}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
                    <div className="spinner"></div>
                </div>
            ) : Object.keys(groupedFees).length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <Coins size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)', margin: '0 auto var(--spacing-md)' }} />
                    <p className="font-semibold" style={{ marginBottom: 'var(--spacing-xs)' }}>No fee structures found</p>
                    <p className="text-muted text-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        {!selectedPeriod ? 'Select an academic period to view or add fee structures.' : 'No fees defined for this period yet.'}
                    </p>
                    {selectedPeriod && (
                        <button className="btn btn-outline" onClick={() => { resetForm(); setShowAddModal(true) }}>
                            <Plus size={16} /> Add First Fee
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                    {Object.entries(groupedFees).map(([key, group]: [string, any]) => (
                        <div key={key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Group Header */}
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 className="card-title">{group.className}</h3>
                                    <p className="card-description">{group.fees.length} fee {group.fees.length === 1 ? 'entry' : 'entries'}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Section Total</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                                        KES {group.fees.reduce((sum: number, fee: any) => sum + fee.amount, 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Name / Description</th>
                                            <th>Amount (KES)</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.fees.map((fee: any) => {
                                            const catMeta = getCategoryMeta(fee.category)
                                            return (
                                                <tr key={fee.id}>
                                                    <td>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                background: `${catMeta.color}15`,
                                                                color: catMeta.color,
                                                                border: `1px solid ${catMeta.color}30`
                                                            }}
                                                        >
                                                            {catMeta.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="font-semibold">{fee.name}</div>
                                                        {fee.description && (
                                                            <div className="text-xs text-muted">{fee.description}</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="font-semibold">{fee.amount.toLocaleString()}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                title="Edit"
                                                                onClick={() => handleEdit(fee)}
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                title="Delete"
                                                                style={{ color: 'var(--error-600)' }}
                                                                onClick={() => handleDelete(fee.id)}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Fee Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="e.g. Laboratory Fee"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Brief description..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-select"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {FEE_CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Amount (KES)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Class Restriction</label>
                                    <select
                                        className="form-select"
                                        value={formData.classId}
                                        onChange={(e) => setFormData({ ...formData, classId: e.target.value, applyToAllClasses: false })}
                                        disabled={formData.applyToAllClasses}
                                    >
                                        <option value="">All Classes (School-wide)</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name} {cls.stream}</option>
                                        ))}
                                    </select>
                                    <p className="form-hint">Leave empty to apply this fee to all classes.</p>
                                </div>

                                {!editingFee && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-md)',
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--neutral-50)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            id="applyToAll"
                                            className="form-checkbox"
                                            checked={formData.applyToAllClasses}
                                            onChange={(e) => setFormData({ ...formData, applyToAllClasses: e.target.checked, classId: '' })}
                                        />
                                        <label htmlFor="applyToAll" style={{ cursor: 'pointer', marginBottom: 0 }}>
                                            <div className="font-semibold text-sm">Apply to all classes</div>
                                            <div className="text-xs text-muted">Creates a copy of this fee for each class in the school</div>
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting
                                        ? <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                                        : editingFee ? 'Save Changes' : 'Add Fee Structure'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
