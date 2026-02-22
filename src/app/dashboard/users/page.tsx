'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Users, Search, KeyRound, ShieldCheck, FileText, LayoutDashboard, Briefcase, GraduationCap } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function AppUsersPage() {
    const { data: session } = useSession()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState('')

    useEffect(() => {
        if (session?.user?.role === 'SUPER_ADMIN') {
            fetchUsers()
        }
    }, [session])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (user: any) => {
        if (!confirm(`Are you sure you want to trigger a password reset for ${user.firstName} ${user.lastName}? They will be forced to change it on their next login.`)) return

        try {
            const res = await fetch(`/api/users/${user.id}/reset-password`, {
                method: 'POST'
            })

            const data = await res.json()

            if (res.ok && data.success) {
                alert(`Password successfully reset!\n\nNew Temporary Password: ${data.defaultPassword}\n\nPlease share this securely with the user.`)
                fetchUsers() // Refresh list to show change flag
            } else {
                alert(data.error || 'Failed to reset password. Please try again.')
            }
        } catch (error) {
            console.error('Reset error:', error)
            alert('An unexpected error occurred while resetting the password.')
        }
    }

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Access Denied. Global App Users are restricted to Super Administrators.</div>
            </DashboardLayout>
        )
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = `${user.firstName} ${user.lastName} ${user.email} ${user.phoneNumber || ''} ${user.school?.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = filterRole ? user.role === filterRole : true
        return matchesSearch && matchesRole
    })

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return <ShieldCheck size={16} className="text-primary-600" />
            case 'PRINCIPAL': return <LayoutDashboard size={16} className="text-secondary-600" />
            case 'FINANCE_MANAGER': return <Briefcase size={16} className="text-success-600" />
            case 'PARENT': return <Users size={16} className="text-warning-600" />
            default: return <Users size={16} />
        }
    }

    const exportToCSV = () => {
        if (users.length === 0) return

        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'School', 'Status']
        const csvRows = [headers.join(',')]

        users.forEach(user => {
            const row = [
                user.firstName,
                user.lastName,
                user.email,
                user.phoneNumber || 'N/A',
                user.role,
                user.school?.name || 'Platform Wide',
                user.isActive ? 'Active' : 'Suspended'
            ].map(val => `"${val}"`)

            csvRows.push(row.join(','))
        })

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `PayDesk_Users_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>App Users Database</h2>
                        <p className="text-muted">Global registry of every active user account across all schools</p>
                    </div>

                    <button onClick={exportToCSV} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <input
                            type="text"
                            className="form-input w-full"
                            placeholder="Search by name, email, phone, or school..."
                            style={{ paddingLeft: '40px', margin: 0 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="form-input"
                        style={{ width: '200px', margin: 0 }}
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="SUPER_ADMIN">Super Admins</option>
                        <option value="PRINCIPAL">Principals</option>
                        <option value="FINANCE_MANAGER">Finance Managers</option>
                        <option value="PARENT">Parents</option>
                    </select>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User Profile</th>
                                    <th>Role</th>
                                    <th>School Association</th>
                                    <th className="hide-mobile">Account Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                            <Users size={48} style={{ opacity: 0.2, margin: '0 auto var(--spacing-md)' }} />
                                            <p className="text-muted">No system users found matching your filters.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span className="font-semibold">{user.firstName} {user.lastName}</span>
                                                    <span className="text-xs text-muted">{user.email}</span>
                                                    {user.phoneNumber && <span className="text-xs text-muted font-mono">{user.phoneNumber}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {getRoleIcon(user.role)}
                                                    <span className="text-sm font-semibold">{user.role.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {user.school ? (
                                                    <span className="badge badge-neutral text-xs">
                                                        {user.school.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted text-xs italic">Platform Wide</span>
                                                )}
                                            </td>
                                            <td className="hide-mobile">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`} style={{ width: 'fit-content' }}>
                                                        {user.isActive ? 'Active' : 'Suspended'}
                                                    </span>
                                                    {user.requiresPasswordChange && (
                                                        <span className="text-xs text-warning-700 font-semibold flex items-center gap-1">
                                                            <KeyRound size={12} /> Pending Password Reset
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    title="Trigger Password Reset"
                                                    onClick={() => handleResetPassword(user)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <KeyRound size={16} />
                                                    <span className="hide-mobile">Force Reset</span>
                                                </button>

                                                {user.role !== 'SUPER_ADMIN' && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        title="Log in as this user (Impersonate)"
                                                        onClick={async () => {
                                                            if (!confirm(`Are you sure you want to log in as ${user.firstName} ${user.lastName}? Any actions you take will be logged as them.`)) return
                                                            try {
                                                                // Step 1: Generate short-lived token
                                                                const res = await fetch('/api/auth/impersonate', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ targetUserId: user.id })
                                                                })
                                                                const data = await res.json()

                                                                if (!res.ok) throw new Error(data.error)

                                                                // Step 2: Use credentials provider to swap session
                                                                const { signIn } = await import('next-auth/react')
                                                                await signIn('credentials', {
                                                                    impersonateToken: data.token,
                                                                    callbackUrl: '/dashboard'
                                                                })
                                                            } catch (error: any) {
                                                                alert('Impersonation failed: ' + error.message)
                                                            }
                                                        }}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: 'var(--spacing-sm)' }}
                                                    >
                                                        <Search size={16} />
                                                        <span className="hide-mobile">Login As</span>
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
        </DashboardLayout>
    )
}
