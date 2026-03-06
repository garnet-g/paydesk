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
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
                    <p className="text-neutral-500 font-medium text-sm">Loading your dashboard...</p>
                </div>
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
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-warning-50 to-warning-100/50 border border-warning-200 rounded-2xl shadow-md text-warning-900">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-warning-100 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-warning-600" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Pending Approvals</p>
                                <p className="text-xs font-medium text-warning-700">{pendingApprovals.length} payment adjustment{pendingApprovals.length !== 1 ? 's' : ''} awaiting your authorization</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="rounded-lg bg-warning-600 hover:bg-warning-700 text-white font-semibold text-xs px-4 py-2"
                            onClick={() => router.push('/dashboard/payments?tab=approvals')}
                        >
                            Review
                        </Button>
                    </div>
                )}

                {/* Welcome Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-neutral-900 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-6 bg-primary-300 rounded-full"></div>
                                <span className="text-primary-200 font-semibold text-xs uppercase tracking-widest">Management Hub</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                                Welcome, <span className="text-primary-200">{session.user.name?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-primary-100 font-medium text-base max-w-lg leading-relaxed">
                                {role === 'SUPER_ADMIN' && 'Monitor and manage all school operations from your central dashboard.'}
                                {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && `Keep your finger on the pulse of ${session.user.schoolName} with real-time insights.`}
                                {role === 'PARENT' && 'Real-time tracking of academic progress and fee payments for all your children.'}
                            </p>
                        </div>

                        {(role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') && dashboardStats && (
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 flex items-center gap-6 shadow-lg hover:bg-white/15 transition-all">
                                <div className="space-y-2">
                                    <p className="text-white/60 font-semibold text-xs uppercase tracking-wider">Collection Rate</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-bold text-success-400 leading-none">{dashboardStats.collectionRate}%</span>
                                        <ArrowUpRight className="text-success-400 h-5 w-5 mb-1" strokeWidth={3} />
                                    </div>
                                    <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden mt-3">
                                        <div
                                            className="h-full bg-gradient-to-r from-success-400 to-success-500 transition-all duration-1000 rounded-full"
                                            style={{ width: `${dashboardStats.collectionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <Button
                                    className="bg-white/20 hover:bg-white/30 text-white font-semibold text-sm h-12 px-6 rounded-xl transition-all"
                                    onClick={() => router.push('/dashboard/reports')}
                                >
                                    Reports →
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsLoading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gradient-to-br from-muted to-neutral-100 animate-pulse rounded-2xl"></div>
                        ))
                    ) : statsConfig.map((stat, index) => (
                        <Card key={index} className="border-neutral-200 shadow-md rounded-2xl hover:shadow-xl transition-all overflow-hidden group hover:-translate-y-1">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <p className="text-neutral-500 font-medium text-xs uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                                    </div>
                                    <div className={cn("p-3 rounded-xl group-hover:scale-110 transition-all duration-300", stat.bg, stat.color)}>
                                        <stat.icon size={20} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-neutral-500 group-hover:text-primary-600 transition-colors">
                                    <span>View More</span>
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions (Principal Only) */}
                {(role === "PRINCIPAL" || role === "FINANCE_MANAGER") && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: "Invoice Run", desc: "Batch billing", icon: FileText, href: "/dashboard/invoices/bulk", color: "text-primary-600", bg: "bg-primary-50" },
                            { label: "Enrol Student", desc: "New admissions", icon: Users, href: "/dashboard/students", color: "text-success-600", bg: "bg-success-50" },
                            { label: "Fee Structure", desc: "Configure terms", icon: Layers, href: "/dashboard/fee-setup", color: "text-secondary-600", bg: "bg-secondary-50" },
                            { label: "Communication", desc: "Broadcast SMS", icon: MailIcon, href: "/dashboard/broadcast", color: "text-warning-600", bg: "bg-warning-50" }
                        ].map((action, i) => (
                            <Link key={i} href={action.href}>
                                <div className="p-4 bg-white border border-neutral-200 rounded-2xl hover:border-neutral-300 hover:shadow-lg transition-all flex items-center gap-4 group">
                                    <div className={cn("p-3 rounded-xl group-hover:scale-110 transition-transform", action.bg, action.color)}>
                                        <action.icon size={20} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">{action.label}</p>
                                        <p className="text-xs font-medium text-neutral-500">{action.desc}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Analytics & Table Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Payments Table */}
                    <Card className="lg:col-span-2 border-neutral-200 shadow-lg rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200 p-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold text-foreground tracking-tight">Recent Activity</CardTitle>
                                <CardDescription className="text-neutral-500 font-medium text-sm mt-1">Latest transactions processed</CardDescription>
                            </div>
                            <Button variant="ghost" className="rounded-lg text-primary-600 font-semibold hover:bg-primary-50 text-sm" onClick={() => router.push('/dashboard/payments')}>
                                View All <ChevronRight size={16} className="ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-neutral-50/50 border-b border-neutral-200">
                                            <th className="px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {paymentsLoading ? (
                                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold animate-pulse text-xs">Updating transactions...</td></tr>
                                        ) : recentPayments.length === 0 ? (
                                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-medium">No transactions found.</td></tr>
                                        ) : (
                                            recentPayments.map((p) => (
                                                <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors group border-b-0 last:border-b-0">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center text-xs font-bold text-primary-600 group-hover:from-primary-600 group-hover:to-primary-700 group-hover:text-white transition-all">
                                                                {p.student.firstName[0]}
                                                            </div>
                                                            <div className="font-semibold text-foreground leading-tight text-sm">
                                                                {p.student.firstName} {p.student.lastName}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-foreground text-sm">KES {p.amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className={cn(
                                                            "font-semibold text-xs px-3 py-1 rounded-lg",
                                                            p.status === 'COMPLETED' ? "bg-success-50 text-success-700 border-success-200" : "bg-warning-50 text-warning-700 border-warning-200"
                                                        )}>
                                                            {p.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-semibold text-neutral-500">
                                                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
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
                        <Card className="border-neutral-200 shadow-lg rounded-2xl overflow-hidden bg-white h-full flex flex-col">
                            <CardHeader className="p-8 pb-4 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-foreground tracking-tight">Collection Mix</CardTitle>
                                        <CardDescription className="text-neutral-500 font-medium text-sm mt-1">Revenue distribution by status</CardDescription>
                                    </div>
                                    <div className="p-3 bg-secondary-50 text-secondary-600 rounded-lg group-hover:scale-110 transition-transform">
                                        <PieChartIcon size={22} strokeWidth={2} />
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
                                                paddingAngle={6}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '0.875rem', border: 'none', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)', fontWeight: 600 }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-4xl font-bold text-foreground leading-none">{dashboardStats?.collectionRate || 0}%</span>
                                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-2">Collection</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                    {pieData.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                            <div>
                                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{item.name}</p>
                                                <p className="text-sm font-bold text-foreground mt-0.5">KES {(item.value / 1000).toFixed(1)}k</p>
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
                            { label: "M-Pesa Webhook", status: "Active", icon: Wifi, color: "text-success-600", bg: "bg-success-50" },
                            { label: "Email Server", status: "Operational", icon: MailIcon, color: "text-success-600", bg: "bg-success-50" },
                            { label: "DB Latency", status: "14ms", icon: Server, color: "text-primary-600", bg: "bg-primary-50" }
                        ].map((h, i) => (
                            <div key={i} className="p-6 bg-white border border-neutral-200 rounded-2xl hover:shadow-lg transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-lg group-hover:scale-110 transition-transform", h.bg)}>
                                        <h.icon size={20} className={h.color} strokeWidth={2} />
                                    </div>
                                    <span className="font-bold text-foreground text-sm">{h.label}</span>
                                </div>
                                <span className={cn("font-semibold text-xs px-3 py-1.5 rounded-lg", h.bg, h.color)}>
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

