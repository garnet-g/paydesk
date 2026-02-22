'use client'

import DashboardLayout from '@/components/DashboardLayout'
import StudentStatement from '@/components/StudentStatement'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function StudentStatementPage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <button
                    className="btn btn-ghost mb-md"
                    onClick={() => router.back()}
                >
                    <ArrowLeft size={16} className="mr-sm" /> Back
                </button>
                {id && <StudentStatement studentId={id} />}
            </div>
        </DashboardLayout>
    )
}
