import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CommunicationEngine } from '@/lib/communication'

export async function POST() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const pastDueSchools = await prisma.school.findMany({
            where: { planStatus: 'PAST_DUE' },
            select: { id: true, name: true }
        })

        if (pastDueSchools.length === 0) {
            return NextResponse.json({ message: 'No past due schools found.' })
        }

        // Send reminders
        for (const school of pastDueSchools) {
            await CommunicationEngine.notifySchoolPastDue(school.id)
        }

        return NextResponse.json({
            message: `Successfully sent reminders to ${pastDueSchools.length} schools.`
        })
    } catch (error) {
        console.error('Failed to send billing reminders:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
