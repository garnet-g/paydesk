'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    Layers,
    Calendar,
    Users,
    FilePlus,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Info,
    Search,
    ChevronRight,
    Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function BulkInvoicePage() {
    const { data: session } = useSession()

    // Data states
    const [classes, setClasses] = useState<any[]>([])
    const [periods, setPeriods] = useState<any[]>([])
    const [feeStructures, setFeeStructures] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form states
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedPeriodId, setSelectedPeriodId] = useState('')
    const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([])
    const [dueDate, setDueDate] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string; createdCount: number } | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (session) {
            fetchInitialData()
        }
    }, [session])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const [classesRes, periodsRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/academic-periods')
            ])

            if (classesRes.ok) setClasses(await classesRes.json())
            if (periodsRes.ok) {
                const periodsData = await periodsRes.json()
                setPeriods(periodsData)
                // Default to active period
                const active = periodsData.find((p: any) => p.isActive)
                if (active) setSelectedPeriodId(active.id)
            }
        } catch (err) {
            console.error('Failed to fetch initial data:', err)
            setError('Failed to load classes or academic periods')
        } finally {
            setLoading(false)
        }
    }

    // Fetch fee structures when period changes
    useEffect(() => {
        if (selectedPeriodId) {
            fetchFeeStructures(selectedPeriodId)
        }
    }, [selectedPeriodId])

    const fetchFeeStructures = async (periodId: string) => {
        try {
            const res = await fetch(`/api/fee-structures?academicPeriodId=${periodId}`)
            if (res.ok) {
                setFeeStructures(await res.json())
                setSelectedFeeIds([]) // reset selection
            }
        } catch (err) {
            console.error('Failed to fetch fee structures:', err)
        }
    }

    const toggleFeeSelection = (id: string) => {
        setSelectedFeeIds(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        )
    }

    const handleGenerate = async () => {
        if (!selectedPeriodId || !dueDate) {
            setError('Please selecet academic period and due date')
            return
        }

        setIsGenerating(true)
        setError('')
        setResult(null)

        try {
            const res = await fetch('/api/invoices/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId: selectedClassId || null,
                    academicPeriodId: selectedPeriodId,
                    dueDate: dueDate,
                    feeStructureIds: selectedFeeIds
                })
            })

            const data = await res.json()
            if (res.ok) {
                setResult({
                    success: true,
                    message: data.message,
                    createdCount: data.createdCount
                })
            } else {
                setError(data.error || 'Failed to generate invoices')
            }
        } catch (err) {
            console.error('Generation failure:', err)
            setError('A system error occurred during generation.')
        } finally {
            setIsGenerating(false)
        }
    }

    const selectedClass = classes.find(c => c.id === selectedClassId)
    const selectedPeriod = periods.find(p => p.id === selectedPeriodId)
    const totalSelectedFeesAmount = feeStructures
        .filter(fs => selectedFeeIds.includes(fs.id))
        .reduce((sum, fs) => sum + fs.amount, 0)

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="spinner"></div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xl)', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    <span>Dashboard</span>
                    <ChevronRight size={14} />
                    <span>Invoices</span>
                    <ChevronRight size={14} />
                    <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Bulk Generation</span>
                </div>

                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Bulk Invoice Generation</h2>
                        <p className="text-muted">Batch bill your students for the upcoming term with precision.</p>
                    </div>
                </div>

                {result ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--success-50)',
                            borderRadius: 'var(--radius-full)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-xl)'
                        }}>
                            <CheckCircle size={48} style={{ color: 'var(--success-600)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>Process Complete</h3>
                        <p className="text-muted" style={{ marginBottom: 'var(--spacing-xl)', maxWidth: '400px', margin: '0 auto var(--spacing-xl)' }}>
                            {result.message}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)' }}>
                            <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard/invoices'}>
                                View Invoices
                            </button>
                            <button className="btn btn-outline" onClick={() => setResult(null)}>
                                Generate More
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
                        {/* Left Column: Steps */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', minWidth: 0 }} className="lg:col-span-2">
                            {/* Step 1 */}
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="card-header" style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: 'var(--primary-100)',
                                            color: 'var(--primary-700)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700
                                        }}>1</div>
                                        <div>
                                            <h3 className="card-title">General Settings</h3>
                                            <p className="card-description">Specify the target group and timing</p>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: 'var(--spacing-xl)' }}>
                                    <div className="grid grid-cols-2 gap-lg">
                                        <div className="form-group">
                                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                <Calendar size={16} /> Academic Period
                                            </label>
                                            <select
                                                className="form-select"
                                                value={selectedPeriodId}
                                                onChange={(e) => setSelectedPeriodId(e.target.value)}
                                            >
                                                {periods.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.academicYear} - {p.term.replace('_', ' ')} {p.isActive ? '(Active)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                <Users size={16} /> Target Class
                                            </label>
                                            <select
                                                className="form-select"
                                                value={selectedClassId}
                                                onChange={(e) => setSelectedClassId(e.target.value)}
                                            >
                                                <option value="">All Students (School-wide)</option>
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} {c.stream || ''}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                <ArrowRight size={16} /> Payment Due Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            <p className="form-hint">Invoices will be marked as OVERDUE if not paid by this date.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Fee Selection */}
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="card-header" style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: 'var(--primary-100)',
                                            color: 'var(--primary-700)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700
                                        }}>2</div>
                                        <div>
                                            <h3 className="card-title">Fee Component Selection</h3>
                                            <p className="card-description">Choose which components to include in this billing run</p>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: 'var(--spacing-xl)' }}>
                                    {feeStructures.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)' }}>
                                            <Info size={24} style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-sm)' }} />
                                            <p className="text-muted">No fee structures found for the selected period.</p>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                style={{ marginTop: 'var(--spacing-sm)' }}
                                                onClick={() => window.location.href = '/dashboard/academic-structure'}
                                            >
                                                Configure Fees First
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                            <div className="text-xs font-bold uppercase text-muted" style={{ letterSpacing: '0.05em', marginBottom: 'var(--spacing-md)' }}>Available Fee Structures</div>
                                            {feeStructures.map(fs => (
                                                <div
                                                    key={fs.id}
                                                    onClick={() => toggleFeeSelection(fs.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: 'var(--spacing-md)',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: selectedFeeIds.includes(fs.id) ? '2px solid var(--primary-500)' : '2px solid transparent',
                                                        background: selectedFeeIds.includes(fs.id) ? 'var(--primary-50)' : 'var(--neutral-50)',
                                                        cursor: 'pointer',
                                                        transition: 'all var(--transition-fast)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                        <div style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: 'var(--radius-sm)',
                                                            border: selectedFeeIds.includes(fs.id) ? '2px solid var(--primary-600)' : '2px solid var(--neutral-300)',
                                                            background: selectedFeeIds.includes(fs.id) ? 'var(--primary-600)' : 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            flexShrink: 0
                                                        }}>
                                                            {selectedFeeIds.includes(fs.id) && <CheckCircle size={14} />}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm">{fs.name}</div>
                                                            <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>{fs.category || 'GENERAL'} • {fs.classId ? fs.class?.name : 'All Classes'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="font-semibold">{formatCurrency(fs.amount)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Summary */}
                        <div className="lg:col-span-1">
                            <div className="card" style={{ position: 'sticky', top: '100px' }}>
                                <div className="card-header">
                                    <h3 className="card-title">Generation Summary</h3>
                                </div>
                                <div className="card-content">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                            <span className="text-muted">Target Population</span>
                                            <span className="font-semibold">{selectedClassId ? selectedClass?.name : 'Entire School'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                            <span className="text-muted">Academic Period</span>
                                            <span className="font-semibold">{selectedPeriod?.academicYear} - {selectedPeriod?.term.replace('_', ' ')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                            <span className="text-muted">Components Selected</span>
                                            <span className="font-semibold">{selectedFeeIds.length} items</span>
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="text-muted font-medium">Invoice Total</span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)' }}>{formatCurrency(totalSelectedFeesAmount)}</span>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-error" style={{ marginTop: 'var(--spacing-lg)' }}>
                                            <AlertCircle size={16} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="alert alert-info" style={{ marginTop: 'var(--spacing-lg)' }}>
                                        <Info size={16} />
                                        <p className="text-sm" style={{ margin: 0 }}>
                                            Students who already have an invoice for this period will be <strong>skipped</strong> to prevent double billing.
                                        </p>
                                    </div>
                                </div>
                                <div className="card-footer" style={{ justifyContent: 'stretch' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: 'var(--spacing-lg)', fontSize: '1rem', fontWeight: 700 }}
                                        disabled={isGenerating || !selectedPeriodId || !dueDate || selectedFeeIds.length === 0}
                                        onClick={handleGenerate}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FilePlus size={20} />
                                                Generate Invoices
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
