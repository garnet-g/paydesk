'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Printer, Plus, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface StudentStatementProps {
    studentId: string
}

export default function StudentStatement({ studentId }: StudentStatementProps) {
    const { data: session } = useSession()
    const [statement, setStatement] = useState<any[]>([])
    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showFeeModal, setShowFeeModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (studentId) fetchStatement()
    }, [studentId])

    const fetchStatement = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/students/${studentId}/statement`)
            if (res.ok) {
                const data = await res.json()
                setStatement(data.statement)
                setStudent(data.student)
            }
        } catch (error) {
            console.error('Failed to fetch statement', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddFee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            description: formData.get('description'),
            amount: formData.get('amount'),
            category: formData.get('category')
        }

        try {
            const res = await fetch(`/api/students/${studentId}/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                setShowFeeModal(false)
                fetchStatement() // Refresh data
            } else {
                const err = await res.text()
                alert(`Failed to add fee: ${err}`)
            }
        } catch (error) {
            console.error('Error adding fee:', error)
            alert('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            studentId,
            amount: formData.get('amount'),
            method: formData.get('method'),
            description: formData.get('description'),
            transactionRef: formData.get('transactionRef'),
            date: formData.get('date')
        }

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                setShowPaymentModal(false)
                fetchStatement() // Refresh data
            } else {
                const err = await res.text()
                alert(`Failed to record payment: ${err}`)
            }
        } catch (error) {
            console.error('Error recording payment:', error)
            alert('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
            <div className="spinner"></div>
        </div>
    )

    if (!statement || statement.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <p className="text-muted">No financial history found for this student.</p>
                {(session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SUPER_ADMIN') && (
                    <div className="flex justify-center gap-md mt-lg">
                        <button className="btn btn-primary btn-sm" onClick={() => setShowFeeModal(true)}>
                            <Plus size={16} /> Add First Fee
                        </button>
                    </div>
                )}
            </div>
        )
    }

    const currentBalance = statement[statement.length - 1]?.runningBalance || 0

    return (
        <div className="card animate-fade-in shadow-sm">
            <div className="flex justify-between items-start mb-lg">
                <div>
                    <h2 className="text-xl font-bold mb-xs">Financial Ledger</h2>
                    <p className="text-muted text-sm">Statement for {student.name} | Adm: {student.admissionNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase font-bold text-muted mb-xs">Net Balance</p>
                    <h3 className={`text-2xl font-bold ${currentBalance > 0 ? 'text-error' : 'text-success'}`}>
                        {formatCurrency(currentBalance)}
                    </h3>
                </div>
            </div>

            <div className="flex justify-between items-center mb-md">
                <div className="flex gap-sm">
                    {(session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SUPER_ADMIN') && (
                        <>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentModal(true)}>
                                <Plus size={16} /> Record Payment
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => setShowFeeModal(true)}>
                                <Plus size={16} /> Add Fee
                            </button>
                        </>
                    )}
                </div>
                <div className="flex gap-sm">
                    <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                        <Printer size={16} /> Print
                    </button>
                    <button className="btn btn-ghost btn-sm">
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-neutral-50 text-left text-xs uppercase text-muted font-semibold border-b">
                            <th className="p-sm">Date</th>
                            <th className="p-sm">Description</th>
                            <th className="p-sm text-right">Debit (+)</th>
                            <th className="p-sm text-right">Credit (-)</th>
                            <th className="p-sm text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {statement.map((tx, idx) => (
                            <tr key={idx} className="border-b hover:bg-neutral-50">
                                <td className="p-sm text-muted">{formatDate(tx.date)}</td>
                                <td className="p-sm">
                                    <div className="font-semibold">{tx.type === 'INVOICE' ? 'Debit' : 'Credit'}</div>
                                    <div className="text-xs text-muted truncate max-w-[250px]" title={tx.details || tx.description}>
                                        {tx.description} {tx.details && ` - ${tx.details}`}
                                    </div>
                                </td>
                                <td className="p-sm text-right font-medium">
                                    {tx.type === 'INVOICE' ? formatCurrency(Math.abs(tx.amount)) : '-'}
                                </td>
                                <td className="p-sm text-right font-medium text-success-600">
                                    {tx.type === 'PAYMENT' ? formatCurrency(Math.abs(tx.amount)) : '-'}
                                </td>
                                <td className={`p-sm text-right font-bold ${tx.runningBalance > 0 ? 'text-error-600' : 'text-success-600'}`}>
                                    {formatCurrency(tx.runningBalance)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-lg p-md bg-neutral-50 rounded text-center text-xs text-muted">
                <p>This statement reflects all financial activities for this student at {student.schoolName}.</p>
            </div>

            {/* Manual Fee Modal */}
            {showFeeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in" onClick={() => setShowFeeModal(false)}>
                    <div className="bg-white p-2xl rounded-xl shadow-2xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-xl">
                            <h3 className="text-xl font-bold">Add Manual Fee Charge</h3>
                            <button onClick={() => setShowFeeModal(false)} className="text-muted hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddFee} className="space-y-lg">
                            <div className="form-group mb-0">
                                <label className="form-label">Description</label>
                                <input name="description" required className="form-input" placeholder="e.g. Library Fine, Trip Fee" />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Amount (KES)</label>
                                <input name="amount" type="number" step="0.01" required className="form-input" placeholder="0.00" />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Category</label>
                                <select name="category" className="form-select">
                                    <option value="OTHER">Other</option>
                                    <option value="TUITION">Tuition</option>
                                    <option value="BOARDING">Boarding</option>
                                    <option value="TRANSPORT">Transport</option>
                                    <option value="TRIPS">Trips</option>
                                    <option value="UNIFORMS">Uniforms</option>
                                    <option value="BOOKS">Books</option>
                                    <option value="ACTIVITIES">Activities</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-md pt-lg">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowFeeModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Adding...' : 'Add Fee Charge'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manual Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in" onClick={() => setShowPaymentModal(false)}>
                    <div className="bg-white p-2xl rounded-xl shadow-2xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-xl">
                            <h3 className="text-xl font-bold">Record Manual Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-muted hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleRecordPayment} className="space-y-lg">
                            <div className="form-group mb-0">
                                <label className="form-label">Amount Paid (KES)</label>
                                <input name="amount" type="number" step="0.01" required className="form-input" placeholder="0.00" />
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="form-group mb-0">
                                    <label className="form-label">Method</label>
                                    <select name="method" className="form-select" required>
                                        <option value="CASH">Cash</option>
                                        <option value="BANK_TRANSFER">Bank Deposit</option>
                                        <option value="MPESA">M-Pesa (Direct)</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>
                                <div className="form-group mb-0">
                                    <label className="form-label">Date</label>
                                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Reference Number (Optional)</label>
                                <input name="transactionRef" className="form-input" placeholder="Bank ref, Cheque no, etc." />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Notes</label>
                                <textarea name="description" className="form-textarea" placeholder="Any additional details..." />
                            </div>
                            <div className="flex justify-end gap-md pt-lg">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Recording...' : 'Save Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
