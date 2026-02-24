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
    CreditCard
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
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'PARENT', 'FINANCE_MANAGER'] },
        { name: 'Schools', href: '/dashboard/schools', icon: School, roles: ['SUPER_ADMIN'] },
        { name: 'Platform Billing', href: '/dashboard/platform-billing', icon: DollarSign, roles: ['SUPER_ADMIN'] },
        { name: 'Parents', href: '/dashboard/parents', icon: Users, roles: ['PRINCIPAL'] },
        { name: 'Staff Management', href: '/dashboard/staff', icon: Briefcase, roles: ['PRINCIPAL'], requiresPro: true },
        { name: 'Students', href: '/dashboard/students', icon: GraduationCap, roles: ['PRINCIPAL', 'FINANCE_MANAGER'] },
        { name: 'Classes', href: '/dashboard/classes', icon: Layers, roles: ['PRINCIPAL'] },
        { name: 'Fee Setup', href: '/dashboard/fee-setup', icon: BookOpen, roles: ['PRINCIPAL'] },
        { name: 'My Children', href: '/dashboard/children', icon: Users, roles: ['PARENT'] },
        { name: 'Receipt Wallet', href: '/dashboard/receipts', icon: FileText, roles: ['PARENT'] },
        { name: 'Payments', href: '/dashboard/payments', icon: DollarSign, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'PARENT', 'FINANCE_MANAGER'] },
        { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, roles: ['PRINCIPAL', 'PARENT', 'FINANCE_MANAGER'] },
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['PRINCIPAL', 'FINANCE_MANAGER'], requiresPro: true },
        { name: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, roles: ['PRINCIPAL', 'PARENT'] },
        { name: 'Broadcasts', href: '/dashboard/broadcast', icon: Megaphone, roles: ['SUPER_ADMIN', 'PRINCIPAL'], requiresPro: true },
        { name: 'System Logs', href: '/dashboard/logs', icon: FileText, roles: ['SUPER_ADMIN'] },
        { name: 'App Users', href: '/dashboard/users', icon: Users, roles: ['SUPER_ADMIN'] },

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
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--neutral-50)' }}>
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 40 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                style={{
                    width: '280px',
                    background: 'var(--card-bg)',
                    borderRight: '1px solid var(--border)',
                    position: 'fixed',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform var(--transition-base)',
                    zIndex: 50,
                    backdropFilter: 'blur(16px)'
                }}
                className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
            >
                {/* Header Section */}
                <div style={{ padding: 'var(--spacing-lg) var(--spacing-xl)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: session?.user?.logoUrl ? 'white' : 'var(--primary-600)',
                            color: 'white',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.125rem',
                            fontWeight: 800,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                            border: '2px solid white',
                            overflow: 'hidden',
                            flexShrink: 0
                        }}>
                            {session?.user?.logoUrl ? (
                                <img
                                    src={session.user.logoUrl}
                                    alt="School Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                session?.user?.schoolName?.[0] || 'S'
                            )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {session?.user?.schoolName || 'System Admin'}
                            </h2>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                {userRole.split('_').join(' ')}
                            </p>
                        </div>
                    </div>
                    <button
                        className="mobile-only"
                        onClick={() => setSidebarOpen(false)}
                        style={{ display: 'none', border: 'none', background: 'var(--neutral-100)', color: 'var(--neutral-600)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation - Scrollable Area */}
                <nav style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-lg) var(--spacing-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}>
                    {filteredNavigation.map((item, index) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        // Categories for better hierarchy
                        const principalCategories: any = {
                            '/dashboard': { label: 'Main' },
                            '/dashboard/parents': { label: 'People' },
                            '/dashboard/students': { label: 'School' },
                            '/dashboard/payments': { label: 'Financials' },
                            '/dashboard/reports': { label: 'Insights' },
                        }

                        const adminCategories: any = {
                            '/dashboard': { label: 'Overview' },
                            '/dashboard/schools': { label: 'Ecosystem' },
                            '/dashboard/platform-billing': { label: 'Economics' },
                            '/dashboard/broadcast': { label: 'Engagement' },
                            '/dashboard/logs': { label: 'Governance' },
                            '/dashboard/settings': { label: 'Preferences' },
                        }

                        const categories = userRole === 'SUPER_ADMIN' ? adminCategories : principalCategories
                        const showCategory = (userRole === 'PRINCIPAL' || userRole === 'SUPER_ADMIN') && categories[item.href]
                        const isLocked = item.requiresPro && !isPro

                        return (
                            <div key={item.name}>
                                {showCategory && (
                                    <div style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        color: 'var(--neutral-400)',
                                        margin: 'var(--spacing-md) 0 var(--spacing-xs) var(--spacing-md)',
                                    }}>
                                        {categories[item.href].label}
                                    </div>
                                )}
                                {isLocked ? (
                                    <div
                                        onClick={() => alert(`💎 Upgrade to a PRO or ENTERPRISE plan to unlock ${item.name} via the Platform Billing settings or by contacting your System Admin.`)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            padding: '10px var(--spacing-md)',
                                            borderRadius: '12px',
                                            background: 'transparent',
                                            color: 'var(--neutral-400)',
                                            fontWeight: 500,
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer',
                                            border: '1px solid transparent',
                                        }}
                                        className="nav-link"
                                    >
                                        <Icon size={18} strokeWidth={2} style={{ color: 'inherit' }} />
                                        <span>{item.name}</span>
                                        <Lock size={14} style={{ marginLeft: 'auto', color: 'var(--warning-500)' }} />
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            padding: '10px var(--spacing-md)',
                                            borderRadius: '12px',
                                            background: isActive ? 'linear-gradient(90deg, var(--primary-50) 0%, rgba(238, 242, 255, 0.2) 100%)' : 'transparent',
                                            color: isActive ? 'var(--primary-700)' : 'var(--neutral-500)',
                                            fontWeight: isActive ? 700 : 500,
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s ease',
                                            textDecoration: 'none',
                                            border: isActive ? '1px solid var(--primary-100)' : '1px solid transparent',
                                        }}
                                        className="nav-link"
                                    >
                                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ color: isActive ? 'var(--primary-600)' : 'inherit' }} />
                                        <span>{item.name}</span>
                                        {isActive && (
                                            <div style={{
                                                marginLeft: 'auto',
                                                width: '5px',
                                                height: '5px',
                                                borderRadius: '50%',
                                                background: 'var(--primary-600)',
                                                boxShadow: '0 0 8px var(--primary-300)'
                                            }} />
                                        )}
                                    </Link>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div style={{
                    padding: 'var(--spacing-lg) var(--spacing-xl)',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--card-bg)'
                }}>
                    <div style={{ marginBottom: 'var(--spacing-lg)', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: '8px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                background: 'var(--primary-100)',
                                color: 'var(--primary-700)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 800
                            }}>
                                {session?.user?.name?.[0]}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {session?.user?.name}
                                </p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {session?.user?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                            onClick={toggleTheme}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '10px',
                                background: 'var(--neutral-50)',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                color: 'var(--neutral-600)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '10px',
                                background: 'var(--neutral-50)',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                color: 'var(--neutral-600)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div style={{
                flex: 1,
                marginLeft: '280px',
                transition: 'margin-left var(--transition-base)',
                minWidth: 0,
                overflowX: 'hidden'
            }} className="main-wrapper">
                {/* Top bar */}
                <header style={{
                    background: 'var(--card-bg)',
                    borderBottom: '1px solid var(--border)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '64px',
                    width: '100%',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', minWidth: 0 }}>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="mobile-menu-btn"
                            style={{
                                display: 'none',
                                padding: '8px',
                                background: 'var(--neutral-100)',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                color: 'var(--foreground)',
                                flexShrink: 0
                            }}
                        >
                            <Menu size={22} />
                        </button>

                        <div className="mobile-only" style={{ display: 'none', minWidth: 0 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                PayDesk
                            </h2>
                        </div>

                        <div className="hide-mobile" style={{ minWidth: 0 }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {filteredNavigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                            </h1>
                            <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                Welcome, {session?.user?.name?.split(' ')[0]}!
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexShrink: 0 }}>
                        <span className="badge badge-primary hide-mobile" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                            {userRole.replace('_', ' ')}
                        </span>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '12px',
                            background: 'var(--primary-600)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            flexShrink: 0,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            {session?.user?.name?.[0]}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="dashboard-main-content" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                    {children}
                </main>

                {/* Forced Password Change Modal */}
                {session?.user?.requiresPasswordChange === true && (
                    <ChangePasswordModal onSuccess={() => {
                        window.location.reload()
                    }} />
                )}
            </div>

            <style jsx>{`
                .dashboard-main-content {
                    padding: var(--spacing-xl);
                }
                @media (max-width: 768px) {
                    .dashboard-main-content {
                        padding: var(--spacing-md);
                    }
                    .sidebar {
                        transform: translateX(-100%);
                        width: 260px !important;
                    }
                    .sidebar.sidebar-open {
                        transform: translateX(0);
                    }
                    .main-wrapper {
                        margin-left: 0 !important;
                    }
                    .mobile-menu-btn {
                        display: block !important;
                    }
                    .hide-mobile {
                        display: none !important;
                    }
                    .mobile-only {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    )
}
