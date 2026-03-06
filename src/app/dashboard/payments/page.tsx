'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
    DollarSign,
    CreditCard,
    Smartphone,
    CheckCircle,
    ArrowRight,
    Search,
    Download,
    ShieldAlert,
    X,
    Loader2,
    TrendingUp,
    RefreshCw,
    Calendar,
    Plus,
    Landmark,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Receipt,
    Wallet,
    History,
    ShieldCheck,
    Clock,
    User,
    ChevronRight,
    MoreVertical,
    FileText,
    AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils'
import { generateReceiptPDF } from '@/lib/pdf-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

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
    const [studentSearchTerm, setStudentSearchTerm] = useState('')
    const [showStudentSearch, setShowStudentSearch] = useState(false)

    // Bank Transfer modal
    const [showBankModal, setShowBankModal] = useState(false)
    const [bankForm, setBankForm] = useState({
        invoiceNumber: '',
        amount: '',
        bankReference: '',
        notes: '',
        paidAt: new Date().toISOString().split('T')[0]
    })
    const [bankSubmitting, setBankSubmitting] = useState(false)
    const [bankError, setBankError] = useState('')
    const [bankSuccess, setBankSuccess] = useState('')

    const handleRecordBankTransfer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bankForm.invoiceNumber || !bankForm.amount || !bankForm.bankReference) {
            setBankError('Invoice number, amount and bank reference are required')
            return
        }
        setBankSubmitting(true)
        setBankError('')
        setBankSuccess('')
        try {
            // Resolve invoice id from number
            const invRes = await fetch(`/api/invoices?search=${bankForm.invoiceNumber}`)
            const invData = await invRes.json()
            const invoice = invData.find((i: any) => i.invoiceNumber === bankForm.invoiceNumber)
            if (!invoice) { setBankError('Invoice not found. Check the invoice number.'); setBankSubmitting(false); return }

            const res = await fetch('/api/payments/bank-transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    amount: parseFloat(bankForm.amount),
                    bankReference: bankForm.bankReference,
                    notes: bankForm.notes,
                    paidAt: bankForm.paidAt
                })
            })
            const data = await res.json()
            if (res.ok) {
                setBankSuccess(`Payment recorded. Invoice is now ${data.invoiceStatus}.`)
                fetchPayments()
                setBankForm({ invoiceNumber: '', amount: '', bankReference: '', notes: '', paidAt: new Date().toISOString().split('T')[0] })
                setTimeout(() => { setShowBankModal(false); setBankSuccess('') }, 2000)
            } else {
                setBankError(data.error || 'Failed to record payment')
            }
        } catch { setBankError('Something went wrong. Please try again.') }
        finally { setBankSubmitting(false) }
    }

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
            <div className="space-y-10 animate-fade-in pb-12">
                {/* Page Header */}
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <DollarSign size={20} className="text-emerald-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                {isSuperAdmin ? 'Global Financial Oversight' : 'Institutional Ledger'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl uppercase italic">
                            Payments
                        </h1>
                        <p className="max-w-xl text-sm font-medium text-muted-foreground">
                            {isSuperAdmin ? 'Comprehensive school-wide financial auditing and oversight.' : isParent ? 'Your student enrollment fees and transaction history.' : 'Manage student payment registries and authorisations.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {isAdmin && (
                            <>
                                <button
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#030213] px-6 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-gray-200/50 transition-all hover:bg-black active:scale-[0.98]"
                                    onClick={() => setShowManualModal(true)}
                                >
                                    <Plus size={18} />
                                    Manual Entry
                                </button>
                                <button
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-6 text-xs font-bold uppercase tracking-widest text-foreground shadow-sm hover:bg-accent transition-all active:scale-[0.98]"
                                    onClick={() => setShowBankModal(true)}
                                >
                                    <Landmark size={18} className="text-blue-600" />
                                    Bank Transfer
                                </button>
                            </>
                        )}

                        {isAdmin && (
                            <div className="flex rounded-2xl border border-border bg-muted/30 p-1.5 shadow-inner">
                                <button
                                    onClick={() => setActiveTab('ledger')}
                                    className={cn(
                                        "rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTab === 'ledger'
                                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-border"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Ledger
                                </button>
                                <button
                                    onClick={() => setActiveTab('approvals')}
                                    className={cn(
                                        "relative flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTab === 'approvals'
                                            ? "bg-white text-amber-600 shadow-sm ring-1 ring-border"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Authorisations
                                    {pendingApprovalCount > 0 && (
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white">
                                            {pendingApprovalCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                        <div className="relative group flex-1">
                            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-colors group-focus-within:text-blue-600" />
                            <input
                                type="text"
                                placeholder="Search by student, reference number or amount..."
                                className="w-full h-16 rounded-[1.5rem] border border-border bg-muted/5 pl-14 pr-6 text-base font-medium transition-all focus:border-blue-600/50 focus:outline-none focus:ring-4 focus:ring-blue-600/5"
                            // Reusing any filter if existing, but the original logic didn't have search text bound to state besides studentSearchTerm
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {isSuperAdmin && (
                                <Select value={filters.schoolId} onValueChange={v => setFilters({ ...filters, schoolId: v })}>
                                    <SelectTrigger className="h-16 w-full lg:w-[220px] rounded-2xl border-border bg-muted/5 font-bold text-[11px] uppercase tracking-widest text-muted-foreground">
                                        <SelectValue placeholder="All Institutions" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border">
                                        <SelectItem value="ALL" className="font-bold text-xs uppercase italic">All Schools</SelectItem>
                                        {schools.map(s => <SelectItem key={s.id} value={s.id} className="font-bold text-xs uppercase italic">{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}

                            <Select value={filters.status} onValueChange={v => setFilters({ ...filters, status: v })}>
                                <SelectTrigger className="h-16 w-full lg:w-[180px] rounded-2xl border-border bg-muted/5 font-bold text-[11px] uppercase tracking-widest text-muted-foreground">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border">
                                    <SelectItem value="ALL" className="font-bold text-xs uppercase italic">EVERYTHING</SelectItem>
                                    <SelectItem value="COMPLETED" className="font-bold text-xs text-green-600 italic">COMPLETED</SelectItem>
                                    <SelectItem value="PENDING" className="font-bold text-xs text-amber-600 italic">PENDING</SelectItem>
                                    <SelectItem value="FAILED" className="font-bold text-xs text-red-600 italic">FAILED</SelectItem>
                                    <SelectItem value="DISPUTED" className="font-bold text-xs text-purple-600 italic">DISPUTED</SelectItem>
                                </SelectContent>
                            </Select>

                            <button
                                onClick={fetchPayments}
                                className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-border bg-muted/5 text-muted-foreground transition-all hover:bg-accent"
                            >
                                <RefreshCw size={20} className={cn(loading && "animate-spin")} />
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => window.open('/api/payments/export', '_blank')}
                                    className="flex h-16 items-center justify-center gap-2 rounded-[1.5rem] border border-border bg-muted/5 px-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-accent"
                                >
                                    <Download size={18} />
                                    CSV Export
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {activeTab === 'approvals' ? (
                    /* =================== APPROVALS TAB =================== */
                    <div className="overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/30 p-8">
                            <div className="space-y-1">
                                <h3 className="text-xl font-extrabold tracking-tight text-foreground uppercase">Pending Authorisations</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Financial adjustments awaiting higher-level review</p>
                            </div>
                        </div>

                        <div className="divide-y divide-border/50">
                            {approvalRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <CheckCircle size={48} className="text-muted-foreground/10 mb-6" />
                                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Queue Synchronized</p>
                                </div>
                            ) : approvalRequests.map(req => {
                                const payload = JSON.parse(req.payload)
                                return (
                                    <div key={req.id} className="p-8 transition-colors hover:bg-muted/5">
                                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "flex h-16 w-16 items-center justify-center rounded-[1.5rem] shadow-sm",
                                                    req.status === 'PENDING' ? "bg-amber-50 text-amber-600" :
                                                        req.status === 'APPROVED' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                )}>
                                                    {req.type === 'INVOICE_CANCELLATION' ? <X size={24} /> : <TrendingUp size={24} />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-black tracking-tight text-foreground uppercase">
                                                            {req.type.replace(/_/g, ' ')}
                                                        </h4>
                                                        <span className={cn(
                                                            "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                                                            req.status === 'PENDING' ? "bg-amber-50 text-amber-600" :
                                                                req.status === 'APPROVED' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                        )}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-muted-foreground/60">
                                                        Requested by <span className="text-foreground">{req.requestedBy.firstName}</span> ({req.requestedBy.role}) • {formatDateTime(req.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 rounded-2xl bg-muted/10 p-4 md:w-80">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                                    <span>Resource</span>
                                                    <span>Balance</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold text-foreground">
                                                    <span>{payload.invoiceNumber || 'ID: ' + (payload.invoiceId?.slice(0, 8) || 'N/A')}</span>
                                                    <span className="text-blue-600">{formatCurrency(payload.amount || 0)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-500/50" />
                                                <p className="italic font-medium">"{req.reason || 'Standard operational adjustment'}"</p>
                                            </div>

                                            {req.status === 'PENDING' && (isPrincipal || isFinanceManager) && req.requestedById !== session?.user?.id && (
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleApprovalAction(req.id, 'REJECTED')}
                                                        disabled={approvingId === req.id}
                                                        className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprovalAction(req.id, 'APPROVED')}
                                                        disabled={approvingId === req.id}
                                                        className="h-11 rounded-xl bg-[#030213] px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black disabled:opacity-50 active:scale-[0.98]"
                                                    >
                                                        {approvingId === req.id ? 'Authorising...' : 'Authorise Adjustment'}
                                                    </button>
                                                </div>
                                            )}

                                            {req.requestedById === session?.user?.id && req.status === 'PENDING' && (
                                                <div className="rounded-xl bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 ring-1 ring-blue-600/10">
                                                    Waiting for counter-authorization...
                                                </div>
                                            )}

                                            {req.status !== 'PENDING' && (
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                                    Processed by {req.approvedBy?.firstName || 'Institutional Audit'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    /* =================== LEDGER TAB =================== */
                    <div className={cn("grid gap-10", isParent ? "lg:grid-cols-12 items-start" : "grid-cols-1")}>
                        {/* Outstanding Invoices — Parent View */}
                        {isParent && (
                            <div className="space-y-8 lg:col-span-5">
                                {/* Active Invoices Card */}
                                <div className="overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
                                    <div className="bg-[#030213] p-8 text-white">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-extrabold tracking-tight uppercase">Pending Balances</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Active Student Accounts</p>
                                            </div>
                                            <Receipt size={32} className="text-white/20" />
                                        </div>
                                    </div>

                                    <div className="divide-y divide-border">
                                        {loading && invoices.length === 0 ? (
                                            <div className="flex justify-center p-12">
                                                <Loader2 className="h-10 w-10 animate-spin text-blue-600/40" />
                                            </div>
                                        ) : invoices.length === 0 ? (
                                            <div className="py-20 text-center">
                                                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
                                                    <CheckCircle size={32} />
                                                </div>
                                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">All Accounts Reconciled</p>
                                            </div>
                                        ) : (
                                            invoices.map(invoice => (
                                                <div key={invoice.id} className="group p-6 transition-colors hover:bg-muted/5">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="space-y-1">
                                                            <div className="text-lg font-black text-foreground capitalize">{invoice.student?.firstName} {invoice.student?.lastName}</div>
                                                            <div className="text-xs font-bold font-mono text-muted-foreground/60">{invoice.invoiceNumber}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-black text-red-600">{formatCurrency(invoice.balance)}</div>
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total Arrears</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {isPro && (
                                                            <button
                                                                className="flex-1 h-11 rounded-xl border border-border bg-white text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-accent"
                                                                onClick={() => handleCommitClick(invoice)}
                                                            >
                                                                Commitment Plan
                                                            </button>
                                                        )}
                                                        <button
                                                            className="flex-[2] h-11 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]"
                                                            onClick={() => handlePayClick(invoice)}
                                                        >
                                                            Instant Settlement
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Active Payment Plans */}
                                {commitments.length > 0 && (
                                    <div className="overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
                                        <div className="p-8 border-b border-border bg-muted/20">
                                            <h3 className="text-xl font-extrabold tracking-tight text-foreground uppercase">Commitment Tracking</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Active voluntary payment schedules</p>
                                        </div>
                                        <div className="divide-y divide-border">
                                            {commitments.map(commit => (
                                                <div key={commit.id} className="p-6">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-600 ring-1 ring-blue-600/10">
                                                            {commit.frequency}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                            Active Cycle
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div className="space-y-1">
                                                            <div className="text-2xl font-black text-foreground">{formatCurrency(commit.amount)}</div>
                                                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Due {formatDate(commit.startDate)}</div>
                                                        </div>
                                                        <div className="text-right space-y-2">
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Schedule Progression</div>
                                                            <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                                                                <div className="h-full w-[45%] bg-blue-600 rounded-full" />
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

                        {/* Transaction List / Ledger */}
                        <div className={cn("overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm", isParent ? "lg:col-span-7" : "col-span-1")}>
                            <div className="flex flex-col gap-4 border-b border-border bg-muted/20 p-8 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-extrabold tracking-tight text-foreground uppercase">Verified Transactions</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Authentic record of institutional liquidity</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-muted/5">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Date</th>
                                            {isSuperAdmin && <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Institution</th>}
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Student Registry</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Liquidity</th>
                                            <th className="hidden px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 md:table-cell">Channel</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Standing</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Audit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {loading && payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-8 py-20 text-center">
                                                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600/40" />
                                                </td>
                                            </tr>
                                        ) : payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-8 py-24 text-center">
                                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-border bg-muted/10 text-muted-foreground/30">
                                                        <History size={32} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Null Revenue History</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            payments.map(payment => (
                                                <tr key={payment.id} className="group transition-colors hover:bg-muted/5">
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-foreground">
                                                                {formatDateTime(payment.createdAt).split(' ')[0]}
                                                            </span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                                                {formatDateTime(payment.createdAt).split(' ').slice(1).join(' ')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {isSuperAdmin && (
                                                        <td className="px-8 py-6">
                                                            <span className="text-xs font-black uppercase tracking-widest text-foreground">
                                                                {payment.school?.name}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-extrabold text-foreground group-hover:text-blue-600 transition-colors">
                                                                {payment.student?.firstName} {payment.student?.lastName}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                                                                <User size={10} />
                                                                {payment.student?.admissionNumber}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-sm font-black text-foreground">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="hidden px-8 py-6 md:table-cell">
                                                        <span className="rounded-lg bg-muted/40 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground ring-1 ring-border">
                                                            {payment.method}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "h-1.5 w-1.5 rounded-full",
                                                                payment.status === 'COMPLETED' ? "bg-emerald-500" :
                                                                    payment.status === 'FAILED' ? "bg-red-500" :
                                                                        payment.status === 'DISPUTED' ? "bg-purple-500" : "bg-amber-500"
                                                            )} />
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest",
                                                                payment.status === 'COMPLETED' ? "text-emerald-600" :
                                                                    payment.status === 'FAILED' ? "text-red-600" :
                                                                        payment.status === 'DISPUTED' ? "text-purple-600" : "text-amber-600"
                                                            )}>
                                                                {payment.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/10 text-muted-foreground transition-all hover:bg-blue-600 hover:text-white disabled:opacity-30"
                                                                title="Download Verifiable Receipt"
                                                                onClick={() => generateReceiptPDF(payment, 'download')}
                                                                disabled={payment.status !== 'COMPLETED'}
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                            {isSuperAdmin && (
                                                                <button
                                                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all hover:bg-red-600 hover:text-white"
                                                                    title="Initialize Audit Dispute"
                                                                    onClick={() => handleDispute(payment.id)}
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
                )}
            </div>

            {/* =================== COMMITMENT MODAL =================== */}
            <Dialog open={showCommitModal} onOpenChange={setShowCommitModal}>
                <DialogContent className="max-w-[460px] rounded-[2.5rem] border-border bg-card p-0 overflow-hidden shadow-2xl">
                    <div className="bg-[#030213] p-8 text-white">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h3 className="text-xl font-extrabold tracking-tight uppercase">Setup Payment Plan</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Structured Installment schedule</p>
                            </div>
                            <Calendar size={32} className="text-white/20" />
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="rounded-2xl border border-border bg-muted/5 p-6 space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Outstanding Balance</div>
                            <div className="text-3xl font-black text-blue-600">{formatCurrency(selectedInvoice?.balance || 0)}</div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Installment Amount (KES)</Label>
                                <Input
                                    type="number"
                                    className="h-14 rounded-xl border-border bg-muted/5 font-bold transition-all focus:ring-4 focus:ring-blue-600/5"
                                    value={commitForm.amount}
                                    onChange={(e) => setCommitForm({ ...commitForm, amount: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Schedule Frequency</Label>
                                <Select value={commitForm.frequency} onValueChange={v => setCommitForm({ ...commitForm, frequency: v })}>
                                    <SelectTrigger className="h-14 rounded-xl border-border bg-muted/5 font-bold text-xs uppercase tracking-widest italic">
                                        <SelectValue placeholder="Select Frequency" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border">
                                        <SelectItem value="WEEKLY" className="font-bold text-xs uppercase italic">WEEKLY CYCLE</SelectItem>
                                        <SelectItem value="MONTHLY" className="font-bold text-xs uppercase italic">MONTHLY CYCLE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Commencement Date</Label>
                                <Input
                                    type="date"
                                    className="h-14 rounded-xl border-border bg-muted/5 font-bold transition-all focus:ring-4 focus:ring-blue-600/5"
                                    value={commitForm.startDate}
                                    onChange={(e) => setCommitForm({ ...commitForm, startDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 border-t border-border bg-muted/10">
                        <button
                            className="w-full h-14 rounded-2xl bg-[#030213] text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-gray-200/50 transition-all hover:bg-black active:scale-[0.98]"
                            onClick={handleCreateCommitment}
                        >
                            Authorize Commitment Plan
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =================== PAYMENT MODAL =================== */}
            <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
                <DialogContent className="max-w-[480px] rounded-[2.5rem] border-border bg-card p-0 overflow-hidden shadow-2xl">
                    {!paymentSuccess ? (
                        <>
                            <div className="bg-[#030213] p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <div className="space-y-2 relative z-10">
                                    <h3 className="text-2xl font-black tracking-tight uppercase italic">Secure Checkout</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 italic">Verified M-Pesa Liquidity Service</p>
                                </div>
                                <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-6 relative z-10 backdrop-blur-md">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 italic">Settlement amount (KES)</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-white/40 italic">KES</span>
                                        <input
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            className="w-full bg-transparent border-none text-4xl font-black text-white p-0 focus:outline-none focus:ring-0 placeholder-white/20"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => setCustomAmount(selectedInvoice?.balance?.toString() || '0')}
                                            className="px-3 py-1.5 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 hover:bg-white/20 transition-colors"
                                        >
                                            Full Balance
                                        </button>
                                        <button
                                            onClick={() => setCustomAmount(((selectedInvoice?.balance || 0) / 2).toString())}
                                            className="px-3 py-1.5 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 hover:bg-white/20 transition-colors"
                                        >
                                            Partial (50%)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="flex items-center gap-6 p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-emerald-500 text-white shadow-lg shadow-emerald-200 transition-all">
                                        <Smartphone size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-black text-foreground uppercase tracking-tight">STK Direct Push</div>
                                        <div className="text-[10px] font-bold text-muted-foreground italic">Instant mobile authorization prompt</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">M-Pesa Mobile Identity</Label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/30 group-focus-within:text-blue-600 transition-colors">+254</div>
                                        <Input
                                            type="tel"
                                            className="h-16 pl-14 rounded-xl border-border bg-muted/5 font-black text-lg tracking-[0.2em] transition-all focus:ring-4 focus:ring-blue-600/5 group-focus-within:border-blue-600/50"
                                            placeholder="712345678"
                                            value={phoneNumber.startsWith('254') ? phoneNumber.slice(3) : phoneNumber}
                                            onChange={(e) => setPhoneNumber('254' + e.target.value.replace(/[^0-9]/g, ''))}
                                        />
                                    </div>
                                    <p className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/60 italic ml-1 mt-2">
                                        <ShieldCheck size={12} className="text-emerald-500" />
                                        Encryption-secured institutional transaction
                                    </p>
                                </div>

                                <button
                                    className="w-full h-16 rounded-2xl bg-blue-600 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                                    onClick={handleInitiatePayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center justify-center gap-3 italic">
                                            <Loader2 size={20} className="animate-spin" />
                                            Encrypting...
                                        </div>
                                    ) : (
                                        'Initialize Settlement'
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center space-y-8 animate-fade-in">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-emerald-50 text-emerald-600 shadow-inner border border-emerald-100">
                                <CheckCircle size={48} className="animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black tracking-tight text-foreground uppercase italic">Prompt Despatched</h3>
                                <p className="text-sm font-medium text-muted-foreground max-w-[280px] mx-auto italic">
                                    Kindly finalize secure authorization on your mobile device via PIN.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-muted/20 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 animate-pulse italic">
                                Synchronizing Network state...
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* =================== MANUAL PAYMENT MODAL =================== */}
            <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
                <DialogContent className="max-w-[500px] rounded-[2.5rem] border-border bg-card p-0 overflow-hidden shadow-2xl">
                    <div className="bg-[#030213] p-8 text-white">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h3 className="text-xl font-extrabold tracking-tight uppercase italic">Record Manual Entry</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 italic">Verified direct liquidity intake</p>
                            </div>
                            <Wallet size={32} className="text-white/20" />
                        </div>
                    </div>

                    <form onSubmit={handleRecordManualPayment}>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2 relative">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Student Registry Entity</Label>
                                <div className="relative group">
                                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-blue-600 transition-colors" />
                                    <Input
                                        type="text"
                                        className="h-16 pl-14 rounded-xl border-border bg-muted/5 font-black text-sm uppercase transition-all focus:ring-4 focus:ring-blue-600/5"
                                        required={!manualForm.studentId}
                                        placeholder="Search by name, ID or school..."
                                        value={manualForm.studentId
                                            ? `${students.find(s => s.id === manualForm.studentId)?.firstName || ''} ${students.find(s => s.id === manualForm.studentId)?.lastName || ''}`
                                            : studentSearchTerm}
                                        onChange={(e) => {
                                            setStudentSearchTerm(e.target.value)
                                            setManualForm({ ...manualForm, studentId: '' })
                                            setShowStudentSearch(true)
                                        }}
                                        onFocus={() => setShowStudentSearch(true)}
                                    />
                                    {showStudentSearch && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 rounded-2xl border border-border bg-card p-2 shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-slide-up">
                                            {students.filter(s => `${s.firstName} ${s.lastName} ${s.admissionNumber}`.toLowerCase().includes(studentSearchTerm.toLowerCase())).slice(0, 10).map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    className="w-full flex flex-col gap-0.5 p-4 rounded-xl transition-all hover:bg-muted/30 text-left shrink-0"
                                                    onClick={() => {
                                                        setManualForm({ ...manualForm, studentId: s.id })
                                                        setStudentSearchTerm(`${s.firstName} ${s.lastName}`)
                                                        setShowStudentSearch(false)
                                                    }}
                                                >
                                                    <span className="text-sm font-black text-foreground uppercase">{s.firstName} {s.lastName}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                        ADM: {s.admissionNumber} {isSuperAdmin && `• ${s.school?.name}`}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Amount (KES)</Label>
                                    <Input
                                        type="number"
                                        className="h-14 rounded-xl border-border bg-muted/5 font-bold transition-all focus:ring-4 focus:ring-blue-600/5"
                                        required
                                        value={manualForm.amount}
                                        onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Date of Tally</Label>
                                    <Input
                                        type="date"
                                        className="h-14 rounded-xl border-border bg-muted/5 font-bold transition-all focus:ring-4 focus:ring-blue-600/5"
                                        required
                                        value={manualForm.date}
                                        onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Registry Method</Label>
                                <Select value={manualForm.method} onValueChange={v => setManualForm({ ...manualForm, method: v })}>
                                    <SelectTrigger className="h-14 rounded-xl border-border bg-muted/5 font-bold text-xs uppercase tracking-widest italic">
                                        <SelectValue placeholder="Select Method" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border">
                                        <SelectItem value="CASH" className="font-bold text-xs uppercase italic">LIQUID CASH</SelectItem>
                                        <SelectItem value="BANK_TRANSFER" className="font-bold text-xs uppercase italic">CHANNEX/BANK</SelectItem>
                                        <SelectItem value="MPESA" className="font-bold text-xs uppercase italic">EXTERNAL MOBILE</SelectItem>
                                        <SelectItem value="CHEQUE" className="font-bold text-xs uppercase italic">CHEQUE/VOUCHER</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Channel Descriptor (Ref)</Label>
                                <Input
                                    className="h-14 rounded-xl border-border bg-muted/5 font-bold transition-all focus:ring-4 focus:ring-blue-600/5"
                                    placeholder="Enter identifier number"
                                    value={manualForm.transactionRef}
                                    onChange={(e) => setManualForm({ ...manualForm, transactionRef: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="p-8 border-t border-border bg-muted/10 items-center justify-between gap-4">
                            <button
                                type="button"
                                className="h-14 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted/50"
                                onClick={() => setShowManualModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="h-14 px-10 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'SYNCHRONIZING...' : 'RECORD SETTLEMENT'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =================== BANK TRANSFER MODAL =================== */}
            <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
                <DialogContent className="max-w-[480px] rounded-[2.5rem] border-border bg-card p-0 overflow-hidden shadow-2xl">
                    <div className="bg-[#030213] p-8 text-white">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h3 className="text-xl font-extrabold tracking-tight uppercase italic text-white leading-none">Record Bank Transfer</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 italic">Inter-institutional liquidity credit</p>
                            </div>
                            <Landmark size={32} className="text-white/20" />
                        </div>
                    </div>

                    <form onSubmit={handleRecordBankTransfer}>
                        <div className="p-8 space-y-6">
                            {bankError && (
                                <div className="rounded-xl bg-red-50 p-4 flex items-center gap-3 text-red-600 ring-1 ring-red-100 italic animate-shake">
                                    <AlertCircle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{bankError}</span>
                                </div>
                            )}
                            {bankSuccess && (
                                <div className="rounded-xl bg-emerald-50 p-4 flex items-center gap-3 text-emerald-600 ring-1 ring-emerald-100 italic">
                                    <CheckCircle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{bankSuccess}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Invoice Descriptor *</Label>
                                    <Input
                                        className="h-14 rounded-xl border-border bg-muted/5 font-black uppercase transition-all focus:ring-4 focus:ring-blue-600/5"
                                        placeholder="e.g. INV-2025-001"
                                        value={bankForm.invoiceNumber}
                                        onChange={e => setBankForm({ ...bankForm, invoiceNumber: e.target.value })}
                                        required
                                    />
                                    <p className="text-[9px] font-bold text-muted-foreground/50 ml-1 italic uppercase tracking-widest">Must match registry invoice exactly</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Liquidity Amount (KES) *</Label>
                                    <Input
                                        type="number"
                                        className="h-14 rounded-xl border-border bg-muted/5 font-black transition-all focus:ring-4 focus:ring-blue-600/5"
                                        placeholder="0.00"
                                        value={bankForm.amount}
                                        onChange={e => setBankForm({ ...bankForm, amount: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Audit Reference No. *</Label>
                                    <Input
                                        className="h-14 rounded-xl border-border bg-muted/5 font-black uppercase transition-all focus:ring-4 focus:ring-blue-600/5"
                                        placeholder="Enter Slip ID or Bank Ref"
                                        value={bankForm.bankReference}
                                        onChange={e => setBankForm({ ...bankForm, bankReference: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Effective Date</Label>
                                    <Input
                                        type="date"
                                        className="h-14 rounded-xl border-border bg-muted/5 font-bold transition-all focus:ring-4 focus:ring-blue-600/5"
                                        value={bankForm.paidAt}
                                        onChange={e => setBankForm({ ...bankForm, paidAt: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 italic">Institutional Notes</Label>
                                    <Textarea
                                        className="rounded-xl border-border bg-muted/5 min-h-[100px] font-medium transition-all focus:ring-4 focus:ring-blue-600/5"
                                        placeholder="Verified transfer details..."
                                        value={bankForm.notes}
                                        onChange={e => setBankForm({ ...bankForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-8 border-t border-border bg-muted/10 items-center justify-between gap-4">
                            <button
                                type="button"
                                className="h-14 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted/50"
                                onClick={() => setShowBankModal(false)}
                            >
                                Abandon
                            </button>
                            <button
                                type="submit"
                                className="h-14 px-10 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                                disabled={bankSubmitting}
                            >
                                {bankSubmitting ? 'SYNCHRONIZING...' : 'RECORD CHANNEL CREDIT'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
