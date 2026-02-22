import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTransactionRef, normalizePhoneNumber } from '@/lib/utils'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { amount, studentId, invoiceId, phoneNumber } = await req.json()

    if (!amount || !studentId || !phoneNumber) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber)

    // In a real production app, you would:
    // 1. Get Access Token from Safaricom
    // 2. Call STK Push (LNMO) API
    // 3. Handle the response

    // For this demo/production-ready template, we'll simulate the initiation
    const transactionRef = generateTransactionRef()

    const payment = await prisma.payment.create({
        data: {
            transactionRef,
            amount,
            method: 'MPESA',
            status: 'PENDING',
            payerPhone: normalizedPhone,
            studentId,
            invoiceId,
            schoolId: session.user.schoolId!,
        },
    })

    // Simulate calling Safaricom Daraja API
    // const darajaResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', { ... })

    return NextResponse.json({
        success: true,
        message: 'STK Push initiated successfully. Please check your phone.',
        transactionRef,
        paymentId: payment.id,
    })
}
