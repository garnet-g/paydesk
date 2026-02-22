'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Download, Printer, Calendar, DollarSign, Smartphone, Banknote } from 'lucide-react'

export default function DailyCollections() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReport()
    }, [date])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/reports/collections?date=${date}`)
            if (res.ok) {
                const data = await res.json()
                setReport(data)
            }
        } catch (error) {
            console.error('Failed to fetch report:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow || !report) return

        const rows = report.transactions.map((tx: any) => `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 0.8125rem;">
                    ${formatDateTime(tx.completedAt || tx.createdAt).split(' ').slice(1).join(' ')}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: 600; font-size: 0.875rem;">${tx.student?.firstName} ${tx.student?.lastName}</div>
                    <div style="font-size: 0.75rem; color: #888;">${tx.student?.admissionNumber || ''}</div>
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 0.8125rem;">
                    ${tx.student?.class?.name || 'Unassigned'}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; font-size: 0.875rem;">
                    ${formatCurrency(Number(tx.amount))}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center; font-size: 0.8125rem;">
                    ${tx.method}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 0.75rem; color: #888;">
                    ${tx.receiptNumber || tx.transactionRef || '—'}
                </td>
            </tr>
        `).join('')

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Collections Report — ${formatDate(date)}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #1a1a2e; }
                    h1 { font-size: 1.5rem; margin-bottom: 4px; }
                    .subtitle { color: #888; font-size: 0.875rem; margin-bottom: 24px; }
                    .summary { display: flex; gap: 24px; margin-bottom: 32px; }
                    .summary-card { padding: 16px 20px; border: 1px solid #eee; border-radius: 8px; min-width: 160px; }
                    .summary-label { font-size: 0.75rem; color: #888; margin-bottom: 4px; }
                    .summary-value { font-size: 1.25rem; font-weight: 700; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; padding: 10px 12px; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #eee; font-weight: 600; }
                    th.right { text-align: right; }
                    th.center { text-align: center; }
                    @media print { body { margin: 20px; } }
                </style>
            </head>
            <body>
                <h1>Daily Collections Report</h1>
                <div class="subtitle">${formatDate(date)} • ${report.transactions.length} transaction(s)</div>
                <div class="summary">
                    <div class="summary-card">
                        <div class="summary-label">Total Collected</div>
                        <div class="summary-value">${formatCurrency(report.total)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">M-Pesa</div>
                        <div class="summary-value">${formatCurrency(report.byMethod?.MPESA || 0)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Cash & Other</div>
                        <div class="summary-value">${formatCurrency((report.byMethod?.CASH || 0) + (report.byMethod?.CARD || 0) + (report.byMethod?.BANK || 0))}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th class="right">Amount</th>
                            <th class="center">Method</th>
                            <th class="right">Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">No transactions for this date.</td></tr>'}
                    </tbody>
                </table>
                <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 0.75rem; color: #888; display: flex; justify-content: space-between;">
                    <span>Generated on ${new Date().toLocaleString()}</span>
                    <span>PayDesk</span>
                </div>
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => printWindow.print(), 300)
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Collections Report</h2>
                    <p className="text-muted">Daily collection breakdown and payment verification</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <input
                        type="date"
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handlePrint}
                        title="Print Report"
                        disabled={loading || !report}
                    >
                        <Printer size={16} />
                        Print
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        title="Export CSV"
                        onClick={() => window.open(`/api/payments/export?date=${date}`, '_blank')}
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                    <div className="spinner" style={{ margin: '0 auto var(--spacing-md)' }}></div>
                    <p className="text-muted text-sm">Loading report...</p>
                </div>
            ) : !report ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                    <p className="text-muted">Failed to load report data.</p>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                        {/* Total */}
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                            color: 'white',
                            border: 'none'
                        }}>
                            <div className="text-xs" style={{ opacity: 0.8, marginBottom: '4px' }}>Total Collected</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(report.total)}</div>
                            <div className="text-xs" style={{ opacity: 0.6, marginTop: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-400)', display: 'inline-block' }} />
                                {report.transactions.length} transaction(s)
                            </div>
                        </div>

                        {/* MPESA */}
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                                <div style={{
                                    width: '36px', height: '36px',
                                    background: 'var(--success-50)', color: 'var(--success-600)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Smartphone size={18} />
                                </div>
                                <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>MPESA</span>
                            </div>
                            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>Digital Payments</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(report.byMethod?.MPESA || 0)}</div>
                        </div>

                        {/* Cash & Other */}
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                                <div style={{
                                    width: '36px', height: '36px',
                                    background: 'var(--neutral-100)', color: 'var(--neutral-600)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Banknote size={18} />
                                </div>
                                <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>OTHER</span>
                            </div>
                            <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>Cash & Bank Transfers</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {formatCurrency((report.byMethod?.CASH || 0) + (report.byMethod?.CARD || 0) + (report.byMethod?.BANK || 0))}
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Transactions</h3>
                                <p className="card-description">{formatDate(date)} • {report.transactions.length} record(s)</p>
                            </div>
                        </div>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Student</th>
                                        <th>Class</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                        <th style={{ textAlign: 'center' }}>Method</th>
                                        <th style={{ textAlign: 'right' }}>Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                                <DollarSign size={48} style={{ opacity: 0.15, marginBottom: 'var(--spacing-sm)' }} />
                                                <p className="text-muted">No transactions for this date.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        report.transactions.map((tx: any) => (
                                            <tr key={tx.id}>
                                                <td>
                                                    <span className="text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                        {formatDateTime(tx.completedAt || tx.createdAt).split(' ').slice(1).join(' ')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="font-semibold text-sm">{tx.student?.firstName} {tx.student?.lastName}</div>
                                                    <div className="text-xs text-muted">{tx.student?.admissionNumber}</div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-neutral">
                                                        {tx.student?.class?.name || 'Unassigned'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className="font-semibold">{formatCurrency(Number(tx.amount))}</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`badge ${tx.method === 'MPESA' ? 'badge-success' : 'badge-neutral'}`}>
                                                        {tx.method}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className="text-xs text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                        {tx.receiptNumber || tx.transactionRef || '—'}
                                                    </span>
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
    )
}
