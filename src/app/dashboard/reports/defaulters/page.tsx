'use client'

import DashboardLayout from '@/components/DashboardLayout'
import DefaultersList from '@/components/reports/DefaultersList'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function DefaultersPage() {
    const router = useRouter()

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginBottom: 'var(--spacing-md)' }}
                    onClick={() => router.back()}
                >
                    <ArrowLeft size={16} />
                    Back to Reports
                </button>
                <DefaultersList />
            </div>
        </DashboardLayout>
    )
}
