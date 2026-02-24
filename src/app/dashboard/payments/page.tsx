'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { DollarSign, CreditCard, Smartphone, CheckCircle, ArrowRight, Search, Download, ShieldAlert, X, Loader2, TrendingUp, RefreshCw, Calendar, Plus } from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { generateReceiptPDF } from '@/lib/pdf-utils'

export default function PaymentsPage() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'ledger')
    const [invoices, setInvoices] = useState<any[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [approvalRequests, setApprovalRequests] = useState<any[]>([])
    const [commitments, setCommitments] = useState<any[]>([])
    const [schools, setSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [approvingId, setApprovingId] = useState<string | null>(null)

    // Commitment Modal
    const [showCommitModal, setShowCommitModal] = useState(false)
    const [commitForm, setCommitForm] = useState({
        amount: '',
        frequency: 'WEEKLY',
        startDate: new Date().toISOString().split('T')[0]
    })

    // Filters
    const [filters, setFilters] = useState({
        schoolId: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    })

    // Modal states
    const [showPayModal, setShowPayModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState('MPESA')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [customAmount, setCustomAmount] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)
    const [students, setStudents] = useState<any[]>([])
    const [showManualModal, setShowManualModal] = useState(false)
    const [manualForm, setManualForm] = useState({
        studentId: '',
        amount: '',
        method: 'CASH',
        transactionRef: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    })

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
    const isPrincipal = session?.user?.role === 'PRINCIPAL'
    const isFinanceManager = session?.user?.role === 'FINANCE_MANAGER'
    const isAdmin = isSuperAdmin || isPrincipal || isFinanceManager
    const isParent = session?.user?.role === 'PARENT'
    const planTier = session?.user?.planTier || 'FREE'
    const isPro = planTier === 'PRO' || planTier === 'ENTERPRISE' || isSuperAdmin

    useEffect(() => {
        if (session) {
            fetchPayments()
            if (isParent) {
                fetchInvoices()
                fetchCommitments()
            }
            if (isSuperAdmin) fetchSchools()
            if (isPrincipal || isFinanceManager) {
                fetchApprovals()
                fetchStudents()
            }
        }
    }, [session, filters])

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students')
            if (res.ok) {
                const data = await res.json()
                setStudents(data)
            }
        } catch (error) {
            console.error('Failed to fetch students:', error)
        }
    }

    const fetchCommitments = async () => {
        try {
            const res = await fetch('/api/commitments')
            if (res.ok) {
                const data = await res.json()
                setCommitments(data)
            }
        } catch (error) {
            console.error('Failed to fetch commitments:', error)
        }
    }

    const fetchApprovals = async () => {
        try {
            const res = await fetch('/api/approvals')
            if (res.ok) {
                const data = await res.json()
                setApprovalRequests(data)
            }
        } catch (error) {
            console.error('Failed to fetch approvals:', error)
        }
    }

    const fetchPayments = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams(filters as any)
            const res = await fetch(`/api/payments?${params.toString()}`)
            const data = await res.json()
            setPayments(data)
        } catch (error) {
            console.error('Failed to fetch payments:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/invoices')
            const data = await res.json()
            setInvoices(data)
        } catch (error) {
            console.error('Failed to fetch invoices:', error)
        }
    }

    const fetchSchools = async () => {
        try {
            const res = await fetch('/api/schools')
            const data = await res.json()
            setSchools(data)
        } catch (error) {
            console.error('Failed to fetch schools:', error)
        }
    }

    const handleDispute = async (paymentId: string) => {
        if (confirm('Flag this payment as disputed? This will notify the school and audit team.')) {
            try {
                const res = await fetch(`/api/payments/${paymentId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'DISPUTED',
                        notes: 'Flagged for review by Super Admin'
                    })
                })

                if (res.ok) {
                    alert('Payment has been flagged for dispute.')
                    fetchPayments()
                } else {
                    alert('Failed to update payment status.')
                }
            } catch (error) {
                console.error('Dispute error:', error)
                alert('An error occurred during the dispute action.')
            }
        }
    }

    const handlePayClick = (invoice: any) => {
        setSelectedInvoice(invoice)
        setCustomAmount(invoice.balance.toString())
        setShowPayModal(true)
        setPaymentSuccess(false)
        if (session?.user?.phoneNumber) {
            setPhoneNumber(session.user.phoneNumber)
        }
    }

    const handleInitiatePayment = async () => {
        if (!phoneNumber) {
            alert('Please enter a phone number')
            return
        }
        if (!customAmount || Number(customAmount) <= 0) {
            alert('Please enter a valid amount')
            return
        }

        setIsProcessing(true)
        try {
            const res = await fetch('/api/payments/mpesa/stk-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedInvoice.studentId,
                    invoiceId: selectedInvoice.id,
                    phoneNumber: phoneNumber,
                    amount: customAmount // Passing custom amount
                })
            })

            const data = await res.json()
            if (data.success) {
                setPaymentSuccess(true)
                setTimeout(() => {
                    setShowPayModal(false)
                    fetchPayments()
                    fetchInvoices()
                }, 5000)
            } else {
                alert(data.error || 'Payment request failed')
            }
        } catch (error) {
            console.error('Payment failed:', error)
            alert('Something went wrong. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleApprovalAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
        setApprovingId(requestId)
        try {
            const res = await fetch('/api/approvals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action })
            })

            if (res.ok) {
                fetchApprovals()
                fetchInvoices()
                fetchPayments()
            } else {
                const error = await res.text()
                alert(error)
            }
        } catch (error) {
            console.error('Approval action error:', error)
            alert('Connection failed')
        } finally {
            setApprovingId(null)
        }
    }

    const handleCommitClick = (invoice: any) => {
        setSelectedInvoice(invoice)
        setCommitForm({
            ...commitForm,
            amount: (Number(invoice.balance) / 4).toString()
        })
        setShowCommitModal(true)
    }

    const handleCreateCommitment = async () => {
        if (!commitForm.amount || Number(commitForm.amount) <= 0) {
            alert('Please enter a valid amount')
            return
        }

        try {
            const res = await fetch('/api/commitments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...commitForm,
                    studentId: selectedInvoice.studentId,
                    invoiceId: selectedInvoice.id
                })
            })

            if (res.ok) {
                alert('Payment plan saved! We\'ll track your progress.')
                setShowCommitModal(false)
                fetchCommitments()
            } else {
                alert('Failed to register commitment.')
            }
        } catch (error) {
            console.error('Commitment error:', error)
        }
    }

    const handleDismissItem = async (itemId: string, isDismissed: boolean) => {
        try {
            const res = await fetch(`/api/invoices/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDismissed })
            })

            if (res.ok) {
                const updatedInvoice = await res.json()
                setSelectedInvoice(updatedInvoice)
                fetchInvoices()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to update item')
            }
        } catch (error) {
            console.error('Dismissal error:', error)
            alert('A connection error occurred. Please try again.')
        }
    }

    const pendingApprovalCount = approvalRequests.filter(r => r.status === 'PENDING').length

    const handleRecordManualPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualForm.studentId || !manualForm.amount) {
            alert('Please select a student and enter an amount')
            return
        }

        setIsProcessing(true)
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manualForm)
            })

            if (res.ok) {
                alert('Payment recorded successfully!')
                setShowManualModal(false)
                setManualForm({
                    studentId: '',
                    amount: '',
                    method: 'CASH',
                    transactionRef: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0]
                })
                fetchPayments()
            } else {
                const err = await res.text()
                alert(`Error: ${err}`)
            }
        } catch (error) {
            console.error('Manual payment error:', error)
            alert('Failed to record payment')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Payments</h2>
                        <p className="text-muted">
                            {isSuperAdmin ? 'Global payment monitoring and financial logs' : isParent ? 'Manage your school fees and payment history' : 'Track and manage payment records'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                        {isAdmin && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowManualModal(true)}
                                style={{ width: '100%', smWidth: 'auto' } as any}
                            >
                                <Plus size={18} />
                                Record Manual Payment
                            </button>
                        )}
                        {(isAdmin) && (
                            <div style={{ display: 'flex', background: 'var(--neutral-100)', padding: '4px', borderRadius: 'var(--radius-lg)', gap: '2px', width: '100%', smWidth: 'auto' } as any}>
                                <button
                                    onClick={() => setActiveTab('ledger')}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: activeTab === 'ledger' ? 'white' : 'transparent',
                                        color: activeTab === 'ledger' ? 'var(--primary-700)' : 'var(--muted-foreground)',
                                        boxShadow: activeTab === 'ledger' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                                    }}
                                >
                                    Transactions
                                </button>
                                <button
                                    onClick={() => setActiveTab('approvals')}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: activeTab === 'approvals' ? 'white' : 'transparent',
                                        color: activeTab === 'approvals' ? 'var(--warning-700)' : 'var(--muted-foreground)',
                                        boxShadow: activeTab === 'approvals' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    Approvals
                                    {pendingApprovalCount > 0 && (
                                        <span style={{
                                            width: '18px', height: '18px', borderRadius: '50%',
                                            background: 'var(--warning-500)', color: 'white',
                                            fontSize: '0.6875rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>{pendingApprovalCount}</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                    <div className="flex sm:flex-col lg:flex-row gap-md items-center sm:items-stretch">
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>

                        <div className="flex gap-md sm:flex-col md:flex-row">
                            {isSuperAdmin && (
                                <select
                                    className="form-select"
                                    style={{ minWidth: '160px' }}
                                    value={filters.schoolId}
                                    onChange={(e) => setFilters({ ...filters, schoolId: e.target.value })}
                                >
                                    <option value="">All Schools</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            )}

                            <select
                                className="form-select"
                                style={{ minWidth: '140px' }}
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">All Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="DISPUTED">Disputed</option>
                            </select>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={fetchPayments}
                                    title="Refresh"
                                    style={{ padding: '8px', flex: 1 }}
                                >
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                </button>
                                {isAdmin && (
                                    <button className="btn btn-secondary btn-sm" onClick={() => window.open('/api/payments/export', '_blank')} style={{ flex: 3 }}>
                                        <Download size={14} />
                                        Export CSV
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {activeTab === 'approvals' ? (
                    /* =================== APPROVALS TAB =================== */
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Pending Approvals</h3>
                                <p className="card-description">Cancellations and adjustments that need your review</p>
                            </div>
                        </div>

                        <div>
                            {approvalRequests.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--muted-foreground)' }}>
                                    <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)' }} />
                                    <p>No pending approval requests.</p>
                                </div>
                            ) : approvalRequests.map(req => {
                                const payload = JSON.parse(req.payload)
                                return (
                                    <div key={req.id} style={{
                                        padding: 'var(--spacing-lg)',
                                        borderBottom: '1px solid var(--border)',
                                        transition: 'background 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: 'var(--radius-lg)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: req.status === 'PENDING' ? 'var(--warning-100)' :
                                                        req.status === 'APPROVED' ? 'var(--success-100)' : 'var(--error-100)',
                                                    color: req.status === 'PENDING' ? 'var(--warning-700)' :
                                                        req.status === 'APPROVED' ? 'var(--success-700)' : 'var(--error-700)'
                                                }}>
                                                    {req.type === 'INVOICE_CANCELLATION' ? <X size={20} /> : <TrendingUp size={20} />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{req.type.replace(/_/g, ' ')}</div>
                                                    <div className="text-xs text-muted">
                                                        Requested by {req.requestedBy.firstName} ({req.requestedBy.role}) • {formatDateTime(req.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`badge ${req.status === 'PENDING' ? 'badge-warning' :
                                                req.status === 'APPROVED' ? 'badge-success' : 'badge-error'}`}>
                                                {req.status}
                                            </span>
                                        </div>

                                        <div style={{
                                            background: 'var(--neutral-50)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--spacing-md)',
                                            marginBottom: 'var(--spacing-md)',
                                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'
                                        }}>
                                            <div>
                                                <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>Resource</div>
                                                <div className="text-sm font-semibold">Invoice: {payload.invoiceNumber || 'Manual Adjustment'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>Reason</div>
                                                <div className="text-sm" style={{ fontStyle: 'italic' }}>"{req.reason || 'No reason provided'}"</div>
                                            </div>
                                        </div>

                                        {req.status === 'PENDING' && isPrincipal && req.requestedById !== session?.user?.id && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                                                <button
                                                    onClick={() => handleApprovalAction(req.id, 'REJECTED')}
                                                    disabled={approvingId === req.id}
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: 'var(--error-600)' }}
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApprovalAction(req.id, 'APPROVED')}
                                                    disabled={approvingId === req.id}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    {approvingId === req.id ? 'Processing...' : 'Authorize'}
                                                </button>
                                            </div>
                                        )}

                                        {req.requestedById === session?.user?.id && req.status === 'PENDING' && (
                                            <div className="text-xs" style={{ color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '6px 12px', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                                                Waiting for another administrator to authorize...
                                            </div>
                                        )}

                                        {req.status !== 'PENDING' && (
                                            <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {req.status === 'APPROVED' ? <CheckCircle size={14} style={{ color: 'var(--success-600)' }} /> : <X size={14} style={{ color: 'var(--error-600)' }} />}
                                                Processed by {req.approvedBy?.firstName || 'System'}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    /* =================== LEDGER TAB =================== */
                    <div style={isParent ? { display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-xl)' } : {}}>
                        <div className="payments-layout" style={isParent ? { display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 'var(--spacing-xl)', alignItems: 'start' } : {}}>

                            {/* Outstanding Invoices — Parent View */}
                            {isParent && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                    {/* Active Invoices Card */}
                                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                        <div style={{
                                            padding: 'var(--spacing-lg) var(--spacing-xl)',
                                            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                                            color: 'white'
                                        }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>Outstanding Invoices</h3>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pending fee balances</p>
                                        </div>
                                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                            {loading && invoices.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                                                </div>
                                            ) : invoices.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                                    <div style={{
                                                        width: '56px', height: '56px',
                                                        background: 'var(--success-50)', color: 'var(--success-600)',
                                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        margin: '0 auto var(--spacing-md)'
                                                    }}>
                                                        <CheckCircle size={28} />
                                                    </div>
                                                    <p className="text-muted font-medium text-sm">All accounts are clear.</p>
                                                </div>
                                            ) : (
                                                invoices.map(invoice => (
                                                    <div key={invoice.id} style={{
                                                        padding: 'var(--spacing-md) var(--spacing-lg)',
                                                        borderBottom: '1px solid var(--border)',
                                                        transition: 'background 0.2s',
                                                        cursor: 'pointer'
                                                    }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-50)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                                                            <div>
                                                                <div className="font-semibold text-sm">{invoice.student?.firstName} {invoice.student?.lastName}</div>
                                                                <div className="text-xs text-muted">{invoice.invoiceNumber}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--error-600)' }}>{formatCurrency(invoice.balance)}</div>
                                                                <div className="text-xs text-muted">Balance</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                                                            {isPro ? (
                                                                <>
                                                                    <button
                                                                        className="btn btn-ghost btn-sm"
                                                                        style={{ fontSize: '0.6875rem' }}
                                                                        onClick={() => handleCommitClick(invoice)}
                                                                    >
                                                                        Payment Plan
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-primary btn-sm"
                                                                        style={{ fontSize: '0.6875rem' }}
                                                                        onClick={() => handlePayClick(invoice)}
                                                                    >
                                                                        Pay Now <ArrowRight size={12} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
                                                                    <ShieldAlert size={14} className="text-warning-500" />
                                                                    <span className="text-xs font-medium text-muted">Please pay at finance office</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Payment Plans */}
                                    {commitments.length > 0 && (
                                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div className="card-header" style={{ background: 'var(--neutral-800)', color: 'white', borderBottom: 'none' }}>
                                                <div>
                                                    <h3 className="card-title" style={{ color: 'white' }}>Active Payment Plans</h3>
                                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Installment tracking</p>
                                                </div>
                                            </div>
                                            <div>
                                                {commitments.map(commit => (
                                                    <div key={commit.id} style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                                                            <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>{commit.frequency}</span>
                                                            <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>Active</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                            <div>
                                                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{formatCurrency(commit.amount)}</div>
                                                                <div className="text-xs text-muted">Next: {formatDate(commit.startDate)}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>Invoice: {commit.invoice?.invoiceNumber}</div>
                                                                <div style={{ width: '80px', height: '6px', background: 'var(--neutral-100)', borderRadius: '3px', overflow: 'hidden' }}>
                                                                    <div style={{ height: '100%', width: '45%', background: 'var(--primary-600)', borderRadius: '3px' }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Transaction Table */}
                            <div style={{ minWidth: 0 }}>
                                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div className="card-header">
                                        <div>
                                            <h3 className="card-title">Transaction History</h3>
                                            <p className="card-description">Verified payment records</p>
                                        </div>
                                    </div>
                                    <div className="responsive-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    {isSuperAdmin && <th>School</th>}
                                                    <th>Student</th>
                                                    <th>Amount</th>
                                                    <th className="hide-mobile">Method</th>
                                                    <th>Status</th>
                                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading && payments.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                                                        </td>
                                                    </tr>
                                                ) : payments.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                                            <DollarSign size={48} style={{ opacity: 0.15, marginBottom: 'var(--spacing-md)' }} />
                                                            <p className="text-muted">No transactions found.</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    payments.map(payment => (
                                                        <tr key={payment.id}>
                                                            <td>
                                                                <div className="text-sm">{formatDateTime(payment.createdAt).split(' ')[0]}</div>
                                                                <div className="text-xs text-muted">{formatDateTime(payment.createdAt).split(' ').slice(1).join(' ')}</div>
                                                            </td>
                                                            {isSuperAdmin && (
                                                                <td className="text-sm font-semibold">{payment.school?.name}</td>
                                                            )}
                                                            <td>
                                                                <div className="font-semibold text-sm">{payment.student?.firstName} {payment.student?.lastName}</div>
                                                                <div className="text-xs text-muted">Adm: {payment.student?.admissionNumber}</div>
                                                            </td>
                                                            <td>
                                                                <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                                                            </td>
                                                            <td className="hide-mobile">
                                                                <span className="badge badge-neutral">{payment.method}</span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${payment.status === 'COMPLETED' ? 'badge-success' :
                                                                    payment.status === 'FAILED' ? 'badge-error' :
                                                                        payment.status === 'DISPUTED' ? 'badge-error' : 'badge-warning'
                                                                    }`}>
                                                                    {payment.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                                                    <button
                                                                        className="btn btn-ghost btn-sm"
                                                                        title="Download Receipt"
                                                                        onClick={() => generateReceiptPDF(payment, 'download')}
                                                                        disabled={payment.status !== 'COMPLETED'}
                                                                        style={{ padding: '6px' }}
                                                                    >
                                                                        <Download size={14} />
                                                                    </button>
                                                                    {isSuperAdmin && (
                                                                        <button
                                                                            className="btn btn-ghost btn-sm"
                                                                            title="Flag for Dispute"
                                                                            onClick={() => handleDispute(payment.id)}
                                                                            style={{ padding: '6px', color: 'var(--error-600)' }}
                                                                        >
                                                                            <ShieldAlert size={14} />
                                                                        </button>
                                                                    )}
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
                        </div>
                    </div>
                )}

                {/* =================== COMMITMENT MODAL =================== */}
                {showCommitModal && (
                    <div className="modal-overlay" onClick={() => setShowCommitModal(false)}>
                        <div className="modal-content" style={{ maxWidth: '460px', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header" style={{ background: 'var(--neutral-800)', color: 'white', borderBottom: 'none' }}>
                                <div>
                                    <h3 className="modal-title" style={{ color: 'white' }}>Setup Payment Plan</h3>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Installment schedule</p>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowCommitModal(false)} style={{ color: 'rgba(255,255,255,0.6)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--neutral-50)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-lg)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>Invoice Balance</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-700)' }}>{formatCurrency(selectedInvoice?.balance)}</div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Installment Amount</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={commitForm.amount}
                                        onChange={(e) => setCommitForm({ ...commitForm, amount: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Frequency</label>
                                    <select
                                        className="form-select"
                                        value={commitForm.frequency}
                                        onChange={(e) => setCommitForm({ ...commitForm, frequency: e.target.value })}
                                    >
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={commitForm.startDate}
                                        onChange={(e) => setCommitForm({ ...commitForm, startDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowCommitModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleCreateCommitment}>
                                    Activate Plan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* =================== PAYMENT MODAL =================== */}
                {showPayModal && (
                    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPayModal(false)}>
                        <div className="modal-content" style={{ maxWidth: '480px', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                            {!paymentSuccess ? (
                                <>
                                    {/* Header with Amount */}
                                    <div style={{
                                        padding: 'var(--spacing-xl)',
                                        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                                        color: 'white',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: '-30px', right: '-30px',
                                            width: '100px', height: '100px',
                                            background: 'rgba(255,255,255,0.08)',
                                            borderRadius: '50%'
                                        }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2px' }}>Payment Checkout</h3>
                                                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Secure M-Pesa payment</p>
                                            </div>
                                            <button onClick={() => setShowPayModal(false)} style={{
                                                background: 'rgba(255,255,255,0.15)',
                                                border: 'none', borderRadius: '50%',
                                                width: '32px', height: '32px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', cursor: 'pointer'
                                            }}>
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div style={{
                                            marginTop: 'var(--spacing-lg)',
                                            background: 'rgba(255,255,255,0.1)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            padding: 'var(--spacing-lg)',
                                            borderRadius: 'var(--radius-lg)',
                                            position: 'relative'
                                        }}>
                                            <div style={{ fontSize: '0.6875rem', opacity: 0.7, marginBottom: '4px' }}>Amount Payable</div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>KES</span>
                                                <input
                                                    type="number"
                                                    value={customAmount}
                                                    onChange={(e) => setCustomAmount(e.target.value)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderBottom: '2px solid rgba(255,255,255,0.5)',
                                                        color: 'white',
                                                        fontSize: '2rem',
                                                        fontWeight: 800,
                                                        width: '100%',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <button onClick={() => setCustomAmount(selectedInvoice?.balance?.toString())} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Pay Total ({formatCurrency(selectedInvoice?.balance)})</button>
                                                <button onClick={() => setCustomAmount((selectedInvoice?.balance / 2)?.toString())} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Pay Half</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Form */}
                                    <div style={{ padding: 'var(--spacing-xl)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                                            <div style={{
                                                width: '40px', height: '40px',
                                                background: 'var(--success-100)', color: 'var(--success-700)',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Smartphone size={20} />
                                            </div>
                                            <div>
                                                <div className="font-semibold">M-Pesa STK Push</div>
                                                <div className="text-xs text-muted">You'll receive a prompt on your phone</div>
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                            <label className="form-label">M-Pesa Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                placeholder="e.g. 254712345678"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '0.05em' }}
                                            />
                                            <p className="form-hint" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <ShieldAlert size={12} />
                                                Funds will be debited upon PIN confirmation.
                                            </p>
                                        </div>

                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', padding: 'var(--spacing-md)', fontSize: '0.9375rem', fontWeight: 700 }}
                                            onClick={handleInitiatePayment}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <><Loader2 className="animate-spin" size={18} /> Processing...</>
                                            ) : (
                                                'Complete Payment'
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                                    <div style={{
                                        width: '80px', height: '80px',
                                        background: 'var(--success-50)', color: 'var(--success-600)',
                                        borderRadius: 'var(--radius-full)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto var(--spacing-xl)'
                                    }}>
                                        <CheckCircle size={48} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>Payment Initiated!</h3>
                                    <p className="text-muted" style={{ maxWidth: '320px', margin: '0 auto var(--spacing-xl)' }}>
                                        We've sent a prompt to your phone. Please enter your M-Pesa PIN to finalize.
                                    </p>
                                    <div style={{
                                        background: 'var(--neutral-50)',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.75rem',
                                        color: 'var(--muted-foreground)'
                                    }}>
                                        Awaiting confirmation...
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* =================== MANUAL PAYMENT MODAL =================== */}
                {showManualModal && (
                    <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
                        <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Record Manual Payment</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowManualModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleRecordManualPayment}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Select Student</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={manualForm.studentId}
                                            onChange={(e) => setManualForm({ ...manualForm, studentId: e.target.value })}
                                        >
                                            <option value="">Choose a student...</option>
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.firstName} {s.lastName} (Adm: {s.admissionNumber})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-md">
                                        <div className="form-group">
                                            <label className="form-label">Amount (KES)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                required
                                                min="1"
                                                value={manualForm.amount}
                                                onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Date</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                required
                                                value={manualForm.date}
                                                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Payment Method</label>
                                        <select
                                            className="form-select"
                                            value={manualForm.method}
                                            onChange={(e) => setManualForm({ ...manualForm, method: e.target.value })}
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="BANK_TRANSFER">Bank Deposit</option>
                                            <option value="MPESA">M-Pesa (Direct)</option>
                                            <option value="CHEQUE">Cheque</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Transaction Reference (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Bank Ref, Cheque No, etc."
                                            value={manualForm.transactionRef}
                                            onChange={(e) => setManualForm({ ...manualForm, transactionRef: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Notes/Description</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Details about the payment..."
                                            value={manualForm.description}
                                            onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowManualModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                                        {isProcessing ? 'Recording...' : 'Save Payment Record'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .payments-layout {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </DashboardLayout>
    )
}
