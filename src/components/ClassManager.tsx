'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Users, Coins, X, Calendar, Loader2, Layers, ChevronRight, Search, Trash2, AlertCircle } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import AcademicPeriodManager from './AcademicPeriodManager'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function ClassManager() {
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [staff, setStaff] = useState<any[]>([])

    // Forms State
    const [formData, setFormData] = useState({
        name: '',
        stream: '',
        homeroomTeacherId: ''
    })
    const [editData, setEditData] = useState({
        id: '',
        name: '',
        stream: '',
        homeroomTeacherId: ''
    })

    // Fee Management State
    const [showFeeModal, setShowFeeModal] = useState(false)
    const [selectedClass, setSelectedClass] = useState<any>(null)
    const [classFees, setClassFees] = useState<any[]>([])
    const [feeLoading, setFeeLoading] = useState(false)
    const [feeData, setFeeData] = useState({ name: '', amount: '', category: 'TUITION' })
    const [applyToGrade, setApplyToGrade] = useState(false)

    // Academic Period Manager State
    const [showPeriodManager, setShowPeriodManager] = useState(false)

    useEffect(() => {
        fetchClasses()
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        try {
            const res = await fetch('/api/staff')
            if (res.ok) {
                const data = await res.json()
                // Only show teachers
                setStaff(data.filter((s: any) => s.role === 'TEACHER'))
            }
        } catch (error) {
            console.error('Failed to fetch staff', error)
        }
    }

    const fetchClasses = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/classes')
            if (res.ok) {
                const data = await res.json()
                setClasses(data)
            }
        } catch (error) {
            console.error('Failed to fetch classes', error)
            toast.error("Failed to load classes")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                fetchClasses()
                setShowAddModal(false)
                setFormData({ name: '', stream: '', homeroomTeacherId: '' })
                toast.success("Class created successfully")
            } else {
                const err = await res.text()
                toast.error(err || "Failed to add class")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch(`/api/classes/${editData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editData.name,
                    stream: editData.stream,
                    homeroomTeacherId: editData.homeroomTeacherId || null
                })
            })

            if (res.ok) {
                fetchClasses()
                setShowEditModal(false)
                toast.success("Class updated successfully")
            } else {
                const err = await res.text()
                toast.error(err || "Failed to update class")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const openEditModal = (cls: any) => {
        setEditData({
            id: cls.id,
            name: cls.name,
            stream: cls.stream || '',
            homeroomTeacherId: cls.homeroomTeacher?.id || ''
        })
        setShowEditModal(true)
    }

    const openFeeModal = async (cls: any) => {
        setSelectedClass(cls)
        setShowFeeModal(true)
        fetchClassFees(cls.id)
    }

    const fetchClassFees = async (classId: string) => {
        setFeeLoading(true)
        try {
            const res = await fetch(`/api/classes/${classId}/fees`)
            if (res.ok) {
                const data = await res.json()
                setClassFees(data.fees || [])
            }
        } catch (error) {
            console.error('Error fetching fees', error)
        } finally {
            setFeeLoading(false)
        }
    }

    const handleAddFee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClass) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/classes/${selectedClass.id}/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...feeData, applyToGrade })
            })

            if (res.ok) {
                fetchClassFees(selectedClass.id)
                setFeeData({ name: '', amount: '', category: 'TUITION' })
                setApplyToGrade(false)
                toast.success("Fee added successfully")
            } else {
                const err = await res.text()
                toast.error(err || "Failed to add fee")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemoveFee = async (feeId: string) => {
        try {
            const res = await fetch(`/api/fee-structures/${feeId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                if (selectedClass) fetchClassFees(selectedClass.id)
                toast.success("Fee removed")
            } else {
                toast.error("Failed to remove fee")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.stream && c.stream.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">Classes</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Configure classes, streams, and fee structures</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="h-12 px-6 rounded-2xl font-semibold text-xs border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                        onClick={() => setShowPeriodManager(true)}
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        Academic Terms
                    </Button>
                    <Button
                        className="flex-1 md:flex-none h-12 px-6 rounded-2xl font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Class
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                <CardContent className="p-4 md:p-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Filter by class name or stream..."
                            className="pl-11 h-12 bg-muted dark:bg-slate-950 border-none rounded-2xl font-medium focus-visible:ring-blue-600 focus-visible:ring-offset-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Classes Grid */}
            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                    <p className="font-semibold text-foreground dark:text-white text-xs">Loading classes...</p>
                </div>
            ) : filteredClasses.length === 0 ? (
                <Card className="border-dashed border-slate-300 dark:border-slate-800 bg-muted/50 dark:bg-slate-900/30 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="h-24 w-24 bg-white dark:bg-slate-900 shadow-xl rounded-[2rem] flex items-center justify-center mb-8">
                            <Layers className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-semibold text-foreground dark:text-white mb-2 tracking-tight">No Classes Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
                            No classes have been registered in this system yet. Create your first class to begin enrollment.
                        </p>
                        <Button
                            className="h-12 px-8 rounded-2xl font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setShowAddModal(true)}
                        >
                            ADD FIRST CLASS
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredClasses.map(cls => (
                        <Card key={cls.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all border-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <CardHeader className="p-8 pb-4 flex-none">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-4 bg-muted dark:bg-slate-950 rounded-[1.5rem] group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                        <Layers size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 rounded-xl hover:bg-muted dark:hover:bg-slate-800"
                                            onClick={() => openEditModal(cls)}
                                        >
                                            <Edit2 size={16} className="text-slate-400 dark:text-slate-600" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-2xl font-semibold text-foreground dark:text-white tracking-tight">
                                            {cls.name}
                                        </CardTitle>
                                        {cls.stream && (
                                            <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-semibold text-xs items-center px-3 h-6">
                                                {cls.stream}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="text-slate-400 font-medium text-[10px]">
                                        Unit ID: {cls.id.slice(0, 8)}
                                        {cls.homeroomTeacher ? ` • Homeroom: ${cls.homeroomTeacher.firstName} ${cls.homeroomTeacher.lastName}` : ' • Unassigned'}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="px-8 py-4 flex-1">
                                <div className="flex items-center justify-between p-4 bg-muted dark:bg-slate-950 rounded-2xl border border-border dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Enrollment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-600" />
                                        <span className="font-semibold text-foreground dark:text-white">{cls._count?.students || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 pt-4">
                                <Button
                                    className="w-full h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-border dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all text-foreground dark:text-white font-semibold text-xs group/btn shadow-sm"
                                    onClick={() => openFeeModal(cls)}
                                >
                                    Manage Fees
                                    <ChevronRight className="ml-2 h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Fee Management Modal (using Dialog) */}
            <Dialog open={showFeeModal} onOpenChange={setShowFeeModal}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-950">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest">Financial Configuration</p>
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic">{selectedClass?.name} Fees</h3>
                            </div>
                            <Button variant="ghost" className="text-white/40 hover:text-white h-12 w-12 p-0 rounded-2xl" onClick={() => setShowFeeModal(false)}>
                                <X size={24} />
                            </Button>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                        {/* Current Fee Items */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
                                Current Fee Ledger
                            </h4>
                            {feeLoading ? (
                                <div className="py-12 text-center text-slate-400 font-bold italic text-xs animate-pulse">Syncing transactions...</div>
                            ) : classFees.length === 0 ? (
                                <div className="p-12 border-2 border-dashed border-border dark:border-slate-800 rounded-3xl text-center">
                                    <p className="text-slate-400 font-medium italic">No fee structures initialized for this class unit.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {classFees.map(fee => (
                                        <div key={fee.id} className="flex justify-between items-center p-5 bg-muted dark:bg-slate-900 rounded-[1.5rem] border border-border dark:border-slate-800 group/fee animate-in slide-in-from-bottom duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                                    <Coins size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground dark:text-white uppercase text-sm leading-tight">{fee.name}</div>
                                                    <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-black text-[8px] h-4 uppercase tracking-tighter px-2">
                                                        {fee.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="font-black text-lg text-foreground dark:text-white tracking-tighter">
                                                        {formatCurrency(fee.amount)}
                                                    </div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PER TERM CYCLE</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to remove this fee? It will be removed from all pending invoices.')) {
                                                            handleRemoveFee(fee.id);
                                                        }
                                                    }}
                                                    className="h-10 w-10 p-0 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 text-slate-300 dark:text-slate-700 transition-colors flex items-center justify-center border-none bg-transparent"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add New Fee Form */}
                        <div className="bg-muted dark:bg-slate-900/50 p-6 rounded-[2rem] border border-border dark:border-slate-800">
                            <h4 className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-widest mb-6 block">Manual Fee Addition</h4>
                            <form onSubmit={handleAddFee} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="uppercase text-[9px] font-black text-slate-400 tracking-widest ml-1">Fee Descriptor</Label>
                                        <Input
                                            className="h-12 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-xl font-medium"
                                            placeholder="e.g. Science Laboratory Fee"
                                            value={feeData.name}
                                            onChange={e => setFeeData({ ...feeData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="uppercase text-[9px] font-black text-slate-400 tracking-widest ml-1">Value (KES)</Label>
                                        <Input
                                            type="number"
                                            className="h-12 bg-white dark:bg-slate-950 border-border dark:border-slate-800 rounded-xl font-medium"
                                            placeholder="0.00"
                                            step="0.01"
                                            value={feeData.amount}
                                            onChange={e => setFeeData({ ...feeData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="uppercase text-[9px] font-black text-slate-400 tracking-widest ml-1">Classification Category</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {['TUITION', 'BOARDING', 'TRANSPORT', 'OTHER'].map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFeeData({ ...feeData, category: cat })}
                                                className={cn(
                                                    "h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    feeData.category === cat
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                        : "bg-white dark:bg-slate-950 border border-border dark:border-slate-800 text-slate-500"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-border dark:border-slate-800">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={cn(
                                            "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                            applyToGrade ? "bg-emerald-500 border-emerald-500" : "border-border dark:border-slate-800"
                                        )}>
                                            <input
                                                type="checkbox"
                                                checked={applyToGrade}
                                                onChange={e => setApplyToGrade(e.target.checked)}
                                                className="hidden"
                                            />
                                            {applyToGrade && <CheckIcon />}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apply to Grade Level Cluster</span>
                                    </label>
                                    <Button type="submit" className="w-full sm:w-auto h-12 px-8 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200" disabled={submitting}>
                                        {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus className="mr-2 h-4 w-4" />}
                                        Append Fee Item
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Class Modal (using Dialog) */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md bg-white dark:bg-slate-950">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black text-foreground dark:text-white uppercase tracking-tighter italic">Initialize Class</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium italic">Define a new academic unit for institutional tracking.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Class Nomenclature</Label>
                                <Input
                                    className="h-14 bg-muted dark:bg-slate-900 border-none rounded-2xl font-black text-lg uppercase tracking-tight focus-visible:ring-blue-600"
                                    required
                                    placeholder="e.g. GRADE 1"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Public visibility name in reports.</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Stream Designation (Optional)</Label>
                                <Input
                                    className="h-14 bg-muted dark:bg-slate-900 border-none rounded-2xl font-black text-lg uppercase tracking-tight focus-visible:ring-blue-600"
                                    placeholder="e.g. ALPHA, NORTH, GREEN"
                                    value={formData.stream}
                                    onChange={e => setFormData({ ...formData, stream: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Homeroom Teacher (Optional)</Label>
                                <Select value={formData.homeroomTeacherId || 'none'} onValueChange={(val) => setFormData({ ...formData, homeroomTeacherId: val === 'none' ? '' : val })}>
                                    <SelectTrigger className="h-14 bg-muted dark:bg-slate-900 border-none rounded-2xl font-semibold focus-visible:ring-blue-600 outline-none">
                                        <SelectValue placeholder="Select a teacher" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {staff.map(teacher => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                                {teacher.firstName} {teacher.lastName} {teacher.designation ? `(${teacher.designation})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-14 flex-1 rounded-2xl font-black text-slate-400 uppercase tracking-widest"
                                onClick={() => setShowAddModal(false)}
                                disabled={submitting}
                            >
                                ABORT
                            </Button>
                            <Button
                                type="submit"
                                className="h-14 flex-[2] rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckIconLarge />}
                                FINALIZE UNIT
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Class Modal (using Dialog) */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md bg-white dark:bg-slate-950">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black text-foreground dark:text-white uppercase tracking-tighter italic">Reconfigure Unit</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium italic">Adjust the properties of an established academic stream.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Class Nomenclature</Label>
                                <Input
                                    className="h-14 bg-muted dark:bg-slate-900 border-none rounded-2xl font-black text-lg uppercase tracking-tight focus-visible:ring-blue-600"
                                    required
                                    placeholder="e.g. GRADE 1"
                                    value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Stream Designation</Label>
                                <Input
                                    className="h-14 bg-muted dark:bg-slate-900 border-none rounded-2xl font-black text-lg uppercase tracking-tight focus-visible:ring-blue-600"
                                    placeholder="e.g. ALPHA, NORTH, GREEN"
                                    value={editData.stream}
                                    onChange={e => setEditData({ ...editData, stream: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Homeroom Teacher</Label>
                                <Select value={editData.homeroomTeacherId || 'none'} onValueChange={(val) => setEditData({ ...editData, homeroomTeacherId: val === 'none' ? '' : val })}>
                                    <SelectTrigger className="h-14 bg-muted dark:bg-slate-900 border-none rounded-2xl font-semibold focus-visible:ring-blue-600 outline-none">
                                        <SelectValue placeholder="Select a teacher" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {staff.map(teacher => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                                {teacher.firstName} {teacher.lastName} {teacher.designation ? `(${teacher.designation})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-14 flex-1 rounded-2xl font-black text-slate-400 uppercase tracking-widest"
                                onClick={() => setShowEditModal(false)}
                                disabled={submitting}
                            >
                                CANCEL
                            </Button>
                            <Button
                                type="submit"
                                className="h-14 flex-[2] rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckIconLarge />}
                                SYNC CHANGES
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Academic Period Manager Modal (using Dialog or overlay) */}
            {showPeriodManager && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setShowPeriodManager(false)}></div>
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
                        <AcademicPeriodManager
                            onClose={() => setShowPeriodManager(false)}
                            onSuccess={() => { fetchClasses(); }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function CheckIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

function CheckIconLarge() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
