'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { GraduationCap, ChevronLeft, Award, BookOpen, BarChart } from 'lucide-react'
import Link from 'next/link'

export default function StudentResultsPage() {
    const params = useParams()
    const studentId = params.id as string
    const [exams, setExams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchResults()
    }, [studentId])

    const fetchResults = async () => {
        try {
            const res = await fetch('/api/exams')
            if (res.ok) {
                const data = await res.json()
                // Filter exams that have results for this student
                const filtered = data.map((exam: any) => ({
                    ...exam,
                    results: exam.results.filter((r: any) => r.studentId === studentId)
                })).filter((exam: any) => exam.results.length > 0)

                setExams(filtered)
            }
        } catch (error) {
            console.error('Failed to fetch results:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <Link href="/dashboard/children" className="text-primary-600 flex items-center gap-xs mb-sm no-underline hover:underline">
                        <ChevronLeft size={16} /> Back to Children
                    </Link>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>Academic Progress</h2>
                    <p className="text-muted">Examination results and subject-wise performance</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-2xl">
                        <div className="spinner"></div>
                    </div>
                ) : exams.length === 0 ? (
                    <div className="card text-center py-2xl">
                        <GraduationCap size={48} className="mx-auto text-muted opacity-20 mb-md" />
                        <p>No examination results found for this student.</p>
                    </div>
                ) : (
                    <div className="space-y-xl">
                        {exams.map(exam => (
                            <div key={exam.id} className="card p-0 overflow-hidden">
                                <div className="p-lg bg-neutral-900 text-white flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight">{exam.name}</h3>
                                        <p className="text-[10px] font-bold text-white/50 uppercase">{exam.academicPeriod.term} • {exam.academicPeriod.academicYear}</p>
                                    </div>
                                    <Award size={24} className="text-warning-500" />
                                </div>
                                <div className="p-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                                        {exam.results.map((result: any) => (
                                            <div key={result.id} className="p-md bg-neutral-50 rounded-2xl border border-neutral-100 flex justify-between items-center">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-muted mb-xs flex items-center gap-xs">
                                                        <BookOpen size={10} /> {result.subject}
                                                    </div>
                                                    <div className="text-xl font-black text-primary-900">
                                                        {Number(result.score)} / {Number(result.maxScore)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-primary-600">{result.grade || '-'}</div>
                                                    <div className="text-[9px] font-bold text-muted uppercase">Grade</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {exam.results.length > 0 && (
                                        <div className="mt-lg pt-lg border-t border-dashed border-neutral-200 flex justify-between items-center">
                                            <div className="flex items-center gap-sm">
                                                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                                                    <BarChart size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-primary-900">Aggregate Score</div>
                                                    <div className="text-xs text-muted">
                                                        Average: {(exam.results.reduce((s: any, r: any) => s + Number(r.score), 0) / exam.results.length).toFixed(1)}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href={`/dashboard/reports/result-slip/${exam.id}?studentId=${studentId}`} className="btn btn-ghost text-xs font-black uppercase tracking-widest">
                                                Print Result Slip
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
