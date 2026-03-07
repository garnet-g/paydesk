"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Plus, Award, Calendar, FileText, Lock, ChevronRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import DashboardLayout from "@/components/DashboardLayout"

type AcademicPeriod = { id: string; name: string; isActive: boolean }
type Exam = { id: string; name: string; date: string; status: 'DRAFT' | 'FINALIZED'; academicPeriod: { name: string } }

export default function ResultsPage() {
    const router = useRouter()
    const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([])
    const [selectedPeriod, setSelectedPeriod] = useState<string>("")
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(false)

    // New Exam State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newExamName, setNewExamName] = useState("")
    const [newExamDate, setNewExamDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        const fetchPeriods = async () => {
            try {
                const res = await fetch('/api/academic-periods')
                if (res.ok) {
                    const data = await res.json()
                    setAcademicPeriods(data)
                    const active = data.find((p: AcademicPeriod) => p.isActive)
                    if (active) setSelectedPeriod(active.id)
                    else if (data.length > 0) setSelectedPeriod(data[0].id)
                }
            } catch (error) {
                toast.error("Failed to load academic periods")
            }
        }
        fetchPeriods()
    }, [])

    useEffect(() => {
        const fetchExams = async () => {
            if (!selectedPeriod) return
            setLoading(true)
            try {
                const res = await fetch(`/api/exams?academicPeriodId=${selectedPeriod}`)
                if (res.ok) setExams(await res.json())
            } catch (error) {
                toast.error("Failed to load exams")
            } finally {
                setLoading(false)
            }
        }
        fetchExams()
    }, [selectedPeriod])

    const handleCreateExam = async () => {
        if (!newExamName || !newExamDate || !selectedPeriod) {
            toast.error("Please fill all fields")
            return
        }

        setIsCreating(true)
        try {
            const res = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newExamName,
                    date: newExamDate,
                    academicPeriodId: selectedPeriod
                })
            })

            if (res.ok) {
                const freshRes = await fetch(`/api/exams?academicPeriodId=${selectedPeriod}`)
                if (freshRes.ok) setExams(await freshRes.json())

                setIsCreateOpen(false)
                setNewExamName("")
                toast.success("Exam created successfully")
            } else {
                toast.error("Failed to create exam")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-white dark:bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xl shadow-slate-200/50 dark:shadow-none border border-border dark:border-slate-800 transition-all hover:scale-110">
                            <Award size={28} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-foreground dark:text-white leading-none">
                                Assessments
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
                                <ShieldCheck size={12} className="text-blue-500" />
                                Examination registry & grade locking hub
                            </p>
                        </div>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-6 rounded-2xl font-semibold text-xs   bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200">
                                <Plus className="mr-2 h-4 w-4" />
                                Initiate New Exam
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold text-foreground dark:text-white  tracking-tight">Create New Exam</DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
                                    Set up a new examination entry for the selected academic term. Recording results will begin after creation.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="term" className="text-slate-700 font-bold  text-[10px] ">Academic Term</Label>
                                    <Select disabled value={selectedPeriod}>
                                        <SelectTrigger id="term" className="h-11 bg-muted border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="name" className="text-slate-700 font-bold  text-[10px] ">Exam Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Mid-Term 1 2026, End of Year Maths"
                                        value={newExamName}
                                        onChange={(e) => setNewExamName(e.target.value)}
                                        className="h-11 border-border"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="date" className="text-slate-700 font-bold  text-[10px] ">Date of Examination</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={newExamDate}
                                        onChange={(e) => setNewExamDate(e.target.value)}
                                        className="h-11 border-border"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-3 sm:gap-0">
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl font-bold text-slate-500">Cancel</Button>
                                <Button onClick={handleCreateExam} disabled={isCreating} className="rounded-xl bg-blue-600 font-semibold text-xs   px-8">
                                    {isCreating ? "SAVING..." : "CREATE EXAM"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="max-w-[320px] border-border shadow-sm rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 bg-muted dark:bg-slate-900 border-b border-border dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500   leading-none">Viewing Data For</span>
                    </div>
                    <div className="p-4">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger id="period-filter" className="border-none bg-transparent h-auto p-0 focus:ring-0 shadow-none">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <SelectValue className="font-bold text-foreground dark:text-white" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border">
                                {academicPeriods.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="font-medium">
                                        {p.name} {p.isActive && "(Active)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                        <p className="font-semibold text-foreground   text-xs">Accessing Exam Records...</p>
                    </div>
                ) : exams.length === 0 ? (
                    <Card className="border-dashed border-slate-300 bg-muted/50 rounded-3xl">
                        <CardContent className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="h-20 w-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mb-8">
                                <Award className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-semibold text-foreground mb-2 ">No Exam Sessions</h3>
                            <p className="text-slate-500 max-w-sm mb-8 font-medium">
                                There are no examinations recorded for the selected academic term. Click the button above to initiate your first exam.
                            </p>
                            <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="rounded-xl border-border bg-white font-bold h-11 px-8">
                                START FIRST SESSION
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {exams.map(exam => (
                            <Card
                                key={exam.id}
                                className="group hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer border-border rounded-3xl overflow-hidden flex flex-col h-full bg-white shadow-sm"
                                onClick={() => router.push(`/dashboard/results/${exam.id}`)}
                            >
                                <CardHeader className="p-6 pb-4 flex-none border-b border-slate-50 bg-muted/30">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <Badge variant={exam.status === 'FINALIZED' ? 'default' : 'secondary'} className={cn(
                                            "h-6 px-3 rounded-full text-[10px] font-semibold   border-none",
                                            exam.status === 'FINALIZED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                        )}>
                                            {exam.status === 'FINALIZED' ? <Lock className="w-2.5 h-2.5 mr-1.5" /> : null}
                                            {exam.status}
                                        </Badge>
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-50">
                                            <Award size={16} className="text-blue-600" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-semibold text-foreground dark:text-white leading-tight group-hover:text-blue-600 transition-colors  truncate">
                                        {exam.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center text-xs font-bold text-slate-500  ">
                                            <Calendar className="mr-3 h-4 w-4 text-slate-400" />
                                            {format(new Date(exam.date), 'MMMM do, yyyy')}
                                        </div>
                                        <div className="flex items-center text-xs font-bold text-slate-500  ">
                                            <FileText className="mr-3 h-4 w-4 text-slate-400" />
                                            {exam.academicPeriod?.name}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-semibold text-blue-600  tracking-[0.2em] border-t border-slate-50 pt-5">
                                        <span>{exam.status === 'FINALIZED' ? 'VIEW ANALYTICS' : 'MANAGE SCORES'}</span>
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
