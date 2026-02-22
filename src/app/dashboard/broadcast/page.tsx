'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Megaphone, Mail, Bell, Send, Users } from 'lucide-react'

export default function BroadcastPage() {
    const { data: session } = useSession()
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [recipientGroup, setRecipientGroup] = useState('ALL_PRINCIPALS')
    const [channel, setChannel] = useState('EMAIL')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    const planTier = session?.user?.planTier || 'FREE'
    const isPro = planTier === 'PRO' || planTier === 'ENTERPRISE' || session?.user?.role === 'SUPER_ADMIN'

    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'PRINCIPAL') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Unauthorized access. Only Principals and Admins can view this page.</div>
            </DashboardLayout>
        )
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess('')

        // Simulate sending a broadcast (this would hit an API endpoint in production)
        setTimeout(() => {
            setLoading(false)
            setSuccess(`Broadcast successfully queued to be sent via ${channel} to ${recipientGroup.replace('_', ' ')}`)
            setSubject('')
            setMessage('')
        }, 1500)
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>
                            {session?.user?.role === 'SUPER_ADMIN' ? 'Global Broadcasts' : 'School Broadcasts'}
                        </h2>
                        <p className="text-muted">
                            {session?.user?.role === 'SUPER_ADMIN'
                                ? 'Send platform updates and announcements to specific user groups'
                                : 'Send important announcements and reminders to parents and staff'}
                        </p>
                    </div>
                    <div style={{ padding: '8px', background: 'var(--primary-100)', color: 'var(--primary-700)', borderRadius: 'var(--radius-md)' }}>
                        <Megaphone size={24} />
                    </div>
                </div>

                <div className="card" style={{ maxWidth: '800px', position: 'relative' }}>
                    <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        {success && (
                            <div className="alert alert-success">
                                <span>✅</span>
                                <span>{success}</span>
                            </div>
                        )}

                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label text-sm font-semibold">Recipient Group <span className="text-error">*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <Users size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--neutral-400)' }} />
                                    {session?.user?.role === 'SUPER_ADMIN' ? (
                                        <select
                                            className="form-input"
                                            style={{ paddingLeft: '40px' }}
                                            value={recipientGroup}
                                            onChange={(e) => setRecipientGroup(e.target.value)}
                                        >
                                            <option value="ALL_PRINCIPALS">All Principals & Admins</option>
                                            <option value="ALL_FINANCE_MANAGERS">All Finance Managers</option>
                                            <option value="ALL_PARENTS">All Registered Parents</option>
                                            <option value="ALL_USERS">Every User on Platform</option>
                                        </select>
                                    ) : (
                                        <select
                                            className="form-input"
                                            style={{ paddingLeft: '40px' }}
                                            value={recipientGroup}
                                            onChange={(e) => setRecipientGroup(e.target.value)}
                                        >
                                            <option value="ALL_PARENTS">All School Parents</option>
                                            <option value="ALL_STAFF">All School Staff</option>
                                            <option value="FEE_DEFAULTERS">Parents with Outstanding Balances</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label text-sm font-semibold">Delivery Channel <span className="text-error">*</span></label>
                                <div style={{ position: 'relative' }}>
                                    {channel === 'EMAIL' ? (
                                        <Mail size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--neutral-400)' }} />
                                    ) : (
                                        <Bell size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--neutral-400)' }} />
                                    )}
                                    <select
                                        className="form-input"
                                        style={{ paddingLeft: '40px' }}
                                        value={channel}
                                        onChange={(e) => setChannel(e.target.value)}
                                    >
                                        <option value="EMAIL">Email Blast</option>
                                        <option value="IN_APP">In-App Banner Alert</option>
                                        <option value="SMS">SMS Notification (Warning: Costly)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label text-sm font-semibold">Message Subject <span className="text-error">*</span></label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Scheduled Maintenance Notification"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label text-sm font-semibold">Message Content <span className="text-error">*</span></label>
                            <textarea
                                className="form-input"
                                rows={8}
                                placeholder="Type your broadcast message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted mt-sm">This message will be sent exactly as written.</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-lg)', marginTop: 'var(--spacing-sm)' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || !subject || !message || !isPro}
                                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Send Broadcast
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {!isPro && (
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(255,255,255,0.6)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            zIndex: 10,
                            borderRadius: 'inherit'
                        }}>
                            <div style={{ background: 'white', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', textAlign: 'center', maxWidth: '340px' }}>
                                <Megaphone size={32} style={{ color: 'var(--warning-500)', margin: '0 auto var(--spacing-md)' }} />
                                <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>Unlock School Broadcasts</h4>
                                <p className="text-sm text-muted" style={{ marginBottom: 'var(--spacing-md)' }}>Upgrade to a PRO plan to send mass emails and SMS announcements to your parents.</p>
                                <button className="btn btn-primary w-full" onClick={() => alert('Contact your Super Admin to upgrade your platform tier.')}>Upgrade Plan</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
