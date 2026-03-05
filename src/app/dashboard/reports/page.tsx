'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
    AlertCircle,
    FileText,
    TrendingUp,
    DollarSign,
    Clock,
    ChevronRight,
    Download,
    Mail,
    Award,
    Target,
    Zap,
    ArrowUpRight,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar,
    Activity,
    ShieldCheck,
    Loader2
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export default function ReportsPage() {
    const [execStats, setExecStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sendingReminders, setSendingReminders] = useState(false)

    const handleExportReport = () => {
        if (!execStats) return toast.error('Report data is still syncing. Please wait.')
        const rows = [
            ['Executive Summary Report', new Date().toLocaleDateString('en-KE')],
            [],
            ['COLLECTION VELOCITY'],
            ['Collection Rate', `${execStats.collectionRate}%`],
            ['Total Invoiced', execStats.totalInvoiced],
            ['Total Paid', execStats.totalPaid],
            ['Outstanding', (execStats.totalInvoiced - execStats.totalPaid)],
            [],
            ['AGING DEBT EXPOSURE'],
            ['Active (Current)', execStats.aging?.current ?? 0],
            ['At Risk (31-60d)', execStats.aging?.thirty ?? 0],
            ['Critical (61-90d)', execStats.aging?.sixty ?? 0],
            ['Recovery (90d+)', execStats.aging?.ninetyPlus ?? 0],
            [],
            ['REVENUE FORECAST'],
            ['Projected Inflow (Next 30 Days)', execStats.forecast?.next30 ?? 0],
            ['Projected Inflow (30-60 Days)', execStats.forecast?.next60 ?? 0],
            [],
            ['CLASS PERFORMANCE'],
            ['Rank', 'Class', 'Stream', 'Collection Rate', 'Outstanding'],
            ...(execStats.classPerformance?.map((cls: any, i: number) => [
                `#${i + 1}`, cls.name, cls.stream, `${cls.rate}%`, cls.outstanding
            ]) || []),
        ]
        const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n')
        const link = document.createElement('a')
        link.setAttribute('href', encodeURI(csv))
        link.setAttribute('download', `board_report_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Report exported successfully")
    }

    const handleBroadcastReminders = async () => {
        if (!confirm('TRANSCRIPTION REQUIRED: This will send automated SMS reminders to all parents with overdue balances. Authorize broadcast?')) return
        setSendingReminders(true)
        try {
            const res = await fetch('/api/communication/reminders', { method: 'POST' })
            const data = await res.json()
            toast(data.message || data.error || 'Broadcast sequence completed.')
        } catch (err) {
            toast.error('Tactical failure: Broadcast could not be dispatched.')
        } finally {
            setSendingReminders(false)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const execRes = await fetch('/api/reports/executive-summary')
                if (execRes.ok) {
                    const data = await execRes.json()
                    setExecStats(data)
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-12 p-8 pt-6 animate-in fade-in duration-500 pb-20">
                {/* Executive Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <TrendingUp size={24} className="text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white  ">Reports Overview</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium ">
                            High-level institutional analytics for <span className="text-blue-600 font-semibold  not-">Administrative Decision-Making</span>
                        </p>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                        <Button
                            variant="outline"
                            className="h-12 px-6 rounded-2xl font-semibold text-xs   border-2 hover:bg-slate-50 transition-all border-slate-200 dark:border-slate-800"
                            onClick={handleExportReport}
                            disabled={loading}
                        >
                            <Download size={18} className="mr-2" />
                            Export Dossier
                        </Button>
                        <Button
                            className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs   shadow-xl shadow-blue-200 dark:shadow-none transition-all"
                            onClick={handleBroadcastReminders}
                            disabled={sendingReminders}
                        >
                            {sendingReminders ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Mail size={18} className="mr-2" />}
                            {sendingReminders ? 'DISPATCHING...' : 'Authorize Reminders'}
                        </Button>
                    </div>
                </div>

                {/* Tactical Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Collection Velocity */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden group">
                        <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-slate-400   leading-none">Revenue Stream</span>
                                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white  tracking-tight ">Collection Velocity</CardTitle>
                            </div>
                            <div className="h-12 w-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                                <Target size={24} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-6xl font-semibold text-blue-600 leading-none tracking-tight ">
                                    {loading ? '—' : `${execStats?.collectionRate}%`}
                                </span>
                                <Badge variant="outline" className="font-semibold text-[9px]   border-blue-600 text-blue-600 h-6">KPI STATUS</Badge>
                            </div>
                            <div className="space-y-4">
                                <Progress
                                    value={execStats?.collectionRate || 0}
                                    className="h-4 bg-slate-50 dark:bg-slate-900"
                                />
                                <div className="flex justify-between text-[10px] font-semibold text-slate-400   ">
                                    <span>Total Collected</span>
                                    <span className="text-slate-900 dark:text-white font-semibold tracking-tight">{formatCurrency(execStats?.totalPaid || 0)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-semibold text-slate-400   ">
                                    <span>Target Capacity</span>
                                    <span className="text-slate-900 dark:text-white font-semibold tracking-tight">{formatCurrency(execStats?.totalInvoiced || 0)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aging Debt Analysis */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600">
                                    <Clock size={18} />
                                </div>
                                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white  tracking-tight ">Aging Debt Exposure</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-5">
                            {[
                                { label: 'Active (Current)', value: execStats?.aging?.current, color: 'bg-emerald-500', text: 'text-emerald-600' },
                                { label: 'At Risk (31-60d)', value: execStats?.aging?.thirty, color: 'bg-amber-500', text: 'text-amber-600' },
                                { label: 'Critical (61-90d)', value: execStats?.aging?.sixty, color: 'bg-red-500', text: 'text-red-600' },
                                { label: 'Recovery (90d+)', value: execStats?.aging?.ninetyPlus, color: 'bg-slate-900', text: 'text-slate-900 dark:text-white' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-help">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-2 w-2 rounded-full", item.color)} />
                                        <span className="text-[10px] font-semibold text-slate-400   group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                                    </div>
                                    <span className={cn("text-xs font-semibold tracking-tight ", item.text)}>{formatCurrency(item.value || 0)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Revenue Forecast Matrix */}
                    <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-400 border border-white/10">
                                    <Zap size={18} />
                                </div>
                                <CardTitle className="text-xl font-semibold  tracking-tight ">Growth Trends</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-semibold text-slate-400   ">Inbound Focus (T+30)</span>
                                        <span className="text-lg font-semibold text-blue-400 tracking-tight">{formatCurrency(execStats?.forecast?.next30 || 0)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[65%] shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-semibold text-slate-400   ">Secondary Wave (T+60)</span>
                                        <span className="text-lg font-semibold text-emerald-400 tracking-tight">{formatCurrency(execStats?.forecast?.next60 || 0)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[35%] shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                <Activity size={20} className="text-blue-400 animate-pulse" />
                                <p className="text-[9px] font-bold text-slate-400  tracking-tight leading-relaxed ">Algorithmically projected based on historical payment velocity and structural terms.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Intelligence Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Class Performance Sector */}
                    <Card className="lg:col-span-8 border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-900 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white  tracking-tight  leading-none mb-1">Class Metrics</CardTitle>
                                    <CardDescription className="text-[10px]  font-semibold  text-slate-400 leading-none m-0">Performance ranking by class collection</CardDescription>
                                </div>
                            </div>
                            <BarChart3 size={20} className="text-slate-300" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/30">
                                            <th className="px-8 py-5 text-left text-[10px] font-semibold text-slate-400  ">Rank</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-semibold text-slate-400  ">Class Identifier</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-semibold text-slate-400  ">Efficiency</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-semibold text-slate-400  ">Liability (Outstanding)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                        {loading ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={4} className="px-8 py-5 h-20 bg-slate-50/30"></td>
                                                </tr>
                                            ))
                                        ) : execStats?.classPerformance?.map((cls: any, i: number) => (
                                            <tr key={cls.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-semibold shadow-inner border-2 border-white dark:border-slate-800",
                                                        i === 0 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                    )}>
                                                        #{i + 1}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="font-semibold text-slate-900 dark:text-white text-base leading-none  tracking-tight  transition-all group-hover:translate-x-1 underline decoration-blue-600/30 underline-offset-4">
                                                        {cls.name}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-2   ">{cls.stream} Stream</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-6">
                                                        <span className="font-semibold text-sm text-slate-900 dark:text-white tabular-nums min-w-[3rem] ">{cls.rate}%</span>
                                                        <div className="flex-1 min-w-[8rem] h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className={cn(
                                                                    "h-full transition-all duration-1000",
                                                                    cls.rate > 90 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
                                                                        cls.rate > 70 ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                                                )}
                                                                style={{ width: `${cls.rate}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight ">
                                                        {formatCurrency(cls.outstanding)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Drill-down Navigation Sideboard */}
                    <div className="lg:col-span-4 space-y-8">
                        <Link href="/dashboard/reports/defaulters" className="block group">
                            <Card className="border-none shadow-xl bg-red-50 dark:bg-red-950/20 rounded-[2.5rem] overflow-hidden border-2 border-red-100 dark:border-red-900/30 group-hover:bg-red-100/50 dark:group-hover:bg-red-950/40 transition-all group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-red-200">
                                <CardContent className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-14 w-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-200 group-hover:rotate-12 transition-transform">
                                            <AlertCircle size={32} />
                                        </div>
                                        <ArrowUpRight className="text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300" size={24} />
                                    </div>
                                    <h4 className="text-2xl font-semibold text-red-900 dark:text-red-400  tracking-tight  mb-4">Arrears Analysis</h4>
                                    <p className="text-sm font-medium text-red-700/70 dark:text-red-400/60 leading-relaxed   tracking-tight mb-8">
                                        Granular tracking of persistent liability cycles and automation for demanding financial compliance notices.
                                    </p>
                                    <div className="text-[10px] font-semibold text-red-600   flex items-center gap-2">
                                        Explore Ledger <ChevronRight size={14} />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/reports/collections" className="block group">
                            <Card className="border-none shadow-xl bg-blue-50 dark:bg-blue-950/20 rounded-[2.5rem] overflow-hidden border-2 border-blue-100 dark:border-blue-900/30 group-hover:bg-blue-100/50 dark:group-hover:bg-blue-950/40 transition-all group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-blue-200">
                                <CardContent className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 group-hover:-rotate-12 transition-transform">
                                            <FileText size={32} />
                                        </div>
                                        <ArrowUpRight className="text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300" size={24} />
                                    </div>
                                    <h4 className="text-2xl font-semibold text-blue-900 dark:text-blue-400  tracking-tight  mb-4">Audit Trails</h4>
                                    <p className="text-sm font-medium text-blue-700/70 dark:text-blue-400/60 leading-relaxed   tracking-tight mb-8">
                                        Micro-level visibility into institutional capital flow. Comprehensive filtering by source, method, and period.
                                    </p>
                                    <div className="text-[10px] font-semibold text-blue-600   flex items-center gap-2">
                                        Review History <ChevronRight size={14} />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>

                {/* Footer Assurance */}
                <div className="flex items-center justify-center pt-8 border-t border-slate-100 dark:border-slate-900">
                    <div className="flex items-center gap-4 text-slate-400">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-semibold  tracking-[0.3em] ">Secure Analytics • {new Date().getFullYear()} School Operating System</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
