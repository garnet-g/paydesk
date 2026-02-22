'use client'

import { useState } from 'react'

interface EditSchoolFormProps {
    school: any
    onClose: () => void
    onSuccess: () => void
}

export default function EditSchoolForm({ school, onClose, onSuccess }: EditSchoolFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: school.name || '',
        code: school.code || '',
        address: school.address || '',
        phoneNumber: school.phoneNumber || '',
        email: school.email || '',
        isActive: school.isActive ?? true,
        planTier: school.planTier || 'FREE',
        subscriptionFee: school.subscriptionFee || 0
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch(`/api/schools/${school.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                onSuccess()
                onClose()
            } else {
                const err = await res.text()
                alert('Error: ' + err)
            }
        } catch (error) {
            alert('Failed to update school')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Edit School: {school.name}</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">School Name</label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">School Code</label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Official Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            pattern="^[a-zA-Z0-9._%+-]+@(?!(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com|icloud\.com|mail\.com|zoho\.com|protonmail\.com)$)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                            title="Please provide an official school domain email address. Public providers like Gmail or Yahoo are not permitted."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            className="form-input"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-md" style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div className="form-group mb-0">
                            <label className="form-label">Plan Tier</label>
                            <select
                                className="form-input"
                                value={formData.planTier}
                                onChange={(e) => setFormData({ ...formData, planTier: e.target.value })}
                            >
                                <option value="FREE">Free</option>
                                <option value="PRO">Pro</option>
                                <option value="ENTERPRISE">Enterprise</option>
                            </select>
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">Monthly Subscription Fee (KES)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-input"
                                placeholder="e.g. 5000"
                                value={formData.subscriptionFee}
                                onChange={(e) => setFormData({ ...formData, subscriptionFee: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="form-label" style={{ margin: 0 }}>Active</label>
                    </div>

                    <div className="form-actions" style={{ marginTop: 'var(--spacing-xl)' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
