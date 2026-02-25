'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import InvoiceDetailModal from '@/components/InvoiceDetailModal'
import { FileText, Plus, Search, Download, Printer, Filter, Eye, Landmark, X, Copy } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateInvoicePDF, generateFeeSchedulePDF } from '@/lib/pdf-utils'

export default function InvoicesPage() {
    const { data: session } = useSession()
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [showFilters, setShowFilters] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [bankModal, setBankModal] = useState<any>(null) // invoice shown in bank transfer modal
    const [schoolBank, setSchoolBank] = useState<any>(null)

    useEffect(() => {
        fetchInvoices()
    }, [searchTerm, statusFilter])

    useEffect(() => {
        const fetchSchoolBank = async () => {
            try {
                const res = await fetch(`/api/schools/${session?.user?.schoolId}/settings`)
                if (res.ok) {
                    const data = await res.json()
                    setSchoolBank(data)
                }
            } catch { }
        }
        if (session?.user?.schoolId) fetchSchoolBank()
    }, [session?.user?.schoolId])

    const fetchInvoices = async () => {
        setLoading(true)
        try {
            const queryParams = new URLSearchParams()
            if (searchTerm) {
                queryParams.append('search', searchTerm)
            }
            if (statusFilter !== 'ALL') {
                queryParams.append('status', statusFilter)
            }
            const res = await fetch(`/api/invoices?${queryParams.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateInvoices = async () => {
        if (!confirm('This will generate new invoices for all active students for the current term. Continue?')) return

        setGenerating(true)
        try {
            const res = await fetch('/api/invoices', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                alert(data.message)
                fetchInvoices()
            } else {
                alert(data.error || 'Failed to generate invoices')
            }
        } catch (error) {
            alert('Error generating invoices')
        } finally {
            setGenerating(false)
        }
    }

    const handleDownloadFeeSchedule = async () => {
        if (!session?.user?.schoolId) return
        try {
            const [schoolRes, feesRes] = await Promise.all([
                fetch(`/api/schools/${session.user.schoolId}/settings`),
                fetch(`/api/fee-structures`)
            ])
            const school = schoolRes.ok ? await schoolRes.json() : {}
            const feesData = feesRes.ok ? await feesRes.json() : []
            const feeStructures = Array.isArray(feesData) ? feesData : feesData.feeStructures || []

            // Get the active academic period from the first invoice
            const period = invoices[0]?.academicPeriod || null

            await generateFeeSchedulePDF(school, period, feeStructures, 'download')
        } catch (e) {
            alert('Could not generate fee schedule. Please try again.')
            console.error(e)
        }
    }


    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Invoices</h2>
                        <p className="text-muted">Manage student billing and fee structures</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', width: '100%', smWidth: 'auto' } as any}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => window.print()}
                            style={{ flex: 1, smWidth: 'auto' } as any}
                        >
                            <Printer size={18} />
                            Print
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                const exportParams = new URLSearchParams()
                                if (statusFilter !== 'ALL') exportParams.append('status', statusFilter)
                                window.open(`/api/invoices/export?${exportParams.toString()}`, '_blank')
                            }}
                            style={{ flex: 1, smWidth: 'auto' } as any}
                        >
                            <Download size={18} />
                            Export
                        </button>
                        {(session?.user.role === 'PRINCIPAL' || session?.user.role === 'FINANCE_MANAGER') && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleDownloadFeeSchedule}
                                title="Download Fee Schedule for this term"
                                style={{ flex: 1 } as any}
                            >
                                <FileText size={18} />
                                Fee Schedule
                            </button>
                        )}
                        {session?.user.role === 'PRINCIPAL' && (
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.href = '/dashboard/invoices/bulk'}
                                style={{ width: '100%', smWidth: 'auto' } as any}
                            >
                                <Plus size={18} />
                                New Billing Run
                            </button>
                        )}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                    <div className="flex sm:flex-col gap-md items-center sm:items-stretch">
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search invoices..."
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-md w-full sm:w-auto" style={{ smWidth: '100%' } as any}>
                            <select
                                className="form-select"
                                style={{ flex: 1 }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Status</option>
                                <option value="UNPAID">Unpaid</option>
                                <option value="PARTIALLY_PAID">Partially Paid</option>
                                <option value="PAID">Paid</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            <button
                                className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setShowFilters(!showFilters)}
                                style={{ padding: '8px' }}
                            >
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <div className="responsive-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="hide-mobile">Invoice #</th>
                                    <th>Student</th>
                                    <th>Amount</th>
                                    <th className="hide-mobile">Paid</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th className="hide-mobile">Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-xl"><div className="spinner mx-auto"></div></td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-xl text-muted">No invoices found.</td></tr>
                                ) : invoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td className="font-mono text-xs hide-mobile">{invoice.invoiceNumber}</td>
                                        <td>
                                            <div className="font-semibold">{invoice.student?.firstName} {invoice.student?.lastName}</div>
                                            <div className="text-xs text-muted">{invoice.student?.admissionNumber}</div>
                                        </td>
                                        <td>{formatCurrency(invoice.totalAmount)}</td>
                                        <td className="text-success hide-mobile">{formatCurrency(invoice.paidAmount)}</td>
                                        <td className="text-error font-bold">{formatCurrency(invoice.balance)}</td>
                                        <td>
                                            <span className={`badge ${invoice.status === 'PAID' ? 'badge-success' :
                                                invoice.status === 'PARTIALLY_PAID' ? 'badge-warning' :
                                                    invoice.status === 'CANCELLED' ? 'badge-muted' :
                                                        'badge-error'
                                                }`}>
                                                {invoice.status === 'PARTIALLY_PAID' ? 'Partial' : invoice.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-xs text-muted hide-mobile">{formatDate(invoice.createdAt)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                                                <button className="btn btn-ghost btn-sm" title="View Details" onClick={() => setSelectedInvoice(invoice)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" title="Print" onClick={() => generateInvoicePDF(invoice, 'print')}>
                                                    <Printer size={16} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" title="Download PDF" onClick={() => generateInvoicePDF(invoice, 'download')}>
                                                    <Download size={16} />
                                                </button>
                                                {session?.user?.role === 'PARENT' && ['PENDING', 'PARTIALLY_PAID'].includes(invoice.status) && (
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        title="Pay via Bank Transfer"
                                                        style={{ gap: '4px', fontSize: '0.75rem' }}
                                                        onClick={() => setBankModal(invoice)}
                                                    >
                                                        <Landmark size={14} /> Bank Transfer
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedInvoice && (
                    <InvoiceDetailModal
                        invoice={selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
                        onUpdate={fetchInvoices}
                    />
                )}

                {/* Bank Transfer Modal */}
                {bankModal && (
                    <div className="modal-overlay" onClick={() => setBankModal(null)}>
                        <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Landmark size={20} style={{ color: 'var(--primary-600)' }} />
                                    <h3 style={{ margin: 0 }}>Pay via Bank Transfer</h3>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => setBankModal(null)}><X size={18} /></button>
                            </div>
                            <div className="modal-body" style={{ padding: 'var(--spacing-xl)' }}>
                                {schoolBank?.bankAccount ? (
                                    <>
                                        <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: '12px', padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--primary-700)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>TRANSFER TO</p>
                                            <div style={{ display: 'grid', gap: '8px' }}>
                                                {[['Bank', schoolBank.bankName], ['Account Name', schoolBank.bankAccountName], ['Account Number', schoolBank.bankAccount], ['Branch', schoolBank.bankBranch]].filter(([, v]) => v).map(([label, value]) => (
                                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{label}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{value}</span>
                                                            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} onClick={() => navigator.clipboard.writeText(value || '')} title="Copy">
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--warning-50, #fffbeb)', border: '1px solid var(--warning-200, #fde68a)', borderRadius: '12px', padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                                            <p style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 700, marginBottom: '4px' }}>⚠️ IMPORTANT — Payment Reference</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace', color: '#1e293b', letterSpacing: '0.05em', margin: 0 }}>{bankModal.invoiceNumber}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '4px' }}>Include this exact reference when making the transfer so we can match your payment.</p>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--neutral-50)', borderRadius: '10px', padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                                            <span style={{ color: 'var(--neutral-500)', fontSize: '0.85rem' }}>Amount Due</span>
                                            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--error)' }}>{formatCurrency(bankModal.balance)}</span>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
                                            After transferring, please allow 1–2 business days for confirmation. Your receipt will be sent automatically.
                                        </p>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--neutral-500)' }}>
                                        <Landmark size={40} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                                        <p>Bank details not yet configured. Please contact the school office.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
