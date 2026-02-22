import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Activity } from 'lucide-react'

export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    // Check Global Maintenance Mode for non-Super Admins
    if (session?.user?.role && session.user.role !== 'SUPER_ADMIN') {
        try {
            const maintenanceFlag = await prisma.systemSetting.findUnique({
                where: { key: 'MAINTENANCE_MODE' }
            })

            if (maintenanceFlag?.value === 'true') {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--neutral-50)', padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--warning-50)', color: 'var(--warning-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <Activity size={40} />
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: 'var(--spacing-md)' }}>
                            System Under Maintenance
                        </h1>
                        <p style={{ color: 'var(--muted-foreground)', maxWidth: '500px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                            PayDesk is currently undergoing scheduled platform upgrades to improve your experience. Our engineering team is working actively to restore access shortly.
                        </p>
                    </div>
                )
            }
        } catch (error) {
            console.error('Failed to read maintenance mode flag', error)
        }
    }

    return (
        <>
            {children}
        </>
    )
}
