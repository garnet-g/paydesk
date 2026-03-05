"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Save, Lock, AlertCircle, Award, CheckCircle, ChevronRight, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

import DashboardLayout from "@/components/DashboardLayout"

// Types
type Class = { id: string; name: string }
type Exam = { id: string; name: string; date: string; status: 'DRAFT' | 'FINALIZED'; academicPeriodId: string }
type ExamResult = {
    id: string
    studentId: string
    subject: string
    score: number | string | null
    maxScore: number
    grade: string | null
    remarks: string | null
    student: {
        id: string
        firstName: string
        lastName: string
        admissionNumber: string
    }
}

export default function ExamResultsEntryPage() {
    const params = useParams()
    const router = useRouter()
    const examId = params.examId as string

    const [exam, setExam] = useState<Exam | null>(null)
    const [classes, setClasses] = useState<Class[]>([])
    const [selectedClass, setSelectedClass] = useState<string>("")

    const [results, setResults] = useState<ExamResult[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Load initial data (exam details and classes)
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [examRes, classRes] = await Promise.all([
                    fetch(`/api/exams/${examId}`),
                    fetch('/api/classes')
                ])
                if (examRes.ok) setExam(await examRes.json())
                else toast.error("Exam not found")

                if (classRes.ok) {
                    const classData = await classRes.json()
                    setClasses(classData)
                    if (classData.length > 0) setSelectedClass(classData[0].id)
                }
            } catch (error) {
                toast.error("Failed to load generic data")
            } finally {
                setLoading(false)
            }
        }
        if (examId) fetchInitial()
    }, [examId])

    // Fetch results roster strictly when selectedClass changes
    useEffect(() => {
        const fetchResults = async () => {
            if (!selectedClass || !exam) return
            setLoading(true)
            try {
                const res = await fetch(`/api/exams/${examId}/results?classId=${selectedClass}`)
                if (res.ok) {
                    setResults(await res.json())
                } else {
                    toast.error("Failed to fetch roster")
                }
            } catch (error) {
                toast.error("Error loading roster")
            } finally {
                setLoading(false)
            }
        }
        fetchResults()
    }, [selectedClass, exam, examId])

    const handleResultChange = (resultId: string, field: keyof ExamResult, value: string) => {
        setResults(prev => prev.map(rec =>
            rec.id === resultId ? { ...rec, [field]: value } : rec
        ))
    }

    const handleSave = async (finalize: boolean = false) => {
        if (results.length === 0) return
        setSaving(true)
        try {
            // Only send valid scores
            const validResults = results.filter(r => r.score !== '' && r.score !== null)

            if (validResults.length > 0) {
                const saveRes = await fetch(`/api/exams/${examId}/results`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ results: validResults })
                })
                if (!saveRes.ok) throw new Error("Failed saving results")
            }

            if (finalize) {
                const patchRes = await fetch(`/api/exams/${examId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'FINALIZED' })
                })
                if (!patchRes.ok) throw new Error("Failed finalizing exam")
                setExam(prev => prev ? { ...prev, status: 'FINALIZED' } : null)
                toast.success("Exam Results Finalized and Locked.")
            } else {
                toast.success("Results saved successfully.")
                // Refresh to pick up real generated IDs from `new-` template IDs
                const refresh = await fetch(`/api/exams/${examId}/results?classId=${selectedClass}`)
                if (refresh.ok) setResults(await refresh.json())
            }

        } catch (error: any) {
            toast.error(error.message || "An error occurred while saving")
        } finally {
            setSaving(false)
        }
    }

    if (loading && !exam) {
        return (
            <DashboardLayout>
                <div className="p-20 text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                    <p className="font-semibold text-slate-900   text-xs">Accessing Result Sheets...</p>
                </div>
            </DashboardLayout>
        )
    }

    if (!exam) {
        return (
            <DashboardLayout>
                <div className="p-20 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 ">Exam Session Not Found</h3>
                    <Button onClick={() => router.push('/dashboard/results')} variant="outline" className="rounded-xl border-slate-200">RETURN TO EXAMS</Button>
                </div>
            </DashboardLayout>
        )
    }

    const isFinalized = exam.status === 'FINALIZED'

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-8 pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-slate-500 hover:text-blue-600 cursor-pointer w-fit mb-4 transition-all group" onClick={() => router.push('/dashboard/results')}>
                            <div className="p-2 rounded-xl group-hover:bg-blue-50">
                                <ArrowLeft className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold  ">Back to Exams</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 ">{exam.name}</h2>
                            <Badge variant={isFinalized ? 'default' : 'secondary'} className={cn(
                                "h-6 px-3 rounded-full text-[10px] font-semibold   border-none",
                                isFinalized ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {isFinalized ? <Lock className="w-3 h-3 mr-1.5" /> : null}
                                {exam.status}
                            </Badge>
                        </div>
                        <p className="text-slate-500 font-medium max-w-lg">
                            Performance entry for {format(new Date(exam.date), 'MMMM do, yyyy')}. Grades are automatically assigned based on percentage scores.
                        </p>
                    </div>

                    {!isFinalized && (
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                className="h-12 px-6 rounded-2xl font-semibold text-xs   border-slate-200 bg-white hover:bg-slate-50"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? "SYNCING..." : "SAVE DRAFT"}
                            </Button>
                            <Button
                                className="h-12 px-6 rounded-2xl font-semibold text-xs   bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200"
                                onClick={() => handleSave(true)}
                                disabled={saving}
                            >
                                <Award className="mr-2 h-4 w-4" />
                                FINALIZE & LOCK
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="border-slate-200 shadow-xl overflow-hidden rounded-3xl">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="space-y-2 flex-1 max-w-[400px]">
                                <Label htmlFor="class" className="text-slate-700 font-bold  text-[10px]  ml-1">Select Active Class for Entry</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger id="class" className="h-12 bg-white border-slate-200 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-blue-600" />
                                            <SelectValue placeholder="Chose class roster..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="font-medium">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 bg-white">
                        {!selectedClass ? (
                            <div className="p-24 text-center text-slate-500 flex flex-col items-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                                    <Award className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-semibold text-slate-900 mb-2  tracking-tight">Select a Class</h3>
                                <p className="max-w-md text-slate-500 font-medium">Please select a class roster from the dropdown above to load the mark sheet and begin performance entry.</p>
                            </div>
                        ) : loading ? (
                            <div className="p-24 text-center">
                                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                                <p className="font-semibold text-slate-900   text-xs">Compiling Studen Data...</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="p-24 text-center">
                                <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner">
                                    <AlertCircle className="h-12 w-12 text-amber-300" />
                                </div>
                                <h3 className="text-2xl font-semibold text-slate-900 mb-2  tracking-tight">Class Empty</h3>
                                <p className="max-w-md text-slate-500 font-medium mx-auto">This class roster does not contain any active student accounts. Enrollment is required before mark entry.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-semibold text-slate-900   min-w-[250px]">Student Identity</th>
                                            <th className="px-6 py-5 text-[10px] font-semibold text-slate-900   min-w-[200px]">Subject / Domain</th>
                                            <th className="px-6 py-5 text-[10px] font-semibold text-slate-900   text-center min-w-[120px]">Score</th>
                                            <th className="px-6 py-5 text-[10px] font-semibold text-slate-900   text-center min-w-[120px]">Target</th>
                                            <th className="px-6 py-5 text-[10px] font-semibold text-slate-900   text-center min-w-[100px]">Grade</th>
                                            <th className="px-8 py-5 text-[10px] font-semibold text-slate-900   min-w-[300px]">Strategic Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100  md:not-">
                                        {results.map((record, index) => (
                                            <tr key={record.id} className="hover:bg-blue-50/30 transition-all border-l-[4px] border-l-transparent hover:border-l-blue-600 group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-semibold text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-base leading-tight">
                                                                {record.student.firstName} {record.student.lastName}
                                                            </div>
                                                            <div className="text-[10px] font-semibold text-slate-400  tracking-wider mt-0.5">
                                                                ADM: {record.student.admissionNumber}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Input
                                                        placeholder="General Performance"
                                                        value={record.subject || ''}
                                                        onChange={(e) => handleResultChange(record.id, 'subject', e.target.value)}
                                                        disabled={isFinalized}
                                                        className="h-10 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-blue-100"
                                                    />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={record.score ?? ''}
                                                        disabled={isFinalized}
                                                        className="h-10 font-bold w-[90px] text-center border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all shadow-sm"
                                                        onChange={(e) => handleResultChange(record.id, 'score', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Input
                                                        type="number"
                                                        value={record.maxScore ?? 100}
                                                        disabled={isFinalized}
                                                        className="h-10 font-bold w-[90px] text-center border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all shadow-sm"
                                                        onChange={(e) => handleResultChange(record.id, 'maxScore', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <Badge className={cn(
                                                        "font-semibold h-8 w-12 flex items-center justify-center rounded-xl border-none shadow-sm text-sm",
                                                        record.grade ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {record.grade || '--'}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Input
                                                        placeholder="Insights into academic progress..."
                                                        value={record.remarks || ''}
                                                        onChange={(e) => handleResultChange(record.id, 'remarks', e.target.value)}
                                                        disabled={isFinalized}
                                                        className="h-10 border-slate-200 rounded-xl bg-white shadow-sm focus:ring-blue-100 w-full"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>

                    {results.length > 0 && (
                        <CardFooter className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4 text-xs font-semibold  ">
                                {isFinalized ? (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                                        <CheckCircle className="h-4 w-4" /> Finalized & Secure
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        Draft Modification Mode
                                    </div>
                                )}
                            </div>
                            {!isFinalized && (
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className="h-11 px-6 rounded-xl font-bold text-xs   border-slate-200 bg-white hover:bg-slate-50 w-full sm:w-auto"
                                        onClick={() => handleSave(false)}
                                        disabled={saving}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        SAVE AS DRAFT
                                    </Button>
                                    <Button
                                        className="h-11 px-6 rounded-xl font-semibold text-xs   bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 w-full sm:w-auto"
                                        onClick={() => handleSave(true)}
                                        disabled={saving}
                                    >
                                        <Award className="mr-2 h-4 w-4" />
                                        FINALIZE SHEET
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    )
}

