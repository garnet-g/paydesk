'use client'

import { useState, useEffect } from 'react'
import {
    Smartphone,
    Zap,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Smartphone as PhoneIcon,
    Search,
    Loader2,
    ShieldCheck,
    ArrowLeft,
    MonitorPlay,
    History,
    CreditCard,
    ChevronRight,
    Play
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function MpesaTestingPage() {
    const router = useRouter()
    const [pendingPayments, setPendingPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isSimulating, setIsSimulating] = useState(false)
    const [c2bForm, setC2bForm] = useState({ billRef: '', amount: '1000' })

    useEffect(() => {
        fetchPending()
    }, [])

    const fetchPending = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/payments?status=PENDING')
            const data = await res.json()
            setPendingPayments(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error(err)
            toast.error("Failed to synchronize pending buffer")
        } finally {
            setLoading(false)
        }
    }

    const simulateStkCallback = async (checkoutRequestId: string, success: boolean, amount: number) => {
        setIsSimulating(true)
        try {
            const res = await fetch('/api/admin/simulate-mpesa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'STK_CALLBACK',
                    payload: { checkoutRequestId, success, amount }
                })
            })
            const data = await res.json()
            if (data.ResultCode === 0) {
                toast.success(`STK Simulation Successful: ${success ? 'CREDIT_AUTHORIZED' : 'CREDIT_DENIED'}`)
                fetchPending()
            } else {
                toast.error('Simulation Matrix Error: ' + (data.ResultDesc || 'Handshake failed'))
            }
        } catch (err) {
            toast.error('Simulation link failure')
        } finally {
            setIsSimulating(false)
        }
    }

    const simulateC2b = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!c2bForm.billRef || !c2bForm.amount) return

        setIsSimulating(true)
        try {
            const res = await fetch('/api/admin/simulate-mpesa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'C2B_CONFIRMATION',
                    payload: {
                        billRef: c2bForm.billRef,
                        amount: parseFloat(c2bForm.amount)
                    }
                })
            })
            const data = await res.json()
            if (data.ResultCode === 0) {
                toast.success(`C2B Transmission Synthetic: RECONCILED AGAINST ${c2bForm.billRef}`)
                fetchPending()
            } else {
                toast.error('C2B Negotiation failure')
            }
        } catch (err) {
            toast.error('Synthetic network error')
        } finally {
            setIsSimulating(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all active:scale-90"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-800">
                            <MonitorPlay size={28} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-foreground dark:text-white leading-none">
                                Recl Simulator
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
                                <Zap size={12} className="text-blue-500" />
                                M-Pesa Synthetic Reconciliation Node
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={fetchPending}
                        disabled={loading}
                        className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={16} className={cn("mr-2", loading && "animate-spin")} />
                        Refresh Buffer
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* STK Push Terminal */}
                    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden">
                        <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-900">
                            <div className="flex items-center gap-4 mb-2">
                                <Smartphone size={24} className="text-blue-600" />
                                <CardTitle className="text-xl font-black uppercase tracking-tighter italic">STK Buffer</CardTitle>
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Synthetic validation for pending push requests</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {pendingPayments.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto">
                                        <History size={40} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">No Pushes Detected</h4>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Initiate a transaction to populate terminal</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-10 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Request Trace</th>
                                                <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Quantum</th>
                                                <th className="px-10 py-5 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Override</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                            {pendingPayments.map((p, idx) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={p.id}
                                                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                                                >
                                                    <td className="px-10 py-6">
                                                        <div className="font-mono text-[11px] font-bold text-slate-500 uppercase">{p.transactionRef}</div>
                                                        <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">Status: PENDING_M-PESA</div>
                                                    </td>
                                                    <td className="px-6 py-6 font-black italic text-slate-900 dark:text-white">
                                                        KES {parseFloat(p.amount).toLocaleString()}
                                                    </td>
                                                    <td className="px-10 py-6 text-right space-x-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => simulateStkCallback(p.transactionRef, true, parseFloat(p.amount))}
                                                            disabled={isSimulating}
                                                            className="h-9 px-4 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest italic shadow-lg active:scale-95"
                                                        >
                                                            Authorize
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => simulateStkCallback(p.transactionRef, false, 0)}
                                                            disabled={isSimulating}
                                                            className="h-9 px-4 rounded-xl border-slate-200 text-red-500 font-black text-[9px] uppercase tracking-widest italic hover:bg-red-50 hover:text-red-600 border-dashed active:scale-95"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* C2B / Paybill Terminal */}
                    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden">
                        <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-900">
                            <div className="flex items-center gap-4 mb-2">
                                <CreditCard size={24} className="text-emerald-600" />
                                <CardTitle className="text-xl font-black uppercase tracking-tighter italic">C2B Paybill Node</CardTitle>
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Synthetic Lipa na M-Pesa manual entry</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 mb-8 border border-slate-100 dark:border-slate-800">
                                <p className="text-[11px] leading-relaxed font-bold italic text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Simulator mirrors a manual payment from the M-Pesa menu. Inputting a valid Student Admission Number or Invoice ID will trigger the reconciliation engine.
                                </p>
                            </div>

                            <form onSubmit={simulateC2b} className="space-y-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Reference Pointer (Account No)</Label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                        <Input
                                            placeholder="ADM-001 OR INV-2024"
                                            value={c2bForm.billRef}
                                            onChange={e => setC2bForm({ ...c2bForm, billRef: e.target.value })}
                                            className="h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 font-bold uppercase"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">Quantum (KES)</Label>
                                    <Input
                                        type="number"
                                        value={c2bForm.amount}
                                        onChange={e => setC2bForm({ ...c2bForm, amount: e.target.value })}
                                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 font-black italic text-lg"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSimulating}
                                    className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] italic shadow-xl shadow-emerald-100 dark:shadow-none transition-all active:scale-[0.98]"
                                >
                                    {isSimulating ? (
                                        <Loader2 className="animate-spin mr-2" />
                                    ) : (
                                        <Play className="mr-2" size={18} fill="currentColor" />
                                    )}
                                    Initialize Synthetic Transmission
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Warning Footer */}
                <div className="p-8 rounded-[2rem] bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 shadow-sm">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-amber-700 dark:text-amber-500 italic">Simulation Environment Rules</h4>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1 italic">
                            All operations are conducted inside the synthetic buffer. This tool is for verifying logic and does not communicate with Daraja Production Gateways.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
