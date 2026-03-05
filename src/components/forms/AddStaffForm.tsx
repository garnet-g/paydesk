'use client'

import { useState } from 'react'
import { X, Briefcase, Mail, Phone, User as UserIcon, Save, KeyRound, ShieldCheck, AlertCircle, Info, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AddStaffFormProps {
    onClose: () => void
    onSuccess: () => void
}

export default function AddStaffForm({ onClose, onSuccess }: AddStaffFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'FINANCE_MANAGER',
        salary: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(false)

        // Email validation for school domain
        const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com']
        const domain = formData.email.split('@')[1]?.toLowerCase()
        if (publicDomains.includes(domain)) {
            toast.error("Valid Email Required: Please use a professional or school domain email address.")
            return
        }

        setLoading(true)
        try {
            const payload = {
                ...formData,
                salary: formData.salary ? parseFloat(formData.salary) : 0
            }

            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Staff Member Registered: System access has been granted.")
                onSuccess()
                onClose()
            } else {
                const data = await res.text()
                toast.error(data || 'Failed to complete staff registration')
            }
        } catch (err) {
            toast.error('An error occurred during registration')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-border dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-blue-400 border border-white/10 shadow-xl">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Add Staff Member</h3>
                        <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mt-1 italic">School Personnel Directory</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white/50 hover:text-white hover:bg-white/10 rounded-xl relative z-10" onClick={onClose}>
                    <X size={24} />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</Label>
                            <Input
                                type="text"
                                className="h-14 bg-muted dark:bg-slate-900/50 border-border dark:border-slate-800 rounded-2xl font-bold text-foreground dark:text-white uppercase"
                                placeholder="e.g. JOHN"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</Label>
                            <Input
                                type="text"
                                className="h-14 bg-muted dark:bg-slate-900/50 border-border dark:border-slate-800 rounded-2xl font-bold text-foreground dark:text-white uppercase"
                                placeholder="e.g. DOE"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</Label>
                        <Input
                            type="email"
                            className="h-14 bg-muted dark:bg-slate-900/50 border-border dark:border-slate-800 rounded-2xl font-bold text-foreground dark:text-white"
                            placeholder="admin@school.ac.ke"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic flex items-center gap-1">
                            <Info size={10} className="text-blue-500" /> Use a school-issued email for security.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</Label>
                            <Input
                                type="tel"
                                className="h-14 bg-muted dark:bg-slate-900/50 border-border dark:border-slate-800 rounded-2xl font-bold text-foreground dark:text-white"
                                placeholder="07XXXXXXXX"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designated Role</Label>
                            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                                <SelectTrigger className="h-14 bg-muted dark:bg-slate-900/50 border-border dark:border-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="FINANCE_MANAGER" className="font-bold text-xs uppercase tracking-widest">FINANCE MANAGER</SelectItem>
                                    <SelectItem value="REGISTRAR" className="font-bold text-xs uppercase tracking-widest">REGISTRAR</SelectItem>
                                    <SelectItem value="BURSAR" className="font-bold text-xs uppercase tracking-widest">BURSAR</SelectItem>
                                    <SelectItem value="TEACHER" className="font-bold text-xs uppercase tracking-widest">TEACHER</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salary Package (Monthly)</Label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">KES</div>
                            <Input
                                type="number"
                                className="h-14 pl-12 bg-muted dark:bg-slate-900/50 border-border dark:border-slate-800 rounded-2xl font-bold text-foreground dark:text-white"
                                placeholder="0.00"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 rounded-[2rem] text-blue-700 dark:text-blue-400">
                        <div className="h-12 w-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
                            <Lock size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Access Details</div>
                            <p className="text-[10px] font-medium leading-relaxed italic uppercase tracking-tighter opacity-80">
                                Temporary Password: <span className="font-black text-blue-600 dark:text-blue-300">password123</span>. User must change this on first login.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="ghost" className="h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-foreground dark:hover:text-white" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200 dark:shadow-none" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <Save size={18} className="mr-2" />
                                Add Staff Member
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
