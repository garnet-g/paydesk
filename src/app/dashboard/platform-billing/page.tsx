'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Building, CreditCard, DollarSign, AlertCircle, FileText } from 'lucide-react'

export default function PlatformBillingPage() {
    const { data: session } = useSession()
    const [schools, setSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Derived Stats
    const totalExpectedMRR = schools.reduce((acc, school) => acc + (school.subscriptionFee || 0), 0)
    const totalPastDue = schools.filter(s => s.planStatus === 'PAST_DUE').length
    const activeSchools = schools.filter(s => s.planStatus === 'ACTIVE').length

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

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Access Denied. Only Super Administrators can manage SaaS Subscriptions.</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Platform Billing</h2>
                        <p className="text-muted">Manage tenant subscriptions and outstanding SaaS payments</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-lg mb-xl">
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p className="text-sm text-muted font-semibold relative">Monthly Recurring Revenue</p>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--foreground)', marginTop: 'var(--spacing-xs)' }}>
                                    KES {totalExpectedMRR.toLocaleString()}
                                </h3>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DollarSign size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p className="text-sm text-muted font-semibold relative">Active Subscriptions</p>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--foreground)', marginTop: 'var(--spacing-xs)' }}>
                                    {activeSchools}
                                </h3>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--success-50)', color: 'var(--success-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p className="text-sm text-muted font-semibold relative">Past Due Accounts</p>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--error-600)', marginTop: 'var(--spacing-xs)' }}>
                                    {totalPastDue}
                                </h3>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--error-50)', color: 'var(--error-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertCircle size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>School Name</th>
                                    <th>Plan Tier</th>
                                    <th>Monthly Fee</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                                        </td>
                                    </tr>
                                ) : schools.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <Building size={48} style={{ opacity: 0.2, margin: '0 auto var(--spacing-md)' }} />
                                            <p className="text-muted">No schools found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    schools.map((school) => (
                                        <tr key={school.id}>
                                            <td>
                                                <span className="font-semibold block">{school.name}</span>
                                                <code className="text-xs text-muted block mt-1">{school.code}</code>
                                            </td>
                                            <td>
                                                <span className={`badge ${school.planTier === 'ENTERPRISE' ? 'badge-primary' : school.planTier === 'PRO' ? 'badge-secondary' : 'badge-neutral'}`}>
                                                    {school.planTier || 'FREE'}
                                                </span>
                                            </td>
                                            <td className="font-mono">
                                                KES {school.subscriptionFee ? Number(school.subscriptionFee).toLocaleString() : '0'}
                                            </td>
                                            <td>
                                                <span className={`badge ${school.planStatus === 'ACTIVE' ? 'badge-success' : school.planStatus === 'PAST_DUE' ? 'badge-warning' : 'badge-error'}`}>
                                                    {school.planStatus || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.5 }}>
                                                    <CreditCard size={16} /> Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
