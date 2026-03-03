import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMpesaAccessToken, getMpesaBaseUrl, generateMpesaTimestamp, generateMpesaPassword } from '@/lib/mpesa'

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

        // ── 1. Fetch invoice ────────────────────────────────────────────────────
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
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

        // ── 2. Format phone number ──────────────────────────────────────────────
        let formattedPhone = phoneNumber.replace(/\+/g, '')
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1)
        } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
            formattedPhone = '254' + formattedPhone
        }

        // ── 3. Load school Daraja credentials ─────────────────────────────────
        //       schoolId comes from the parent's session — already scoped to their school
        const schoolId = session.user.schoolId!
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: {
                mpesaConsumerKey: true,
                mpesaConsumerSecret: true,
                mpesaShortcode: true,
                mpesaPasskey: true,
                mpesaEnv: true,
                mpesaPaybill: true,  // display only (on invoice PDFs)
            }
        })

        // ── 4. DEMO MODE: no credentials configured yet ─────────────────────────
        const hasCreds = school?.mpesaConsumerKey && school?.mpesaConsumerSecret
            && school?.mpesaShortcode && school?.mpesaPasskey

        if (!hasCreds && !process.env.MPESA_CONSUMER_KEY) {
            // Full demo — no real Daraja at all
            const demoCheckoutId = 'DEMO-' + Math.random().toString(36).toUpperCase().slice(2, 10)
            await prisma.payment.create({
                data: {
                    amount: amountToPay,
                    method: 'MPESA',
                    status: 'PENDING',
                    transactionRef: demoCheckoutId,
                    payerName: session.user.name || 'Parent',
                    payerPhone: formattedPhone,
                    schoolId,
                    studentId,
                    invoiceId,
                }
            })
            return NextResponse.json({
                success: true,
                checkoutRequestId: demoCheckoutId,
                message: '[DEMO MODE] Payment initiated. Use the M-Pesa Simulator to complete it.'
            })
        }

        // ── 5. Resolve credentials: school-specific → fallback to global env ───
        const creds = {
            consumerKey: school?.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY,
            consumerSecret: school?.mpesaConsumerSecret || process.env.MPESA_CONSUMER_SECRET,
            shortcode: school?.mpesaShortcode || process.env.MPESA_SHORTCODE,
            passkey: school?.mpesaPasskey || process.env.MPESA_PASSKEY,
            env: school?.mpesaEnv || process.env.MPESA_ENV || 'sandbox',
        }

        if (!creds.shortcode || !creds.passkey) {
            return NextResponse.json({
                error: 'This school has not configured M-Pesa yet. Please contact your school administrator.'
            }, { status: 400 })
        }

        // ── 6. Fire the STK Push using school's credentials ─────────────────────
        const accessToken = await getMpesaAccessToken(creds)
        const timestamp = generateMpesaTimestamp()
        const password = generateMpesaPassword(creds.shortcode, creds.passkey, timestamp)
        const baseUrl = getMpesaBaseUrl(creds.env)
        const callbackUrl = process.env.MPESA_CALLBACK_URL
            || `${process.env.NEXTAUTH_URL}/api/payments/mpesa/callback`

        const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                BusinessShortCode: creds.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.round(amountToPay),
                PartyA: formattedPhone,
                PartyB: creds.shortcode,   // ← school's own paybill, not PayDesk's
                PhoneNumber: formattedPhone,
                CallBackURL: callbackUrl,
                AccountReference: invoice.invoiceNumber,
                TransactionDesc: `Fee Payment - ${invoice.invoiceNumber}`,
            }),
        })

        const data = await response.json()

        if (data.ResponseCode === '0') {
            await prisma.payment.create({
                data: {
                    amount: amountToPay,
                    method: 'MPESA',
                    status: 'PENDING',
                    transactionRef: data.CheckoutRequestID,
                    payerName: session.user.name || 'Parent',
                    payerPhone: formattedPhone,
                    schoolId,
                    studentId,
                    invoiceId,
                }
            })
            return NextResponse.json({
                success: true,
                checkoutRequestId: data.CheckoutRequestID,
                message: 'Please enter your M-Pesa PIN on your phone'
            })
        }

        console.error('Daraja Response Error:', data)
        return NextResponse.json({
            success: false,
            error: data.ResponseDescription || 'M-Pesa request failed'
        }, { status: 400 })

    } catch (error: any) {
        console.error('STK Push error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
