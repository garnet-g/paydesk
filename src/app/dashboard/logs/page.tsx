'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Activity, Search, ShieldAlert, KeyRound, User, Database, Building } from 'lucide-react'

export default function LogsPage() {
    const { data: session } = useSession()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/logs')
                if (res.ok) {
                    const data = await res.json()
                    setLogs(data)
                }
            } catch (error) {
                console.error('Failed to fetch logs:', error)
            } finally {
                setLoading(false)
            }
        }

        if (session?.user?.role === 'SUPER_ADMIN') {
            fetchLogs()
        }
    }, [session])

    const [searchTerm, setSearchTerm] = useState('')
    const [filterAction, setFilterAction] = useState('')
    const [filterDate, setFilterDate] = useState('')
    const [filterSchool, setFilterSchool] = useState('')

    const filteredLogs = logs.filter(log => {
        const matchesSearch = `${log.action} ${log.entityType} ${log.entityId || ''} ${log.school?.name || ''} ${log.user?.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesAction = filterAction ? log.action.includes(filterAction) : true
        const matchesSchool = filterSchool ? log.school?.id === filterSchool : true
        const matchesDate = filterDate ? new Date(log.createdAt).toISOString().split('T')[0] === filterDate : true
        return matchesSearch && matchesAction && matchesSchool && matchesDate
    })

    const uniqueSchools = Array.from(new Set(logs.map(l => l.school?.id).filter(Boolean))).map(id => {
        return logs.find(l => l.school?.id === id)?.school
    })

    const uniqueActions = Array.from(new Set(logs.map(l => l.action)))

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Unauthorized access. Only Super Admins can view this page.</div>
            </DashboardLayout>
        )
    }

    const getActionIcon = (action: string) => {
        if (action.includes('LOGIN')) return <KeyRound size={16} className="text-secondary-600" />
        if (action.includes('CREATE')) return <Building size={16} className="text-success-600" />
        if (action.includes('DELETE')) return <ShieldAlert size={16} className="text-error-600" />
        if (action.includes('UPDATE')) return <Database size={16} className="text-primary-600" />
        return <Activity size={16} className="text-muted-foreground" />
    }

    const getActionBadge = (action: string) => {
        if (action.includes('CREATE')) return 'badge-success'
        if (action.includes('DELETE')) return 'badge-error'
        if (action.includes('UPDATE')) return 'badge-primary'
        if (action.includes('FAIL')) return 'badge-error'
        if (action.includes('LOGIN')) return 'badge-neutral'
        return 'badge-neutral'
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>System Logs</h2>
                        <p className="text-muted">Global platform activity feed across all institutions</p>
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--spacing-md) var(--spacing-xl)', borderBottom: '1px solid var(--border)', background: 'var(--neutral-50)', display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ margin: 0, flex: '1 1 200px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--neutral-400)' }} />
                            <input
                                type="text"
                                className="form-input w-full"
                                placeholder="Search records..."
                                style={{ paddingLeft: '40px', margin: 0 }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <input
                            type="date"
                            className="form-input"
                            style={{ flex: '0 0 160px', margin: 0 }}
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />

                        <select className="form-input" style={{ flex: '0 0 180px', margin: 0 }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                            <option value="">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                            ))}
                        </select>

                        <select className="form-input" style={{ flex: '0 0 200px', margin: 0 }} value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
                            <option value="">All Schools</option>
                            {uniqueSchools.map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Action</th>
                                    <th>Target Entity</th>
                                    <th>School</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }} className="text-muted">No system logs recorded yet.</td></tr>
                                ) : filteredLogs.map((log: any) => (
                                    <tr key={log.id} style={{ opacity: log.action === 'LOGIN_SUCCESS' ? 0.7 : 1 }}>
                                        <td className="text-muted text-sm font-mono" style={{ whiteSpace: 'nowrap' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {getActionIcon(log.action)}
                                                </div>
                                                <span className={`badge ${getActionBadge(log.action)}`} style={{ fontSize: '0.65rem' }}>
                                                    {log.action}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-semibold text-sm">{log.entityType}</span>
                                            {log.entityId && <span className="text-muted text-xs block font-mono">ID: {log.entityId}</span>}
                                        </td>
                                        <td>
                                            {log.school ? (
                                                <div>
                                                    <span className="text-sm font-semibold">{log.school.name}</span>
                                                    <code className="text-xs text-muted block">{log.school.code}</code>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted">System Level</span>
                                            )}
                                        </td>
                                        <td>
                                            {log.user ? (
                                                <div>
                                                    <span className="text-sm">{log.user.firstName} {log.user.lastName}</span>
                                                    <span className="text-xs text-muted block">{log.user.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted italic">System Automated</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
