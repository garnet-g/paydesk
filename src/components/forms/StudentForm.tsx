'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, X, Check, Loader2, GraduationCap, Mail, Phone, User as UserIcon, Calendar, Info } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

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
                setParents(data)
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
                onSuccess()
                onClose()
            } else {
                const err = await res.text()
                alert('Error: ' + err)
            }
        } catch (error) {
            console.error('Request failed:', error)
            alert('Failed to save student')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-border dark:border-slate-800">
            <div className="p-8 border-b border-border dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                        <GraduationCap size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground dark:text-white tracking-tight italic uppercase">
                            {isEditing ? 'Update Student' : 'New Registration'}
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">
                            {isEditing ? `Refining Details for ${student.admissionNumber}` : 'Registering New Admission'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-foreground transition-all border border-transparent hover:border-border shadow-none"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Info size={16} className="text-blue-600" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">Admission Number</Label>
                            <Input
                                required
                                value={formData.admissionNumber}
                                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                                disabled={isEditing}
                                placeholder="ADM-2026-001"
                                className="h-14 rounded-2xl border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-bold focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">Current Class</Label>
                            <Select
                                value={formData.classId}
                                onValueChange={(v) => setFormData({ ...formData, classId: v })}
                                required
                            >
                                <SelectTrigger className="h-14 rounded-2xl border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 font-bold">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="font-bold">
                                            {c.name} {c.stream}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2 text-primary-950">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">First Name</Label>
                            <Input
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="h-14 rounded-2xl border-border dark:border-slate-800 font-bold text-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">Middle Name</Label>
                            <Input
                                value={formData.middleName}
                                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                className="h-14 rounded-2xl border-border dark:border-slate-800 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">Last Name</Label>
                            <Input
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="h-14 rounded-2xl border-border dark:border-slate-800 font-bold"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">Gender</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(v) => setFormData({ ...formData, gender: v })}
                            >
                                <SelectTrigger className="h-14 rounded-2xl border-border dark:border-slate-800 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="Male" className="font-bold">Male</SelectItem>
                                    <SelectItem value="Female" className="font-bold">Female</SelectItem>
                                    <SelectItem value="Other" className="font-bold">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">Birth Date</Label>
                            <Input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                className="h-14 rounded-2xl border-border dark:border-slate-800 font-bold"
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic px-1">Current Status</Label>
                            <div className="flex gap-4">
                                {['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED'].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                            formData.status === s
                                                ? "bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 shadow-lg"
                                                : "bg-slate-50 dark:bg-slate-900/50 text-slate-400 border border-border dark:border-slate-800 hover:bg-slate-100"
                                        )}
                                        onClick={() => setFormData({ ...formData, status: s })}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-border dark:border-slate-800 space-y-6">
                    <div className="flex items-center gap-2">
                        <UserIcon size={16} className="text-purple-600" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Guardian Link</h3>
                    </div>

                    {selectedParent ? (
                        <div className="p-6 bg-white dark:bg-slate-950 border border-purple-100 dark:border-purple-900/30 rounded-[2rem] flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-200 dark:shadow-none italic uppercase">
                                    {selectedParent.firstName?.[0]}{selectedParent.lastName?.[0]}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-black text-sm uppercase tracking-tight text-foreground dark:text-white">
                                        {selectedParent.firstName} {selectedParent.lastName}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">
                                        {selectedParent.email}
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSelectedParent(null)}
                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 italic"
                            >
                                Change Guardian
                            </Button>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                                <Input
                                    type="text"
                                    placeholder="Search registered parents by name or email..."
                                    className="h-16 pl-14 pr-14 rounded-2xl border-border dark:border-slate-800 bg-white dark:bg-slate-950 font-bold shadow-sm"
                                    value={parentQuery}
                                    onChange={(e) => {
                                        setParentQuery(e.target.value)
                                        setShowResults(true)
                                    }}
                                    onFocus={() => setShowResults(true)}
                                />
                                {searching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-purple-600" size={20} />}
                            </div>

                            {showResults && (parentQuery || parents.length > 0) && (
                                <div className="absolute top-full left-0 w-full mt-4 bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl border border-border dark:border-slate-800 overflow-hidden z-[110] max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-300">
                                    {parents
                                        .filter(p => !parentQuery ||
                                            p.firstName?.toLowerCase().includes(parentQuery.toLowerCase()) ||
                                            p.lastName?.toLowerCase().includes(parentQuery.toLowerCase()) ||
                                            p.email?.toLowerCase().includes(parentQuery.toLowerCase())
                                        )
                                        .map(p => (
                                            <div
                                                key={p.id}
                                                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 border-b border-border dark:border-slate-800 cursor-pointer flex items-center justify-between group/item"
                                                onClick={() => {
                                                    setSelectedParent(p)
                                                    setShowResults(false)
                                                    setParentQuery('')
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 flex items-center justify-center text-xs font-black uppercase group-hover/item:bg-purple-100 group-hover/item:text-purple-600 transition-colors">
                                                        {p.firstName?.[0]}{p.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black uppercase tracking-tight">{p.firstName} {p.lastName}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase italic">{p.email}</div>
                                                    </div>
                                                </div>
                                                <Check className="text-purple-600 opacity-0 group-hover/item:opacity-100 transition-opacity" size={20} />
                                            </div>
                                        ))}
                                    {parents.length === 0 && !searching && (
                                        <div className="p-12 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-6">No Parents Found in Database</p>
                                            <Button asChild size="sm" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px] italic">
                                                <Link href="/dashboard/settings/import">Import Parents</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-14 flex-1 rounded-2xl border-border dark:border-slate-800 font-black uppercase tracking-widest text-[10px] italic"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="h-14 flex-[2] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] italic shadow-xl shadow-blue-200 dark:shadow-none"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : isEditing ? 'Save Changes' : 'Register Student'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
