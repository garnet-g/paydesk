
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { FileText, Download, Search, Filter, Printer, CheckCircle2, ShoppingBag } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateReceiptPDF } from '@/lib/pdf-utils'

export default function ReceiptWalletPage() {
    const { data: session } = useSession()
    const [receipts, setReceipts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (session) {
            fetchReceipts()
        }
    }, [session])

    const fetchReceipts = async () => {
        try {
            const res = await fetch('/api/payments?status=COMPLETED')
            if (res.ok) {
                const data = await res.json()
                setReceipts(data)
            }
        } catch (error) {
            console.error('Failed to fetch receipts:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredReceipts = receipts.filter(r =>
        r.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--spacing-xs)' }}>Receipt Wallet</h2>
                    <p className="text-muted">A secure repository for all your official school fee receipts.</p>
                </div>

                {/* Search & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg mb-xl">
                    <div className="lg:col-span-3">
                        <div className="card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                <input
                                    type="text"
                                    placeholder="Search by receipt number or child's name..."
                                    className="form-input"
                                    style={{ paddingLeft: '40px', border: 'none', background: 'transparent' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{ padding: '8px', background: 'var(--primary-100)', color: 'var(--primary-600)', borderRadius: 'var(--radius-md)' }}>
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{receipts.length}</div>
                            <div className="text-xs text-muted uppercase font-bold tracking-tight">Total Slips</div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-3xl)' }}>
                        <div className="spinner"></div>
                    </div>
                ) : filteredReceipts.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', borderStyle: 'dashed' }}>
                        <div style={{
                            width: '64px', height: '64px', background: 'var(--neutral-100)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto var(--spacing-lg)'
                        }}>
                            <FileText size={32} className="text-muted" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No receipts found</h3>
                        <p className="text-muted" style={{ maxWidth: '300px', margin: 'var(--spacing-xs) auto var(--spacing-lg)' }}>
                            Once you make payments, your official receipts will appear here automatically.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--spacing-xl)'
                    }}>
                        {filteredReceipts.map((receipt, index) => (
                            <div
                                key={receipt.id}
                                className="card hover-card animate-slide-up"
                                style={{
                                    padding: 0,
                                    overflow: 'hidden',
                                    animationDelay: `${index * 0.05}s`,
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* Receipt Header Aesthetic */}
                                <div style={{
                                    padding: 'var(--spacing-lg)',
                                    background: 'var(--neutral-50)',
                                    borderBottom: '1px dashed var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'white', border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <CheckCircle2 size={24} className="text-success-600" />
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="text-xs text-muted font-bold uppercase tracking-widest">Receipt No.</div>
                                        <div className="font-mono font-bold" style={{ fontSize: '0.9rem' }}>{receipt.receiptNumber || receipt.transactionRef}</div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ padding: 'var(--spacing-xl)', flex: 1 }}>
                                    <div className="text-xs text-muted font-bold uppercase tracking-wider mb-xs">Payment For</div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: 'var(--spacing-md)' }}>
                                        {receipt.student?.firstName} {receipt.student?.lastName}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                        <div>
                                            <div className="text-xs text-muted">Amount Paid</div>
                                            <div style={{ fontWeight: 700 }}>{formatCurrency(receipt.amount)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted">Date</div>
                                            <div style={{ fontWeight: 700 }}>{formatDate(receipt.createdAt)}</div>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        background: 'var(--neutral-50)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        color: 'var(--muted-foreground)',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span>Method: <b>{receipt.method}</b></span>
                                        <span>Status: <b className="text-success-600">Verified</b></span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    borderTop: '1px solid var(--border)',
                                    display: 'flex',
                                    gap: 'var(--spacing-sm)'
                                }}>
                                    <button
                                        onClick={() => generateReceiptPDF(receipt, 'download')}
                                        className="btn btn-primary btn-sm"
                                        style={{ flex: 1, gap: '8px' }}
                                    >
                                        <Download size={16} /> Download PDF
                                    </button>
                                    <button
                                        onClick={() => generateReceiptPDF(receipt, 'print')}
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: '8px' }}
                                    >
                                        <Printer size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .hover-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .hover-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-xl);
                    border-color: var(--primary-300);
                }
            `}</style>
        </DashboardLayout>
    )
}
