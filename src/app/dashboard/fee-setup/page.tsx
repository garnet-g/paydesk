'use client'

import DashboardLayout from '@/components/DashboardLayout'
import AcademicPeriodManager from '@/components/AcademicPeriodManager'
import FeeStructureManager from '@/components/FeeStructureManager'
import { useState } from 'react'
import { Calendar, Coins } from 'lucide-react'

export default function FeeSetupPage() {
    const [activeTab, setActiveTab] = useState<'periods' | 'fees'>('fees')

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Fee Setup</h2>
                        <p className="text-muted">Manage your fee structures and academic terms</p>
                    </div>

                    {/* Tab Switcher */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--neutral-100)',
                        padding: '4px',
                        borderRadius: 'var(--radius-md)',
                        gap: '4px',
                        border: '1px solid var(--border)'
                    }}>
                        <button
                            onClick={() => setActiveTab('fees')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                padding: '0.5rem 1.25rem',
                                borderRadius: 'calc(var(--radius-md) - 2px)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                background: activeTab === 'fees' ? 'white' : 'transparent',
                                color: activeTab === 'fees' ? 'var(--foreground)' : 'var(--muted-foreground)',
                                boxShadow: activeTab === 'fees' ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <Coins size={16} />
                            Fee Structures
                        </button>
                        <button
                            onClick={() => setActiveTab('periods')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                padding: '0.5rem 1.25rem',
                                borderRadius: 'calc(var(--radius-md) - 2px)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                background: activeTab === 'periods' ? 'white' : 'transparent',
                                color: activeTab === 'periods' ? 'var(--foreground)' : 'var(--muted-foreground)',
                                boxShadow: activeTab === 'periods' ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <Calendar size={16} />
                            Terms & Periods
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'periods' ? (
                        <AcademicPeriodManager />
                    ) : (
                        <FeeStructureManager />
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
