import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * M-Pesa C2B Validation Webhook
 * Used by Safaricom to verify if a payment should be accepted based on the Account Number (BillRefNumber)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log("M-Pesa C2B Validation Request:", JSON.stringify(body, null, 2))

        const { BillRefNumber, MSISDN, TransAmount } = body

        // 1. Try to find the invoice by invoiceNumber
        const invoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: {
                    equals: BillRefNumber.trim(),
                    mode: 'insensitive'
                }
            }
        })

        if (invoice) {
            return NextResponse.json({
                ResultCode: "0",
                ResultDesc: "Accepted"
            })
        }

        // 2. Try to find the student by admissionNumber
        const student = await prisma.student.findFirst({
            where: {
                admissionNumber: {
                    equals: BillRefNumber.trim(),
                    mode: 'insensitive'
                }
            }
        })

        if (student) {
            return NextResponse.json({
                ResultCode: "0",
                ResultDesc: "Accepted"
            })
        }

        // If no match found, we could still accept it but flag as "Unreconciled" 
        // Or we can reject it to prevent parents from paying into a "black hole"
        // For schools, it's safer to reject invalid account numbers
        console.warn(`M-Pesa Validation Failed: No invoice or student found for BillRefNumber: ${BillRefNumber}`)

        return NextResponse.json({
            ResultCode: "C2B00011", // Specific error code for invalid account
            ResultDesc: "Rejected: Invalid Account Number. Please use your Student Admission Number or Invoice Number."
        })

    } catch (error) {
        console.error("M-Pesa C2B Validation Error:", error)
        // If technical error, we usually accept to not block revenue
        return NextResponse.json({
            ResultCode: "0",
            ResultDesc: "Accepted"
        })
    }
}
