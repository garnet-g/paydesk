'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Briefcase, Plus, Search, Trash2, Mail, Phone, MailQuestion, UserCog } from 'lucide-react'
import AddStaffForm from '@/components/forms/AddStaffForm'
import { formatDateTime } from '@/lib/utils'

export default function StaffPage() {
    const { data: session } = useSession()
    const [staff, setStaff] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/staff')
            if (res.ok) {
                const data = await res.json()
                setStaff(data)
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the account for ${name}? This action cannot be undone.`)) return

        try {
            const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchStaff()
            } else {
                alert('Failed to delete staff member')
            }
        } catch (error) {
            alert('Error deleting staff member')
        }
    }

    if (session?.user?.role !== 'PRINCIPAL') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Unauthorized access. Only Principals can manage school staff.</div>
            </DashboardLayout>
        )
    }

    const filteredStaff = staff.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Staff Management</h2>
                        <p className="text-muted">Manage roles and permissions for school administrators</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Add Staff Member
                    </button>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--spacing-md) var(--spacing-xl)', borderBottom: '1px solid var(--border)', background: 'var(--neutral-50)', display: 'flex', gap: 'var(--spacing-md)' }}>
                        <div className="form-group" style={{ margin: 0, flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--neutral-400)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Role</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                                        </td>
                                    </tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <UserCog size={48} style={{ opacity: 0.15, marginBottom: 'var(--spacing-sm)' }} />
                                            <p className="text-muted">No staff members found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map(member => (
                                        <tr key={member.id} style={{ opacity: member.isActive ? 1 : 0.6 }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: member.role === 'PRINCIPAL' ? 'var(--primary-100)' : 'var(--secondary-100)',
                                                        color: member.role === 'PRINCIPAL' ? 'var(--primary-700)' : 'var(--secondary-700)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem'
                                                    }}>
                                                        {member.firstName[0]}{member.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm">{member.firstName} {member.lastName}</div>
                                                        <div className="text-xs text-muted">ID: {member.id.substring(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${member.role === 'PRINCIPAL' ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                                                    {member.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                                                        <Mail size={12} className="text-muted" />
                                                        <span>{member.email}</span>
                                                    </div>
                                                    {member.phoneNumber && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                                                            <Phone size={12} className="text-muted" />
                                                            <span>{member.phoneNumber}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${member.isActive ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.65rem' }}>
                                                    {member.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-xs text-muted">
                                                    {member.lastLogin ? formatDateTime(member.lastLogin) : 'Never Logged In'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {member.id !== session.user.id && member.role !== 'PRINCIPAL' && (
                                                    <button
                                                        className="btn btn-ghost btn-sm text-error"
                                                        onClick={() => handleDelete(member.id, member.firstName)}
                                                        title="Remove Staff"
                                                        style={{ padding: '6px' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showAddModal && (
                <AddStaffForm
                    onClose={() => setShowAddModal(false)}
                    onSuccess={fetchStaff}
                />
            )}
        </DashboardLayout>
    )
}
