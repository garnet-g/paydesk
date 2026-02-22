'use client'

import DashboardLayout from '@/components/DashboardLayout'
import ClassManager from '@/components/ClassManager'

export default function ClassesPage() {
    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <ClassManager />
            </div>
        </DashboardLayout>
    )
}
