'use client'

import { useState, useEffect } from 'react'
import {
    ArrowRight,
    GraduationCap,
    Users,
    CheckCircle,
    AlertCircle,
    Loader2,
    ChevronRight,
    Info,
    ShieldCheck,
    Search,
    ChevronLeft,
    CheckCircle2,
    Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface GradePromotionPanelProps {
    onComplete?: () => void
}

type Step = 'select-classes' | 'review-students' | 'confirm'

export default function GradePromotionPanel({ onComplete }: GradePromotionPanelProps) {
    const [step, setStep] = useState<Step>('select-classes')
    const [classes, setClasses] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [activePeriod, setActivePeriod] = useState<any>(null)
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
    const [fromClassId, setFromClassId] = useState('')
    const [toClassId, setToClassId] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [targetFees, setTargetFees] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchClasses()
    }, [])

    useEffect(() => {
        if (fromClassId) fetchStudents(fromClassId)
        else setStudents([])
    }, [fromClassId])

    useEffect(() => {
        if (toClassId) fetchTargetFees(toClassId)
        else setTargetFees([])
    }, [toClassId])

    const fetchClasses = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/grade-promotion')
            const data = await res.json()
            setClasses(data.classes || [])
            setActivePeriod(data.activePeriod)
        } catch (err) {
            setError('Failed to load classes')
            toast.error("Failed to load academic data")
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async (classId: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/grade-promotion?fromClassId=${classId}`)
            const data = await res.json()
            const studentList = data.students || []
            setStudents(studentList)
            setSelectedStudentIds(new Set(studentList.map((s: any) => s.id)))
        } catch (err) {
            setError('Failed to load students')
        } finally {
            setLoading(false)
        }
    }

    const fetchTargetFees = async (classId: string) => {
        try {
            const res = await fetch(`/api/fee-structures?classId=${classId}`)
            if (res.ok) {
                const data = await res.json()
                setTargetFees(data.filter((f: any) => f.isActive) || [])
            }
        } catch { }
    }

    const toggleStudent = (id: string) => {
        setSelectedStudentIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedStudentIds.size === students.length) {
            setSelectedStudentIds(new Set())
        } else {
            setSelectedStudentIds(new Set(students.map(s => s.id)))
        }
    }

    const handleSubmit = async () => {
        if (selectedStudentIds.size === 0) {
            setError('Select at least one student to promote')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            const res = await fetch('/api/grade-promotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromClassId,
                    toClassId,
                    studentIds: Array.from(selectedStudentIds),
                    notes
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Submission failed')
            setSuccess(data.message)
            toast.success("Transition request formally submitted")
            onComplete?.()
        } catch (err: any) {
            setError(err.message)
            toast.error("Process execution rejected")
        } finally {
            setSubmitting(false)
        }
    }

    const fromClass = classes.find(c => c.id === fromClassId)
    const toClass = classes.find(c => c.id === toClassId)
    const totalNewFees = targetFees.reduce((sum, f) => sum + f.amount, 0)
    const canProceedStep1 = fromClassId && toClassId && fromClassId !== toClassId

    const filteredStudents = students.filter(s =>
        `${s.firstName} ${s.lastName} ${s.admissionNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (success) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 p-12 text-center overflow-hidden relative border border-slate-100 dark:border-slate-900">
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                    <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100/50 dark:shadow-none">
                        <CheckCircle2 size={48} className="text-emerald-600" />
                    </div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Request Authorized</h3>
                    <p className="max-w-md mx-auto text-slate-500 font-bold uppercase text-xs tracking-widest leading-relaxed mb-8">
                        The academic progression request has been recorded. Pending final audit and approval by the school principal.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button
                            className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 dark:bg-white dark:text-slate-950 transition-all hover:scale-105 active:scale-95"
                            onClick={() => {
                                setStep('select-classes')
                                setFromClassId('')
                                setToClassId('')
                                setStudents([])
                                setNotes('')
                                setSuccess('')
                            }}
                        >
                            Initiate New Batch
                        </Button>
                    </div>
                </Card>
            </motion.div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Tactical Step Indicator */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-950 rounded-[2rem] shadow-sm ring-1 ring-slate-100 dark:ring-slate-900">
                {[
                    { key: 'select-classes', label: 'SOURCE & TARGET', num: 1 },
                    { key: 'review-students', label: 'PERSONNEL AUDIT', num: 2 },
                    { key: 'confirm', label: 'FINAL AUTH', num: 3 }
                ].map((s, i) => {
                    const steps: Step[] = ['select-classes', 'review-students', 'confirm']
                    const idx = steps.indexOf(step)
                    const sIdx = steps.indexOf(s.key as Step)
                    const isDone = idx > sIdx
                    const isActive = step === s.key

                    return (
                        <div key={s.key} className="flex items-center gap-3 flex-1 h-12 px-4 rounded-[1.5rem] transition-all relative overflow-hidden group">
                            {isActive && (
                                <motion.div layoutId="active-step" className="absolute inset-0 bg-blue-600 dark:bg-white z-0" />
                            )}
                            <div className={cn(
                                "h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black z-10 transition-colors",
                                isDone ? "bg-emerald-500 text-white" : isActive ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                            )}>
                                {isDone ? <CheckCircle size={12} /> : s.num}
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest z-10 transition-colors whitespace-nowrap",
                                isActive ? "text-white dark:text-slate-950" : "text-slate-400"
                            )}>{s.label}</span>
                            {i < 2 && <div className="ml-auto h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700 z-10" />}
                        </div>
                    )
                })}
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-black uppercase tracking-widest italic">
                        <AlertCircle size={18} /> {error}
                    </div>
                </motion.div>
            )}

            {/* Step Content */}
            <AnimatePresence mode='wait'>
                {step === 'select-classes' && (
                    <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                            <CardContent className="p-8 md:p-10">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground dark:text-white">Unit Transition Matrix</h3>
                                        {activePeriod && (
                                            <Badge className="h-8 rounded-xl px-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                                <Calendar size={12} className="mr-2" />
                                                PERIOD: {activePeriod.academicYear} / {activePeriod.term}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Source Academic Unit</label>
                                            <div className="relative">
                                                <Users size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                                <select
                                                    className="w-full h-16 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-16 pr-6 font-black uppercase text-xs text-foreground dark:text-white appearance-none cursor-pointer focus:ring-2 ring-slate-200 dark:ring-slate-800 transition-all"
                                                    value={fromClassId}
                                                    onChange={e => { setFromClassId(e.target.value); setToClassId('') }}
                                                >
                                                    <option value="">— SELECT ORIGIN —</option>
                                                    {classes.map((c: any) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}{c.stream ? ` / ${c.stream}` : ''} ({c._count?.students || 0} UNITS)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Academic Unit</label>
                                            <div className="relative">
                                                <GraduationCap size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                                <select
                                                    className="w-full h-16 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-16 pr-6 font-black uppercase text-xs text-foreground dark:text-white appearance-none cursor-pointer focus:ring-2 ring-slate-200 dark:ring-slate-800 transition-all disabled:opacity-30"
                                                    value={toClassId}
                                                    onChange={e => setToClassId(e.target.value)}
                                                    disabled={!fromClassId}
                                                >
                                                    <option value="">— SELECT TARGET —</option>
                                                    {classes.filter(c => c.id !== fromClassId).map((c: any) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}{c.stream ? ` / ${c.stream}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {fromClassId && toClassId && (
                                        <div className="p-8 rounded-[2rem] bg-blue-600 dark:bg-slate-900 text-white overflow-hidden relative border border-blue-500 dark:border-slate-800 shadow-2xl">
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent"></div>
                                            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                                <div className="flex-1 text-center md:text-left">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2 italic">Active Deployment</div>
                                                    <div className="text-2xl font-black italic uppercase tracking-tighter">{fromClass?.name}{fromClass?.stream ? ' / ' + fromClass.stream : ''}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{students.length} PERSONNEL DETECTED</div>
                                                </div>
                                                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse border border-white/5">
                                                    <ArrowRight size={20} className="text-blue-400" />
                                                </div>
                                                <div className="flex-1 text-center md:text-right">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 italic">Target Vector</div>
                                                    <div className="text-2xl font-black italic uppercase tracking-tighter">{toClass?.name}{toClass?.stream ? ' / ' + toClass.stream : ''}</div>
                                                    <div className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mt-1 italic">
                                                        {totalNewFees > 0 ? `BATCH FEE: KES ${totalNewFees.toLocaleString()}` : "FEE READY"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-30 active:scale-95"
                                            disabled={!canProceedStep1 || loading}
                                            onClick={() => setStep('review-students')}
                                        >
                                            Review Personnel Audit <ChevronRight size={18} className="ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {step === 'review-students' && (
                    <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                            <CardContent className="p-8 md:p-10 space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground dark:text-white">
                                        Personnel Audit: {fromClass?.name} → {toClass?.name}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge className="h-8 rounded-xl px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest border-none">
                                            {selectedStudentIds.size} / {students.length} SELECTED
                                        </Badge>
                                        <Button variant="ghost" className="h-8 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10" onClick={toggleAll}>
                                            {selectedStudentIds.size === students.length ? "DESELECT ALL" : "SELECT ALL"}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-14 pr-6 font-black uppercase text-xs text-foreground dark:text-white placeholder:opacity-20"
                                            placeholder="OPERATIONAL SEARCH: FIND STUDENTS BY IDENTITY OR ADMISSION..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar py-2">
                                        {filteredStudents.map((s: any) => (
                                            <div
                                                key={s.id}
                                                className={cn(
                                                    "p-4 rounded-[1.5rem] cursor-pointer transition-all border-2 relative overflow-hidden group",
                                                    selectedStudentIds.has(s.id)
                                                        ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-500 shadow-lg shadow-blue-100 dark:shadow-none"
                                                        : "bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                                                )}
                                                onClick={() => toggleStudent(s.id)}
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs uppercase italic transition-colors",
                                                        selectedStudentIds.has(s.id) ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                                    )}>
                                                        {s.firstName[0]}{s.lastName[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black uppercase tracking-tighter text-xs truncate leading-tight">{s.firstName} {s.lastName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase italic mt-1 tracking-widest">{s.admissionNumber}</p>
                                                    </div>
                                                    {selectedStudentIds.has(s.id) && (
                                                        <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400" onClick={() => setStep('select-classes')}>
                                        <ChevronLeft size={18} className="mr-2" /> REVERT MATRIX
                                    </Button>
                                    <Button
                                        className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-30"
                                        disabled={selectedStudentIds.size === 0}
                                        onClick={() => setStep('confirm')}
                                    >
                                        Final Authorization <ChevronRight size={18} className="ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {step === 'confirm' && (
                    <motion.div
                        key="step-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                            <CardContent className="p-8 md:p-10 space-y-10">
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground dark:text-white">Transition Authorization Hub</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="col-span-1 md:col-span-2 p-8 rounded-[2rem] bg-slate-950 text-white shadow-xl flex items-center gap-10">
                                        <div className="flex-1 text-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2 italic">Origin</div>
                                            <div className="text-xl font-black italic uppercase tracking-tighter">{fromClass?.name}{fromClass?.stream ? ' / ' + fromClass.stream : ''}</div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <ArrowRight size={18} className="text-blue-500" />
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 italic">Destination</div>
                                            <div className="text-xl font-black italic uppercase tracking-tighter">{toClass?.name}{toClass?.stream ? ' / ' + toClass.stream : ''}</div>
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 shadow-lg text-center flex flex-col justify-center">
                                        <div className="text-4xl font-black italic tracking-tighter text-blue-600 mb-2 animate-pulse">{selectedStudentIds.size}</div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Personnel Units</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Protocol Notes / Authorization Reason</label>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-[2rem] p-6 font-black uppercase text-xs text-foreground dark:text-white placeholder:opacity-20 min-h-[140px] focus:ring-2 ring-slate-200 dark:ring-slate-800 transition-all"
                                            placeholder="ENTER OPTIONAL MODIFIER OR LOG NOTES..."
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-[2rem]">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 italic leading-tight">Billing Strategy: Automatic Initialization</div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-widest leading-relaxed">
                                                Upon authorization, new fee structures for <strong className="text-emerald-600">KES {totalNewFees.toLocaleString()}</strong> will be deployed for the current active period.
                                            </p>
                                        </div>

                                        <div className="p-6 bg-amber-50 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/20 rounded-[2rem] flex items-start gap-4">
                                            <AlertCircle size={20} className="text-amber-500 mt-1 shrink-0" />
                                            <p className="text-[10px] font-bold text-amber-700/60 dark:text-amber-500/40 uppercase italic tracking-widest leading-relaxed">
                                                This action establishes a permanent transition request. Record mutation is only finalized upon Principal audit.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6">
                                    <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400" onClick={() => setStep('review-students')}>
                                        <ChevronLeft size={18} className="mr-2" /> REVERT AUDIT
                                    </Button>
                                    <Button
                                        className="h-14 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-30"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <ShieldCheck size={18} className="mr-2" />}
                                        Initialize Academic Transition
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
