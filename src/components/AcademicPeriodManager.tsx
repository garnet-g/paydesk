'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, Check, Trash2, AlertCircle, X, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AcademicPeriodManager({ onClose, onSuccess }: { onClose?: () => void, onSuccess?: () => void }) {
    const [periods, setPeriods] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [form, setForm] = useState({
        term: 'TERM_1',
        academicYear: new Date().getFullYear().toString(),
        startDate: '',
        endDate: '',
        isActive: false
    })

    const fetchPeriods = async () => {
        try {
            const res = await fetch('/api/academic-periods')
            if (res.ok) setPeriods(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchPeriods()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/academic-periods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                await fetchPeriods()
                if (onSuccess) onSuccess()
                setShowForm(false)
                setForm({
                    term: 'TERM_1',
                    academicYear: new Date().getFullYear().toString(),
                    startDate: '',
                    endDate: '',
                    isActive: false
                })
            } else {
                const txt = await res.text()
                setError(txt)
            }
        } catch (e) {
            setError('Failed to create period')
        } finally {
            setLoading(false)
        }
    }

    const activatePeriod = async (id: string) => {
        if (!confirm('Activate this period? This will deactivate all other active periods.')) return
        try {
            const res = await fetch(`/api/academic-periods/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: true })
            })
            if (res.ok) {
                await fetchPeriods()
                if (onSuccess) onSuccess()
            }
        } catch (e) { console.error(e) }
    }

    const deletePeriod = async (id: string) => {
        if (!confirm('Delete this period? This cannot be undone.')) return
        try {
            const res = await fetch(`/api/academic-periods/${id}`, { method: 'DELETE' })
            if (res.ok) fetchPeriods()
            else alert('Cannot delete an active period or one that has associated data.')
        } catch (e) { console.error(e) }
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Card Header */}
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--primary-50)',
                        color: 'var(--primary-600)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h3 className="card-title">Academic Periods</h3>
                        <p className="card-description">Manage terms and academic year cycles</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    {!showForm && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={18} />
                            New Period
                        </button>
                    )}
                    {onClose && (
                        <button className="btn btn-ghost btn-sm" onClick={onClose}>
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="card-content">
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {showForm && (
                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)', border: '1px solid var(--primary-200)', background: 'var(--primary-50)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h4 style={{ margin: 0, fontWeight: 600 }}>Define New Academic Period</h4>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowForm(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Academic Term</label>
                                    <select
                                        className="form-select"
                                        value={form.term}
                                        onChange={e => setForm({ ...form, term: e.target.value })}
                                    >
                                        <option value="TERM_1">Term 1</option>
                                        <option value="TERM_2">Term 2</option>
                                        <option value="TERM_3">Term 3</option>
                                        <option value="SUMMER">Summer / Special</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">School Year</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="2026"
                                        required
                                        value={form.academicYear}
                                        onChange={e => setForm({ ...form, academicYear: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                                padding: 'var(--spacing-md)',
                                background: 'var(--neutral-50)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                marginBottom: 'var(--spacing-lg)',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="form-checkbox"
                                    checked={form.isActive}
                                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" style={{ cursor: 'pointer', marginBottom: 0 }}>
                                    <div className="font-semibold text-sm">Set as Active Period</div>
                                    <div className="text-xs text-muted">This will deactivate any currently active period</div>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading
                                        ? <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                                        : <><Check size={16} /> Create Period</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Periods Table */}
                {periods.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <Calendar size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)', margin: '0 auto var(--spacing-md)' }} />
                        <p className="font-semibold" style={{ marginBottom: 'var(--spacing-xs)' }}>No academic periods defined</p>
                        <p className="text-muted text-sm">Create your first term to start managing billing cycles.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Year</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <span className="font-semibold">{p.term.replace('_', ' ')}</span>
                                        </td>
                                        <td>{p.academicYear}</td>
                                        <td>{formatDate(p.startDate)}</td>
                                        <td>{formatDate(p.endDate)}</td>
                                        <td>
                                            <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>
                                                {p.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                                {!p.isActive && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        title="Set as Active"
                                                        style={{ color: 'var(--success-600)' }}
                                                        onClick={() => activatePeriod(p.id)}
                                                    >
                                                        <Check size={15} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    title="Delete"
                                                    style={{ color: p.isActive ? 'var(--muted-foreground)' : 'var(--error-600)', opacity: p.isActive ? 0.4 : 1, cursor: p.isActive ? 'not-allowed' : 'pointer' }}
                                                    onClick={() => !p.isActive && deletePeriod(p.id)}
                                                    disabled={p.isActive}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
