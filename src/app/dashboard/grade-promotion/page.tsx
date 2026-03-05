'use client'

import DashboardLayout from '@/components/DashboardLayout'
import GradePromotionPanel from '@/components/GradePromotionPanel'
import { GraduationCap, Info } from 'lucide-react'
import Link from 'next/link'

export default function GradePromotionPage() {
    return (
        <DashboardLayout>
            <div className="animate-fade-in max-w-3xl mx-auto">
                {/* Page Header */}
                <div className="mb-xl">
                    <div className="flex items-center gap-md mb-sm">
                        <div style={{
                            width: 44, height: 44, borderRadius: '14px',
                            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px var(--primary-200)'
                        }}>
                            <GraduationCap size={22} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Grade Promotion</h1>
                            <p className="text-muted-foreground text-sm">Move students between classes at end of term or academic year</p>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="card mb-xl" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)', boxShadow: 'none' }}>
                    <div className="flex items-start gap-md">
                        <Info size={18} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p className="font-bold text-sm mb-xs" style={{ color: 'var(--primary-800)' }}>How Grade Promotion Works</p>
                            <ol className="text-sm space-y-xs" style={{ color: 'var(--primary-700)', paddingLeft: '1.2rem' }}>
                                <li>You select the source class and target class, then choose which students to promote.</li>
                                <li>A <strong>pending approval request</strong> is created — no students are moved yet.</li>
                                <li>A principal must <strong>approve</strong> the request from the{' '}
                                    <Link href="/dashboard/payments" style={{ color: 'var(--primary-600)', fontWeight: 700 }}>
                                        Payments page
                                    </Link> (Pending Approvals section).
                                </li>
                                <li>On approval, students are moved and new invoices are <strong>auto-generated</strong> based on the target class fees.</li>
                                <li>All previous fee bills and payment history are <strong>permanently preserved</strong>.</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <GradePromotionPanel />
            </div>
        </DashboardLayout>
    )
}
