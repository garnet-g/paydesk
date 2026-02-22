'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { GraduationCap, ChevronLeft, Save, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ExamResultsEntryPage() {
    const params = useParams()
    const router = useRouter()
    const examId = params.id as string

    const [exam, setExam] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [subjects, setSubjects] = useState<string[]>(['Mathematics', 'English', 'Swahili', 'Science', 'Social Studies'])
    const [scores, setScores] = useState<any>({}) // { studentId: { subject: score } }
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [examId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [examRes, studentsRes] = await Promise.all([
                fetch('/api/exams'), // We'll filter in JS for now
                fetch('/api/students')
            ])

            if (examRes.ok) {
                const exams = await examRes.json()
                const currentExam = exams.find((e: any) => e.id === examId)
                setExam(currentExam)

                // Pre-populate scores if they exist
                const existingScores: any = {}
                currentExam.results.forEach((r: any) => {
                    if (!existingScores[r.studentId]) existingScores[r.studentId] = {}
                    existingScores[r.studentId][r.subject] = r.score
                })
                setScores(existingScores)
            }

            if (studentsRes.ok) setStudents(await studentsRes.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleScoreChange = (studentId: string, subject: string, value: string) => {
        setScores({
            ...scores,
            [studentId]: {
                ...(scores[studentId] || {}),
                [subject]: value
            }
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const results = []
            for (const studentId in scores) {
                for (const subject in scores[studentId]) {
                    const score = parseFloat(scores[studentId][subject])
                    if (!isNaN(score)) {
                        results.push({
                            studentId,
                            subject,
                            score,
                            maxScore: 100, // Default max score
                            remarks: ''
                        })
                    }
                }
            }

            const res = await fetch(`/api/exams/${examId}/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results })
            })

            if (res.ok) {
                alert('Results saved successfully')
                router.push('/dashboard/academics')
            } else {
                alert('Failed to save results')
            }
        } catch (err) {
            console.error(err)
            alert('Error saving results')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <DashboardLayout><div className="spinner mx-auto" /></DashboardLayout>

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="flex justify-between items-end mb-xl">
                    <div>
                        <button onClick={() => router.back()} className="text-primary-600 flex items-center gap-xs mb-sm no-underline hover:underline text-sm font-bold">
                            <ChevronLeft size={16} /> Back
                        </button>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-900)', letterSpacing: '-0.025em' }}>
                            {exam?.name}
                        </h2>
                        <p className="text-muted font-medium uppercase text-[10px] tracking-widest">Mark Sheet Registry</p>
                    </div>
                    <button
                        className="btn btn-primary px-xl shadow-xl shadow-primary-100 font-black uppercase text-xs tracking-widest flex items-center gap-md"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : <><Save size={18} /> Commit to Ledger</>}
                    </button>
                </div>

                <div className="card overflow-x-auto p-0 border-none shadow-2xl">
                    <table className="table-modern w-full border-collapse">
                        <thead>
                            <tr className="bg-neutral-900 text-white">
                                <th className="p-lg text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10 sticky left-0 bg-neutral-900 z-10 w-64">Student Registry</th>
                                {subjects.map(subject => (
                                    <th key={subject} className="p-lg text-center text-[10px] font-black uppercase tracking-widest border-r border-white/10 min-w-[120px]">
                                        {subject}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {students.map(student => (
                                <tr key={student.id} className="hover:bg-primary-50/30 transition-colors group">
                                    <td className="p-md sticky left-0 bg-white group-hover:bg-primary-50/50 z-10 border-r border-neutral-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="font-bold text-primary-900 truncate">{student.firstName} {student.lastName}</div>
                                        <div className="text-[9px] font-bold text-muted uppercase">{student.admissionNumber}</div>
                                    </td>
                                    {subjects.map(subject => (
                                        <td key={subject} className="p-md text-center border-r border-neutral-50 last:border-r-0">
                                            <input
                                                type="number"
                                                className="form-input text-center font-black p-xs bg-transparent border-transparent hover:border-neutral-200 focus:bg-white focus:border-primary-500 transition-all text-sm w-20 mx-auto"
                                                placeholder="-"
                                                min="0"
                                                max="100"
                                                value={scores[student.id]?.[subject] || ''}
                                                onChange={(e) => handleScoreChange(student.id, subject, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    )
}
