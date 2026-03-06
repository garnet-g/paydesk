import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request, props: { params: Promise<{ runId: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const data = await request.json()
        const { studentId, status } = data // status: 'BOARDED', 'DROPPED_OFF', 'ABSENT'

        // verify run exists
        const run = await prisma.transportRun.findUnique({
            where: { id: params.runId, schoolId: session.user.schoolId }
        })
        if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

        const runPassenger = await prisma.transportRunPassenger.update({
            where: {
                runId_studentId: {
                    runId: params.runId,
                    studentId: studentId
                }
            },
            data: {
                status,
                ...(status === 'BOARDED' ? { boardedAt: new Date() } : {}),
                ...(status === 'DROPPED_OFF' ? { droppedOffAt: new Date() } : {}),
            },
            include: { student: true, run: { include: { route: true } } }
        })

        // If dropped off, send a notification to the guardians
        if (status === 'DROPPED_OFF') {
            const guardians = await prisma.studentGuardian.findMany({
                where: { studentId },
                include: { user: true }
            })

            const notifications = guardians.map((g) => ({
                type: 'TRANSPORT_UPDATE',
                recipient: g.user.email,
                subject: `School Transport Update: ${runPassenger.student.firstName}`,
                message: `${runPassenger.student.firstName} has been safely dropped off by ${runPassenger.run.driverName} on route ${runPassenger.run.route.name} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`,
                studentId,
                schoolId: session.user.schoolId
            }))

            if (notifications.length > 0) {
                await prisma.notification.createMany({ data: notifications })
            }
        }

        return NextResponse.json(runPassenger)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
