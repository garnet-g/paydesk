/**
 * DEPRECATED: This route is a dead stub replaced by /api/payments/mpesa/stk-push/
 * Kept here purely to return a clear error if something accidentally hits this URL.
 */
import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { error: 'This endpoint is deprecated. Use /api/payments/mpesa/stk-push/ instead.' },
        { status: 410 } // 410 Gone
    )
}
