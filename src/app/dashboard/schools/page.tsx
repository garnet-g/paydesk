'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { School, Plus, Search, MapPin, Phone, Mail, MoreHorizontal, TrendingUp, Settings, KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AddSchoolForm from '@/components/forms/AddSchoolForm'
import EditSchoolForm from '@/components/forms/EditSchoolForm'
import { Trash2, Edit } from 'lucide-react'

export default function SchoolsPage() {
    const { data: session } = useSession()
    const [schools, setSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingSchool, setEditingSchool] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        fetchSchools()
    }, [])

    const fetchSchools = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/schools')
            if (res.ok) {
                const data = await res.json()
                setSchools(data)
            }
        } catch (error) {
            console.error('Failed to fetch schools:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return

        try {
            const res = await fetch(`/api/schools/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchSchools()
            } else {
                alert('Failed to delete school')
            }
        } catch (error) {
            alert('Error deleting school')
        }
    }

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Unauthorized access. Only Super Admins can view this page.</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Schools</h2>
                        <p className="text-muted">Manage all registered institutions in the system</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Add New School
                    </button>
                </div>

                <div className="grid responsive-school-grid">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="card skeleton" style={{ height: '250px' }}></div>)
                    ) : schools.length === 0 ? (
                        <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                            <School size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)' }} />
                            <p>No schools registered yet.</p>
                        </div>
                    ) : schools.map(school => (
                        <div key={school.id} className="card school-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        background: 'var(--primary-100)',
                                        color: 'var(--primary-700)',
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        opacity: school.isActive ? 1 : 0.5
                                    }}>
                                        {school.name[0]}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '2px', opacity: school.isActive ? 1 : 0.6 }}>{school.name} {!school.isActive && <span className="text-xs text-error">(Inactive)</span>}</h3>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                                            <code className="badge badge-neutral">{school.code}</code>
                                            <span className={`badge ${school.planTier === 'PREMIUM' || school.planTier === 'ENTERPRISE' ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                                                {school.planTier || 'FREE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setEditingSchool(school)}
                                        title="Edit School"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm text-error"
                                        onClick={() => handleDelete(school.id, school.name)}
                                        title="Delete School"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="school-info">
                                <div className="info-item">
                                    <MapPin size={16} /> {school.address || 'No address'}
                                </div>
                                <div className="info-item">
                                    <Phone size={16} /> {school.phoneNumber || 'N/A'}
                                </div>
                                <div className="info-item">
                                    <Mail size={16} /> {school.email || 'N/A'}
                                </div>
                            </div>

                            <div style={{
                                marginTop: 'var(--spacing-md)',
                                padding: 'var(--spacing-md)',
                                background: 'var(--neutral-50)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                    <div>
                                        <div className="text-xs text-muted mb-xs uppercase font-bold">Students</div>
                                        <div className="font-bold">{school._count?.students || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted mb-xs uppercase font-bold">Status</div>
                                        <span className={`badge ${school.isActive ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.65rem' }}>
                                            {school.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                                    <div className="text-xs text-muted mb-xs uppercase font-bold">Principal Account</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="text-sm font-mono">{school.users?.[0]?.email || 'No Principal Assigned'}</span>
                                        {school.users?.[0] && (
                                            <button
                                                className="btn btn-ghost btn-xs text-primary"
                                                onClick={async () => {
                                                    if (confirm(`Reset password for ${school.users[0].email}?`)) {
                                                        const res = await fetch(`/api/users/${school.users[0].id}/reset-password`, { method: 'POST' })
                                                        if (res.ok) alert('Password reset to: ' + school.name + '@123')
                                                        else alert('Failed to reset')
                                                    }
                                                }}
                                                title="Reset Principal Password"
                                            >
                                                <KeyRound size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-md" style={{ marginTop: 'var(--spacing-sm)' }}>
                                <button
                                    className="btn btn-outline btn-sm"
                                    style={{ flex: 1 }}
                                    onClick={() => router.push('/dashboard/reports')}
                                >
                                    Analytics
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ flex: 1 }}
                                    onClick={() => setEditingSchool(school)}
                                >
                                    Edit Settings
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAddModal && (
                <AddSchoolForm
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => fetchSchools()}
                />
            )}

            {editingSchool && (
                <EditSchoolForm
                    school={editingSchool}
                    onClose={() => setEditingSchool(null)}
                    onSuccess={() => fetchSchools()}
                />
            )}

            <style jsx>{`
                .responsive-school-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: var(--spacing-lg);
                }
                @media (max-width: 1024px) {
                    .responsive-school-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .school-info {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.875rem;
                    color: var(--muted-foreground);
                }
                .school-card:hover {
                    box-shadow: var(--shadow-lg);
                    transition: box-shadow 0.2s ease;
                }
            `}</style>
        </DashboardLayout>
    )
}
