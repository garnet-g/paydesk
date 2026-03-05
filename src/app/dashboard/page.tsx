"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import Link from "next/link"
import {
    School,
    DollarSign,
    Users,
    TrendingUp,
    FileText,
    Activity,
    AlertTriangle,
    BarChart3,
    Layers,
    PlusCircle,
    Wifi,
    Mail as MailIcon,
    Server,
    PieChart as PieChartIcon,
    ChevronRight,
    ArrowUpRight,
    Search
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [dashboardStats, setDashboardStats] = useState<any>(null)
    const [recentPayments, setRecentPayments] = useState<any[]>([])
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
    const [statsLoading, setStatsLoading] = useState(true)
    const [paymentsLoading, setPaymentsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router, mounted])

    useEffect(() => {
        if (mounted && status === "authenticated") {
            fetchStats()
            fetchPayments()
            if (session.user.role === "PRINCIPAL" || session.user.role === "FINANCE_MANAGER") {
                fetchApprovals()
            }
        }
    }, [status, mounted])

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/dashboard/stats")
            const data = await res.json()
            setDashboardStats(data)
        } catch (error) {
            console.error("Failed to fetch stats:", error)
        } finally {
            setStatsLoading(false)
        }
    }

    const fetchPayments = async () => {
        try {
            const res = await fetch("/api/dashboard/payments")
            const data = await res.json()
            setRecentPayments(data)
        } catch (error) {
            console.error("Failed to fetch payments:", error)
        } finally {
            setPaymentsLoading(false)
        }
    }

    const fetchApprovals = async () => {
        try {
            const res = await fetch("/api/approvals")
            if (res.ok) {
                const data = await res.json()
                setPendingApprovals(data.filter((r: any) => r.status === "PENDING"))
            }
        } catch (error) {
            console.error("Failed to fetch approvals:", error)
        }
    }

    if (!mounted || status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (!session) return null

    const role = session.user.role

    const statsConfig = role === "SUPER_ADMIN" ? [
        { label: "Total Schools", value: dashboardStats?.totalSchools || "0", icon: School, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Total Collections", value: `KES ${(dashboardStats?.totalCollections || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { label: "Active Students", value: (dashboardStats?.totalStudents || 0).toLocaleString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
        { label: "Growth", value: dashboardStats?.growth || "0%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-100" },
    ] : role === "PRINCIPAL" || role === "FINANCE_MANAGER" ? [
        { label: "Total Students", value: (dashboardStats?.totalStudents || 0).toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Total Collections", value: `KES ${(dashboardStats?.totalCollections || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { label: "Outstanding", value: dashboardStats?.outstanding || "KES 0", icon: TrendingUp, color: "text-red-600", bg: "bg-red-100" },
        { label: "This Month", value: dashboardStats?.thisMonth || "KES 0", icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-100" },
    ] : [
        { label: "My Children", value: dashboardStats?.myChildren || "0", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Total Balance", value: `KES ${(dashboardStats?.totalBalance || 0).toLocaleString()}`, icon: DollarSign, color: "text-red-600", bg: "bg-red-100" },
        { label: "Total Paid", value: `KES ${(dashboardStats?.paidThisTerm || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { label: "Next Payment", value: dashboardStats?.nextPayment || "N/A", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-100" },
    ]

    const pieData = dashboardStats ? [
        { name: "Collected", value: dashboardStats.totalCollections || 0, color: "#10b981" },
        { name: "Outstanding", value: parseInt(dashboardStats.outstanding?.replace(/[^0-9]/g, '') || '0'), color: "#6366f1" },
    ] : []

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-700">
                {/* Global Notification for Approvals */}
                {pendingApprovals.length > 0 && (role === "PRINCIPAL" || role === "FINANCE_MANAGER") && (
                    <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-3xl shadow-sm text-amber-800">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-amber-100 rounded-xl">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-xs">Attention Needed</p>
                                <p className="text-xs font-semibold">{pendingApprovals.length} Payment adjustments are awaiting your authorization.</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-amber-200 font-bold text-[10px] hover:bg-amber-100 text-amber-800"
                            onClick={() => router.push('/dashboard/payments?tab=approvals')}
                        >
                            Review Now
                        </Button>
                    </div>
                )}

                {/* Welcome Banner */}
                <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
                                <span className="text-blue-400 font-semibold text-[10px] uppercase tracking-[0.3em]">School Overview</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-semibold text-slate-50 tracking-tight leading-none uppercase italic">
                                Welcome back, <br className="md:hidden" /> {session.user.name?.split(' ')[0]}!
                            </h1>
                            <p className="text-slate-400 font-medium text-lg max-w-lg leading-relaxed">
                                {role === 'SUPER_ADMIN' && 'Manage all your school operations in one place.'}
                                {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && `Daily tracking for ${session.user.schoolName}.`}
                                {role === 'PARENT' && 'Real-time academic and financial tracking for your children.'}
                            </p>
                        </div>

                        {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && dashboardStats && (
                            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center gap-8 shadow-inner">
                                <div className="space-y-1">
                                    <p className="text-white/40 font-semibold text-[9px]  ">Collection Rate</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-semibold text-emerald-400 leading-none">{dashboardStats.collectionRate}%</span>
                                        <ArrowUpRight className="text-emerald-400 h-5 w-5 mb-1" />
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                                        <div
                                            className="h-full bg-emerald-400 transition-all duration-1000"
                                            style={{ width: `${dashboardStats.collectionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-slate-50 font-semibold text-[10px] h-14 px-8 rounded-2xl shadow-xl shadow-blue-500/20"
                                    onClick={() => router.push('/dashboard/reports')}
                                >
                                    Analytics
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsLoading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-muted animate-pulse rounded-3xl"></div>
                        ))
                    ) : statsConfig.map((stat, index) => (
                        <Card key={index} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl hover:translate-y-[-4px] transition-all overflow-hidden group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-slate-500 font-semibold text-[10px]  ">{stat.label}</p>
                                        <p className="text-2xl font-semibold text-foreground tracking-tight">{stat.value}</p>
                                    </div>
                                    <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
                                        <stat.icon size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold   text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <span>Detailed Analytics</span>
                                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions (Principal Only) */}
                {(role === "PRINCIPAL" || role === "FINANCE_MANAGER") && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: "Invoice Run", desc: "Batch billing", icon: FileText, href: "/dashboard/invoices/bulk", color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Enrol Student", desc: "New admissions", icon: Users, href: "/dashboard/students", color: "text-emerald-600", bg: "bg-emerald-50" },
                            { label: "Fee Structure", desc: "Configure terms", icon: Layers, href: "/dashboard/fee-setup", color: "text-amber-600", bg: "bg-amber-50" },
                            { label: "Communication", desc: "Broadcast SMS", icon: MailIcon, href: "/dashboard/broadcast", color: "text-indigo-600", bg: "bg-indigo-50" }
                        ].map((action, i) => (
                            <Link key={i} href={action.href}>
                                <div className="p-4 bg-white border border-border rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all flex items-center gap-4 group">
                                    <div className={cn("p-3 rounded-xl", action.bg, action.color)}>
                                        <action.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">{action.label}</p>
                                        <p className="text-[10px] font-medium text-slate-400">{action.desc}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Analytics & Table Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Payments Table */}
                    <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-muted/50 border-b border-slate-50 p-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-semibold text-foreground tracking-tight italic uppercase">Recent Activity</CardTitle>
                                <CardDescription className="text-slate-500 font-medium">Latest school-wide financial transactions</CardDescription>
                            </div>
                            <Button variant="ghost" className="rounded-xl text-blue-600 font-bold hover:bg-blue-50" onClick={() => router.push('/dashboard/payments')}>
                                VIEW ALL <ChevronRight size={16} className="ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-muted/30">
                                            <th className="px-4 md:px-8 py-5 text-[10px] font-semibold text-slate-500  ">Student</th>
                                            <th className="px-4 md:px-8 py-5 text-[10px] font-semibold text-slate-500  ">Amount</th>
                                            <th className="px-4 md:px-8 py-5 text-[10px] font-semibold text-slate-500  ">Status</th>
                                            <th className="px-4 md:px-8 py-5 text-[10px] font-semibold text-slate-500   text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paymentsLoading ? (
                                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold animate-pulse text-xs">Updating transactions...</td></tr>
                                        ) : recentPayments.length === 0 ? (
                                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium">No transactions found.</td></tr>
                                        ) : (
                                            recentPayments.map((p) => (
                                                <tr key={p.id} className="hover:bg-muted transition-colors group">
                                                    <td className="px-4 md:px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                                {p.student.firstName[0]}
                                                            </div>
                                                            <div className="font-bold text-foreground leading-tight">
                                                                {p.student.firstName} {p.student.lastName}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-5 font-bold text-foreground">KES {p.amount.toLocaleString()}</td>
                                                    <td className="px-4 md:px-8 py-5">
                                                        <Badge variant="outline" className={cn(
                                                            "font-semibold text-[9px]   h-6 rounded-lg",
                                                            p.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                        )}>
                                                            {p.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-5 text-right text-xs font-bold text-slate-400">
                                                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chart Container */}
                    <div className="space-y-8">
                        {/* Collection Chart */}
                        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white h-full flex flex-col">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg font-semibold text-foreground  tracking-tight">Collection Mix</CardTitle>
                                        <CardDescription className="text-slate-500 font-medium ">Revenue distribution</CardDescription>
                                    </div>
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <PieChartIcon size={20} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
                                <div className="w-full h-64 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-semibold text-foreground leading-none">{dashboardStats?.collectionRate || 0}%</span>
                                        <span className="text-[8px] font-semibold text-slate-400   mt-1">RATE</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                    {pieData.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-400  tracking-tight">{item.name}</p>
                                                <p className="text-sm font-bold text-foreground">KES {(item.value / 1000).toFixed(1)}k</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* System Health Board (Super Admin Only) */}
                {role === "SUPER_ADMIN" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "M-Pesa Webhook", status: "Active", icon: Wifi, color: "text-emerald-500" },
                            { label: "Email Server", status: "Operational", icon: MailIcon, color: "text-emerald-500" },
                            { label: "DB Latency", status: "14ms", icon: Server, color: "text-blue-500" }
                        ].map((h, i) => (
                            <div key={i} className="p-6 bg-white border border-border rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-muted text-slate-400 rounded-2xl">
                                        <h.icon size={20} />
                                    </div>
                                    <span className="font-bold text-foreground text-sm">{h.label}</span>
                                </div>
                                <span className={cn("font-semibold text-[10px]   px-3 py-1 bg-muted rounded-lg", h.color)}>
                                    {h.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

