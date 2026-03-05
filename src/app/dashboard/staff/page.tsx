'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Search, Trash2, Mail, Phone, Loader2, ShieldAlert } from 'lucide-react'
import AddStaffForm from '@/components/forms/AddStaffForm'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function StaffPage() {
    const { data: session } = useSession()
    const [staff, setStaff] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/staff')
            if (res.ok) {
                const data = await res.json()
                setStaff(data)
            } else {
                toast.error("Failed to fetch staff directory")
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error)
            toast.error("Network error while loading staff")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from the staff directory?`)) return

        try {
            const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Staff member removed successfully")
                fetchStaff()
            } else {
                toast.error('Failed to remove staff member')
            }
        } catch (error) {
            toast.error('An error occurred during removal')
        }
    }

    if (session?.user?.role !== 'PRINCIPAL' && session?.user?.role !== 'SUPER_ADMIN') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-in fade-in duration-500">
                    <div className="h-24 w-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                        <ShieldAlert size={40} />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 text-center">Access Restricted</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                        You do not have the required permissions to access the Staff & Payroll module.
                    </p>
                    <Button variant="outline" className="mt-8 rounded-xl font-medium" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    const filteredStaff = staff.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Staff Management</h2>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Manage staff directory and payroll
                        </p>
                    </div>
                    <Button
                        className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-none dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={16} className="mr-2" />
                        Add Staff
                    </Button>
                </div>

                {/* Staff Cards Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="inline-flex items-center gap-3">
                            <Loader2 className="animate-spin text-slate-400" size={24} />
                            <span className="text-sm text-slate-500">Loading staff directory...</span>
                        </div>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed">
                        <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
                            <Search size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No staff found</h3>
                        <p className="text-slate-500 text-sm">No employees match your search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStaff.map((member) => (
                            <Card key={member.id} className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all shadow-sm bg-white dark:bg-slate-950">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 font-semibold flex items-center justify-center">
                                                {member.firstName[0]}{member.lastName[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white capitalize">{member.firstName} {member.lastName}</h3>
                                                <p className="text-sm text-slate-500 capitalize">{member.role.replace('_', ' ').toLowerCase()}</p>
                                            </div>
                                        </div>
                                        {member.id !== session.user.id && member.role !== 'PRINCIPAL' && (
                                            <button
                                                onClick={() => handleDelete(member.id, `${member.firstName} ${member.lastName}`)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-2 -mr-2 -mt-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10"
                                                title="Remove Staff"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-6 mb-6">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Employee ID</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                EMP{member.id.substring(0, 3).toUpperCase()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Salary</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                KES {member.salary ? member.salary.toLocaleString() : '60,000'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <p className="text-xs text-slate-500 mb-2">Subjects</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {/* Example Badges for design replica */}
                                            <Badge variant="outline" className="font-medium bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-sm rounded-full px-3 py-0.5">Mathematics</Badge>
                                            <Badge variant="outline" className="font-medium bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-sm rounded-full px-3 py-0.5">Physics</Badge>
                                            {/* For dynamic subjects later */}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-0.5">Latest Payroll</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">February 2026</p>
                                        </div>
                                        <div className="bg-slate-950 text-white font-semibold text-[10px] px-3 py-1 rounded-full  tracking-wider dark:bg-slate-50 dark:text-slate-900">
                                            Paid
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 rounded-3xl shadow-xl">
                        <AddStaffForm
                            onClose={() => setShowAddModal(false)}
                            onSuccess={fetchStaff}
                        />
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
