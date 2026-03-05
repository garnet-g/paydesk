'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, Check, Trash2, AlertCircle, X, Loader2, Clock, CalendarDays } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function AcademicPeriodManager({ onClose, onSuccess }: { onClose?: () => void, onSuccess?: () => void }) {
    const [periods, setPeriods] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [form, setForm] = useState({
        term: 'TERM_1',
        academicYear: new Date().getFullYear().toString(),
        startDate: '',
        endDate: '',
        isActive: false
    })

    const fetchPeriods = async () => {
        try {
            const res = await fetch('/api/academic-periods')
            if (res.ok) setPeriods(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchPeriods()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/academic-periods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                await fetchPeriods()
                if (onSuccess) onSuccess()
                setShowForm(false)
                setForm({
                    term: 'TERM_1',
                    academicYear: new Date().getFullYear().toString(),
                    startDate: '',
                    endDate: '',
                    isActive: false
                })
                toast.success("Academic term created")
            } else {
                const txt = await res.text()
                setError(txt)
                toast.error(txt || "Failed to create period")
            }
        } catch (e) {
            setError('Failed to create period')
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const activatePeriod = async (id: string) => {
        if (!confirm('Activate this period? This will deactivate all other active periods.')) return
        try {
            const res = await fetch(`/api/academic-periods/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: true })
            })
            if (res.ok) {
                await fetchPeriods()
                if (onSuccess) onSuccess()
                toast.success("Period activated")
            }
        } catch (e) { console.error(e) }
    }

    const deletePeriod = async (id: string) => {
        if (!confirm('Delete this period? This cannot be undone.')) return
        try {
            const res = await fetch(`/api/academic-periods/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchPeriods()
                toast.success("Period deleted")
            }
            else {
                toast.error('Cannot delete: Period has associated data or is active.')
            }
        } catch (e) { console.error(e) }
    }

    return (
        <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-blue-400 border border-white/10 shadow-xl">
                        <CalendarDays size={28} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-semibold tracking-tight uppercase">Academic Terms</h3>
                        <p className="text-blue-400 font-semibold text-[10px] uppercase tracking-wide mt-1">School Academic Calendar</p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    {!showForm && (
                        <Button
                            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/40 border-none"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={18} className="mr-2" />
                            Add Term
                        </Button>
                    )}
                    {onClose && (
                        <Button variant="ghost" className="text-white/40 hover:text-white h-12 w-12 p-0 rounded-xl" onClick={onClose}>
                            <X size={24} />
                        </Button>
                    )}
                </div>
            </div>

            <CardContent className="p-8">
                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-in slide-in-from-top duration-300">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {showForm && (
                    <div className="mb-12 p-8 bg-muted dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-[2rem] animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-sm font-black text-foreground dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="h-1 w-8 bg-blue-600 rounded-full"></span>
                                New Academic Term
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                                onClick={() => setShowForm(false)}
                            >
                                <X size={16} />
                            </Button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Term Name</Label>
                                    <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                                        <SelectTrigger className="h-14 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest text-foreground dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border dark:border-slate-800">
                                            <SelectItem value="TERM_1" className="font-bold">TERM 1</SelectItem>
                                            <SelectItem value="TERM_2" className="font-bold">TERM 2</SelectItem>
                                            <SelectItem value="TERM_3" className="font-bold">TERM 3</SelectItem>
                                            <SelectItem value="SUMMER" className="font-bold">SUMMER / SPECIAL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Academic Year</Label>
                                    <Input
                                        type="number"
                                        className="h-14 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-2xl font-black text-lg text-foreground dark:text-white"
                                        placeholder="2026"
                                        required
                                        value={form.academicYear}
                                        onChange={e => setForm({ ...form, academicYear: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Start Date</Label>
                                    <Input
                                        type="date"
                                        className="h-14 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-2xl font-black text-foreground dark:text-white"
                                        required
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">End Date</Label>
                                    <Input
                                        type="date"
                                        className="h-14 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-2xl font-black text-foreground dark:text-white"
                                        required
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-950 border border-border dark:border-slate-800 rounded-[1.5rem] shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer",
                                        form.isActive ? "bg-emerald-500 border-emerald-500" : "border-border dark:border-slate-800"
                                    )} onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={form.isActive}
                                            onChange={() => { }}
                                        />
                                        {form.isActive && <Check size={18} className="text-white" />}
                                    </div>
                                    <div className="cursor-pointer" onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                                        <div className="text-[10px] font-semibold text-foreground dark:text-white uppercase tracking-wide">Set as current active term</div>
                                        <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">This will be the default term for new invoices</div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-foreground dark:hover:text-white"
                                        onClick={() => setShowForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="h-12 px-8 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                            <>
                                                <Check size={18} className="mr-2" />
                                                Create Term
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Periods Table */}
                {periods.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="h-24 w-24 bg-muted dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Calendar size={48} className="text-slate-200 dark:text-slate-800" />
                        </div>
                        <h3 className="text-2xl font-semibold text-foreground dark:text-white mb-2 uppercase tracking-tight">No Terms Defined</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                            No academic periods have been defined yet. Add a term to get started.
                        </p>
                    </div>
                ) : (
                    <div className="border border-border dark:border-slate-900 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-950 shadow-inner">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted dark:bg-slate-900/50 border-b border-border dark:border-slate-900">
                                    <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Term</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Year</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Dates</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                {periods.map((p) => (
                                    <tr key={p.id} className="group hover:bg-muted/50 dark:hover:bg-slate-900/20 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                                <span className="font-semibold text-foreground dark:text-white uppercase tracking-tight text-sm">{p.term.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-slate-600 dark:text-slate-400">{p.academicYear}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-tighter">
                                                <div className="px-3 py-1 bg-white dark:bg-slate-950 border border-border dark:border-slate-900 rounded-lg">{formatDate(p.startDate)}</div>
                                                <ChevronRightIcon />
                                                <div className="px-3 py-1 bg-white dark:bg-slate-950 border border-border dark:border-slate-900 rounded-lg">{formatDate(p.endDate)}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge className={cn(
                                                "font-black text-[9px] px-3 h-6 uppercase tracking-widest border-none",
                                                p.isActive
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : "bg-muted text-slate-500 dark:bg-slate-900 dark:text-slate-500"
                                            )}>
                                                {p.isActive ? (
                                                    <span className="flex items-center gap-1.5 leading-none">
                                                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                        CURRENT ACTIVE
                                                    </span>
                                                ) : 'INACTIVE'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {!p.isActive && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 w-10 p-0 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 text-slate-300 transition-colors"
                                                        onClick={() => activatePeriod(p.id)}
                                                        title="Activate"
                                                    >
                                                        <Check size={18} />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "h-10 w-10 p-0 rounded-xl transition-colors",
                                                        p.isActive
                                                            ? "text-slate-100 dark:text-slate-800 cursor-not-allowed opacity-20"
                                                            : "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 text-slate-300"
                                                    )}
                                                    onClick={() => !p.isActive && deletePeriod(p.id)}
                                                    disabled={p.isActive}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function ChevronRightIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    )
}
