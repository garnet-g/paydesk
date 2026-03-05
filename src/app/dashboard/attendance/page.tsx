"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Save, Mail, AlertCircle, CheckCircle, Users } from "lucide-react"
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
        class?: { name: string }
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
                if (classRes.ok) {
                    const data = await classRes.json()
                    console.log('Fetched classes:', data)
                    setClasses(data)
                }
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
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white ">Attendance</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Mark daily student attendance and notify parents of absences.
                        </p>
                    </div>
                    {activePeriod && (
                        <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                            Current Term: {activePeriod.name}
                        </Badge>
                    )}
                </div>

                <Card className="border-slate-200 shadow-xl overflow-hidden rounded-2xl">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="class" className="text-slate-700 font-semibold text-[10px] ">Select Class</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger id="class" className="w-full md:w-[280px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm h-11">
                                        <SelectValue placeholder="Select class..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.length > 0 ? (
                                            classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-slate-400 text-xs ">No classes found</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-slate-700 font-semibold text-[10px] ">Date</Label>
                                <div className="relative">
                                    <Input
                                        id="date"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full md:w-[200px] bg-white border-slate-200 h-11 pl-10 shadow-sm"
                                    />
                                    <CalendarIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!selectedClass ? (
                            <div className="p-20 text-center text-slate-500 flex flex-col items-center bg-white">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <Users className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">Mark Attendance</h3>
                                <p className="max-w-xs mx-auto">Please select a class roster from the dropdown above to begin marking attendance.</p>
                            </div>
                        ) : loading ? (
                            <div className="p-20 text-center text-slate-500">
                                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                                <p className="font-semibold text-slate-800">Loading student list...</p>
                                <p className="text-sm">Fetching records from the database</p>
                            </div>
                        ) : records.length === 0 ? (
                            <div className="p-20 text-center text-slate-500">
                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                                    <AlertCircle className="h-10 w-10 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Students Found</h3>
                                <p className="max-w-xs mx-auto">This class doesn't seem to have any students assigned to it yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 bg-white">
                                <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
                                    <div>
                                        <span className="text-xs font-semibold text-slate-900   bg-blue-100/50 px-2 py-1 rounded">
                                            {records.length} Students
                                        </span>
                                    </div>
                                    {!isExistingData && (
                                        <Button variant="outline" size="sm" onClick={allPresent} className="h-9 font-semibold text-xs bg-white border-slate-200 group">
                                            <CheckCircle className="h-4 w-4 mr-2 text-green-500 group-hover:scale-110 transition-transform" />
                                            Mark All Present
                                        </Button>
                                    )}
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto">
                                    {records.map((record, index) => (
                                        <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 transition-all border-l-[4px] border-l-transparent hover:border-l-blue-500 group gap-4">
                                            <div className="flex items-center gap-5">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-lg text-slate-900">
                                                        {record.student.firstName} {record.student.lastName}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-semibold text-slate-400  tracking-wider">
                                                            ADM: {record.student.admissionNumber}
                                                        </span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span className="text-[10px] font-semibold text-slate-400  tracking-wider">
                                                            {record.student.class?.name || 'Unassigned'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                                <Button
                                                    variant={record.status === 'PRESENT' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className={cn(
                                                        "px-5 h-9 rounded-xl font-semibold text-[10px]   transition-all",
                                                        record.status === 'PRESENT' ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200" : "text-slate-500 hover:bg-white"
                                                    )}
                                                    onClick={() => handleStatusChange(record.id, 'PRESENT')}
                                                >
                                                    Present
                                                </Button>
                                                <Button
                                                    variant={record.status === 'ABSENT' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className={cn(
                                                        "px-5 h-9 rounded-xl font-semibold text-[10px]   transition-all",
                                                        record.status === 'ABSENT' ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" : "text-slate-500 hover:bg-white"
                                                    )}
                                                    onClick={() => handleStatusChange(record.id, 'ABSENT')}
                                                >
                                                    Absent
                                                </Button>
                                                <Button
                                                    variant={record.status === 'LATE' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className={cn(
                                                        "px-5 h-9 rounded-xl font-semibold text-[10px]   transition-all",
                                                        record.status === 'LATE' ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200" : "text-slate-500 hover:bg-white"
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
                        <CardFooter className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-semibold  ",
                                    isExistingData ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700 animate-pulse"
                                )}>
                                    {isExistingData ? "Viewing Records" : "Draft Mode"}
                                </div>
                                {records.filter(r => r.status === 'ABSENT').length > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600  ">
                                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                                        {records.filter(r => r.status === 'ABSENT').length} Absentees Detected
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-2xl font-semibold text-xs   border-slate-200 bg-white hover:bg-slate-50 w-full sm:w-auto"
                                    onClick={() => handleSave(false)}
                                    disabled={saving}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? "Saving..." : "Save Daily Records"}
                                </Button>
                                <Button
                                    className="h-12 px-6 rounded-2xl font-semibold text-xs   bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 w-full sm:w-auto"
                                    onClick={() => handleSave(true)}
                                    disabled={saving || records.filter(r => r.status === 'ABSENT').length === 0}
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    SAVE & SEND SMS
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    )
}
