import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMpesaAccessToken, generateMpesaTimestamp, generateMpesaPassword } from '@/lib/mpesa'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { phoneNumber, invoiceId, studentId, amount } = await req.json()

        if (!phoneNumber || !studentId || !invoiceId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get current invoice balance (in case items were dismissed)
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        })

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const amountToPay = amount ? Number(amount) : Number(invoice.balance)
        if (amountToPay <= 0) {
            return NextResponse.json({ error: 'Invoice is already paid or amount is invalid' }, { status: 400 })
        }
        if (amountToPay > Number(invoice.balance)) {
            return NextResponse.json({ error: 'Amount cannot exceed invoice balance' }, { status: 400 })
        }

        // Format phone number to 254XXXXXXXXX
        let formattedPhone = phoneNumber.replace(/\+/g, '')
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1)
        } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
            formattedPhone = '254' + formattedPhone
        }

        if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
            console.warn("M-Pesa credentials missing. Entering DEMO MODE.")
            const demoCheckoutId = "DEMO-" + Math.random().toString(36).toUpperCase().slice(2, 10)

            await prisma.payment.create({
                data: {
                    amount: amountToPay,
                    method: 'MPESA',
                    status: 'PENDING',
                    transactionRef: demoCheckoutId,
                    payerName: session.user.name || 'Parent',
                    payerPhone: formattedPhone,
                    schoolId: session.user.schoolId!,
                    studentId,
                    invoiceId: invoiceId,
                }
            })

            return NextResponse.json({
                success: true,
                checkoutRequestId: demoCheckoutId,
                message: "[DEMO MODE] Payment initiated. Use the M-Pesa Simulator to complete it."
            })
        }

        const mpesaEnv = process.env.MPESA_ENV || 'sandbox';
        const accessToken = await getMpesaAccessToken()
        const timestamp = generateMpesaTimestamp()
        const shortCode = process.env.MPESA_SHORTCODE
        const passKey = process.env.MPESA_PASSKEY

        if (!shortCode || !passKey) {
            return NextResponse.json({
                error: 'M-Pesa Shortcode or Passkey missing in server configuration.'
            }, { status: 500 })
        }

        const password = generateMpesaPassword(shortCode, passKey, timestamp)
        const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/payments/mpesa/callback`

        const baseUrl = mpesaEnv === 'production'
            ? "https://api.safaricom.co.ke"
            : "https://sandbox.safaricom.co.ke";

        const processRequestUrl = `${baseUrl}/mpesa/stkpush/v1/processrequest`

        const response = await fetch(processRequestUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: Math.round(amountToPay),
                PartyA: formattedPhone,
                PartyB: shortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: callbackUrl,
                AccountReference: invoice.invoiceNumber,
                TransactionDesc: `Fee Payment - ${invoice.invoiceNumber}`,
            }),
        })

        const data = await response.json()

        if (data.ResponseCode === "0") {
            // Log the payment attempt
            await prisma.payment.create({
                data: {
                    amount: amountToPay,
                    method: 'MPESA',
                    status: 'PENDING',
                    transactionRef: data.CheckoutRequestID,
                    payerName: session.user.name || 'Parent',
                    payerPhone: formattedPhone,
                    schoolId: session.user.schoolId!,
                    studentId,
                    invoiceId: invoiceId,
                }
            })

            return NextResponse.json({
                success: true,
                checkoutRequestId: data.CheckoutRequestID,
                message: "Please enter your M-Pesa PIN on your phone"
            })
        } else {
            console.error("Daraja Response Error:", data)
            return NextResponse.json({
                success: false,
                error: data.ResponseDescription || "M-Pesa request failed"
            }, { status: 400 })
        }

    } catch (error: any) {
        console.error('STK Push error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
