'use client'

import { useState } from 'react'
import { X, Briefcase, Mail, Phone, User as UserIcon, Save, KeyRound } from 'lucide-react'

interface AddStaffFormProps {
    onClose: () => void
    onSuccess: () => void
}

export default function AddStaffForm({ onClose, onSuccess }: AddStaffFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'FINANCE_MANAGER'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                onSuccess()
                onClose()
            } else {
                const data = await res.text()
                setError(data || 'Failed to add staff member')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Register Staff Member</h3>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-md">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="finance@school.ac.ke"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                pattern="^[a-zA-Z0-9._%+-]+@(?!(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com|icloud\.com|mail\.com|zoho\.com|protonmail\.com)$)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                title="Please provide an official school domain email address. Public providers like Gmail or Yahoo are not permitted."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="e.g. 0712345678"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">System Role</label>
                            <select
                                className="form-input"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                required
                            >
                                <option value="FINANCE_MANAGER">Finance Manager</option>
                            </select>
                            <p className="form-hint">Finance managers can view payments, invoices, and process approvals.</p>
                        </div>

                        <div className="alert alert-info">
                            <KeyRound size={18} />
                            <div>
                                <div className="font-semibold" style={{ marginBottom: '2px' }}>Default Password</div>
                                <p className="text-sm" style={{ margin: 0 }}>Temporary password: <strong>password123</strong>. User will be prompted to change it on first login.</p>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                            ) : (
                                <><Save size={18} /> Create Account</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
