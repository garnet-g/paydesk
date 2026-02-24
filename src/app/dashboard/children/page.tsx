'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Users, GraduationCap, DollarSign, FileText, ChevronRight, CheckCircle, X, ShieldAlert, Loader2, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function ChildrenPage() {
    const { data: session } = useSession()
    const [children, setChildren] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Payment Modal States
    const [showPayModal, setShowPayModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [customAmount, setCustomAmount] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    useEffect(() => {
        if (session) {
            fetchChildren()
            fetchInvoices()
        }
    }, [session])

    const fetchChildren = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/students')
            if (res.ok) {
                const data = await res.json()
                setChildren(data)
            }
        } catch (error) {
            console.error('Failed to fetch children:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/invoices')
            if (res.ok) {
                const data = await res.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error)
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
                    amount: customAmount
                })
            })

            const data = await res.json()
            if (data.success) {
                setPaymentSuccess(true)
                setTimeout(() => {
                    setShowPayModal(false)
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

    const planTier = session?.user?.planTier || 'FREE'
    const isPro = planTier === 'PRO' || planTier === 'ENTERPRISE' || session?.user?.role === 'SUPER_ADMIN'

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>My Children</h2>
                    <p className="text-muted">Manage school records and fees for your children</p>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div className="spinner"></div>
                    </div>
                ) : children.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <Users size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)' }} />
                        <p>No children linked to your account.</p>
                        <p className="text-sm text-muted mt-sm">Please contact the school administration to link your student record.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                        {children.map(child => {
                            const childInvoices = invoices.filter(inv => inv.studentId === child.id)
                            const pendingInvoices = childInvoices.filter(inv => Number(inv.balance) > 0)
                            const initialInvoiceToPay = pendingInvoices.length > 0 ? pendingInvoices[0] : null
                            const totalBalance = pendingInvoices.reduce((acc, inv) => acc + Number(inv.balance), 0)

                            return (
                                <div key={child.id} className="card hover-card">
                                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            background: 'var(--primary-100)',
                                            color: 'var(--primary-700)',
                                            borderRadius: 'var(--radius-full)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            fontWeight: 700
                                        }}>
                                            {child.firstName[0]}{child.lastName[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{child.firstName} {child.lastName}</h3>
                                                    <p className="text-muted text-sm">{child.class?.name} {child.class?.stream}</p>
                                                    <code className="text-xs badge badge-neutral mt-xs">{child.admissionNumber}</code>
                                                </div>
                                                {totalBalance > 0 ? (
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div className="text-xs text-error font-bold tracking-wider uppercase mb-xs" style={{ background: 'var(--error-50)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>Fees Unpaid</div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCurrency(totalBalance)}</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div className="text-xs text-success font-bold tracking-wider uppercase mb-xs" style={{ background: 'var(--success-50)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>All Cleared</div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCurrency(0)}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <div style={{ padding: 'var(--spacing-md)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
                                            <div className="text-xs text-muted uppercase font-bold mb-xs">Status</div>
                                            <span className={`badge ${child.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                                {child.status}
                                            </span>
                                        </div>
                                        <div style={{ padding: 'var(--spacing-md)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
                                            <div className="text-xs text-muted uppercase font-bold mb-xs">School</div>
                                            <div className="text-sm font-semibold truncate">{child.school?.name}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                                        {totalBalance > 0 && isPro && initialInvoiceToPay ? (
                                            <button onClick={() => handlePayClick(initialInvoiceToPay)} className="btn btn-primary btn-sm">
                                                <DollarSign size={14} />
                                                Pay Now
                                            </button>
                                        ) : totalBalance > 0 ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 10px', background: 'var(--warning-50)', borderRadius: 'var(--radius-md)', color: 'var(--warning-700)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                <ShieldAlert size={14} /> Provide payment at finance office
                                            </div>
                                        ) : (
                                            <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.5 }}>
                                                <CheckCircle size={14} />
                                                Fully Paid
                                            </button>
                                        )}
                                        <Link href={`/dashboard/children/${child.id}/statement`} className="btn btn-secondary btn-sm">
                                            <FileText size={14} />
                                            Statement
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
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
                                                    max={selectedInvoice?.balance}
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
                                            <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.6875rem', opacity: 0.7 }}>
                                                {selectedInvoice?.student?.firstName} • {selectedInvoice?.invoiceNumber}
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
            </div>

            <style jsx>{`
                .hover-card {
                    transition: transform var(--transition-base), box-shadow var(--transition-base);
                }
                .hover-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                }
            `}</style>
        </DashboardLayout>
    )
}
