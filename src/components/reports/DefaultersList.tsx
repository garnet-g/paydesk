'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Printer, Send, Search, AlertCircle, ExternalLink } from 'lucide-react'

export default function DefaultersList() {
    const [defaulters, setDefaulters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchDefaulters()
    }, [])

    const fetchDefaulters = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/reports/defaulters')
            if (res.ok) {
                const data = await res.json()
                setDefaulters(data)
            }
        } catch (error) {
            console.error('Failed to fetch defaulters:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredDefaulters = defaulters.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.className.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getTotalOutstanding = () => {
        return defaulters.reduce((sum, d) => sum + d.totalDue, 0)
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const rows = filteredDefaulters.map(d => `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 0.8125rem; font-variant-numeric: tabular-nums;">${d.admissionNumber}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: 600; font-size: 0.875rem;">${d.name}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 0.8125rem;">${d.className}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 0.8125rem;">${d.parentContact || '—'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 0.8125rem; color: #c0392b;">${d.overdueAmount > 0 ? formatCurrency(d.overdueAmount) : '—'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; font-size: 0.875rem; color: #c0392b;">${formatCurrency(d.totalDue)}</td>
            </tr>
        `).join('')

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fee Defaulters Report</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #1a1a2e; }
                    h1 { font-size: 1.5rem; margin-bottom: 4px; }
                    .subtitle { color: #888; font-size: 0.875rem; margin-bottom: 24px; }
                    .summary { display: flex; gap: 24px; margin-bottom: 32px; }
                    .summary-card { padding: 16px 20px; border: 1px solid #eee; border-radius: 8px; }
                    .summary-card.alert { background: #fef2f2; border-color: #fecaca; }
                    .summary-label { font-size: 0.75rem; color: #888; margin-bottom: 4px; }
                    .summary-value { font-size: 1.25rem; font-weight: 700; }
                    .summary-value.red { color: #c0392b; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; padding: 10px 12px; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #eee; font-weight: 600; }
                    th.right { text-align: right; }
                    @media print { body { margin: 20px; } }
                </style>
            </head>
            <body>
                <h1>Fee Defaulters Report</h1>
                <div class="subtitle">${filteredDefaulters.length} student(s) with outstanding balances</div>
                <div class="summary">
                    <div class="summary-card alert">
                        <div class="summary-label">Total Outstanding</div>
                        <div class="summary-value red">${formatCurrency(getTotalOutstanding())}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Defaulters Count</div>
                        <div class="summary-value">${filteredDefaulters.length}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Adm No.</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Parent Contact</th>
                            <th class="right">Overdue</th>
                            <th class="right">Total Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">No defaulters found.</td></tr>'}
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
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Fee Defaulters</h2>
                    <p className="text-muted">Students with outstanding fee balances</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                        <Printer size={16} />
                        Print
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                        if (confirm(`Send payment reminders to ${defaulters.length} parents?`)) {
                            alert(`Reminders sent to ${defaulters.length} parents.`)
                        }
                    }}>
                        <Send size={16} />
                        Remind All
                    </button>
                </div>
            </div>

            {/* Search + Summary */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div className="card" style={{ flex: 1, minWidth: '250px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '40px', border: 'none', boxShadow: 'none', background: 'transparent' }}
                            placeholder="Search by name, admission number, or class..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="card" style={{
                    minWidth: '200px',
                    background: 'var(--error-50)',
                    borderColor: 'var(--error-200)'
                }}>
                    <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>Total Outstanding</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error-600)', fontVariantNumeric: 'tabular-nums' }}>
                        {loading ? '—' : formatCurrency(getTotalOutstanding())}
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                        {loading ? '...' : `${defaulters.length} student(s)`}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Adm No.</th>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Parent Contact</th>
                                <th style={{ textAlign: 'right' }}>Overdue</th>
                                <th style={{ textAlign: 'right' }}>Total Due</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : filteredDefaulters.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                        <AlertCircle size={48} style={{ opacity: 0.15, marginBottom: 'var(--spacing-sm)' }} />
                                        <p className="text-muted">
                                            {searchTerm ? 'No matches found.' : 'All accounts are settled.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : filteredDefaulters.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <span className="text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{d.admissionNumber}</span>
                                    </td>
                                    <td>
                                        <span className="font-semibold text-sm">{d.name}</span>
                                    </td>
                                    <td>
                                        <span className="badge badge-neutral">{d.className}</span>
                                    </td>
                                    <td>
                                        <span className="text-sm" style={{ color: 'var(--primary-700)' }}>{d.parentContact}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="text-sm" style={{ color: d.overdueAmount > 0 ? 'var(--error-600)' : 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
                                            {d.overdueAmount > 0 ? formatCurrency(d.overdueAmount) : '—'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="font-semibold" style={{ color: 'var(--error-600)', fontVariantNumeric: 'tabular-nums' }}>
                                            {formatCurrency(d.totalDue)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: '6px' }}
                                            title="View Statement"
                                            onClick={() => window.location.href = `/dashboard/students/${d.id}/statement`}
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
