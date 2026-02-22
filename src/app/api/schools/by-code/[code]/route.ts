import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params
        const school = await prisma.school.findUnique({
            where: { code },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                code: true,
                phoneNumber: true,
                email: true,
            }
        })

        if (!school) {
            return new NextResponse('School not found', { status: 404 })
        }

        return NextResponse.json(school)
    } catch (error: any) {
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
