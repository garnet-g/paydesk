import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizePhoneNumber } from '@/lib/utils'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PRINCIPAL') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { amount, phoneNumber } = await req.json()

    if (!amount || !phoneNumber) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const schoolId = session.user.schoolId
    if (!schoolId) return new NextResponse('No school linked', { status: 400 })

    const normalizedPhone = normalizePhoneNumber(phoneNumber)
    const checkoutRequestID = `SaaS-${Math.random().toString(36).substring(7)}`

    try {
        const saasPayment = await prisma.subscriptionPayment.create({
            data: {
                amount,
                phoneNumber: normalizedPhone,
                status: 'PENDING',
                checkoutRequestID,
                schoolId
            }
        })

        // In production, trigger real M-Pesa STK Push here

        return NextResponse.json({
            success: true,
            message: 'Subscription payment initiated. Please check your phone.',
            checkoutRequestID,
            paymentId: saasPayment.id
        })
    } catch (error) {
        console.error('SaaS Payment Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
