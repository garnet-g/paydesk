import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const schoolId = session.user.schoolId as string

    try {
        const requests = await prisma.approvalRequest.findMany({
            where: { schoolId },
            include: {
                requestedBy: {
                    select: { firstName: true, lastName: true, role: true }
                },
                approvedBy: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(requests)
    } catch (error) {
        console.error('Approvals Fetch Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { type, payload, reason } = await req.json()
    const { id: userId, schoolId } = session.user

    try {
        const request = await prisma.approvalRequest.create({
            data: {
                type,
                payload: JSON.stringify(payload),
                reason,
                requestedById: userId,
                schoolId: schoolId as string,
                status: 'PENDING'
            }
        })

        return NextResponse.json(request)
    } catch (error) {
        console.error('Approvals Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// Approval Action (PATCH)
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    // Only PRINCIPAL can approve (dual-authorization)
    if (!session || session.user.role !== 'PRINCIPAL') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { requestId, action } = await req.json() // action: 'APPROVED' | 'REJECTED'
    const { id: userId } = session.user

    try {
        const request = await prisma.approvalRequest.findUnique({
            where: { id: requestId }
        })

        if (!request) {
            return new NextResponse('Request not found', { status: 404 })
        }

        if (request.requestedById === userId) {
            return new NextResponse('Dual-authorization required: You cannot approve your own request', { status: 403 })
        }

        const updatedRequest = await prisma.$transaction(async (tx) => {
            const req = await tx.approvalRequest.update({
                where: { id: requestId },
                data: {
                    status: action,
                    approvedById: action === 'APPROVED' ? userId : null
                }
            })

            if (action === 'APPROVED') {
                const payload = JSON.parse(req.payload)

                // EXECUTE THE ACTUAL ACTION BASED ON TYPE
                if (req.type === 'INVOICE_CANCELLATION') {
                    await tx.invoice.update({
                        where: { id: payload.invoiceId },
                        data: { status: 'CANCELLED' }
                    })
                } else if (req.type === 'BALANCE_ADJUSTMENT') {
                    await tx.invoice.update({
                        where: { id: payload.invoiceId },
                        data: {
                            balance: payload.newBalance,
                            totalAmount: payload.newTotal
                        }
                    })
                }
                // (Extend for refunds, etc.)
            }

            return req
        })

        return NextResponse.json(updatedRequest)
    } catch (error) {
        console.error('Approval Process Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
