'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    Building,
    CreditCard,
    DollarSign,
    AlertCircle,
    TrendingUp,
    Users,
    Zap,
    Search,
    Filter,
    ArrowUpRight,
    ChevronRight,
    BadgeCheck,
    PlusCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlatformBillingPage() {
    const { data: session } = useSession()
    const [schools, setSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sendingReminders, setSendingReminders] = useState(false)

    // Derived Analytics with strict numeric casting
    const totalExpectedMRR = schools.reduce((acc, school) => acc + Number(school.subscriptionFee || 0), 0)
    const totalPastDue = schools.filter(s => s.planStatus === 'PAST_DUE').length
    const activeSchools = schools.filter(s => s.planStatus === 'ACTIVE').length
    const totalStudents = schools.reduce((acc, school) => acc + (school._count?.students || 0), 0)
    const arps = schools.length > 0 ? totalExpectedMRR / schools.length : 0

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        if (session?.user?.role === 'SUPER_ADMIN') {
            fetchBillingDetails()
        }
    }, [session])

    const fetchBillingDetails = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/schools')
            if (res.ok) {
                const data = await res.json()
                setSchools(data)
            }
        } catch (error) {
            console.error('Failed to fetch billing details:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendReminders = async () => {
        if (!confirm(`Send automated reminders to ${totalPastDue} schools with past due balances?`)) return
        setSendingReminders(true)
        try {
            const res = await fetch('/api/admin/billing/reminders', { method: 'POST' })
            const data = await res.json()
            alert(data.message)
            fetchBillingDetails() // Refresh to see new "Last Notified" times
        } catch (error) {
            alert('Failed to send reminders.')
        } finally {
            setSendingReminders(false)
        }
    }

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: 'var(--error-50)', color: 'var(--error-600)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <AlertCircle size={40} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Restricted Command Center</h2>
                    <p style={{ color: 'var(--neutral-500)', marginTop: '8px' }}>Institutional billing is restricted to Super Administrators.</p>
                </div>
            </DashboardLayout>
        )
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-2xl)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ background: 'var(--primary-600)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Platform
                            </div>
                            <span style={{ fontSize: '0.875rem', color: 'var(--neutral-400)', fontWeight: 600 }}>/ Revenue Intelligence</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: 'var(--neutral-900)' }}>Platform Billing</h2>
                    </div>
                </div>

                {/* Intelligent Metrics Row */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl"
                >
                    <MetricCard
                        variants={item}
                        label="Monthly Recurring Revenue"
                        value={`KES ${totalExpectedMRR.toLocaleString()}`}
                        trend="+12.5%"
                        icon={<DollarSign size={20} />}
                        color="var(--primary-600)"
                        bg="var(--primary-50)"
                    />
                    <MetricCard
                        variants={item}
                        label="Average Revenue / School"
                        value={`KES ${arps.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        icon={<TrendingUp size={20} />}
                        color="var(--secondary-600)"
                        bg="var(--secondary-50)"
                    />
                    <MetricCard
                        variants={item}
                        label="Total Student Footprint"
                        value={totalStudents.toLocaleString()}
                        icon={<Users size={20} />}
                        color="var(--success-600)"
                        bg="var(--success-50)"
                    />
                    <MetricCard
                        variants={item}
                        label="Past Due Recoverables"
                        value={totalPastDue.toString()}
                        icon={<AlertCircle size={20} />}
                        color="var(--error-600)"
                        bg="var(--error-50)"
                        highlight={totalPastDue > 0}
                    />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-xl">
                    {/* Main Table Content */}
                    <div className="lg:col-span-3">
                        <div className="card" style={{ padding: 0, border: '1px solid var(--neutral-200)', overflow: 'hidden', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: 'var(--spacing-xl)', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                                <div style={{ position: 'relative', width: '300px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--neutral-400)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search institutional partners..."
                                        className="form-input"
                                        style={{ paddingLeft: '40px', background: 'var(--neutral-50)', border: 'none', borderRadius: '10px' }}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-outline btn-sm" style={{ gap: '8px', padding: '8px 16px', borderRadius: '10px' }}>
                                        <Filter size={16} /> Filters
                                    </button>
                                </div>
                            </div>

                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr style={{ background: 'var(--neutral-50)' }}>
                                            <th style={{ padding: 'var(--spacing-lg) var(--spacing-xl)' }}>Institutional Partner</th>
                                            <th>Subscription Tier</th>
                                            <th>Monthly Fee</th>
                                            <th>Last Reminded</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Management</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                                                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                                                </td>
                                            </tr>
                                        ) : filteredSchools.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                                                    <Building size={48} style={{ opacity: 0.1, margin: '0 auto var(--spacing-md)' }} />
                                                    <p className="text-muted">No institutional partners found.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSchools.map((school, index) => (
                                                <motion.tr
                                                    key={school.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <td style={{ padding: 'var(--spacing-lg) var(--spacing-xl)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--neutral-100)', color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                                                                {school.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold" style={{ fontSize: '0.95rem' }}>{school.name}</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                                    <code className="text-xs" style={{ background: 'var(--neutral-100)', color: 'var(--neutral-600)', padding: '0 4px', borderRadius: '4px' }}>{school.code}</code>
                                                                    <span style={{ fontSize: '0.65rem', color: 'var(--neutral-400)', fontWeight: 600 }}>•</span>
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                        <Users size={12} /> {school._count?.students || 0} students
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {school.planTier === 'ENTERPRISE' && <Zap size={14} className="text-primary-500" fill="currentColor" />}
                                                            {school.planTier === 'PRO' && <Zap size={14} className="text-secondary-500" fill="currentColor" />}
                                                            <span className={`badge ${school.planTier === 'ENTERPRISE' ? 'badge-primary' :
                                                                school.planTier === 'PRO' ? 'badge-secondary' :
                                                                    'badge-neutral'
                                                                }`} style={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                                                                {school.planTier || 'FREE'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="font-bold" style={{ fontSize: '0.9rem' }}>
                                                        KES {Number(school.subscriptionFee || 0).toLocaleString()}
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                                                        {school.lastBillingNotification ? new Date(school.lastBillingNotification).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (
                                                            <span style={{ opacity: 0.3 }}>Never</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: school.planStatus === 'ACTIVE' ? 'var(--success-500)' : school.planStatus === 'PAST_DUE' ? 'var(--warning-500)' : 'var(--error-500)' }} />
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: school.planStatus === 'ACTIVE' ? 'var(--success-700)' : school.planStatus === 'PAST_DUE' ? 'var(--warning-700)' : 'var(--error-700)' }}>
                                                                {school.planStatus || 'ACTIVE'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px', borderRadius: '8px' }}>
                                                            <ChevronRight size={20} className="text-neutral-400" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                        <motion.div variants={item} className="card" style={{ padding: 'var(--spacing-lg)', background: 'var(--primary-600)', color: 'white', border: 'none' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BadgeCheck size={18} /> Administrative Actions
                            </h4>
                            <p style={{ opacity: 0.8, fontSize: '0.75rem', marginBottom: '16px' }}>Manage global subscription settings and institutional onboarding.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                <button
                                    className="btn btn-primary w-full"
                                    style={{ background: 'white', color: 'var(--primary-600)', border: 'none', fontSize: '0.75rem' }}
                                    onClick={() => window.location.href = '/dashboard/schools'}
                                >
                                    <PlusCircle size={14} /> New Institutional Partner
                                </button>
                                <button className="btn btn-primary w-full" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '0.75rem' }}>
                                    Download Revenue Report
                                </button>
                            </div>
                        </motion.div>

                        <motion.div variants={item} className="card" style={{ padding: 'var(--spacing-lg)', background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>Billing Automation</h4>
                            <p className="text-xs text-muted" style={{ marginBottom: '16px' }}>Reminders are queued for principals of past due institutions.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                <button className="btn btn-primary btn-sm w-full" style={{ fontSize: '0.75rem' }}>View Billing Logic</button>

                                {totalPastDue > 0 && (
                                    <button
                                        className="btn btn-outline btn-sm w-full"
                                        style={{ fontSize: '0.75rem', color: 'var(--error-600)', borderColor: 'var(--error-200)', background: 'white' }}
                                        onClick={sendReminders}
                                        disabled={sendingReminders}
                                    >
                                        {sendingReminders ? 'Sending...' : 'Send Past Due Reminders'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

function MetricCard({ label, value, trend, icon, color, bg, highlight, variants }: any) {
    return (
        <motion.div
            variants={variants}
            className="card"
            style={{
                padding: 'var(--spacing-xl)',
                border: highlight ? `2px solid ${color}` : '1px solid var(--neutral-200)',
                background: highlight ? bg : 'white'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                {trend && (
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--success-600)', background: 'var(--success-50)', padding: '2px 8px', borderRadius: '6px' }}>
                        {trend}
                    </div>
                )}
            </div>
            <p className="text-xs text-muted font-bold uppercase tracking-wider">{label}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px', letterSpacing: '-0.02em' }}>{value}</h3>
        </motion.div>
    )
}
