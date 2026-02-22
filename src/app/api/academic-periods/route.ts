import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const periods = await prisma.academicPeriod.findMany({
            where: {
                schoolId: session.user.schoolId!
            },
            orderBy: {
                startDate: 'desc'
            }
        })

        return NextResponse.json(periods)
    } catch (error: any) {
        console.error('Failed to fetch academic periods:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { term, academicYear, startDate, endDate, isActive } = body

        if (!term || !academicYear || !startDate || !endDate) {
            return new NextResponse('Missing required fields (term, academicYear, startDate, endDate)', { status: 400 })
        }

        // If setting as active, deactivate others first
        if (isActive) {
            await prisma.academicPeriod.updateMany({
                where: {
                    schoolId: session.user.schoolId!,
                    isActive: true
                },
                data: { isActive: false }
            })
        }

        // Use upsert-like logic to prevent unique constraint error
        const existing = await prisma.academicPeriod.findUnique({
            where: {
                schoolId_academicYear_term: {
                    schoolId: session.user.schoolId!,
                    academicYear,
                    term
                }
            }
        })

        let period;
        if (existing) {
            period = await prisma.academicPeriod.update({
                where: { id: existing.id },
                data: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    isActive: isActive || false
                }
            })
        } else {
            period = await prisma.academicPeriod.create({
                data: {
                    term,
                    academicYear,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    isActive: isActive || false,
                    schoolId: session.user.schoolId!
                }
            })
        }

        return NextResponse.json(period)
    } catch (error: any) {
        console.error('Failed to create academic period:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
