'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Printer, ChevronLeft, Award, BookOpen, User, School as SchoolIcon } from 'lucide-react'

export default function ResultSlipPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const examId = params.examId as string
    const studentId = searchParams.get('studentId')

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (examId && studentId) {
            fetchResultSlip()
        }
    }, [examId, studentId])

    const fetchResultSlip = async () => {
        try {
            // We'll use a specialized endpoint or just fetch and filter
            const res = await fetch(`/api/exams/${examId}/results?studentId=${studentId}`)
            if (res.ok) {
                setData(await res.json())
            }
        } catch (error) {
            console.error('Failed to fetch:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="spinner" /></div>
    if (!data) return <div className="h-screen flex flex-col items-center justify-center gap-md">
        <p>Could not generate result slip. Data missing.</p>
        <button className="btn btn-secondary" onClick={() => router.back()}>Go Back</button>
    </div>

    const { exam, student, results, school } = data

    return (
        <div className="min-h-screen bg-neutral-50 p-md md:p-2xl print:bg-white print:p-0">
            {/* Toolbar - Hidden during print */}
            <div className="max-w-4xl mx-auto mb-xl flex justify-between items-center print:hidden">
                <button className="btn btn-ghost flex items-center gap-sm font-bold text-xs uppercase" onClick={() => router.back()}>
                    <ChevronLeft size={16} /> Back
                </button>
                <button className="btn btn-primary flex items-center gap-sm font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary-100 px-lg" onClick={() => window.print()}>
                    <Printer size={18} /> Print Record
                </button>
            </div>

            {/* Document Body */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl border border-neutral-100 overflow-hidden print:shadow-none print:border-none">
                {/* Header Section */}
                <div className="p-2xl bg-neutral-900 text-white flex justify-between items-start">
                    <div className="flex items-center gap-xl">
                        {school.logoUrl ? (
                            <img src={school.logoUrl} alt="Logo" className="w-20 h-20 object-contain bg-white rounded-xl p-2" />
                        ) : (
                            <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center text-white/20">
                                <SchoolIcon size={40} />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">{school.name}</h1>
                            <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Official Academic Registry • Performance Record</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="px-4 py-2 bg-warning-500 text-neutral-900 text-[10px] font-black uppercase tracking-widest rounded-full inline-block mb-2">Internal Assessment</div>
                        <div className="text-[10px] text-white/50 font-bold uppercase">{formatDate(new Date())}</div>
                    </div>
                </div>

                {/* Sub-Header: Student Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-100 border-b border-neutral-100 bg-neutral-50/50">
                    <div className="p-xl text-center">
                        <div className="text-[10px] font-black uppercase text-muted mb-1">Student Name</div>
                        <div className="font-black text-primary-900 leading-tight">{student.firstName} {student.lastName}</div>
                    </div>
                    <div className="p-xl text-center">
                        <div className="text-[10px] font-black uppercase text-muted mb-1">Admission #</div>
                        <div className="font-mono text-sm font-black text-primary-600">{student.admissionNumber}</div>
                    </div>
                    <div className="p-xl text-center">
                        <div className="text-[10px] font-black uppercase text-muted mb-1">Assessment</div>
                        <div className="font-black text-primary-900 uppercase leading-tight">{exam.name}</div>
                    </div>
                    <div className="p-xl text-center">
                        <div className="text-[10px] font-black uppercase text-muted mb-1">Cycle</div>
                        <div className="font-bold text-primary-700">{exam.academicPeriod.term} {exam.academicPeriod.academicYear}</div>
                    </div>
                </div>

                {/* Performance Breakdown */}
                <div className="p-2xl">
                    <div className="flex items-center gap-sm mb-xl">
                        <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                            <BookOpen size={20} />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-primary-900">Subject-Wise Performance</h2>
                    </div>

                    <div className="space-y-sm">
                        <div className="grid grid-cols-6 px-lg py-sm text-[10px] font-black uppercase text-muted tracking-widest bg-neutral-50 rounded-lg">
                            <div className="col-span-3">Subject Module</div>
                            <div className="text-center">Score</div>
                            <div className="text-center">Grade</div>
                            <div className="text-right">Remarks</div>
                        </div>

                        {results.map((r: any) => (
                            <div key={r.id} className="grid grid-cols-6 px-lg py-md border-b border-neutral-50 items-center hover:bg-neutral-50/30 transition-colors">
                                <div className="col-span-3">
                                    <div className="font-bold text-primary-900">{r.subject}</div>
                                    <div className="text-[9px] text-muted uppercase font-medium">Standard Assessment</div>
                                </div>
                                <div className="text-center font-black text-primary-900">
                                    {Number(r.score)}<span className="text-muted text-[10px] font-medium ml-1">/ {Number(r.maxScore)}</span>
                                </div>
                                <div className="text-center flex justify-center">
                                    <div className="w-8 h-8 rounded-lg bg-primary-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-primary-100">
                                        {r.grade || 'N/A'}
                                    </div>
                                </div>
                                <div className="text-right text-[10px] font-medium italic text-muted italic">
                                    {r.comment || 'Good performance'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Aggregate Summary */}
                    <div className="mt-2xl grid grid-cols-1 md:grid-cols-3 gap-xl">
                        <div className="bg-neutral-900 rounded-2xl p-xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-md opacity-10 scale-150 text-white">
                                <Award size={60} />
                            </div>
                            <div className="text-[10px] font-black uppercase text-white/50 mb-2">Aggregate Status</div>
                            <div className="text-4xl font-black text-white mb-2 leading-none">
                                {(results.reduce((s: number, r: any) => s + Number(r.score), 0) / results.length).toFixed(1)}
                            </div>
                            <div className="text-[10px] font-bold text-warning-400 uppercase tracking-widest transition-all group-hover:tracking-widest">Distinction Level Performance</div>
                        </div>

                        <div className="col-span-2 border-2 border-dashed border-neutral-200 rounded-2xl p-xl flex flex-col justify-center italic">
                            <div className="text-[10px] font-black uppercase text-muted mb-4 not-italic">Institutional Remarks</div>
                            <p className="text-primary-900 font-medium">
                                The student has demonstrated a strong aptitude for critical thinking. Recommended to continue with the current academic rhythm. Financial status: <span className="text-success-600 font-bold uppercase">{student.balance <= 0 ? 'Clearance Guaranteed' : 'Statement Pending'}</span>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer / Authentication */}
                <div className="p-xl bg-neutral-50 border-t border-neutral-100 flex justify-between items-center mt-xl">
                    <div className="flex items-center gap-lg">
                        <div className="text-center">
                            <div className="w-32 border-b border-primary-900 mb-2 h-10"></div>
                            <div className="text-[8px] font-black uppercase text-muted">Academic Registrar</div>
                        </div>
                        <div className="text-center">
                            <div className="w-32 border-b border-primary-900 mb-2 h-10"></div>
                            <div className="text-[8px] font-black uppercase text-muted">Institutional Seal</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] font-black text-primary-900 uppercase">Verification ID</div>
                        <div className="text-[10px] font-mono font-bold text-muted">{exam.id.slice(0, 8)}-{(studentId || '').slice(0, 8)}</div>
                    </div>
                </div>
            </div>

            {/* Print Signature Info */}
            <div className="hidden print:block mt-xl text-center text-[10px] text-muted italic font-medium">
                This is a digitally generated document from the Internal Academic Management System. Valid without physical signature.
            </div>

            <style jsx>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    )
}
