'use client'

import DashboardLayout from '@/components/DashboardLayout'
import FeeStructureManager from '@/components/FeeStructureManager'

export default function FeeStructuresPage() {
    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <FeeStructureManager />
            </div>
        </DashboardLayout>
    )
}
