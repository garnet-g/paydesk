'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
    AlertCircle,
    FileText,
    TrendingUp,
    DollarSign,
    Clock,
    ChevronRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null)
    const [execStats, setExecStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, execRes] = await Promise.all([
                    fetch('/api/dashboard/stats'),
                    fetch('/api/reports/executive-summary')
                ])

                if (statsRes.ok) {
                    const data = await statsRes.json()
                    setStats(data)
                }

                if (execRes.ok) {
                    const data = await execRes.json()
                    setExecStats(data)
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Page Header */}
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Reports</h2>
                    <p className="text-muted">Analytics, collection performance, and financial insights</p>
                </div>

                {/* Key Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>

                    {/* Collection Rate Card */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{
                                width: '44px', height: '44px',
                                background: 'var(--primary-100)', color: 'var(--primary-700)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <TrendingUp size={22} />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>Collection Rate</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)', lineHeight: 1 }}>
                                    {loading ? '—' : `${execStats?.collectionRate || '0.0'}%`}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span className="text-xs text-muted">Progress</span>
                                <span className="text-xs text-muted">Target: 100%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'var(--neutral-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${execStats?.collectionRate || 0}%`,
                                    background: 'var(--primary-600)',
                                    borderRadius: '4px',
                                    transition: 'width 1s ease'
                                }} />
                            </div>
                        </div>
                        <p className="text-xs text-muted">
                            Based on <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatCurrency(execStats?.totalInvoiced || 0)}</span> total billed this cycle.
                        </p>
                    </div>

                    {/* Aging Analysis Card */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                            <Clock size={16} style={{ color: 'var(--error-600)' }} />
                            <span className="font-semibold" style={{ color: 'var(--error-700)' }}>Aging Report</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                            <div style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'var(--neutral-50)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)'
                            }}>
                                <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>0–30 Days</div>
                                <div className="font-semibold">{formatCurrency(Number(execStats?.aging?.current || 0))}</div>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'var(--error-50)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--error-100)'
                            }}>
                                <div className="text-xs" style={{ color: 'var(--error-600)', marginBottom: '2px' }}>31–60 Days</div>
                                <div className="font-semibold" style={{ color: 'var(--error-700)' }}>{formatCurrency(Number(execStats?.aging?.thirty || 0))}</div>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'var(--error-50)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--error-100)'
                            }}>
                                <div className="text-xs" style={{ color: 'var(--error-600)', marginBottom: '2px' }}>61–90 Days</div>
                                <div className="font-semibold" style={{ color: 'var(--error-700)' }}>{formatCurrency(Number(execStats?.aging?.sixty || 0))}</div>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'var(--error-600)',
                                borderRadius: 'var(--radius-md)',
                                color: 'white'
                            }}>
                                <div className="text-xs" style={{ opacity: 0.8, marginBottom: '2px' }}>90+ Days</div>
                                <div className="font-semibold">{formatCurrency(Number(execStats?.aging?.ninetyPlus || 0))}</div>
                            </div>
                        </div>
                        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 'var(--spacing-sm)' }}>Outstanding debt by age</p>
                    </div>

                    {/* Revenue Forecast Card */}
                    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.04 }}>
                            <DollarSign size={100} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                            <DollarSign size={16} style={{ color: 'var(--success-600)' }} />
                            <span className="font-semibold" style={{ color: 'var(--success-700)' }}>Revenue Forecast</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    background: 'var(--success-50)', color: 'var(--success-700)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 700
                                }}>30d</div>
                                <div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                                        {formatCurrency(execStats?.forecast?.next30 || 0)}
                                    </div>
                                    <div className="text-xs text-muted">Expected next 30 days</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    background: 'var(--success-100)', color: 'var(--success-700)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 700
                                }}>60d</div>
                                <div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                                        {formatCurrency(execStats?.forecast?.next60 || 0)}
                                    </div>
                                    <div className="text-xs text-muted">Expected next 60 days</div>
                                </div>
                            </div>
                            <div style={{
                                paddingTop: 'var(--spacing-sm)',
                                borderTop: '1px solid var(--border)',
                                marginTop: 'var(--spacing-xs)'
                            }}>
                                <p className="text-xs text-muted">Based on pending invoice due dates and academic calendar.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Links */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    <Link href="/dashboard/reports/defaulters" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    background: 'var(--error-50)', color: 'var(--error-600)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div style={{
                                    width: '32px', height: '32px',
                                    background: 'var(--neutral-100)', color: 'var(--muted-foreground)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-xs)' }}>Fee Defaulters</h3>
                            <p className="text-sm text-muted" style={{ marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
                                Generate lists and individual fee demand statements for overdue accounts.
                            </p>
                            <span className="badge badge-error" style={{ fontSize: '0.6875rem' }}>
                                View Report →
                            </span>
                        </div>
                    </Link>

                    <Link href="/dashboard/reports/collections" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    background: 'var(--primary-50)', color: 'var(--primary-600)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}>
                                    <FileText size={24} />
                                </div>
                                <div style={{
                                    width: '32px', height: '32px',
                                    background: 'var(--neutral-100)', color: 'var(--muted-foreground)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-xs)' }}>Collections Report</h3>
                            <p className="text-sm text-muted" style={{ marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
                                Breakdown of collections by date, class, and payment method for bookkeeping and audits.
                            </p>
                            <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                                View Report →
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    )
}
