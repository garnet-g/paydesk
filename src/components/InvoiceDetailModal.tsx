'use client'

import { useState, useEffect } from 'react'
import { X, Download, Printer, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf-utils'
import { useSession } from 'next-auth/react'

interface InvoiceDetailModalProps {
    invoice: any
    onClose: () => void
    onUpdate?: () => void
}

const FEE_CATEGORIES = [
    { value: 'TUITION', label: 'Tuition', color: '#3b82f6' },
    { value: 'BOARDING', label: 'Boarding', color: '#8b5cf6' },
    { value: 'TRANSPORT', label: 'Transport', color: '#10b981' },
    { value: 'TRIPS', label: 'Trips/Excursions', color: '#f59e0b' },
    { value: 'UNIFORMS', label: 'Uniforms', color: '#ec4899' },
    { value: 'BOOKS', label: 'Books/Materials', color: '#6366f1' },
    { value: 'EXAM_FEES', label: 'Exam Fees', color: '#ef4444' },
    { value: 'ACTIVITIES', label: 'Activities/Clubs', color: '#14b8a6' },
    { value: 'OTHER', label: 'Other', color: '#64748b' }
]

export default function InvoiceDetailModal({ invoice: initialInvoice, onClose, onUpdate }: InvoiceDetailModalProps) {
    const { data: session } = useSession()
    const [invoice, setInvoice] = useState(initialInvoice)
    const [isEditing, setIsEditing] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newItem, setNewItem] = useState({ description: '', amount: '', category: 'OTHER', type: 'CHARGE' })
    const [loading, setLoading] = useState(false)
    const [billingSummary, setBillingSummary] = useState<any>(null)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [cancelReason, setCancelReason] = useState('')

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch(`/api/students/${invoice.studentId}/billing-summary`)
                if (res.ok) setBillingSummary(await res.json())
            } catch (err) {
                console.error(err)
            }
        }
        fetchSummary()
    }, [invoice.studentId])

    const canEdit = session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'FINANCE_MANAGER'
    const isPrincipal = session?.user?.role === 'PRINCIPAL'
    const isFinanceManager = session?.user?.role === 'FINANCE_MANAGER'
    const isAdmin = isPrincipal || isFinanceManager || session?.user?.role === 'SUPER_ADMIN'

    const getCategoryColor = (category: string) => {
        return FEE_CATEGORIES.find(c => c.value === category)?.color || '#64748b'
    }

    const getCategoryLabel = (category: string) => {
        return FEE_CATEGORIES.find(c => c.value === category)?.label || category
    }

    // Group items by category
    const groupedItems = invoice.items?.reduce((acc: any, item: any) => {
        const category = item.category || 'OTHER'
        if (!acc[category]) {
            acc[category] = {
                label: getCategoryLabel(category),
                color: getCategoryColor(category),
                items: [],
                total: 0
            }
        }
        acc[category].items.push(item)
        acc[category].total += parseFloat(item.amount)
        return acc
    }, {}) || {}

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.description || !newItem.amount) return

        const amountNum = parseFloat(newItem.amount)
        const isLargeAdjustment = Math.abs(amountNum) > 10000 // Threshold for mandatory approval

        if (isLargeAdjustment && !isPrincipal) {
            const confirmReq = confirm(`Adjustments over KES 10,000 require dual-authorization. Would you like to submit an approval request to the Principal?`)
            if (!confirmReq) return

            setLoading(true)
            try {
                const res = await fetch('/api/approvals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'BALANCE_ADJUSTMENT',
                        payload: {
                            invoiceId: invoice.id,
                            newBalance: Number(invoice.balance) + (newItem.type === 'CREDIT' ? -amountNum : amountNum),
                            newTotal: Number(invoice.totalAmount) + (newItem.type === 'CREDIT' ? -amountNum : amountNum),
                            adjustmentDetails: newItem.description
                        },
                        reason: `Large adjustment: ${newItem.description} (${newItem.type})`
                    })
                })

                if (res.ok) {
                    alert('Adjustment request submitted for dual-authorization.')
                    setShowAddForm(false)
                } else {
                    alert('Failed to submit approval request.')
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
            return
        }

        setLoading(true)
        try {
            const amount = newItem.type === 'CREDIT' ? -Math.abs(parseFloat(newItem.amount)) : Math.abs(parseFloat(newItem.amount))

            const res = await fetch(`/api/invoices/${invoice.id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: newItem.description,
                    amount,
                    category: newItem.category
                })
            })

            if (res.ok) {
                const updatedInvoice = await res.json()
                setInvoice(updatedInvoice)
                setShowAddForm(false)
                setNewItem({ description: '', amount: '', category: 'OTHER', type: 'CHARGE' })
                if (onUpdate) onUpdate()
            } else {
                alert('Failed to add item')
            }
        } catch (error) {
            console.error(error)
            alert('Error adding item')
        } finally {
            setLoading(false)
        }
    }

    const handleRequestCancellation = async () => {
        if (!cancelReason) {
            alert('Please provide a reason for cancellation')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'INVOICE_CANCELLATION',
                    payload: { invoiceId: invoice.id },
                    reason: cancelReason
                })
            })

            if (res.ok) {
                alert('Cancellation request submitted to Principal for dual-authorization.')
                setShowCancelConfirm(false)
                onClose()
            } else {
                alert('Failed to submit cancellation request.')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to remove this item?')) return

        setLoading(true)
        try {
            const res = await fetch(`/api/invoices/items/${itemId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                const updatedInvoice = await res.json()
                setInvoice(updatedInvoice)
                if (onUpdate) onUpdate()
            } else {
                alert('Failed to delete item')
            }
        } catch (error) {
            console.error(error)
            alert('Error deleting item')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title flex items-center gap-sm">
                            Invoice Details
                            {canEdit && (
                                <button
                                    className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setIsEditing(!isEditing)}
                                    title="Edit Invoice"
                                >
                                    <Edit2 size={16} />
                                    {isEditing ? 'Done Editing' : 'Edit'}
                                </button>
                            )}
                        </h3>
                        <p className="text-sm text-muted">{invoice.invoiceNumber}</p>
                    </div>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {/* Student & Invoice Info */}
                    <div className="grid grid-cols-2 gap-lg" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-sm)' }}>STUDENT INFORMATION</h4>
                            <p style={{ marginBottom: 'var(--spacing-xs)' }}>
                                <strong>{invoice.student?.firstName} {invoice.student?.lastName}</strong>
                            </p>
                            <div className="flex items-center gap-sm">
                                <p className="text-sm text-muted">Adm No: {invoice.student?.admissionNumber}</p>
                                <span className={`badge ${invoice.status === 'PAID' ? 'badge-success' :
                                        invoice.status === 'PARTIALLY_PAID' ? 'badge-warning' :
                                            invoice.status === 'CANCELLED' ? 'badge-muted' :
                                                'badge-error'
                                    }`}>
                                    {invoice.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-sm)' }}>INVOICE INFORMATION</h4>
                            <p className="text-sm" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                <strong>Term:</strong> {invoice.academicPeriod?.term} {invoice.academicPeriod?.academicYear}
                            </p>
                            <p className="text-sm" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                <strong>Issue Date:</strong> {formatDate(invoice.createdAt)}
                            </p>
                            <p className="text-sm">
                                <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
                            </p>
                        </div>
                    </div>

                    {/* Cancellation Section */}
                    {isAdmin && invoice.status !== 'CANCELLED' && (
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            {!showCancelConfirm ? (
                                <button
                                    className="btn btn-sm btn-outline text-error border-error hover:bg-error-50"
                                    onClick={() => setShowCancelConfirm(true)}
                                >
                                    <Trash2 size={14} /> Request Cancellation
                                </button>
                            ) : (
                                <div className="card shadow-md border-error-200 bg-error-50/20 p-md animate-fade-in">
                                    <h4 className="text-sm font-black text-error-900 mb-sm">Confirm Cancellation Request</h4>
                                    <p className="text-xs text-error-800 mb-md opacity-80">TREASURY PROTOCOL: All cancellations require a documented reason and dual-authorization from the Principal.</p>
                                    <textarea
                                        className="form-input text-xs mb-md"
                                        placeholder="Reason for cancellation (e.g., Error in billing run, Student withdrawal)..."
                                        rows={2}
                                        value={cancelReason}
                                        onChange={e => setCancelReason(e.target.value)}
                                    />
                                    <div className="flex gap-sm">
                                        <button className="btn btn-sm btn-secondary" onClick={() => setShowCancelConfirm(false)}>Abort</button>
                                        <button className="btn btn-sm btn-primary bg-error-600 border-none px-6" onClick={handleRequestCancellation} disabled={loading}>
                                            {loading ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Adjustment Form */}
                    {isEditing && (
                        <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--neutral-100)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                <h4 className="text-sm font-semibold">Add Adjustment / Fee</h4>
                                {!showAddForm && (
                                    <button className="btn btn-sm btn-outline" onClick={() => setShowAddForm(true)}>
                                        <Plus size={14} /> Add Item
                                    </button>
                                )}
                            </div>

                            {showAddForm && (
                                <form onSubmit={handleAddItem} className="animate-fade-in">
                                    <div className="grid grid-cols-2 gap-sm mb-sm">
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label className="text-xs font-medium block mb-1">Description</label>
                                            <input
                                                className="form-input text-sm"
                                                placeholder="e.g. Late Fee / Scholarship"
                                                required
                                                value={newItem.description}
                                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium block mb-1">Type</label>
                                            <select
                                                className="form-input text-sm"
                                                value={newItem.type}
                                                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                            >
                                                <option value="CHARGE">Charge (+)</option>
                                                <option value="CREDIT">Credit (-)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium block mb-1">Amount</label>
                                            <input
                                                type="number"
                                                className="form-input text-sm"
                                                placeholder="0.00"
                                                required
                                                min="0"
                                                step="0.01"
                                                value={newItem.amount}
                                                onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-sm mb-sm">
                                        <div>
                                            <label className="text-xs font-medium block mb-1">Category</label>
                                            <select
                                                className="form-input text-sm"
                                                value={newItem.category}
                                                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                            >
                                                {FEE_CATEGORIES.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end gap-sm">
                                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                                                {loading ? 'Adding...' : 'Add Item'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Itemized Breakdown */}
                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Fee Breakdown</h4>

                        {Object.keys(groupedItems).length > 0 ? (
                            Object.entries(groupedItems).map(([category, data]: [string, any]) => (
                                <div key={category} style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: 'var(--spacing-sm)',
                                        paddingBottom: 'var(--spacing-sm)',
                                        borderBottom: `2px solid ${data.color}`
                                    }}>
                                        <div className="flex items-center gap-sm">
                                            <span
                                                className="badge"
                                                style={{ backgroundColor: data.color, color: 'white' }}
                                            >
                                                {data.label}
                                            </span>
                                        </div>
                                        <span className="font-semibold">{formatCurrency(data.total)}</span>
                                    </div>

                                    {data.items.map((item: any) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm)',
                                                background: 'transparent',
                                                borderBottom: '1px solid var(--neutral-100)'
                                            }}
                                        >
                                            <div className="flex items-center gap-sm">
                                                {isEditing && (
                                                    <button
                                                        className="text-error hover:text-error-700 p-1 rounded-full hover:bg-error-50 transition-colors"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        title="Remove Item"
                                                        disabled={loading}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium">{item.description}</p>
                                                    {item.quantity > 1 && (
                                                        <p className="text-xs text-muted">
                                                            {item.quantity} × {formatCurrency(item.unitPrice)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className={`font-semibold ${parseFloat(item.amount) < 0 ? 'text-success' : ''}`}>
                                                {formatCurrency(item.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--muted)', borderRadius: 'var(--radius-md)' }}>
                                <p className="text-sm">
                                    <strong>{invoice.feeStructure?.name || 'School Fees'}:</strong> {formatCurrency(invoice.totalAmount)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Payment Summary */}
                    <div style={{
                        padding: 'var(--spacing-lg)',
                        background: 'var(--primary-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--primary-200)'
                    }}>
                        <div className="space-y-sm">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Current Invoice Amount:</span>
                                <span className="font-semibold">{formatCurrency(invoice.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Paid towards this Invoice:</span>
                                <span className="font-semibold text-success">{formatCurrency(invoice.paidAmount)}</span>
                            </div>

                            {billingSummary && (
                                <>
                                    {/* Arrears calculation: Overall - Current Invoice Balance */}
                                    {((billingSummary.overallBalance - parseFloat(invoice.balance)) !== 0) && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted">
                                                {(billingSummary.overallBalance - parseFloat(invoice.balance)) > 0
                                                    ? 'Arrears (Brought Forward):'
                                                    : 'Overpayment (Brought Forward):'}
                                            </span>
                                            <span className={`font-semibold ${(billingSummary.overallBalance - parseFloat(invoice.balance)) > 0 ? 'text-error' : 'text-success'}`}>
                                                {formatCurrency(billingSummary.overallBalance - parseFloat(invoice.balance))}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: 'var(--spacing-sm)',
                                borderTop: '2px solid var(--primary-300)',
                                fontSize: '1.25rem'
                            }}>
                                <span className="font-bold">Total Outstanding:</span>
                                <span className={`font-bold ${billingSummary?.overallBalance > 0 ? 'text-error' : 'text-success'}`}>
                                    {formatCurrency(billingSummary ? billingSummary.overallBalance : invoice.balance)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose}>
                        Close
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => window.print()}
                    >
                        <Printer size={18} />
                        Print
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => generateInvoicePDF(invoice)}
                    >
                        <Download size={18} />
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    )
}
