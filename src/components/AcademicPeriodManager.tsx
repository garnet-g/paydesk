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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-8 flex justify-between items-center relative overflow-hidden border-b border-border dark:border-slate-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 shadow-xl">
                        <CalendarDays size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold tracking-tight text-foreground dark:text-white">Academic Terms</h3>
                        <p className="text-blue-600/70 dark:text-blue-400/70 font-medium text-xs mt-1">School Academic Calendar</p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    {!showForm && (
                        <Button
                            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 border-none transition-all"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={18} className="mr-2" />
                            Add Term
                        </Button>
                    )}
                    {onClose && (
                        <Button variant="ghost" className="text-foreground/40 dark:text-white/40 hover:text-foreground dark:hover:text-white h-12 w-12 p-0 rounded-xl" onClick={onClose}>
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
                    <div className="mb-12 p-8 bg-muted/50 dark:bg-slate-900/30 border border-border dark:border-slate-800 rounded-[2rem] animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
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
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground ml-1">Term Name</Label>
                                    <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                                        <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-xl font-medium text-sm text-foreground dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border dark:border-slate-800">
                                            <SelectItem value="TERM_1">Term 1</SelectItem>
                                            <SelectItem value="TERM_2">Term 2</SelectItem>
                                            <SelectItem value="TERM_3">Term 3</SelectItem>
                                            <SelectItem value="SUMMER">Summer / Special</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground ml-1">Academic Year</Label>
                                    <Input
                                        type="number"
                                        className="h-12 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-xl font-normal text-base text-foreground dark:text-white"
                                        placeholder="2026"
                                        required
                                        value={form.academicYear}
                                        onChange={e => setForm({ ...form, academicYear: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground ml-1">Start Date</Label>
                                    <Input
                                        type="date"
                                        className="h-12 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-xl font-normal text-base text-foreground dark:text-white"
                                        required
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground ml-1">End Date</Label>
                                    <Input
                                        type="date"
                                        className="h-12 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-xl font-normal text-base text-foreground dark:text-white"
                                        required
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-950 border border-border dark:border-slate-800 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer",
                                        form.isActive ? "bg-emerald-500 border-emerald-500" : "border-border dark:border-slate-800"
                                    )} onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={form.isActive}
                                            onChange={() => { }}
                                        />
                                        {form.isActive && <Check size={14} className="text-white" />}
                                    </div>
                                    <div className="cursor-pointer" onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                                        <div className="text-sm font-medium text-foreground dark:text-white">Set as current active term</div>
                                        <div className="text-xs font-normal text-muted-foreground mt-0.5">This will be the default term for new invoices</div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-10 px-4 rounded-lg font-medium text-sm text-muted-foreground hover:text-foreground dark:hover:text-white"
                                        onClick={() => setShowForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-600/20 transition-all"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : (
                                            <>
                                                <Check size={16} className="mr-2" />
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
                        <div className="h-20 w-20 bg-muted dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Calendar size={40} className="text-slate-300 dark:text-slate-700" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">No Terms Defined</h3>
                        <p className="text-muted-foreground font-normal max-w-sm mx-auto">
                            No academic periods have been defined yet. Add a term to get started.
                        </p>
                    </div>
                ) : (
                    <div className="border border-border dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/60 dark:bg-slate-900/30 border-b border-border dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Term</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Year</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Dates</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                {periods.map((p) => (
                                    <tr key={p.id} className="group hover:bg-muted/30 dark:hover:bg-slate-900/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                                <span className="font-medium text-foreground dark:text-white text-sm">{p.term.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-600 dark:text-slate-400 text-sm">{p.academicYear}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs font-normal text-slate-600 dark:text-slate-400">
                                                <div className="px-2 py-1 bg-white dark:bg-slate-950 border border-border dark:border-slate-800 rounded-md text-xs">{formatDate(p.startDate)}</div>
                                                <ChevronRightIcon />
                                                <div className="px-2 py-1 bg-white dark:bg-slate-950 border border-border dark:border-slate-800 rounded-md text-xs">{formatDate(p.endDate)}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={cn(
                                                "font-medium text-xs px-3 h-6 border-none",
                                                p.isActive
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : "bg-muted text-muted-foreground dark:bg-slate-900 dark:text-slate-500"
                                            )}>
                                                {p.isActive ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                        Active
                                                    </span>
                                                ) : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
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
