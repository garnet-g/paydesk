import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * M-Pesa Simulator API
 * Allows developers to trigger callbacks for testing reconciliation
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { type, payload } = body

        if (type === 'STK_CALLBACK') {
            const { checkoutRequestId, success, amount, receipt } = payload
            const callbackBody = {
                Body: {
                    stkCallback: {
                        MerchantRequestID: "SIM-" + Date.now(),
                        CheckoutRequestID: checkoutRequestId,
                        ResultCode: success ? 0 : 1,
                        ResultDesc: success ? "The service request is processed successfully." : "Request cancelled by user",
                        CallbackMetadata: success ? {
                            Item: [
                                { Name: "Amount", Value: amount || 1.00 },
                                { Name: "MpesaReceiptNumber", Value: receipt || "SIM" + Math.random().toString(36).toUpperCase().slice(2, 10) },
                                { Name: "TransactionDate", Value: Date.now() },
                                { Name: "PhoneNumber", Value: "254700000000" }
                            ]
                        } : null
                    }
                }
            }

            // Call our own callback endpoint
            const res = await fetch(`${process.env.NEXTAUTH_URL}/api/payments/mpesa/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(callbackBody)
            })

            return NextResponse.json(await res.json())
        }

        if (type === 'C2B_CONFIRMATION') {
            const { billRef, amount, transId } = payload
            const c2bBody = {
                TransactionType: "Pay Bill",
                TransID: transId || "SIM" + Math.random().toString(36).toUpperCase().slice(2, 10),
                TransTime: "20240101000000",
                TransAmount: amount.toString(),
                BusinessShortCode: "174379",
                BillRefNumber: billRef,
                InvoiceNumber: "",
                OrgAccountBalance: "100.00",
                ThirdPartyTransID: "",
                MSISDN: "254700000000",
                FirstName: "John",
                MiddleName: "Doe",
                LastName: "Simulator"
            }

            const res = await fetch(`${process.env.NEXTAUTH_URL}/api/payments/mpesa/c2b/confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(c2bBody)
            })

            return NextResponse.json(await res.json())
        }

        return NextResponse.json({ error: 'Invalid simulation type' }, { status: 400 })
    } catch (error: any) {
        console.error("Simulation Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
