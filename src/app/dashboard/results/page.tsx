"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Plus, Award, Calendar, FileText, Lock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

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
                const newExam = await res.json()
                // Fetch fresh list to get the nested academicPeriod name
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
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Results & Exams</h2>
                    <p className="text-muted-foreground">
                        Manage exams, enter student results, and lock grades.
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Exam
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Exam</DialogTitle>
                            <DialogDescription>
                                Set up a new examination entry for the selected academic term.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="term">Academic Term</Label>
                                <Select disabled value={selectedPeriod}>
                                    <SelectTrigger id="term">
                                        <SelectValue />
                                    </SelectTrigger>
                                </Select>
                                <p className="text-xs text-muted-foreground">Exams are always created in the currently selected view term.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">Exam Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Mid-Term 1 2026, End of Year Maths"
                                    value={newExamName}
                                    onChange={(e) => setNewExamName(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="date">Date of Examination</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={newExamDate}
                                    onChange={(e) => setNewExamDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateExam} disabled={isCreating}>
                                {isCreating ? "Saving..." : "Create Exam"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="w-full md:w-[300px] mb-6">
                <Label htmlFor="period-filter" className="sr-only">Filter by Term</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger id="period-filter">
                        <SelectValue placeholder="Select Academic Term" />
                    </SelectTrigger>
                    <SelectContent>
                        {academicPeriods.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name} {p.isActive && "(Active)"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="p-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading exams...</p>
                </div>
            ) : exams.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Award className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Exams Found</h3>
                        <p className="text-muted-foreground max-w-[400px] mb-6">
                            There are no exams recorded for the selected academic term. Click the button above to create one.
                        </p>
                        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                            Create First Exam
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {exams.map(exam => (
                        <Card
                            key={exam.id}
                            className="hover:shadow-md transition-all cursor-pointer border-border/50 overflow-hidden group"
                            onClick={() => router.push(`/dashboard/results/${exam.id}`)}
                        >
                            <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                                        {exam.name}
                                    </CardTitle>
                                    <Badge variant={exam.status === 'FINALIZED' ? 'default' : 'secondary'} className={exam.status === 'FINALIZED' ? 'bg-emerald-600' : ''}>
                                        {exam.status === 'FINALIZED' ? <Lock className="w-3 h-3 mr-1" /> : null}
                                        {exam.status}
                                    </Badge>
                                </div>
                                <CardDescription className="flex items-center mt-2 text-xs">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {format(new Date(exam.date), 'MMMM do, yyyy')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center text-sm text-muted-foreground mb-4">
                                    <FileText className="mr-2 h-4 w-4" />
                                    {exam.academicPeriod?.name}
                                </div>
                                <div className="flex items-center justify-between text-sm font-medium text-primary">
                                    {exam.status === 'FINALIZED' ? 'View Results' : 'Enter Results'}
                                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
