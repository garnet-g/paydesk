"use client"

import { useState, useEffect } from "react"
import { FileText, Search, Printer, Download, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import DashboardLayout from "@/components/DashboardLayout"

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
    }, [selectedPeriod])

    // Load Students when Class changes
    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedClass) return
            setLoadingStudents(true)
            try {
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
        const url = `/api/report-cards/${studentId}?examId=${selectedExam}`
        window.open(url, '_blank')
    }

    const filteredStudents = students.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-8 pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Report Cards</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Generate and print terminal report cards for students and classes.
                        </p>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-xl overflow-hidden rounded-3xl">
                    <CardHeader className="bg-slate-50/80 dark:bg-slate-900/50 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <Label htmlFor="period" className="text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-widest ml-1">1. Term Selection</Label>
                                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                    <SelectTrigger id="period" className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                                        <SelectValue placeholder="Select Term" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl dark:border-slate-800">
                                        {academicPeriods.map(p => (
                                            <SelectItem key={p.id} value={p.id} className="font-medium text-slate-700 dark:text-slate-300">{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="exam" className="text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-widest ml-1">2. Exam Source</Label>
                                <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loadingExams || exams.length === 0}>
                                    <SelectTrigger id="exam" className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                                        <SelectValue placeholder={loadingExams ? "Syncing..." : exams.length === 0 ? "No exams" : "Select Exam"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl dark:border-slate-800">
                                        {exams.map(e => (
                                            <SelectItem key={e.id} value={e.id}>
                                                <div className="flex justify-between items-center w-full gap-4">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{e.name}</span>
                                                    <Badge variant={e.status === 'FINALIZED' ? 'default' : 'secondary'} className={cn(
                                                        "text-[9px] font-black h-4 uppercase tracking-tighter",
                                                        e.status === 'FINALIZED' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {e.status}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="class" className="text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-widest ml-1">3. Target Class</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger id="class" className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl dark:border-slate-800">
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="font-medium text-slate-700 dark:text-slate-300">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {!selectedClass || !selectedExam ? (
                            <div className="p-24 text-center text-slate-500 flex flex-col items-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                                    <FileText className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Report Generator Ready</h3>
                                <p className="max-w-md text-slate-500 dark:text-slate-400 font-medium">Configure your search filters above to generate student transcripts and termly report cards.</p>
                            </div>
                        ) : loadingStudents ? (
                            <div className="p-24 text-center">
                                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                                <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Accessing Student Records...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="p-24 text-center">
                                <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner">
                                    <Search className="h-12 w-12 text-amber-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Zero Results</h3>
                                <p className="max-w-md text-slate-500 font-medium mx-auto">We couldn't find any active students in this class. Please verify your enrollment records.</p>
                            </div>
                        ) : (
                            <div className="p-0 animate-in fade-in duration-500">
                                <div className="p-6 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-slate-100">
                                    <div className="relative w-full sm:w-[350px]">
                                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Quick search by name or ADM..."
                                            className="pl-11 h-11 bg-white border-slate-200 rounded-xl shadow-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="h-11 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl px-8 shadow-lg shadow-blue-100"
                                        onClick={() => toast.info("Batch processing is undergoing final testing.")}
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        BATCH PRINT CLASS ({filteredStudents.length})
                                    </Button>
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest">Student Information</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Admission No.</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">PDF Generator</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.map((student) => (
                                                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                {student.firstName[0]}{student.lastName[0]}
                                                            </div>
                                                            <span className="font-bold text-slate-900 text-base">
                                                                {student.firstName} {student.lastName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <Badge variant="outline" className="font-mono text-slate-600 bg-white border-slate-200 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                                            {student.admissionNumber}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-10 rounded-xl border-slate-200 bg-white hover:border-blue-500 hover:text-blue-600 font-bold transition-all group-hover:shadow-md"
                                                            onClick={() => handleDownloadIndividual(student.id, `${student.firstName} ${student.lastName}`)}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            EXPORT PDF
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredStudents.length === 0 && (
                                        <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            No matching records for "{searchTerm}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

