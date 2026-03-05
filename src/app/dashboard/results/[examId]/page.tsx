"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Save, Lock, AlertCircle, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

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

    if (loading && !exam) return <div className="p-12 text-center text-muted-foreground">Loading...</div>
    if (!exam) return <div className="p-12 text-center text-red-500">Exam not found.</div>

    const isFinalized = exam.status === 'FINALIZED'

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center gap-4 text-muted-foreground hover:text-foreground cursor-pointer w-fit mb-4 transition-colors" onClick={() => router.push('/dashboard/results')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Exams</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-bold tracking-tight">{exam.name}</h2>
                        <Badge variant={isFinalized ? 'default' : 'secondary'} className={isFinalized ? 'bg-emerald-600' : ''}>
                            {isFinalized ? <Lock className="w-3 h-3 mr-1" /> : null}
                            {exam.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <span>Date: {format(new Date(exam.date), 'MMM do, yyyy')}</span>
                    </p>
                </div>
            </div>

            <Card className="border-border/40 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1.5 flex-1 max-w-[300px]">
                            <Label htmlFor="class">Select Class to Enter Marks</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger id="class" className="w-full bg-background">
                                    <SelectValue placeholder="Select a class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {!selectedClass ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                            <AlertCircle className="h-10 w-10 mb-3 text-muted-foreground/50" />
                            <p>Please select a class to load the result sheet.</p>
                        </div>
                    ) : loading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                            Loading roster...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No active students found in this class.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Student</th>
                                        <th className="px-4 py-4 font-semibold w-[200px]">Subject</th>
                                        <th className="px-4 py-4 font-semibold w-[120px]">Score</th>
                                        <th className="px-4 py-4 font-semibold w-[120px]">Out Of</th>
                                        <th className="px-4 py-4 font-semibold w-[100px]">Grade</th>
                                        <th className="px-6 py-4 font-semibold w-[300px]">Remarks (Optional)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {results.map((record, index) => (
                                        <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="font-medium text-foreground">
                                                    {record.student.firstName} {record.student.lastName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    ADM: {record.student.admissionNumber}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    placeholder="General"
                                                    value={record.subject || ''}
                                                    onChange={(e) => handleResultChange(record.id, 'subject', e.target.value)}
                                                    disabled={isFinalized}
                                                    className="h-8 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="number"
                                                    placeholder="--"
                                                    value={record.score ?? ''}
                                                    disabled={isFinalized}
                                                    className="h-8 font-semibold w-[80px] text-center"
                                                    onChange={(e) => handleResultChange(record.id, 'score', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="number"
                                                    value={record.maxScore ?? 100}
                                                    disabled={isFinalized}
                                                    className="h-8 text-sm w-[80px] text-center"
                                                    onChange={(e) => handleResultChange(record.id, 'maxScore', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="font-mono bg-background text-sm flex justify-center w-[40px] h-[32px] items-center">
                                                    {record.grade || '-'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3">
                                                <Input
                                                    placeholder="Good performance..."
                                                    value={record.remarks || ''}
                                                    onChange={(e) => handleResultChange(record.id, 'remarks', e.target.value)}
                                                    disabled={isFinalized}
                                                    className="h-8 text-sm w-full"
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
                    <CardFooter className="bg-muted/30 p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {isFinalized ? (
                                <><Lock className="h-4 w-4" /> This exam is finalized and locked from futher editing.</>
                            ) : (
                                "Missing grades are ignored until entered."
                            )}
                        </div>
                        {!isFinalized && (
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="flex-1 sm:flex-none"
                                    onClick={() => handleSave(false)}
                                    disabled={saving}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Draft
                                </Button>
                                <Button
                                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleSave(true)}
                                    disabled={saving}
                                >
                                    <Award className="mr-2 h-4 w-4" />
                                    Finalize & Lock Results
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
