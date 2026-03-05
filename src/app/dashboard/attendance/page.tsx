"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Save, Mail, AlertCircle, CheckCircle } from "lucide-react"
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
type AcademicPeriod = { id: string; name: string; isActive: boolean }
type AttendanceRecord = {
    id: string
    studentId: string
    date: string
    status: 'PRESENT' | 'ABSENT' | 'LATE' | ''
    reason: string | null
    student: {
        id: string
        firstName: string
        lastName: string
        admissionNumber: string
    }
    academicPeriodId: string
}

export default function AttendancePage() {
    const [classes, setClasses] = useState<Class[]>([])
    const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([])
    const [selectedClass, setSelectedClass] = useState<string>("")
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isExistingData, setIsExistingData] = useState(false)

    // Load initial data (classes and active period)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [classRes, periodRes] = await Promise.all([
                    fetch('/api/classes'),
                    fetch('/api/academic-periods')
                ])
                if (classRes.ok) setClasses(await classRes.json())
                if (periodRes.ok) {
                    const periods = await periodRes.json()
                    setAcademicPeriods(periods)
                }
            } catch (error) {
                toast.error("Failed to load classes or terms")
            }
        }
        fetchInitialData()
    }, [])

    const activePeriod = academicPeriods.find(p => p.isActive)

    // Fetch attendance when class or date changes
    useEffect(() => {
        const fetchAttendance = async () => {
            if (!selectedClass || !selectedDate || !activePeriod) return

            setLoading(true)
            try {
                const url = new URL('/api/attendance', window.location.origin)
                url.searchParams.append('classId', selectedClass)
                url.searchParams.append('date', selectedDate)
                url.searchParams.append('academicPeriodId', activePeriod.id)

                const res = await fetch(url.toString())
                if (res.ok) {
                    const data = await res.json()
                    setRecords(data)
                    // If the first record doesn't start with 'new-', it means data already existed in the DB
                    setIsExistingData(data.length > 0 && !data[0].id.startsWith('new-'))
                } else {
                    toast.error("Failed to fetch attendance data")
                }
            } catch (error) {
                console.error(error)
                toast.error("An error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchAttendance()
    }, [selectedClass, selectedDate, activePeriod])

    const handleStatusChange = (recordId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
        setRecords(prev => prev.map(rec =>
            rec.id === recordId ? { ...rec, status } : rec
        ))
    }

    const handleSave = async (sendSMS: boolean) => {
        if (records.length === 0) return

        // Ensure all students are marked if we are saving for the first time
        const unmarkedCount = records.filter(r => r.status === '').length
        if (unmarkedCount > 0 && !isExistingData) {
            toast.error(`Please mark attendance for all ${unmarkedCount} remaining students.`)
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    records,
                    sendSMS
                })
            })

            if (res.ok) {
                toast.success(sendSMS ? "Attendance saved and SMS sent to parents!" : "Attendance saved successfully!")
                setIsExistingData(true)
            } else {
                const text = await res.text()
                toast.error(`Failed to save: ${text}`)
            }
        } catch (error) {
            toast.error("An error occurred while saving")
        } finally {
            setSaving(false)
        }
    }

    const allPresent = () => {
        setRecords(prev => prev.map(rec => ({ ...rec, status: 'PRESENT' })))
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
                    <p className="text-muted-foreground">
                        Mark daily student attendance and notify parents of absences.
                    </p>
                </div>
                {activePeriod && (
                    <Badge variant="outline" className="text-sm">
                        Active Term: {activePeriod.name}
                    </Badge>
                )}
            </div>

            <Card className="border-border/40 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1.5 flex-1">
                            <Label htmlFor="class">Select Class</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger id="class" className="w-full md:w-[280px] bg-background">
                                    <SelectValue placeholder="Select a class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="date">Date</Label>
                            <div className="relative">
                                <Input
                                    id="date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full md:w-[200px] bg-background pl-10"
                                />
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {!selectedClass ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                            <AlertCircle className="h-10 w-10 mb-3 text-muted-foreground/50" />
                            <p>Please select a class to view the attendance roster.</p>
                        </div>
                    ) : loading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                            Loading roster...
                        </div>
                    ) : records.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No students found in this class.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            <div className="p-4 bg-muted/10 flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {records.length} Students listed
                                </span>
                                {!isExistingData && (
                                    <Button variant="outline" size="sm" onClick={allPresent} className="h-8">
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        Mark All Present
                                    </Button>
                                )}
                            </div>

                            {/* Roster List */}
                            <div className="max-h-[60vh] overflow-y-auto">
                                {records.map((record, index) => (
                                    <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {record.student.firstName} {record.student.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                                    ADM: {record.student.admissionNumber}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={record.status === 'PRESENT' ? 'default' : 'outline'}
                                                size="sm"
                                                className={cn(
                                                    "w-24 font-medium transition-all",
                                                    record.status === 'PRESENT' && "bg-green-600 hover:bg-green-700 text-white border-transparent shadow-sm"
                                                )}
                                                onClick={() => handleStatusChange(record.id, 'PRESENT')}
                                            >
                                                Present
                                            </Button>
                                            <Button
                                                variant={record.status === 'ABSENT' ? 'default' : 'outline'}
                                                size="sm"
                                                className={cn(
                                                    "w-24 font-medium transition-all",
                                                    record.status === 'ABSENT' && "bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm"
                                                )}
                                                onClick={() => handleStatusChange(record.id, 'ABSENT')}
                                            >
                                                Absent
                                            </Button>
                                            <Button
                                                variant={record.status === 'LATE' ? 'default' : 'outline'}
                                                size="sm"
                                                className={cn(
                                                    "w-24 font-medium transition-all",
                                                    record.status === 'LATE' && "bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-sm"
                                                )}
                                                onClick={() => handleStatusChange(record.id, 'LATE')}
                                            >
                                                Late
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>

                {records.length > 0 && (
                    <CardFooter className="bg-muted/30 p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                            {isExistingData ? "Viewing previously saved attendance" : "Unsaved attendance record"}
                            {records.filter(r => r.status === 'ABSENT').length > 0 && (
                                <span className="ml-2 font-medium text-red-600">
                                    ({records.filter(r => r.status === 'ABSENT').length} Absent)
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="flex-1 sm:flex-none"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save Only
                            </Button>
                            <Button
                                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleSave(true)}
                                disabled={saving || records.filter(r => r.status === 'ABSENT').length === 0}
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Save & Alert Absentees
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
