
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
    ChevronRight,
    Download,
    Mail,
    Award,
    Target,
    Zap,
    ArrowUpRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
    const [execStats, setExecStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const execRes = await fetch('/api/reports/executive-summary')
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
            <div className="animate-fade-in" style={{ paddingBottom: 'var(--spacing-3xl)' }}>
                {/* Executive Header */}
                <div style={{
                    marginBottom: 'var(--spacing-2xl)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-md)'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '8px' }}>
                            <TrendingUp size={16} />
                            FINANCIAL INTELLIGENCE
                        </div>
                        <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Executive Summary</h2>
                        <p className="text-muted" style={{ fontSize: '1rem', marginTop: '4px' }}>Strategic insights for institutional financial health.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button className="btn btn-outline btn-sm" style={{ gap: '8px' }}>
                            <Download size={16} /> Export Board Report
                        </button>
                        <button className="btn btn-primary btn-sm" style={{ gap: '8px' }}>
                            <Mail size={16} /> Broadcast Reminders
                        </button>
                    </div>
                </div>

                {/* Pulse Score & Forecasting */}
                <div className="reports-top-grid">
                    {/* Collection Intelligence Card */}
                    <div className="card" style={{
                        background: 'linear-gradient(145deg, var(--background), var(--neutral-50))',
                        border: '1px solid var(--border)',
                        padding: 'var(--spacing-xl)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', right: '-20px', top: '-20px', color: 'var(--primary-100)', opacity: 0.5 }}>
                            <Target size={120} />
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div className="text-xs font-bold text-muted uppercase tracking-widest mb-md">Current Collection Velocity</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary-700)' }}>
                                    {loading ? '—' : `${execStats?.collectionRate}%`}
                                </span>
                                <span className="text-sm font-bold text-success-600" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <ArrowUpRight size={14} /> KPI Target
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: 'var(--primary-50)', borderRadius: '6px', overflow: 'hidden', margin: 'var(--spacing-md) 0' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${execStats?.collectionRate || 0}%`,
                                    background: 'linear-gradient(90deg, var(--primary-500), var(--primary-700))',
                                    borderRadius: '6px'
                                }} />
                            </div>
                            <p className="text-sm text-muted">
                                Collected <b>{formatCurrency(execStats?.totalPaid || 0)}</b> of total <b>{formatCurrency(execStats?.totalInvoiced || 0)}</b> term billing.
                            </p>
                        </div>
                    </div>

                    {/* Debt Exposure Card */}
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-xl">Aging Debt Exposure</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {[
                                { label: 'Active (Current)', value: execStats?.aging?.current, color: 'var(--success-500)' },
                                { label: 'At Risk (31-60d)', value: execStats?.aging?.thirty, color: 'var(--warning-500)' },
                                { label: 'Critical (61-90d)', value: execStats?.aging?.sixty, color: 'var(--error-500)' },
                                { label: 'Recovery (90d+)', value: execStats?.aging?.ninetyPlus, color: 'var(--error-700)' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-bold">{formatCurrency(item.value || 0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Revenue Forecast Card */}
                    <div className="card" style={{ padding: 'var(--spacing-xl)', background: 'var(--neutral-900)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-400)', marginBottom: 'var(--spacing-xl)' }}>
                            <Zap size={18} fill="currentColor" />
                            <span className="text-xs font-bold uppercase tracking-widest">Liquid Growth Forecast</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(execStats?.forecast?.next30 || 0)}</div>
                                <div className="text-xs" style={{ opacity: 0.6 }}>Projected Inflow (Next 30 Days)</div>
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '8px' }}>
                                    <div style={{ width: '60%', height: '100%', background: 'var(--success-500)', borderRadius: '2px' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(execStats?.forecast?.next60 || 0)}</div>
                                <div className="text-xs" style={{ opacity: 0.6 }}>Projected Inflow (30-60 Days)</div>
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '8px' }}>
                                    <div style={{ width: '30%', height: '100%', background: 'var(--primary-400)', borderRadius: '2px' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="reports-bottom-grid">
                    {/* Class Performance Table */}
                    <div className="lg:col-span-3 card" style={{ padding: 0 }}>
                        <div style={{ padding: 'var(--spacing-lg) var(--spacing-xl)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Award className="text-primary-600" size={20} />
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Top Performing Classes</h3>
                            </div>
                            <span className="text-xs text-muted font-bold">BY COLLECTION RATE</span>
                        </div>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Class Name</th>
                                        <th>Rate</th>
                                        <th style={{ textAlign: 'right' }}>Outstanding</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [1, 2, 3].map(i => <tr key={i}><td colSpan={4} className="skeleton" style={{ height: '40px' }}></td></tr>)
                                    ) : execStats?.classPerformance?.map((cls: any, i: number) => (
                                        <tr key={cls.id}>
                                            <td style={{ width: '60px' }}>
                                                <div style={{
                                                    width: '28px', height: '28px',
                                                    background: i === 0 ? 'var(--warning-100)' : 'var(--neutral-100)',
                                                    color: i === 0 ? 'var(--warning-700)' : 'var(--neutral-700)',
                                                    borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.75rem', fontWeight: 800
                                                }}>
                                                    #{i + 1}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700 }}>{cls.name}</div>
                                                <div className="text-xs text-muted">{cls.stream}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontWeight: 700, minWidth: '40px' }}>{cls.rate}%</span>
                                                    <div style={{ flex: 1, minWidth: '60px', height: '6px', background: 'var(--neutral-100)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${cls.rate}%`, background: 'var(--success-500)' }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatCurrency(cls.outstanding)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Drill-down Navigation */}
                    <div className="reports-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        <Link href="/dashboard/reports/defaulters" className="card hover-card group" style={{ textDecoration: 'none', color: 'inherit', padding: 'var(--spacing-xl)', border: '1px solid var(--error-200)', background: 'var(--error-50)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                <div style={{
                                    padding: '12px', background: 'var(--error-600)', color: 'white', borderRadius: 'var(--radius-lg)'
                                }}><AlertCircle size={24} /></div>
                                <ArrowUpRight className="text-error-600 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--error-900)' }}>Arrears Analysis</h4>
                            <p className="text-sm" style={{ color: 'var(--error-700)', margin: '8px 0 var(--spacing-md)' }}>Deep dive into chronic defaulters and generate legal demand notices.</p>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--error-600)' }}>Generate Statements →</span>
                        </Link>

                        <Link href="/dashboard/reports/collections" className="card hover-card group" style={{ textDecoration: 'none', color: 'inherit', padding: 'var(--spacing-xl)', border: '1px solid var(--primary-200)', background: 'var(--primary-50)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                <div style={{
                                    padding: '12px', background: 'var(--primary-600)', color: 'white', borderRadius: 'var(--radius-lg)'
                                }}><FileText size={24} /></div>
                                <ArrowUpRight className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-900)' }}>Audit Trails</h4>
                            <p className="text-sm" style={{ color: 'var(--primary-700)', margin: '8px 0 var(--spacing-md)' }}>Full record of every shilling collected. Sort by item, date, or method.</p>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-600)' }}>View Full Ledger →</span>
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .reports-top-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: var(--spacing-xl);
                    margin-bottom: var(--spacing-2xl);
                }
                .reports-bottom-grid {
                    display: grid;
                    grid-template-columns: 3fr 2fr;
                    gap: var(--spacing-xl);
                }
                .reports-sidebar {
                    /* default: flows in grid */
                }
                .hover-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .hover-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-xl);
                }
                .group:hover .group-hover\:opacity-100 {
                    opacity: 1;
                }
                @media (max-width: 1024px) {
                    .reports-top-grid {
                        grid-template-columns: 1fr;
                    }
                    .reports-bottom-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 768px) {
                    .reports-top-grid {
                        gap: var(--spacing-md);
                        margin-bottom: var(--spacing-xl);
                    }
                    .reports-bottom-grid {
                        gap: var(--spacing-md);
                    }
                }
            `}</style>
        </DashboardLayout>
    )
}
