'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    School as SchoolIcon,
    Plus,
    Search,
    MapPin,
    Phone,
    Mail,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    Settings,
    KeyRound,
    Trash2,
    Edit,
    Users,
    Activity,
    Globe,
    Building2,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import AddSchoolForm from '@/components/forms/AddSchoolForm'
import EditSchoolForm from '@/components/forms/EditSchoolForm'
import { motion, AnimatePresence } from 'framer-motion'

export default function SchoolsPage() {
    const { data: session } = useSession()
    const [schools, setSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingSchool, setEditingSchool] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
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

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="alert alert-error">Unauthorized access. Only Super Admins can view this page.</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-2xl)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Building2 size={24} className="text-primary-600" />
                            <span style={{ fontSize: '0.875rem', color: 'var(--neutral-400)', fontWeight: 600 }}>/ Institution Directory</span>
                        </div>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Schools Management</h2>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ borderRadius: '12px', padding: '12px 24px', gap: '8px', fontWeight: 700 }}>
                        <Plus size={20} />
                        Register School
                    </button>
                </div>

                {/* Search and Filters */}
                <div style={{ position: 'relative', marginBottom: 'var(--spacing-xl)' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                    <input
                        type="text"
                        placeholder="Search by school name or unique code..."
                        className="form-input"
                        style={{ paddingLeft: '48px', height: '56px', borderRadius: '16px', border: '1px solid var(--neutral-200)', background: 'white', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Schools List Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {loading ? (
                        [1, 2, 3, 4, 5].map(i => <div key={i} className="card skeleton" style={{ height: '70px', borderRadius: '16px' }}></div>)
                    ) : filteredSchools.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', borderRadius: '24px', border: '2px dashed var(--neutral-200)', background: 'transparent' }}>
                            <SchoolIcon size={64} style={{ opacity: 0.1, margin: '0 auto 16px' }} />
                            <h3 style={{ fontWeight: 700, color: 'var(--neutral-400)' }}>No institutions found</h3>
                            <p className="text-muted">Try adjusting your search criteria or register a new school.</p>
                        </div>
                    ) : (
                        filteredSchools.map((school, index) => (
                            <SchoolListItem
                                key={school.id}
                                school={school}
                                index={index}
                                onEdit={() => setEditingSchool(school)}
                                onDelete={() => handleDelete(school.id, school.name)}
                                router={router}
                            />
                        ))
                    )}
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
        </DashboardLayout>
    )
}

function SchoolListItem({ school, index, onEdit, onDelete, router }: any) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card"
            style={{
                padding: 0,
                borderRadius: '16px',
                overflow: 'hidden',
                border: isExpanded ? '1px solid var(--primary-200)' : '1px solid var(--neutral-200)',
                boxShadow: isExpanded ? '0 12px 24px -10px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.01)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {/* Minimal Summary Row */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--primary-50)' : 'white'
                }}
            >
                {/* Avatar/Initial */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: school.isActive ? 'var(--primary-600)' : 'var(--neutral-200)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    marginRight: '20px',
                    flexShrink: 0
                }}>
                    {school.name[0]}
                </div>

                {/* Basic Info */}
                <div style={{ flex: 1, minWidth: 0, marginRight: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--neutral-900)', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {school.name}
                        </span>
                        {!school.isActive && <span className="badge badge-error" style={{ fontSize: '0.6rem' }}>Inactive</span>}
                    </div>
                    <code style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600 }}>{school.code}</code>
                </div>

                {/* Stats & Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hide-mobile">
                    <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-400)', marginBottom: '2px' }}>Tier</p>
                        <span className={`badge ${school.planTier === 'ENTERPRISE' ? 'badge-primary' : school.planTier === 'PRO' ? 'badge-secondary' : 'badge-neutral'}`} style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                            {school.planTier || 'FREE'}
                        </span>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-400)', marginBottom: '2px' }}>Students</p>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{school._count?.students || 0}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-400)', marginBottom: '2px' }}>Status</p>
                        {school.isActive ? <CheckCircle2 size={16} className="text-success-500" /> : <XCircle size={16} className="text-error-500" />}
                    </div>
                </div>

                {/* Expand Toggle */}
                <div style={{ marginLeft: 'auto', padding: '8px', color: 'var(--neutral-400)' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Detailed Info (Expandable) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 24px 24px', background: 'white', borderTop: '1px solid var(--neutral-100)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mt-xl">
                                {/* Contact Cluster */}
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-400)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Globe size={14} /> Contact Information
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <InfoItem icon={<MapPin size={14} />} text={school.address || 'No physical address set'} />
                                        <InfoItem icon={<Phone size={14} />} text={school.phoneNumber || 'No phone contact'} />
                                        <InfoItem icon={<Mail size={14} />} text={school.email || 'No email address'} />
                                    </div>
                                </div>

                                {/* Principal / Admin Cluster */}
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-400)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <KeyRound size={14} /> Principal Account
                                    </h4>
                                    <div style={{ padding: '16px', background: 'var(--neutral-50)', borderRadius: '12px', border: '1px solid var(--neutral-100)' }}>
                                        {school.users?.[0] ? (
                                            <>
                                                <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '8px', wordBreak: 'break-all' }}>{school.users[0].email}</p>
                                                <button
                                                    className="btn btn-ghost btn-xs text-primary"
                                                    style={{ height: '28px', fontSize: '0.7rem' }}
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        if (confirm(`Reset password for ${school.users[0].email}?`)) {
                                                            const res = await fetch(`/api/users/${school.users[0].id}/reset-password`, { method: 'POST' })
                                                            if (res.ok) alert('Password reset to: ' + school.name + '@123')
                                                            else alert('Failed to reset')
                                                        }
                                                    }}
                                                >
                                                    <Activity size={12} /> Reset Credentials
                                                </button>
                                            </>
                                        ) : (
                                            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>No principal linked to this school.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Internal Actions Cluster */}
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-400)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Settings size={14} /> Critical Actions
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                style={{ flex: 1, height: '40px', fontSize: '0.8rem', borderRadius: '10px' }}
                                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                            >
                                                <Edit size={14} /> Configure School
                                            </button>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                style={{ height: '40px', width: '40px', padding: 0, borderRadius: '10px' }}
                                                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/reports'); }}
                                            >
                                                <TrendingUp size={14} />
                                            </button>
                                        </div>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            style={{ color: 'var(--error-600)', borderColor: 'var(--error-100)', height: '40px', fontSize: '0.8rem', borderRadius: '10px' }}
                                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                        >
                                            <Trash2 size={14} /> Decommission School
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                @media (max-width: 768px) {
                    .hide-mobile {
                        display: none !important;
                    }
                }
            `}</style>
        </motion.div>
    )
}

function InfoItem({ icon, text }: { icon: any, text: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ color: 'var(--neutral-400)', marginTop: '2px' }}>{icon}</div>
            <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', fontWeight: 500 }}>{text}</span>
        </div>
    )
}
