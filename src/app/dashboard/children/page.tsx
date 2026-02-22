'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Users, GraduationCap, DollarSign, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function ChildrenPage() {
    const { data: session } = useSession()
    const [children, setChildren] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session) {
            fetchChildren()
        }
    }, [session])

    const fetchChildren = async () => {
        setLoading(true)
        try {
            // Re-using the students API which filters by parent for the PARENT role
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
                    <div className="grid grid-cols-2 gap-lg">
                        {children.map(child => (
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
                                    <div>
                                        <h3 style={{ margin: 0 }}>{child.firstName} {child.lastName}</h3>
                                        <p className="text-muted text-sm">{child.class?.name} {child.class?.stream}</p>
                                        <code className="text-xs badge badge-neutral mt-xs">{child.admissionNumber}</code>
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
                                    <Link href="/dashboard/payments" className="btn btn-primary btn-sm">
                                        <DollarSign size={14} />
                                        Pay Fees
                                    </Link>
                                    <Link href={`/dashboard/children/${child.id}/statement`} className="btn btn-outline btn-sm">
                                        <FileText size={14} />
                                        Statement
                                    </Link>

                                </div>
                            </div>
                        ))}
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
