'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Zap, CheckCircle, AlertCircle, RefreshCw, Smartphone as PhoneIcon, Search } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

export default function MpesaTestingPage() {
    const [pendingPayments, setPendingPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isSimulating, setIsSimulating] = useState(false)
    const [c2bForm, setC2bForm] = useState({ billRef: '', amount: '100' })
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchPending()
    }, [])

    const fetchPending = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/payments?status=PENDING')
            const data = await res.json()
            setPendingPayments(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const simulateStkCallback = async (checkoutRequestId: string, success: boolean, amount: number) => {
        setIsSimulating(true)
        setMessage(null)
        try {
            const res = await fetch('/api/admin/simulate-mpesa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'STK_CALLBACK',
                    payload: { checkoutRequestId, success, amount }
                })
            })
            const data = await res.json()
            if (data.ResultCode === 0) {
                setMessage({ type: 'success', text: `STK ${success ? 'Success' : 'Fail'} simulated! Payment reconciled.` })
                fetchPending()
            } else {
                setMessage({ type: 'error', text: 'Simulation failed: ' + (data.ResultDesc || 'Unknown error') })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Simulation error occurred.' })
        } finally {
            setIsSimulating(false)
        }
    }

    const simulateC2b = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!c2bForm.billRef || !c2bForm.amount) return

        setIsSimulating(true)
        setMessage(null)
        try {
            const res = await fetch('/api/admin/simulate-mpesa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'C2B_CONFIRMATION',
                    payload: {
                        billRef: c2bForm.billRef,
                        amount: parseFloat(c2bForm.amount)
                    }
                })
            })
            const data = await res.json()
            if (data.ResultCode === 0) {
                setMessage({ type: 'success', text: 'C2B Paybill payment simulated! Reconciled against ' + c2bForm.billRef })
                fetchPending()
            } else {
                setMessage({ type: 'error', text: 'C2B Simulation failed.' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'C2B error occurred.' })
        } finally {
            setIsSimulating(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in max-w-5xl mx-auto">
                <div className="mb-xl">
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>M-Pesa Reconciliation Simulator</h2>
                    <p className="text-muted">Test your automated payment workflows without a real Safaricom connection.</p>
                </div>

                {message && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-xl animate-slide-down`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <p>{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-xl">
                    {/* STK Push Testing */}
                    <div className="card">
                        <div className="card-header border-bottom">
                            <div className="flex items-center gap-sm">
                                <Zap className="text-warning-500" size={20} />
                                <h3 className="card-title">Pending STK Pushes</h3>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={fetchPending} disabled={loading}>
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="p-0">
                            {pendingPayments.length === 0 ? (
                                <div className="p-2xl text-center text-muted">
                                    <PhoneIcon size={48} className="mx-auto mb-md opacity-20" />
                                    <p>No pending STK pushes found.</p>
                                    <p className="text-xs mt-xs">Try initiating a payment from the Invoices page first.</p>
                                </div>
                            ) : (
                                <div className="table-wrapper m-0" style={{ border: 'none' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Reference</th>
                                                <th>Amount</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingPayments.map(p => (
                                                <tr key={p.id}>
                                                    <td className="font-mono text-xs">{p.transactionRef}</td>
                                                    <td className="font-bold">KES {parseFloat(p.amount).toLocaleString()}</td>
                                                    <td>
                                                        <div className="flex gap-xs">
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => simulateStkCallback(p.transactionRef, true, parseFloat(p.amount))}
                                                                disabled={isSimulating}
                                                            >
                                                                Success
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline text-error"
                                                                onClick={() => simulateStkCallback(p.transactionRef, false, 0)}
                                                                disabled={isSimulating}
                                                            >
                                                                Fail
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

                    {/* C2B / Paybill Testing */}
                    <div className="card">
                        <div className="card-header border-bottom">
                            <div className="flex items-center gap-sm">
                                <Smartphone className="text-primary-500" size={20} />
                                <h3 className="card-title">Simulate C2B (Paybill)</h3>
                            </div>
                        </div>
                        <div className="p-xl">
                            <p className="text-sm text-muted mb-lg">
                                Simulates a parent paying via the "Lipa na M-Pesa" menu manually using your Paybill.
                            </p>
                            <form onSubmit={simulateC2b} className="space-y-md">
                                <div className="form-group">
                                    <label className="text-xs font-bold uppercase block mb-xs">Account Number (BillRefNumber)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <input
                                            className="form-input pl-10"
                                            placeholder="Enter Invoice No or Student Adm No"
                                            value={c2bForm.billRef}
                                            onChange={e => setC2bForm({ ...c2bForm, billRef: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted mt-xs italic">System will try to match this to an invoice automatically.</p>
                                </div>
                                <div className="form-group">
                                    <label className="text-xs font-bold uppercase block mb-xs">Amount Paid (KES)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={c2bForm.amount}
                                        onChange={e => setC2bForm({ ...c2bForm, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-full" disabled={isSimulating}>
                                    {isSimulating ? 'Simulating...' : 'Simulate Paybill Payment'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
