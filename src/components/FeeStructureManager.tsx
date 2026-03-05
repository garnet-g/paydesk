'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Coins, X, Loader2, Wallet, Info, Filter, MoreHorizontal, ChevronRight, Check, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'

interface FeeStructureManagerProps {
    schoolId?: string
}

const FEE_CATEGORIES = [
    { value: 'TUITION', label: 'Tuition', color: 'blue' },
    { value: 'BOARDING', label: 'Boarding', color: 'purple' },
    { value: 'TRANSPORT', label: 'Transport', color: 'emerald' },
    { value: 'TRIPS', label: 'Trips/Excursions', color: 'amber' },
    { value: 'UNIFORMS', label: 'Uniforms', color: 'pink' },
    { value: 'BOOKS', label: 'Books/Materials', color: 'indigo' },
    { value: 'EXAM_FEES', label: 'Exam Fees', color: 'red' },
    { value: 'ACTIVITIES', label: 'Activities/Clubs', color: 'teal' },
    { value: 'OTHER', label: 'Other', color: 'slate' }
]

export default function FeeStructureManager({ schoolId }: FeeStructureManagerProps) {
    const [feeStructures, setFeeStructures] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [academicPeriods, setAcademicPeriods] = useState<any[]>([])
    const [selectedPeriod, setSelectedPeriod] = useState('')
    const [selectedClass, setSelectedClass] = useState('')
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingFee, setEditingFee] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        category: 'TUITION',
        displayOrder: 0,
        classId: '',
        applyToAllClasses: false
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (selectedPeriod) {
            fetchFeeStructures()
        }
    }, [selectedPeriod, selectedClass])

    const fetchInitialData = async () => {
        try {
            const [classesRes, periodsRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/academic-periods')
            ])

            if (classesRes.ok) {
                const classesData = await classesRes.json()
                setClasses(classesData)
            }

            if (periodsRes.ok) {
                const periodsData = await periodsRes.json()
                setAcademicPeriods(periodsData)
                const activePeriod = periodsData.find((p: any) => p.isActive)
                if (activePeriod) {
                    setSelectedPeriod(activePeriod.id)
                }
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error)
            toast.error("Resource fetch failed")
        } finally {
            setLoading(false)
        }
    }

    const fetchFeeStructures = async () => {
        if (!selectedPeriod) return

        setLoading(true)
        try {
            const params = new URLSearchParams({
                academicPeriodId: selectedPeriod,
                ...(selectedClass && { classId: selectedClass }),
                ...(schoolId && { schoolId })
            })

            const res = await fetch(`/api/fee-structures?${params}`)
            if (res.ok) {
                const data = await res.json()
                setFeeStructures(data)
            }
        } catch (error) {
            console.error('Failed to fetch fee structures:', error)
            toast.error("Financial data sync error")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const url = editingFee ? `/api/fee-structures/${editingFee.id}` : '/api/fee-structures'
            const method = editingFee ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    academicPeriodId: selectedPeriod,
                    ...(schoolId && { schoolId })
                })
            })

            if (res.ok) {
                toast.success(editingFee ? "Fee allocation modified" : "New fee structure deployed")
                fetchFeeStructures()
                setShowAddModal(false)
                setEditingFee(null)
                resetForm()
            } else {
                const err = await res.text()
                toast.error(err || 'Failed to authorize transaction')
            }
        } catch (error) {
            toast.error('System error during fee deployment')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('EXTERMINATE ALLOCATION: Are you sure? This will remove this fee from all systemic calculations.')) return

        try {
            const res = await fetch(`/api/fee-structures/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Fee structure expunged")
                fetchFeeStructures()
            } else {
                toast.error("Deletion rejected")
            }
        } catch (error) {
            toast.error('Failed to delete resource')
        }
    }

    const handleEdit = (fee: any) => {
        setEditingFee(fee)
        setFormData({
            name: fee.name,
            description: fee.description || '',
            amount: fee.amount.toString(),
            category: fee.category,
            displayOrder: fee.displayOrder,
            classId: fee.classId || '',
            applyToAllClasses: false
        })
        setShowAddModal(true)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            amount: '',
            category: 'TUITION',
            displayOrder: 0,
            classId: '',
            applyToAllClasses: false
        })
    }

    const closeModal = () => {
        setShowAddModal(false)
        setEditingFee(null)
        resetForm()
    }

    const getCategoryStyles = (category: string) => {
        const cat = FEE_CATEGORIES.find(c => c.value === category)
        if (!cat) return 'bg-slate-100 text-slate-700'

        const colors: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
            slate: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
        }

        return colors[cat.color] || 'bg-slate-100 text-slate-700'
    }

    const getCategoryLabel = (category: string) =>
        FEE_CATEGORIES.find(c => c.value === category)?.label || category

    const groupedFees = feeStructures.reduce((acc: any, fee: any) => {
        const key = fee.classId || 'general'
        if (!acc[key]) {
            acc[key] = {
                className: fee.class
                    ? `${fee.class.name} ${fee.class.stream || ''}`.trim()
                    : (fee.classId ? 'Loading Class...' : 'Consolidated / All Units'),
                fees: []
            }
        }
        acc[key].fees.push(fee)
        return acc
    }, {})

    return (
        <div className="animate-in fade-in duration-700 space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Wallet size={24} />
                        </div>
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Fee Management</h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Set up and manage school fee structures and <span className="text-blue-600 font-semibold ">Allocations</span>
                    </p>
                </div>
                <Button
                    className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-xl shadow-slate-200 dark:shadow-none transition-all"
                    onClick={() => { resetForm(); setShowAddModal(true) }}
                >
                    <Plus size={18} className="mr-2" />
                    Add New Fee
                </Button>
            </div>

            {/* Selection Filters */}
            <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Academic Term</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="h-14 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-900 dark:text-white transition-all shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-blue-600" />
                                        <SelectValue placeholder="Select Term..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                                    {academicPeriods.length === 0 ? (
                                        <SelectItem value="none" disabled>No Periods Defined</SelectItem>
                                    ) : (
                                        academicPeriods.map(period => (
                                            <SelectItem key={period.id} value={period.id} className="font-bold">
                                                {period.academicYear} — {period.term.replace('_', ' ')} {period.isActive && '[ACTIVE MISSION]'}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Class Filter</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-14 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-900 dark:text-white transition-all shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} className="text-blue-600" />
                                        <SelectValue placeholder="All Divisions" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                                    <SelectItem value="all_classes" className="font-bold">ALL CLASSES</SelectItem>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id} className="font-bold">
                                            {cls.name} {cls.stream}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Deployment Map (Content) */}
            {loading ? (
                <div className="py-24 text-center">
                    <div className="inline-flex items-center gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                        <span className="text-2xl font-black text-slate-400 uppercase italic tracking-tighter animate-pulse">Syncing Treasury Data...</span>
                    </div>
                </div>
            ) : Object.keys(groupedFees).length === 0 ? (
                <div className="py-24 text-center bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-xl border-2 border-dashed border-slate-100 dark:border-slate-900">
                    <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Coins size={48} className="text-slate-200 dark:text-slate-800" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter">Vault Empty</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic max-w-sm mx-auto mb-8">
                        {!selectedPeriod ? 'Initialize an academic period to map treasury allocations.' : 'No fee structures have been deployed for this cycle phase yet.'}
                    </p>
                    {selectedPeriod && (
                        <Button
                            variant="outline"
                            className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest border-slate-200 dark:border-slate-800"
                            onClick={() => { resetForm(); setShowAddModal(true) }}
                        >
                            <Plus size={18} className="mr-2 text-blue-600" />
                            Launch First Allocation
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedFees).map(([key, group]: [string, any]) => (
                        <Card key={key} className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden group">
                            {/* Section Header */}
                            <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-blue-400 border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                                        <Wallet size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-tight">{group.className}</h3>
                                        <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1 italic">
                                            {group.fees.length} Allocation Items • Billing Sector
                                        </p>
                                    </div>
                                </div>
                                <div className="relative z-10 text-right mt-6 md:mt-0">
                                    <div className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-1 italic">Aggregate Assessment</div>
                                    <div className="text-3xl font-black tracking-tighter text-white uppercase italic">
                                        {formatCurrency(group.fees.reduce((sum: number, fee: any) => sum + fee.amount, 0))}
                                    </div>
                                </div>
                            </div>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Source</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Description</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                            {group.fees.map((fee: any) => (
                                                <tr key={fee.id} className="group/row hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors border-l-4 border-transparent hover:border-blue-600">
                                                    <td className="px-8 py-6">
                                                        <Badge className={cn(
                                                            "font-black text-[9px] px-3 h-6 uppercase tracking-widest border-none shadow-none",
                                                            getCategoryStyles(fee.category)
                                                        )}>
                                                            {getCategoryLabel(fee.category)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{fee.name}</div>
                                                        {fee.description && (
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase italic mt-0.5 max-w-sm truncate">{fee.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">KES</span>
                                                            <span className="text-base font-black text-slate-900 dark:text-white tracking-widest">{fee.amount.toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex gap-2 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-300 hover:text-blue-600 transition-all"
                                                                onClick={() => handleEdit(fee)}
                                                                title="Modify Parameters"
                                                            >
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all"
                                                                onClick={() => handleDelete(fee.id)}
                                                                title="Expunge Record"
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Allocation Modality (Add/Edit Modal) */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] p-0 overflow-hidden">
                    <DialogHeader className="bg-slate-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-blue-400 border border-white/10 shadow-xl">
                                <TrendingUp size={28} />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                                    {editingFee ? 'Modify Allocation' : 'Deploy Allocation'}
                                </DialogTitle>
                                <DialogDescription className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1 italic">
                                    {editingFee ? 'Updating fiscal parameters in systemic registry' : 'Establishing new recurring financial obligation'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Descriptor</Label>
                                <Input
                                    type="text"
                                    required
                                    placeholder="e.g. ADVANCED LABORATORY RESOURCE FEE"
                                    className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white uppercase placeholder:opacity-30"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta Description (Optional)</Label>
                                <Input
                                    type="text"
                                    placeholder="BRIEF MISSION OVERVIEW..."
                                    className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-700 dark:text-slate-300 italic uppercase placeholder:opacity-30"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Category</Label>
                                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                        <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {FEE_CATEGORIES.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value} className="font-bold">
                                                    {cat.label.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valuation (KES)</Label>
                                    <Input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-lg text-slate-900 dark:text-white"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Division Restriction</Label>
                                <Select
                                    value={formData.classId}
                                    onValueChange={(v) => setFormData({ ...formData, classId: v === 'school-wide' ? '' : v, applyToAllClasses: false })}
                                    disabled={formData.applyToAllClasses}
                                >
                                    <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest">
                                        <SelectValue placeholder="SYSTEM-WIDE (GENERAL)" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="school-wide" className="font-bold">SYSTEM-WIDE (ALL DIVISIONS)</SelectItem>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id} className="font-bold">
                                                {cls.name.toUpperCase()} {cls.stream?.toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {!editingFee && (
                                <div className="flex items-center justify-between p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 rounded-[1.5rem] cursor-pointer group/check" onClick={() => setFormData({ ...formData, applyToAllClasses: !formData.applyToAllClasses, classId: '' })}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all",
                                            formData.applyToAllClasses ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200" : "border-slate-200 dark:border-slate-800"
                                        )}>
                                            {formData.applyToAllClasses && <Check size={18} className="text-white" />}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Mass Unit Deployment</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Replicates allocation for every existing division</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                onClick={closeModal}
                            >
                                Abort Mission
                            </Button>
                            <Button
                                type="submit"
                                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 dark:shadow-none"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>
                                        <Check size={18} className="mr-2" />
                                        {editingFee ? 'Confirm Parameters' : 'Authorize Deployment'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
