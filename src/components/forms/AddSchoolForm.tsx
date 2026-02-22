'use client'

import { useState } from 'react'
import { School, MapPin, Phone, Mail, User, GraduationCap } from 'lucide-react'

interface AddSchoolFormProps {
    onClose: () => void
    onSuccess: () => void
}

export default function AddSchoolForm({ onClose, onSuccess }: AddSchoolFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phoneNumber: '',
        email: '',
        curriculumType: 'CBC',
        principalName: '',
        principalEmail: '',
        principalPhone: '',
        planTier: 'FREE',
        subscriptionFee: 0
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/schools', {
                method: 'POST',
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
            alert('Failed to add school')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '650px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title flex items-center gap-sm">
                        <School className="text-primary" size={24} />
                        Register New School
                    </h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
                >
                    <div className="modal-body">
                        <div className="grid grid-cols-2 gap-md">
                            <div className="form-group">
                                <label className="form-label">School Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="e.g. Sunshine Academy"
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
                                    placeholder="e.g. SCH001"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-md">
                            <div className="form-group">
                                <label className="form-label">Official Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="info@school.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        pattern="^[a-zA-Z0-9._%+-]+@(?!(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com|icloud\.com|mail\.com|zoho\.com|protonmail\.com)$)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                        title="Please provide an official school domain email address. Public providers like Gmail or Yahoo are not permitted."
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">School Phone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="254..."
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <textarea
                                className="form-input"
                                placeholder="P.O Box..."
                                rows={2}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Curriculum Type</label>
                            <select
                                className="form-input"
                                value={formData.curriculumType}
                                onChange={(e) => setFormData({ ...formData, curriculumType: e.target.value })}
                            >
                                <option value="CBC">CBC (Competency-Based Curriculum) - PP1 to Grade 12</option>
                                <option value="CAMBRIDGE">Cambridge - Primary to A-Levels</option>
                                <option value="IB">IB (International Baccalaureate) - PYP/MYP/DP</option>
                                <option value="8-4-4">8-4-4 System (Legacy)</option>
                                <option value="CUSTOM">Custom/Other</option>
                            </select>
                            <p className="form-hint" style={{ marginTop: 'var(--spacing-xs)' }}>
                                This determines the available grade levels when creating classes.
                            </p>
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

                        <div style={{ padding: 'var(--spacing-md)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-sm)' }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={18} /> Principal Account Details
                            </h4>

                            <div className="form-group">
                                <label className="form-label">Principal Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required={!!formData.principalEmail}
                                    placeholder="e.g. John Doe"
                                    value={formData.principalName}
                                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Principal Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        required={!!formData.principalName}
                                        placeholder="principal@school.com"
                                        value={formData.principalEmail}
                                        onChange={(e) => setFormData({ ...formData, principalEmail: e.target.value })}
                                        pattern="^[a-zA-Z0-9._%+-]+@(?!(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com|icloud\.com|mail\.com|zoho\.com|protonmail\.com)$)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                        title="Please provide an official school domain email address. Public providers like Gmail or Yahoo are not permitted."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Principal Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Personal phone"
                                        value={formData.principalPhone}
                                        onChange={(e) => setFormData({ ...formData, principalPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="form-hint" style={{ color: 'var(--primary-600)' }}>
                                The default password will be: <strong>[School Name]@123</strong>
                            </p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Registering...' : 'Register School & Principal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
