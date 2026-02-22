'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Users, Search, Edit, UserCheck, UserX, Mail, Phone, X, Save, Plus, Trash2, KeyRound, Loader2 } from 'lucide-react'

export default function ParentsPage() {
    const { data: session } = useSession()
    const [parents, setParents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal States
    const [showEditModal, setShowEditModal] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingParent, setEditingParent] = useState<any>(null)

    // Form States
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchParents()
    }, [])

    const fetchParents = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/parents')
            const data = await res.json()
            setParents(data)
        } catch (error) {
            console.error('Failed to fetch parents:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleParentStatus = async (parent: any) => {
        try {
            const res = await fetch(`/api/parents/${parent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !parent.isActive })
            })
            if (res.ok) {
                fetchParents()
            }
        } catch (error) {
            console.error('Failed to toggle status:', error)
        }
    }

    const handleDeleteParent = async (parent: any) => {
        if (!confirm(`Are you sure you want to remove ${parent.firstName} ${parent.lastName}? This will also un-link them from any students.`)) return

        try {
            const res = await fetch(`/api/parents/${parent.id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchParents()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to delete parent')
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert('An error occurred while deleting')
        }
    }

    const handleResetPassword = async (parent: any) => {
        if (!confirm(`Are you sure you want to reset the password for ${parent.firstName}?`)) return

        try {
            const res = await fetch(`/api/users/${parent.id}/reset-password`, { method: 'POST' })
            if (res.ok) {
                alert('Password reset successfully!')
            } else {
                alert('Failed to reset password')
            }
        } catch (error) {
            alert('Error resetting password')
        }
    }

    const handleEditClick = (parent: any) => {
        setEditingParent(parent)
        setForm({
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            phoneNumber: parent.phoneNumber || ''
        })
        setShowEditModal(true)
    }

    const handleAddClick = () => {
        setForm({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: ''
        })
        setShowAddModal(true)
    }

    const handleSaveParent = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const url = editingParent ? `/api/parents/${editingParent.id}` : '/api/parents'
            const method = editingParent ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                setShowEditModal(false)
                setShowAddModal(false)
                setEditingParent(null)
                fetchParents()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to save parent')
            }
        } catch (error) {
            console.error('Save error:', error)
            alert('An error occurred while saving')
        } finally {
            setIsSaving(false)
        }
    }

    const filteredParents = parents.filter(parent =>
        `${parent.firstName} ${parent.lastName} ${parent.email} ${parent.phoneNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const closeModal = () => {
        setShowEditModal(false)
        setShowAddModal(false)
        setEditingParent(null)
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Parents & Guardians</h2>
                        <p className="text-muted">Manage parent and guardian accounts for {session?.user?.schoolName}</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        <Plus size={18} />
                        Register Parent
                    </button>
                </div>

                {/* Search */}
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name, email or phone number..."
                            style={{ paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Guardian</th>
                                    <th className="hide-mobile">Contact</th>
                                    <th className="hide-mobile">Dependents</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                                        </td>
                                    </tr>
                                ) : filteredParents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <Users size={48} style={{ opacity: 0.2, marginBottom: 'var(--spacing-md)' }} />
                                            <p>No parents found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredParents.map((parent) => (
                                        <tr key={parent.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                                        color: 'white',
                                                        borderRadius: 'var(--radius-full)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {parent.firstName[0]}{parent.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{parent.firstName} {parent.lastName}</div>
                                                        <div className="text-xs text-muted">Joined {new Date(parent.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hide-mobile">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                                                        <Mail size={13} style={{ color: 'var(--muted-foreground)' }} />
                                                        {parent.email}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                                        <Phone size={13} />
                                                        {parent.phoneNumber || 'Not specified'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hide-mobile">
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {parent.guardianships && parent.guardianships.length > 0 ? (
                                                        parent.guardianships.map((g: any) => (
                                                            <span key={g.student.id} className="badge badge-neutral">
                                                                {g.student.firstName}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted text-xs">No dependents</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${parent.isActive ? 'badge-success' : 'badge-error'}`}>
                                                    {parent.isActive ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        title="Edit"
                                                        onClick={() => handleEditClick(parent)}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className={`btn btn-ghost btn-sm`}
                                                        title={parent.isActive ? 'Suspend Access' : 'Restore Access'}
                                                        style={{ color: parent.isActive ? 'var(--error-600)' : 'var(--success-600)' }}
                                                        onClick={() => toggleParentStatus(parent)}
                                                    >
                                                        {parent.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        title="Reset Password"
                                                        onClick={() => handleResetPassword(parent)}
                                                    >
                                                        <KeyRound size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        title="Delete"
                                                        style={{ color: 'var(--error-600)' }}
                                                        onClick={() => handleDeleteParent(parent)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add / Edit Modal */}
                {(showEditModal || showAddModal) && (
                    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{showAddModal ? 'Register Parent' : 'Edit Parent'}</h3>
                                <button className="btn btn-ghost btn-sm" onClick={closeModal}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveParent}>
                                <div className="modal-body">
                                    <div className="grid grid-cols-2 gap-md">
                                        <div className="form-group">
                                            <label className="form-label">First Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                required
                                                value={form.firstName}
                                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Last Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                required
                                                value={form.lastName}
                                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone Number (M-Pesa)</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            placeholder="e.g. 0712345678"
                                            value={form.phoneNumber}
                                            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                        />
                                        <p className="form-hint">Used for billing notifications and STK push payments.</p>
                                    </div>
                                    {showAddModal && (
                                        <div className="alert alert-info">
                                            <KeyRound size={18} />
                                            <div>
                                                <div className="font-semibold" style={{ marginBottom: '2px' }}>Default Password</div>
                                                <p className="text-sm" style={{ margin: 0 }}>Temporary password: <strong>{session?.user?.schoolName || 'School'}@123</strong>. User will be prompted to change it on first login.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                        {isSaving ? <div className="spinner" style={{ width: '18px', height: '18px' }}></div> : <><Save size={18} /> {showAddModal ? 'Create Account' : 'Save Changes'}</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
