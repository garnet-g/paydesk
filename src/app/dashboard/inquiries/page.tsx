'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { MessageSquare, Send, CheckCircle, Clock, Plus, X } from 'lucide-react'

export default function InquiriesPage() {
    const { data: session } = useSession()
    const [inquiries, setInquiries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewModal, setShowNewModal] = useState(false)
    const [newInquiry, setNewInquiry] = useState({ subject: '', message: '' })
    const [submitting, setSubmitting] = useState(false)
    const [replyingTo, setReplyingTo] = useState<any>(null)
    const [replyMessage, setReplyMessage] = useState('')

    const isPrincipal = session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        if (session) {
            fetchInquiries()
        }
    }, [session])

    const fetchInquiries = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/inquiries')
            if (res.ok) {
                const data = await res.json()
                setInquiries(data)
            }
        } catch (error) {
            console.error('Failed to fetch inquiries:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newInquiry.subject || !newInquiry.message) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newInquiry)
            })

            if (res.ok) {
                setNewInquiry({ subject: '', message: '' })
                setShowNewModal(false)
                fetchInquiries()
            } else {
                alert('Failed to send inquiry')
            }
        } catch (error) {
            alert('Error sending inquiry')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!replyMessage) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/inquiries/${replyingTo.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    response: replyMessage,
                    status: 'RESOLVED'
                })
            })

            if (res.ok) {
                setReplyMessage('')
                setReplyingTo(null)
                fetchInquiries()
            } else {
                alert('Failed to send reply')
            }
        } catch (error) {
            alert('Error sending reply')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <div className="spinner"></div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>
                            {session?.user.role === 'PARENT' ? 'My Inquiries' : 'Inquiries & Support'}
                        </h2>
                        <p className="text-muted">
                            {isPrincipal ? 'Respond to parent concerns and fee disputes' : 'Communicate with the school administration'}
                        </p>
                    </div>
                    {session?.user.role === 'PARENT' && (
                        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
                            <Plus size={18} />
                            New Inquiry
                        </button>
                    )}
                </div>

                {/* Inquiry List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {inquiries.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                            <div style={{
                                width: '64px', height: '64px',
                                background: 'var(--neutral-50)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto var(--spacing-md)'
                            }}>
                                <MessageSquare size={28} style={{ color: 'var(--neutral-300)' }} />
                            </div>
                            <h3 className="font-semibold" style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-xs)' }}>No inquiries yet</h3>
                            <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0 auto' }}>
                                {isPrincipal
                                    ? 'Once parents send concerns or disputes, they will appear here.'
                                    : 'Submit a new inquiry to reach the school administration.'}
                            </p>
                        </div>
                    ) : (
                        inquiries.map(inquiry => (
                            <div key={inquiry.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Inquiry Header */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: 'var(--spacing-md) var(--spacing-lg)',
                                    background: 'var(--neutral-50)',
                                    borderBottom: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        <div style={{
                                            width: '32px', height: '32px',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: inquiry.status === 'RESOLVED' ? 'var(--success-50)' : 'var(--warning-50)',
                                            color: inquiry.status === 'RESOLVED' ? 'var(--success-600)' : 'var(--warning-600)'
                                        }}>
                                            {inquiry.status === 'RESOLVED' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{inquiry.subject}</div>
                                            <div className="text-xs text-muted">
                                                {isPrincipal ? (
                                                    <span>From <span style={{ color: 'var(--primary-600)' }}>{inquiry.user?.firstName} {inquiry.user?.lastName}</span></span>
                                                ) : (
                                                    <span>Sent to Administration</span>
                                                )}
                                                {' • '}
                                                {new Date(inquiry.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`badge ${inquiry.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>
                                        {inquiry.status}
                                    </span>
                                </div>

                                {/* Messages */}
                                <div style={{ padding: 'var(--spacing-lg)' }}>
                                    {/* Parent's message */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: inquiry.response ? 'var(--spacing-md)' : 0 }}>
                                        <div style={{
                                            width: '32px', height: '32px', flexShrink: 0,
                                            borderRadius: '50%',
                                            background: 'var(--neutral-100)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.6875rem', fontWeight: 600,
                                            color: 'var(--muted-foreground)'
                                        }}>
                                            {inquiry.user?.firstName?.[0] || 'U'}
                                        </div>
                                        <div style={{
                                            background: 'var(--neutral-50)',
                                            padding: 'var(--spacing-md)',
                                            borderRadius: '0 var(--radius-lg) var(--radius-lg) var(--radius-lg)',
                                            fontSize: '0.875rem',
                                            lineHeight: 1.6,
                                            maxWidth: '80%'
                                        }}>
                                            {inquiry.message}
                                        </div>
                                    </div>

                                    {/* Admin reply */}
                                    {inquiry.response && (
                                        <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 'var(--spacing-sm)' }}>
                                            <div style={{
                                                width: '32px', height: '32px', flexShrink: 0,
                                                borderRadius: '50%',
                                                background: 'var(--primary-600)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.6875rem', fontWeight: 600,
                                                color: 'white'
                                            }}>
                                                A
                                            </div>
                                            <div style={{
                                                background: 'var(--primary-600)',
                                                color: 'white',
                                                padding: 'var(--spacing-md)',
                                                borderRadius: 'var(--radius-lg) 0 var(--radius-lg) var(--radius-lg)',
                                                fontSize: '0.875rem',
                                                lineHeight: 1.6,
                                                maxWidth: '80%'
                                            }}>
                                                <div style={{ fontSize: '0.6875rem', opacity: 0.7, marginBottom: '4px' }}>
                                                    School Administration
                                                </div>
                                                {inquiry.response}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reply CTA */}
                                    {!inquiry.response && isPrincipal && (
                                        <div style={{
                                            marginTop: 'var(--spacing-lg)',
                                            paddingTop: 'var(--spacing-md)',
                                            borderTop: '1px solid var(--border)',
                                            display: 'flex', justifyContent: 'flex-end'
                                        }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => setReplyingTo(inquiry)}
                                            >
                                                <Send size={14} />
                                                Respond
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* New Inquiry Modal */}
            {session?.user.role === 'PARENT' && showNewModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewModal(false) }}>
                    <form onSubmit={handleSubmit} className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">New Inquiry</h3>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="Brief summary of your inquiry"
                                    value={newInquiry.subject}
                                    onChange={(e) => setNewInquiry({ ...newInquiry, subject: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <textarea
                                    className="form-textarea"
                                    required
                                    placeholder="Detailed explanation..."
                                    style={{ minHeight: '120px' }}
                                    value={newInquiry.message}
                                    onChange={(e) => setNewInquiry({ ...newInquiry, message: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Sending...' : (
                                    <>
                                        <Send size={16} />
                                        Send Inquiry
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reply Modal */}
            {replyingTo && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setReplyingTo(null) }}>
                    <form onSubmit={handleReplySubmit} className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Reply to Inquiry</h3>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReplyingTo(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{
                                background: 'var(--neutral-50)',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-md)',
                                border: '1px solid var(--border)'
                            }}>
                                <div className="text-xs text-muted" style={{ marginBottom: '4px', fontWeight: 600 }}>Original Message:</div>
                                <p className="text-sm" style={{ fontStyle: 'italic', margin: 0 }}>{replyingTo.message}</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Your Response</label>
                                <textarea
                                    className="form-textarea"
                                    required
                                    placeholder="Type your reply here..."
                                    style={{ minHeight: '120px' }}
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setReplyingTo(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Sending...' : 'Send Reply & Resolve'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </DashboardLayout>
    )
}
