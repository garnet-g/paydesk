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
            <div className="space-y-10 animate-fade-in">
                {/* Global Notification for Approvals */}
                {pendingApprovals.length > 0 && (role === "PRINCIPAL" || role === "FINANCE_MANAGER") && (
                    <div className="flex items-center justify-between rounded-2xl bg-amber-50/50 p-4 border border-amber-100 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Approvals Pending</h4>
                                <p className="text-xs text-amber-700 font-medium">There are {pendingApprovals.length} payment adjustments awaiting your review.</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-xs font-bold shadow-md shadow-amber-200/50"
                            onClick={() => router.push('/dashboard/payments?tab=approvals')}
                        >
                            Review Now
                        </Button>
                    </div>
                )}

                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-10 md:p-14 shadow-xl shadow-gray-200/40 dark:shadow-none">
                    <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-blue-600/5 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="h-0.5 w-6 bg-blue-600 rounded-full"></span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Executive Summary</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                                Welcome, <span className="text-blue-600">{session.user.name?.split(' ')[0]}</span>
                            </h1>
                            <p className="max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
                                {role === 'SUPER_ADMIN' && 'Overseeing the platform ecosystem and school performance metrics.'}
                                {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && `Monitoring daily operations and financial health for ${session.user.schoolName}.`}
                                {role === 'PARENT' && 'Tracking academic progress and financial commitments for your children.'}
                            </p>
                        </div>

                        {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && dashboardStats && (
                            <div className="rounded-2xl border border-border bg-muted/30 p-8 shadow-inner backdrop-blur-sm">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-10">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Collection Rate</p>
                                            <div className="mt-1 flex items-baseline gap-2">
                                                <span className="text-4xl font-black tracking-tighter text-foreground">{dashboardStats.collectionRate}%</span>
                                                <ArrowUpRight className="text-green-500" size={20} />
                                            </div>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                                            <Activity size={24} />
                                        </div>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50 ring-1 ring-border">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                                            style={{ width: `${dashboardStats.collectionRate}%` }}
                                        ></div>
                                    </div>
                                    <Button
                                        className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl font-bold text-sm h-11 transition-all active:scale-[0.98]"
                                        onClick={() => router.push('/dashboard/reports')}
                                    >
                                        View Insights
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {statsLoading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/50"></div>
                        ))
                    ) : statsConfig.map((stat, index) => (
                        <div key={index} className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-black/10 hover:shadow-xl dark:hover:border-white/10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{stat.label}</p>
                                    <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                                </div>
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                                    <stat.icon size={20} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 uppercase tracking-widest">
                                View Details
                                <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                {(role === "PRINCIPAL" || role === "FINANCE_MANAGER") && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                            { label: "Invoice Run", icon: FileText, href: "/dashboard/invoices/bulk", color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Enrol Student", icon: Users, href: "/dashboard/students", color: "text-green-600", bg: "bg-green-50" },
                            { label: "Fee Structure", icon: Layers, href: "/dashboard/fee-setup", color: "text-amber-600", bg: "bg-amber-50" },
                            { label: "Messaging", icon: MailIcon, href: "/dashboard/broadcast", color: "text-purple-600", bg: "bg-purple-50" }
                        ].map((action, i) => (
                            <Link key={i} href={action.href} className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all hover:border-blue-600/20 hover:bg-blue-50/10 hover:shadow-lg dark:hover:bg-blue-900/10">
                                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110", action.bg, action.color)}>
                                    <action.icon size={22} />
                                </div>
                                <span className="text-xs font-bold text-foreground">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Recent Payments Table */}
                    <div className="lg:col-span-2 rounded-[2rem] border border-border bg-card shadow-xl shadow-gray-200/30 overflow-hidden dark:shadow-none">
                        <div className="flex items-center justify-between border-b border-border bg-muted/10 p-8">
                            <div>
                                <h3 className="text-lg font-bold tracking-tight text-foreground">Recent Transactions</h3>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Latest financial activity across your school</p>
                            </div>
                            <Button variant="outline" className="rounded-lg h-9 px-4 text-xs font-bold transition-all hover:bg-accent" onClick={() => router.push('/dashboard/payments')}>
                                View All
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                        <th className="px-8 py-5">Student</th>
                                        <th className="px-8 py-5">Amount</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paymentsLoading ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-xs font-bold text-muted-foreground/50 animate-pulse uppercase tracking-widest">Refreshing Data...</td></tr>
                                    ) : recentPayments.length === 0 ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-sm font-medium text-muted-foreground">No transactions available.</td></tr>
                                    ) : (
                                        recentPayments.map((p) => (
                                            <tr key={p.id} className="group transition-colors hover:bg-muted/30">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-blue-600 ring-1 ring-blue-600/10 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            {p.student.firstName[0]}
                                                        </div>
                                                        <span className="font-semibold text-foreground">{p.student.firstName} {p.student.lastName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 font-bold text-foreground">KES {p.amount.toLocaleString()}</td>
                                                <td className="px-8 py-5">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                                        p.status === 'COMPLETED' ? "bg-green-50 text-green-700 ring-1 ring-green-700/10" : "bg-amber-50 text-amber-700 ring-1 ring-amber-700/10"
                                                    )}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right text-xs font-bold text-muted-foreground/60">
                                                    {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-gray-200/30 dark:shadow-none">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold tracking-tight text-foreground">Revenue Mix</h3>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Current collection status</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <BarChart3 size={20} />
                            </div>
                        </div>

                        <div className="relative h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '800' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black tracking-tighter text-foreground">{dashboardStats?.collectionRate || 0}%</span>
                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Collected</span>
                            </div>
                        </div>

                        <div className="mt-10 space-y-4">
                            {pieData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/10 p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-foreground">KES {(item.value / 1000).toFixed(1)}k</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* System Status (Super Admin Only) */}
                {role === "SUPER_ADMIN" && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[
                            { label: "M-Pesa Gateway", status: "Operational", icon: Wifi, color: "text-green-500", bg: "bg-green-50" },
                            { label: "Email Dispatcher", status: "Queue Empty", icon: MailIcon, color: "text-blue-500", bg: "bg-blue-50" },
                            { label: "Database Engine", status: "Healthy", icon: Server, color: "text-purple-500", bg: "bg-purple-50" }
                        ].map((h, i) => (
                            <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:bg-muted/10">
                                <div className="flex items-center gap-4">
                                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", h.bg, h.color)}>
                                        <h.icon size={20} />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{h.label}</span>
                                </div>
                                <span className={cn("rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-muted/30", h.color)}>
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

