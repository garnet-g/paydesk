"use client"

import { useState, useEffect } from "react"
import { Calendar, Download, FileText, Search, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

type AcademicPeriod = { id: string; name: string; isActive: boolean }
type Class = { id: string; name: string }
type Exam = { id: string; name: string; date: string; status: string }
type Student = { id: string; firstName: string; lastName: string; admissionNumber: string }

export default function ReportCardsPage() {
    const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([])
    const [classes, setClasses] = useState<Class[]>([])

    // Selections
    const [selectedPeriod, setSelectedPeriod] = useState<string>("")
    const [selectedClass, setSelectedClass] = useState<string>("")
    const [selectedExam, setSelectedExam] = useState<string>("")

    // Data
    const [exams, setExams] = useState<Exam[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    // Status
    const [loadingExams, setLoadingExams] = useState(false)
    const [loadingStudents, setLoadingStudents] = useState(false)

    // Initial Load
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [periodRes, classRes] = await Promise.all([
                    fetch('/api/academic-periods'),
                    fetch('/api/classes')
                ])
                if (periodRes.ok) {
                    const data = await periodRes.json()
                    setAcademicPeriods(data)
                    const active = data.find((p: AcademicPeriod) => p.isActive)
                    if (active) setSelectedPeriod(active.id)
                }
                if (classRes.ok) setClasses(await classRes.json())
            } catch (error) {
                toast.error("Failed to load generic data")
            }
        }
        fetchInitial()
    }, [])

    // Load Exams when Period changes
    useEffect(() => {
        const fetchExams = async () => {
            if (!selectedPeriod) return
            setLoadingExams(true)
            try {
                const res = await fetch(`/api/exams?academicPeriodId=${selectedPeriod}`)
                if (res.ok) {
                    const data = await res.json()
                    setExams(data)
                    // Auto-select finalized exams if available
                    const finalized = data.filter((e: Exam) => e.status === 'FINALIZED')
                    if (finalized.length > 0 && !selectedExam) setSelectedExam(finalized[0].id)
                    else if (data.length > 0 && !selectedExam) setSelectedExam(data[0].id)
                }
            } catch (err) {
                toast.error("Failed to load exams")
            } finally {
                setLoadingExams(false)
            }
        }
        fetchExams()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPeriod])

    // Load Students when Class changes
    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedClass) return
            setLoadingStudents(true)
            try {
                // Borrow the attendance endpoint's behavior or fetch directly from students
                const res = await fetch(`/api/students?classId=${selectedClass}`)
                if (res.ok) {
                    setStudents(await res.json())
                }
            } catch (err) {
                toast.error("Failed to load roster")
            } finally {
                setLoadingStudents(false)
            }
        }
        fetchStudents()
    }, [selectedClass])

    const handleDownloadIndividual = (studentId: string, studentName: string) => {
        if (!selectedExam) return toast.error("Please select an exam first.")

        // Open PDF in new tab
        const url = `/api/report-cards/${studentId}?examId=${selectedExam}`
        window.open(url, '_blank')
    }

    const filteredStudents = students.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Report Cards</h2>
                    <p className="text-muted-foreground">
                        Generate and print terminal report cards for students and classes.
                    </p>
                </div>
            </div>

            <Card className="border-border/40 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 border-r border-border/50 pr-4">
                            <Label htmlFor="period">1. Select Term</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger id="period" className="bg-background">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicPeriods.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 border-r md:border-border/50 pr-0 md:pr-4">
                            <Label htmlFor="exam">2. Select Exam</Label>
                            <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loadingExams || exams.length === 0}>
                                <SelectTrigger id="exam" className="bg-background">
                                    <SelectValue placeholder={loadingExams ? "Loading..." : exams.length === 0 ? "No exams" : "Select Exam"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(e => (
                                        <SelectItem key={e.id} value={e.id}>
                                            <div className="flex justify-between items-center w-full gap-4">
                                                <span>{e.name}</span>
                                                <Badge variant={e.status === 'FINALIZED' ? 'default' : 'secondary'} className="text-[10px] h-4 leading-none hidden sm:inline-flex">
                                                    {e.status}
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="class">3. Select Class</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger id="class" className="bg-background">
                                    <SelectValue placeholder="Select Class" />
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
                    {!selectedClass || !selectedExam ? (
                        <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-lg font-medium text-foreground mb-1">Select Criteria</p>
                            <p>Choose an academic term, a specific exam, and a class to view report cards.</p>
                        </div>
                    ) : loadingStudents ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                            Loading student roster...
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No active students found in this class.
                        </div>
                    ) : (
                        <div className="p-0">
                            <div className="p-4 bg-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-border/50">
                                <div className="relative w-full sm:w-[300px]">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search students..."
                                        className="pl-9 bg-background"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                                    onClick={() => toast.info("Batch printing will open multiple tabs/windows by browser limits. Feature coming soon.")}
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print All (Class Batch)
                                </Button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Student Name</th>
                                            <th className="px-6 py-4 font-semibold">Admission No.</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-3 font-medium text-foreground">
                                                    {student.firstName} {student.lastName}
                                                </td>
                                                <td className="px-6 py-3 text-muted-foreground">
                                                    {student.admissionNumber}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDownloadIndividual(student.id, `${student.firstName} ${student.lastName}`)}
                                                    >
                                                        <Download className="mr-2 h-4 w-4 text-primary" />
                                                        View / Download PDF
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredStudents.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No students matched your search criteria.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
