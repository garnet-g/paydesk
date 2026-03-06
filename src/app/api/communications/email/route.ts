import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mail'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const announcements = await prisma.announcement.findMany({
            where: { schoolId: session.user.schoolId || undefined },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return NextResponse.json(announcements)
    } catch (error) {
        console.error('Fetch broadcast history error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { recipient, subject, message } = body

        if (!subject || !message) {
            return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
        }

        let recipients: any[] = []

        // Multi-tenancy: different parents get only their own emails 
        // because we filter by session.user.schoolId
        if (recipient === 'ALL_PARENTS') {
            recipients = await prisma.user.findMany({
                where: {
                    schoolId: session.user.schoolId,
                    role: 'PARENT',
                    isActive: true
                },
                select: { email: true }
            })
        } else if (recipient === 'ALL_STAFF') {
            recipients = await prisma.user.findMany({
                where: {
                    schoolId: session.user.schoolId,
                    role: { notIn: ['PARENT', 'STUDENT'] },
                    isActive: true
                },
                select: { email: true }
            })
        } else {
            // Handle specific grades if needed
            return NextResponse.json({ error: 'Invalid recipient group selected' }, { status: 400 })
        }

        const emailList = recipients.map(r => r.email).filter(Boolean)

        if (emailList.length === 0) {
            return NextResponse.json({ error: 'No active recipients found with valid email addresses' }, { status: 400 })
        }

        // Send email via Resend
        // For production scale, handle lists larger than 50 using batching
        const { error } = await sendEmail({
            to: emailList,
            subject,
            html: `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; background: white;">
                    <div style="margin-bottom: 32px; display: flex; align-items: center; gap: 12px;">
                         ${session.user.logoUrl ? `<img src="${session.user.logoUrl}" alt="Logo" style="height: 48px; border-radius: 12px;" />` : ''}
                         <h2 style="font-weight: 800; color: #0f172a; margin: 0;">${session.user.schoolName}</h2>
                    </div>
                    <div style="background: #f8fafc; padding: 32px; border-radius: 20px; border: 1px solid #f1f5f9;">
                        <h3 style="font-size: 18px; font-weight: 800; color: #1e293b; margin-top: 0; margin-bottom: 20px;">${subject}</h3>
                        <p style="color: #475569; line-height: 1.7; font-size: 15px; white-space: pre-wrap; margin: 0;">${message}</p>
                    </div>
                    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">&copy; ${new Date().getFullYear()} ${session.user.schoolName}. All rights reserved.</p>
                        <p style="color: #cbd5e1; font-size: 10px; margin: 0;">Sent via PayDesk Platform</p>
                    </div>
                </div>
            `
        })

        if (error) {
            console.error('Email sending error:', error)
            return NextResponse.json({ error: 'Failed to deliver emails' }, { status: 500 })
        }

        // Log the announcement in the database to keep history
        const announcement = await prisma.announcement.create({
            data: {
                title: subject,
                message,
                recipient,
                schoolId: session.user.schoolId!,
                sentById: session.user.id,
                channel: 'EMAIL'
            }
        })

        return NextResponse.json(announcement)
    } catch (err: any) {
        console.error('Broadcast error:', err)
        return new NextResponse(err.message || 'Internal Server Error', { status: 500 })
    }
}
