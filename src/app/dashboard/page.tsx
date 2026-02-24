'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { School, DollarSign, Users, TrendingUp, FileText, Upload, Layers, BarChart3, Smartphone, AlertTriangle, Activity, Wifi, Server, Mail as MailIcon, PlusCircle, Settings, ShieldCheck } from 'lucide-react'

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [dashboardStats, setDashboardStats] = useState<any>(null)
    const [recentPayments, setRecentPayments] = useState<any[]>([])
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
    const [statsLoading, setStatsLoading] = useState(true)
    const [paymentsLoading, setPaymentsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router, mounted])

    useEffect(() => {
        if (mounted && status === 'authenticated') {
            fetchStats()
            fetchPayments()
            if (session.user.role === 'PRINCIPAL' || session.user.role === 'FINANCE_MANAGER') {
                fetchApprovals()
            }
        }
    }, [status, mounted])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats')
            const data = await res.json()
            setDashboardStats(data)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setStatsLoading(false)
        }
    }

    const fetchPayments = async () => {
        try {
            const res = await fetch('/api/dashboard/payments')
            const data = await res.json()
            setRecentPayments(data)
        } catch (error) {
            console.error('Failed to fetch payments:', error)
        } finally {
            setPaymentsLoading(false)
        }
    }

    const fetchApprovals = async () => {
        try {
            const res = await fetch('/api/approvals')
            if (res.ok) {
                const data = await res.json()
                setPendingApprovals(data.filter((r: any) => r.status === 'PENDING'))
            }
        } catch (error) {
            console.error('Failed to fetch approvals:', error)
        }
    }

    if (!mounted || status === 'loading') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--neutral-50)'
            }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    const role = session.user.role

    // Stats configuration
    const statsConfig = role === 'SUPER_ADMIN' ? [
        { label: 'Total Schools', value: dashboardStats?.totalSchools || '0', icon: School, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
        { label: 'Total Collections', value: `KES ${(dashboardStats?.totalCollections || 0).toLocaleString()}`, icon: DollarSign, color: 'var(--success-600)', bg: 'var(--success-50)' },
        { label: 'Active Students', value: (dashboardStats?.totalStudents || 0).toLocaleString(), icon: Users, color: 'var(--secondary-600)', bg: 'var(--secondary-50)' },
        { label: 'Growth', value: dashboardStats?.growth || '0%', icon: TrendingUp, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
    ] : role === 'PRINCIPAL' || role === 'FINANCE_MANAGER' ? [
        { label: 'Total Students', value: (dashboardStats?.totalStudents || 0).toLocaleString(), icon: Users, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
        { label: 'Total Collections', value: `KES ${(dashboardStats?.totalCollections || 0).toLocaleString()}`, icon: DollarSign, color: 'var(--success-600)', bg: 'var(--success-50)' },
        { label: 'Outstanding', value: dashboardStats?.outstanding || 'KES 0', icon: TrendingUp, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
        { label: 'This Month', value: dashboardStats?.thisMonth || 'KES 0', icon: DollarSign, color: 'var(--secondary-600)', bg: 'var(--secondary-50)' },
    ] : [
        { label: 'My Children', value: dashboardStats?.myChildren || '0', icon: Users, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
        { label: 'Total Balance', value: `KES ${(dashboardStats?.totalBalance || 0).toLocaleString()}`, icon: DollarSign, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
        { label: 'Paid This Term', value: `KES ${(dashboardStats?.paidThisTerm || 0).toLocaleString()}`, icon: DollarSign, color: 'var(--success-600)', bg: 'var(--success-50)' },
        { label: 'Next Payment', value: dashboardStats?.nextPayment || 'N/A', icon: TrendingUp, color: 'var(--secondary-600)', bg: 'var(--secondary-50)' },
    ]

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Welcome Banner */}
                <div className="card banner-card" style={{
                    background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
                    color: 'white',
                    marginBottom: 'var(--spacing-xl)',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 className="banner-title" style={{ fontWeight: 800, marginBottom: 'var(--spacing-xs)', color: 'white' }}>
                            Welcome back, {session.user.name}! 👋
                        </h2>
                        <p className="banner-subtitle" style={{ opacity: 0.9, fontWeight: 500 }}>
                            {role === 'SUPER_ADMIN' && 'Here\'s an overview of all schools on the platform'}
                            {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && `Here's how ${session.user.schoolName} is doing today`}
                            {role === 'PARENT' && 'Track your children\'s fee balances and payments'}
                        </p>
                    </div>
                    <div style={{
                        position: 'absolute',
                        right: '-50px',
                        top: '-50px',
                        width: '200px',
                        height: '200px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        zIndex: 0
                    }} />
                </div>
                {/* Pulse Stats Board (Principal Only) */}
                {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && dashboardStats && (
                    <div className="card" style={{
                        marginBottom: 'var(--spacing-xl)',
                        background: 'var(--background)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-xl)',
                        border: '1px solid var(--border)',
                        padding: 'var(--spacing-xl)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Term Billing</span>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{dashboardStats.totalExpected}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--primary-600)' }}>
                                <Activity size={12} />
                                <span className="text-xs font-semibold">Projected Revenue</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Collections</span>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--success-600)' }}>
                                KES {dashboardStats.totalCollections?.toLocaleString()}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--success-600)' }}>
                                <TrendingUp size={12} />
                                <span className="text-xs font-semibold">Cash in Hand</span>
                            </div>
                        </div>

                        <div className="collection-rate-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-xl)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="text-xs font-bold text-muted uppercase tracking-wider">Collection Rate</span>
                                <span className="badge badge-success">{dashboardStats.collectionRate}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'var(--neutral-100)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${dashboardStats.collectionRate}%`,
                                    background: 'linear-gradient(90deg, var(--success-500), var(--success-600))',
                                    borderRadius: '4px',
                                    transition: 'width 1s ease'
                                }} />
                            </div>
                            <p className="text-xs text-muted" style={{ margin: 0 }}>
                                Goal: 100% by end of term
                            </p>
                            <button
                                onClick={async () => {
                                    if (confirm('This will send SMS reminders to all parents with overdue balances. Proceed?')) {
                                        const res = await fetch('/api/communication/reminders', { method: 'POST' });
                                        const data = await res.json();
                                        alert(data.message || 'Reminders sent!');
                                    }
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: 'var(--spacing-md)', fontSize: '0.7rem' }}
                            >
                                Send Auto-Reminders
                            </button>
                        </div>
                    </div>
                )}


                {/* Pending Approvals Banner */}
                {pendingApprovals.length > 0 && (role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && (
                    <div className="card" style={{
                        marginBottom: 'var(--spacing-xl)',
                        background: 'var(--warning-50)',
                        borderColor: 'var(--warning-200)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-md)',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <div style={{
                                width: '44px', height: '44px',
                                background: 'var(--warning-600)', color: 'white',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <div className="font-semibold" style={{ color: 'var(--warning-900)' }}>
                                    {pendingApprovals.length} payment{pendingApprovals.length !== 1 ? 's' : ''} pending your approval
                                </div>
                                <p className="text-xs" style={{ color: 'var(--warning-700)', margin: 0 }}>
                                    Cancellations and adjustments that need to be reviewed before they take effect.
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/payments?tab=approvals" className="btn btn-primary btn-sm" style={{
                            background: 'var(--warning-600)',
                            borderColor: 'var(--warning-600)',
                            flexShrink: 0
                        }}>
                            Review Now
                        </Link>
                    </div>
                )}

                {/* Parent Payment Plan Tracker */}
                {dashboardStats?.hasActivePlan && role === 'PARENT' && (
                    <div className="card" style={{
                        marginBottom: 'var(--spacing-xl)',
                        padding: 0,
                        overflow: 'hidden'
                    }}>
                        <div className="payment-plan-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr' }}>
                            <div style={{
                                padding: 'var(--spacing-xl)',
                                background: 'var(--primary-900)',
                                color: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div className="text-xs" style={{ opacity: 0.6, marginBottom: '4px' }}>Payment Plan</div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>On Track ✓</h4>
                                </div>
                                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <div className="text-xs" style={{ opacity: 0.5, marginBottom: '2px' }}>Instalment</div>
                                    <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                        KES {Number(dashboardStats.commitmentVolume).toLocaleString()} / cycle
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
                                    <div>
                                        <div className="text-xs text-muted" style={{ marginBottom: '2px' }}>Fee Completion</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>45<span style={{ fontSize: '1.25rem' }}>%</span></div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="text-xs" style={{ color: 'var(--success-600)' }}>● On Track</div>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'var(--neutral-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: '45%', background: 'var(--primary-600)', borderRadius: '4px', transition: 'width 1s ease' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions (Principal/Finance Manager Only) */}
                {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        <Link href="/dashboard/invoices/bulk" className="card hover-card" style={{
                            padding: 'var(--spacing-md)',
                            display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                            textDecoration: 'none', color: 'inherit'
                        }}>
                            <div style={{
                                padding: '8px', background: 'var(--primary-100)', color: 'var(--primary-600)',
                                borderRadius: 'var(--radius-md)', flexShrink: 0
                            }}><FileText size={20} /></div>
                            <div>
                                <div className="font-semibold text-sm">Generate Invoices</div>
                                <div className="text-xs text-muted">New billing run</div>
                            </div>
                        </Link>
                        <Link href="/dashboard/students" className="card hover-card" style={{
                            padding: 'var(--spacing-md)',
                            display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                            textDecoration: 'none', color: 'inherit'
                        }}>
                            <div style={{
                                padding: '8px', background: 'var(--success-100)', color: 'var(--success-600)',
                                borderRadius: 'var(--radius-md)', flexShrink: 0
                            }}><Users size={20} /></div>
                            <div>
                                <div className="font-semibold text-sm">Add Students</div>
                                <div className="text-xs text-muted">Enrol or import</div>
                            </div>
                        </Link>
                        <Link href="/dashboard/fee-setup" className="card hover-card" style={{
                            padding: 'var(--spacing-md)',
                            display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                            textDecoration: 'none', color: 'inherit'
                        }}>
                            <div style={{
                                padding: '8px', background: 'var(--warning-100)', color: 'var(--warning-600)',
                                borderRadius: 'var(--radius-md)', flexShrink: 0
                            }}><Layers size={20} /></div>
                            <div>
                                <div className="font-semibold text-sm">Fee Setup</div>
                                <div className="text-xs text-muted">Terms & structures</div>
                            </div>
                        </Link>
                        <Link href="/dashboard/reports" className="card hover-card" style={{
                            padding: 'var(--spacing-md)',
                            display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                            textDecoration: 'none', color: 'inherit'
                        }}>
                            <div style={{
                                padding: '8px', background: 'var(--secondary-100)', color: 'var(--secondary-600)',
                                borderRadius: 'var(--radius-md)', flexShrink: 0
                            }}><BarChart3 size={20} /></div>
                            <div>
                                <div className="font-semibold text-sm">View Reports</div>
                                <div className="text-xs text-muted">Collections & defaulters</div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Parent Quick Actions */}
                {role === 'PARENT' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                        <Link href="/dashboard/receipts" className="card hover-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)' }}>
                            <div style={{ padding: '16px', background: 'var(--success-100)', color: 'var(--success-600)', borderRadius: 'var(--radius-lg)' }}>
                                <FileText size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="font-semibold" style={{ fontSize: '1.125rem' }}>Receipt Wallet</div>
                                <div className="text-sm text-muted">Download official fee payment slips</div>
                            </div>
                        </Link>

                        <Link href="/dashboard/payments" className="card hover-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)' }}>
                            <div style={{ padding: '16px', background: 'var(--primary-100)', color: 'var(--primary-600)', borderRadius: 'var(--radius-lg)' }}>
                                <DollarSign size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="font-semibold" style={{ fontSize: '1.125rem' }}>Pay Fees</div>
                                <div className="text-sm text-muted">Make direct payments via M-Pesa</div>
                            </div>
                        </Link>

                        <Link href="/dashboard/children" className="card hover-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)' }}>
                            <div style={{ padding: '16px', background: 'var(--secondary-100)', color: 'var(--secondary-600)', borderRadius: 'var(--radius-lg)' }}>
                                <Users size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="font-semibold" style={{ fontSize: '1.125rem' }}>My Children</div>
                                <div className="text-sm text-muted">View academic and fee statements</div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Super Admin Quick Actions & Health */}
                {role === 'SUPER_ADMIN' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                        {/* Quick Actions */}
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>Global Actions</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <Link href="/dashboard/schools" className="card hover-card" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '12px', background: 'var(--primary-100)', color: 'var(--primary-600)', borderRadius: 'var(--radius-lg)' }}><PlusCircle size={22} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div className="font-semibold" style={{ fontSize: '1rem' }}>Onboard New School</div>
                                        <div className="text-sm text-muted">Register and configure institution</div>
                                    </div>
                                </Link>
                                <Link href="/dashboard/logs" className="card hover-card" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '12px', background: 'var(--warning-100)', color: 'var(--warning-600)', borderRadius: 'var(--radius-lg)' }}><Activity size={22} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div className="font-semibold" style={{ fontSize: '1rem' }}>System Logs</div>
                                        <div className="text-sm text-muted">View platform-wide activity</div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* System Health */}
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>System Health</h3>
                            <div className="card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{ padding: '8px', background: 'var(--success-50)', color: 'var(--success-600)', borderRadius: 'var(--radius-md)' }}>
                                            <Wifi size={18} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="font-semibold text-sm">Daraja API (M-Pesa)</span>
                                            <span className="text-xs text-muted">Callbacks & STK Push</span>
                                        </div>
                                    </div>
                                    <span className="badge badge-success text-xs">Operational</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{ padding: '8px', background: 'var(--success-50)', color: 'var(--success-600)', borderRadius: 'var(--radius-md)' }}>
                                            <MailIcon size={18} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="font-semibold text-sm">SMTP Gateway</span>
                                            <span className="text-xs text-muted">Email Notifications</span>
                                        </div>
                                    </div>
                                    <span className="badge badge-success text-xs">Operational</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{ padding: '8px', background: 'var(--neutral-100)', color: 'var(--neutral-600)', borderRadius: 'var(--radius-md)' }}>
                                            <Server size={18} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="font-semibold text-sm">Database Clusters</span>
                                            <span className="text-xs text-muted">eu-west-2 (PostgreSQL)</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-mono" style={{ color: 'var(--success-600)', fontWeight: 600 }}>~34ms</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                    {statsLoading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="card skeleton" style={{ height: '100px' }}></div>)
                    ) : statsConfig.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <div key={index} className="card" style={{
                                animation: `slideUp ${0.3 + index * 0.1}s ease-out`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="text-muted text-xs" style={{ marginBottom: 'var(--spacing-xs)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {stat.label}
                                        </p>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 0 }}>
                                            {stat.value}
                                        </h3>
                                    </div>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: 'var(--radius-md)',
                                        background: stat.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: stat.color,
                                        flexShrink: 0
                                    }}>
                                        <Icon size={18} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Recent Payments */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: 'var(--spacing-lg) var(--spacing-xl)' }}>
                        <h3 className="card-title">Recent Payments</h3>
                        <p className="card-description">Latest transactions across the school</p>
                    </div>
                    <div className="responsive-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    {role === 'SUPER_ADMIN' && <th>School</th>}
                                    <th>Amount</th>
                                    <th className="hide-mobile">Method</th>
                                    <th>Status</th>
                                    <th className="hide-mobile">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentsLoading ? (
                                    <tr><td colSpan={role === 'SUPER_ADMIN' ? 6 : 5} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                                ) : recentPayments.length === 0 ? (
                                    <tr><td colSpan={role === 'SUPER_ADMIN' ? 6 : 5} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }} className="text-muted">No recent payments yet.</td></tr>
                                ) : recentPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="font-semibold">{payment.student.firstName} {payment.student.lastName}</td>
                                        {role === 'SUPER_ADMIN' && <td className="text-xs">{payment.school?.name}</td>}
                                        <td className="font-semibold">KES {payment.amount.toLocaleString()}</td>
                                        <td className="hide-mobile">
                                            <span className="badge badge-neutral">{payment.method}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${payment.status === 'COMPLETED' ? 'badge-success' : payment.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="text-muted text-sm hide-mobile">{new Date(payment.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {recentPayments.length > 0 && (
                        <div style={{ padding: 'var(--spacing-md) var(--spacing-xl)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/payments')}>View All Payments</button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .banner-card {
                    padding: var(--spacing-2xl);
                }
                .banner-title {
                    font-size: 2rem;
                }
                .banner-subtitle {
                    font-size: 1.125rem;
                }
                .collection-rate-container {
                    border-left: 1px solid var(--border);
                }
                @media (max-width: 768px) {
                    .banner-card {
                        padding: var(--spacing-lg);
                    }
                    .banner-title {
                        font-size: 1.5rem;
                    }
                    .banner-subtitle {
                        font-size: 0.9375rem;
                    }
                    .collection-rate-container {
                        border-left: none !important;
                        padding-left: 0 !important;
                        padding-top: var(--spacing-lg);
                        border-top: 1px solid var(--border);
                    }
                    .payment-plan-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (max-width: 640px) {
                    .hide-mobile {
                        display: none;
                    }
                }
            `}</style>
        </DashboardLayout >
    )
}
