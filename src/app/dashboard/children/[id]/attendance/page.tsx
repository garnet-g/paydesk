'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Calendar, ChevronLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function StudentAttendancePage() {
    const params = useParams()
    const studentId = params.id as string
    const [attendance, setAttendance] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAttendance()
    }, [studentId])

    const fetchAttendance = async () => {
        try {
            const res = await fetch(`/api/attendance?studentId=${studentId}`)
            if (res.ok) {
                const data = await res.json()
                setAttendance(data)
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error)
        } finally {
            setLoading(false)
        }
    }

    const stats = attendance.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
    }, {} as any)

    const totalDays = attendance.length
    const attendanceRate = totalDays > 0 ? (stats['PRESENT'] / totalDays * 100).toFixed(1) : '100'

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <Link href="/dashboard/children" className="text-primary-600 flex items-center gap-xs mb-sm no-underline hover:underline">
                        <ChevronLeft size={16} /> Back to Children
                    </Link>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Attendance Record</h2>
                    <p className="text-muted">Detailed monitoring of daily school presence</p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-lg mb-xl">
                    <div className="card p-lg text-center">
                        <div className="text-2xl font-black text-primary-900">{attendanceRate}%</div>
                        <div className="text-xs font-bold text-muted uppercase">Attendance Rate</div>
                    </div>
                    <div className="card p-lg text-center">
                        <div className="text-2xl font-black text-success-600">{stats['PRESENT'] || 0}</div>
                        <div className="text-xs font-bold text-muted uppercase">Present</div>
                    </div>
                    <div className="card p-lg text-center">
                        <div className="text-2xl font-black text-error-600">{stats['ABSENT'] || 0}</div>
                        <div className="text-xs font-bold text-muted uppercase">Absent</div>
                    </div>
                    <div className="card p-lg text-center">
                        <div className="text-2xl font-black text-warning-600">{stats['LATE'] || 0}</div>
                        <div className="text-xs font-bold text-muted uppercase">Late</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Remark / Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={3} className="text-center py-xl"><div className="spinner mx-auto"></div></td></tr>
                                ) : attendance.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-xl text-muted">No attendance logs found for this student.</td></tr>
                                ) : attendance.map(log => (
                                    <tr key={log.id}>
                                        <td className="font-medium text-sm">{formatDate(log.date)}</td>
                                        <td>
                                            <div className="flex items-center gap-sm">
                                                {log.status === 'PRESENT' && <CheckCircle size={14} className="text-success-600" />}
                                                {log.status === 'ABSENT' && <XCircle size={14} className="text-error-600" />}
                                                {log.status === 'LATE' && <Clock size={14} className="text-warning-600" />}
                                                <span className={`badge ${log.status === 'PRESENT' ? 'badge-success' :
                                                        log.status === 'ABSENT' ? 'badge-error' : 'badge-warning'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-sm text-muted">{log.reason || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
