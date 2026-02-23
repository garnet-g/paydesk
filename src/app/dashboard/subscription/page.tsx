'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    CreditCard,
    ShieldCheck,
    Zap,
    Calendar,
    Smartphone,
    ArrowRight,
    Loader2,
    History,
    FileText,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function SubscriptionPage() {
    const { data: session } = useSession()
    const [school, setSchool] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [paying, setPaying] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle')

    useEffect(() => {
        fetchSchoolDetails()
    }, [])

    const fetchSchoolDetails = async () => {
        try {
            const res = await fetch('/api/schools/my-school')
            if (res.ok) {
                const data = await res.json()
                setSchool(data)
                // Pre-fill phone if available
                if (data.phoneNumber) setPhoneNumber(data.phoneNumber.replace('+', ''))
            }
        } catch (error) {
            console.error('Failed to fetch school details:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async () => {
        if (!phoneNumber) return alert('Please enter a phone number')

        setPaying(true)
        setPaymentStatus('idle')

        try {
            const res = await fetch('/api/billing/saas/stk-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: school.subscriptionFee,
                    phoneNumber
                })
            })

            if (res.ok) {
                setPaymentStatus('success')
                alert('M-Pesa STK Push sent! Please enter your PIN on your phone.')
            } else {
                setPaymentStatus('error')
                alert('Payment initiation failed. Please try again.')
            }
        } catch (error) {
            setPaymentStatus('error')
            alert('An error occurred. Please check your connection.')
        } finally {
            setPaying(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                </div>
            </DashboardLayout>
        )
    }

    const isPastDue = school?.planStatus === 'PAST_DUE'

    return (
        <DashboardLayout>
            <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Platform Subscription</h2>
                    <p className="text-muted">Manage your institutional access and platform billing</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
                    {/* Plan Details Card */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card"
                            style={{
                                background: isPastDue ? 'linear-gradient(135deg, #fff 0%, #fff1f1 100%)' : 'white',
                                borderColor: isPastDue ? 'var(--error-200)' : 'var(--neutral-100)',
                                padding: 'var(--spacing-2xl)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isPastDue && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--error-600)', color: 'white', padding: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                    Subscription Past Due - Action Required
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isPastDue ? '20px' : 0 }}>
                                <div>
                                    <span className="badge badge-primary" style={{ marginBottom: '12px', fontWeight: 800 }}>{school.planTier} Plan</span>
                                    <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>KES {Number(school.subscriptionFee).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--neutral-400)', fontWeight: 400 }}>/ month</span></h3>
                                </div>
                                <Zap size={48} className={isPastDue ? 'text-error-500' : 'text-primary-500'} style={{ opacity: 0.2 }} />
                            </div>

                            <div style={{ marginTop: 'var(--spacing-2xl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-600)' }}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Billing Cycle</p>
                                        <p style={{ fontWeight: 700 }}>{school.billingCycle || 'Monthly'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-600)' }}>
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Plan Status</p>
                                        <p style={{ fontWeight: 700, color: isPastDue ? 'var(--error-600)' : 'var(--success-600)' }}>{school.planStatus}</p>
                                    </div>
                                </div>
                            </div>

                            <hr style={{ margin: 'var(--spacing-2xl) 0', border: 'none', borderTop: '1px solid var(--neutral-100)' }} />

                            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--neutral-400)' }}>What's included in your plan</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <FeatureItem text="Unlimited Students" />
                                <FeatureItem text="Unlimited Parent Portals" />
                                <FeatureItem text="M-Pesa Automation" />
                                <FeatureItem text="Financial Analytics" />
                                <FeatureItem text="Academic Reports" />
                                <FeatureItem text="Bulk Communication" />
                            </div>
                        </motion.div>

                        {/* Payment History Placeholder */}
                        <div className="card" style={{ marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <History size={20} className="text-muted" />
                                <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Recent Platform Payments</h4>
                            </div>
                            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                <FileText size={32} style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontSize: '0.875rem' }}>Your payment history will appear here.</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Sandbox Sidebar */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="card shadow-soft"
                            style={{
                                padding: 'var(--spacing-xl)',
                                border: 'none',
                                background: isPastDue ? 'var(--error-50)' : 'var(--primary-50)',
                                borderTop: `4px solid ${isPastDue ? 'var(--error-500)' : 'var(--primary-500)'}`
                            }}
                        >
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Pay Subscription</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginBottom: '24px' }}>
                                Instant activation via M-Pesa STK Push. Enter your phone and authorize with your PIN.
                            </p>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--neutral-500)' }}>
                                    M-Pesa Phone Number
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Smartphone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--neutral-400)' }} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="2547XXXXXXXX"
                                        style={{ paddingLeft: '40px', background: 'white' }}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                className={`btn w-full ${isPastDue ? 'btn-error' : 'btn-primary'}`}
                                style={{ height: '48px', fontSize: '1rem', fontWeight: 800 }}
                                onClick={handlePayment}
                                disabled={paying}
                            >
                                {paying ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} /> Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay KES {Number(school.subscriptionFee).toLocaleString()} <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.6 }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 size={16} className="text-success-500" />
                                </div>
                                <p style={{ fontSize: '0.7rem', margin: 0 }}>Secure payment processed by M-Pesa Daraja Gateway</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

function FeatureItem({ text }: { text: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--success-50)', color: 'var(--success-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={12} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{text}</span>
        </div>
    )
}
