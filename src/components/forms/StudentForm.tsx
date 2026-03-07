'use client'

import { useState, useEffect } from 'react'
import {
    Search,
    UserPlus,
    X,
    Check,
    Loader2,
    GraduationCap,
    Mail,
    Phone,
    User as UserIcon,
    Calendar,
    Info,
    ShieldCheck,
    ArrowRight,
    User,
    Users
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface StudentFormProps {
    student?: any
    onClose: () => void
    onSuccess: () => void
}

export default function StudentForm({ student, onClose, onSuccess }: StudentFormProps) {
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<any[]>([])

    // Parent Search State
    const [parentQuery, setParentQuery] = useState('')
    const [parents, setParents] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedParent, setSelectedParent] = useState<any>(student?.guardians?.[0]?.user || null)
    const [showResults, setShowResults] = useState(false)

    const [formData, setFormData] = useState({
        admissionNumber: student?.admissionNumber || '',
        firstName: student?.firstName || '',
        lastName: student?.lastName || '',
        middleName: student?.middleName || '',
        gender: student?.gender || 'Male',
        dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        classId: student?.classId || '',
        status: student?.status || 'ACTIVE'
    })

    const isEditing = !!student

    useEffect(() => {
        fetchClasses()
        fetchParents()
    }, [])

    const fetchParents = async () => {
        setSearching(true)
        try {
            const res = await fetch('/api/parents')
            if (res.ok) {
                const data = await res.json()
                setParents(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Failed to fetch parents:', error)
        } finally {
            setSearching(false)
        }
    }

    const fetchClasses = async () => {
        try {
            const res = await fetch('/api/classes')
            if (res.ok) {
                const data = await res.json()
                setClasses(data)
            }
        } catch (error) {
            console.error('Failed to fetch classes:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const payload = {
            ...formData,
            parentEmail: selectedParent?.email || '',
        }

        try {
            const url = isEditing ? `/api/students/${student.id}` : '/api/students'
            const method = isEditing ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(isEditing ? 'Registry profile updated successfully.' : 'New Admission Protocol: Success')
                onSuccess()
                onClose()
            } else {
                const err = await res.text()
                toast.error('Admission Rejected: ' + err)
            }
        } catch (error) {
            toast.error('Registry Synchronization Error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-border dark:border-slate-800 animate-in zoom-in-95 duration-300">
            {/* Tactical Header */}
            <div className="bg-blue-600 dark:bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden border-none translate-y-[1px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-xl transition-all hover:scale-110">
                        <GraduationCap size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                            {isEditing ? 'Update Student' : 'New Enrollment'}
                        </h2>
                        <p className="text-blue-100 font-black text-[10px] uppercase tracking-[0.2em] mt-1 italic">
                            {isEditing ? `Registry: ${student.admissionNumber}` : 'Establishing new student registry record'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                    onClick={onClose}
                >
                    <X size={24} />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-12">
                {/* Section 1: Core Identification */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="h-0.5 w-8 bg-blue-600"></div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Biological & Structural Identity</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Serial Admission Number</Label>
                            <Input
                                required
                                value={formData.admissionNumber}
                                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                                disabled={isEditing}
                                className="h-14 rounded-2xl border-border dark:border-slate-800 bg-white dark:bg-slate-900/50 font-black tracking-tight focus:ring-4 focus:ring-blue-600/5 transition-all text-foreground"
                                placeholder="STU-XXXX-2024"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Assigned Division / Class</Label>
                            <Select
                                value={formData.classId}
                                onValueChange={(v) => setFormData({ ...formData, classId: v })}
                                required
                            >
                                <SelectTrigger className="h-14 rounded-2xl border-border dark:border-slate-800 bg-white dark:bg-slate-900/50 font-black transition-all text-foreground">
                                    <SelectValue placeholder="LOCATE WING" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl">
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="font-black italic uppercase text-[10px] tracking-widest py-3 hover:bg-slate-50">
                                            {c.name} {c.stream}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Nomative Name</Label>
                            <Input
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="h-14 rounded-2xl border-border dark:border-slate-800 font-bold uppercase tracking-tight"
                                placeholder="FIRST"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Middle (M)</Label>
                            <Input
                                value={formData.middleName}
                                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                className="h-14 rounded-2xl border-border dark:border-slate-800 font-bold uppercase tracking-tight"
                                placeholder="MIDDLE"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Family Surname</Label>
                            <Input
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="h-14 rounded-2xl border-border dark:border-slate-800 font-bold uppercase tracking-tight"
                                placeholder="LASTNAME"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Gender Identification</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(v) => setFormData({ ...formData, gender: v })}
                            >
                                <SelectTrigger className="h-14 rounded-2xl border-border dark:border-slate-800 font-black transition-all">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl">
                                    <SelectItem value="Male" className="font-black italic uppercase text-[10px] tracking-widest py-3">Male</SelectItem>
                                    <SelectItem value="Female" className="font-black italic uppercase text-[10px] tracking-widest py-3">Female</SelectItem>
                                    <SelectItem value="Other" className="font-black italic uppercase text-[10px] tracking-widest py-3">Selective</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Temporal Origin (Birth Date)</Label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <Input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    className="h-14 pl-12 rounded-2xl border-border dark:border-slate-800 font-black italic tracking-widest"
                                />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isEditing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4 pt-4"
                            >
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Operational Lifecycle Status</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={cn(
                                                "py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all italic border",
                                                formData.status === s
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105 active:scale-95"
                                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-900/50 dark:border-slate-800"
                                            )}
                                            onClick={() => setFormData({ ...formData, status: s })}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Section 2: Guardian Synchronization */}
                <div className="p-10 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 dark:border-slate-900 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-blue-600/5 transform group-hover:scale-110 transition-transform">
                        <ShieldCheck size={120} />
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-0.5 w-8 bg-purple-600"></div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Anchor Link: Family Registry</h3>
                    </div>

                    <div className="relative z-10">
                        <AnimatePresence mode="wait">
                            {selectedParent ? (
                                <motion.div
                                    key="selected"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="p-8 bg-white dark:bg-slate-950 border border-purple-100 dark:border-purple-900/30 rounded-[2.5rem] flex items-center justify-between shadow-2xl transition-all hover:border-purple-200"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-[1.25rem] bg-slate-900 text-blue-400 flex items-center justify-center font-black shadow-lg shadow-blue-900/20 italic uppercase text-xl border border-slate-800">
                                            {selectedParent.firstName?.[0]}{selectedParent.lastName?.[0]}
                                        </div>
                                        <div>
                                            <div className="font-black text-xl uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none mb-1">
                                                {selectedParent.firstName} {selectedParent.lastName}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">
                                                <Mail size={12} className="text-purple-500" />
                                                {selectedParent.email}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setSelectedParent(null)}
                                        className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 italic border border-transparent hover:border-red-100 transition-all"
                                    >
                                        Expunge Link
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="relative"
                                >
                                    <div className="relative group/search">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-purple-600 transition-colors" size={24} />
                                        <Input
                                            type="text"
                                            placeholder="SCAN FAMILY REGISTRY BY NAME OR EMAIL..."
                                            className="h-20 pl-16 pr-20 rounded-[2rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black uppercase tracking-tight shadow-xl focus:ring-8 focus:ring-purple-600/5 transition-all text-sm"
                                            value={parentQuery}
                                            onChange={(e) => {
                                                setParentQuery(e.target.value)
                                                setShowResults(true)
                                            }}
                                            onFocus={() => setShowResults(true)}
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            {searching && <Loader2 className="animate-spin text-purple-600" size={24} />}
                                            {!searching && parentQuery && (
                                                <button onClick={() => setParentQuery('')} className="text-slate-300 hover:text-slate-500">
                                                    <X size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {showResults && (parentQuery || parents.length > 0) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                                className="absolute top-full left-0 w-full mt-4 bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 dark:border-slate-800 overflow-hidden z-[110] max-h-80 overflow-y-auto"
                                            >
                                                {parents
                                                    .filter(p => !parentQuery ||
                                                        p.firstName?.toLowerCase().includes(parentQuery.toLowerCase()) ||
                                                        p.lastName?.toLowerCase().includes(parentQuery.toLowerCase()) ||
                                                        p.email?.toLowerCase().includes(parentQuery.toLowerCase())
                                                    )
                                                    .map(p => (
                                                        <div
                                                            key={p.id}
                                                            className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 border-b border-slate-50 dark:border-slate-900 cursor-pointer flex items-center justify-between group/item transition-colors"
                                                            onClick={() => {
                                                                setSelectedParent(p)
                                                                setShowResults(false)
                                                                setParentQuery('')
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-5">
                                                                <div className="h-12 w-12 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center text-sm font-black italic uppercase group-hover/item:scale-110 transition-transform shadow-lg shadow-slate-900/20">
                                                                    {p.firstName?.[0]}{p.lastName?.[0]}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-black uppercase tracking-tight italic">{p.firstName} {p.lastName}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">{p.email}</div>
                                                                </div>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white opacity-0 group-hover/item:opacity-100 transition-all -translate-x-4 group-hover/item:translate-x-0">
                                                                <Check size={18} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                {parents.length === 0 && !searching && (
                                                    <div className="p-16 text-center space-y-6">
                                                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto">
                                                            <Users size={32} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic mb-6">Family Data Node Not Found</p>
                                                            <Button asChild variant="outline" size="sm" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] italic border-slate-200">
                                                                <Link href="/dashboard/settings/import">Initialize Batch Import</Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Final Submission */}
                <div className="flex flex-col md:flex-row gap-6 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-16 px-10 rounded-2xl border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] italic hover:bg-slate-50 transition-all flex-1"
                        disabled={loading}
                    >
                        Abort Registration
                    </Button>
                    <Button
                        type="submit"
                        className="h-16 px-12 rounded-2xl bg-black hover:bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] italic shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-none transition-all flex-[2] active:scale-[0.98]"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                            <div className="flex items-center gap-3">
                                {isEditing ? 'COMMIT PROFILE RE-CALIBRATION' : 'INITIALIZE STUDENT ADMISSION'}
                                <ArrowRight size={18} />
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
