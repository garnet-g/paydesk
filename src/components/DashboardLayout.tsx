'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Home,
    Users,
    GraduationCap,
    DollarSign,
    FileText,
    Settings,
    LogOut,
    School,
    BarChart3,
    MessageSquare,
    Download,
    Menu,
    X,
    Layers,
    LayoutDashboard,
    BookOpen,
    Moon,
    Sun,
    Megaphone,
    Briefcase,
    Lock,
    CreditCard,
    ArrowRight,
    Crown,
    CalendarCheck,
    Award,
    Bus
} from 'lucide-react'
import { useState, useEffect } from 'react'
import ChangePasswordModal from './ChangePasswordModal'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [theme, setTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        setMounted(true)
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.setAttribute('data-theme', savedTheme)
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('theme', newTheme)
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'PARENT', 'FINANCE_MANAGER', 'TEACHER'] },
        { name: 'Schools', href: '/dashboard/schools', icon: School, roles: ['SUPER_ADMIN'] },
        { name: 'Platform Billing', href: '/dashboard/platform-billing', icon: DollarSign, roles: ['SUPER_ADMIN'] },
        { name: 'Parents', href: '/dashboard/parents', icon: Users, roles: ['PRINCIPAL'] },
        { name: 'Staff Management', href: '/dashboard/staff', icon: Briefcase, roles: ['PRINCIPAL'], requiresPro: true },
        { name: 'Students', href: '/dashboard/students', icon: GraduationCap, roles: ['PRINCIPAL', 'FINANCE_MANAGER', 'TEACHER'] },
        { name: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck, roles: ['PRINCIPAL', 'FINANCE_MANAGER', 'TEACHER'] },
        { name: 'Results', href: '/dashboard/results', icon: Award, roles: ['PRINCIPAL', 'TEACHER'] },
        { name: 'Report Cards', href: '/dashboard/report-cards', icon: FileText, roles: ['PRINCIPAL', 'TEACHER'] },
        { name: 'Grade Promotion', href: '/dashboard/grade-promotion', icon: ArrowRight, roles: ['PRINCIPAL', 'FINANCE_MANAGER'] },
        { name: 'Classes', href: '/dashboard/classes', icon: Layers, roles: ['PRINCIPAL', 'TEACHER'] },
        { name: 'Fee Setup', href: '/dashboard/fee-setup', icon: BookOpen, roles: ['PRINCIPAL'] },
        { name: 'My Children', href: '/dashboard/children', icon: Users, roles: ['PARENT'] },
        { name: 'Receipt Wallet', href: '/dashboard/receipts', icon: FileText, roles: ['PARENT'] },
        { name: 'Payments', href: '/dashboard/payments', icon: DollarSign, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'PARENT', 'FINANCE_MANAGER'] },
        { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, roles: ['PRINCIPAL', 'PARENT', 'FINANCE_MANAGER'] },
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['PRINCIPAL', 'FINANCE_MANAGER'], requiresPro: true },
        { name: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, roles: ['PRINCIPAL', 'PARENT', 'TEACHER'] },
        { name: 'Communication', href: '/dashboard/broadcast', icon: MessageSquare, roles: ['SUPER_ADMIN', 'PRINCIPAL'], requiresPro: true },
        { name: 'Transport', href: '/dashboard/transport', icon: Bus, roles: ['PRINCIPAL', 'SUPER_ADMIN'] },
        { name: 'System Logs', href: '/dashboard/logs', icon: FileText, roles: ['SUPER_ADMIN'] },
        { name: 'App Users', href: '/dashboard/users', icon: Users, roles: ['SUPER_ADMIN'] },
        { name: 'Platform Admins', href: '/dashboard/platform-admins', icon: Crown, roles: ['SUPER_ADMIN'] },

        { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'PARENT', 'FINANCE_MANAGER'] },
    ]

    const userRole = session?.user?.role || ''
    const planTier = session?.user?.planTier || 'FREE'
    const isPro = planTier === 'PRO' || planTier === 'ENTERPRISE' || userRole === 'SUPER_ADMIN'
    const filteredNavigation = navigation.filter(item => item.roles.includes(userRole))

    // Don't render full dashboard until mounted and session is checked
    if (!mounted) {
        return <div style={{ minHeight: '100vh', background: 'var(--neutral-50)' }} />
    }

    return (
        <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-300 md:flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                {/* Header Section */}
                <div className="flex items-center justify-between border-b border-border p-6">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-white shadow-sm ring-1 ring-white/20">
                            {session?.user?.logoUrl ? (
                                <img
                                    src={session.user.logoUrl}
                                    alt="School Logo"
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <span className="text-lg font-bold">{session?.user?.schoolName?.[0] || 'S'}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
                                {session?.user?.schoolName || 'School ERP'}
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600/80">
                                {userRole.split('_').join(' ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation - Scrollable Area */}
                <nav className="flex-1 overflow-y-auto space-y-0.5 p-4">
                    {(() => {
                        const principalCategories: any = {
                            '/dashboard': { label: 'Main' },
                            '/dashboard/parents': { label: 'People' },
                            '/dashboard/students': { label: 'School' },
                            '/dashboard/attendance': { label: 'Academic' },
                            '/dashboard/payments': { label: 'Financials' },
                            '/dashboard/reports': { label: 'Insights' },
                        }

                        const adminCategories: any = {
                            '/dashboard': { label: 'Overview' },
                            '/dashboard/schools': { label: 'Ecosystem' },
                            '/dashboard/platform-billing': { label: 'Economics' },
                            '/dashboard/broadcast': { label: 'Engagement' },
                            '/dashboard/logs': { label: 'Governance' },
                            '/dashboard/platform-admins': { label: 'Admins' },
                            '/dashboard/settings': { label: 'Preferences' },
                        }

                        const categories = userRole === 'SUPER_ADMIN' ? adminCategories : principalCategories

                        return filteredNavigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            const isLocked = item.requiresPro && !isPro

                            return (
                                <div key={item.href} className="group relative">
                                    {categories[item.href] && (
                                        <div className="mb-1 ml-3 mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                            {categories[item.href].label}
                                        </div>
                                    )}
                                    <Link
                                        href={isLocked ? '#' : item.href}
                                        onClick={(e) => {
                                            if (isLocked) {
                                                e.preventDefault()
                                                alert(`💎 Upgrade to a PRO or ENTERPRISE plan to unlock ${item.name} via the Platform Billing settings or by contacting your System Admin.`)
                                            } else {
                                                setSidebarOpen(false)
                                            }
                                        }}
                                        className={`relative flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 ${isActive
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : isLocked
                                                ? 'text-muted-foreground/40 cursor-not-allowed opacity-60'
                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                            }`}
                                    >
                                        <Icon
                                            size={18}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={isActive ? 'text-blue-600' : 'inherit'}
                                        />
                                        <span className="text-sm">{item.name}</span>
                                        {isLocked && <Lock size={12} className="ml-auto text-amber-500/50" />}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                                        )}
                                    </Link>
                                </div>
                            )
                        })
                    })()}
                </nav>

                {/* Sidebar Footer */}
                <div className="border-t border-border p-4 bg-muted/5">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-muted-foreground uppercase">
                            {session?.user?.name?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">
                                {session?.user?.name}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                                {session?.user?.email}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-1">
                        <button
                            onClick={toggleTheme}
                            className="flex h-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button
                            onClick={() => signOut()}
                            className="flex h-9 items-center justify-center rounded-md border border-border bg-card text-destructive transition-all hover:bg-destructive hover:text-white"
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 md:ml-64">
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 md:px-6 backdrop-blur-lg">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:bg-accent hover:text-foreground md:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-bold tracking-tight text-foreground md:text-xl">
                                {pathname.split('/').pop()?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Dashboard'}
                            </h1>
                            <p className="hidden text-xs font-medium text-muted-foreground md:block">
                                Welcome back, <span className="text-foreground">{session?.user?.name?.split(' ')[0]}</span>!
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-2 md:flex">
                            <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 ring-1 ring-blue-600/10">
                                {userRole.split('_').join(' ')}
                            </span>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm ring-2 ring-white/10">
                            {session?.user?.name?.[0]}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 md:p-8 lg:p-10">
                    <div className="mx-auto max-w-7xl animate-fade-in space-y-8">
                        {children}
                    </div>
                </main>

                {/* Forced Password Change Modal */}
                {session?.user?.requiresPasswordChange === true && (
                    <ChangePasswordModal onSuccess={() => {
                        window.location.reload()
                    }} />
                )}
            </div>
        </div>
    )
}
